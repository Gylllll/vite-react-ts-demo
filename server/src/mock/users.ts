import type { User } from '../types.ts';

const SURNAMES = [
  '张', '李', '王', '赵', '刘', '陈', '杨', '黄', '吴', '周',
  '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗',
];

const GIVEN_NAMES = [
  '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋',
  '勇', '艳', '涛', '超', '明', '秀兰', '霞', '平', '刚', '桂英',
];

const ROLES: User['role'][] = ['admin', 'editor', 'viewer'];
const STATUSES: User['status'][] = ['active', 'active', 'active', 'inactive', 'banned'];

/** 生成 mock 用户列表（总数 50） */
export function generateMockUsers(): User[] {
  return Array.from({ length: 50 }, (_, i) => {
    const id = i + 1;
    const surname = SURNAMES[i % SURNAMES.length];
    const givenName = GIVEN_NAMES[Math.floor(i / SURNAMES.length) % GIVEN_NAMES.length];

    // 生成日期：从 2024-01-01 开始，每个用户 +2 天
    const d = new Date(2024, 0, 1);
    d.setDate(d.getDate() + i * 2);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;

    // 生成模拟手机号：138 开头 + 8 位序号补零
    const phone = `138${String(id).padStart(8, '0')}`;

    return {
      id,
      username: `${surname}${givenName}`,
      email: `user${id}@example.com`,
      phone,
      role: ROLES[i % ROLES.length],
      status: STATUSES[i % STATUSES.length],
      createdAt: dateStr,
      updatedAt: dateStr,
    };
  });
}
