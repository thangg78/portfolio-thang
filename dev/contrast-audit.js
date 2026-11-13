// Dev: đo tương phản mọi chữ đang hiện, ở mọi vị trí cuộn (bước 60 px).
// Dùng trong console: (await import('/dev/contrast-audit.js')).run()
const rgb = (s) => s.match(/[\d.]+/g).slice(0, 4).map(Number);
const L = (c) => {
  const v = c.slice(0, 3).map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Nền gradient: đo với cả hai đầu màu
const GRAD = { hero: [[242, 247, 250], [191, 227, 245]], contact: [[4, 20, 43], [2, 10, 23]] };
function bgs(el) {
  for (let e = el; e; e = e.parentElement) {
    if (e.classList?.contains('hero')) return GRAD.hero;
    if (e.classList?.contains('contact')) return GRAD.contact;
    const c = rgb(getComputedStyle(e).backgroundColor);
    if (c[3] === undefined || c[3] > 0.9) return [c];
  }
  return [[4, 20, 43]];
}

export function run(step = 60) {
  const root = document.documentElement;
  const texts = [...document.querySelectorAll('body *')].filter(
    (el) => [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && !el.closest('.visually-hidden, script, style'),
  );
  const max = root.scrollHeight - innerHeight;
  let worst = { r: 99 };
  const fails = new Set();
  let checks = 0;
  for (let y = 0; y <= max + step - 1; y += step) {
    scrollTo({ top: Math.min(y, max), behavior: 'instant' });
    for (const el of texts) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (!r.height || r.bottom < 0 || r.top > innerHeight) continue;
      const size = parseFloat(cs.fontSize), w = +cs.fontWeight;
      const need = size >= 24 || (size >= 18.66 && w >= 700) ? 3 : 4.5;
      const fg = rgb(cs.color);
      for (const b of bgs(el)) {
        checks++;
        const v = ratio(fg, b);
        if (v < worst.r) worst = { r: +v.toFixed(2), el: el.className || el.tagName, text: el.textContent.trim().slice(0, 24) };
        if (v < need) fails.add(`${el.className || el.tagName} "${el.textContent.trim().slice(0, 24)}": ${v.toFixed(2)} < ${need}`);
      }
    }
  }
  scrollTo({ top: 0, behavior: 'instant' });
  const vw = root.clientWidth;
  return {
    w: innerWidth,
    hscroll: root.scrollWidth > vw,
    overflowing: [...document.querySelectorAll('main *')].filter((e) => e.getBoundingClientRect().right > vw + 1).length,
    positions: Math.ceil((max + 1) / step),
    checks,
    worst,
    fails: [...fails].slice(0, 15),
  };
}
