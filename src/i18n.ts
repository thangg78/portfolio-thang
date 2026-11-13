/**
 * Đổi ngôn ngữ VI / EN. HTML đã có sẵn tiếng Việt (đổ lúc build từ content/vi.json),
 * JS chỉ tải bộ chữ còn lại khi người dùng bấm, rồi thay theo data-i18n / data-i18n-list / data-i18n-attr.
 */
export type Lang = 'vi' | 'en';
type Dict = Record<string, unknown>;

import viDict from '../content/vi.json';

const STORAGE_KEY = 'lang';
// Tiếng Việt (mặc định) gói sẵn trong mã chính: không tốn thêm một lượt mạng trước khi intro/nhãn chạy (LCP trên mobile).
// Tiếng Anh tải khi cần.
const loaders: Record<Lang, () => Promise<Dict>> = {
  vi: () => Promise.resolve(viDict as Dict),
  en: () => import('../content/en.json').then((m) => m.default as Dict),
};

let current: Lang = 'vi';
let dict: Dict | null = null;
const listeners = new Set<(lang: Lang, d: Dict) => void>();

function lookup(d: Dict, key: string): unknown {
  return key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Dict)[k] : undefined), d);
}

export function t(key: string): string {
  const v = dict ? lookup(dict, key) : undefined;
  return typeof v === 'string' ? v : '';
}

export function onLangChange(fn: (lang: Lang, d: Dict) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function apply(root: ParentNode, d: Dict) {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const v = lookup(d, el.dataset.i18n!);
    if (typeof v === 'string') el.textContent = v;
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-list]').forEach((el) => {
    const v = lookup(d, el.dataset.i18nList!);
    if (Array.isArray(v)) el.replaceChildren(...v.map((s) => Object.assign(document.createElement('li'), { textContent: String(s) })));
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr!.split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const v = lookup(d, key);
      if (typeof v === 'string') el.setAttribute(attr, v);
    }
  });
  // Trang case study (<body data-case="ps">): "Tên dự án · Tên trang", mô tả = câu tóm tắt của dự án
  const caseId = document.body.dataset.case;
  const site = lookup(d, 'meta.title');
  const caseTitle = caseId ? lookup(d, `${caseId}.title`) : undefined;
  const title = typeof caseTitle === 'string' ? `${caseTitle} · ${site}` : site;
  if (typeof title === 'string') document.title = title;
  const desc = caseId ? lookup(d, `${caseId}.summary`) : lookup(d, 'meta.description');
  if (typeof desc === 'string') document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
}

export async function setLang(lang: Lang, save = true) {
  dict = await loaders[lang]();
  current = lang;
  document.documentElement.lang = lang;
  apply(document, dict);
  if (save) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* chế độ riêng tư: bỏ qua */ }
  }
  listeners.forEach((fn) => fn(lang, dict!));
}

export function initI18n() {
  let saved: string | null = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* bỏ qua */ }
  const start: Lang = saved === 'en' ? 'en' : 'vi';

  // Tiếng Việt đã có trong HTML; vẫn nạp từ điển để t() dùng được.
  const ready = start === 'vi' ? loaders.vi().then((d) => { dict = d; }) : setLang('en', false);

  document.querySelectorAll<HTMLButtonElement>('[data-lang-toggle]').forEach((btn) =>
    btn.addEventListener('click', () => setLang(current === 'vi' ? 'en' : 'vi')),
  );
  return ready;
}
