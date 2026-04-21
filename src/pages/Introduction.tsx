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

      {/* Navigation remains unchanged */}
      <nav className={style["navbar"]}>
        <div className={style["nav-left"]}>
          <Link
            to="/"
            aria-label="Back to homepage"
            title="Go to homepage"
            className={style["nav-back-btn"]}
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
          <span className={style["breadcrumb-separator"]}>›</span>{" "}
          <strong>Where I Am Now</strong>
        </div>

        <div ref={profileMenuRef} className={style["profile-wrapper"]}>
          <button
            type="button"
            className={style["nav-avatar"]}
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            aria-label="Open profile menu"
          >
            {profileInitials}
          </button>
          {isProfileMenuOpen && (
            <div role="menu" className={style["profile-dropdown"]}>
              <button
                type="button"
                onClick={handleLogout}
                className={style["logout-btn"]}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className={style["main"]}>
        <div className={style["intro-card"]}>

          {/* Header Section */}
          <div className={style["intro-header"]}>
            <div className={style["module-tag"]}>
              📍 Module 2 of 10 · Getting Started
            </div>
            <h1 className={style["intro-title"]}>Current State Assessment</h1>
            <h2 className={style["intro-subtitle"]}>
              A 360° View of My Life Right Now
            </h2>
            <p className={style["intro-desc"]}>
              This module is your Current State Assessment. It is where you can describe what your life looks like right now. You will do this by answering 4 questions for each of 5 life domains.
            </p>
          </div>

          {/* NEW: 4 Questions Grid layout for scannability */}
          <div className={style["questions-grid"]}>
            <div className={style["question-card"]}>
              <div className={style["qc-header"]}>What is right?</div>
              <div className={style["qc-body"]}>Identifies what is going well and gives perspective on what you may <strong>optimize</strong> in the future.</div>
            </div>
            <div className={style["question-card"]}>
              <div className={style["qc-header"]}>What is wrong?</div>
              <div className={style["qc-body"]}>Illuminates what isn't working right now. These are items that might be <strong>changed</strong> in the future.</div>
            </div>
            <div className={style["question-card"]}>
              <div className={style["qc-header"]}>What is missing?</div>
              <div className={style["qc-body"]}>Identifies the voids in each domain. This points toward what might be <strong>added</strong> to your life.</div>
            </div>
            <div className={style["question-card"]}>
              <div className={style["qc-header"]}>What is confused?</div>
              <div className={style["qc-body"]}>Highlights areas needing to be prioritized, organized, or refocused to <strong>clarify</strong> your future.</div>
            </div>
          </div>

          <hr className={style["divider"]} />

          {/* Domains Section */}
          <div className={style["domains-box"]}>
            <h3 className={style["domains-title"]}>
              The Five Life Domains:
            </h3>

            <div className={style["domains-grid"]}>
              <div className={style["domain-item"]}>
                <div className={style["domain-icon"]}>🧍</div>
                <div className={style["domain-info"]}>
                  <div className={style["domain-name"]}>Personal</div>
                  <div className={style["domain-desc"]}>
                    Physical, emotional, spiritual, & intellectual self
                  </div>
                </div>
              </div>

              <div className={style["domain-item"]}>
                <div className={style["domain-icon"]}>👨‍👩‍👧</div>
                <div className={style["domain-info"]}>
                  <div className={style["domain-name"]}>Family & Friends</div>
                  <div className={style["domain-desc"]}>
                    Parents, spouse, children, & extended family
                  </div>
                </div>
              </div>

              <div className={style["domain-item"]}>
                <div className={style["domain-icon"]}>⛪</div>
                <div className={style["domain-info"]}>
                  <div className={style["domain-name"]}>Church & Kingdom</div>
                  <div className={style["domain-desc"]}>
                    Relations within the body of Christ; sense of calling
                  </div>
                </div>
              </div>

              <div className={style["domain-item"]}>
                <div className={style["domain-icon"]}>💼</div>
                <div className={style["domain-info"]}>
                  <div className={style["domain-name"]}>Vocation</div>
                  <div className={style["domain-desc"]}>
                    Work or career; including roles in volunteer services
                  </div>
                </div>
              </div>

              {/* Specific class for full-width rather than inline style */}
              <div className={`${style["domain-item"]} ${style["domain-item-full"]}`}>
                <div className={style["domain-icon"]}>🌍</div>
                <div className={style["domain-info"]}>
                  <div className={style["domain-name"]}>Community</div>
                  <div className={style["domain-desc"]}>
                    Giving back to society; neighborhood, town, or city
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NEW: Example Box layout to separate instructions from content */}
          <div className={style["example-box"]}>
            <p className={style["eb-title"]}>As you move through this process, you can respond with brief or in-depth answers. Both are valid.</p>

            <div className={style["eb-row"]}>
              <span className={style["eb-badge"]}>Brief</span>
              <p className={style["eb-text"]}>"I feel more consistent in my routines."</p>
            </div>

            <div className={style["eb-row"]}>
              <span className={style["eb-badge"]}>In-depth</span>
              <p className={style["eb-text"]}>"I feel more consistent in my routines, especially with my health and time with God, and that has helped me feel more grounded overall."</p>
            </div>
          </div>

          <div className={style["closing-note"]}>
            <strong>
              What matters most is that your responses reflect what is true for you right now.
            </strong>
            <p>The process will help you go deeper as you continue.</p>
          </div>

          <div className={style["action-container"]}>
            <button
              className={style["begin-btn"]}
              onClick={() => navigate("/getting-started")}
            >
              Begin Your Assessment →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Introduction;