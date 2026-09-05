import { prisma } from "@/lib/db/prisma";
import { ChangeAction } from "@prisma/client";
import { headers } from "next/headers";

/**
 * Ghi 1 dòng vào change_history / audit log (Section 17, 45).
 * Dùng chung cho mọi action: CREATE, UPDATE, DELETE, RESTORE, IMPORT, EXPORT,
 * LOGIN, LOGOUT, ROLE_CHANGE, USER_CREATE, USER_DELETE, PASSWORD_CHANGE.
 */
export async function logChange(params: {
  userId?: string | null;
  steelId?: string | null;
  action: ChangeAction;
  fieldName?: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  let ip: string | undefined;
  let ua: string | undefined;
  try {
    const h = headers();
    ip = h.get("x-forwarded-for") ?? undefined;
    ua = h.get("user-agent") ?? undefined;
  } catch {
    // headers() không khả dụng ngoài request context (vd script), bỏ qua.
  }

  await prisma.changeHistory.create({
    data: {
      userId: params.userId ?? null,
      steelId: params.steelId ?? null,
      action: params.action,
      fieldName: params.fieldName,
      oldValue: params.oldValue ?? undefined,
      newValue: params.newValue ?? undefined,
      ipAddress: ip,
      userAgent: ua,
    },
  });
}

/**
 * So sánh object trước/sau, trả về danh sách field đã đổi để ghi audit log
 * từng dòng (Section 15: Field / Old Value / New Value).
 */
export function diffFields<T extends Record<string, any>>(
  before: T,
  patch: Partial<T>
): Array<{ field: string; oldValue: string; newValue: string }> {
  const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];
  for (const key of Object.keys(patch)) {
    const oldVal = before[key];
    const newVal = (patch as any)[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        oldValue: oldVal === null || oldVal === undefined ? "" : String(oldVal),
        newValue: newVal === null || newVal === undefined ? "" : String(newVal),
      });
    }
  }
  return changes;
}
