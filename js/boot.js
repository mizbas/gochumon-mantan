// ご注文は満タンで：起動・更新の確認・テスト用の自動プレイ
/* ---------- テスト用の自動プレイ（通常は動かない） ---------- */
function bot(){
  if (T < botNext) return; botNext = T + (window.__botDelay || 700);
  const free = i => !busy.has(i) && !bottles[i].ice && bottles[i].lock == null && !bottles[i].glass;
  { const st = cockState(); if (st && st.g && !busy.has(st.gi)){
      if (!st.ok){ sel = -1; tapBottle(st.gi); tapSink(); return; }
      if (st.next != null){ const src = bottles.findIndex((b,i) => free(i) && !b.corked && b.units.length && b.units[b.units.length-1].c === st.next && !b.units[b.units.length-1].h);
        if (src >= 0){ sel = -1; tapBottle(src); tapBottle(st.gi); return; } } } }
  const need = []; seats.forEach(s => { if (s.state === "wait" || s.state === "in") s.order.forEach((c,j) => { if (!s.got[j] && !s.res[j]) need.push({c, left: s.pat - (T - s.t0)}); }); });
  if (!need.length) return;
  // 1. 渡せる満タン瓶（保管棚も）
  const rs = stored.findIndex(c => need.some(n => n.c === c)); if (rs >= 0){ tapRack(rackSlot(rs).x); return; }
  const ready = bottles.findIndex((b,i) => b.corked && free(i) && need.some(n => n.c === b.units[0].c));
  if (ready >= 0){ sel = -1; tapBottle(ready); return; }
  const idle = bottles.findIndex((b,i) => b.corked && free(i)); if (idle >= 0 && stored.length < storeCap){ sel = -1; tapBottle(idle); return; }
  need.sort((a,b) => a.left - b.left);
  const have = {}; bottles.forEach(b => { if (!b.corked) b.units.forEach(u => have[u.c] = (have[u.c]||0) + 1); });
  const empties = bottles.filter((b,i) => free(i) && !b.units.length).length;
  for (const {c} of need){
    if (bottles.some(b => b.corked && b.units[0].c === c)) continue;
    if ((have[c]||0) < CAP && empties >= 1 && supplyLeft > 0){ sel = -1; tapSupply(); return; }
    const pure = bottles.findIndex((b,i) => free(i) && !b.corked && b.units.length && b.units.length < CAP && b.units.every(u => u.c === c));
    const tops = bottles.map((b,i) => i).filter(i => free(i) && !bottles[i].corked && bottles[i].units.length && bottles[i].units[bottles[i].units.length-1].c === c && i !== pure);
    if (pure >= 0 && tops.length){ const src = tops.sort((a,b) => bottles[b].units.filter(u=>u.c===c).length - bottles[a].units.filter(u=>u.c===c).length)[0]; sel = -1; tapBottle(src); tapBottle(pure); return; }
    const empty = bottles.findIndex((b,i) => free(i) && !b.units.length && b.refillAt == null);
    if (pure < 0 && empty >= 0 && tops.length){ sel = -1; tapBottle(tops[0]); tapBottle(empty); return; }
    // 掘り出す
    let bi = -1, bd = 9;
    bottles.forEach((b,i) => { if (!free(i) || b.corked || i === pure) return; for (let d=1; d<b.units.length; d++) if (b.units[b.units.length-1-d].c === c){ if (d < bd){ bd = d; bi = i; } break; } });
    if (bi >= 0){
      const b = bottles[bi], x = b.units[b.units.length-1].c;
      let dst = bottles.findIndex((d,i) => i !== bi && free(i) && !d.corked && d.units.length && d.units.length < CAP && d.units[d.units.length-1].c === x);
      if (dst < 0) dst = bottles.findIndex((d,i) => i !== bi && i !== pure && free(i) && !d.units.length && d.refillAt == null);
      sel = -1;
      if (dst >= 0){ tapBottle(bi); tapBottle(dst); } else { tapBottle(bi); tapSink(); }
      return;
    }
  }
}

showMap();
/* ---------- 新しい版への切り替え ---------- */
// 開いたときと、裏から戻ってきたときに新しい版がないか確かめる（約2KB）。
// 新しい版が届いたら、マップ画面ならすぐ、遊んでいる最中なら閉店してマップに戻ったときに読み込み直す。
let updateReady = false;
function applyUpdate(){
  if (!updateReady) return;
  const busyNow = !$("play").classList.contains("hidden") || !$("intro").classList.contains("hidden") || !$("result").classList.contains("hidden") || !$("settings").classList.contains("hidden") || !$("profile").classList.contains("hidden") || !$("prepSel").classList.contains("hidden");
  if (busyNow) return;
  try { sessionStorage.setItem("justUpdated", "1"); } catch(e){}
  location.reload();
}
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")){
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController){ updateReady = true; applyUpdate(); } });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js", {updateViaCache: "none"}).then(reg => {
      const check = () => { if (document.visibilityState === "visible") reg.update().catch(()=>{}); };
      document.addEventListener("visibilitychange", check);
      window.addEventListener("pageshow", check);
    }).catch(()=>{});
  });
  setInterval(applyUpdate, 1500);
}
try { if (sessionStorage.getItem("justUpdated")){ sessionStorage.removeItem("justUpdated");
  setTimeout(() => { toastQ.push({ic:"✨", name:"最新版に更新しました", sub:"お知らせ"}); runToast(); }, 600); } } catch(e){}
window.__g = { get stored(){ return stored; }, get ice(){ return bottles.map(b => b.ice || 0); }, get stats(){ return {money, servedN, missed, dumped, maxCombo, bottlesOut, elvl, lives, sup: expSupply/SUPPLY_COST}; }, exportCode, importCode, dailyDef, drawAvatar, get bgm(){ return [bgmKey, !!bgmNode, bgmNode ? [bgmNode.loopStart, bgmNode.loopEnd, bgmNode.buffer.duration] : null]; }, set speed(v){ SPEED = v; }, showIntro, get ended(){ return ended; }, get save(){ return save; }, drawVessel, bottleShape };
