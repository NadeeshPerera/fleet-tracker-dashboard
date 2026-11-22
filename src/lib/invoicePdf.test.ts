import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { makeJob, makeTruck } from "@/test/fixtures";
import { buildInvoicePdf } from "./invoicePdf";

describe("buildInvoicePdf", () => {
  it("produces a valid one-page A4 PDF titled with the job id", async () => {
    const bytes = await buildInvoicePdf(makeJob({ status: "delivered", deliveredAt: Date.UTC(2026, 0, 5) }), makeTruck());
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getPage(0).getSize()).toEqual({ width: 595, height: 842 });
    expect(doc.getTitle()).toBe("Invoice JOB-1001");
  });
});
