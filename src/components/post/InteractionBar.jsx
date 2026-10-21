import { Heart, MessageCircle, Repeat2, Send } from "lucide-react";
import useAuthStore, { selectIsAuthenticated } from "../../stores/authStore.js";
import useFeedStore from "../../stores/feedStore.js";

const btnCls =
  "flex items-center gap-1 text-[13px] text-neutral-500 hover:text-black dark:hover:text-white transition";

const countCls = "tabular-nums";

// Like / Comment / Repost / Share — like is wired to the API, the other
// actions arrive with the reply, repost and share phases.
const InteractionBar = ({ post }) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const like = useFeedStore((s) => s.like);

  const handleLike = () => {
    if (!isAuthenticated) return;
    like(post.id);
  };

  return (
    <div className="flex items-center gap-4 mt-3" data-testid={`actions-${post.id}`}>
      <button
        type="button"
        onClick={handleLike}
        disabled={!isAuthenticated}
        aria-label={post.liked ? "Unlike" : "Like"}
        aria-pressed={Boolean(post.liked)}
        data-testid={`like-${post.id}`}
        className={`${btnCls} disabled:cursor-not-allowed ${
          post.liked ? "text-red-500" : ""
        }`}
      >
        <Heart
          className={`h-4 w-4 ${post.liked ? "fill-red-500 text-red-500" : ""}`}
          aria-hidden="true"
        />
        <span className={countCls}>{post.likes}</span>
      </button>

      <button
        type="button"
        aria-label="Comment"
        data-testid={`comment-${post.id}`}
        className={btnCls}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        <span className={countCls}>{post.replies}</span>
      </button>

      <button
        type="button"
        aria-label="Repost"
        data-testid={`repost-${post.id}`}
        className={`${btnCls} ${post.reposted ? "text-emerald-600" : ""}`}
      >
        <Repeat2
          className={`h-4 w-4 ${post.reposted ? "text-emerald-600" : ""}`}
          aria-hidden="true"
        />
        <span className={countCls}>{post.reposts}</span>
      </button>

      <button
        type="button"
        aria-label="Share"
        data-testid={`share-${post.id}`}
        className={btnCls}
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default InteractionBar;
