import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.jsx";
import useAuthStore, { selectIsAuthenticated } from "../../stores/authStore.js";
import useFeedStore from "../../stores/feedStore.js";
import ConfirmModal from "./ConfirmModal.jsx";
import ReportModal from "./ReportModal.jsx";
import EditPostModal from "./EditPostModal.jsx";
import {
  blockUser,
  deletePost,
  hidePost,
  muteUser,
  reportPost,
  restrictUser,
  savePost,
  unmuteUser,
  unrestrictUser,
  updatePost,
} from "../../services/postService.js";

const itemCls = "cursor-pointer text-[15px]";

// The "•••" menu of a post: save, not interested, user actions, report,
// copy link and (for your own posts) edit / delete.
const PostMenu = ({ post }) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);
  const storeSave = useFeedStore((s) => s.savePost);
  const storeHide = useFeedStore((s) => s.hidePost);
  const storeUpdate = useFeedStore((s) => s.updatePost);
  const storeDelete = useFeedStore((s) => s.deletePost);

  const [confirmAction, setConfirmAction] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const canEdit = Boolean(user?.id) && Number(user?.id) === Number(post.userId);
  const authorId = post.userId;

  useEffect(() => {
    if (!confirmAction && !reportOpen && !editOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") {
        setConfirmAction(null);
        setReportOpen(false);
        setEditOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmAction, reportOpen, editOpen]);

  const run = async (fn, successMessage) => {
    try {
      await fn();
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Thao tác không thành công, thử lại",
      );
    }
  };

  const handleSave = () =>
    run(async () => {
      const isSaved = await savePost(post.id);
      storeSave(post.id, isSaved);
    }, "Đã lưu bài viết");

  const handleHide = () =>
    run(async () => {
      await hidePost(post.id);
      storeHide(post.id);
    }, "Đã ẩn bài viết khỏi feed");

  const handleMute = () =>
    run(async () => {
      if (post.authorMuted) {
        await unmuteUser(authorId);
      } else {
        await muteUser(authorId);
      }
    }, post.authorMuted ? "Đã bỏ tắt thông báo" : "Đã tắt thông báo");

  const handleRestrict = () =>
    run(async () => {
      if (post.authorRestricted) {
        await unrestrictUser(authorId);
      } else {
        await restrictUser(authorId);
      }
    }, post.authorRestricted ? "Đã bỏ hạn chế" : "Đã hạn chế người dùng");

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/${post.username}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép liên kết");
    } catch {
      toast.error("Không sao chép được liên kết");
    }
  };

  const handleReport = async (reason, description) => {
    await run(async () => {
      await reportPost(post.id, { reason, description });
    }, "Đã gửi báo cáo");
  };

  const handleDelete = () =>
    run(async () => {
      await deletePost(post.id);
      storeDelete(post.id);
    }, "Đã xoá bài viết");

  const handleEdit = async (content) => {
    await run(async () => {
      const updated = await updatePost(post.id, { content });
      storeUpdate(post.id, updated);
    }, "Đã cập nhật bài viết");
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="More options"
            data-testid={`post-menu-${post.id}`}
            className="text-neutral-500 hover:text-black dark:hover:text-white px-2 tracking-widest"
          >
            •••
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            className={itemCls}
            data-testid={`menu-save-${post.id}`}
            onSelect={() => handleSave()}
          >
            {post.saved ? "Hủy lưu" : "Lưu bài viết"}
          </DropdownMenuItem>

          <DropdownMenuItem
            className={itemCls}
            data-testid={`menu-hide-${post.id}`}
            onSelect={() => handleHide()}
          >
            Không quan tâm
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className={itemCls}
            data-testid={`menu-mute-${post.id}`}
            onSelect={() => handleMute()}
          >
            {post.authorMuted ? "Bỏ tắt thông báo" : "Tắt thông báo"}
          </DropdownMenuItem>

          <DropdownMenuItem
            className={itemCls}
            data-testid={`menu-restrict-${post.id}`}
            onSelect={() => handleRestrict()}
          >
            {post.authorRestricted ? "Bỏ hạn chế" : "Hạn chế người dùng"}
          </DropdownMenuItem>

          <DropdownMenuItem
            variant="destructive"
            className={itemCls}
            data-testid={`menu-block-${post.id}`}
            onSelect={() => setConfirmAction("block")}
          >
            Chặn người dùng
          </DropdownMenuItem>

          <DropdownMenuItem
            variant="destructive"
            className={itemCls}
            data-testid={`menu-report-${post.id}`}
            onSelect={() => setReportOpen(true)}
          >
            Báo cáo
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className={itemCls}
            data-testid={`menu-copy-${post.id}`}
            onSelect={() => handleCopyLink()}
          >
            Sao chép liên kết
          </DropdownMenuItem>

          {canEdit && (
            <>
              <DropdownMenuItem
                className={itemCls}
                data-testid={`menu-edit-${post.id}`}
                onSelect={() => setEditOpen(true)}
              >
                Sửa bài viết
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className={itemCls}
                data-testid={`menu-delete-${post.id}`}
                onSelect={() => setConfirmAction("delete")}
              >
                Xoá bài viết
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmModal
        open={confirmAction === "block"}
        title="Chặn người dùng?"
        description={`Bạn sẽ không còn thấy bài viết của ${post.username} và họ sẽ không thể tương tác với bạn.`}
        confirmLabel="Chặn"
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          setConfirmAction(null);
          await run(async () => {
            await blockUser(authorId);
          }, "Đã chặn người dùng");
        }}
      />

      <ConfirmModal
        open={confirmAction === "delete"}
        title="Xoá bài viết?"
        description="Bài viết sẽ bị xoá vĩnh viễn. Bạn có thể huỷ thao tác này trong vài giây."
        confirmLabel="Xoá"
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          setConfirmAction(null);
          await handleDelete();
        }}
      />

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
      />

      <EditPostModal
        open={editOpen}
        post={post}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
      />
    </>
  );
};

export default PostMenu;
