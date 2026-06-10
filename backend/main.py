from urllib import response

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

import os
import uuid
import psycopg2
import psycopg2.extras
import requests
from datetime import datetime

load_dotenv()

app = FastAPI(
    title="Scanify AI Demo Booking API",
    version="1.0.0"
)

# ------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Environment Variables
# ------------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")
BREVO_API_KEY = os.getenv("BREVO_API_KEY")

if not DATABASE_URL:
    raise Exception("DATABASE_URL not found")

# ------------------------------------------------------------------
# Database
# ------------------------------------------------------------------

def get_db():
    return psycopg2.connect(DATABASE_URL)

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS demo_bookings (
        id SERIAL PRIMARY KEY,

        booking_reference VARCHAR(100),

        full_name VARCHAR(255),
        designation VARCHAR(255),
        company_name VARCHAR(255),

        corporate_email VARCHAR(255),
        mobile_number VARCHAR(50),

        documents_required TEXT,

        erp_system VARCHAR(255),
        current_process VARCHAR(255),
        approval_workflow VARCHAR(255),
        document_volume VARCHAR(255),

        preferred_demo_date VARCHAR(50),
        preferred_time_slot VARCHAR(50),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    cur.close()
    conn.close()

@app.on_event("startup")
def startup_event():
    init_db()

# ------------------------------------------------------------------
# Request Model
# ------------------------------------------------------------------

class DemoBooking(BaseModel):
    full_name: str
    designation: Optional[str] = ""
    company_name: str

    corporate_email: str
    mobile_number: str

    documents_required: List[str] = []

    erp_system: Optional[str] = ""
    current_process: Optional[str] = ""
    approval_workflow: Optional[str] = ""
    document_volume: Optional[str] = ""

    preferred_demo_date: Optional[str] = ""
    preferred_time_slot: Optional[str] = ""

# ------------------------------------------------------------------
# Brevo Configuration
# ------------------------------------------------------------------

SENDER_EMAIL = "preethi.jb@kodivian.com"
SENDER_NAME = "Kodivian Technologies"

INTERNAL_EMAILS = [
    "vijaysabari.m@kodivian.com",
    "preethi.jb@kodivian.com",
    "kaviya.arivaratharaj@kodivian.com"
]

# ------------------------------------------------------------------
# Email Helper
# ------------------------------------------------------------------

def send_email_brevo(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str
):
    if not BREVO_API_KEY:
        return False

    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    payload = {
        "sender": {
            "name": SENDER_NAME,
            "email": SENDER_EMAIL
        },
        "to": [
            {
                "email": to_email,
                "name": to_name
            }
        ],
        "subject": subject,
        "htmlContent": html_content
    }

    response = requests.post(
        url,
        json=payload,
        headers=headers
    )

    print("BREVO STATUS:", response.status_code)
    print("BREVO RESPONSE:", response.text)

    return response.status_code in [200, 201, 202]

# ------------------------------------------------------------------
# Internal Sales Notification
# ------------------------------------------------------------------

def send_internal_notification(
    booking: DemoBooking,
    booking_ref: str
):

    html_content = f"""
    <html>
    <body>

    <h2>New Scanify AI Demo Booking</h2>

    <p><b>Booking Reference:</b> {booking_ref}</p>
    <p><b>Full Name:</b> {booking.full_name}</p>
    <p><b>Designation:</b> {booking.designation}</p>
    <p><b>Company:</b> {booking.company_name}</p>
    <p><b>Email:</b> {booking.corporate_email}</p>
    <p><b>Mobile:</b> {booking.mobile_number}</p>
    <p><b>Documents:</b> {", ".join(booking.documents_required)}</p>
    <p><b>ERP:</b> {booking.erp_system}</p>
    <p><b>Current Process:</b> {booking.current_process}</p>
    <p><b>Approval Workflow:</b> {booking.approval_workflow}</p>
    <p><b>Volume:</b> {booking.document_volume}</p>
    <p><b>Demo Date:</b> {booking.preferred_demo_date}</p>
    <p><b>Time Slot:</b> {booking.preferred_time_slot}</p>

    </body>
    </html>
    """


    for email in INTERNAL_EMAILS:
        send_email_brevo(
            email,
            "Sales Team",
            f"New Scanify AI Booking - {booking_ref}",
            html_content
        )


        # ------------------------------------------------------------------
# Customer Acknowledgement Email
# ------------------------------------------------------------------

def send_customer_acknowledgement(
    booking: DemoBooking,
    booking_ref: str
):

    html_content = f"""
    <html>
    <body>

    <h2>Thank You for Booking a Scanify AI Demo</h2>

    <p>Dear {booking.full_name},</p>

    <p>Your demo request has been successfully received.</p>

    <table border="1" cellpadding="8" cellspacing="0">

        <tr>
            <td><b>Booking Reference</b></td>
            <td>{booking_ref}</td>
        </tr>

        <tr>
            <td><b>Company Name</b></td>
            <td>{booking.company_name}</td>
        </tr>

        <tr>
            <td><b>Email</b></td>
            <td>{booking.corporate_email}</td>
        </tr>

        <tr>
            <td><b>Mobile Number</b></td>
            <td>{booking.mobile_number}</td>
        </tr>

        <tr>
            <td><b>Demo Date</b></td>
            <td>{booking.preferred_demo_date}</td>
        </tr>

        <tr>
            <td><b>Time Slot</b></td>
            <td>{booking.preferred_time_slot}</td>
        </tr>

    </table>

    <br>

    <p>
    Our team will contact you shortly to confirm the demo schedule.
    </p>

    <p>
    Regards,<br>
    Scanify AI Team<br>
    Kodivian Technologies
    </p>

    </body>
    </html>
    """
    

    send_email_brevo(
        booking.corporate_email,
        booking.full_name,
        "Thank You for Booking a Scanify AI Demo",
        html_content
    )

# ------------------------------------------------------------------
# Create Booking API
# ------------------------------------------------------------------
@app.post("/api/book-demo")
def book_demo(booking: DemoBooking):

    booking_ref = f"SCAN-{uuid.uuid4().hex[:8].upper()}"

    try:

        conn = get_db()
        cur = conn.cursor()

        # Check if slot already booked
        if booking.preferred_demo_date and booking.preferred_time_slot:

            cur.execute(
                """
                SELECT COUNT(*)
                FROM demo_bookings
                WHERE preferred_demo_date = %s
                AND preferred_time_slot = %s
                """,
                (
                    booking.preferred_demo_date,
                    booking.preferred_time_slot
                )
            )

            exists = cur.fetchone()[0]

            if exists > 0:
                raise HTTPException(
                    status_code=422,
                    detail="Selected slot is already booked. Please choose another slot."
                )

        # Insert booking
        cur.execute(
            """
            INSERT INTO demo_bookings
            (
                booking_reference,
                full_name,
                designation,
                company_name,
                corporate_email,
                mobile_number,
                documents_required,
                erp_system,
                current_process,
                approval_workflow,
                document_volume,
                preferred_demo_date,
                preferred_time_slot
            )
            VALUES
            (
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            )
            """,
            (
                booking_ref,
                booking.full_name,
                booking.designation,
                booking.company_name,
                booking.corporate_email,
                booking.mobile_number,
                ",".join(booking.documents_required),
                booking.erp_system,
                booking.current_process,
                booking.approval_workflow,
                booking.document_volume,
                booking.preferred_demo_date,
                booking.preferred_time_slot
            )
        )

        conn.commit()

        cur.close()
        conn.close()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    try:
        send_internal_notification(
            booking,
            booking_ref
            
        )

        send_customer_acknowledgement(
            booking,
            booking_ref
        )

    except Exception as e:
        print("Email Error:", e)

    return {
        "success": True,
        "booking_reference": booking_ref
    }
# ------------------------------------------------------------------
# Get All Bookings
# ------------------------------------------------------------------

@app.get("/api/bookings")
def get_bookings():

    try:

        conn = get_db()

        cur = conn.cursor(
            cursor_factory=psycopg2.extras.DictCursor
        )

        cur.execute("""
            SELECT *
            FROM demo_bookings
            ORDER BY created_at DESC
        """)

        rows = cur.fetchall()

        bookings = []

        for row in rows:

            item = dict(row)

            if item.get("created_at"):
                item["created_at"] = item[
                    "created_at"
                ].isoformat()

            bookings.append(item)

        cur.close()
        conn.close()

        return bookings

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ------------------------------------------------------------------
# Get Booking By Reference
# ------------------------------------------------------------------

@app.get("/api/booking/{booking_reference}")
def get_booking(booking_reference: str):

    try:

        conn = get_db()

        cur = conn.cursor(
            cursor_factory=psycopg2.extras.DictCursor
        )

        cur.execute(
            """
            SELECT *
            FROM demo_bookings
            WHERE booking_reference = %s
            """,
            (booking_reference,)
        )

        row = cur.fetchone()

        cur.close()
        conn.close()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Booking not found"
            )

        result = dict(row)

        if result.get("created_at"):
            result["created_at"] = result[
                "created_at"
            ].isoformat()

        return result

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ------------------------------------------------------------------
# Health API
# ------------------------------------------------------------------

@app.get("/")
def root():

    return {
        "status": "running",
        "application": "Scanify AI Demo Booking API",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health():

    try:

        conn = get_db()

        cur = conn.cursor()

        cur.execute("SELECT 1")

        cur.fetchone()

        cur.close()
        conn.close()

        return {
            "status": "ok",
            "database": "connected"
        }

    except Exception as e:

        return {
            "status": "error",
            "database": str(e)
        }

# ------------------------------------------------------------------
# Dashboard Summary
# ------------------------------------------------------------------

@app.get("/api/dashboard")
def dashboard():

    try:

        conn = get_db()

        cur = conn.cursor()

        cur.execute(
            """
            SELECT COUNT(*)
            FROM demo_bookings
            """
        )

        total_bookings = cur.fetchone()[0]

        cur.execute(
            """
            SELECT COUNT(*)
            FROM demo_bookings
            WHERE preferred_demo_date IS NOT NULL
            AND preferred_demo_date <> ''
            """
        )

        demo_requests = cur.fetchone()[0]

        cur.close()
        conn.close()

        return {
            "total_bookings": total_bookings,
            "demo_requests": demo_requests
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ------------------------------------------------------------------
# Run Local
# ------------------------------------------------------------------

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )