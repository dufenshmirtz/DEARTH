"""Font files for the languages Razor Keen and Alegreya don't cover (see src/game/00-i18n.js).

  python scripts/subset-fonts.py

Needs Python 3 with:  pip install fonttools brotli
Downloads the source fonts (Google Fonts, SIL Open Font License) into i18n-work/font-sources/ (git-ignored) the first
time, and writes the small web fonts the game loads into fonts/i18n/:
  mansalva-greek.woff2      Greek in the display face (the Razor Keen labels)
  longcang-zh.woff2         Simplified Chinese in the display face
  notoserifsc-zh.woff2      Simplified Chinese in the book face (the Alegreya text)
  zh-chars.txt              the Chinese characters inside them (test-i18n checks the translation needs no others)
The Greek book face is Alegreya's own Greek (alegreya-greek-*.woff2, from @fontsource/alegreya).
Run it again after the Chinese text changes: the Chinese fonts hold only the characters the game uses.
"""
import os
import re
import sys
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "i18n-work", "font-sources")  # outside fonts/: the builds copy all of fonts/
OUT = os.path.join(ROOT, "fonts", "i18n")
GOOGLE = "https://raw.githubusercontent.com/google/fonts/main/ofl/"
SOURCES = {
    "Mansalva-Regular.ttf": GOOGLE + "mansalva/Mansalva-Regular.ttf",
    "LongCang-Regular.ttf": GOOGLE + "longcang/LongCang-Regular.ttf",
    "NotoSerifSC-wght.ttf": GOOGLE + "notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
}
GREEK = [*range(0x0370, 0x0400), *range(0x1F00, 0x2000)]
# CJK punctuation, the unified ideographs and the full-width forms (the unicode-range in styles.css)
CJK_RANGES = [(0x3000, 0x303F), (0x4E00, 0x9FFF), (0xFF00, 0xFFEF)]
ZH_FILES = ["src/game/locales/zh-Hans.js", "src/game/00-i18n.js", "src/game/09-satan-pact.js"]


def source(name):
    path = os.path.join(SOURCE, name)
    if not os.path.exists(path):
        os.makedirs(SOURCE, exist_ok=True)
        print("downloading", name)
        urllib.request.urlretrieve(SOURCES[name], path)
    return path


def write_subset(font, codepoints, out_name):
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    path = os.path.join(OUT, out_name)
    font.flavor = "woff2"
    font.save(path)
    print(f"{out_name}: {len(codepoints)} characters, {os.path.getsize(path) // 1024} KB")


def chinese_characters():
    chars = set()
    for rel in ZH_FILES:
        with open(os.path.join(ROOT, rel), encoding="utf8") as handle:
            text = handle.read()
        chars.update(ch for ch in text if any(lo <= ord(ch) <= hi for lo, hi in CJK_RANGES))
    return sorted(chars)


def main():
    os.makedirs(OUT, exist_ok=True)
    write_subset(TTFont(source("Mansalva-Regular.ttf")), GREEK, "mansalva-greek.woff2")
    chars = chinese_characters()
    codepoints = [ord(ch) for ch in chars]
    write_subset(TTFont(source("LongCang-Regular.ttf")), codepoints, "longcang-zh.woff2")
    from fontTools.varLib import instancer
    noto = instancer.instantiateVariableFont(TTFont(source("NotoSerifSC-wght.ttf")), {"wght": 400})
    write_subset(noto, codepoints, "notoserifsc-zh.woff2")
    missing = [ch for ch in chars if ord(ch) not in TTFont(os.path.join(OUT, "longcang-zh.woff2")).getBestCmap()]
    if missing:
        print("Long Cang has no glyph for:", "".join(missing), "(the book face shows them)")
    with open(os.path.join(OUT, "zh-chars.txt"), "w", encoding="utf8") as handle:
        handle.write("".join(chars) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
