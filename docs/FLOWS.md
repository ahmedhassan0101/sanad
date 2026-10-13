# المسارات (Flows)

## كيف تقرأ هذا الملف
- كل مسار رسمة نصية من الضغطة حتى الداتابيز والعودة.
- تحت كل رسمة: الملف والدالة الفعليان لكل خطوة، وما يحدث عند الخطأ.
- الأسماء حرفية كما في الكود.

## 1) Auth Flow (التسجيل والدخول)

### 1-أ) حساب جديد بإيميل وباسورد
```
زر «إنشاء الحساب»
  → الفورم يتحقق محليًا (registerSchema)
  → registerAction (register/actions.ts)
  → registerAccount (services/auth-accounts.ts): إيميل مكرر؟ اسم/باسورد قصير؟
  → User.create + VerificationToken.create (بصمة الرابط لا نصه)
  → sendAuthLink: يطبع الرابط في الـ logs فقط (الإرسال الحقيقي لسه مش مبني)
  → signIn("credentials") دخول تلقائي → تحويل /onboarding
```
- عند الخطأ: إيميل مكرر ← رسالة «هذا البريد مسجل بالفعل». حقول ناقصة ← «تحقق من الحقول».

### 1-ب) الدخول بإيميل وباسورد
```
زر «دخول»
  → loginAction (login/actions.ts) يتحقق من loginSchema
  → signIn("credentials") (src/lib/auth/config.ts)
  → authorize → verifyCredentials: يبحث بالإيميل + يقارن البصمة + يرفض غير active
  → نجاح: JWT يُختم ويُحفظ في كوكي. فشل: رسالة «بيانات الدخول غير صحيحة أو الحساب موقوف»
```
- الـ JWT فيه `userId` فقط (سطر `token.userId` في callback الـ `jwt`). لا أدوار ولا مركز فيه.
- الـ session تُبنى منه عند كل قراءة (`session.user.id`) — الملف `src/lib/auth/config.ts`.

### 1-ج) الدخول بـ Google
```
زر «الدخول بـ Google» (يظهر فقط لو GOOGLE_CLIENT_ID موجود)
  → googleAction في login/page.tsx → signIn("google")
  → callback الـ signIn ينادي ensureGoogleUser: موجود؟ يرفض الموقوف ويثبّت التفعيل. جديد؟ ينشئه مفعّلًا
  → تحويل /onboarding
```

### 1-د) تأكيد الإيميل (إجباري الآن)
```
التسجيل/الدخول بلا تفعيل → تحويل /verify-pending (لا وصول لأي شيء آخر)
  → الصفحة تعرض الإيميل + زر إعادة إرسال (حد 3/ساعة لكل إيميل عبر RateLimit) + زر خروج
  → الضغط على الرابط /verify?email&token → نجاح يحوّل مباشرة إلى /onboarding
```
- `getSessionContext` ترجع حالة `unverified` لغير المفعّل، وصفحات onboarding/dashboard/platform تحوّله إلى `/verify-pending`.
- كل الخدمات ترفض غير المفعّل من السيرفر: `requireVerifiedUser` في `consumeInvite` و`createInvite` و`activateOrg` (و`createCenter` يشترط التفعيل أصلًا).
- حجز الإيميل: تسجيل بإيميل موجود غير مفعّل ← يستبدل الاسم والباسورد ويعيد الإرسال (بلا TAKEN). الموجود المفعّل ← TAKEN.
- تفعيل Google لحساب بباسورد سابق ← يمسح الباسورد ويرفع `sessionVersion` (منع الاستيلاء).

### 1-هـ) نسيان الباسورد (مبني ويعمل)
```
forgot → forgotAction → requestPasswordReset: لو الحساب موجود ينشئ توكن ساعتين ويطبع الرابط (صمت تام لو غير موجود)
  → reset?email&token → resetAction → resetPassword: يبدّل البصمة + يرفع sessionVersion + يحذف التوكن → تحويل /login
```
- تحذير سابق (حُلّ): `sessionVersion` الآن يُقارن في `getSessionContext` — تغيير الباسورد يُبطل الجلسات القديمة فعليًا.

### تسجيل الخروج
زر الخروج في قائمة المستخدم بالداشبورد (`logoutAction`): خروج من هذا الجهاز فقط + مسح كوكي المركز.

## 2) User Flow (رحلة المستخدم)
```
/register (حساب) → /verify-pending (إجباري لغير المفعّل: رسالة + إعادة إرسال + خروج فقط)
  → الضغط على رابط التفعيل → /onboarding
  → الكارت 1 «إنشاء مركز جديد»: بيانات + برامج (واحد على الأقل + مخصص اختياري)
      → createCenterAction → createCenter → كوكي active_org → /dashboard
  → الكارت 2 «عندي كود دعوة»: كود من مشرف
      → enterCodeAction → consumeInvite → كوكي active_org → /dashboard
  → الكارت 3 «متابعة طفلي»: زر معطل (قريبًا) — لسه مش مبني
  → لو له عضويات: أزرار «دخول <اسم المركز>» تثبت الكوكي عبر setActiveOrg
/dashboard: اسم المركز + الدور + الفروع (تظهر فقط لو أكثر من فرع) + البرامج + كارت «قريبًا»
```
- إنشاء مركز بإيميل غير مفعّل ← رسالة «فعّل بريدك أولًا».
- أكثر من 3 مراكز لنفس المنشئ ← رفض `FORBIDDEN`.

## مسار التقارير
```
/dashboard/students/[id] ← قسم التقارير ← «إضافة تقرير»
  → reports/new (الموضع معبأ بالحالي + التاريخ للقراءة فقط)
  → createReportAction → createReport (تحقق + رفض المؤرشف + مفتاح اليوم) → syncStudentPosition
  → تحويل لبطاقة الطالب مع «تم حفظ التقرير»
تعديل/حذف بنفس النمط (الحذف بحوار تأكيد، والموضع يعود للسابق تلقائيًا)
```

## 3) API/Data Flow (مسار طلب كامل)
```
مثال: فتح /dashboard
صفحة (app/dashboard/page.tsx)
  → viewer() (services/viewer.ts): يقرأ الجلسة (auth) وكوكي active_org
  → getSessionContext(userId, activeOrgId, expectedSessionVersion) (services/session-context.ts):
     يقرأ User (الحالة؟ نسخة الجلسة مطابقة؟ أدمن عام؟ مفعّل الإيميل؟) ثم Membership (فعالة؟) ويبني {orgId, role, branchScope}
     غير المفعّل ← unverified. نسخة قديمة ← UNAUTHENTICATED (خروج فعلي).
  → getDashboard(ctx) (services/screens.ts):
     التحقق zod كان في الـ action (للقراءة: لا مدخلات)
     الصلاحيات: kind必须为 member وإلا تحويل (في الصفحة نفسها)
     العزل: Org.findOne({_id, ...}) ضمنيًا + Branch.find(scopedFilter(ctx, "_id"))
  → الرد: كائن بيانات عادي {orgName, role, branches, programs}
     (ملاحظة: شكل Result الموحد معرّف لكن الأكشنات ترد {ok, message} مباشرة — انظر قسم غير المستخدم)
```
- القاعدة: `orgId` يأتي من السياق السيرفري دائمًا، والعميل لا يرسله أبدًا (الكوكي مجرد مؤشر يُتحقق منه).
- أي `findById` مباشر ممنوع بموجب قاعدة ESLint (الـ models لا تُستورد إلا في services/scripts/tests).

## 4) Context Flow (حالات السياق)
```
getSessionContext(userId, activeOrgId):
  userId فارغ/تالف → خطأ UNAUTHENTICATED (الصفحة تحوّل إلى /login)
  المستخدم غير موجود أو غير active → UNAUTHENTICATED
  isPlatformAdmin → {kind: "platform"} (يُقبل فقط في /platform، وغيره يُحوَّل)
  بلا active_org صالح → {kind: "onboarding"} (صفحات الداشبورد تحوّل إلى /onboarding)
  بلا عضوية فعالة في المركز → خطأ FORBIDDEN
  عضوية فعالة → {kind: "member", orgId, role, branchScope}
     الدور center_admin ← نطاق all (كل الفروع)
     غيره ← نطاق list (فروع العضوية فقط)
```

## 5) Create Org Flow (إنشاء مركز بالتفصيل)
```
createCenterAction (تحقق createCenterSchema + تحويل المخصص إلى custom:...)
  → createCenter (services/orgs.ts):
     1. تحقق داخلي ثانٍ + شرط الإيميل المفعّل + عد المراكز (3 كحد أقصى)
     2. transaction واحدة (mongoose.startSession + withTransaction):
        - Org.create (الاسم/التواصل/العنوان/createdByUserId)
        - Branch.create (نفس المركز، الاسم ثابت «الفرع الرئيسي»)
        - Membership.create (المنشئ center_admin بلا فروع)
        - OrgProgram.create (صف لكل برنامج مختار)
     3. عند أي فشل: الـ transaction تلغي الكل، والأكشن يرد رسالة عربية
  → كوكي active_org = المركز الجديد → تحويل /dashboard
```
- عند الخطأ: رسالة الخدمة تُعرض كما هي بعد حذف بادئة `VALIDATION:`/`FORBIDDEN:`.
