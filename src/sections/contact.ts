import { t, onLangChange } from '../i18n';
import { bubblesAt } from '../effects/bubbles';

/** Copy email (hiệu ứng phụ 6: chữ "Đã copy" 2 giây + bong bóng) và đồng hồ giờ Việt Nam. */
export function initContact() {
  const btn = document.querySelector<HTMLButtonElement>('[data-copy]');
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  let timer = 0;

  btn?.addEventListener('click', async (e) => {
    const value = btn.dataset.copy!;
    // Điểm nổi bong bóng: nơi bấm chuột, hoặc giữa nút khi bấm bằng bàn phím (detail = 0)
    const r = btn.getBoundingClientRect();
    const at = e.detail > 0 ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const say = (key: string) => {
      btn.textContent = t(key);
      if (status) status.textContent = t(key);
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        btn.textContent = t('contact.copy');
        if (status) status.textContent = '';
      }, 2000);
    };
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      // Clipboard API bị chặn (iframe, quyền): chọn sẵn địa chỉ rồi thử cách copy cũ
      const a = document.querySelector('.contact__address');
      if (a) getSelection()?.selectAllChildren(a);
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      if (ok) getSelection()?.removeAllRanges(); // đã copy được thì bỏ vùng bôi đen
    }
    if (ok) {
      say('contact.copied');
      bubblesAt(at.x, at.y);
    } else {
      say('contact.copyManual'); // "Đã chọn sẵn, nhấn Ctrl+C"
    }
  });

  const clock = document.querySelector<HTMLTimeElement>('[data-vn-clock]');
  if (!clock) return;
  let lang = document.documentElement.lang;
  const tick = () => {
    const now = new Date();
    clock.textContent = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);
    clock.dateTime = now.toISOString();
  };
  tick();
  // Cập nhật đúng đầu mỗi phút
  window.setTimeout(() => { tick(); window.setInterval(tick, 60_000); }, 60_000 - (Date.now() % 60_000));
  onLangChange((l) => { lang = l; tick(); }); // sống suốt vòng đời trang, không cần huỷ
}
