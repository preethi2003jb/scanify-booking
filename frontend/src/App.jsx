import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DOCUMENT_TYPES = [
  "Invoice",
  "Purchase Order (PO)",
  "GRN",
  "Delivery Note",
  "Receipt",
  "Vendor Bill",
  "Contract",
  "Other"
];

const ERP_OPTIONS = [
  "SAP",
  "Oracle",
  "Microsoft Dynamics",
  "Tally",
  "Infor",
  "Epicor",
  "Zoho",
  "No ERP",
  "Other"
];

const CURRENT_PROCESS_OPTIONS = [
  "Fully Manual",
  "Partially Automated",
  "Fully Automated"
];

const APPROVAL_OPTIONS = [
  "Yes",
  "No"
];

const DOCUMENT_VOLUMES = [
  "Below 500",
  "500-2000",
  "2000-10000",
  "Above 10000"
];

const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM"
];

// Helper to generate next 7 business days
const getNextBusinessDays = (count = 7) => {
  const days = [];
  let current = new Date();
  while (days.length < count) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sunday (0) and Saturday (6)
      days.push(new Date(current));
    }
  }
  return days;
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessDays, setBusinessDays] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    designation: "",
    company_name: "",
    corporate_email: "",
    mobile_number: "",
    documents_required: [],
    erp_system: "",
    current_process: "",
    approval_workflow: "",
    document_volume: "",
    preferred_demo_date: "",
    preferred_time_slot: ""
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    setBusinessDays(getNextBusinessDays(7));
  }, []);

  const validateStep = (step) => {
    const e = {};
    if (step === 1) {
      if (!form.full_name.trim()) e.full_name = "Full Name is required";
      if (!form.company_name.trim()) e.company_name = "Company Name is required";
      if (!form.mobile_number.trim().match(/^\+?[\d\s\-()]{7,20}$/)) {
        e.mobile_number = "Valid mobile number is required";
      }
      if (form.corporate_email.trim() && !form.corporate_email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        e.corporate_email = "Valid corporate email is required";
      }
    }
    if (step === 2) {
      if (!form.documents_required || form.documents_required.length === 0) {
        e.documents_required = "Select at least one document type";
      }
      if (!form.erp_system) e.erp_system = "Select your ERP system";
      if (!form.current_process) e.current_process = "Select your current process";
      if (!form.approval_workflow) e.approval_workflow = "Select approval workflow";
      if (!form.document_volume) e.document_volume = "Select document volume";
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: undefined }));
  };

  const handleToggleChip = (name, val) => {
    setForm(f => {
      const arr = f[name] || [];
      const updated = arr.includes(val)
        ? arr.filter(x => x !== val)
        : [...arr, val];
      return { ...f, [name]: updated };
    });
    setErrors(er => ({ ...er, [name]: undefined }));
  };

  const submitForm = async (payloadOverrides = {}) => {
    setSubmitting(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        designation: form.designation.trim(),
        company_name: form.company_name.trim(),
        corporate_email: form.corporate_email.trim(),
        mobile_number: form.mobile_number.trim(),
        documents_required: form.documents_required,
        erp_system: form.erp_system,
        current_process: form.current_process,
        approval_workflow: form.approval_workflow,
        document_volume: form.document_volume,
        preferred_demo_date: form.preferred_demo_date,
        preferred_time_slot: form.preferred_time_slot,
        ...payloadOverrides
      };

      const res = await fetch(`${API_URL}/api/book-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setBookingRef(data.booking_reference || "-");
      setSubmitted(true);
      setTimeout(() => setAnimStep(1), 200);
      setTimeout(() => setAnimStep(2), 600);
      setTimeout(() => setAnimStep(3), 1000);
    } catch (err) {
      alert("An error occurred during booking. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextOrSubmit = async () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const cardEl = document.querySelector(".form-card");
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(s => s + 1);
      const cardEl = document.querySelector(".form-card");
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      await submitForm();
    }
  };

  const handleSkipSubmit = async () => {
    await submitForm({ preferred_demo_date: "", preferred_time_slot: "" });
  };

  const scrollToForm = () => {
    const target = document.querySelector(".form-card");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstInput = document.querySelector(".input-field");
      if (firstInput) firstInput.focus();
    }
  };

  const steps = [
    { num: 1, label: "Step 1", title: "Contact Information" },
    { num: 2, label: "Step 2", title: "Automation Requirements" },
    { num: 3, label: "Step 3", title: "Demo Booking" }
  ];

  const formatDateLabel = (d) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.navbar}>
          <div style={styles.navLogoContainer}>
            <div style={styles.navLogoText}>Scanify AI</div>
            <div style={styles.navLogoSep}>|</div>
            <div style={styles.navLogoSub}>Kodivian Technologies</div>
          </div>
        </div>

        <div style={styles.container}>
          <div style={{ ...styles.successCard, opacity: animStep >= 1 ? 1 : 0, transform: animStep >= 1 ? "translateY(0)" : "translateY(20px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{ ...styles.checkCircleLarge, transform: animStep >= 2 ? "scale(1)" : "scale(0.8)", opacity: animStep >= 2 ? 1 : 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={styles.successTitle}>Thank You For Booking Your Scanify AI Demo</h2>
            </div>
            
            <div style={styles.successBookingBox}>
              <p style={{ margin: "0 0 10px 0", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#2563eb", fontWeight: "700" }}>
                Demo Confirmation Details
              </p>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0f172a" }}>
                Booking Reference: <span style={{ color: "#2563eb", fontFamily: "monospace", fontSize: "18px" }}>{bookingRef}</span>
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "15px", color: "#475569" }}>
                📅 Preferred Date: <strong>{form.preferred_demo_date || "Not specified"}</strong>
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: "15px", color: "#475569" }}>
                ⏰ Preferred Time: <strong>{form.preferred_time_slot || "Not specified"} (Asia/Kolkata timezone)</strong>
              </p>
            </div>

            <div style={styles.nextStepsSection}>
              <h3 style={styles.sectionHeading}>What Happens Next?</h3>
              <div style={styles.checklist}>
                <div style={styles.checkItem}>
                  <span style={styles.checkIcon}>1.</span>
                  <div style={styles.checkText}>
                    <strong style={{ color: "#0f172a" }}>Requirement Review</strong>: Our solution experts will review your details.
                  </div>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkIcon}>2.</span>
                  <div style={styles.checkText}>
                    <strong style={{ color: "#0f172a" }}>Solution Assessment</strong>: We will evaluate document types and formats.
                  </div>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkIcon}>3.</span>
                  <div style={styles.checkText}>
                    <strong style={{ color: "#0f172a" }}>Personalized Demo</strong>: A custom simulation showing AI data extraction.
                  </div>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkIcon}>4.</span>
                  <div style={styles.checkText}>
                    <strong style={{ color: "#0f172a" }}>ERP Integration Discussion</strong>: Planning automatic posting to {form.erp_system || "your ERP"}.
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.contactDetailsBox}>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
                Kodivian Technologies Support
              </p>
              <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#475569" }}>
                🌐 Website: <a href="https://www.kodivian.com" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>www.kodivian.com</a>
              </p>
              <p style={{ margin: "0", fontSize: "14px", color: "#475569" }}>
                📞 Contact: <span style={{ color: "#0f172a", fontWeight: "600" }}>+91 88704 35343</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Top Header Navigation */}
      <div style={styles.navbar}>
        <div style={styles.navLogoContainer}>
          <div style={styles.navLogoIcon}>⚡</div>
          <div style={styles.navLogoText}>Scanify AI</div>
          <div style={styles.navLogoSep}>|</div>
          <div style={styles.navLogoSub}>Kodivian Technologies</div>
        </div>
        <button onClick={scrollToForm} style={styles.navCta}>Book Demo</button>
      </div>

      <div style={styles.container}>
        {/* Responsive 2-column layout */}
        <div className="main-layout-grid">
          
          {/* Column 1: Marketing / Product Info */}
          <div style={styles.marketingColumn}>
            <div style={styles.badge}>CFO Event Exclusive Preview</div>
            <h1 style={styles.heroTitle}>Book Your Personalized Scanify AI Demo</h1>
            <p style={styles.heroSub}>
              Automate Invoice Processing, Purchase Orders, Delivery Notes, GRNs and ERP Data Entry using Scanify AI.
            </p>

            {/* Benefits Checklist */}
            <div style={styles.benefitsContainer}>
              <div style={styles.benefitItem}>
                <span style={styles.benefitCheck}>✓</span>
                <div>
                  <div style={styles.benefitTitle}>90% Faster Processing</div>
                  <div style={styles.benefitDesc}>Eliminate receipt-to-ERP lag from hours to minutes.</div>
                </div>
              </div>
              <div style={styles.benefitItem}>
                <span style={styles.benefitCheck}>✓</span>
                <div>
                  <div style={styles.benefitTitle}>99% OCR Accuracy</div>
                  <div style={styles.benefitDesc}>AI-driven recognition minimizes entry and tax code errors.</div>
                </div>
              </div>
              <div style={styles.benefitItem}>
                <span style={styles.benefitCheck}>✓</span>
                <div>
                  <div style={styles.benefitTitle}>SAP & Oracle Integration</div>
                  <div style={styles.benefitDesc}>Native automated posting to SAP ECC, S/4HANA, and Oracle ERP.</div>
                </div>
              </div>
              <div style={styles.benefitItem}>
                <span style={styles.benefitCheck}>✓</span>
                <div>
                  <div style={styles.benefitTitle}>Approval Workflow Automation</div>
                  <div style={styles.benefitDesc}>Automate levels of multi-stage business validations.</div>
                </div>
              </div>
              <div style={styles.benefitItem}>
                <span style={styles.benefitCheck}>✓</span>
                <div>
                  <div style={styles.benefitTitle}>ERP Posting Automation</div>
                  <div style={styles.benefitDesc}>Direct ERP ingestion without manual data entry.</div>
                </div>
              </div>
            </div>

            <button onClick={scrollToForm} style={styles.heroCta}>Book Your Personalized Demo</button>
          </div>

          {/* Column 2: 3-Step CFO Demo Wizard */}
          <div>
            <div className="form-card">
              
              {/* Horizontal Stepper (Desktop) */}
              <div className="stepper-container">
                {steps.map((s, idx) => {
                  const isActive = currentStep === s.num;
                  const isCompleted = currentStep > s.num;
                  return (
                    <div key={s.num} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: isActive ? "#2563eb" : isCompleted ? "#10b981" : "#f1f5f9",
                          color: isActive || isCompleted ? "#ffffff" : "#64748b",
                          border: isActive ? "1px solid #2563eb" : "1px solid #e2e8f0"
                        }}>
                          {isCompleted ? "✓" : s.num}
                        </div>
                        <div style={{
                          fontSize: "10px",
                          fontWeight: "600",
                          color: isActive ? "#2563eb" : isCompleted ? "#10b981" : "#94a3b8",
                          marginTop: "2px",
                          whiteSpace: "nowrap"
                        }}>
                          {s.label}
                        </div>
                      </div>
                      {idx < steps.length - 1 && (
                        <div style={{
                          height: "2px",
                          background: isCompleted ? "#10b981" : "#e2e8f0",
                          flex: 1,
                          margin: "0 10px 10px 10px",
                          alignSelf: "center"
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mobile Progress Header */}
              <div className="mobile-progress-bar">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb" }}>STEP {currentStep} OF 3</span>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{steps[currentStep - 1].title}</span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${(currentStep / 3) * 100}%`, height: "100%", background: "#2563eb", transition: "width 0.3s ease" }} />
                </div>
              </div>

              <h2 style={styles.formStepTitle}>{steps[currentStep - 1].title}</h2>

              {/* STEP 1: CONTACT INFORMATION */}
              {currentStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px", animation: "fadeIn 0.3s ease" }}>
                  <div style={styles.grid2}>
                    <Field label="Full Name *" name="full_name" value={form.full_name} onChange={handleChange} error={errors.full_name} placeholder="e.g. John Doe" />
                    <Field label="Company Name *" name="company_name" value={form.company_name} onChange={handleChange} error={errors.company_name} placeholder="e.g. Acme Corp" />
                  </div>
                  <div style={styles.grid2}>
                    <Field label="Mobile Number *" name="mobile_number" value={form.mobile_number} onChange={handleChange} error={errors.mobile_number} placeholder="e.g. +91 98765 43210" />
                    <Field label="Designation (Optional)" name="designation" value={form.designation} onChange={handleChange} error={errors.designation} placeholder="e.g. Head of Finance" />
                  </div>
                  <Field label="Corporate Email (Optional)" name="corporate_email" type="email" value={form.corporate_email} onChange={handleChange} error={errors.corporate_email} placeholder="e.g. john@company.com" />
                </div>
              )}

              {/* STEP 2: AUTOMATION REQUIREMENTS */}
              {currentStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px", animation: "fadeIn 0.3s ease" }}>
                  <div>
                    <label style={styles.label}>Documents Required (Select all that apply) *</label>
                    <div className="chips-container">
                      {DOCUMENT_TYPES.map(opt => (
                        <Chip
                          key={opt}
                          label={opt}
                          selected={form.documents_required.includes(opt)}
                          onClick={() => handleToggleChip("documents_required", opt)}
                        />
                      ))}
                    </div>
                    {errors.documents_required && <p style={styles.errorText}>{errors.documents_required}</p>}
                  </div>

                  <div style={styles.grid2}>
                    <SelectField label="ERP System *" name="erp_system" value={form.erp_system} onChange={handleChange} error={errors.erp_system} options={ERP_OPTIONS} />
                    <SelectField label="Current Process *" name="current_process" value={form.current_process} onChange={handleChange} error={errors.current_process} options={CURRENT_PROCESS_OPTIONS} />
                  </div>

                  <div style={styles.grid2}>
                    <div>
                      <label style={styles.label}>Approval Workflow *</label>
                      <div className="choice-grid-2">
                        {APPROVAL_OPTIONS.map(opt => (
                          <ChoiceCard
                            key={opt}
                            label={opt}
                            selected={form.approval_workflow === opt}
                            onClick={() => {
                              setForm(f => ({ ...f, approval_workflow: opt }));
                              setErrors(er => ({ ...er, approval_workflow: undefined }));
                            }}
                          />
                        ))}
                      </div>
                      {errors.approval_workflow && <p style={styles.errorText}>{errors.approval_workflow}</p>}
                    </div>

                    <div>
                      <label style={styles.label}>Document Volume *</label>
                      <div className="choice-grid-2">
                        {DOCUMENT_VOLUMES.map(opt => (
                          <ChoiceCard
                            key={opt}
                            label={opt}
                            selected={form.document_volume === opt}
                            onClick={() => {
                              setForm(f => ({ ...f, document_volume: opt }));
                              setErrors(er => ({ ...er, document_volume: undefined }));
                            }}
                          />
                        ))}
                      </div>
                      {errors.document_volume && <p style={styles.errorText}>{errors.document_volume}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DEMO BOOKING (Optional) */}
              {currentStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px", animation: "fadeIn 0.3s ease" }}>
                  <p style={{ margin: "0", color: "#475569", fontSize: "13px", lineHeight: 1.6 }}>
                    Optional: choose a preferred demo date and time, or skip and submit now to keep registration under 60 seconds.
                  </p>

                  <div>
                    <label style={styles.label}>Preferred Demo Date</label>
                    <div className="choice-grid-2">
                      {businessDays.map((date, idx) => {
                        const dateString = formatDateLabel(date);
                        return (
                          <ChoiceCard
                            key={idx}
                            label={dateString}
                            selected={form.preferred_demo_date === dateString}
                            onClick={() => {
                              setForm(f => ({ ...f, preferred_demo_date: dateString }));
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={styles.label}>Preferred Time Slot</label>
                    <div className="choice-grid-3">
                      {TIME_SLOTS.map(slot => (
                        <ChoiceCard
                          key={slot}
                          label={slot}
                          selected={form.preferred_time_slot === slot}
                          onClick={() => {
                            setForm(f => ({ ...f, preferred_time_slot: slot }));
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ margin: "10px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                      No date/time selection required to submit.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div style={styles.btnRow}>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(s => s - 1)}
                    style={styles.backBtn}
                    disabled={submitting}
                  >
                    Back
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextOrSubmit}
                    style={styles.submitBtn}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={styles.spinner} /> Confirming...
                      </span>
                    ) : (
                      "Next Step"
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSkipSubmit}
                      style={styles.skipBtn}
                      disabled={submitting}
                    >
                      {submitting ? "Processing..." : "Skip & Submit"}
                    </button>
                    <button
                      type="button"
                      onClick={handleNextOrSubmit}
                      style={styles.submitBtn}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={styles.spinner} /> Confirming...
                        </span>
                      ) : (
                        "Submit Request"
                      )}
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <p style={styles.footer}>
          © 2026 Kodivian Technologies · <a href="https://www.kodivian.com" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>www.kodivian.com</a> · +91 88704 35343
        </p>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { 
          margin: 0; 
          background: #f0f4f8; 
          color: #334155; 
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
          overflow-x: hidden;
        }
        input, select, textarea { font-family: inherit; }
        
        .main-layout-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 48px;
          align-items: start;
          text-align: left;
        }
        
        @media (max-width: 991px) {
          .main-layout-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }
        
        .stepper-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 28px;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 16px;
        }
        
        @media (max-width: 768px) {
          .stepper-container {
            display: none;
          }
          .mobile-progress-bar {
            display: block !important;
          }
        }
        
        .mobile-progress-bar {
          display: none;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }

        .form-card {
          background: #ffffff;
          border: 1px solid #bfdbfe;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0,0,0,0.02);
          text-align: left;
        }
        
        @media (max-width: 480px) {
          .form-card {
            padding: 20px;
          }
        }
        
        .choice-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 8px;
        }
        
        .choice-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          margin-top: 8px;
        }

        .chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .input-field {
          width: 100%;
          padding: 11px 14px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          color: #1e293b;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }
        
        .input-field:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        
        .input-field.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 1px #ef4444;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── ChoiceCard Component ───────────────────────────────────────────────────
function ChoiceCard({ selected, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 14px",
        background: selected ? "#eff6ff" : "#ffffff",
        border: selected ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
        borderRadius: "8px",
        color: selected ? "#1e40af" : "#475569",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.15s ease",
        fontFamily: "inherit",
        fontSize: "13.5px",
        fontWeight: selected ? "600" : "400",
        boxShadow: selected ? "0 4px 12px rgba(37, 99, 235, 0.05)" : "none"
      }}
    >
      <div style={{
        width: "15px",
        height: "15px",
        borderRadius: "50%",
        border: selected ? "4.5px solid #2563eb" : "1.5px solid #cbd5e1",
        boxSizing: "border-box",
        background: "#ffffff",
        flexShrink: 0
      }} />
      <span>{label}</span>
    </button>
  );
}

// ─── Chip Component ─────────────────────────────────────────────────────────
function Chip({ selected, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 12px",
        background: selected ? "#eff6ff" : "#ffffff",
        border: selected ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
        borderRadius: "16px",
        color: selected ? "#1e40af" : "#475569",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        fontFamily: "inherit",
        fontSize: "13px",
        fontWeight: selected ? "600" : "500",
        boxShadow: selected ? "0 4px 8px rgba(37, 99, 235, 0.02)" : "none"
      }}
    >
      {selected ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <span style={{ fontSize: "11px", color: "#94a3b8", display: "inline-block", marginRight: "2px" }}>+</span>
      )}
      <span>{label}</span>
    </button>
  );
}

// ─── Field Sub-component ────────────────────────────────────────────────────
function Field({ label, name, value, onChange, error, placeholder, type = "text", multiline }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          className={`input-field ${error ? "error" : ""}`}
          style={{ resize: "vertical", lineHeight: 1.5 }}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input-field ${error ? "error" : ""}`}
        />
      )}
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}

// ─── SelectField Sub-component ──────────────────────────────────────────────
function SelectField({ label, name, value, onChange, error, options }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`input-field ${error ? "error" : ""}`}
        style={{ cursor: "pointer", color: value ? "#0f172a" : "#64748b" }}
      >
        <option value="" style={{ color: "#64748b" }}>— Select Option —</option>
        {options.map(o => <option key={o} value={o} style={{ color: "#0f172a" }}>{o}</option>)}
      </select>
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0f4f8",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: "#334155",
    padding: "0 16px 60px 16px",
    position: "relative"
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "24px 0",
    borderBottom: "1px solid #cbd5e1",
    marginBottom: "40px"
  },
  navLogoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  navLogoIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "15px"
  },
  navLogoText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "0.03em"
  },
  navLogoSep: {
    color: "#cbd5e1",
    fontSize: "16px"
  },
  navLogoSub: {
    fontSize: "12px",
    color: "#475569",
    fontWeight: "500"
  },
  navCta: {
    padding: "8px 16px",
    borderRadius: "6px",
    background: "#ffffff",
    border: "1px solid #bfdbfe",
    color: "#1e40af",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto"
  },
  marketingColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    justifyContent: "center",
    paddingRight: "20px"
  },
  badge: {
    display: "inline-block",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e40af",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.05em",
    padding: "5px 12px",
    borderRadius: "20px",
    width: "fit-content",
    textTransform: "uppercase"
  },
  heroTitle: {
    fontSize: "clamp(32px, 4vw, 54px)",
    fontWeight: "800",
    lineHeight: "1.15",
    margin: "0",
    color: "#0f172a"
  },
  heroSub: {
    color: "#475569",
    fontSize: "17px",
    lineHeight: "1.6",
    margin: "0",
    maxWidth: "600px"
  },
  benefitsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    margin: "12px 0"
  },
  benefitItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px"
  },
  benefitCheck: {
    color: "#2563eb",
    fontWeight: "800",
    fontSize: "16px",
    lineHeight: "1.4"
  },
  benefitTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a"
  },
  benefitDesc: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px"
  },
  heroCta: {
    padding: "12px 24px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    border: "none",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    width: "fit-content",
    boxShadow: "0 10px 20px rgba(37, 99, 235, 0.15)",
    transition: "transform 0.2s"
  },
  formStepTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 20px 0"
  },
  fieldWrap: {
    width: "100%"
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "8px",
    lineHeight: "1.4"
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px"
  },
  errorText: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "#ef4444",
    fontWeight: "500"
  },
  btnRow: {
    display: "flex",
    gap: "12px",
    marginTop: "32px",
    justifyContent: "flex-start",
    flexWrap: "wrap"
  },
  backBtn: {
    padding: "10px 20px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    color: "#475569",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  skipBtn: {
    padding: "10px 20px",
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  submitBtn: {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.15)",
    transition: "background 0.2s"
  },
  spinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite"
  },
  footer: {
    textAlign: "left",
    fontSize: "12px",
    color: "#64748b",
    marginTop: "48px",
    borderTop: "1px solid #cbd5e1",
    paddingTop: "24px"
  },
  footerLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "500"
  },

  // Success screen styles
  successCard: {
    background: "#ffffff",
    border: "1px solid #bfdbfe",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.04)",
    textAlign: "left",
    maxWidth: "700px",
    margin: "0 auto",
    transition: "all 0.5s ease"
  },
  checkCircleLarge: {
    background: "#10b981",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)",
    flexShrink: 0
  },
  successTitle: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0",
    lineHeight: "1.3"
  },
  successIntro: {
    fontSize: "15px",
    color: "#475569",
    lineHeight: "1.6",
    margin: "0 0 24px 0"
  },
  successBookingBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "28px"
  },
  nextStepsSection: {
    marginBottom: "28px"
  },
  sectionHeading: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 16px 0",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  checklist: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  checkItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px"
  },
  checkIcon: {
    color: "#2563eb",
    fontWeight: "800",
    fontSize: "14px",
    flexShrink: 0
  },
  checkText: {
    fontSize: "14.5px",
    color: "#475569",
    lineHeight: "1.4"
  },
  contactDetailsBox: {
    borderTop: "1px solid #cbd5e1",
    paddingTop: "20px"
  }
};