// Insights — the backend has no analytics endpoint yet, so this page states
// that honestly instead of bouncing signed-in users back to the feed.
const Insights = () => (
  <div className="pt-4">
    <h1 className="font-bold text-[17px] px-1 pb-3">Thông tin chi tiết</h1>
    <p className="text-sm text-neutral-500 px-1" data-testid="insights-empty">
      Chưa có dữ liệu phân tích. Tính năng này sẽ có khi API sẵn sàng.
    </p>
  </div>
);

export default Insights;
