import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.jsx";
import CommentList from "./CommentList.jsx";
import EmojiPicker from "./EmojiPicker.jsx";
import MediaPreviews from "./MediaPreviews.jsx";
import useAuthStore from "../../stores/authStore.js";
import useMediaPicker from "../../hooks/useMediaPicker.js";
import { createReply } from "../../services/postService.js";

const REPLY_PERMISSIONS = [
  { id: "everyone", label: "Mọi người" },
  { id: "following", label: "Người theo dõi" },
];

// Reply dialog: comment list on top, reply form at the bottom.
const ReplyModal = ({ open, post, onClose, onPosted }) => {
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const {
    files,
    previews,
    addFiles,
    removeFile,
    resetMedia,
  } = useMediaPicker();
  const [permission, setPermission] = useState("everyone");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const gifInputRef = useRef(null);

  const username = user?.username || user?.name || user?.email || "you";
  const avatar =
    user?.avatar_url || user?.avatar || "https://i.pravatar.cc/100?img=5";

  // Release the object URLs of the previews when they are dropped.
  useEffect(() => {
    setText("");
    resetMedia();
    setPermission("everyone");
    setOptionsOpen(false);
    setEmojiOpen(false);
    setError("");
    setRefreshToken((value) => value + 1);
  }, [open, post?.id, resetMedia]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !post) return null;

  const canSend = (text.trim().length > 0 || files.length > 0) && !sending;

  const insertEmoji = (emoji) => {
    const node = textareaRef.current;
    if (!node) {
      setText((value) => value + emoji);
      return;
    }
    const start = node.selectionStart ?? text.length;
    const end = node.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${emoji}${text.slice(end)}`;
    setText(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      node.focus();
      const caret = start + emoji.length;
      node.setSelectionRange(caret, caret);
    });
  };

  const handleSubmit = async () => {
    if (!canSend) return;
    setSending(true);
    setError("");
    try {
      await createReply({
        postId: post.id,
        content: text.trim(),
        files,
        replyPermission: permission,
      });
      toast.success("Đã gửi trả lời");
      setText("");
      resetMedia();
      setRefreshToken((value) => value + 1);
      onPosted?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Không gửi được trả lời");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="reply-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={(event) => {
        event.stopPropagation();
        onClose?.();
      }}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
          <h2 className="font-bold text-[15px]">Trả lời</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            data-testid="reply-close"
            className="text-neutral-500 hover:text-black dark:hover:text-white px-2"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <CommentList postId={post.id} refreshToken={refreshToken} />
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 space-y-2">
          <div className="flex gap-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src={avatar} alt={username} />
              <AvatarFallback>{username.slice(0, 1).toUpperCase()}</AvatarFallback>
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
                data-testid="reply-input"
                rows={2}
                className="w-full resize-none bg-transparent text-[15px] outline-none"
              />

              <MediaPreviews
                files={files}
                previews={previews}
                onRemove={removeFile}
                testId="reply-previews"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                data-testid="reply-file-input"
                onChange={(event) => addFiles(event.target.files)}
              />
              <input
                ref={gifInputRef}
                type="file"
                accept="image/gif"
                multiple
                className="hidden"
                data-testid="reply-gif-input"
                onChange={(event) => addFiles(event.target.files)}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                data-testid="reply-upload-media"
                aria-label="Tải ảnh hoặc video"
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                🖼
              </button>
              <button
                type="button"
                onClick={() => gifInputRef.current?.click()}
                data-testid="reply-upload-gif"
                aria-label="Tải GIF"
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                GIF
              </button>
              <button
                type="button"
                onClick={() => setEmojiOpen((v) => !v)}
                data-testid="reply-emoji"
                aria-label="Chọn emoji"
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                🙂
              </button>

              {emojiOpen && (
                <EmojiPicker
                  onPick={insertEmoji}
                  onClose={() => setEmojiOpen(false)}
                />
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOptionsOpen((v) => !v)}
                  data-testid="reply-options"
                  className="rounded-full px-3 py-1.5 text-[13px] text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Reply options
                </button>
                {optionsOpen && (
                  <div
                    data-testid="reply-options-menu"
                    className="absolute bottom-full left-0 z-10 mb-2 w-44 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-1 shadow-xl"
                  >
                    {REPLY_PERMISSIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setPermission(item.id);
                          setOptionsOpen(false);
                        }}
                        data-testid={`reply-permission-${item.id}`}
                        className={`block w-full rounded-xl px-3 py-2 text-left text-[15px] hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                          permission === item.id ? "font-bold" : ""
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              data-testid="reply-submit"
              className="rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-1.5 text-[15px] font-bold disabled:opacity-40"
            >
              {sending ? "Đang gửi..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyModal;
