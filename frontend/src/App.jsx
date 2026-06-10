import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DOCUMENT_OPTIONS = ["Invoice", "Purchase Order", "GRN", "Receipt", "Vendor Invoice", "Delivery Challan"];
const ERP_OPTIONS      = ["SAP", "Oracle", "Tally", "Microsoft Dynamics", "Zoho", "Other"];
const PROCESS_OPTIONS  = ["Manual Entry", "Excel Upload", "OCR + Validation", "ERP Direct Entry"];
const APPROVAL_OPTIONS = ["No Approval", "Single Level", "Two Level", "Multi Level"];
const VOLUME_OPTIONS   = ["0–500", "500–2000", "2000–5000", "5000+"];
const TIME_SLOTS = [
  "09:00 AM – 10:00 AM","10:00 AM – 11:00 AM","11:00 AM – 12:00 PM",
  "02:00 PM – 03:00 PM","03:00 PM – 04:00 PM","04:00 PM – 05:00 PM",
];

const EMPTY_FORM = {
  full_name: "", designation: "", company_name: "", corporate_email: "",
  mobile_number: "", documents_required: [], erp_system: "",
  current_process: "", approval_workflow: "", document_volume: "",
  preferred_demo_date: "", preferred_time_slot: "",
};

/* ── tiny Field wrapper ── */
function Field({ label, required, optional, children }) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
        {required && <span className="req"> *</span>}
        {optional && <span className="opt"> (optional)</span>}
      </label>
      {children}
    </div>
  );
}

export default function App() {
  const [step,      setStep]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef,setBookingRef]= useState("");
  const formRef = useRef(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    const el = formRef.current?.querySelector("input,select");
    el?.focus();
  }, [step]);

  const set   = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggle = doc  => setForm(p => ({
    ...p,
    documents_required: p.documents_required.includes(doc)
      ? p.documents_required.filter(d => d !== doc)
      : [...p.documents_required, doc],
  }));

  const next = () => {
    if (step === 1 && (!form.full_name.trim() || !form.company_name.trim() || !form.mobile_number.trim())) {
      alert("Please fill in Name, Company Name and Mobile Number.");
      return;
    }
    setStep(s => Math.min(3, s + 1));
  };
  const prev = () => setStep(s => Math.max(1, s - 1));

  const submit = async (overrides = {}) => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/book-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...overrides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Submission failed");
      setBookingRef(data.booking_reference || "");
      setSubmitted(true);
    } catch (e) { alert(e.message || "Submission error"); }
    finally     { setLoading(false); }
  };

  const reset = () => { setForm({ ...EMPTY_FORM }); setSubmitted(false); setBookingRef(""); setStep(1); };

  /* ────────── SUCCESS ────────── */
  if (submitted) return (
    <div className="page">
      <div className="success-center">
        <div className="success-card">
          <div className="success-check">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M5 14l6 6L23 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="success-h">Demo Request Confirmed</h2>
          <p className="success-p">Our team will contact you within 24 hours to confirm your slot.</p>
          <div className="success-meta">
            <div className="smeta-row"><span className="smeta-k">Booking ref</span><span className="smeta-v mono">{bookingRef||"—"}</span></div>
            <hr className="smeta-hr"/>
            <div className="smeta-row"><span className="smeta-k">Date</span><span className="smeta-v">{form.preferred_demo_date||"Not specified"}</span></div>
            <hr className="smeta-hr"/>
            <div className="smeta-row"><span className="smeta-k">Time</span><span className="smeta-v">{form.preferred_time_slot||"Not specified"}</span></div>
          </div>
          <div className="success-actions">
            <button className="btn-ghost" onClick={reset}>Book another demo</button>
            <button className="btn-primary" onClick={() => window.location.reload()}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );

  const pct = ((step - 1) / 2) * 100;

  /* ────────── MAIN ────────── */
  return (
    <div className="page">
      <div className="shell">

        {/* ══════════ SIDEBAR ══════════ */}
        <aside className="sidebar">

          {/* brand */}
          <div className="sb-brand">
            <div className="sb-logo">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2"  y="2"  width="8" height="8" rx="2" fill="white" opacity="1"/>
                <rect x="12" y="2"  width="8" height="8" rx="2" fill="white" opacity="0.65"/>
                <rect x="2"  y="12" width="8" height="8" rx="2" fill="white" opacity="0.65"/>
                <rect x="12" y="12" width="8" height="8" rx="2" fill="white" opacity="0.35"/>
              </svg>
            </div>
            <div>
              <p className="sb-name">Scanify AI</p>
              <p className="sb-tagline">Enterprise Document Automation</p>
            </div>
          </div>

          {/* scanning animation panel */}
          <div className="scan-panel">
            <div className="scan-doc">
              <div className="scan-line" />
              <div className="scan-row"><div className="scan-field wide"/></div>
              <div className="scan-row">
                <div className="scan-field med"/>
                <div className="scan-field med"/>
              </div>
              <div className="scan-row"><div className="scan-field wide"/></div>
              <div className="scan-row">
                <div className="scan-field short"/>
                <div className="scan-field med"/>
              </div>
              <div className="scan-row"><div className="scan-field wide"/></div>
              <div className="scan-row"><div className="scan-field med"/></div>
              <div className="scan-corner tl"/><div className="scan-corner tr"/>
              <div className="scan-corner bl"/><div className="scan-corner br"/>
            </div>
            <div className="scan-badge">
              <span className="scan-dot"/><span>Extracting data…</span>
            </div>
          </div>

          {/* stats */}
          <div className="sb-stats">
            {[["99%","OCR Accuracy"],["90%","Faster Processing"],["3×","ROI Delivered"]].map(([v,l])=>(
              <div className="sb-stat" key={l}><span className="sb-sv">{v}</span><span className="sb-sl">{l}</span></div>
            ))}
          </div>

          {/* integrations */}
          <div className="sb-ints">
            <p className="sb-int-label">Integrates with</p>
            <div className="sb-int-pills">
              {["SAP","Oracle","Tally","Dynamics","Zoho"].map(i=>(
                <span className="sb-pill" key={i}>{i}</span>
              ))}
            </div>
          </div>

          {/* contact card */}
          <div className="sb-contact">
            <div className="sb-avatar">VM</div>
            <div className="sb-contact-info">
              <p className="sb-contact-name">Vijaysabari Mugunthan</p>
              <p className="sb-contact-role">Managing Director, Kodivian Technologies</p>
              <a className="sb-contact-email" href="mailto:vijaysabari.m@kodivian.com">
                vijaysabari.m@kodivian.com
              </a>
            </div>
          </div>

        </aside>

        {/* ══════════ FORM PANEL ══════════ */}
        <main className="form-panel" ref={formRef}>

          {/* top: title + stepper */}
          <div className="fp-header">
            <div className="fp-title-row">
              <h1 className="fp-title">Book a Personalised Demo</h1>
              <p className="fp-sub">3 quick steps — we'll set up a session tailored to your workflow.</p>
            </div>

            {/* stepper */}
            <div className="stepper">
              {["Contact","Requirements","Schedule"].map((lbl, i) => {
                const n = i + 1;
                const done   = step > n;
                const active = step === n;
                return (
                  <React.Fragment key={n}>
                    <div className={`st-item${active?" active":""}${done?" done":""}`}>
                      <div className="st-bubble">
                        {done
                          ? <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : n}
                      </div>
                      <span className="st-lbl">{lbl}</span>
                    </div>
                    {i < 2 && <div className={`st-line${done?" done":""}`}/>}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="step-body">
              <div className="step-intro">
                <h2 className="step-h">Contact Details</h2>
                <p className="step-p">Tell us who you are — we'll personalise the demo around you.</p>
              </div>



              {/* ROW: full name | mobile */}
              <div className="form-row col-2">
                <Field label="Full Name" required>
                  <input className="inp" value={form.full_name}
                    onChange={e=>set("full_name",e.target.value)} placeholder="e.g. Kaviya Arivaratharaj"/>
                </Field>
                <Field label="Mobile Number" required>
                  <input className="inp" value={form.mobile_number}
                    onChange={e=>set("mobile_number",e.target.value)} placeholder="+91 98765 43210"/>
                </Field>
              </div>

              {/* ROW: company | designation */}
              <div className="form-row col-2">
                <Field label="Company Name" required>
                  <input className="inp" value={form.company_name}
                    onChange={e=>set("company_name",e.target.value)} placeholder="e.g. Kodivian Tetchnologies"/>
                </Field>
                <Field label="Designation" optional>
                  <input className="inp" value={form.designation}
                    onChange={e=>set("designation",e.target.value)} placeholder="e.g. Head of Finance"/>
                </Field>
              </div>

              {/* ROW: email full-width */}
              <div className="form-row col-1">
                <Field label="Corporate Email" required>
                  <input className="inp" type="email" value={form.corporate_email}
                    onChange={e=>set("corporate_email",e.target.value)} placeholder="name@Kodivian.com"/>
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="step-body">
              <div className="step-intro">
                <h2 className="step-h">Your Requirements</h2>
                <p className="step-p">Help us understand your document automation needs.</p>
              </div>

              {/* ROW: documents full-width */}
              <div className="form-row col-1">
                <Field label="Documents to Automate">
                  <div className="chip-grid">
                    {DOCUMENT_OPTIONS.map(d=>(
                      <button key={d} type="button"
                        className={`chip${form.documents_required.includes(d)?" chip-on":""}`}
                        onClick={()=>toggle(d)}>{d}</button>
                    ))}
                  </div>
                </Field>
              </div>

              {/* ROW: erp | process */}
              <div className="form-row col-2">
                <Field label="ERP System">
                  <div className="sel-wrap">
                    <select className="sel" value={form.erp_system} onChange={e=>set("erp_system",e.target.value)}>
                      <option value="">Select ERP</option>
                      {ERP_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                    <span className="sel-chevron" aria-hidden>▾</span>
                  </div>
                </Field>
                <Field label="Current Process">
                  <div className="sel-wrap">
                    <select className="sel" value={form.current_process} onChange={e=>set("current_process",e.target.value)}>
                      <option value="">Select process</option>
                      {PROCESS_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                    <span className="sel-chevron" aria-hidden>▾</span>
                  </div>
                </Field>
              </div>

              {/* ROW: approval | volume */}
              <div className="form-row col-2">
                <Field label="Approval Workflow">
                  <div className="sel-wrap">
                    <select className="sel" value={form.approval_workflow} onChange={e=>set("approval_workflow",e.target.value)}>
                      <option value="">Select workflow</option>
                      {APPROVAL_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                    <span className="sel-chevron" aria-hidden>▾</span>
                  </div>
                </Field>
                <Field label="Monthly Document Volume">
                  <div className="sel-wrap">
                    <select className="sel" value={form.document_volume} onChange={e=>set("document_volume",e.target.value)}>
                      <option value="">Select range</option>
                      {VOLUME_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                    <span className="sel-chevron" aria-hidden>▾</span>
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="step-body">
              <div className="step-intro">
                <h2 className="step-h">Schedule Your Demo</h2>
                <p className="step-p">Pick a preferred slot or skip — we'll confirm timing directly.</p>
              </div>

              {/* ROW: date | time */}
              <div className="form-row col-2">
                <Field label="Preferred Date">
                  <input className="inp" type="date" value={form.preferred_demo_date}
                    onChange={e=>set("preferred_demo_date",e.target.value)}
                    min={new Date().toISOString().split("T")[0]}/>
                </Field>
                <Field label="Preferred Time Slot">
                  <div className="sel-wrap">
                    <select className="sel" value={form.preferred_time_slot} onChange={e=>set("preferred_time_slot",e.target.value)}>
                      <option value="">Select time</option>
                      {TIME_SLOTS.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="sel-chevron" aria-hidden>▾</span>
                  </div>
                </Field>
              </div>

              {/* Summary */}
              <div className="summary-card">
                <p className="sum-title">Booking Summary</p>
                <div className="sum-grid">
                  {[
                    ["Full Name",  form.full_name    || "—"],
                    ["Company",   form.company_name  || "—"],
                    ["Mobile",    form.mobile_number || "—"],
                    form.erp_system && ["ERP System", form.erp_system],
                    form.documents_required.length>0 && ["Documents", form.documents_required.join(", ")],
                  ].filter(Boolean).map(([k,v])=>(
                    <React.Fragment key={k}>
                      <span className="sum-key">{k}</span>
                      <span className="sum-val">{v}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Footer Actions ── */}
          <div className="form-footer">
            <div className="footer-l">
              {step > 1 && (
                <button className="btn-ghost" onClick={prev}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M10 3L5 7.5L10 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Back
                </button>
              )}
            </div>
            <div className="footer-r">
              {step < 3
                ? <button className="btn-primary" onClick={next}>
                    Continue
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M5 3l5 4.5L5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                : <div className="submit-row">
                    <button className="btn-ghost" onClick={()=>submit({preferred_demo_date:"",preferred_time_slot:""})} disabled={loading}>
                      {loading?"Processing…":"Skip & Submit"}
                    </button>
                    <button className="btn-primary" onClick={()=>submit()} disabled={loading}>
                      {loading ? <span className="spinner"/> : <>Confirm Booking <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M5 3l5 4.5L5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></>}
                    </button>
                  </div>
              }
            </div>
          </div>

          <p className="copyright">© 2026 Kodivian Technologies · All rights reserved</p>
        </main>

      </div>
    </div>
  );
}