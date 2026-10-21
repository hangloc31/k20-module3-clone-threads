import { useEffect, useState } from "react";

// Shared confirmation dialog (block a user, delete a post).
const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  destructive = true,
  onConfirm,
  onClose,
}) => {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-6 space-y-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-[17px] font-bold">{title}</h2>
        {description && (
          <p className="text-sm text-neutral-500">{description}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            data-testid="confirm-cancel"
            className="rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-[15px] font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            data-testid="confirm-submit"
            className={`rounded-xl px-4 py-2 text-[15px] font-bold text-white disabled:opacity-50 ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-black hover:bg-neutral-800 dark:bg-white dark:text-black"
            }`}
          >
            {busy ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
