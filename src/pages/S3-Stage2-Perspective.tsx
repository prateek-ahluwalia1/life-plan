import { useEffect, useRef, useState } from "react";
import styles from "../css/Perspective.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import useModuleAccess from "../hooks/useModuleAccess";
import ModuleGatingBlock from "../components/ModuleGatingBlock";
import { requestModuleRestart, confirmModuleRestart } from "../utils/moduleHelpers";

const Perspective = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const userdata = useSelector((state: RootState) => state.auth.userdata);
  const token = useSelector((state: RootState) => state.auth.token);

  // Module gating and restart
  const { isLocked } = useModuleAccess("perspective");
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
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  // Module restart handlers
  const handleRestart = async () => {
    if (!token) return;

    try {
      const result = await requestModuleRestart(token, "modules/perspective");
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
      await confirmModuleRestart(token, "modules/perspective", restartConfirmId);
      setShowRestartConfirm(false);
      setRestartConfirmId(null);
      window.location.reload();
    } catch (err) {
      console.error("Failed to confirm restart:", err);
    }
  };

  // Module gating check
  if (isLocked) {
    return <ModuleGatingBlock 
      moduleName="Perspective" 
      requiredModules={["where-i-am-now"]} 
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
          <strong>Perspective</strong>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>— Stage 2 of 4</span>
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
              <Link to="/journey-complete" style={{ textDecoration: 'none', color: 'grey' }}>
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

        {/* CONTENT AREA */}
        <div className={styles.content}>
          {/* UNLOCK BANNER */}
          <div className={styles["unlock-banner"]}>
            <div className={styles["ub-icon"]}>
              <i className="fa fa-unlock-alt" style={{ color: "#c490f0" }}></i>
            </div>
            <div>
              <div className={styles["ub-tag"]}>🎉 Stage Unlocked</div>
              <div className={styles["ub-title"]}>Welcome to Perspective</div>
              <div className={styles["ub-desc"]}>
                You've completed Stage 1. Now we go deeper — exploring your
                story, how you're uniquely wired, what's been holding you back,
                and gaining a full 360° view of your life.
              </div>
              <div className={styles["ub-scripture"]}>
                "And we know that in all things God works for the good of those
                who love him..." — Romans 8:28
              </div>
            </div>
          </div>

          {/* STAGE STRIP */}
          <div className={styles["stage-strip"]}>
            <Link
              to="/dashboard"
              style={{ textDecoration: "none" }}
              className={`${styles["ss-pill"]} ${styles["ss-done"]}`}
            >
              <div className={styles["ss-done"]}>
                <i className="fa fa-check-circle"></i>
                Getting Started
              </div>
            </Link>
            <div className={`${styles["ss-pill"]} ${styles["ss-active"]}`}>
              <i className="fa fa-play-circle"></i>
              <Link to="#"> Perspective</Link>
            </div>
            <div className={`${styles["ss-pill"]} ${styles["ss-locked"]}`}>
              <i className="fa fa-lock"></i> Surrender
            </div>
            <div className={`${styles["ss-pill"]} ${styles["ss-locked"]}`}>
              <i className="fa fa-lock"></i> LifePlan
            </div>
          </div>

          {/* SECTION HEADER */}
          <div className={styles["section-header"]}>
            <div className={styles["section-eyebrow"]}>Stage 2 · 4 Modules</div>
            <div className={styles["section-title"]}>Gaining Perspective</div>
            <div className={styles["section-sub"]}>
              Explore your story, how you're wired, what stops you, and gain a
              complete picture of your life. Complete all four modules in
              sequence to unlock Stage 3.
            </div>
          </div>

          {/* MODULES GRID */}
          <div className={styles["modules-grid"]}>
            {/* Module 3 - Ready */}
            <div className={`${styles["mod-card"]} ${styles.ready}`}>
              <div className={styles["mc-body"]}>
                <div className={styles["mc-num"]}>Module 3 of 10</div>
                <div className={styles["mc-icon-row"]}>
                  <span className={styles["mc-icon"]}>
                    <i
                      className="fa fa-history"
                      style={{ color: "#c490f0" }}
                    ></i>
                  </span>
                  <span
                    className={`${styles["mc-badge"]} ${styles["mb-ready"]}`}
                  >
                    ▶ Ready to Begin
                  </span>
                </div>
                <div className={styles["mc-title"]}>How I Got Here</div>
                <div className={styles["mc-sub"]}>Turning Points</div>
                <div className={styles["mc-desc"]}>
                  Explore the key moments, decisions, and experiences that
                  shaped who you are today. Understanding your past gives
                  clarity to your present.
                </div>
              </div>
              <div className={styles["mc-footer"]}>
                <span className={styles["mc-time"]}>⏱ ~30–45 min</span>
                <span className={styles["mc-arrow"]}>→</span>
              </div>
            </div>

            {/* Module 4 - Sequential */}
            <div className={`${styles["mod-card"]} ${styles.sequential}`}>
              <div className={styles["mc-body"]}>
                <div className={styles["mc-num"]}>Module 4 of 10</div>
                <div className={styles["mc-icon-row"]}>
                  <span className={styles["mc-icon"]}>
                    <i
                      className="fa fa-connectdevelop"
                      style={{ color: "#c490f0" }}
                    ></i>
                  </span>
                  <span className={`${styles["mc-badge"]} ${styles["mb-seq"]}`}>
                    ○ Complete Module 3 first
                  </span>
                </div>
                <div className={styles["mc-title"]}>How I'm Wired</div>
                <div className={styles["mc-sub"]}>Enneagram</div>
                <div className={styles["mc-desc"]}>
                  Discover your Enneagram type — your core motivations, fears,
                  and the unique way you show up in relationships, work, and
                  faith.
                </div>
              </div>
              <div className={styles["mc-footer"]}>
                <span className={styles["mc-time"]}>⏱ ~20–30 min</span>
                <span className={`${styles["mc-arrow"]} ${styles.dim}`}>→</span>
              </div>
            </div>

            {/* Module 5 - Locked */}
            <div className={`${styles["mod-card"]} ${styles["locked-card"]}`}>
              <div className={styles["mc-body"]}>
                <div className={styles["mc-num"]}>Module 5 of 10</div>
                <div className={styles["mc-icon-row"]}>
                  <span className={styles["mc-icon"]}>
                    <i
                      className="fa fa-shield"
                      style={{ color: "#c490f0" }}
                    ></i>
                  </span>
                  <span
                    className={`${styles["mc-badge"]} ${styles["mb-locked"]}`}
                  >
                    🔒 Locked
                  </span>
                </div>
                <div className={styles["mc-title"]}>What Stops Me</div>
                <div className={styles["mc-sub"]}>Roadblocks</div>
                <div className={styles["mc-desc"]}>
                  Identify the beliefs, habits, fears and patterns that have
                  been getting in your way. Naming them is the first step to
                  releasing them.
                </div>
              </div>
              <div className={styles["mc-footer"]}>
                <span className={styles["mc-time"]}>⏱ ~30–40 min</span>
                <span className={`${styles["mc-arrow"]} ${styles.dim}`}>→</span>
              </div>
            </div>

            {/* Module 6 - Locked */}
            <div className={`${styles["mod-card"]} ${styles["locked-card"]}`}>
              <div className={styles["mc-body"]}>
                <div className={styles["mc-num"]}>Module 6 of 10</div>
                <div className={styles["mc-icon-row"]}>
                  <span className={styles["mc-icon"]}>
                    <i
                      className="fa fa-compass"
                      style={{ color: "#c490f0" }}
                    ></i>
                  </span>
                  <span
                    className={`${styles["mc-badge"]} ${styles["mb-locked"]}`}
                  >
                    🔒 Locked
                  </span>
                </div>
                <div className={styles["mc-title"]}>Perspective</div>
                <div className={styles["mc-sub"]}>360° View</div>
                <div className={styles["mc-desc"]}>
                  Bring everything together into a comprehensive, integrated
                  view of your life — spiritual, relational, vocational,
                  physical, and more.
                </div>
              </div>
              <div className={styles["mc-footer"]}>
                <span className={styles["mc-time"]}>⏱ ~40–50 min</span>
                <span className={`${styles["mc-arrow"]} ${styles.dim}`}>→</span>
              </div>
            </div>
          </div>

          {/* NAVIGATION BUTTONS */}
          <div style={{ display: "flex", gap: "12px", marginTop: "32px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/module-3")}
              className={styles["btn-p"]}
              style={{ color: "white", border: "none", cursor: "pointer" }}
            >
              ▶ Begin Module 3
            </button>
            <Link
              className={styles["btn-ghost"]}
              style={{ textDecoration: "none", color: "gray" }}
              to="/dashboard"
            >
              ← Back to Dashboard
            </Link>
            <Link
              className={styles["btn-ghost"]}
              style={{ textDecoration: "none", color: "gray" }}
              to="/where-i-am-now"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      <div className={styles["screen-badge"]}>
        Screen 3 of 6 — Stage 2: Perspective
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
              This will permanently delete all your perspective assessments and notes.
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

export default Perspective;
