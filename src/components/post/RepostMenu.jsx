import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.jsx";
import useFeedStore from "../../stores/feedStore.js";
import { repostPost } from "../../services/postService.js";
import QuoteModal from "./QuoteModal.jsx";
import { useState } from "react";

const itemCls = "cursor-pointer text-[15px]";

// Repost menu: repost the post as is, or quote it with your own words.
const RepostMenu = ({ post }) => {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const applyRepost = useFeedStore((s) => s.applyRepost);

  const handleRepost = async () => {
    try {
      const { isReposted, repostsCount } = await repostPost(post.id);
      applyRepost(post.id, { isReposted, repostsCount });
      toast.success(isReposted ? "Đã repost" : "Đã bỏ repost");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không repost được bài viết",
      );
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Repost"
            data-testid={`repost-${post.id}`}
            className={`flex items-center gap-1 text-[13px] ${
              post.reposted
                ? "text-emerald-600"
                : "text-neutral-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <span className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className={`w-5 h-5 ${post.reposted ? "text-emerald-600" : ""}`}
              >
                <path
                  d="M4 9h13l-3-3M20 15H7l3 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {post.reposts && <span>{post.reposts}</span>}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            className={itemCls}
            data-testid={`menu-repost-${post.id}`}
            onSelect={() => handleRepost()}
          >
            Repost
          </DropdownMenuItem>
          <DropdownMenuItem
            className={itemCls}
            data-testid={`menu-quote-${post.id}`}
            onSelect={() => setQuoteOpen(true)}
          >
            Quote
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <QuoteModal
        open={quoteOpen}
        post={post}
        onClose={() => setQuoteOpen(false)}
      />
    </>
  );
};

export default RepostMenu;
