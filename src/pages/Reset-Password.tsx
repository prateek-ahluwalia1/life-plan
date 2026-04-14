import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Heading from "../components/Heading";
import useSubmit from "../hooks/useSubmit.ts";
import styles from "../css/SignIn-Password.module.css";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [params] = useSearchParams();
  const { submit, loading } = useSubmit();
  const navigate = useNavigate();

  const email = useMemo(() => params.get("email") || "", [params]);
  const token = useMemo(() => params.get("token") || "", [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !token) {
      toast.error("Reset link is invalid or incomplete");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const response = await submit("auth/reset-password", {
      email,
      token,
      password,
      confirmPassword,
    });

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
          <h2 className={styles.title}>Reset Password</h2>

          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button type="submit" className={styles.btnBlue} disabled={loading}>
              {loading ? "Updating..." : "Update password"}
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

export default ResetPassword;
