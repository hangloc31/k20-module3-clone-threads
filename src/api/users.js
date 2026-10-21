// User endpoints of the F8 Threads API.
import instance from "./axios.js";

export const USERS_ENDPOINTS = {
  suggestions: "/api/users/suggestions",
  follow: (id) => `/api/users/${id}/follow`,
};

// GET /api/users/suggestions -> list of users to follow
export async function fetchSuggestions() {
  const response = await instance.get(USERS_ENDPOINTS.suggestions);
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
    avatar: user.avatar_url ?? `https://i.pravatar.cc/100?u=${user.username ?? user.id}`,
    followersCount: user.followers_count ?? 0,
    isFollowing: Boolean(user.is_following),
  }));
}

// POST /api/users/{id}/follow — follow only (it does NOT toggle).
export async function followUser(id) {
  const response = await instance.post(USERS_ENDPOINTS.follow(id));
  return response.data?.data ?? response.data ?? {};
}

// DELETE /api/users/{id}/follow — unfollow.
export async function unfollowUser(id) {
  const response = await instance.delete(USERS_ENDPOINTS.follow(id));
  return response.data?.data ?? response.data ?? {};
}
