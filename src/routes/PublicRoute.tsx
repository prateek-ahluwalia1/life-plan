// src/routes/PublicRoute.tsx
import { type ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../store/store";

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const token = useSelector((state: RootState) => state.auth.token);

  // If they have a token, redirect to dashboard.
  // 'replace' prevents them from hitting the back button to return to login.
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

export default PublicRoute;
