import { AUDIT, audit } from "./audit";
import { db } from "./db";
import { normalizeIndianPhone } from "./phone";

export type EnsureAdminResult =
  | { ok: true; phone: string; created: boolean }
  | { ok: false; error: string };

/**
 * Make sure an ADMIN account exists for this phone number (used by `npm run admin:create`).
 * Never converts an existing worker or factory account: that would orphan their profile.
 */
export async function ensureAdmin(rawPhone: string): Promise<EnsureAdminResult> {
  const phone = normalizeIndianPhone(rawPhone);
  if (!phone) return { ok: false, error: "That is not a valid 10-digit Indian mobile number." };

  const existing = await db.user.findUnique({ where: { phone }, select: { role: true } });
  if (existing) {
    if (existing.role === "ADMIN") return { ok: true, phone, created: false };
    return {
      ok: false,
      error: `${phone} is already registered as a ${existing.role.toLowerCase()}. Use a different number for the admin.`,
    };
  }

  const user = await db.user.create({ data: { phone, role: "ADMIN" } });
  await audit({
    actorRole: "SYSTEM",
    action: AUDIT.ADMIN_CREATED,
    entityType: "User",
    entityId: user.id,
  });
  return { ok: true, phone, created: true };
}
