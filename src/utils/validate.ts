/**
 * 校验手机号（中国大陆）
 * 支持运营商号段：13x / 14x / 15x / 16x / 17x / 18x / 19x
 *
 * @example
 * isValidPhone('13800138000') // true
 * isValidPhone('12345678901') // false
 */
export const isValidPhone = (value: string): boolean => {
  return /^1[3-9]\d{9}$/.test(value.trim());
};

/**
 * 校验手机号（宽松模式：含可选 +86 前缀、空格、短横线）
 *
 * @example
 * isValidPhoneLoose('+86 138-0013-8000') // true
 * isValidPhoneLoose('13800138000')       // true
 */
export const isValidPhoneLoose = (value: string): boolean => {
  const cleaned = value.trim().replace(/^\+86[\s-]?/, '').replace(/[\s-]/g, '');
  return /^1[3-9]\d{9}$/.test(cleaned);
};
