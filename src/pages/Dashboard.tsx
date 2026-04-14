import { useState, useEffect, useRef } from "react";
import styles from "../css/Dashboard.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL } from "../utils/exports";

type LifePlanProgress = {
  whereiam: boolean;
  perspective: boolean;
  surrender: boolean;
  mypurpose: boolean;
};

const defaultProgress: LifePlanProgress = {
  whereiam: false,
  perspective: false,
  surrender: false,
  mypurpose: false,
};

const Dashboard = () => {
  const [progress, setProgress] = useState(defaultProgress);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    const loadRemoteProgress = async () => {
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
          data?: { progress?: Partial<LifePlanProgress> };
        };

        if (isCancelled || !json.data?.progress) {
          return;
        }

        const nextProgress = {
          ...defaultProgress,
          ...json.data.progress,
        };

        setProgress(nextProgress);
      } catch {
        // Keep local fallback if backend is unavailable
      }
    };

    void loadRemoteProgress();

    return () => {
      isCancelled = true;
    };
  }, [token]);

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

  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  return (
    <div className={styles.container}>
      <div className={styles.bg}></div>

      {/* NAVIGATION */}
      <nav className={styles.nav}>
        <div className={styles["nav-brand"]}>
          <Link
            to="/"
            className={styles["nav-home-link"]}
            aria-label="Back to homepage"
            title="Go to homepage"
          >
            <svg className={styles["nav-home-icon"]} viewBox="0 0 24 24">
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
        <div className={styles["nav-right"]} ref={profileMenuRef}>
          <button
            type="button"
            className={styles["nav-avatar"]}
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            aria-label="Open profile menu"
          >
            {profileInitials}
          </button>
          {isProfileMenuOpen && (
            <div className={styles["profile-menu"]} role="menu">
              <button
                type="button"
                className={styles["profile-menu-item"]}
                onClick={handleLogout}
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
          <button className={`${styles["sb-btn"]} ${styles.active}`}>
            <svg className={styles.icon} viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className={styles["sb-tip"]}>Dashboard</span>
          </button>

          {/* <button className={styles['sb-btn']}>
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

        {/* MAIN CONTENT */}
        <div className={styles.content}>
          {/* WELCOME BANNER */}
          <div className={styles["welcome-banner"]}>
            <div className={styles["wb-left"]}>
              <div className={styles["wb-tag"]}>
                Your LifePlan Journey Dashboard
              </div>
              <div className={styles["wb-title"]}>Welcome back, Ron</div>
              <div className={styles["wb-sub"]}>
                {progress.mypurpose ? (
                  <>
                    You've reached Stage 4 · LifePlan
                    <br />
                    Your vision is becoming clear.
                  </>
                ) : progress.surrender ? (
                  <>
                    You're in Stage 4 · LifePlan · Module 8 of 10
                    <br />
                    Designing your unique path.
                  </>
                ) : progress.perspective ? (
                  <>
                    You're in Stage 3 · Surrender · Module 7 of 10
                    <br />
                    Releasing what no longer serves you.
                  </>
                ) : (
                  <>
                    You're in Stage 1 · Getting Started · Module 2 of 10
                    <br />
                    Take each step with intention.
                  </>
                )}
              </div>
              <div className={styles["wb-scripture"]}>
                "For I know the plans I have for you," declares the Lord —
                Jeremiah 29:11
              </div>
            </div>
            <Link
              to={
                progress.surrender
                  ? "/my-purpose"
                  : progress.perspective
                    ? "/surrender"
                    : "/introduction"
              }
              style={{ textDecoration: "none", color: "white" }}
              className={styles["wb-right"]}
            >
              <button className={styles["continue-btn"]}>
                ▶&nbsp;{" "}
                {progress.surrender
                  ? "My Purpose"
                  : progress.perspective
                    ? "Surrender"
                    : "Where I Am Now"}
              </button>
            </Link>
          </div>

          {/* STATS ROW */}
          <div className={styles["stats-row"]}>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Overall Progress</div>
              <div className={styles["stat-val"]}>
                10<span>%</span>
              </div>
              <div className={styles["stat-sub"]}>Journey underway</div>
              <div className={styles["prog-bar"]}>
                <div
                  className={styles["prog-fill"]}
                  style={{ width: "10%", background: "var(--gs)" }}
                ></div>
              </div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Modules Complete</div>
              <div className={styles["stat-val"]}>
                1 <span>/ 10</span>
              </div>
              <div className={styles["stat-sub"]}>9 remaining</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Current Stage</div>
              <div
                className={styles["stat-val"]}
                style={{ fontSize: "16px", marginTop: "4px", color: "#7dd3f0" }}
              >
                Getting Started
              </div>
              <div className={styles["stat-sub"]}>Stage 1 of 4</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Stages Unlocked</div>
              <div className={styles["stat-val"]}>
                1 <span>/ 4</span>
              </div>
              <div className={styles["stat-sub"]}>3 stages locked ahead</div>
            </div>
          </div>

          {/* JOURNEY ROADMAP */}
          <div className={styles["roadmap-card"]}>
            <div className={styles["roadmap-header"]}>
              <div>
                <div className={styles["roadmap-title"]}>
                  The LifePlan Journey
                </div>
                <div className={styles["roadmap-sub"]}>
                  4 Stages · 10 Modules · Your complete guided path
                </div>
              </div>
              <div className={styles["stage-legend"]}>
                <div className={styles["leg-item"]}>
                  <div
                    className={styles["leg-dot"]}
                    style={{ background: "var(--done)" }}
                  ></div>
                  Completed
                </div>
                <div className={styles["leg-item"]}>
                  <div
                    className={styles["leg-dot"]}
                    style={{ background: "var(--gs)" }}
                  ></div>
                  In Progress
                </div>
                <div className={styles["leg-item"]}>
                  <div
                    className={styles["leg-dot"]}
                    style={{ background: "rgba(255,255,255,0.25)" }}
                  ></div>
                  Locked
                </div>
              </div>
            </div>

            <div className={styles["stage-grid"]}>
              {/* STAGE 1 */}
              <div className={styles["stage-col"]}>
                <div className={`${styles["stage-header"]} ${styles["sh-gs"]}`}>
                  <div className={styles["stage-num-badge"]}>1</div>
                  <div>
                    <div className={styles["stage-name"]}>Getting Started</div>
                    <div className={styles["stage-mods"]}>2 modules</div>
                  </div>
                </div>

                <div className={styles["stage-body-gs"]}>
                  <Link to="/dashboard" style={{ textDecoration: "none" }}>
                    <div
                      className={`${styles["mod-node"]} ${styles.completed} ${progress.whereiam ? styles.completed : styles.active}`}
                    >
                      <div className={styles["mn-icon-row"]}>
                        <span className={styles["mn-icon"]}>
                          <i
                            className="fa fa-bullseye"
                            style={{
                              color: progress.whereiam ? "#27ae60" : "#3a8fb5",
                            }}
                          ></i>
                        </span>
                        <span
                          className={`${styles["mn-badge"]} ${styles["mb-done"]}`}
                        >
                          <i className="fa fa-check"></i> Done
                        </span>
                      </div>
                      <div className={styles["mn-title"]}>Why I Am Here</div>
                      <div className={styles["mn-sub"]}>Goals by Domain</div>
                    </div>
                  </Link>
                  <Link to="/introduction" style={{ textDecoration: "none" }}>
                    <div
                      className={`${styles["mod-node"]} ${progress.perspective ? styles.completed : styles.active}`}
                    >
                      <div className={styles["mn-icon-row"]}>
                        <span className={styles["mn-icon"]}>
                          <i
                            className="fa fa-search"
                            style={{
                              color: progress.perspective
                                ? "#27ae60"
                                : "#3a8fb5",
                            }}
                          ></i>
                        </span>
                        <span
                          className={`${styles["mn-badge"]} ${progress.perspective ? styles["mb-done"] : styles["mb-active"]}`}
                        >
                          <i
                            className={`fa ${progress.perspective ? "fa-check" : "fa-play"}`}
                          ></i>{" "}
                          {progress.perspective ? "Done" : "Active"}
                        </span>
                      </div>
                      <div className={styles["mn-title"]}>Where I Am Now</div>
                      <div className={styles["mn-sub"]}>
                        Current State Assessment
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* STAGE 2 */}
              <div className={styles["stage-col"]}>
                <div className={`${styles["stage-header"]} ${styles["sh-p"]}`}>
                  <div className={styles["stage-num-badge"]}>2</div>
                  <div>
                    <div className={styles["stage-name"]}>Perspective</div>
                    <div className={styles["stage-mods"]}>
                      4 modules {!progress.perspective && "· Locked"}
                    </div>
                  </div>
                </div>

                <div className={styles["stage-body-p"]}>
                  {[
                    "How I Got Here",
                    "How I'm Wired",
                    "What Stops Me",
                    "Perspective",
                  ].map((title, idx) => {
                    const isCompleted = progress.surrender;
                    const isActive =
                      progress.perspective && !progress.surrender;
                    const isLocked = !progress.perspective;

                    let statusClass = styles.locked;
                    if (isCompleted) statusClass = styles.completed;
                    else if (isActive) statusClass = styles.active;

                    return (
                      <Link
                        key={idx}
                        to={isLocked ? "#" : "/perspective"}
                        style={{
                          textDecoration: "none",
                          pointerEvents: isLocked ? "none" : "auto",
                        }}
                      >
                        <div className={`${styles["mod-node"]} ${statusClass}`}>
                          <div className={styles["mn-icon-row"]}>
                            <span className={styles["mn-icon"]}>
                              <i
                                className={`fa ${idx === 0 ? "fa-history" : idx === 1 ? "fa-connectdevelop" : idx === 2 ? "fa-shield" : "fa-binoculars"}`}
                                style={{
                                  color: isCompleted
                                    ? "#27ae60"
                                    : isActive
                                      ? "#c490f0"
                                      : "rgba(255,255,255,0.3)",
                                }}
                              ></i>
                            </span>
                            <span
                              className={`${styles["mn-badge"]} ${isCompleted ? styles["mb-done"] : isActive ? styles["mb-active"] : styles["mb-locked"]}`}
                            >
                              <i
                                className={`fa ${isCompleted ? "fa-check" : isActive ? "fa-play" : "fa-lock"}`}
                              ></i>{" "}
                              {isCompleted
                                ? "Done"
                                : isActive
                                  ? "Active"
                                  : "Locked"}
                            </span>
                          </div>
                          <div className={styles["mn-title"]}>{title}</div>
                          <div className={styles["mn-sub"]}>
                            {idx === 0
                              ? "Turning Points"
                              : idx === 1
                                ? "Enneagram"
                                : idx === 2
                                  ? "Roadblocks"
                                  : "360° View"}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* STAGE 3 */}
              <div className={styles["stage-col"]}>
                <div className={`${styles["stage-header"]} ${styles["sh-s"]}`}>
                  <div className={styles["stage-num-badge"]}>3</div>
                  <div>
                    <div className={styles["stage-name"]}>Surrender</div>
                    <div className={styles["stage-mods"]}>
                      1 module {!progress.surrender && "· Locked"}
                    </div>
                  </div>
                </div>
                <div className={styles["stage-body-s"]}>
                  {(() => {
                    const isCompleted = progress.mypurpose;
                    const isActive = progress.surrender && !progress.mypurpose;
                    const isLocked = !progress.surrender;

                    let statusClass = styles.locked;
                    if (isCompleted) statusClass = styles.completed;
                    else if (isActive) statusClass = styles.active;

                    return (
                      <Link
                        to={isLocked ? "#" : "/surrender"}
                        style={{
                          textDecoration: "none",
                          pointerEvents: isLocked ? "none" : "auto",
                        }}
                      >
                        <div className={`${styles["mod-node"]} ${statusClass}`}>
                          <div className={styles["mn-icon-row"]}>
                            <span className={styles["mn-icon"]}>
                              <i
                                className="fa fa-leaf"
                                style={{
                                  color: isCompleted
                                    ? "#27ae60"
                                    : isActive
                                      ? "#b8892a"
                                      : "rgba(255,255,255,0.3)",
                                }}
                              ></i>
                            </span>
                            <span
                              className={`${styles["mn-badge"]} ${isCompleted ? styles["mb-done"] : isActive ? styles["mb-active"] : styles["mb-locked"]}`}
                            >
                              <i
                                className={`fa ${isCompleted ? "fa-check" : isActive ? "fa-play" : "fa-lock"}`}
                              ></i>{" "}
                              {isCompleted
                                ? "Done"
                                : isActive
                                  ? "Active"
                                  : "Locked"}
                            </span>
                          </div>
                          <div className={styles["mn-title"]}>Surrender</div>
                          <div className={styles["mn-sub"]}>Surrender List</div>
                        </div>
                      </Link>
                    );
                  })()}
                </div>
              </div>

              {/* STAGE 4 */}
              <div className={styles["stage-col"]}>
                <div className={`${styles["stage-header"]} ${styles["sh-lp"]}`}>
                  <div className={styles["stage-num-badge"]}>4</div>
                  <div>
                    <div className={styles["stage-name"]}>LifePlan</div>
                    <div className={styles["stage-mods"]}>
                      3 modules {!progress.mypurpose && "· Locked"}
                    </div>
                  </div>
                </div>
                <div className={styles["stage-body-lp"]}>
                  {["My Purpose", "My Future", "Next Steps"].map(
                    (title, idx) => {
                      // const isActive = progress.mypurpose; // Or add more granular progress for LifePlan
                      const isLocked = !progress.mypurpose;

                      let statusClass = isLocked
                        ? styles.locked
                        : styles.active;

                      return (
                        <Link
                          key={idx}
                          to={isLocked ? "#" : "/my-purpose"}
                          style={{
                            textDecoration: "none",
                            pointerEvents: isLocked ? "none" : "auto",
                          }}
                        >
                          <div
                            className={`${styles["mod-node"]} ${statusClass}`}
                          >
                            <div className={styles["mn-icon-row"]}>
                              <span className={styles["mn-icon"]}>
                                <i
                                  className={`fa ${idx === 0 ? "fa-star-o" : idx === 1 ? "fa-sun-o" : "fa-list-ul"}`}
                                  style={{
                                    color: !isLocked
                                      ? "#c0392b"
                                      : "rgba(255,255,255,0.3)",
                                  }}
                                ></i>
                              </span>
                              <span
                                className={`${styles["mn-badge"]} ${!isLocked ? styles["mb-active"] : styles["mb-locked"]}`}
                              >
                                <i
                                  className={`fa ${!isLocked ? "fa-play" : "fa-lock"}`}
                                ></i>{" "}
                                {!isLocked ? "Active" : "Locked"}
                              </span>
                            </div>
                            <div className={styles["mn-title"]}>{title}</div>
                            <div className={styles["mn-sub"]}>
                              {idx === 0
                                ? "Mission Statement"
                                : idx === 1
                                  ? "Vision Statement"
                                  : "Action Plan"}
                            </div>
                          </div>
                        </Link>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className={styles["bottom-row"]}>
            <div className={styles["current-module-card"]}>
              <div className={styles["cm-eyebrow"]}>
                ▶ Continue Your Journey
              </div>
              <div className={styles["cm-title"]}>
                {progress.surrender
                  ? "My Purpose"
                  : progress.perspective
                    ? "Surrender"
                    : "Where I Am Now"}
              </div>
              <div className={styles["cm-sub"]}>
                {progress.surrender
                  ? "LifePlan · Module 8 of 10"
                  : progress.perspective
                    ? "Surrender · Module 7 of 10"
                    : "Current State Assessment · Module 2 of 10"}
              </div>
              <div className={styles["cm-desc"]}>
                {progress.surrender
                  ? "Distill your journey into a clear, personal Mission Statement rooted in your values and calling."
                  : progress.perspective
                    ? "Identify and release the beliefs and habits that have been holding you back from your full potential."
                    : "Take an honest look at where you stand today across the key domains of life with your AI guide."}
              </div>
              <div className={styles["cm-actions"]}>
                <Link
                  to={
                    progress.surrender
                      ? "/my-purpose"
                      : progress.perspective
                        ? "/surrender"
                        : "/introduction"
                  }
                  style={{ textDecoration: "none" }}
                >
                  <button className={styles["btn-primary"]}>
                    ▶ Open Module
                  </button>
                </Link>
                {progress.perspective && (
                  <Link to="/perspective" style={{ textDecoration: "none" }}>
                    <button className={styles["btn-ghost"]}>
                      Review Perspective
                    </button>
                  </Link>
                )}
              </div>
            </div>
            {/* 
            <div className={styles['stage-progress-card']}>
              <div className={styles['spc-title']}>Stage Overview</div>
              <div className={styles['stage-pill-row']}>
                <div className={`${styles['stage-pill']} ${styles.done}`}>
                  <span className={styles['sp-icon']}>
                    <i className="fa fa-leaf" style={{ color: '#27ae60' }}></i>
                  </span>
                  <div className={styles['sp-info']}>
                    <div className={styles['sp-name']}>Getting Started</div>
                    <div className={styles['sp-mods']}>1 of 2 modules done</div>
                  </div>
                  <span className={`${styles['sp-status']} ${styles['ss-active']}`}>In Progress</span>
                </div>

                {['Perspective', 'Surrender', 'LifePlan'].map((name, idx) => (
                  <div key={idx} className={`${styles['stage-pill']} ${styles.locked}`}>
                    <span className={styles['sp-icon']}>
                      <i className={`fa ${idx === 0 ? 'fa-binoculars' : idx === 1 ? 'fa-leaf' : 'fa-file-text-o'}`} style={{ color: 'rgba(255,255,255,0.3)' }}></i>
                    </span>
                    <div className={styles['sp-info']}>
                      <div className={styles['sp-name']}>{name}</div>
                      <div className={styles['sp-mods']}>{idx === 0 ? '4 modules' : idx === 1 ? '1 module' : '3 modules'}</div>
                    </div>
                    <span className={`${styles['sp-status']} ${styles['ss-locked']}`}>
                      <i className="fa fa-lock"></i> Locked
                    </span>
                  </div>
                ))}
              </div>
            </div>
             */}
          </div>
        </div>
      </div>

      <div className={styles["screen-badge"]}>Screen 1 of 6 — Dashboard</div>
    </div>
  );
};

export default Dashboard;
