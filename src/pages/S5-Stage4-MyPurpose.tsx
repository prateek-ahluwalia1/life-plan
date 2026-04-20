import { useEffect, useRef, useState } from "react";
import styles from "../css/MyPurpose.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import {
  apiURL,
  downloadModulePdfFromServer,
  fetchLifePlanDeliverablesFromServer,
  saveLifePlanDeliverablesToServer,
} from "../utils/exports";
import useModuleAccess from "../hooks/useModuleAccess";
import ModuleGatingBlock from "../components/ModuleGatingBlock";
import { requestModuleRestart, confirmModuleRestart } from "../utils/moduleHelpers";

const MyPurpose = () => {
  const [missionText, setMissionText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const userdata = useSelector((state: RootState) => state.auth.userdata);
  const token = useSelector((state: RootState) => state.auth.token);

  // Module gating and restart
  const { isLocked } = useModuleAccess("my-purpose");
  const [restartConfirmId, setRestartConfirmId] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const profileInitials = (() => {
    const source = (userdata?.name || userdata?.email || "U").trim();
    if (!source) return "U";
    const parts = source.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  })();

  const navigate = useNavigate();

  useEffect(() => {
    let isCancelled = false;
    if (token) {
      const loadRemote = async () => {
        const remoteDeliverables =
          await fetchLifePlanDeliverablesFromServer(token);

        if (isCancelled || !remoteDeliverables) {
          return;
        }

        setMissionText(remoteDeliverables.missionStatement);
      };

      void loadRemote();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      isCancelled = true;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [token]);

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  // Module restart handlers
  const handleRestart = async () => {
    if (!token) return;

    try {
      const result = await requestModuleRestart(token, "modules/my-purpose");
      if (result?.confirmationId) {
        setRestartConfirmId(result.confirmationId);
        setShowRestartConfirm(true);
      }
    } catch (err) {
      console.error("Failed to initiate restart:", err);
    }
  };

  const handleConfirmRestart = async () => {
    if (!token || !restartConfirmId) return;

    try {
      const result = await confirmModuleRestart(token, "modules/my-purpose", restartConfirmId);
      if (result?.status === "reset_complete") {
        setShowRestartConfirm(false);
        setRestartConfirmId(null);
        setMissionText("");
        setChatInput("");
      } else {
        console.error("Failed to reset module:", result?.message);
      }
    } catch (err) {
      console.error("Failed to confirm restart:", err);
    }
  };

  const handleUnlockMyPurpose = () => {
    if (!token) {
      return;
    }

    fetch(`${apiURL}modules/life-plan-modules`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        progress: {
          mypurpose: true,
        },
      }),
    }).catch((err) => {
      console.error("Failed to unlock MyPurpose module:", err);
    });
  };

  const persistMissionStatement = async () => {
    const cleaned = missionText.trim();

    if (!token) {
      return;
    }

    try {
      const ok = await saveLifePlanDeliverablesToServer(token, {
        missionStatement: cleaned,
      });
      if (!ok) {
        console.error("Failed to save mission statement");
      }
    } catch (err) {
      console.error("Error saving mission statement:", err);
    }
  };

  const handleCompleteModule = () => {
    persistMissionStatement();
    handleUnlockMyPurpose();
  };

  const generatePDF = () => {
    if (!token) {
      return;
    }

    void downloadModulePdfFromServer(
      token,
      "modules/life-plan-modules/pdf/mission",
      "mission-statement.pdf",
    );
  };

  // Module gating check
  if (isLocked) {
    return <ModuleGatingBlock 
      moduleName="My Purpose" 
      requiredModules={["surrender"]} 
      onRetry={() => window.location.reload()}
    />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.bg}></div>

      {/* NAVIGATION */}
      <nav className={styles.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
          <div className={styles["nav-logo"]}>
            YourLifePlanJourney<span>.com</span>
          </div>
        </div>
        <div className={styles.breadcrumb}>
          LifePlan <span style={{ color: "rgba(255,255,255,0.3)" }}>›</span>{" "}
          <strong>My Purpose</strong>
        </div>
        <div ref={profileMenuRef} style={{ position: "relative" }}>
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

      {/* STAGE PROGRESS BAR */}
      <div className={styles["stage-bar"]}>
        <span className={styles["sb-label"]}>Stage 4 — LifePlan</span>
        <div className={styles["sb-track"]}>
          <div className={styles["sb-fill"]} style={{ width: "33.3%" }}></div>
        </div>
        <span className={styles["sb-count"]}>1 / 3 modules complete</span>
      </div>

      {/* MODULE TABS */}
      <div className={styles["mod-strip"]}>
        <div className={`${styles["ms-tab"]} ${styles.active}`}>
          <span className={styles["ms-icon"]}>✨</span> My Purpose
        </div>
        <div className={`${styles["ms-tab"]} ${styles.locked}`}>
          <span className={styles["ms-icon"]}>🔒</span> My Future
        </div>
        <div className={`${styles["ms-tab"]} ${styles.locked}`}>
          <span className={styles["ms-icon"]}>🔒</span> Next Steps
        </div>
      </div>

      <div className={styles.layout}>
        {/* SIDEBAR */}
        <div className={styles.sidebar}>
          <div className={styles["section-top"]}>
            <button className={styles["sb-btn"]}>
              <Link
                to="/dashboard"
                style={{ textDecoration: "none", color: "grey" }}
              >
                <svg className={styles.icon} viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span className={styles["sb-tip"]}>Dashboard</span>
              </Link>
            </button>
            {/* <button className={`${styles['sb-btn']} ${styles.active}`}>
              <Link to="/journey" style={{ textDecoration: 'none', color: 'grey' }}>
                <svg className={styles.icon} viewBox="0 0 24 24">
                  <path d="M3 12h18M3 12l7-7M3 12l7 7" />
                  <circle cx="17" cy="12" r="4" />
                </svg>
                <span className={styles['sb-tip']}>My Journey</span>
              </Link>
            </button> */}
            <Link
              to={"/journey-complete"}
              state={{ hideHero: true }}
              className={styles["sb-btn"]}
              style={{ color: "grey" }}
            >
              <svg className={styles.icon} viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span className={styles["sb-tip"]}>Deliverables</span>
            </Link>
          </div>

          <div className={styles["section-bottom"]}>
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

            <div className={styles["sb-spacer"]}></div>

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
          </div>
        </div>

        <div className={styles.content}>
          {/* LEFT PANEL */}
          <div className={styles["left-panel"]}>
            <div className={styles["stage-strip"]}>
              <Link
                to="/dashboard"
                style={{ textDecoration: "none", color: "#5ddb8e" }}
                className={`${styles["ss-pill"]} ${styles["ss-done"]}`}
              >
                <div>✓ Getting Started</div>
              </Link>
              <Link
                to="/perspective"
                style={{ textDecoration: "none", color: "#5ddb8e" }}
                className={`${styles["ss-pill"]} ${styles["ss-done"]}`}
              >
                <div>✓ Perspective</div>
              </Link>
              <Link
                to="/surrender"
                style={{ textDecoration: "none", color: "#5ddb8e" }}
                className={`${styles["ss-pill"]} ${styles["ss-done"]}`}
              >
                <div>✓ Surrender</div>
              </Link>
              <Link
                to="/purpose"
                style={{ textDecoration: "none", color: "#f08070" }}
                className={`${styles["ss-pill"]} ${styles["ss-active"]}`}
              >
                <div>▶ LifePlan</div>
              </Link>
            </div>

            <div className={styles["mod-header"]}>
              <div className={styles["mod-eyebrow"]}>
                ✨ Stage 4 · LifePlan · Module 8 of 10
              </div>
              <div className={styles["mod-title"]}>My Purpose</div>
              <div className={styles["mod-subtitle"]}>
                Personal Mission Statement — Why I Am Here
              </div>
              <div className={styles["mod-desc"]}>
                You've done the hard inner work. Now it's time to articulate the
                reason you are here — a clear, personal Mission Statement rooted
                in your values, gifts, passions, and sense of God's calling on
                your life.
              </div>
              <div className={styles["instruction-box"]}>
                <div className={styles["ib-title"]}>✦ How This Works</div>
                <div className={styles["ib-text"]}>
                  Your AI guide will synthesize everything you've shared across
                  this journey and help you craft language for your Mission
                  Statement. It's not aspirational — it's uniquely yours. Refine
                  it until it resonates.
                </div>
              </div>
            </div>

            <div className={styles["mission-preview"]}>
              <div className={styles["mp-label"]}>
                Your Emerging Mission Statement
              </div>
              <div
                className={`${styles["mp-quote"]} ${!missionText ? styles["mp-placeholder"] : ""}`}
              >
                {missionText ||
                  "Your mission statement will form here as you work through the AI conversation on the right..."}
              </div>
            </div>

            <div className={styles["save-section"]}>
              <div className={styles["save-title"]}>
                <i
                  className="fa fa-bookmark"
                  style={{ marginRight: "8px" }}
                ></i>{" "}
                Save Your Mission Statement
              </div>
              <div className={styles["save-sub"]}>
                Refine and save your final Mission Statement below. This becomes
                Document 1 of your LifePlan deliverables.
              </div>
              <textarea
                className={styles["save-textarea"]}
                value={missionText}
                onChange={(e) => setMissionText(e.target.value)}
                placeholder="To faithfully steward the gifts, wisdom, and relationships God has entrusted to me — guiding others through transition with compassion, clarity, and courage..."
              ></textarea>
              <div className={styles["save-actions"]}>
                <Link
                  onClick={handleCompleteModule}
                  className={styles["btn-complete"]}
                  to="/journey-complete"
                >
                  ✓ Save &amp; Complete
                </Link>
                <button
                  onClick={() => {
                    persistMissionStatement();
                    generatePDF();
                  }}
                  className={styles["btn-lp"]}
                >
                  <i className="fa fa-floppy-o"></i> Save Draft
                </button>
                <button className={styles["btn-ghost"]}>
                  <Link
                    to="/surrender"
                    style={{ textDecoration: "none", color: "gray" }}
                  >
                    ← Back
                  </Link>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — CHAT PANEL */}
          <div className={styles["right-panel"]}>
            <div className={styles["chat-window"]}>
              <div className={styles["chat-header"]}>
                <div className={styles["chat-ai-avatar"]}>✦</div>
                <div>
                  <div className={styles["chat-ai-name"]}>
                    LifePlan AI Guide
                  </div>
                  <div className={styles["chat-ai-status"]}>
                    <div className={styles["online-dot"]}></div> My Purpose ·
                    Mission Statement
                  </div>
                </div>
                <div className={styles["chat-module-tag"]}>Module 8 / 10</div>
              </div>

              <div className={styles["chat-messages"]}>
                {/* AI MESSAGE */}
                <div className={styles.msg}>
                  <div className={`${styles["msg-av"]} ${styles.ai}`}>✦</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.ai}`}>
                      {userdata?.name || "there"}, you've done something significant. You've looked
                      honestly at where you are, traced how you got here,
                      understood how you're wired, named what's been stopping
                      you, and released what needed to go.
                      <br />
                      <br />
                      Now we get to ask the most important question:{" "}
                      <strong>Why are you here?</strong>
                      <br />
                      <br />
                      Not in an existential way — but practically. What has God
                      placed in you, uniquely, that the world around you needs?
                    </div>
                    <div className={styles["msg-time"]}>LifePlan Guide</div>
                  </div>
                </div>

                {/* USER MESSAGE */}
                <div className={`${styles.msg} ${styles.user}`}>
                  <div className={`${styles["msg-av"]} ${styles.user}`}>RG</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.user}`}>
                      I keep coming back to this word: guide. I've spent years
                      finding my way through hard transitions and I genuinely
                      believe I'm meant to help others do the same. Not give
                      them answers — but help them find their own.
                    </div>
                    <div className={styles["msg-time"]}>{userdata?.name || "there"}</div>
                  </div>
                </div>

                {/* AI MESSAGE */}
                <div className={styles.msg}>
                  <div className={`${styles["msg-av"]} ${styles.ai}`}>✦</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.ai}`}>
                      That's a powerful instinct, {userdata?.name || "there"}. "Guide not answer-giver"
                      — that's a meaningful distinction. It speaks to how you're
                      wired.
                      <br />
                      <br />
                      When you think about <strong>who</strong>
                      specifically needs that kind of guide — what kind of
                      person are you drawn to serve? What season of life are
                      they in?
                    </div>
                    <div className={styles["msg-time"]}>LifePlan Guide</div>
                  </div>
                </div>

                {/* USER MESSAGE */}
                <div className={`${styles.msg} ${styles.user}`}>
                  <div className={`${styles["msg-av"]} ${styles.user}`}>RG</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.user}`}>
                      People in the middle of transition. Especially those who
                      are outwardly successful but internally restless — they've
                      achieved things but sense there's something more. That was
                      me for years.
                    </div>
                    <div className={styles["msg-time"]}>{userdata?.name || "there"}</div>
                  </div>
                </div>

                {/* AI MESSAGE */}
                <div className={styles.msg}>
                  <div className={`${styles["msg-av"]} ${styles.ai}`}>✦</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.ai}`}>
                      Beautiful. And now let's bring faith into it. You
                      mentioned early on that your spiritual life is
                      foundational. How does <strong>God's role</strong> factor
                      into this mission — not just the work, but the motivation?
                    </div>
                    <div className={styles["msg-time"]}>LifePlan Guide</div>
                  </div>
                </div>

                {/* TYPING INDICATOR */}
                <div className={styles.msg}>
                  <div className={`${styles["msg-av"]} ${styles.ai}`}>✦</div>
                  <div className={styles["msg-body"]}>
                    <div className={styles["typing-bubble"]}>
                      <div className={styles["t-dot"]}></div>
                      <div className={styles["t-dot"]}></div>
                      <div className={styles["t-dot"]}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles["chat-input-area"]}>
                <textarea
                  className={styles["chat-input"]}
                  placeholder="Continue your reflection..."
                  rows={1}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                ></textarea>
                <button className={styles["send-btn"]}>➤</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles["screen-badge"]}>
        Screen 5 of 6 — Stage 4: My Purpose
      </div>

      {/* Restart Confirmation Dialog */}
      {showRestartConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "400px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#d32f2f" }}>Confirm Module Restart</h3>
            <p>
              This will permanently delete your mission statement and purpose notes.
              <strong> This action cannot be undone.</strong>
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRestartConfirm(false)}
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
                onClick={handleConfirmRestart}
                style={{
                  padding: "10px 20px",
                  background: "#d32f2f",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPurpose;
