import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL } from "../utils/exports";
import ModuleGatingBlock from "../components/ModuleGatingBlock";
import useModuleAccess from "../hooks/useModuleAccess";
import Loader from "../components/Loader";

interface PurposeStatement {
  vision: string;
  mission: string;
  values: string;
  goals: string;
  actionItems: string;
}

interface MyPurposeData {
  statements: PurposeStatement;
  reflection: string;
  commitmentLevel: "low" | "medium" | "high";
  accountabilityPartners: string;
  isComplete: boolean;
}

const MyPurposeModule: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const userdata = useSelector((state: RootState) => state.auth.userdata);

  const { isLocked } = useModuleAccess("my-purpose");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MyPurposeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"statements" | "reflection" | "commitment" | "review">(
    "statements",
  );

  const profileInitials = (() => {
    const source = (userdata?.name || userdata?.email || "U").trim();
    if (!source) return "U";
    const parts = source.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  })();

  // Load module data
  useEffect(() => {
    if (!token || isLocked) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const response = await fetch(`${apiURL}modules/my-purpose`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load module");
        }

        const loaded = (await response.json()) as MyPurposeData;
        setData(loaded);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, isLocked]);

  // Save data
  const saveData = async (updates: Partial<MyPurposeData>) => {
    if (!token || !data) return;

    try {
      const response = await fetch(`${apiURL}modules/my-purpose`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const updated = (await response.json()) as MyPurposeData;
      setData(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const updateStatements = (key: keyof PurposeStatement, value: string) => {
    if (!data) return;

    setData({
      ...data,
      statements: { ...data.statements, [key]: value },
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Loader />
      </div>
    );
  }

  if (isLocked) {
    return <ModuleGatingBlock moduleName="My Purpose" requiredModules={["surrender"]} />;
  }

  if (!data) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Failed to load module</p>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  const StatementForm = (
    label: string,
    key: keyof PurposeStatement,
    placeholder: string,
    description: string,
  ) => (
    <div style={{ marginBottom: "25px" }}>
      <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>
        {label}
      </label>
      <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#666" }}>
        {description}
      </p>
      <textarea
        value={data.statements[key]}
        onChange={(e) => updateStatements(key, e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          minHeight: "100px",
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          fontFamily: "inherit",
          fontSize: "0.95rem",
          resize: "vertical",
        }}
      />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {/* Header */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #e0e0e0",
          padding: "15px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#0916308" }}>
            Stage 4 — My Purpose
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "#666" }}>
            Define your life purpose and commitments
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "#0916308",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            {profileInitials}
          </div>
          <button
            onClick={() => {
              dispatch(logout());
              navigate("/");
            }}
            style={{
              padding: "8px 16px",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "30px 20px" }}>
        {error && (
          <div
            style={{
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
              padding: "15px",
              marginBottom: "20px",
              color: "#c33",
            }}
          >
            {error}
          </div>
        )}

        {/* Step Indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "30px" }}>
          {["statements", "reflection", "commitment", "review"].map((step, idx) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step as typeof currentStep)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "2px solid #ddd",
                background: currentStep === step ? "#0916308" : "white",
                color: currentStep === step ? "white" : "#333",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Step 1: Purpose Statements */}
        {currentStep === "statements" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0, color: "#0916308" }}>Define Your Purpose</h2>
            <p style={{ color: "#666", marginBottom: "25px" }}>
              Use your reflections from previous modules to craft clear statements about your life purpose.
            </p>

            {StatementForm(
              "Vision Statement",
              "vision",
              "What do you see for your life in 3-5 years?",
              "Describe the future you're moving toward.",
            )}

            {StatementForm(
              "Mission Statement",
              "mission",
              "What is your core mission or calling?",
              "What do you want to be known for?",
            )}

            {StatementForm(
              "Core Values",
              "values",
              "What 3-5 values guide your decisions?",
              "List values that matter most to you.",
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "30px" }}>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  padding: "10px 20px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveData({ statements: data.statements });
                  setCurrentStep("reflection");
                }}
                style={{
                  padding: "10px 20px",
                  background: "#0916308",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Next: Reflection
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Reflection */}
        {currentStep === "reflection" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0, color: "#0916308" }}>Personal Reflection</h2>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>
                What does living this purpose mean to you?
              </label>
              <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#666" }}>
                Write about how this purpose will shape your daily decisions and relationships.
              </p>
              <textarea
                value={data.reflection}
                onChange={(e) => setData({ ...data, reflection: e.target.value })}
                placeholder="Share your thoughts..."
                style={{
                  width: "100%",
                  minHeight: "150px",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setCurrentStep("statements")}
                style={{
                  padding: "10px 20px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={() => {
                  saveData({ reflection: data.reflection });
                  setCurrentStep("commitment");
                }}
                style={{
                  padding: "10px 20px",
                  background: "#0916308",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Next: Commitment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Commitment */}
        {currentStep === "commitment" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0, color: "#0916308" }}>Your Commitment</h2>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "15px", fontWeight: "bold", color: "#333" }}>
                How committed are you to this purpose?
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {(["low", "medium", "high"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setData({ ...data, commitmentLevel: level })}
                    style={{
                      padding: "12px 24px",
                      background: data.commitmentLevel === level ? "#0916308" : "#f5f5f5",
                      color: data.commitmentLevel === level ? "white" : "#333",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    {level === "low"
                      ? "Beginning (Low)"
                      : level === "medium"
                        ? "Growing (Medium)"
                        : "Committed (High)"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>
                Accountability Partners
              </label>
              <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#666" }}>
                Who will help you stay accountable to this purpose?
              </p>
              <textarea
                value={data.accountabilityPartners}
                onChange={(e) => setData({ ...data, accountabilityPartners: e.target.value })}
                placeholder="Names and phone numbers of accountability partners..."
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setCurrentStep("reflection")}
                style={{
                  padding: "10px 20px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={() => {
                  saveData({
                    commitmentLevel: data.commitmentLevel,
                    accountabilityPartners: data.accountabilityPartners,
                  });
                  setCurrentStep("review");
                }}
                style={{
                  padding: "10px 20px",
                  background: "#0916308",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === "review" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0, color: "#0916308" }}>Your LifePlan Purpose</h2>

            <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
              <div>
                <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Vision</h3>
                <div
                  style={{
                    background: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "4px",
                    color: "#666",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {data.statements.vision || <em>Not filled</em>}
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Mission</h3>
                <div
                  style={{
                    background: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "4px",
                    color: "#666",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {data.statements.mission || <em>Not filled</em>}
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Values</h3>
                <div
                  style={{
                    background: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "4px",
                    color: "#666",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {data.statements.values || <em>Not filled</em>}
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Commitment Level</h3>
                <div
                  style={{
                    background: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "4px",
                    color: "#666",
                  }}
                >
                  {data.commitmentLevel === "high"
                    ? "🔥 Fully Committed"
                    : data.commitmentLevel === "medium"
                      ? "📈 Growing"
                      : "🌱 Beginning"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setCurrentStep("commitment")}
                style={{
                  padding: "10px 20px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  saveData({ isComplete: true });
                  navigate("/journey-complete");
                }}
                style={{
                  padding: "10px 20px",
                  background: "#0916308",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                🎉 Complete LifePlan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPurposeModule;
