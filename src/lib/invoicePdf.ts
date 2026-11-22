/**
 * Invoice PDF generation. This module (and pdf-lib, ~400 KB) is loaded with a
 * dynamic import() only when the user clicks "Invoice", keeping it out of the main bundle.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatSGD } from "./format";
import { GST_RATE, calculateInvoice } from "./invoiceMath";
import type { Job, Truck } from "./types";

export async function buildInvoicePdf(job: Job, truck: Truck | undefined): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invoice ${job.id}`);
  const page = pdf.addPage([595, 842]); // A4 in points
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.06, 0.09, 0.16);
  const muted = rgb(0.4, 0.45, 0.52);
  const accent = rgb(0.15, 0.39, 0.92);

  let y = 780;
  const text = (value: string, x: number, size = 10, f = font, color = ink) =>
    page.drawText(value, { x, y, size, font: f, color });
  const right = (value: string, xRight: number, size = 10, f = font) =>
    page.drawText(value, { x: xRight - f.widthOfTextAtSize(value, size), y, size, font: f, color: ink });

  text("Lion City Haulage (Demo)", 50, 18, bold, accent);
  right("TAX INVOICE", 545, 18, bold);
  y -= 18;
  text("Portfolio demo — not a real company or invoice", 50, 9, font, muted);
  y -= 40;

  const deliveredAt = job.deliveredAt ? new Date(job.deliveredAt) : new Date();
  const rows: [string, string][] = [
    ["Invoice no.", `INV-${job.id.replace("JOB-", "")}`],
    ["Date", deliveredAt.toLocaleDateString("en-SG")],
    ["Bill to", job.customer],
    ["Delivered to", job.dropoff.name],
    ["Collected from", job.pickup.name],
    ["Vehicle", truck ? `${truck.plate} (${truck.driver})` : "—"],
  ];
  for (const [label, value] of rows) {
    text(label, 50, 10, font, muted);
    text(value, 160, 10, bold);
    y -= 18;
  }

  y -= 20;
  page.drawRectangle({ x: 50, y: y - 6, width: 495, height: 22, color: rgb(0.94, 0.96, 0.98) });
  text("Description", 58, 10, bold);
  right("Qty (t)", 360, 10, bold);
  right("Rate", 450, 10, bold);
  right("Amount", 537, 10, bold);
  y -= 28;

  const totals = calculateInvoice(job);
  text(`${job.material} — ${job.id}`, 58);
  right(String(job.tonnes), 360);
  right(formatSGD(job.pricePerTonne), 450);
  right(formatSGD(totals.subtotal), 537);
  y -= 30;

  page.drawLine({ start: { x: 330, y: y + 12 }, end: { x: 545, y: y + 12 }, thickness: 0.5, color: muted });
  const summary: [string, string, boolean][] = [
    ["Subtotal", formatSGD(totals.subtotal), false],
    [`GST (${GST_RATE * 100}%)`, formatSGD(totals.gst), false],
    ["Total (SGD)", formatSGD(totals.total), true],
  ];
  for (const [label, value, strong] of summary) {
    text(label, 340, strong ? 12 : 10, strong ? bold : font);
    right(value, 537, strong ? 12 : 10, strong ? bold : font);
    y -= 20;
  }

  y = 60;
  text("Generated in the browser with pdf-lib · github.com/NadeeshPerera/fleet-tracker-dashboard", 50, 8, font, muted);

  return pdf.save();
}

export function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
