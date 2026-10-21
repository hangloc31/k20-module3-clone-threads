// Post endpoints of the F8 Threads API.
// Every call goes through the shared axios instance, so the Bearer token is
// attached automatically for signed-in users (see api/axios.js).
import instance from "./axios.js";
import { mapPost, mapPosts } from "../lib/postMapper.js";

export const POSTS_ENDPOINTS = {
  feed: "/api/posts/feed",
  post: (id) => `/api/posts/${id}`,
  replies: (id) => `/api/posts/${id}/replies`,
  like: (id) => `/api/posts/${id}/like`,
  followings: (userId) => `/api/users/${userId}/followings`,
};

// GET /api/posts/feed?page=&per_page= -> { data: [...], pagination: {...} }
export async function fetchFeed({ page = 1, perPage = 20 } = {}) {
  const response = await instance.get(POSTS_ENDPOINTS.feed, {
    params: { page, per_page: perPage },
  });
  const body = response.data ?? {};
  const items = Array.isArray(body.data) ? body.data : (body.data?.posts ?? []);
  return {
    posts: mapPosts(items),
    pagination: body.pagination ?? null,
  };
}

// GET /api/posts/{id} -> single post
export async function fetchPost(id) {
  const response = await instance.get(POSTS_ENDPOINTS.post(id));
  const body = response.data ?? {};
  const post = body.data?.post ?? body.data ?? body;
  return mapPost(post);
}

// GET /api/posts/{id}/replies?page= -> { data: [...], pagination: {...} }
export async function fetchReplies(id, { page = 1, perPage = 20 } = {}) {
  const response = await instance.get(POSTS_ENDPOINTS.replies(id), {
    params: { page, per_page: perPage },
  });
  const body = response.data ?? {};
  const items = Array.isArray(body.data) ? body.data : [];
  return {
    replies: mapPosts(items),
    pagination: body.pagination ?? null,
  };
}

// POST /api/posts/{id}/like — toggles. -> { is_liked, likes_count }
export async function toggleLike(id) {
  const response = await instance.post(POSTS_ENDPOINTS.like(id));
  const data = response.data?.data ?? {};
  return {
    isLiked: Boolean(data.is_liked),
    likesCount: data.likes_count ?? null,
  };
}

// POST /api/posts — { content }
export async function createPost({ content }) {
  const response = await instance.post("/api/posts", { content });
  const body = response.data ?? {};
  return mapPost(body.data?.post ?? body.data ?? body);
}

// GET /api/users/{id}/followings -> list of users the account follows
export async function fetchFollowings(userId) {
  if (!userId) return [];
  const response = await instance.get(POSTS_ENDPOINTS.followings(userId));
  const body = response.data ?? {};
  const items = Array.isArray(body.data)
    ? body.data
    : (body.data?.users ?? body.data?.followings ?? []);
  return items.map((user) => user?.username).filter(Boolean);
}
