import React from 'react';
import styles from '../css/Watch-Video.module.css';
import Heading from '../components/Heading';
import { Link } from 'react-router-dom';

const WatchVideo: React.FC = () => {
  return (
    <>
      <div className={styles.bg}></div>
      <div className={styles.container}>
        <Heading />

        <div className={styles.videoWrapper}>
          <video
            controls
            autoPlay
            playsInline
            className={styles.videoContent}
          >
            <source src="/LifePlan Intro Video.mp4" type="video/mp4" />
          </video>
        </div>

        <div className={styles.buttonGroup}>
          <Link to="/enter-email" className={styles.btn}>
            Sign Up
          </Link>
          <Link to="/login" className={styles.btn}>
            Login
          </Link>
        </div>

        <footer className={styles.footer}>
          <span>LifePlan © 2026</span>
          <a href="#terms">Terms and Conditions</a>
          <a href="#privacy">Privacy Policy</a>
        </footer>
      </div>
    </>
  );
};

export default WatchVideo;