import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../css/Register-Through-Email.module.css";
import Heading from "../components/Heading";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { toast } from "react-toastify";
import useSubmit from "../hooks/useSubmit";
import { useDispatch } from "react-redux";
import { login } from "../store/slices/authSlice";

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const { submit, loading } = useSubmit();
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    navigate("/login-password", { state: { email } });
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    console.log("Google login successful:", credentialResponse);
    const token: any = credentialResponse.credential;
    const response = await submit("auth/google-login", { tokenId: token });
    if (!response) return;

    toast.success("Google Login Successful");
    dispatch(login({ token: response.token, userdata: response.userdata }));
    navigate("/dashboard");
  };

  return (
    <>
      <div className={styles.bg}></div>
      <div className={styles.container}>
        <Heading />

        <div className={styles.card}>
          <h2 className={styles.title}>Login</h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className={styles.btnBlue}>
              Continue
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
              onError={() => toast.error("Google Login Failed")}
              shape="square"
              theme="outline"
              text="continue_with"
            />
          )}
          {/* <button className={styles.btnGoogle} type="button">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="Google"
            />
            Continue with Google
          </button> */}
        </div>

        <div>
          New Here?{" "}
          <Link
            to="/enter-email"
            style={{
              color: "#2b7fff",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Create a New Account
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

export default Login;
