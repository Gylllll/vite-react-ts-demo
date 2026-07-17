import type { ReactNode } from 'react';

export interface ModalProps {
  visible: boolean;
  title: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  /** 提交中 / 加载中，为 true 时禁用关闭操作 */
  loading?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  onClose,
  children,
  footer,
  loading = false,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={() => { if (!loading) onClose(); }}
      />

      {/* 弹窗卡片 */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            type="button"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* 底部按钮（可选） */}
        {footer && (
          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
