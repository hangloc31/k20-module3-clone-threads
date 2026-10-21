// Offline fallback used when the real API is unreachable.
// It mirrors the shape of src/api/posts.js so the store does not care which
// source produced the posts.
import { threadsFeed as seedFeed } from "../mocks/threadsFeed.js";
import { formatCount, parseCount } from "../lib/format.js";

const STORAGE_KEY = "threads-feed-mock-v1";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seedPosts = seedFeed.map((post) => ({
  id: post.id,
  userId: post.username,
  username: post.username,
  name: post.username,
  avatar: post.avatar,
  verified: Boolean(post.verified),
  time: post.time,
  createdAt: null,
  text: post.text,
  hashtags: post.hashtags ?? [],
  image: post.image ?? null,
  video: post.video ?? null,
  likes: post.likes ?? "0",
  likesCount: parseCount(post.likes),
  replies: post.replies ?? "0",
  repliesCount: parseCount(post.replies),
  reposts: post.reposts ?? "0",
  repostsCount: parseCount(post.reposts),
  liked: false,
  saved: false,
  reposted: false,
  isGhost: false,
  isQuote: false,
  originalPost: null,
}));

const loadStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.posts)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveStore = (store) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private-mode errors in the mock layer
  }
};

const ensureStore = () => {
  const existing = loadStore();
  if (existing) {
    // Older sessions stored a slightly different shape — normalise it.
    const posts = existing.posts.map((post) => ({
      ...post,
      likesCount: post.likesCount ?? parseCount(post.likes),
      repliesCount: post.repliesCount ?? parseCount(post.replies),
      repostsCount: post.repostsCount ?? parseCount(post.reposts),
      liked: existing.likedIds?.includes(post.id) ?? false,
    }));
    const store = { posts, likedIds: existing.likedIds ?? [] };
    saveStore(store);
    return store;
  }
  const fresh = { posts: seedPosts, likedIds: [] };
  saveStore(fresh);
  return fresh;
};

export async function fetchFeedMock({ page = 1, perPage = 20 } = {}) {
  await delay(250);
  const store = ensureStore();
  const start = (page - 1) * perPage;
  const slice = store.posts.slice(start, start + perPage);
  return {
    posts: slice.map((post) => ({ ...post, liked: store.likedIds.includes(post.id) })),
    pagination: {
      current_page: page,
      per_page: perPage,
      total: store.posts.length,
      last_page: Math.max(1, Math.ceil(store.posts.length / perPage)),
      from: start + 1,
      to: start + slice.length,
    },
  };
}

export async function toggleLikeMock(id) {
  await delay(120);
  const store = ensureStore();
  const liked = store.likedIds.includes(id);
  const likedIds = liked
    ? store.likedIds.filter((postId) => postId !== id)
    : [...store.likedIds, id];

  const posts = store.posts.map((post) => {
    if (post.id !== id) return post;
    const likesCount = Math.max(0, (post.likesCount ?? 0) + (liked ? -1 : 1));
    return { ...post, likesCount, likes: formatCount(likesCount) };
  });

  saveStore({ posts, likedIds });
  const updated = posts.find((post) => post.id === id);
  return { isLiked: !liked, likesCount: updated?.likesCount ?? 0 };
}

export async function createPostMock({ content }) {
  const text = content?.trim();
  if (!text) throw new Error("Nội dung bài viết không được để trống");
  await delay(250);
  const store = ensureStore();
  const post = {
    id: `local-${Date.now()}`,
    userId: "you",
    username: "you",
    name: "you",
    avatar: "https://i.pravatar.cc/100?img=5",
    verified: false,
    time: "vừa xong",
    createdAt: new Date().toISOString(),
    text,
    hashtags: [],
    image: null,
    video: null,
    likes: "0",
    likesCount: 0,
    replies: "0",
    repliesCount: 0,
    reposts: "0",
    repostsCount: 0,
    liked: false,
    saved: false,
    reposted: false,
    isGhost: false,
    isQuote: false,
    originalPost: null,
  };
  saveStore({ posts: [post, ...store.posts], likedIds: store.likedIds });
  return post;
}
