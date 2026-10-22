import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PostCard from "../components/post/PostCard.jsx";
import { fetchPost } from "../services/postService.js";

// Embeddable post page: /:username/post/:postId/embed
const Embed = () => {
  const { username, postId } = useParams();
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

  const viewUrl = `${window.location.origin}/${username}/post/${postId}`;

  return (
    <div data-testid="embed-page">
      {loading && (
        <p className="text-sm text-neutral-500 p-4" data-testid="embed-loading">
          Đang tải bài viết...
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 p-4">
          {error}
        </p>
      )}

      {post && !loading && (
        <>
          <div className="rounded-3xl bg-white border border-neutral-200 dark:border-neutral-800">
            <PostCard post={post} />
          </div>

          <Link
            to={viewUrl}
            data-testid="embed-view-link"
            className="inline-block mt-3 text-sm font-semibold text-neutral-500 hover:text-black dark:hover:text-white hover:underline"
          >
            View on Threads
          </Link>
        </>
      )}
    </div>
  );
};

export default Embed;
