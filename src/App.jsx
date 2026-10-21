import { Route, Routes, Navigate } from "react-router";
import Home from "./pages/HomePage";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import AuthLayout from "./layouts/AuthLayout";
import NotFound from "./pages/NotFound";

import { GuestRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* Guest-only: login rồi tự đá về / */}
      <Route
        element={
          <GuestRoute>
            <AuthLayout />
          </GuestRoute>
        }
      >
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Verify email / reset password: outside GuestRoute so signed-in
          users can still use them */}
      <Route element={<AuthLayout />}>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Legacy dashboard route: redirect về / (feed auth-aware) */}
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
