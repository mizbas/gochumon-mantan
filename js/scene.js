// ご注文は満タンで：プレイ画面の描画（背景・飾り・お客さん・瓶・演出）
/* ---------- ショップで買ったものの見た目 ---------- */
function drawChair(c, x, headY, size, cy, lv){
  const top = headY - size*(lv >= 5 ? .42 : lv >= 3 ? .3 : .2), w = size*(lv >= 5 ? 1.6 : lv >= 3 ? 1.5 : 1.4), h = cy - top;
  if (lv === 0){ c.fillStyle = room.chair; rr(c, x - w/2, top, w, h, size*.3); c.fill(); return; }
  if (lv <= 2){ // 木の椅子
    c.fillStyle = "#6b4526"; rr(c, x - w/2, top, w, h, size*.22); c.fill();
    c.fillStyle = "#8a5a33"; rr(c, x - w/2 + size*.12, top + size*.12, w - size*.24, h, size*.14); c.fill();
    c.strokeStyle = "rgba(60,35,15,.55)"; c.lineWidth = Math.max(1.5, size*.05);
    c.beginPath(); for (let k=1;k<4;k++){ const sx = x - w/2 + w*k/4; c.moveTo(sx, top + size*.2); c.lineTo(sx, cy); } c.stroke();
    if (lv === 2){ c.fillStyle = "#c9553f"; rr(c, x - w/2 + size*.06, top + size*.04, w - size*.12, size*.18, size*.09); c.fill(); }
    return; }
  if (lv <= 4){ // 革張りのソファ
    c.fillStyle = "#5e1f1c"; rr(c, x - w/2, top, w, h, size*.38); c.fill();
    c.fillStyle = "#8c2f2a"; rr(c, x - w/2 + size*.08, top + size*.08, w - size*.16, h, size*.32); c.fill();
    c.fillStyle = "rgba(30,8,6,.55)"; const rows = lv === 4 ? 3 : 2;
    for (let r=0;r<rows;r++) for (let k=0;k<4;k++){ c.beginPath(); c.arc(x - w*.3 + k*w*.2 + (r%2)*w*.1, top + size*(.3 + r*.28), size*.04, 0, 7); c.fill(); }
    if (lv === 4){ c.fillStyle = "#7a2622"; rr(c, x - w/2 - size*.18, cy - size*.42, size*.3, size*.42, size*.12); c.fill(); rr(c, x + w/2 - size*.12, cy - size*.42, size*.3, size*.42, size*.12); c.fill(); }
    return; }
  // ビロードの王様いす
  c.fillStyle = "#3a1650"; c.beginPath(); c.moveTo(x - w/2, cy); c.lineTo(x - w/2, top + size*.35);
  c.quadraticCurveTo(x - w/2, top, x - w*.18, top + size*.05); c.quadraticCurveTo(x, top - size*.14, x + w*.18, top + size*.05);
  c.quadraticCurveTo(x + w/2, top, x + w/2, top + size*.35); c.lineTo(x + w/2, cy); c.closePath(); c.fill();
  c.strokeStyle = "#e0b54a"; c.lineWidth = Math.max(2, size*.06); c.stroke();
  c.fillStyle = "#5b2a7a"; rr(c, x - w/2 + size*.14, top + size*.16, w - size*.28, h, size*.3); c.fill();
  c.fillStyle = "#e0b54a"; for (let k=0;k<5;k++){ c.beginPath(); c.arc(x - w*.32 + k*w*.16, top + size*.36, size*.035, 0, 7); c.fill(); }
  c.fillStyle = "#4a1d66"; rr(c, x - w/2 - size*.2, cy - size*.46, size*.34, size*.46, size*.14); c.fill(); rr(c, x + w/2 - size*.14, cy - size*.46, size*.34, size*.46, size*.14); c.fill();
  c.strokeStyle = "#e0b54a"; c.lineWidth = Math.max(1.5, size*.04); rr(c, x - w/2 - size*.2, cy - size*.46, size*.34, size*.46, size*.14); c.stroke(); rr(c, x + w/2 - size*.14, cy - size*.46, size*.34, size*.46, size*.14); c.stroke();
  if (lv >= 6){ c.fillStyle = "#f3d27a"; [-1, 1].forEach(d => { c.beginPath(); c.arc(x + d*(w/2), top + size*.3, size*.1, 0, 7); c.fill(); c.beginPath(); c.arc(x + d*(w/2 + size*.03), cy - size*.5, size*.08, 0, 7); c.fill(); }); }
}
// 上等なお酒：壁の左上の棚に、レベルの数だけ高そうなお酒が並ぶ
const FINE = [["#5b0f1f",1.0,"wine"],["#c9862b",.8,"whisky"],["#2f5d3a",1.05,"wine"],["#e8d38a",.9,"champ"],["#7a2f8f",.75,"liqueur"],["#b8451f",.85,"whisky"],["#16324f",1.0,"wine"],["#f3d27a",.95,"champ"]];
function drawFine(c, lv, cy){
  if (!lv) return;
  const x0 = 10, wcol = Math.min(84, W*.22), rows = [cy*.26, cy*.46], per = 4, bw = wcol/per;
  rows.forEach((ry, r) => {
    if (lv <= r*per) return;
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x0, ry + 2, wcol, 4); c.fillStyle = room.shelf; c.fillRect(x0, ry - 2, wcol, 5); c.fillStyle = room.stop; c.fillRect(x0, ry - 2, wcol, 1.5);
    for (let k=0;k<per;k++){ const i = r*per + k; if (i >= lv) break;
      const [col, hk, kind] = FINE[i], bx = x0 + (k+.5)*bw, bh = Math.min(30, cy*.17)*hk, bwid = bw*.46;
      c.fillStyle = col; rr(c, bx - bwid/2, ry - 2 - bh*.68, bwid, bh*.68, bwid*.3); c.fill();
      c.fillRect(bx - bwid*.17, ry - 2 - bh, bwid*.34, bh*.36);
      c.fillStyle = kind === "champ" ? "#e0b54a" : "#1b1b1b"; c.fillRect(bx - bwid*.2, ry - 2 - bh - 2, bwid*.4, 4);
      c.fillStyle = "#f6ead6"; c.globalAlpha = .85; c.fillRect(bx - bwid*.34, ry - 2 - bh*.46, bwid*.68, bh*.2); c.globalAlpha = 1;
      c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(bx - bwid*.32, ry - 2 - bh*.62, bwid*.12, bh*.5); }
  });
}
// 二号店の看板：右上に吊り看板
function drawBranchSign(c, cy){
  const w = Math.min(78, W*.2), h = Math.min(30, cy*.13), x = W - 10 - w, y = cy*.07;
  c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + w*.2, 0); c.lineTo(x + w*.2, y); c.moveTo(x + w*.8, 0); c.lineTo(x + w*.8, y); c.stroke();
  c.fillStyle = "#2a1a0c"; rr(c, x - 2, y - 2, w + 4, h + 4, 7); c.fill(); c.fillStyle = "#f3d27a"; rr(c, x, y, w, h, 6); c.fill();
  c.fillStyle = "#5b2a12"; c.textAlign = "center"; c.textBaseline = "middle"; let fs = Math.round(h*.5);
  do { c.font = `900 ${fs}px "Zen Kaku Gothic New",sans-serif`; fs--; } while (fs > 7 && c.measureText("二号店 営業中").width > w - 8);
  c.fillText("二号店 営業中", x + w/2, y + h/2 + 1);
}
// ジュークボックス：右の壁。連続中は光って音符が出る
function drawJuke(c, cy){
  const w = Math.min(40, W*.1), h = Math.min(64, cy*.3), x = W - 14 - w, y = cy*(has("branch") ? .26 : .1) + 4, on = combo >= 2;
  c.fillStyle = "#4a2a14"; rr(c, x, y, w, h, w*.5); c.fill();
  c.fillStyle = "#7a4a22"; rr(c, x + w*.1, y + w*.1, w*.8, h - w*.2, w*.42); c.fill();
  const hue = on ? (T*.12) % 360 : 30;
  c.fillStyle = on ? `hsl(${hue},85%,62%)` : "#c99a4a"; rr(c, x + w*.22, y + w*.24, w*.56, h*.38, w*.28); c.fill();
  c.fillStyle = "#2a1a0c"; for (let k=0;k<3;k++) c.fillRect(x + w*.26, y + h*.58 + k*h*.09, w*.48, h*.04);
  if (on){ c.fillStyle = `hsl(${(hue+120)%360},85%,70%)`; c.font = `900 ${Math.round(w*.42)}px sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    for (let k=0;k<2;k++){ const ph = ((T/1400) + k*.5) % 1; c.globalAlpha = 1 - ph; c.fillText(k ? "♪" : "♫", x - w*.1 - ph*w*.4 + k*w*.2, y + h*.3 - ph*h*.5); } c.globalAlpha = 1; }
}
// 看板ねこ：カウンターの右端に座っている。しっぽが揺れる
function drawCat(c, cy){
  const s = Math.min(34, lay.seatW*.26), x = W - s*.9, y = cy;
  c.save(); c.translate(x, y);
  c.strokeStyle = "#c9803e"; c.lineWidth = s*.16; c.lineCap = "round"; const sw = Math.sin(T/420)*s*.35;
  c.beginPath(); c.moveTo(-s*.35, -s*.1); c.quadraticCurveTo(-s*.95, -s*.2 + sw*.3, -s*.85 + sw*.4, -s*.75); c.stroke();
  c.fillStyle = "#e8a25a"; c.beginPath(); c.ellipse(0, -s*.32, s*.42, s*.36, 0, 0, 7); c.fill();
  c.fillStyle = "#f6ead6"; c.beginPath(); c.ellipse(0, -s*.18, s*.2, s*.18, 0, 0, 7); c.fill();
  c.restore();
  drawGuest(c, 0, x, y - s*.86, s*.74, Math.floor(T/2600) % 3 === 0 ? "ok" : "happy", T, true);
  c.fillStyle = room.ctop; c.fillRect(x - s*.6, y, s*1.2, 3);
}
// 笑顔の接客：カウンターの花。レベルで花が増える
function drawFlowers(c, cy, lv){
  if (!lv || seats.length < 2) return;
  const xs = []; for (let k=0;k<seats.length-1;k++) xs.push((lay.seatPos[k].x + lay.seatPos[k+1].x)/2);
  const s = Math.min(16, lay.seatW*.12), cols = ["#f06aa8","#f6c945","#ffffff","#e63946","#9b5de5"];
  xs.forEach((x, k) => {
    const n = Math.ceil((lv - k)/xs.length) + (lv >= 5 ? 1 : 0); if (n <= 0) return;
    c.strokeStyle = "#3f7d3a"; c.lineWidth = 1.5;
    for (let f=0; f<n; f++){ const ang = (f - (n-1)/2)*.35, fx = x + Math.sin(ang)*s*1.1, fy = cy - s*1.1 - Math.cos(ang)*s*.9;
      c.beginPath(); c.moveTo(x, cy - s*.5); c.lineTo(fx, fy); c.stroke();
      c.fillStyle = cols[(f + k*2) % cols.length]; for (let p=0;p<5;p++){ const pa = p*1.2566 + T/3000; c.beginPath(); c.arc(fx + Math.cos(pa)*s*.18, fy + Math.sin(pa)*s*.18, s*.14, 0, 7); c.fill(); }
      c.fillStyle = "#f3d27a"; c.beginPath(); c.arc(fx, fy, s*.1, 0, 7); c.fill(); }
    c.fillStyle = lv >= 5 ? "#e0b54a" : "#7fb3c9"; rr(c, x - s*.32, cy - s*.62, s*.64, s*.64, s*.2); c.fill();
    c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(x - s*.22, cy - s*.54, s*.1, s*.42);
  });
}
function drawDecor(c, id, x, y, s, t){ // x,y = 天井:左上(幅s) 壁:上の中心 カウンター:下の中心
  { const d = DECOR.find(q => q.id === id); if (d && d.emoji){ c.save(); c.textAlign = "center"; const F = z => `${z}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    if (d.slot === "ceil"){ c.font = F(Math.min(26, s*.09)); c.textBaseline = "top"; for (let k=0;k<5;k++){ const kx = (k + .5)/5; c.fillText(d.emoji, x + kx*s, y + 4 + 14*4*kx*(1-kx) + Math.sin(t/700 + k)*2); } }
    else if (d.slot === "wall"){ c.font = F(s*.9); c.textBaseline = "top"; c.fillText(d.emoji, x, y); }
    else { c.font = F(s*.9); c.textBaseline = "bottom"; c.fillText(d.emoji, x, y + 2); }
    c.restore(); return; } }
  c.save(); c.lineCap = "round"; c.lineJoin = "round";
  const curve = (w, sag) => k => [k*w, 6 + sag*4*k*(1-k)];
  switch (id){
  case "lights": { const f = curve(s, 18); c.strokeStyle = "#2a2018"; c.lineWidth = 1.5; c.beginPath(); for (let k=0;k<=20;k++){ const [px,py] = f(k/20); k ? c.lineTo(x+px, y+py) : c.moveTo(x+px, y+py); } c.stroke();
    const n = Math.max(6, Math.round(s/30)), cols = ["#ffd56b","#ff7a7a","#7ad1ff","#9bff8a","#f6a8ff"];
    for (let k=0;k<n;k++){ const [px,py] = f((k+.5)/n), on = .55 + .45*Math.sin(t/300 + k*1.7); c.globalAlpha = on; c.fillStyle = cols[k%cols.length];
      c.beginPath(); c.arc(x+px, y+py+5, 3.5, 0, 7); c.fill(); c.globalAlpha = on*.25; c.beginPath(); c.arc(x+px, y+py+5, 9, 0, 7); c.fill(); } c.globalAlpha = 1; break; }
  case "garland": { const f = curve(s, 16); c.strokeStyle = "#e9dcc4"; c.lineWidth = 1.2; c.beginPath(); for (let k=0;k<=20;k++){ const [px,py] = f(k/20); k ? c.lineTo(x+px, y+py) : c.moveTo(x+px, y+py); } c.stroke();
    const n = Math.max(7, Math.round(s/22)), cols = ["#e63946","#f6c945","#3a6ee8","#2fae74","#f06aa8"];
    for (let k=0;k<n;k++){ const [px,py] = f((k+.5)/n), sw = Math.sin(t/700 + k)*1.5; c.fillStyle = cols[k%cols.length]; c.beginPath(); c.moveTo(x+px-6, y+py); c.lineTo(x+px+6, y+py); c.lineTo(x+px+sw, y+py+14); c.closePath(); c.fill(); } break; }
  case "chandelier": { const cx = x + s/2, k = Math.min(1, s/300); c.strokeStyle = "#b8923a"; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, y + 16*k + 6); c.stroke();
    c.fillStyle = "#e0b54a"; c.beginPath(); c.ellipse(cx, y + 24*k + 6, 26*k + 8, 6*k + 3, 0, 0, 7); c.fill();
    for (let a=-2;a<=2;a++){ const ax = cx + a*(11*k + 4), ay = y + 18*k + 6; c.fillStyle = "#f6ead6"; c.fillRect(ax - 1.5, ay - 6, 3, 7);
      c.fillStyle = `rgba(255,${190 + Math.sin(t/120 + a)*30|0},90,.95)`; c.beginPath(); c.ellipse(ax, ay - 9, 2.2, 3.5 + Math.sin(t/90 + a*2)*.6, 0, 0, 7); c.fill(); }
    c.fillStyle = "rgba(255,220,140,.12)"; c.beginPath(); c.arc(cx, y + 20*k + 6, 44*k + 10, 0, 7); c.fill(); break; }
  case "mobile": { const cx = x + s/2, bw = Math.min(110, s*.4); c.strokeStyle = "#cbb89a"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, y + 8); c.moveTo(cx - bw/2, y + 8); c.lineTo(cx + bw/2, y + 8); c.stroke();
    [-1, -.33, .33, 1].forEach((p, k) => { const sx = cx + p*bw/2, len = 14 + (k%2)*10, sw = Math.sin(t/800 + k*1.3)*4, ex = sx + sw, ey = y + 8 + len;
      c.beginPath(); c.moveTo(sx, y + 8); c.lineTo(ex, ey); c.stroke(); c.fillStyle = k%2 ? "#f6c945" : "#9ed8f0";
      c.beginPath(); for (let i=0;i<10;i++){ const r = i%2 ? 3 : 7, a = -Math.PI/2 + i*Math.PI/5 + sw*.05; c.lineTo(ex + Math.cos(a)*r, ey + 6 + Math.sin(a)*r); } c.closePath(); c.fill(); }); break; }
  case "clock": { const w = s*.6, h = s*1.4; c.fillStyle = "#5a3418"; rr(c, x - w/2, y, w, h, w*.3); c.fill(); c.fillStyle = "#f6ead6"; c.beginPath(); c.arc(x, y + w*.55, w*.36, 0, 7); c.fill();
    const d = new Date(), hr = (d.getHours()%12 + d.getMinutes()/60)/12*Math.PI*2, mn = d.getMinutes()/60*Math.PI*2; c.strokeStyle = "#2a1a0c"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y + w*.55); c.lineTo(x + Math.sin(hr)*w*.2, y + w*.55 - Math.cos(hr)*w*.2); c.moveTo(x, y + w*.55); c.lineTo(x + Math.sin(mn)*w*.3, y + w*.55 - Math.cos(mn)*w*.3); c.stroke();
    c.fillStyle = "#2a1a0c"; rr(c, x - w*.28, y + w*1.05, w*.56, h - w*1.2, w*.15); c.fill();
    const a = Math.sin(t/500)*.35; c.strokeStyle = "#e0b54a"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y + w*1.1); c.lineTo(x + Math.sin(a)*h*.3, y + w*1.1 + Math.cos(a)*h*.3); c.stroke();
    c.fillStyle = "#e0b54a"; c.beginPath(); c.arc(x + Math.sin(a)*h*.3, y + w*1.1 + Math.cos(a)*h*.3, w*.1, 0, 7); c.fill(); break; }
  case "painting": { const w = s*1.35, h = s*.95; c.fillStyle = "#c9962e"; rr(c, x - w/2, y, w, h, 3); c.fill();
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "#f39a5a"); g.addColorStop(.6, "#f7d38a"); g.addColorStop(1, "#7a5a8a"); c.fillStyle = g; c.fillRect(x - w/2 + 5, y + 5, w - 10, h - 10);
    c.fillStyle = "#fff2c0"; c.beginPath(); c.arc(x + w*.12, y + h*.55, h*.14, 0, 7); c.fill();
    c.fillStyle = "#3f3a5a"; c.beginPath(); c.moveTo(x - w/2 + 5, y + h - 5); c.quadraticCurveTo(x - w*.15, y + h*.5, x + w*.1, y + h*.75); c.quadraticCurveTo(x + w*.3, y + h*.55, x + w/2 - 5, y + h*.7); c.lineTo(x + w/2 - 5, y + h - 5); c.closePath(); c.fill(); break; }
  case "darts": { const r = s*.5, cy0 = y + r; ["#2a2420","#f2e6c8","#c0392b","#f2e6c8","#2f7d32","#c0392b"].forEach((col, k) => { c.fillStyle = col; c.beginPath(); c.arc(x, cy0, r*(1 - k*.16), 0, 7); c.fill(); });
    c.strokeStyle = "#e0b54a"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + r*.15, cy0 - r*.1); c.lineTo(x + r*.75, cy0 - r*.6); c.stroke(); c.fillStyle = "#3a6ee8"; c.beginPath(); c.moveTo(x + r*.75, cy0 - r*.6); c.lineTo(x + r*.95, cy0 - r*.55); c.lineTo(x + r*.8, cy0 - r*.8); c.fill(); break; }
  case "calendar": { const w = s*.9, h = s*1.05, d = todayJST(); c.fillStyle = "#f6ead6"; rr(c, x - w/2, y, w, h, 4); c.fill(); c.fillStyle = "#c0392b"; rr(c, x - w/2, y, w, h*.3, 4); c.fill();
    c.fillStyle = "#fff"; c.font = `900 ${Math.round(h*.18)}px "Zen Kaku Gothic New",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(`${d.m}月`, x, y + h*.16);
    c.fillStyle = "#2a1a0c"; c.font = `900 ${Math.round(h*.46)}px "Zen Kaku Gothic New",sans-serif`; c.fillText(`${d.d}`, x, y + h*.64);
    c.fillStyle = "#2a1a0c"; c.beginPath(); c.arc(x - w*.25, y + 2, 2, 0, 7); c.arc(x + w*.25, y + 2, 2, 0, 7); c.fill(); break; }
  case "record": { const w = s*1.1, h = s*1.1; c.fillStyle = "#1e1a16"; rr(c, x - w/2, y, w, h, 3); c.fill(); c.strokeStyle = "#c9962e"; c.lineWidth = 3; rr(c, x - w/2, y, w, h, 3); c.stroke();
    const r = w*.36, cy0 = y + h*.5, g = c.createRadialGradient(x - r*.3, cy0 - r*.3, 2, x, cy0, r); g.addColorStop(0, "#fff2b0"); g.addColorStop(1, "#c9962e"); c.fillStyle = g; c.beginPath(); c.arc(x, cy0, r, 0, 7); c.fill();
    c.strokeStyle = "rgba(120,80,20,.4)"; c.lineWidth = 1; for (let k=1;k<4;k++){ c.beginPath(); c.arc(x, cy0, r*k/4.2, 0, 7); c.stroke(); } c.fillStyle = "#c0392b"; c.beginPath(); c.arc(x, cy0, r*.18, 0, 7); c.fill(); break; }
  case "plaque": { const w = s, h = s*1.2; c.fillStyle = "#6a4129"; c.beginPath(); c.moveTo(x - w/2, y); c.lineTo(x + w/2, y); c.lineTo(x + w/2, y + h*.6); c.quadraticCurveTo(x + w/2, y + h*.9, x, y + h); c.quadraticCurveTo(x - w/2, y + h*.9, x - w/2, y + h*.6); c.closePath(); c.fill();
    c.strokeStyle = "#e0b54a"; c.lineWidth = 2.5; c.stroke(); c.fillStyle = "#e0b54a"; rr(c, x - w*.12, y + h*.15, w*.24, h*.5, w*.08); c.fill(); c.fillRect(x - w*.05, y + h*.08, w*.1, h*.1);
    c.fillStyle = "#fff2b0"; c.fillRect(x - w*.08, y + h*.3, w*.05, h*.25); break; }
  case "neonsign": { const w = s*1.9, h = s*.8, on = Math.sin(t/90) > -.9 || Math.floor(t/2000) % 3; c.fillStyle = "rgba(20,10,25,.85)"; rr(c, x - w/2, y, w, h, 8); c.fill();
    c.strokeStyle = "#5a3a6a"; c.lineWidth = 2; rr(c, x - w/2, y, w, h, 8); c.stroke(); c.font = `900 ${Math.round(h*.52)}px "Zen Kaku Gothic New",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.shadowColor = "#ff4fd0"; c.shadowBlur = on ? 12 : 0; c.fillStyle = on ? "#ffd0f4" : "#7a4a70"; c.fillText("満タン", x, y + h/2 + 1); c.shadowBlur = 0; break; }
  case "alembic": { c.fillStyle = "#c98a3a"; c.beginPath(); c.arc(x - s*.15, y - s*.32, s*.3, 0, 7); c.fill(); c.fillRect(x - s*.25, y - s*.06, s*.2, s*.06);
    c.fillStyle = "#e0a85a"; c.beginPath(); c.arc(x - s*.15, y - s*.68, s*.14, 0, 7); c.fill(); c.strokeStyle = "#c98a3a"; c.lineWidth = s*.07; c.beginPath(); c.moveTo(x - s*.05, y - s*.72); c.quadraticCurveTo(x + s*.35, y - s*.85, x + s*.42, y - s*.3); c.stroke();
    c.fillStyle = "rgba(120,200,255,.6)"; c.beginPath(); c.arc(x + s*.42, y - s*.15, s*.13, 0, 7); c.fill(); const bub = (t/400) % 1; c.fillStyle = "rgba(255,255,255,.7)"; c.beginPath(); c.arc(x - s*.15, y - s*.3 - bub*s*.2, s*.04, 0, 7); c.fill(); break; }
  case "plant": { c.fillStyle = "#3f7d3a"; for (let k=0;k<7;k++){ const a = -Math.PI/2 + (k - 3)*.4 + Math.sin(t/1200 + k)*.05; c.beginPath(); c.ellipse(x + Math.cos(a)*s*.45, y - s*.45 + Math.sin(a)*s*.55, s*.14, s*.32, a + Math.PI/2, 0, 7); c.fill(); }
    c.fillStyle = "#b5653a"; c.beginPath(); c.moveTo(x - s*.32, y - s*.42); c.lineTo(x + s*.32, y - s*.42); c.lineTo(x + s*.24, y); c.lineTo(x - s*.24, y); c.closePath(); c.fill(); break; }
  case "register": { c.fillStyle = "#8a6a3a"; rr(c, x - s*.55, y - s*.55, s*1.1, s*.55, 4); c.fill(); c.fillStyle = "#c9962e"; rr(c, x - s*.42, y - s*.95, s*.84, s*.42, 4); c.fill();
    c.fillStyle = "#1e1a16"; c.fillRect(x - s*.3, y - s*.88, s*.6, s*.18); c.fillStyle = "#7fd17a"; c.font = `700 ${Math.round(s*.15)}px monospace`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(yen(money||0), x, y - s*.79);
    c.fillStyle = "#f6ead6"; for (let i=0;i<3;i++) for (let j=0;j<2;j++){ c.beginPath(); c.arc(x - s*.3 + i*s*.3, y - s*.38 + j*s*.18, s*.06, 0, 7); c.fill(); } break; }
  case "lamp": { const on = .8 + .2*Math.sin(t/900); c.fillStyle = `rgba(255,215,130,${.14*on})`; c.beginPath(); c.moveTo(x - s*.2, y - s*.95); c.lineTo(x - s*.9, y); c.lineTo(x + s*.9, y); c.lineTo(x + s*.2, y - s*.95); c.closePath(); c.fill();
    c.fillStyle = "#2f5d3a"; c.beginPath(); c.moveTo(x - s*.45, y - s*.75); c.lineTo(x + s*.45, y - s*.75); c.lineTo(x + s*.25, y - s*1.15); c.lineTo(x - s*.25, y - s*1.15); c.closePath(); c.fill();
    c.fillStyle = "#c9962e"; c.fillRect(x - s*.04, y - s*.75, s*.08, s*.68); rr(c, x - s*.3, y - s*.1, s*.6, s*.1, 3); c.fill(); break; }
  case "globe": { c.fillStyle = "#6a4129"; rr(c, x - s*.3, y - s*.1, s*.6, s*.1, 3); c.fill(); c.fillRect(x - s*.04, y - s*.3, s*.08, s*.22);
    const r = s*.38, cy0 = y - s*.68; c.fillStyle = "#3a8ac9"; c.beginPath(); c.arc(x, cy0, r, 0, 7); c.fill(); c.save(); c.beginPath(); c.arc(x, cy0, r, 0, 7); c.clip();
    const o = (t/40) % (r*4); c.fillStyle = "#6fbf5a"; [[0,-.3,.35,.22],[1.3,.15,.3,.3],[2.6,-.1,.25,.18]].forEach(([dx,dy,rx,ry]) => { for (const k of [-4,0]){ c.beginPath(); c.ellipse(x - r*2 + ((dx*r + o + k*r) % (r*4) + r*4) % (r*4), cy0 + dy*r, rx*r, ry*r, 0, 0, 7); c.fill(); } }); c.restore();
    c.strokeStyle = "#c9962e"; c.lineWidth = 2; c.beginPath(); c.arc(x, cy0, r + 3, Math.PI*.6, Math.PI*2.4); c.stroke(); break; }
  case "maneki": { const wave = Math.sin(t/260)*.4; c.fillStyle = "#e0b54a"; c.beginPath(); c.ellipse(x, y - s*.32, s*.36, s*.32, 0, 0, 7); c.fill();
    c.beginPath(); c.arc(x, y - s*.78, s*.3, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - s*.28, y - s*.9); c.lineTo(x - s*.2, y - s*1.14); c.lineTo(x - s*.05, y - s*1.02); c.moveTo(x + s*.28, y - s*.9); c.lineTo(x + s*.2, y - s*1.14); c.lineTo(x + s*.05, y - s*1.02); c.fill();
    c.save(); c.translate(x + s*.3, y - s*.6); c.rotate(-.4 + wave); c.beginPath(); c.ellipse(0, -s*.18, s*.1, s*.2, 0, 0, 7); c.fill(); c.restore();
    c.fillStyle = "#c0392b"; c.fillRect(x - s*.25, y - s*.55, s*.5, s*.06); c.fillStyle = "#fff2b0"; c.beginPath(); c.ellipse(x, y - s*.28, s*.14, s*.1, 0, 0, 7); c.fill();
    c.strokeStyle = "#5b3a10"; c.lineWidth = 1.5; c.beginPath(); c.arc(x - s*.11, y - s*.8, s*.05, Math.PI, 0); c.arc(x + s*.11, y - s*.8, s*.05, Math.PI, 0); c.stroke(); break; }
  }
  c.restore();
}
function decorOn(slot){ const id = save.decor[slot]; return id && save.decor.owned.includes(id) ? id : null; }
function draw(){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const sh = lay.sh, cy = lay.counterY;
  if (!lay.bg) lay.bg = buildBg();
  ctx.drawImage(lay.bg, 0, 0, W, H);
  if (S.w === 4){ const ww = Math.min(W*.5, 260), wx = W/2 - ww/2, wh = cy*.4;
    ctx.fillStyle = "rgba(255,255,255,.75)"; for (let i=0;i<26;i++){ const sx = wx + ((i*53) % ww), sy = 14 + ((i*37 + T*.02*(1 + i%3)) % wh); ctx.beginPath(); ctx.arc(sx, sy, 1.2 + i%2, 0, 7); ctx.fill(); }
  }
  if (S.w === 9 || S.dark){ /* 灯台の光は下で */ }
  slowLayer("back", () => (has("juke") || decorOn("ceil") || decorOn("wall")), c => {
    if (has("juke")) drawJuke(c, cy);
    { const d = decorOn("ceil"); if (d) drawDecor(c, d, 0, 0, W, T); }
    { const d = decorOn("wall"); if (d) drawDecor(c, d, W/2, cy*.06, Math.min(48, cy*.22), T); } });
  evAnim(ctx, W, cy, T);
  // お客さん
  seats.forEach((s, k) => {
    const p = lay.seatPos[k], size = Math.min(lay.seatW*.42, 64), headY = cy - size*.62;
    if (s.state === "empty") return;
    let dy = 0, alpha = 1;
    if (s.state === "in"){ const a = Math.min(1, (T - s.t0)/450); dy = (1 - ease(a))*size*1.2; alpha = a; }
    if (s.state === "leave"){ const a = Math.min(1, (T - s.t0)/900); dy = ease(a)*size*1.3; alpha = 1 - a; }
    let mood = "ok";
    if (s.state === "wait"){ const left = 1 - (T - s.t0)/s.pat; mood = left > .6 ? "happy" : left > .3 ? "ok" : left > .15 ? "worried" : "angry"; }
    if (s.state === "leave") mood = s.mood;
    ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.rect(0, 0, W, cy); ctx.clip();
    if (s.evc && evNow()) evDrawChara(ctx, evNow(), p.x, headY + dy, size, mood, T + k*700); else drawGuest(ctx, s.g, p.x, headY + dy, size, mood, T + k*700);
    evGuestHat(ctx, s, k, p.x, headY + dy, size, T);
    if (s.critic){ const hx = p.x, hy = headY + dy; ctx.fillStyle = "#2a2440"; ctx.beginPath(); ctx.ellipse(hx - size*.05, hy - size*.4, size*.36, size*.13, -.15, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(hx + size*.1, hy - size*.52, size*.05, 0, 7); ctx.fill();
      ctx.strokeStyle = "#e0b54a"; ctx.lineWidth = Math.max(1.5, size*.04); ctx.beginPath(); ctx.arc(hx + size*.16, hy - size*.03, size*.1, 0, 7); ctx.moveTo(hx + size*.26, hy); ctx.lineTo(hx + size*.32, hy + size*.25); ctx.stroke(); }
    if (s.regular){ ctx.fillStyle = "#ef6b8a"; heart(ctx, p.x + size*.42, headY + dy + size*.28, size*.09); }
    ctx.restore();
    if (s.state === "leave" && s.mood === "love"){ ctx.fillStyle = "#ef6b8a"; ctx.globalAlpha = alpha; heart(ctx, p.x + size*.5, headY - size*.6 - (T-s.t0)*.03, size*.12); ctx.globalAlpha = 1; }
    if (s.state === "wait" || s.state === "in"){
      const n = s.cock ? 1.4 : s.order.length, bh0 = Math.min(lay.seatW*.42, 62), bh = bh0 + (s.cock ? 0 : 13), cell = Math.min(bh0*.62, (lay.seatW*1.05 - 18)/n), bw = Math.max(bh0*1.15, n*cell + 18), bx = p.x - bw/2, by = Math.max(4, headY - size*.72 - bh - 8);
      ctx.globalAlpha = alpha;
      { const sp = bubbleSprite(s, bw, bh, cell, n); ctx.drawImage(sp.cv, bx - 12, by - 14, sp.w, sp.h); }
      const left = s.state === "wait" ? Math.max(0, 1 - (T - s.t0)/s.pat) : 1;
      ctx.fillStyle = "rgba(42,26,12,.15)"; rr(ctx, bx + 8, by + bh - 10, bw - 16, 5, 2.5); ctx.fill();
      ctx.fillStyle = left > .5 ? "#4caf50" : left > .25 ? "#e0a020" : "#d9473a"; rr(ctx, bx + 8, by + bh - 10, (bw - 16)*left, 5, 2.5); ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
  slowLayer("front", () => (upg("tip") || has("cat") || decorOn("counter")), c => {
    drawFlowers(c, cy, upg("tip"));
    if (has("cat")) drawCat(c, cy);
    { const d = decorOn("counter"); if (d){ const sz = Math.min(40, lay.seatW*.3); drawDecor(c, d, sz*.85, cy + 1, sz, T); } } }, cy - 90, cy + 8);
  if (happyNow()){ const left = Math.ceil((hhT + HH_LEN - T)/1000), bw = Math.min(W - 24, 260), bx = W/2 - bw/2, by = cy + 30;
    ctx.globalAlpha = .92; ctx.fillStyle = "#3a1f0c"; rr(ctx, bx, by, bw, 26, 13); ctx.fill(); ctx.strokeStyle = `hsl(${(T*.2)%360},90%,65%)`; ctx.lineWidth = 2; rr(ctx, bx, by, bw, 26, 13); ctx.stroke();
    ctx.fillStyle = "#ffd56b"; ctx.font = `900 13px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(`🍻 ハッピーアワー 代金1.5倍　あと${left}秒`, W/2, by + 13); ctx.globalAlpha = 1; }
  if (S.reserve && resQ.length){ // 予約ボード
    const bw = Math.min(W - 24, 230), bh = 34, bx = W/2 - bw/2, by = 6;
    ctx.fillStyle = "rgba(30,20,12,.88)"; rr(ctx, bx, by, bw, bh, 10); ctx.fill(); ctx.strokeStyle = "#c9962e"; ctx.lineWidth = 2; rr(ctx, bx, by, bw, bh, 10); ctx.stroke();
    ctx.fillStyle = "#f3d27a"; ctx.font = `900 12px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("ご予約", bx + 10, by + bh/2);
    const cell = 13; let x = bx + 60;
    resQ.slice(0, 2).forEach((o, k) => { if (k){ ctx.fillStyle = "#bba895"; ctx.fillText("→", x - 4, by + bh/2); x += 12; } o.forEach(c => { miniBottle(ctx, x + cell/2, by + bh - 6, 24, COLORS[c], false, c); x += cell; }); x += 12; }); }
  // 仕込み：手数と目安は上の表示に出ているので、絵の中には描かない（飾りと重ならないように）
  // 流し
  const sk = lay.sink, sw = sh.w*1.25, on = sel >= 0;
  if (S.mode !== "prep"){
  ctx.fillStyle = on ? "#6d7b80" : "#4d575b"; rr(ctx, sk.x - sw/2, sk.y + sh.H*.18, sw, sh.H*.28, 8); ctx.fill();
  ctx.fillStyle = "#2b3134"; ctx.beginPath(); ctx.ellipse(sk.x, sk.y + sh.H*.24, sw*.36, sh.H*.05, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = "#9aa7ad"; ctx.lineWidth = sh.w*.09; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(sk.x + sw*.35, sk.y + sh.H*.18); ctx.lineTo(sk.x + sw*.35, sk.y - sh.H*.05); ctx.quadraticCurveTo(sk.x + sw*.35, sk.y - sh.H*.13, sk.x + sw*.1, sk.y - sh.H*.1); ctx.stroke();
  ctx.fillStyle = on ? "#f2b54a" : "#bba895"; ctx.font = `700 ${Math.max(11, sh.w*.3)}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(on ? "ここに捨てる" : "流し", sk.x, sk.y + sh.H*.5);

  // 仕入れ台：次に届く瓶が見えている
  { const su = lay.supply, cw = sh.w*1.3, ch = sh.H*.24, hasEmpty = emptyIdx() >= 0;
    let sx = su.x; if (shakeT.supply && T - shakeT.supply < 300){ const a = (T - shakeT.supply)/300; sx += Math.sin(a*Math.PI*6)*(1-a)*sh.w*.1; }
    const cy0 = su.y + sh.H/2 - ch;
    ctx.fillStyle = "#8a6038"; rr(ctx, sx - cw/2, cy0, cw, ch, 6); ctx.fill();
    ctx.strokeStyle = "rgba(60,35,15,.6)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - cw/2 + 4, cy0 + ch*.5); ctx.lineTo(sx + cw/2 - 4, cy0 + ch*.5); ctx.moveTo(sx - cw/2 + 6, cy0 + 4); ctx.lineTo(sx + cw/2 - 6, cy0 + ch - 4); ctx.stroke();
    if (upg("refill")){ const mx = sx - cw*.32, my = cy0 + ch*.5, mr = Math.max(5, sh.w*.14); ctx.strokeStyle = upg("refill") >= 2 ? "#e0b54a" : "#d8d2c4"; ctx.lineWidth = Math.max(2, mr*.35);
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.moveTo(mx + mr*.7, my + mr*.7); ctx.lineTo(mx + mr*1.6, my + mr*1.6); ctx.stroke(); ctx.fillStyle = "rgba(180,220,240,.35)"; ctx.beginPath(); ctx.arc(mx, my, mr*.8, 0, 7); ctx.fill(); }
    const mini = bottleShape(save.bottle, sh.w*.72), slide = Math.min(1, (T - stockT)/350), off = (1 - ease(slide))*sh.w*.9;
    drawVessel(ctx, mini, sx - sh.w*.12 + off, cy0 - mini.H/2 + 2, 0, stock[0].map((c,j) => ({c, v:1, h: !!S.hide && j < CAP-1})), {alpha: hasEmpty && supplyLeft > 0 ? 1 : .45, dark: darkNow() && !litAt(sx)});
    const tiny = bottleShape(save.bottle, sh.w*.42);
    drawVessel(ctx, tiny, sx + sh.w*.52 + off*.5, cy0 - tiny.H/2 + 2, 0, stock[1].map((c,j) => ({c, v:1, h: !!S.hide && j < CAP-1})), {alpha: .55});
    if (has("ledger") && stock[2]) drawVessel(ctx, tiny, sx + sh.w*.86 + off*.3, cy0 - tiny.H/2 + 2, 0, stock[2].map((c,j) => ({c, v:1, h: !!S.hide && j < CAP-1})), {alpha: .4});
    const need = wantedNow(), have = {}; bottles.forEach(b => b.units.forEach(u => have[u.c] = (have[u.c]||0) + 1));
    const short = need.some(c => (have[c]||0) === 0);
    ctx.font = `700 ${Math.max(11, sh.w*.3)}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillStyle = !hasEmpty ? "#7d6c5d" : short && Math.sin(T/180) > 0 ? "#f2b54a" : "#bba895";
    ctx.fillText(supplyLeft <= 0 ? "仕入れ終了" : hasEmpty ? "仕入れ" : "空き瓶なし", su.x, su.y + sh.H*.5);
    if (supplyLeft < Infinity && supplyLeft > 0){ ctx.font = `700 ${Math.max(10, sh.w*.24)}px "Zen Kaku Gothic New",sans-serif`; ctx.fillStyle = supplyLeft <= 5 ? "#ef6b5b" : "#bba895"; ctx.fillText(`あと${supplyLeft}回`, su.x, su.y + sh.H*.5 + Math.max(13, sh.w*.36)); } }
  // 保管棚
  { const rk = lay.rack, rw = lay.slot*.92, ry = rk.y + sh.H*.18 + sh.w*.55*1.6;
    ctx.fillStyle = room.shelf; rr(ctx, rk.x - rw/2, ry, rw, sh.w*.16, 3); ctx.fill(); ctx.fillStyle = room.stop; ctx.fillRect(rk.x - rw/2 + 3, ry, rw - 6, 2);
    const ms = bottleShape(save.bottle, Math.min(sh.w*.55, lay.slot*.26, lay.slot*.8/storeCap)), need = wantedNow();
    for (let k=0;k<storeCap;k++){ const p = rackSlot(k);
      if (k < stored.length){ const c = stored[k], glow = need.includes(c) && Math.sin(T/180) > 0, drop = k === stored.length-1 ? Math.max(0, 1 - (T - storeT)/300) : 0;
        drawVessel(ctx, ms, p.x, ry - ms.H/2 - drop*sh.H*.3, 0, [{c, v:CAP}], {cork:1, glow}); }
      else { ctx.strokeStyle = "rgba(187,168,149,.25)"; ctx.setLineDash([3,4]); ctx.lineWidth = 1.5; rr(ctx, p.x - ms.w/2, ry - ms.H, ms.w, ms.H - 2, ms.w*.3); ctx.stroke(); ctx.setLineDash([]); } }
    ctx.font = `700 ${Math.max(11, sh.w*.3)}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillStyle = stored.some(c => need.includes(c)) && Math.sin(T/180) > 0 ? "#f2b54a" : "#bba895";
    ctx.fillText(`保管 ${stored.length}/${storeCap}`, rk.x, rk.y + sh.H*.5); }
  }
  const active = new Map(); pours.forEach(p => { active.set(p.from, p); active.set(p.to, p); });
  // 瓶
  bottles.forEach((b, i) => {
    const p = lay.pos[i];
    lift[i] += ((sel === i ? 1 : 0) - lift[i]) * .3;
    const pr = active.get(i); if (pr && pr.from === i) return;
    let x = p.x, y = p.y - lift[i]*sh.w*.5;
    if (shakeT[i] && T - shakeT[i] < 300){ const a = (T - shakeT[i])/300; x += Math.sin(a*Math.PI*6)*(1-a)*sh.w*.1; }
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(p.x, p.y + sh.H/2 - 1, sh.w*.45, sh.w*.1, 0, 0, 7); ctx.fill();
    let layers = b.units.map(u => ({c:u.c, v:1, h:u.h || !!b.cloth, rev:u.rev})), wave = 0;
    if (pr && pr.to === i){ const prog = Math.max(0, Math.min(1, (T - pr.t0 - pr.T1)/pr.T2)); layers = pr.dstBefore.map(u => ({c:u.c, v:1, h:u.h})).concat([{c:pr.c, v: pr.n*prog}]); wave = prog>0 && prog<1 ? sh.w*.035 : 0; }
    else if (waveT[i]){ const a = (T - waveT[i])/900; if (a < 1) wave = sh.w*.04*(1-a); }
    if (b.refillT != null && T - b.refillT < 500){ const k = (T - b.refillT)/500; layers = layers.map(L => ({...L, v: L.v*k})); }
    let corkK = null, glow = false;
    if (b.corked){ corkK = Math.min(1, Math.max(0, (T - b.corkT)/320)); corkK = 1 - Math.pow(1 - corkK, 3);
      const need = wantedNow().includes(b.units[0].c); glow = need && Math.sin(T/180) > 0; }
    drawVessel(ctx, sh, x, y, 0, layers, {wave, t: T, sel: sel === i, cork: corkK, glow, dark: darkNow() && !litAt(x)});
    if (b.lock != null || (lockWarn && lockWarn.i === i) || (b.unlockT != null && T - b.unlockT < 500)){ // カギ
      const warn = b.lock == null && lockWarn && lockWarn.i === i, opening = b.lock == null && !warn, k = opening ? 1 - (T - b.unlockT)/500 : 1, c = warn ? lockWarn.c : b.lock;
      ctx.save(); ctx.globalAlpha = warn ? .45 + .4*Math.abs(Math.sin(T/120)) : k;
      ctx.strokeStyle = "#8a7a5a"; ctx.lineWidth = Math.max(2, sh.w*.07); ctx.setLineDash([sh.w*.12, sh.w*.06]); ctx.beginPath(); ctx.moveTo(x - sh.w*.62, y - sh.H*.3); ctx.lineTo(x + sh.w*.62, y + sh.H*.1); ctx.moveTo(x + sh.w*.62, y - sh.H*.3); ctx.lineTo(x - sh.w*.62, y + sh.H*.1); ctx.stroke(); ctx.setLineDash([]);
      const ly = y - sh.H*.1 - (opening ? (1-k)*sh.H*.3 : 0), lw = sh.w*.62;
      ctx.strokeStyle = "#c9962e"; ctx.lineWidth = sh.w*.08; ctx.beginPath(); ctx.arc(x, ly - lw*.35, lw*.32, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = "#e0b54a"; rr(ctx, x - lw/2, ly - lw*.35, lw, lw*.8, lw*.15); ctx.fill(); ctx.fillStyle = COLORS[c]; ctx.beginPath(); ctx.arc(x, ly + lw*.05, lw*.22, 0, 7); ctx.fill();
      if (save.cb) sym(ctx, c, x, ly + lw*.05, lw*.14);
      if (b.lock != null){ ctx.fillStyle = "#f3d27a"; ctx.font = `900 ${Math.max(10, sh.w*.24)}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(`あと${Math.max(0, Math.ceil((LOCK_LEN - (T - (b.lockT0||0)))/1000))}秒`, x, ly + lw*.5); }
      if (warn){ ctx.fillStyle = "#f3d27a"; ctx.font = `900 ${Math.max(10, sh.w*.26)}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText(`🔒まもなく ${Math.max(1, Math.ceil((3000 - (T - lockWarn.t0))/1000))}`, p.x, p.y - sh.H/2 - sh.w*.3); }
      ctx.restore(); }
    if (freezeWarn && freezeWarn.i === i){ const k = Math.min(1, (T - freezeWarn.t0)/FREEZE_WARN);
      ctx.save(); ctx.globalAlpha = .15 + .45*k; ctx.fillStyle = "rgba(190,230,250,.8)"; rr(ctx, x - sh.w*.62, y - sh.H*.56, sh.w*1.24, sh.H*1.1, sh.w*.3); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(235,250,255,${.4 + .5*Math.abs(Math.sin(T/120))})`; ctx.lineWidth = 2; ctx.setLineDash([4,4]); rr(ctx, x - sh.w*.62, y - sh.H*.56, sh.w*1.24, sh.H*1.1, sh.w*.3); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#e9f7fd"; ctx.font = `900 ${Math.max(10, sh.w*.26)}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(`❄凍りそう！ ${Math.max(1, Math.ceil((FREEZE_WARN - (T - freezeWarn.t0))/1000))}`, p.x, p.y - sh.H/2 - sh.w*.3); ctx.restore(); }
    const melt = b.meltT != null && T - b.meltT < 600 ? 1 - (T - b.meltT)/600 : 0;
    if (b.ice || melt){
      ctx.save(); ctx.globalAlpha = b.ice ? 1 : melt;
      ctx.fillStyle = "rgba(190,230,250,.42)"; rr(ctx, x - sh.w*.62, y - sh.H*.56, sh.w*1.24, sh.H*1.1, sh.w*.3); ctx.fill();
      ctx.strokeStyle = "rgba(235,250,255,.85)"; ctx.lineWidth = 2; rr(ctx, x - sh.w*.62, y - sh.H*.56, sh.w*1.24, sh.H*1.1, sh.w*.3); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(x - sh.w*.3, y - sh.H*.4); ctx.lineTo(x - sh.w*.05, y - sh.H*.25); ctx.lineTo(x - sh.w*.2, y - sh.H*.1);
      ctx.moveTo(x + sh.w*.35, y + sh.H*.1); ctx.lineTo(x + sh.w*.1, y + sh.H*.22); ctx.stroke();
      if (b.ice){ ctx.fillStyle = "#e9f7fd"; ctx.beginPath(); ctx.arc(x, y, sh.w*.34, 0, 7); ctx.fill();
        ctx.fillStyle = "#2f6f8f"; ctx.font = `900 ${sh.w*.4}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(b.iceT ? Math.max(1, Math.ceil((b.iceT - T)/1000)) : b.ice, x, y + 1); }
      ctx.restore(); }
    if (b.cloth || (b.clothOffT != null && T - b.clothOffT < 600)) drawCloth(ctx, b, x, y, sh);
    if (b.glass){ const st = cockState();
      ctx.strokeStyle = `rgba(255,170,220,${.5 + .3*Math.sin(T/300)})`; ctx.lineWidth = 2.5; rr(ctx, x - sh.w*.62, y - sh.H*.58, sh.w*1.24, sh.H*1.14, sh.w*.3); ctx.stroke();
      ctx.fillStyle = "#f6e05a"; ctx.beginPath(); ctx.arc(x + sh.nw*.9, y - sh.H/2 + sh.H*.02, sh.w*.2, Math.PI*.9, Math.PI*2.1); ctx.fill();
      ctx.font = `700 ${Math.max(10, sh.w*.26)}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "top";
      const ly = p.y + sh.H/2 + sh.w*.28;
      if (st && st.u.length && !st.ok){ ctx.fillStyle = Math.sin(T/160) > 0 ? "#ef6b5b" : "#ffb3e6"; ctx.fillText("✗ 流しへ", p.x, ly); }
      else if (st && st.next != null){ ctx.fillStyle = "#ffb3e6"; ctx.fillText("次：" + CNAME[st.next], p.x, ly); ctx.fillStyle = COLORS[st.next]; ctx.beginPath(); ctx.arc(p.x, ly + sh.w*.5, sh.w*.13, 0, 7); ctx.fill(); if (save.cb) sym(ctx, st.next, p.x, ly + sh.w*.5, sh.w*.09); }
      else { ctx.fillStyle = "#d9a6c4"; ctx.fillText(st && !st.g ? "カクテル用" : "カクテル", p.x, ly); if (st && !st.g){ ctx.font = `700 ${Math.max(9, sh.w*.2)}px "Zen Kaku Gothic New",sans-serif`; ctx.fillText("注文待ち", p.x, ly + sh.w*.34); } }
      return; }
    if (b.corked && !wantedNow().includes(b.units[0].c)){ ctx.fillStyle = "#bba895"; ctx.font = `700 ${Math.max(10, sh.w*.26)}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText("注文待ち", p.x, p.y - sh.H/2 - sh.w*.3); }
    else if (!b.units.length && !b.ice){ ctx.fillStyle = "#7d6c5d"; ctx.font = `700 ${Math.max(10, sh.w*.26)}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText("空き瓶", p.x, p.y + sh.H/2 + sh.w*.28); }
  });
  // 注いでいる瓶
  pours = pours.filter(p => {
    const e = T - p.t0, q0 = lay.pos[p.from], rest = [q0.x, q0.y - sh.w*.5];
    let a, x, y, vol = p.srcBefore.length, stream = 0;
    if (e < p.T1){ const k = ease(e/p.T1); a = p.a0*k; const [px,py] = posForAngle(p, a); x = rest[0] + (px-rest[0])*k; y = rest[1] + (py-rest[1])*k; }
    else if (e < p.T1 + p.T2){ const k = (e - p.T1)/p.T2; a = p.a0 + (p.a1-p.a0)*k; [x,y] = posForAngle(p, a); vol = p.srcBefore.length - p.n*k; stream = k;
      if (!p.snd){ p.snd = 1; pourSound(p.T2/1000/SPEED, p.dstBefore.length/CAP, (p.dstBefore.length+p.n)/CAP); } }
    else if (e < p.T1 + p.T2 + p.T3){ const k = ease((e - p.T1 - p.T2)/p.T3); const [px,py] = posForAngle(p, p.a1); a = p.a1*(1-k); x = px + (q0.x-px)*k; y = py + (q0.y-py)*k; vol = p.srcBefore.length - p.n; }
    else { lift[p.from] = 0; finishPour(p); return false; }
    const keep = p.srcBefore.length - p.n, layers = p.srcBefore.slice(0, keep).map(u => ({c:u.c, v:1, h:u.h})).concat([{c:p.c, v: vol - keep}]);
    if (stream){
      const tip = rot([[p.dir*sh.nw, sh.top]], a)[0], tx = x + tip[0], ty = y + tip[1], tpos = lay.pos[p.to];
      if (!sh.T0) sh.T0 = table(sh.P);
      const surf = levelY(sh.T0, (p.dstBefore.length + p.n*stream)*sh.unit) + tpos.y;
      const sw = sh.w*.12*(stream < .15 ? stream/.15 : stream > .9 ? (1-stream)/.1 : 1), wob = Math.sin(T/40)*sh.w*.012, ex = tpos.x - p.dir*sh.nw*.15;
      ctx.fillStyle = COLORS[p.c]; ctx.beginPath(); ctx.moveTo(tx - sw/2, ty); ctx.quadraticCurveTo(tx - sw/2 + wob, (ty+surf)/2, ex - sw*.4, surf);
      ctx.lineTo(ex + sw*.4, surf); ctx.quadraticCurveTo(tx + sw/2 + wob, (ty+surf)/2, tx + sw/2, ty); ctx.closePath(); ctx.fill();
      if (has("spout")){ ctx.fillStyle = "#ffe08a"; for (let k=0;k<4;k++){ const f = ((T/260) + k/4) % 1, gx = tx + (ex - tx)*f + Math.sin(T/90 + k*2)*sh.w*.1, gy = ty + (surf - ty)*f, r = sh.w*.05*(1 - Math.abs(f - .5));
        ctx.beginPath(); ctx.moveTo(gx, gy - r*2); ctx.lineTo(gx + r*.6, gy); ctx.lineTo(gx, gy + r*2); ctx.lineTo(gx - r*.6, gy); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(gx - r*2, gy); ctx.lineTo(gx, gy + r*.6); ctx.lineTo(gx + r*2, gy); ctx.lineTo(gx, gy - r*.6); ctx.closePath(); ctx.fill(); }
        ctx.strokeStyle = "#e0b54a"; ctx.lineWidth = Math.max(2, sh.w*.06); ctx.beginPath(); ctx.arc(tx, ty, sh.w*.09, 0, 7); ctx.stroke(); }
    }
    drawVessel(ctx, sh, x, y, a, layers, {t: T, dark: darkNow() && !litAt(x)});
    return true;
  });
  // お客さんへ飛んでいく瓶
  flights = flights.filter(f => {
    const a = Math.min(1, (T - f.t0)/f.dur), e = ease(a), sp = lay.seatPos[f.k], size = Math.min(lay.seatW*.42, 64);
    const tx = sp.x, ty = cy - size*.3, x = f.from.x + (tx - f.from.x)*e, arc = Math.min(f.from.y, ty) - sh.H*.5;
    const y = (1-e)*(1-e)*f.from.y + 2*(1-e)*e*arc + e*e*ty, s = 1 - .45*e;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(e*Math.PI)*.25);
    if (f.cock) drawCock(ctx, 0, sh.H*.3, sh.H*.75, f.cock, false); else drawVessel(ctx, sh, 0, 0, 0, [{c:f.c, v:CAP}], {cork:1}); ctx.restore();
    if (a >= 1){ landFlight(f); return false; }
    return true;
  });
  parts = parts.filter(s => T - s.t0 < s.life);
  parts.forEach(s => { const a = (T - s.t0)/s.life; if (a < 0) return; const x = s.x + s.vx*a*50, y = s.y + s.vy*a*50 + a*a*30; ctx.globalAlpha = 1 - a;
    if (s.heart){ ctx.fillStyle = "#ef6b8a"; heart(ctx, x, y, s.r*2.2); } else if (s.ice){ ctx.fillStyle = "#d8f2fc"; ctx.fillRect(x - s.r, y - s.r, s.r*2, s.r*2); } else { ctx.fillStyle = "#ffe6a8"; ctx.beginPath(); ctx.arc(x, y, s.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; });
  { const hp = tutHand(); if (hp){ const bob = Math.sin(performance.now()/220)*6, r = sh.w*.75 + Math.sin(performance.now()/300)*4;
      ctx.strokeStyle = "rgba(255,214,107,.9)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hp.x, hp.y, r, 0, 7); ctx.stroke();
      ctx.font = `${Math.round(sh.w*.9)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText("👆", hp.x + sh.w*.2, hp.y + sh.H*.15 + bob); } }
  if (S.dark && (darkNow() || darkSoon())){ // 停電：暗くして、灯台の光だけ明るく
    const on = darkNow(), flick = darkSoon() ? (Math.sin(T/60) > .3 ? .35 : 0) : .55;
    ctx.save(); ctx.fillStyle = `rgba(4,8,22,${flick})`; ctx.fillRect(0, cy + 18, W, H - cy - 18);
    if (on){ const bx = beamX(), g = ctx.createLinearGradient(bx - lay.slot, 0, bx + lay.slot, 0); g.addColorStop(0, "rgba(255,240,180,0)"); g.addColorStop(.5, "rgba(255,240,180,.22)"); g.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W*.17, cy*.14); ctx.lineTo(bx - lay.slot*.8, H); ctx.lineTo(bx + lay.slot*.8, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#cfe0ff"; ctx.font = `900 13px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(`停電中… あと${Math.ceil((darkT + DARK_LEN - T)/1000)}秒`, W/2, cy + 40); }
    ctx.restore(); }
  floats = floats.filter(f => T - f.t0 < 1400);
  floats.forEach(f => { const a = (T - f.t0)/1400; if (a < 0) return; ctx.globalAlpha = a < .8 ? 1 : (1 - a)/.2;
    ctx.font = `900 ${16*f.size}px "Zen Kaku Gothic New",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(20,12,8,.85)"; ctx.strokeText(f.text, f.x, f.y - a*30); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y - a*30); ctx.globalAlpha = 1; });
}
requestAnimationFrame(frame);

// 布をかけた瓶（仕込み11章〜）。赤いチェックのふきんをかぶせて、取れる条件の札を付ける
function drawCloth(c, b, x, y, sh){
  const off = b.cloth ? 0 : Math.min(1, (T - b.clothOffT)/600), f = b.cloth || {c: -1, n: 0};
  c.save(); c.globalAlpha = 1 - off; c.translate(x, y - off*sh.H*.5);
  const w = sh.w*.68, top = -sh.H*.6, bot = sh.H*.22;
  c.beginPath(); c.moveTo(-w*.55, top + sh.w*.2); c.quadraticCurveTo(0, top - sh.w*.25, w*.55, top + sh.w*.2);
  c.lineTo(w, bot); for (let k=0;k<=6;k++){ const px = w - k*w*2/6; c.quadraticCurveTo(px + w/6, bot + (k % 2 ? -1 : 1)*sh.w*.08, px, bot); } c.closePath();
  c.fillStyle = "#fbf4e6"; c.fill(); c.save(); c.clip();
  c.fillStyle = "rgba(204,64,56,.32)"; const step = sh.w*.22;
  for (let px = -w; px < w; px += step*2) c.fillRect(px, top - sh.w*.3, step, bot - top + sh.w*.5);
  for (let py = top - sh.w*.3; py < bot + sh.w*.2; py += step*2) c.fillRect(-w, py, w*2, step);
  c.restore();
  c.strokeStyle = "rgba(120,40,30,.35)"; c.lineWidth = 1.2; c.stroke();
  // 札：色の丸と数字（どの色でもよいときは★）
  const r = sh.w*.32, ty = top + (bot - top)*.45;
  c.fillStyle = "#fffaf0"; c.beginPath(); c.arc(0, ty, r, 0, 7); c.fill(); c.strokeStyle = f.c < 0 ? "#c9962e" : COLORS[f.c]; c.lineWidth = Math.max(2, sh.w*.07); c.stroke();
  if (f.c >= 0){ c.fillStyle = COLORS[f.c]; c.beginPath(); c.arc(0, ty - r*.18, r*.42, 0, 7); c.fill(); if (save.cb) sym(c, f.c, 0, ty - r*.18, r*.28); }
  else { c.fillStyle = "#e0b54a"; c.beginPath(); for (let k=0;k<10;k++){ const a = -Math.PI/2 + k*Math.PI/5, rr2 = k % 2 ? r*.2 : r*.45; c.lineTo(Math.cos(a)*rr2, ty - r*.18 + Math.sin(a)*rr2); } c.closePath(); c.fill(); }
  c.fillStyle = "#3a2a1c"; c.font = `900 ${r*.62}px "Zen Kaku Gothic New",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(f.n || "", 0, ty + r*.55);
  c.restore();
}
