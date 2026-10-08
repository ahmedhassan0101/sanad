# خريطة المشروع (للمبتدئ)

## كيف تقرأ هذا الملف
- القسم الأول فهرس: اضغط على أي رابط للقفز لقسمه.
- الأسماء مكتوبة حرفيًا كما في الكود لتقدر تبحث عنها.
- كلمة callers تعني "مين بينادي على الدالة"، وكلمة callees تعني "الدالة بتنادي على مين".

## الفهرس
- [شجرة المجلدات](#شجرة-المجلدات)
- [طبقة app/ (الصفحات)](#طبقة-app-الصفحات)
- [طبقة components/](#طبقة-components)
- [طبقة lib/](#طبقة-lib)
- [طبقة services/](#طبقة-services)
- [طبقة db/models/](#طبقة-dbmodels)
- [طبقة validators/](#طبقة-validators)
- [طبقة scripts/](#طبقة-scripts)
- [طبقة tests/](#طبقة-tests)
- [الملفات الجذرية](#الملفات-الجذرية-config)
- [جدول الـ Routes](#جدول-الـ-routes)
- [جدول الـ Server Actions والـ API](#جدول-الـ-server-actions-والـ-api)
- [موجود لكن غير مستخدم](#موجود-لكن-غير-مستخدم-حاليا)

## شجرة المجلدات
- `src/app/`: الصفحات التي يفتحها المستخدم في المتصفح. كل مجلد باسمه = عنوان في الموقع.
- `src/components/ui/`: قطع جاهزة من مكتبة shadcn (زر، كارت، حقل إدخال). مولّدة آليًا — لا تعدلها بيدك.
- `src/components/form/`: حقول فورمات جاهزة من صنع المشروع، كل حقل يُستخدم بسطر واحد.
- `src/components/`: مكونات عامة من صنع المشروع (مبدل السمة...).
- `src/lib/`: دوال صغيرة نقية. كلمة نقية تعني لا تفتح الداتابيز بنفسها.
- `src/db/`: شكل الجداول (models) وطريقة الاتصال بالداتابيز.
- `services/`: العقل. أي قراءة أو كتابة في الداتابيز تتم من هنا فقط، وبعده تُمنع في الصفحات (قاعدة ESLint).
- `src/validators/`: قواعد التحقق (zod) المشتركة بين المتصفح والسيرفر.
- `scripts/`: أوامر تُشغَّل من سطر الأوامر (terminal) وليست صفحات.
- `tests/`: اختبارات آلية تتأكد أن العزل بين المراكز يعمل.
- `docs/`: هذا التوثيق وملفات مرجعية أخرى.
- `middleware.ts` (جذر): بوابة خفيفة تتحقق هل الزائر مسجل دخول أم لا.

## طبقة app/ (الصفحات)
كل صفحة ملف اسمه `page.tsx`. ملف `form.tsx` يعني فورم تفاعلي (Client Component — يعمل في المتصفح). ملف `actions.ts` يعني دوال سيرفر (Server Action — تعمل على السيرفر وتُستدعى من الفورم).

- `src/app/page.tsx`: صفحة البداية. تعرض كارت «سَنَد» مع زري الدخول والحساب. لو مسجل دخول تحوله إلى `/onboarding`. لا تنادي services.
- `src/app/layout.tsx`: الغلاف العام لكل الصفحات (الخطوط، الاتجاه RTL، السمة، التنبيهات). لا منطق فيه.
- `src/app/loading.tsx`: شاشة تحميل (Skeleton — مستطيلات رمادية متحركة) تظهر أثناء فتح أي صفحة.
- `src/app/not-found.tsx`: صفحة 404 بزر عودة للبداية.
- `src/app/login/page.tsx`: كارت الدخول + زر Google (يظهر فقط لو مفاتيح Google موجودة). فيها `googleAction` تنادي `signIn("google")` من `src/lib/auth/config.ts`.
- `src/app/login/form.tsx`: فورم الدخول. الدالة `LoginForm` تنادي `loginAction` من `./actions`، وعند الفشل تعرض الرسالة بـ `FormAlert` وتنبيه `toast`.
- `src/app/login/actions.ts`: الدالة `loginAction(values)` تتحقق من `loginSchema` ثم تنادي `signIn("credentials")` من `src/lib/auth/config.ts`. عند النجاح تحول إلى `/onboarding`.
- `src/app/register/page.tsx` + `form.tsx` (الدالة `RegisterForm`): نفس نمط الدخول.
- `src/app/register/actions.ts`: الدالة `registerAction(values)` تتحقق من `registerSchema` ثم تنادي `registerAccount` من `services/auth-accounts.ts` (الخطأ `TAKEN` يعني الإيميل مسجل)، ثم دخول تلقائي ثم تحويل إلى `/onboarding`.
- `src/app/forgot/page.tsx` + `form.tsx` (الدالة `ForgotForm`): تطلب الإيميل فقط.
- `src/app/forgot/actions.ts`: الدالة `forgotAction(values)` تنادي `requestPasswordReset` من `services/auth-accounts.ts` وترد دائمًا بنجاح حتى لا تكشف وجود الحسابات.
- `src/app/reset/page.tsx` + `form.tsx` (الدالة `ResetForm` تستقبل `email` و`token`): كلمة مرور جديدة.
- `src/app/reset/actions.ts`: الدالة `resetAction(email, token, values)` تنادي `resetPassword` من `services/auth-accounts.ts`، وعند النجاح تحول إلى `/login`.
- `src/app/verify/page.tsx`: صفحة تفعيل الإيميل من الرابط. تنادي `verifyEmailToken` من `services/auth-accounts.ts` وتعرض نجاحًا أو فشلًا مع زر مناسب.
- `src/app/onboarding/page.tsx`: شاشة البداية بعد الدخول. تنادي `auth()` ثم `listMyMemberships` من `services/org-selection.ts`. تعرض أزرار «دخول» لكل عضوية (كل زر فورم صغير ينادي `setActiveOrg`) + 3 كروت: إنشاء مركز / عندي كود / متابعة طفلي (معطل).
- `src/app/onboarding/actions.ts`: الدالة `setActiveOrg(formData)` تنادي `activateOrg` من `services/org-selection.ts` ثم تخزن كوكي `active_org` ثم تحول إلى `/dashboard`.
- `src/app/onboarding/create-center/page.tsx`: كارت بخطوتين ظاهريًا وإرسال واحد.
- `src/app/onboarding/create-center/form.tsx`: الدالة `CreateCenterForm` تستخدم `FormCheckboxes` للبرامج من `PROGRAM_CATALOG` في `src/lib/programs.ts` + حقل برنامج مخصص، وتنادي `createCenterAction`.
- `src/app/onboarding/create-center/actions.ts`: الدالة `createCenterAction(values)` تتحقق من `createCenterSchema`، وتحول البرنامج المخصص إلى مفتاح `custom:...` عبر `customProgramKey`، ثم تنادي `createCenter` من `services/orgs.ts`، ثم تخزن كوكي `active_org` وتحول إلى `/dashboard`.
- `src/app/onboarding/enter-code/page.tsx` + `form.tsx` (الدالة `EnterCodeForm`): حقل كود واحد.
- `src/app/onboarding/enter-code/actions.ts`: الدالة `enterCodeAction(values)` تنادي `consumeInvite` من `services/invites.ts` ثم تخزن كوكي `active_org` وتحول إلى `/dashboard`.
- `src/app/dashboard/page.tsx`: لوحة المركز. تنادي `viewer()` من `services/viewer.ts` (غير العضو يُحوَّل إلى `/onboarding`) ثم `getDashboard` من `services/screens.ts`. تعرض اسم المركز والدور والفروع (تظهر فقط لو أكثر من فرع) والبرامج وكارت «قريبًا» وزر تبديل المركز و`ThemeToggle`.
- `src/app/platform/page.tsx`: شاشة المنصة للأدمن العام فقط. تنادي `viewer()` (غير المنصة يُحوَّل) ثم `getPlatformStats` من `services/screens.ts`. تعرض لكل مركز: الاسم والفروع والأعضاء والبرامج والتواصل — أرقام فقط بلا تفاصيل.
- `src/app/ui-demo/page.tsx`: بوابة معرض المكونات. لو `NODE_ENV` يساوي `production` تعرض 404، وإلا تعرض `DemoSections` من `./demo`.
- `src/app/ui-demo/demo.tsx`: الدالة `DemoSections` (عرض ثابت) + `DemoForm` (فورم تجريبي بإرسال وهمي) + `EditExample` (يحاكي تحميل سجل بعد ثانية لعرض وضع التعديل).
- `src/app/api/auth/[...nextauth]/route.ts`: نقطة استقبال طلبات Auth.js (الدخول والجلسات). يصدّر `GET` و`POST` من `handlers` في `src/lib/auth/config.ts`.

## طبقة components/
- `src/components/ui/*` (17 ملفًا مولدًا): `button` `card` `input` `label` `textarea` `select` `radio-group` `checkbox` `switch` `field` `input-group` `sonner` `separator` `skeleton` `dropdown-menu` `direction` `spinner`. لا منطق مشروع فيها.
- `src/components/form/field-shell.tsx`: `FieldShell` (عنوان + وصف + خطأ حول أي حقل) و`FormAlert` (رسالة خطأ على مستوى الفورم). مستدعاة من كل حقول الفورم.
- `src/components/form/form-input.tsx`: `FormInput` (نص/إيميل/باسورد مع زر إظهار/رقم يفرق الفارغ عن الصفر/هاتف، أيقونات بداية/نهاية). مستدعاة من فورمات login/register/forgot/reset/create-center/enter-code.
- `src/components/form/form-textarea.tsx`: `FormTextarea`. لا مستدعٍ لها حاليًا خارج `ui-demo`.
- `src/components/form/form-select.tsx`: `FormSelect`. لا مستدعٍ لها حاليًا خارج `ui-demo`.
- `src/components/form/form-radio-group.tsx`: `FormRadioGroup`. لا مستدعٍ لها حاليًا خارج `ui-demo`.
- `src/components/form/form-checkbox.tsx`: `FormCheckbox` (مفرد) و`FormCheckboxes` (مجموعة، تُستخدم في فورم إنشاء المركز للبرامج).
- `src/components/form/form-switch.tsx`: `FormSwitch`. لا مستدعٍ لها حاليًا خارج `ui-demo`.
- `src/components/form/form-submit-button.tsx`: `FormSubmitButton` يعرض «جارٍ الحفظ…» ويُعطَّل أثناء الإرسال. مستدعاة من كل الفورمات.
- `src/components/form/use-entity-form.ts`: `useEntityForm({schema, defaultValues, values})` — يبني الفورم مع `zodResolver`، ولو وصل `values` لاحقًا (وضع التعديل) يعيد الضبط عليها. مستدعاة من كل الفورمات.
- `src/components/form/index.ts`: يعيد تصدير كل ما سبق فقط.
- `src/components/theme-provider.tsx`: `ThemeProvider` (يغلّف `next-themes`). مستدعاة من `layout.tsx`.
- `src/components/theme-toggle.tsx`: `ThemeToggle` (قائمة فاتح/داكن/النظام). مستدعاة من صفحة الداشبورد و`ui-demo`.
- `src/lib/utils.ts`: الدالة `cn` (دمج أسماء CSS). مستدعاة من مكونات shadcn المولدة.

## طبقة lib/
- `src/lib/auth/config.ts`: إعداد Auth.js. يصدّر `handlers` (يستخدمه route الـ API) و`auth` (قراءة الجلسة — تستخدمه الصفحات والـ middleware) و`signIn`/`signOut` (يستخدمهما login/register). الدالة الداخلية `authorizeLogin` تنادي `verifyCredentials`. الـ callback `signIn` لحساب Google ينادي `ensureGoogleUser`. الـ callback `authorized` يسمح للمسارات العامة ويطلب جلسة لغيرها.
- `src/lib/env.ts`: `getEnv()` تقرأ وتتحقق من متغيرات البيئة حسب `NODE_ENV`، و`__resetEnvCache()` للاختبارات فقط. مستدعاة من `instrumentation.ts` و`connectDB` و`invites.ts` و`auth-accounts.ts` و`dev-logger.ts`.
- `src/lib/tenant/context.ts`: الأنواع فقط: `SessionContext` (ثلاث حالات: `platform` أدمن عام بلا مركز، `onboarding` مسجل بلا مركز، `member` عضو بمركز ودور ونطاق فروع) و`BranchScope` (`all` للمالك أو `list` بفروع محددة).
- `src/lib/tenant/scopedFilter.ts`: `scopedFilter(ctx, branchField)` تبني فلتر `{orgId}` وتضيف شرط الفروع لو النطاق `list`. مستدعاة من `screens.ts` و`branches-read.ts`.
- `src/lib/permissions/roles.ts`: `ROLES` و`can(role, action)` (جدول ثابت) و`rank(role)` (3/2/1 لمنع منح دور أعلى). مستدعاة من `invites.ts` و`memberships.ts` والاختبارات.
- `src/lib/result.ts`: النوع `Result` والدالتان `ok` و`fail`. لا مستدعٍ لهما حاليًا.
- `src/lib/invite-code.ts`: `generateInviteCode` (كود 8 حروف) و`normalizeInviteCode` (توحيد قبل المقارنة) و`hashInviteCode` (بصمة HMAC-SHA256 بالـ pepper). مستدعاة من `invites.ts` والاختبارات.
- `src/lib/programs.ts`: `PROGRAM_CATALOG` (قرآن/تجويد/تربية/مقرأة/ملعب) و`customProgramKey` (تحويل الاسم المخصص إلى `custom:...`). مستدعاة من فورم وأكشن إنشاء المركز.
- `src/lib/email/dev-logger.ts`: `sendAuthLink` تطبع رابط الإيميل في الـ logs (الإرسال الحقيقي لسه مش مبني). مستدعاة من `auth-accounts.ts`.

## طبقة services/
- `services/auth-accounts.ts`: `registerAccount` (إنشاء + رابط تفعيل، الخطأ `TAKEN` للإيميل المكرر) ← يناديها `registerAction`. `verifyEmailToken` ← صفحة verify. `requestPasswordReset` (صامتة لو الحساب غير موجود) ← `forgotAction`. `resetPassword` (ترفع `sessionVersion`) ← `resetAction`. `verifyCredentials` ← إعداد Auth.js. `ensureGoogleUser` ← إعداد Auth.js عند دخول Google.
- `services/session-context.ts`: `getSessionContext(userId, activeOrgId)` تبني السياق من الداتابيز في كل طلب: بلا user ← `UNAUTHENTICATED`، أدمن عام ← `platform`، بلا مركز ← `onboarding`، بلا عضوية فعالة ← `FORBIDDEN`، وإلا `member` بالنطاق من الدور. تنادي `User` و`Membership`. يناديها `viewer`.
- `services/viewer.ts`: `viewer()` تقرأ الجلسة (`auth`) وكوكي `active_org` ثم تنادي `getSessionContext`. تناديها صفحات dashboard وplatform.
- `services/org-selection.ts`: `listMyMemberships(userId)` (عضوياتي الفعالة مع أسماء المراكز) ← صفحة onboarding. `activateOrg(userId, orgId)` (تتحقق من عضوية فعالة) ← أكشن `setActiveOrg`.
- `services/orgs.ts`: `createCenter(userId, raw)` تتحقق داخليًا بـ schema خاص، تشترط إيميلًا مفعّلًا و3 مراكز كحد أقصى، ثم transaction واحدة تكتب Org + فرع «الفرع الرئيسي» + عضوية مالك + البرامج. يناديها أكشن إنشاء المركز.
- `services/invites.ts`: `createInvite` (إنشاء كود بحد 20 نشطة، بلا مستدعٍ من الواجهة حاليًا) و`consumeInvite` (استهلاك ذري بشرط واحد ثم إعادة فحص صلاحية الداعي والفرع، ثم إنشاء عضوية أو إعادة تفعيل معطلة). تنادي `assertMembershipShape` و`assertBranchesInOrg`. ينادي `consumeInvite` أكشن إدخال الكود.
- `services/memberships.ts`: `assertMembershipShape` (الفروع إجبارية للأدوار المحدودة) و`assertBranchesInOrg` (الفروع داخل نفس المركز) و`guardAdminChange` (حماية المنشئ وآخر أدمن — مع ملاحظة سباق مكتوبة في الكود) و`assertRankAllows`. تُستخدم في `invites.ts` والاختبارات فقط حاليًا.
- `services/screens.ts`: `getDashboard(ctx)` (اسم المركز + الفروع بالنطاق + البرامج) ← الداشبورد. `getPlatformStats()` (أرقام كل المراكز) ← صفحة المنصة.
- `services/branches-read.ts`: `listBranches(ctx)` خدمة صغيرة للاختبار فقط — لا تستخدمها الصفحات.

## طبقة db/models/
كلها تعريف شكل الجدول فقط (Mongoose Schema). الجداول الفعلية في MongoDB بأسماء جمع lowercase (users, orgs...).
- `User.ts`: الهوية (اسم/إيميل فريد/صورة/باسورد مخفي `select:false`/حالة/أدمن عام/`sessionVersion`). تُقرأ من كل خدمات الحسابات والسياق.
- `Org.ts`: المركز + `adminsVersion` (مخصص لمنع السباق لاحقًا) + منشئ المركز.
- `Branch.ts`: الفرع (اسم فريد داخل المركز + حالة). فهرس `{orgId, name}` فريد.
- `Membership.ts`: العضوية (مستخدم + مركز + دور + فروع + حالة). فهرس `{userId, orgId}` فريد. تحقق الفروع يعمل عند الإنشاء فقط وليس عند التحديث المباشر.
- `Invite.ts`: الدعوة (كود مُبصَّم لا يُخزَّن نصًا + انتهاء + استخدام/إلغاء + `purgeAt` للحذف بعد 30 يومًا). الفرع إجباري لغير المالك.
- `OrgProgram.ts`: برامج المركز المفعلة. فهرس `{orgId, programKey}` فريد.
- `VerificationToken.ts`: روابط التفعيل والاستعادة لمرة واحدة (تُحذف بانتهائها).
- `AuditLog.ts`: سجل الأحداث (يُحذف بعد 180 يومًا). لا كتابة فيه من أي service حاليًا.
- `RateLimit.ts`: عدّادات الحماية (تُحذف بعد 24 ساعة). لا استخدام لها حاليًا.
- `src/db/connection.ts`: `connectDB(uri?)` اتصال واحد مخزن يُعاد استخدامه، والفهارس تُبنى تلقائيًا خارج الإنتاج.

## طبقة validators/
- `common.ts`: قوالب (إيميل/باسورد/هاتف مصري/نص/رقم/اختيار/كود) برسائل عربية. `emptyTo` تحوّل `""` إلى `undefined`. غير المستخدمة حاليًا: `confirmPasswordRule` و`optionalPhoneRule` و`numberRule` (تُستخدم في `ui-demo` فقط `optionalNumberRule` و`selectRequired`).
- `forms.ts`: ست schemas (دخول/حساب/نسيان/تعيين/مركز/كود) — نفس الكائن يُستخدم في الفورم (RHF) والأكشن (السيرفر).

## طبقة scripts/
- `scripts/seed-dev.ts`: `seedDev()` تنشئ مركزين تجريبيين (Dev Org A/B) بعضوية مالك لكل منهما. ترفض الإنتاج بدون `ALLOW_DEV_SEED=true`. التشغيل: `npm run seed:dev`.
- `scripts/seed-super-admin.ts`: `seedSuperAdmin()` تنشئ/تحدّث أدمن المنصة من متغيرات البيئة (تعمل أكثر من مرة بأمان). التشغيل: `npm run seed:super-admin`.
- `scripts/ensure-indexes.ts`: `ensureIndexes()` تبني الفهارس المعلنة بدون حذف (`createIndexes` فقط). التشغيل: `npm run db:indexes`.

## طبقة tests/
تعمل على داتابيز وهمية في الذاكرة (`mongodb-memory-server`) عبر `tests/helpers/db.ts` (الدوال `startMemoryDB` و`stopMemoryDB` و`clearDB`).
- `uniques.test.ts`: خمسة اختبارات للفهارس الفريدة (إيميل/عضوية/فرع/برنامج/بصمة كود).
- `membership-validation.test.ts`: اختباران (الفروع إجبارية للمحدودين، والمالك بلا فروع).
- `roles.test.ts`: جدول الصلاحيات الثابت + حماية المنشئ وآخر أدمن + شرط الفرع في الدعوة.
- `isolation.test.ts`: خمسة اختبارات أن كل مركز/فرع يرى بياناته فقط.
- `seeds.test.ts`: اختباران (تكرار seed الأدمن آمن، ورفض seed-dev في الإنتاج).

## الملفات الجذرية (config)
- `package.json`: الأوامر (`dev/build/start/typecheck/lint/test/seed:*/db:indexes`) والمكتبات.
- `middleware.ts`: يمرر الطلب لـ Auth.js، ويحمي `/dashboard/*` و`/onboarding/*` و`/platform/*` (غير المسجل يُحوَّل إلى `/login`).
- `src/instrumentation.ts`: يعمل مرة عند إقلاع السيرفر ويتحقق من متغيرات البيئة بصوت عالٍ.
- `eslint.config.mjs`: أهم قاعدة فيه تمنع استيراد الـ models خارج `services/` و`scripts/` و`tests/`.
- `components.json`: إعداد shadcn (النمط الافتراضي + RTL).
- `postcss.config.mjs` + `src/app/globals.css`: تنسيقات Tailwind وتوكنات Sanad (موثقة في `docs/sanad-tokens.md`).
- `.env.example`: نسخة فارغة من الإعدادات (انسخها إلى `.env`).

## جدول الـ Routes
| المسار | النوع | الملف | من يدخله | ماذا يفعل |
|---|---|---|---|---|
| `/` | صفحة | `app/page.tsx` | عام | ترحيب + رابطا الدخول والحساب، والمسجل يُحوَّل |
| `/login` | صفحة + فورم | `app/login/*` | عام | دخول إيميل/باسورد أو Google |
| `/register` | صفحة + فورم | `app/register/*` | عام | حساب جديد + دخول تلقائي |
| `/forgot` | صفحة + فورم | `app/forgot/*` | عام | طلب رابط الاستعادة (رد ثابت) |
| `/reset?email&token` | صفحة + فورم | `app/reset/*` | عام (معه رابط) | كلمة مرور جديدة |
| `/verify?email&token` | صفحة | `app/verify/page.tsx` | عام (معه رابط) | تفعيل الإيميل |
| `/onboarding` | صفحة محمية | `app/onboarding/page.tsx` | مسجل | عضوياتي + 3 كروت |
| `/onboarding/create-center` | صفحة + فورم | `app/onboarding/create-center/*` | مسجل (بإيميل مفعّل) | إنشاء مركز |
| `/onboarding/enter-code` | صفحة + فورم | `app/onboarding/enter-code/*` | مسجل | الانضمام بكود |
| `/dashboard` | صفحة محمية | `app/dashboard/page.tsx` | عضو بمركز | اسم المركز والدور والفروع والبرامج |
| `/platform` | صفحة محمية | `app/platform/page.tsx` | أدمن عام فقط | أرقام كل المراكز |
| `/ui-demo` | صفحة تطوير | `app/ui-demo/*` | غير الإنتاج فقط (404 في الإنتاج) | معرض المكونات |
| `/api/auth/[...nextauth]` | API | route handler | عام | تسجيل الدخول والجلسات (Auth.js) |

## جدول الـ Server Actions والـ API
| الاسم | الملف | المدخلات | الـ service | المخرجات |
|---|---|---|---|---|
| `loginAction` | `login/actions.ts` | إيميل + باسورد | `signIn` (Auth.js) | تحويل إلى onboarding أو رسالة خطأ |
| `registerAction` | `register/actions.ts` | اسم + إيميل + باسورد | `registerAccount` ثم `signIn` | تحويل أو رسالة (منها الإيميل المكرر) |
| `forgotAction` | `forgot/actions.ts` | إيميل | `requestPasswordReset` | رسالة نجاح ثابتة دائمًا |
| `resetAction` | `reset/actions.ts` | إيميل + توكن + باسورد | `resetPassword` | تحويل إلى login أو رسالة انتهاء |
| `setActiveOrg` | `onboarding/actions.ts` | orgId (FormData) | `activateOrg` | كوكي `active_org` + تحويل إلى dashboard |
| `createCenterAction` | `create-center/actions.ts` | بيانات المركز + برامج | `createCenter` | كوكي + تحويل إلى dashboard أو رسالة |
| `enterCodeAction` | `enter-code/actions.ts` | كود | `consumeInvite` | كوكي + تحويل إلى dashboard أو رسالة |
| `googleAction` | داخل `login/page.tsx` | — | `signIn("google")` | تحويل إلى onboarding |
| `GET/POST /api/auth/*` | route handler | حسب Auth.js | الجلسات والـ JWT | جلسة/كوكي |

## موجود لكن غير مستخدم حاليًا
- `Result` و`ok` و`fail` في `src/lib/result.ts`: لا مستدعٍ (الأكشنات ترد بكائنات `{ok, message}` مباشرة).
- `createInvite` في `services/invites.ts`: لا واجهة تنشئ دعوات بعد (الاستهلاك فقط هو المبني).
- `listBranches` في `services/branches-read.ts`: للاختبارات فقط، لا صفحة تستخدمها.
- `AuditLog` و`RateLimit`: معرفان وتُبنى فهارسهما فقط، بلا قراءة/كتابة.
- `confirmPasswordRule` و`optionalPhoneRule` و`numberRule` في `validators/common.ts`: بلا استخدام خارج `ui-demo`.
- `FormTextarea` و`FormSelect` و`FormRadioGroup` و`FormSwitch`: بلا استخدام خارج `ui-demo`.
- `middleware.ts` يحمي المسارات لكن التفاصيل الدقيقة (الدور) تُفحص داخل كل صفحة.
