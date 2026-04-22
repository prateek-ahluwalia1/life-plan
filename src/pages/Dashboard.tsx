import { useState, useEffect, useRef } from "react";
import styles from "../css/Dashboard.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL } from "../utils/exports";

type LifePlanProgress = {
  whyiamhere: boolean;
  whereiam: boolean;
  perspective: boolean;
  surrender: boolean;
  mypurpose: boolean;
};

type LifePlanData = {
  progress: LifePlanProgress;
  surrenderItems: string[];
  missionStatement: string;
  visionStatement: string;
  actionPlan: string;
};

const defaultData: LifePlanData = {
  progress: {
    whyiamhere: false,
    whereiam: false,
    perspective: false,
    surrender: false,
    mypurpose: false,
  },
  surrenderItems: [],
  missionStatement: "",
  visionStatement: "",
  actionPlan: "",
};

const Dashboard = () => {
  const [moduleData, setModuleData] = useState<LifePlanData>(defaultData);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const userdata = useSelector((state: RootState) => state.auth.userdata);
  const token = useSelector((state: RootState) => state.auth.token);
  const navigate = useNavigate();

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
    if (!token) return;

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

        if (!response.ok) return;

        const json = (await response.json()) as {
          data?: Partial<LifePlanData>;
        };

        if (isCancelled || !json.data) return;

        setModuleData({
          progress: {
            ...defaultData.progress,
            ...json.data.progress,
          },
          surrenderItems: json.data.surrenderItems || [],
          missionStatement: json.data.missionStatement || "",
          visionStatement: json.data.visionStatement || "",
          actionPlan: json.data.actionPlan || "",
        });
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

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  // ==========================================
  // STRICT SEQUENTIAL LOGIC 
  // ==========================================
  const progress = moduleData.progress;

  // Module 1 (Always unlocked, active if not done)
  const mod1Done = progress.whyiamhere;
  const mod1Active = !progress.whyiamhere;

  // Module 2 (Unlocks ONLY if Mod 1 is done)
  const mod2Done = progress.whereiam;
  const mod2Active = progress.whyiamhere && !progress.whereiam;
  const mod2Locked = !progress.whyiamhere;

  // Stage 2 (Unlocks ONLY if Mod 2 is done)
  const stage2Done = progress.perspective;
  const stage2Active = progress.whereiam && !progress.perspective;
  const stage2Locked = !progress.whereiam;

  // Stage 3 (Unlocks ONLY if Stage 2 is done)
  const stage3Done = progress.surrender;
  const stage3Active = progress.perspective && !progress.surrender;
  const stage3Locked = !progress.perspective;

  // Stage 4 (Unlocks ONLY if Stage 3 is done)
  const stage4Done = progress.mypurpose;
  const stage4Active = progress.surrender && !progress.mypurpose;
  const stage4Locked = !progress.surrender;

  // --- Stats Calculations ---
  const modulesComplete =
    (mod1Done ? 1 : 0) +
    (mod2Done ? 1 : 0) +
    (stage2Done ? 4 : 0) +
    (stage3Done ? 1 : 0) +
    (stage4Done ? 3 : 0);

  const progressPercent = Math.round((modulesComplete / 10) * 100);

  const stagesUnlocked =
    1 +
    (mod2Done ? 1 : 0) +
    (stage2Done ? 1 : 0) +
    (stage3Done ? 1 : 0);

  // --- Dynamic "Next Step" Router ---
  // This logic guarantees the "Open Module" button routes exactly to the next incomplete stage.
  const continueInfo = (() => {
    if (stage4Done) {
      return {
        stageName: "LifePlan", title: "Review Journey", sub: "All Stages Complete",
        desc: "You have completed the entire LifePlan journey.", link: "/journey-complete", actionText: "▶ View Deliverables"
      };
    }
    if (stage3Done) {
      return {
        stageName: "LifePlan", title: "My Purpose", sub: "LifePlan · Module 8 of 10",
        desc: "Distill your journey into a clear, personal Mission Statement rooted in your values and calling.", link: "/my-purpose", actionText: "▶ Open Module"
      };
    }
    if (stage2Done) {
      return {
        stageName: "Surrender", title: "Surrender", sub: "Surrender · Module 7 of 10",
        desc: "Identify and release the beliefs and habits that have been holding you back from your full potential.", link: "/surrender", actionText: "▶ Open Module"
      };
    }
    if (mod2Done) {
      return {
        stageName: "Perspective", title: "Perspective", sub: "Perspective · Module 3 of 10",
        desc: "Look back at your turning points and understand how you are uniquely wired.", link: "/perspective", actionText: "▶ Open Stage"
      };
    }
    if (mod1Done) {
      return {
        stageName: "Getting Started", title: "Where I Am Now", sub: "Current State Assessment · Module 2 of 10",
        desc: "Take an honest look at where you stand today across the key domains of life with your AI guide.", link: "/where-i-am-now", actionText: "▶ Open Module"
      };
    }
    return {
      stageName: "Getting Started", title: "Why I Am Here", sub: "Goals by Domain · Module 1 of 10",
      desc: "Define your core objectives and clarify what you hope to achieve in your LifePlan.", link: "/introduction", actionText: "▶ Open Module"
    };
  })();

  return (
    <div className={styles.container}>
      <div className={styles.bg}></div>

      {/* NAVIGATION */}
      <nav className={styles.nav}>
        <div className={styles["nav-brand"]}>
          <Link to="/" className={styles["nav-home-link"]} aria-label="Back to homepage" title="Go to homepage">
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
              <button type="button" className={styles["profile-menu-item"]} onClick={handleLogout}>
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

          <Link to={"/journey-complete"} state={{ hideHero: true }} className={styles["sb-btn"]} style={{ color: "grey" }}>
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
          <button onClick={handleLogout} className={styles["sb-btn"]} style={{ color: "grey" }}>
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
              <div className={styles["wb-tag"]}>Your LifePlan Journey Dashboard</div>
              <div className={styles["wb-title"]}>Welcome back, {userdata?.name || "there"}!</div>
              <div className={styles["wb-sub"]}>
                {stage4Done ? (
                  <>
                    You've reached Stage 4 · LifePlan
                    <br />
                    <span style={{ color: "white", fontStyle: "italic" }}>
                      {moduleData.missionStatement
                        ? `"${moduleData.missionStatement.substring(0, 65)}${moduleData.missionStatement.length > 65 ? '...' : ''}"`
                        : "Your vision is becoming clear."}
                    </span>
                  </>
                ) : (
                  <>
                    You're in Stage {stagesUnlocked} · {continueInfo.stageName} · Module {Math.min(modulesComplete + 1, 10)} of 10
                    <br />
                    Take each step with intention.
                  </>
                )}
              </div>
              <div className={styles["wb-scripture"]}>
                "For I know the plans I have for you," declares the Lord — Jeremiah 29:11
              </div>
            </div>
            <Link to={continueInfo.link} style={{ textDecoration: "none", color: "white" }} className={styles["wb-right"]}>
              <button className={styles["continue-btn"]}>{continueInfo.actionText}</button>
            </Link>
          </div>

          {/* STATS ROW */}
          <div className={styles["stats-row"]}>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Overall Progress</div>
              <div className={styles["stat-val"]}>{progressPercent}<span>%</span></div>
              <div className={styles["stat-sub"]}>Journey underway</div>
              <div className={styles["prog-bar"]}>
                <div className={styles["prog-fill"]} style={{ width: `${progressPercent}%`, background: "var(--gs)" }}></div>
              </div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Modules Complete</div>
              <div className={styles["stat-val"]}>{modulesComplete}<span> / 10</span></div>
              <div className={styles["stat-sub"]}>{Math.max(0, 10 - modulesComplete)} remaining</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Current Stage</div>
              <div className={styles["stat-val"]} style={{ fontSize: "16px", marginTop: "4px", color: "#7dd3f0" }}>
                {continueInfo.stageName}
              </div>
              <div className={styles["stat-sub"]}>Stage {stagesUnlocked} of 4</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Stages Unlocked</div>
              <div className={styles["stat-val"]}>{stagesUnlocked} <span>/ 4</span></div>
              <div className={styles["stat-sub"]}>{Math.max(0, 4 - stagesUnlocked)} stages locked</div>
            </div>
          </div>

          {/* JOURNEY ROADMAP */}
          <div className={styles["roadmap-card"]}>
            <div className={styles["roadmap-header"]}>
              <div>
                <div className={styles["roadmap-title"]}>The LifePlan Journey</div>
                <div className={styles["roadmap-sub"]}>4 Stages · 10 Modules · Your complete guided path</div>
              </div>
              <div className={styles["stage-legend"]}>
                <div className={styles["leg-item"]}><div className={styles["leg-dot"]} style={{ background: "var(--done)" }}></div>Completed</div>
                <div className={styles["leg-item"]}><div className={styles["leg-dot"]} style={{ background: "var(--gs)" }}></div>In Progress</div>
                <div className={styles["leg-item"]}><div className={styles["leg-dot"]} style={{ background: "rgba(255,255,255,0.25)" }}></div>Locked</div>
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
                  {/* MODULE 1 */}
                  <Link to="/introduction" style={{ textDecoration: "none" }}>
                    <div className={`${styles["mod-node"]} ${mod1Done ? styles.completed : mod1Active ? styles.active : styles.locked}`}>
                      <div className={styles["mn-icon-row"]}>
                        <span className={styles["mn-icon"]}>
                          <i className="fa fa-bullseye" style={{ color: mod1Done ? "#27ae60" : mod1Active ? "#3a8fb5" : "rgba(255,255,255,0.3)" }}></i>
                        </span>
                        <span className={`${styles["mn-badge"]} ${mod1Done ? styles["mb-done"] : mod1Active ? styles["mb-active"] : styles["mb-locked"]}`}>
                          <i className={`fa ${mod1Done ? "fa-check" : mod1Active ? "fa-play" : "fa-lock"}`}></i> {mod1Done ? "Done" : mod1Active ? "Active" : "Locked"}
                        </span>
                      </div>
                      <div className={styles["mn-title"]}>Why I Am Here</div>
                      <div className={styles["mn-sub"]}>Goals by Domain</div>
                    </div>
                  </Link>

                  {/* MODULE 2 */}
                  <Link to={mod2Locked ? "#" : "/where-i-am-now"} style={{ textDecoration: "none", pointerEvents: mod2Locked ? "none" : "auto" }}>
                    <div className={`${styles["mod-node"]} ${mod2Done ? styles.completed : mod2Active ? styles.active : styles.locked}`}>
                      <div className={styles["mn-icon-row"]}>
                        <span className={styles["mn-icon"]}>
                          <i className="fa fa-search" style={{ color: mod2Done ? "#27ae60" : mod2Active ? "#3a8fb5" : "rgba(255,255,255,0.3)" }}></i>
                        </span>
                        <span className={`${styles["mn-badge"]} ${mod2Done ? styles["mb-done"] : mod2Active ? styles["mb-active"] : styles["mb-locked"]}`}>
                          <i className={`fa ${mod2Done ? "fa-check" : mod2Active ? "fa-play" : "fa-lock"}`}></i> {mod2Done ? "Done" : mod2Active ? "Active" : "Locked"}
                        </span>
                      </div>
                      <div className={styles["mn-title"]}>Where I Am Now</div>
                      <div className={styles["mn-sub"]}>Current State Assessment</div>
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
                      4 modules {stage2Locked && "· Locked"}
                    </div>
                  </div>
                </div>

                <div className={styles["stage-body-p"]}>
                  {["How I Got Here", "How I'm Wired", "What Stops Me", "Perspective"].map((title, idx) => {
                    let statusClass = styles.locked;
                    if (stage2Done) statusClass = styles.completed;
                    else if (stage2Active) statusClass = styles.active;

                    return (
                      <Link
                        key={idx}
                        to={stage2Locked ? "#" : "/perspective"}
                        style={{ textDecoration: "none", pointerEvents: stage2Locked ? "none" : "auto" }}
                      >
                        <div className={`${styles["mod-node"]} ${statusClass}`}>
                          <div className={styles["mn-icon-row"]}>
                            <span className={styles["mn-icon"]}>
                              <i
                                className={`fa ${idx === 0 ? "fa-history" : idx === 1 ? "fa-connectdevelop" : idx === 2 ? "fa-shield" : "fa-binoculars"}`}
                                style={{ color: stage2Done ? "#27ae60" : stage2Active ? "#c490f0" : "rgba(255,255,255,0.3)" }}
                              ></i>
                            </span>
                            <span className={`${styles["mn-badge"]} ${stage2Done ? styles["mb-done"] : stage2Active ? styles["mb-active"] : styles["mb-locked"]}`}>
                              <i className={`fa ${stage2Done ? "fa-check" : stage2Active ? "fa-play" : "fa-lock"}`}></i> {stage2Done ? "Done" : stage2Active ? "Active" : "Locked"}
                            </span>
                          </div>
                          <div className={styles["mn-title"]}>{title}</div>
                          <div className={styles["mn-sub"]}>
                            {idx === 0 ? "Turning Points" : idx === 1 ? "Enneagram" : idx === 2 ? "Roadblocks" : "360° View"}
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
                      1 module {stage3Locked && "· Locked"}
                    </div>
                  </div>
                </div>
                <div className={styles["stage-body-s"]}>
                  <Link
                    to={stage3Locked ? "#" : "/surrender"}
                    style={{ textDecoration: "none", pointerEvents: stage3Locked ? "none" : "auto" }}
                  >
                    <div className={`${styles["mod-node"]} ${stage3Done ? styles.completed : stage3Active ? styles.active : styles.locked}`}>
                      <div className={styles["mn-icon-row"]}>
                        <span className={styles["mn-icon"]}>
                          <i className="fa fa-leaf" style={{ color: stage3Done ? "#27ae60" : stage3Active ? "#b8892a" : "rgba(255,255,255,0.3)" }}></i>
                        </span>
                        <span className={`${styles["mn-badge"]} ${stage3Done ? styles["mb-done"] : stage3Active ? styles["mb-active"] : styles["mb-locked"]}`}>
                          <i className={`fa ${stage3Done ? "fa-check" : stage3Active ? "fa-play" : "fa-lock"}`}></i> {stage3Done ? "Done" : stage3Active ? "Active" : "Locked"}
                        </span>
                      </div>
                      <div className={styles["mn-title"]}>Surrender</div>
                      <div className={styles["mn-sub"]}>Surrender List</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* STAGE 4 */}
              <div className={styles["stage-col"]}>
                <div className={`${styles["stage-header"]} ${styles["sh-lp"]}`}>
                  <div className={styles["stage-num-badge"]}>4</div>
                  <div>
                    <div className={styles["stage-name"]}>LifePlan</div>
                    <div className={styles["stage-mods"]}>
                      3 modules {stage4Locked && "· Locked"}
                    </div>
                  </div>
                </div>
                <div className={styles["stage-body-lp"]}>
                  {["My Purpose", "My Future", "Next Steps"].map((title, idx) => {
                    let statusClass = stage4Locked ? styles.locked : styles.active;
                    if (stage4Done) statusClass = styles.completed;

                    return (
                      <Link
                        key={idx}
                        to={stage4Locked ? "#" : "/my-purpose"}
                        style={{ textDecoration: "none", pointerEvents: stage4Locked ? "none" : "auto" }}
                      >
                        <div className={`${styles["mod-node"]} ${statusClass}`}>
                          <div className={styles["mn-icon-row"]}>
                            <span className={styles["mn-icon"]}>
                              <i
                                className={`fa ${idx === 0 ? "fa-star-o" : idx === 1 ? "fa-sun-o" : "fa-list-ul"}`}
                                style={{ color: stage4Done ? "#27ae60" : stage4Active ? "#c0392b" : "rgba(255,255,255,0.3)" }}
                              ></i>
                            </span>
                            <span className={`${styles["mn-badge"]} ${stage4Done ? styles["mb-done"] : stage4Active ? styles["mb-active"] : styles["mb-locked"]}`}>
                              <i className={`fa ${stage4Done ? "fa-check" : stage4Active ? "fa-play" : "fa-lock"}`}></i> {stage4Done ? "Done" : stage4Active ? "Active" : "Locked"}
                            </span>
                          </div>
                          <div className={styles["mn-title"]}>{title}</div>
                          <div className={styles["mn-sub"]}>
                            {idx === 0 ? "Mission Statement" : idx === 1 ? "Vision Statement" : "Action Plan"}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className={styles["bottom-row"]}>
            <div className={styles["current-module-card"]}>
              <div className={styles["cm-eyebrow"]}>▶ Continue Your Journey</div>
              <div className={styles["cm-title"]}>{continueInfo.title}</div>
              <div className={styles["cm-sub"]}>{continueInfo.sub}</div>

              {/* DYNAMIC TEXT */}
              <div className={styles["cm-desc"]}>
                {stage4Done
                  ? "You have completed the entire LifePlan journey."
                  : stage3Done && moduleData.missionStatement
                    ? `Current Focus: Finalizing your LifePlan.\nMission: "${moduleData.missionStatement.substring(0, 80)}..."`
                    : stage3Done
                      ? continueInfo.desc
                      : stage2Done && moduleData.surrenderItems.length > 0
                        ? `Current Focus: Surrendering.\nYou are currently working on releasing things like: "${moduleData.surrenderItems[0].substring(0, 50)}..."`
                        : continueInfo.desc}
              </div>

              <div className={styles["cm-actions"]}>
                <Link to={continueInfo.link} style={{ textDecoration: "none" }}>
                  <button className={styles["btn-primary"]}>{continueInfo.actionText}</button>
                </Link>
                {mod2Done && (
                  <Link to="/perspective" style={{ textDecoration: "none" }}>
                    <button className={styles["btn-ghost"]}>Review Perspective</button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles["screen-badge"]}>Screen 1 of 6 — Dashboard</div>
    </div>
  );
};

export default Dashboard;