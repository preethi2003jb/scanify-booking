from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Union
from dotenv import load_dotenv
load_dotenv()
import os
import psycopg2
import psycopg2.extras
import requests
import uuid
from datetime import datetime

app = FastAPI(title="Scanify AI Demo Booking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database Connection ───────────────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL not found in .env")

BREVO_API_KEY = os.environ.get("BREVO_API_KEY")

if not BREVO_API_KEY:
    print("Warning: BREVO_API_KEY missing")

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS demo_bookings (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(255),
            designation VARCHAR(255),
            company_name VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            industry VARCHAR(100),
            solution_interest TEXT DEFAULT '',
            current_erp VARCHAR(100),
            use_case TEXT DEFAULT '',
            document_volume VARCHAR(100),
            comments TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Add new columns if they do not exist
    new_columns = [
        ("current_process", "VARCHAR(255)"),
        ("erp_posting_time", "VARCHAR(255)"),
        ("processing_challenges", "TEXT"),
        ("erp_auto_post", "VARCHAR(255)"),
        ("document_types", "TEXT"),
        ("document_formats", "TEXT"),
        ("business_challenges", "TEXT"),
        ("business_impact_details", "TEXT"),
        ("approval_required", "VARCHAR(255)"),
        ("approval_levels", "VARCHAR(255)"),
        ("previous_ocr_evaluation", "VARCHAR(255)"),
        ("demo_date", "VARCHAR(50)"),
        ("demo_time", "VARCHAR(50)"),
        ("booking_reference", "VARCHAR(50)")
    ]
    for col_name, col_type in new_columns:
        cur.execute(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='demo_bookings' AND column_name='{col_name}') THEN
                    ALTER TABLE demo_bookings ADD COLUMN {col_name} {col_type};
                END IF;
            END $$;
        """)
        
    conn.commit()
    cur.close()
    conn.close()

@app.on_event("startup")
def startup():
    init_db()

# ─── Models ───────────────────────────────────────────────────────────────────
class DemoBooking(BaseModel):
    full_name: str
    designation: str
    company_name: str
    email: str
    phone: str
    industry: str
    
    # Section 2
    current_process: str
    document_volume: str
    erp_posting_time: str
    
    # Section 3
    processing_challenges: Union[List[str], str]
    
    # Section 4
    current_erp: str
    erp_auto_post: str
    
    # Section 5
    document_types: Union[List[str], str]
    document_formats: Union[List[str], str]
    
    # Section 6
    business_challenges: Union[List[str], str]
    business_impact_details: Optional[str] = ""
    
    # Section 7
    approval_required: str
    approval_levels: Optional[str] = ""
    
    # Section 8
    previous_ocr_evaluation: str
    comments: Optional[str] = ""
    
    # Scheduling
    demo_date: str
    demo_time: str
    booking_reference: Optional[str] = ""
    
    # Optional fields for backward compatibility
    solution_interest: Optional[str] = ""
    use_case: Optional[str] = ""

# ─── Email ────────────────────────────────────────────────────────────────────
BREVO_API_KEY = os.environ.get("BREVO_API_KEY")
INTERNAL_EMAILS = [
    "vijaysabari.m@kodivian.com",
    "preethi.jb@kodivian.com",
    "kaviya.arivaratharaj@kodivian.com"
]
SENDER_EMAIL = "noreply@kodivian.com"
SENDER_NAME = "Kodivian Technologies"

def send_email_brevo(to_email: str, to_name: str, subject: str, html_body: str):
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "htmlContent": html_body
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.status_code in [200, 201, 202]

def send_internal_notification(booking: DemoBooking, booking_ref: str):
    def format_field(val):
        if isinstance(val, list):
            return ", ".join(val)
        return val or "—"

    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #334155; line-height: 1.5;">
      <div style="background: #0f172a; padding: 24px; border-radius: 8px 8px 0 0; text-align: left; border-bottom: 3px solid #06b6d4;">
        <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">🚀 New Scanify AI Demo Booking</h2>
        <p style="margin: 4px 0 0 0; color: #06b6d4; font-size: 14px; font-weight: bold;">Ref: {booking_ref}</p>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin-top: 0; font-size: 15px; color: #475569;">A new lead has qualified and booked a demo. Details below:</p>
        
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 14px; text-transform: uppercase;">Scheduled Demo Time:</h3>
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e40af;">📅 Date: {booking.demo_date}</p>
          <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; color: #1e40af;">⏰ Time Slot: {booking.demo_time} (Asia/Kolkata)</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #e2e8f0;">
              <th style="padding: 10px 12px; border: 1px solid #cbd5e1; text-align: left; font-weight: 600; width: 35%;">Field</th>
              <th style="padding: 10px 12px; border: 1px solid #cbd5e1; text-align: left; font-weight: 600;">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Full Name</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.full_name}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Designation</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.designation}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Company Name</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.company_name}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Corporate Email</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;"><a href="mailto:{booking.email}" style="color: #2563eb; text-decoration: none;">{booking.email}</a></td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Phone Number</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.phone}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Industry</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.industry}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Current Document Process</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.current_process}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Average Monthly Volume</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.document_volume}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Receipt to ERP Speed</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.erp_posting_time}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Document Processing Issues</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{format_field(booking.processing_challenges)}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Current ERP System</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.current_erp}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Automatically Post to ERP?</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.erp_auto_post}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Documents to Process</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{format_field(booking.document_types)}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Document Formats</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{format_field(booking.document_formats)}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Biggest Challenges</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{format_field(booking.business_challenges)}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Business Impact Details</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.business_impact_details or "—"}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Require Approval?</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.approval_required}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Approval Levels</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.approval_levels or "—"}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Prior OCR/Auto Evaluation</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.previous_ocr_evaluation}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Additional Comments</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{booking.comments or "—"}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Submitted At</td>
              <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{datetime.now().strftime("%d %b %Y, %I:%M %p")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    """
    for email in INTERNAL_EMAILS:
        send_email_brevo(email, "Sales Team", "New Scanify AI Demo Booking", html)

def send_customer_acknowledgment(booking: DemoBooking, booking_ref: str):
    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
      <div style="background: #0f172a; color: white; padding: 32px 24px; border-radius: 8px 8px 0 0; text-align: left; border-bottom: 3px solid #06b6d4;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Scanify AI</h1>
        <p style="margin: 4px 0 0 0; color: #06b6d4; font-size: 14px; font-weight: bold;">Your Booking is Confirmed</p>
      </div>
      <div style="padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin-top: 0; font-size: 16px;">Dear <strong>{booking.full_name}</strong>,</p>
        <p>Thank you for booking a personalized demo of <strong>Scanify AI</strong>. We are excited to show you how our Intelligent Document Processing solution can transform your workflows.</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; text-transform: uppercase;">Booking Confirmation Details:</h3>
          <p style="margin: 0; font-size: 15px; color: #334155;"><strong>Booking Reference:</strong> {booking_ref}</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; color: #334155;"><strong>Date:</strong> {booking.demo_date}</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; color: #334155;"><strong>Time:</strong> {booking.demo_time} (Asia/Kolkata)</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; color: #334155;"><strong>Meeting Location:</strong> Microsoft Teams (Calendar invitation attached to follow)</p>
        </div>

        <p>During the session, we will cover how <strong>Scanify AI OCR automation</strong> processes enterprise documents and integrates natively with major ERP systems like <strong>SAP and Oracle</strong> to eliminate manual entries.</p>
        
        <h3 style="color: #0f172a; font-size: 15px; margin: 24px 0 8px 0; text-transform: uppercase;">What Happens Next?</h3>
        <ol style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; color: #475569;">
          <li style="margin-bottom: 6px;"><strong>Requirement Review</strong>: Our solution experts will review your qualification answers.</li>
          <li style="margin-bottom: 6px;"><strong>Solution Assessment</strong>: We will evaluate your document format requirements and volume.</li>
          <li style="margin-bottom: 6px;"><strong>Personalized Demo</strong>: We will demonstrate real-time AI extraction on your target document types.</li>
          <li style="margin-bottom: 6px;"><strong>ERP Integration Discussion</strong>: Our architects will map out posting workflows into your ERP system.</li>
        </ol>

        <p>If you have any questions or need to reschedule, please reply directly to this email or call our team at +91 88704 35343.</p>
        
        <p style="margin-bottom: 0;">Warm regards,</p>
        <p style="margin-top: 5px; font-weight: 600; color: #0f172a;">The Scanify AI Team<br><span style="font-size: 13px; color: #64748b; font-weight: normal;">Kodivian Technologies</span></p>
      </div>
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #64748b;">
        🌐 <a href="https://www.kodivian.com" style="color: #06b6d4; text-decoration: none;">www.kodivian.com</a> &nbsp;|&nbsp; 📞 +91 88704 35343
      </div>
    </div>
    """
    send_email_brevo(booking.email, booking.full_name, "Your Scanify AI Demo is Confirmed", html)

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.post("/api/book-demo")
def book_demo(booking: DemoBooking):
    try:
        conn = get_db()
        cur = conn.cursor()
        
        def format_field(val):
            if isinstance(val, list):
                return ", ".join(val)
            return val or ""

        # Generate a unique booking reference number
        booking_ref = f"SCAN-{uuid.uuid4().hex[:8].upper()}"

        cur.execute("""
            INSERT INTO demo_bookings 
            (full_name, designation, company_name, email, phone, industry,
             current_process, document_volume, erp_posting_time, processing_challenges,
             current_erp, erp_auto_post, document_types, document_formats,
             business_challenges, business_impact_details, approval_required,
             approval_levels, previous_ocr_evaluation, comments,
             demo_date, demo_time, booking_reference,
             solution_interest, use_case)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            booking.full_name, booking.designation, booking.company_name,
            booking.email, booking.phone, booking.industry,
            booking.current_process, booking.document_volume, booking.erp_posting_time,
            format_field(booking.processing_challenges),
            booking.current_erp, booking.erp_auto_post,
            format_field(booking.document_types),
            format_field(booking.document_formats),
            format_field(booking.business_challenges),
            booking.business_impact_details or "",
            booking.approval_required,
            booking.approval_levels or "",
            booking.previous_ocr_evaluation,
            booking.comments or "",
            booking.demo_date,
            booking.demo_time,
            booking_ref,
            booking.solution_interest or "",
            booking.use_case or ""
        ))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    try:
        send_internal_notification(booking, booking_ref)
        send_customer_acknowledgment(booking, booking_ref)
    except Exception as e:
        print(f"Email error (non-fatal): {e}")

    return {
        "success": True, 
        "message": "Demo booked successfully!",
        "booking_reference": booking_ref
    }

@app.get("/")
def health():
    return {
        "status": "running",
        "application": "Scanify AI Booking"
    }

@app.get("/api/bookings")
def get_bookings():
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT * FROM demo_bookings ORDER BY created_at DESC")
        rows = cur.fetchall()
        
        bookings = []
        for r in rows:
            booking = dict(r)
            if booking.get("created_at"):
                booking["created_at"] = booking["created_at"].isoformat()
            bookings.append(booking)
            
        cur.close()
        conn.close()
        return bookings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/health")
def health():
    return {"status": "ok"}