// services\viewer.ts
import "server-only";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/config";
import { getSessionContext } from "./session-context";

// export async function viewer() {
//   const session = await auth();
//   if (!session?.user?.id) return { kind: "logged-out" } as const;
//   const jar = await cookies();
//   const activeOrg = jar.get("active_org")?.value ?? null;
//   return getSessionContext(
//     session.user.id,
//     activeOrg,
//     session.user.sessionVersion ?? null,
//   );
// }
export async function viewer() {
  const session = await auth();
  if (!session?.user?.id) return { kind: "logged-out" } as const;
  const jar = await cookies();
  const activeOrg = jar.get("active_org")?.value ?? null;
  try {
    return await getSessionContext(
      session.user.id,
      activeOrg,
      session.user.sessionVersion ?? null,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    // جلسة قديمة (تغيّر الباسورد) أو حساب معطّل: نعامله كغير مسجّل.
    if (msg === "UNAUTHENTICATED") return { kind: "logged-out" } as const;
    // لم يعد عضوًا نشطًا في المركز المخزّن في الكوكي: يختار مركزًا من جديد.
    if (msg === "FORBIDDEN")
      return { kind: "onboarding", userId: session.user.id } as const;
    throw e; // أخطاء غير متوقعة (قاعدة بيانات...) لا تتحول لتسجيل خروج.
  }
}
