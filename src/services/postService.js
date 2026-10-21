// Every API call the post UI needs: feed, post detail, replies and the
// actions behind the post menu (save, hide, report, edit, delete, mute,
// restrict, block). All calls go through the shared axios instance, so the
// Bearer token is attached automatically for signed-in users.
import instance from "../api/axios.js";
import { mapPost, mapPosts } from "../lib/postMapper.js";

export const POSTS_ENDPOINTS = {
  feed: "/api/posts/feed",
  post: (id) => `/api/posts/${id}`,
  replies: (id) => `/api/posts/${id}/replies`,
  reply: (id) => `/api/posts/${id}/reply`,
  like: (id) => `/api/posts/${id}/like`,
  repost: (id) => `/api/posts/${id}/repost`,
  quote: (id) => `/api/posts/${id}/quote`,
  save: (id) => `/api/posts/${id}/save`,
  hide: (id) => `/api/posts/${id}/hide`,
  report: (id) => `/api/posts/${id}/report`,
  userAction: (id, action) => `/api/users/${id}/${action}`,
};

// The shared axios instance defaults to JSON. Multipart requests must
// declare their content type, otherwise axios' transformRequest turns the
// FormData into JSON and the backend cannot parse the files.
const MULTIPART = { "Content-Type": "multipart/form-data" };

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

// POST /api/posts/{id}/reply — multipart: content + media[] files.
// reply_permission ("everyone" | "following") is honoured by the backend.
// Note: parent_id is ignored — a reply always belongs to the post itself.
export async function createReply({
  postId,
  content,
  files = [],
  replyPermission = "everyone",
}) {
  const form = new FormData();
  form.append("content", content);
  form.append("reply_permission", replyPermission);
  for (const file of files) {
    form.append("media[]", file);
  }
  const response = await instance.post(POSTS_ENDPOINTS.reply(postId), form, {
    headers: MULTIPART,
  });
  const body = response.data ?? {};
  return mapPost(body.data?.post ?? body.data ?? body);
}

// POST /api/upload/media — multipart: media[] files. Returns the CDN urls.
export async function uploadMedia(files = []) {
  const form = new FormData();
  for (const file of files) {
    form.append("media[]", file);
  }
  const response = await instance.post("/api/upload/media", form, {
    headers: MULTIPART,
  });
  const body = response.data ?? {};
  return body.data?.urls ?? [];
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

// POST /api/posts/{id}/repost — toggles. -> { is_reposted, reposts_and_quotes_count }
export async function repostPost(id) {
  const response = await instance.post(POSTS_ENDPOINTS.repost(id));
  const data = response.data?.data ?? {};
  return {
    isReposted: Boolean(data.is_reposted),
    repostsCount: data.reposts_and_quotes_count ?? null,
  };
}

// POST /api/posts/{id}/quote — multipart: content + media[] files.
// Creates a new post with is_quote = true and original_post_id.
export async function quotePost({ postId, content, files = [] }) {
  const form = new FormData();
  form.append("content", content);
  for (const file of files) {
    form.append("media[]", file);
  }
  const response = await instance.post(POSTS_ENDPOINTS.quote(postId), form, {
    headers: MULTIPART,
  });
  const body = response.data ?? {};
  return mapPost(body.data?.post ?? body.data ?? body);
}

// POST /api/posts/{id}/save — toggles. -> { is_saved }
export async function savePost(id) {
  const response = await instance.post(POSTS_ENDPOINTS.save(id));
  const data = response.data?.data ?? {};
  return { isSaved: Boolean(data.is_saved) };
}

// POST /api/posts/{id}/hide — "Not interested".
export async function hidePost(id) {
  const response = await instance.post(POSTS_ENDPOINTS.hide(id));
  const data = response.data?.data ?? {};
  return { isHidden: Boolean(data.is_hidden) };
}

// POST /api/posts/{id}/report — { reason, description }
export async function reportPost(id, { reason, description = "" }) {
  const response = await instance.post(POSTS_ENDPOINTS.report(id), {
    reason,
    description,
  });
  return response.data?.data ?? response.data ?? {};
}

// PUT /api/posts/{id} — { content }
export async function updatePost(id, { content }) {
  const response = await instance.put(POSTS_ENDPOINTS.post(id), { content });
  const body = response.data ?? {};
  return mapPost(body.data?.post ?? body.data ?? body);
}

// DELETE /api/posts/{id}
export async function deletePost(id) {
  const response = await instance.delete(POSTS_ENDPOINTS.post(id));
  return response.data?.data ?? response.data ?? {};
}

// Mute / restrict / block a user. These endpoints do NOT toggle: the
// matching DELETE undoes the action.
const userAction = async (id, action, method = "post") => {
  const response = await instance[method](
    POSTS_ENDPOINTS.userAction(id, action),
  );
  return response.data?.data ?? response.data ?? {};
};

export const muteUser = (id) => userAction(id, "mute");
export const unmuteUser = (id) => userAction(id, "mute", "delete");
export const restrictUser = (id) => userAction(id, "restrict");
export const unrestrictUser = (id) => userAction(id, "restrict", "delete");
export const blockUser = (id) => userAction(id, "block");
export const unblockUser = (id) => userAction(id, "block", "delete");

// GET /api/users/suggestions -> list of users to follow
export async function fetchSuggestions() {
  const response = await instance.get("/api/users/suggestions");
  const body = response.data ?? {};
  const items = Array.isArray(body.data)
    ? body.data
    : (body.data?.users ?? body.data?.suggestions ?? []);
  return items.map((user) => ({
    id: user.id,
    username: user.username ?? "",
    name: user.name ?? user.username ?? "",
    bio: user.bio ?? "",
    verified: Boolean(user.verified),
    avatar:
      user.avatar_url ?? `https://i.pravatar.cc/100?u=${user.username ?? user.id}`,
    followersCount: user.followers_count ?? 0,
    isFollowing: Boolean(user.is_following),
  }));
}

// POST /api/users/{id}/follow — follow only (it does NOT toggle).
export async function followUser(id) {
  const response = await instance.post(`/api/users/${id}/follow`);
  return response.data?.data ?? response.data ?? {};
}

// DELETE /api/users/{id}/follow — unfollow.
export async function unfollowUser(id) {
  const response = await instance.delete(`/api/users/${id}/follow`);
  return response.data?.data ?? response.data ?? {};
}
