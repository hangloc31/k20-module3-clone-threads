import { useState } from "react";
import { toast } from "sonner";

const embedCode = (url, username, postId) =>
  `<iframe src="${url}" width="640" height="720" style="border:0" title="Post by ${username}"></iframe>`;

// Preview of the embedded post + the iframe snippet to copy.
const EmbedModal = ({ open, post, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const url = `${window.location.origin}/${post.username}/post/${post.id}/embed`;
  const code = embedCode(url, post.username, post.id);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Đã sao chép mã nhúng");
    } catch {
      toast.error("Không sao chép được mã nhúng");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="embed-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[15px]">Get embed code</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            data-testid="embed-close"
            className="text-neutral-500 hover:text-black dark:hover:text-white px-2"
          >
            ✕
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <iframe
            title="Xem trước bài viết nhúng"
            data-testid="embed-preview"
            src={url}
            className="w-full h-[420px] border-0 bg-white"
          />
        </div>

        <textarea
          readOnly
          value={code}
          data-testid="embed-code"
          rows={3}
          onFocus={(event) => event.target.select()}
          className="w-full resize-none rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-[13px] font-mono outline-none"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-[15px] font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleCopy}
            data-testid="embed-copy"
            className="rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-[15px] font-bold"
          >
            {copied ? "Đã sao chép" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbedModal;
