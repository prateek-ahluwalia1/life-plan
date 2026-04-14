import { Link } from 'react-router-dom';
import LifePlanImage from '../assets/life-plan-main.png';
import styles from "../css/LifePlan.module.css"; // Your separate CSS file
import Heading from '../components/Heading';

const LifePlan = () => {
  return (
    <div className={styles['page-wrapper']}>
    <div className={styles.bg}></div>
    <div className={styles['landing-page']}>
       
      {/* Title / Logo */}
     <Heading/>

      {/* Hero Illustration */}
      <main className={styles['landing-hero']}>
        <div className={styles['image-container']}>
          <img
            src={LifePlanImage}
            alt="LifePlan Illustration"
            className={styles['illustration']}
          />
        </div>
      </main>

      {/* Button Actions */}
      <section className={styles['button-container']}>
        <Link to="/watch-video" className={styles['btn-white']}>Watch Video</Link>
        <Link to="/enter-email" className={styles['btn-white']}>Sign Up</Link>
        <Link to="/login" className={styles['btn-white']}>Login</Link>
      </section>

      {/* Footer Links */}
      <footer className={styles['landing-footer']}>
        <span className={styles['copyright']}>LifePlan © 2026</span>

        <Link to="/terms" className={styles['footer-link']}>Terms and Conditions</Link>
        <Link to="/privacy" className={styles['footer-link']}>Privacy Policy</Link>

      </footer>
    </div>
    </div>
    
  );
};

export default LifePlan;