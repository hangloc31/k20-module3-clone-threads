import { Link } from "react-router";
import useAuthStore, { selectIsAuthenticated } from "../stores/authStore.js";

// Profile of the signed-in account. The backend has no endpoint to read
// another user's profile (GET /api/users/{id} does not exist), so this page
// only shows the current user for now.
const Profile = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  if (!isAuthenticated) {
    return (
      <div className="pt-4">
        <h1 className="font-bold text-[17px] px-1 pb-3">Trang cá nhân</h1>
        <p className="text-sm text-neutral-500 px-1">
          <Link to="/login" className="font-semibold text-black dark:text-white underline">
            Đăng nhập
          </Link>{" "}
          để xem trang cá nhân của bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <h1 className="font-bold text-[17px] px-1 pb-3">Trang cá nhân</h1>

      <div
        data-testid="profile-card"
        className="rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 flex items-center gap-4"
      >
        <img
          src={user?.avatar_url ?? "https://i.pravatar.cc/100?u=unknown"}
          alt=""
          className="w-16 h-16 rounded-full object-cover bg-neutral-200"
        />
        <div className="min-w-0">
          <p className="font-bold text-[17px] truncate">
            {user?.name ?? user?.username}
          </p>
          <p className="text-sm text-neutral-500 truncate">
            @{user?.username}
          </p>
          {user?.bio && (
            <p className="text-sm mt-1 break-words">{user.bio}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-500 mt-3 px-1">
        Trang cá nhân đầy đủ (bài viết, người theo dõi) cần endpoint đọc hồ sơ
        người dùng từ backend.
      </p>
    </div>
  );
};

export default Profile;
