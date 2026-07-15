/**
 * 格式化日期为 yyyy-MM-dd
 */
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * 格式化日期时间为 yyyy-MM-dd HH:mm:ss
 */
export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
};

/**
 * 格式化为相对时间（中文）
 * 示例：刚刚 / 3分钟前 / 2小时前 / 3天前 / 2024-01-15
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  const now = Date.now();
  const diff = now - new Date(date).getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '刚刚';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}个月前`;

  return formatDate(date);
};

/**
 * 格式化时间区间
 * 示例：2024-01-15 ~ 2024-01-20
 */
export const formatDateRange = (
  start: Date | string | number,
  end: Date | string | number,
): string => {
  return `${formatDate(start)} ~ ${formatDate(end)}`;
};
