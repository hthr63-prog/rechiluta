"""מעדכן את ה-hash של הסקריפטים הפנימיים ב-Content-Security-Policy של index.html.
להריץ אחרי כל שינוי בקוד שבתוך <script> ב-index.html:  python3 tools/pin_csp.py
בלי זה הדפדפן יחסום את הקוד והאתר לא יעבוד."""
import re, hashlib, base64, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'index.html'
html = p.read_text(encoding='utf-8')
inline = re.findall(r'<script>(.*?)</script>', html, flags=re.S)
hashes = ' '.join("'sha256-%s'" % base64.b64encode(hashlib.sha256(x.encode()).digest()).decode() for x in inline)
new, n = re.subn(r"script-src 'self'(?: 'sha256-[A-Za-z0-9+/=]+')*;", f"script-src 'self' {hashes};", html, count=1)
assert n == 1, 'CSP script-src not found'
if new != html:
    p.write_text(new, encoding='utf-8'); print('CSP updated,', len(inline), 'inline scripts pinned')
else:
    print('CSP already up to date,', len(inline), 'inline scripts')
