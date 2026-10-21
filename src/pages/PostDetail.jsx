import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PostCard from "../components/post/PostCard.jsx";
import { fetchPost } from "../services/postService.js";

// Single post page: /:username/post/:postId
const PostDetail = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="pt-3">
      <div className="mb-3 px-1">
        <Link
          to="/"
          data-testid="post-detail-back"
          className="text-[15px] font-semibold hover:underline"
        >
          ← Quay lại
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-neutral-500 px-2" data-testid="post-detail-loading">
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
        </div>
      )}
    </div>
  );
};

export default PostDetail;
