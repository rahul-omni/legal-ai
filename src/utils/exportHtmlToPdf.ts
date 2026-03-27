import html2pdf from "html2pdf.js";

/**
 * Renders HTML in a temporary in-viewport layer and triggers a client-side PDF download.
 * html2canvas often captures nothing for elements positioned far off-screen (e.g. left: -10000px).
 */
export async function exportHtmlToPdf(
  innerHtml: string,
  basename: string
): Promise<void> {
  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483646",
    "background:rgba(0,0,0,0.35)",
    "display:flex",
    "align-items:flex-start",
    "justify-content:center",
    "padding:24px",
    "overflow:auto",
    "box-sizing:border-box",
  ].join(";");

  const wrapper = document.createElement("div");
  wrapper.style.cssText = [
    "box-sizing:border-box",
    "width:794px",
    "max-width:100%",
    "padding:32px",
    "background:#fff",
    "color:#111",
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
    "line-height:1.6",
    "font-size:14px",
    "box-shadow:0 4px 24px rgba(0,0,0,0.15)",
  ].join(";");
  wrapper.innerHTML = innerHtml;

  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);

  const base = basename.replace(/\.pdf$/i, "").trim() || "document";
  const filename = `${base}.pdf`;

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    await html2pdf()
      .set({
        margin: [12, 12, 12, 12],
        filename,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(wrapper)
      .save();
  } finally {
    document.body.removeChild(overlay);
  }
}
