// Messages — the backend has no messaging endpoint yet, so this page states
// that honestly instead of bouncing signed-in users back to the feed.
const Messages = () => (
  <div className="pt-4">
    <h1 className="font-bold text-[17px] px-1 pb-3">Tin nhắn</h1>
    <p className="text-sm text-neutral-500 px-1" data-testid="messages-empty">
      Chưa có tin nhắn nào. Tính năng này sẽ có khi API sẵn sàng.
    </p>
  </div>
);

export default Messages;
