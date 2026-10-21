import { useEffect, useRef } from "react";

// Loads the next page when the sentinel scrolls into view.
// Returns a ref to attach to the element at the bottom of the list.
export const useInfiniteScroll = ({
  onLoadMore,
  enabled = true,
  rootMargin = "400px",
} = {}) => {
  const sentinelRef = useRef(null);
  const callbackRef = useRef(onLoadMore);

  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) callbackRef.current?.();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
};
