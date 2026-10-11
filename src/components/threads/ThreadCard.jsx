import { useState } from "react";
import { Link } from "react-router";
import useAuthStore, { selectIsAuthenticated } from "../../stores/authStore.js";
import useFeedStore from "../../stores/feedStore.js";

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

export default function ThreadCard({ post }) {
  const [muted, setMuted] = useState(true);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const likeIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={aCls}>
      <path d="M12 20s-7-4.3-9-9c-1.2-2.8.5-6 3.5-6 2 0 3.5 1.2 4.2 2.6h2.6C14 6.2 15.5 5 17.5 5c3 0 4.7 3.2 3.5 6-2 4.7-9 9-9 9Z" strokeLinejoin="round" />
    </svg>
  );

  return (
    <article
      data-testid={`thread-${post.id}`}
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
          {post.verified && (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-black dark:text-white shrink-0 self-center" fill="currentColor" aria-label="Verified">
              <path d="M12 2 9.5 4.5 6 4l-.8 3.3L2.5 9l1.7 3L2.5 15l2.7 1.7L6 20l3.5-.5L12 22l2.5-2.5L18 20l.8-3.3L21.5 15l-1.7-3 1.7-3-2.7-1.7L18 4l-3.5.5L12 2Z" />
              <path d="m10.5 12.5 2 2 3.5-4" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <Link to="/login" className="text-neutral-500 font-normal hover:underline shrink-0">
            {post.time}
          </Link>
        </div>
        <span className="flex-1" />
        <Link
          to="/login"
          aria-label="More options"
          className="text-neutral-500 hover:text-black dark:hover:text-white px-2 tracking-widest"
        >
          •••
        </Link>
      </div>

      <div className="pl-[52px]">
        <p className="whitespace-pre-line text-[15px] leading-6 mt-1 break-words">
          {post.text}
        </p>

        {post.hashtags && (
          <p className="mt-1 text-[15px] leading-6 break-words">
            {post.hashtags.map((tag) => (
              <Link key={tag} to="/login" className="hover:underline mr-1">
                {tag}
              </Link>
            ))}{" "}
            {post.showTranslate && (
              <Link
                to="/login"
                data-testid={`translate-${post.id}`}
                className="text-neutral-500 hover:underline"
              >
                Dịch
              </Link>
            )}
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
              className={`w-full object-cover ${post.portrait ? "aspect-[9/16] max-h-[520px]" : "max-h-[480px]"}`}
            />
            {post.video && (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
                aria-pressed={muted}
                data-testid={`mute-${post.id}`}
                className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2.5 text-white backdrop-blur"
              >
                {muted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
                    <path d="m22 9-6 6M16 9l6 6" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 mt-2" data-testid={`actions-${post.id}`}>
          {isAuthenticated ? (
            <LikeButton post={post} icon={likeIcon} />
          ) : (
            <GuestAction
              label="Like"
              count={post.likes}
              testid={`like-${post.id}`}
              icon={likeIcon}
            />
          )}
          <GuestAction
            label="Comment"
            count={post.replies}
            testid={`comment-${post.id}`}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={aCls}>
                <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" strokeLinejoin="round" />
              </svg>
            }
          />
          <GuestAction
            label="Repost"
            count={post.reposts}
            testid={`repost-${post.id}`}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={aCls}>
                <path d="M4 9h13l-3-3M20 15H7l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <GuestAction
            label="Share"
            count={post.shares}
            testid={`share-${post.id}`}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={aCls}>
                <path d="M12 15V3M7 8l5-5 5 5M5 12v9h14v-9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        </div>
      </div>
    </article>
  );
}
