import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/Register-Through-Email.module.css";
import Heading from "../components/Heading";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { toast } from "react-toastify";
import useSubmit from "../hooks/useSubmit";
import { useDispatch } from "react-redux";
import { login } from "../store/slices/authSlice";

const RegisterThroughEmail: React.FC = () => {
  const dispatch = useDispatch();
  const { submit, loading } = useSubmit();
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    navigate("/enter-password", { state: { email } });
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    console.log("Google signup successful:", credentialResponse);
    const token: any = credentialResponse.credential;

    // Note: Assuming your backend handles both login and registration via the same Google endpoint.
    // If you have a separate endpoint (e.g., "auth/google-register"), update the URL below.
    const response = await submit("auth/google-login", { tokenId: token });
    if (!response) return;

    toast.success("Google Registration Successful");
    dispatch(login({ token: response.token, userdata: response.userdata }));
    navigate("/dashboard");
  };

  return (
    <>
      <div className={styles.bg}></div>

      <div className={styles.container}>
        <Heading />

        <div className={styles.card}>
          <h2 className={styles.title}>Sign Up</h2>

          <form onSubmit={handleNext} className={styles.form}>
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className={styles.btnBlue}>
              Enter Email
            </button>
          </form>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              Loading...
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google Registration Failed")}
              shape="square"
              theme="outline"
              text="signup_with"
            />
          )}
        </div>

        <div>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#2b7fff",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Log In
          </Link>
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

export default RegisterThroughEmail;
