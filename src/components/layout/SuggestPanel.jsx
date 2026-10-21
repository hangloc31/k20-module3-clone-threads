import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import useAuthStore from "../../stores/authStore.js";
import { fetchSuggestions, followUser, unfollowUser } from "../../api/users.js";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.jsx";
import { Button } from "../ui/button.jsx";

// "Gợi ý theo dõi" — fed by GET /api/users/suggestions.
const SuggestPanel = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);

  const username = user?.username || user?.name || user?.email || "you";

  useEffect(() => {
    let cancelled = false;
    fetchSuggestions()
      .then((items) => {
        if (!cancelled) setSuggestions(items.slice(0, 5));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Không tải được gợi ý theo dõi");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const toggleFollow = async (item) => {
    setPendingId(item.id);
    setError("");
    try {
      if (item.isFollowing) {
        await unfollowUser(item.id);
      } else {
        await followUser(item.id);
      }
      setSuggestions((list) =>
        list.map((entry) =>
          entry.id === item.id
            ? { ...entry, isFollowing: !entry.isFollowing }
            : entry,
        ),
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Không cập nhật được theo dõi");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <aside className="hidden lg:block w-[360px] shrink-0">
      <div
        data-testid="threads-suggest-panel"
        className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-6"
      >
        <h2 className="text-[16px] font-bold">Gợi ý theo dõi</h2>

        {loading && (
          <p className="mt-4 text-sm text-neutral-500">Đang tải gợi ý...</p>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && suggestions.length === 0 && !error && (
          <p className="mt-4 text-sm text-neutral-500">Chưa có gợi ý nào.</p>
        )}

        <div className="mt-4 space-y-4">
          {suggestions.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={item.avatar} alt={item.username} />
                <AvatarFallback>
                  {item.username.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="flex-1 text-[15px] font-semibold truncate">
                {item.username}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid={`follow-${item.id}`}
                disabled={pendingId === item.id}
                onClick={() => toggleFollow(item)}
                className="rounded-full"
              >
                {item.isFollowing ? "Đang theo dõi" : "Theo dõi"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <p className="flex-1 text-sm text-neutral-500 truncate">
            Đang đăng nhập: <span className="font-semibold">{username}</span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="suggest-logout-btn"
          >
            Đăng xuất
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default SuggestPanel;
