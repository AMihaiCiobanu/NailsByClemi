# Christmas theme — how to remove

Everything lives in `christmas.css`, `christmas.js` and three marked blocks in `index.html`
(search `CHRISTMAS:start` … `CHRISTMAS:end`). Nothing else in the site depends on it.

Season: 6 Nov – 29 Dec 2026 (head script in `index.html`); outside it the files load but do nothing.

- Winter palette: icy blue (light) and midnight blue (dark), Christmas red accent; browser bar colour follows it.
- Tinsel garland along the top of the hero, Christmas tree with twinkling lights beside the hero photo.
- Red bow in the bottom-right corner of every service card.
- Big snowflakes fall over the page (hidden with reduced motion).
- Snowman with red nails bottom-left: every 6–11 s he lifts his hand to look at his nails; a tap makes him talk.

Preview any time: `/?christmas=1`. Force off: `/?christmas=0`. To delete it completely:

```bash
cd /Users/mihai/Sites/NailsByClemi
rm christmas.css christmas.js CHRISTMAS.md
python3 - <<'PY'
import re
s = open('index.html').read()
s = re.sub(r'[ \t]*// CHRISTMAS:start.*?// CHRISTMAS:end\n', '', s, flags=re.S)
s = re.sub(r'[ \t]*<!-- CHRISTMAS:start -->.*?<!-- CHRISTMAS:end -->\n', '', s, flags=re.S)
open('index.html', 'w').write(s)
PY
git diff --stat
```
