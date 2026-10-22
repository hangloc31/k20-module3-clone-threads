import { useEffect, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

// Renders the post card as an image (html-to-image) and offers the download.
const CopyImageModal = ({ open, post, onClose }) => {
  const [dataUrl, setDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setDataUrl("");
      setError("");
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError("");

    const node = document.querySelector(`[data-testid="post-${post.id}"]`);
    if (!node) {
      setLoading(false);
      setError("Không tìm thấy bài viết để tạo ảnh");
      return undefined;
    }

    toPng(node, { cacheBust: true, pixelRatio: 2 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("Không tạo được ảnh từ bài viết");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, post?.id]);

  if (!open) return null;

  const fileName = `threads-${post.username}-${post.id}.png`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.click();
    toast.success("Đã tải ảnh bài viết");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="copy-image-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(event) => {
        event.stopPropagation();
        onClose?.();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[15px]">Copy as image</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            data-testid="copy-image-close"
            className="text-neutral-500 hover:text-black dark:hover:text-white px-2"
          >
            ✕
          </button>
        </div>

        {loading && (
          <p className="text-sm text-neutral-500" data-testid="copy-image-loading">
            Đang tạo ảnh...
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {dataUrl && (
          <>
            <img
              src={dataUrl}
              alt="Bản xem trước của bài viết"
              data-testid="copy-image-preview"
              className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800"
            />
            <button
              type="button"
              onClick={handleDownload}
              data-testid="copy-image-download"
              className="w-full rounded-xl bg-black text-white dark:bg-white dark:text-black py-2 font-semibold"
            >
              Tải về
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CopyImageModal;
