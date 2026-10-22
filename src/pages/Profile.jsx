import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import PostCard from "../components/post/PostCard.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import useAuthStore, { selectIsAuthenticated } from "../stores/authStore.js";
import {
  fetchFollowersCount,
  fetchFollowingsCount,
  fetchUserReposts,
} from "../services/postService.js";
import { resendVerificationEmailRequest } from "../api/auth.js";

const formatDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Profile of the signed-in account. The backend has no endpoint to read
// another user's profile (GET /api/users/{id} does not exist) and no
// endpoint to update your own, so this page shows what the API provides:
// the account, follower counts and the reposts.
const Profile = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);

  const [stats, setStats] = useState({
    followers: null,
    following: null,
    reposts: null,
  });
  const [reposts, setReposts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  const userId = user?.id;

  // Refresh the profile from the API (the store may hold a stale copy).
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCurrentUser().catch(() => {
      // keep the stored user as fallback
    });
  }, [isAuthenticated, fetchCurrentUser]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchFollowersCount(userId).catch(() => 0),
      fetchFollowingsCount(userId).catch(() => 0),
      fetchUserReposts(userId).catch(() => ({ posts: [], pagination: null })),
    ])
      .then(([followers, following, repostsData]) => {
        if (cancelled) return;
        setStats({
          followers,
          following,
          reposts: repostsData.pagination?.total ?? repostsData.posts.length,
        });
        setReposts(repostsData.posts);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được thông tin hồ sơ");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);

  if (!isAuthenticated) {
    return (
      <div className="pt-4">
        <h1 className="font-bold text-[17px] px-1 pb-3">Trang cá nhân</h1>
        <p className="text-sm text-neutral-500 px-1">
          <Link
            to="/login"
            data-testid="profile-login-link"
            className="font-semibold text-black dark:text-white underline"
          >
            Đăng nhập
          </Link>{" "}
          để xem trang cá nhân của bạn.
        </p>
      </div>
    );
  }

  const verified = Boolean(user?.email_verified_at);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmailRequest();
      toast.success("Đã gửi lại email xác thực");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Không gửi lại được email xác thực",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="pt-4" data-testid="profile-page">
      <h1 className="font-bold text-[17px] px-1 pb-3">Trang cá nhân</h1>

      {/* Header */}
      <section
        data-testid="profile-header"
        className="rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3"
      >
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar_url ?? "https://i.pravatar.cc/100?u=unknown"}
            alt=""
            className="w-20 h-20 rounded-full object-cover bg-neutral-200"
          />
          <div className="min-w-0">
            <p className="font-bold text-[17px] truncate flex items-center gap-1">
              {user?.name ?? user?.username}
              {user?.verified && (
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-black dark:text-white"
                  fill="currentColor"
                  aria-label="Verified"
                >
                  <path d="M12 2 9.5 4.5 6 4l-.8 3.3L2.5 9l1.7 3L2.5 15l2.7 1.7L6 20l3.5-.5L12 22l2.5-2.5L18 20l.8-3.3L21.5 15l-1.7-3 1.7-3-2.7-1.7L18 4l-3.5-.5L12 2Z" />
                </svg>
              )}
            </p>
            <p className="text-sm text-neutral-500 truncate">@{user?.username}</p>
          </div>
        </div>

        {user?.bio && <p className="text-[15px] leading-6 break-words">{user.bio}</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
          {user?.created_at && (
            <span data-testid="profile-joined">
              Tham gia {formatDate(user.created_at)}
            </span>
          )}
          {user?.email && (
            <span className="truncate" data-testid="profile-email">
              {user.email}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {verified ? (
            <span
              data-testid="profile-verified"
              className="text-sm text-emerald-600 font-semibold"
            >
              ✓ Email đã được xác thực
            </span>
          ) : (
            <>
              <span data-testid="profile-unverified" className="text-sm text-amber-600">
                Email chưa được xác thực
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                data-testid="profile-resend"
                className="rounded-full border border-amber-400 dark:border-amber-700 px-3 py-1 text-[13px] font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50"
              >
                {resending ? "Đang gửi..." : "Gửi lại email xác thực"}
              </button>
            </>
          )}
        </div>
      </section>

      {/* Stats */}
      <section
        data-testid="profile-stats"
        className="mt-3 grid grid-cols-3 gap-3 text-center"
      >
        {[
          { id: "followers", label: "Người theo dõi", value: stats.followers },
          { id: "following", label: "Đang theo dõi", value: stats.following },
          { id: "reposts", label: "Reposts", value: stats.reposts },
        ].map((item) => (
          <div
            key={item.id}
            data-testid={`profile-stat-${item.id}`}
            className="rounded-3xl border border-neutral-200 dark:border-neutral-800 py-3"
          >
            {loading ? (
              <Skeleton className="h-6 w-10 mx-auto" />
            ) : (
              <p className="font-bold text-[17px]">{item.value ?? 0}</p>
            )}
            <p className="text-[13px] text-neutral-500">{item.label}</p>
          </div>
        ))}
      </section>

      {/* Reposts */}
      <section className="mt-5">
        <h2 className="font-bold text-[15px] px-1 pb-2">Reposts</h2>

        {error && (
          <p role="alert" className="text-sm text-red-600 px-2">
            {error}
          </p>
        )}

        {loading && (
          <div className="space-y-4" data-testid="profile-skeleton">
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
        )}

        {!loading && reposts.length === 0 && (
          <p className="text-sm text-neutral-500 px-1" data-testid="profile-empty">
            Bạn chưa repost bài viết nào.
          </p>
        )}

        {reposts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>

      <p className="text-xs text-neutral-500 mt-3 px-1">
        Danh sách bài viết của bạn sẽ có khi backend bổ sung endpoint đọc bài
        theo người dùng.
      </p>
    </div>
  );
};

export default Profile;
