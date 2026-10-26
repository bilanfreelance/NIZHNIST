// NIZHNIST — WebGL layer
// One fixed canvas renders every [data-gl] element as a plane that follows its DOM box.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}
vec2 cover(vec2 uv, vec2 res, vec2 img, vec2 f){
  float rs=res.x/res.y, ri=img.x/img.y;
  vec2 s = rs<ri ? vec2(rs/ri,1.) : vec2(1.,ri/rs);
  return uv*s + (1.-s)*f;
}`;

const IMAGE_VERT = /* glsl */`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.);
}`;

// Stable image shader: cover-fit, clean wipe reveal, calm crossfade on hover. No distortion.
// Calm image shader — no distortion. Slat ("weave") reveal, colour develops toward
// the centre of the viewport, a single warm light sweep on hover.
const IMAGE_FRAG = /* glsl */`
uniform sampler2D uTex; uniform sampler2D uTex2;
uniform vec2 uRes; uniform vec2 uImg; uniform vec2 uImg2; uniform vec2 uFocus; uniform vec2 uMouse;
uniform float uReveal, uHover, uTime, uPar, uZoom, uHas2, uScroll, uClip, uDev, uSheen;
uniform vec3 uBg;
varying vec2 vUv;
${NOISE}
float ease(float t){ return t<.5 ? 4.*t*t*t : 1.-pow(-2.*t+2.,3.)/2.; }
void main(){
  if (1. - vUv.y > uClip) discard;
  vec2 uv = vUv;
  float r = smoothstep(0., 1., uReveal);
  float z = 1. + uZoom + uHover*.04 + (1.-r)*.06;
  vec2 zuv = clamp((uv-.5)/z + .5 + vec2(0., uPar), 0., 1.);
  vec3 c = texture2D(uTex, cover(zuv, uRes, uImg, uFocus)).rgb;
  if (uHas2 > .5){
    vec3 c2 = texture2D(uTex2, cover(zuv, uRes, uImg2, vec2(.5))).rgb;
    c = mix(c, c2, smoothstep(.05, .95, uHover));
  }
  // develop: slightly muted & lifted away from the centre of the screen
  float l = dot(c, vec3(.299,.587,.114));
  vec3 muted = mix(vec3(l), c, .55);
  muted = mix(muted, vec3(.957,.945,.914), .12);
  c = mix(muted, c, uDev);
  // a single warm light sweep on hover
  float band = (uv.x + (1.-uv.y)*.45) - mix(-.6, 1.9, uSheen);
  c += vec3(1., .9, .72) * exp(-band*band*26.) * .10 * step(.001, uSheen) * (1.-uSheen*.3);
#ifdef HERO
  float a = step(abs(uv.x-.5)*2., uReveal*1.001);
#else
  // weave reveal: vertical slats, alternating direction, staggered
  float N = clamp(floor(uRes.x/110.), 4., 9.);
  float idx = floor(uv.x*N);
  float t = ease(clamp((uReveal - idx/N*.38)/.62, 0., 1.));
  float y = mod(idx, 2.) < .5 ? uv.y : 1.-uv.y;
  float a = step(y, t*1.001);
#endif
  gl_FragColor = vec4(c, a);
}`;

const FABRIC_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;

const FABRIC_FRAG = /* glsl */`
uniform sampler2D uTex0; uniform sampler2D uTex1;
uniform vec2 uRes, uImg0, uImg1, uMouse;
uniform float uMix, uReveal, uTime, uPress;
varying vec2 vUv;
${NOISE}
void main(){
  float r = smoothstep(0., 1., uReveal);
  vec2 uv = (vUv-.5)/(1.02 + (1.-r)*.08) + .5;
  vec3 c0 = texture2D(uTex0, cover(uv, uRes, uImg0, vec2(.5))).rgb;
  vec3 c1 = texture2D(uTex1, cover(uv, uRes, uImg1, vec2(.5))).rgb;
  vec3 c = mix(c0, c1, smoothstep(0., 1., uMix));
  float a = step(vUv.y, uReveal*1.001);
  gl_FragColor = vec4(c, a);
}`;

const lerp = (a, b, t) => a + (b - a) * t;

export class GL {
  constructor(canvas, { onProgress } = {}) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 10, 4000);
    this.camera.position.z = 1200;
    this.loader = new THREE.TextureLoader();
    this.items = [];
    this.byEl = new Map();
    this.time = 0;
    this.vel = 0;
    this.mouse = { x: -9999, y: -9999, px: 0, py: 0 };
    this.onProgress = onProgress;
    this.geoImg = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.geoFabric = this.geoImg;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointermove', e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; }, { passive: true });
  }

  resize() {
    this.W = document.documentElement.clientWidth; this.H = window.innerHeight;
    this.renderer.setSize(this.W, this.H, false);
    this.camera.aspect = this.W / this.H;
    this.camera.fov = 2 * Math.atan(this.H / 2 / this.camera.position.z) * 180 / Math.PI;
    this.camera.updateProjectionMatrix();
  }

  tex(url) {
    if (!this._cache) this._cache = new Map();
    if (this._cache.has(url)) return this._cache.get(url);
    const p = this.loader.loadAsync(url).then(t => {
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.anisotropy = 4;
      return t;
    });
    this._cache.set(url, p);
    return p;
  }

  async addAll(root = document) {
    const els = [...root.querySelectorAll('[data-gl]')].filter(el => !this.byEl.has(el));
    let done = 0;
    const total = els.length;
    const jobs = els.map(el => this.add(el).finally(() => { done++; this.onProgress?.(done / total); }));
    return Promise.all(jobs);
  }

  async add(el) {
    const type = el.dataset.gl || 'image';
    if (type === 'fabric') return this.addFabric(el);
    const img = el.querySelector('img');
    const src = img.currentSrc || img.src;
    const altSrc = el.dataset.alt;
    const [t1, t2] = await Promise.all([this.tex(src), altSrc ? this.tex(altSrc) : null]);
    const par = parseFloat(el.dataset.par || 0);
    const focus = (el.dataset.focus || '0.5,0.5').split(',').map(Number);
    const isHero = type === 'hero';
    const u = {
      uTex: { value: t1 }, uTex2: { value: t2 || t1 },
      uImg: { value: new THREE.Vector2(t1.image.width, t1.image.height) },
      uImg2: { value: new THREE.Vector2(t2 ? t2.image.width : 1, t2 ? t2.image.height : 1) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uFocus: { value: new THREE.Vector2(focus[0], focus[1]) },
      uMouse: { value: new THREE.Vector2(.5, .5) },
      uReveal: { value: 0 }, uHover: { value: 0 }, uTime: { value: 0 },
      uPar: { value: 0 }, uZoom: { value: par * 1.25 }, uHas2: { value: t2 ? 1 : 0 },
      uScroll: { value: 0 }, uVel: { value: 0 }, uClip: { value: 10 }, uDev: { value: 1 }, uSheen: { value: 0 },
      uBg: { value: new THREE.Color('#F4F1E9') },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u, vertexShader: IMAGE_VERT, fragmentShader: IMAGE_FRAG,
      transparent: true, defines: isHero ? { HERO: 1 } : {},
    });
    const mesh = new THREE.Mesh(this.geoImg, mat);
    this.scene.add(mesh);
    const item = { el, mesh, u, type, par, hover: 0, hoverT: 0, mx: .5, my: .5, rect: null, bend: type === 'image', clipEl: el.dataset.clip ? document.querySelector(el.dataset.clip) : null };
    this.items.push(item);
    this.byEl.set(el, item);
    el.dataset.glReady = '1';
    return item;
  }

  async addFabric(el) {
    const imgs = [...el.querySelectorAll('img')];
    const texs = await Promise.all(imgs.map(i => this.tex(i.currentSrc || i.src)));
    const u = {
      uTex0: { value: texs[0] }, uTex1: { value: texs[0] },
      uImg0: { value: new THREE.Vector2(texs[0].image.width, texs[0].image.height) },
      uImg1: { value: new THREE.Vector2(texs[0].image.width, texs[0].image.height) },
      uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(.5, .5) },
      uDrag: { value: new THREE.Vector2(0, 0) },
      uMix: { value: 0 }, uReveal: { value: 0 }, uTime: { value: 0 }, uPress: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: FABRIC_VERT, fragmentShader: FABRIC_FRAG, transparent: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(this.geoFabric, mat);
    this.scene.add(mesh);
    const item = { el, mesh, u, type: 'fabric', texs, current: 0, press: 0, mx: .5, my: .5, rect: null };
    this.items.push(item);
    this.byEl.set(el, item);
    el.dataset.glReady = '1';
    return item;
  }

  setFabric(el, index, gsap) {
    const it = this.byEl.get(el);
    if (!it || it.current === index) return;
    const t = it.texs[index];
    it.u.uTex1.value = t;
    it.u.uImg1.value.set(t.image.width, t.image.height);
    it.u.uMix.value = 0;
    it.current = index;
    gsap.to(it.u.uMix, {
      value: 1, duration: .9, ease: 'power2.inOut',
      onComplete: () => { it.u.uTex0.value = t; it.u.uImg0.value.set(t.image.width, t.image.height); it.u.uMix.value = 0; },
    });
  }

  // Upload every texture and compile shaders up-front so nothing stutters on first scroll
  warmup() {
    const vis = this.items.map(it => it.mesh.visible);
    this.items.forEach(it => { it.mesh.visible = true; Object.values(it.u).forEach(u => u.value?.isTexture && this.renderer.initTexture(u.value)); });
    (it => it)(this.renderer.compile(this.scene, this.camera));
    this.items.forEach((it, i) => (it.mesh.visible = vis[i]));
  }

  item(el) { return this.byEl.get(el); }

  hover(el, on) { const it = this.byEl.get(el); if (!it) return; it.hoverT = on ? 1 : 0; if (on) { it.sheen = 0; it.sheenOn = true; } }

  render(dt, velocity = 0, scrollY = 0) {
    this.time += dt;
    this.vel = lerp(this.vel, Math.max(-40, Math.min(40, velocity)), .12);
    const { W, H } = this;
    for (const it of this.items) {
      const r = it.el.getBoundingClientRect();
      it.rect = r;
      if (r.bottom < -80 || r.top > H + 80 || r.width < 2 || r.height < 2) { it.mesh.visible = false; continue; }
      it.mesh.visible = true;
      it.mesh.scale.set(r.width, r.height, 1);
      it.mesh.position.set(r.left + r.width / 2 - W / 2, H / 2 - r.top - r.height / 2, 0);
      const u = it.u;
      u.uRes.value.set(r.width, r.height);
      if (it.clipEl) u.uClip.value = (it.clipEl.getBoundingClientRect().top - r.top) / r.height;
      u.uTime.value = this.time;

      // local pointer
      const lx = (this.mouse.x - r.left) / r.width;
      const ly = 1 - (this.mouse.y - r.top) / r.height;
      const inside = lx >= 0 && lx <= 1 && ly >= 0 && ly <= 1;

      if (it.type === 'fabric') {
        const k = .08;
        const nx = lerp(it.mx, inside ? lx : it.mx, k), ny = lerp(it.my, inside ? ly : it.my, k);
        u.uDrag.value.set((nx - it.mx) * 60, (ny - it.my) * 60);
        it.mx = nx; it.my = ny;
        u.uMouse.value.set(it.mx, it.my);
        it.press = lerp(it.press, inside ? 1 : 0, .05);
        u.uPress.value = it.press;
        continue;
      }

      if (it.type === 'hero') {
        it.mx = lerp(it.mx, inside ? lx : .5, .05); it.my = lerp(it.my, inside ? ly : .5, .05);
        u.uMouse.value.set(it.mx, it.my);
        u.uScroll.value = Math.min(1, Math.max(0, -r.top / r.height));
        continue;
      }

      // images: parallax + hover + velocity bend
      if (it.par) {
        const rel = ((r.top + r.height / 2) - H / 2) / H;
        u.uPar.value = Math.max(-1, Math.min(1, rel)) * it.par * .5;
      }
      u.uDev.value = 1;
      if (it.sheenOn) { it.sheen = Math.min(1, (it.sheen || 0) + dt * .85); u.uSheen.value = it.sheen; if (it.sheen >= 1) { it.sheenOn = false; u.uSheen.value = 0; } }
      it.hover = lerp(it.hover, it.hoverT, it.hoverT ? .06 : .09);
      u.uHover.value = it.hover;
      if (inside) { it.mx = lerp(it.mx, lx, .2); it.my = lerp(it.my, ly, .2); }
      u.uMouse.value.set(it.mx, it.my);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
