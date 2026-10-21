// Builds API-shaped posts (as returned by GET /api/posts/feed) so tests can
// assert the mapping done by src/lib/postMapper.js.

export const makeApiPost = (overrides = {}) => ({
  id: 1,
  user_id: 10,
  content: "Bài viết mẫu",
  parent_id: null,
  original_post_id: null,
  is_quote: false,
  reply_permission: "everyone",
  requires_reply_approval: false,
  status: "approved",
  is_ghost: false,
  ghost_expires_at: null,
  topic_id: null,
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  likes_count: 1200,
  replies_count: 34,
  is_liked_by_auth: false,
  is_saved_by_auth: false,
  is_reposted_by_auth: false,
  reposts_and_quotes_count: 5,
  media_urls: [],
  user: {
    id: 10,
    name: "Nguyễn Văn A",
    username: "nguyenvana",
    bio: null,
    is_private: false,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_followed_by_auth: false,
    is_muted_by_auth: false,
    is_restricted_by_auth: false,
    avatar_url: "https://i.pravatar.cc/100?img=12",
  },
  original_post: null,
  ...overrides,
});

export const makeApiFeed = (count = 3, overrides = {}) =>
  Array.from({ length: count }, (_, index) =>
    makeApiPost({
      id: index + 1,
      content: `Bài viết số ${index + 1}`,
      ...overrides,
    }),
  );

// Intercepts GET /api/posts/feed and answers with the given pages.
// `pages` is a map of page number -> posts array.
export const mockFeed = (page, pages = { 1: makeApiFeed(3) }) => {
  const requests = [];
  page.route("**/api/posts/feed**", (route) => {
    const url = new URL(route.request().url());
    const currentPage = Number(url.searchParams.get("page") ?? 1);
    requests.push(currentPage);
    const posts = pages[currentPage] ?? [];
    const lastPage = Math.max(...Object.keys(pages).map(Number));
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: posts,
        pagination: {
          current_page: currentPage,
          per_page: 20,
          total: posts.length,
          last_page: lastPage,
          from: posts.length ? 1 : null,
          to: posts.length,
        },
      }),
    });
  });
  return requests;
};
