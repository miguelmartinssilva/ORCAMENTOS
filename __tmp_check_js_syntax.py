import pathlib
import esprima

for fn in ['app.js', 'perfis.js']:
    text = pathlib.Path(fn).read_text(encoding='utf-8')
    try:
        esprima.parseScript(text)
        print(fn + ': OK')
    except Exception as e:
        print(fn + ': ERROR')
        print(e)
