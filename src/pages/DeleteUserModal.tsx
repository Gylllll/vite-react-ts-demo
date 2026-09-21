import { useState } from 'react';
import type { User } from '../types/user.ts';
import { deleteUser } from '../api/user.ts';
import { Modal } from '../components/atom/index.ts';

interface DeleteUserModalProps {
  user: User | null;
  onClose: () => void;
  /** 删除成功后回调（父组件负责刷新列表） */
  onDeleted: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);

  /** 删除中禁止关闭 */
  const handleClose = () => {
    if (deleting) return;
    onClose();
  };

  /** 确认删除 */
  const handleConfirm = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteUser(user.id);
      onClose();
      onDeleted();
    } catch (err) {
      // 删除失败仅打印日志，关闭弹窗
      console.error('删除失败:', err);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      visible={!!user}
      title={
        user ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">确认删除</h3>
              <p className="text-sm text-gray-500">
                确定要删除用户「{user.username}」吗？此操作不可撤销。
              </p>
            </div>
          </div>
        ) : null
      }
      onClose={handleClose}
      loading={deleting}
      footer={
        <>
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClose}
            disabled={deleting}
          >
            取消
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => void handleConfirm()}
            disabled={deleting}
          >
            {deleting ? '删除中...' : '确认删除'}
          </button>
        </>
      }
    />
  );
};

export default DeleteUserModal;
