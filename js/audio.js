// ご注文は満タンで：効果音とBGM
/* ---------- 音（効果音ラボの素材） ---------- */
let ac = null, master = null; const BUF = {};
function b64(s){ const bin = atob(s), u = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i); return u.buffer; }
// アプリから離れると、スマホは音の仕組みを止める。戻ってから最初に画面に触れたときに必ず復活させる。
// iPhoneは一度止まると「動いているのに音が出ない」ことがあるので、音の仕組みを作り直す。
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let audioStale = false;
function rebuildAudio(){
  const k = bgmKey || bgmWant; try { if (bgmNode) bgmNode.stop(); } catch(e){}
  try { ac.close(); } catch(e){}
  ac = null; master = null; bgmGain = null; bgmNode = null; bgmKey = null; bgmTok++;
  bgmWant = k; audio();
}
function audio(){
  if (ac && audioStale){ audioStale = false; if (IOS || ac.state === "closed") { rebuildAudio(); return; } }
  if (ac){ if (ac.state !== "running") ac.resume().then(() => { if (ac && ac.state !== "running") rebuildAudio(); }, () => rebuildAudio()); return; }
  try{
    ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.connect(ac.destination);
    bgmGain = ac.createGain(); bgmGain.connect(ac.destination); applyVolume(); protect();
    const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1,1,22050); s.connect(master); s.start(0);
    for (const k in SND){ if (BUF[k]) continue; const done = b => { BUF[k] = b; }; const p = ac.decodeAudioData(b64(SND[k]), done, ()=>{}); if (p && p.then) p.then(done).catch(()=>{}); }
    if (bgmWant) { const k = bgmWant; bgmWant = null; bgm(k); }
  }catch(e){ ac = null; }
}
// ブラウザに「この記録を勝手に消さないで」と頼む（容量の都合などで自動削除されるのを防ぐ）
let protectedOK = null;
function protect(){
  if (!navigator.storage || !navigator.storage.persist) { protectedOK = false; return; }
  navigator.storage.persisted().then(p => p ? true : navigator.storage.persist()).then(p => { protectedOK = !!p; }).catch(() => { protectedOK = false; });
}
function applyVolume(){
  if (!ac) return; const t = ac.currentTime;
  master.gain.setTargetAtTime(save.sound ? save.seVol : 0, t, .03);
  bgmGain.gain.setTargetAtTime(save.sound ? save.bgmVol*.55 : 0, t, .08);
}
/* ---------- BGM（魔王魂の曲。遊ぶ場所に入ったときに初めて読み込み、そのあとはスマホに保存される） ---------- */
const BGM = {
  map: "maoudamashii_bgm_acoustic38.mp3", w1: "maoudamashii_bgm_acoustic15.mp3", w2: "maoudamashii_bgm_acoustic41.mp3",
  w3: "maoudamashii_bgm_ethnic09.mp3", w4: "maoudamashii_bgm_acoustic54.mp3", w5: "maoudamashii_bgm_ethnic10.mp3", w6: "maoudamashii_bgm_acoustic08.mp3", w7: "maoudamashii_bgm_acoustic34.mp3", w8: "maoudamashii_bgm_acoustic44.mp3", w9: "maoudamashii_bgm_acoustic52.mp3", prep: "maoudamashii_bgm_acoustic22.mp3",
  endless: "maoudamashii_bgm_acoustic10.mp3", daily: "maoudamashii_bgm_ethnic14.mp3"
};
let bgmGain = null, bgmKey = null, bgmWant = null, bgmNode = null, bgmTok = 0; const BGMBUF = {};
function loopPoints(b){ // 曲の頭と終わりの無音をとばして、つなぎ目なくくり返す
  const d = b.getChannelData(0), n = d.length, th = 2e-4; let a = 0, z = n - 1;
  const lim = Math.min(n >> 1, Math.floor(b.sampleRate*3));
  while (a < lim && Math.abs(d[a]) < th) a++;
  while (z > n - lim && Math.abs(d[z]) < th) z--;
  return [a/b.sampleRate, (z+1)/b.sampleRate];
}
function bgm(key){
  if (!ac){ bgmWant = key; return; }
  if (key === bgmKey) return;
  bgmKey = key; const tok = ++bgmTok;
  if (bgmNode){ const old = bgmNode, g = old._g, t = ac.currentTime; g.gain.setTargetAtTime(0, t, .25); setTimeout(() => { try { old.stop(); } catch(e){} }, 1400); bgmNode = null; }
  const file = BGM[key]; if (!file) return;
  const start = buf => {
    if (tok !== bgmTok) return;
    const src = ac.createBufferSource(), g = ac.createGain(), [a, z] = buf._lp || (buf._lp = loopPoints(buf));
    src.buffer = buf; src.loop = true; src.loopStart = a; src.loopEnd = z;
    g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(1, ac.currentTime + 1.2);
    src.connect(g).connect(bgmGain); src.start(0, a); src._g = g; bgmNode = src;
  };
  if (BGMBUF[file]) return start(BGMBUF[file]);
  fetch("bgm/" + file).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
    .then(ab => new Promise((ok, ng) => { const p = ac.decodeAudioData(ab, ok, ng); if (p && p.then) p.then(ok, ng); }))
    .then(buf => { for (const k in BGMBUF) delete BGMBUF[k]; BGMBUF[file] = buf; start(buf); }).catch(() => {});
}
document.addEventListener("visibilitychange", () => { if (!ac) return;
  if (document.visibilityState === "hidden"){ audioStale = true; try { ac.suspend(); } catch(e){} }
  else if (!IOS) ac.resume().catch(() => {}); });
window.addEventListener("pageshow", e => { if (e.persisted && ac) audioStale = true; });
// どこを触っても、止まっている音を起こす
["pointerdown", "touchend", "keydown"].forEach(ev => document.addEventListener(ev, () => { if (!ac || audioStale || ac.state !== "running") audio(); }, {capture: true, passive: true}));
function play(name, o={}){
  if (!save.sound || !ac || !BUF[name] || window.__mute) return;
  const b = BUF[name], s = ac.createBufferSource(), g = ac.createGain(), t = ac.currentTime + (o.delay||0);
  s.buffer = b; s.playbackRate.setValueAtTime(o.rate||1, t);
  if (o.rateTo) s.playbackRate.linearRampToValueAtTime(o.rateTo, t + (o.dur||b.duration));
  const vol = o.gain == null ? 1 : o.gain;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t+.015);
  if (o.dur){ g.gain.setValueAtTime(vol, t + Math.max(.02, o.dur-.09)); g.gain.linearRampToValueAtTime(0, t + o.dur); }
  s.connect(g).connect(master); s.start(t, o.offset||0); if (o.dur) s.stop(t + o.dur + .02);
}
function pourSound(dur, f0, f1){
  const r0 = .88 + .42*f0, r1 = .88 + .42*f1, len = BUF.pour ? BUF.pour.duration : 2.4, maxOff = Math.max(0, len - dur*(r0+r1)/2 - .05);
  play("pour", {dur, rate:r0, rateTo:r1, offset: Math.random()*Math.min(maxOff,.9), gain:.9});
}
