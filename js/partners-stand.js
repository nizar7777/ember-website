/* ======================================================================
   EMBER — RETAIL PARTNER PAGE, 3D STAND ASSEMBLY
   ======================================================================
   The stand's 18 parts are scattered across the viewport from the top of
   the page, behind the copy, and converge into the assembled stand as the
   reader scrolls. Assembly completes as they arrive at the stand section,
   so the object finishes at the moment the words describe it.

   Not a section you stop and watch — the assembly IS the read.

   Why WebGL is allowed here and argued against in drop.css: that page is a
   hero for cold paid mobile traffic, where weight before first paint burns
   ad budget. This page goes to a named shop owner after a phone call. The
   visitor is warm and nothing is being spent while it loads.

   That said, this version costs more than the last one. The effect starts
   at the top of the page, so it can no longer lazy-load below the fold.
   Instead it boots after the load event, off the critical path: the page
   paints and is readable first, and the canvas fades in when it is ready.
   Reduced-motion and missing-WebGL both skip the fetch entirely.
   ====================================================================== */

const SECTION = document.querySelector("[data-stand-track]");
const CANVAS = document.querySelector("[data-stand-canvas]");
const MODEL_URL = "models/stand.glb";

const ASSEMBLE_END = 0.72;  // assembled with a clear screen still to run
const SCATTER = 1.9;        // model radii; ~4.5 world units at this framing
const FADE_IN_START = 0.02;
const FADE_IN_END = 0.12;
const FADE_OUT_OVER = 0.18; // fraction of the run spent fading after the end
const SCATTER_OPACITY = 0.34; // how faint the parts are while still scattered

const reduce = window.matchMedia &&
               window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
              (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

/* Reduced motion, no WebGL, a failed three.js import and a failed model
   fetch all land here. Dropping the canvas is not enough on its own: the
   <noscript> still never renders, because JS is running — so the section
   went silent about the one object the whole page is selling. Inject the
   same still the <noscript> holds. */
const STILL = {
  src: "images/partners/stand-render.webp",
  w: 1600,
  h: 900,
  alt: "ستاند إمبر: ثلاث أذرع عليها تيشيرتات سودا وبيضا ورمادي، وشعار إمبر فوق."
};

function fallback() {
  if (CANVAS) CANVAS.remove();
  if (!SECTION || SECTION.querySelector(".p-stand__fallback")) return;

  const img = document.createElement("img");
  img.src = STILL.src;
  img.width = STILL.w;
  img.height = STILL.h;
  img.alt = STILL.alt;
  img.loading = "lazy";

  const box = document.createElement("div");
  box.className = "p-stand__fallback";
  box.appendChild(img);

  const wrap = document.createElement("div");
  wrap.className = "wrap";
  wrap.appendChild(box);

  SECTION.appendChild(wrap);
}

/* Deterministic scatter — a seeded hash on the part index rather than
   Math.random, so the layout is identical on every load and on resize. */
function seeded(i, salt) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

async function boot() {
  if (!SECTION || !CANVAS) return;
  if (reduce || !webglOK()) { fallback(); return; }

  let THREE, GLTFLoader;
  try {
    THREE = await import("three");
    ({ GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js"));
  } catch (e) {
    fallback();
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas: CANVAS, antialias: true, alpha: true, powerPreference: "low-power"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

  // Neutral ink ramp only. tokens.css reserves orange for interactive and
  // price, and a 3D prop is neither.
  const styles = getComputedStyle(document.documentElement);
  const inkHex = (styles.getPropertyValue("--ember-ink") || "#f2e9db").trim();
  const dimHex = (styles.getPropertyValue("--ember-ink-dim") || "#918475").trim();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x201a15, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);

  let parts = [];
  let ready = false;

  new GLTFLoader().load(MODEL_URL, (gltf) => {
    const model = gltf.scene;

    // One movable piece per glTF NODE, not per mesh primitive. The file has
    // 18 nodes but 20 primitives, and GLTFLoader expands a multi-primitive
    // node into sibling meshes. Traversing for isMesh would return 20 and
    // tear two of the parts in half as they scattered.
    const nodes = model.children.slice();

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) || 1;

    model.position.sub(centre);
    root.scale.setScalar(2.4 / radius);
    root.add(model);

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(inkHex), roughness: 0.62, metalness: 0.04
    });
    const matAlt = new THREE.MeshStandardMaterial({
      color: new THREE.Color(dimHex), roughness: 0.75, metalness: 0.02
    });

    parts = nodes.map((m, i) => {
      // A part may be a single mesh or a group of primitives, so recolour
      // through it rather than assigning .material on the node.
      const chosen = (i % 3 === 0) ? matAlt : mat;
      m.traverse((o) => { if (o.isMesh) o.material = chosen; });

      const home = m.position.clone();
      // Spread wide across the frame, with real depth variation so the
      // scattered state reads as a field rather than a ring.
      const dir = new THREE.Vector3(
        seeded(i, 1) * 2 - 1,
        seeded(i, 2) * 2 - 1,
        (seeded(i, 3) * 2 - 1) * 0.55
      );
      if (dir.lengthSq() < 0.01) dir.set(1, 0.4, 0.2);
      dir.normalize();

      return {
        mesh: m,
        home: home,
        away: home.clone().addScaledVector(dir, radius * SCATTER * (0.55 + seeded(i, 6) * 0.75)),
        spin: (seeded(i, 4) * 2 - 1) * Math.PI * 1.4,
        delay: seeded(i, 5) * 0.42,
        baseRot: m.rotation.clone()
      };
    });

    ready = true;
    CANVAS.dataset.parts = String(parts.length);
    CANVAS.dataset.ready = "true";
    resize();
    frame();
  }, undefined, fallback);

  function resize() {
    // Measure the canvas, not the window. A fixed inset:0 element spans the
    // initial containing block, which excludes the scrollbar — sizing the
    // renderer to window.innerWidth stretched the render by the scrollbar
    // width on desktop.
    const w = CANVAS.clientWidth || window.innerWidth;
    const h = CANVAS.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // The stand normalises to 2.4 units tall. At 38deg the visible height is
    // 2 * z * tan(19deg), so z=4.8 puts it at roughly three quarters of the
    // frame; pull back where the viewport is narrow.
    camera.position.set(0, 0.25, w < 620 ? 5.6 : 4.8);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  // The run: document top through the end of the stand section.
  //
  // Measured with getBoundingClientRect + scrollY, NOT offsetTop. The
  // z-index rule in partners.css gives <main> position:relative, which
  // makes it the section's offsetParent — so offsetTop reports a value
  // relative to <main> rather than the document and came out 576px short.
  // The assembly then finished well before the caption scrolled into view.
  let runLen = 1;
  function measureRun() {
    const absTop = SECTION.getBoundingClientRect().top + window.scrollY;
    runLen = Math.max(1, absTop + SECTION.offsetHeight - window.innerHeight);
  }

  let ticking = false;
  let lastOpacity = -1;

  function frame() {
    ticking = false;
    if (!ready) return;

    const raw = window.scrollY / runLen;
    const p = clamp01(raw);

    // Opacity: fade in as the reader starts moving, hold through the run,
    // fade out once past the stand so the banded sections below are clean.
    let op;
    if (raw < FADE_IN_START) op = 0;
    else if (raw < FADE_IN_END) op = (raw - FADE_IN_START) / (FADE_IN_END - FADE_IN_START);
    else if (raw <= 1) op = 1;
    else op = clamp01(1 - (raw - 1) / FADE_OUT_OVER);

    const a = clamp01(p / ASSEMBLE_END);

    // Scattered parts are the same cream as the copy, so a rod passing
    // behind a heading collapsed its contrast. Holding them faint while
    // scattered and resolving to full as they assemble fixes the
    // legibility and reads better — the stand comes into focus as it
    // comes together, rather than being equally loud the whole way.
    op *= SCATTER_OPACITY + (1 - SCATTER_OPACITY) * a;

    if (op !== lastOpacity) {
      CANVAS.style.opacity = op.toFixed(3);
      lastOpacity = op;
    }
    // Nothing visible: skip the draw entirely rather than burn frames.
    if (op <= 0) return;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Stagger: each part owns its own slice of the assembly window.
      const local = clamp01((a - part.delay) / (1 - part.delay));
      const t = easeOutCubic(local);
      part.mesh.position.lerpVectors(part.away, part.home, t);
      part.mesh.rotation.set(
        part.baseRot.x + part.spin * (1 - t),
        part.baseRot.y + part.spin * (1 - t),
        part.baseRot.z
      );
    }

    root.rotation.y = -0.55 + p * 1.2;

    renderer.render(scene, camera);
    CANVAS.dataset.progress = p.toFixed(3);
    CANVAS.dataset.assembly = a.toFixed(3);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { resize(); measureRun(); onScroll(); }, { passive: true });
  // Re-measure once webfonts land, since Arabic reflow moves the section.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measureRun(); onScroll(); });
  }
  resize();
  measureRun();
}

/* Boot off the critical path: the page paints and is readable first, then
   three.js and the model are fetched and the canvas fades in. */
if (SECTION && CANVAS) {
  if (document.readyState === "complete") {
    setTimeout(boot, 0);
  } else {
    window.addEventListener("load", () => setTimeout(boot, 0), { once: true });
  }
}
