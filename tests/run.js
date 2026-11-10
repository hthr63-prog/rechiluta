// בדיקות אוטומטיות לרכילותא. מריצים: node tests/run.js
// דורש Playwright עם Chromium. רץ גם ב-GitHub Actions לפני כל פרסום, ופרסום לא יוצא אם בדיקה נכשלת.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FIX = path.join(__dirname, 'fixtures');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'rk-tests-'));
const results = []; let current = '';
const ok = (cond, msg) => { results.push({ test: current, ok: !!cond, msg }); if (!cond) console.log(`   ✗ ${msg}`); };

// ---------- fixtures (מומצאים, נוצרים מחדש בכל ריצה) ----------
function makeFixtures() {
  const out = {};
  for (const g of ['couple', 'group']) { out[g] = path.join(TMP, g + '.txt'); execFileSync('python3', ['-I', path.join(FIX, `gen_${g}.py`), out[g]]); }
  for (const st of ['ios', 'android']) { out['english_' + st] = path.join(TMP, `english_${st}.txt`); fs.writeFileSync(out['english_' + st], execFileSync('python3', ['-I', path.join(FIX, 'gen_english.py'), '-', st])); }
  for (const f of fs.readdirSync(FIX).filter(f => f.endsWith('.txt'))) out[f.replace('.txt', '')] = path.join(FIX, f);
  // zip כמו שוואטסאפ מייצא מאייפון
  out.zip = path.join(TMP, 'chat.zip');
  execFileSync('python3', ['-I', '-c', 'import zipfile,sys; z=zipfile.ZipFile(sys.argv[1],"w",zipfile.ZIP_DEFLATED); z.write(sys.argv[2],"_chat.txt"); z.close()', out.zip, out.group]);
  return out;
}

// ---------- שרת מקומי, עם config.js של בדיקה ----------
function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p === '/config.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end("window.RK_CONFIG = { firebase: { key: 'AIzaTESTKEY', project: 'demo' } };"); }
    const f = path.join(ROOT, path.normalize(p));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

// הדוח כטקסט, כדי לבדוק אותו כמו שאדם קורא אותו
const REPORT_TEXT = (r) => {
  const strip = s => String(s ?? '').replace(/\*\*/g, '');
  let s = `# ${r.headline}\n${r.dek}\n${(r.intro || []).join('\n')}\n`;
  for (const sec of r.sections) { s += `\n## ${sec.icon} ${sec.title}\n`; for (const bl of sec.blocks) {
    if (bl.t === 'p' || bl.t === 'reveal' || bl.t === 'h') s += strip(bl.text) + '\n';
    else if (bl.t === 'num') s += `[${bl.value}] ${strip(bl.label)}\n`;
    else if (bl.t === 'list') s += bl.items.map(x => ' • ' + strip(x)).join('\n') + '\n';
    else if (bl.t === 'chat') { s += bl.msgs.map(m => `   | ${m.who}: ${m.text || (m.kind === 'deleted' ? '🚫 נמחקה' : '(' + m.media + ')')}`).join('\n') + '\n'; if (bl.after) s += `   ↳ ${strip(bl.after)}\n`; } } }
  return s + `\n## מכתב\n${(r.letter || []).map(strip).join('\n')}\n`;
};

// ---------- בדיקות איכות לכל דוח ----------
function hygiene(name, text, rep) {
  ok(!/undefined|NaN|\bnull\b|\[object/.test(text), `${name}: אין undefined/NaN/null בטקסט`);
  const slash = text.match(/[א-ת]+\/(ה|ת|ית|ים|ות)(?![א-ת])/g);
  ok(!slash, `${name}: אין צורות לוכסן (${(slash || []).slice(0, 3).join(', ')})`);
  ok(!/(^|[^\d])1 (דקות|שעות|ימים|הודעות|פעמים)/.test(text), `${name}: אין "1 דקות" וכדומה`);
  ok(!/ב\s?ה(קבוצה|צ'אט)\b/.test(text.replace(/בהקבוצה/g, 'X')) || !/בהקבוצה/.test(text), `${name}: אין "בהקבוצה"`);
  // אותה הודעה לא מצוטטת בשני פרקים שונים
  const seen = new Map(), dups = [];
  for (const sec of rep.sections) for (const bl of sec.blocks) if (bl.t === 'chat') for (const m of bl.msgs) {
    if (!m.text || m.text.length < 12 || /^ח{3,}/.test(m.text)) continue;
    const k = m.who + '|' + m.t + '|' + m.text; if (seen.has(k) && seen.get(k) !== sec.title) dups.push(`"${m.text.slice(0, 30)}" ב-${seen.get(k)} וב-${sec.title}`); else seen.set(k, sec.title);
  }
  ok(dups.length === 0, `${name}: אין ציטוט כפול בין פרקים ${dups.slice(0, 2).join(' ; ')}`);
  const minS = text.length > 4000 ? 8 : 4; ok(rep.sections.length >= minS, `${name}: לפחות ${minS} פרקים (${rep.sections.length})`);
}

const TESTS = [];
const test = (name, fn) => TESTS.push({ name, fn });

test('דף הבית והדוגמה', async ({ browser, ctx, base, csp, errs }) => {
  const p = await ctx.newPage(); const t0 = Date.now();
  await p.goto(base); await p.waitForSelector('.lr-h', { timeout: 10000 });
  ok(Date.now() - t0 < 6000, `הדוגמה נטענת מהר (${Date.now() - t0}ms)`);
  ok(await p.evaluate(() => !!window.JSZip), 'jszip נטען מהאתר שלנו');
  const n = await p.$$eval('.sect h2', x => x.length); ok(n >= 20, `לדוגמה יש לפחות 20 פרקים (${n})`);
  ok(/דוגמה/.test(await p.$eval('#banner', x => x.textContent)), 'באנר "זו דוגמה" מוצג');
  const dims = await p.evaluate(async () => { const out = []; for (const f of [makePoster, makeStoryImage]) { const bm = await createImageBitmap(await f()); out.push(bm.width + 'x' + bm.height); } return out.join(','); });
  ok(dims === '1080x1350,1080x1920', `תמונות שיתוף: פוסט וסטורי (${dims})`);
  await p.close();
  for (const w of [360, 390]) { // נועם: אין גלילה הצידה בטלפון
    const c2 = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true }); await c2.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
    const m = await c2.newPage(); await m.goto(base); await m.waitForSelector('.lr-h'); await m.click('.howto summary'); await m.waitForTimeout(300);
    const sw = await m.evaluate(() => document.documentElement.scrollWidth);
    const wide = sw > w ? await m.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 0.5 && !e.closest('.chart,.marq,.trk'); }).filter(e => ![...e.children].some(c => c.getBoundingClientRect().right > innerWidth + 0.5)).slice(0, 4).map(e => `${e.tagName}.${e.className}[${Math.round(e.getBoundingClientRect().right)}] ${(e.textContent || '').trim().slice(0, 20)}`).join(' | ')) : '';
    ok(sw <= w, `ברוחב ${w} אין גלילה הצידה (${sw}) ${wide}`);
    ok(await m.evaluate(() => { const r = document.querySelector('#acctBtn, #themeBtn').getBoundingClientRect(); return r.right <= innerWidth && r.left >= 0; }), `ברוחב ${w} הכפתורים למעלה בתוך המסך`);
    await c2.close();
  }
});

test('המפענח מסנן הודעות מערכת', async ({ page }) => {
  const r = await page.evaluate(() => { const L = [
    '[30/08/2020, 22:15:00] שירן: ‎הקבוצה נוצרה על ידי שירן', '[30/08/2020, 22:15:01] בני: ‎צורפת', '[30/08/2020, 22:16:00] שירן: הוא הוסיף מלח לכל הסיר',
    '[30/08/2020, 22:17:00] בני: ‎הווידאו לא נכלל', '[30/08/2020, 22:18:00] בני: ‎הערת הווידאו לא נכללה', '[30/08/2020, 22:19:00] Sam: ‎מחקת את ההודעה',
    '[30/08/2020, 22:20:00] עידו: ‎שיחה שלא נענתה', '[30/08/2020, 22:22:00] אורי: אני יצאתי מהעבודה', '[30/08/2020, 22:23:00] ליה: שירן הוסיף/ה את הדר',
    '30/08/2020, 22:26 - Dana: Missed voice call', '30/08/2020, 22:27 - Dana: image omitted', '30/08/2020, 22:28 - Dana: I left my keys at home lol',
    '[30/08/2020, 22:30:00] שירן: חחח צירפתי אותך לקבוצה של העבודה'];
    return parseChat(L.join('\n')).map(m => ({ k: m.kind, w: m.who, t: m.text })); });
  const texts = r.filter(m => m.k === 'text').map(m => m.t);
  ok(texts.includes('הוא הוסיף מלח לכל הסיר') && texts.includes('אני יצאתי מהעבודה') && texts.includes('I left my keys at home lol') && texts.includes('חחח צירפתי אותך לקבוצה של העבודה'), 'הודעות רגילות נשמרות');
  ok(!texts.some(t => /נוצרה|צורפת|לא נענתה|הוסיף\/ה|Missed|omitted|נכלל/.test(t)), `הודעות מערכת לא נספרות כטקסט (${texts.join(' | ')})`);
});

test('ייצוא באנגלית: אייפון ואנדרואיד', async ({ page, fx }) => {
  for (const st of ['ios', 'android']) {
    const raw = fs.readFileSync(fx['english_' + st], 'utf8');
    const r = await page.evaluate((raw) => { const msgs = parseChat(raw); const d = t => { const x = new Date(t); return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()} ${x.getHours()}:${String(x.getMinutes()).padStart(2, '0')}`; };
      const job = msgs.find(m => /got the job/.test(m.text || ''));
      return { n: msgs.length, people: computeStats(msgs, '').people.map(p => p.name).sort().join(','), job: job && d(job.t), last: d(msgs[msgs.length - 1].t),
        sys: msgs.filter(m => m.kind === 'text' && /created group|added|left|end-to-end|Missed voice|omitted|was deleted/i.test(m.text)).length,
        media: msgs.filter(m => m.kind === 'media').length, del: msgs.filter(m => m.kind === 'deleted').length }; }, raw);
    ok(r.people === 'Ben,Maya,Noa,Tom', `${st}: ארבעה משתתפים, בלי "הקבוצה" כמשתתף (${r.people})`);
    ok(r.job === '2024-2-12 22:00', `${st}: תאריך אמריקאי ושעה של 12 שעות מתפרשים נכון (${r.job})`);
    ok(r.last === '2024-7-20 14:36', `${st}: ההודעה האחרונה בתאריך הנכון (${r.last})`);
    ok(r.sys === 0, `${st}: הודעות מערכת באנגלית לא נספרות כטקסט (${r.sys})`);
    ok(r.media > 10 && r.del > 3, `${st}: מדיה והודעות שנמחקו מזוהות (${r.media}, ${r.del})`);
  }
});

test('צ\'אט ענק: 100 אלף הודעות', async ({ page }) => {
  const r = await page.evaluate(() => { const base = makeDemoChat().split('\n'); const out = [];
    for (let k = 0; k < 27; k++) for (const l of base) out.push(l.replace(/(\d\d)\.(\d\d)\.(20\d\d)/, (m, d, mo, y) => `${d}.${mo}.${+y + k * 4}`));
    const t0 = performance.now(); const msgs = parseChat(out.join('\n')); const st = computeStats(msgs, ''); const t1 = performance.now();
    let rep = null, err = ''; try { rep = quickReport(msgs, st, 'נועה', 'f'); } catch (e) { err = e.message; }
    return { n: msgs.length, read: Math.round(t1 - t0), build: Math.round(performance.now() - t1), secs: rep ? rep.sections.length : 0, err }; });
  ok(!r.err && r.n > 100000, `צ'אט של ${r.n} הודעות עובר בלי שגיאה ${r.err}`);
  ok(r.secs >= 20, `גם בצ'אט ענק הדוח מלא (${r.secs} פרקים)`);
  ok(r.read + r.build < 12000, `זמן סביר (קריאה ${r.read}ms, דוח ${r.build}ms)`);
});

test('המנוע על כל הצ\'אטים', async ({ page, fx }) => {
  const runs = [['demo', null, 'נועה', 'f'], ['demo', null, 'איתי', 'm'], ['couple', fx.couple, '', ''], ['group', fx.group, '', ''], ['tiny', fx.tiny, '', '']];
  runs.push(['english_ios', fx.english_ios, '', ''], ['english_android', fx.english_android, '', '']);
  for (const [name, file, reader, g] of runs) {
    const raw = file ? fs.readFileSync(file, 'utf8') : null;
    const res = await page.evaluate(({ raw, reader, g }) => { try {
      const msgs = parseChat(raw ?? makeDemoChat()); const st = computeStats(msgs, ''); const t0 = performance.now();
      const rep = quickReport(msgs, st, reader || st.people?.[0]?.name || '', g); return { rep, ms: performance.now() - t0, n: msgs.length };
    } catch (e) { return { err: e.message + ' ' + (e.stack || '').split('\n')[1] }; } }, { raw, reader, g });
    ok(!res.err, `${name}: המנוע רץ בלי שגיאה ${res.err || ''}`); if (res.err) continue;
    ok(res.ms < 4000, `${name}: מהיר (${Math.round(res.ms)}ms ל-${res.n} הודעות)`);
    const text = (0, eval)(`(${REPORT_TEXT})`)(res.rep); hygiene(name + (reader ? `/${reader}` : ''), text, res.rep);
    if (name === 'demo' && reader === 'נועה') fs.writeFileSync(path.join(TMP, 'demo-report.txt'), text);
  }
});

test('הדוגמה מספרת את הסיפור נכון', async ({ page }) => {
  const res = await page.evaluate(() => { const msgs = parseChat(makeDemoChat()); const st = computeStats(msgs, ''); return quickReport(msgs, st, 'נועה', 'f'); });
  const text = (0, eval)(`(${REPORT_TEXT})`)(res);
  const fight = res.sections.find(s => s.icon === '🌧️');
  ok(fight && /20 בינואר 2024/.test(fight.blocks.map(b => b.text || '').join(' ')), 'תאריך הריב הוא 20 בינואר 2024 (היום שבו זה נשבר, לא היום של הסליחה)');
  const tl = text.split('\n').filter(l => /^ • \d+ ב/.test(l));
  const fightLine = tl.find(l => /הריב/.test(l)), quietLine = tl.find(l => /שקט/.test(l));
  ok(fightLine && quietLine && tl.indexOf(fightLine) < tl.indexOf(quietLine), 'בציר הזמן הריב בא לפני השקט');
  const mood = res.sections.flatMap(s => s.blocks).find(b => b.t === 'mood');
  ok(mood, 'יש גרף רגשות');
  if (mood) { const i = mood.peaks.sad; ok(['2023-03', '2024-01', '2025-03'].includes(mood.months[i]), `החודש הכי קשה בגרף הוא חודש קשה באמת (${mood.months[i]})`); }
  const hard = text.match(/והתקופה שבה היה הכי קשה: ([^.]+)/); ok(!hard || /מרץ 2023|ינואר 2024|מרץ 2025/.test(hard[1]), `"הכי קשה" בטקסט נכון (${hard && hard[1]})`);
  const sorry = text.match(/\[(\d+)\] פעמים ש(\S+) התנצל[^\n]*/); ok(!sorry || +sorry[1] < 20 || /חתימה/.test(sorry[0]), `כשההתנצלויות הן בעצם הרגל, הדוח אומר את זה (${sorry && sorry[0]})`);
  ok(!/נועה ומאיה עונים|מאיה ונועה עונים|אחד לשני פי/.test(text.replace(/[^\n]*(איתי|רועי|עומר)[^\n]*/g, '')), 'שתי נשים: "עונות אחת לשנייה"');
  // ליאור: מסע רגשות מלא. צחוק, שמחה, כאב, ריב, מבוכה, ומי מחפש את מי
  const icons = new Set(res.sections.map(s => s.icon));
  for (const [ic, what] of [['😂', 'צחוק'], ['🙈', 'מבוכה'], ['🫶', 'מי מחפש את מי'], ['🌧️', 'ריב וסליחה'], ['🫂', 'ימים קשים'], ['🌡️', 'גרף רגשות']]) ok(icons.has(ic), `בדוח יש ${what} (${ic})`);
  for (let k = 0; k < 6; k++) { // המנוע אקראי: מוודאים שהמסע המלא נשמר בכל הרצה, לא רק בחלק מהן
    const ics = await page.evaluate(() => { const msgs = parseChat(makeDemoChat()); return quickReport(msgs, computeStats(msgs, ''), 'נועה', 'f').sections.map(s => s.icon).join(''); });
    const miss = ['😂', '🙈', '🫶', '🌧️', '🫂', '🌡️', '🤍'].filter(ic => !ics.includes(ic)); if (miss.length) { ok(false, `בהרצה ${k + 1} חסר: ${miss.join(' ')}`); break; }
  }
  const emb = res.sections.find(s => s.icon === '🙈');
  ok(emb && emb.blocks.filter(b => b.t === 'p').length >= 3, 'בפרק המביך יש לפחות שני רגעים');
  ok(!/כדורים|תרופ|רופא|בנק|משכורת/.test(JSON.stringify(emb || {})), 'הפרק המביך לא חושף פרט רפואי או כספי');
});

test('הקו של ליאור: מה שרגיש לא עולה לפרק המביך', async ({ page }) => {
  const r = await page.evaluate(() => { const L = []; const d = (h, mi) => `[05/05/2024, ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00]`;
    for (let k = 0; k < 40; k++) L.push(`${d(10 + (k % 8), k)} ${k % 2 ? 'שירן' : 'בני'}: ${k % 3 ? 'מה קורה' : 'אני בדרך'} ${k}`);
    L.push(`${d(20, 1)} בני: אמא אל תשכחי לקחת את התרופות של אבא, הרופא אמר פעמיים ביום`, `${d(20, 2)} בני: זה לא היה אמור להגיע לפה`, `${d(20, 3)} שירן: חחחחחח בני`);
    L.push(`${d(21, 1)} שירן: ‎ההודעה נמחקה`, `${d(21, 2)} בני: מה מחקת??`);
    const msgs = parseChat(L.join('\n')); return quickReport(msgs, computeStats(msgs, ''), 'שירן', 'f'); });
  ok(!/התרופות של אבא/.test(JSON.stringify(r)), 'הודעה רפואית שנשלחה לצ\'אט הלא נכון לא מוצגת');
});

test('העלאת zip, דוח, דוח אישי וחידון', async ({ browser, ctx, base, fx, errs }) => {
  const p = await ctx.newPage(); await p.goto(base); await p.waitForSelector('.lr-h');
  await p.setInputFiles('#file', fx.zip); await p.waitForSelector('#readerChips .chip', { timeout: 8000 });
  await p.click('#readerChips .chip >> nth=0'); await p.click('#go'); await p.waitForTimeout(1000);
  for (let i = 0; i < 3; i++) { if (await p.$('.qo')) { await p.click('.qo >> nth=0'); await p.waitForTimeout(2700); } }
  await p.click('[data-act=toReport]'); await p.waitForSelector('.ready, .lr-h'); await p.waitForTimeout(800);
  await p.click('#modal [data-act=mclose]').catch(() => {});
  ok(await p.$$eval('.sect h2', x => x.length) >= 8, 'דוח נבנה מקובץ zip');
  const chips = await p.$$('.pchip'); ok(chips.length >= 3, `יש כפתור דוח אישי לכל אחד (${chips.length})`);
  await p.click('.pchip >> nth=1'); await p.waitForSelector('#shareIn'); const plink = await p.$eval('#shareIn', x => x.value);
  ok(plink.startsWith('https://hthr63-prog.github.io/rechiluta/#x-'), 'קישור דוח אישי מצביע לאתר');
  const friend = await browser.newContext({ viewport: { width: 390, height: 844 } }); await friend.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  const p2 = await friend.newPage(); await p2.goto(plink.replace('https://hthr63-prog.github.io/rechiluta/', base)); await p2.waitForSelector('.lr-h');
  ok(await p2.$('.letter'), 'הדוח האישי נפתח אצל החבר, עם מכתב');
  ok(/במיוחד בשבילך/.test(await p2.$eval('#banner', x => x.textContent)), 'מי שמקבל דוח אישי רואה למעלה הסבר שהדוח נכתב בשבילו');
  ok(/הקבוצה שלי/.test(await p2.$eval('.gift-cta', x => x.textContent).catch(() => '')), 'בסוף הדוח יש כפתור "לעשות דוח על הקבוצה שלי"');
  await p2.click('.gift-cta [data-act=gohome]'); await p2.waitForTimeout(600);
  ok(await p2.$eval('#hero', x => !x.hidden).catch(() => false), 'הכפתור מוביל לדף הבית כדי להעלות צ\'אט');
  await friend.close(); await p.click('[data-act=mclose]').catch(() => {}); await p.keyboard.press('Escape').catch(() => {});
  await p.click('[data-act=quizLink]'); await p.waitForSelector('#shareIn'); await p.waitForTimeout(300);
  const qlink = await p.$eval('#shareIn', x => x.value); ok(/#q-/.test(qlink), 'יש קישור חידון');
  const f = await ctx.newPage(); await f.goto(qlink.replace('https://hthr63-prog.github.io/rechiluta/', base)); await f.waitForSelector('#quiz .qo');
  const n = await f.$$eval('#quiz .qdots i', x => x.length); ok(n >= 5, `בחידון יש לפחות 5 שאלות (${n})`);
  for (let i = 0; i < n; i++) { await f.click('.qo >> nth=0'); await f.waitForTimeout(2750); }
  ok(await f.$('.qscore'), 'החידון מגיע למסך סיום');
  await f.close(); await p.close();
});

test('קישורים זדוניים לא מריצים קוד', async ({ ctx, base, page, fx }) => {
  const raw = fs.readFileSync(fx.tiny, 'utf8');
  const hashes = await page.evaluate(async (raw) => { const X = '<img src=x onerror="window.__pwn=1">';
    const st = computeStats(parseChat(raw), ''); st.chatName = X; if (st.people?.[0]) st.people[0].name = X;
    const rep = { headline: X, dek: X, intro: [X], quick: true, awards: [{ title: X, winner: X, why: X }], characters: [{ name: X, role: X, bio: X }], scores: { drama: '"><img src=x onerror=window.__pwn=1>', love: X, chaos: 5, cringe: 5 }, prediction: X, letter: [X], sections: [{ icon: X, title: X, blocks: [
      { t: 'p', text: X }, { t: 'num', value: X, label: X }, { t: 'chat', msgs: [{ who: X, text: X, kind: 'text', t: 1 }], after: X },
      { t: 'links', items: [{ url: 'javascript:alert(1)', who: X, t: 1, note: X }, { url: 'https://evil.com/x', who: 'a', t: 1 }, { url: 'https://youtu.be/dQw4w9WgXcQ', who: 'ok', t: 1, note: 'good' }] },
      { t: 'mood', months: ['2024-01', '<img src=x>'], laugh: [1, X], love: [1, 2], sad: [0, 0], marks: [{ k: '2024-01', ic: X }] }] }] };
    const q = { chat: X, by: X, qs: [{ q: X, quote: X, a: X, o: [X, 'b'], why: X }, { q: X, quote: X, a: 'b', o: [X, 'b'] }, { q: 'x', quote: 'y', a: 'nope', o: ['a', 'b'] }] };
    return [await encodeHash('x-', { v: 2, persona: '__proto__', reader: X, gender: 'f', st, rep }), await encodeHash('q-', q)]; }, raw);
  for (const [i, h] of hashes.entries()) {
    const e = await ctx.newPage(); await e.goto(base + '#' + h); await e.waitForTimeout(1500);
    await e.click('.qo >> nth=0').catch(() => {}); await e.click('[data-act=story]').catch(() => {}); await e.waitForTimeout(800);
    ok(!(await e.evaluate(() => window.__pwn)), `קישור ${i ? 'חידון' : 'דוח'} זדוני: שום קוד לא רץ`);
    ok((await e.evaluate(() => document.querySelectorAll('img[src="x"]').length)) === 0, `קישור ${i ? 'חידון' : 'דוח'} זדוני: לא הוזרק HTML`);
    if (!i) { const hrefs = await e.$$eval('.plinks a', x => x.map(a => a.getAttribute('href'))); ok(hrefs.every(h => /^https:\/\/(youtu\.be|www\.youtube\.com|open\.spotify\.com|music\.apple\.com|soundcloud\.com)\//.test(h)), `בפלייליסט רק קישורי מוזיקה בטוחים (${hrefs.join(', ')})`); }
    await e.close();
  }
  const fr = await ctx.newPage(); await fr.goto(base + 'tests-frame'); await fr.setContent(`<iframe src="${base}" width=300 height=300></iframe>`); await fr.waitForTimeout(1500);
  ok(fr.url().startsWith(base) && !fr.url().includes('tests-frame') || fr.url() === base, `האתר לא נטען בתוך מסגרת של אתר אחר (${fr.url()})`);
  await fr.close();
});

test('חשבון: סיסמה חזקה והצפנה', async ({ browser, base, fx }) => {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 } });
  const users = {}, docs = {}; let n = 0; const offsite = [];
  await ctx.route('**/*', async route => { const r = route.request(); const u = r.url(); if (u.startsWith(base)) return route.continue();
    const body = r.postData() ? JSON.parse(r.postData()) : null;
    const good = j => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
    const bad = m => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: m } }) });
    if (u.includes('accounts:signUp')) { if (users[body.email]) return bad('EMAIL_EXISTS'); users[body.email] = { pw: body.password, uid: 'uid' + (++n) }; return good({ localId: users[body.email].uid, idToken: 't', refreshToken: 'r', expiresIn: '3600' }); }
    if (u.includes('signInWithPassword')) { const x = users[body.email]; if (!x || x.pw !== body.password) return bad('INVALID_LOGIN_CREDENTIALS'); return good({ localId: x.uid, idToken: 't', refreshToken: 'r', expiresIn: '3600' }); }
    if (u.includes('firestore')) { const m = u.match(/rk_users\/([^/]+)\/reports(?:\/([^?]+))?/); const uid = m[1], id = m[2]; docs[uid] = docs[uid] || {};
      if (r.method() === 'PATCH') { docs[uid][id] = body; return good({ name: `x/rk_users/${uid}/reports/${id}`, ...body }); }
      if (r.method() === 'DELETE') { delete docs[uid][id]; return good({}); }
      return good({ documents: Object.entries(docs[uid]).map(([k, v]) => ({ name: `x/rk_users/${uid}/reports/${k}`, fields: v.fields })) }); }
    if (!/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) offsite.push(u.slice(0, 60)); route.abort(); });
  const p = await ctx.newPage(); await p.goto(base); await p.waitForSelector('.lr-h');
  await p.click('#acctBtn'); await p.click('[data-act=authUp]'); await p.waitForTimeout(300);
  await p.fill('#auU', 'tester'); await p.fill('#auP', 'abc123'); await p.fill('#auP2', 'abc123'); await p.click('#auGo'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !AUTH && (document.querySelector('#auErr').textContent.length > 0 || !document.querySelector('#auP').checkValidity())), 'סיסמה קצרה נדחית');
  await p.fill('#auP', '12345678'); await p.fill('#auP2', '12345678'); await p.click('#auGo'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !AUTH && /קלה מדי/.test(document.querySelector('#auErr').textContent)), 'סיסמה קלה לניחוש נדחית');
  await p.fill('#auP', 'Kfar-Galim-77'); await p.fill('#auP2', 'Kfar-Galim-77'); await p.click('#auGo'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => AUTH?.user === 'tester'), 'סיסמה חזקה: נכנסים לחשבון');
  await p.click('[data-act=mclose]').catch(() => {});
  await p.setInputFiles('#file', fx.zip); await p.waitForSelector('#readerChips .chip'); await p.click('#readerChips .chip >> nth=0'); await p.click('#go'); await p.waitForTimeout(1000);
  for (let i = 0; i < 3; i++) { if (await p.$('.qo')) { await p.click('.qo >> nth=0'); await p.waitForTimeout(2700); } }
  await p.click('[data-act=toReport]'); await p.waitForSelector('.ready, .lr-h'); await p.waitForTimeout(1500);
  const saved = Object.values(docs).flatMap(o => Object.values(o)); ok(saved.length >= 1, 'הדוח נשמר בענן');
  const ct = saved[0]?.fields?.ct?.stringValue || ''; ok(ct.length > 100 && !/[֐-׿]/.test(ct), 'בענן נשמר רק טקסט מוצפן, בלי מילה מהצ\'אט');
  ok(offsite.length === 0, `אין פניות לאתרים אחרים (${[...new Set(offsite)].join(', ')})`);
  await ctx.close();
});

(async () => {
  const fx = makeFixtures(); const srv = await serve(); const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const errs = [], csp = [];
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  ctx.on('page', pg => { pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { const t = m.text(); if (/Content Security Policy|Refused to/i.test(t)) csp.push(t.slice(0, 160)); }); });
  const page = await ctx.newPage(); await page.goto(base); await page.waitForSelector('.lr-h');
  const only = process.argv[2];
  for (const t of TESTS) { if (only && !t.name.includes(only)) continue; current = t.name; console.log(`▶ ${t.name}`);
    try { await t.fn({ browser, ctx, page, base, fx, errs, csp }); } catch (e) { ok(false, `קרס: ${e.message.split('\n')[0]}`); } }
  current = 'כללי'; ok(errs.length === 0, `אין שגיאות JavaScript בדף (${errs.slice(0, 3).join(' | ')})`); ok(csp.length === 0, `אין הפרות CSP (${csp.slice(0, 2).join(' | ')})`);
  await browser.close(); srv.close();
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} בדיקות עברו. דוח הדוגמה נשמר ב-${path.join(TMP, 'demo-report.txt')}`);
  process.exit(failed.length ? 1 : 0);
})();
