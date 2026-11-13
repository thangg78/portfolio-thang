/** Điểm vào của trang case study (/work/*). */
import './styles/main.css';
import { initI18n } from './i18n';
import { initMotion } from './core/motion';
import * as compareSlider from './effects/compare-slider';

initI18n().then(() => {
  initMotion();
  compareSlider.init(); // KARSIA: thanh kéo trước/sau (trang khác không có .compare thì không làm gì)
});
