# Tiến độ — Portfolio Nguyễn Thắng

Đặc tả: `public/work/PORTFOLIO_SPEC.md` (đọc hết trước khi làm).
File này là nguồn sự thật cho phiên làm việc và cho tác vụ watchdog tự tiếp tục.

## Khoá (heartbeat)

- heartbeat: 2026-11-12T13:40:00+07:00
- owner: hoàn thành 8 bước, chờ người dùng
- watchdog: ĐÃ TẮT (tác vụ `portfolio-watchdog` bị tạm dừng theo yêu cầu, 2026-11-12). Bật lại trong mục Scheduled của app nếu cần.

Quy ước: phiên nào đang làm thì cập nhật `heartbeat` (giờ địa phương, ISO 8601) mỗi khi xong một việc con.
Watchdog CHỈ được làm tiếp nếu heartbeat cũ hơn 45 phút (phiên trước đã dừng, ví dụ do hết token).

## Trạng thái các bước (mục 8 của đặc tả)

- [x] Bước 1 — Khung Vite, token màu/chữ, kiểm tra font. Đã báo kết quả; người dùng chốt Unbounded.
- [x] Bước 2 — HTML và CSS tĩnh cho cả trang, nội dung thật mục 3. Chụp ảnh 390 và 1440 px. Đã báo cáo, chờ duyệt.
- [x] Bước 3 — Chuyển màu theo độ sâu, thước đo độ sâu. Đã báo cáo, chờ duyệt.
  - [x] `src/core/scroll-depth.ts`: --depth 0→1, số mét nội suy giữa các mốc (0 / 10 / 200 / 1.000 m / đáy 1.200 m)
  - [x] Màu nước: ĐÃ THỬ lớp nước cố định dịch bằng JS (`water.ts`) rồi BỎ — nền trễ nội dung 1 khung hình khi cuộn nhanh.
        Giữ nền từng phần + dải thermocline (trình duyệt tự cuộn, không trễ). --depth dành cho thước đo và ánh sáng bước 4.
  - [x] `src/effects/depth-gauge.ts`: thước đo mép phải thay thanh cuộn, mốc là liên kết, kéo được
  - [x] Đo tương phản ở mọi vị trí cuộn (`dev/contrast-audit.js`); bàn phím; 390 và 1440 px
  - [x] Báo cáo bước 3
- [x] Bước 4 — Mặt nước WebGL ở Hero + dự phòng. Đã báo cáo, chờ duyệt.
  - [x] Three.js 0.187 + `src/core/motion.ts` (reduced-motion + nút "Tắt hiệu ứng", lưu lựa chọn trong localStorage `fx`)
  - [x] `src/effects/hero-water.ts`: shader caustics + gợn theo con trỏ; chỉ làm SÁNG nền (đọc điểm ảnh: min = đúng --shallow)
  - [x] Chìm theo --depth (ánh sáng giảm, hoa văn trôi chậm hơn nội dung); dừng khi ra khỏi khung/tab ẩn; < 768 px độ phân giải 0,5;
        tải động sau `load` + lúc rảnh (chunk riêng 132 KB gzip, không nằm trong entry)
  - [x] Dự phòng: không WebGL → `init()` trả false, giữ gradient CSS; giảm chuyển động/tắt hiệu ứng → 1 khung tĩnh
  - [x] Nền Hero đổi: foam chỉ ở 8% trên, shallow từ 55% (để vệt sáng thấy được); hero.css khớp với shader
  - [x] Báo cáo bước 4
- [x] Bước 5 — Hiệu ứng chữ, ảnh bìa, chuyển trang case study. Đã báo cáo, chờ duyệt.
  - [x] GSAP 3.15.0 (ghim, tải động khi copy email); khung tối thiểu 3 trang `/work/*` (`src/case.ts`, `src/styles/case.css`);
        trang của dự án unpublished không được build (vite.config đọc projects.json)
  - [x] HU1 `name-reveal.ts`: trồi lên + độ đậm 600–800 theo con trỏ; CLS khi quét = 0; script <head> gắn .nr-pending; lưới an toàn 600 ms
  - [x] HU2 `cover-ripple.ts`: một renderer dùng chung, gắn canvas lên ảnh đang rê; nhãn "Xem"; ≥ 768 px + chuột + cho phép chuyển động
  - [x] HU3 `src/styles/transitions.css`: cross-document View Transitions (cover-ps/karsia/idea); giảm chuyển động tắt bằng CSS,
        "Tắt hiệu ứng" bỏ qua ở pageswap (pagereveal ở trang đích bắn trước khi module chạy)
  - [x] HU5 `compare-slider.ts` (input range, phím mũi tên, aria-valuetext); HU6 `bubbles.ts` + copy dự phòng execCommand
  - [x] CLS bản build 0,003–0,005 (dev cao vì Vite nạp CSS bằng JS — đo CLS phải dùng `vite-preview`, cổng 4173)
  - [x] Báo cáo bước 5
- [x] Bước 6 — Ba trang case study. Đã báo cáo, chờ duyệt.
  - [x] Nội dung VI/EN (`<project>.case.*` trong content/*.json, 160 khoá khớp nhau): 6 phần mỗi trang
  - [x] "Điều sẽ làm khác đi": NHÁP suy ra từ dữ kiện 3.2/3.3, `reflectionConfirmed: false` → gỡ khỏi build (`<!--draft:x-->`),
        dev hiện nhãn "Nháp". CHỜ THẮNG xác nhận hoặc viết lại.
  - [x] Ảnh theo 3.3: chú thích Figma AI cho Quà Tết; ảnh mobile 2IDEA khung ≤ 392 px; PS tối đa 1440 px
  - [x] Liên kết "Xem case study" ở mỗi tầng; "Lặn tiếp" ở cuối trang (nằm trong marker dự án → tự ẩn nếu tầng kế chưa công khai)
  - [x] Số liệu: mọi số trong 133 chuỗi có trong đặc tả, trừ 11.141 (= 7.988 + 3.153, từ bước 2)
  - [x] Báo cáo bước 6
- [x] Bước 7 — Intro "đàn con trỏ dựng trang". Đã báo cáo, chờ duyệt. (Mục nháp "Điều sẽ làm khác đi" vẫn ẩn theo ý người dùng.)
  - [x] `data-layer` (type | name | block) trên 6 phần tử Hero; head script gắn `.intro-pending` (có JS, cho phép chuyển động,
        chưa có cờ phiên `intro-done`, không có #neo); lưới an toàn CSS hiện mọi lớp sau 7 s nếu JS lỗi
  - [x] `src/effects/intro.ts` + `intro.css`: 3 con trỏ (Nghiên cứu / UI / Prototype), hàng đợi chung, khung W × H, gõ chữ theo nhịp
        khung hình (không cộng dồn setTimeout), tên gõ bằng name-reveal (revealGlyph), quét lộ khối, bản vẽ rút xuống lộ mặt nước
  - [x] Thời lượng tự nhiên 3,3 s (1280 và 390); trần cứng 5,6 s; Bỏ qua / Esc / lăn / vuốt / bấm / phím điều hướng đều bỏ qua và hiện đủ
  - [x] Three.js chỉ tải SAU intro (trước đó chặn main thread ~2 s làm intro khựng)
  - [x] Nút "Xem lại" ở Phòng thử nghiệm; tắt hiệu ứng → không intro, nút báo "Hiệu ứng đang tắt"
  - [x] CLS bản build có intro: 0,0041. LCP chưa đo được trong pane → Lighthouse ở bước 8
  - [x] Báo cáo bước 7
- [x] Bước 8 — Rà giảm chuyển động, bàn phím, hiệu năng; Lighthouse. Đã báo cáo.
  - [x] Việc tồn: thanh trên < 768 px cuộn theo trang; ẩn thanh cuộn từ lần vẽ đầu (.js) → hết dịch ~15 px; nút fx có nhãn sẵn trong HTML
  - [x] Bàn phím (Tab thật): 17 điểm dừng, tất cả :focus-visible có viền 3 px; vùng chạm: liên kết đứng riêng ≥ 44 px,
        mốc thước 44 × 44 (chuột); màn cảm ứng: thước chỉ để xem
  - [x] Giảm chuyển động (Edge --force-prefers-reduced-motion): fx-off, không intro, tên hiện ngay, mặt nước khung tĩnh,
        không gợn ảnh bìa, nút "Hiệu ứng tắt theo thiết bị"
  - [x] 6 khổ × trang chính + case PS: không cuộn ngang, 0 lỗi JS, 0 lỗi tương phản. Sửa: case page bị ẩn thanh cuộn nhầm; nhãn "Nháp" (dev) tràn ở 360
  - [x] Lighthouse 13.5.0 trên bản build (bảng ở mục Báo cáo bước 8)
  - [x] Bản build: CSS gắn thẳng vào HTML; ảnh 960/720 px + srcset; favicon, robots.txt; vi.json gói trong mã chính;
        gỡ khỏi dist tài liệu riêng (đặc tả, zip, contact.png) và ảnh dự án chưa công khai (plugin prune-unpublished)
  - [x] Báo cáo bước 8

## Báo cáo bước 8 (phiên chính, 2026-11-12)

Lighthouse 13.5.0, Edge headless, bản build (`vite preview`), mô phỏng mặc định của Lighthouse:

| Trang / cấu hình | Hiệu năng | Truy cập | Thực hành | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Trang chính, mobile (3 lần) | 96–97 | 100 | 100 | 100 | 2.484–2.486 ms | 0,012 | 10–20 ms |
| Trang chính, desktop | 100 | 100 | 100 | 100 | 531 ms | 0,016 | 0 ms |
| PlayStation UI, mobile (2 lần) | 96–98 | 100 | 100 | 100 | 2.489–2.490 ms | 0 | 0 ms |
| PlayStation UI, desktop | 100 | 100 | 100 | 100 | 715 ms | 0 | 0 ms |

- LCP mobile đạt ≤ 2,5 s nhưng sát ngưỡng. Trang chính: LCP phụ thuộc thời điểm intro dựng xong.
- INP: Lighthouse chế độ điều hướng không đo được INP; TBT (thay thế) 0–20 ms.
- Chưa xác nhận được trên trình duyệt thật: quay về /#tang-1 từ case study có cuộn đúng tầng không (pane bị che khi thử);
  đã thêm bước bảo đảm `ensureHashTarget()` trong main.ts.
- Báo cáo HTML: `screenshots/step8/lighthouse-home-mobile.html`, `lighthouse-ps-mobile.html`.

Quy tắc: sau mỗi bước phải dừng, báo cáo, chờ người dùng đồng ý mới sang bước kế. Watchdog chỉ hoàn tất bước đang dở, không tự mở bước mới.

## Việc con của bước 2

- [x] Giải nén `portfolio-images.zip` vào `public/work/`
- [x] `content/vi.json`, `content/en.json` (cùng bộ khoá), `content/projects.json` (published)
- [x] `index.html` tĩnh: Hero, 3 tầng dự án, Cách tôi làm việc, Phòng thử nghiệm, Liên hệ
- [x] CSS cho toàn trang (`src/styles/*`, `src/sections/*.css`), đọc được khi tắt JS
- [x] Chụp 390 px và 1440 px, kiểm tra không cuộn ngang, không lỗi console
- [x] Báo cáo bước 2

## Báo cáo bước 2 (phiên chính, 2026-11-12)

- Chữ đổ từ `content/vi.json` vào HTML lúc build (plugin `i18n-html` trong `vite.config.ts`), JS chỉ dùng để đổi sang EN.
- `content/projects.json`: KARSIA và 2IDEA đang `published: false` → bị gỡ khỏi `vite build`, chỉ hiện khi dev (viền cam + nhãn).
- Ảnh chụp: `screenshots/step2/1440-full.png`, `screenshots/step2/390-full.png` (chụp bằng Edge headless; dev: `?shot=900`, `/dev/shot.html?w=390&h=844`).
  Ở bản 390, hai ảnh 2IDEA trống là do lazy-load trong iframe headless; trên trang thật ảnh tải bình thường.
- Đã kiểm tra: không cuộn ngang ở 390 và 1440; console không lỗi; VI→EN đổi chữ, alt, `lang`, lưu lựa chọn qua tải lại; tsc + build sạch;
  HTML server gửi về (tắt JS) có đủ chữ, 0 phần tử rỗng, 9/9 ảnh có alt. Chưa chụp được ảnh khi tắt JS (Edge headless không lưu).
- Còn vướng: (đã sửa màu, xem Ghi chú); link "Xem case study" chưa đặt vì trang case study là bước 6; nút "Tắt hiệu ứng" để tới khi có hiệu ứng.

## Ghi chú / quyết định đã chốt

- Node v26.13.0 cài tại `C:\Program Files\nodejs` (PowerShell cần nạp lại PATH từ Machine+User).
- Dev server: `.claude/launch.json` tên `vite-dev`, cổng 5173.
- `--leading-display: 1.25`, khung mặt nạ dùng `--display-clip-pad: 0.12em`.
- Tương phản ĐÃ SỬA (người dùng duyệt "sửa màu trước", 2026-11-12). Giữ 7 màu gốc, thêm `--ocean-ink: #1959D4`
  và `--ocean-ink-hover: #164DB8` (cùng sắc ocean, tối hơn). Quy tắc nằm ở đầu `src/styles/tokens.css`:
  nền sáng → liên kết/nút `--ocean-ink`; tầng giữa → liên kết và nút `--light` (nút chữ deep); nền sâu → liên kết `--light`,
  nút `--ocean` với chữ 19px đậm; `--coral` không làm chữ trên nền sáng. Mỗi vùng đặt `--link`, `--btn-bg`… trong `layout.css`.
  Đo: 21/21 cặp đang dùng đạt (dev/font-test.html), 116 phần tử chữ trên trang đều đạt ngưỡng.
- Độ sâu đáy = 1.200 m (`SEABED_M` trong `src/core/scroll-depth.ts`): người dùng đồng ý giữ (2026-11-12).
- Skill `threejs-fundamentals/shaders/postprocessing` mà đặc tả nhắc KHÔNG có trong môi trường này; shader tự viết, không dùng postprocessing.
- Pane trình duyệt bị ẩn thì rAF/ResizeObserver dừng → muốn xem hiệu ứng chạy phải mở pane (show_pane "preview").
  Đo thời lượng intro: xoá `sessionStorage['intro-done']`, tải lại, đọc `window.__introMs` / `__introLog` (chỉ có ở dev).
- Việc để bước 8: dịch nhỏ của .topbar/.hero__tagline (~0,004); nút cố định trên cùng che chữ khi cuộn ở 390 px;
  viền focus ảnh bìa; chuyển trang chiều ngược; Lighthouse (LCP/CLS/INP).
- Dev: `?y=0.42` cuộn tức thì tới 42% trang; `(await import('/dev/contrast-audit.js')).run()` đo tương phản mọi vị trí cuộn.
  Edge headless KHÔNG chụp được khung nhìn đã cuộn (ra trang trống) → chụp vị trí cuộn bằng pane ở 1280 hoặc 390.
- `public/work/` đang chứa PORTFOLIO_SPEC.md, portfolio-images.zip, contact.png — sẽ bị xuất bản theo bản build. Cần hỏi người dùng trước khi dời.
