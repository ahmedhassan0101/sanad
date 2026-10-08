// تفضيل الفرع: قراءة كوكي الفرع المختار (يُتحقق عند الحفظ لا القراءة).
import "server-only";
import { cookies } from "next/headers";

export async function readBranchPref(): Promise<string | null> {
  return (await cookies()).get("active_branch")?.value ?? null;
}
