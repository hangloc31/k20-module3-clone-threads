// Inserts a picked emoji at the caret of a textarea (or input) and puts the
// caret right after it. Falls back to appending when the field is not mounted,
// so a picker opened before the textarea rendered still works.
const insertEmojiAtCaret = ({ node, value, emoji, setValue, onDone }) => {
  if (!node) {
    setValue((current) => `${current}${emoji}`);
    onDone?.();
    return;
  }

  const start = node.selectionStart ?? value.length;
  const end = node.selectionEnd ?? value.length;
  setValue(`${value.slice(0, start)}${emoji}${value.slice(end)}`);
  onDone?.();

  requestAnimationFrame(() => {
    node.focus();
    const caret = start + emoji.length;
    node.setSelectionRange(caret, caret);
  });
};

export default insertEmojiAtCaret;
