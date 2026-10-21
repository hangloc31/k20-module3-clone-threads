import { useCallback, useState } from "react";
import { Link } from "react-router";
import useAuthStore, { selectIsAuthenticated } from "../../stores/authStore.js";
import useFeedStore from "../../stores/feedStore.js";
import ReplyModal from "./ReplyModal.jsx";

function GuestAction({ label, count, testid, icon }) {
  return (
    <Link
      to="/login"
      aria-label={label}
      data-testid={testid}
      className="flex items-center gap-1 text-neutral-500 hover:text-black dark:hover:text-white text-[13px]"
    >
      <span className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
        {icon}
      </span>
      {count && <span>{count}</span>}
    </Link>
  );
}

function LikeButton({ post, icon }) {
  const like = useFeedStore((s) => s.like);
  return (
    <button
      type="button"
      onClick={() => like(post.id)}
      aria-label={post.liked ? "Unlike" : "Like"}
      aria-pressed={Boolean(post.liked)}
      data-testid={`like-${post.id}`}
      className={`flex items-center gap-1 text-[13px] ${
        post.liked
          ? "text-red-500"
          : "text-neutral-500 hover:text-black dark:hover:text-white"
      }`}
    >
      <span className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <span className={post.liked ? "[&_svg]:fill-red-500 [&_svg]:text-red-500" : ""}>
          {icon}
        </span>
      </span>
      {post.likes && <span>{post.likes}</span>}
    </button>
  );
}

const aCls = "w-5 h-5";

const icons = {
  like: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={aCls}>
      <path d="M12 20s-7-4.3-9-9c-1.2-2.8.5-6 3.5-6 2 0 3.5 1.2 4.2 2.6h2.6C14 6.2 15.5 5 17.5 5c3 0 4.7 3.2 3.5 6-2 4.7-9 9-9 9Z" strokeLinejoin="round" />
    </svg>
  ),
  comment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={aCls}>
      <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" strokeLinejoin="round" />
    </svg>
  ),
  repost: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={aCls}>
      <path d="M4 9h13l-3-3M20 15H7l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={aCls}>
      <path d="M12 15V3M7 8l5-5 5 5M5 12v9h14v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// Like / Comment / Repost / Share with the interaction counters.
const InteractionBar = ({ post }) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [replyOpen, setReplyOpen] = useState(false);
  const bumpReplyCount = useFeedStore((s) => s.bumpReplyCount);
  const handlePosted = useCallback(
    () => bumpReplyCount(post.id),
    [bumpReplyCount, post.id],
  );

  return (
    <>
      <div className="flex items-center gap-4 mt-2" data-testid={`actions-${post.id}`}>
        {isAuthenticated ? (
          <LikeButton post={post} icon={icons.like} />
        ) : (
          <GuestAction
            label="Like"
            count={post.likes}
            testid={`like-${post.id}`}
            icon={icons.like}
          />
        )}

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            aria-label="Comment"
            data-testid={`comment-${post.id}`}
            className="flex items-center gap-1 text-[13px] text-neutral-500 hover:text-black dark:hover:text-white"
          >
            <span className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
              {icons.comment}
            </span>
            {post.replies && <span>{post.replies}</span>}
          </button>
        ) : (
          <GuestAction
            label="Comment"
            count={post.replies}
            testid={`comment-${post.id}`}
            icon={icons.comment}
          />
        )}

        <GuestAction
          label="Repost"
          count={post.reposts}
          testid={`repost-${post.id}`}
          icon={icons.repost}
        />
        <GuestAction
          label="Share"
          count={post.shares}
          testid={`share-${post.id}`}
          icon={icons.share}
        />
      </div>

      <ReplyModal
        open={replyOpen}
        post={post}
        onClose={() => setReplyOpen(false)}
        onPosted={handlePosted}
      />
    </>
  );
};

export default InteractionBar;
