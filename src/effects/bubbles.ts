/**
 * Hiệu ứng phụ 6 (phần chuyển động): bong bóng nổi lên từ điểm bấm khi copy email.
 * Không chạy khi giảm chuyển động / tắt hiệu ứng.
 */
import { motionAllowed } from '../core/motion';

let layer: HTMLDivElement | null = null;

export async function bubblesAt(x: number, y: number, count = 9) {
  if (!motionAllowed()) return;
  const { gsap } = await import('gsap'); // tải lúc cần, không nằm trong gói chính
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'bubbles';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
  }
  for (let i = 0; i < count; i++) {
    const b = document.createElement('span');
    b.className = 'bubble';
    const size = 6 + Math.random() * 10;
    Object.assign(b.style, { width: `${size}px`, height: `${size}px`, left: `${x}px`, top: `${y}px` });
    layer.append(b);
    const rise = 90 + Math.random() * 110;
    const drift = (Math.random() - 0.5) * 60;
    gsap.fromTo(
      b,
      { x: (Math.random() - 0.5) * 24, y: 0, opacity: 0, scale: 0.4 },
      {
        keyframes: [
          { opacity: 1, scale: 1, duration: 0.18, ease: 'power2.out' },
          { y: -rise, x: `+=${drift}`, duration: 0.9 + Math.random() * 0.5, ease: 'sine.out' },
          { opacity: 0, duration: 0.25, ease: 'power1.in' },
        ],
        delay: i * 0.03,
        onComplete: () => b.remove(),
      },
    );
  }
}
