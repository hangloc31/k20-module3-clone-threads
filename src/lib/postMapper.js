import {
  extractHashtags,
  formatCount,
  formatRelativeTime,
} from "./format.js";

const AVATAR_FALLBACK = "https://i.pravatar.cc/100?u=";
const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;

// Maps an API post (GET /api/posts/feed) to the view model used by PostCard.
export const mapPost = (post) => {
  if (!post) return null;
  const user = post.user ?? {};
  const media = Array.isArray(post.media_urls) ? post.media_urls : [];
  const video = media.find((url) => VIDEO_EXT.test(url)) ?? null;
  const image = media.find((url) => url !== video) ?? null;
  const likesCount = post.likes_count ?? 0;
  const repliesCount = post.replies_count ?? 0;
  const repostsCount = post.reposts_and_quotes_count ?? 0;
  const hashtags = extractHashtags(post.content);
  const textPlain = hashtags.length
    ? (post.content ?? "").replace(/#[\p{L}\p{N}_]+/gu, "").trim()
    : (post.content ?? "");

  return {
    id: post.id,
    userId: post.user_id,
    username: user.username ?? "",
    name: user.name ?? user.username ?? "",
    avatar: user.avatar_url || `${AVATAR_FALLBACK}${user.username ?? post.user_id}`,
    verified: Boolean(user.verified),
    time: formatRelativeTime(post.created_at),
    createdAt: post.created_at,
    text: post.content ?? "",
    textPlain,
    hashtags,
    image,
    video,
    likes: formatCount(likesCount),
    likesCount,
    replies: formatCount(repliesCount),
    repliesCount,
    reposts: formatCount(repostsCount),
    repostsCount,
    liked: Boolean(post.is_liked_by_auth),
    saved: Boolean(post.is_saved_by_auth),
    reposted: Boolean(post.is_reposted_by_auth),
    isGhost: Boolean(post.is_ghost),
    isQuote: Boolean(post.is_quote),
    authorMuted: Boolean(user.is_muted_by_auth),
    authorRestricted: Boolean(user.is_restricted_by_auth),
    originalPost: post.original_post ? mapPost(post.original_post) : null,
    replyPermission: post.reply_permission ?? "everyone",
  };
};

export const mapPosts = (posts) =>
  (Array.isArray(posts) ? posts : []).map(mapPost).filter(Boolean);
