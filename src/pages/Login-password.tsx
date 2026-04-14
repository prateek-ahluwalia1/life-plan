import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../store/slices/authSlice";
import styles from "../css/SignIn-Password.module.css";
import Heading from "../components/Heading";
import useSubmit from "../hooks/useSubmit.ts";
export const LoginPassword = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { submit, loading } = useSubmit();
  const email = location.state?.email;
  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password.trim()) return;

    const response = await submit("auth/login", {
      email,
      password,
    });

    if (!response) return;

    dispatch(
      login({
        token: response.token,
        userdata: response.userdata,
      }),
    );

    navigate("/dashboard");
  };

  if (!email) return null;

  return (
    <>
      <div className={styles.bg}></div>
      <div className={styles.container}>
        <Heading />

        <div className={styles.card}>
          <h2 className={styles.title}>Enter Your Password</h2>

          <form className={styles.form} onSubmit={handleSignIn}>
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className={styles.btnBlue} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
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
