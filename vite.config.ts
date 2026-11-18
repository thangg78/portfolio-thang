import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import vi from './content/vi.json' with { type: 'json' };
import projects from './content/projects.json' with { type: 'json' };

type Dict = Record<string, unknown>;

/** Đường dẫn gốc khi đăng. GitHub Pages: BASE_PATH=/portfolio-thang/ (đặt trong workflow). Chạy dev: '/'. */
const BASE = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function lookup(dict: Dict, key: string): unknown {
  return key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Dict)[k] : undefined), dict);
}

function text(dict: Dict, key: string): string {
  const v = lookup(dict, key);
  if (typeof v !== 'string') throw new Error(`[i18n] Thiếu khoá chuỗi "${key}" trong content/vi.json`);
  return v;
}

/**
 * Đổ chữ tiếng Việt vào HTML lúc build để trang đọc được khi tắt JavaScript.
 * Toàn bộ chữ vẫn chỉ nằm trong content/*.json; JS (src/i18n.ts) dùng cùng các thuộc tính để đổi ngôn ngữ.
 *   <p data-i18n="hero.role"></p>               → chữ
 *   <ul data-i18n-list="ps.method"></ul>          → các <li>
 *   <img data-i18n-attr="alt:ps.coverAlt">       → thuộc tính
 *   {{meta.title}}                                → chữ (dùng trong <title>, <meta>)
 *   <!--project:karsia--> … <!--/project:karsia--> → gỡ khỏi bản build nếu published: false
 *   <!--draft:ps--> … <!--/draft:ps-->             → gỡ khỏi bản build nếu reflectionConfirmed khác true
 */
function i18nHtml(): Plugin {
  let isBuild = false;
  return {
    name: 'i18n-html',
    configResolved(c) {
      isBuild = c.command === 'build';
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const d = vi as Dict;
        const proj = projects as Record<string, { published?: boolean; slug?: string; reflectionConfirmed?: boolean }>;

        // Mục nháp (Claude suy ra, Thắng chưa xác nhận): gỡ khỏi bản build; dev hiện kèm nhãn "Nháp"
        html = html.replace(/<!--draft:([\w-]+)-->([\s\S]*?)<!--\/draft:\1-->/g, (_m, id: string, body: string) => {
          if (proj[id]?.reflectionConfirmed === true) return body;
          if (isBuild) return '';
          return body.replace(/<section\b/, `<section data-unpublished="${esc(text(d, 'nav.draft'))}"`);
        });

        html = html.replace(/<!--project:([\w-]+)-->([\s\S]*?)<!--\/project:\1-->/g, (_m, id: string, body: string) => {
          if (proj[id]?.published !== false) return body;
          if (isBuild) return '';
          return body.replace(`data-project="${id}"`, `data-project="${id}" data-unpublished="${esc(text(d, 'nav.unpublished'))}"`);
        });

        html = html.replace(/<([a-z0-9]+)(\s[^>]*?)?\sdata-i18n-list="([^"]+)"([^>]*)><\/\1>/g, (_m, tag, a = '', key, b) => {
          const list = lookup(d, key);
          if (!Array.isArray(list)) throw new Error(`[i18n] "${key}" phải là mảng`);
          return `<${tag}${a} data-i18n-list="${key}"${b}>${list.map((s) => `<li>${esc(String(s))}</li>`).join('')}</${tag}>`;
        });

        html = html.replace(/<([a-z0-9]+)(\s[^>]*?)?\sdata-i18n="([^"]+)"([^>]*)><\/\1>/g, (_m, tag, a = '', key, b) =>
          `<${tag}${a} data-i18n="${key}"${b}>${esc(text(d, key))}</${tag}>`,
        );

        html = html.replace(/data-i18n-attr="([^"]+)"/g, (m, spec: string) => {
          const attrs = spec.split(';').map((p) => {
            const [attr, key] = p.split(':').map((s) => s.trim());
            return `${attr}="${esc(text(d, key))}"`;
          });
          return `${m} ${attrs.join(' ')}`;
        });

        html = html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key) => esc(text(d, key)));
        return html;
      },
    },
  };
}

/**
 * Khi build: chép thẳng CSS (một file, ~7 KB gzip) vào <style> của mỗi trang thay cho <link>.
 * Bỏ một lượt mạng chặn hiển thị trước lần vẽ đầu, và font được trình duyệt phát hiện ngay trong HTML → FCP/LCP sớm hơn trên mobile.
 * URL font trong CSS là đường dẫn tuyệt đối /assets/... nên vẫn đúng ở mọi trang.
 */
function inlineCss(): Plugin {
  let base = '/';
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    configResolved(c) { base = c.base; },
    generateBundle(_opts, bundle) {
      const css = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName.endsWith('.css'));
      if (!css || css.type !== 'asset') return;
      const code = String(css.source);
      for (const f of Object.values(bundle)) {
        if (f.type !== 'asset' || !f.fileName.endsWith('.html')) continue;
        f.source = String(f.source).replace(
          new RegExp(`<link rel="stylesheet"[^>]*href="${(base + css.fileName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`),
          () => `<style>${code}</style>`,
        );
      }
    },
  };
}

/**
 * Sau khi build: gỡ khỏi dist/ những gì Vite chép nguyên từ public/ nhưng KHÔNG được công khai:
 * - tài liệu làm việc trong public/work (đặc tả, file zip ảnh, ảnh tổng hợp);
 * - ảnh của dự án khách hàng chưa được phép đăng (published: false) — ẩn trang thôi chưa đủ, ảnh vẫn mở được bằng đường dẫn.
 * Chỉ xoá trong dist/, không đụng tới file gốc trong public/.
 */
function pruneUnpublished(): Plugin {
  let outDir = 'dist';
  return {
    name: 'prune-unpublished',
    apply: 'build',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir); },
    closeBundle() {
      const work = path.join(outDir, 'work');
      const remove = ['PORTFOLIO_SPEC.md', 'portfolio-images.zip', 'contact.png'].map((f) => path.join(work, f));
      for (const [id, p] of Object.entries(projects as Record<string, { published?: boolean; slug?: string }>)) {
        if (!id.startsWith('_') && p.slug && p.published === false) remove.push(path.join(work, p.slug));
      }
      for (const target of remove) fs.rmSync(target, { recursive: true, force: true });
    },
  };
}

/**
 * Khi trang nằm trong thư mục con (GitHub Pages /portfolio-thang/): thêm gốc vào mọi đường dẫn bắt đầu bằng "/"
 * trong HTML mà Vite không tự sửa: liên kết <a href="/work/…">, "/#tang-1", favicon, ảnh trong public/ (src, srcset).
 * Không đụng tới "//…" và đường dẫn đã có gốc.
 */
function basePaths(): Plugin {
  let base = '/';
  return {
    name: 'base-paths',
    apply: 'build',
    configResolved(c) { base = c.base; },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (base === '/') return html;
        const fix = (u: string) => (u.startsWith('/') && !u.startsWith('//') && !u.startsWith(base) ? base + u.slice(1) : u);
        html = html.replace(/\b(href|src)="([^"]*)"/g, (_m, a: string, u: string) => `${a}="${fix(u)}"`);
        html = html.replace(/\bsrcset="([^"]*)"/g, (_m, v: string) =>
          `srcset="${v.split(',').map((part) => part.trim().replace(/^(\S+)/, (u) => fix(u))).join(', ')}"`,
        );
        return html;
      },
    },
  };
}

// Trang case study: chỉ build trang của dự án đã được phép công khai
const caseInputs = Object.fromEntries(
  Object.entries(projects as Record<string, { published?: boolean; slug?: string }>)
    .filter(([id, p]) => !id.startsWith('_') && p.slug && p.published !== false)
    .map(([id, p]) => [`case-${id}`, `work/${p.slug}/index.html`]),
);

export default defineConfig({
  base: BASE,
  plugins: [i18nHtml(), basePaths(), inlineCss(), pruneUnpublished()],
  build: {
    // Một file CSS duy nhất: tránh thêm yêu cầu CSS chặn hiển thị cho phần dùng chung giữa các trang
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        ...caseInputs,
        // dev/font-test.html (bước 1) chỉ dùng khi chạy dev, không đưa vào bản build.
      },
    },
  },
});
