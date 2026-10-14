// اختبار محلل اللصق: أسطر وtabs وخلايا فارغة.
import { describe, expect, it } from "vitest";
import { parseTSV } from "../src/lib/tsv";

describe("parseTSV", () => {
  it("splits rows and tabs", () => {
    expect(parseTSV("أحمد\tذكر\nمنى\tأنثى")).toEqual([
      ["أحمد", "ذكر"],
      ["منى", "أنثى"],
    ]);
  });
  it("handles CRLF, trailing newline, and single column", () => {
    expect(parseTSV("أحمد\r\nمنى\r\n")).toEqual([["أحمد"], ["منى"]]);
  });
  it("trims cells but keeps empty ones", () => {
    expect(parseTSV("أحمد\t \tمبتدئ")).toEqual([["أحمد", "", "مبتدئ"]]);
  });
});
