import { useEffect, useRef, useState } from "react";
import styles from "../css/Module3.module.css";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL } from "../utils/exports";
import useModuleAccess from "../hooks/useModuleAccess";
import ModuleGatingBlock from "../components/ModuleGatingBlock";
import { requestModuleRestart, confirmModuleRestart } from "../utils/moduleHelpers";

interface TurningPoint {
  title: string;
  description: string;
  impact: string;
}

interface ModuleState {
  turningPoints: TurningPoint[];
  keyDecisions: string;
  shapingRelationships: string;
  challengesOvercome: string;
  achievements: string;
  spiritualMoments: string;
  reflectionNotes: string;
  isComplete: boolean;
}

const HowIGotHere = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const userdata = useSelector((state: RootState) => state.auth.userdata);
  const token = useSelector((state: RootState) => state.auth.token);

  // Module gating
  const { isLocked } = useModuleAccess("perspective");
  const [restartConfirmId, setRestartConfirmId] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Component state
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState<ModuleState>({
    turningPoints: [
      { title: "", description: "", impact: "" },
      { title: "", description: "", impact: "" },
      { title: "", description: "", impact: "" },
    ],
    keyDecisions: "",
    shapingRelationships: "",
    challengesOvercome: "",
    achievements: "",
    spiritualMoments: "",
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

  // Load data from backend
  useEffect(() => {
    if (!token) return;

    const loadModuleData = async () => {
      try {
        const response = await fetch(`${apiURL}modules/perspective/module-3`, {
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

  // Auto-save on changes
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
      await fetch(`${apiURL}modules/perspective/module-3`, {
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
      const result = await requestModuleRestart(token, "modules/perspective/module-3");
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
      const result = await confirmModuleRestart(token, "modules/perspective/module-3", restartConfirmId);
      if (result?.status === "reset_complete") {
        setShowRestartConfirm(false);
        setRestartConfirmId(null);
        setModuleData({
          turningPoints: [
            { title: "", description: "", impact: "" },
            { title: "", description: "", impact: "" },
            { title: "", description: "", impact: "" },
          ],
          keyDecisions: "",
          shapingRelationships: "",
          challengesOvercome: "",
          achievements: "",
          spiritualMoments: "",
          reflectionNotes: "",
          isComplete: false,
        });
      } else {
        console.error("Failed to reset module:", result?.message);
      }
    } catch (err) {
      console.error("Failed to confirm restart:", err);
    }
  };

  if (isLocked) {
    return (
      <ModuleGatingBlock
        moduleName="How I Got Here"
        requiredModules={["where-i-am-now"]}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const handleCompleteModule = async () => {
    if (!token) return;

    setIsSaving(true);
    try {
      // Save completion and progress
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
            module3: true,
            perspective: true,
          },
        }),
      });

      // Navigate to Surrender stage
      navigate("/surrender");
    } catch (error) {
      console.error("Failed to complete module:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTurningPoint = (index: number, field: keyof TurningPoint, value: string) => {
    const newPoints = [...moduleData.turningPoints];
    newPoints[index] = { ...newPoints[index], [field]: value };
    setModuleData({ ...moduleData, turningPoints: newPoints });
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
          <strong>How I Got Here</strong>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>— Module 3 of 10</span>
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
          <div className={styles["module-number"]}>Module 3 of 10</div>
          <h1 className={styles["module-title"]}>How I Got Here</h1>
          <p className={styles["module-subtitle"]}>Turning Points in Your Life</p>
          <p className={styles["module-description"]}>
            Your past shapes your present. Explore the key moments, decisions, and experiences that have made you who you are today.
          </p>
        </div>

        {/* TURNING POINTS SECTION */}
        <div className={styles.section}>
          <h2 className={styles["section-title"]}>Key Turning Points</h2>
          <p className={styles["section-description"]}>Share 3 turning points that significantly shaped your journey.</p>

          {moduleData.turningPoints.map((point, idx) => (
            <div key={idx} className={styles["turning-point-card"]}>
              <div className={styles["tp-label"]}>Turning Point {idx + 1}</div>

              <div className={styles["form-group"]}>
                <label className={styles.label}>Title</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., Starting my faith journey, Career change, Loss of a loved one"
                  value={point.title}
                  onChange={(e) => updateTurningPoint(idx, "title", e.target.value)}
                />
              </div>

              <div className={styles["form-group"]}>
                <label className={styles.label}>What happened?</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Describe this turning point in detail..."
                  rows={4}
                  value={point.description}
                  onChange={(e) => updateTurningPoint(idx, "description", e.target.value)}
                />
              </div>

              <div className={styles["form-group"]}>
                <label className={styles.label}>How did it impact you?</label>
                <textarea
                  className={styles.textarea}
                  placeholder="How did this moment change your perspective, direction, or who you are?"
                  rows={4}
                  value={point.impact}
                  onChange={(e) => updateTurningPoint(idx, "impact", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* KEY DECISIONS */}
        <div className={styles.section}>
          <h2 className={styles["section-title"]}>Major Decisions That Shaped You</h2>
          <p className={styles["section-description"]}>What are some key decisions you made that changed your path?</p>
          <textarea
            className={styles.textarea}
            placeholder="Examples: Choosing a career path, Moving to a new place, Committing to your faith, Starting a family..."
            rows={5}
            value={moduleData.keyDecisions}
            onChange={(e) => setModuleData({ ...moduleData, keyDecisions: e.target.value })}
          />
        </div>

        {/* RELATIONSHIPS */}
        <div className={styles.section}>
          <h2 className={styles["section-title"]}>Shaping Relationships</h2>
          <p className={styles["section-description"]}>Who are the people that influenced your journey most?</p>
          <textarea
            className={styles.textarea}
            placeholder="Family members, mentors, friends, role models, or spiritual leaders..."
            rows={5}
            value={moduleData.shapingRelationships}
            onChange={(e) => setModuleData({ ...moduleData, shapingRelationships: e.target.value })}
          />
        </div>

        {/* CHALLENGES */}
        <div className={styles.section}>
          <h2 className={styles["section-title"]}>Challenges You've Overcome</h2>
          <p className={styles["section-description"]}>What obstacles have strengthened and shaped you?</p>
          <textarea
            className={styles.textarea}
            placeholder="Hardships faced, lessons learned, growth from adversity..."
            rows={5}
            value={moduleData.challengesOvercome}
            onChange={(e) => setModuleData({ ...moduleData, challengesOvercome: e.target.value })}
          />
        </div>

        {/* ACHIEVEMENTS */}
        <div className={styles.section}>
          <h2 className={styles["section-title"]}>Victories & Achievements</h2>
          <p className={styles["section-description"]}>What accomplishments are you most proud of?</p>
          <textarea
            className={styles.textarea}
            placeholder="Personal, professional, spiritual, relational, or health victories..."
            rows={5}
            value={moduleData.achievements}
            onChange={(e) => setModuleData({ ...moduleData, achievements: e.target.value })}
          />
        </div>

        {/* SPIRITUAL MOMENTS */}
        <div className={styles.section}>
          <h2 className={styles["section-title"]}>Spiritual & Faith Moments</h2>
          <p className={styles["section-description"]}>How has your faith journey unfolded?</p>
          <textarea
            className={styles.textarea}
            placeholder="Moments of connection, doubt, growth, answered prayers, or spiritual awakening..."
            rows={5}
            value={moduleData.spiritualMoments}
            onChange={(e) => setModuleData({ ...moduleData, spiritualMoments: e.target.value })}
          />
        </div>

        {/* REFLECTION NOTES */}
        <div className={styles.section}>
          <h2 className={styles["section-title"]}>Final Reflection</h2>
          <p className={styles["section-description"]}>Synthesize your journey. What patterns do you see? What does your story tell you about who you are?</p>
          <textarea
            className={styles.textarea}
            placeholder="Your reflective summary..."
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
            ✓ Complete Module 3
          </button>
          <button className={styles["btn-secondary"]} onClick={handleRestart}>
            🔄 Restart Module
          </button>
          <button className={styles["btn-secondary"]} onClick={() => navigate("/perspective")}>
            ← Back to Perspective
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

export default HowIGotHere;
