import { describe, expect, it } from "vitest";
import {
  buildPdfContentDisposition,
  sanitizeFilenamePart,
} from "@/lib/pdf/content-disposition";

describe("sanitizeFilenamePart", () => {
  it("replaces unsafe characters and collapses whitespace", () => {
    expect(sanitizeFilenamePart("  Ahmed / Ben Ali  ")).toBe("Ahmed-Ben-Ali");
  });

  it("falls back when the value is empty after sanitization", () => {
    expect(sanitizeFilenamePart("///")).toBe("client");
  });
});

describe("buildPdfContentDisposition", () => {
  it("includes ascii fallback and utf-8 filename", () => {
    const header = buildPdfContentDisposition("loan-statement", "Ahmed Ben Ali");

    expect(header).toContain('filename="loan-statement-Ahmed-Ben-Ali.pdf"');
    expect(header).toContain("filename*=UTF-8''loan-statement-Ahmed-Ben-Ali.pdf");
  });

  it("encodes unicode client names", () => {
    const header = buildPdfContentDisposition("releve-pret", "محمد");

    expect(header).toContain("filename*=UTF-8''");
    expect(header).toContain("%");
  });
});
