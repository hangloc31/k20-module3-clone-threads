import { useEffect, useRef } from "react";

const EMOJIS = [
  "😀", "😂", "🥹", "😍", "🤔", "😅", "😭", "🙄",
  "🔥", "💯", "👏", "🙌", "✨", "🎉", "❤️", "😊",
  "👍", "👎", "🙏", "💪", "👀", "🤯", "😴", "🥺",
];

// Tiny emoji grid; the picked emoji is inserted at the caret position.
const EmojiPicker = ({ onPick, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose?.();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      data-testid="emoji-picker"
      className="absolute bottom-full left-0 z-10 mb-2 w-56 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-2 shadow-xl grid grid-cols-8 gap-1"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onPick?.(emoji)}
          className="rounded-lg p-1 text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPicker;
