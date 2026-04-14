import { useState, useEffect } from "react";
import styles from "../css/LifePlan.module.css";
import { Link } from "react-router-dom";
import thumbnail from "../assets/thumbnail.png";

const LifePlan = () => {
  const [showModal, setShowModal] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      className={styles["page-wrapper"]}
      style={{ overflow: "hidden", height: "100vh" }}
    >
      {/* ── BACKGROUND LAYER ── */}
      <div className={styles["bg"]}></div>
      <div className={styles["bg-overlay"]}></div>

      {/* ── VIDEO MODAL (Opens on click) ── */}
      {showModal && (
        <div className={styles["video-modal"]}>
          <div
            className={styles["modal-overlay"]}
            onClick={() => setShowModal(false)}
          ></div>
          <div className={styles["modal-content"]}>
            <button
              className={styles["close-btn"]}
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <video controls autoPlay className={styles["modal-video"]}>
              <source src="/LifePlan Intro Video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      )}

      {/* FAITH TAG */}
      <div className={styles["faith-tag"]}>
        <div className={styles["faith-dot"]}></div>
        Faithbased AI-Guided Journey
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className={styles["main"]}>
        <div className={styles["headline"]}>
          <span className={styles["h-line1"]}>
            Your LifePlan<span className={styles["broken-blue"]}> Jour</span>
            <span className={styles["broken-brown"]}>ney</span>
          </span>
          {/* <span className={styles["h-line2"]}>
            <span className={styles["broken-blue"]}>Bro</span>
            <span className={styles["broken-brown"]}>ken</span>
          </span> */}
        </div>

        {/* <span className={styles["h-transition"]}>
          You're in a <em>transition</em>
        </span> */}

        <p className={styles["subtext"]}>
          You do not need more answers, <br />
          You need a clear path forward.
        </p>
        {/* ── VIDEO THUMBNAIL (30% WIDTH) ── */}
        <div
          className={styles["video-container"]}
          onClick={() => setShowModal(true)}
        >
          <img
            src={thumbnail}
            alt="Watch Video"
            className={styles["thumbnail-image"]}
          />
          <div className={styles["play-btn-overlay"]}>
            <div className={styles["play-trigger"]}>
              <div className={styles["play-icon"]}></div>
            </div>
          </div>
        </div>
        <div className={styles["cta-wrap"]}>
          <Link className={styles["cta-btn"]} to="/login">
            Enter →
          </Link>
        </div>

        {/* <div className={styles["secondary-links"]}>
          <span
            style={{ fontSize: "18px", fontWeight: "bold" }}
            className={styles["sec-link"]}
            onClick={() => setShowModal(true)}
          >
            Watch Video
          </span>
        </div> */}
      </div>

      <div className={styles["footer"]}>
        <span>LifePlan © 2026</span>
        <a href="#">Terms and Conditions</a>
        <a href="#">Privacy Policy</a>
      </div>
    </div>
  );
};

export default LifePlan;
