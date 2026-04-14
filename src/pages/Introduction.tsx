import React from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import style from "../css/Introduction.module.css";

const Introduction: React.FC = () => {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
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
    <div className={style["container"]}>
      <div className={style["bg"]}></div>

      <nav className={style["navbar"]}>
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
          <div className={style["nav-logo"]}>
            YourLifePlanJourney<span>.com</span>
          </div>
        </div>
        <div className={style["nav-breadcrumb"]}>
          Getting Started{" "}
          <span style={{ color: "rgba(255,255,255,0.25)" }}>›</span>{" "}
          <strong>Where I Am Now</strong>
        </div>
        <div ref={profileMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className={style["nav-avatar"]}
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

      <div className={style["main"]}>
        <div className={style["intro-card"]}>
          <div className={style["module-tag"]}>
            📍 Module 2 of 10 · Getting Started
          </div>

          <div className={style["intro-title"]}>Current State Assessment</div>
          <div className={style["intro-subtitle"]}>
            A 360° View of My Life Right Now
          </div>

          <div className={style["intro-desc"]}>
            This module is your current state assessment. It is where you can
            describe your current life right now. You will do this by answering
            4 questions for each of 5 life domains.
          </div>

          <div className={style["domains-box"]}>
            <div className={style["domains-title"]}>
              You'll reflect across five areas of your life:
            </div>

            <div className={style["domains-grid"]}>
              <div className={style["domain-item"]}>
                <div className={style["domain-icon"]}>🧍</div>
                <div className={style["domain-info"]}>
                  <div className={style["domain-name"]}>Personal</div>
                  <div className={style["domain-desc"]}>
                    Your self. Your spiritual,intellectual, emotional, and
                    physical life
                  </div>
                </div>
              </div>

              <div className={style["domain-item"]}>
                <div className={style["domain-icon"]}>👨‍👩‍👧</div>
                <div className={style["domain-info"]}>
                  <div className={style["domain-name"]}>Family & Friends</div>
                  <div className={style["domain-desc"]}>
                    Marriage, friendships, finances, extended family
                    relationships
                  </div>
                </div>
              </div>

              <div className={style["domain-item"]}>
                <div className={style["domain-icon"]}>⛪</div>
                <div className={style["domain-info"]}>
                  <div className={style["domain-name"]}>Church & Kingdom</div>
                  <div className={style["domain-desc"]}>
                    Spiritual gifts, roles, and unique contribution to God's
                    work
                  </div>
                </div>
              </div>

              <div className={style["domain-item"]}>
                <div className={style["domain-icon"]}>💼</div>
                <div className={style["domain-info"]}>
                  <div className={style["domain-name"]}>Vocation</div>
                  <div className={style["domain-desc"]}>
                    Talents, thinking style, drives, passions, and work
                    expression
                  </div>
                </div>
              </div>

              {/* Added inline style via style object for the grid-column spanning */}
              <div
                className={style["domain-item"]}
                style={{ gridColumn: "1/-1", justifyContent: "center" }}
              >
                <div className={style["domain-icon"]}>🌍</div>
                <div className={style["domain-info"]}>
                  <div className={style["domain-name"]}>Community</div>
                  <div className={style["domain-desc"]}>
                    Civic life, neighborhood, and local engagement
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={style["response-note"]}>
            <div className={style["rn-title"]}>
              You can respond with short or longer answers:
            </div>
            <div className={style["rn-examples"]}>
              <div className={style["rn-ex"]}>
                "I feel more consistent in my routines."
              </div>
              <div className={style["rn-ex"]}>
                "I feel more consistent in my routines, especially with my
                health and time with God..."
              </div>
            </div>
          </div>

          <div className={style["closing-note"]}>
            <strong>
              What matters most is that your responses reflect what is true for
              you right now.
            </strong>
            <p>This process will help you go deeper as you continue.</p>
          </div>

          <button
            className={style["begin-btn"]}
            onClick={() => navigate("/where-i-am-now")}
          >
            Begin Your Assessment →
          </button>
        </div>
      </div>

      <div className={style["screen-label"]}>Screen 2 — Module 2 Intro</div>
    </div>
  );
};

export default Introduction;
