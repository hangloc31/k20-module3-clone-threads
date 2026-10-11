import { useEffect } from "react";
import { Link } from "react-router";
import LeftNav from "../components/threads/LeftNav.jsx";
import ThreadCard from "../components/threads/ThreadCard.jsx";
import LoginBanner from "../components/threads/LoginBanner.jsx";
import RightLoginPanel from "../components/threads/RightLoginPanel.jsx";
import RightSuggestPanel from "../components/threads/RightSuggestPanel.jsx";
import CreateThreadBox from "../components/threads/CreateThreadBox.jsx";
import ThreadsLogo from "../components/threads/ThreadsLogo.jsx";
import ThemeToggle from "../components/threads/ThemeToggle.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import useAuthStore, { selectIsAuthenticated } from "../stores/authStore.js";
import useFeedStore from "../stores/feedStore.js";

const HomePage = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const posts = useFeedStore((s) => s.posts);
  const loading = useFeedStore((s) => s.loading);
  const feedError = useFeedStore((s) => s.error);
  const fetchFeed = useFeedStore((s) => s.fetchFeed);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div
      data-testid="threads-home"
      className="min-h-screen bg-white text-neutral-900 dark:bg-[#101010] dark:text-neutral-100"
    >
      <LeftNav />

      <div className="md:pl-[76px] lg:pl-[260px]">
        <div className="mx-auto flex max-w-[1080px] justify-center gap-3.5 px-4">
          <div className="w-full max-w-[640px] min-w-0">
            {/* Top bar */}
            <header className="sticky top-0 z-20 bg-white/85 dark:bg-[#101010]/85 backdrop-blur">
              <div className="h-14 flex items-center justify-between">
                <Link to="/" aria-label="Threads home" className="lg:hidden">
                  <ThreadsLogo variant="glyph" className="w-6 h-6" />
                </Link>
                <h1 className="font-bold text-[17px]">Trang chủ</h1>
                <ThemeToggle
                  variant="icon"
                  testId="theme-toggle-header"
                  className="md:hidden"
                />
              </div>
            </header>

            {/* Feed */}
            <main data-testid="threads-feed" className="pt-3 pb-16">
              {isAuthenticated && <CreateThreadBox />}

              {loading && posts.length === 0 && (
                <div className="space-y-4" data-testid="feed-skeleton">
                  {[0, 1, 2].map((key) => (
                    <div
                      key={key}
                      className="rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="mt-3 h-4 w-full" />
                      <Skeleton className="mt-2 h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              )}

              {feedError && (
                <p role="alert" className="text-sm text-red-600 px-2 py-2">
                  {feedError}
                </p>
              )}

              {posts.map((post) => (
                <ThreadCard key={post.id} post={post} />
              ))}

              {/* Compact legal footer for tablet/mobile (desktop shows the panel footer) */}
              <footer className="lg:hidden px-6 py-8 text-[13px] text-neutral-500 space-y-2">
                <p className="flex flex-wrap gap-x-3">
                  <span>© 2026</span>
                  <a
                    className="hover:underline"
                    href="https://help.instagram.com/769983657850450"
                  >
                    Điều khoản của Threads
                  </a>
                  <a
                    className="hover:underline"
                    href="https://help.instagram.com/515230437301944"
                  >
                    Chính sách quyền riêng tư
                  </a>
                  <a
                    className="hover:underline"
                    href="https://help.instagram.com/1896641480634370/"
                  >
                    Chính sách cookie
                  </a>
                </p>
                {!isAuthenticated && (
                  <p>
                    <Link to="/login" className="hover:underline">
                      Đăng nhập bằng tên người dùng
                    </Link>
                  </p>
                )}
              </footer>
            </main>
          </div>

          <div className="pt-14">
            <div className="sticky top-17">
              {isAuthenticated ? <RightSuggestPanel /> : <RightLoginPanel />}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom login banner is mobile-only now; desktop uses the right panel */}
      {!isAuthenticated && (
        <div className="md:hidden">
          <LoginBanner />
        </div>
      )}
    </div>
  );
};

export default HomePage;
