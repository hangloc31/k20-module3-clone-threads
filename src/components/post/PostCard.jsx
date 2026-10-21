import { Link } from "react-router";
import InteractionBar from "./InteractionBar.jsx";

const VerifiedBadge = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 text-black dark:text-white shrink-0 self-center"
    fill="currentColor"
    aria-label="Verified"
  >
    <path d="M12 2 9.5 4.5 6 4l-.8 3.3L2.5 9l1.7 3L2.5 15l2.7 1.7L6 20l3.5-.5L12 22l2.5-2.5L18 20l.8-3.3L21.5 15l-1.7-3 1.7-3-2.7-1.7L18 4l-3.5-.5L12 2Z" />
    <path
      d="m10.5 12.5 2 2 3.5-4"
      stroke="#fff"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// A single post: avatar, author, timestamp, content, media and the
// interaction bar.
const PostCard = ({ post }) => (
  <article
    data-testid={`post-${post.id}`}
    className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] px-4 sm:px-5 py-4 mb-4"
  >
    <div className="flex items-center gap-3">
      <Link to="/login" aria-label={`${post.username} profile`} className="shrink-0">
        <img
          src={post.avatar}
          alt={`${post.username}'s profile picture`}
          width={40}
          height={40}
          loading="lazy"
          className="w-10 h-10 rounded-full object-cover bg-neutral-200 dark:bg-neutral-800"
        />
      </Link>

      <div className="flex items-baseline gap-1.5 text-[15px] min-w-0">
        <Link to="/login" className="font-semibold hover:underline truncate">
          {post.username}
        </Link>
        {post.verified && <VerifiedBadge />}
        <span className="text-neutral-500 font-normal shrink-0">{post.time}</span>
      </div>
    </div>

    <div className="pl-[52px]">
      {post.text && (
        <p
          data-testid={`post-text-${post.id}`}
          className="whitespace-pre-line text-[15px] leading-6 mt-1 break-words"
        >
          {post.text}
        </p>
      )}

      {post.image && (
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <img
            src={post.image}
            alt=""
            loading="lazy"
            className="w-full object-cover max-h-[520px]"
          />
        </div>
      )}

      {post.isQuote && post.originalPost && (
        <div className="mt-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3">
          <p className="text-[13px] font-semibold text-neutral-500">
            {post.originalPost.username}
          </p>
          <p className="text-[14px] leading-5 break-words">
            {post.originalPost.text}
          </p>
        </div>
      )}

      <InteractionBar post={post} />
    </div>
  </article>
);

export default PostCard;
