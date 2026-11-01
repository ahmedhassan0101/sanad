// مخططات التقارير المشتركة (عميل + سيرفر) — المواضع تُتحقق ضد عدد الآيات.
import { z } from "zod";
import {
  PROGRESS_TRENDS,
  TAJWEED_RATINGS,
  getSurah,
  isValidAyah,
} from "@/constants";
import { optionalString } from "./common";

export const reportPositionRule = z
  .object({
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().min(1, "الآية تبدأ من 1"),
  })
  .superRefine((v, ctx) => {
    if (!isValidAyah(v.surah, v.ayah)) {
      const s = getSurah(v.surah);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ayah"],
        message: s ? `عدد آيات السورة: ${s.ayahs}` : "السورة غير صحيحة",
      });
    }
  });

const reportFields = {
  hifzPosition: reportPositionRule,
  revisionPosition: reportPositionRule.optional(),
  tajweedRating: TAJWEED_RATINGS.zod(),
  trend: PROGRESS_TRENDS.zod(),
  notes: optionalString(1000),
};

export const createReportSchema = z.object(reportFields);
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportSchema = z.object(reportFields);
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
