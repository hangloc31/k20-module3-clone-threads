import { useState } from "react";
import { Link, useNavigate } from "react-router";
import InteractionBar from "./InteractionBar.jsx";
import PostMenu from "./PostMenu.jsx";
import useAuthStore, { selectIsAuthenticated } from "../../stores/authStore.js";

const aCls = "w-5 h-5";

function VerifiedBadge() {
  return (
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
}

// A single post: avatar, author, timestamp, content, media and the
// interaction bar (mirrors the Threads card).
const PostCard = ({ post }) => {
  const [muted, setMuted] = useState(true);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const navigate = useNavigate();
  const detailUrl = `/${post.username}/post/${post.id}`;

  // Menus and dialogs render in portals, so their clicks still bubble
  // through the React tree — ignore them for the card navigation.
  const handleCardClick = (event) => {
    const target = event.target;
    if (
      target?.closest?.(
        "[role='menu'], [role='dialog'], [data-radix-popper-content-wrapper]",
      )
    ) {
      return;
    }
    navigate(detailUrl);
  };

  return (
    <article
      data-testid={`post-${post.id}`}
      onClick={handleCardClick}
      className="cursor-pointer rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] px-4 sm:px-5 py-4 mb-4"
    >
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          onClick={(event) => event.stopPropagation()}
          aria-label={`${post.username} profile`}
          className="shrink-0"
        >
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
          <Link
            to="/login"
            onClick={(event) => event.stopPropagation()}
            className="font-semibold hover:underline truncate"
          >
            {post.username}
          </Link>
          {post.verified && <VerifiedBadge />}
          <Link
            to="/login"
            onClick={(event) => event.stopPropagation()}
            className="text-neutral-500 font-normal hover:underline shrink-0"
          >
            {post.time}
          </Link>
        </div>
        <span className="flex-1" />
        {isAuthenticated ? (
          <PostMenu post={post} />
        ) : (
          <Link
            to="/login"
            onClick={(event) => event.stopPropagation()}
            aria-label="More options"
            className="text-neutral-500 hover:text-black dark:hover:text-white px-2 tracking-widest"
          >
            •••
          </Link>
        )}
      </div>

      <div className="pl-[52px]">
        {post.textPlain && (
          <p
            data-testid={`post-text-${post.id}`}
            className="whitespace-pre-line text-[15px] leading-6 mt-1 break-words"
          >
            {post.textPlain}
          </p>
        )}

        {post.hashtags.length > 0 && (
          <p className="mt-1 text-[15px] leading-6 break-words">
            {post.hashtags.map((tag) => (
              <Link
                key={tag}
                to="/login"
                onClick={(event) => event.stopPropagation()}
                className="hover:underline mr-1"
              >
                {tag}
              </Link>
            ))}{" "}
            <Link
              to="/login"
              onClick={(event) => event.stopPropagation()}
              data-testid={`translate-${post.id}`}
              className="text-neutral-500 hover:underline"
            >
              Dịch
            </Link>
          </p>
        )}

        {post.image && (
          <div
            className={`relative mt-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 ${
              post.portrait ? "max-w-[280px]" : ""
            }`}
          >
            <img
              src={post.image}
              alt=""
              loading="lazy"
              className={`w-full object-cover ${
                post.portrait ? "aspect-[9/16] max-h-[520px]" : "max-h-[480px]"
              }`}
            />
            {post.video && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMuted((m) => !m);
                }}
                aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
                aria-pressed={muted}
                data-testid={`mute-${post.id}`}
                className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2.5 text-white backdrop-blur"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={aCls}>
                  <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
                  <path d="m22 9-6 6M16 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        )}

        <InteractionBar post={post} />
      </div>
    </article>
  );
};

export default PostCard;
