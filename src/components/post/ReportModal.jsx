import { useEffect, useState } from "react";

const REASONS = [
  { id: "spam", label: "Spam" },
  { id: "misleading", label: "Thông tin sai lệch" },
  { id: "abuse", label: "Lạm dụng hoặc quấy rối" },
  { id: "violence", label: "Bạo lực hoặc nội dung nguy hiểm" },
  { id: "other", label: "Nội dung khác" },
];

// Report dialog: pick a reason and optionally describe the problem.
const ReportModal = ({ open, onClose, onSubmit }) => {
  const [reason, setReason] = useState(REASONS[0].id);
  const [description, setDescription] = useState("");
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
    if (open) {
      setReason(REASONS[0].id);
      setDescription("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await onSubmit?.(reason, description);
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="report-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(event) => {
        event.stopPropagation();
        onClose?.();
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-6 space-y-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-[17px] font-bold">Báo cáo bài viết</h2>
        <p className="text-sm text-neutral-500">
          Cho chúng tôi biết vì sao bạn muốn báo cáo bài viết này.
        </p>

        <div className="space-y-2">
          {REASONS.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 text-[15px] cursor-pointer"
            >
              <input
                type="radio"
                name="report-reason"
                value={item.id}
                checked={reason === item.id}
                onChange={() => setReason(item.id)}
                data-testid={`report-reason-${item.id}`}
                className="accent-black dark:accent-white"
              />
              {item.label}
            </label>
          ))}
        </div>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Mô tả thêm (không bắt buộc)"
          data-testid="report-description"
          rows={3}
          className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-[15px] outline-none resize-none"
        />

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            data-testid="report-cancel"
            className="rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-[15px] font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            data-testid="report-submit"
            className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-[15px] font-bold text-white disabled:opacity-50"
          >
            {busy ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
