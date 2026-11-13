/**
 * Cờ chuyển động dùng chung cho mọi hiệu ứng.
 * Tắt chuyển động khi: hệ điều hành bật prefers-reduced-motion, HOẶC người dùng bấm "Tắt hiệu ứng" (lưu localStorage).
 * Chuyển màu theo độ sâu và thước đo vẫn chạy (đặc tả mục 7): chúng bám theo cuộn, không tự chuyển động.
 */
import { t, onLangChange } from '../i18n';

const KEY = 'fx';
const mq = matchMedia('(prefers-reduced-motion: reduce)');
let userOff = false;
try { userOff = localStorage.getItem(KEY) === 'off'; } catch { /* bỏ qua */ }

const subs = new Set<(allowed: boolean) => void>();
export const motionAllowed = () => !mq.matches && !userOff;

// Chuyển trang (View Transitions): giảm chuyển động đã tắt bằng CSS; nút "Tắt hiệu ứng" thì bỏ qua ở đây.
// Đăng ký ngay khi module nạp, vì pagereveal bắn trước lần vẽ đầu tiên.
const skipViewTransition = (e: Event) => {
  const vt = (e as Event & { viewTransition?: { skipTransition(): void } }).viewTransition;
  if (import.meta.env.DEV) {
    try { sessionStorage.setItem(`dev:${e.type}`, JSON.stringify({ hadTransition: !!vt, skipped: !!vt && !motionAllowed(), at: location.pathname })); } catch { /* bỏ qua */ }
  }
  if (!motionAllowed()) vt?.skipTransition();
};
addEventListener('pageswap', skipViewTransition);
addEventListener('pagereveal', skipViewTransition);

/** Đăng ký nhận thay đổi. Gọi ngay một lần với giá trị hiện tại. Trả về hàm huỷ. */
export function onMotionChange(fn: (allowed: boolean) => void) {
  subs.add(fn);
  fn(motionAllowed());
  return () => { subs.delete(fn); };
}

let btn: HTMLButtonElement | null = null;

function renderButton() {
  if (!btn) return;
  // Thiết bị đã bật giảm chuyển động: nút chỉ báo trạng thái (vẫn focus được để đọc), không bật lại được
  btn.setAttribute('aria-disabled', String(mq.matches));
  btn.setAttribute('aria-pressed', String(!motionAllowed()));
  btn.textContent = mq.matches ? t('nav.fxSystem') : motionAllowed() ? t('nav.fxOff') : t('nav.fxOn');
}

function emit() {
  document.documentElement.classList.toggle('fx-off', !motionAllowed());
  renderButton();
  subs.forEach((fn) => fn(motionAllowed()));
}

export function initMotion() {
  btn = document.querySelector<HTMLButtonElement>('[data-fx-toggle]');
  btn?.addEventListener('click', () => {
    if (mq.matches) return;
    userOff = !userOff;
    try { localStorage.setItem(KEY, userOff ? 'off' : 'on'); } catch { /* bỏ qua */ }
    emit();
  });
  mq.addEventListener('change', emit);
  onLangChange(renderButton);
  emit();
}
