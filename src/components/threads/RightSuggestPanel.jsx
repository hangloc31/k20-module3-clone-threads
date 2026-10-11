import { useNavigate } from "react-router";
import useAuthStore from "../../stores/authStore.js";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.jsx";
import { Button } from "../ui/button.jsx";

const suggestions = [
  { username: "threads.dev", avatar: "https://i.pravatar.cc/100?img=5" },
  { username: "abcnews", avatar: "https://i.pravatar.cc/100?img=8" },
  { username: "griffinkyle", avatar: "https://i.pravatar.cc/100?img=13" },
];

export default function RightSuggestPanel() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const username = user?.username || user?.name || user?.email || "you";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <aside className="hidden lg:block w-[360px] shrink-0">
      <div
        data-testid="threads-suggest-panel"
        className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-6"
      >
        <h2 className="text-[16px] font-bold">Gợi ý theo dõi</h2>
        <div className="mt-4 space-y-4">
          {suggestions.map((item) => (
            <div key={item.username} className="flex items-center gap-3">
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
                className="rounded-full"
              >
                Theo dõi
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
}
