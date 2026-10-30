"""Catalog helpers/HTML guards: no synthesis or network."""
import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest

SHARED=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(SHARED))
spec=importlib.util.spec_from_file_location('catalog_helpers',SHARED/'voice-catalog.py')
catalog=importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalog)


class CatalogTests(unittest.TestCase):
    def test_names_have_safe_distinct_file_slugs(self):
        self.assertEqual(catalog.slug('Hải Đăng'),'hai-dang')
        self.assertEqual(catalog.slug('Thiền Tâm Đức'),'thien-tam-duc')
        self.assertNotEqual(catalog.slug('Adam'),catalog.slug('Adam bựa'))
        self.assertEqual(catalog.slug('../../Trúc Ly'),'truc-ly')

    def test_html_embeds_manifest_safely_and_works_from_local_file(self):
        with tempfile.TemporaryDirectory() as folder:
            out=Path(folder)
            catalog.publish(out,{'text':'</script><b>test','voices':[]})
            page=(out/'index.html').read_text()
            self.assertNotIn('__CATALOG_DATA__',page)
            self.assertNotIn('</script><b>test',page)
            self.assertIn('\\u003c/script>',page)
            self.assertIn('id="play-all"',page)
            self.assertIn('id="stop"',page)
            self.assertIn('<option>Nam</option>',page)
            self.assertIn("location.protocol!=='file:'",page)


if __name__=='__main__':unittest.main()
