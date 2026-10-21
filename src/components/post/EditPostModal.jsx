import { useEffect, useState } from "react";

// Edit dialog for your own posts (PUT /api/posts/{id}).
const EditPostModal = ({ open, post, onClose, onSubmit }) => {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setContent(post?.text ?? "");
  }, [open, post]);

  if (!open) return null;

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && trimmed !== (post?.text ?? "").trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit?.(trimmed);
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="edit-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-6 space-y-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-[17px] font-bold">Sửa bài viết</h2>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          data-testid="edit-content"
          rows={5}
          className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-[15px] outline-none resize-none"
        />

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            data-testid="edit-cancel"
            className="rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-[15px] font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || busy}
            data-testid="edit-submit"
            className="rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-[15px] font-bold disabled:opacity-40"
          >
            {busy ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
