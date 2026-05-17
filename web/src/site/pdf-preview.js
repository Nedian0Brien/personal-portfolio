const PAPER_PDF_PATH =
  "/pdf/" +
  encodeURIComponent("Predicting Drug–Side Effect Relationships From Parametric Knowledge Embedded in Biomedical BERT Models.pdf");

const PDF_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

export function initPaperCoverPreview({
  canvasSelector = ".pdf-page",
  pdfPath = PAPER_PDF_PATH,
  workerSrc = PDF_WORKER_SRC,
} = {}) {
  async function renderPaperCover() {
    const canvases = Array.from(document.querySelectorAll(canvasSelector));
    if (!canvases.length) return;

    const container = canvases[0].parentElement;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    if (!width || !height) return;

    const pdfjs = window.pdfjsLib;
    if (!pdfjs) return;

    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    try {
      const pdf = await pdfjs.getDocument(pdfPath).promise;

      await Promise.all(
        canvases.map(async (canvas) => {
          const pageNum = parseInt(canvas.dataset.pdfPage, 10) || 1;
          if (pageNum > pdf.numPages) return;

          const page = await pdf.getPage(pageNum);
          const base = page.getViewport({ scale: 1 });
          const scale = Math.max(width / base.width, height / base.height);
          const viewport = page.getViewport({ scale });

          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          canvas.style.top = "0px";
          canvas.style.left = `${Math.round((width - viewport.width) / 2)}px`;

          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
          canvas.classList.add("ready");
        }),
      );
    } catch (error) {
      console.warn("PDF preview unavailable:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderPaperCover);
  } else {
    renderPaperCover();
  }
}
