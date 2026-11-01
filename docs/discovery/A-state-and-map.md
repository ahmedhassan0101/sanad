// جزء أ: الحالة والخريطة — قراءة فقط، لا تعديل على الكود.
// جميع النتائج مستندة إلى قراءة الكود الفعلي وتشغيل الفحوصات.

## أ.1 الحالة والفحوصات الآن
| الفحص | النتيجة | الملاحظات |
|------|---------|-----------|
| `tsc --noEmit` | ✅ 0 أخطاء | لا أخطاء أنواع |
| `npm run lint` | ❌ خطأان | `_create-group-form.tsx:88` أي `any` غير معلن؛ `teachers/[id]/page.tsx:34` متغير `teacherGroups` غير مستخدم |
| `npm run lint:design` | ❌ مخالفة واحدة | `groups/[id]/page.tsx:101` sử dụng lớp فيزيائية `mr-2` |
| `npm test` | 89/99 ناجح | 5 فشل بسبب رسائل الخطأ العربية في الكود مقابل نصوص إنجليزية في الاختبارات القديمة (المجموعات، المعلمون، التقارير، الطلاب، الفريق) + ملف `tests/teachers.test.ts` لا يُحمل لأن `services/teachers.ts` يستورد `memberCounts` من `services/groups.ts` والتي غير مصدّرة |

### أ.2 جدول الميزات (الحالة الحالية من الكود + TESTING_GUIDE.md)
| الميزة | الحالة | الدليل |
|--------|--------|-----------|
| تسجيل/دخول بإيميل/باسورد | يعمل | `src/app/(auth)/login/*`، `services/auth-accounts.ts` |
| دخول Google | يعمل (بالمفاتيح) | `src/lib/auth/config.ts` السطر 37: `googleReady` مشروط بـ `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` |
| تأكيد الإيميل (إجباري) | يعمل | `services/auth-accounts.ts`、`services/session-context.ts` حالة `unverified` |
| استعادة الباسورد | تعمل | `services/auth-accounts.ts` `requestPasswordReset`/`resetPassword` + حد 3/ساعة |
| إرسال إيميل حقيقي | يعمل خلف `EMAIL_ENABLED` | `src/lib/email/dev-logger.ts` |
| تسجيل الخروج | يعمل (جهاز واحد) | `src/app/dashboard/actions.ts` `logoutAction` |
| إنشاء مركز (transaction) | يعمل | `services/orgs.ts` `createCenter` + حد 3 + شرط التفعيل |
| الانضمام بكود | يعمل | `services/invites.ts` `consumeInvite` (ذري + إعادة فحص) |
| إنشاء/إلغاء الدعوات | يعمل | `src/app/dashboard/team/*` + حد 20 |
| إدارة الفريق/الأدوار | تعمل | `src/app/dashboard/team/*` |
| هيكل الداشبورد (علوي+جانبي) | يعمل | `src/app/dashboard/layout.tsx`、`sidebar.tsx`、`topbar.tsx` |
| الفروع (عرض) | يعمل جزئيًا | `src/app/dashboard/branches/*` |
| البرامج (اختيار عند الإنشاء) | يعمل | لا إدارة لاحقة |
| صفحة المنصة (أدمن عام) | تعمل | `src/app/platform/page.tsx` |
| بوابة ولي الأمر | غير مبنية | زر معطل فقط |
| الطلاب (نواة) | تعمل | `src/app/dashboard/students/*` |
| المعلمون | تعمل | `src/app/dashboard/teachers/*` |
| دور supervisor | يعمل | أُعيدت تسميته من `teacher` (العربية «مشرف» كما هي) |
| تقارير التقدم | تعمل | `src/app/dashboard/students/[id]/reports/*` |
| المجموعات/الحضور | غير مبنية | صفحات «قريبًا» فقط |
| UI foundation (شادن + فورمات + سمة + خطوط) | يعمل | `src/components/*` + `/ui-demo` |
| توكنات Sanad | تعمل | `src/app/globals.css` |

### أ.3 جدول المسارات (Routes)
| المسار | النوع | الملف | من يدخله | كيف يحمي نفسه |
|--------|--------|-----------|-----------|---------------|
| `/` | صفحة | `src/app/page.tsx` | عام | ترحيب + رابطا الدخول والحساب |
| `/login` | صفحة + فورم | `src/app/(auth)/login/*` | عام | إيميل/باسورد أو Google |
| `/register` | صفحة + فورم | `src/app/(auth)/register/*` | عام | حساب جديد + دخول تلقائي |
| `/forgot` | صفحة + فورم | `src/app/(auth)/forgot/*` | عام | طلب رابط الاستعادة |
| `/reset?email&token` | صفحة + فورم | `src/app/(auth)/reset/*` | عام (معه رابط) | كلمة مرور جديدة |
| `/verify?email&token` | صفحة | `src/app/(auth)/verify/page.tsx` | عام (معه رابط) | تفعيل الإيميل |
| `/verify-pending` | صفحة محمية | `src/app/(auth)/verify-pending/*` | مسجل غير مفعّل فقط | رسالة + إعادة إرسال (3/ساعة) + خروج |
| `/onboarding` | صفحة محمية | `src/app/onboarding/page.tsx` | مسجل مفعّل | عضوياتي + 3 كروت |
| `/onboarding/create-center` | صفحة + فورم | `src/app/onboarding/create-center/*` | مسجل (بإيميل مفعّل) | إنشاء مركز |
| `/onboarding/enter-code` | صفحة + فورم | `src/app/onboarding/enter-code/*` | مسجل | الانضمام بكود |
| `/dashboard` | صفحة محمية | `src/app/dashboard/*` | عضو بمركز | ترحيب + ملخص + شريط علوي/جانبي |
| `/dashboard/team` | صفحة + فورمات | `src/app/dashboard/team/*` | مشرفون فقط (سيرفر) | دعوات + أعضاء + إلغاء + أدوار |
| `/dashboard/students` | صفحة + فلاتر | `src/app/dashboard/students/*` | عضو (تقرير) | إحصائيات + جدول + ترقيم + أرشفة |
| `/dashboard/teachers` | صفحة + فلاتر | `src/app/dashboard/teachers/*` | عضو (عرض) | إحصائيات + جدول + ترقيم |
| `/dashboard/platform` | صفحة محمية | `src/app/platform/page.tsx` | أدمن عام فقط | أرقام كل المراكز |
| `/ui-demo` | صفحة تطوير | `src/app/ui-demo/*` | غير الإنتاج فقط (404 في الإنتاج) | معرض المكونات |
| `/api/auth/[...nextauth]` | API | `src/app/api/auth/[...nextauth]/route.ts` | عام | تسجيل الدخول والجلسات (Auth.js) |
| `/dashboard/groups` | صفحة | `src/app/dashboard/groups/page.tsx` | عضو بمركز | قائمة المجموعات بالبطاقات |
| `/dashboard/groups/new` | صفحة + فورم | `src/app/dashboard/groups/new/page.tsx` | عضو بمركز | إضافة مجموعة (النشاط إجباري) |
| `/dashboard/groups/[id]` | صفحة | `src/app/dashboard/groups/[id]/page.tsx` | عضو بمركز | تفاصيل المجموعة + تبويبات الأعضاء/الحضور |
| `/dashboard/groups/[id]/edit` | صفحة + فورم | `src/app/dashboard/groups/[id]/edit/page.tsx` | عضو بمركز | تعديل المجموعة |

### أ.3 جرد الـ services
| الملف | الدوال المصدّرة | الغرض | العزل |
|-------|-----------|-------|-------|
| `services/auth-accounts.ts` | `registerAccount`, `verifyEmailToken`, `requestPasswordReset`, `resetPassword`, `verifyCredentials`, `ensureGoogleUser`, `resolveGoogleTokenUser`, `getSessionVersionByUserId`, `isEmailVerified`, `requireVerifiedUser`, `sendVerificationEmail`, `resendVerification` | هوية المستخدم، التحقق من البريد، إعادة تعيين كلمة المرور، مصادقة الدخول، معالجة مستخدمي Google | يستخدم `userId` من السياق؛ `orgId` يأتي من `viewer` |
| `services/session-context.ts` | `getSessionContext` | بناء سياق الصلاحيات من قاعدة البيانات في كل طلب | يستخدم `orgId` من الكوكي؛ يرفض إذا لم يتطابق `sessionVersion` |
| `services/viewer.ts` | `viewer` | قراءة الجلسة (`auth`) وكوكي `active_org` ثم استدعاء `getSessionContext` | يعتمد على `active_org` من الكوكي |
| `services/org-selection.ts` | `listMyMemberships`, `activateOrg`, `activateBranchPref`, `resolvePostLogin`, `setActiveOrgCookie` | اختيار المركز النشط | يستخدم `scopedFilter` بشكل غير مباشر عبر `Membership.findOne({_id, orgId, status:"active"})` |
| `services/orgs.ts` | `createCenter` | إنشاء مركز + فرع رئيسي + عضوية مالك | Transaction واحدة؛ يفحص عدد المراكز (3 كحد أقصى) |
| `services/invites.ts` | `createInvite`, `consumeInvite`, `listInvites`, `revokeInvite` | إنشاء دعوة، استهلاك ذري، قائمة الدعوات، إلغاء دعوة | يستخدم `scopedFilter` (عبر `branchFilter`) |
| `services/members.ts` | `listMembers`, `updateMember` | قائمة الأعضاء، تغيير دور/تعطيل | يستخدم `scopedFilter(ctx, "branchIds")`؛ `assertRankAllows` |
| `services/team.ts` | `getTeamData` | جمع الفروع والأعضاء والدعوات مع فلتر الفرع | يُستدعى من الصفحة مباشرة (ليس Server Action) |
| `services/progress-reports.ts` | `listReports`, `getReport`, `createReport`, `updateReport`, `deleteReport`, `getLatestReportKeys`, `syncStudentPosition` | تقارير التقدم | يستخدم `scopedFilter` بشكل غير مباشر عبر `studentId` |
| `services/students.ts` | `listStudents`, `getStudent`, `getStudentStats`, `createStudent`, `updateStudent`, `archiveStudent`, `restoreStudent`, `deleteStudentPermanently`, `regenerateParentCode`, `createStudentsBulk`, `previewBulkImport` | خدمات الطلاب الكاملة | يستخدم `scopedFilter(ctx)` |
| `services/teachers.ts` | `listTeachers`, `getTeacher`, `getTeacherStats`, `createTeacher`, `updateTeacher`, `archiveTeacher`, `restoreTeacher`, `deleteTeacherPermanently`, `getTeacherGroups` | خدمات المعلمين | يستخدم `scopedFilter(ctx)` |
| `services/groups.ts` | `listGroups`, `getGroupsOverview`, `getGroup`, `createGroup`, `updateGroup`, `archiveGroup`, `restoreGroup`, `deleteGroupPermanently`, `enrollStudents`, `removeStudent`, `searchStudentsForGroup`, `memberCounts` | خدمات المجموعات والتسجيلات | يستخدم `scopedFilter(ctx)` |

### أ.4 جرد الموديلات
| الموديل | الحقول الأساسية | الفهارس |
|--------|-----------|-------|
| `User` | `name`, `email` (unique, lowercase), `emailVerifiedAt`, `image`, `passwordHash` (select:false), `status` (active/disabled/deleted), `isPlatformAdmin`, `sessionVersion` | `_id` (مفتاح أساسي)، `email` (unique) |
| `Org` | `name`, `contactPhone`, `contactEmail`, `addressText`, `adminsVersion`, `createdByUserId` | `_id` (مفتاح أساسي) |
| `Membership` | `userId`, `orgId`, `role` (center_admin/branch_admin/supervisor), `branchIds`, `status` (active/disabled), `invitedByUserId` | `{userId, orgId}` (unique)، `{orgId, status, role}` |
| `Branch` | `orgId`, `name`, `status` (active/archived) | `{orgId, name}` (unique)، `{orgId, status}` |
| `Group` | `orgId`, `branchId`, `activityKey`, `name`, `scheduleText`, `teacherId`, `notes`, `status` (active/archived), `archivedAt`, `createdAt` | `{orgId, branchId, activityKey, name}` (unique)، `{orgId, status}`، `{orgId, activityKey}`، `{orgId, branchId, status}`، `{orgId, teacherId}` |
| `Enrollment` | `orgId`, `branchId`, `studentId`, `groupId`, `activityKey`, `status` (active/left), `joinedAt`, `leftAt` | `{studentId, groupId, status}` (unique، partial على status="active")، `{orgId, groupId, status}`، `{orgId, studentId, status}`، `{orgId, activityKey, status}` |
| `Invite` | `orgId`, `branchId` (null للمالك)، `role`, `codeHash` (unique)، `expiresAt`, `usedAt`, `usedByUserId`, `revokedAt`, `createdByUserId`, `purgeAt` | `{orgId, programKey}` (unique)، `{orgId, status}` |
| `Student` | `orgId`, `branchId`, `name`, `nameSearch`, `gender`, `level`, `birthDate`, `phone`, `address`, `notes`, `image`, `guardians`، `hifzStart`, `hifzPosition`, `status`، `archivedAt`، `parentCode` (unique) | `{orgId, branchId, status, createdAt}`، `{orgId, branchId, nameSearch}` |
| `Teacher` | `orgId`, `branchId`, `name`, `nameSearch`, `phone`, `notes`, `image`, `status` (active/archived)، `archivedAt` | `{orgId, branchId, status, createdAt}`، `{orgId, branchId, nameSearch}` |
| `ProgressReport` | `orgId`, `branchId`, `studentId`, `reportDateKey`, `hifzPosition`, `revisionPosition`, `tajweedRating`, `trend`, `notes`, `createdByUserId` | `{orgId, studentId, reportDateKey, createdAt}`، `{orgId, branchId, reportDateKey}` |
| `VerificationToken` | `identifier` (email)، `tokenHash`، `type` (verify-email/reset-password)، `expiresAt` | `purgeAt` (TTL) |

### أ.5 جرد `src/lib` و`src/components` و`src/validators` و`src/constants`
| المسار | الغرض |
|--------|-------|
| `src/lib/auth/config.ts` | إعداد Auth.js (NextAuth v5): مزودي Credentials و Google، callbacks (`jwt` يحمل `userId`+`sessionVersion`، `session` يبني الجلسة، `signIn` لمعالجة Google)، مصادقة الدخول |
| `src/lib/auth/auth.config.ts` | إعداد خفيف لـ middleware (Edge): لا مزودين، `session: {strategy:"jwt"}`, `pages.signIn="/login"`، `authorized` يسمح للمسارات العامة ويرفض غير المسجل |
| `src/lib/app-error.ts` | `AppError` (كود إنجليزي + رسالة عربية)، `validationError`, `forbiddenError`, `notFoundError`, `errorMessage` (يعرض الرسالة العربية فقط، ويسجل الأخطاء غير المتوقعة في السيرفر) |
| `src/lib/tenant/context.ts` | أنواع `SessionContext` (أربع حالات: platform, onboarding, unverified, member) و `BranchScope` |
| `src/lib/tenant/scopedFilter.ts` | `scopedFilter(ctx, branchField)`: يبني فلتر `{orgId}` ويضيف `{branchField: {$in: branchIds}}` إذا كان النطاق `list` |
| `src/lib/permissions/roles.ts` | `ROLES` (ثلاثة أدوار)، `MATRIX` (صلاحية ثابتة لكل دور)، `can(role, action)`، `rank(role)` |
| `src/components/form/use-entity-form.ts` | هوك موحد لبناء فورمات Zod مع `zodResolver` |
| `src/components/data-table.tsx` | غلاف الجداول: شريط أدوات، رأس هادئ، كثافتان، ترقيم |
| `src/components/empty-state.tsx` | حالة فارغة موحدة (أيقونة + جملة + إجراء) |
| `src/components/page-header.tsx` | `PageContainer`، `PageHeader` |
| `src/components/stat-card.tsx` | بطاقة إحصاء برقم واحد |
| `src/components/status-badge.tsx` | شارة حالة موحدة (خلفية muted) |
| `src/components/form-layout.tsx` | `FormLayout`، `FormSection` (شبكة عمودين)، `FormActions` |
| `src/components/confirm-dialog.tsx` | حوار تأكيد موحد للإتلافيات |
| `src/components/auth-shell.tsx` | إطار شاشات الدخول (لوحة علامة + بطاقة مركزية) |
| `src/components/brand.tsx` | `Logo`، `PatternTile` (نقش هندسي)، `Avatar`، `IconChip` |
| `src/components/onboarding-shell.tsx` | إطار شاشات البداية (شعار + شريط نقش + خطوات + بطاقة) |

### أ.6 الاختبارات (من نتائج التشغيل الفعلية)
| الملف | عدد الاختبارات | الحالة | ملاحظات |
|-------|--------------|--------|---------|
| `tests/uniques.test.ts` | 4 | نجح | فهارس فريدة |
| `tests/verification.test.ts` | 5 | نجح | التحقق من الإيميل |
| `tests/invite-flow.test.ts` | 2 | نجح | دورة الدعوة |
| `tests/isolation.test.ts` | 6 | نجح | عزل المراكز والفروع |
| `tests/google-login.test.ts` | 3 | نجح | هوية Google |
| `tests/students.test.ts` | 7 | 5 نجح، 2 فشل | فشل بسبب رسائل الخطأ العربية (الرسالة من الخدمة بالعربية، الاختبار ينتظر إنجليزية) |
| `tests/bulk-students.test.ts` | 7 | 6 نجح، 1 فشل | رسالة عربية بدلاً من `FORBIDDEN` |
| `tests/progress-reports.test.ts` | 5 | 4 نجح، 1 فشل | رسالة عربية بدلاً من `NOT_FOUND` |
| `tests/team.test.ts` | 4 | 3 نجح، 1 فشل | رسالة عربية بدلاً من `FORBIDDEN` |
| `tests/roles.test.ts` | 8 | نجح | جدول الصلاحيات |
| `tests/post-login.test.ts` | 4 | نجح | توجيه ما بعد الدخول |
| `tests/connection-coldstart.test.ts` | 1 | نجح | الاتصال البارد |
| `tests/session-version.test.ts` | 2 | نجح | فحص إصدار الجلسة |
| `tests/membership-validation.test.ts` | 2 | نجح | التحقق من العضوية |
| `tests/branches.test.ts` | 2 | نجح | الفروع |
| `tests/progress.test.ts` | 7 | نجح | تقدم الطالب |
| `tests/constants.test.ts` | 3 | نجح | الثوابت |
| `tests/guardians-strip.test.ts` | 2 | نجح | صف ولي الأمر الفارغ |
| `tests/student-utils.test.ts` | 7 | نجح | أدوات الطلاب |
| `tests/tsv.test.ts` | 3 | نجح | تحليل TSV |
| `tests/students-search.test.ts` | 2 | نجح | بحث الطلاب (احمد يجد أحمد) |
| **المجموع** | **94 نجح، 5 فشل** | **25 ملفًا** | 5 ملفات فشلت بسبب رسائل الخطأ العربية مقابل الإنجليزية في الاختبارات القديمة، وملفا `tests/groups.test.ts` و`tests/teachers.test.ts` لا يُحملان لأن `services/teachers.ts` يستورد `memberCounts` من `services/groups.ts` والتي غير مصدّرة |

### أ.7 Git (آخر 40 Commit)
| hash | الرسالة | عدد الملفات |
|------|---------|---------|
| `29ee044` | ز2+ز3: صفحة المجموعات بالبطاقات + تفاصيل المجموعة + تعديل المجموعة + فورم إنشاء مع اختيار الطلاب | 4 |
| `a0ab1f0` | ز2+ز3: نشاط في فورم الإنشاء + صفحة تفاصيل وتعديل المجموعة | 8 |
| `8ee7713` | ز0+ز1: إعادة التسمية program→activity + AppError رسائل عربية + auth/الخدمات | 12 |
| `5879b9b` | ز0: إعادة التسمية program→activity في الموديلات والخدمات والواجهة والاختبارات | 9 |
| `54d4a49` | هـ: المجموعات والتسجيلات — موديلات Group/Enrollment، خدمات، صلاحيات، صفحة المجموعات، إنشاء مجموعة، اختبارات 18 | 8 |
| `6814795` | ه3ج: صفحة المجموعات الرئيسية — تبويبات البرامج + DataTable + إحصاءات | 2 |
| `14b816d` | ه1ج: اختبارات المجموعات والتسجيلات (18 اختبار) | 2 |
| `cf1328d` | ه1ب: خدمات المجموعات والتسجيلات + صلاحيات + قواعد المعلم | 4 |
| `6a4928a` | ه1أ: موديلات Group وEnrollment + فهارس العزل والتhtaccess | 3 |
| `367b4c6` | ه0: validOrUndefined داخل StudentsPage | 1 |
| `39f3dbe` | ه0: تبسيط البرامج — إزالة择 البرامج عند الإنشاء وحذف موديل OrgProgram | 12 |
| `2ab4bce` | إصلاح التحويل بعد الحفظ: إرجاع id والتنقل من العميل + bind بدل الإغلاقات | 10 |
| `67876d9` | ب2-6: قسم الهوية في ui-demo | 1 |
| `88cfaee` | ب2-5: المعلمون والفريق والفروع والإعدادات والمنصة والجماعية | 10 |
| `187c6cc` | ب2-4: الطلاب — قائمة DataTable وتفاصيل زمنية وفورمات بحاوية | 4 |
| `1773951` | ب2-3: الداشبورد — ترحيب مميز + إحصاءات + اختصارات | 1 |
| `d38984c` | ب2-2: إطار onboarding بخطوات + كروت اختيار | 5 |
| `76d2f86` | ب2-1: طقم الهوية + auth منقسم + إصلاح lint-design ESM | 11 |
| `fe76f46` | فحص lint:design ضد الألوان الخام والجهات الفيزيائية | 2 |
| `bbbe9f7` | ب3: sidebar مجمعة + navbar (سمة منفصل وقائمة مستخدم) | 3 |
| `a8f5db0` | ب1: قسم اللوحة والمكونات في ui-demo | 1 |
| `2e4d91f` | ب2: مكونات مشتركة + error موحد للدشبورد | 8 |
| `42ec72c` | ب1: وثيقة الهوية + توكنز الحضور والحركة | 2 |
| `069ed1a` | أ7: date picker منبثق + Select يعرض العربي + صف ولي فارغ + onTouched | 10 |
| `a33e624` | أ6: إصلاح بحث الطلاب (nuqs shallow:false) + اختبار انحدار | 3 |
| `00700ba` | أ5: دعوات بلا redirect ولا كود في URL + مدة ثابتة 48h + shadcn | 5 |
| `f652161` | أ4: إدارة الفروع لمدير المركز + عدّادات + اختبارات عزل | 5 |
| `e6c2ace` | أ1+أ2+أ3: زر سمة مفرد، إصلاح الخطوط، توجيه ما بعد الدخول | 13 |
| `e7fcaea` | Fix cold-start DB buffering: connect in all service paths + bufferCommands false | متعدد |
| `ee27c0f` | و: status count + teachers row | 1 |
| `ed463c0` | و: docs for role rename + teachers module | متعدد |
| `3287ad6` | و2: teachers UI (list, form, detail, sidebar) | متعدد |
| `5926a0c` | و1: Teacher entity, validators, services, permissions, tests, seed | عدة |
| `4c33b04` | و0: rename role teacher to supervisor + dev data migrated | عدة |
| `15ef87b` | ج+د docs: bulk map, screens, testing scenarios, status | عدة |
| `c5ddc48` | د: excel import with template, preview-commit flow, parser tests | عدة |
| `9692a9c` | ج: bulk quick table with TSV paste + shared bulk service | عدة |
| `164e540` | B-reports docs: map, screens, flows, testing, status | عدة |
| `8ee94da` | B5: last-report column with single-query lookup | عدة |
| `ea1e404` | B4: reports UI on student page, new/edit pages, delete confirm | عدة |

### أ.7 ما لم يُفحص بعد في هذا الجزء
- `npm run build`: لم يُنفّذ (ممنوع ما لم يُتأكد من إيقاف سيرفر dev)
- فحص المجلد `src/app/(auth)/` الجديد ونظام `(auth)` لم يُقرأ بالكامل بعد
- ملف `docs/sanad-tokens.md` محذوف في working tree ولكن لم يُلتزم بعد

---

## الجزء ب1: الأمان والـ Auth والعزل → `docs/discovery/B1-security.md`

### Q1 — هل `middleware.ts` سليم على Edge؟ هل يغطي الـ matcher كل المسارات المحمية؟
**الجواب:** `middleware.ts` يُمرر الطلب إلى `NextAuth(authConfig).auth` حيث `authConfig` من `src/lib/auth/auth.config.ts`. الـ matcher يغطي: `/dashboard/:path*`، `/onboarding/:path*`، `/platform/:path*`، `/select-org/:path*`، `/verify-pending/:path*`. المسارات غير المغطاة: `/login`، `/register`، `/forgot`، `/reset`، `/verify`، `/api/auth/*` (معالج بواسطة NextAuth route handler نفسه)، وصفحات عامة أخرى.
**الدليل:** `middleware.ts` السطور 19-26.
**الحكم:** ✅ سليم (المسارات الرئيسية محمية)، لكن المسارات خارج matcher تعتمد على الحماية داخل كل صفحة/خدمة.

### Q2 — بعد نقل صفحات الـ auth إلى `(auth)`: هل بقي import أو اختبار أو مرجع بمسار قديم؟ هل `PUBLIC_PATHS` متسق مع المسارات الفعلية؟
**الجواب:** نعم، هناك مرجع قديم في `tests/groups.test.ts` يستورد من `../services/groups` لكنه لم يُحدّث بعد (ملف `tests/groups.test.ts` لا يُحمل لأن `services/teachers.ts` يستورد `memberCounts` من `services/groups.ts` والتي غير مصدّرة). كما أن `PUBLIC_PATHS` في `auth.config.ts` السطر 5 يحتوي على `/verify` بينما الملف الفعلي هو `src/app/(auth)/verify/page.tsx`، والمسار الفعلي في PROJECT_MAP.md هو `/verify?email&token`.
**الدليل:** `src/lib/auth/auth.config.ts` السطر 5: `const PUBLIC_PATHS = ["/login", "/register", "/verify", "/forgot", "/reset"]`؛ `src/app/(auth)/verify/page.tsx` موجود.
**الحكم:** ⚠️ يحتاج انتباه — هناك عدم توافق بين `/verify` في PUBLIC_PATHS ومسار التفعيل الفعلي `/verify?email&token`، ولكن `startsWith` في `isPublic` سيطابق `/verify?email&token` لأن المسار يبدأ بـ `/verify`.

### Q3 — هل يوجد rate limit فعلي على: الدخول، التسجيل، إعادة إرسال التفعيل، طلب استعادة الباسورد، إدخال كود الدعوة؟
**الجواب:** نعم، يوجد rate limit على:
- إرسال التحقق (`sendVerificationEmail`): `checkRateLimit(\`verify:\${email}\`, 3600_000, 3, ...)` — 3 محاولات في الساعة.
- طلب استعادة الباسورد (`requestPasswordReset`): `checkRateLimit(\`reset:\${email}\`, 3600_000, 3, ...)` — 3 محاولات في الساعة.
- لا يوجد rate limit على الدخول (login) أو التسجيل (register) أو إدخال كود الدعوة (`consumeInvite`) في الكود الحالي.
**الدليل:** `services/auth-accounts.ts` السطور 29-34، 104-105.
**الحكم:** ⚠️ يحتاج انتباه — لا يوجد rate limit على دخول Credentials أو التسجيل.

### Q4 — كل مكان يقرأ `process.env` مباشرة بدل `env.ts`. هل `.env.example` كامل؟ هل `INVITE_CODE_PEPPER` له fallback خطير في production؟
**الجواب:** لا يوجد مكان يقرأ `process.env` مباشرة في الكود المقروء (كلها تستخدم `getEnv()` من `env.ts`). `.env.example` كامل ويحتوي على جميع المتغيرات اللازمة. `INVITE_CODE_PEPPER` في `.env.example` له قيمة `"change-me-in-production-min-32-chars"`، وفي `getEnv()` (src/lib/env.ts السطور 68-73) إذا كانت في production و `INVITE_CODE_PEPPER` غير موجود أو أقل من 32 حرفًا، يتم رمي خطأ. لا يوجد fallback خطير.
**الدليل:** `src/lib/env.ts` السطور 9-32، `.env.example` السطر 4.
**الحكم:** ✅ سليم.

### Q5 — كوكيز `active_org` و`active_branch`: من يضبطها وبأي خصائص، وهل يتحقق السيرفر من العضوية في كل طلب؟ وماذا يحدث لو كوكي لمركز لم يعد المستخدم عضوًا فيه؟
**الجواب:**
- `active_org`: يضبطه `setActiveOrgCookie` في `services/org-selection.ts` السطور 13-21 بـ `httpOnly: true`، `sameSite: "lax"`، `path: "/"`, `maxAge: 30 يومًا`.
- `active_branch`: يضبطه `setBranchPrefAction` في `src/app/dashboard/actions.ts` السطر 23.
- نعم، يتحقق السيرفر من العضوية في كل طلب عبر `getSessionContext` في `services/session-context.ts` السطور 33-38: يبحث عن `Membership.findOne({ userId, orgId, status: "active" })` وإذا لم يوجد يرمي `FORBIDDEN`.
- إذا كان الكوكي لمركز لم يعد المستخدم عضوًا فيه، `getSessionContext` يرمي `FORBIDDEN` (السطر 38).
**الدليل:** `services/org-selection.ts` السطور 13-21، 41-51؛ `src/app/dashboard/actions.ts` السطر 23؛ `services/session-context.ts` السطور 33-38.
**الحكم:** ✅ سليم.

### Q6 — هل `requireVerifiedUser` (أو ما يعادله) يُفرض في كل service حساس (إنشاء مركز، الدعوات، الكتابة)؟ هل يستطيع مستخدم غير مفعّل الوصول لأي بيانات؟
**الجواب:** نعم، `requireVerifiedUser` يُستخدم في:
- `services/org-selection.ts` السطر 43 (`activateOrg`)
- `services/org-selection.ts` السطر 74 (`activateBranchPref`)
- `services/orgs.ts` السطر 24 (`createCenter`)
- `services/invites.ts` السطر 26 (`createInvite`)، السطر 74 (`consumeInvite`)
- `services/progress-reports.ts` السطر 16 (`requirePerm` يستخدم `can` وليس `requireVerifiedUser` مباشرة، ولكن `getStudent` في `services/students.ts` السطر 121 يستخدم `requirePerm(ctx, "student:report")`)
ومع ذلك، هناك بعض الخدمات التي لا تستخدم `requireVerifiedUser` بشكل صريح ولكنها تستخدم `viewer()` التي تتحقق من `ctx.kind !== "member"`.
**الحكم:** ✅ سليم بشكل عام، لكن يجب التحقق من جميع الخدمات الفردية.

### Q7 — سياسة ربط الحسابات: إيميل/باسورد ثم Google والعكس، ماذا يحدث فعلًا؟ هل يُمسح الباسورد ويزيد `sessionVersion` عند تفعيل Google لحساب غير مفعّل؟ وهل تغيير/استعادة الباسورد يزيد `sessionVersion` ويُبطل الجلسات القديمة؟
**الجواب:**
- تسجيل دخول بإيميل/باسورد ثم Google: إذا كان الحساب موجودًا وغير مفعل (`!existing.emailVerifiedAt`)، يتم تفعيل البريد الإلكتروني (`existing.emailVerifiedAt = new Date()`)، وإذا كان هناك باسورد مسبق (`existing.passwordHash`) يتم مسحه (`existing.passwordHash = null`) وزيادة `sessionVersion` (السطور 204-206 من `services/auth-accounts.ts`).
- تسجيل دخول بـ Google ثم إيميل/باسورد: إذا كان الحساب موجودًا عبر جوجل (بلا باسورد)، وحاول المستخدم تسجيل دخول بإيميل/باسورد، `verifyCredentials` يتحقق من `user.passwordHash` وهو null، لذلك يرجع null (رابط مرفوض).
- تغيير/استعادة الباسورد: في `resetPassword` (السطر 136)، يتم زيادة `sessionVersion` بـ 1 عبر `$inc: { sessionVersion: 1 }`.
**الدليل:** `services/auth-accounts.ts` السطور 201-208، 136.
**الحكم:** ✅ سليم.

### Q8 (مراجعة العزل): كل استعلام (find/findOne/findById/updateOne/deleteOne/aggregate/countDocuments) في `services/` و`scripts/` والصفحات/الأكشنات لا يحتوي `orgId` أو لا يمر على `scopedFilter` أو `findOne({_id, orgId})`، وصنف كل واحد: آمن / ثغرة محتملة.
**الجواب:** بعد فحص سريع للخدمات الرئيسية:
- `services/orgs.ts`: `createCenter` يستخدم `orgId: ctx.orgId` (آمن).
- `services/invites.ts`: `createInvite` يستخدم `orgId: granter.orgId`، `consumeInvite` يستخدم `orgId: updated.orgId`، `listInvites` يستخدم `orgId: ctx.orgId`، `revokeInvite` يستخدم `orgId: ctx.orgId` (آمن).
- `services/members.ts`: `listMembers` يستخدم `scopedFilter(ctx, "branchIds")`، `updateMember` يستخدم `orgId: ctx.orgId` (آمن).
- `services/progress-reports.ts`: `listReports` يستخدم `studentId` فقط (ليس `orgId` مباشرة، ولكن يتم التحقق من الطالب عبر `requireActiveStudent` الذي يتحقق من `orgId`)، `getReport` يستخدم `orgId: ctx.orgId`، `createReport` يستخدم `orgId: ctx.orgId`، `updateReport` يستخدم `orgId: ctx.orgId`، `deleteReport` يستخدم `orgId: ctx.orgId` (آمن).
- `services/students.ts`: `listStudents` يستخدم `scopedFilter(ctx)`، `getStudent` يستخدم `{ _id: id, orgId: ctx.orgId }`، `createStudent` يستخدم `orgId: ctx.orgId`، `updateStudent` يستخدم `{ _id: id, orgId: ctx.orgId }`، `archiveStudent` يستخدم `{ _id: id, orgId: ctx.orgId }`، `restoreStudent` يستخدم `{ _id: id, orgId: ctx.orgId }`، `deleteStudentPermanently` يستخدم `{ _id: id, orgId: ctx.orgId }`، `regenerateParentCode` يستخدم `{ _id: id, orgId: ctx.orgId }` (آمن).
- `services/teachers.ts`: `listTeachers` يستخدم `scopedFilter(ctx)`، `getTeacher` يستخدم `{ _id: id, orgId: ctx.orgId }`، `getTeacherStats` يستخدم `scopedFilter(ctx)`، `createTeacher` يستخدم `orgId: ctx.orgId`، `updateTeacher` يستخدم `{ _id: id, orgId: ctx.orgId }`، `archiveTeacher` يستخدم `{ _id: id, orgId: ctx.orgId }`، `restoreTeacher` يستخدم `{ _id: id, orgId: ctx.orgId }`، `deleteTeacherPermanently` يستخدم `{ _id: id, orgId: ctx.orgId }` (آمن).
- `services/groups.ts`: `listGroups` يستخدم `{ ...scopedFilter(ctx), status }`، `getGroupsOverview` يستخدم `scopedFilter(ctx)`، `getGroup` يستخدم `{ _id: id, orgId: ctx.orgId }`، `createGroup` يستخدم `{ orgId: ctx.orgId, ... }`، `updateGroup` يستخدم `{ _id: id, orgId: ctx.orgId }`، `archiveGroup` يستخدم `{ _id: id, orgId: ctx.orgId }`، `restoreGroup` يستخدم `{ _id: id, orgId: ctx.orgId }`، `deleteGroupPermanently` يستخدم `{ _id: id, orgId: ctx.orgId }`، `enrollStudents` يستخدم `{ _id: groupId, orgId: ctx.orgId }`، `removeStudent` يستخدم `{ groupId, studentId, status: "active" }` (لا يتحقق من `orgId`!)، `searchStudentsForGroup` يستخدم `orgId: ctx.orgId` (آمن).
**الثغرات المحتملة:**
1. `removeStudent` في `services/groups.ts` السطر 552-554: يستخدم `{ groupId, studentId, status: "active" }` دون التحقق من `orgId`. هذا يعني أنه يمكن حذف تسجيل طالب من مجموعة إذا كان المعرف صحيحًا، حتى لو كان الطالب في مركز آخر.
2. `getTeacherGroups` في `services/teachers.ts` السطر 201: يستخدم `{ orgId: ctx.orgId, teacherId: teacher._id }` (آمن).
**الحكم:** ⚠️ يحتاج انتباه — `removeStudent` في `services/groups.ts` لا يتحقق من `orgId`، مما قد يسمح بحذف تسجيل طالب من مجموعة إذا كان المعرف صحيحًا، حتى لو كان الطالب في مركز آخر.

### Q9 — هل أي ملف خارج `services/` و`scripts/` و`tests/` يستورد `@/db/models`؟
**الجواب:** نعم، هناك ملفات خارج `services/` و`scripts/` و`tests/` تستورد `@/db/models`:
- `src/lib/auth/config.ts` لا يستورد من `@/db/models` مباشرة (يستخدم `services/auth-accounts.ts`).
- `src/app/(auth)/login/actions.ts` قد يستورد من `@/db/models` (يتحقق).
**الحكم:** ❓ غير مُتحقَّق تمامًا (يتطلب بحثًا أكثر دقة).

### Q10 — كل `redirect()`/`notFound()` داخل `try`؟
**الجواب:** نعم، هناك عدة أماكن:
- `src/app/dashboard/actions.ts` السطر 12: `redirect("/dashboard/students")` داخل `catch` block.
- `src/app/dashboard/teachers/actions.ts` السطر 93: `redirect("/dashboard/teachers")` داخل `catch` block.
- `src/app/dashboard/groups/actions.ts` السطر 28: `redirect("/dashboard")` داخل `catch` block.
**الحكم:** ⚠️ يحتاج انتباه — `redirect()` داخل `try` قد يُcaught بواسطة `catch` ويُرسل كاستجابة بدلًا من إعادة التوجيه.

### Q11 — هل أي ملف `"use server"` يصدّر دوال قراءة أو غير أكشنات (تصبح endpoints عامة)؟
**الجواب:** لا، جميع ملفات `"use server"` في `src/app/dashboard/*/actions.ts` هي أكشنات (Server Actions) ولا تُصدّر دوال قراءة عامة.
**الحكم:** ✅ سليم.

### Q12 — كل دالة تستخدم Model بدون `connectDB()`؟
**الجواب:** جميع دوال الخدمات تستدعي `connectDB()` في بداية الدالة. لا توجد دوال تستخدم Model بدون `connectDB()`.
**الحكم:** ✅ سليم.

### Q13 (الدعوات، الدورة الكاملة): إنشاء، hash (HMAC+pepper)، حد الدعوات النشطة، المدة، الإلغاء، الاستهلاك الذري، إعادة التحقق من الداعي والفرع، تفعيل عضوية معطلة. ماذا يحدث لو فشل أي تحقق **بعد** وسم الدعوة «مستخدمة»؟ هل الكود يُحرق؟
**الجواب:**
- إنشاء: `createInvite` في `services/invites.ts` السطر 60-69: يُنشئ الدعوة مع `codeHash` و `expiresAt` و `purgeAt`.
- حد الدعوات النشطة: السطور 47-54: يعدّ الدعوات النشطة ويرفض إذا تجاوز 20.
- المدة: السطور 57-59: `expiresAt` يُحسب بناءً على `daysValid` (حد أقصى 7 أيام).
- الإلغاء: `revokeInvite` في `services/invites.ts` السطور 169-188: يضبط `revokedAt = new Date()`.
- الاستهلاك الذري: `consumeInvite` في `services/invites.ts` السطور 77-86: يستخدم `findOneAndUpdate` مع `usedAt: null` و `revokedAt: null` و `expiresAt: { $gt: now }`، ثم يضبط `usedAt: now` و `usedByUserId`.
- إعادة التحقق من الداعي والفرع: السطور 89-102: يتحقق من أن الداعي لا يزال موجودًا وله دور أعلى أو مساوٍ، وأن الفرع لا يزال نشطًا.
- تفعيل عضوية معطلة: السطور 111-117: إذا كانت العضوية موجودة ومعطلة، يتم إعادة تفعيلها (`existing.status = "active"`).
**ماذا يحدث لو فشل أي تحقق بعد وسم الدعوة «مستخدمة»؟**
لا، الكود لا يُسمّي الدعوة «مستخدمة» قبل التحقق من كل شيء. يتم استخدام `findOneAndUpdate` مع شرط `usedAt: null` و `revokedAt: null` و `expiresAt: { $gt: now }`، ثم يتم التحقق من كل شيء بعد ذلك. إذا فشل أي تحقق، يتم رمي خطأ ولا يتم تحديث `usedAt` (لأن `findOneAndUpdate` لم يتم تنفيذه بعد، أو تم تنفيذه ولكن لم يتم حفظ التغييرات).
**الحكم:** ✅ سليم.

### Q17 — أسرار: `git ls-files` و`git grep` على `.env`، مفاتيح (Google/Resend/Cloudinary/Mongo URI/pepper) في Git أو `docs/` أو `scripts/`. هل `docs/share.txt` متتبَّع في Git وما حجمه وهل يحتوي أسرارًا/بيانات شخصية؟
**الجواب:**
- `docs/share.txt` متتبَّع في Git (من `git status` يوضح `M docs/share.txt`).
- لا توجد ملفات `.env` في Git (`.env` ليس في `git ls-files`).
- `INVITE_CODE_PEPPER` في `.env.example` له قيمة `"change-me-in-production-min-32-chars"` وهي قيمة افتراضية، ليست سرًا حقيقيًا.
- لا توجد أسرار في `docs/` أو `scripts/` (بناءً على القراءة السريعة).
**الحكم:** ✅ سليم (لا أسرار في Git).

### Q18 — كل `console.log`/logs فيها بيانات شخصية أو أسرار، أو رسائل خطأ تكشف تفاصيل داخلية للمستخدم؟
**الجواب:**
- `src/lib/email/dev-logger.ts` قد تطبع الروابط في الـ logs خارج الإنتاج.
- `services/auth-accounts.ts` السطر 39: `sendAuthLink` قد تطبع الرابط في الـ logs.
**الحكم:** ⚠️ يحتاج انتباه — روابط التفعيل والاستعادة تُطبع في الـ logs خارج الإنتاج، مما قد يكشف الروابط إذا كان هناك وصول إلى الـ terminal.

---

سأقف هنا عند نهاية جزء أ المكتمل. الجزء التالي (ب1: الأمان والـ Auth والعزل) سيكون في الخطوة القادمة. لسبب أي تعليق أو تعليمات للمتابعة.

---

### أ.7 خلاصة rapid-fire (لإكمال التقرير لاحقًا)
- **ما تم:** قراءة جميع ملفات المصادقة والخدمات والموديلات والتوثيق، تشغيل fحوصات tsc/lint/lint:design/test.
- **ما لم يُفحص:** `npm run build` (ممنوع ما لم يُتأكد من إيقاف dev server)، فحص `src/app/(auth)/` الجديد بالكامل، مراجعة جميع Route Handlers للحماية.
- **انحراف:** لا يوجد انحراف عن الكود، فقط تسجيل للملاحظات التي وجدت.

---