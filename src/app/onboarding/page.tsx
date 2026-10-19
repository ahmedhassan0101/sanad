// شاشة البداية: عضوياتك + 3 كروت (إنشاء / كود / طفلي قريبًا).
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Baby,
  Building2,
  Plus,
  Sparkles,
  Ticket,
  UserCheck,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { listMyMemberships } from "@/services/org-selection";
import { viewer } from "@/services/viewer";
import {
  Button,
  //  buttonVariants
} from "@/components/ui/button";
// import { IconChip } from "@/components/brand";
// import { OnboardingShell } from "@/components/onboarding-shell";
import { setActiveOrg } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const ctx = await viewer();
  if (ctx.kind === "unverified") redirect("/verify-pending");
  if (ctx.kind === "member") redirect("/dashboard");
  if (ctx.kind === "platform") redirect("/platform");
  const memberships = await listMyMemberships(session.user.id);
  return (
    <div
      className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden dir-rtl"
      dir="rtl"
    >
      {/* خلفية جمالية ديكورية (Gradients) */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-4xl flex flex-col gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ── 1. الهيدر والعناوين الرئيسية ── */}
        <header className="text-center flex flex-col items-center gap-3">
          <Badge
            variant="outline"
            className="px-3 py-1 border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 gap-1.5 rounded-full text-xs font-medium"
          >
            <Sparkles className="size-3.5" />
            خطوتك الأولى مع سند
          </Badge>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            مرحباً userName، كيف تريد البدء اليوم؟
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
            اختر مسارك لإدارة مركزك التعليمي، الانضمام لفريق عمل قائم، أو متابعة
            رحلة أبنائك الدراسية.
          </p>
        </header>

        {/* ── 2. قسم مراكزك الحالية (إن وجدت) ── */}
        {memberships.length > 0 && (
          <section className="flex flex-col gap-3" aria-label="مراكزك المسجلة">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <UserCheck className="size-4 text-cyan-600" />
              <span>مراكزك المسجل بها بالفعل:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {memberships.map((m) => (
                <form key={m.orgId} action={setActiveOrg}>
                  <input type="hidden" name="orgId" value={m.orgId} />
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full h-auto p-4 justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3 text-right">
                      <div className="size-10 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                        <Building2 className="size-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 transition-colors">
                          {m.orgName}
                        </span>
                        <span className="text-xs text-slate-500">
                          متابعة العمل في هذا المركز
                        </span>
                      </div>
                    </div>
                    <ArrowLeft className="size-4 text-slate-400 group-hover:-translate-x-1 group-hover:text-cyan-600 transition-all" />
                  </Button>
                </form>
              ))}
            </div>
          </section>
        )}

        {/* ── 3. شبكة الخيارات الرئيسية (3 كروت تفاعلية) ── */}
        <section
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          aria-label="خيارات البدء"
        >
          {/* كارت 1: إنشاء مركز جديد */}
          <Link href="/onboarding/create-center" className="group h-full">
            <Card className="h-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <div className="size-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
                  <Plus className="size-6" />
                </div>
                <CardTitle className="text-lg font-bold group-hover:text-cyan-600 transition-colors">
                  إنشاء مركز جديد
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 pt-1">
                  قم بتأسيس مساحتك الخاصة، إدارة المناهج والطلاب، ودعوة فريق
                  المعلمين للعمل معك.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 group-hover:gap-2.5 transition-all">
                  ابدأ التأسيس الآن
                  <ArrowLeft className="size-3.5" />
                </span>
              </CardContent>
            </Card>
          </Link>

          {/* كارت 2: استخدام كود دعوة */}
          <Link href="/onboarding/enter-code" className="group h-full">
            <Card className="h-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <div className="size-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                  <Ticket className="size-6" />
                </div>
                <CardTitle className="text-lg font-bold group-hover:text-teal-600 transition-colors">
                  عندي كود دعوة
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 pt-1">
                  أدخل رمز الانضمام المرسل إليك من إدارتك للمشاركة كـ معلم أو
                  إداري بمركز قائم.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:gap-2.5 transition-all">
                  إدخال الكود
                  <ArrowLeft className="size-3.5" />
                </span>
              </CardContent>
            </Card>
          </Link>

          {/* كارت 3: متابعة طفلي (معطل مؤقتاً) */}
          <div className="h-full opacity-60 cursor-not-allowed">
            <Card className="h-full border-dashed border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 flex flex-col justify-between relative overflow-hidden">
              <Badge className="absolute top-3 left-3 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none text-[10px]">
                قريباً
              </Badge>
              <CardHeader className="p-5 pb-3">
                <div className="size-12 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center mb-3">
                  <Baby className="size-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-700 dark:text-slate-300">
                  متابعة طفلي
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 pt-1">
                  حساب مخصص لأولياء الأمور لمتابعة الحضور، التقييمات اليومية،
                  والواجبات المدرسية.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <span className="text-xs font-medium text-slate-400">
                  جاري إعداد بوابة أولياء الأمور…
                </span>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
//  <OnboardingShell
//       title={`أهلاً ${session.user.name ?? ""}`}
//       description="اختر مركزك أو ابدأ واحدًا جديدًا"
//     >
//       {memberships.length > 0 && (
//         <section className="flex flex-col gap-2" aria-label="مراكزك">
//           {memberships.map((m) => (
//             <form key={m.orgId} action={setActiveOrg}>
//               <input type="hidden" name="orgId" value={m.orgId} />
//               <Button type="submit" variant="outline" className="w-full justify-start">
//                 دخول {m.orgName}
//               </Button>
//             </form>
//           ))}
//         </section>
//       )}
//       <section className="flex flex-col gap-2" aria-label="ابدأ">
//         <Link
//           href="/onboarding/create-center"
//           className={buttonVariants({ className: "justify-start gap-3" })}
//         >
//           <IconChip tone="info">
//             <Plus className="size-4" />
//           </IconChip>
//           إنشاء مركز جديد
//         </Link>
//         <Link
//           href="/onboarding/enter-code"
//           className={buttonVariants({ variant: "outline", className: "justify-start gap-3" })}
//         >
//           <IconChip>
//             <Ticket className="size-4" />
//           </IconChip>
//           عندي كود دعوة
//         </Link>
//         <Button variant="ghost" disabled className="justify-start gap-3">
//           <IconChip tone="success">
//             <Baby className="size-4" />
//           </IconChip>
//           متابعة طفلي (قريبًا)
//         </Button>
//       </section>
//     </OnboardingShell>
