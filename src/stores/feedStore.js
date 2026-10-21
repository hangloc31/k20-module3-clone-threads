import { create } from "zustand";
import {
  createPost as createPostRequest,
  fetchFeed,
  fetchFollowings,
  toggleLike as toggleLikeRequest,
} from "../api/posts.js";
import {
  createPostMock,
  fetchFeedMock,
  toggleLikeMock,
} from "../api/threadsMock.js";
import { formatCount } from "../lib/format.js";
import useAuthStore from "./authStore.js";

export const FEED_PER_PAGE = 20;

export const FEED_TABS = [
  { id: "for_you", label: "For you" },
  { id: "following", label: "Following" },
  { id: "ghost", label: "Ghost posts" },
];

const useFeedStore = create((set, get) => ({
  posts: [],
  tab: "for_you",
  page: 1,
  hasMore: true,
  loading: false,
  loadingMore: false,
  error: "",
  // "api" = live data, "mock" = offline fallback
  source: "api",
  following: [],

  // Loads a page of posts. Falls back to the bundled mock when the API fails
  // so the app never renders an empty shell.
  fetchFeed: async ({ reset = true } = {}) => {
    const state = get();
    // Guards against a second request while one is already in flight
    // (React StrictMode double-invokes the mount effect).
    if (state.loading || state.loadingMore) return;
    if (reset) {
      set({ loading: true, error: "" });
    } else {
      set({ loadingMore: true });
    }

    const page = reset ? 1 : state.page + 1;
    try {
      const { posts, pagination } = await fetchFeed({
        page,
        perPage: FEED_PER_PAGE,
      });
      set({
        posts: reset ? posts : [...state.posts, ...posts],
        page,
        hasMore: pagination
          ? page < (pagination.last_page ?? page)
          : posts.length >= FEED_PER_PAGE,
        loading: false,
        loadingMore: false,
        error: "",
        source: "api",
      });
    } catch (error) {
      try {
        const { posts, pagination } = await fetchFeedMock({
          page,
          perPage: FEED_PER_PAGE,
        });
        set({
          posts: reset ? posts : [...state.posts, ...posts],
          page,
          hasMore: pagination
            ? page < (pagination.last_page ?? page)
            : false,
          loading: false,
          loadingMore: false,
          error: "",
          source: "mock",
        });
      } catch {
        set({
          loading: false,
          loadingMore: false,
          error: error?.message || "Không tải được feed",
        });
      }
    }
  },

  loadMore: async () => {
    const { loading, loadingMore, hasMore } = get();
    if (loading || loadingMore || !hasMore) return;
    await get().fetchFeed({ reset: false });
  },

  setTab: async (tab) => {
    if (get().tab === tab) return;
    set({ tab, error: "" });
    if (tab === "following") {
      await get().loadFollowing();
    }
    await get().fetchFeed({ reset: true });
  },

  loadFollowing: async () => {
    const user = useAuthStore.getState().user;
    if (!user?.id) {
      set({ following: [] });
      return;
    }
    try {
      const following = await fetchFollowings(user.id);
      set({ following });
    } catch {
      set({ following: [] });
    }
  },

  // Optimistic like/unlike: flip the state immediately, roll back on error.
  like: async (id) => {
    const target = get().posts.find((post) => post.id === id);
    if (!target) return;
    const wasLiked = Boolean(target.liked);
    const previousCount = target.likesCount ?? 0;
    const nextCount = Math.max(0, previousCount + (wasLiked ? -1 : 1));

    set({
      posts: get().posts.map((post) =>
        post.id === id
          ? { ...post, liked: !wasLiked, likesCount: nextCount, likes: formatCount(nextCount) }
          : post,
      ),
    });

    try {
      const request = get().source === "mock" ? toggleLikeMock : toggleLikeRequest;
      const result = await request(id);
      const likesCount = result.likesCount ?? nextCount;
      set({
        posts: get().posts.map((post) =>
          post.id === id
            ? {
                ...post,
                liked: result.isLiked ?? !wasLiked,
                likesCount,
                likes: formatCount(likesCount),
              }
            : post,
        ),
      });
    } catch (error) {
      set({
        posts: get().posts.map((post) =>
          post.id === id
            ? {
                ...post,
                liked: wasLiked,
                likesCount: previousCount,
                likes: formatCount(previousCount),
              }
            : post,
        ),
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Không thích được bài viết",
      });
    }
  },

  // Creates a post through the API (falls back to the mock like the feed).
  createPost: async (content) => {
    const text = content?.trim();
    if (!text) throw new Error("Nội dung bài viết không được để trống");
    try {
      const post = await createPostRequest({ content: text });
      set({ posts: [post, ...get().posts] });
      return post;
    } catch (error) {
      const post = await createPostMock({ content: text });
      set({ posts: [post, ...get().posts], source: "mock" });
      return post;
    }
  },

  clearError: () => set({ error: "" }),
}));

export default useFeedStore;
