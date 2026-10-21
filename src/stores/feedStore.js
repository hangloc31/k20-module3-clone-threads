import { create } from "zustand";
import {
  createPost as createPostRequest,
  fetchFeed,
  toggleLike as toggleLikeRequest,
} from "../services/postService.js";
import {
  createPostMock,
  fetchFeedMock,
  toggleLikeMock,
} from "../api/threadsMock.js";
import { formatCount } from "../lib/format.js";

export const FEED_PER_PAGE = 20;

const useFeedStore = create((set, get) => ({
  posts: [],
  page: 1,
  hasMore: true,
  loading: false,
  loadingMore: false,
  error: "",
  // "api" = live data, "mock" = offline fallback
  source: "api",

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
    } catch {
      const post = await createPostMock({ content: text });
      set({ posts: [post, ...get().posts], source: "mock" });
      return post;
    }
  },

  // Post menu actions. The API call happens in the component; the store
  // only keeps the feed list in sync.
  savePost: (id, isSaved) =>
    set({
      posts: get().posts.map((post) =>
        post.id === id ? { ...post, saved: Boolean(isSaved) } : post,
      ),
    }),

  // Keeps the reply counter in sync after a reply was posted.
  bumpReplyCount: (id) =>
    set({
      posts: get().posts.map((post) =>
        post.id === id
          ? {
              ...post,
              repliesCount: (post.repliesCount ?? 0) + 1,
              replies: formatCount((post.repliesCount ?? 0) + 1),
            }
          : post,
      ),
    }),

  hidePost: (id) =>
    set({ posts: get().posts.filter((post) => post.id !== id) }),

  deletePost: (id) =>
    set({ posts: get().posts.filter((post) => post.id !== id) }),

  updatePost: (id, updated) =>
    set({
      posts: get().posts.map((post) =>
        post.id === id ? { ...post, ...updated } : post,
      ),
    }),

  clearError: () => set({ error: "" }),
}));

export default useFeedStore;
