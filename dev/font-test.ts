import '../src/styles/main.css';

const TEST = 'Ưu ắ ẵ ệ ỗ ữ ỹ Đ Nguyễn Thắng'.normalize('NFC');
const SIZE = 200; // px, đo ở cỡ lớn

type Family = { name: string; weights: number[] };
const FAMILIES: Family[] = [
  { name: 'Unbounded', weights: [200, 400, 700, 900] },
  { name: 'Bricolage Grotesque', weights: [400, 700, 800] },
];

const $ = (id: string) => document.getElementById(id)!;

// 1. Mẫu hiển thị
const spec = $('specimens');
for (const f of FAMILIES) {
  for (const w of f.weights) {
    const label = document.createElement('p');
    label.className = 'label';
    label.textContent = `${f.name.toUpperCase()} · ${w}`;
    const p = document.createElement('p');
    p.className = `specimen ${f.name === 'Unbounded' ? 'unb' : 'bri'}`;
    p.style.fontWeight = String(w);
    p.textContent = TEST;
    spec.append(label, p);
  }
}

// 2. Đo
async function measure() {
  await Promise.all(
    FAMILIES.flatMap((f) => f.weights.map((w) => document.fonts.load(`${w} ${SIZE}px "${f.name}"`, TEST))),
  );
  await document.fonts.ready;

  const ctx = document.createElement('canvas').getContext('2d')!;
  const leading = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--leading-display'));
  const chars = [...new Set([...TEST.replace(/\s/g, '')])];

  let html = '';
  for (const f of FAMILIES) {
    for (const w of f.weights) {
      // Fallback: so độ rộng với hai font dự phòng khác nhau. Nếu khác nhau → ký tự rơi về font khác.
      const fallen: string[] = [];
      let maxAsc = 0, maxDesc = 0, fontAsc = 0, fontDesc = 0, worstAscChar = '';
      for (const ch of chars) {
        ctx.font = `${w} ${SIZE}px "${f.name}", monospace`;
        const a = ctx.measureText(ch);
        ctx.font = `${w} ${SIZE}px "${f.name}", serif`;
        const b = ctx.measureText(ch);
        if (Math.abs(a.width - b.width) > 0.01) fallen.push(ch);
        if (a.actualBoundingBoxAscent > maxAsc) { maxAsc = a.actualBoundingBoxAscent; worstAscChar = ch; }
        maxDesc = Math.max(maxDesc, a.actualBoundingBoxDescent);
        fontAsc = a.fontBoundingBoxAscent;
        fontDesc = a.fontBoundingBoxDescent;
      }
      const loaded = document.fonts.check(`${w} ${SIZE}px "${f.name}"`, TEST);
      // Với line-height L, mỗi dòng có hộp cao L*size; nửa khoảng dư chia đều trên dưới quanh (fontAsc+fontDesc).
      const halfLeading = (leading * SIZE - (fontAsc + fontDesc)) / 2;
      const topRoom = fontAsc + halfLeading; // khoảng từ baseline lên mép trên hộp dòng
      const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--display-clip-pad')) * SIZE; // em → px
      const clipsLineBox = maxAsc > topRoom + 0.5; // không đệm
      const clipsTop = maxAsc > topRoom + pad + 0.5; // có đệm --display-clip-pad
      const needLeading = (Math.max(maxAsc, fontAsc) * 2 - (fontAsc - fontDesc)) / SIZE; // line-height tối thiểu để dấu cao nhất không vượt mép trên
      const r = (n: number) => (n / SIZE).toFixed(3);
      html += `<tr>
        <td>${f.name} ${w}</td>
        <td class="${loaded ? 'ok' : 'bad'}">${loaded ? 'đã tải' : 'CHƯA TẢI'}</td>
        <td class="${fallen.length ? 'bad' : 'ok'}">${fallen.length ? 'RƠI: ' + fallen.join(' ') : 'không ký tự nào'}</td>
        <td>${r(maxAsc)} em (${worstAscChar}) / font ${r(fontAsc)} em</td>
        <td>${r(maxDesc)} em / font ${r(fontDesc)} em</td>
        <td>${needLeading.toFixed(3)}</td>
        <td class="${clipsLineBox ? 'bad' : 'ok'}">${clipsLineBox ? 'vượt hộp dòng' : 'trong hộp dòng'}</td>
        <td class="${clipsTop ? 'bad' : 'ok'}">${clipsTop ? 'BỊ CẮT' : 'không cắt'}</td>
      </tr>`;
      (window as any).__fontReport ??= [];
      (window as any).__fontReport.push({ family: f.name, weight: w, loaded, fallen, maxAsc: +r(maxAsc), worstAscChar, fontAsc: +r(fontAsc), maxDesc: +r(maxDesc), fontDesc: +r(fontDesc), needLeading: +needLeading.toFixed(3), clipsLineBox, clipsTop, leading });
    }
  }
  $('report').innerHTML = `<p class="body">Chuỗi: <code>${TEST}</code> ở ${SIZE}px. Line-height hiện tại <code>--leading-display: ${leading}</code>.</p>
  <table><thead><tr><th>Font</th><th>Tải</th><th>Rơi về font khác</th><th>Đỉnh dấu cao nhất / ascent font</th><th>Đáy thấp nhất / descent font</th><th>Line-height tối thiểu</th><th>Hộp dòng @ ${leading}</th><th>overflow:hidden + đệm</th></tr></thead><tbody>${html}</tbody></table>`;
}

// 3. Tương phản
function lum(hex: string) {
  const c = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a: string, b: string) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const cs = getComputedStyle(document.documentElement);
const tok = (n: string) => (n.startsWith('#') ? n.slice(1) : cs.getPropertyValue(`--${n}`).trim().replace('#', '')).toUpperCase();
// [chữ/thành phần, nền, ngưỡng cần đạt, dùng cho]. Ngưỡng 4.5 = chữ thường, 3 = chữ lớn hoặc viền thành phần UI.
type Need = 4.5 | 3;
const PAIRS: [string, string, Need, string][] = [
  // Mặt nước (foam)
  ['deep', 'foam', 4.5, 'Chữ thường trên mặt nước'],
  ['mid', 'foam', 4.5, 'Chữ phụ, nhãn trên mặt nước'],
  ['ocean-ink', 'foam', 4.5, 'Liên kết trên mặt nước'],
  ['foam', 'ocean-ink', 4.5, 'Chữ trên nút (nền sáng)'],
  ['foam', 'ocean-ink-hover', 4.5, 'Chữ trên nút khi hover (nền sáng)'],
  ['ocean-ink', 'foam', 3, 'Viền focus, nền nút so với mặt nước'],
  // Tầng 1 (shallow)
  ['deep', 'shallow', 4.5, 'Chữ thường tầng 1'],
  ['mid', 'shallow', 4.5, 'Chữ phụ, nhãn tầng 1'],
  ['ocean-ink', 'shallow', 4.5, 'Liên kết tầng 1'],
  // Tầng 2 (mid)
  ['foam', 'mid', 4.5, 'Chữ thường tầng 2'],
  ['shallow', 'mid', 4.5, 'Chữ phụ, nhãn tầng 2'],
  ['light', 'mid', 4.5, 'Liên kết, focus tầng 2'],
  ['deep', 'light', 4.5, 'Chữ trên nút / mảng --light'],
  ['deep', 'shallow', 4.5, 'Số trên mảng "Vừa" (triage)'],
  ['deep', 'coral', 4.5, 'Số trên mảng "Nặng" (triage), nhãn dev'],
  // Tầng sâu (deep)
  ['foam', 'deep', 4.5, 'Chữ thường tầng sâu'],
  ['shallow', 'deep', 4.5, 'Chữ phụ tầng sâu'],
  ['light', 'deep', 4.5, 'Liên kết, số đo, focus tầng sâu'],
  ['foam', 'ocean', 3, 'Chữ lớn (19px đậm) trên nút, nền sâu'],
  ['foam', '#3D80FF', 3, 'Chữ lớn trên nút khi hover, nền sâu'],
  ['ocean', 'deep', 3, 'Nền nút so với nền sâu'],
  // Màu gốc KHÔNG được dùng cho chữ (giữ để thấy vì sao)
  ['ocean', 'foam', 4.5, 'KHÔNG DÙNG: --ocean làm chữ trên nền sáng'],
  ['ocean', 'mid', 3, 'KHÔNG DÙNG: --ocean trên tầng giữa'],
  ['coral', 'foam', 3, 'KHÔNG DÙNG: --coral làm chữ trên nền sáng'],
];
const contrastRows = PAIRS.map(([fg, bg, need, use]) => {
  const v = ratio(tok(fg), tok(bg));
  const pass = v >= need;
  const banned = use.startsWith('KHÔNG DÙNG');
  const status = banned ? (pass ? 'đạt (vẫn cấm)' : 'không đạt → đã cấm') : pass ? 'đạt' : 'KHÔNG ĐẠT';
  const cls = banned ? '' : pass ? 'ok' : 'bad';
  const name = (n: string) => (n.startsWith('#') ? n : `--${n}`);
  return { fg, bg, need, use, v: +v.toFixed(2), pass, banned, html: `<tr><td><span class="swatch" style="background:#${tok(fg)}"></span> ${name(fg)}</td><td><span class="swatch" style="background:#${tok(bg)}"></span> ${name(bg)}</td><td>${v.toFixed(2)}:1</td><td>${need}:1</td><td class="${cls}">${status}</td><td>${use}</td></tr>` };
});
const failing = contrastRows.filter((r) => !r.banned && !r.pass).length;
$('contrast').innerHTML = `<p class="body ${failing ? 'bad' : 'ok'}">${failing ? failing + ' cặp đang dùng KHÔNG đạt' : 'Mọi cặp đang dùng đều đạt.'}</p><table><thead><tr><th>Chữ / thành phần</th><th>Nền</th><th>Tỷ lệ</th><th>Cần</th><th>Kết quả</th><th>Dùng cho</th></tr></thead><tbody>${contrastRows.map((r) => r.html).join('')}</tbody></table>`;
(window as any).__contrast = contrastRows.map(({ html, ...r }) => r);

measure();
