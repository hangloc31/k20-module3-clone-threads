// Activity feed — the backend has no notifications endpoint yet.
const Activity = () => (
  <div className="pt-4">
    <h1 className="font-bold text-[17px] px-1 pb-3">Hoạt động</h1>
    <p className="text-sm text-neutral-500 px-1" data-testid="activity-empty">
      Chưa có thông báo nào. Tính năng này sẽ có khi API hoạt động sẵn sàng.
    </p>
  </div>
);

export default Activity;
