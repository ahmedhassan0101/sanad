// خدمات تقارير التقدم: عزل دائم، والموضع السابق يُحسب لا يُخزَّن.
import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/db/connection";
import { ProgressReport } from "@/db/models/ProgressReport";
import { Student } from "@/db/models/Student";
import { isValidAyah } from "@/constants";
import { can, type Action } from "@/lib/permissions/roles";
import { ayahsBetween, todayKeyCairo } from "@/lib/progress";
import type { SessionContext } from "@/lib/tenant/context";
import type {
  CreateReportInput,
  UpdateReportInput,
} from "@/validators/reports";

import {
  validationError,
  forbiddenError,
  notFoundError,
} from "@/lib/app-error";

type MemberCtx = Extract<SessionContext, { kind: "member" }>;

function requirePerm(ctx: MemberCtx, action: Action) {
  if (!can(ctx.role, action)) throw forbiddenError("لا صلاحية لديك");
}

function inScope(ctx: MemberCtx, branchId: Types.ObjectId): boolean {
  return (
    ctx.branchScope.mode === "all" ||
    ctx.branchScope.branchIds.some((b) => b.equals(branchId))
  );
}

async function requireActiveStudent(ctx: MemberCtx, studentId: string) {
  if (!Types.ObjectId.isValid(studentId)) throw notFoundError();
  await connectDB();
  const student = await Student.findOne({ _id: studentId, orgId: ctx.orgId });
  if (!student || !inScope(ctx, student.branchId)) throw notFoundError();
  return student;
}

function checkPosition(pos: { surah: number; ayah: number }) {
  if (!isValidAyah(pos.surah, pos.ayah)) {
    throw validationError("موضع غير صحيح في المصحف");
  }
}

// موضع أحدث تقرير (بالتاريخ ثم الإنشاء) أو البداية — دالة واحدة للثلاث عمليات.
export async function syncStudentPosition(studentId: Types.ObjectId) {
  await connectDB();
  const student = await Student.findById(studentId);
  if (!student) return;
  const latest = await ProgressReport.findOne({
    studentId,
    orgId: student.orgId,
  }).sort({
    reportDateKey: -1,
    createdAt: -1,
  });
  student.hifzPosition = latest
    ? { surah: latest.hifzPosition.surah, ayah: latest.hifzPosition.ayah }
    : student.hifzStart
      ? { surah: student.hifzStart.surah, ayah: student.hifzStart.ayah }
      : null;
  await student.save();
}

export async function getReport(ctx: MemberCtx, reportId: string) {
  requirePerm(ctx, "student:report");
  if (!Types.ObjectId.isValid(reportId)) throw notFoundError();
  await connectDB();
  const report = await ProgressReport.findOne({
    _id: reportId,
    orgId: ctx.orgId,
  }).lean();
  if (!report) throw notFoundError();
  const student = await Student.findOne({
    _id: report.studentId,
    orgId: ctx.orgId,
  }).select("_id branchId");
  if (!student || !inScope(ctx, student.branchId)) throw notFoundError();
  return report;
}

export async function getLatestReportKeys(
  ctx: MemberCtx,
  studentIds: Types.ObjectId[] | string[],
): Promise<Map<string, string>> {
  if (studentIds.length === 0) return new Map();
  await connectDB();
  const rows = await ProgressReport.aggregate<{
    _id: Types.ObjectId;
    reportDateKey: string;
  }>([
    { $match: { orgId: ctx.orgId, studentId: { $in: studentIds } } },
    { $sort: { reportDateKey: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$studentId",
        reportDateKey: { $first: "$reportDateKey" },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.reportDateKey]));
}

export interface ReportListQuery {
  page?: number;
  pageSize?: number;
}

export async function listReports(
  ctx: MemberCtx,
  studentId: string,
  query: ReportListQuery = {},
) {
  requirePerm(ctx, "student:report");
  const student = await requireActiveStudent(ctx, studentId);
  const { page = 1, pageSize = 20 } = query;
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 100);
  // استعلام واحد مرتب من الأقدم، والحساب في الذاكرة، ثم العرض من الأحدث.
  const all = await ProgressReport.find({
    studentId: student._id,
    orgId: ctx.orgId,
  })
    .sort({ reportDateKey: 1, createdAt: 1 })
    .lean();
  const start = student.hifzStart
    ? { surah: student.hifzStart.surah, ayah: student.hifzStart.ayah }
    : null;
  const enriched = all.map((r, i) => {
    const prev =
      i === 0
        ? start
        : {
            surah: all[i - 1]!.hifzPosition.surah,
            ayah: all[i - 1]!.hifzPosition.ayah,
          };
    const current = { surah: r.hifzPosition.surah, ayah: r.hifzPosition.ayah };
    return {
      id: String(r._id),
      reportDateKey: r.reportDateKey,
      hifzPosition: current,
      revisionPosition: r.revisionPosition
        ? { surah: r.revisionPosition.surah, ayah: r.revisionPosition.ayah }
        : null,
      tajweedRating: r.tajweedRating,
      trend: r.trend,
      notes: r.notes,
      createdAt: r.createdAt,
      previous: prev,
      ayahs: prev ? ayahsBetween(prev, current) : null,
      isFirst: i === 0,
    };
  });
  const total = enriched.length;
  const items = enriched
    .reverse()
    .slice((safePage - 1) * safeSize, safePage * safeSize);
  return { items, total, page: safePage, pageSize: safeSize };
}

export async function createReport(
  ctx: MemberCtx,
  studentId: string,
  input: CreateReportInput,
) {
  requirePerm(ctx, "report:create");
  const student = await requireActiveStudent(ctx, studentId);
  if (student.status !== "active") {
    throw validationError("لا تقارير لطالب مؤرشف — استرجعه أولًا");
  }
  checkPosition(input.hifzPosition);
  if (input.revisionPosition) checkPosition(input.revisionPosition);
  const report = await ProgressReport.create({
    orgId: ctx.orgId,
    branchId: student.branchId,
    studentId: student._id,
    reportDateKey: todayKeyCairo(),
    hifzPosition: { ...input.hifzPosition },
    revisionPosition: input.revisionPosition
      ? { ...input.revisionPosition }
      : null,
    tajweedRating: input.tajweedRating,
    trend: input.trend,
    notes: input.notes || null,
    createdByUserId: new Types.ObjectId(ctx.userId),
  });
  await syncStudentPosition(student._id);
  return { id: String(report._id) };
}

export async function updateReport(
  ctx: MemberCtx,
  reportId: string,
  input: UpdateReportInput,
) {
  requirePerm(ctx, "report:edit");
  if (!Types.ObjectId.isValid(reportId)) throw notFoundError();
  await connectDB();
  const report = await ProgressReport.findOne({
    _id: reportId,
    orgId: ctx.orgId,
  });
  if (!report) throw notFoundError();
  const student = await Student.findOne({
    _id: report.studentId,
    orgId: ctx.orgId,
  });
  if (!student || !inScope(ctx, student.branchId)) throw notFoundError();
  checkPosition(input.hifzPosition);
  if (input.revisionPosition) checkPosition(input.revisionPosition);
  report.hifzPosition = { ...input.hifzPosition };
  report.revisionPosition = input.revisionPosition
    ? { ...input.revisionPosition }
    : null;
  report.tajweedRating = input.tajweedRating;
  report.trend = input.trend;
  report.notes = input.notes || null;
  await report.save();
  await syncStudentPosition(student._id);
  return { id: String(report._id) };
}

export async function deleteReport(ctx: MemberCtx, reportId: string) {
  requirePerm(ctx, "report:delete");
  if (!Types.ObjectId.isValid(reportId)) throw notFoundError();
  await connectDB();
  const report = await ProgressReport.findOne({
    _id: reportId,
    orgId: ctx.orgId,
  });
  if (!report) throw notFoundError();
  const student = await Student.findOne({
    _id: report.studentId,
    orgId: ctx.orgId,
  });
  if (!student || !inScope(ctx, student.branchId)) throw notFoundError();
  await ProgressReport.deleteOne({ _id: report._id });
  await syncStudentPosition(student._id);
}
