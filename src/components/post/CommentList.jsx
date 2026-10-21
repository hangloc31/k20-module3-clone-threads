import { useCallback, useEffect, useState } from "react";
import PostCard from "./PostCard.jsx";
import { fetchReplies } from "../../services/postService.js";

// Comments of a post: GET /api/posts/{id}/replies
const CommentList = ({ postId, refreshToken = 0 }) => {
  const [replies, setReplies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (targetPage = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");
      try {
        const { replies: items, pagination } = await fetchReplies(postId, {
          page: targetPage,
        });
        setReplies((prev) => (append ? [...prev, ...items] : items));
        setPage(targetPage);
        setHasMore(
          pagination ? targetPage < (pagination.last_page ?? targetPage) : false,
        );
      } catch (err) {
        setError(err?.response?.data?.message || "Không tải được bình luận");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [postId],
  );

  useEffect(() => {
    load(1, false);
  }, [load, refreshToken]);

  if (loading) {
    return (
      <p className="px-4 py-6 text-sm text-neutral-500" data-testid="comment-loading">
        Đang tải bình luận...
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="px-4 py-6 text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (replies.length === 0) {
    return (
      <p
        className="px-4 py-6 text-sm text-neutral-500"
        data-testid="comment-empty"
      >
        Chưa có bình luận nào. Hãy là người đầu tiên trả lời.
      </p>
    );
  }

  return (
    <div data-testid="comment-list">
      {replies.map((reply) => (
        <PostCard key={reply.id} post={reply} />
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={() => load(page + 1, true)}
          disabled={loadingMore}
          data-testid="comment-load-more"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 py-2 text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50"
        >
          {loadingMore ? "Đang tải..." : "Xem thêm bình luận"}
        </button>
      )}
    </div>
  );
};

export default CommentList;
