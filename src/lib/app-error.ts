// خطأ تطبيق موحد: رمز إنجليزي ثابت (code) + رسالة عربية للعرض (message).
// لا يُمرَّن رمز الخطأ إلى الواجهة؛ تُعرض الرسالة العربية فقط.
// الأخطاء غير المتوقعة تُسجَّل على السيرفر ويُعرض رسالة عامة للعرض.
export class AppError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AppError";
  }
}

export function validationError(message: string) {
  return new AppError("VALIDATION", message);
}

export function forbiddenError(message: string) {
  return new AppError("FORBIDDEN", message);
}

export function notFoundError(message = "العنصر غير موجود") {
  return new AppError("NOT_FOUND", message);
}

// استخراج رسالة عربية آمنة للعرض من أي خطأ تم رميه.
// الأخطاء غير المتوقعة (غير AppError) تُرجع رسالة عامة ولا تُكشف تفاصيلها للواجهة.
export function errorMessage(e: unknown): string {
  if (e instanceof AppError) return e.message;
  console.error("خطأ غير متوقع:", e);
  return "حدث خطأ غير متوقع، حاول مرة أخرى";
}
