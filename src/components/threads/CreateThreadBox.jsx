import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import useAuthStore from "../../stores/authStore.js";
import useFeedStore from "../../stores/feedStore.js";
import useMediaPicker from "../../hooks/useMediaPicker.js";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.jsx";
import { Button } from "../ui/button.jsx";
import { Textarea } from "../ui/textarea.jsx";
import MediaPreviews from "../post/MediaPreviews.jsx";

export default function CreateThreadBox() {
  const user = useAuthStore((s) => s.user);
  const createPost = useFeedStore((s) => s.createPost);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  // One image per thread: the feed renders a single image (post.image), so
  // allowing more would silently drop the extras.
  const { files, previews, addFiles, removeFile, resetMedia } = useMediaPicker({
    maxFiles: 1,
  });

  const username =
    user?.username || user?.name || user?.email || "you";
  const avatar =
    user?.avatar || user?.avatar_url || "https://i.pravatar.cc/100?img=5";
  // The backend rejects an empty content even when an image is attached.
  const canPost = text.trim().length > 0 && !posting;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    setError("");
    try {
      await createPost(text, files);
      setText("");
      resetMedia();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không đăng được thread",
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <div
      data-testid="create-thread-box"
      className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] px-4 sm:px-5 py-4 mb-4"
    >
      <div className="flex gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={avatar} alt={username} />
          <AvatarFallback>{username.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold truncate">{username}</p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Có gì mới?"
            rows={2}
            data-testid="create-thread-input"
            className="mt-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 resize-none text-[15px]"
          />
          <MediaPreviews
            files={files}
            previews={previews}
            onRemove={removeFile}
            testId="create-thread-previews"
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                data-testid="create-thread-file-input"
                onChange={(event) => {
                  addFiles(event.target.files);
                  // Let the same file be picked again after it was removed.
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length > 0}
                aria-label="Đính kèm ảnh"
                title="Đính kèm ảnh"
                data-testid="create-thread-upload-media"
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                <ImagePlus className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!canPost}
              onClick={handlePost}
              data-testid="create-thread-submit"
              className="rounded-full px-5 font-bold"
            >
              {posting ? "Đang đăng..." : "Đăng"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
