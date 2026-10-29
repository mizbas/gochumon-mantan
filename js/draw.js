// ご注文は満タンで：瓶とお客さんの描き方
/* ---------- 容器のかたち ---------- */
const shapes = new Map();
function rot(P, a){ const c = Math.cos(a), s = Math.sin(a); return P.map(([x,y]) => [x*c - y*s, x*s + y*c]); }
function table(P){
  let minY = 1e9, maxY = -1e9; for (const p of P){ if (p[1]<minY) minY=p[1]; if (p[1]>maxY) maxY=p[1]; }
  const N = 80, dy = (maxY-minY)/N, ys = [maxY], cum = [0];
  const width = y => { const xs = [];
    for (let i=0;i<P.length;i++){ const [x1,y1] = P[i], [x2,y2] = P[(i+1)%P.length]; if ((y1<=y && y2>y) || (y2<=y && y1>y)) xs.push(x1 + (y-y1)/(y2-y1)*(x2-x1)); }
    xs.sort((a,b)=>a-b); let w = 0; for (let i=0;i+1<xs.length;i+=2) w += xs[i+1]-xs[i]; return w; };
  for (let i=1;i<=N;i++){ const y = maxY - i*dy; ys.push(y); cum.push(cum[i-1] + width(y + dy/2)*dy); }
  return {ys, cum};
}
function areaBelow(T, y){ const {ys, cum} = T; if (y >= ys[0]) return 0;
  for (let i=1;i<ys.length;i++) if (ys[i] <= y){ const f = (ys[i-1]-y)/(ys[i-1]-ys[i]); return cum[i-1] + (cum[i]-cum[i-1])*f; } return cum[cum.length-1]; }
function levelY(T, a){ const {ys, cum} = T; if (a <= 0) return ys[0];
  for (let i=1;i<cum.length;i++) if (cum[i] >= a){ const f = (a-cum[i-1])/((cum[i]-cum[i-1])||1); return ys[i-1] + (ys[i]-ys[i-1])*f; } return ys[ys.length-1]; }
const qb = (a,b,c,s) => (1-s)*(1-s)*a + 2*(1-s)*s*b + s*s*c;
function bottleShape(style, w){
  const key = style + Math.round(w*10); if (shapes.has(key)) return shapes.get(key);
  const H = w*3.05, t = w*.075, hw = w/2 - t, P = [];
  let sh;
  if (style === "gold" || style === "crystal" || style === "meijin" || style === "ouka"){ const b = Object.assign({}, bottleShape(style === "gold" || style === "meijin" ? "classic" : "square", w), {style}); delete b.T0; shapes.set(key, b); return b; }
  if (style === "tube"){
    const tw = hw*.78, top = -H/2 + t*.4, bottom = H/2 - t;
    P.push([-tw, top]); for (let i=0;i<=12;i++){ const a = Math.PI - i/12*Math.PI; P.push([Math.cos(a)*tw, bottom - tw + Math.sin(a)*tw]); } P.push([tw, top]);
    sh = {style, w, H, t, hw:tw, nw:tw, top, neckBot: top, fillY: top + H*.14, bottom, P};
  } else if (style === "flask"){
    const nw = hw*.36, top = -H/2 + t*.4, neckBot = -H/2 + H*.24, bottom = H/2 - t, r = hw*.25;
    P.push([-nw, top], [-nw, neckBot]);
    for (let i=0;i<=6;i++){ const a = Math.PI - .35 - i/6*(Math.PI/2 - .35); P.push([-hw + r + Math.cos(a)*r, bottom - r + Math.sin(a)*r]); }
    for (let i=0;i<=6;i++){ const a = Math.PI/2 - i/6*(Math.PI/2 - .35); P.push([hw - r + Math.cos(a)*r, bottom - r + Math.sin(a)*r]); }
    P.push([nw, neckBot], [nw, top]);
    sh = {style, w, H, t, hw, nw, top, neckBot, fillY: neckBot + H*.1, bottom, P};
  } else {
    const sq = style === "square", nw = hw*(sq ? .5 : .56), top = -H/2 + t*.4, neckBot = -H/2 + H*.15, shoulder = -H/2 + H*(sq ? .23 : .27), bottom = H/2 - t, r = sq ? hw*.18 : hw*.7;
    P.push([-nw, top], [-nw, neckBot]);
    if (sq) P.push([-hw, shoulder]); else for (let i=1;i<=8;i++){ const s=i/8; P.push([qb(-nw,-hw,-hw,s), qb(neckBot,neckBot,shoulder,s)]); }
    for (let i=0;i<=8;i++){ const a = Math.PI - i/8*Math.PI/2; P.push([-hw + r + Math.cos(a)*r, bottom - r + Math.sin(a)*r]); }
    for (let i=0;i<=8;i++){ const a = Math.PI/2 - i/8*Math.PI/2; P.push([hw - r + Math.cos(a)*r, bottom - r + Math.sin(a)*r]); }
    if (sq) P.push([hw, shoulder]); else for (let i=0;i<=7;i++){ const s=i/8; P.push([qb(hw,hw,nw,s), qb(shoulder,neckBot,neckBot,s)]); }
    P.push([nw, neckBot], [nw, top]);
    sh = {style, w, H, t, hw, nw, top, neckBot, fillY: shoulder + H*.01, bottom, P};
  }
  sh.unit = areaBelow(table(sh.P), sh.fillY) / CAP;
  shapes.set(key, sh); return sh;
}
function capAtAngle(sh, a, dir){ const P = rot(sh.P, a), tip = rot([[dir*sh.nw, sh.top]], a)[0]; return areaBelow(table(P), tip[1]); }
function angleFor(sh, vol, dir){ let lo = 0, hi = 2.1; if (capAtAngle(sh, 0, dir) <= vol) return 0;
  for (let i=0;i<20;i++){ const m = (lo+hi)/2; if (capAtAngle(sh, m*dir, dir) > vol) lo = m; else hi = m; } return hi*dir; }

/* ---------- 描画部品 ---------- */
const cv = $("cv"), ctx = cv.getContext("2d");
let W = 0, H = 0, dpr = 1, lay = null;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function hex(h){ const n = parseInt(h.slice(1),16); return [n>>16, n>>8&255, n&255]; }
function shade(h, k){ const [r,g,b] = hex(h); const f = v => Math.round(k>0 ? v+(255-v)*k : v*(1+k)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function pathOf(c, P){ c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i=1;i<P.length;i++) c.lineTo(P[i][0], P[i][1]); c.closePath(); }

// 動いていない瓶は、一度描いた絵を使い回す（重さ対策：つやのグラデーションなどを毎回描かない）
const VCACHE = new Map(), VRES = 2;
function drawVessel(c, sh, x, y, a, layers0, o={}){
  const still = a === 0 && !o.wave && o.alpha == null && (o.cork == null || o.cork === 1) && layers0.every(L => Number.isInteger(L.v) && (L.rev == null || o.t == null || o.t - L.rev >= 320));
  if (!still) return drawVesselRaw(c, sh, x, y, a, layers0, o);
  const key = sh.style + "|" + sh.w + "|" + layers0.map(L => L.c + (L.h ? "h" : "") + L.v).join(",") + "|" + (o.cork == null ? "" : 1) + (o.sel ? "s" : "") + (o.glow ? "g" : "") + (o.dark ? "d" : "") + (save.cb ? "c" : "") + drinkTheme;
  let sp = VCACHE.get(key);
  if (!sp){
    if (VCACHE.size > 160) VCACHE.clear();
    const m = sh.t*3 + 4, minX = Math.min(...sh.P.map(p => p[0])) - m, maxX = Math.max(...sh.P.map(p => p[0])) + m, top = sh.top - sh.H*.2 - m, bot = sh.bottom + m;
    const cv2 = document.createElement("canvas"); cv2.width = Math.ceil((maxX - minX)*VRES); cv2.height = Math.ceil((bot - top)*VRES);
    const x2 = cv2.getContext("2d"); x2.setTransform(VRES, 0, 0, VRES, 0, 0);
    drawVesselRaw(x2, sh, -minX, -top, 0, layers0, Object.assign({}, o, {t: null}));
    sp = {cv: cv2, ox: minX, oy: top, w: maxX - minX, h: bot - top}; VCACHE.set(key, sp);
  }
  c.drawImage(sp.cv, x + sp.ox, y + sp.oy, sp.w, sp.h);
}
function drawVesselRaw(c, sh, x, y, a, layers0, o={}){
  const layers = [];
  for (const L of layers0){ if (L.v <= .001) continue; const q = layers[layers.length-1]; if (q && q.c === L.c && !q.h && !L.h && q.rev == null && L.rev == null) q.v += L.v; else layers.push({...L}); }
  // 傾いていない瓶は、形ごとに一度だけ計算した液面の表を使い回す（重さ対策）
  let P, T, minX, maxX;
  if (a === 0){
    if (!sh.T0){ sh.T0 = table(sh.P); sh.minX0 = Math.min(...sh.P.map(p => p[0])); sh.maxX0 = Math.max(...sh.P.map(p => p[0])); sh.Pt = {}; }
    P = sh.P.map(([px,py]) => [px+x, py+y]);
    const ys = sh.T0.ys, oy = y; T = {ys: ys.map(v => v + oy), cum: sh.T0.cum};
    minX = sh.minX0 + x; maxX = sh.maxX0 + x;
  } else {
    P = rot(sh.P, a).map(([px,py]) => [px+x, py+y]); T = table(P);
    minX = 1e9; maxX = -1e9; for (const p of P){ if (p[0]<minX) minX=p[0]; if (p[0]>maxX) maxX=p[0]; }
  }
  c.save(); if (o.alpha != null) c.globalAlpha = o.alpha;
  pathOf(c, P); c.fillStyle = "rgba(255,240,220,.07)"; c.fill(); c.clip();
  let acc = 0, prevY = T.ys[0] + 2;
  layers.forEach((L, i) => {
    acc += L.v * sh.unit; const yTop = levelY(T, acc), isTop = i === layers.length-1;
    let col = L.c === -2 ? "#5b4a3c" : L.h || o.dark ? "#4a4440" : COLORS[L.c]; // -2：上げ底
    if (L.rev != null && o.t != null){ const k = Math.min(1, (o.t - L.rev)/320); if (k < 1){ const A = [74,68,64], B = hex(COLORS[L.c]); col = "#" + A.map((v,j) => Math.round(v + (B[j]-v)*k).toString(16).padStart(2,"0")).join(""); } }
    c.fillStyle = col; c.beginPath();
    if (isTop && o.wave){ const A = o.wave, k = 2*Math.PI/(sh.w*1.1); c.moveTo(minX-2, prevY); for (let px = minX-2; px <= maxX+2; px += 3) c.lineTo(px, yTop + Math.sin(px*k + (o.t||0)/90)*A); c.lineTo(maxX+2, prevY); }
    else c.rect(minX-2, yTop, maxX-minX+4, prevY - yTop + .6);
    c.fill();
    if (L.c === -2){ c.fillStyle = "rgba(255,255,255,.14)"; for (let q=0;q<3;q++) c.fillRect(minX-2, yTop + (prevY - yTop)*(q+1)/4, maxX-minX+4, 1); }
    if (L.c >= 0 && !L.h && !o.dark && Math.abs(a) < .05 && (L.rev == null || o.t == null || o.t - L.rev >= 320)) drinkTex(c, drinkOf(L.c).tex, minX - 2, maxX + 2, yTop, prevY, x, L.c*7 + i*3 + Math.round(acc), isTop, sh.w);
    if (isTop){ c.fillStyle = "rgba(255,255,255,.22)"; c.fillRect(minX-2, yTop, maxX-minX+4, Math.max(1.5, sh.w*.035)); }
    if (L.h && Math.abs(a) < .05){ c.fillStyle = "rgba(246,234,214,.6)"; c.font = `900 ${sh.w*.36}px "Zen Kaku Gothic New",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
      for (let q=0;q<Math.round(L.v);q++){ const y0 = levelY(T, acc - (L.v - q)*sh.unit), y1 = levelY(T, acc - (L.v - q - 1)*sh.unit); c.fillText("?", x, (y0 + y1)/2); } }
    if (save.cb && L.c >= 0 && !L.h && !o.dark && Math.abs(a) < .05){ for (let q=0;q<Math.round(L.v);q++){ const y0 = levelY(T, acc - (L.v - q)*sh.unit), y1 = levelY(T, acc - (L.v - q - 1)*sh.unit); if (y0 - y1 > sh.w*.25) sym(c, L.c, x, (y0 + y1)/2, Math.min(sh.w*.17, (y0 - y1)*.32)); } }
    prevY = yTop;
  });
  if (layers.length){ // 立体感（左のつや・右の影）を全体に1回だけ
    const g = c.createLinearGradient(minX, 0, maxX, 0);
    g.addColorStop(0, "rgba(255,255,255,.2)"); g.addColorStop(.45, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.22)");
    c.fillStyle = g; c.fillRect(minX-2, prevY, maxX-minX+4, T.ys[0] - prevY + 2);
  }
  c.restore();
  c.save(); if (o.alpha != null) c.globalAlpha = o.alpha;
  pathOf(c, P); c.lineJoin = "round";
  const rim = sh.style === "gold" ? "rgba(240,190,70,.85)" : sh.style === "crystal" ? "rgba(190,235,255,.7)" : sh.style === "meijin" ? "rgba(178,120,230,.85)" : sh.style === "ouka" ? "rgba(245,205,90,.95)" : "rgba(235,225,215,.4)";
  c.lineWidth = sh.t*1.25; c.strokeStyle = o.sel ? "rgba(255,214,140,.95)" : o.glow ? "rgba(255,230,160,.75)" : rim; c.stroke();
  c.lineWidth = Math.max(1, sh.t*.35); c.strokeStyle = "rgba(255,255,255,.35)"; c.stroke();
  c.translate(x, y); c.rotate(a);
  c.strokeStyle = "rgba(255,255,255,.28)"; c.lineWidth = sh.w*.06; c.lineCap = "round"; c.beginPath();
  c.moveTo(-sh.hw*.55, sh.fillY + sh.H*.06); c.lineTo(-sh.hw*.55, sh.bottom - sh.hw*.9);
  if (sh.neckBot > sh.top + 2){ c.moveTo(-sh.nw*.45, sh.top + sh.H*.03); c.lineTo(-sh.nw*.45, sh.neckBot); }
  c.stroke();
  if (sh.style === "meijin" || sh.style === "ouka"){ /* 名人の瓶・王冠の瓶：肩に小さな王冠 */
    const cy = sh.fillY - sh.H*.035, cw = sh.hw*.62, chh = cw*.55; c.fillStyle = sh.style === "ouka" ? "#f5cd5a" : "#c99cf0"; c.beginPath();
    c.moveTo(-cw/2, cy + chh/2); c.lineTo(-cw/2, cy - chh/2); c.lineTo(-cw/4, cy); c.lineTo(0, cy - chh*.7); c.lineTo(cw/4, cy); c.lineTo(cw/2, cy - chh/2); c.lineTo(cw/2, cy + chh/2); c.closePath(); c.fill();
    if (sh.style === "ouka"){ c.fillStyle = "#d6418f"; c.beginPath(); c.arc(0, cy + chh*.15, chh*.16, 0, 7); c.fill(); } }
  if (sh.style === "crystal"){ c.strokeStyle = "rgba(220,245,255,.45)"; c.lineWidth = 1; c.beginPath();
    for (let k=0;k<3;k++){ const yy = sh.fillY + (sh.bottom - sh.fillY)*(.2 + .3*k); c.moveTo(-sh.hw*.9, yy); c.lineTo(0, yy + sh.hw*.5); c.lineTo(sh.hw*.9, yy); } c.stroke(); }
  c.fillStyle = "rgba(235,225,215,.5)"; rr(c, -sh.nw - sh.t*.9, sh.top - sh.t*.6, sh.nw*2 + sh.t*1.8, sh.t*1.3, sh.t*.5); c.fill();
  if (o.cork != null){
    const k = o.cork, dropY = (1 - k) * -sh.H*.3, cw = sh.nw*2 + sh.t*.6, ch = Math.min(sh.H*.11, cw*1.3);
    c.fillStyle = sh.style === "gold" || sh.style === "ouka" ? "#e8b53a" : sh.style === "crystal" ? "#cfe9f5" : sh.style === "meijin" ? "#8a4fc0" : "#c79a62"; rr(c, -cw/2, sh.top - ch*.38 + dropY, cw, ch, Math.min(cw*.18, 6)); c.fill();
    c.fillStyle = "#a87a44"; rr(c, -cw/2, sh.top - ch*.38 + dropY, cw, ch*.28, Math.min(cw*.18, 6)); c.fill();
  }
  c.restore();
}

/* お客さん（オリジナルの動物たち） */
const GUESTS = [
  {fur:"#e8a25a", ear:"cat",    cheek:"#f3b8a0", wear:"#6d3b3b"},
  {fur:"#8a6a55", ear:"bear",   cheek:"#d79a86", wear:"#2f4f6b"},
  {fur:"#f2efe8", ear:"rabbit", cheek:"#f4b3c2", wear:"#4f5f3a"},
  {fur:"#5f6b7a", ear:"cat",    cheek:"#c9a3b0", wear:"#5b3f6e"},
  {fur:"#c7c2b8", ear:"dog",    cheek:"#e7b0a0", wear:"#7a5a2a"},
  {fur:"#3b3533", ear:"bear",   cheek:"#a97a6a", wear:"#3a3a3a"},
  {fur:"#e8873a", ear:"fox",     cheek:"#f3b8a0", wear:"#4a5a7a", name:"きつね"},
  {fur:"#f4f1ea", ear:"panda",   cheek:"#f4b3c2", wear:"#2f6b4a", name:"パンダ"},
  {fur:"#2c3440", ear:"penguin", cheek:"#f4b3c2", wear:"#3a6ee8", name:"ペンギン"},
  {fur:"#e6b98a", ear:"hamster", cheek:"#f39aa8", wear:"#c9553f", name:"ハムスター"},
  {fur:"#6fbf5a", ear:"frog",    cheek:"#f4b3c2", wear:"#e0a020", name:"かえる"},
  {fur:"#f0a53a", ear:"tiger",   cheek:"#f3b8a0", wear:"#2a2a2a", name:"とら"},
  {fur:"#f6eedd", ear:"sheep",   cheek:"#f4b3c2", wear:"#7a5aa0", name:"ひつじ"},
  {fur:"#e9b44a", ear:"lion",    cheek:"#f3b8a0", wear:"#8a2f2a", name:"ライオン"},
];
// それぞれの動物の好きな色（COLORS の番号）。注文に入っていると代金1.2倍
const FAVC = [0, 1, 4, 2, 3, 5, 6, 3, 7, 1, 3, 6, 4, 1];
const GNAME = ["ねこ","くま","うさぎ","ねこ（グレー）","いぬ","くろくま"].concat(GUESTS.slice(6).map(g => g.name));
function drawGuest(c, g, x, y, s, mood, t, noWear, wearCol){
  const G = typeof g === "object" ? g : GUESTS[g];  // イベントのキャラクターは見た目を直接わたす
  c.save(); c.translate(x, y);
  if (!noWear){ c.fillStyle = wearCol || G.wear; rr(c, -s*.62, s*.42, s*1.24, s*.8, s*.35); c.fill(); }
  c.fillStyle = G.fur;
  if (G.ear === "cat"){ c.beginPath(); c.moveTo(-s*.46,-s*.2); c.lineTo(-s*.36,-s*.62); c.lineTo(-s*.08,-s*.38); c.fill(); c.beginPath(); c.moveTo(s*.46,-s*.2); c.lineTo(s*.36,-s*.62); c.lineTo(s*.08,-s*.38); c.fill(); }
  if (G.ear === "bear"){ c.beginPath(); c.arc(-s*.34,-s*.36,s*.15,0,7); c.arc(s*.34,-s*.36,s*.15,0,7); c.fill(); }
  if (G.ear === "rabbit"){ c.beginPath(); c.ellipse(-s*.17,-s*.68,s*.09,s*.3,-.1,0,7); c.ellipse(s*.17,-s*.68,s*.09,s*.3,.1,0,7); c.fill(); }
  if (G.ear === "fox" || G.ear === "tiger"){ c.beginPath(); c.moveTo(-s*.48,-s*.16); c.lineTo(-s*.4,-s*.7); c.lineTo(-s*.06,-s*.38); c.fill(); c.beginPath(); c.moveTo(s*.48,-s*.16); c.lineTo(s*.4,-s*.7); c.lineTo(s*.06,-s*.38); c.fill();
    if (G.ear === "fox"){ c.fillStyle = "#2a2420"; c.beginPath(); c.moveTo(-s*.43,-s*.52); c.lineTo(-s*.4,-s*.7); c.lineTo(-s*.31,-s*.56); c.fill(); c.beginPath(); c.moveTo(s*.43,-s*.52); c.lineTo(s*.4,-s*.7); c.lineTo(s*.31,-s*.56); c.fill(); c.fillStyle = G.fur; } }
  if (G.ear === "panda"){ c.fillStyle = "#2a2420"; c.beginPath(); c.arc(-s*.34,-s*.36,s*.15,0,7); c.arc(s*.34,-s*.36,s*.15,0,7); c.fill(); c.fillStyle = G.fur; }
  if (G.ear === "hamster"){ c.beginPath(); c.arc(-s*.33,-s*.33,s*.12,0,7); c.arc(s*.33,-s*.33,s*.12,0,7); c.fill(); c.fillStyle = "#f3b8b8"; c.beginPath(); c.arc(-s*.33,-s*.33,s*.06,0,7); c.arc(s*.33,-s*.33,s*.06,0,7); c.fill(); c.fillStyle = G.fur; }
  if (G.ear === "frog"){ c.beginPath(); c.arc(-s*.22,-s*.38,s*.15,0,7); c.arc(s*.22,-s*.38,s*.15,0,7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(-s*.22,-s*.4,s*.09,0,7); c.arc(s*.22,-s*.4,s*.09,0,7); c.fill(); c.fillStyle = "#2a2420"; c.beginPath(); c.arc(-s*.22,-s*.4,s*.045,0,7); c.arc(s*.22,-s*.4,s*.045,0,7); c.fill(); c.fillStyle = G.fur; }
  if (G.ear === "sheep"){ c.fillStyle = "#fffaf0"; for (let k=0;k<9;k++){ const a = Math.PI*(1.05 + k*.11); c.beginPath(); c.arc(Math.cos(a)*s*.46, Math.sin(a)*s*.42 - s*.04, s*.15, 0, 7); c.fill(); } c.fillStyle = "#c9b8a0"; c.beginPath(); c.ellipse(-s*.5, s*.0, s*.13, s*.07, .5, 0, 7); c.ellipse(s*.5, s*.0, s*.13, s*.07, -.5, 0, 7); c.fill(); c.fillStyle = G.fur; }
  if (G.ear === "lion"){ c.fillStyle = "#b8642a"; for (let k=0;k<14;k++){ const a = k/14*Math.PI*2; c.beginPath(); c.arc(Math.cos(a)*s*.5, Math.sin(a)*s*.46, s*.17, 0, 7); c.fill(); } c.fillStyle = G.fur; c.beginPath(); c.arc(-s*.32,-s*.34,s*.1,0,7); c.arc(s*.32,-s*.34,s*.1,0,7); c.fill(); }
  if (G.ear === "dog"){ c.fillStyle = shade(G.fur,-.35); c.beginPath(); c.ellipse(-s*.43,-s*.05,s*.12,s*.24,.4,0,7); c.ellipse(s*.43,-s*.05,s*.12,s*.24,-.4,0,7); c.fill(); c.fillStyle = G.fur; }
  c.beginPath(); c.ellipse(0, 0, s*.48, s*.44, 0, 0, 7); c.fill();
  if (G.ear === "panda"){ c.fillStyle = "#2a2420"; c.beginPath(); c.ellipse(-s*.17, -s*.02, s*.11, s*.13, -.4, 0, 7); c.ellipse(s*.17, -s*.02, s*.11, s*.13, .4, 0, 7); c.fill(); }
  if (G.ear === "penguin"){ c.fillStyle = "#fffaf0"; c.beginPath(); c.ellipse(0, s*.08, s*.36, s*.3, 0, 0, 7); c.fill(); c.fillStyle = "#f0a020"; c.beginPath(); c.moveTo(-s*.07, s*.08); c.lineTo(s*.07, s*.08); c.lineTo(0, s*.18); c.closePath(); c.fill(); }
  if (G.ear === "fox"){ c.fillStyle = "#fffaf0"; c.beginPath(); c.ellipse(0, s*.18, s*.26, s*.18, 0, 0, 7); c.fill(); }
  if (G.ear === "tiger"){ c.strokeStyle = "#2a2420"; c.lineWidth = s*.05; c.lineCap = "round"; c.beginPath(); c.moveTo(0,-s*.42); c.lineTo(0,-s*.28); c.moveTo(-s*.12,-s*.4); c.lineTo(-s*.08,-s*.28); c.moveTo(s*.12,-s*.4); c.lineTo(s*.08,-s*.28); c.moveTo(-s*.48, s*.0); c.lineTo(-s*.34, s*.04); c.moveTo(s*.48, s*.0); c.lineTo(s*.34, s*.04); c.stroke(); }
  if (G.ear === "hamster"){ c.fillStyle = "#fff4e6"; c.beginPath(); c.ellipse(0, s*.18, s*.3, s*.2, 0, 0, 7); c.fill(); }
  c.fillStyle = G.cheek; c.globalAlpha = .6; c.beginPath(); c.arc(-s*.27, s*.1, s*.07, 0, 7); c.arc(s*.27, s*.1, s*.07, 0, 7); c.fill(); c.globalAlpha = 1;
  const ink = G.fur === "#3b3533" || G.ear === "panda" ? "#f6ead6" : "#2a2420";
  c.fillStyle = ink; c.strokeStyle = ink; c.lineWidth = s*.045; c.lineCap = "round";
  const blink = (t % 3900) < 120;
  if (mood === "happy" || mood === "love"){ c.beginPath(); c.arc(-s*.16, -s*.02, s*.06, Math.PI, 0); c.arc(s*.16, -s*.02, s*.06, Math.PI, 0); c.stroke(); }
  else if (blink){ c.beginPath(); c.moveTo(-s*.22,-s*.02); c.lineTo(-s*.1,-s*.02); c.moveTo(s*.1,-s*.02); c.lineTo(s*.22,-s*.02); c.stroke(); }
  else { c.beginPath(); c.arc(-s*.16, -s*.03, s*.045, 0, 7); c.arc(s*.16, -s*.03, s*.045, 0, 7); c.fill(); }
  if (mood === "angry"){ c.beginPath(); c.moveTo(-s*.25,-s*.16); c.lineTo(-s*.09,-s*.11); c.moveTo(s*.25,-s*.16); c.lineTo(s*.09,-s*.11); c.stroke(); }
  if (G.ear === "panda"){ c.strokeStyle = "#2a2420"; c.fillStyle = "#2a2420"; }
  c.beginPath();
  if (mood === "happy" || mood === "love" || mood === "ok") c.arc(0, s*.1, s*.08, .15*Math.PI, .85*Math.PI);
  else if (mood === "worried"){ c.moveTo(-s*.06, s*.15); c.lineTo(s*.06, s*.15); }
  else c.arc(0, s*.2, s*.07, 1.15*Math.PI, 1.85*Math.PI);
  c.stroke();
  if (mood === "worried" || mood === "angry"){ c.fillStyle = "#8fd3f4"; c.beginPath(); c.moveTo(s*.42,-s*.3); c.quadraticCurveTo(s*.5,-s*.16, s*.42,-s*.12); c.quadraticCurveTo(s*.34,-s*.16, s*.42,-s*.3); c.fill(); }
  c.restore();
}
function heart(c, x, y, r){ c.beginPath(); c.moveTo(x, y + r*.9); c.bezierCurveTo(x - r*1.6, y - r*.2, x - r*.6, y - r*1.3, x, y - r*.35); c.bezierCurveTo(x + r*.6, y - r*1.3, x + r*1.6, y - r*.2, x, y + r*.9); c.fill(); }
// 吹き出しの小さな満タン瓶
// 色ごとの記号（見分けやすいモード）
function sym(c, ci, x, y, r){
  c.save(); c.translate(x, y); c.fillStyle = "rgba(255,255,255,.92)"; c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = Math.max(1, r*.22); c.lineJoin = "round"; c.beginPath();
  switch (ci){
    case 0: c.arc(0, 0, r*.8, 0, 7); break;                                                         // ● 赤
    case 1: c.moveTo(0, -r*.9); c.lineTo(r*.9, r*.7); c.lineTo(-r*.9, r*.7); c.closePath(); break;    // ▲ 黄
    case 2: c.rect(-r*.72, -r*.72, r*1.44, r*1.44); break;                                           // ■ 青
    case 3: c.moveTo(0, -r); c.lineTo(r*.8, 0); c.lineTo(0, r); c.lineTo(-r*.8, 0); c.closePath(); break; // ◆ 緑
    case 4: c.moveTo(0, r*.85); c.bezierCurveTo(-r*1.5, -r*.2, -r*.55, -r*1.2, 0, -r*.35); c.bezierCurveTo(r*.55, -r*1.2, r*1.5, -r*.2, 0, r*.85); break; // ♥ 桃
    case 5: for (let i=0;i<10;i++){ const rr2 = i%2 ? r*.42 : r, a = -Math.PI/2 + i*Math.PI/5; c.lineTo(Math.cos(a)*rr2, Math.sin(a)*rr2); } c.closePath(); break; // ★ 紫
    case 6: c.rect(-r*.28, -r*.85, r*.56, r*1.7); c.rect(-r*.85, -r*.28, r*1.7, r*.56); break;        // ✚ 橙
    case 7: c.arc(0, 0, r*.8, 0, 7); c.moveTo(r*.42, 0); c.arc(0, 0, r*.42, 0, 7, true); break;      // ◎ 水
  }
  c.stroke(); c.fill("evenodd"); c.restore();
}
// カクテル（下から順に層の色）。x,y は下の中心
function drawCock(c, x, y, h, pat, done, wide){ // 注文の吹き出し・飛んでいくカクテル：脚つきグラスに下から層
  const n = pat.length, tw = h*(wide || .36), bw = h*.08, rimY = y - h, botY = y - h*.42, lh = (botY - (rimY + h*.04))/n;
  c.save(); c.globalAlpha = done ? .35 : 1;
  c.fillStyle = "rgba(235,225,215,.85)"; c.fillRect(x - h*.025, botY, h*.05, y - botY - h*.04); c.beginPath(); c.ellipse(x, y - h*.03, h*.2, h*.045, 0, 0, 7); c.fill();
  const bowl = () => { c.beginPath(); c.moveTo(x - tw, rimY); c.lineTo(x + tw, rimY); c.bezierCurveTo(x + tw*.95, rimY + (botY - rimY)*.6, x + bw*1.6, botY, x, botY); c.bezierCurveTo(x - bw*1.6, botY, x - tw*.95, rimY + (botY - rimY)*.6, x - tw, rimY); c.closePath(); };
  c.save(); bowl(); c.clip();
  pat.forEach((ci, k) => { c.fillStyle = COLORS[ci]; c.fillRect(x - tw - 1, botY - (k+1)*lh, tw*2 + 2, lh + .6); if (save.cb) sym(c, ci, x, botY - (k+.5)*lh, Math.min(tw*.4, lh*.36)); });
  c.restore();
  bowl(); c.strokeStyle = "rgba(60,40,30,.75)"; c.lineWidth = 1.5; c.lineJoin = "round"; c.stroke();
  c.fillStyle = "#f6e05a"; c.beginPath(); c.arc(x + tw*.8, rimY, h*.1, Math.PI, 0); c.fill();
  c.restore();
}
function miniBottle(c, x, y, h, col, got, ci){
  const w = h*.36;
  c.save(); c.translate(x, y);
  c.fillStyle = col; c.globalAlpha = got ? .35 : 1;
  rr(c, -w/2, -h*.62, w, h*.62, w*.3); c.fill();
  c.fillRect(-w*.22, -h*.86, w*.44, h*.3);
  c.fillStyle = "#c79a62"; rr(c, -w*.3, -h, w*.6, h*.18, 2); c.fill();
  c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(-w*.32, -h*.55, w*.14, h*.45);
  if (save.cb && ci != null) sym(c, ci, 0, -h*.32, w*.32);
  c.globalAlpha = 1;
  if (got){ c.strokeStyle = "#2f7d32"; c.lineWidth = Math.max(2, h*.1); c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(-w*.45, -h*.4); c.lineTo(-w*.05, -h*.12); c.lineTo(w*.6, -h*.75); c.stroke(); }
  c.restore();
}

/* カクテルグラス：脚つきのグラス。注文の層の数だけ同じ高さの段に分け、まだの段には目標の色をうすく見せる */
function cockGeo(sh){ const H = sh.H, w = sh.w; return {rimY: -H/2 + H*.1, botY: H*.1, topHw: w*.62, botHw: w*.2, footY: H/2 - H*.03, footHw: w*.42, fillTop: -H/2 + H*.15}; }
function cockBowl(c, g){ c.beginPath(); c.moveTo(-g.topHw, g.rimY); c.lineTo(g.topHw, g.rimY);
  c.bezierCurveTo(g.topHw*.95, g.rimY + (g.botY - g.rimY)*.6, g.botHw*1.6, g.botY, 0, g.botY); c.bezierCurveTo(-g.botHw*1.6, g.botY, -g.topHw*.95, g.rimY + (g.botY - g.rimY)*.6, -g.topHw, g.rimY); c.closePath(); }
// 段 k（0が一番下）の上端・下端（グラスの中心からの高さ）
function cockSlot(sh, n, k){ const g = cockGeo(sh), h = (g.botY - g.fillTop)/n; return [g.botY - (k+1)*h, g.botY - k*h]; }
function cockLevel(sh, n, v){ const g = cockGeo(sh); return g.botY - (g.botY - g.fillTop)*Math.min(1, v/n); }
function drawCockGlass(c, sh, x, y, a, layers, n, o = {}){
  const g = cockGeo(sh), target = o.target || [];
  c.save(); c.translate(x, y); c.rotate(a);
  // 脚と台
  c.fillStyle = "rgba(235,225,215,.28)"; c.strokeStyle = o.sel ? "rgba(255,214,140,.95)" : "rgba(235,225,215,.55)"; c.lineWidth = sh.t*1.1;
  c.beginPath(); c.moveTo(-sh.w*.05, g.botY); c.lineTo(-sh.w*.05, g.footY - sh.w*.06); c.lineTo(sh.w*.05, g.footY - sh.w*.06); c.lineTo(sh.w*.05, g.botY); c.fill();
  c.beginPath(); c.ellipse(0, g.footY - sh.w*.04, g.footHw, sh.w*.08, 0, 0, 7); c.fill(); c.stroke();
  // 中身
  c.save(); cockBowl(c, g); c.fillStyle = "rgba(255,240,220,.07)"; c.fill(); c.clip();
  const x0 = -g.topHw - 2, x1 = g.topHw + 2;
  let acc = 0;
  for (let k = 0; k < n; k++){ // まだ入っていない段：目標の色をうすく
    if (k < layers.length && layers[k].v >= .999) continue; const [t, b] = cockSlot(sh, n, k);
    if (target[k] != null && !o.dark){ c.globalAlpha = .32; c.fillStyle = COLORS[target[k]]; c.fillRect(x0, t, x1 - x0, b - t); c.globalAlpha = 1; } }
  layers.forEach((L, k) => { if (L.v <= .001) return; const b = cockLevel(sh, n, acc), t = cockLevel(sh, n, acc + L.v); acc += L.v;
    c.fillStyle = o.dark ? "#4a4440" : COLORS[L.c]; c.fillRect(x0, t, x1 - x0, b - t + .6);
    if (!o.dark && Math.abs(a) < .05 && L.v >= .999) drinkTex(c, drinkOf(L.c).tex, x0, x1, t, b, 0, L.c*7 + k*3, k === layers.length - 1, sh.w);
    if (k === layers.length - 1){ c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(x0, t, x1 - x0, Math.max(1.5, sh.w*.035)); }
    if (save.cb && !o.dark && L.v >= .999 && Math.abs(a) < .05) sym(c, L.c, 0, (t + b)/2, Math.min(sh.w*.17, (b - t)*.32)); });
  // 段の区切り（点線）
  c.strokeStyle = "rgba(255,230,245,.45)"; c.lineWidth = 1; c.setLineDash([3, 3]);
  for (let k = 1; k < n; k++){ const yy = cockSlot(sh, n, k)[1]; c.beginPath(); c.moveTo(x0, yy); c.lineTo(x1, yy); c.stroke(); }
  c.setLineDash([]);
  const gr = c.createLinearGradient(-g.topHw, 0, g.topHw, 0); gr.addColorStop(0, "rgba(255,255,255,.22)"); gr.addColorStop(.45, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,.18)");
  c.fillStyle = gr; c.fillRect(x0, g.rimY, x1 - x0, g.botY - g.rimY);
  c.restore();
  // ふち
  cockBowl(c, g); c.lineJoin = "round"; c.lineWidth = sh.t*1.25; c.strokeStyle = o.sel ? "rgba(255,214,140,.95)" : "rgba(255,200,235,.7)"; c.stroke();
  c.lineWidth = Math.max(1, sh.t*.35); c.strokeStyle = "rgba(255,255,255,.4)"; c.stroke();
  c.strokeStyle = "rgba(255,255,255,.3)"; c.lineWidth = sh.w*.05; c.lineCap = "round"; c.beginPath(); c.moveTo(-g.topHw*.7, g.rimY + sh.H*.05); c.lineTo(-g.botHw*1.2, g.botY - sh.H*.08); c.stroke();
  // レモン
  c.fillStyle = "#f6e05a"; c.beginPath(); c.arc(g.topHw*.8, g.rimY, sh.w*.2, Math.PI, 0); c.fill(); c.strokeStyle = "#e0c23a"; c.lineWidth = 1; c.stroke();
  c.restore();
}
