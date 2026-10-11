import { Navigate } from "react-router";
import useAuthStore, { selectIsAuthenticated } from "../stores/authStore.js";

// Chặn trang cần login: chưa login -> đá về / (Home)
export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

// Chặn trang khách: login rồi thì không cho vào /login nữa -> đá về / (feed)
export const GuestRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};
