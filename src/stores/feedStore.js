import { create } from "zustand";
import { createThread, getFeed, toggleLike } from "../api/threads.js";

const useFeedStore = create((set, get) => ({
  posts: [],
  loading: false,
  error: "",

  fetchFeed: async () => {
    set({ loading: true, error: "" });
    try {
      const posts = await getFeed();
      set({ posts, loading: false });
    } catch (error) {
      set({
        error: error?.message || "Không tải được feed",
        loading: false,
      });
    }
  },

  like: async (id) => {
    const { posts } = get();
    const target = posts.find((post) => post.id === id);
    if (!target) return;

    // Optimistic update
    const wasLiked = Boolean(target.liked);
    set({
      posts: posts.map((post) =>
        post.id === id ? { ...post, liked: !wasLiked } : post,
      ),
    });

    try {
      const updated = await toggleLike(id);
      set({
        posts: get().posts.map((post) =>
          post.id === id ? { ...post, ...updated } : post,
        ),
      });
    } catch {
      // Rollback on failure
      set({
        posts: get().posts.map((post) =>
          post.id === id ? { ...post, liked: wasLiked } : post,
        ),
      });
    }
  },

  post: async (text) => {
    const created = await createThread({ text });
    set({ posts: [created, ...get().posts] });
    return created;
  },
}));

export default useFeedStore;
