import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "../css/SignIn-Password.module.css";
import Heading from "../components/Heading";
import useSubmit from "../hooks/useSubmit.ts";
import { toast } from "react-toastify";

export const SignInPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { submit, loading } = useSubmit();

  // 1. Grab the email passed from the previous registration step
  const email = location.state?.email;

  // 2. Protect the route: if they bypassed the email screen, bounce them back
  useEffect(() => {
    if (!email) {
      navigate("/enter-email"); // Adjust this to match your first step's route
    }
  }, [email, navigate]);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();

    // 3. Basic validation
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    const response = await submit("auth/register", {
      email,
      password,
      confirmPassword,
    });

    if (!response) return;

    if (response.message) {
      toast.success(response.message as string);
    }

    // Move to OTP screen only after successful registration.
    navigate("/verify-email", {
      state: { email, password, registrationSuccess: true },
    });
  };

  // Prevent a flash of the UI if they are being redirected
  if (!email) return null;

  return (
    <>
      <div className={styles.bg}></div>
      <div className={styles.container}>
        <Heading />

        <div className={styles.card}>
          <h2 className={styles.title}>Create New Password</h2>

          <form className={styles.form} onSubmit={handleNext}>
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {/* I changed this text to "Continue" since they aren't fully signed in yet */}
            <button type="submit" className={styles.btnBlue} disabled={loading}>
              {loading ? "Creating account..." : "Continue"}
            </button>
          </form>

          <Link to="/forgot" className={styles.forgotText}>
            Forgot password?
          </Link>
        </div>

        <footer className={styles.footer}>
          <span>LifePlan © 2026</span>
          <div className={styles.footerLinks}>
            <Link to="/terms">Terms and Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </>
  );
};
