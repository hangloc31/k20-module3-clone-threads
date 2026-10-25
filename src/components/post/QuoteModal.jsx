import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.jsx";
import EmojiPicker from "./EmojiPicker.jsx";
import useAuthStore from "../../stores/authStore.js";
import useFeedStore from "../../stores/feedStore.js";
import { quotePost } from "../../services/postService.js";

// Quote dialog: shows the quoted post and posts your own take.
const QuoteModal = ({ open, post, onClose }) => {
  const user = useAuthStore((s) => s.user);
  const prependPost = useFeedStore((s) => s.prependPost);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const username = user?.username || user?.name || user?.email || "you";
  const avatar =
    user?.avatar_url || user?.avatar || "https://i.pravatar.cc/100?img=5";

  useEffect(() => {
    if (!open) return;
    setText("");
    setFiles([]);
    setPreviews([]);
    setEmojiOpen(false);
    setError("");
  }, [open, post?.id]);

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

  const addFiles = (fileList) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;
    const urls = picked.map((file) => URL.createObjectURL(file));
    setFiles((prev) => [...prev, ...picked]);
    setPreviews((prev) => [...prev, ...urls]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const insertEmoji = (emoji) => {
    const node = textareaRef.current;
    if (!node) {
      setText((value) => value + emoji);
      return;
    }
    const start = node.selectionStart ?? text.length;
    const end = node.selectionEnd ?? text.length;
    setText(`${text.slice(0, start)}${emoji}${text.slice(end)}`);
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
      const created = await quotePost({
        postId: post.id,
        content: text.trim(),
        files,
      });
      prependPost(created);
      toast.success("Đã quote bài viết");
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Không quote được bài viết");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="quote-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={(event) => {
        event.stopPropagation();
        onClose?.();
      }}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-5 space-y-4"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <h2 className="font-bold text-[15px]">Quote</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            data-testid="quote-close"
            className="text-neutral-500 hover:text-black dark:hover:text-white px-2"
          >
            ✕
          </button>
        </header>

        {/* The post being quoted */}
        <div
          data-testid="quote-target"
          className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 flex gap-3"
        >
          <img
            src={post.avatar}
            alt=""
            className="w-9 h-9 rounded-full object-cover bg-neutral-200 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold truncate">{post.username}</p>
            <p className="text-[14px] leading-5 break-words line-clamp-3">
              {post.textPlain || post.text}
            </p>
            {post.image && (
              <img
                src={post.image}
                alt=""
                className="mt-2 max-h-32 rounded-xl object-cover"
              />
            )}
          </div>
        </div>

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
              placeholder="Quote this post..."
              data-testid="quote-input"
              rows={3}
              className="w-full resize-none bg-transparent text-[15px] outline-none"
            />

            {files.length > 0 && (
              <div
                className="flex flex-wrap gap-2 mt-2"
                data-testid="quote-previews"
              >
                {previews.map((url, index) => (
                  <div key={url} className="relative">
                    <img
                      src={url}
                      alt={files[index]?.name}
                      className="h-20 w-20 rounded-xl object-cover bg-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      aria-label="Xoá ảnh"
                      className="absolute -top-2 -right-2 rounded-full bg-black text-white h-5 w-5 text-xs leading-none"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              data-testid="quote-file-input"
              onChange={(event) => addFiles(event.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              data-testid="quote-upload-media"
              aria-label="Tải ảnh hoặc video"
              title="Tải ảnh hoặc video"
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ImagePlus className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setEmojiOpen((v) => !v)}
              data-testid="quote-emoji"
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
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            data-testid="quote-submit"
            className="rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-1.5 text-[15px] font-bold disabled:opacity-40"
          >
            {sending ? "Đang gửi..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;
