/**
 * Mở đầu: "đàn con trỏ dựng trang" (đặc tả mục 6).
 * 1. Trang đã hoàn chỉnh; các phần tử cần dựng được đánh dấu data-layer (type | name | block).
 * 2. Đo vị trí bằng getBoundingClientRect; ẩn bằng visibility: hidden (giữ bố cục). Chỉ ẩn bằng JS
 *    (script ở <head> gắn .intro-pending; không có JS thì không ẩn gì).
 * 3. Lớp phủ position: absolute phía trên trang; một hàng đợi chung; con trỏ nào rảnh lấy lớp tiếp theo.
 * 4. Mỗi lớp: di chuyển → kéo khung có nhãn W × H → gõ chữ hoặc quét lộ khối → gỡ lớp phủ.
 *    Cuối cùng nền "bản vẽ" rút xuống, lộ mặt nước.
 * 5. Cờ sessionStorage (bọc try/catch) để không chạy lại trong phiên.
 * Dưới 6 giây (trần cứng HARD_CAP_MS), có nút "Bỏ qua" và phím Esc; cuộn hoặc bấm vào trang cũng bỏ qua.
 * Không chạy khi giảm chuyển động / tắt hiệu ứng / tab đang ẩn.
 */
import { t } from '../i18n';
import { motionAllowed } from '../core/motion';
import * as nameReveal from './name-reveal';

const FLAG = 'intro-done';
const HARD_CAP_MS = 5600;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // đặc tả: easing chung, không nảy
const MOVE_MS = 280;
const FRAME_MS = 260;
const TYPE_BUDGET_MS = 560; // mỗi lớp chữ gõ trong khoảng này
const NAME_STEP_MS = 40;    // mỗi ký tự của tên
const devLog: string[] = [];
const log = (s: string) => { if (import.meta.env.DEV) devLog.push(`${Math.round(performance.now())} ${s}`); };

type Mode = 'type' | 'name' | 'block';
type Cursor = { el: HTMLElement; x: number; y: number; color: string };

const CURSORS = [
  { color: 'var(--coral)', ink: 'var(--deep)', key: 'intro.c1' },
  { color: 'var(--ocean-ink)', ink: 'var(--foam)', key: 'intro.c2' },
  { color: 'var(--mid)', ink: 'var(--foam)', key: 'intro.c3' },
];

let running = false;
let aborted = false;
let overlay: HTMLDivElement | null = null;
let artboard: HTMLDivElement | null = null;
let skipBtn: HTMLButtonElement | null = null;
let live: HTMLElement | null = null;
let hero: HTMLElement | null = null;
const timers = new Set<number>();
const anims = new Set<Animation>();
const restores: (() => void)[] = [];
const offs: (() => void)[] = [];

const root = document.documentElement;
const markDone = () => { try { sessionStorage.setItem(FLAG, '1'); } catch { /* bỏ qua */ } };

/** Script ở <head> đã quyết định (có JS, cho phép chuyển động, chưa có cờ phiên, không có #neo). */
export const shouldRun = () => root.classList.contains('intro-pending');
export const isRunning = () => running;

function sleep(ms: number) {
  return new Promise<void>((res) => {
    const id = window.setTimeout(() => { timers.delete(id); res(); }, ms);
    timers.add(id);
  });
}

function play(el: Element, keyframes: Keyframe[], ms: number) {
  const a = el.animate(keyframes, { duration: ms, easing: EASE, fill: 'forwards' });
  anims.add(a);
  return a.finished.then(() => { anims.delete(a); }, () => { anims.delete(a); });
}

function page(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
}

/* ---------- Con trỏ ---------- */
function makeCursor(i: number, x: number, y: number): Cursor {
  const c = CURSORS[i];
  const el = document.createElement('div');
  el.className = 'intro-cursor';
  el.style.setProperty('--c', c.color);
  el.style.setProperty('--ink', c.ink);
  el.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 2 L3 18 L7.5 13.8 L10.6 20.4 L13.4 19.1 L10.4 12.6 L16.6 12.6 Z" /></svg><span class="intro-cursor__tag"></span>`;
  el.querySelector('.intro-cursor__tag')!.textContent = t(c.key);
  el.style.transform = `translate(${x}px, ${y}px)`;
  overlay!.append(el);
  return { el, x, y, color: c.color };
}

async function moveTo(c: Cursor, x: number, y: number, ms = MOVE_MS) {
  const from = `translate(${c.x}px, ${c.y}px)`;
  const to = `translate(${x}px, ${y}px)`;
  c.x = x;
  c.y = y;
  await play(c.el, [{ transform: from }, { transform: to }], ms);
}

/* ---------- Khung chọn W × H ---------- */
async function dragFrame(c: Cursor, box: { x: number; y: number; w: number; h: number }) {
  const f = document.createElement('div');
  f.className = 'intro-frame';
  f.style.setProperty('--c', c.color);
  Object.assign(f.style, { left: `${box.x}px`, top: `${box.y}px`, width: '0px', height: '0px' });
  const label = document.createElement('span');
  label.className = 'intro-frame__size';
  label.style.setProperty('--ink', CURSORS.find((k) => k.color === c.color)?.ink ?? 'var(--foam)');
  label.textContent = `${Math.round(box.w)} × ${Math.round(box.h)}`;
  f.append(label);
  overlay!.append(f);
  await Promise.all([
    play(f, [{ width: '0px', height: '0px' }, { width: `${box.w}px`, height: `${box.h}px` }], FRAME_MS),
    moveTo(c, box.x + box.w, box.y + box.h, FRAME_MS),
  ]);
  return f;
}

async function removeFrame(f: HTMLElement) {
  // Thu khung về 0 thay vì mờ dần (nhãn W × H không bao giờ ở trạng thái chữ mờ, tương phản thấp)
  await play(f, [{ transform: 'scale(1)' }, { transform: 'scale(0.96)', clipPath: 'inset(50%)' }], 140);
  f.remove();
}

/* ---------- Các kiểu dựng ---------- */
const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Gõ chữ: rỗng các nút chữ rồi thêm từng ký tự. Khung phần tử được giữ cố định → không dịch bố cục. */
async function typeLayer(el: HTMLElement, box: { w: number; h: number }) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const originals = nodes.map((n) => n.data);
  const prev = { w: el.style.width, h: el.style.height };
  el.style.width = `${box.w}px`;
  el.style.height = `${box.h}px`;
  nodes.forEach((n) => (n.data = ''));
  restores.push(() => {
    nodes.forEach((n, i) => (n.data = originals[i]));
    el.style.width = prev.w;
    el.style.height = prev.h;
  });
  el.style.visibility = 'visible';
  // Chỉ đếm ký tự nhìn thấy (khoảng trắng đi kèm ký tự liền trước)
  const total = originals.reduce((s, x) => s + [...seg.segment(x)].filter((g) => g.segment.trim()).length, 0) || 1;
  // Gõ theo nhịp khung hình: mỗi nhịp thêm đủ số ký tự để cả lớp xong trong TYPE_BUDGET_MS
  // (không dùng một setTimeout cho mỗi ký tự: máy bận thì bộ hẹn giờ trễ, cộng dồn sẽ vượt 6 s)
  const chars = originals.map((x) => [...seg.segment(x)].map((s) => s.segment));
  const start = performance.now();
  let shown = 0;
  while (shown < total && !aborted) {
    await new Promise((r) => requestAnimationFrame(r));
    const target = Math.min(total, Math.ceil(((performance.now() - start) / TYPE_BUDGET_MS) * total));
    let k = 0;
    for (let i = 0; i < nodes.length; i++) {
      let s = '';
      for (const ch of chars[i]) {
        if (ch.trim()) { if (k >= target) break; k++; }
        s += ch;
      }
      nodes[i].data = s;
    }
    shown = target;
  }
  if (!aborted) nodes.forEach((n, i) => (n.data = originals[i]));
}

/** Gõ tên: lộ từng ký tự đã tách sẵn (ô cố định, chỉ đổi transform). */
async function typeName(el: HTMLElement) {
  el.style.visibility = 'visible';
  root.classList.remove('nr-pending');
  const n = nameReveal.glyphCount();
  // Theo đồng hồ thật, không cộng dồn độ trễ của bộ hẹn giờ
  const start = performance.now();
  let next = 0;
  while (next < n && !aborted) {
    await new Promise((r) => requestAnimationFrame(r));
    const due = Math.min(n, Math.floor((performance.now() - start) / NAME_STEP_MS) + 1);
    while (next < due) nameReveal.revealGlyph(next++);
  }
}

/** Quét lộ khối từ trái sang phải; con trỏ chạy theo mép quét. */
async function sweepLayer(c: Cursor, el: HTMLElement, box: { x: number; y: number; w: number; h: number }) {
  el.style.clipPath = 'inset(0 100% 0 0)';
  el.style.visibility = 'visible';
  restores.push(() => { el.style.clipPath = ''; });
  await moveTo(c, box.x, box.y + box.h / 2, 140);
  await Promise.all([
    play(el, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], 340),
    moveTo(c, box.x + box.w, box.y + box.h / 2, 340),
  ]);
  el.style.clipPath = '';
}

async function buildLayer(c: Cursor, el: HTMLElement) {
  const mode = (el.dataset.layer || 'block') as Mode;
  const box = page(el);
  log(`start ${mode} ${el.className}`);
  await moveTo(c, box.x, box.y);
  if (aborted) return;
  const frame = await dragFrame(c, box);
  if (aborted) return;
  if (mode === 'name') await typeName(el);
  else if (mode === 'type') await typeLayer(el, box);
  else await sweepLayer(c, el, box);
  if (aborted) return;
  await sleep(40);
  await removeFrame(frame);
  log(`end ${mode} ${el.className}`);
}

/* ---------- Vòng đời ---------- */
function skip(reason = 'skip') {
  if (import.meta.env.DEV && running) {
    try { sessionStorage.setItem('dev:intro-end', `${reason} @${Math.round(performance.now())}ms`); } catch { /* bỏ qua */ }
  }
  finish(true);
}

function finish(instant: boolean) {
  if (!running) return;
  aborted = true;
  running = false;
  timers.forEach((id) => clearTimeout(id));
  timers.clear();
  anims.forEach((a) => a.cancel());
  anims.clear();
  restores.splice(0).forEach((fn) => fn());
  hero?.querySelectorAll<HTMLElement>('[data-layer]').forEach((el) => { el.style.visibility = ''; el.style.clipPath = ''; });
  nameReveal.revealAll(instant);
  offs.splice(0).forEach((fn) => fn());
  overlay?.remove();
  artboard?.remove();
  skipBtn?.remove();
  live?.remove();
  overlay = artboard = skipBtn = null;
  live = null;
  root.classList.remove('intro-pending', 'intro-running', 'nr-pending');
  markDone();
}

function addListeners() {
  // Chỉ bỏ qua khi người dùng thật sự thao tác. Không nghe sự kiện "scroll": trình duyệt tự khôi phục vị trí cuộn
  // khi tải lại cũng bắn "scroll", không phải ý người dùng.
  const NAV_KEYS = new Set(['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', ' ', 'Home', 'End', 'Enter']);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); skip('esc'); }
    else if (NAV_KEYS.has(e.key) && !(e.target as Element).closest?.('.intro-skip')) skip(`key ${e.key}`);
  };
  const onWheel = (e: Event) => skip(e.type);
  const onDown = (e: PointerEvent) => { if (!(e.target as Element).closest('.intro-skip')) skip('pointerdown'); };
  const onHide = () => { if (document.hidden) skip('hidden'); };
  addEventListener('keydown', onKey);
  addEventListener('wheel', onWheel, { passive: true });
  addEventListener('touchmove', onWheel, { passive: true });
  addEventListener('pointerdown', onDown);
  document.addEventListener('visibilitychange', onHide);
  offs.push(() => {
    removeEventListener('keydown', onKey);
    removeEventListener('wheel', onWheel);
    removeEventListener('touchmove', onWheel);
    removeEventListener('pointerdown', onDown);
    document.removeEventListener('visibilitychange', onHide);
  });
}

/** Chạy intro. replay = true: chạy lại theo yêu cầu (nút "Xem lại"), bỏ qua cờ phiên. */
export async function run(opts: { replay?: boolean } = {}) {
  if (running) return;
  hero = document.querySelector<HTMLElement>('.hero');
  const can = hero && motionAllowed() && !document.hidden;
  if (!can || (!opts.replay && !shouldRun())) {
    if (shouldRun()) { running = true; finish(true); } // điều kiện đổi giữa chừng: hiện ngay
    return;
  }
  running = true;
  aborted = false;
  const t0 = performance.now();

  // Intro dựng màn đầu: luôn bắt đầu ở đầu trang (kể cả khi trình duyệt vừa khôi phục vị trí cuộn)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  if (opts.replay) {
    nameReveal.hideAll();
    root.classList.add('intro-pending');
  }
  root.classList.add('intro-running');
  root.classList.remove('nr-pending');

  // Nền "bản vẽ" (artboard) phủ mặt nước, nằm dưới chữ
  artboard = document.createElement('div');
  artboard.className = 'intro-artboard';
  artboard.setAttribute('aria-hidden', 'true');
  hero!.append(artboard);

  // Lớp phủ cho con trỏ và khung
  overlay = document.createElement('div');
  overlay.className = 'intro-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.height = `${page(hero!).h}px`;
  document.body.append(overlay);

  // Nút bỏ qua + thông báo cho trình đọc màn hình
  skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'intro-skip';
  skipBtn.innerHTML = `<span></span> <kbd></kbd>`;
  skipBtn.querySelector('span')!.textContent = t('intro.skip');
  skipBtn.querySelector('kbd')!.textContent = t('intro.skipHint');
  skipBtn.addEventListener('click', () => skip('button'));
  document.body.prepend(skipBtn);
  live = document.createElement('p');
  live.className = 'visually-hidden';
  live.setAttribute('role', 'status');
  document.body.append(live);
  setTimeout(() => { if (live) live.textContent = t('intro.live'); }, 50);

  addListeners();
  const cap = window.setTimeout(() => skip('hard-cap'), HARD_CAP_MS);
  timers.add(cap);

  // Ba con trỏ xuất phát từ ba góc khác nhau của Hero
  const hb = page(hero!);
  // (tránh góc dưới trái: chỗ của nút "Bỏ qua")
  const starts = [
    [hb.x + hb.w * 0.34, hb.y + hb.h * 0.96],
    [hb.x + hb.w * 0.9, hb.y + hb.h * 0.12],
    [hb.x + hb.w * 0.66, hb.y + hb.h * 0.98],
  ];
  // Con trỏ hiện/ẩn tức thì, không mờ dần: chữ nhãn đang mờ dần có tương phản thấp (Lighthouse bắt được 1,02:1)
  const cursors = starts.map(([x, y], i) => makeCursor(i, x, y));

  // Một hàng đợi chung; con trỏ nào rảnh lấy lớp tiếp theo
  // Tên lên đầu hàng đợi: tên là phần tử lớn nhất màn đầu (LCP) nên được dựng xong sớm nhất
  const all = [...hero!.querySelectorAll<HTMLElement>('[data-layer]')];
  const queue = [...all.filter((e) => e.dataset.layer === 'name'), ...all.filter((e) => e.dataset.layer !== 'name')];
  const worker = async (c: Cursor, delay: number) => {
    await sleep(delay);
    while (queue.length && !aborted) await buildLayer(c, queue.shift()!);
  };
  if (import.meta.env.DEV) { devLog.length = 0; Object.assign(window, { __introLog: devLog }); }
  log('begin');
  await Promise.all(cursors.map((c, i) => worker(c, 80 + i * 110)));
  if (aborted) return;
  log('layers done');

  // Lộ nền nước: bản vẽ rút xuống như mực nước dâng; con trỏ mờ đi
  root.classList.remove('intro-pending'); // mặt nước (canvas/gradient) hiện bên dưới bản vẽ
  cursors.forEach((c) => c.el.remove());
  await play(artboard!, [{ clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)' }], 520);
  log('water revealed');
  if (import.meta.env.DEV) Object.assign(window, { __introMs: Math.round(performance.now() - t0), __introLog: devLog });
  finish(false);
}

/** Nút "Xem lại" trong Phòng thử nghiệm. */
export function bindReplay() {
  const btn = document.querySelector<HTMLButtonElement>('[data-intro-replay]');
  if (!btn) return () => {};
  const render = () => {
    const ok = motionAllowed();
    btn.textContent = ok ? t('lab.replay') : t('lab.replayOff');
    btn.setAttribute('aria-disabled', String(!ok));
  };
  btn.addEventListener('click', () => { if (motionAllowed()) run({ replay: true }); });
  render();
  return render;
}
