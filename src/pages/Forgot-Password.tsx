import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Heading from "../components/Heading";
import useSubmit from "../hooks/useSubmit.ts";
import styles from "../css/SignIn-password.module.css";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const { submit, loading } = useSubmit();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      return;
    }

    const response = await submit("auth/forgot-password", { email });
    if (!response) {
      return;
    }

    toast.success(response.message as string);
    navigate("/login");
  };

  return (
    <>
      <div className={styles.bg}></div>
      <div className={styles.container}>
        <Heading />

        <div className={styles.card}>
          <h2 className={styles.title}>Forgot Password</h2>

          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" className={styles.btnBlue} disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <Link to="/login" className={styles.forgotText}>
            Back to login
          </Link>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
