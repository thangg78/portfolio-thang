# Đặc tả: Landing page portfolio của Nguyễn Thắng

Tài liệu này dành cho Claude Code. Đọc hết trước khi viết dòng code đầu tiên. Từ "phải" là bắt buộc, từ "nên" là mặc định và chỉ đổi khi nêu rõ lý do.

## 1. Mục tiêu

Một landing page portfolio cá nhân cho **Nguyễn Thắng**, định hướng UI/UX designer. Người xem chính là nhà tuyển dụng và khách hàng tiềm năng. Sau 10 giây họ phải biết Thắng làm gì; sau khi rời trang họ phải kể lại được một khoảnh khắc cụ thể (chuyến lặn xuống đáy biển).

Trang đạt khi:
- Màn đầu nói rõ tên, nghề và có một hiệu ứng khiến người xem dừng lại.
- 3 dự án đọc được như case study: vấn đề, vai trò, cách làm, kết quả.
- Chạy mượt trên điện thoại tầm trung và vẫn đọc được khi JavaScript lỗi.

## 2. Ý tưởng chủ đạo: "Lặn xuống" (Deep Dive)

Trang là một chuyến lặn. Trên cùng là mặt nước sáng; càng cuộn càng xuống sâu, nền chuyển dần từ xanh nhạt sang xanh đen. Mỗi dự án là một tầng nước. "Deep dive" cũng là cách dân UX gọi việc đào sâu vấn đề.

Mọi quyết định thị giác phải phục vụ ý tưởng này. Nếu một chi tiết dùng được cho portfolio bất kỳ thì bỏ hoặc đổi.

## 3. Nội dung

### 3.1 Thông tin cá nhân

| Mục | Nội dung |
|---|---|
| Tên hiển thị | Nguyễn Thắng |
| Nghề | UI/UX Designer |
| Câu giới thiệu | CHƯA CHỐT. Tạm dùng: "Tôi lặn sâu vào vấn đề trước khi vẽ pixel đầu tiên." Đặt trong một hằng số để đổi một chỗ. |
| Công cụ | Figma, Adobe Illustrator, Adobe Photoshop, Adobe After Effects. Hiển thị bằng chữ, không dùng logo phần mềm, không vẽ thanh phần trăm kỹ năng. |
| Ngôn ngữ làm việc | Tiếng Việt, tiếng Anh. Hiển thị ở phần giới thiệu. |
| Email | nguyenmanhthang7804@gmail.com (bấm để copy, kèm liên kết `mailto:`) |
| Facebook | https://www.facebook.com/nguyen.thang.897940/ (mở tab mới, `rel="noopener"`) |
| Mạng xã hội khác | Chưa có. Không thêm Behance, LinkedIn hay Dribbble giả. |
| Ngôn ngữ trang | Song ngữ Việt và Anh. Mặc định tiếng Việt; nút chuyển VI / EN ở góc trên phải, lưu lựa chọn. Toàn bộ chữ nằm trong `content/vi.json` và `content/en.json`, cùng bộ khoá. Đặt `lang` đúng trên thẻ `html` khi đổi ngôn ngữ. |

Bản tiếng Anh phải được viết lại cho tự nhiên, không dịch từng chữ. Câu giới thiệu tiếng Anh tạm dùng: "I dive deep into the problem before drawing the first pixel." Cả hai font nội dung và tiêu đề phải hiển thị đúng ở cả hai ngôn ngữ; kiểm tra tiêu đề tiếng Anh dài hơn không làm vỡ bố cục.

### 3.2 Ba dự án (theo thứ tự hiển thị)

Số liệu dưới đây lấy từ sổ theo dõi dự án của Thắng. Không thêm số liệu, giải thưởng hay lời khách hàng nào khác.

**Tầng 1 · PlayStation UI (dự án cá nhân, concept)**
- Một câu: Biến website PlayStation thành giao diện chơi được như máy console, với △ ○ ✕ □ là hệ điều hướng thật.
- Vai trò: nghiên cứu, ý tưởng, UI, design system, prototype. Làm trong Figma.
- Cách làm: phân tích 20 website (10 cùng lĩnh vực, 10 có thiết kế ấn tượng); mỗi màn dựng ít nhất 3 phương án khác cấu trúc rồi chọn; so với trang của thương hiệu lớn và sửa phần thua.
- Sản phẩm: Boot, Home (một màn không cuộn với 4 lối vào), Game Library, Game Detail (Ghost of Tsushima), PS5 Hardware, Search, Cart, Checkout, Save Data (1994 đến 2020), Account. Hệ thống gồm 45 token, 10 kiểu chữ, component đủ trạng thái, prototype điều khiển bằng phím mũi tên, Enter, Esc.
- Kết quả: điểm tự chấm theo 10 tiêu chí UI là Home 80,5/100 và Game Detail 83/100. Ghi rõ là "tự đánh giá".
- BẮT BUỘC hiển thị dòng: "Dự án cá nhân, phi thương mại, không liên kết với Sony Interactive Entertainment."
- Không dùng logo PlayStation làm đồ hoạ của trang portfolio. Chỉ hiển thị ảnh chụp màn hình thiết kế.

**Tầng 2 · KARSIA Retreat Ninh Bình (website khu nghỉ dưỡng, dự án khách hàng)**
- Một câu: Chỉnh sửa giao diện một website đã chạy thật theo góp ý của khách, với ràng buộc sửa code ít nhất có thể.
- Vai trò: UI/UX, làm trên Figma trước khi chuyển lập trình.
- Cách làm: rà soát file Figma; chuyển thanh điều hướng và chân trang từ 14 bản sao rời thành component; tạo bộ biến 10 màu và 41 kiểu chữ; tách 35 góp ý của khách thành 42 việc, gắn nhãn mức sửa code Nhẹ (29), Vừa (9), Nặng (4); vẽ bản "sau" đặt ngay dưới bản "trước" để so sánh.
- Sản phẩm: dựng thêm các trang còn thiếu (thư viện ảnh 124 ảnh, popup đặt phòng, menu mở, mẫu bài viết), prototype mở menu và đặt phòng.
- Điểm đáng kể: cách phân loại góp ý theo chi phí code. Đây là câu chuyện chính của case study này.
- Web đang chạy: karsiaretreatninhbinh.com

**Tầng 3 · 2IDEA (thiết kế lại website công ty thiết kế, in ấn, quà tặng)**
- Một câu: Thiết kế lại toàn bộ website 2idea.com.vn, gộp thêm hai thương hiệu con Lịch Bông Sen và Quà tặng 24K vào một hệ thống.
- Vai trò: UI/UX, cấu trúc thông tin, prototype. Làm trong Figma.
- Quy mô: 124 trang desktop và 118 trang mobile; rà tự động 7.988 liên kết desktop và 3.153 liên kết mobile, không liên kết hỏng; thử ở 360 và 430 px không tràn.
- Cách làm: tham khảo 9 thương hiệu in ấn và quà tặng quốc tế (MOO, Pentagram, Papier, Moleskine...) rồi thực hiện 26 đề xuất; nghiên cứu 10 trang quà Tết trước khi dựng khu Quà Tết; soát lại giọng văn 372 đoạn.
- Sản phẩm nổi bật: bộ chọn quy cách sản phẩm có tạm tính, khu Quà Tết có tự phối hộp quà, tìm kiếm thay thanh menu, nút Trợ lý AI.
- Kết quả: điểm tự chấm 75/100 (desktop) và 70/100 (mobile). Nêu thẳng điểm kéo xuống: ảnh chưa phải ảnh thật, khoảng cách chưa theo bội số 4 px.

Lưu ý: KARSIA và 2IDEA là dự án khách hàng. Trước khi công khai, Thắng cần xác nhận được phép đăng. Thêm cờ `published: false` cho từng dự án trong file nội dung để ẩn nhanh khi cần.

### 3.3 Ảnh

Ảnh đã xuất từ Figma nằm trong `portfolio-images.zip`. Giải nén vào `public/work/` để có:

| File | Nội dung | Kích thước |
|---|---|---|
| `playstation-ui/cover.webp` | Home: một màn chia bốn bằng dấu ✕ lớn, 4 lối vào | 1920 × 1080 |
| `playstation-ui/01-home-focus-games.webp` | Home khi chọn △ Games | 1440 × 900 |
| `playstation-ui/02-game-detail-hero.webp` | Game Detail, trạng thái Ghost | 1440 × 900 |
| `playstation-ui/03-library.webp` | Game Library, kiểu xem Slats | 1440 × 900 |
| `playstation-ui/04-hardware-power-on.webp` | PS5 Hardware, giữ ✕ để bật máy | 1440 × 900 |
| `playstation-ui/05-save-data-1994.webp` | Save Data, chương 1994 | 1440 × 900 |
| `playstation-ui/06-cart.webp` | Giỏ hàng | 1440 × 900 |
| `playstation-ui/07-game-detail-full.webp` | Toàn bộ trang Game Detail | 1440 × 3432 |
| `2idea/cover.webp` | Đầu Trang chủ desktop (menu, banner) | 1920 × 1200 |
| `2idea/01-home-full.webp` | Toàn bộ Trang chủ desktop, dùng làm dải cuộn dọc | 960 × 4970 |
| `2idea/02-qua-tet.webp` | Khu Quà Tết: 8 dòng quà | 1920 × 1555 |
| `2idea/03-chat-ai.webp` | Khung Trợ lý AI trên desktop | 960 × 1080 |
| `2idea/04-mobile.webp` | Ba màn mobile: Trang chủ, Menu, Chat AI | 1330 × 924 |
| `2idea/05-mobile-home-full.webp` | Toàn bộ Trang chủ mobile | 390 × 6879 |
| `karsia/cover.webp` | Khối "Dịch vụ của chúng tôi" (bản sau sửa) | 1863 × 1164 |
| `karsia/before.webp`, `karsia/after.webp` | Chân trang trước và sau sửa, cùng kích thước, dùng cho thanh kéo so sánh | 1863 × 1100 |
| `karsia/01-tin-tuc.webp` | Khối Tin tức dịch vụ | 1863 × 1151 |
| `karsia/02-dat-phong.webp` | Popup Đặt phòng dựng lại | 1107 × 866 |
| `karsia/03-menu.webp` | Menu mở | 917 × 973 |
| `karsia/04-thanh-phan.webp` | Khu thành phần dùng chung: điều hướng, chân trang, bộ icon | 1324 × 1963 |

Ghi chú về ảnh:
- Ảnh mobile của 2IDEA ở tỷ lệ 1x (rộng 390 px). Hiển thị ở kích thước thật hoặc nhỏ hơn, không phóng to.
- Màn đầu (hero) của KARSIA trong Figma còn là ô xám chờ ảnh gốc, nên không dùng làm ảnh bìa.
- Ảnh sản phẩm trong khu Quà Tết của 2IDEA là ảnh minh hoạ tạo bằng Figma AI. Ghi chú điều này ở chú thích ảnh.
- Ảnh PlayStation UI ở tỷ lệ 1x (1440 × 900). Trên màn hình lớn, hiển thị tối đa ở chiều rộng thật của ảnh.
- Ảnh PlayStation UI có logo PlayStation và hình ảnh game của bên thứ ba bên trong thiết kế. Chỉ hiển thị nguyên ảnh chụp màn hình, không cắt riêng logo hay nhân vật ra làm đồ hoạ trang trí, và luôn kèm dòng miễn trừ ở mục 3.2.

Không dùng ảnh stock, không tạo ảnh giả.

## 4. Bố cục

1. **Mặt nước (Hero).** Tên cỡ rất lớn, nghề, câu giới thiệu, nền nước WebGL. Một nút "Lặn xuống".
2. **Ba tầng dự án.** Mỗi tầng chiếm trọn màn hình, bố cục khác nhau (hai màn liền nhau không cùng cấu trúc). Nhãn độ sâu: 10 m, 200 m, 1.000 m.
3. **Cách tôi làm việc.** 4 bước: Nghiên cứu, 3 phương án, So sánh, Kiểm tra. Mỗi bước dẫn chứng bằng một con số từ dự án ở trên.
4. **Phòng thử nghiệm.** Lưới nhỏ các bản thử hiệu ứng. Hiện có một mục: "đàn con trỏ dựng trang". Để dễ thêm.
5. **Đáy biển (Liên hệ).** Câu mời ngắn, email bấm để copy, liên kết mạng xã hội, đồng hồ giờ Việt Nam.

Trang case study riêng cho từng dự án: `/work/playstation-ui`, `/work/karsia`, `/work/2idea`. Cấu trúc: bối cảnh, vai trò, cách làm, sản phẩm, kết quả, điều sẽ làm khác đi.

## 5. Hệ thống thị giác

### 5.1 Màu (khai báo bằng CSS custom properties)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--foam` | `#F2F7FA` | Nền mặt nước, chữ trên nền tối |
| `--shallow` | `#BFE3F5` | Chuyển tiếp mặt nước |
| `--ocean` | `#1E6BFF` | Màu chủ đạo: nút, liên kết |
| `--mid` | `#0B3A75` | Nền tầng giữa |
| `--deep` | `#04142B` | Nền tầng sâu và đáy |
| `--light` | `#5CE1E6` | Tia sáng, viền focus trên nền tối |
| `--coral` | `#FF6B4A` | Điểm nóng. Tối đa 2 chỗ mỗi màn |

Nền đổi màu theo tiến độ cuộn bằng một biến `--depth` (0 đến 1), không cắt cứng giữa các phần. Chữ thường đạt tương phản tối thiểu 4,5:1, chữ lớn 3:1, kể cả ở đoạn chuyển màu: phải đo, không ước lượng.

### 5.2 Chữ

- Tiêu đề: **Unbounded** (variable). Phương án dự phòng: Bricolage Grotesque.
- Nội dung: **Be Vietnam Pro**.
- Nhãn, số đo: **JetBrains Mono**.

Trước khi chốt font tiêu đề, phải kiểm tra chuỗi "Ưu ắ ẵ ệ ỗ ữ ỹ Đ Nguyễn Thắng" ở cỡ lớn: dấu không bị cắt, không rơi về font khác. Tự lưu trữ font (woff2, subset `vietnamese`), `font-display: swap`.

### 5.3 Cấm

- Gradient tím xanh, chữ gradient, thẻ kính mờ, bóng đổ có màu.
- Hero căn giữa kèm hai nút; ba thẻ giống nhau có icon ở trên; hàng số liệu trang trí.
- Mọi phần đều mờ dần trượt lên khi cuộn; thẻ nào rê chuột cũng nhấc lên; hạt bay nền vô nghĩa.
- Câu dùng được cho mọi người: "đam mê sáng tạo", "nâng tầm trải nghiệm", "giải pháp toàn diện".
- Emoji thay icon; mũi tên sau mọi nút.

## 6. Hiệu ứng

Một hiệu ứng chủ đạo, sáu hiệu ứng phụ. Không thêm hiệu ứng ngoài danh sách khi chưa hỏi.

**Chủ đạo: mặt nước WebGL ở Hero.** Three.js, một mặt phẳng toàn màn hình với fragment shader: gợn sóng theo vị trí con trỏ, tia sáng caustics chuyển động chậm. Khi cuộn, camera "chìm" xuống: mặt nước trượt lên khỏi khung, ánh sáng yếu dần theo `--depth`. Dùng các skill `threejs-fundamentals`, `threejs-shaders`, `threejs-postprocessing`.

**Phụ:**
1. Tên ở Hero hiện từng ký tự từ dưới mặt nước; độ đậm variable font thay đổi theo khoảng cách tới con trỏ.
2. Ảnh bìa dự án gợn sóng khi rê chuột (displacement shader trên chính ảnh); con trỏ đổi thành nhãn "Xem".
3. Bấm ảnh bìa: ảnh phóng to thành đầu trang case study (GSAP Flip hoặc View Transitions API).
4. Thước đo độ sâu cố định ở mép phải thay cho thanh cuộn, số mét chạy theo tiến độ cuộn.
5. KARSIA: thanh kéo so sánh trước và sau.
6. Liên hệ: bấm email thì copy, nút đổi chữ thành "Đã copy" trong 2 giây; bong bóng nổi lên từ điểm bấm.

**Mở đầu (chỉ lần vào đầu tiên, dưới 6 giây, có nút Bỏ qua):** hiệu ứng "đàn con trỏ dựng trang". Các con trỏ màu vẽ khung chọn, gõ tên, lộ nền nước. Cách làm:
1. Trang hoàn chỉnh trước, đánh dấu phần tử bằng `data-layer`.
2. Đo vị trí bằng `getBoundingClientRect`, ẩn bằng `visibility: hidden` để giữ bố cục. Chỉ ẩn bằng JS.
3. Lớp phủ `position: absolute` phía trên, một hàng đợi chung, mỗi con trỏ rảnh lấy lớp tiếp theo.
4. Mỗi lớp: di chuyển, kéo khung có nhãn W × H, gõ chữ hoặc quét lộ khối, gỡ lớp phủ.
5. Lưu cờ trong `sessionStorage` (bọc try/catch) để không chạy lại.

**Thông số chuyển động:** hover và nhấn 120 ms; chuyển trạng thái 240 đến 320 ms; easing `cubic-bezier(0.22, 1, 0.36, 1)`; không dùng hiệu ứng nảy.

## 7. Kỹ thuật

- **Stack:** Vite, TypeScript, HTML và CSS thuần (không framework UI), GSAP (ScrollTrigger, SplitText, Flip), Lenis cho cuộn mượt, Three.js cho WebGL. Không thêm thư viện khác khi chưa hỏi.
- **Cấu trúc:** `src/sections/*`, `src/effects/*` (mỗi hiệu ứng một module có `init()` và `destroy()`), `content/vi.json`, `content/en.json`, `public/work/*`.
- **Nền tảng trước, hiệu ứng sau:** HTML đúng ngữ nghĩa và CSS phải cho ra trang đọc được, đẹp, khi tắt JavaScript. Hiệu ứng là lớp thêm.
- **Giảm chuyển động:** với `prefers-reduced-motion: reduce`, bỏ intro, bỏ gợn sóng và caustics (dùng ảnh tĩnh của mặt nước), giữ chuyển màu theo cuộn. Có nút "Tắt hiệu ứng" nhìn thấy được, lưu lựa chọn.
- **Di động:** dưới 768 px không khởi tạo shader ảnh bìa; mặt nước Hero chạy độ phân giải 0,5 và dừng khi ra khỏi khung nhìn. Thiết bị không có WebGL dùng gradient CSS.
- **Hiệu năng:** LCP tối đa 2,5 giây, CLS tối đa 0,1, INP tối đa 200 ms. Three.js tải động sau khi nội dung chính hiển thị. Ảnh WebP hoặc AVIF, có `width`, `height`, `loading="lazy"` trừ ảnh đầu.
- **Trợ năng:** dùng được hoàn toàn bằng bàn phím, viền focus rõ, `alt` cho mọi ảnh, canvas có `aria-hidden="true"`, vùng chạm tối thiểu 44 × 44 px.
- **Khổ kiểm tra:** 360, 390, 768, 1024, 1440, 1920 px. Không có thanh cuộn ngang.

## 8. Thứ tự thực hiện

1. Dựng khung Vite, token màu và chữ, kiểm tra dấu tiếng Việt của font tiêu đề. Dừng lại báo kết quả kiểm tra font.
2. HTML và CSS tĩnh cho cả trang với nội dung thật ở mục 3. Chụp ảnh ở 390 và 1440 px.
3. Chuyển màu theo độ sâu và thước đo độ sâu.
4. Mặt nước WebGL ở Hero, kèm phương án dự phòng.
5. Hiệu ứng chữ, ảnh bìa, chuyển trang case study.
6. Ba trang case study.
7. Intro "đàn con trỏ".
8. Rà giảm chuyển động, bàn phím, hiệu năng. Chạy Lighthouse và báo số.

Sau mỗi bước, chạy trang, xem bằng mắt (ảnh chụp), rồi mới báo xong và nói rõ đã kiểm tra gì.

## 9. Điều kiện hoàn thành

- [ ] Che tên đi, trang vẫn nhận ra là "chuyến lặn", không phải mẫu portfolio chung.
- [ ] Màn đầu không có mẫu nào trong mục 5.3.
- [ ] Ba dự án có đủ: một câu mô tả, vai trò, cách làm, kết quả; số liệu khớp mục 3.2.
- [ ] Dòng miễn trừ của dự án PlayStation UI hiển thị ở cả thẻ dự án và trang case study.
- [ ] Tắt JavaScript trang vẫn đọc được.
- [ ] `prefers-reduced-motion` được tôn trọng; có nút tắt hiệu ứng.
- [ ] Không lỗi console, không thanh cuộn ngang ở 6 khổ màn hình.
- [ ] Nút VI / EN đổi toàn bộ chữ trên trang và các trang case study; không còn chuỗi nào chỉ có một ngôn ngữ.
- [ ] Email copy được và liên kết Facebook mở đúng trang.
- [ ] Không có chữ giữ chỗ nào hiển thị ra giao diện (ẩn mục chưa có dữ liệu).

## 10. Tham khảo

Chỉ để hiểu mức chất lượng, không sao chép bố cục: huyml.co (chi tiết nhỏ: đồng hồ, copy email, nút âm thanh), dennissnellenberg.com (hiệu ứng vừa đủ), bruno-simon.com (một ý tưởng xuyên suốt), bài "Golden at Sunset, Olive at Night" trên Codrops (màu đổi theo ngữ cảnh).
