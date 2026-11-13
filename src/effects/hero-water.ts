/**
 * Hiệu ứng chủ đạo: mặt nước WebGL ở Hero (đặc tả mục 6).
 * - Một mặt phẳng phủ kín Hero, fragment shader vẽ tia sáng caustics trôi chậm và gợn sóng lan ra từ con trỏ.
 * - Khi cuộn: hoa văn trôi chậm hơn nội dung (cảm giác chìm xuống), ánh sáng yếu dần theo --depth.
 * - Shader CHỈ làm sáng nền gradient foam → shallow, không bao giờ tối hơn → chữ Hero giữ nguyên tương phản đã đo.
 * - < 768 px: độ phân giải 0,5. Dừng vẽ khi Hero ra khỏi khung nhìn hoặc tab bị ẩn.
 * - Giảm chuyển động / "Tắt hiệu ứng": vẽ đúng một khung tĩnh, không gợn, không chạy.
 * - Không có WebGL: không làm gì, gradient CSS của Hero vẫn ở đó.
 * Module này được tải động (import()) sau khi nội dung chính đã hiện.
 */
import { WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, ShaderMaterial, Mesh, Vector2, Vector3 } from 'three';
import { subscribe, docMax } from '../core/scroll-depth';
import { onMotionChange } from '../core/motion';

const MAX_RIPPLES = 8;
const STILL_TIME = 7.3; // thời điểm dùng cho khung tĩnh

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uPointer;
  uniform float uPointerOn;
  uniform vec3 uRipples[${MAX_RIPPLES}];
  uniform float uLight;
  uniform float uSink;
  uniform vec3 uFoam;
  uniform vec3 uShallow;

  // Lưới vân sáng: biến dạng miền bằng sin lồng nhau, sáng ở nơi giá trị gần 0
  float caustic(vec2 p, float t) {
    vec2 q = p;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      q += 0.55 * vec2(sin(q.y * 1.3 + t * 0.7 + fi * 1.7), cos(q.x * 1.1 - t * 0.6 + fi * 2.3));
    }
    float v = sin(q.x * 1.6) * sin(q.y * 1.6);
    return pow(1.0 - abs(v), 5.0);
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 uvA = vec2(vUv.x * aspect, vUv.y);

    // Gợn sóng: mỗi gợn là một vòng lan ra từ điểm chạm, tắt dần
    vec2 offset = vec2(0.0);
    float ring = 0.0;
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec3 r = uRipples[i];
      float age = uTime - r.z;
      if (r.z < 0.0 || age < 0.0 || age > 3.0) continue;
      vec2 d = uvA - vec2(r.x * aspect, r.y);
      float dist = length(d);
      float front = dist - age * 0.32;
      float amp = exp(-age * 1.5) * exp(-abs(front) * 16.0);
      float w = sin(front * 70.0) * amp;
      offset += (d / max(dist, 1e-4)) * w * 0.03;
      ring += abs(w);
    }
    // Thấu kính nhẹ dưới con trỏ
    vec2 dp = uvA - vec2(uPointer.x * aspect, uPointer.y);
    offset += dp * exp(-dot(dp, dp) * 22.0) * 0.18 * uPointerOn;

    float t = uTime * 0.35;                       // trôi chậm
    vec2 p = uvA * 3.2 + vec2(0.0, uSink);        // chìm: hoa văn trôi chậm hơn nội dung
    float c = caustic(p + offset * 3.0, t) * 0.6 + caustic(p * 1.7 + offset * 4.0 + 3.1, t * 1.3) * 0.4;

    // Nền giống hệt gradient CSS của Hero (hero.css): foam ở dải trên cùng, xuống shallow từ giữa trở đi.
    // Nền shallow chừa chỗ cho vệt sáng (chỉ được sáng hơn), chữ deep trên shallow vẫn 13,6:1.
    vec3 base = mix(uFoam, uShallow, smoothstep(0.92, 0.45, vUv.y));
    // Vệt sáng mặt nước góc trên phải
    float hl = smoothstep(0.75, 0.0, length((vUv - vec2(0.85, 1.0)) * vec2(aspect * 0.55, 1.0)));

    // CHỈ làm sáng: trộn về phía trắng, không bao giờ tối hơn base
    float lift = clamp((c * 0.85 + ring * 0.3) * uLight + hl * 0.5, 0.0, 1.0);
    gl_FragColor = vec4(base + (vec3(1.0) - base) * lift, 1.0);
  }
`;

const srgb = (hex: string) => {
  const h = hex.trim().replace('#', '');
  return new Vector3(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
};

let renderer: WebGLRenderer | null = null;
let material: ShaderMaterial | null = null;
let geometry: PlaneGeometry | null = null;
let canvas: HTMLCanvasElement | null = null;
let raf = 0;
let running = false;
let visible = true;
let animate = true;
let rippleIdx = 0;
let lastRipple = { x: -1, y: -1, t: 0 };
const cleanups: (() => void)[] = [];
let scene: Scene, camera: OrthographicCamera, hero: HTMLElement;

const now = () => performance.now() / 1000;

function draw() {
  if (!renderer || !material) return;
  material.uniforms.uTime.value = animate ? now() : STILL_TIME;
  renderer.render(scene, camera);
}

function loop() {
  raf = 0;
  if (!running) return;
  draw();
  raf = requestAnimationFrame(loop);
}

function updateRunning() {
  const should = animate && visible && !document.hidden;
  if (should === running) return;
  running = should;
  if (running && !raf) raf = requestAnimationFrame(loop);
  if (!running) { cancelAnimationFrame(raf); raf = 0; draw(); }
}

function resize() {
  if (!renderer || !material || !canvas) return;
  const w = hero.clientWidth, h = hero.clientHeight;
  // Đặc tả: dưới 768 px chạy độ phân giải 0,5
  renderer.setPixelRatio(innerWidth < 768 ? 0.5 : Math.min(devicePixelRatio, 1.5));
  renderer.setSize(w, h, false);
  (material.uniforms.uRes.value as Vector2).set(w, h);
  if (!running) draw();
}

function pointerUv(e: PointerEvent) {
  const r = hero.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
}

function onPointerMove(e: PointerEvent) {
  if (!material || !animate) return;
  const { x, y } = pointerUv(e);
  (material.uniforms.uPointer.value as Vector2).set(x, y);
  material.uniforms.uPointerOn.value = e.pointerType === 'mouse' ? 1 : 0;
  // Thả một gợn mới khi con trỏ đi đủ xa hoặc đủ lâu
  const t = now();
  const moved = Math.hypot((x - lastRipple.x) * hero.clientWidth, (y - lastRipple.y) * hero.clientHeight);
  if (moved > 70 || t - lastRipple.t > 0.45) addRipple(x, y, t);
}

function addRipple(x: number, y: number, t = now()) {
  if (!material) return;
  (material.uniforms.uRipples.value as Vector3[])[rippleIdx].set(x, y, t);
  rippleIdx = (rippleIdx + 1) % MAX_RIPPLES;
  lastRipple = { x, y, t };
}

/** Trả về false nếu không khởi tạo được (không có WebGL) — khi đó gradient CSS giữ nguyên. */
export function init(): boolean {
  const el = document.querySelector<HTMLElement>('.hero');
  if (!el) return false;
  hero = el;
  canvas = document.createElement('canvas');
  canvas.className = 'hero__water';
  canvas.setAttribute('aria-hidden', 'true');
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  } catch {
    canvas = null;
    renderer = null;
    return false; // không có WebGL → dự phòng gradient CSS
  }

  const css = getComputedStyle(document.documentElement);
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  geometry = new PlaneGeometry(2, 2);
  material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: STILL_TIME },
      uRes: { value: new Vector2(1, 1) },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uPointerOn: { value: 0 },
      uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new Vector3(0, 0, -1)) },
      uLight: { value: 1 },
      uSink: { value: 0 },
      // Truyền thẳng giá trị sRGB (không qua THREE.Color, vốn đổi sang linear) để khớp đúng màu CSS
      uFoam: { value: srgb(css.getPropertyValue('--foam')) },
      uShallow: { value: srgb(css.getPropertyValue('--shallow')) },
    },
  });
  scene.add(new Mesh(geometry, material));
  hero.prepend(canvas);
  document.documentElement.classList.add('has-hero-water');

  const ro = new ResizeObserver(resize);
  ro.observe(hero);
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateRunning(); });
  io.observe(hero);
  const onVis = () => updateRunning();
  document.addEventListener('visibilitychange', onVis);
  const onLeave = () => { if (material) material.uniforms.uPointerOn.value = 0; };
  const onDown = (e: PointerEvent) => { if (animate) { const { x, y } = pointerUv(e); addRipple(x, y); } };
  hero.addEventListener('pointermove', onPointerMove);
  hero.addEventListener('pointerleave', onLeave);
  hero.addEventListener('pointerdown', onDown);

  cleanups.push(
    () => ro.disconnect(),
    () => io.disconnect(),
    () => document.removeEventListener('visibilitychange', onVis),
    () => hero.removeEventListener('pointermove', onPointerMove),
    () => hero.removeEventListener('pointerleave', onLeave),
    () => hero.removeEventListener('pointerdown', onDown),
    // Chìm theo --depth: ánh sáng tắt dần khi Hero trượt khỏi khung, hoa văn trôi chậm hơn nội dung
    subscribe((s) => {
      if (!material) return;
      const heroExit = Math.max(0.0001, hero.offsetHeight / Math.max(1, docMax()));
      const k = Math.min(1, s.progress / heroExit);
      material.uniforms.uLight.value = 1 - 0.85 * k * k * (3 - 2 * k); // smoothstep
      material.uniforms.uSink.value = s.y * 0.0012;
      if (!running) draw();
    }),
    onMotionChange((allowed) => {
      animate = allowed;
      if (!allowed && material) {
        material.uniforms.uPointerOn.value = 0;
        (material.uniforms.uRipples.value as Vector3[]).forEach((r) => r.set(0, 0, -1));
      }
      updateRunning(); // so animate/visible với trạng thái chạy hiện tại
      draw();          // khi tắt: vẽ lại khung tĩnh (không gợn)
    }),
  );

  resize();
  draw();
  requestAnimationFrame(() => canvas?.classList.add('is-ready'));
  return true;
}

export function destroy() {
  cancelAnimationFrame(raf);
  raf = 0;
  running = false;
  cleanups.splice(0).forEach((fn) => fn());
  material?.dispose();
  geometry?.dispose();
  renderer?.dispose();
  canvas?.remove();
  renderer = null; material = null; geometry = null; canvas = null;
  document.documentElement.classList.remove('has-hero-water');
}

/** Dev: đọc lại điểm ảnh vừa vẽ, trả về độ sáng (luminance WCAG) nhỏ nhất — để chứng minh shader không tối hơn --shallow. */
export function sampleMinLuminance(): number {
  if (!renderer) return NaN;
  draw();
  const gl = renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  let min = 1;
  for (let i = 0; i < px.length; i += 4) {
    const L = 0.2126 * lin(px[i]) + 0.7152 * lin(px[i + 1]) + 0.0722 * lin(px[i + 2]);
    if (L < min) min = L;
  }
  return min;
}

export const isAnimating = () => running;
