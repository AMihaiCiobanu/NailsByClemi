# Halloween theme — how to remove

Everything lives in `halloween.css`, `halloween.js` and three marked blocks in `index.html`
(search `HALLOWEEN:start` … `HALLOWEEN:end`). Nothing else in the site depends on it.

It switches itself off after 2 Nov (inert, no visual change). To delete it completely:

```bash
cd /Users/mihai/Sites/NailsByClemi
rm halloween.css halloween.js HALLOWEEN.md
python3 - <<'PY'
import re
s = open('index.html').read()
s = re.sub(r'[ \t]*// HALLOWEEN:start.*?// HALLOWEEN:end\n', '', s, flags=re.S)
s = re.sub(r'[ \t]*<!-- HALLOWEEN:start -->.*?<!-- HALLOWEEN:end -->\n', '', s, flags=re.S)
open('index.html', 'w').write(s)
PY
git diff --stat
```

Preview any time: `/?halloween=1`. Force off: `/?halloween=0`. Season dates: head script in `index.html`.
