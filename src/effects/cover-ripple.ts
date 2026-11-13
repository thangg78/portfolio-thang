/**
 * Hiệu ứng phụ 2: ảnh bìa dự án gợn sóng khi rê chuột (displacement shader trên chính ảnh); con trỏ đổi thành nhãn "Xem".
 * - Một renderer dùng chung; canvas chỉ được đặt lên ảnh đang được rê, vẽ tới khi gợn tắt rồi gỡ.
 * - Không khởi tạo khi: màn < 768 px, không có chuột (hover), tắt hiệu ứng/giảm chuyển động, không có WebGL.
 * - Không đổi gì với bàn phím: ảnh bìa vẫn là liên kết thường có viền focus.
 * Module tải động; Three.js dùng chung chunk với mặt nước Hero.
 */
import { WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, ShaderMaterial, Mesh, Vector2, Texture, LinearFilter } from 'three';
import { onMotionChange } from '../core/motion';
import { t } from '../i18n';

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uRes;
  uniform vec2 uPointer;
  uniform float uTime;
  uniform float uStrength;
  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 d = (vUv - uPointer) * vec2(aspect, 1.0);
    float dist = length(d);
    // Sóng tròn lan từ con trỏ, yếu dần theo khoảng cách
    float wave = sin(dist * 42.0 - uTime * 6.0) * exp(-dist * 4.5);
    vec2 dir = d / max(dist, 1e-4);
    vec2 uv = vUv + dir * vec2(1.0 / aspect, 1.0) * wave * 0.012 * uStrength;
    gl_FragColor = texture2D(uTex, clamp(uv, 0.0, 1.0));
  }
`;

const mqWide = matchMedia('(min-width: 768px)');
const mqHover = matchMedia('(hover: hover) and (pointer: fine)');

let renderer: WebGLRenderer | null = null;
let material: ShaderMaterial | null = null;
let geometry: PlaneGeometry | null = null;
let scene: Scene, camera: OrthographicCamera;
let canvas: HTMLCanvasElement | null = null;
let cursor: HTMLElement | null = null;
const textures = new Map<HTMLImageElement, Texture>();
let active: { link: HTMLAnchorElement; img: HTMLImageElement } | null = null;
let hovering = false;
let strength = 0;
let raf = 0;
let enabled = false;
const linkCleanups: (() => void)[] = [];
const cleanups: (() => void)[] = [];

function textureFor(img: HTMLImageElement) {
  let tex = textures.get(img);
  if (!tex) {
    tex = new Texture(img);
    tex.minFilter = LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true; // không đặt colorSpace: điểm ảnh đi thẳng ra, đúng màu như <img>
    textures.set(img, tex);
  }
  return tex;
}

function fitCanvas() {
  if (!active || !renderer || !material) return;
  const r = active.img.getBoundingClientRect();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(r.width, r.height, false);
  (material.uniforms.uRes.value as Vector2).set(r.width, r.height);
}

function loop() {
  raf = 0;
  if (!active || !renderer || !material) return;
  // Vào: mạnh dần; ra: tắt dần rồi gỡ canvas
  strength += ((hovering ? 1 : 0) - strength) * 0.12;
  material.uniforms.uStrength.value = strength;
  material.uniforms.uTime.value = performance.now() / 1000;
  renderer.render(scene, camera);
  if (!hovering && strength < 0.01) { detach(); return; }
  raf = requestAnimationFrame(loop);
}

function attach(link: HTMLAnchorElement, img: HTMLImageElement) {
  if (!canvas || !material) return;
  if (!img.complete || !img.naturalWidth) return; // ảnh chưa tải xong: để nguyên ảnh tĩnh
  active = { link, img };
  material.uniforms.uTex.value = textureFor(img);
  fitCanvas();
  link.append(canvas);
  link.classList.add('is-rippling');
  if (!raf) raf = requestAnimationFrame(loop);
}

function detach() {
  cancelAnimationFrame(raf);
  raf = 0;
  active?.link.classList.remove('is-rippling');
  canvas?.remove();
  active = null;
  strength = 0;
}

function moveCursor(e: PointerEvent) {
  if (!cursor) return;
  cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
}

function bindLinks() {
  document.querySelectorAll<HTMLAnchorElement>('[data-cover-link]').forEach((link) => {
    const img = link.querySelector('img');
    if (!img) return;
    const enter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      hovering = true;
      if (active && active.link !== link) detach();
      if (!active) attach(link, img);
      if (cursor) { cursor.textContent = t('nav.view'); cursor.classList.add('is-on'); moveCursor(e); }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !material) return;
      const r = img.getBoundingClientRect();
      (material.uniforms.uPointer.value as Vector2).set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      moveCursor(e);
    };
    const leave = () => {
      hovering = false;
      cursor?.classList.remove('is-on');
      if (active && !raf) raf = requestAnimationFrame(loop);
    };
    link.addEventListener('pointerenter', enter);
    link.addEventListener('pointermove', move);
    link.addEventListener('pointerleave', leave);
    linkCleanups.push(() => {
      link.removeEventListener('pointerenter', enter);
      link.removeEventListener('pointermove', move);
      link.removeEventListener('pointerleave', leave);
    });
  });
}

function enable() {
  if (enabled) return;
  canvas = document.createElement('canvas');
  canvas.className = 'cover-ripple';
  canvas.setAttribute('aria-hidden', 'true');
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  } catch {
    canvas = null;
    return; // không có WebGL: ảnh bìa giữ nguyên
  }
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  geometry = new PlaneGeometry(2, 2);
  material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTex: { value: null },
      uRes: { value: new Vector2(1, 1) },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uTime: { value: 0 },
      uStrength: { value: 0 },
    },
  });
  scene.add(new Mesh(geometry, material));
  cursor = document.createElement('div');
  cursor.className = 'cover-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);
  document.documentElement.classList.add('has-cover-ripple');
  bindLinks();
  addEventListener('resize', fitCanvas);
  enabled = true;
}

function disable() {
  if (!enabled) return;
  detach();
  linkCleanups.splice(0).forEach((fn) => fn());
  removeEventListener('resize', fitCanvas);
  textures.forEach((tex) => tex.dispose());
  textures.clear();
  material?.dispose();
  geometry?.dispose();
  renderer?.dispose();
  cursor?.remove();
  renderer = null; material = null; geometry = null; canvas = null; cursor = null;
  document.documentElement.classList.remove('has-cover-ripple');
  enabled = false;
}

function evaluate(motion: boolean) {
  if (motion && mqWide.matches && mqHover.matches) enable();
  else disable();
}

export function init() {
  let motion = true;
  const onMq = () => evaluate(motion);
  mqWide.addEventListener('change', onMq);
  mqHover.addEventListener('change', onMq);
  cleanups.push(
    () => mqWide.removeEventListener('change', onMq),
    () => mqHover.removeEventListener('change', onMq),
    onMotionChange((allowed) => { motion = allowed; evaluate(allowed); }),
  );
}

export function destroy() {
  cleanups.splice(0).forEach((fn) => fn());
  disable();
}

export const isEnabled = () => enabled;
