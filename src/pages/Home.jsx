import { useEffect, useMemo } from "react";
import { Link } from "react-router";
import PostCard from "../components/post/PostCard.jsx";
import VerifyEmailBanner from "../components/threads/VerifyEmailBanner.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import useFeedStore, { FEED_TABS } from "../stores/feedStore.js";
import useAuthStore, { selectIsAuthenticated } from "../stores/authStore.js";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll.js";

const Home = () => {
  const posts = useFeedStore((s) => s.posts);
  const tab = useFeedStore((s) => s.tab);
  const loading = useFeedStore((s) => s.loading);
  const loadingMore = useFeedStore((s) => s.loadingMore);
  const error = useFeedStore((s) => s.error);
  const source = useFeedStore((s) => s.source);
  const hasMore = useFeedStore((s) => s.hasMore);
  const following = useFeedStore((s) => s.following);
  const fetchFeed = useFeedStore((s) => s.fetchFeed);
  const loadMore = useFeedStore((s) => s.loadMore);
  const setTab = useFeedStore((s) => s.setTab);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    fetchFeed({ reset: true });
  }, [fetchFeed]);

  // The API has no dedicated endpoints for these tabs, so they are filtered
  // client-side from the same feed.
  const visiblePosts = useMemo(() => {
    if (tab === "ghost") return posts.filter((post) => post.isGhost);
    if (tab === "following") {
      const names = new Set(following);
      return posts.filter((post) => names.has(post.username));
    }
    return posts;
  }, [posts, tab, following]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    enabled: hasMore && !loading && !loadingMore,
  });
  return (
    <div>
      <header className="sticky top-0 z-20 bg-white/85 dark:bg-[#101010]/85 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center h-14 px-1">
          <h1 className="font-bold text-[17px]">Trang chủ</h1>
        </div>
        <div className="flex" role="tablist" aria-label="Chọn nguồn feed">
          {FEED_TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`feed-tab-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`flex-1 py-3 text-[15px] relative transition ${
                  active
                    ? "font-semibold text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-black dark:bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main data-testid="threads-feed" className="pt-3">
        <VerifyEmailBanner />

        {source === "mock" && (
          <p
            data-testid="feed-fallback-notice"
            className="mb-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
          >
            Không kết nối được máy chủ — đang hiển thị dữ liệu mẫu.
          </p>
        )}

        {!isAuthenticated && (
          <div
            data-testid="feed-login-banner"
            className="lg:hidden mb-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between gap-3"
          >
            <p className="text-sm text-neutral-500">Đăng nhập để xem thêm</p>
            <Link
              to="/login"
              data-testid="banner-login-btn"
              className="rounded-xl bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm font-semibold"
            >
              Đăng nhập
            </Link>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600 px-2 py-2">
            {error}
          </p>
        )}

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

        {visiblePosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {!loading && visiblePosts.length === 0 && (
          <p className="text-sm text-neutral-500 px-2 py-6" data-testid="feed-empty">
            {tab === "following"
              ? "Bạn chưa theo dõi ai, hoặc những người bạn theo dõi chưa đăng bài."
              : tab === "ghost"
                ? "Chưa có bài viết ghost nào."
                : "Chưa có bài viết nào."}
          </p>
        )}

        <div ref={sentinelRef} data-testid="feed-sentinel" className="h-px" />

        {loadingMore && (
          <p className="py-3 text-center text-sm text-neutral-500">
            Đang tải thêm...
          </p>
        )}
      </main>
    </div>
  );
};

export default Home;
