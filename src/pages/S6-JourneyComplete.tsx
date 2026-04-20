import { useEffect, useRef, useState } from "react";
import styles from "../css/JourneyComplete.module.css";
import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import {
  apiURL,
  downloadModulePdfFromServer,
} from "../utils/exports";

type LifePlanProgress = {
  whereiam?: boolean;
  perspective?: boolean;
  surrender?: boolean;
  mypurpose?: boolean;
};

const JourneyComplete = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [progress, setProgress] = useState<LifePlanProgress>({});
  const dispatch = useDispatch();
  const userdata = useSelector((state: RootState) => state.auth.userdata);
  const token = useSelector((state: RootState) => state.auth.token);

  const profileInitials = (() => {
    const source = (userdata?.name || userdata?.email || "U").trim();
    if (!source) return "U";
    const parts = source.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  })();

  const location = useLocation();
  const navigate = useNavigate();
  const shouldHideHero = Boolean(location.state?.hideHero);
  const isJourneyComplete =
    Boolean(progress.whereiam) &&
    Boolean(progress.perspective) &&
    Boolean(progress.surrender) &&
    Boolean(progress.mypurpose);

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
          data?: {
            progress?: LifePlanProgress;
          };
        };

        if (isCancelled || !json.data) {
          return;
        }

        if (json.data.progress) {
          setProgress(json.data.progress);
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
    if (location.state?.hideHero) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutIdsRef.current = [];
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  return (
    <div className={styles.container}>
      {/* ANIMATED BACKGROUND LAYERS */}
      <div className={styles.bg}></div>
      <div className={styles["glow-orb"]}></div>
      <div className={styles["bg-layer"]}></div>
      <div className={styles.particles}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={styles.particle}></div>
        ))}
      </div>

      {/* NAVIGATION */}
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
          Faith-Based AI Journey
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

      <div className={styles.layout}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
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
        </aside>

        <div className={styles.content}>
          {/* CELEBRATION HERO */}
          {isJourneyComplete && !shouldHideHero && (
            <div className={styles.celebration}>
              <div className={styles["cel-confetti"]}>
                <i
                  className="fa fa-trophy"
                  style={{
                    fontSize: "40px",
                    color: "#f1c40f",
                    verticalAlign: "middle",
                  }}
                ></i>
              </div>
              <div className={styles["cel-badge"]}>
                ✓ All 10 Modules Complete
              </div>
              <div className={styles["cel-title"]}>
                Your LifePlan
                <br />
                Is Ready, <span>{userdata?.name || userdata?.email || ""}</span>
              </div>
              <div className={styles["cel-sub"]}>
                You've walked through all 4 stages and 10 modules — through
                honest self-reflection, the courage to name what holds you back,
                and the faith to step into what's next. This is no small thing.
              </div>
              <div className={styles["cel-scripture"]}>
                "He who began a good work in you will carry it on to completion
                until the day of Christ Jesus." — Philippians 1:6
              </div>
            </div>
          )}

          {/* MODULE REPORTS CARDS */}
          <div className={styles["modules-reports-section"]} style={{
            marginBottom: "48px",
          }}>
            <div className={styles["section-header"]} style={{
              marginBottom: "32px",
            }}>
              <div>
                <div className={styles["section-title"]}>
                  Your Module Reports
                </div>
                <div className={styles["section-sub"]}>
                  Download detailed reports from each completed module. All your reflections and assessments in one place.
                </div>
              </div>
            </div>

            <div className={styles["deliverables-grid"]}>
              {/* Getting Started Module */}
              <div className={styles["doc-card"]} style={{
                backgroundColor: "rgba(147, 97, 254, 0.1)",
                borderTop: "3px solid rgba(147, 97, 254, 0.5)",
              }}>
                <div className={`${styles["dc-head"]}`} style={{
                  background: "linear-gradient(135deg, rgba(147, 97, 254, 0.3), rgba(168, 85, 247, 0.2))",
                }}>
                  <div className={styles["dc-icon"]}>
                    <i className="fa fa-rocket" style={{ color: "#a855f7" }}></i>
                  </div>
                  <div className={styles["dc-label"]}>Module 1</div>
                  <div className={styles["dc-title"]}>Getting Started</div>
                </div>
                <div className={styles["dc-body"]}>
                  <div className={styles["dc-preview"]}>
                    "Your life goals and domains summary from the Getting Started reflection."
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "space-between",
                  }}>
                    <button
                      className={styles["dc-btn-view"]}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: "transparent",
                        color: "#a855f7",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                        borderRadius: "6px",
                        cursor: "default",
                        fontSize: "12px",
                      }}
                      type="button"
                    >
                      ✓ Completed
                    </button>
                    <button
                      className={styles["dc-btn-dl"]}
                      onClick={() => token && downloadModulePdfFromServer(token, "modules/getting-started-modules/pdf", "getting-started-goals.pdf")}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: "rgba(168, 85, 247, 0.3)",
                        color: "white",
                        border: "1px solid rgba(168, 85, 247, 0.5)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(168, 85, 247, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(168, 85, 247, 0.3)";
                      }}
                      type="button"
                    >
                      ⬇ Download PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Current State Assessment Module */}
              <div className={styles["doc-card"]} style={{
                backgroundColor: progress.whereiam ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)",
                borderTop: progress.whereiam ? "3px solid rgba(99, 102, 241, 0.5)" : "3px solid rgba(99, 102, 241, 0.2)",
                opacity: progress.whereiam ? 1 : 0.6,
              }}>
                <div className={`${styles["dc-head"]}`} style={{
                  background: progress.whereiam ? "linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(79, 70, 229, 0.2))" : "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.1))",
                }}>
                  <div className={styles["dc-icon"]}>
                    <i className="fa fa-compass" style={{ color: progress.whereiam ? "#6366f1" : "#999" }}></i>
                  </div>
                  <div className={styles["dc-label"]}>Module 2</div>
                  <div className={styles["dc-title"]}>Where I Am Now</div>
                </div>
                <div className={styles["dc-body"]}>
                  <div className={styles["dc-preview"]}>
                    "Your current state assessment across all five life domains — what's right, wrong, confused, and missing."
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "space-between",
                  }}>
                    <button
                      className={styles["dc-btn-view"]}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: "transparent",
                        color: progress.whereiam ? "#6366f1" : "#999",
                        border: progress.whereiam ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(99, 102, 241, 0.15)",
                        borderRadius: "6px",
                        cursor: "default",
                        fontSize: "12px",
                      }}
                      type="button"
                    >
                      {progress.whereiam ? "✓ Completed" : "○ Not Started"}
                    </button>
                    <button
                      className={styles["dc-btn-dl"]}
                      onClick={() => token && downloadModulePdfFromServer(token, "modules/where-i-am-now/pdf", "where-i-am-now.pdf")}
                      disabled={!progress.whereiam}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: progress.whereiam ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.1)",
                        color: progress.whereiam ? "white" : "rgba(255, 255, 255, 0.4)",
                        border: progress.whereiam ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid rgba(99, 102, 241, 0.2)",
                        borderRadius: "6px",
                        cursor: progress.whereiam ? "pointer" : "not-allowed",
                        fontSize: "13px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (progress.whereiam) {
                          e.currentTarget.style.background = "rgba(99, 102, 241, 0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (progress.whereiam) {
                          e.currentTarget.style.background = "rgba(99, 102, 241, 0.3)";
                        }
                      }}
                      type="button"
                    >
                      ⬇ Download PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Perspective Module */}
              <div className={styles["doc-card"]} style={{
                backgroundColor: progress.perspective ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)",
                borderTop: progress.perspective ? "3px solid rgba(139, 92, 246, 0.5)" : "3px solid rgba(139, 92, 246, 0.2)",
                opacity: progress.perspective ? 1 : 0.6,
              }}>
                <div className={`${styles["dc-head"]}`} style={{
                  background: progress.perspective ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 255, 0.2))" : "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 255, 0.1))",
                }}>
                  <div className={styles["dc-icon"]}>
                    <i className="fa fa-binoculars" style={{ color: progress.perspective ? "#8b5cf6" : "#999" }}></i>
                  </div>
                  <div className={styles["dc-label"]}>Module 3</div>
                  <div className={styles["dc-title"]}>Perspective</div>
                </div>
                <div className={styles["dc-body"]}>
                  <div className={styles["dc-preview"]}>
                    "Your reflections on how you got here and the perspective that shapes your path forward."
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "space-between",
                  }}>
                    <button
                      className={styles["dc-btn-view"]}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: "transparent",
                        color: progress.perspective ? "#8b5cf6" : "#999",
                        border: progress.perspective ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(139, 92, 246, 0.15)",
                        borderRadius: "6px",
                        cursor: "default",
                        fontSize: "12px",
                      }}
                      type="button"
                    >
                      {progress.perspective ? "✓ Completed" : "○ Not Started"}
                    </button>
                    <button
                      className={styles["dc-btn-dl"]}
                      disabled={!progress.perspective}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: progress.perspective ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.1)",
                        color: progress.perspective ? "white" : "rgba(255, 255, 255, 0.4)",
                        border: progress.perspective ? "1px solid rgba(139, 92, 246, 0.5)" : "1px solid rgba(139, 92, 246, 0.2)",
                        borderRadius: "6px",
                        cursor: progress.perspective ? "pointer" : "not-allowed",
                        fontSize: "13px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                      }}
                      type="button"
                    >
                      ⬇ Coming Soon
                    </button>
                  </div>
                </div>
              </div>

              {/* Surrender Module */}
              <div className={styles["doc-card"]} style={{
                backgroundColor: progress.surrender ? "rgba(244, 114, 182, 0.1)" : "rgba(244, 114, 182, 0.05)",
                borderTop: progress.surrender ? "3px solid rgba(244, 114, 182, 0.5)" : "3px solid rgba(244, 114, 182, 0.2)",
                opacity: progress.surrender ? 1 : 0.6,
              }}>
                <div className={`${styles["dc-head"]}`} style={{
                  background: progress.surrender ? "linear-gradient(135deg, rgba(244, 114, 182, 0.3), rgba(236, 72, 153, 0.2))" : "linear-gradient(135deg, rgba(244, 114, 182, 0.15), rgba(236, 72, 153, 0.1))",
                }}>
                  <div className={styles["dc-icon"]}>
                    <i className="fa fa-dove" style={{ color: progress.surrender ? "#f472b6" : "#999" }}></i>
                  </div>
                  <div className={styles["dc-label"]}>Module 4</div>
                  <div className={styles["dc-title"]}>Surrender</div>
                </div>
                <div className={styles["dc-body"]}>
                  <div className={styles["dc-preview"]}>
                    "What you're releasing and trusting to move forward in faith."
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "space-between",
                  }}>
                    <button
                      className={styles["dc-btn-view"]}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: "transparent",
                        color: progress.surrender ? "#f472b6" : "#999",
                        border: progress.surrender ? "1px solid rgba(244, 114, 182, 0.3)" : "1px solid rgba(244, 114, 182, 0.15)",
                        borderRadius: "6px",
                        cursor: "default",
                        fontSize: "12px",
                      }}
                      type="button"
                    >
                      {progress.surrender ? "✓ Completed" : "○ Not Started"}
                    </button>
                    <button
                      className={styles["dc-btn-dl"]}
                      disabled={!progress.surrender}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: progress.surrender ? "rgba(244, 114, 182, 0.3)" : "rgba(244, 114, 182, 0.1)",
                        color: progress.surrender ? "white" : "rgba(255, 255, 255, 0.4)",
                        border: progress.surrender ? "1px solid rgba(244, 114, 182, 0.5)" : "1px solid rgba(244, 114, 182, 0.2)",
                        borderRadius: "6px",
                        cursor: progress.surrender ? "pointer" : "not-allowed",
                        fontSize: "13px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                      }}
                      type="button"
                    >
                      ⬇ Coming Soon
                    </button>
                  </div>
                </div>
              </div>

              {/* My Purpose Module */}
              <div className={styles["doc-card"]} style={{
                backgroundColor: progress.mypurpose ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.05)",
                borderTop: progress.mypurpose ? "3px solid rgba(34, 197, 94, 0.5)" : "3px solid rgba(34, 197, 94, 0.2)",
                opacity: progress.mypurpose ? 1 : 0.6,
              }}>
                <div className={`${styles["dc-head"]}`} style={{
                  background: progress.mypurpose ? "linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.2))" : "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))",
                }}>
                  <div className={styles["dc-icon"]}>
                    <i className="fa fa-star" style={{ color: progress.mypurpose ? "#22c55e" : "#999" }}></i>
                  </div>
                  <div className={styles["dc-label"]}>Module 5</div>
                  <div className={styles["dc-title"]}>My Purpose</div>
                </div>
                <div className={styles["dc-body"]}>
                  <div className={styles["dc-preview"]}>
                    "Your personal mission, vision, and purpose-aligned action plan."
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "space-between",
                  }}>
                    <button
                      className={styles["dc-btn-view"]}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: "transparent",
                        color: progress.mypurpose ? "#22c55e" : "#999",
                        border: progress.mypurpose ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(34, 197, 94, 0.15)",
                        borderRadius: "6px",
                        cursor: "default",
                        fontSize: "12px",
                      }}
                      type="button"
                    >
                      {progress.mypurpose ? "✓ Completed" : "○ Not Started"}
                    </button>
                    <button
                      className={styles["dc-btn-dl"]}
                      disabled={!progress.mypurpose}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: progress.mypurpose ? "rgba(34, 197, 94, 0.3)" : "rgba(34, 197, 94, 0.1)",
                        color: progress.mypurpose ? "white" : "rgba(255, 255, 255, 0.4)",
                        border: progress.mypurpose ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(34, 197, 94, 0.2)",
                        borderRadius: "6px",
                        cursor: progress.mypurpose ? "pointer" : "not-allowed",
                        fontSize: "13px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                      }}
                      type="button"
                    >
                      ⬇ Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles["screen-badge"]}>
        Screen 6 of 6 — Journey Complete
      </div>
    </div>
  );
};

export default JourneyComplete;
