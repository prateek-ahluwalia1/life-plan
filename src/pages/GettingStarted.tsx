import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL } from "../utils/exports";
import SynthesisConfirmationModal from "../components/SynthesisConfirmationModal";
import styles from "../css/GettingStarted.module.css";
import { requestModuleRestart, confirmModuleRestart } from "../utils/moduleHelpers";
import { useGettingStartedQuestions } from "../hooks/useAIQuestions";
import { synthesizeResponse, isValidResponse } from "../utils/synthesisUtils";

interface GettingStartedData {
  progress: {
    overallGoalComplete: boolean;
    personalDomainComplete: boolean;
    familyDomainComplete: boolean;
    churchDomainComplete: boolean;
    vocationDomainComplete: boolean;
    communityDomainComplete: boolean;
  };
  overallGoal: string;
  goalPersonal: string;
  goalFamilyFriends: string;
  goalChurchKingdom: string;
  goalVocation: string;
  goalCommunity: string;
}

interface DomainGoal {
  key: keyof Omit<GettingStartedData, "progress">;
  label: string;
  field: string;
  examples: string[];
}

const fallbackDomainGoals: DomainGoal[] = [
  {
    key: "goalPersonal",
    label: "Personal Domain",
    field: "personalDomainComplete",
    examples: [
      "Developing receptivity to change and growth",
      "Increasing self-awareness about emotions",
      "Discerning actions needed for the upcoming season",
      "Creating a structured plan aligned with desires and purpose",
    ],
  },
  {
    key: "goalFamilyFriends",
    label: "Family & Friends Domain",
    field: "familyDomainComplete",
    examples: [
      "Achieving unity with spouse on important issues",
      "Identifying time and energy changes needed for relationships",
      "Developing more friendships",
      "Deepening existing relationships",
    ],
  },
  {
    key: "goalChurchKingdom",
    label: "Church & Kingdom Domain",
    field: "churchDomainComplete",
    examples: [
      "Finding a church home or deepening church involvement",
      "Discovering how to use gifts in ministry",
      "Growing in spiritual authority and discernment",
      "Connecting with others in faith community",
    ],
  },
  {
    key: "goalVocation",
    label: "Vocation Domain",
    field: "vocationDomainComplete",
    examples: [
      "Aligning work with strengths and passions",
      "Gaining clarity about career direction",
      "Exploring new opportunities or roles",
      "Finding greater fulfillment in current work",
    ],
  },
  {
    key: "goalCommunity",
    label: "Community Domain",
    field: "communityDomainComplete",
    examples: [
      "Finding ways to give back locally",
      "Building relationships in neighborhood",
      "Discovering volunteer opportunities",
      "Contributing to causes that matter",
    ],
  },
];

const GettingStarted: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const userdata = useSelector((state: RootState) => state.auth.userdata);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<GettingStartedData | null>(null);
  const [currentStep, setCurrentStep] = useState<"overall" | "domains" | "review">(
    "overall",
  );
  const [error, setError] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [restartConfirmId, setRestartConfirmId] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // SYNTHESIS CONFIRMATION STATE
  const [showSynthesisModal, setShowSynthesisModal] = useState(false);
  const [synthesisData, setSynthesisData] = useState<{
    title: string;
    synthesized: string;
    field: keyof GettingStartedData;
    mainResponse: string;
  } | null>(null);

  // Get AI questions (with fallback to hardcoded)
  console.log("[GettingStarted] Token available:", token ? "yes" : "no");
  const { questions: aiQuestionsRaw, loading: aiLoading, error: aiError } = useGettingStartedQuestions(token);
  console.log("[GettingStarted] AI questions state - loading:", aiLoading, "questions:", aiQuestionsRaw);

  // Transform AI questions to domainGoals format
  const transformAIQuestions = (aiQuestions: any): DomainGoal[] | null => {
    console.log("[GettingStarted] Attempting transform with:", {
      type: typeof aiQuestions,
      isArray: Array.isArray(aiQuestions),
      isObject: typeof aiQuestions === 'object',
      length: aiQuestions?.length,
      sample: Array.isArray(aiQuestions) ? aiQuestions[0] : null,
    });

    // Handle ARRAY format from API (array of questions with domain field)
    if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
      console.log("[GettingStarted] Processing array format questions");

      // Group questions by domain
      const questionsByDomain: Record<string, any[]> = {};
      aiQuestions.forEach((q: any) => {
        const domainKey = q.domain?.toLowerCase() || "unknown";
        if (!questionsByDomain[domainKey]) {
          questionsByDomain[domainKey] = [];
        }
        questionsByDomain[domainKey].push(q);
      });

      console.log("[GettingStarted] Grouped by domain:", Object.keys(questionsByDomain));

      // Map domain names to data field keys
      const keyMap: Record<string, string> = {
        personal: "goalPersonal",
        family: "goalFamilyFriends",
        church: "goalChurchKingdom",
        vocation: "goalVocation",
        community: "goalCommunity",
        overall: "overallGoal",
      };

      const labelMap: Record<string, string> = {
        personal: "Personal Domain",
        family: "Family & Friends Domain",
        church: "Church & Kingdom Domain",
        vocation: "Vocation Domain",
        community: "Community Domain",
        overall: "Overall Goal",
      };

      const fieldMap: Record<string, string> = {
        personal: "personalDomainComplete",
        family: "familyDomainComplete",
        church: "churchDomainComplete",
        vocation: "vocationDomainComplete",
        community: "communityDomainComplete",
        overall: "overallGoalComplete",
      };

      const result = Object.entries(questionsByDomain).map(([domainKey, questions]: [string, any[]]) => {
        const examples = questions.slice(0, 4).map((q: any) => q.question || q.prompt || "");

        return {
          key: keyMap[domainKey] as any,
          label: labelMap[domainKey] || domainKey,
          field: fieldMap[domainKey] as any,
          examples: examples.filter(Boolean),
        };
      });

      console.log("[GettingStarted] Successfully transformed array to domains:", result.map(d => ({
        key: d.key,
        label: d.label,
        examplesCount: d.examples.length,
        firstExample: d.examples[0],
      })));

      return result;
    }

    // Handle OBJECT format from API (organized by domain)
    if (aiQuestions && typeof aiQuestions === 'object' && !Array.isArray(aiQuestions)) {
      console.log("[GettingStarted] Processing object format questions");

      const domains = Object.entries(aiQuestions) as [string, any][];

      const keyMap: Record<string, string> = {
        personal: "goalPersonal",
        family: "goalFamilyFriends",
        church: "goalChurchKingdom",
        vocation: "goalVocation",
        community: "goalCommunity",
        overall: "overallGoal",
      };

      const labelMap: Record<string, string> = {
        personal: "Personal Domain",
        family: "Family & Friends Domain",
        church: "Church & Kingdom Domain",
        vocation: "Vocation Domain",
        community: "Community Domain",
        overall: "Overall Goal",
      };

      const fieldMap: Record<string, string> = {
        personal: "personalDomainComplete",
        family: "familyDomainComplete",
        church: "churchDomainComplete",
        vocation: "vocationDomainComplete",
        community: "communityDomainComplete",
        overall: "overallGoalComplete",
      };

      const result = domains.map(([domainKey, domainQuestions]: [string, any]) => {
        const examples = (domainQuestions[0]?.examples || []).slice(0, 4);

        return {
          key: keyMap[domainKey] as any,
          label: labelMap[domainKey] || domainKey,
          field: fieldMap[domainKey] as any,
          examples: examples,
        };
      });

      console.log("[GettingStarted] Successfully transformed object to domains:", result.map(d => ({
        key: d.key,
        label: d.label,
        examplesCount: d.examples.length,
        firstExample: d.examples[0],
      })));

      return result;
    }

    console.log("[GettingStarted] Transform failed - unexpected format:", {
      isObject: typeof aiQuestions === 'object',
      isArray: Array.isArray(aiQuestions),
      isEmpty: !aiQuestions || (Array.isArray(aiQuestions) && aiQuestions.length === 0),
    });
    return null; // Return null if format doesn't match, so we know it's fallback
  };

  const transformedAIQuestions = aiQuestionsRaw ? transformAIQuestions(aiQuestionsRaw) : null;
  const domainGoals = transformedAIQuestions || fallbackDomainGoals;

  // For the domains step, exclude "overallGoal" since it's handled in the overall step
  const domainGoalsForStep = domainGoals.filter(d => d.key !== "overallGoal");

  // Track if we're actually using AI questions (not just if they exist)
  const isUsingAIQuestions = transformedAIQuestions !== null && !aiLoading;

  console.log("[GettingStarted] Domain goals status:", {
    isUsingAI: isUsingAIQuestions,
    transformedCount: transformedAIQuestions?.length,
    fallbackCount: fallbackDomainGoals.length,
    domainsUsing: isUsingAIQuestions ? "AI" : "FALLBACK",
    domainGoalsForStepCount: domainGoalsForStep.length,
  });

  // Load module data on mount
  useEffect(() => {
    if (!token) {
      dispatch(logout());
      return;
    }

    const loadModuleData = async () => {
      try {
        console.log("Fetching from:", `${apiURL}modules/getting-started-modules`);
        const response = await fetch(`${apiURL}modules/getting-started-modules`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`Failed to load module data: ${response.status}`);
        }

        const loaded = (await response.json()) as GettingStartedData;
        console.log("Loaded data:", loaded);
        setData(loaded);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("Load error:", errorMsg);
        setError(errorMsg);
      }
    };

    loadModuleData();
  }, [token, dispatch]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debug: Log cache and API status on mount
  useEffect(() => {
    console.log("%c=== GettingStarted Module Loaded ===", "color: blue; font-weight: bold; font-size: 14px");
    console.log("[GettingStarted] Token available:", token ? "✓ Yes" : "✗ No");
    console.log("[GettingStarted] AI Loading state:", aiLoading ? "⏳ Loading..." : "✓ Ready");
    console.log("[GettingStarted] AI Error:", aiError ? "⚠️ " + aiError : "✓ None");

    // Import to check cache status
    import("../hooks/useAIQuestions").then(({ getAICacheStatus }) => {
      const cacheStatus = getAICacheStatus();
      console.log("[GettingStarted] Cache Status:", cacheStatus);
      console.log("%cTip: Add ?no-cache to URL to bypass cache and force fresh API call", "color: green");
    });
  }, []);

  // Handle module restart
  const handleRestart = async () => {
    if (!token) return;
    try {
      const result = await requestModuleRestart(token, "modules/getting-started-modules");
      if (result.confirmationId) {
        setRestartConfirmId(result.confirmationId);
        setShowRestartConfirm(true);
      } else {
        setError("Failed to initiate restart");
      }
    } catch (_err) {
      setError("Failed to start restart process");
    }
  };

  const handleConfirmRestart = async () => {
    if (!token || !restartConfirmId) return;
    try {
      const result = await confirmModuleRestart(token, "modules/getting-started-modules", restartConfirmId);
      if (result?.status === "reset_complete") {
        // Reset local state
        setData({
          progress: {
            overallGoalComplete: false,
            personalDomainComplete: false,
            familyDomainComplete: false,
            churchDomainComplete: false,
            vocationDomainComplete: false,
            communityDomainComplete: false,
          },
          overallGoal: "",
          goalPersonal: "",
          goalFamilyFriends: "",
          goalChurchKingdom: "",
          goalVocation: "",
          goalCommunity: "",
        });
        // Reset to first step
        setCurrentStep("overall");
        setError(null);
        setShowRestartConfirm(false);
        setRestartConfirmId(null);
      } else {
        setError("Failed to restart module: " + (result?.message || "Unknown error"));
      }
    } catch (_err) {
      setError("Failed to restart module");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const profileInitials = userdata?.email?.[0]?.toUpperCase() ?? "U";

  // Save data to server - always send complete data structure
  const saveData = async (updates: Partial<GettingStartedData>): Promise<boolean> => {
    if (!token || !data) {
      console.error("[GettingStarted] Cannot save: missing token or data");
      return false;
    }

    setSaving(true);
    try {
      // Merge updates with current data to ensure we send complete structure
      const completeData: GettingStartedData = {
        progress: updates.progress ? { ...data.progress, ...updates.progress } : data.progress,
        overallGoal: updates.overallGoal !== undefined ? updates.overallGoal : data.overallGoal,
        goalPersonal: updates.goalPersonal !== undefined ? updates.goalPersonal : data.goalPersonal,
        goalFamilyFriends: updates.goalFamilyFriends !== undefined ? updates.goalFamilyFriends : data.goalFamilyFriends,
        goalChurchKingdom: updates.goalChurchKingdom !== undefined ? updates.goalChurchKingdom : data.goalChurchKingdom,
        goalVocation: updates.goalVocation !== undefined ? updates.goalVocation : data.goalVocation,
        goalCommunity: updates.goalCommunity !== undefined ? updates.goalCommunity : data.goalCommunity,
      };

      console.log("[GettingStarted] Saving complete data:", completeData);

      const response = await fetch(`${apiURL}modules/getting-started-modules`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(completeData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GettingStarted] Save failed:", response.status, errorText);
        throw new Error(`Failed to save data: ${response.status}`);
      }

      const updated = (await response.json()) as GettingStartedData;
      console.log("[GettingStarted] Save successful, updated data:", updated);
      setData(updated);
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save";
      console.error("[GettingStarted] Save error:", errorMsg);
      setError(errorMsg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // SYNTHESIS CONFIRMATION HANDLERS
  const handleShowSynthesis = (
    fieldKey: keyof GettingStartedData,
    mainResponse: string
  ) => {
    if (!isValidResponse(mainResponse)) {
      // Just advance without synthesis for empty responses
      return;
    }

    const synthesized = synthesizeResponse(mainResponse, []);
    const fieldLabel = {
      overallGoal: "Overall LifePlan Goal",
      goalPersonal: "Personal Domain Goal",
      goalFamilyFriends: "Family & Friends Domain Goal",
      goalChurchKingdom: "Church & Kingdom Domain Goal",
      goalVocation: "Vocation Domain Goal",
      goalCommunity: "Community Domain Goal",
      progress: "Progress",
    }[fieldKey] || "Response";

    setSynthesisData({
      title: `Confirming ${fieldLabel}`,
      synthesized,
      field: fieldKey,
      mainResponse,
    });
    setShowSynthesisModal(true);
  };

  const handleSynthesisConfirm = () => {
    if (!synthesisData) return;

    // Save the synthesized response
    saveData({ [synthesisData.field]: synthesisData.synthesized });
    setShowSynthesisModal(false);
    setSynthesisData(null);

    // Move to next step
    if (synthesisData.field === "overallGoal") {
      setCurrentStep("domains");
    }
  };

  const handleSynthesisEdit = () => {
    // Return to editing
    setShowSynthesisModal(false);
  };

  if (!data) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Failed to load module</p>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.bg}></div>

      {/* Navigation Bar */}
      <nav className={styles.nav}>
        <div className={styles["nav-brand"]}>
          <Link
            to="/"
            aria-label="Back to homepage"
            title="Go to homepage"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              textDecoration: "none",
              marginRight: "10px",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className={styles["nav-wordmark"]}>
            YourLifePlanJourney<em>.com</em>
          </div>
        </div>
        <div className={styles["nav-center"]}>
          <div className={styles["nav-center-dot"]}></div>
          Faith-Based Life Journey
        </div>
        <div
          className={styles["nav-right"]}
          ref={profileMenuRef}
          style={{ position: "relative" }}
        >
          <button
            type="button"
            className={styles["nav-avatar"]}
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            aria-label="Open profile menu"
            style={{ border: "none" }}
          >
            {profileInitials}
          </button>
          {isProfileMenuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                minWidth: "120px",
                background: "#1f2937",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "10px",
                padding: "6px",
                zIndex: 20,
              }}
            >
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  color: "white",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <Link
          to="/dashboard"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <button className={`${styles["sb-btn"]} ${styles.active}`}>
            <svg className={styles.icon} viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className={styles["sb-tip"]}>Dashboard</span>
          </button>
        </Link>

        <div className={styles["sb-spacer"]}></div>

        <button
          onClick={handleRestart}
          className={styles["sb-btn"]}
          style={{ color: "#ff9800" }}
        >
          <svg className={styles.icon} viewBox="0 0 24 24">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          <span className={styles["sb-tip"]}>Restart Module</span>
        </button>

        <button
          onClick={handleLogout}
          className={styles["sb-btn"]}
          style={{ color: "grey" }}
        >
          <svg className={styles.icon} viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className={styles["sb-tip"]}>Sign Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className={styles.layout}>
        <div className={styles.content}>
          {error && (
            <div className={styles["error-message"]}>
              {error}
            </div>
          )}

          {/* AI Loading Indicator - Show at top level */}
          {aiLoading && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
              padding: "12px 16px",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "8px",
              color: "#6366f1"
            }}>
              <span style={{ fontSize: "14px", fontWeight: "500" }}>
                Generating personalized AI questions...
              </span>
            </div>
          )}

          {aiError && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
              padding: "12px 16px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#ef4444"
            }}>
              <span style={{ fontSize: "14px" }}>⚠️ {aiError}</span>
            </div>
          )}

          {!aiLoading && !aiError && aiQuestionsRaw && Object.keys(aiQuestionsRaw).length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
              padding: "12px 16px",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "8px",
              color: "#22c55e"
            }}>
              <span style={{ fontSize: "14px" }}>✓ Personalized with AI insights</span>
            </div>
          )}

          {/* Step 1: Overall Goal */}
          {currentStep === "overall" && (
            <div className={styles.card}>
              <h2>What brings you here?</h2>
              <p className={styles["card-subtitle"]}>
                At this season of your life, what do you hope developing a LifePlan will
                support or make possible?
              </p>

              <div className={styles["textarea-wrapper"]}>
                <textarea
                  value={data.overallGoal}
                  onChange={(e) => {
                    setData({ ...data, overallGoal: e.target.value });
                  }}
                  placeholder="Type your response here..."
                />
              </div>

              <div className={styles["btn-group"]}>
                <button
                  onClick={() => navigate("/dashboard")}
                  className={`${styles.btn} ${styles["btn-secondary"]}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Show synthesis confirmation before saving
                    handleShowSynthesis("overallGoal", data.overallGoal);
                  }}
                  disabled={!data.overallGoal.trim() || saving}
                  className={`${styles.btn} ${styles["btn-primary"]}`}
                >
                  {saving ? "Saving..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Domain Goals */}
          {currentStep === "domains" && (
            <div className={styles.card}>
              <h2>Life Domain Goals</h2>
              <p className={styles["card-subtitle"]}>
                For each Life Domain, what do you hope this LifePlan will help you
                clarify, strengthen, realign, or add?
              </p>

              {aiLoading && (
                <div style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  marginBottom: "24px",
                }}>
                  <p style={{ marginTop: "16px", color: "rgba(255, 255, 255, 0.7)", fontSize: "14px" }}>
                    Generating personalized domain questions...
                  </p>
                </div>
              )}

              {aiError && (
                <div style={{
                  padding: "16px 20px",
                  background: "rgba(255, 100, 100, 0.1)",
                  border: "1px solid rgba(255, 100, 100, 0.3)",
                  borderRadius: "12px",
                  marginBottom: "24px",
                  color: "rgba(255, 150, 150, 0.9)",
                  fontSize: "14px",
                }}>
                  ⚠️ Unable to load AI questions: {aiError}. Using standard templates.
                </div>
              )}

              {!aiLoading && aiQuestionsRaw && Object.keys(aiQuestionsRaw).length > 0 && !aiError && (
                <div style={{
                  padding: "12px 16px",
                  background: "rgba(100, 200, 100, 0.1)",
                  border: "1px solid rgba(100, 200, 100, 0.3)",
                  borderRadius: "12px",
                  marginBottom: "24px",
                  color: "rgba(150, 255, 150, 0.9)",
                  fontSize: "13px",
                }}>
                  ✓ Personalized with AI insights
                </div>
              )}

              <div className={styles["domain-grid"]}>
                {domainGoalsForStep.map((domain) => (
                  <div key={domain.key} className={styles["domain-card"]}>
                    <h3>
                      {domain.label}
                      {isUsingAIQuestions ? (
                        <span style={{
                          marginLeft: "8px",
                          fontSize: "12px",
                          opacity: 0.9,
                          fontWeight: "normal",
                          color: "#10b981"
                        }}>
                          ✓ AI-Generated
                        </span>
                      ) : (
                        <span style={{
                          marginLeft: "8px",
                          fontSize: "12px",
                          opacity: 0.7,
                          fontWeight: "normal",
                          color: "#fbbf24"
                        }}>
                          (Sample Questions)
                        </span>
                      )}
                    </h3>
                    <div className={styles["domain-examples"]}>Examples:</div>
                    <ul>
                      {domain.examples.map((ex, idx) => (
                        <li key={idx}>{ex}</li>
                      ))}
                    </ul>
                    <textarea
                      value={data[domain.key]}
                      onChange={(e) => {
                        setData({
                          ...data,
                          [domain.key]: e.target.value,
                        });
                      }}
                      placeholder="Share your goal for this domain..."
                    />
                  </div>
                ))}
              </div>

              <div className={styles["btn-group"]}>
                <button
                  onClick={() => setCurrentStep("overall")}
                  className={`${styles.btn} ${styles["btn-secondary"]}`}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    // Show synthesis confirmation before saving all domain goals
                    const allResponses = {
                      goalPersonal: data.goalPersonal,
                      goalFamilyFriends: data.goalFamilyFriends,
                      goalChurchKingdom: data.goalChurchKingdom,
                      goalVocation: data.goalVocation,
                      goalCommunity: data.goalCommunity,
                    };

                    // Synthesize each domain goal
                    const hasAnyResponse = Object.values(allResponses).some(r => r.trim());
                    if (hasAnyResponse) {
                      // Save all domains at once
                      saveData(allResponses);
                      setCurrentStep("review");
                    }
                  }}
                  disabled={saving || aiLoading}
                  className={`${styles.btn} ${styles["btn-primary"]}`}
                >
                  {saving ? "Saving..." : aiLoading ? "Loading..." : "Review"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === "review" && (
            <div className={styles.card}>
              <h2>Your LifePlan Goals</h2>
              <p className={styles["card-subtitle"]}>
                Review your answers before completing this module.
              </p>

              <div>
                <div className={styles["review-item"]}>
                  <h3>Overall Goal</h3>
                  <div className={styles["review-content"]}>
                    {data.overallGoal}
                  </div>
                </div>

                {domainGoalsForStep.map((domain) => (
                  <div key={domain.key} className={styles["review-item"]}>
                    <h3>{domain.label}</h3>
                    <div className={styles["review-content"]}>
                      {data[domain.key] || <em>Not filled</em>}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles["btn-group"]}>
                <button
                  onClick={() => setCurrentStep("domains")}
                  className={`${styles.btn} ${styles["btn-secondary"]}`}
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    // Mark all progress flags as complete
                    await saveData({
                      progress: {
                        overallGoalComplete: true,
                        personalDomainComplete: true,
                        familyDomainComplete: true,
                        churchDomainComplete: true,
                        vocationDomainComplete: true,
                        communityDomainComplete: true,
                      },
                    });
                    // Navigate to Where I Am Now module
                    navigate("/where-i-am-now");
                  }}
                  className={`${styles.btn} ${styles["btn-primary"]}`}
                >
                  Complete Module
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screen Badge */}
      <div className={styles["screen-badge"]}>
        Screen 1 of 6 — Getting Started
      </div>

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "rgba(15, 10, 25, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(30px)",
              borderRadius: "16px",
              padding: "36px",
              maxWidth: "420px",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "rgba(255, 255, 255, 0.95)", marginBottom: "12px" }}>
              Restart Getting Started?
            </h3>
            <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", marginBottom: "28px", lineHeight: "1.6" }}>
              This will reset all your progress in this module. You can redo it at any time.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setShowRestartConfirm(false);
                  setRestartConfirmId(null);
                }}
                className={`${styles.btn} ${styles["btn-secondary"]}`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestart}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  background: "#ff9800",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Yes, Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYNTHESIS CONFIRMATION MODAL */}
      <SynthesisConfirmationModal
        isOpen={showSynthesisModal}
        title={synthesisData?.title || ""}
        synthesizedText={synthesisData?.synthesized || ""}
        onConfirm={handleSynthesisConfirm}
        onEdit={handleSynthesisEdit}
      />
    </div>
  );
};

export default GettingStarted;
