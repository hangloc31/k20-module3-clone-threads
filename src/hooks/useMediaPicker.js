import { useCallback, useEffect, useRef, useState } from "react";

// Attachments for a composer: picked files plus an object-URL preview each.
// Object URLs are revoked when a file is removed, when the composer is reset
// after a successful post, and when the component unmounts — a long-lived
// feed must not leak blob URLs for every abandoned draft.
const useMediaPicker = ({ maxFiles = Infinity } = {}) => {
  const itemsRef = useRef([]);
  const [items, setItems] = useState([]);

  const commit = useCallback((next) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const addFiles = useCallback(
    (fileList) => {
      const picked = Array.from(fileList || []);
      if (!picked.length) return;
      const room = Math.max(0, maxFiles - itemsRef.current.length);
      if (!room) return;
      const accepted = picked.slice(0, room).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      commit([...itemsRef.current, ...accepted]);
    },
    [commit, maxFiles],
  );

  const removeFile = useCallback(
    (index) => {
      const target = itemsRef.current[index];
      if (!target) return;
      URL.revokeObjectURL(target.url);
      commit(itemsRef.current.filter((_, i) => i !== index));
    },
    [commit],
  );

  const resetMedia = useCallback(() => {
    itemsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    commit([]);
  }, [commit]);

  useEffect(
    () => () => {
      itemsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
      itemsRef.current = [];
    },
    [],
  );

  return {
    files: items.map(({ file }) => file),
    previews: items.map(({ url }) => url),
    addFiles,
    removeFile,
    resetMedia,
  };
};

export default useMediaPicker;
