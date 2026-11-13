import './styles/main.css';
import { initI18n } from './i18n';
import { initContact } from './sections/contact';
import { initMotion } from './core/motion';
import * as scrollDepth from './core/scroll-depth';
import * as depthGauge from './effects/depth-gauge';
import * as nameReveal from './effects/name-reveal';
import * as compareSlider from './effects/compare-slider';
import * as intro from './effects/intro';
import { onMotionChange } from './core/motion';
import { onLangChange } from './i18n';

// Chỉ khi dev: ?shot=900 khoá chiều cao "một màn hình" để chụp nguyên trang bằng trình duyệt headless.
if (import.meta.env.DEV) {
  const shot = Number(new URLSearchParams(location.search).get('shot'));
  if (shot > 0) {
    document.documentElement.style.setProperty('--screen-h', `${shot}px`);
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => img.setAttribute('loading', 'eager'));
  }
}

// Tên ở Hero: tách ký tự ngay, không chờ bộ chữ (tên giống nhau ở hai ngôn ngữ) → giảm thời gian tên bị ẩn.
// Nếu intro sẽ chạy, intro tự "gõ" tên nên hiệu ứng trồi lên tự động được hoãn.
const introWill = intro.shouldRun();
nameReveal.init({ defer: introWill });

/**
 * Vào trang bằng liên kết có neo (vd. "Về mặt nước" từ case study → /#tang-1): bảo đảm trang tới đúng tầng.
 * Có trình duyệt không tự cuộn tới neo khi tải (đã gặp trong trình duyệt nhúng). Chỉ cuộn khi trang vẫn đứng ở đầu
 * — trình duyệt đã tự cuộn, hoặc người dùng đã cuộn, thì không động vào.
 */
function ensureHashTarget() {
  const id = decodeURIComponent(location.hash.slice(1));
  const el = id ? document.getElementById(id) : null;
  if (!el) return;
  const go = () => { if (scrollY < 4 && el.getBoundingClientRect().top > 4) el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' }); };
  (document.fonts?.ready ?? Promise.resolve()).then(() => setTimeout(go, 50));
}
ensureHashTarget();

/** Chạy khi trình duyệt rảnh, sau khi trang đã tải (để Three.js không chen vào LCP). */
function whenIdle(fn: () => void) {
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });
}

initI18n().then(() => {
  initContact();
  initMotion();
  /*
   * Màu nước: mỗi phần tự tô nền, các dải .thermocline nối màu giữa hai tầng, nên nền đổi màu liền mạch
   * theo vị trí cuộn mà trình duyệt cuộn trực tiếp (không trễ khung hình, không cần JS, giữ nguyên khi giảm chuyển động).
   * --depth (0 → 1) do scroll-depth tính, dùng cho thước đo và ánh sáng mặt nước ở Hero.
   */
  scrollDepth.init();
  depthGauge.init();
  compareSlider.init();

  // Intro "đàn con trỏ dựng trang": lần vào đầu tiên trong phiên (điều kiện do script ở <head> quyết định)
  const introDone = introWill ? intro.run() : Promise.resolve();
  const renderReplay = intro.bindReplay();
  onMotionChange(renderReplay);
  onLangChange(renderReplay);

  // WebGL (Three.js ở chunk riêng): tải sau khi nội dung chính đã hiện.
  // Khi intro chạy: đợi intro xong mới tải và khởi tạo (đọc ~500 KB JS + biên dịch shader chặn main thread
  // khoảng 2 s trên máy yếu, làm intro giật). Trong lúc intro, mặt nước bị bản vẽ che nên không cần sớm hơn.
  introDone.then(() => whenIdle(() => {
    import('./effects/hero-water').then((m) => {
      const ok = m.init();
      if (import.meta.env.DEV) Object.assign(window, { __heroWater: m, __heroWaterOk: ok });
    });
    // Ảnh bìa gợn sóng: chỉ màn ≥ 768 px có chuột (module tự kiểm tra và tự bật/tắt)
    if (matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches) {
      import('./effects/cover-ripple').then((m) => {
        m.init();
        if (import.meta.env.DEV) Object.assign(window, { __coverRipple: m });
      });
    }
  }));

  if (import.meta.env.DEV) {
    Object.assign(window, { __depth: scrollDepth });
    // ?y=0.42 → cuộn tức thì tới 42% trang (để chụp khung nhìn bằng trình duyệt headless)
    const y = Number(new URLSearchParams(location.search).get('y'));
    if (y > 0) scrollTo({ top: y * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' });
  }
});
