import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../store/slices/authSlice";
import styles from "../css/Check-Your-Email.module.css";
import Heading from "../components/Heading";
import useSubmit from "../hooks/useSubmit.ts";

export const CheckYourEmail = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submit, loading } = useSubmit();

  const email = location.state?.email;
  const password = location.state?.password;
  const registrationSuccess = location.state?.registrationSuccess;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!email || !password || !registrationSuccess) {
      navigate("/enter-email");
    }
  }, [email, password, registrationSuccess, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ================== OTP INPUT ==================
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // ================== VERIFY ==================
  const handleSignIn = async () => {
    const code = otp.join("");

    if (code.length !== 6) {
      alert("Please enter the full 6-digit code.");
      return;
    }

    const verifyResponse = await submit("auth/verify-otp", {
      email,
      otp: code,
    });

    if (!verifyResponse) {
      return;
    }

    const loginResponse = await submit("auth/login", {
      email,
      password,
    });

    if (!loginResponse) return;

    dispatch(
      login({
        token: loginResponse.token,
        userdata: loginResponse.userdata,
      }),
    );

    navigate("/dashboard");
  };

  // ================== RESEND ==================
  const handleResend = async () => {
    if (!email) return;

    const response = await submit("auth/resend-otp", {
      email,
    });

    if (!response) return;

    setCountdown(60);
    setOtp(["", "", "", "", "", ""]);
  };

  // Prevent flash of UI if redirecting back to start
  if (!email || !password || !registrationSuccess) return null;

  return (
    <>
      <div className={styles.bg}></div>
      <div className={styles.container}>
        <Heading />

        <div className={styles.card}>
          <div className={styles.heading}>
            <h2 className={styles.title}>Check your Email</h2>
            <p className={styles.subtitle}>
              Enter 6-digit code sent to <b>{email}</b>
            </p>
          </div>

          <div className={styles.otpGroup}>
            {otp.map((digit, idx) => (
              <React.Fragment key={idx}>
                <input
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  className={styles.otpInput}
                  value={digit}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                />
                {idx === 2 && <span className={styles.dash}>—</span>}
              </React.Fragment>
            ))}
          </div>

          <button
            className={styles.btnBlue}
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>

          <div className={styles.infoArea}>
            <p>Make sure to check your spam folder.</p>

            <button
              className={styles.textBtn}
              onClick={handleResend}
              disabled={countdown > 0 || loading}
            >
              {countdown > 0
                ? `Resend in ${countdown}s`
                : "Can't find it? Try Again"}
            </button>

            <p className={styles.timer}>
              Try again in {countdown > 0 ? countdown : 0} seconds
            </p>
          </div>
        </div>

        <footer className={styles.footer}>
          <span>LifePlan © 2026</span>
          <Link to="/terms">Terms and Conditions</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </footer>
      </div>
    </>
  );
};
