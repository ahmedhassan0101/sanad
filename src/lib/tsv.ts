// تحليل النص الملصوق كـ TSV (Excel/Sheets/واتساب): أسطر وtabs.
export function parseTSV(text: string): string[][] {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => line.split("\t").map((c) => c.trim()));
}
