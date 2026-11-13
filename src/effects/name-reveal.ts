/**
 * Hiệu ứng phụ 1: tên ở Hero hiện từng ký tự từ dưới mặt nước; độ đậm (variable font) đổi theo khoảng cách tới con trỏ.
 * - Tách theo grapheme (Intl.Segmenter) để "ễ", "ắ" không bị tách khỏi dấu.
 * - Mỗi ký tự có ô rộng cố định đo ở độ đậm lớn nhất → đổi độ đậm không đẩy ký tự bên cạnh (không CLS).
 * - Mặt nạ (overflow: hidden) có đệm trên/dưới bằng --display-clip-pad → không cắt dấu chồng.
 * - Trình đọc màn hình đọc nguyên tên qua aria-label của h1; các ô ký tự aria-hidden.
 * - Thiết bị cảm ứng: không có hover nên không đổi độ đậm. Tắt hiệu ứng: hiện ngay, độ đậm cố định.
 */
import { onMotionChange } from '../core/motion';

const W_MIN = 600, W_BASE = 700, W_MAX = 800;
const RADIUS = 320; // px: ngoài bán kính này dùng W_MIN
const STAGGER_MS = 35;

let h1: HTMLElement | null = null;
let glyphs: HTMLElement[] = [];
let raf = 0;
let pointer: { x: number; y: number } | null = null;
let interactive = false;
const cleanups: (() => void)[] = [];
const canHover = matchMedia('(hover: hover) and (pointer: fine)');

function split() {
  if (!h1) return;
  const name = [...h1.querySelectorAll<HTMLElement>('.hero__line')].map((l) => l.textContent?.trim() ?? '').join(' ');
  h1.setAttribute('aria-label', name);
  const seg = new Intl.Segmenter('vi', { granularity: 'grapheme' });
  let i = 0;
  h1.querySelectorAll<HTMLElement>('.hero__line').forEach((line) => {
    const text = (line.textContent ?? '').trim();
    line.removeAttribute('data-i18n'); // tên giống nhau ở hai ngôn ngữ; không để bộ đổi ngôn ngữ ghi đè các ô ký tự
    line.replaceChildren(
      ...[...seg.segment(text)].map(({ segment }) => {
        const box = document.createElement('span');
        box.className = 'nr-char';
        box.setAttribute('aria-hidden', 'true');
        const g = document.createElement('span');
        g.className = 'nr-glyph';
        g.textContent = segment;
        g.style.setProperty('--i', String(i++));
        box.append(g);
        return box;
      }),
    );
  });
  glyphs = [...h1.querySelectorAll<HTMLElement>('.nr-glyph')];
}

/** Ô ký tự = bề rộng ký tự ở độ đậm lớn nhất. */
function measure() {
  if (!h1) return;
  h1.classList.add('nr-measuring');
  const widths = glyphs.map((g) => g.getBoundingClientRect().width);
  h1.classList.remove('nr-measuring');
  glyphs.forEach((g, i) => (g.parentElement as HTMLElement).style.setProperty('--w', `${widths[i].toFixed(2)}px`));
}

function frame() {
  raf = 0;
  if (!pointer) return;
  for (const g of glyphs) {
    const r = g.getBoundingClientRect();
    const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
    const k = Math.max(0, 1 - d / RADIUS);
    const s = k * k * (3 - 2 * k); // smoothstep
    g.style.setProperty('--wght', (W_MIN + (W_MAX - W_MIN) * s).toFixed(0));
  }
}

const onMove = (e: PointerEvent) => {
  if (e.pointerType !== 'mouse') return;
  pointer = { x: e.clientX, y: e.clientY };
  if (!raf) raf = requestAnimationFrame(frame);
};
const onLeave = () => {
  pointer = null;
  glyphs.forEach((g) => g.style.removeProperty('--wght')); // trở về W_BASE
};

function setInteractive(on: boolean) {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero || on === interactive) return;
  interactive = on;
  if (on) {
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
  } else {
    hero.removeEventListener('pointermove', onMove);
    hero.removeEventListener('pointerleave', onLeave);
    cancelAnimationFrame(raf);
    raf = 0;
    onLeave();
  }
}

function reveal(animate: boolean) {
  const root = document.documentElement;
  if (!animate) {
    root.classList.remove('nr-pending');
    h1?.classList.add('nr-shown');
    return;
  }
  // Đợi một khung để trạng thái "dưới nước" được vẽ, rồi cho trồi lên
  requestAnimationFrame(() => {
    root.classList.remove('nr-pending');
    requestAnimationFrame(() => h1?.classList.add('nr-shown'));
  });
  // Lưới an toàn: rAF bị hoãn (tab nền, máy yếu) thì tên vẫn phải hiện
  setTimeout(() => {
    root.classList.remove('nr-pending');
    h1?.classList.add('nr-shown');
  }, 600);
}

/* ---- Điều khiển từ intro "đàn con trỏ" (con trỏ gõ tên = lộ từng ký tự) ---- */
export const glyphCount = () => glyphs.length;
/** Giấu mọi ký tự xuống dưới mặt nạ ngay lập tức (dùng khi xem lại intro). */
export function hideAll() {
  if (!h1) return;
  h1.classList.add('nr-instant');
  h1.classList.remove('nr-shown');
  glyphs.forEach((g) => g.classList.remove('nr-up'));
  void h1.offsetWidth; // áp trạng thái ẩn trước khi bật lại chuyển tiếp
  h1.classList.remove('nr-instant');
}
/** Cho ký tự thứ i trồi lên (gõ). */
export function revealGlyph(i: number) {
  glyphs[i]?.classList.add('nr-up');
}
/** Hiện toàn bộ tên; instant = không chuyển tiếp (khi bỏ qua intro). */
export function revealAll(instant = false) {
  if (!h1) return;
  document.documentElement.classList.remove('nr-pending');
  if (instant) h1.classList.add('nr-instant');
  h1.classList.add('nr-shown');
  if (instant) requestAnimationFrame(() => h1?.classList.remove('nr-instant'));
}

/** defer = true: intro sẽ tự gõ tên, không chạy hiệu ứng trồi lên tự động. */
export function init(opts: { defer?: boolean } = {}) {
  h1 = document.querySelector<HTMLElement>('.hero__name');
  if (!h1) return;
  split();
  h1.classList.add('nr-ready');
  h1.style.setProperty('--nr-base', String(W_BASE));
  h1.style.setProperty('--nr-stagger', `${STAGGER_MS}ms`);
  measure();
  document.fonts?.ready.then(measure);
  const ro = new ResizeObserver(measure);
  ro.observe(h1);

  let first = true;
  cleanups.push(
    () => ro.disconnect(),
    onMotionChange((allowed) => {
      if (first) { if (!opts.defer || !allowed) reveal(allowed); first = false; }
      else if (!allowed) h1?.classList.add('nr-shown');
      setInteractive(allowed && canHover.matches);
    }),
  );
}

export function destroy() {
  setInteractive(false);
  cleanups.splice(0).forEach((fn) => fn());
  document.documentElement.classList.remove('nr-pending');
}
