// Thumbnail grid for the files a composer is about to send. Shared by the
// reply dialog and the create-post box so both preview and remove the same way.
const MediaPreviews = ({
  files,
  previews,
  onRemove,
  testId = "media-previews",
}) => {
  if (!files.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2" data-testid={testId}>
      {previews.map((url, index) => (
        <div key={`${files[index]?.name}-${index}`} className="relative">
          <img
            src={url}
            alt={files[index]?.name}
            className="h-20 w-20 rounded-xl object-cover bg-neutral-200"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label="Xoá ảnh"
            data-testid={`${testId}-remove-${index}`}
            className="absolute -top-2 -right-2 rounded-full bg-black text-white h-5 w-5 text-xs leading-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default MediaPreviews;
