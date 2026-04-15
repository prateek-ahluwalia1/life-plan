import { useEffect, useRef, useState } from "react";
import styles from "../css/WhereAmI.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";

const WhereIAmNow = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userdata = useSelector((state: RootState) => state.auth.userdata);

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

  return (
    <div className={styles.container}>
      <div className={styles.bg}></div>

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

      <div className={styles["stage-bar"]}>
        <span className={styles["sb-label"]}>Stage 1 — Getting Started</span>
        <div className={styles["sb-track"]}>
          <div className={styles["sb-fill"]}></div>
        </div>
        <span className={styles["sb-count"]}>1 / 2 modules complete</span>
      </div>

      <div className={styles.layout}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
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
          {/* <button className={styles['sb-btn']}>
            <Link to="/journey-complete" style={{ textDecoration: 'none', color: 'grey' }}>
              <svg className={styles.icon} viewBox="0 0 24 24">
                <path d="M3 12h18M3 12l7-7M3 12l7 7" />
                <circle cx="17" cy="12" r="4" />
              </svg>
              <span className={styles['sb-tip']}>My Journey</span>
            </Link>
          </button> */}
          <button className={styles["sb-btn"]} style={{ color: "grey" }}>
            <svg className={styles.icon} viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className={styles["sb-tip"]}>Deliverables</span>
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
        </aside>

        {/* CONTENT */}
        <div className={styles.content}>
          {/* LEFT PANEL */}
          <div className={styles["left-panel"]}>
            {/* MODULE HEADER */}
            <div className={styles["mod-header"]}>
              <div className={styles["mod-eyebrow"]}>
                📍 Stage 1 · Getting Started · Module 2 of 10
              </div>
              <div className={styles["mod-title"]}>Where I Am Now</div>
              <div className={styles["mod-subtitle"]}>
                Current State Assessment — A 360° View of My Life Right Now
              </div>
              <div className={styles["mod-desc"]}>
                Before charting a path forward, you need an honest picture of
                where you stand today. This module helps you assess your current
                season across the key domains of life — not to judge, but to see
                clearly.
              </div>
              <div className={styles["instruction-box"]}>
                <div className={styles["ib-title"]}>
                  <i className="fa fa-microchip" style={{ color: "#fff" }}></i>{" "}
                  How This Works
                </div>
                <div className={styles["ib-text"]}>
                  Your AI guide on the right will walk you through each life
                  domain — one at a time. Answer openly and honestly. When
                  finished, save your summary in the box below. You can always
                  return to edit.
                </div>
              </div>
            </div>

            {/*** Live GPT Output Table ***/}

            {/* DOMAIN TRACKER */}
            {/* <div className={styles['domain-tracker']}>
              <div className={styles['dt-title']}><i className="fa fa-sitemap" style={{ color: '#fff' }}></i> Life Domain Progress</div>
              <div className={styles['dt-steps']}>
                <div className={`${styles['dt-step']} ${styles.done}`}>
                  <div className={styles['dt-dot']}>✓</div>
                  <div className={styles['dt-label']}>Personal</div>
                </div>
                <div className={`${styles['dt-step']} ${styles.done}`}>
                  <div className={styles['dt-dot']}>✓</div>
                  <div className={styles['dt-label']}>Family &amp; Friends</div>
                </div>
                <div className={`${styles['dt-step']} ${styles.active}`}>
                  <div className={styles['dt-dot']}>▶</div>
                  <div className={styles['dt-label']}>Vocation</div>
                </div>
                <div className={styles['dt-step']}>
                  <div className={styles['dt-dot']}>4</div>
                  <div className={styles['dt-label']}>Church &amp; Kingdom</div>
                </div>
                <div className={styles['dt-step']}>
                  <div className={styles['dt-dot']}>5</div>
                  <div className={styles['dt-label']}>Community</div>
                </div>
              </div>
            </div> */}

            {/* SAVE SECTION */}
            {/* <div className={styles['save-section']}>
              <div className={styles['save-title']}>
                <i className="fa fa-floppy-o" style={{ color: '#fff', marginRight: '8px' }}></i>
                Save Your Deliverable
              </div>
              <div className={styles['save-sub']}>
                After your AI conversation, write or paste your Current State summary here. Required to complete this module.
              </div>
              <textarea 
                className={styles['save-textarea']} 
                placeholder={`Write your Current State Assessment here...\n\nPersonal: ...\nFamily & Friends: ...\nVocation: ...\nChurch & Kingdom: ...\nCommunity: ...`}
              ></textarea>

              <div className={styles['save-actions']}>
                <button className={styles['btn-complete']}>
                  <i className="fa fa-check-circle"></i> Save &amp; Mark Complete
                </button>
                <button className={styles['btn-primary']}>
                  <i className="fa fa-save"></i> Save Draft
                </button>
                <button className={styles['btn-ghost']}>
                  <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa fa-th-large"></i> Dashboard
                  </Link>
                </button>
              </div>
            </div> */}
          </div>

          {/* RIGHT PANEL — CHAT */}
          <div className={styles["right-panel"]}>
            <div className={styles["chat-window"]}>
              <div className={styles["chat-header"]}>
                <div className={styles["chat-ai-avatar"]}>✦</div>
                <div>
                  <div className={styles["chat-ai-name"]}>
                    LifePlan AI Guide
                  </div>
                  <div className={styles["chat-ai-status"]}>
                    <div className={styles["online-dot"]}></div>
                    Current State Assessment
                  </div>
                </div>
                <div className={styles["chat-module-tag"]}>Module 2 / 10</div>
              </div>

              <div className={styles["chat-messages"]}>
                <div className={styles.msg}>
                  <div className={`${styles["msg-av"]} ${styles.ai}`}>✦</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.ai}`}>
                      Welcome, {userdata?.name || "there"}. I'm here to walk with you through your
                      Current State Assessment.
                      <br />
                      <br />
                      This isn't a test — it's simply a chance to see where you
                      are today, across the different areas of your life. We'll
                      move through each domain at your pace.
                      <br />
                      <br />
                      Let's start with your <strong>personal life</strong>. When
                      you sit with yourself quietly — how would you describe
                      your inner world right now?
                    </div>
                    <div className={styles["msg-time"]}>LifePlan Guide</div>
                  </div>
                </div>

                <div className={`${styles.msg} ${styles.user}`}>
                  <div className={`${styles["msg-av"]} ${styles.user}`}>RG</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.user}`}>
                      Honestly, there's a restlessness I can't quite shake. I've
                      been successful by most measures but something feels...
                      unfinished. Like I'm moving through life on autopilot.
                    </div>
                    <div className={styles["msg-time"]}>{userdata?.name || "there"}</div>
                  </div>
                </div>

                <div className={styles.msg}>
                  <div className={`${styles["msg-av"]} ${styles.ai}`}>✦</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.ai}`}>
                      That's a really significant thing to name, {userdata?.name || "there"}.
                      "Successful but restless" — that tension is actually one
                      of the most important clues we can start with.
                      <br />
                      <br />
                      When you say it feels unfinished — is there a particular
                      area of life where that feeling is loudest?
                    </div>
                    <div className={styles["msg-time"]}>LifePlan Guide</div>
                  </div>
                </div>

                <div className={`${styles.msg} ${styles.user}`}>
                  <div className={`${styles["msg-av"]} ${styles.user}`}>RG</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.user}`}>
                      My work, for sure. I've built something I'm proud of, but
                      I'm not sure it's what I'm supposed to be doing long-term.
                      And spiritually, I feel like I've been coasting.
                    </div>
                    <div className={styles["msg-time"]}>{userdata?.name || "there"}</div>
                  </div>
                </div>

                <div className={styles.msg}>
                  <div className={`${styles["msg-av"]} ${styles.ai}`}>✦</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.ai}`}>
                      Good. Let's hold both of those — we'll come back to each
                      in depth.
                      <br />
                      <br />
                      You mentioned coasting spiritually. That word is
                      interesting — coasting suggests you know there's a deeper
                      current you're not fully in. What does a{" "}
                      <strong>more connected</strong> spiritual life look like
                      for you, even if it's just a memory or a feeling?
                    </div>
                    <div className={styles["msg-time"]}>LifePlan Guide</div>
                  </div>
                </div>

                <div className={`${styles.msg} ${styles.user}`}>
                  <div className={`${styles["msg-av"]} ${styles.user}`}>RG</div>
                  <div className={styles["msg-body"]}>
                    <div className={`${styles.bubble} ${styles.user}`}>
                      There have been seasons where prayer felt natural, even
                      joyful. Morning time with God before everything got loud.
                      That's been rare lately.
                    </div>
                    <div className={styles["msg-time"]}>Ron</div>
                  </div>
                </div>

                <div className={styles.msg}>
                  <div className={`${styles["msg-av"]} ${styles.ai}`}>✦</div>
                  <div className={styles["msg-body"]}>
                    <div className={styles["typing-bubble"]}>
                      <div className={styles["t-dot"]}></div>
                      <div className={styles["t-dot"]}></div>
                      <div className={styles["t-dot"]}></div>
                    </div>
                    <div className={styles["msg-time"]}>
                      LifePlan Guide · typing...
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles["chat-input-area"]}>
                <textarea
                  className={styles["chat-input"]}
                  placeholder="Share your thoughts..."
                  rows={1}
                ></textarea>
                <button className={styles["send-btn"]}>➤</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles["screen-badge"]}>
        Screen 2 of 6 — Module 2: Where I Am Now
      </div>
    </div>
  );
};

export default WhereIAmNow;
