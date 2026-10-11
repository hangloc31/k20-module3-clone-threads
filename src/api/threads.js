// Mock threads feed API — same interface as future real API.
// Swap function bodies to call `instance` when backend feed endpoints exist.
import { threadsFeed as seedFeed } from "../mocks/threadsFeed.js";

const STORAGE_KEY = "threads-feed-mock-v1";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseCount = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return 0;
  if (value.endsWith("K")) return Math.round(num * 1000);
  if (value.endsWith("M")) return Math.round(num * 1000000);
  return Math.round(num);
};

const formatCount = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.posts)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private-mode errors in mock layer
  }
}

function ensureStore() {
  const existing = loadStore();
  if (existing) return existing;
  const fresh = {
    posts: seedFeed,
    likedIds: [],
  };
  saveStore(fresh);
  return fresh;
}

export async function getFeed() {
  await delay(300);
  const store = ensureStore();
  return store.posts.map((post) => ({
    ...post,
    liked: store.likedIds.includes(post.id),
  }));
}

export async function toggleLike(id) {
  await delay(150);
  const store = ensureStore();
  const liked = store.likedIds.includes(id);
  const likedIds = liked
    ? store.likedIds.filter((postId) => postId !== id)
    : [...store.likedIds, id];

  const posts = store.posts.map((post) => {
    if (post.id !== id) return post;
    const next = parseCount(post.likes) + (liked ? -1 : 1);
    return { ...post, likes: formatCount(Math.max(0, next)) };
  });

  saveStore({ posts, likedIds });
  const updated = posts.find((post) => post.id === id);
  return { ...updated, liked: !liked };
}

export async function createThread({ text }) {
  const content = text?.trim();
  if (!content) throw new Error("Nội dung thread không được để trống");
  await delay(300);
  const store = ensureStore();
  const post = {
    id: `local-${Date.now()}`,
    username: "you",
    verified: false,
    time: "Vừa xong",
    avatar: "https://i.pravatar.cc/100?img=5",
    text: content,
    hashtags: [],
    likes: "0",
    replies: "0",
    reposts: "0",
    shares: "0",
  };
  const next = { posts: [post, ...store.posts], likedIds: store.likedIds };
  saveStore(next);
  return { ...post, liked: false };
}
