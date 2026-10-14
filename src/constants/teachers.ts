// ثوابت المعلمين: الاسم العربي (مصدر واحد) والحالة — تُستخدم في zod وMongoose والواجهة.
import { defineOptions } from "./students";

export const TEACHER_LABEL = "معلم";
export const TEACHERS_LABEL = "المعلمون";

export const TEACHER_STATUS = defineOptions(["active", "archived"] as const, {
  active: "نشط",
  archived: "مؤرشف",
});
