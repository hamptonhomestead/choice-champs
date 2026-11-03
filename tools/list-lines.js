// Lists every line Choice Champs can say out loud, for every grown-up name
// (Mom, Dad...), as JSON [{ hash, text }] on stdout. Used by make-voice.py.
// Usage: node tools/list-lines.js > /tmp/lines.json   (needs Playwright)
const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');

const src = fs.readFileSync(path.join(__dirname, '..', 'choice-champs.html'), 'utf8');

// Fixed phrases passed straight to narrate([...]).
const fixed = [];
for (const m of src.matchAll(/narrate\(\[([^\]]*)\]/g)) {
  for (const s of m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) fixed.push(s[1].replace(/\\'/g, "'"));
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-'));
  const page = path.join(tmp, 'index.html');
  fs.writeFileSync(page, '<!doctype html><meta charset="utf-8">\n' + src.replace('<script src="audio/manifest.js"></script>', ''));
  const browser = await chromium.launch();
  const p = await browser.newPage();
  await p.goto('file://' + page);
  const lines = await p.evaluate(fixed => {
    const out = new Map();
    const add = t => { const k = speakable(t); if (k) out.set(clipHash(k), k); };
    const saved = S.grownup, savedName = S.name;
    S.name = '';
    for (const g of Object.keys(GROWNUPS)) {
      S.grownup = g;
      fixed.filter(t => /^[A-Za-z]/.test(t) && t.length > 3).forEach(add);
      ['Great job! You are a Choice Champ!', 'You got a new sticker!', "Hi! Let's make champion choices!",
        fill('You also earned a real prize! Go show {G}!')].forEach(add);
      CHAPTERS.forEach(c => {
        add(c.title + '! Pick a story.');
        add(`You won the ${c.title} trophy!`);
        c.scenarios.forEach(sc => {
          sc.steps.forEach(st => add(fill(st.text)));
          add(fill(sc.ask));
          sc.choices.forEach(ch => { add(fill(ch.label)); add(fill(ch.text)); });
        });
      });
      BUDDIES.filter(b => b.unlock).forEach(b => {
        add(`And a new buddy, ${b.name}!`);
        add(`Finish ${chapter(b.unlock).title} to unlock ${b.name}!`);
      });
      const most = CHAPTERS.reduce((n, c) => n + c.scenarios.length + 1, 0);
      for (let n = 1; n <= most; n++) add(`You have ${n} sticker${n === 1 ? '' : 's'}! Play more to fill your book.`);
    }
    S.grownup = saved; S.name = savedName;
    return [...out].map(([hash, text]) => ({ hash, text }));
  }, fixed);
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  process.stdout.write(JSON.stringify(lines, null, 1));
})();
