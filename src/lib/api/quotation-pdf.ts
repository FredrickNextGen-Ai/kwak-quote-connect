/**
 * Quotation PDF service abstraction.
 *
 * PDF documents are produced by the separate Python (FastAPI + ReportLab)
 * backend. This module is the only place the frontend knows about that API,
 * so wiring the real backend later means setting VITE_PDF_API_BASE_URL only.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const PDF_API_BASE_URL = env["VITE_PDF_API_BASE_URL"] ?? "";

export class PdfServiceNotConfiguredError extends Error {
  constructor() {
    super(
      "The quotation PDF service is not connected yet. Set VITE_PDF_API_BASE_URL to your FastAPI backend.",
    );
    this.name = "PdfServiceNotConfiguredError";
  }
}

/** POST /api/quotations/:id/pdf -> application/pdf */
export async function generateQuotationPdf(quotationId: string, accessToken?: string) {
  if (!PDF_API_BASE_URL) throw new PdfServiceNotConfiguredError();

  const response = await fetch(`${PDF_API_BASE_URL}/api/quotations/${quotationId}/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`PDF service responded with ${response.status}`);
  }

  return response.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
