// من الجلسة والكوكي يبني سياق الصلاحيات للصفحة الحالية.
import "server-only";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/config";
import { getSessionContext } from "./session-context";

export async function viewer() {
  const session = await auth();
  if (!session?.user?.id) return { kind: "logged-out" } as const;
  const jar = await cookies();
  const activeOrg = jar.get("active_org")?.value ?? null;
  return getSessionContext(session.user.id, activeOrg, session.user.sessionVersion ?? null);
}
