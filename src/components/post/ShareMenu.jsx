import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.jsx";
import CopyImageModal from "./CopyImageModal.jsx";
import EmbedModal from "./EmbedModal.jsx";

const itemCls = "cursor-pointer text-[15px]";

// Share menu: copy the post as an image or grab the embed code.
// "Copy link" lives in the post menu (•••).
const ShareMenu = ({ post }) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            aria-label="Share"
            data-testid={`share-${post.id}`}
            className="flex items-center gap-1 text-[13px] text-neutral-500 hover:text-black dark:hover:text-white"
          >
            <span className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="w-5 h-5"
              >
                <path
                  d="M12 15V3M7 8l5-5 5 5M5 12v9h14v-9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-48">
          onClick={(event) => event.stopPropagation()}
          <DropdownMenuItem
            className={itemCls}
            data-testid={`menu-copy-image-${post.id}`}
            onSelect={() => setImageOpen(true)}
          >
            Copy as image
          </DropdownMenuItem>
          <DropdownMenuItem
            className={itemCls}
            data-testid={`menu-embed-${post.id}`}
            onSelect={() => setEmbedOpen(true)}
          >
            Get embed code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CopyImageModal
        open={imageOpen}
        post={post}
        onClose={() => setImageOpen(false)}
      />
      <EmbedModal open={embedOpen} post={post} onClose={() => setEmbedOpen(false)} />
    </>
  );
};

export default ShareMenu;
