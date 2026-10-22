import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import PostCard from "../components/post/PostCard.jsx";
import CommentList from "../components/post/CommentList.jsx";
import ShareMenu from "../components/post/ShareMenu.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar.jsx";
import useAuthStore, { selectIsAuthenticated } from "../stores/authStore.js";
import { createReply, fetchPost } from "../services/postService.js";

// Single post page: /:username/post/:postId
// The post on top, its comments below and an inline reply box (Threads style).
const PostDetail = () => {
  const { postId } = useParams();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const textareaRef = useRef(null);

  const username = user?.username || user?.name || user?.email || "you";
  const avatar =
    user?.avatar_url || user?.avatar || "https://i.pravatar.cc/100?img=5";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchPost(postId)
      .then((data) => {
        if (!cancelled) setPost(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.message || "Không tải được bài viết",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleReply = async () => {
    const content = text.trim();
    if (!content || !post) return;
    setSending(true);
    setReplyError("");
    try {
      await createReply({ postId: post.id, content });
      toast.success("Đã gửi trả lời");
      setText("");
      setRefreshToken((value) => value + 1);
      setPost((current) =>
        current
          ? {
              ...current,
              repliesCount: (current.repliesCount ?? 0) + 1,
            }
          : current,
      );
    } catch (err) {
      setReplyError(
        err?.response?.data?.message || "Không gửi được trả lời",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-3" data-testid="post-detail-page">
      {loading && (
        <p
          className="text-sm text-neutral-500 px-2"
          data-testid="post-detail-loading"
        >
          Đang tải bài viết...
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 px-2">
          {error}
        </p>
      )}

      {post && !loading && (
        <div data-testid="post-detail">
          <PostCard post={post} />

          {/* Comments */}
          <section className="mt-2">
            <h2 className="px-1 py-2 text-[15px] font-bold">
              Bình luận{post.repliesCount ? ` (${post.repliesCount})` : ""}
            </h2>
            <CommentList postId={post.id} refreshToken={refreshToken} />
          </section>

          {/* Inline reply box */}
          {isAuthenticated ? (
            <div className="mt-2 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] px-4 py-3 flex gap-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={avatar} alt={username} />
                <AvatarFallback>
                  {username.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-neutral-500">
                  {username}
                </p>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={`Reply to ${post.username}...`}
                  data-testid="post-detail-reply-input"
                  rows={2}
                  className="w-full resize-none bg-transparent text-[15px] outline-none"
                />
                {replyError && (
                  <p role="alert" className="text-sm text-red-600">
                    {replyError}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <ShareMenu post={post} />
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={!text.trim() || sending}
                    data-testid="post-detail-reply-submit"
                    className="rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-1.5 text-[15px] font-bold disabled:opacity-40"
                  >
                    {sending ? "Đang gửi..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-2 px-2 text-sm text-neutral-500">
              <a
                href="/login"
                className="font-semibold text-black dark:text-white underline"
              >
                Đăng nhập
              </a>{" "}
              để trả lời bài viết này.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PostDetail;
