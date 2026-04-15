import { useEffect, useRef, useState } from "react";
import styles from "../css/Surrender.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL, downloadModulePdfFromServer } from "../utils/exports";
import useModuleAccess from "../hooks/useModuleAccess";
import ModuleGatingBlock from "../components/ModuleGatingBlock";
import { requestModuleRestart, confirmModuleRestart } from "../utils/moduleHelpers";

const defaultSurrenderItems = [
  "The need to have everything figured out before I can move forward",
  "My identity tied entirely to professional achievement and productivity",
  "Fear of disappointing others if I change direction",
];

const SurrenderStage = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const userdata = useSelector((state: RootState) => state.auth.userdata);
  const token = useSelector((state: RootState) => state.auth.token);

  // Module gating and restart
  const { isLocked } = useModuleAccess("surrender");
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

  // Logic for the interactive list
  const [items, setItems] = useState(defaultSurrenderItems);
  const [inputValue, setInputValue] = useState("");

  const addItem = () => {
    if (inputValue.trim()) {
      setItems([...items, inputValue]);
      setInputValue("");
    }
  };

  const deleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    const loadRemote = async () => {
      try {
        const response = await fetch(`${apiURL}modules/life-plan-modules`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const json = (await response.json()) as {
          data?: { surrenderItems?: string[] };
        };

        if (isCancelled || !Array.isArray(json.data?.surrenderItems)) {
          return;
        }

        const cleaned = json.data.surrenderItems
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        if (cleaned.length > 0) {
          setItems(cleaned);
        }
      } catch {
        // Keep local fallback if backend is unavailable
      }
    };

    void loadRemote();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void fetch(`${apiURL}modules/life-plan-modules`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ surrenderItems: items }),
    });
  }, [items, token]);

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
      const result = await requestModuleRestart(token, "modules/surrender");
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
      await confirmModuleRestart(token, "modules/surrender", restartConfirmId);
      setShowRestartConfirm(false);
      setRestartConfirmId(null);
      setItems(defaultSurrenderItems);
    } catch (err) {
      console.error("Failed to confirm restart:", err);
    }
  };

  const handleUnlockSurrender = () => {
    if (!token) {
      return;
    }

    void fetch(`${apiURL}modules/life-plan-modules`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        progress: {
          surrender: true,
        },
        surrenderItems: items,
      }),
    });
  };

  const handleDownloadSurrenderPdf = () => {
    if (!token) {
      return;
    }

    void downloadModulePdfFromServer(
      token,
      "modules/life-plan-modules/pdf/surrender",
      "surrender-release-list.pdf",
    );
  };

  // Module gating check
  if (isLocked) {
    return <ModuleGatingBlock 
      moduleName="Surrender" 
      requiredModules={["perspective"]} 
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
          <strong>Surrender</strong>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>
            — Stage 3 · Module 7 of 10
          </span>
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
          {/* STAGE STRIP */}
          <div className={styles["stage-strip"]}>
            <div className={`${styles["ss-pill"]} ${styles["ss-done"]}`}>
              <Link
                to="/dashboard"
                className={styles.fullPillLink} // ← new class
              >
                <i
                  className="fa fa-check-circle"
                  style={{ marginRight: "8px" }}
                ></i>
                Getting Started
              </Link>
            </div>

            <div className={`${styles["ss-pill"]} ${styles["ss-done"]}`}>
              <Link to="/perspective" className={styles.fullPillLink}>
                <i
                  className="fa fa-check-circle"
                  style={{ color: "#27ae60", marginRight: "8px" }}
                ></i>
                Perspective
              </Link>
            </div>

            <div className={`${styles["ss-pill"]} ${styles["ss-active"]}`}>
              <Link to="/surrender" className={styles.fullPillLink}>
                <i
                  className="fa fa-play-circle"
                  style={{ color: "rgb(184, 137, 42)", marginRight: "8px" }}
                ></i>
                Surrender
              </Link>
            </div>

            <div className={`${styles["ss-pill"]} ${styles["ss-locked"]}`}>
              <Link to="/journey-complete" className={styles.fullPillLink}>
                <i
                  className="fa fa-lock"
                  style={{ color: "rgb(184, 137, 42)", marginRight: "8px" }}
                ></i>
                LifePlan
              </Link>
            </div>
          </div>
          {/* MODULE HEADER */}
          <div className={styles["mod-header"]}>
            <div className={styles["mod-eyebrow"]}>
              🕊️ Stage 3 · Surrender · Module 7 of 10
            </div>
            <div className={styles["mod-title"]}>Surrender</div>
            <div className={styles["mod-subtitle"]}>
              Release what no longer serves you
            </div>
            <div className={styles["mod-desc"]}>
              You've looked at where you are, how you got here, and what's been
              holding you back. Now it's time to name — and intentionally
              release — the things you need to let go of to move forward.
              Beliefs, habits, old identities, fears. Name them honestly.
            </div>
            <div className={styles["mod-scripture"]}>
              "Come to me, all you who are weary and burdened, and I will give
              you rest." — Matthew 11:28
            </div>
          </div>

          <div
            className={styles["panels-container"]}
            style={{ display: "flex", gap: "30px" }}
          >
            {/* LEFT: SURRENDER LIST */}
            <div className={styles["left-panel"]} style={{ flex: 1 }}>
              <div className={styles["surrender-card"]}>
                <div className={styles["sc-title"]}>
                  <i
                    className="fa fa-circle-thin"
                    style={{ color: "rgb(184, 137, 42)" }}
                  ></i>{" "}
                  My Surrender List
                </div>
                <div className={styles["sc-sub"]}>
                  Add at least one item. Be honest — this list is for you and
                  God alone.
                </div>

                <div className={styles["surrender-items"]}>
                  {items.map((item, index) => (
                    <div className={styles["si-item"]} key={index}>
                      <span className={styles["si-leaf"]}>
                        <i
                          className="fa fa-circle-thin"
                          style={{ color: "rgb(184, 137, 42)" }}
                        ></i>
                      </span>
                      <span className={styles["si-text"]}>{item}</span>
                      <button
                        className={styles["si-del"]}
                        onClick={() => deleteItem(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles["add-row"]}>
                  <input
                    className={styles["add-input"]}
                    type="text"
                    placeholder="What do you need to surrender?"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addItem()}
                  />
                  <button className={styles["add-btn"]} onClick={addItem}>
                    + Add
                  </button>
                </div>
              </div>

              <div className={styles["complete-card"]}>
                <div className={styles["cc-title"]}>Ready to Continue?</div>
                <div className={styles["cc-sub"]}>
                  Once you've named what you're surrendering, save this list and
                  continue to Stage 4 — where you'll design your LifePlan,
                  starting with your personal Mission Statement.
                </div>
                <div className={styles["cc-actions"]}>
                  <button
                    onClick={handleUnlockSurrender}
                    className={styles["btn-gold"]}
                  >
                    <Link
                      to="/my-purpose"
                      style={{ textDecoration: "none", color: "white" }}
                    >
                      ✓ Save &amp; Continue to LifePlan
                    </Link>
                  </button>
                  <button
                    type="button"
                    className={styles["btn-ghost"]}
                    onClick={handleDownloadSurrenderPdf}
                  >
                    Download PDF
                  </button>
                  <button className={styles["btn-ghost"]}>
                    <Link
                      to="/perspective"
                      style={{ textDecoration: "none", color: "gray" }}
                    >
                      ← Back
                    </Link>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: LIFEPLAN PREVIEW */}
            <div className={styles["right-panel"]} style={{ width: "380px" }}>
              <div className={styles["lifeplan-preview"]}>
                <div className={styles["lp-head"]}>
                  <div className={styles["lp-head-eyebrow"]}>
                    <i
                      className="fa fa-lock"
                      style={{
                        color: "rgb(184, 137, 42)",
                        marginRight: "8px",
                        fontSize: "15px",
                      }}
                    ></i>{" "}
                    Unlocks After This Module
                  </div>
                  <div className={styles["lp-head-title"]}>
                    Stage 4 — LifePlan
                  </div>
                  <div className={styles["lp-head-sub"]}>
                    3 final modules · Your mission, vision &amp; action plan
                  </div>
                </div>
                <div className={styles["lp-modules"]}>
                  {[
                    {
                      num: "8",
                      title: "My Purpose",
                      sub: "Personal Mission Statement",
                      icon: "fa-star-o",
                    },
                    {
                      num: "9",
                      title: "My Future",
                      sub: "Vision Statement",
                      icon: "fa-sun-o",
                    },
                    {
                      num: "10",
                      title: "Next Steps",
                      sub: "Purpose-Aligned Action Plan",
                      icon: "fa-list-ol",
                    },
                  ].map((m, i) => (
                    <div className={styles["lp-mod"]} key={i}>
                      <span className={styles["lpm-icon"]}>
                        <i
                          className={`fa ${m.icon}`}
                          style={{ color: "rgb(184, 137, 42)" }}
                        ></i>
                      </span>
                      <div className={styles["lpm-info"]}>
                        <div className={styles["lpm-num"]}>
                          Module {m.num} of 10
                        </div>
                        <div className={styles["lpm-title"]}>{m.title}</div>
                        <div className={styles["lpm-sub"]}>{m.sub}</div>
                      </div>
                      <span className={styles["lpm-lock"]}>🔒</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles["deliverables-preview"]}>
                <div className={styles["dp-title"]}>
                  📄 Your 3 Final Documents
                </div>
                <div className={styles["dp-sub"]}>
                  Generated when you complete Stage 4 — uniquely yours.
                </div>
                <div className={styles["doc-cards"]}>
                  {[
                    {
                      label: "Document 1",
                      name: "Personal Mission Statement",
                      icon: "fa-file-pdf-o",
                    },
                    {
                      label: "Document 2",
                      name: "Vision Statement",
                      icon: "fa-eye",
                    },
                    {
                      label: "Document 3",
                      name: "Purpose-Aligned Action Plan",
                      icon: "fa-map",
                    },
                  ].map((d, i) => (
                    <div className={styles["doc-card"]} key={i}>
                      <span className={styles["doc-icon"]}>
                        <i
                          className={`fa ${d.icon}`}
                          style={{ color: "rgb(184, 137, 42)" }}
                        ></i>
                      </span>
                      <div className={styles["doc-info"]}>
                        <div className={styles["doc-label"]}>{d.label}</div>
                        <div className={styles["doc-name"]}>{d.name}</div>
                      </div>
                      <span className={styles["doc-status"]}>🔒</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles["screen-badge"]}>
        Screen 4 of 6 — Stage 3: Surrender
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
              This will permanently delete all your surrender items and notes.
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

export default SurrenderStage;
