import { Route, Routes, Navigate } from "react-router";
import Home from "./pages/Home";
import Create from "./pages/Create";
import Search from "./pages/Search";
import Activity from "./pages/Activity";
import Messages from "./pages/Messages";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import Embed from "./pages/Embed";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import DefaultLayout from "./layouts/DefaultLayout";
import EmbedLayout from "./layouts/EmbedLayout";
import AuthLayout from "./layouts/AuthLayout";
import NotFound from "./pages/NotFound";

import { GuestRoute, ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Main app shell: sidebar + feed + login panel */}
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/create"
          element={
            <ProtectedRoute redirectTo="/login">
              <Create />
            </ProtectedRoute>
          }
        />
        <Route path="/search" element={<Search />} />
        <Route path="/activity" element={<Activity />} />
        <Route
          path="/messages"
          element={
            <ProtectedRoute redirectTo="/login">
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute redirectTo="/login">
              <Insights />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<Profile />} />
        {/* Single post: /:username/post/:postId */}
        <Route path="/:username/post/:postId" element={<PostDetail />} />
      </Route>

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

      {/* Embeddable post: /:username/post/:postId/embed (no sidebar/footer) */}
      <Route element={<EmbedLayout />}>
        <Route path="/:username/post/:postId/embed" element={<Embed />} />
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
