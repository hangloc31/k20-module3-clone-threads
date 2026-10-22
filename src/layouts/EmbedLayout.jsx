import { Outlet } from "react-router";

// Shell for the embeddable post page: no sidebar, no footer, no nav.
const EmbedLayout = () => (
  <div
    data-testid="embed-layout"
    className="min-h-screen bg-white dark:bg-[#101010] text-neutral-900 dark:text-neutral-100"
  >
    <main className="mx-auto w-full max-w-[640px] px-3 py-4">
      <Outlet />
    </main>
  </div>
);

export default EmbedLayout;
