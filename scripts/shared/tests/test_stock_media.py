"""Licence classification and record parsing for stock-media.py; no network."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1]/'stock-media.py'
spec = importlib.util.spec_from_file_location('stock_media', SCRIPT)
stock = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stock)


class LicenceTests(unittest.TestCase):
    def test_classifies_common_licences(self):
        cases = {
            'CC0': 'public-domain',
            'http://creativecommons.org/publicdomain/zero/1.0/': 'public-domain',
            'Public domain': 'public-domain',
            'PD-US': 'public-domain',
            'CC BY 4.0': 'attribution',
            'CC BY-SA 4.0': 'share-alike',
            'https://creativecommons.org/licenses/by-sa/2.0': 'share-alike',
            'CC BY-NC 2.0': 'restricted',
            'https://creativecommons.org/licenses/by-nd/4.0/': 'restricted',
            'https://creativecommons.org/licenses/by-nc-sa/3.0/': 'restricted',
            stock.NASA_LICENSE: 'public-domain',
            '': 'unknown',
            'All rights reserved': 'unknown',
        }
        for text, expected in cases.items():
            self.assertEqual(stock.license_status(text), expected, text)


class ParsingTests(unittest.TestCase):
    def test_wikimedia_record_strips_artist_html(self):
        page = {'pageid': 7, 'title': 'File:Stone bridge.jpg', 'imageinfo': [{
            'mime': 'image/jpeg', 'width': 4000, 'height': 3000, 'size': 123,
            'url': 'https://upload.example/Stone_bridge.jpg', 'descriptionurl': 'https://commons.example/Stone',
            'extmetadata': {'Artist': {'value': '<a href="x">Ana &amp; Bo</a>'},
                            'LicenseShortName': {'value': 'CC BY-SA 4.0'},
                            'LicenseUrl': {'value': 'https://creativecommons.org/licenses/by-sa/4.0'}}}]}
        record = stock.wikimedia_record(page)
        self.assertEqual(record['id'], 'wikimedia:7')
        self.assertEqual(record['title'], 'Stone bridge.jpg')
        self.assertEqual(record['creator'], 'Ana & Bo')
        self.assertEqual(record['licenseStatus'], 'share-alike')

    def test_nasa_prefers_largest_matching_rendition(self):
        urls = ['https://a/X~thumb.jpg', 'https://a/X~medium.jpg', 'https://a/X~orig.jpg', 'https://a/X~orig.mp4', 'https://a/X~small.mp4']
        self.assertEqual(stock.pick_nasa_file(urls, 'image'), 'https://a/X~orig.jpg')
        self.assertEqual(stock.pick_nasa_file(urls, 'video'), 'https://a/X~orig.mp4')

    def test_archive_picks_preferred_format_under_size_cap(self):
        files = [{'name': 'master.mp4', 'format': 'h.264', 'size': '900000000'},
                 {'name': 'small.mp4', 'format': '512Kb MPEG4', 'size': '20000000'},
                 {'name': 'thumb.jpg', 'format': 'Thumbnail', 'size': '1000'}]
        self.assertEqual(stock.pick_archive_file(files, 'video', 150_000_000)['name'], 'small.mp4')
        self.assertIsNone(stock.pick_archive_file(files, 'image', 150_000_000))

    def test_archive_licence_falls_back_to_collection(self):
        self.assertIn('Public Domain', stock.archive_license('', ['prelinger']))
        self.assertEqual(stock.archive_license('', ['opensource_movies']), '')

    def test_bad_id_is_rejected(self):
        with self.assertRaises(ValueError):
            stock.resolve('pexels:1', 1)


class FetchTests(unittest.TestCase):
    def test_restricted_licence_is_refused_without_download(self):
        record = stock.item('archive', 'x', 'video', 'X', license='https://creativecommons.org/licenses/by-nc/4.0/',
                            licenseUrl='https://creativecommons.org/licenses/by-nc/4.0/', downloadUrl='https://a/x.mp4')
        with patch.object(stock, 'resolve', return_value=record), patch.object(stock, 'download') as download:
            self.assertEqual(stock.main(['fetch', 'archive:x']), 2)
        download.assert_not_called()

    def test_fetch_records_credit_for_project(self):
        record = stock.item('wikimedia', '9', 'image', 'Bridge.jpg', creator='Ana', license='CC0',
                            downloadUrl='https://upload.example/Bridge.jpg', pageUrl='https://commons.example/Bridge')
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root/'docs/projects/demo').mkdir(parents=True)

            def fake_download(url, target):
                target.write_bytes(b'jpg')
                return 'abc'
            with patch.object(stock, 'ROOT', root), patch.object(stock, 'LIBRARY', root/'library/stock'), \
                    patch.object(stock, 'resolve', return_value=record), patch.object(stock, 'download', side_effect=fake_download):
                self.assertEqual(stock.main(['fetch', 'wikimedia:9', '--project', 'demo']), 0)
                self.assertEqual(stock.main(['fetch', 'wikimedia:9', '--project', 'demo']), 0)
            self.assertTrue((root/'public/demo/stock/Bridge.jpg').exists())
            credits = json.loads((root/'docs/projects/demo/stock-credits.json').read_text())
            self.assertEqual(len(credits['items']), 1)
            self.assertEqual(credits['items'][0]['credit'], 'Bridge.jpg — Ana — CC0 — https://commons.example/Bridge')
            self.assertEqual(credits['items'][0]['file'], 'public/demo/stock/Bridge.jpg')


if __name__ == '__main__':
    unittest.main()
