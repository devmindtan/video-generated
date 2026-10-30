"""Real local PDFs: bounded Vietnamese retrieval, immutable cache and source traceability."""
from contextlib import redirect_stdout
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

import pymupdf

SCRIPT = Path(__file__).resolve().parents[1]/'book-pdf.py'
spec = importlib.util.spec_from_file_location('book_pdf', SCRIPT)
pdf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pdf)


class BookPdfTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix='book-pdf-test-')
        cls.folder = Path(cls.tmp.name)
        pdf.LIBRARY = cls.folder/'library'
        cls.source = cls.folder/'book.pdf'
        font = SCRIPT.parents[2]/'public/stoic/fonts/NotoSans-Regular.ttf'
        with pymupdf.open() as doc:
            for n in range(300):
                page = doc.new_page()
                if n != 299:
                    text = f'Trang kiểm thử {n+1}. Nội dung dùng riêng để kiểm tra công cụ PDF.'
                    if n == 122:
                        text += '\nLắng nghe để hiểu, đừng vội phán xét. Tức giận không phải chỉ dẫn.'
                    page.insert_text((50, 70), text, fontname='noto', fontfile=str(font), fontsize=10)
            doc.set_toc([[1, 'Mở đầu', 1], [1, 'Lắng nghe', 123]])
            doc.set_page_labels([{'startpage': 0, 'prefix': 'test-', 'style': 'D', 'firstpagenum': 1}])
            doc.save(cls.source, garbage=4, deflate=True)
        cls.call('ingest', source=cls.source, book='test-book')

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    @staticmethod
    def call(name, **kwargs):
        from argparse import Namespace
        capture = io.StringIO()
        with redirect_stdout(capture):
            getattr(pdf, name)(Namespace(**kwargs))
        return json.loads(capture.getvalue())

    def test_300_pages_inspect_is_bounded_and_toc_preserved(self):
        result = self.call('inspect', source=self.source)
        self.assertEqual(result['pages'], 300)
        self.assertLessEqual(len(result['samples']), 5)
        self.assertLess(len(json.dumps(result)), 6000)
        result = self.call('toc', book='test-book', limit=1)
        self.assertTrue(result['truncated'])
        self.assertEqual(result['total'], 2)
        self.assertEqual(self.call('inventory', book='test-book', verify=True)['pagesNeedingReview'], 1)

    def test_cache_hit_does_not_extract_again(self):
        edition = pdf.current('test-book')
        timestamp = (edition/'pages/00123.txt').stat().st_mtime_ns
        prior = pdf.open_pdf
        try:
            pdf.open_pdf = lambda _: self.fail('Cache hit must not reopen/extract the PDF')
            self.assertTrue(self.call('ingest', source=self.source, book='test-book')['cacheHit'])
        finally:
            pdf.open_pdf = prior
        self.assertEqual((edition/'pages/00123.txt').stat().st_mtime_ns, timestamp)

    def test_vietnamese_search_and_bounded_read_keep_provenance(self):
        result = self.call('search', book='test-book', query='lang nghe', limit=5)
        self.assertEqual(len(result['hits']), 1)
        self.assertEqual(result['hits'][0]['pdfPage'], 123)
        self.assertIn('Lắng nghe', result['hits'][0]['snippet'])
        self.assertEqual(result['hits'][0]['pdfPageLabel'], 'test-123')
        result = self.call('read_pages', book='test-book', pages='122-124', max_chars=90)
        self.assertTrue(result['budgetExhausted'])
        self.assertLessEqual(sum(len(p['text']) for p in result['pages']), 90)
        self.assertEqual(result['sourceSha256'], pdf.sha(self.source))

    def test_limits_and_original_preservation(self):
        for pages in ['0', '1-11', '299-301', '3-1']:
            with self.assertRaises(ValueError):
                pdf.page_numbers(pages, 300)
        with self.assertRaises(ValueError):
            pdf.slug('../../public')
        digest = pdf.sha(self.source)
        with self.assertRaises(ValueError):
            self.call('ocr_plan', source=self.source, output=self.source, pages=None)
        plan = self.call('ocr_plan', source=self.source, output=self.folder/'new-ocr.pdf', pages='1-3')
        self.assertFalse(plan['executed'])
        self.assertIn('--jobs 2', plan['command'])
        self.assertEqual(pdf.sha(self.source), digest)

    def test_cache_corruption_fails_without_overwrite(self):
        self.call('ingest', source=self.source, book='corrupt-book')
        edition = pdf.current('corrupt-book')
        page = edition/'pages/00123.txt'
        page.write_text('tampered', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Cache mismatch'):
            self.call('ingest', source=self.source, book='corrupt-book')
        with self.assertRaisesRegex(ValueError, 'Cache mismatch'):
            self.call('read_pages', book='corrupt-book', pages='123', max_chars=100)
        self.assertEqual(page.read_text(), 'tampered')

    def test_changed_source_creates_new_edition(self):
        source = self.folder/'changed.pdf'
        with pymupdf.open(self.source) as doc:
            doc.new_page().insert_text((50, 70), 'A new page')
            doc.save(source)
        self.call('ingest', source=self.source, book='changed-book')
        previous = pdf.current('changed-book')
        result = self.call('ingest', source=source, book='changed-book')
        self.assertFalse(result['cacheHit'])
        self.assertNotEqual(previous, pdf.current('changed-book'))
        self.assertEqual(pdf.verify(previous)['sourceSha256'], pdf.sha(self.source))
        self.assertEqual(result['pages'], 301)


if __name__ == '__main__':
    unittest.main()
