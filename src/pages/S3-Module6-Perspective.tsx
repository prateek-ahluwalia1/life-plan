import { useEffect, useRef, useState } from "react";
import styles from "../css/Module6.module.css";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL } from "../utils/exports";
import useModuleAccess from "../hooks/useModuleAccess";
import ModuleGatingBlock from "../components/ModuleGatingBlock";
import { requestModuleRestart, confirmModuleRestart } from "../utils/moduleHelpers";

interface ModuleState {
  myStory: string;
  strengths: string;
  challenges: string;
  values: string;
  purposeStatement: string;
  spiritualPath: string;
  relationships: string;
  nextSteps: string;
  reflectionNotes: string;
  isComplete: boolean;
}

const PerspectiveModule = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const userdata = useSelector((state: RootState) => state.auth.userdata);
  const token = useSelector((state: RootState) => state.auth.token);

  const { isLocked } = useModuleAccess("perspective");
  const [restartConfirmId, setRestartConfirmId] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState<ModuleState>({
    myStory: "",
    strengths: "",
    challenges: "",
    values: "",
    purposeStatement: "",
    spiritualPath: "",
    relationships: "",
    nextSteps: "",
    reflectionNotes: "",
    isComplete: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

    const loadModuleData = async () => {
      try {
        const response = await fetch(`${apiURL}modules/perspective/module-6`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setModuleData(data.data || moduleData);
        }
      } catch (error) {
        console.error("Failed to load module data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModuleData();
  }, [token]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!token || isLoading) return;
      saveModuleData();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [moduleData]);

  const saveModuleData = async () => {
    if (!token) return;

    setIsSaving(true);
    try {
      await fetch(`${apiURL}modules/perspective/module-6`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(moduleData),
      });
    } catch (error) {
      console.error("Failed to save module data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  const handleRestart = async () => {
    if (!token) return;

    try {
      const result = await requestModuleRestart(token, "modules/perspective/module-6");
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
      await confirmModuleRestart(token, "modules/perspective/module-6", restartConfirmId);
      setShowRestartConfirm(false);
      setRestartConfirmId(null);
      window.location.reload();
    } catch (err) {
      console.error("Failed to confirm restart:", err);
    }
  };

  if (isLocked) {
    return (
      <ModuleGatingBlock
        moduleName="Perspective"
        requiredModules={["where-i-am-now"]}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const handleCompleteModule = async () => {
    if (!token) return;

    setIsSaving(true);
    try {
      await fetch(`${apiURL}modules/life-plan-modules`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          progress: {
            perspective: true,
            module3: true,
            module4: true,
            module5: true,
            module6: true,
          },
        }),
      });

      navigate("/surrender");
    } catch (error) {
      console.error("Failed to complete module:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.bg}></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <div>Loading module...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.bg}></div>

      {/* NAVIGATION */}
      <nav className={styles.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => navigate("/perspective")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className={styles["nav-logo"]}>
            YourLifePlanJourney<span>.com</span>
          </div>
        </div>
        <div className={styles.breadcrumb}>
          <strong>Perspective</strong>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>— Module 6 of 10</span>
        </div>
        <div ref={profileMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className={styles["nav-avatar"]}
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            style={{ border: "none", background: "transparent", color: "white", cursor: "pointer" }}
          >
            {profileInitials}
          </button>
          {isProfileMenuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                minWidth: "120px",
                background: "#1f2937",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                padding: "8px",
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
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className={styles.content}>
        {/* MODULE HEADER */}
        <div className={styles["module-header"]}>
          <div className={styles["module-number"]}>Module 6 of 10</div>
          <h1 className={styles["module-title"]}>360° Perspective</h1>
          <p className={styles["module-subtitle"]}>Integrated Life View</p>
          <p className={styles["module-description"]}>
            Integrate everything you've discovered. See your complete picture — past, present, and future — across all dimensions of your life.
          </p>
        </div>

        {/* MY STORY */}
        <div className={styles.section}>
          <h2 className={styles["section-title"]}>My Complete Story</h2>
          <p className={styles["section-description"]}>Summarize your life story integrating all you've learned about your past, patterns, and self-understanding.</p>
          <textarea
            className={styles.textarea}
            placeholder="A narrative integrating your turning points, how you're wired, what's held you back, and how you've overcome..."
            rows={8}
            value={moduleData.myStory}
            onChange={(e) => setModuleData({ ...moduleData, myStory: e.target.value })}
          />
        </div>

        {/* INTEGRATED VIEW */}
        <div className={styles["two-col"]}>
          <div className={styles.section}>
            <h2 className={styles["section-title"]}>My Integrated Strengths</h2>
            <p className={styles["section-description"]}>Synthesizing everything, what are your greatest strengths and capacities?</p>
            <textarea
              className={styles.textarea}
              placeholder="Talents, character strengths, spiritual gifts, relational abilities..."
              rows={6}
              value={moduleData.strengths}
              onChange={(e) => setModuleData({ ...moduleData, strengths: e.target.value })}
            />
          </div>

          <div className={styles.section}>
            <h2 className={styles["section-title"]}>My Heart Challenges</h2>
            <p className={styles["section-description"]}>What challenges remain? What am I still working through?</p>
            <textarea
              className={styles.textarea}
              placeholder="Growth areas, ongoing struggles, patterns I'm learning to break..."
              rows={6}
              value={moduleData.challenges}
              onChange={(e) => setModuleData({ ...moduleData, challenges: e.target.value })}
            />
          </div>
        </div>

        {/* VALUES & PURPOSE */}
        <div className={styles["two-col"]}>
          <div className={styles.section}>
            <h2 className={styles["section-title"]}>My Core Values</h2>
            <p className={styles["section-description"]}>What matters most to you? What principles guide your decisions?</p>
            <textarea
              className={styles.textarea}
              placeholder="Your values: integrity, family, service, growth, faith, creativity..."
              rows={6}
              value={moduleData.values}
              onChange={(e) => setModuleData({ ...moduleData, values: e.target.value })}
            />
          </div>

          <div className={styles.section}>
            <h2 className={styles["section-title"]}>My Purpose Statement</h2>
            <p className={styles["section-description"]}>Early articulation of your purpose or mission. What are you here to do?</p>
            <textarea
              className={styles.textarea}
              placeholder="Your emerging sense of purpose, how you want to contribute..."
              rows={6}
              value={moduleData.purposeStatement}
              onChange={(e) => setModuleData({ ...moduleData, purposeStatement: e.target.value })}
            />
          </div>
        </div>

        {/* SPIRITUAL & RELATIONAL */}
        <div className={styles["two-col"]}>
          <div className={styles.section}>
            <h2 className={styles["section-title"]}>My Spiritual Path</h2>
            <p className={styles["section-description"]}>Your faith journey, spiritual understanding, and relationship with God.</p>
            <textarea
              className={styles.textarea}
              placeholder="Your spiritual journey, what you believe, how you're growing spiritually..."
              rows={6}
              value={moduleData.spiritualPath}
              onChange={(e) => setModuleData({ ...moduleData, spiritualPath: e.target.value })}
            />
          </div>

          <div className={styles.section}>
            <h2 className={styles["section-title"]}>My Relational Vision</h2>
            <p className={styles["section-description"]}>How you want to show up in relationships and community.</p>
            <textarea
              className={styles.textarea}
              placeholder="How you want to love, lead, serve others. Your relational commitments..."
              rows={6}
              value={moduleData.relationships}
              onChange={(e) => setModuleData({ ...moduleData, relationships: e.target.value })}
            />
          </div>
        </div>

        {/* NEXT STEPS */}
        <div className={styles.section}>
          <h2 className={styles["section-title"]}>My Next Steps Forward</h2>
          <p className={styles["section-description"]}>Concrete actions you're ready to take based on everything you've learned.</p>
          <textarea
            className={styles.textarea}
            placeholder="3-5 specific, actionable next steps you're committing to..."
            rows={6}
            value={moduleData.nextSteps}
            onChange={(e) => setModuleData({ ...moduleData, nextSteps: e.target.value })}
          />
        </div>

        {/* FINAL REFLECTION */}
        <div className={styles.section}>
          <h2 className={styles["section-title"]}>Final Reflection</h2>
          <p className={styles["section-description"]}>What you're taking forward from the Perspective Stage.</p>
          <textarea
            className={styles.textarea}
            placeholder="Insights, commitments, hopes, and intentions as you move into the next stage..."
            rows={6}
            value={moduleData.reflectionNotes}
            onChange={(e) => setModuleData({ ...moduleData, reflectionNotes: e.target.value })}
          />
        </div>

        {/* SAVE STATUS */}
        {isSaving && <div className={styles["save-indicator"]}>Saving...</div>}

        {/* ACTION BUTTONS */}
        <div className={styles["action-buttons"]}>
          <button className={styles["btn-complete"]} onClick={handleCompleteModule}>
            ✓ Complete Module 6 → Surrender Stage
          </button>
          <button className={styles["btn-secondary"]} onClick={handleRestart}>
            🔄 Restart Module
          </button>
          <button className={styles["btn-secondary"]} onClick={() => navigate("/perspective")}>
            ← Back
          </button>
        </div>
      </div>

      {/* RESTART CONFIRMATION */}
      {showRestartConfirm && (
        <div className={styles["modal-overlay"]}>
          <div className={styles.modal}>
            <h2>Restart Module?</h2>
            <p>This will clear all your answers for this module. Continue?</p>
            <div className={styles["modal-buttons"]}>
              <button onClick={() => setShowRestartConfirm(false)} className={styles["btn-cancel"]}>
                Cancel
              </button>
              <button onClick={handleConfirmRestart} className={styles["btn-confirm"]}>
                Yes, Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerspectiveModule;
