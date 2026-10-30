# PDF workflow validation — 2026-10-29

- Cloned shallow upstream PyMuPDF and OCRmyPDF; exact revisions in repos-manifest.json. Reference-only, no editable installation.
- Runtime: isolated .venv-pdf, PyMuPDF 1.26.7 core; no layout/ONNX/LLM packages required by this pinned runtime. pip check passed.
- `npm run test:pdf`: six tests passed using a locally generated 300-page PDF, including native Vietnamese text, a PDF page label, bookmarks and an intentionally blank page.
- Tested bounded sample inspection, cached ingest without reopening/re-extracting PDF, accent-insensitive retrieval (lắng nghe / lang nghe), original text preservation and provenance, output limits, immutable original/OCR plan, changed-source editions and cache tamper detection without overwrite.
- `doctor`: SQLite FTS5 available, Ghostscript available; OCRmyPDF/Tesseract not installed, Vietnamese OCR not ready. Only cloned source and documented local OCR setup; no actual OCR performed.
- No real book supplied/processed. Vietnamese extraction accuracy, visual reading order, printed-page mapping and OCR quality for the user's edition remain untested.
- No network/API calls in PDF commands; no LLM, embeddings, model downloads or video/audio rendering used for the PDF tests. Network used only for requested clones and package installation.
