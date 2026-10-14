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
- `src/app/dashboard/page.tsx`: الرئيسية (ترحيب + ملخص الفروع والبرامج + زر الفريق للمشرفين). تنادي `viewer()` ثم `getDashboard`.
- `src/app/dashboard/layout.tsx`: إطار الداشبورد (علوي + جانبي + محتوى) للأعضاء فقط.
- `src/app/dashboard/topbar.tsx`: `Topbar` (اسم المركز + مبدّل المركز/الفرع + قائمة المستخدم خروج/سمة).
- `src/app/dashboard/sidebar.tsx`: `MobileSidebar` (درج تحت xl) و`DesktopSidebar` (عناصر حسب الدور).
- `src/app/dashboard/team/page.tsx` + `actions.ts` (`createInviteAction`/`revokeInviteAction`/`updateMemberAction`/`teamData`) + `copy-button.tsx` (`CopyInvite`): صفحة الفريق للمشرفين فقط.
- `src/app/dashboard/students/page.tsx`: القائمة (إحصائيات + فلاتر nuqs + جدول + ترقيم). تنادي `getStudentStats` و`listStudents`.
- `src/app/dashboard/students/_toolbar.tsx`: `StudentsToolbar` (بحث debounce + فلاتر عبر nuqs).
- `src/app/dashboard/students/actions.ts`: `createStudentAction`/`updateStudentAction`/`deleteStudentAction`/`regenerateCodeAction` (ترجع `StudentActionResult`) و`archiveStudentAction`/`restoreStudentAction` (redirect) و`uploadStudentImageAction` (FormData).
- `src/app/dashboard/students/_student-form.tsx`: `StudentForm` الواحد للإنشاء والتعديل (حقول + أولياء `useFieldArray` + حوار التكرار).
- `src/app/dashboard/students/new/page.tsx`: إضافة (فورم فارغ + فرع حسب التعدد).
- `src/app/dashboard/students/bulk/page.tsx`: تبويبا `?tab=` (جدول سريع / استيراد) + زر «إضافة جماعية» الثانوي في القائمة.
- `src/app/dashboard/students/bulk/_bulk-table.tsx`: جدول 10 صفوف مبدئية (حتى 200) + لصق TSV + تحقق فوري + حفظ مع بقاء الفاشل وتأكيد المكرر.
- `src/app/dashboard/students/bulk/_import-tab.tsx`: نموذج ← رفع (سحب/اختيار) ← معاينة بفلتر أخطاء ← حفظ السليم + CSV للفاشل.
- `src/app/dashboard/students/bulk/actions.ts`: `bulkSaveAction` و`previewImportAction` و`commitImportAction` (يعيد التحقق ثم ينادي الجماعية).
- `public/students-template.xlsx`: النموذج (بيانات + دليل + قوائم مخفية حتى صف 501).
- `src/app/dashboard/students/[id]/page.tsx`: البطاقة (معلومات/أولياء/حفظ/كود ولي الأمر مع نسخ وتجديد/ملاحظات/أنشطة وتقارير placeholder) + تعديل/أرشفة/حذف نهائي بتأكيد الاسم.
- `src/app/dashboard/students/[id]/_actions-ui.tsx`: `DeleteStudentButton` و`RegenerateCodeButton` و`CopyTextButton`.
- `src/app/dashboard/students/[id]/edit/page.tsx`: نفس الفورم بقيم السجل (hifzPosition فقط للحفظ).
- `src/app/dashboard/students|groups|attendance|settings/page.tsx`: صفحات «قريبًا» (الإعدادات ترفض المعلم).
- `src/app/dashboard/loading.tsx` و`not-found.tsx` و`placeholder.tsx` (`PlaceholderPage`).
- `src/app/verify-pending/page.tsx` + `actions.ts` (`resendAction` بحد 3/ساعة) + `resend-button.tsx`: انتظار التفعيل الإجباري.
- `src/app/dashboard/actions.ts`: `logoutAction` (جهاز واحد) و`setBranchPrefAction` (كوكي `active_branch`).
- `src/app/platform/page.tsx`: شاشة المنصة للأدمن العام فقط. تنادي `viewer()` (غير المنصة يُحوَّل) ثم `getPlatformStats` من `services/screens.ts`. تعرض لكل مركز: الاسم والفروع والأعضاء والبرامج والتواصل — أرقام فقط بلا تفاصيل.
- `src/app/ui-demo/page.tsx`: بوابة معرض المكونات. لو `NODE_ENV` يساوي `production` تعرض 404، وإلا تعرض `DemoSections` من `./demo`.
- `src/app/ui-demo/demo.tsx`: الدالة `DemoSections` (عرض ثابت) + `DemoForm` (فورم تجريبي بإرسال وهمي) + `EditExample` (يحاكي تحميل سجل بعد ثانية لعرض وضع التعديل).
- `src/app/api/auth/[...nextauth]/route.ts`: نقطة استقبال طلبات Auth.js (الدخول والجلسات). يصدّر `GET` و`POST` من `handlers` في `src/lib/auth/config.ts`.

## طبقة components/
- `src/components/ui/*` (20 ملفًا مولدًا): السابق + `popover` `command` `dialog`. لا منطق مشروع فيها.
- `src/components/stat-card.tsx`: `StatCard` (رقم واحد). مستدعاة من قائمة الطلاب.
- `src/components/empty-state.tsx`: `EmptyState` (عنوان + وصف + زر). مستدعاة من قائمة الطلاب.
- `src/components/form/field-shell.tsx`: `FieldShell` (عنوان + وصف + خطأ حول أي حقل) و`FormAlert` (رسالة خطأ على مستوى الفورم). مستدعاة من كل حقول الفورم.
- `src/components/form/form-input.tsx`: `FormInput` (نص/إيميل/باسورد مع زر إظهار/رقم يفرق الفارغ عن الصفر/هاتف، أيقونات بداية/نهاية). مستدعاة من فورمات login/register/forgot/reset/create-center/enter-code.
- `src/components/form/form-textarea.tsx`: `FormTextarea` (تُستخدم في فورم الطالب).
- `src/components/form/form-select.tsx`: `FormSelect` (تُستخدم في فورم الطالب: النوع/المستوى/الفرع/الصلة).
- `src/components/form/form-radio-group.tsx`: `FormRadioGroup`. لا مستدعٍ لها حاليًا خارج `ui-demo`.
- `src/components/form/form-checkbox.tsx`: `FormCheckbox` (مفرد) و`FormCheckboxes` (مجموعة، تُستخدم في فورم إنشاء المركز للبرامج).
- `src/components/form/form-switch.tsx`: `FormSwitch`. لا مستدعٍ لها حاليًا خارج `ui-demo`.
- `src/components/form/form-date-picker.tsx`: `FormDatePicker` (سنة/شهر/يوم بقوائم، للأعمار 4–18). مستدعاة من فورم الطالب.
- `src/components/form/quran-position-field.tsx`: `QuranPositionField` (سورة ببحث + آية بحد أقصى). مستدعاة من فورم الطالب.
- `src/components/form/form-image-upload.tsx`: `FormImageUpload` (رفع فوري بمعاينة عبر دالة تُمرَّر). مستدعاة من فورم الطالب.
- `src/components/form/form-submit-button.tsx`: `FormSubmitButton` يعرض «جارٍ الحفظ…» ويُعطَّل أثناء الإرسال. مستدعاة من كل الفورمات.
- `src/components/form/use-entity-form.ts`: `useEntityForm({schema, defaultValues, values})` — يبني الفورم مع `zodResolver`، ولو وصل `values` لاحقًا (وضع التعديل) يعيد الضبط عليها. مستدعاة من كل الفورمات.
- `src/components/form/index.ts`: يعيد تصدير كل ما سبق فقط.
- `src/components/theme-provider.tsx`: `ThemeProvider` (يغلّف `next-themes`). مستدعاة من `layout.tsx`.
- `src/components/theme-toggle.tsx`: `ThemeToggle` (قائمة فاتح/داكن/النظام). مستدعاة من صفحة الداشبورد و`ui-demo`.
- `src/lib/utils.ts`: الدالة `cn` (دمج أسماء CSS). مستدعاة من مكونات shadcn المولدة.

## طبقة lib/
- `src/lib/auth/config.ts`: إعداد Auth.js. يصدّر `handlers` (يستخدمه route الـ API) و`auth` (قراءة الجلسة — تستخدمه الصفحات والـ middleware) و`signIn`/`signOut` (يستخدمهما login/register). الدالة الداخلية `authorizeLogin` تنادي `verifyCredentials`. الـ callback `signIn` لحساب Google ينادي `ensureGoogleUser`. الـ callback `authorized` يسمح للمسارات العامة ويطلب جلسة لغيرها.
- `src/lib/env.ts`: `getEnv()` تقرأ وتتحقق من متغيرات البيئة حسب `NODE_ENV`، و`__resetEnvCache()` للاختبارات فقط. مستدعاة من `instrumentation.ts` و`connectDB` و`invites.ts` و`auth-accounts.ts` و`dev-logger.ts`.
- `src/lib/tenant/context.ts`: الأنواع فقط: `SessionContext` (أربع حالات: `platform` و`onboarding` و`unverified` ببريدها و`member` بعضوية ودور ونطاق فروع).
- `src/lib/students.ts`: `normalizeArabic` (تشكيل/تطويل/همزات) و`isProfileIncomplete` + `incompleteFilter` (نفس الشرط للداتابيز) و`calcAge`.
- `src/lib/cloudinary.ts`: `isCloudinaryEnabled` و`uploadStudentImage` (مجلد `{orgId}/students`) و`deleteStudentImage` (أفضل جهد). مستدعاة من أكشنات وخدمات الطلاب.
- `src/lib/invite-code.ts`: `generateInviteCode` (8) و`generateCode(length)` (كود ولي الأمر 10) و`normalizeInviteCode` و`hashInviteCode`. مستدعاة من `invites.ts` و`students.ts` والاختبارات.
- `src/lib/tenant/scopedFilter.ts`: `scopedFilter(ctx, branchField)` تبني فلتر `{orgId}` وتضيف شرط الفروع لو النطاق `list`. مستدعاة من `screens.ts` و`branches-read.ts`.
- `src/lib/permissions/roles.ts`: `ROLES` و`can(role, action)` (جدول ثابت يشمل إجراءات الطلاب) و`rank(role)` (3/2/1 لمنع منح دور أعلى). مستدعاة من `invites.ts` و`memberships.ts` و`students.ts` والصفحات والاختبارات.
- `src/constants/students.ts`: `defineOptions` (مفاتيح + عربي تُشتق منها الأنواع وzod وMongoose وخيارات الواجهة) ومجموعات GENDERS/LEVELS/STATUS/القرابة/الاتجاه/التجويد و`ROLE_NAMES_AR` (المصدر الوحيد، teacher=مشرف) و`QURAN_SURAHS` (114 سورة من Quran.com API) مع `getSurah` و`isValidAyah`.
- `src/lib/result.ts`: النوع `Result` والدالتان `ok` و`fail`. لا مستدعٍ لهما حاليًا (أكشنات الطلاب ترد شكلًا متوافقًا موسعًا بحقل `code`).
- `src/lib/invite-code.ts`: `generateInviteCode` (8 حروف) و`generateCode(length)` (كود ولي الأمر 10) و`normalizeInviteCode` و`hashInviteCode` (بصمة HMAC بالـ pepper). مستدعاة من `invites.ts` و`students.ts` والاختبارات.
- `src/lib/programs.ts`: `PROGRAM_CATALOG` (قرآن/تجويد/تربية/مقرأة/ملعب) و`customProgramKey` (تحويل الاسم المخصص إلى `custom:...`). مستدعاة من فورم وأكشن إنشاء المركز.
- `src/lib/email/dev-logger.ts`: `sendAuthLink` ترسل عبر Resend عند التفعيل (قالب عربي RTL)، وتطبع الرابط خارج الإنتاج. مستدعاة من `auth-accounts.ts`.

## طبقة services/
- `services/auth-accounts.ts`: `registerAccount` (إنشاء + رابط تفعيل، الخطأ `TAKEN` للإيميل المكرر) ← يناديها `registerAction`. `verifyEmailToken` ← صفحة verify. `requestPasswordReset` (صامتة لو الحساب غير موجود) ← `forgotAction`. `resetPassword` (ترفع `sessionVersion`) ← `resetAction`. `verifyCredentials` ← إعداد Auth.js. `ensureGoogleUser` ← إعداد Auth.js عند دخول Google.
- `services/session-context.ts`: `getSessionContext(userId, activeOrgId, expectedSessionVersion?)` تبني السياق من الداتابيز في كل طلب: بلا user ← `UNAUTHENTICATED`، نسخة جلسة قديمة ← `UNAUTHENTICATED`، أدمن عام ← `platform`، بلا تفعيل ← `unverified`، بلا مركز ← `onboarding`، بلا عضوية فعالة ← `FORBIDDEN`، وإلا `member` بالنطاق من الدور. تنادي `User` و`Membership`. يناديها `viewer`.
- `services/viewer.ts`: `viewer()` تقرأ الجلسة (`auth`) وكوكي `active_org` ثم تنادي `getSessionContext`. تناديها صفحات dashboard وplatform.
- `services/org-selection.ts`: `listMyMemberships(userId)` ← صفحة onboarding. `activateOrg` (تتحقق من عضوية فعالة + تفعيل) ← أكشن `setActiveOrg`. `activateBranchPref` (فرع ضمن النطاق) ← أكشن تفضيل الفرع.
- `services/branch-pref.ts`: `readBranchPref()` تقرأ كوكي `active_branch` (تُتحقق عند الحفظ لا القراءة).
- `services/orgs.ts`: `createCenter(userId, raw)` تتحقق داخليًا بـ schema خاص، تشترط إيميلًا مفعّلًا و3 مراكز كحد أقصى، ثم transaction واحدة تكتب Org + فرع «الفرع الرئيسي» + عضوية مالك + البرامج. يناديها أكشن إنشاء المركز.
- `services/invites.ts`: `createInvite` (بحد 20 نشطة + شرط التفعيل) ← صفحة الفريق. `consumeInvite` (ذري + إعادة فحص + شرط التفعيل، ويعيد تفعيل المعطلة) ← أكشن الكود. `listInvites`/`revokeInvite` (بالنطاق) ← صفحة الفريق.
- `services/members.ts`: `listMembers` (بالنطاق) و`updateMember` (تغيير دور/تعطيل بحماية المنشئ وآخر أدمن) ← صفحة الفريق.
- `services/team.ts`: `getTeamData(ctx, pref)` (ليست أكشن — تُستدعى من الصفحة) تجمع الفروع والأعضاء والدعوات مع فلتر الفرع.
- `services/progress-reports.ts`: `listReports` (السابق + الآيات باستعلام واحد) و`getReport` و`createReport`/`updateReport`/`deleteReport` (مع `syncStudentPosition`) و`getLatestReportKeys` (تجميع واحد لصفوف الصفحة).
- `src/validators/reports.ts`: `reportPositionRule` (يتحقق ضد عدد الآيات) و`createReportSchema`/`updateReportSchema` (مشتركة عميل+سيرفر).
- `services/rate-limit.ts`: `checkRateLimit(key, windowMs, max, message)` (عدّادات RateLimit) ← إعادة الإرسال وطلب الاستعادة.
- `services/students.ts`: `listStudents` (بحث مطبّع/هواتف + فلاتر + ترقيم 20) و`getStudent` و`getStudentStats` و`createStudent` (تحذير `duplicate` + كود ولي أمر فريد) و`updateStudent` (الموضع فقط للحفظ) و`archiveStudent`/`restoreStudent` و`deleteStudentPermanently` (مؤرشف + مدراء فقط + حذف الصورة) و`regenerateParentCode` و`createStudentsBulk` (نفس القواعد لكل صف + حد 500) و`previewBulkImport` (بدون كتابة). الفرع من النطاق سيرفرًا (الوحيد تلقائيًا).
- `src/lib/students.ts`: `normalizeArabic` و`isProfileIncomplete` + فلتره و`calcAge` و`cleanPhone` (عربي←لاتيني، +20←0، صفر Excel المقصوص) و`toOptionKey` (عربي/إنجليزي ← مفتاح).
- `src/lib/tsv.ts`: `parseTSV` (لصق Excel/Sheets كأسطر وtabs).
- `src/lib/excel-import.ts`: `parseStudentWorkbook` (توقيع zip + أول ورقة + عناوين بالاسم + أنواع الخلايا) و`mapRow` و`toCreateInput` (تعيين عربي + أخطاء منطقية) و`COLUMN_AR`.
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
- `Student.ts`: الطالب (فرع واحد إجباري، `nameSearch`، أولياء بلا أسماء ≤4، حفظ بداية/حالي، `parentCode` فريد، صورة، أرشفة). فهارس: `{orgId, branchId, status, createdAt}` و`{orgId, branchId, nameSearch}`.
- `ProgressReport.ts`: التقرير (موضع إجباري + مراجعة + تجويد + اتجاه يدوي + ملاحظات + مفتاح يوم القاهرة). فهرسان للطالب والفرع. الإنجاز والسابق يُحسبان عرضًا.
- `src/lib/progress.ts`: `ayahIndex` (1..6236) و`ayahsBetween` (مطلق بلا حكم) و`formatRange` و`todayKeyCairo` و`daysAgoLabel`.
- `VerificationToken.ts`: روابط التفعيل والاستعادة لمرة واحدة (تُحذف بانتهائها).
- `AuditLog.ts`: سجل الأحداث (يُحذف بعد 180 يومًا). لا كتابة فيه من أي service حاليًا.
- `RateLimit.ts`: عدّادات الحماية (تُحذف بعد 24 ساعة). لا استخدام لها حاليًا.
- `src/db/connection.ts`: `connectDB(uri?)` اتصال واحد مخزن يُعاد استخدامه، والفهارس تُبنى تلقائيًا خارج الإنتاج.

## طبقة validators/
- `common.ts`: قوالب (إيميل/باسورد/هاتف مصري/نص/رقم/اختيار/كود) برسائل عربية. `emptyTo` تحوّل `""` إلى `undefined`. غير المستخدمة حاليًا: `confirmPasswordRule` و`optionalPhoneRule` و`numberRule` (تُستخدم في `ui-demo` فقط `optionalNumberRule` و`selectRequired`).
- `src/validators/students.ts`: `birthDateRule` (نص YYYY-MM-DD) و`toBirthDate` (ظهر UTC) و`guardianRule` و`createStudentSchema`/`updateStudentSchema` (مشتركة عميل+سيرفر) و`studentFormSchema` (موحدة للفورم).
- `forms.ts`: ست schemas (دخول/حساب/نسيان/تعيين/مركز/كود) + `inviteFormSchema` (دور/فرع/مدة) — نفس الكائن يُستخدم في الفورم (RHF) والأكشن (السيرفر).

## طبقة scripts/
- `scripts/seed-dev.ts`: `seedDev()` تنشئ مركزين تجريبيين (Dev Org A/B) بعضوية مالك لكل منهما + 50 طالبًا وهميًا في الأول. ترفض الإنتاج بدون `ALLOW_DEV_SEED=true`. التشغيل: `npm run seed:dev`.
- `scripts/seed-super-admin.ts`: `seedSuperAdmin()` تنشئ/تحدّث أدمن المنصة من متغيرات البيئة (تعمل أكثر من مرة بأمان). التشغيل: `npm run seed:super-admin`.
- `scripts/ensure-indexes.ts`: `ensureIndexes()` تبني الفهارس المعلنة بدون حذف (`createIndexes` فقط). التشغيل: `npm run db:indexes`.

## طبقة tests/
تعمل على داتابيز وهمية في الذاكرة (`mongodb-memory-server`) عبر `tests/helpers/db.ts` (الدوال `startMemoryDB` و`stopMemoryDB` و`clearDB`).
- `uniques.test.ts`: خمسة اختبارات للفهارس الفريدة (إيميل/عضوية/فرع/برنامج/بصمة كود).
- `membership-validation.test.ts`: اختباران (الفروع إجبارية للمحدودين، والمالك بلا فروع).
- `roles.test.ts`: جدول الصلاحيات الثابت + حماية المنشئ وآخر أدمن + شرط الفرع في الدعوة.
- `isolation.test.ts`: خمسة اختبارات أن كل مركز/فرع يرى بياناته فقط.
- `seeds.test.ts`: اختباران (تكرار seed الأدمن آمن، ورفض seed-dev في الإنتاج).
- `constants.test.ts`: ثوابت السور (114 سورة ومجموع 6236) ودوالها ومجموعات الخيارات.
- `progress.test.ts`: حسابات الآيات (نفس/عبر/عكسي/متطابق/منتصف الليل) و`daysAgoLabel`.
- `progress-reports.test.ts`: المصفوفة + العزل + تزامن الموضع + حساب المتتاليات + المؤرشف والحذف.
- `student-utils.test.ts`: التطبيع وتطابق الدالة مع فلتر Mongo والعمر.
- `students.test.ts`: عزل القراءة/الكتابة + البحث + التكرار + الحذف النهائي + الكود + الإحصائيات + التعديل.
- `session-version.test.ts`: قبول المطابق ورفض القديم + حالة `unverified`.
- `team.test.ts`: الدعوات (إنشاء/حد/إلغاء بالنطاق) + حماية الأعضاء.
- `verification.test.ts`: رفض غير المفعّل + استبدال التسجيل + مسح باسورد Google + رحلة كاملة.
- `google-login.test.ts` و`invite-flow.test.ts`: هوية Google ودورة الدعوة (أُضيفتا لاحقًا).

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
| `/verify-pending` | صفحة | `app/verify-pending/*` | مسجل غير مفعّل فقط | رسالة + إعادة إرسال (3/ساعة) + خروج |
| `/onboarding` | صفحة محمية | `app/onboarding/page.tsx` | مسجل مفعّل | عضوياتي + 3 كروت |
| `/onboarding/create-center` | صفحة + فورم | `app/onboarding/create-center/*` | مسجل (بإيميل مفعّل) | إنشاء مركز |
| `/onboarding/enter-code` | صفحة + فورم | `app/onboarding/enter-code/*` | مسجل | الانضمام بكود |
| `/dashboard` | صفحة محمية (بهيكل) | `app/dashboard/*` | عضو بمركز | ترحيب + ملخص + شريط علوي/جانبي |
| `/dashboard/team` | صفحة + فورمات | `app/dashboard/team/*` | مشرفون فقط (سيرفر) | دعوات + أعضاء + إلغاء + أدوار |
| `/dashboard/students` | صفحة + فلاتر | `app/dashboard/students/*` | عضو (تقرير) | إحصائيات + جدول + ترقيم + أرشفة |
| `/dashboard/students/new` | صفحة + فورم | `new/*` | `student:create` | إضافة طالب (فرع حسب التعدد) |
| `/dashboard/students/bulk` | صفحتان بتبويب | `bulk/*` | `student:import` | جدول سريع (200 صف) / استيراد Excel (معاينة ثم حفظ) |
| `/dashboard/students/[id]` | صفحة | `[id]/*` | عضو | البطاقة + ملخص وقائمة التقارير + كود ولي الأمر + إجراءات |
| `/dashboard/students/[id]/edit` | صفحة + فورم | `[id]/edit/*` | `student:edit` | نفس الفورم (الحفظ: الموضع فقط) |
| `/dashboard/students/[id]/reports/new` | صفحة + فورم | `[id]/reports/*` | `report:create` | تقرير جديد (الموضع معبأ بالحالي) |
| `/dashboard/students/[id]/reports/[reportId]/edit` | صفحة + فورم | `[reportId]/edit/*` | `report:edit` | نفس الفورم بقيم التقرير |
| `/dashboard/students/[id]` | صفحة | `[id]/*` | عضو | البطاقة + كود ولي الأمر + إجراءات |
| `/dashboard/students/[id]/edit` | صفحة + فورم | `[id]/edit/*` | `student:edit` | نفس الفورم (الموضع فقط للحفظ) |
| `/dashboard/students|groups|attendance|settings` | placeholder | `app/dashboard/*` | عضو (الإعدادات لغير المعلم) | «قريبًا» |
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
| `logoutAction` / `setBranchPrefAction` | `dashboard/actions.ts` | — / فرع | `signOut` / `activateBranchPref` | تحويل إلى login / dashboard |
| `resendAction` | `verify-pending/actions.ts` | — | `resendVerification` | نجاح أو رسالة حد |
| `createInviteAction` / `revokeInviteAction` / `updateMemberAction` | `team/actions.ts` | دور/فرع/مدة / id / دور+حالة | `createInvite` / `revokeInvite` / `updateMember` | كود مرة واحدة أو تحويل برسالة |
| `createStudentAction` / `updateStudentAction` | `students/actions.ts` | حقول الفورم | `createStudent` / `updateStudent` | تحويل للتفاصيل أو تحذير تكرار |
| `deleteStudentAction` / `regenerateCodeAction` | `students/actions.ts` | id | `deleteStudentPermanently` / `regenerateParentCode` | تحويل أو رسالة |
| `archiveStudentAction` / `restoreStudentAction` | `students/actions.ts` | id | `archiveStudent` / `restoreStudent` | تحديث الصفحة |
| `createReportAction` / `updateReportAction` / `deleteReportAction` | `[id]/reports/actions.ts` | حقول التقرير / id | `createReport` / `updateReport` / `deleteReport` | تحويل لبطاقة الطالب أو رسالة |
| `uploadStudentImageAction` | `students/actions.ts` | ملف (FormData) | Cloudinary لمجلد المركز | رابط ومعرف أو رسالة |
| `GET/POST /api/auth/*` | route handler | حسب Auth.js | الجلسات والـ JWT | جلسة/كوكي |

## موجود لكن غير مستخدم حاليًا
- `Result` و`ok` و`fail` في `src/lib/result.ts`: لا مستدعٍ مباشر (أكشنات الطلاب ترد شكلًا متوافقًا موسعًا بحقلي `code` و`duplicate`).
- `listBranches` في `services/branches-read.ts`: تُستخدم في صفحات الطلاب والفريق والاختبارات.
- `AuditLog`: معرّف ويُبنى فهرسه فقط، بلا قراءة/كتابة.
- `confirmPasswordRule` و`optionalPhoneRule` و`numberRule` في `validators/common.ts`: بلا استخدام خارج `ui-demo`.
- `FormRadioGroup` و`FormSwitch`: بلا استخدام خارج `ui-demo`.
- `PROGRESS_TRENDS` و`TAJWEED_RATINGS`: ثوابت للمستقبل (التقارير)، بلا استخدام بعد.
- `middleware.ts` يحمي المسارات لكن التفاصيل الدقيقة (الدور) تُفحص داخل كل صفحة.
