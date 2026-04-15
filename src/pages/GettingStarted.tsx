import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL } from "../utils/exports";
import Loader from "../components/Loader";
import styles from "../css/GettingStarted.module.css";
import { requestModuleRestart, confirmModuleRestart } from "../utils/moduleHelpers";

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

const domainGoals: DomainGoal[] = [
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<GettingStartedData | null>(null);
  const [currentStep, setCurrentStep] = useState<"overall" | "domains" | "review">(
    "overall",
  );
  const [error, setError] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [restartConfirmId, setRestartConfirmId] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

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
      } finally {
        setLoading(false);
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

  // Handle module restart
  const handleRestart = async () => {
    if (!token) return;
    try {
      const result = await requestModuleRestart(token, "getting-started");
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
      await confirmModuleRestart(token, "getting-started", restartConfirmId);
      setShowRestartConfirm(false);
      setRestartConfirmId(null);
      setCurrentStep("overall");
      // Reload data
      window.location.reload();
    } catch (_err) {
      setError("Failed to restart module");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const profileInitials = userdata?.email?.[0]?.toUpperCase() ?? "U";

  // Save data to server
  const saveData = async (updates: Partial<GettingStartedData>) => {
    if (!token || !data) return;

    setSaving(true);
    try {
      const response = await fetch(`${apiURL}modules/getting-started-modules`, {
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
        throw new Error("Failed to save data");
      }

      const updated = (await response.json()) as GettingStartedData;
      setData(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Loader />
      </div>
    );
  }

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
                    saveData({ overallGoal: data.overallGoal });
                    setCurrentStep("domains");
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

              <div className={styles["domain-grid"]}>
                {domainGoals.map((domain) => (
                  <div key={domain.key} className={styles["domain-card"]}>
                    <h3>{domain.label}</h3>
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
                    saveData({
                      goalPersonal: data.goalPersonal,
                      goalFamilyFriends: data.goalFamilyFriends,
                      goalChurchKingdom: data.goalChurchKingdom,
                      goalVocation: data.goalVocation,
                      goalCommunity: data.goalCommunity,
                    });
                    setCurrentStep("review");
                  }}
                  disabled={saving}
                  className={`${styles.btn} ${styles["btn-primary"]}`}
                >
                  {saving ? "Saving..." : "Review"}
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

                {domainGoals.map((domain) => (
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
                    navigate("/introduction");
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
    </div>
  );
};

export default GettingStarted;
