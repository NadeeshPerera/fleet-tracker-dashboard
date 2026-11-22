"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { toastAdded } from "@/store/slices";

export function InvoiceButton({ job }: { job: Job }) {
  const dispatch = useAppDispatch();
  const truck = useAppSelector((s) => (job.truckId ? s.trucks.entities[job.truckId] : undefined));
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      // Lazy-load pdf-lib only when needed.
      const { buildInvoicePdf, downloadBytes } = await import("@/lib/invoicePdf");
      const bytes = await buildInvoicePdf(job, truck);
      downloadBytes(bytes, `invoice-${job.id}.pdf`);
    } catch {
      dispatch(toastAdded(`Could not generate the invoice for ${job.id}`, "error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      aria-label={`Download invoice for ${job.id}`}
      className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
    >
      <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M10 3a1 1 0 0 1 1 1v7.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42L9 11.6V4a1 1 0 0 1 1-1ZM4 15a1 1 0 0 1 1 1h10a1 1 0 1 1 0 2H5a2 2 0 0 1-2-2 1 1 0 0 1 1-1Z" />
      </svg>
      {busy ? "Generating…" : "Invoice PDF"}
    </button>
  );
}
