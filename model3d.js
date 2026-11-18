/* ---------------------------------------------------------------------------
   model3d.js — builds the 3D floor the way the Simulation Lab model builds it.

   This is a port, not an interpretation. The maths, the proportions, the
   textures and the order things are drawn in all follow the model, so the
   floor view and the model show the same building. Where this file departs
   from the model it is only to leave out the editing tools, which live in the
   model and stay there.

   Two things here are easy to get wrong and were wrong before:

   * mw, mh and ml are MULTIPLIERS on the type's size, not sizes. A table with
     mw 1.34 is 1.34 times as wide as a standard table, not 1.34 m wide.
   * An item with `on` set stands on top of another item. Its height off the
     floor is the top of whatever it stands on, not its own default.
--------------------------------------------------------------------------- */

export const WALL_H = 2.7;          // the model's ceiling height
export const WALL_T = 0.14;         // and its wall thickness

// Rooms whose floor is not vinyl.
const FLOORK = { office:"carpet", lounge:"carpet", seminar:"carpet",
                 reception:"carpet", bath:"tile", storage:"conc" };

let THREE = null;
const texCache = new Map();

function cacheTex(key, draw, w, h) {
  let t = texCache.get(key);
  if (t) return t;
  if (texCache.size > 300) { texCache.forEach(v => v.dispose()); texCache.clear(); }
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"));
  t = new THREE.CanvasTexture(c);
  texCache.set(key, t);
  return t;
}
const rpt = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };

function rr(x, X, Y, W, H, rad) {
  x.beginPath(); x.moveTo(X + rad, Y);
  x.arcTo(X + W, Y, X + W, Y + H, rad); x.arcTo(X + W, Y + H, X, Y + H, rad);
  x.arcTo(X, Y + H, X, Y, rad); x.arcTo(X, Y, X + W, Y, rad);
  x.closePath();
}

/* ---- the model's surfaces ---- */

function texWall() {
  return rpt(cacheTex("wall", x => {
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#f6f6f3"); g.addColorStop(1, "#e8eae5");
    x.fillStyle = g; x.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 4000; i++) {
      x.fillStyle = "rgba(0,0,0," + (Math.random() * .035) + ")";
      x.fillRect(Math.random() * 256, Math.random() * 512, 1.5, 1.5);
    }
    x.fillStyle = "rgba(0,0,0,.05)"; x.fillRect(0, 0, 256, 6);
    x.fillStyle = "#596170"; x.fillRect(0, 490, 256, 4);     // skirting
    x.fillStyle = "#3f4652"; x.fillRect(0, 494, 256, 18);
  }, 256, 512));
}

function texFloor(kind) {
  return rpt(cacheTex("floor_" + kind, x => {
    const W = 512;
    const seams = () => {
      x.strokeStyle = "rgba(0,0,0,.12)"; x.lineWidth = 2;
      [0, 256].forEach(q => {
        x.beginPath(); x.moveTo(q, 0); x.lineTo(q, W);
        x.moveTo(0, q); x.lineTo(W, q); x.stroke();
      });
    };
    if (kind === "carpet") {
      x.fillStyle = "#5b6678"; x.fillRect(0, 0, W, W);
      [[0, 0], [256, 256]].forEach(([a, b]) => {
        x.fillStyle = "rgba(255,255,255,.035)"; x.fillRect(a, b, 256, 256);
      });
      for (let i = 0; i < 24000; i++) {
        x.fillStyle = Math.random() < .5
          ? "rgba(255,255,255," + (Math.random() * .09) + ")"
          : "rgba(0,0,0," + (Math.random() * .12) + ")";
        x.fillRect(Math.random() * W, Math.random() * W, 1, 2);
      }
      seams();
    } else if (kind === "tile") {
      x.fillStyle = "#c3c8cd"; x.fillRect(0, 0, W, W);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        const v = 234 + (Math.random() * 12 | 0);
        x.fillStyle = "rgb(" + v + "," + v + "," + (v + 3) + ")";
        x.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
      }
    } else {
      const hall = kind === "hall";
      const base = hall ? "#dadcd5" : kind === "conc" ? "#d2d3cf" : "#efefeb";
      const chips = hall ? ["#b6b9b1", "#8d9299", "#c9b999", "#a6b2c1"]
                         : ["#cbcec8", "#b3b8bf", "#d9cfbb", "#a9b5c6"];
      x.fillStyle = base; x.fillRect(0, 0, W, W);
      for (let i = 0; i < (hall ? 9000 : 6000); i++) {
        x.fillStyle = chips[i % chips.length];
        x.globalAlpha = .3 + Math.random() * .5;
        const z = Math.random() * (hall ? 3.5 : 2.4) + .6;
        x.fillRect(Math.random() * W, Math.random() * W, z, z);
      }
      x.globalAlpha = 1;
      seams();
    }
  }, 512, 512));
}

function texCeil() {
  return rpt(cacheTex("ceil", x => {
    const W = 512, c = 128;
    x.fillStyle = "#ecedea"; x.fillRect(0, 0, W, W);
    for (let i = 0; i < 5000; i++) {
      x.fillStyle = "rgba(0,0,0," + (Math.random() * .12) + ")";
      x.fillRect(Math.random() * W, Math.random() * W, 1.2, 1.2);
    }
    x.fillStyle = "#fbfdff"; x.fillRect(c + 6, c + 6, c * 2 - 12, c - 12);
    x.strokeStyle = "rgba(0,0,0,.06)"; x.lineWidth = 2;
    for (let k = 1; k < 4; k++) {
      const X = c + 6 + k * (c * 2 - 12) / 4;
      x.beginPath(); x.moveTo(X, c + 6); x.lineTo(X, c * 2 - 6); x.stroke();
    }
    x.strokeStyle = "#cfd2cd"; x.lineWidth = 5;
    for (let k = 0; k <= 4; k++) {
      x.beginPath(); x.moveTo(k * c, 0); x.lineTo(k * c, W);
      x.moveTo(0, k * c); x.lineTo(W, k * c); x.stroke();
    }
  }, 512, 512));
}

function wireTex() {
  return cacheTex("wire", x => {
    x.clearRect(0, 0, 256, 128);
    x.strokeStyle = "#e4e8ec"; x.lineWidth = 8; x.strokeRect(4, 4, 248, 120);
    x.lineWidth = 2.4;
    for (let i = 12; i < 250; i += 9) {
      x.beginPath(); x.moveTo(i, 4); x.lineTo(i, 124); x.stroke();
    }
    x.lineWidth = 4;
    [44, 84].forEach(y => {
      x.beginPath(); x.moveTo(4, y); x.lineTo(252, y); x.stroke();
    });
  }, 256, 128);
}

function labelTex(t, bg) {
  return cacheTex("lbl|" + t + "|" + bg, x => {
    x.fillStyle = bg; rr(x, 4, 4, 632, 232, 44); x.fill();
    x.fillStyle = "#fff";
    let fs = 132;
    const fnt = () => "600 " + fs + "px system-ui,-apple-system,'Segoe UI',sans-serif";
    x.font = fnt();
    while (x.measureText(t).width > 560 && fs > 36) { fs -= 6; x.font = fnt(); }
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(t, 320, 126);
  }, 640, 240);
}

// The blue room sign that hangs by each door in the model.
function signTex(id, name) {
  return cacheTex("sign|" + id + "|" + name, x => {
    x.fillStyle = "#1e3a5f"; rr(x, 0, 0, 512, 256, 28); x.fill();
    x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 6;
    rr(x, 12, 12, 488, 232, 20); x.stroke();
    x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
    const F = (w, z) => w + " " + z + "px system-ui,-apple-system,'Segoe UI',sans-serif";
    let fs = 120; x.font = F(700, fs);
    while (x.measureText(id).width > 440 && fs > 40) { fs -= 8; x.font = F(700, fs); }
    x.fillText(id, 256, 104);
    let f2 = 40; x.font = F(500, f2);
    while (x.measureText(name || "").width > 460 && f2 > 18) { f2 -= 2; x.font = F(500, f2); }
    x.fillStyle = "#cfe0f5"; x.fillText(name || "", 256, 196);
  }, 512, 256);
}

/* ---- geometry helpers, as the model has them ---- */

function scaleUV(g, su, sv) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  return g;
}

// A wall box whose texture repeats along its length instead of stretching.
function wallGeo(sx, sy, sz) {
  const g = new THREE.BoxGeometry(sx, sy, sz), uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) {
    const k = f < 2 ? sz / 2 : f >= 4 ? sx / 2 : 1;
    for (let i = f * 4; i < f * 4 + 4; i++) uv.setX(i, uv.getX(i) * k);
  }
  uv.needsUpdate = true;
  return g;
}

function spr(text, col, sc) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: labelTex(text, col || "rgba(30,41,59,.86)"), transparent: true }));
  s.scale.set(sc * 2.67, sc, 1);
  s.renderOrder = 5;
  return s;
}

function shelfMesh(sw, sh, sd, levels) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd),
    new THREE.MeshBasicMaterial({ visible: false }));
  const metal = new THREE.MeshLambertMaterial({ color: 0xb9c0c8 });
  const wire = new THREE.MeshLambertMaterial({ map: wireTex(), color: 0xe8ecf0,
    transparent: true, alphaTest: .35, side: THREE.DoubleSide });
  const pr = .025;
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a, c]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(pr/2, pr/2, sh, 8), metal);
    p.position.set(a * (sw/2 - pr), 0, c * (sd/2 - pr));
    box.add(p);
  });
  const n = Math.max(2, levels | 0);
  for (let i = 0; i < n; i++) {
    const sh2 = new THREE.Mesh(new THREE.BoxGeometry(sw, .02, sd), wire);
    sh2.position.y = -sh/2 + .12 + i * (sh - .14) / (n - 1);
    box.add(sh2);
  }
  return box;
}

/* ---- items ---- */

const SIDEV = { n:{u:[1,0],n:[0,1]}, s:{u:[1,0],n:[0,-1]},
                w:{u:[0,1],n:[1,0]}, e:{u:[0,1],n:[-1,0]} };

const elevOf = (p, off) =>
  typeof p.elev === "number" ? p.elev : (off[p.t] || 0);

/* Where an item sits and how big it is.

   `mw`, `mh` and `ml` multiply the type's size. `on` puts this item on top of
   another one, and a manikin with `onBed` takes the bed's place and angle. */
function itemBase(pr, p, types, off, S, depth) {
  let ex = p.x, ez = p.z, floorY = 0, extra = 0;
  const items = pr.props || [];
  if (p.on && !(p.t === "manikin" && p.onBed) && (depth || 0) < 4) {
    const sp = items.find(x => x.id === p.on && x !== p);
    if (sp) floorY = itemBase(pr, sp, types, off, S, (depth || 0) + 1).top;
  }
  if (p.t === "manikin" && p.onBed) {
    const bed = items.find(x => x.id === p.onBed && x.t === "bed");
    if (bed) {
      ex = bed.x; ez = bed.z;
      const bd = types.bed || { h: .45 };
      floorY = elevOf(bed, off) + bd.h * (bed.s || 1) * (bed.mh || 1);
      extra = bed.r || 0;
    }
  }
  const d = types[p.t] || types.equipment || { w:.6, h:.6, l:.6, c:0x7a8794 };
  const sc = p.s || 1;
  const sw = d.w * sc * (p.mw || 1), sh = d.h * sc * (p.mh || 1),
        sd = d.l * sc * (p.ml || 1);
  const bottom = floorY || elevOf(p, off);
  return { x: pr.x1 * S + ex, z: pr.y1 * S + ez,
           yaw: ((p.r || 0) + extra) * Math.PI / 180,
           kx: sc * (p.mw || 1), kz: sc * (p.ml || 1),
           sw, sh, sd, bottom, top: bottom + sh, color: d.c };
}

/* Where an item's name plate sits.

   The model does not centre it: a bed's name goes at the foot of the bed, a
   manikin's at its feet, and either can be nudged in the model, which saves
   the nudge as `lb`. Reading `lb` when it is there and falling back to the
   model's own default is what keeps the two looking the same. */
function defSlot(p, types) {
  const d = types[p.t] || types.equipment || { w:.6, h:.6, l:.6 };
  const bw = p.t === "bed" ? d.w * .9 : Math.max(.35, d.w * .9);
  const bh = bw / 2.67, half = d.l / 2;
  const y = (((p.r || 0) % 360) + 360) % 360;
  const flip = (y > 90 && y < 270) ? 180 : 0;
  if (p.t === "bed") {
    const gz = -(half - bh/2 - .05);
    return { x: 0, z: gz + bh + .04, rot: flip, s: 1 };
  }
  if (p.t === "manikin")
    return { x: 0, z: Math.max(0, half - bh/2 - .05), rot: flip, s: 1 };
  return { x: 0, z: 0, rot: flip, s: 1 };
}

function lblW(p, b) {
  if (p.t === "bed") return b.sw * .9;
  if (p.t === "manikin") return Math.max(.35, b.sw * .9);
  return Math.max(.35, Math.min(.7, Math.min(b.sw, b.sd * 2) * .8));
}

// How tall a manikin lying on this bed is, so the bed's name clears it.
function manikinOn(pr, p, types) {
  let m = 0;
  (pr.props || []).forEach(x => {
    if (x.t === "manikin" && x.onBed === p.id) {
      const d = types.manikin || { h: .2 };
      m = Math.max(m, d.h * (x.s || 1) * (x.mh || 1));
    }
  });
  return m;
}

function labelPose(pr, p, b, types) {
  const sl = p.lb || defSlot(p, types);
  const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
  const lx = (sl.x || 0) * b.kx, lz = (sl.z || 0) * b.kz;
  const w = lblW(p, b) * (sl.s || 1), h = w / 2.67;
  const yaw = b.yaw + (sl.rot || 0) * Math.PI / 180;
  let y = b.top + .015;
  if (p.t === "bed") y += manikinOn(pr, p, types);
  else if (p.t === "manikin") y += .01;
  return { x: b.x + c * lx + s * lz, y, z: b.z - s * lx + c * lz, yaw, w, h };
}

/* ---- doors ---- */

const sideLen = (pr, sd, S) =>
  (sd === "n" || sd === "s" ? pr.x2 - pr.x1 : pr.y2 - pr.y1) * S;

export function doorGeo(pr, d, S) {
  const x0 = pr.x1 * S, z0 = pr.y1 * S;
  const w = (pr.x2 - pr.x1) * S, h = (pr.y2 - pr.y1) * S;
  const L = sideLen(pr, d.side, S);
  const v = SIDEV[d.side];
  if (!v || !(L > 0)) return null;
  const dw = Math.min(d.w || 1.2, Math.max(.3, L - .1));
  const c = Math.max(0, Math.min(1, d.t == null ? .5 : d.t)) * L;
  const st = d.side === "n" ? [x0, z0] : d.side === "s" ? [x0, z0 + h]
           : d.side === "w" ? [x0, z0] : [x0 + w, z0];
  const cx = st[0] + v.u[0] * c, cz = st[1] + v.u[1] * c;
  const ax = (d.side === "n" || d.side === "s") ? "x" : "z";
  const fix = ax === "x" ? st[1] : st[0];
  const al = ax === "x" ? cx : cz;
  return { cx, cz, dw, u: v.u, nr: v.n, ax, fix, a: al - dw/2, b: al + dw/2 };
}

export function wallDoorGeo(w, d) {
  const L = Math.hypot(w.x2 - w.x1, w.z2 - w.z1) || 1e-6;
  const u = [(w.x2 - w.x1) / L, (w.z2 - w.z1) / L];
  const dw = Math.min(d.w || 1.2, Math.max(.3, L - .1));
  const c = Math.max(0, Math.min(1, d.t == null ? .5 : d.t)) * L;
  return { cx: w.x1 + u[0]*c, cz: w.z1 + u[1]*c, dw, u,
           nr: [-u[1], u[0]], c };
}

// The quarter-circle swing on the floor, and the panel above the opening.
function drawDoor(root, g, d, headMat) {
  const sg = d.flip ? -1 : 1;
  const nr = d.inv ? [-g.nr[0], -g.nr[1]] : g.nr;
  const hx = g.cx - sg * g.u[0] * g.dw / 2, hz = g.cz - sg * g.u[1] * g.dw / 2;
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const th = i / 16 * Math.PI / 2, c = Math.cos(th), sn = Math.sin(th);
    pts.push(new THREE.Vector3(hx + g.dw * (sg * g.u[0] * c + nr[0] * sn), .05,
                               hz + g.dw * (sg * g.u[1] * c + nr[1] * sn)));
  }
  pts.push(new THREE.Vector3(hx, .05, hz));
  root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: .7 })));
  const hd = new THREE.Mesh(new THREE.BoxGeometry(g.dw, WALL_H - 2.1, .14), headMat);
  hd.rotation.y = -Math.atan2(g.u[1], g.u[0]);
  hd.position.set(g.cx, 2.1 + (WALL_H - 2.1) / 2, g.cz);
  root.add(hd);
}

// The room number on a plate beside the door, and hung above it.
function drawSign(root, pr, d, S, label, name) {
  const g = doorGeo(pr, d, S);
  if (!g) return;
  const L = sideLen(pr, d.side, S);
  const out = [-g.nr[0], -g.nr[1]];
  const gap = g.dw / 2 + .34;
  let sd = d.flip ? -1 : 1;
  if (d.t * L + sd * gap > L - .25 || d.t * L + sd * gap < .25) sd = -sd;
  const tex = signTex(label, name);
  const yaw = Math.atan2(out[0], out[1]);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(.4, .2),
    new THREE.MeshBasicMaterial({ map: tex }));
  pl.rotation.y = yaw;
  pl.position.set(g.cx + g.u[0] * sd * gap + out[0] * .08, 1.5,
                  g.cz + g.u[1] * sd * gap + out[1] * .08);
  root.add(pl);
  const fx = g.cx + out[0] * .44, fz = g.cz + out[1] * .44;
  const fy = Math.atan2(g.u[0], g.u[1]);
  [1, -1].forEach(k => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.62, .31),
      new THREE.MeshBasicMaterial({ map: tex }));
    m.rotation.y = fy + (k < 0 ? Math.PI : 0);
    m.position.set(fx + g.u[0] * k * .006, 2.3, fz + g.u[1] * k * .006);
    root.add(m);
  });
  const br = new THREE.Mesh(new THREE.BoxGeometry(.03, .03, .78),
    new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
  br.rotation.y = yaw;
  br.position.set(g.cx + out[0] * .44, 2.47, g.cz + out[1] * .44);
  root.add(br);
}

/* ---- walls ---- */

function wallLine(ax, fix, a, b, opens, add) {
  let sg = [[a, b]];
  for (const o of opens) {
    if (o.ax !== ax || Math.abs(o.fix - fix) > .35) continue;
    sg = sg.flatMap(([p, q]) => {
      if (o.b <= p || o.a >= q) return [[p, q]];
      const r = [];
      if (o.a > p) r.push([p, o.a]);
      if (o.b < q) r.push([o.b, q]);
      return r;
    });
  }
  for (const [p, q] of sg) {
    if (q - p < .05) continue;
    add(ax, fix, p, q);
  }
}

/* ---------------------------------------------------------------------------
   Build the whole floor.

   opts: { mode, showProps, tintFor(prop) -> css colour or null,
           roomLabelFor(planRoomId) -> {label, name, sub} }
   Returns the pieces the page needs to drive: what can be clicked, which
   labels to hide in walk mode, the ceiling panels, and the wall boxes used
   for bumping into things.
--------------------------------------------------------------------------- */
export function buildModelWorld(three, root, plan, opts) {
  THREE = three;
  const o = opts || {};
  const S = 1 / (plan.unit || 32);
  const types = plan.types || {};
  const off = plan.typeOff || {};
  const rooms = plan.rooms || [];
  const out = { picks: [], labels: [], ceilings: [], walls: [], wsegs: [] };

  const wallMat = new THREE.MeshLambertMaterial({ map: texWall() });
  const headMat = new THREE.MeshLambertMaterial({ color: 0xe6e8e4 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x0f172a,
                                                transparent: true, opacity: .22 });

  // The slab the building stands on, and the suspended ceiling above it.
  let x1 = Infinity, z1 = Infinity, x2 = -Infinity, z2 = -Infinity;
  rooms.forEach(r => {
    x1 = Math.min(x1, r.x1 * S); z1 = Math.min(z1, r.y1 * S);
    x2 = Math.max(x2, r.x2 * S); z2 = Math.max(z2, r.y2 * S);
  });
  if (!isFinite(x1)) { x1 = z1 = 0; x2 = z2 = 10; }
  const padW = (x2 - x1) + 8, padD = (z2 - z1) + 8;
  const midX = (x1 + x2) / 2, midZ = (z1 + z2) / 2;

  const hall = new THREE.Mesh(
    scaleUV(new THREE.PlaneGeometry(padW, padD), padW / 1.2, padD / 1.2),
    new THREE.MeshLambertMaterial({ map: texFloor("hall") }));
  hall.rotation.x = -Math.PI / 2;
  hall.position.set(midX, 0, midZ);
  root.add(hall);

  const ceil = new THREE.Mesh(
    scaleUV(new THREE.PlaneGeometry(padW, padD), padW / 2.4, padD / 2.4),
    new THREE.MeshBasicMaterial({ map: texCeil() }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(midX, WALL_H - .005, midZ);
  ceil.visible = false;
  out.ceilings.push(ceil);
  root.add(ceil);

  // Openings: every door, and every stretch of wall taken out in the model.
  const opens = [];
  rooms.forEach(pr => (pr.doors || []).forEach(d => {
    const g = doorGeo(pr, d, S);
    if (g) opens.push(g);
  }));
  (plan.cuts || []).forEach(c => opens.push(c));

  const addWall = (ax, fix, p, q) => {
    const L = q - p;
    const horiz = ax === "x";
    const m = new THREE.Mesh(wallGeo(horiz ? L : .14, WALL_H, horiz ? .14 : L),
                             wallMat);
    m.position.set(horiz ? (p + q) / 2 : fix, WALL_H / 2,
                   horiz ? fix : (p + q) / 2);
    m.userData.roomWall = [ax, fix, p, q];
    root.add(m);
    out.walls.push([Math.min(horiz ? p : fix, horiz ? q : fix) - .07,
                    Math.max(horiz ? p : fix, horiz ? q : fix) + .07,
                    Math.min(horiz ? fix : p, horiz ? fix : q) - .07,
                    Math.max(horiz ? fix : p, horiz ? fix : q) + .07]);
  };

  rooms.forEach(pr => {
    const x0 = pr.x1 * S, z0 = pr.y1 * S;
    const w = (pr.x2 - pr.x1) * S, h = (pr.y2 - pr.y1) * S;

    const info = o.roomLabelFor ? o.roomLabelFor(pr.id) : null;
    const f = new THREE.Mesh(
      scaleUV(new THREE.PlaneGeometry(w, h), w / 1.2, h / 1.2),
      new THREE.MeshLambertMaterial({
        map: texFloor(FLOORK[pr.kind] || "vinyl"),
        color: (info && info.floor) ? new THREE.Color(info.floor).getHex()
                                    : 0xffffff }));
    f.rotation.x = -Math.PI / 2;
    f.position.set(x0 + w/2, .03, z0 + h/2);
    f.userData.roomFoot = pr.id;
    root.add(f);
    out.picks.push(f);

    // Ceiling panel per room, so walking feels enclosed.
    const cap = new THREE.Mesh(
      scaleUV(new THREE.PlaneGeometry(w - .06, h - .06),
              (w - .06) / 2.4, (h - .06) / 2.4),
      new THREE.MeshBasicMaterial({ map: texCeil() }));
    cap.rotation.x = Math.PI / 2;
    cap.position.set(x0 + w/2, WALL_H - .01, z0 + h/2);
    cap.visible = false;
    out.ceilings.push(cap);
    root.add(cap);

    wallLine("x", z0,     x0, x0 + w, opens, addWall);
    wallLine("x", z0 + h, x0, x0 + w, opens, addWall);
    wallLine("z", x0,     z0, z0 + h, opens, addWall);
    wallLine("z", x0 + w, z0, z0 + h, opens, addWall);

    (pr.doors || []).forEach(d => {
      const g = doorGeo(pr, d, S);
      if (!g) return;
      drawDoor(root, g, d, headMat);
      drawSign(root, pr, d, S, (info && info.label) || pr.id,
               (info && info.name) || pr.name || "");
    });

    // The room's own tag, floating where the model floats it. A caller that
    // draws its own name for this room asks for none by passing "".
    const tagText = info && info.tag !== undefined
      ? info.tag : (pr.id || "");
    if (tagText) {
      const tag = spr(tagText, info && info.tagColor,
                      Math.max(.45, Math.min(.85, w / 3.4)));
      tag.position.set(x0 + w/2, 2.25, z0 + h/2);
      tag.userData.roomTag = pr.id;
      out.labels.push(tag);
      root.add(tag);
    }

    if (o.showProps === false) return;

    (pr.props || []).forEach(p => {
      const b = itemBase(pr, p, types, off, S, 0);
      let m;
      if (p.t === "shelf") {
        m = shelfMesh(b.sw, b.sh, b.sd, p.levels || 5);
      } else {
        const geo = new THREE.BoxGeometry(b.sw, b.sh, b.sd);
        const tint = o.tintFor ? o.tintFor(p) : null;
        const col = tint ? new THREE.Color(tint).getHex()
                         : (b.color == null ? 0x7a8794 : b.color);
        m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: col }));
        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
      }
      m.rotation.y = b.yaw;
      m.position.set(b.x, b.bottom + b.sh / 2, b.z);
      m.userData = { stationId: p.id, roomFoot: pr.id };
      root.add(m);
      out.picks.push(m);

      // The item's name, lying flat on top of it, where the model puts it.
      if (!p.hideLabel && p.l && !(p.t === "manikin" && p.onBed)) {
        const pose = labelPose(pr, p, b, types);
        const lm = new THREE.Mesh(new THREE.PlaneGeometry(pose.w, pose.h),
          new THREE.MeshBasicMaterial({ map: labelTex(p.l, "rgba(15,23,42,.88)"),
            transparent: true, polygonOffset: true,
            polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
        lm.rotation.order = "YXZ";
        lm.rotation.set(-Math.PI / 2, pose.yaw, 0);
        lm.position.set(pose.x, pose.y, pose.z);
        lm.renderOrder = 2;
        lm.userData = { itemTag: p.id };
        out.labels.push(lm);
        root.add(lm);
      }
    });
  });

  // Walls the model drew by hand, each with its own doorways taken out.
  (plan.walls || []).forEach(w => {
    const L = Math.hypot(w.x2 - w.x1, w.z2 - w.z1);
    if (L < .05) return;
    const ang = Math.atan2(w.z2 - w.z1, w.x2 - w.x1);
    const ux = (w.x2 - w.x1) / L, uz = (w.z2 - w.z1) / L;
    let pcs = [[0, L]];
    (w.doors || []).forEach(d => {
      const g = wallDoorGeo(w, d), ga = g.c - g.dw/2, gb = g.c + g.dw/2;
      pcs = pcs.flatMap(([p, q]) => {
        if (gb <= p || ga >= q) return [[p, q]];
        const r = [];
        if (ga > p) r.push([p, ga]);
        if (gb < q) r.push([gb, q]);
        return r;
      });
    });
    pcs.forEach(([p, q]) => {
      if (q - p < .03) return;
      const mid = (p + q) / 2;
      const m = new THREE.Mesh(wallGeo(q - p, WALL_H, .14), wallMat);
      m.rotation.y = -ang;
      m.position.set(w.x1 + ux * mid, WALL_H / 2, w.z1 + uz * mid);
      root.add(m);
      out.wsegs.push([w.x1 + ux*p, w.z1 + uz*p, w.x1 + ux*q, w.z1 + uz*q]);
    });
    (w.doors || []).forEach(d => drawDoor(root, wallDoorGeo(w, d), d, headMat));
  });

  // Words written on the floor in the model.
  (plan.labels || []).forEach(fl => {
    if (!fl || !fl.text) return;
    const wq = 1.2 * (fl.s || 1), hq = wq / 2.67;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wq, hq),
      new THREE.MeshBasicMaterial({
        map: labelTex(fl.text, fl.color || "rgba(15,23,42,.88)"),
        transparent: true }));
    m.rotation.order = "YXZ";
    m.rotation.set(-Math.PI / 2, (fl.rot || 0) * Math.PI / 180, 0);
    m.position.set(fl.x, .06, fl.z);
    m.renderOrder = 2;
    out.labels.push(m);
    root.add(m);
  });

  return out;
}

export { itemBase, texFloor, labelTex };
