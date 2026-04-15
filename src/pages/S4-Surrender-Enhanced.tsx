import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL } from "../utils/exports";
import ModuleGatingBlock from "../components/ModuleGatingBlock";
import DynamicFollowUp from "../components/DynamicFollowUp";
import useModuleAccess from "../hooks/useModuleAccess";
import Loader from "../components/Loader";

interface SurrenderData {
  reflections: {
    whatToDo: string;
    whatToRelease: string;
    whatToSurrender: string;
  };
  followUpDepth: 0 | 1 | 2;
  followUpResponses: {
    whatToDoFollowUp: string[];
    whatToReleaseFollowUp: string[];
    whatToSurrenderFollowUp: string[];
  };
  isComplete: boolean;
}

type ReflectionKey = keyof SurrenderData["reflections"];

const reflectionTopics: Array<{
  key: ReflectionKey;
  label: string;
  prompt: string;
  placeholder: string;
}> = [
  {
    key: "whatToDo",
    label: "What Will You Do?",
    prompt:
      "Based on your assessment, what new actions will you take? What shifts are you committing to make?",
    placeholder: "Share your commitments and next steps...",
  },
  {
    key: "whatToRelease",
    label: "What Will You Release?",
    prompt:
      "What habits, beliefs, or patterns are no longer serving you? What will you let go of?",
    placeholder: "What are you ready to release?...",
  },
  {
    key: "whatToSurrender",
    label: "What Will You Surrender?",
    prompt:
      "What control are you surrendering to God? Where are you saying 'Thy will, not mine'?",
    placeholder: "What are you entrusting to God?...",
  },
];

const SurrenderModule: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const userdata = useSelector((state: RootState) => state.auth.userdata);

  const { isLocked } = useModuleAccess("surrender");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SurrenderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"main" | "followups" | "review">(
    "main",
  );
  const [currentReflection, setCurrentReflection] = useState(0);

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
        const response = await fetch(`${apiURL}modules/surrender`, {
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

        const loaded = (await response.json()) as SurrenderData;
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
  const saveData = async (updates: Partial<SurrenderData>) => {
    if (!token || !data) return;

    try {
      const response = await fetch(`${apiURL}modules/surrender`, {
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

      const updated = (await response.json()) as SurrenderData;
      setData(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  // Update reflection
  const handleUpdateReflection = (key: ReflectionKey, value: string) => {
    if (!data) return;

    const newReflections = { ...data.reflections };
    newReflections[key] = value;
    setData({ ...data, reflections: newReflections });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Loader />
      </div>
    );
  }

  if (isLocked) {
    return <ModuleGatingBlock moduleName="Surrender" requiredModules={["perspective"]} />;
  }

  if (!data) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Failed to load module</p>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  const topic = reflectionTopics[currentReflection];

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
            Stage 3 — Surrender
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "#666" }}>
            Reflect on what you'll do, release, and surrender
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

        {currentStep === "main" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "8px" }}>
            <div
              style={{
                marginBottom: "30px",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              {reflectionTopics.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentReflection(idx)}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "2px solid #ddd",
                    background:
                      idx === currentReflection ? "#0916308" : "white",
                    color: idx === currentReflection ? "white" : "#333",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <h2 style={{ marginTop: 0, color: "#0916308" }}>
              {topic.label}
            </h2>
            <p style={{ color: "#666", lineHeight: "1.6" }}>{topic.prompt}</p>

            <textarea
              value={data.reflections[topic.key]}
              onChange={(e) => handleUpdateReflection(topic.key, e.target.value)}
              placeholder={topic.placeholder}
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

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setCurrentReflection(Math.max(0, currentReflection - 1))}
                disabled={currentReflection === 0}
                style={{
                  padding: "10px 20px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: currentReflection === 0 ? "not-allowed" : "pointer",
                  opacity: currentReflection === 0 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <button
                onClick={() => {
                  if (currentReflection < reflectionTopics.length - 1) {
                    setCurrentReflection(currentReflection + 1);
                  } else {
                    saveData({ reflections: data.reflections });
                    setCurrentStep("followups");
                  }
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
                {currentReflection === reflectionTopics.length - 1
                  ? "Continue to Follow-ups"
                  : "Next"}
              </button>
            </div>
          </div>
        )}

        {currentStep === "followups" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0, color: "#0916308" }}>
              Deepen Your Reflection
            </h2>
            <p style={{ color: "#666", lineHeight: "1.6" }}>
              AI-generated follow-up questions help you explore your answers deeper.
              Set your preferred follow-up depth below.
            </p>

            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "500" }}>
                Follow-up Depth:
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {([0, 1, 2] as const).map((depth) => (
                  <button
                    key={depth}
                    onClick={() => setData({ ...data, followUpDepth: depth })}
                    style={{
                      padding: "10px 20px",
                      background:
                        data.followUpDepth === depth ? "#0916308" : "#f5f5f5",
                      color:
                        data.followUpDepth === depth ? "white" : "#333",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    {depth === 0
                      ? "None"
                      : depth === 1
                        ? "Moderate"
                        : "Deep"}
                  </button>
                ))}
              </div>
            </div>

            <DynamicFollowUp
              isVisible={true}
              followUpDepth={data.followUpDepth}
              currentFollowUpIndex={0}
              followUpPrompt=""
              userResponse=""
              onResponseChange={() => {}}
              onSubmit={() => {
                saveData({ followUpResponses: data.followUpResponses });
                setCurrentStep("review");
              }}
              onSkip={() => setCurrentStep("review")}
              isLoading={false}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setCurrentStep("main")}
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
                onClick={() => setCurrentStep("review")}
                style={{
                  padding: "10px 20px",
                  background: "#0916308",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === "review" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0, color: "#0916308" }}>
              Your Surrender Reflections
            </h2>

            <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
              {reflectionTopics.map((topic) => (
                <div key={topic.key}>
                  <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
                    {topic.label}
                  </h3>
                  <div
                    style={{
                      background: "#f9f9f9",
                      padding: "15px",
                      borderRadius: "4px",
                      color: "#666",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {data.reflections[topic.key]}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setCurrentStep("main")}
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
                onClick={() => navigate("/dashboard")}
                style={{
                  padding: "10px 20px",
                  background: "#0916308",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Complete Module
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurrenderModule;
