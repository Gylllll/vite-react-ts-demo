import { useEffect, useState } from 'react';
import type { User, CreateUserParams, UserRole, UserStatus } from '../types/user.ts';
import { createUser, updateUser } from '../api/user.ts';
import { isValidPhone } from '../utils/validate.ts';
import { Modal } from '../components/atom/index.ts';
import { ROLE_OPTIONS, STATUS_OPTIONS } from './userListMeta.ts';

/** 表单初始值 */
const INITIAL_FORM: CreateUserParams = {
  username: '',
  email: '',
  phone: '',
  role: 'viewer',
  status: 'active',
};

interface UserFormModalProps {
  visible: boolean;
  /** 非空为编辑模式，为空为新增模式 */
  editingUser: User | null;
  onClose: () => void;
  /** 新增/编辑成功后回调（父组件负责刷新列表） */
  onSuccess: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  visible,
  editingUser,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateUserParams>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 弹窗打开时，按「新增 / 编辑」初始化表单
  useEffect(() => {
    if (!visible) return;
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        email: editingUser.email,
        phone: editingUser.phone ?? '',
        role: editingUser.role,
        status: editingUser.status,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setFormError(null);
    setSubmitting(false);
  }, [visible, editingUser]);

  /** 表单字段变更 */
  const handleChange = <K extends keyof CreateUserParams>(
    field: K,
    value: CreateUserParams[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError(null);
  };

  const validateForm = (data: CreateUserParams): string | null => {
    if (!data.username.trim()) return '请输入用户名';
    if (!data.email.trim()) return '请输入邮箱';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return '请输入有效的邮箱地址';
    if (data.phone && !isValidPhone(data.phone)) return '请输入有效的手机号';
    return null;
  };

  /** 提交中禁止关闭 */
  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  /** 提交表单（新增 / 编辑） */
  const handleSubmit = async () => {
    const validationError = validateForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingUser) {
        await updateUser({ id: editingUser.id, ...formData });
      } else {
        await createUser(formData);
      }
      onClose();
      onSuccess();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleClose}
        disabled={submitting}
      >
        取消
      </button>
      <button
        type="button"
        className="rounded-lg bg-purple-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => void handleSubmit()}
        disabled={submitting}
      >
        {submitting ? '保存中...' : '保存'}
      </button>
    </>
  );

  return (
    <Modal
      visible={visible}
      title={editingUser ? '编辑用户' : '新增用户'}
      onClose={handleClose}
      loading={submitting}
      footer={footer}
    >
      <div className="space-y-4">
        {/* 用户名 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            用户名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            placeholder="请输入用户名"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* 邮箱 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            邮箱 <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            placeholder="请输入邮箱"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* 手机号 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">手机号</label>
          <input
            type="tel"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            placeholder="请输入手机号（选填）"
            value={formData.phone ?? ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* 角色 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">角色</label>
          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100 cursor-pointer"
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value as UserRole)}
            disabled={submitting}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 状态 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">状态</label>
          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100 cursor-pointer"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as UserStatus)}
            disabled={submitting}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 错误提示 */}
        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{formError}</p>
        )}
      </div>
    </Modal>
  );
};

export default UserFormModal;
