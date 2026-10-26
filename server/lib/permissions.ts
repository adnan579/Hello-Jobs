export const ADMIN_ROLES = ['Super Admin', 'Trust & Safety', 'Verifier', 'Support', 'Finance'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PERMISSIONS = [
  'dashboard', 'verification', 'users.view', 'users.suspend', 'jobs.moderate', 'reports', 'grievances',
  'payments.view', 'credits.adjust', 'notifications', 'audit', 'staff', 'system',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

/** Least privilege: each role gets only what its job needs. Super Admin gets everything. */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  'Super Admin': ALL,
  'Trust & Safety': ['dashboard', 'verification', 'users.view', 'users.suspend', 'jobs.moderate', 'reports', 'grievances', 'notifications', 'audit'],
  Verifier: ['dashboard', 'verification', 'users.view'],
  Support: ['dashboard', 'users.view', 'grievances', 'notifications'],
  Finance: ['dashboard', 'users.view', 'payments.view', 'credits.adjust'],
};

export const can = (role: AdminRole | undefined, p: Permission): boolean => Boolean(role && ROLE_PERMISSIONS[role]?.includes(p));
