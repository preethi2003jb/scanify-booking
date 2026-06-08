import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

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

  const documentOptions = [
    "Invoice",
    "Purchase Order",
    "GRN",
    "Receipt",
    "Vendor Invoice",
    "Delivery Challan"
  ];

  const erpOptions = [
    "SAP",
    "Oracle",
    "Tally",
    "Microsoft Dynamics",
    "Zoho",
    "Other"
  ];

  const processOptions = [
    "Manual Entry",
    "Excel Upload",
    "OCR + Validation",
    "ERP Direct Entry"
  ];

  const workflowOptions = [
    "No Approval",
    "Single Level",
    "Two Level",
    "Multi Level"
  ];

  const volumeOptions = [
    "0-500",
    "500-2000",
    "2000-5000",
    "5000+"
  ];

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleDocument = (doc) => {
    const exists = form.documents_required.includes(doc);

    if (exists) {
      updateField(
        "documents_required",
        form.documents_required.filter(
          (d) => d !== doc
        )
      );
    } else {
      updateField(
        "documents_required",
        [...form.documents_required, doc]
      );
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (
        !form.full_name ||
        !form.company_name ||
        !form.mobile_number
      ) {
        alert(
          "Please fill Name, Company Name and Mobile Number."
        );
        return;
      }
    }

    setStep(step + 1);
  };

  const previousStep = () => {
    setStep(step - 1);
  };

  const submitForm = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/book-demo`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Submission failed"
        );
      }

      setBookingRef(
        data.booking_reference || ""
      );

      setSubmitted(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg,#0f172a,#1e293b)",
          color: "#fff",
          padding: "30px"
        }}
      >
        <div
          style={{
            background: "#fff",
            color: "#111",
            borderRadius: "20px",
            maxWidth: "700px",
            width: "100%",
            padding: "40px",
            textAlign: "center"
          }}
        >
          <h1>
            🎉 Thank You!
          </h1>

          <h2>
            Scanify AI Demo Request Submitted
          </h2>

          <p>
            Your information has been
            received successfully.
          </p>

          <p>
            Booking Reference:
            <strong>
              {" "}
              {bookingRef}
            </strong>
          </p>

          <p>
            Our team will contact you
            shortly.
          </p>

          <p>
            A confirmation email has
            been sent if an email
            address was provided.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#0f172a,#1e293b)",
        padding: "40px 20px"
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "20px",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: "30px"
          }}
        >
          <h1>
            Scanify AI
          </h1>

          <p>
            Intelligent Document
            Processing & ERP Automation
          </p>
        </div>

        <div
          style={{
            padding: "30px"
          }}
        >
          <div
            style={{
              marginBottom: "30px",
              fontWeight: "bold"
            }}
          >
            Step {step} of 3
          </div>
                    {/* STEP 1 */}
          {step === 1 && (
            <>
              <h2
                style={{
                  marginBottom: "20px"
                }}
              >
                Contact Information
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "15px"
                }}
              >
                <input
                  placeholder="Full Name *"
                  value={form.full_name}
                  onChange={(e) =>
                    updateField(
                      "full_name",
                      e.target.value
                    )
                  }
                />

                <input
                  placeholder="Designation"
                  value={form.designation}
                  onChange={(e) =>
                    updateField(
                      "designation",
                      e.target.value
                    )
                  }
                />

                <input
                  placeholder="Company Name *"
                  value={form.company_name}
                  onChange={(e) =>
                    updateField(
                      "company_name",
                      e.target.value
                    )
                  }
                />

                <input
                  placeholder="Corporate Email"
                  value={
                    form.corporate_email
                  }
                  onChange={(e) =>
                    updateField(
                      "corporate_email",
                      e.target.value
                    )
                  }
                />

                <input
                  placeholder="Mobile Number *"
                  value={
                    form.mobile_number
                  }
                  onChange={(e) =>
                    updateField(
                      "mobile_number",
                      e.target.value
                    )
                  }
                />
              </div>

              <div
                style={{
                  marginTop: "30px"
                }}
              >
                <button
                  onClick={nextStep}
                >
                  Next →
                </button>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h2
                style={{
                  marginBottom: "20px"
                }}
              >
                Scanify AI Requirements
              </h2>

              <div
                style={{
                  marginBottom: "20px"
                }}
              >
                <h4>
                  Documents To Extract
                </h4>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}
                >
                  {documentOptions.map(
                    (doc) => (
                      <label
                        key={doc}
                      >
                        <input
                          type="checkbox"
                          checked={form.documents_required.includes(
                            doc
                          )}
                          onChange={() =>
                            toggleDocument(
                              doc
                            )
                          }
                        />
                        {" "}
                        {doc}
                      </label>
                    )
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "15px"
                }}
              >
                <select
                  value={
                    form.erp_system
                  }
                  onChange={(e) =>
                    updateField(
                      "erp_system",
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Select ERP
                  </option>

                  {erpOptions.map(
                    (erp) => (
                      <option
                        key={erp}
                      >
                        {erp}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    form.current_process
                  }
                  onChange={(e) =>
                    updateField(
                      "current_process",
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Current Process
                  </option>

                  {processOptions.map(
                    (
                      process
                    ) => (
                      <option
                        key={
                          process
                        }
                      >
                        {process}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    form.approval_workflow
                  }
                  onChange={(e) =>
                    updateField(
                      "approval_workflow",
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Approval Workflow
                  </option>

                  {workflowOptions.map(
                    (
                      workflow
                    ) => (
                      <option
                        key={
                          workflow
                        }
                      >
                        {workflow}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    form.document_volume
                  }
                  onChange={(e) =>
                    updateField(
                      "document_volume",
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Monthly Volume
                  </option>

                  {volumeOptions.map(
                    (
                      volume
                    ) => (
                      <option
                        key={
                          volume
                        }
                      >
                        {volume}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div
                style={{
                  marginTop: "30px",
                  display: "flex",
                  gap: "10px"
                }}
              >
                <button
                  onClick={
                    previousStep
                  }
                >
                  ← Back
                </button>

                <button
                  onClick={
                    nextStep
                  }
                >
                  Next →
                </button>
              </div>
            </>
          )}
                    {/* STEP 3 */}
          {step === 3 && (
            <>
              <h2
                style={{
                  marginBottom: "20px"
                }}
              >
                Optional Demo Booking
              </h2>

              <p
                style={{
                  marginBottom: "20px",
                  color: "#555"
                }}
              >
                You can submit your requirement
                without selecting a demo slot.
                If you choose a date and time,
                our team will try to schedule
                accordingly.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "15px"
                }}
              >
                <div>
                  <label>
                    Preferred Demo Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.preferred_demo_date
                    }
                    onChange={(e) =>
                      updateField(
                        "preferred_demo_date",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginTop: "5px"
                    }}
                  />
                </div>

                <div>
                  <label>
                    Preferred Time Slot
                  </label>

                  <select
                    value={
                      form.preferred_time_slot
                    }
                    onChange={(e) =>
                      updateField(
                        "preferred_time_slot",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginTop: "5px"
                    }}
                  >
                    <option value="">
                      Select Time
                    </option>

                    <option>
                      09:00 AM - 10:00 AM
                    </option>

                    <option>
                      10:00 AM - 11:00 AM
                    </option>

                    <option>
                      11:00 AM - 12:00 PM
                    </option>

                    <option>
                      02:00 PM - 03:00 PM
                    </option>

                    <option>
                      03:00 PM - 04:00 PM
                    </option>

                    <option>
                      04:00 PM - 05:00 PM
                    </option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: "40px",
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  background: "#f8fafc"
                }}
              >
                <h3>
                  Summary
                </h3>

                <p>
                  <strong>Name:</strong>{" "}
                  {form.full_name}
                </p>

                <p>
                  <strong>Company:</strong>{" "}
                  {form.company_name}
                </p>

                <p>
                  <strong>Mobile:</strong>{" "}
                  {form.mobile_number}
                </p>

                <p>
                  <strong>ERP:</strong>{" "}
                  {form.erp_system ||
                    "Not Selected"}
                </p>

                <p>
                  <strong>Documents:</strong>{" "}
                  {form.documents_required
                    .length > 0
                    ? form.documents_required.join(
                        ", "
                      )
                    : "None Selected"}
                </p>
              </div>

              <div
                style={{
                  marginTop: "30px",
                  display: "flex",
                  gap: "10px"
                }}
              >
                <button
                  onClick={
                    previousStep
                  }
                >
                  ← Back
                </button>

                <button
                  disabled={loading}
                  onClick={
                    submitForm
                  }
                  style={{
                    background:
                      "#0f172a",
                    color: "#fff",
                    padding:
                      "12px 25px",
                    border: "none",
                    borderRadius:
                      "8px",
                    cursor: "pointer"
                  }}
                >
                  {loading
                    ? "Submitting..."
                    : "Submit Request"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}