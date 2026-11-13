/**
 * Độ sâu theo cuộn — nguồn duy nhất cho:
 *   --depth (0 → 1) trên <html>: tiến độ cuộn toàn trang (mục 5.1 của đặc tả)
 *   số mét: nội suy tuyến tính giữa các mốc, để khi đầu tầng chạm ~1/3 màn hình thì thước đo đúng nhãn của tầng.
 * Mốc của dự án bị ẩn (published: false) sẽ tự bị bỏ qua.
 */

/** Độ sâu của đáy (phần Liên hệ). Đặc tả không quy định; chỉnh ở đây. */
export const SEABED_M = 1200;

const STOPS: { id: string; meters: number }[] = [
  { id: 'mat-nuoc', meters: 0 },
  { id: 'tang-1', meters: 10 },
  { id: 'tang-2', meters: 200 },
  { id: 'tang-3', meters: 1000 },
  { id: 'lien-he', meters: SEABED_M },
];

/** Đầu tầng chạm vị trí này (tỉ lệ chiều cao màn hình) thì được tính là "đã tới" mốc. */
const ARRIVE_AT = 0.35;

export type Anchor = { id: string; meters: number; at: number; el: HTMLElement };
export type DepthState = { y: number; max: number; progress: number; meters: number };

let anchors: Anchor[] = [];
let max = 0;
let state: DepthState = { y: 0, max: 0, progress: 0, meters: 0 };
const subs = new Set<(s: DepthState) => void>();
const measureSubs = new Set<() => void>();

export const getAnchors = () => anchors;
export const getState = () => state;
export const docMax = () => max;

/** Đăng ký nhận trạng thái mỗi khung hình có cuộn. Trả về hàm huỷ. */
export function subscribe(fn: (s: DepthState) => void) {
  subs.add(fn);
  fn(state);
  return () => subs.delete(fn);
}
/** Đăng ký chạy lại khi bố cục đổi (resize, ảnh/font tải xong). */
export function onMeasure(fn: () => void) {
  measureSubs.add(fn);
  return () => measureSubs.delete(fn);
}

function metersAt(y: number) {
  if (!anchors.length) return 0;
  if (y <= anchors[0].at) return anchors[0].meters;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1], b = anchors[i];
    if (y >= b.at - 1 && y <= b.at + 1) return b.meters; // trong 1px của mốc = đúng mốc (cuộn hay lẻ phần thập phân)
    if (y <= b.at) return a.meters + ((y - a.at) / Math.max(1, b.at - a.at)) * (b.meters - a.meters);
  }
  return anchors[anchors.length - 1].meters;
}

function measure() {
  const root = document.documentElement;
  max = Math.max(0, root.scrollHeight - innerHeight);
  const present = STOPS.map((s) => ({ ...s, el: document.getElementById(s.id) })).filter((s) => s.el) as Omit<Anchor, 'at'>[];
  anchors = present.map((s, i) => {
    const top = s.el.getBoundingClientRect().top + scrollY;
    let at = Math.min(max, Math.max(0, top - innerHeight * ARRIVE_AT));
    if (i === 0) at = 0;
    if (i === present.length - 1) at = max; // tới đáy trang = tới đáy biển
    return { ...s, at };
  });
  for (let i = 1; i < anchors.length; i++) anchors[i].at = Math.max(anchors[i].at, anchors[i - 1].at + 1);
  measureSubs.forEach((fn) => fn());
}

function update() {
  let y = Math.min(max, Math.max(0, scrollY));
  if (max - y < 1) y = max;
  const progress = max > 0 ? y / max : 0;
  state = { y, max, progress, meters: metersAt(y) };
  document.documentElement.style.setProperty('--depth', progress.toFixed(5));
  subs.forEach((fn) => fn(state));
}

let raf = 0;
const onScroll = () => {
  if (raf) return;
  raf = requestAnimationFrame(() => { raf = 0; update(); });
};
const onLayout = () => { measure(); update(); };
let ro: ResizeObserver | null = null;

export function init() {
  measure();
  update();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onLayout);
  ro = new ResizeObserver(onLayout); // chiều cao trang đổi khi font/ảnh tải xong
  ro.observe(document.body);
  // Lưới an toàn: ResizeObserver/rAF bị hoãn khi tab chạy nền
  addEventListener('load', onLayout, { once: true });
  document.fonts?.ready.then(onLayout);
}

export function destroy() {
  removeEventListener('scroll', onScroll);
  removeEventListener('resize', onLayout);
  removeEventListener('load', onLayout);
  ro?.disconnect();
  cancelAnimationFrame(raf);
  document.documentElement.style.removeProperty('--depth');
}
