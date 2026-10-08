// صفحة انتظار التفعيل: لا مخرج منها إلا بالتفعيل أو الخروج.
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, signOut } from "@/lib/auth/config";
import { viewer } from "@/services/viewer";
import { ResendButton } from "./resend-button";

export default async function VerifyPendingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const ctx = await viewer();
  if (ctx.kind === "member") redirect("/dashboard");
  if (ctx.kind === "platform") redirect("/platform");
  if (ctx.kind === "onboarding") redirect("/onboarding");
  if (ctx.kind === "logged-out") redirect("/login");
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>فعّل بريدك أولًا</CardTitle>
          <CardDescription>أرسلنا رابط التفعيل إلى {ctx.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <ResendButton />
          <form action={logout}>
            <Button type="submit" variant="ghost" className="w-full">
              خروج
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
