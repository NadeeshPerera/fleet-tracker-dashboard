import type { Job } from "./types";

/** Singapore GST rate (9% from 1 Jan 2024). */
export const GST_RATE = 0.09;

export interface InvoiceTotals {
  subtotal: number;
  gst: number;
  total: number;
}

/** Money is calculated in integer cents to avoid floating-point drift. */
export function calculateInvoice(job: Pick<Job, "tonnes" | "pricePerTonne">): InvoiceTotals {
  const subtotalCents = Math.round(job.tonnes * job.pricePerTonne * 100);
  const gstCents = Math.round(subtotalCents * GST_RATE);
  return {
    subtotal: subtotalCents / 100,
    gst: gstCents / 100,
    total: (subtotalCents + gstCents) / 100,
  };
}
