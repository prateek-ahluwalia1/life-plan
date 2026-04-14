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
  saveLifePlanDeliverablesToServer,
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
  const [deliverables, setDeliverables] = useState({
    missionStatement: "",
    visionStatement: "",
    actionPlan: "",
  });
  const [draftDeliverables, setDraftDeliverables] = useState({
    missionStatement: "",
    visionStatement: "",
    actionPlan: "",
  });
  const [saveStateByKey, setSaveStateByKey] = useState<
    Record<"missionStatement" | "visionStatement" | "actionPlan", string>
  >({
    missionStatement: "",
    visionStatement: "",
    actionPlan: "",
  });
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
            missionStatement?: string;
            visionStatement?: string;
            actionPlan?: string;
          };
        };

        if (isCancelled || !json.data) {
          return;
        }

        if (json.data.progress) {
          setProgress(json.data.progress);
        }

        setDeliverables({
          missionStatement: json.data.missionStatement || "",
          visionStatement: json.data.visionStatement || "",
          actionPlan: json.data.actionPlan || "",
        });
        setDraftDeliverables({
          missionStatement: json.data.missionStatement || "",
          visionStatement: json.data.visionStatement || "",
          actionPlan: json.data.actionPlan || "",
        });
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

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  const downloadDeliverablePdf = (
    document: "mission" | "vision" | "action",
  ) => {
    if (!token) {
      return;
    }

    void downloadModulePdfFromServer(
      token,
      `modules/life-plan-modules/pdf/${document}`,
      `${document}-statement.pdf`,
    );
  };

  const downloadAllDeliverables = () => {
    if (!token) {
      return;
    }

    downloadDeliverablePdf("mission");
    setTimeout(() => downloadDeliverablePdf("vision"), 250);
    setTimeout(() => downloadDeliverablePdf("action"), 500);
  };

  const saveDeliverableField = async (
    key: "missionStatement" | "visionStatement" | "actionPlan",
  ) => {
    if (!token) {
      return;
    }

    setSaveStateByKey((prev) => ({ ...prev, [key]: "Saving..." }));

    const cleaned = draftDeliverables[key].trim();
    const ok = await saveLifePlanDeliverablesToServer(token, {
      [key]: cleaned,
    });

    if (!ok) {
      setSaveStateByKey((prev) => ({ ...prev, [key]: "Save failed" }));
      return;
    }

    setDeliverables((prev) => ({ ...prev, [key]: cleaned }));
    setSaveStateByKey((prev) => ({ ...prev, [key]: "Saved" }));

    setTimeout(() => {
      setSaveStateByKey((prev) => ({
        ...prev,
        [key]: prev[key] === "Saved" ? "" : prev[key],
      }));
    }, 1800);
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

          {/* DELIVERABLES */}
          <div className={styles["deliverables-section"]}>
            <div className={styles["section-header"]}>
              <div>
                <div className={styles["section-title"]}>
                  Your Three Deliverables
                </div>
                <div className={styles["section-sub"]}>
                  Not aspirational. Not generic. Uniquely yours — the lived
                  expression of an integrated, wholehearted life.
                </div>
              </div>
              <button
                className={styles["btn-download-all"]}
                onClick={downloadAllDeliverables}
                type="button"
              >
                ⬇ Download All 3 PDFs
              </button>
            </div>

            <div className={styles["deliverables-grid"]}>
              {[
                {
                  id: 1,
                  title: "Personal Mission Statement",
                  icon: "fa-quote-left",
                  pdfKey: "mission" as const,
                  fieldKey: "missionStatement" as const,
                  text:
                    deliverables.missionStatement ||
                    "No mission statement has been saved yet.",
                },
                {
                  id: 2,
                  title: "Vision Statement",
                  icon: "fa-eye",
                  pdfKey: "vision" as const,
                  fieldKey: "visionStatement" as const,
                  text:
                    deliverables.visionStatement ||
                    "No vision statement has been saved yet.",
                },
                {
                  id: 3,
                  title: "Purpose-Aligned Action Plan",
                  icon: "fa-list-ul",
                  pdfKey: "action" as const,
                  fieldKey: "actionPlan" as const,
                  text:
                    deliverables.actionPlan ||
                    "No action plan has been saved yet.",
                },
              ].map((doc) => (
                <div className={styles["doc-card"]} key={doc.id}>
                  <div
                    className={`${styles["dc-head"]} ${styles[`dc${doc.id}-head`]}`}
                  >
                    <div className={styles["dc-icon"]}>
                      <i
                        className={`fa ${doc.icon}`}
                        style={{ color: "#5ddb8e" }}
                      ></i>
                    </div>
                    <div className={styles["dc-label"]}>Document {doc.id}</div>
                    <div className={styles["dc-title"]}>{doc.title}</div>
                  </div>
                  <div className={styles["dc-body"]}>
                    <div className={styles["dc-preview"]}>"{doc.text}"</div>
                    <textarea
                      value={draftDeliverables[doc.fieldKey]}
                      onChange={(event) =>
                        setDraftDeliverables((prev) => ({
                          ...prev,
                          [doc.fieldKey]: event.target.value,
                        }))
                      }
                      placeholder={`Write or edit your ${doc.title.toLowerCase()} here...`}
                      style={{
                        width: "100%",
                        minHeight: "96px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(8,10,15,0.35)",
                        color: "#e8edf4",
                        padding: "10px 12px",
                        marginBottom: "10px",
                        fontSize: "0.88rem",
                        resize: "vertical",
                      }}
                    />
                    <div className={styles["dc-actions"]}>
                      <button
                        className={styles["dc-btn-view"]}
                        onClick={() => saveDeliverableField(doc.fieldKey)}
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        className={styles["dc-btn-dl"]}
                        onClick={() => downloadDeliverablePdf(doc.pdfKey)}
                        type="button"
                      >
                        ⬇ PDF
                      </button>
                      <button className={styles["dc-btn-view"]} type="button">
                        {saveStateByKey[doc.fieldKey] || "Ready"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
