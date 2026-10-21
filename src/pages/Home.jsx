import { useEffect } from "react";
import { Link } from "react-router";
import PostCard from "../components/post/PostCard.jsx";
import CreateThreadBox from "../components/threads/CreateThreadBox.jsx";
import VerifyEmailBanner from "../components/threads/VerifyEmailBanner.jsx";
import ThreadsLogo from "../components/threads/ThreadsLogo.jsx";
import ThemeToggle from "../components/threads/ThemeToggle.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import useFeedStore from "../stores/feedStore.js";
import useAuthStore, { selectIsAuthenticated } from "../stores/authStore.js";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll.js";

const Home = () => {
  const posts = useFeedStore((s) => s.posts);
  const loading = useFeedStore((s) => s.loading);
  const loadingMore = useFeedStore((s) => s.loadingMore);
  const error = useFeedStore((s) => s.error);
  const source = useFeedStore((s) => s.source);
  const hasMore = useFeedStore((s) => s.hasMore);
  const fetchFeed = useFeedStore((s) => s.fetchFeed);
  const loadMore = useFeedStore((s) => s.loadMore);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    fetchFeed({ reset: true });
  }, [fetchFeed]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    enabled: hasMore && !loading && !loadingMore,
  });

  return (
    <div>
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
        <VerifyEmailBanner />

        {source === "mock" && (
          <p
            data-testid="feed-fallback-notice"
            className="mb-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
          >
            Không kết nối được máy chủ — đang hiển thị dữ liệu mẫu.
          </p>
        )}

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

        {error && (
          <p role="alert" className="text-sm text-red-600 px-2 py-2">
            {error}
          </p>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        <div ref={sentinelRef} data-testid="feed-sentinel" className="h-px" />

        {loadingMore && (
          <p className="py-3 text-center text-sm text-neutral-500">
            Đang tải thêm...
          </p>
        )}

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
  );
};

export default Home;
