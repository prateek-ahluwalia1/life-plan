// src/App.tsx
import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import PageLoader from "./components/Loader";

const LifePlan = lazy(() => import("./pages/LifePlan"));
const WatchVideo = lazy(() => import("./pages/Watch-Video"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const GettingStarted = lazy(() => import("./pages/GettingStarted"));
const WhereIAmNow = lazy(() => import("./pages/S2-Module-WhereIAmNow"));
const Introduction = lazy(() => import("./pages/Introduction"));
const Perspective = lazy(() => import("./pages/S3-Stage2-Perspective"));
const HowIGotHere = lazy(() => import("./pages/S3-Module3-HowIGotHere"));
const Surrender = lazy(() => import("./pages/S4-Stage3-Surrender"));
const MyPurpose = lazy(() => import("./pages/S5-Stage4-MyPurpose"));
const JourneyComplete = lazy(() => import("./pages/S6-JourneyComplete"));
const Login = lazy(() => import("./pages/Login-Through-Email"));
const RegisterThroughEmail = lazy(
  () => import("./pages/Register-Through-Email"),
);
const ForgotPassword = lazy(() => import("./pages/Forgot-Password"));
const ResetPassword = lazy(() => import("./pages/Reset-Password"));
const SignInPassword = lazy(() =>
  import("./pages/SignIn-password").then((m) => ({
    default: m.SignInPassword,
  })),
);
const CheckYourEmail = lazy(() =>
  import("./pages/Check-Your-Email").then((m) => ({
    default: m.CheckYourEmail,
  })),
);
const LoginPassword = lazy(() =>
  import("./pages/Login-password").then((m) => ({ default: m.LoginPassword })),
);

function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LifePlan />} />
          <Route path="/watch-video" element={<WatchVideo />} />
          <Route
            path="/enter-email"
            element={
              <PublicRoute>
                <RegisterThroughEmail />
              </PublicRoute>
            }
          />
          <Route
            path="/enter-password"
            element={
              <PublicRoute>
                <SignInPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <PublicRoute>
                <CheckYourEmail />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/login-password"
            element={
              <PublicRoute>
                <LoginPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/getting-started"
            element={
              <ProtectedRoute>
                <GettingStarted />
              </ProtectedRoute>
            }
          />
          <Route
            path="/where-i-am-now"
            element={
              <ProtectedRoute>
                <WhereIAmNow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/introduction"
            element={
              <ProtectedRoute>
                <Introduction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perspective"
            element={
              <ProtectedRoute>
                <Perspective />
              </ProtectedRoute>
            }
          />
          <Route
            path="/module-3"
            element={
              <ProtectedRoute>
                <HowIGotHere />
              </ProtectedRoute>
            }
          />
          <Route
            path="/surrender"
            element={
              <ProtectedRoute>
                <Surrender />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-purpose"
            element={
              <ProtectedRoute>
                <MyPurpose />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journey-complete"
            element={
              <ProtectedRoute>
                <JourneyComplete />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
