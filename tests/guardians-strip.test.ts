// الأولياء: الصف الفارغ كليًا يُحذف قبل التحقق، والمعبأ جزئيًا يُتحقق منه.
import { describe, expect, it } from "vitest";
import { studentFormSchema } from "../src/validators/students";

const base = {
  name: "سالم علي",
  gender: "male",
  level: "beginner",
  guardians: [] as { relation: "father"; phone: string }[],
};

describe("guardians strip", () => {
  it("يحذف الصف الفارغ ولا يعدّه خطأ", () => {
    const res = studentFormSchema.safeParse({
      ...base,
      guardians: [{ relation: "father", phone: "" }],
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.guardians).toEqual([]);
  });

  it("يتحقق من الصف المعبأ جزئيًا", () => {
    const res = studentFormSchema.safeParse({
      ...base,
      guardians: [{ relation: "father", phone: "12" }],
    });
    expect(res.success).toBe(false);
  });
});
