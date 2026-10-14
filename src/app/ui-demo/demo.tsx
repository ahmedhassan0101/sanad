// أقسام المعرض: كل قسم فوقه تعليق يقول متى تستخدمه — انسخ منه مباشرة.
"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataCell, DataRow, DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { FieldShell } from "@/components/form/field-shell";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FormAlert,
  FormCheckbox,
  FormCheckboxes,
  FormInput,
  FormRadioGroup,
  FormSelect,
  FormSubmitButton,
  FormSwitch,
  FormTextarea,
  useEntityForm,
} from "@/components/form";
import {
  nameRule,
  emailRule,
  optionalNumberRule,
  optionalString,
  selectRequired,
} from "@/validators/common";

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

// مثال فورم كامل: schema من القوالب + حقول بسطر واحد + إرسال وهمي + toast.
const demoSchema = z.object({
  name: nameRule,
  email: emailRule,
  age: optionalNumberRule("العمر", { min: 5, max: 120 }),
  bio: optionalString(200),
  role: selectRequired("الدور"),
  plan: z.string().min(1, "اختر الخطة"),
  programs: z.array(z.string()).min(1, "اختر برنامجًا واحدًا على الأقل"),
  newsletter: z.boolean(),
  active: z.boolean(),
  agree: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة أولًا" }) }),
});
type DemoInput = z.infer<typeof demoSchema>;

const DEMO_DEFAULTS: DemoInput = {
  name: "",
  email: "",
  age: undefined,
  bio: undefined,
  role: "",
  plan: "",
  programs: [],
  newsletter: false,
  active: true,
  agree: false as unknown as true,
};

function DemoForm({ values, idPrefix }: { values?: DemoInput | null; idPrefix: string }) {
  const form = useEntityForm({ schema: demoSchema, defaultValues: DEMO_DEFAULTS, values });
  const [serverError, setServerError] = useState<string | null>(null);
  return (
    <form
      id={idPrefix}
      onSubmit={form.handleSubmit(async (data) => {
        setServerError(null);
        await new Promise((r) => setTimeout(r, 800)); // إرسال وهمي: استبدله بالأكشن الحقيقي
        if (data.email.endsWith("@fail.test")) {
          const msg = "خطأ من السيرفر: هذا مثال لرسالة فشل";
          setServerError(msg);
          toast.error(msg);
          return;
        }
        toast.success("تم الحفظ بنجاح");
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      <FormInput control={form.control} name="name" label="الاسم" required placeholder="مثال: أحمد" />
      <FormInput control={form.control} name="email" label="الإيميل" type="email" required icon={<Mail className="size-4" />} placeholder="name@example.com" />
      <FormInput control={form.control} name="age" label="العمر (اختياري)" type="number" description="جرّب: فارغ، 0، رقم — الفارغ ليس صفرًا" />
      <FormTextarea control={form.control} name="bio" label="نبذة (اختياري)" rows={3} />
      <FormSelect control={form.control} name="role" label="الدور" required options={[{ value: "teacher", label: "معلم" }, { value: "admin", label: "مشرف" }]} />
      <FormRadioGroup control={form.control} name="plan" label="الخطة" required options={[{ value: "free", title: "مجانية", description: "للتجربة" }, { value: "pro", title: "مدفوعة", description: "للمراكز الكبيرة" }]} />
      <FormCheckboxes control={form.control} name="programs" label="البرامج" required options={[{ value: "quran", label: "قرآن" }, { value: "sports", label: "ملعب" }]} />
      <FormSwitch control={form.control} name="newsletter" label="النشرة البريدية" description="رسالة كل أسبوع" />
      <FormSwitch control={form.control} name="active" label="نشط" />
      <FormCheckbox control={form.control} name="agree" label="أوافق على الشروط" required />
      <FormSubmitButton form={form} requireDirty>
        حفظ
      </FormSubmitButton>
    </form>
  );
}

// وضع التعديل: نفس المكوّن، والبيانات تصل لاحقًا فيُعاد الضبط عليها تلقائيًا.
function EditExample() {
  const [record, setRecord] = useState<DemoInput | null>(null);
  useEffect(() => {
    const t = setTimeout(
      () =>
        setRecord({
          ...DEMO_DEFAULTS,
          name: "مركز النور",
          email: "nour@example.com",
          age: 10,
          role: "admin",
          plan: "pro",
          programs: ["quran"],
          newsletter: true,
          agree: true,
        }),
      1000
    );
    return () => clearTimeout(t);
  }, []);
  if (!record) return <Skeleton className="h-64 w-full" />;
  return <DemoForm values={record} idPrefix="edit" />;
}

export function DemoSections() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">معرض المكونات (تطوير فقط)</h1>
        <ThemeToggle />
      </div>

      <Section title="الهوية واللوحة" hint="كل الألوان توكنز من globals.css — بدّل السمة بالأعلى وقارن.">
        <div className="flex flex-wrap gap-2">
          {[
            ["bg-primary", "العلامة"],
            ["bg-secondary", "ثانوي"],
            ["bg-brand-accent", "تمييز"],
            ["bg-success", "نجاح"],
            ["bg-warning", "تحذير"],
            ["bg-destructive", "خطر"],
            ["bg-info", "معلومة"],
          ].map(([cls, label]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className={`size-10 rounded-md ${cls}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="present">حاضر</StatusBadge>
          <StatusBadge tone="absent">غائب</StatusBadge>
          <StatusBadge tone="late">متأخر</StatusBadge>
          <StatusBadge tone="excused">بعذر</StatusBadge>
          <StatusBadge tone="neutral">محايد</StatusBadge>
        </div>
        <PageHeader title="عنوان تجريبي" description="وصف قصير تحت العنوان" actions={<Button size="sm">إجراء</Button>} />
        <div className="grid gap-2 sm:grid-cols-2">
          <StatCard title="الطلاب" value={128} />
          <StatCard title="المعلمون" value={9} />
        </div>
        <DataTable headers={["الاسم", "الحالة"]} density="compact">
          <DataRow>
            <DataCell>أحمد</DataCell>
            <DataCell>
              <StatusBadge tone="present">حاضر</StatusBadge>
            </DataCell>
          </DataRow>
        </DataTable>
        <EmptyState title="لا عناصر بعد" description="مثال لحالة الفراغ" />
      </Section>

      <Section title="الأزرار" hint="استخدم variant للحالة: default للأساسي، outline للثانوي، ghost للروابط.">
        <div className="flex flex-wrap gap-2">
          <Button>أساسي</Button>
          <Button variant="secondary">ثانوي</Button>
          <Button variant="outline">محدد</Button>
          <Button variant="ghost">شبح</Button>
          <Button variant="destructive">خطر</Button>
          <Button size="sm">صغير</Button>
          <Button size="icon" aria-label="مثال">+</Button>
          <Button disabled>معطّل</Button>
        </div>
      </Section>

      <Section title="حقل معطّل ومقروء فقط" hint="disabled لا يُرسل ولا يُركّز عليه، readOnly يُعرض فقط.">
        <FieldShell label="معطّل" htmlFor="demo-disabled">
          <Input id="demo-disabled" value="لا يمكن تعديله" disabled />
        </FieldShell>
        <FieldShell label="قراءة فقط" htmlFor="demo-readonly">
          <Input id="demo-readonly" value="يُعرض فقط" readOnly />
        </FieldShell>
      </Section>

      <Section title="إنشاء vs تعديل" hint="نفس المكوّن: فارغ للإنشاء، وبقيم + تحميل للتعديل.">
        <h2 className="text-sm font-medium">إنشاء (فارغ)</h2>
        <DemoForm values={null} idPrefix="create" />
        <Separator />
        <h2 className="text-sm font-medium">تعديل (يُمتلئ بعد ثانية)</h2>
        <EditExample />
      </Section>

      <Section title="تنبيه وهيكل" hint="toast للرسائل العابرة، skeleton أثناء التحميل.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.success("نجاح تجريبي")}>
            toast نجاح
          </Button>
          <Button variant="outline" onClick={() => toast.error("خطأ تجريبي")}>
            toast خطأ
          </Button>
        </div>
        <Skeleton className="h-8 w-40" />
      </Section>
    </main>
  );
}
