// ご注文は満タンで：季節のイベント（日付で自動に始まって終わる）
// 期間中は、お店とマップが季節の飾りになり、お客さんも仮装して来る。ステージをクリアすると「印」がたまり、限定の小物と称号がもらえる
const EVENTS = [
  {id: "hanami",    name: "お花見",     ic: "🌸", mark: "花びら", from: [3, 20],  to: [4, 10],  items: ["sakura", "dango"],  title: "花より満タン",       col: ["#f7a8c4", "#7a3a52"]},
  {id: "halloween", name: "ハロウィン", ic: "🎃", mark: "かぼちゃ", from: [10, 15], to: [10, 31], items: ["pumpkin", "witch"], title: "かぼちゃの店主",     col: ["#f08a24", "#3a2350"]},
  {id: "xmas",      name: "クリスマス", ic: "🎄", mark: "ベル",   from: [12, 10], to: [12, 25], items: ["antler", "santa"],  title: "聖夜のバーテンダー", col: ["#d33a32", "#1f5a3a"]},
  {id: "newyear",   name: "お正月",     ic: "🎍", mark: "福",     from: [12, 30], to: [1, 7],   items: ["sensu", "kagami"],  title: "福を注ぐ店主",       col: ["#d33a32", "#c9962e"]}
];
const EV_NEED = [8, 24];               // この数の印で1つめ・2つめの小物（2つめで称号も）
let evMemo = null, evMemoT = -1;
function evNow(){
  const m = Math.floor(Date.now()/60000) + (window.__evForce || ""); if (m === evMemoT) return evMemo; evMemoT = m; return (evMemo = evCalc());
}
function evCalc(){
  const t = todayJST(), md = t.m*100 + t.d;
  const e = EVENTS.find(x => x.id === window.__evForce) || EVENTS.find(x => { const a = x.from[0]*100 + x.from[1], b = x.to[0]*100 + x.to[1]; return a <= b ? md >= a && md <= b : md >= a || md <= b; });
  if (!e) return null;
  const y = e.from[0] > e.to[0] && t.m <= e.to[0] ? t.y - 1 : t.y;  // 年をまたぐイベントは始まった年で数える
  return Object.assign({key: `${e.id}-${y}`, end: `${e.to[0]}/${e.to[1]}`}, e);
}
function evState(e){ if (!save.ev || save.ev.key !== e.key) save.ev = {key: e.key, pts: 0}; return save.ev; }
const evAccName = id => (COS.find(c => c.t === "acc" && c.id === id) || {}).name || id;
// 印を足す。もらえたものの文を返す（結果画面に出す）
function evAward(n){
  const e = evNow(); if (!e || !n) return "";
  const st = evState(e), before = st.pts; st.pts += n; const got = [];
  EV_NEED.forEach((need, k) => { if (before < need && st.pts >= need){ const key = "acc:" + e.items[k];
    if (!(save.cos || []).includes(key)){ save.cos = (save.cos || []).concat(key); got.push(evAccName(e.items[k])); }
    if (k === 1 && !(save.titles || []).includes(e.title)){ save.titles = (save.titles || []).concat(e.title); got.push(`称号「${e.title}」`); } } });
  persist();
  if (got.length) setTimeout(() => { toastQ.push({ic: e.ic, name: got.join("・"), sub: `${e.name}のごほうび`}); runToast(); }, 1200);
  const next = EV_NEED.find(x => x > st.pts);
  return `<br>${e.ic} ${e.name}の${e.mark} <b>+${n}</b>（${st.pts}${next ? ` / ${next}` : "・全部そろいました"}）` + (got.length ? `<br>${e.name}のごほうび：<b>${got.join("、")}</b>（プロフィールで付けられます）` : "");
}
function renderEvent(){
  const el = $("evBanner"), e = evNow();
  document.body.dataset.ev = e ? e.id : "";
  if (!e){ el.classList.add("hidden"); return; }
  const st = evState(e), done = st.pts >= EV_NEED[1], next = EV_NEED.find(x => x > st.pts) || EV_NEED[1];
  el.style.setProperty("--ev1", e.col[0]); el.style.setProperty("--ev2", e.col[1]);
  el.innerHTML = `<span class="evic" aria-hidden="true">${e.ic}</span><span class="evt"><b>${e.name} 開催中！</b><small>${e.end}まで</small>` +
    `<small>ステージクリアで${e.mark}1つ・日替わり達成で3つ・今日の仕込みで2つ。${EV_NEED[0]}つで「${evAccName(e.items[0])}」、${EV_NEED[1]}つで「${evAccName(e.items[1])}」と称号「${e.title}」</small>` +
    `<span class="evbar"><i style="width:${Math.min(100, st.pts/EV_NEED[1]*100)}%"></i></span><small>${e.mark} ${st.pts}${done ? "　全部もらいました！" : ` / ${next}`}</small></span>`;
  el.classList.remove("hidden");
}
// お客さんの仮装（3人に1人くらい。評論家と常連さんはいつもの格好）
function evHat(s, k){ const e = evNow(); if (!e || s.critic || s.regular) return null; return (s.g + k) % 3 === 0 ? e.items[(s.g + k) % 2] : null; }
function evGuestHat(c, s, k, x, y, size, t){ const h = evHat(s, k); if (!h) return; c.save(); c.translate(x, y); c.lineCap = "round"; c.lineJoin = "round"; accDraw(c, h, size, t); c.restore(); }
// 動かない飾り（背景に1回だけ描く）。cy = カウンターの高さ
function evDecor(c, w, cy){
  const e = evNow(); if (!e) return;
  const flag = (cols) => { c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 8); c.quadraticCurveTo(w/2, 34, w, 8); c.stroke();
    const n = Math.max(7, Math.round(w/44)); for (let i=0;i<n;i++){ const t = (i + .5)/n, x = t*w, y = 8 + 26*2*t*(1-t)*2*.5 + 2; c.fillStyle = cols[i % cols.length]; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x + 9, y); c.lineTo(x, y + 16); c.closePath(); c.fill(); } };
  if (e.id === "halloween"){
    flag(["#f08a24", "#3a2350", "#f6c945"]);
    c.fillStyle = "rgba(20,10,24,.55)"; [[.14, .3], [.84, .22], [.7, .42]].forEach(([fx, fy], i) => { const x = w*fx, y = cy*fy, z = 7 + i*2;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - z, y - z*.9, x - z*2.2, y - z*.2); c.quadraticCurveTo(x - z*1.3, y + z*.1, x - z*.9, y + z*.6); c.quadraticCurveTo(x - z*.4, y + z*.2, x, y + z*.4);
      c.quadraticCurveTo(x + z*.4, y + z*.2, x + z*.9, y + z*.6); c.quadraticCurveTo(x + z*1.3, y + z*.1, x + z*2.2, y - z*.2); c.quadraticCurveTo(x + z, y - z*.9, x, y); c.fill(); });
    [w*.06, w*.94].forEach((x, i) => { const r = Math.min(18, w*.045); c.fillStyle = "#e8781e"; c.beginPath(); c.ellipse(x, cy - r*.7, r, r*.75, 0, 0, 7); c.fill(); c.fillStyle = "#4a7a2a"; c.fillRect(x - 2, cy - r*1.55, 4, r*.4);
      c.fillStyle = "#ffd56b"; c.beginPath(); c.moveTo(x - r*.5, cy - r*.9); c.lineTo(x - r*.2, cy - r*1.05); c.lineTo(x - r*.2, cy - r*.75); c.closePath(); c.moveTo(x + r*.5, cy - r*.9); c.lineTo(x + r*.2, cy - r*1.05); c.lineTo(x + r*.2, cy - r*.75); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x - r*.5, cy - r*.5); c.quadraticCurveTo(x, cy - r*.15, x + r*.5, cy - r*.5); c.quadraticCurveTo(x, cy - r*.35, x - r*.5, cy - r*.5); c.fill(); });
  }
  if (e.id === "xmas"){
    c.strokeStyle = "#2f6b3a"; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 8); c.quadraticCurveTo(w/2, 34, w, 8); c.stroke();
    for (let i=0;i<14;i++){ const t = (i + .5)/14, x = t*w, y = 8 + 26*t*(1-t)*2; c.fillStyle = ["#ff5a4a", "#ffd56b", "#6ec3ff", "#ffffff"][i % 4]; c.beginPath(); c.arc(x, y + 3, 3, 0, 7); c.fill(); }
    const tx = w*.08, th = Math.min(70, cy*.32), tb = cy; c.fillStyle = "#2f6b3a";
    for (let k=0;k<3;k++){ const y = tb - th*(.25 + k*.27), hw = th*(.36 - k*.08); c.beginPath(); c.moveTo(tx - hw, y + th*.22); c.lineTo(tx, y - th*.12); c.lineTo(tx + hw, y + th*.22); c.closePath(); c.fill(); }
    c.fillStyle = "#6a4a2a"; c.fillRect(tx - 3, tb - th*.12, 6, th*.12); c.fillStyle = "#ffd56b"; c.beginPath(); c.arc(tx, tb - th*.95, 4, 0, 7); c.fill();
    [[-.12, .55], [.1, .4], [-.05, .75], [.14, .7]].forEach(([dx, dy], i) => { c.fillStyle = ["#ff5a4a", "#6ec3ff", "#ffd56b", "#ffffff"][i]; c.beginPath(); c.arc(tx + dx*th, tb - th*dy, 2.5, 0, 7); c.fill(); });
  }
  if (e.id === "newyear"){
    flag(["#d33a32", "#fffaf0"]);
    [w*.06, w*.94].forEach(x => { const h = Math.min(60, cy*.28), r = Math.min(12, w*.03);
      c.fillStyle = "#4a8a3a"; for (const dx of [-r*.7, 0, r*.7]){ c.beginPath(); c.moveTo(x + dx - 3, cy); c.lineTo(x + dx - 3, cy - h*(dx ? .8 : 1)); c.lineTo(x + dx + 3, cy - h*(dx ? .8 : 1) - 6); c.lineTo(x + dx + 3, cy); c.closePath(); c.fill(); }
      c.fillStyle = "#c9a26a"; c.fillRect(x - r*1.3, cy - h*.3, r*2.6, h*.3); c.strokeStyle = "rgba(90,60,30,.5)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - r*1.3, cy - h*.18); c.lineTo(x + r*1.3, cy - h*.18); c.stroke(); });
  }
  if (e.id === "hanami"){
    flag(["#f7a8c4", "#fffaf0", "#7cbf6a"]);
    c.strokeStyle = "#6a4a3a"; c.lineWidth = 4; c.beginPath(); c.moveTo(w, cy*.12); c.quadraticCurveTo(w*.8, cy*.16, w*.66, cy*.3); c.stroke();
    for (let i=0;i<16;i++){ const t = i/15, x = w - (w*.34)*t + Math.sin(i*2.1)*10, y = cy*.12 + cy*.18*t + Math.cos(i*1.7)*9; c.fillStyle = i % 3 ? "#f7b8cc" : "#fbd8e4"; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); }
  }
}
// 動く飾り（毎コマ。数を少なくして軽く）
function evAnim(c, w, cy, t){
  const e = evNow(); if (!e) return;
  if (e.id === "xmas"){ c.fillStyle = "rgba(255,255,255,.8)"; for (let i=0;i<22;i++){ const x = (i*61 + Math.sin(t/900 + i)*14) % w, y = (i*37 + t*.025*(1 + i%3)) % cy; c.beginPath(); c.arc(x, y, 1.3 + i%2, 0, 7); c.fill(); } }
  if (e.id === "hanami"){ c.fillStyle = "rgba(247,168,196,.85)"; for (let i=0;i<14;i++){ const x = (i*83 + t*.02 + Math.sin(t/700 + i)*18) % w, y = (i*47 + t*.03*(1 + i%2)) % cy; c.beginPath(); c.ellipse(x, y, 3.5, 2.2, t/500 + i, 0, 7); c.fill(); } }
  if (e.id === "halloween"){ c.fillStyle = "rgba(20,10,24,.6)"; for (let i=0;i<2;i++){ const x = (t*.05*(i ? -1 : 1) + i*w*.5 + w*2) % w, y = cy*(.15 + .1*i) + Math.sin(t/300 + i)*8, f = Math.sin(t/90 + i)*.5 + .5, z = 6;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - z*2, y - z*f); c.lineTo(x - z*.8, y + z*.3); c.lineTo(x, y + z*.4); c.lineTo(x + z*.8, y + z*.3); c.lineTo(x + z*2, y - z*f); c.closePath(); c.fill(); } }
  if (e.id === "newyear"){ c.fillStyle = "rgba(255,214,107,.7)"; for (let i=0;i<8;i++){ const x = (i*97) % w, y = cy*.5 + Math.sin(t/600 + i*1.3)*cy*.08 - (i%3)*cy*.12, a = (Math.sin(t/400 + i) + 1)/2; c.globalAlpha = .3 + a*.5; c.beginPath(); c.arc(x, y, 1.5 + a*1.5, 0, 7); c.fill(); } c.globalAlpha = 1; }
}
