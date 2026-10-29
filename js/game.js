// ご注文は満タンで：ゲームの進行（ステージ・お客さん・注ぐ・しかけ・仕込み・エンドレス・日替わり・チュートリアル・入力・ループ）
/* ---------- 状態 ---------- */
let SPEED = 1, T = 0, lastTs = 0, running = false, ended = false;
let stg = 0, S = null, room = ROOMS[0], bottles = [], seats = [], sel = -1, pours = [], flights = [], busy = new Set();
let money = 0, combo = 0, maxCombo = 0, servedN = 0, missed = 0, dumped = 0, bottlesOut = 0, guestsLeft = 0;
let lift = [], floats = [], parts = [], shakeT = {}, waveT = {}, botNext = 0;
const R = (a,b) => a + Math.random()*(b-a);         // 飾りの動き用
let rnd = Math.random;                                  // お客さん・仕入れ用（日替わりは日付で決まる乱数）
const RG = (a,b) => a + rnd()*(b-a);
const pick = a => a[Math.floor(rnd()*a.length)];
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const palette = () => [...Array(S.colors).keys()];
const isFull = b => !b.glass && b.units.length === CAP && b.units.every(u => u.c === b.units[0].c); // 隠れた色も同じ色なら満タン（栓をするときに見せる）
const topRun = u => { if (!u.length) return 0; const c = u[u.length-1].c; let n = 0; for (let i=u.length-1;i>=0 && u[i].c===c && !u[i].h;i--) n++; return n; };
let stored = [], bought = 0, supplyLeft = Infinity, iceTick = 15000;
const shapeNow = () => bottleShape(save.bottle, lay ? lay.w : 50);

let wantCache = null, wantT = -1;
function wantedNow(){ if (wantT !== T || !wantCache){ wantCache = wanted(); wantT = T; } return wantCache; }
function wanted(){ // まだ渡していない注文の色（予約済みは除く）
  const w = []; seats.forEach(s => { if (s.state === "wait" || s.state === "in") s.order.forEach((c,j) => { if (!s.got[j] && !s.res[j]) w.push(c); }); }); return w;
}
// 仕入れる瓶の中身：待っているお客さんの色を多めに。目利きの強化で色の種類が減る
function stockUnits(){
  const cg = cockGuest(), need = wanted().concat(cg ? cg.cock : []), pal = palette(), maxC = [4,3,2][Math.min(2, upg("refill"))], set = [];
  for (let k=0; k<30 && set.length < maxC; k++){ const c = need.length && rnd() < .65 ? pick(need) : pick(pal); if (!set.includes(c)) set.push(c); }
  if (set.length < 2) set.push(pal.find(c => !set.includes(c)));
  const u = [set[0], set[1]]; while (u.length < CAP) u.push(pick(set));
  for (let k=u.length-1;k>0;k--){ const j = Math.floor(rnd()*(k+1)); [u[k],u[j]] = [u[j],u[k]]; }
  // 一番上（最後）は、待っているお客さんの色にしておく
  const top = u.findIndex(c => need.includes(c)); if (top >= 0){ const x = u[top]; u[top] = u[CAP-1]; u[CAP-1] = x; }
  return u;
}
let stock = [], stockT = 0;
// 足りない色：お客さんが待っている色なのに、すぐ使える分（瓶の一番上にそろっている分・栓をした瓶・保管）を合わせても足りない色。
// ほかの色の下に埋もれている分は数えない
function shortNeed(){
  const need = {}; wantedNow().forEach(c => need[c] = (need[c]||0) + CAP);
  const cg = cockGuest(); if (cg) cg.cock.forEach(c => need[c] = (need[c]||0) + 1);
  const have = {};
  bottles.forEach(b => { if (!b.units.length || b.glass) return; const c = b.units[b.units.length-1].c; have[c] = (have[c]||0) + (b.corked ? CAP : topRun(b.units)); });
  stored.forEach(c => have[c] = (have[c]||0) + CAP);
  const out = {}; Object.keys(need).forEach(c => { const m = need[c] - (have[c]||0); if (m > 0) out[c] = m; }); return out;
}
const shortColors = () => Object.keys(shortNeed()).map(Number);
// 仕入れの瓶の一番上にそろっている色と数
const stockTop = u => { const c = u[u.length-1]; let n = 0; for (let k=u.length-1; k>=0 && u[k] === c; k--) n++; return [c, n]; };
// 足りない色が、次の瓶にもその次の瓶にも「一番上」に入っていなければ、その次の瓶（小さく見えている瓶）を差し替える。
// 目の前の瓶は変えないので、1回仕入れれば必ず届く。足りない数に合わせて2〜3つ入れる（運だけで詰まないように）
let stockFixT = 0;
function stockFix(){
  if (stock.length < 2 || S.mode === "prep" || T < stockFixT) return; stockFixT = T + 400;
  const sn = shortNeed(), sh = Object.keys(sn).map(Number); if (!sh.length) return;
  if ([stock[0], stock[1]].some(u => sh.includes(stockTop(u)[0]))) return;
  const f = pick(sh), n = Math.min(CAP - 1, Math.max(2, sn[f])), rest = stockUnits().filter(c => c !== f).slice(0, CAP - n);
  while (rest.length < CAP - n) rest.unshift(f);
  stock[1] = rest.concat(Array(n).fill(f));
}
let lives = 3, elvl = 1, runStart = 0;
let resQ = [];           // 予約：次に来るお客さんの注文
let darkT = Infinity;    // 停電
const DARK_LEN = 7000, DARK_WARN = 1800;
const darkNow = () => !!S && !!S.dark && T >= darkT && T < darkT + DARK_LEN;
const darkSoon = () => !!S && !!S.dark && T >= darkT - DARK_WARN && T < darkT;
let lockT = Infinity, lockWarn = null;

/* ---------- 仕込みモード（じっくり解くパズル） ---------- */
// 仕込みモード：盤面づくりと解く仕組み（必ず解けることを確かめ、目安の手数とヒントに使う）
// 布をかけた瓶：cloth[i] = {c, n}（c = 色。-1 はどの色でも）。その色の満タン瓶が n 本できるまで、注ぐことも注がれることもできない
// 布が取れた瓶も、満タンになれば数に入る（取れるまでくり返し調べる）
function clothLocks(st, cloth){
  const L = st.map((b, i) => !!(cloth && cloth[i]));
  for (let changed = true; changed;){ changed = false;
    st.forEach((b, i) => { if (!L[i]) return; const f = cloth[i]; let done = 0;
      st.forEach((d, k) => { if (k !== i && !L[k] && d.length === CAP && d.every(c => c % 100 === d[0] % 100) && (f.c < 0 || d[0] % 100 === f.c)) done++; });
      if (done >= f.n){ L[i] = false; changed = true; } }); }
  return L;
}
function prepSolve(start, cap, limit, cloth){
  // start: [[c,c,...], ...] 下から上。「？」で隠れている1杯は c+100 で表す（見えている同じ色の続きだけを一度に注げる。注いだあとの一番上は見えるようになる）
  // 戻り値：[{from,to,n}, ...] か null
  const lk = st => cloth && cloth.some(Boolean) ? clothLocks(st, cloth) : null;
  const keyOf = st => { const L = lk(st); return st.map((b, i) => b.join(",") + (L && L[i] ? "~" + i : "")).sort().join("|"); };
  const solved = st => st.every(b => !b.length || (b.length === cap && b.every(c => c % 100 === b[0] % 100)));
  const h = st => { let x = 0; const where = {}; st.forEach((b, i) => { for (let k=1;k<b.length;k++) if (b[k] % 100 !== b[k-1] % 100) x++; if (b.length && b.length < cap) x += .5; new Set(b.map(c => c % 100)).forEach(c => where[c] = (where[c]||0) + 1); }); for (const c in where) x += where[c] - 1; return x; };
  const heap = [], push = n => { heap.push(n); let i = heap.length - 1; while (i){ const p = (i-1) >> 1; if (heap[p].f <= heap[i].f) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } },
    pop = () => { const top = heap[0], last = heap.pop(); if (heap.length){ heap[0] = last; let i = 0; for (;;){ const l = 2*i+1, r = l+1; let m = i; if (l < heap.length && heap[l].f < heap[m].f) m = l; if (r < heap.length && heap[r].f < heap[m].f) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const seen = new Map(); push({st: start, g: 0, f: h(start), path: null}); seen.set(keyOf(start), 0);
  let n = 0;
  while (heap.length && n++ < limit){
    const cur = pop(), st = cur.st, L = lk(st);
    if (solved(st)){ const out = []; for (let p = cur.path; p; p = p.prev) out.push(p.m); return out.reverse(); }
    for (let i=0;i<st.length;i++){
      const a = st[i]; if (!a.length || (L && L[i])) continue;
      if (a.length === cap && a.every(c => c % 100 === a[0] % 100)) continue; // 満タンにそろった瓶は栓をするので動かせない
      const c = a[a.length-1]; let run = 0; for (let k=a.length-1;k>=0 && a[k]===c;k--) run++;
      const uniform = run === a.length; let triedEmpty = false;
      for (let j=0;j<st.length;j++){
        if (i === j || (L && L[j])) continue; const b = st[j];
        if (b.length >= cap) continue;
        if (b.length){ if (b[b.length-1] !== c) continue; }
        else { if (uniform || triedEmpty) continue; triedEmpty = true; }
        const m = Math.min(run, cap - b.length);
        if (b.length && uniform && m < run) { /* 一部だけ動かすのは可 */ }
        const nx = st.slice(); nx[i] = a.slice(0, a.length - m); nx[j] = b.concat(Array(m).fill(c));
        { const s2 = nx[i]; if (s2.length && s2[s2.length-1] >= 100){ nx[i] = s2.slice(); nx[i][s2.length-1] -= 100; } } // 注いだあと、下の1杯が見えるようになる
        const key = keyOf(nx), g = cur.g + 1;
        if (seen.has(key) && seen.get(key) <= g) continue; seen.set(key, g);
        push({st: nx, g, f: g + 1.6*h(nx), path: {m: {from: i, to: j, n: m}, prev: cur.path}});
      }
    }
  }
  return null;
}
function prepGen(k, empties, cap, seed, rand, clothN, hide){
  for (let tries = 0; tries < (clothN ? 400 : 60); tries++){
    const r = rand(seed + tries*7919), pool = [];
    for (let c=0;c<k;c++) for (let u=0;u<cap;u++) pool.push(c);
    for (let i=pool.length-1;i>0;i--){ const j = Math.floor(r()*(i+1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const st = []; for (let b=0;b<k;b++) st.push(pool.slice(b*cap, b*cap + cap)); for (let e=0;e<empties;e++) st.push([]);
    if (st.some(b => b.length === cap && b.every(c => c === b[0]))) continue;           // 最初から満タンは作らない
    if (st.some(b => { let x = 0; for (let q=1;q<b.length;q++) if (b[q] !== b[q-1]) x++; return x === 0 && b.length; })) continue;
    let cloth = null;
    if (clothN){ cloth = st.map(() => null); const idx = [...Array(k).keys()];
      for (let q=0; q<clothN; q++){ const i = idx.splice(Math.floor(r()*idx.length), 1)[0]; cloth[i] = r() < .35 ? {c: -1, n: r() < .5 ? 1 : 2} : {c: Math.floor(r()*k), n: 1}; } }
    const st2 = hide ? st.map(b => b.map((c, j) => b.length === cap && j < b.length - 1 ? c + 100 : c)) : st; // ゲームと同じく、満タンの瓶は一番上以外が「？」
    const sol = prepSolve(st2, cap, 120000, cloth);
    if (sol) return {st, sol, tries, cloth};
  }
  return null;
}


// 章ごとの難しさ：[色の数, 空き瓶, ？の色, 凍った瓶]
const PREP_CH = [[3,2,0,0],[4,2,0,0],[5,2,0,0],[5,2,1,0],[6,2,0,0],[6,2,1,0],[7,2,0,0],[7,2,1,1],[8,2,1,0],[8,2,1,1],[5,2,0,0,2],[6,2,0,0,3],[7,2,1,0,3]];
const PREP_N = 8;
const prepId = (c, n) => `p${c}-${n}`, prepName = id => "仕込み " + id.slice(1);
const prepCache = {};
function prepDef(id){
  if (id === "pd") return prepDailyDef();
  const [c, n] = id.slice(1).split("-").map(Number), [k, e, hide, ice, cloth] = PREP_CH[c-1];
  if (!prepCache[id]) prepCache[id] = prepGen(k, e, CAP, c*1000 + n*37 + 11, mulberry, cloth || 0, !!hide);
  const g = prepCache[id];
  return {id: prepName(id), pid: id, mode: "prep", ch: c, n, w: 1 + ((c - 1) % 9), colors: k, shelf: k, spare: e, seats: 0, guests: 0, pat: 60, goal: 0, hide: !!hide, ice: ice ? [2] : null, cloth: g && g.cloth ? g.cloth : null, prep: g, par: g ? g.sol.length : 99};
}
const prepUnlocked = id => { const [c, n] = id.slice(1).split("-").map(Number); if (c === 1 && n === 1) return true; const prev = n > 1 ? prepId(c, n-1) : prepId(c-1, PREP_N); return (save.prep.stars[prev] || 0) >= 1; };
const prepOpen = () => (save.stars["1-1"] || 0) >= 1;
let prepMoves = 0, prepHelp = 0, prepHint = null;
function prepStarCap(){ return Math.max(1, 3 - prepHelp); }
// ★の手数：「？」のある問題は中身が見えないぶん、目安より少し多くてもよい（中身を知らないプレイヤーを何度も試して決めた）
const prepLine3 = () => S.hide ? Math.ceil(S.par*1.15) : S.par + 1;
const prepLine2 = () => S.hide ? Math.ceil(S.par*1.5) : Math.ceil(S.par*1.3);
const prepMaster = () => prepMoves <= S.par && !prepHelp;   // 目安ちょうど以下・助けなし＝名人
function prepStars(){ const m = prepMoves; const st = m <= prepLine3() ? 3 : m <= prepLine2() ? 2 : 1; return Math.min(st, prepStarCap()); }
function prepState(){ return bottles.map(b => b.units.map(u => u.c + (u.h ? 100 : 0))); }
const clothNow = () => bottles.map(b => b.cloth ? {c: b.cloth.c, n: b.cloth.n} : null);
// 満タンができたら、条件のそろった布を取る
function clothCheck(){
  if (!bottles.some(b => b.cloth)) return;
  const L = clothLocks(prepState(), clothNow());
  bottles.forEach((b, i) => { if (b.cloth && !L[i]){ b.cloth = null; b.clothOffT = T; play("kira", {gain:.5}); floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, "ふきんが取れた！", "#ffd56b", .9); } });
}
function prepCheck(){
  if (S.mode !== "prep" || ended) return;
  const done = bottles.every(b => !b.units.length || b.corked);
  if (done && !pours.length){ setTimeout(endPrep, 600); ended = true; return; }
  // 手詰まり（どこにも注げない）
  const st = prepState(); let any = false;
  bottles.forEach((a, i) => { if (any || !a.units.length || a.corked || a.ice || a.cloth) return; const c = a.units[a.units.length-1].c;
    bottles.forEach((b, j) => { if (i !== j && !b.corked && !b.ice && !b.cloth && b.units.length < CAP && (!b.units.length || b.units[b.units.length-1].c === c)) any = true; }); });
  if (!any && !bottles.some(b => b.ice)) floatText(W/2, lay.counterY + 40, "手詰まり！「↶ 戻す」かやり直しで", "#ef6b5b", .9);
}
function prepHintGo(){
  if (S.mode !== "prep" || !running || paused || pours.length) return;
  const sol = prepSolve(prepState(), CAP, 60000, clothNow());
  if (!sol || !sol.length){ floatText(W/2, lay.counterY + 40, "この形からは解けないかも。戻してみよう", "#ef6b5b", .85); play("bad", {gain:.3}); return; }
  if (!prepHint || !prepHint.used){ prepHelp = Math.min(2, prepHelp + 1); }
  prepHint = {from: sol[0].from, to: sol[0].to, used: true}; sel = -1; play("kira", {gain:.4}); hud();
}
function endPrep(){
  if (S.daily) return endPrepDaily();
  running = false; sel = -1;
  const id = S.pid, st = prepStars(), first = !(save.prep.stars[id] >= 1), prev = save.prep.best[id];
  if (st > (save.prep.stars[id] || 0)) save.prep.stars[id] = st;
  if (!prev || prepMoves < prev) save.prep.best[id] = prepMoves;
  const master = prepMaster(), firstMaster = master && !(save.prep.master || {})[id]; if (master){ save.prep.master = save.prep.master || {}; save.prep.master[id] = 1; }
  const reward = first ? 100*S.ch : 0; save.wallet += reward;
  const cleared = Object.keys(save.prep.stars).length; claim("prep", cleared); countDay();
  const newTr = checkTrophies(true); persist();
  $("resH").textContent = master ? "👑 名人！ 仕込み完了" : "仕込み完了！"; $("resMoney").textContent = `${prepMoves}手`;
  $("resGoal").innerHTML = `目安 ${S.par}手` + (prev ? `　ベスト ${Math.min(prev, prepMoves)}手` : "") + (prepHelp ? `<br><small>助けを使ったので★は最大${prepStarCap()}つ</small>` : "");
  $("resStars").classList.remove("hidden"); $("resStars").innerHTML = [0,1,2].map(k => `<span class="${k < st ? "on" : ""}">★</span>`).join("");
  $("resList").innerHTML = [["かかった手数", `${prepMoves}手`], ["目安の手数", `${S.par}手（以内で👑名人）`], ["★3", `${prepLine3()}手まで`], ["★2", `${prepLine2()}手まで`]].map(([a,b]) => `<li><span>${a}</span><b>${b}</b></li>`).join("");
  $("resEarned").innerHTML = `<div class="earned">` + (first ? `はじめてクリア！ 財布に <b>+${yen(reward)}</b>` : `クリア済みの仕込みです`) + `（仕込みクリア ${cleared}問）` + (newTr.length ? `<br>トロフィー：<b>${newTr.map(t => t.name).join("、")}</b>` : "") + `</div>`;
  const [c, n] = id.slice(1).split("-").map(Number), nx = n < PREP_N ? prepId(c, n+1) : c < PREP_CH.length ? prepId(c+1, 1) : null;
  $("nextBtn").classList.remove("hidden"); $("nextBtn").disabled = !nx; $("nextBtn").textContent = nx ? `${prepName(nx)} へ` : "全部クリア！";
  resNext = nx;
  setTimeout(() => { $("result").classList.remove("hidden"); play("fanfare", {gain:.55}); }, 500);
}
let resNext = null;
function openPrepSel(){
  // ★の基準を変えたので、前のベストが新しい★3の線に入っていれば★3にする（1回だけ）
  if (!save.prepRestar){ const keep = S; for (const id in save.prep.best){ if ((save.prep.stars[id] || 0) >= 3 || id === "pd") continue;
      const d = prepDef(id); if (!d.prep) continue; const line = d.hide ? Math.ceil(d.par*1.15) : d.par + 1; if (save.prep.best[id] <= line) save.prep.stars[id] = 3; }
    S = keep; save.prepRestar = true; persist(); }
  ["map","play","result","intro"].forEach(id => $(id).classList.add("hidden"));
  const box = $("prepList"); box.innerHTML = "";
  { const pd = pdToday(), c = prepDailyCh(), [k] = PREP_CH[c-1], b = document.createElement("button"); b.className = "spbtn pdbtn";
    b.innerHTML = `<span class="ic">📅</span><span style="text-align:left"><b>今日の仕込み（${prepDailyWd()}曜日）</b><small>みんな同じ1問・${k}色　${pd && pd.best ? `今日のベスト ${pd.best}手 ${"★".repeat(pd.st)}` : "まだ解いていません"}</small></span>`;
    b.onclick = () => { audio(); $("prepSel").classList.add("hidden"); showIntro("pd"); }; box.appendChild(b); }
  PREP_CH.forEach(([k, e, hide, ice, cloth], ci) => {
    const c = ci + 1, open = prepUnlocked(prepId(c, 1));
    let tot = 0; for (let n=1;n<=PREP_N;n++) tot += save.prep.stars[prepId(c, n)] || 0;
    const sec = document.createElement("div"); sec.className = "world" + (open ? "" : " soon");
    sec.innerHTML = `<h2>仕込み ${c}章 <small>${open ? `★ ${tot} / ${PREP_N*3}` : "🔒"}</small></h2><p style="margin:0;color:var(--mute);font-size:13px">${k}色・空き瓶${e}本${hide ? "・？の色" : ""}${ice ? "・凍った瓶" : ""}${cloth ? "・ふきんの瓶" : ""}</p>`;
    if (open){ const grid = document.createElement("div"); grid.className = "stages";
      for (let n=1;n<=PREP_N;n++){ const id = prepId(c, n), lock = !prepUnlocked(id), s2 = save.prep.stars[id] || 0, best = save.prep.best[id];
        const b = document.createElement("button"); b.className = "sbtn" + (lock ? " locked" : "");
        b.innerHTML = `<span class="n">${c}-${n}</span><span class="s">${lock ? "🔒" : "★".repeat(s2) + "☆".repeat(3-s2)}</span><span class="b">${!lock && best ? ((save.prep.master || {})[id] ? "👑" : "") + best + "手" : ""}</span>`;
        b.onclick = () => { audio(); if (lock){ play("bad", {gain:.3}); return; } $("prepSel").classList.add("hidden"); showIntro(id); };
        grid.appendChild(b); }
      sec.appendChild(grid); }
    box.appendChild(sec);
  });
  $("prepSel").classList.remove("hidden"); bgm("prep");
}

/* ---------- 特別営業（エンドレス・日替わり） ---------- */
function todayJST(){ const d = new Date(Date.now() + 9*3600e3); return {y: d.getUTCFullYear(), m: d.getUTCMonth()+1, d: d.getUTCDate()}; }
function todayKey(){ const t = todayJST(); return `${t.y}-${String(t.m).padStart(2,"0")}-${String(t.d).padStart(2,"0")}`; }
function dailyDef(){
  const t = todayJST(), seed = t.y*10000 + t.m*100 + t.d, r = mulberry(seed*7919 + 17);
  const w = 1 + Math.floor(r()*5), colors = 5 + Math.floor(r()*3);
  const pool = ["hide","rush","ice","supply","reserve","lock","dark"], gm = [];
  while (gm.length < 2){ const g = pool[Math.floor(r()*pool.length)]; if (!gm.includes(g)) gm.push(g); }
  const d = {id:"日替わり", mode:"daily", w, n:0, colors, ord:[1,3], seats:3, guests:12, pat:60, shelf:colors, spare:2, seed, key: todayKey(), label:`${t.m}月${t.d}日`, gm};
  if (gm.includes("hide")){ d.hide = true; d.pat += 4; }
  if (gm.includes("rush")) d.rush = .3;
  if (gm.includes("ice")){ d.ice = colors >= 7 ? [2,3] : [1,2]; d.pat += 2; }
  if (gm.includes("reserve")) d.reserve = true;
  if (gm.includes("lock")){ d.lock = 1; d.relock = true; d.pat += 2; }
  if (gm.includes("dark")){ d.dark = true; d.pat += 2; }
  if (gm.includes("supply")){ d.supply = 34 + (colors-5)*2; d.vip = .2; d.pat += 4; }
  d.goal = Math.round((4500 + 250*(colors-5) - (d.hide ? 300 : 0) - (d.supply ? 200 : 0) - (d.ice ? 200 : 0))/100)*100;
  return d;
}
const ENDLESS = () => ({id:"エンドレス", mode:"endless", w:1, n:0, colors:4, ord:[1,2], seats:3, guests:Infinity, pat:62, shelf:5, spare:2, goal:0});
function startPrep(){
  bottles = S.prep.st.map((u, k) => ({units: u.map((c, j) => ({c, h: S.hide && j < u.length - 1 && u.length === CAP})), spare: !u.length}));
  seats = []; sel = -1; pours = []; flights = []; busy = new Set(); lift = bottles.map(() => 0); moveQ = [];
  money = 0; combo = 0; maxCombo = 0; servedN = 0; missed = 0; dumped = 0; bottlesOut = 0; guestsLeft = 0; expSupply = 0;
  floats = []; parts = []; shakeT = {}; waveT = {}; T = 0; botNext = 0; ended = false; running = true;
  stock = []; stored = []; bought = 0; storeCap = 0; sandUsed = false; paused = false; pendingStore = -1; supplyLeft = 0; iceTick = 15000;
  undoSnap = null; undoStack = []; undoLeft = Infinity; prepMoves = 0; prepHelp = 0; prepHint = null; tut = null; hhT = Infinity; freezeT = Infinity; freezeWarn = null; lockT = Infinity; lockWarn = null; resQ = []; darkT = Infinity;
  (S.ice || []).forEach((n, k) => { if (bottles[k]) bottles[k].ice = n; });
  (S.cloth || []).forEach((f, k) => { if (f && bottles[k]) bottles[k].cloth = {c: f.c, n: f.n}; });
  $("rackAsk").classList.add("hidden"); $("tutBox").classList.add("hidden");
  layout(); hud();
}
function stageDef(i){ return i === "endless" ? ENDLESS() : i === "daily" ? dailyDef() : typeof i === "string" && i.startsWith("ev") ? evStageDef(+i.slice(2)) : typeof i === "string" && i[0] === "p" ? prepDef(i) : STAGES[i]; }
const specialOpen = k => (save.stars[k === "endless" ? "1-8" : "2-8"] || 0) >= 1;
// エンドレス：5人満足させるごとにレベルが上がり、だんだん忙しくなる
function endlessStep(){
  const lv = 1 + Math.floor(servedN/5); if (lv <= elvl) return;
  elvl = lv; const msg = [];
  S.pat = 62*(lv <= 10 ? 1 - .035*(lv-1) : Math.max(.3, .685*Math.pow(.96, lv-10)));
  if ((lv === 11 || lv === 18) && S.colors < 8){ S.colors++; bottles.push({units: [], spare:true}); lift.push(0); layout(); msg.push(`新しい色「${CNAME[S.colors-1]}」が入荷`); }
  if (lv === 13){ S.rush = .45; msg.push("急ぎのお客さんが増えた"); }
  if (lv === 14){ S.vip = .3; msg.push("団体さんが増えた"); }
  if (lv === 16) msg.push("待ち時間がどんどん短く");
  if (lv === 20){ S.rush = .5; S.vip = .35; msg.push("店は大混雑！"); }
  if ((lv === 3 || lv === 5) && S.colors < 6){ S.colors++; bottles.push({units: [], spare:true}); lift.push(0); layout(); msg.push(`新しい色「${CNAME[S.colors-1]}」が入荷`); }
  if (lv === 4){ S.ord = [1,3]; msg.push("注文が増えてきた"); }
  if (lv === 8){ S.ord = [2,3]; msg.push("大口の注文が中心に"); }
  if (lv === 6){ S.rush = .25; msg.push("急ぎのお客さんが来はじめた"); }
  if (lv === 10) S.rush = .35;
  if (lv === 7){ S.hide = true; msg.push("仕入れに？の色がまざる"); }
  if (lv === 9){ S.vip = .2; msg.push("団体さんが来はじめた"); }
  if (lv % 5 === 0 && lives < 3){ lives++; msg.push("ハート +1"); }
  claim("elv", lv);
  floatText(W/2, lay.counterY + 40, `レベル${lv}！`, "#f6c945", 1.4, 300);
  msg.forEach((m, k) => floatText(W/2, lay.counterY + 74 + k*24, m, "#f6ead6", .8, 500 + k*150));
  play("bonus", {gain:.55, delay:.5});
}

function startStage(i){
  stg = i; S = stageDef(i); setDrinkTheme(); room = ROOMS.find(r => r.id === save.room) || ROOMS[0];
  rnd = S.mode === "daily" ? mulberry(S.seed) : Math.random; lives = 3; elvl = 1; runStart = Date.now();
  bgm(S.mode && S.mode !== "event" ? S.mode : "w" + S.w);
  const pal = palette(), pool = [];
  if (S.mode === "prep") return startPrep();
  for (let k=0;k<S.shelf*CAP;k++) pool.push(pal[k % pal.length]);
  for (let k=pool.length-1;k>0;k--){ const j = Math.floor(rnd()*(k+1)); [pool[k],pool[j]] = [pool[j],pool[k]]; }
  bottles = [];
  for (let k=0;k<S.shelf;k++) bottles.push({units: pool.slice(k*CAP, k*CAP+CAP).map((c,j) => ({c, h: !!S.hide && j < CAP-1})), spare:false});
  for (let k=0;k<S.spare;k++) bottles.push({units: [], spare:true});
  bottles.forEach(b => { if (isFull(b)){ const x = b.units[0]; b.units[0] = b.units[3]; b.units[3] = x; b.units[1] = {c: (b.units[1].c + 1) % S.colors}; } });
  seats = []; for (let k=0;k<S.seats;k++) seats.push({state:"empty", next: 500 + k*1800, order:[], got:[], res:[], g:0, t0:0});
  sel = -1; pours = []; flights = []; busy = new Set(); lift = bottles.map(()=>0); moveQ = [];
  money = 0; combo = 0; maxCombo = 0; servedN = 0; missed = 0; dumped = 0; bottlesOut = 0; guestsLeft = S.guests; expSupply = 0;
  floats = []; parts = []; shakeT = {}; waveT = {}; T = 0; botNext = 0; ended = false; running = true;
  if (S.cocktail){ bottles.push({units: [], glass: true}); lift.push(0); }
  stock = []; stock.push(stockUnits(), stockUnits(), stockUnits()); stockT = -1e9; stored = []; bought = 0; storeCap = has("rack") ? 2 : 1; sandUsed = false; paused = false; pendingStore = -1; $("rackAsk").classList.add("hidden");
  supplyLeft = S.supply || Infinity; iceTick = 10000; undoSnap = null; undoLeft = UNDO_MAX;
  tut = (i === 0 && !save.tutDone) ? {step: 0, t0: 0} : null; TUT.forEach(t => delete t.shown); $("tutBox").classList.add("hidden");
  freezeWarn = null; freezeT = S.ice ? 18000 : Infinity;
  hhT = (S.mode === "daily" || (typeof i === "number" && i >= 8)) && rnd() < .75 ? RG(40000, 80000) : Infinity; hhOn = false;
  if (S.lock){ const cand = bottles.map((b, i) => i).filter(i => !bottles[i].spare && !bottles[i].glass && bottles[i].units.length); for (let k=0; k<S.lock && cand.length; k++){ const j = cand.splice(Math.floor(rnd()*cand.length), 1)[0]; bottles[j].lock = Math.floor(rnd()*S.colors); bottles[j].lockT0 = 0; } }
  lockWarn = null; lockT = S.relock ? 30000 : Infinity;
  resQ = []; if (S.reserve){ resQ.push(newOrder(), newOrder()); }
  darkT = S.dark ? 22000 : Infinity; S._dw = 0;
  // 最初から凍っている瓶はなし（待ち時間が長くなるため）。凍るのは予告つきの寒波だけ
  evStart();
  layout(); hud();
}

function layout(){
  const st = $("stage"); W = st.clientWidth; H = st.clientHeight;
  dpr = Math.min(window.devicePixelRatio || 1, save.lite ? 1.25 : (save.dprCap || 2)); cv.width = W*dpr; cv.height = H*dpr;
  const n = bottles.length + (S && S.mode === "prep" ? 0 : 3), usableW = Math.min(W - 16, 680);
  const prep = S && S.mode === "prep", counterY = prep ? Math.min(64, H*.1) : Math.min(H*.36, 250), shelfTop = counterY + (prep ? 14 : 26), availH = H - shelfTop - 10;
  let best = null;
  for (let pr = n; pr >= Math.ceil(n/3); pr--){
    const rows = Math.ceil(n/pr), slot = usableW/pr; let w = Math.min(slot*.62, prep ? 84 : 60);
    while (rows*(w*3.05 + w*.9) > availH && w > 16) w -= 1;
    if (!best || w > best.w + .5) best = {w, pr, rows, slot};
  }
  const {w, pr, rows, slot} = best, rowH = w*3.05 + w*.9, top = shelfTop + Math.max(0, (availH - rows*rowH)/2), pos = [];
  for (let k=0;k<n;k++){ const r = Math.floor(k/pr), inRow = Math.min(pr, n - r*pr), col = k - r*pr; pos.push({x: W/2 + (col-(inRow-1)/2)*slot, y: top + r*rowH + w*.6 + w*3.05/2}); }
  const shelves = []; for (let r=0;r<rows;r++){ const inRow = Math.min(pr, n - r*pr); shelves.push({y: top + r*rowH + w*.6 + w*3.05, half: inRow*slot/2 + w*.3}); }
  const seatW = Math.min(usableW / seats.length, 190);
  const far = {x: -9999, y: -9999};
  lay = {w, pos: pos.slice(0, bottles.length), supply: pos[bottles.length] || far, rack: pos[bottles.length+1] || far, sink: pos[bottles.length+2] || far, shelves, slot, seatW, counterY,
         seatPos: seats.map((s,k) => ({x: W/2 + (k - (seats.length-1)/2)*seatW, y: counterY}))};
  lay.sh = bottleShape(save.bottle, w);
}
window.addEventListener("resize", () => { if (!$("play").classList.contains("hidden")) layout(); });

/* ---------- お客さん ---------- */
function newOrder(fixed){
  const pal = palette(), n = fixed || Math.round(RG(S.ord[0]-.49, S.ord[1]+.49)), o = [];
  const want = {}; wanted().forEach(c => want[c] = (want[c]||0) + 1);
  // まだ誰にも頼まれていない満タン瓶（棚の栓つき・保管棚）の色を優先して注文してもらう
  const spare = {}; bottles.forEach(b => { if (b.corked) spare[b.units[0].c] = (spare[b.units[0].c]||0) + 1; }); stored.forEach(c => spare[c] = (spare[c]||0) + 1);
  for (const c in want) spare[c] = (spare[c]||0) - want[c];
  const avail = {}; bottles.forEach(b => b.units.forEach(u => avail[u.c] = (avail[u.c]||0) + 1));
  if (supplyLeft > 0) stock.forEach(st => st.forEach(c => avail[c] = (avail[c]||0) + 1));
  for (const c in want) avail[c] = (avail[c]||0) - want[c]*CAP;
  for (let i=0;i<n;i++){
    const ready = pal.filter(c => (spare[c]||0) > 0);
    let c;
    if (ready.length && rnd() < .8){ c = pick(ready); spare[c]--; }
    else {
      // すでにたくさん頼まれている色は選ばれにくくする
      const wts = pal.map(c => Math.max(.15, Math.max(0, avail[c]||0) + 1) / (1 + 2*(want[c]||0) + (o.includes(c) ? 1.5 : 0)));
      let r = rnd()*wts.reduce((a,b)=>a+b,0); c = pal[0];
      for (let k=0;k<pal.length;k++){ r -= wts[k]; if (r <= 0){ c = pal[k]; break; } }
    }
    o.push(c); want[c] = (want[c]||0) + 1; avail[c] = (avail[c]||0) - CAP;
  }
  return o;
}
function patienceFor(order){ return S.pat*1000 * (1 + .3*(order.length-1)) * (1 + .12*upg("pat")) * (tut ? 3 : 1); }
/* ---------- チュートリアル（1-1 の初回。指で次の一手を案内する） ---------- */
let tut = null; // {step}
function hintMove(){
  const ok = i => !busy.has(i) && !bottles[i].ice && bottles[i].lock == null && !bottles[i].glass && !bottles[i].corked;
  const need = wanted(); if (!need.length) return null;
  const topC = b => b.units.length ? b.units[b.units.length-1].c : -1, room = b => CAP - b.units.length;
  for (const c of need){
    if (bottles.some(b => b.corked && b.units[0].c === c)) continue;
    const srcs = bottles.map((b,i) => i).filter(i => ok(i) && topC(bottles[i]) === c);
    // 同じ色が多い瓶へ集める
    const dsts = srcs.filter(i => room(bottles[i]) > 0).sort((a,b) => bottles[b].units.filter(u => u.c === c).length - bottles[a].units.filter(u => u.c === c).length);
    for (const d of dsts) for (const s2 of srcs) if (s2 !== d && bottles[s2].units.filter(u=>u.c===c).length <= bottles[d].units.filter(u=>u.c===c).length) return {from: s2, to: d};
    const empty = bottles.findIndex((b,i) => ok(i) && !b.units.length);
    if (srcs.length && empty >= 0 && !bottles[srcs[0]].units.every(u => u.c === c)) return {from: srcs[0], to: empty};
    // 下に埋まっている色を掘り出す
    for (let i=0;i<bottles.length;i++){ const b = bottles[i]; if (!ok(i) || !b.units.length || topC(b) === c || !b.units.some(u => u.c === c)) continue;
      const x = topC(b), d = bottles.findIndex((d2,j) => j !== i && ok(j) && room(d2) > 0 && (topC(d2) === x || !d2.units.length));
      if (d >= 0) return {from: i, to: d}; }
  }
  if (emptyIdx() >= 0 && supplyLeft > 0) return {supply: true};
  return null;
}
const TUT = [
  {msg: "いらっしゃいませ！ 上の<b>吹き出し</b>が、お客さんの注文です。注文の色の瓶を<b>満タン</b>にして渡します。", next: true},
  {msg: "<b>指のところの瓶</b>をタップして選びましょう。", pick: true},
  {msg: "次に<b>注ぎ先の瓶</b>をタップ。同じ色の上か、空き瓶にだけ注げます。", pour: true},
  {msg: "その調子！ 同じ色を<b>4杯</b>そろえると栓が閉まって満タン瓶になります。指の案内に沿って続けましょう。", loop: true},
  {msg: "満タン！ 満タン瓶は、その色を頼んだお客さんに<b>自動で渡ります</b>（頼んだ人がいなければ「注文待ち」で棚に置いておきます）。注文の瓶を全部渡すと代金がもらえます。", next: true},
  {msg: "空き瓶があるときは<b>「仕入れ」</b>をタップすると、上に見えている中身が空き瓶に入ります。仕入れ1回ごとに仕入れ代がかかります。", supply: true},
  {msg: "これで基本はおしまい！ 困ったら瓶を選んで<b>流し</b>へ。間違えたら上の<b>「↶ 戻す」</b>で1手戻せます。<br>あとは自由に営業してみましょう！", next: true, last: true},
];
function tutShow(){
  const st = TUT[tut.step]; $("tutTx").innerHTML = st.msg; $("tutNext").classList.toggle("hidden", !st.next); $("tutNext").textContent = st.last ? "はじめる" : "次へ";
  $("tutBox").classList.remove("hidden"); paused = !!st.next;
}
function tutGo(step){ tut.step = step; if (step >= TUT.length){ tutEnd(); return; } tutShow(); }
function tutEnd(){ tut = null; save.tutDone = true; persist(); $("tutBox").classList.add("hidden"); paused = false; lastTs = 0; }
function tutTick(){
  if (!tut) return; const st = TUT[tut.step];
  if (tut.step === 0 && !st.shown){ if (seats.some(s => s.state === "wait")){ st.shown = true; tutShow(); } else { $("tutBox").classList.add("hidden"); } return; }
  if (st.pick && sel >= 0) tutGo(2);
  else if (st.pour && sel < 0 && pours.length) tutGo(3);
  else if (st.pour && sel < 0 && !pours.length) tutGo(1);
  else if (st.loop && bottles.some(b => b.corked)) tutGo(4);
  else if (st.supply && (emptyIdx() < 0 || supplyLeft <= 0 || stockT > tut.t0)) tutGo(6);
}
function tutHand(){ // 指の位置
  if (prepHint && S.mode === "prep" && !paused){ const i = sel >= 0 ? prepHint.to : prepHint.from; return lay.pos[i]; }
  if (!tut || paused) return null; const st = TUT[tut.step];
  if (st.supply) return lay.supply;
  if (!(st.pick || st.pour || st.loop)) return null;
  const h = hintMove(); if (!h) return null; if (h.supply) return lay.supply;
  return lay.pos[sel >= 0 ? h.to : h.from];
}
$("tutNext").onclick = () => { audio(); play("pick", {gain:.4}); const st = TUT[tut.step]; if (st.last) return tutEnd(); if (tut.step === 4){ tut.t0 = T; } tutGo(tut.step === 0 ? 1 : tut.step + 1); lastTs = 0; };
$("tutSkip").onclick = () => tutEnd();
window.__hand = () => { const h = tutHand(); return h ? {x: h.x, y: h.y} : null; };
function updateSeats(){
  if (S.mode === "prep") return;
  seats.forEach((s, k) => {
    if (s.state === "empty" && guestsLeft > 0 && T >= s.next){
      guestsLeft--; s.state = "in"; s.t0 = T; s.g = Math.floor(rnd()*GUESTS.length);
      s.order = S.reserve && resQ.length ? resQ.shift() : newOrder(); s.resv = !!S.reserve;
      if (S.reserve){ while (resQ.length < 2) resQ.push(newOrder()); } s.got = s.order.map(()=>false); s.res = s.order.map(()=>false); s.pat = patienceFor(s.order);
      s.rush = !!S.rush && rnd() < S.rush; if (s.rush) s.pat *= .6;
      s.vip = !s.rush && !!S.vip && rnd() < S.vip;
      // 評論家（たまに来る。待てる時間が短いが代金2.5倍）・常連さん（気長に待ってくれて、チップ2倍）
      const critP = S.mode === "endless" ? (elvl >= 6 ? .06 : 0) : (typeof stg === "number" && stg < 3) ? 0 : .06;
      s.critic = !s.rush && !s.vip && rnd() < critP; if (s.critic) s.pat *= .85;
      s.cock = null;
      if (S.cocktail && !seats.some(x => x !== s && x.cock && (x.state === "in" || x.state === "wait")) && rnd() < S.cocktail){
        s.rush = s.vip = s.critic = false; s.cock = genCock(); s.order = []; s.got = []; s.res = []; s.pat = S.pat*1000*(1.2 + .15*s.cock.length)*(1 + .12*upg("pat")); }
      s.regular = !s.cock && !s.rush && !s.vip && !s.critic && !(typeof stg === "number" && stg < 1) && rnd() < .12; if (s.regular) s.pat *= 1.4;
      if (s.vip){ const two = newOrder(2); s.order = [two[0], two[0], two[1], two[1]]; s.got = s.order.map(()=>false); s.res = s.order.map(()=>false); s.pat = patienceFor(s.order)*1.25; }
      { const r1 = rnd(), r2 = rnd(), r3 = rnd(), f = FAVC[s.g]; s.sig = false;
        if (!s.cock && !s.vip && !s.resv){
          if (sigOn() && r1 < .12){ const m = s.pat/patienceFor(s.order); s.order = save.sig.slice(); s.sig = true; s.pat = patienceFor(s.order)*m; }
          else if (f < S.colors && !s.order.includes(f) && r2 < .35) s.order[Math.floor(r3*s.order.length)] = f;
          s.got = s.order.map(()=>false); s.res = s.order.map(()=>false); }
        s.favHit = !s.cock && s.order.includes(f); }
      evOnGuest(s, rnd());
      zooSeen(s); evArrive(s, k); play("door", {gain:.3}); hud();
    }
    if (s.state === "in" && T - s.t0 > 450){ s.state = "wait"; s.t0 = T; }
    if (s.state === "wait" && !s.res.some(Boolean) && T - s.t0 > s.pat) leave(k, "timeout");
    if (s.state === "leave" && T - s.t0 > 900){ s.state = "empty"; s.next = T + 700; }
  });
  if (S.mode === "endless" && lives <= 0 && guestsLeft > 0){ // ハートがなくなったら閉店
    guestsLeft = 0; flights = []; seats.forEach(s => { if (s.state === "in" || s.state === "wait"){ s.state = "leave"; s.mood = "angry"; s.t0 = T; s.res = s.res.map(() => false); } }); }
  if (!ended && guestsLeft === 0 && seats.every(s => s.state === "empty") && !flights.length) endStage();
}
function payGuest(k){
  zooServed(seats[k]);
  const s = seats[k], n = s.cock ? (s.cock.length >= 4 ? 3 : 2.4) : s.order.length, sp = lay.seatPos[k];
  const left = Math.max(0, 1 - (T - s.t0)/s.pat);
  const base = PRICE*n*(1 + .1*upg("price"))*(s.rush ? 1.4 : 1)*(s.vip ? 2 : 1)*(s.critic ? 2.5 : 1)*(happyNow() ? 1.5 : 1)*(s.favHit ? 1.2 : 1)*(s.sig ? 1.5 : 1)*evPay(s);
  const resvOK = s.resv && left > .6;
  if (resvOK){ floatText(sp.x, sp.y - 140, "予約どおり！ ×1.3", "#ffd56b", .9, 480); }
  const tip = base*(.3 + .1*upg("tip"))*(has("cat") ? 1.2 : 1)*(s.regular ? 2 : 1)*Math.max(0, (left - .5)/.5);
  if (s.critic) floatText(sp.x, sp.y - 120, "評論家「すばらしい！」", "#d6b3ff", .9, 360);
  if (s.sig) floatText(sp.x, sp.y - 146, "看板メニュー！ ×1.5", "#ffb27a", .9, 420); else if (s.favHit) floatText(sp.x, sp.y - 146, `大好物の${CNAME[FAVC[s.g]]}！ ×1.2`, "#ff9ec0", .8, 420);
  combo++; maxCombo = Math.max(maxCombo, combo);
  const bonus = base*Math.min(has("juke") ? 2 : 1, (combo-1)*.1)*(S.evg === "fire" ? 2 : 1);
  const total = Math.round((base + tip + bonus)*(resvOK ? 1.3 : 1)/10)*10;
  money += total; servedN++; if (S.mode === "endless"){ endlessStep(); claim("emon", money); }
  floatText(sp.x, sp.y - 40, `+${yen(total)}`, "#f2b54a", 1.3);
  if (tip >= 10) floatText(sp.x, sp.y - 68, `はやい！ チップ ${yen(Math.round(tip/10)*10)}`, "#7fd17a", .8, 120);
  if (combo >= 2) floatText(sp.x, sp.y - 94, `${combo}連続 +${yen(Math.round(bonus/10)*10)}`, "#f6ead6", .85, 240);
  play("pay", {gain:.7, delay:.15});
  if (combo >= 3 && combo % 3 === 0) play("bonus", {gain:.5, delay:.4});
  for (let i=0;i<14;i++) parts.push({x:sp.x, y:sp.y - 60, vx:R(-1.6,1.6), vy:R(-2.6,-.8), t0:T, life:R(600,1000), r:R(1.5,3.5), heart: i%4===0});
  leave(k, "love"); hud();
}
function leave(k, mood){
  const s = seats[k];
  if (mood === "timeout"){ combo = 0; missed++; const sp = lay.seatPos[k]; floatText(sp.x, sp.y - 70, s.critic ? "評論家「辛口で書いておくよ」" : "もういいよ…", "#ef6b5b", .9); play("wrong", {gain:.25, rate:.85});
    if (S.mode === "endless"){ lives--; floatText(W/2, lay.counterY + 44, lives > 0 ? `ハート −1（のこり ${lives}）` : "ハートがなくなった…", "#ef6b5b", 1); }
    hud(); }
  s.state = "leave"; s.mood = mood === "timeout" ? "angry" : mood; s.t0 = T;
}

/* ---------- 操作 ---------- */
// ひとつ戻す：直前の1手（注ぐ・仕入れ・流し）だけ戻せる。1ステージ3回まで。渡したり保管したりした後は戻せない
let undoSnap = null, undoLeft = 3, undoStack = [];
// 寒波：氷のあるステージでは、途中でも瓶がまた凍る（3秒前に予告）
let freezeT = Infinity, freezeWarn = null;
const FREEZE_WARN = 3000;
const freezeGap = () => S.w === 4 && S.n ? 30000 - (S.n - 1)*1000 : 26000;
// 予告したしかけは、触っている瓶にもかかる（選択は外し、その瓶がからむ予約の手は取り消す）。注いでいる最中だけは終わるまで待つ
function gimHit(i){ if (sel === i) sel = -1; moveQ = moveQ.filter(q => q[0] !== i && q[1] !== i); }
function freezeOK(i){ const b = bottles[i]; return b && !b.glass && !b.ice && b.lock == null && !b.corked && !busy.has(i) && sel !== i; }
function coldWave(){
  if (!S.ice || !lay) return;
  // 詰まないように：凍っている瓶が1本でもあるうちは寒波は来ない。凍らせるのは「今の注文に関係のない色」の瓶を優先
  const frozen = bottles.filter(b => b.ice).length, maxIce = 1;
  if (!freezeWarn && T >= freezeT - FREEZE_WARN){
    if (frozen >= maxIce || emptyIdx() < 0){ freezeT = T + 6000; return; } // 空き瓶がないときも来ない
    const need = wantedNow(), score = i => bottles[i].units.filter(u => need.includes(u.c)).length;
    const cand = bottles.map((b, i) => i).filter(i => freezeOK(i) && bottles[i].units.length);
    if (!cand.length){ freezeT = T + 6000; return; }
    const best = Math.min(...cand.map(score)), pool = cand.filter(i => score(i) === best);
    freezeWarn = {i: pool[Math.floor(Math.random()*pool.length)], t0: T};
    floatText(W/2, lay.counterY + 40, "寒波が来る！", "#9ed8f0", 1.1); play("ice", {gain:.35, rate:1.2});
  }
  if (freezeWarn && T - freezeWarn.t0 >= FREEZE_WARN){
    let i = freezeWarn.i; if (busy.has(i) && T - freezeWarn.t0 < FREEZE_WARN + 4000) return; freezeWarn = null;
    const b = bottles[i]; if (!b || b.glass || b.ice || b.lock != null || b.corked || busy.has(i)) i = -1;
    if (i >= 0) gimHit(i);
    if (i >= 0 && bottles.filter(b => b.ice).length < maxIce){ bottles[i].ice = 1; bottles[i].iceT = T + ICE_MS; undoSnap = null; play("ice", {gain:.6});
      floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, "凍った！", "#9ed8f0", .9);
      for (let k=0;k<12;k++) parts.push({x: lay.pos[i].x + R(-lay.sh.w*.4, lay.sh.w*.4), y: lay.pos[i].y + R(-lay.sh.H*.3, lay.sh.H*.3), vx:R(-1,1), vy:R(-1.4,-.2), t0:T, life:R(500,900), r:R(1.5,3), ice:true}); }
    freezeT = T + freezeGap();
  }
}
// ハッピーアワー：ワールド2以降のステージで、途中に20秒だけ代金1.5倍
let hhT = Infinity, hhOn = false; const HH_LEN = 20000;
const happyNow = () => T >= hhT && T < hhT + HH_LEN;
const UNDO_MAX = 3;
function snap(){ if (S && S.mode === "prep" && undoSnap) undoStack.push(undoSnap); undoSnap = {pm: prepMoves, b: bottles.map(b => ({units: b.units.map(u => ({...u})), corked: b.corked, corkT: b.corkT, ice: b.ice, iceT: b.iceT, cloth: b.cloth ? {...b.cloth} : null})), stock: stock.map(a => a.slice()), supplyLeft, expSupply, money, dumped, n: bottles.length}; }
function doUndo(){
  if (S.mode === "prep" && !undoSnap && undoStack.length) undoSnap = undoStack.pop();
  if (!running || paused || !undoSnap || undoLeft <= 0 || pours.length || undoSnap.n !== bottles.length) return;
  const u = undoSnap; undoSnap = null; undoLeft--;
  u.b.forEach((o, i) => { const b = bottles[i]; b.units = o.units; b.corked = o.corked; if (o.corkT == null) delete b.corkT; else b.corkT = o.corkT; b.ice = o.ice; b.iceT = o.iceT || 0; b.cloth = o.cloth ? {...o.cloth} : null; if (b.ice && S.mode !== "prep" && !b.iceT) b.iceT = T + ICE_MS; waveT[i] = T; });
  if (S.mode === "prep") prepMoves = u.pm;
  stock = u.stock; supplyLeft = u.supplyLeft; expSupply = u.expSupply; money = u.money; dumped = u.dumped; sel = -1; busy = new Set(); moveQ = [];
  play("pick", {gain:.5, rate:.8}); floatText(W/2, lay.counterY + 40, S.mode === "prep" ? "ひとつ戻しました" : `ひとつ戻しました（あと${undoLeft}回）`, "#9ed8f0", .85); hud();
}
function tapGlass(i){
  const b = bottles[i];
  if (sel < 0){ if (!b.units.length){ shakeT[i] = T; floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, "瓶を選んでから、ここをタップ", "#ffb3e6", .75); return; } sel = i; play("pick", {gain:.5}); return; }
  if (sel === i){ sel = -1; play("pick", {gain:.35, rate:.9}); return; }
  const a = bottles[sel]; if (!a.units.length || a.corked || a.ice || a.lock != null || a.cloth){ sel = -1; return; }
  if (b.units.length >= (S.cockLen ? S.cockLen[1] : CAP)){ shakeT[i] = T; play("bad", {gain:.3}); return; }
  snap(); startPour(sel, i, 1); sel = -1; hud();
}
// 続けて注ぐ：注いでいる途中の瓶にも次の操作を受け付けて、空いたら順番に注ぐ
let moveQ = [];
function runMoveQ(){
  if (!moveQ.length || paused || !running) return;
  const [a, b] = moveQ[0]; if (busy.has(a) || busy.has(b)) return;
  moveQ.shift(); if (!bottles[a] || !bottles[b]) return; const keep = sel; sel = a; tapBottle(b, true); if (keep >= 0) sel = keep; // 待っている間に選んでいた瓶はそのまま
}
function tapBottle(i, fromQ){
  if (!running) return; audio();
  if (!bottles[i]) return;
  if (!fromQ && (busy.has(i) || (sel >= 0 && busy.has(sel)) || moveQ.length)){
    if (sel >= 0 && sel !== i){ if (moveQ.length < 12) moveQ.push([sel, i]); sel = -1; play("pick", {gain:.3, rate:1.15}); return; }
    if (sel < 0 && (bottles[i].units.length || moveQ.some(q => q[1] === i)) && !bottles[i].corked && !bottles[i].ice && (!bottles[i].cloth || moveQ.length) && bottles[i].lock == null && !bottles[i].glass){ sel = i; play("pick", {gain:.5, rate:1.05}); return; }
    if (sel === i){ sel = -1; return; }
    return;
  }
  const b = bottles[i];
  if (b.glass) return tapGlass(i);
  if (sel >= 0 && bottles[sel] && bottles[sel].glass && sel !== i){ shakeT[i] = T; play("bad", {gain:.3}); floatText(lay.pos[sel].x, lay.pos[sel].y - lay.sh.H*.7, "グラスの中身は流しにだけ捨てられます", "#ffb3e6", .7); return; }
  if (b.lock != null){ shakeT[i] = T; play("bad", {gain:.3}); floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, `🔒${CNAME[b.lock]}を満タンにすると開く`, "#f3d27a", .75); return; }
  if (b.ice){ shakeT[i] = T; play("bad", {gain:.3}); floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, b.iceT ? `あと${Math.ceil((b.iceT - T)/1000)}秒で溶ける（満タン瓶を渡すと早まる）` : `あと${b.ice}本渡すか、少し待つと溶ける`, "#9ed8f0", .75); return; }
  if (b.cloth){ shakeT[i] = T; play("bad", {gain:.3}); const f = b.cloth; floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, f.c < 0 ? `満タン瓶を${f.n}本作ると、ふきんが取れる` : `${CNAME[f.c]}の満タン瓶を作ると、ふきんが取れる`, "#ffd56b", .75); return; }
  if (b.corked && S.mode === "prep"){ shakeT[i] = T; return; }
  if (b.corked){ if (sel >= 0){ shakeT[i] = T; play("bad", {gain:.3}); return; } deliver(i); return; }
  if (sel < 0){
    if (!b.units.length){ shakeT[i] = T; return; }
    sel = i; play("pick", {gain:.5, rate:1.05}); return;
  }
  if (sel === i){ sel = -1; play("pick", {gain:.35, rate:.9}); return; }
  const a = bottles[sel]; if (!a.units.length || a.corked || a.ice || a.lock != null || a.cloth){ sel = -1; return; } // 待っている間に栓・氷・カギ・ふきんが付いた瓶からは注がない
  revealTop(sel); if (!topRun(a.units)){ sel = -1; return; } // 念のため：一番上が「？」のままなら見せてから
  const c = a.units[a.units.length-1].c;
  if (b.units.length >= CAP || (b.units.length && b.units[b.units.length-1].c !== c)){ shakeT[i] = T; play("bad", {gain:.3}); return; }
  snap(); startPour(sel, i, Math.min(topRun(a.units), CAP - b.units.length)); sel = -1;
  if (S.mode === "prep"){ prepMoves++; if (prepHint) prepHint = null; } hud();
}
function tapSink(){
  if (!running || sel < 0) return; audio();
  if (busy.has(sel)){ shakeT[sel] = T; return; } // 注いでいる途中の瓶は流しに捨てない
  snap(); const b = bottles[sel], n = b.glass ? b.units.length : topRun(b.units); b.units.splice(b.units.length - n, n);
  const cost = n*DUMP_COST; money = Math.max(0, money - cost); dumped += n;
  floatText(lay.sink.x, lay.sink.y - lay.sh.H*.3, `−${yen(cost)}`, "#ef6b5b", .8);
  revealTop(sel); play("sink", {gain:.5}); sel = -1; hud();
}
function revealTop(i){ const u = bottles[i].units; if (u.length && u[u.length-1].h){ u[u.length-1].h = false; u[u.length-1].rev = T; play("reveal", {gain:.45, delay:.35}); } }
function emptyIdx(){ return bottles.findIndex((b,j) => !b.glass && !b.units.length && !busy.has(j) && !b.corked && !b.ice && b.lock == null); }
function unlockColor(c){ bottles.forEach((b, i) => { if (b.lock === c){ b.lock = null; b.unlockT = T; play("reveal", {gain:.6}); play("kira", {gain:.4, delay:.15}); floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, "カギが開いた！", "#f3d27a", .9);
  for (let k=0;k<10;k++) parts.push({x: lay.pos[i].x, y: lay.pos[i].y, vx:R(-1.5,1.5), vy:R(-2,-.4), t0:T, life:R(500,900), r:R(1.5,3)}); } }); }
function lockPick(){ // カギの色：今いる注文の色を優先（開けやすく）
  const need = wantedNow(); return need.length && Math.random() < .7 ? need[Math.floor(Math.random()*need.length)] : Math.floor(Math.random()*S.colors); }
const LOCK_LEN = 30000;
function lockWave(){
  if (!lay) return;
  bottles.forEach((b, i) => { if (b.lock != null && T - (b.lockT0||0) >= LOCK_LEN) unlockColor(b.lock); });
  if (!S.relock) return;
  if (!lockWarn && T >= lockT - 3000){
    if (bottles.some(b => b.lock != null) || emptyIdx() < 0){ lockT = T + 8000; return; }
    const cand = bottles.map((b, i) => i).filter(i => { const b = bottles[i]; return !b.glass && !b.ice && b.lock == null && !b.corked && !busy.has(i) && sel !== i && b.units.length; });
    if (!cand.length){ lockT = T + 8000; return; }
    lockWarn = {i: cand[Math.floor(Math.random()*cand.length)], c: lockPick(), t0: T}; floatText(W/2, lay.counterY + 40, "からくりが動き出した！", "#f3d27a", 1); play("cork", {gain:.4, rate:.7});
  }
  if (lockWarn && T - lockWarn.t0 >= 3000){ const {i, c} = lockWarn; if (busy.has(i) && T - lockWarn.t0 < 7000) return; lockWarn = null; const b = bottles[i];
    if (b && b.lock == null && !b.ice && !b.corked && !busy.has(i)){ gimHit(i); b.lock = c; b.lockT0 = T; undoSnap = null; play("cork", {gain:.7, rate:.6}); floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, "カギがかかった", "#f3d27a", .85); }
    lockT = T + 34000; }
}
const glassIdx = () => bottles.findIndex(b => b.glass);
const cockGuest = () => seats.find(x => x.cock && (x.state === "in" || x.state === "wait") && !x.res.some(Boolean));
function cockState(){ // グラスの中身が、注文の下からの並びと合っているか
  const gi = glassIdx(); if (gi < 0) return null; const g = cockGuest(), u = bottles[gi].units.map(x => x.c);
  if (!g) return {gi, u, ok: !u.length, next: null};
  const ok = u.every((c, j) => g.cock[j] === c) && u.length <= g.cock.length;
  return {gi, u, g, ok, next: ok && u.length < g.cock.length ? g.cock[u.length] : null};
}
function genCock(){
  if (S.evg === "hina") return [3, 1, 4]; // ひしもち：下から緑・黄・桃
  const pal = palette(), len = Math.round(RG(S.cockLen[0] - .49, S.cockLen[1] + .49)), cs = [];
  while (cs.length < Math.min(3, len - 1)){ const c = pick(pal); if (!cs.includes(c)) cs.push(c); }
  let p; do { p = []; for (let k=0;k<len;k++) p.push(pick(cs)); } while (new Set(p).size < 2);
  return p;
}
function checkCocktail(gi){
  const st = cockState(); if (!st || !st.g) return;
  if (st.u.length === st.g.cock.length && st.ok){
    const k = seats.indexOf(st.g); st.g.res = [true]; undoSnap = null;
    flights.push({cock: st.u.slice(), k, j: 0, from: {x: lay.pos[gi].x, y: lay.pos[gi].y}, t0: T + 200, dur: 560});
    bottles[gi].units = []; waveT[gi] = T; play("kira", {gain:.6}); play("cork", {gain:.5, delay:.1});
    floatText(lay.pos[gi].x, lay.pos[gi].y - lay.sh.H*.7, "カクテル完成！", "#ffb3e6", 1);
  }
}
// 氷：ふつうのステージは瓶ごとの時間（ICE_MS）で溶ける。満タン瓶を渡すと3秒早まる。仕込みは数字が減っていく
const ICE_MS = 12000, ICE_CUT = 4000;
function iceMelt(){ bottles.forEach((b, i) => { if (b.ice && b.iceT && T >= b.iceT){ b.ice = 0; b.iceT = 0; meltFx(i); } }); }
function meltFx(i){ bottles[i].meltT = T; play("reveal", {gain:.5}); floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, "溶けた！", "#9ed8f0", .85);
  for (let k=0;k<12;k++) parts.push({x: lay.pos[i].x + R(-lay.sh.w*.4, lay.sh.w*.4), y: lay.pos[i].y + R(-lay.sh.H*.3, lay.sh.H*.3), vx:R(-1.2,1.2), vy:R(-1.8,-.3), t0:T, life:R(500,900), r:R(1.5,3), ice:true}); }
function thaw(){ if (S.mode !== "prep"){ bottles.forEach(b => { if (b.ice && b.iceT) b.iceT -= ICE_CUT; }); return; } thawPrep(); }
function thawPrep(){ bottles.forEach((b,i) => { if (b.ice){ b.ice--; if (!b.ice){ b.meltT = T; play("reveal", {gain:.5}); floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, "溶けた！", "#9ed8f0", .85);
  for (let k=0;k<12;k++) parts.push({x: lay.pos[i].x + R(-lay.sh.w*.4, lay.sh.w*.4), y: lay.pos[i].y + R(-lay.sh.H*.3, lay.sh.H*.3), vx:R(-1.2,1.2), vy:R(-1.8,-.3), t0:T, life:R(500,900), r:R(1.5,3), ice:true}); } } }); }
function tapSupply(){
  if (!running) return; audio();
  if (supplyLeft <= 0){ shakeT.supply = T; play("bad", {gain:.3}); floatText(lay.supply.x, lay.supply.y - lay.sh.H*.7, "今日の仕入れはおしまい", "#ef6b5b", .75); return; }
  const i = emptyIdx();
  if (i < 0){ shakeT.supply = T; play("bad", {gain:.3}); floatText(lay.supply.x, lay.supply.y - lay.sh.H*.7, "空き瓶がありません", "#ef6b5b", .75); return; }
  sel = -1; snap();
  supplyLeft--; expSupply += SUPPLY_COST; floatText(lay.supply.x, lay.supply.y - lay.sh.H*.7, `仕入れ代 −${yen(SUPPLY_COST)}`, "#bba895", .7);
  bottles[i].units = stock.shift().map((c,j) => ({c, h: !!S.hide && j < CAP-1})); stock.push(stockUnits()); stockT = T;
  bottles[i].refillT = T; waveT[i] = T; evOnSupply(i);
  pourSound(.45, 0, 1); play("pick", {gain:.4, rate:.95});
}
function findTarget(c){
  let bestK = -1, bestJ = -1, bestLeft = 1e9;
  seats.forEach((s, k) => { if (s.state !== "wait" && s.state !== "in") return;
    s.order.forEach((oc, j) => { if (oc === c && !s.got[j] && !s.res[j]){ const left = s.pat - (T - s.t0); if (left < bestLeft){ bestLeft = left; bestK = k; bestJ = j; } } }); });
  return bestK < 0 ? null : {k: bestK, j: bestJ};
}
function deliver(i){
  undoSnap = null;
  const b = bottles[i], c = b.units[0].c, tg = findTarget(c);
  if (!tg){
    // 注文がない色は保管棚へ下げて、棚をあける
    if (stored.length >= storeCap){
      const cost = rackCost();
      if (storeCap < storeMax() && save.wallet >= cost){ askRack(i); return; }
      shakeT[i] = T; play("bad", {gain:.3}); floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, storeCap < storeMax() ? "保管棚がいっぱい（財布が足りません）" : "保管棚がいっぱい", "#ef6b5b", .75); return; }
    stored.push(c); storeT = T; b.units = []; b.corked = false; delete b.corkT;
    floatText(lay.rack.x, lay.rack.y - lay.sh.H*.55, "保管", "#bba895", .75); play("pick", {gain:.5, rate:.9}); return;
  }
  seats[tg.k].res[tg.j] = true;
  flights.push({c, k: tg.k, j: tg.j, from: {x: lay.pos[i].x, y: lay.pos[i].y}, t0: T, dur: 520});
  b.units = []; b.corked = false; delete b.corkT;
  bottlesOut++; thaw(); play("pick", {gain:.5, rate:1.2});
}
let storeT = -1e9;
function rackCost(){ return RACK_COST_ALL[storeCap - (has("rack") ? 2 : 1)] || 800; }
function rackSlot(k){ const r = lay.rack, cw = Math.min(lay.slot*.3, lay.slot*.92/storeCap); return {x: r.x + (k - (storeCap-1)/2)*cw, y: r.y + lay.sh.H*.18}; }
// 保管棚を増やすか聞く。聞いている間はゲームの時間を止める
function askRack(i){
  pendingStore = i; paused = true; sel = -1;
  const cost = rackCost();
  $("rackP").textContent = `財布から ${yen(cost)} で、このステージの保管棚を1つ増やします（財布 ${yen(save.wallet)}）。`;
  $("rackBuy").textContent = `${yen(cost)} で増やす`;
  $("rackAsk").classList.remove("hidden"); play("pick", {gain:.4});
}
function closeRack(buy){
  $("rackAsk").classList.add("hidden");
  if (buy){
    const cost = rackCost();
    if (save.wallet >= cost){ save.wallet -= cost; persist(); storeCap++; play("pay", {gain:.6});
      floatText(lay.rack.x, lay.rack.y - lay.sh.H*.75, `保管棚を追加（−${yen(cost)}）`, "#f2b54a", .8); hud(); }
  }
  paused = false; lastTs = 0;
  const i = pendingStore; pendingStore = -1;
  if (buy && i >= 0 && bottles[i] && bottles[i].corked && stored.length < storeCap) deliver(i);
}
function tapRack(x){ undoSnap = null;
  if (!running || !stored.length) return; audio();
  let k = 0, bd = 1e9; stored.forEach((_, j) => { const d = Math.abs(rackSlot(j).x - x); if (d < bd){ bd = d; k = j; } });
  const c = stored[k], tg = findTarget(c);
  if (!tg){ play("bad", {gain:.3}); floatText(lay.rack.x, lay.rack.y - lay.sh.H*.55, `${CNAME[c]}の注文はまだ`, "#bba895", .75); return; }
  sel = -1; seats[tg.k].res[tg.j] = true; const p = rackSlot(k);
  flights.push({c, k: tg.k, j: tg.j, from: {x: p.x, y: p.y}, t0: T, dur: 520}); stored.splice(k, 1);
  bottlesOut++; thaw(); play("pick", {gain:.5, rate:1.2});
}
// 満タン瓶は、その色の注文があれば自動で渡す（栓が閉まるのを見せてから）
function autoDeliver(){
  bottles.forEach((b,i) => {
    if (!b.corked || busy.has(i) || T - (b.corkT||0) < 650) return;
    if (findTarget(b.units[0].c)){ if (sel === i) sel = -1; deliver(i); }
  });
  for (let k=stored.length-1;k>=0;k--){
    const c = stored[k], tg = findTarget(c); if (!tg) continue; undoSnap = null;
    seats[tg.k].res[tg.j] = true; const p = rackSlot(k);
    flights.push({c, k: tg.k, j: tg.j, from: {x: p.x, y: p.y}, t0: T, dur: 520}); stored.splice(k, 1);
    bottlesOut++; thaw(); play("pick", {gain:.5, rate:1.2});
  }
}
function buyBottle(){
  if (S.mode === "prep"){ if (!running || bought >= 1 || pours.length) return; audio(); bought = 1; prepHelp = Math.min(2, prepHelp + 1); undoSnap = null; undoStack = [];
    bottles.push({units: [], spare: true}); lift.push(0); layout(); play("pay", {gain:.5}); floatText(W/2, lay.counterY + 40, "空き瓶を1本追加", "#f2b54a", .85); hud(); return; }
  if (!running || bought >= BUY_COST.length) return; audio();
  const cost = BUY_COST[bought];
  if (save.wallet < cost){ play("bad", {gain:.3}); return; }
  save.wallet -= cost; persist(); bought++; undoSnap = null;
  bottles.push({units: [], spare:true}); lift.push(0); layout();
  play("pay", {gain:.6}); floatText(W/2, lay.counterY + 40, `空き瓶を追加（財布 −${yen(cost)}）`, "#f2b54a", .85); hud();
}
function landFlight(f){
  const s = seats[f.k];
  if (!f.cock && S.lock) unlockColor(f.c);
  if (f.cock){ play("cheers", {gain:.6}); payGuest(f.k); return; }
  s.got[f.j] = true; s.res[f.j] = false;
  play("cheers", {gain:.55});
  if (s.got.every(Boolean)) payGuest(f.k);
}

function startPour(from, to, n){
  if (!(n > 0) || !bottles[from].units.length) return;
  const src = bottles[from].units, dst = bottles[to].units;
  const srcBefore = src.map(u => ({...u})), dstBefore = dst.map(u => ({...u}));
  const moved = src.splice(src.length - n, n); moved.forEach(u => dst.push({c:u.c}));
  revealTop(from);
  busy.add(from); busy.add(to);
  const fp = lay.pos[from], tp = lay.pos[to], dir = fp.x <= tp.x ? 1 : -1, sh = lay.sh;
  const a0 = angleFor(sh, srcBefore.length*sh.unit, dir), a1 = angleFor(sh, Math.max((srcBefore.length-n)*sh.unit, sh.unit*.04), dir);
  const sp = (has("spout") ? .67 : 1)*(S.mode === "prep" ? .8 : 1);
  pours.push({from, to, n, c: moved[0].c, dir, a0, a1, srcBefore, dstBefore, t0: T, T1: 260*sp, T2: (.36 + .13*n)*1000*sp, T3: 260*sp});
}
function tipTarget(p){ const sh = lay.sh, q = lay.pos[p.to]; return [q.x - p.dir*sh.nw*.15, q.y - sh.H/2 - sh.H*.16]; }
function posForAngle(p, a){ const sh = lay.sh, [tx,ty] = tipTarget(p), tip = rot([[p.dir*sh.nw, sh.top]], a)[0]; return [tx - tip[0], ty - tip[1]]; }
function finishPour(p){
  busy.delete(p.from); busy.delete(p.to); waveT[p.to] = T; setTimeout(hud, 0);
  const d = bottles[p.to];
  if (d.glass) checkCocktail(p.to);
  if (isFull(d)) cork(p.to);
  if (S.mode === "prep") setTimeout(prepCheck, 0);
}
function cork(i){ setTimeout(() => { if (S && S.mode === "prep") clothCheck(); }, 0); const b = bottles[i]; if (S && S.lock && b.units.length && b.lock == null) setTimeout(() => { if (b.units.length) unlockColor(b.units[0].c); }, 350); // カギ：同じ色を満タンにした時点で開く b.units.forEach(u => { if (u.h){ u.h = false; u.rev = T; } }); b.corked = true; b.corkT = T; play("cork", {gain:.85, delay:.28}); play("kira", {gain:.45, delay:.4});
  for (let k=0;k<10;k++) parts.push({x: lay.pos[i].x, y: lay.pos[i].y - lay.sh.H/2, vx:R(-1.5,1.5), vy:R(-2,-.4), t0:T + 300, life:R(500,900), r:R(1.5,3)}); }

function floatText(x, y, text, color, size=1, delay=0){ floats.push({x, y, text, color, size, t0: T + delay}); }

/* ---------- HUD ---------- */
function prepProgress(){
  const best = {};
  bottles.forEach(b => { if (b.glass || !b.units.length) return; const c = b.units[0].c; let n = 0; while (n < b.units.length && b.units[n].c === c) n++; best[c] = Math.max(best[c] || 0, b.corked ? CAP : n); });
  const done = Object.values(best).reduce((a, n) => a + n, 0);
  return Math.min(1, done / (S.colors * CAP));
}
function hud(){
  if (S.mode === "prep"){
    $("lvlV").textContent = S.daily ? "今日" : S.pid.slice(1); $("moneyV").textContent = `${prepMoves}手`; $("moneyG").textContent = `${S.daily ? "今日の仕込み" : "仕込み"}・目安${S.par}手・★3は${prepLine3()}手まで` + (prepHelp ? `・★最大${prepStarCap()}` : ""); $("leftV").textContent = "★" + prepStars(); $("leftL").textContent = "いまの★";
    // ゲージは完成までの進み具合（色ごとに、瓶の底からそろっている数）。色はいまの★（3=緑・2=黄・1=赤）
    const st = prepStars();
    $("moneyBar").style.width = (prepProgress()*100) + "%"; $("moneyBar").style.background = st >= 3 ? "var(--good)" : st === 2 ? "var(--amber)" : "#ef6b5b";
    $("m1").style.left = "-10%"; $("m2").style.left = "-10%"; $("m3").style.left = "-10%";
    $("sandBtn").classList.remove("hidden"); $("sandBtn").disabled = false; $("sandBtn").textContent = "💡 ヒント";
    $("undoBtn").disabled = !(undoSnap || undoStack.length); $("undoBtn").textContent = "↶ 戻す";
    $("buyBtn").disabled = bought >= 1; $("buyBtn").innerHTML = bought >= 1 ? "空き瓶の追加は1回まで" : "空き瓶 +1（★−1）";
    return;
  }
  $("sandBtn").textContent = "⏳ 全員 +10秒";
  $("lvlV").textContent = S.mode === "endless" ? `∞ Lv${elvl}` : S.mode === "daily" ? "日替わり" : S.id;
  $("sandBtn").classList.toggle("hidden", !has("sand")); $("sandBtn").disabled = sandUsed;
  $("undoBtn").disabled = !undoSnap || undoLeft <= 0; $("undoBtn").textContent = `↶ 戻す ${undoLeft}`;
  const bc = BUY_COST[bought];
  $("buyBtn").disabled = bought >= BUY_COST.length || save.wallet < (bc||1e9);
  $("buyBtn").innerHTML = bought >= BUY_COST.length ? "空き瓶の追加はここまで" : `空き瓶 +1 <b>財布から ${yen(bc)}</b>` + (save.wallet < bc ? "（足りません）" : "");
  $("moneyV").textContent = yen(money);
  if (S.mode === "endless"){
    const best = save.endless.best || 0, max = Math.max(3000, best*1.15, money*1.05);
    $("moneyG").textContent = "♥".repeat(Math.max(0, lives)) + "♡".repeat(Math.max(0, 3 - lives)) + (best ? ` ベスト ${yen(best)}` : "") + (combo >= 2 ? `・${combo}連続` : "");
    $("moneyBar").style.width = Math.min(100, money/max*100) + "%"; $("moneyBar").style.background = best && money > best ? "var(--good)" : "var(--amber)";
    $("m1").style.left = (best ? best/max*100 : -10) + "%"; $("m2").style.left = "-10%"; $("m3").style.left = "-10%";
    $("leftV").textContent = servedN; $("leftL").textContent = "人目";
    return;
  }
  $("leftL").textContent = "人まち";
  $("moneyG").textContent = `目標${yen(S.goal)}` + (money >= S.goal ? "✓" : "") + `・経費${yen(expSupply + rentOf(S))}` + (combo >= 2 ? `・${combo}連続` : "");
  const max = S.goal*2.2;
  $("moneyBar").style.width = Math.min(100, money/max*100) + "%";
  $("moneyBar").style.background = money >= S.goal ? "var(--good)" : "var(--amber)";
  $("m1").style.left = (1/2.2*100) + "%"; $("m2").style.left = (STAR2/2.2*100) + "%"; $("m3").style.left = (STAR3/2.2*100) + "%";
  const waiting = guestsLeft + seats.filter(s => s.state === "in" || s.state === "wait").length;
  $("leftV").textContent = waiting;
}

/* ---------- 入力 ---------- */
cv.addEventListener("pointerdown", e => {
  if (!lay || !running || paused) return;
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, sh = lay.sh;
  if (y < lay.counterY + 6 && seats.length){ let k = -1, bd = 1e9; seats.forEach((st, j) => { const d = Math.abs(x - lay.seatPos[j].x); if (d < bd && (st.state === "wait" || st.state === "in")){ bd = d; k = j; } }); if (k >= 0 && bd < lay.seatW*.6){ showGuestInfo(k); return; } }
  const sk = lay.sink; if (Math.abs(x - sk.x) < lay.slot/2 && Math.abs(y - sk.y) < sh.H*.55){ tapSink(); return; }
  const su = lay.supply; if (Math.abs(x - su.x) < lay.slot/2 && Math.abs(y - su.y) < sh.H*.55){ tapSupply(); return; }
  const rk = lay.rack; if (Math.abs(x - rk.x) < lay.slot/2 && Math.abs(y - rk.y) < sh.H*.55){ tapRack(x); return; }
  let best = -1, bd = 1e9;
  lay.pos.forEach((p,k) => { if (y < p.y - sh.H*.7 || y > p.y + sh.H*.6) return; const d = Math.abs(x - p.x); if (d < lay.slot/2 && d < bd){ bd = d; best = k; } });
  if (best >= 0) tapBottle(best); else if (sel >= 0){ sel = -1; }
});
document.addEventListener("gesturestart", e => e.preventDefault());

/* ---------- ループ ---------- */
const ease = t => t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
// 重い端末では、プレイ中のコマの速さを見て、自動で画面の細かさを少し下げる（次回からもその設定で始める）
let perfN = 0, perfSum = 0;
function perfWatch(dt){
  if (save.lite || !running || paused || dt <= 0 || dt > 100) return;
  perfSum += dt; perfN++;
  if (perfN >= 150){ const avg = perfSum/perfN; perfN = 0; perfSum = 0;
    const cap = save.dprCap || 2;
    if (avg > 21 && cap > 1.25 && Math.min(window.devicePixelRatio || 1, cap) > 1.25){ save.dprCap = Math.max(1.25, cap - .25); persist(); layout(); } }
}
function frame(ts){
  requestAnimationFrame(frame);
  const dt = Math.min(50, ts - (lastTs || ts)); perfWatch(ts - (lastTs || ts)); lastTs = ts;
  if ($("play").classList.contains("hidden") || !lay) return;
  if (running && !paused){
    T += dt*SPEED;
    if (S.mode === "prep"){ if (T >= iceTick){ iceTick = T + 15000; if (bottles.some(b => b.ice)) thawPrep(); } } else iceMelt();
    coldWave(); lockWave(); stockFix(); tipCheck(); evTick(); runMoveQ();
    // 「？」から見えた色の印は、見え始めの動きが終わったら消す（残ると模様が消えたり、同じ色が別の層に分かれて見える）
    for (const b of bottles) for (const u of b.units) if (u.rev != null && T - u.rev > 400) delete u.rev;
    if (S.dark && T >= darkT + DARK_LEN){ darkT = T + 26000; }
    if (S.dark && darkSoon() && !S._dw){ S._dw = 1; floatText(W/2, lay.counterY + 40, "停電しそう…", "#9eb8f0", 1); }
    if (S.dark && darkNow() && S._dw === 1){ S._dw = 2; play("wrong", {gain:.2, rate:.6}); }
    if (S.dark && !darkNow() && !darkSoon() && S._dw === 2){ S._dw = 0; play("reveal", {gain:.4}); }
    autoDeliver();
    updateSeats();
    if (happyNow() !== hhOn){ hhOn = !hhOn; if (hhOn){ play("bonus", {gain:.6}); floatText(W/2, lay.counterY - 30, "ハッピーアワー！ 代金1.5倍", "#ffd56b", 1.3); } }
    if (window.__bot) bot();
  }
  if (running) tutTick();
  draw();
}

// 動かない背景（壁・飾り・カウンター・棚）は1枚の絵にしておき、毎コマはそれを貼るだけにする（重さ対策）
function buildBg(){
  const bg = document.createElement("canvas"); bg.width = W*dpr; bg.height = H*dpr;
  const ctx = bg.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0);
  const sh = lay.sh, cy = lay.counterY;
  const g = ctx.createRadialGradient(W/2, -40, 10, W/2, -40, Math.max(W,H)*.9);
  g.addColorStop(0, room.wall[0]); g.addColorStop(.5, room.wall[1]); g.addColorStop(1, room.wall[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (S.w === 2){ // カフェの窓
    const ww = Math.min(W*.5, 260), wx = W/2 - ww/2; ctx.fillStyle = "rgba(255,236,190,.16)"; rr(ctx, wx, 14, ww, cy*.4, 10); ctx.fill();
    ctx.strokeStyle = "rgba(255,236,190,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W/2, 14); ctx.lineTo(W/2, 14 + cy*.4); ctx.moveTo(wx, 14 + cy*.2); ctx.lineTo(wx + ww, 14 + cy*.2); ctx.stroke(); }
  if (S.w === 3){ // ちょうちん
    ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 18); ctx.quadraticCurveTo(W/2, 46, W, 18); ctx.stroke();
    for (let i=0;i<7;i++){ const x = (i+.5)*W/7, y = 18 + 28*(1 - Math.pow((x - W/2)/(W/2), 2)) + 4;
      ctx.fillStyle = i % 2 ? "#e24a3b" : "#f3d27a"; ctx.globalAlpha = .85; ctx.beginPath(); ctx.ellipse(x, y + 10, 9, 12, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(x - 5, y - 3, 10, 3); ctx.fillRect(x - 5, y + 21, 10, 3); } }
  if (S.w === 4){ // 雪の窓
    const ww = Math.min(W*.5, 260), wx = W/2 - ww/2, wh = cy*.4; ctx.fillStyle = "rgba(170,200,230,.18)"; rr(ctx, wx, 14, ww, wh, 10); ctx.fill();
    ctx.strokeStyle = "rgba(220,235,250,.35)"; ctx.lineWidth = 3; rr(ctx, wx, 14, ww, wh, 10); ctx.stroke(); }
  if (S.w === 7){ // 屋上：夜空と電球
    const sky = ctx.createLinearGradient(0, 0, 0, cy*.62); sky.addColorStop(0, "#0d1530"); sky.addColorStop(1, "rgba(13,21,48,0)"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, cy*.62);
    ctx.fillStyle = "rgba(255,255,255,.8)"; for (let i=0;i<40;i++){ ctx.beginPath(); ctx.arc((i*73)%W, (i*29)%(cy*.4), (i%3)*.5 + .5, 0, 7); ctx.fill(); }
    ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, cy*.08); ctx.quadraticCurveTo(W/2, cy*.2, W, cy*.08); ctx.stroke();
    for (let i=0;i<12;i++){ const t = (i+.5)/12, x = t*W, y = cy*.08 + cy*.24*t*(1-t) + 4; ctx.fillStyle = "rgba(255,214,120,.9)"; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,214,120,.18)"; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#3a2a1c"; for (let k=0;k<W;k+=18) ctx.fillRect(k, cy - 34, 4, 34); ctx.fillRect(0, cy - 34, W, 4); }
  if (S.w === 8){ // からくり時計と歯車
    const r = Math.min(cy*.2, 54), x0 = W/2, y0 = cy*.26; ctx.fillStyle = "#5a3a1a"; ctx.beginPath(); ctx.arc(x0, y0, r + 6, 0, 7); ctx.fill(); ctx.fillStyle = "#f3e6c4"; ctx.beginPath(); ctx.arc(x0, y0, r, 0, 7); ctx.fill();
    ctx.fillStyle = "#5a3a1a"; for (let k=0;k<12;k++){ const a = k/12*Math.PI*2; ctx.beginPath(); ctx.arc(x0 + Math.cos(a)*r*.82, y0 + Math.sin(a)*r*.82, k%3 ? 1.5 : 3, 0, 7); ctx.fill(); }
    const gear = (gx, gy, gr, n) => { ctx.fillStyle = "rgba(201,150,46,.35)"; ctx.beginPath(); for (let k=0;k<n*2;k++){ const a = k/(n*2)*Math.PI*2, rr2 = k%2 ? gr : gr*.78; ctx.lineTo(gx + Math.cos(a)*rr2, gy + Math.sin(a)*rr2); } ctx.closePath(); ctx.fill(); ctx.fillStyle = room.wall[1]; ctx.beginPath(); ctx.arc(gx, gy, gr*.3, 0, 7); ctx.fill(); };
    gear(W*.12, cy*.62, 30, 10); gear(W*.88, cy*.18, 26, 9); gear(W*.82, cy*.62, 18, 8); }
  if (S.w === 9){ // 月と海と灯台
    ctx.fillStyle = "#14203f"; ctx.fillRect(0, 0, W, cy*.6); ctx.fillStyle = "#1d3a5f"; ctx.fillRect(0, cy*.42, W, cy*.18);
    ctx.fillStyle = "#f6eecb"; ctx.beginPath(); ctx.arc(W*.8, cy*.14, Math.min(22, cy*.08), 0, 7); ctx.fill(); ctx.fillStyle = "#14203f"; ctx.beginPath(); ctx.arc(W*.8 + 7, cy*.14 - 4, Math.min(20, cy*.075), 0, 7); ctx.fill();
    ctx.fillStyle = "#e9e2d0"; ctx.beginPath(); ctx.moveTo(W*.12, cy*.44); ctx.lineTo(W*.15, cy*.16); ctx.lineTo(W*.19, cy*.16); ctx.lineTo(W*.22, cy*.44); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#c0392b"; ctx.fillRect(W*.135, cy*.26, W*.07, cy*.04); ctx.fillStyle = "#f6d36b"; ctx.fillRect(W*.155, cy*.11, W*.03, cy*.05); }
  if (S.w === 6){ // 夜景の見える大きな窓
    const ww = Math.min(W*.56, 300), wx = W/2 - ww/2, wh = cy*.42; ctx.fillStyle = "#0e1630"; rr(ctx, wx, 12, ww, wh, 8); ctx.fill();
    for (let k=0;k<9;k++){ const bw2 = ww/9, bh2 = wh*(.3 + ((k*37)%50)/100); ctx.fillStyle = "#1c2748"; ctx.fillRect(wx + k*bw2, 12 + wh - bh2, bw2 - 2, bh2);
      ctx.fillStyle = "rgba(255,214,120,.7)"; for (let j=0;j<6;j++) if ((k*7 + j*3) % 4 === 0) ctx.fillRect(wx + k*bw2 + 3 + (j%2)*(bw2/2 - 2), 12 + wh - bh2 + 5 + Math.floor(j/2)*8, 3, 4); }
    ctx.strokeStyle = "#c9a45a"; ctx.lineWidth = 3; rr(ctx, wx, 12, ww, wh, 8); ctx.stroke(); }
  if (S.w === 5){ // 丸窓と海
    for (let i=0;i<2;i++){ const x = W*(.3 + .4*i), y = 14 + cy*.2, r = Math.min(cy*.17, 46);
      ctx.fillStyle = "#1f4f6e"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.fillStyle = "#2f7fa0"; ctx.beginPath(); ctx.arc(x, y, r, .1, Math.PI - .1); ctx.fill();
      ctx.strokeStyle = "#b08a52"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); } }
  if (room.id === "neon"){ ctx.strokeStyle = "rgba(233,79,208,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(16, 20); ctx.lineTo(W-16, 20); ctx.stroke(); ctx.strokeStyle = "rgba(79,216,233,.3)"; ctx.beginPath(); ctx.moveTo(16, 28); ctx.lineTo(W-16, 28); ctx.stroke(); }
  if (room.id === "wafu"){ ctx.fillStyle = "rgba(30,50,90,.55)"; for (let i=0;i<5;i++){ const w = W/5; rr(ctx, i*w + 3, -10, w - 6, 46, 6); ctx.fill(); } }
  // カウンター
  ctx.fillStyle = room.counter; ctx.fillRect(0, cy, W, 18); ctx.fillStyle = room.ctop; ctx.fillRect(0, cy, W, 4);
  ctx.fillStyle = room.under; ctx.fillRect(0, cy + 18, W, H - cy - 18); ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, cy + 18, W, 8);
  lay.shelves.forEach(s => { ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(W/2 - s.half, s.y + 2, s.half*2, sh.w*.3);
    ctx.fillStyle = room.shelf; rr(ctx, W/2 - s.half, s.y - 2, s.half*2, sh.w*.2, 4); ctx.fill(); ctx.fillStyle = room.stop; ctx.fillRect(W/2 - s.half + 4, s.y - 2, s.half*2 - 8, 2); });
  if (room.id === "space"){ ctx.fillStyle = "rgba(255,255,255,.8)"; for (let i=0;i<60;i++){ const x = (i*97) % W, y = (i*61) % Math.max(10, cy - 10); ctx.beginPath(); ctx.arc(x, y, (i%3)*.5 + .6, 0, 7); ctx.fill(); } }
  if (room.id === "palace"){ ctx.fillStyle = "rgba(243,215,122,.25)"; for (let i=0;i<4;i++){ const x = W*(.125 + .25*i); ctx.beginPath(); ctx.arc(x, 26, 14, 0, 7); ctx.fill(); ctx.fillRect(x - 1, 0, 2, 14); } }
  evDecor(ctx, W, cy);
  drawFine(ctx, upg("price"), cy);
  seats.forEach((st, k) => { const p = lay.seatPos[k], size = Math.min(lay.seatW*.42, 64), headY = cy - size*.62; drawChair(ctx, p.x, headY, size, cy, upg("pat")); });
  if (has("branch")) drawBranchSign(ctx, cy);
  return bg;
}
// 灯台の光：左右にゆっくり往復する
const beamX = () => W/2 + Math.sin((T - darkT)/1100)*W*.42;
const litAt = x => Math.abs(x - beamX()) < (lay ? lay.slot*.7 : 40);
// 少しずつしか動かない飾りは、別の絵に描いておいて 0.11秒ごとに描き直す
function slowLayer(name, need, paint, y0 = 0, y1 = lay.counterY + 24){
  if (!need()) return;
  const now = performance.now(), L = lay.slow || (lay.slow = {});
  let e = L[name];
  if (!e){ const cv2 = document.createElement("canvas"); cv2.width = Math.ceil(W*dpr); cv2.height = Math.ceil((y1 - y0)*dpr); e = L[name] = {cv: cv2, x: cv2.getContext("2d"), t: -1e9}; }
  if (now - e.t > 110){ e.t = now; e.x.setTransform(1,0,0,1,0,0); e.x.clearRect(0, 0, e.cv.width, e.cv.height); e.x.setTransform(dpr,0,0,dpr,0,-y0*dpr); paint(e.x); }
  ctx.drawImage(e.cv, 0, y0, e.cv.width/dpr, e.cv.height/dpr);
}
// 注文の吹き出しは、中身が変わったときだけ描き直す（重さ対策）
const BCACHE = new Map();
function bubbleSprite(s, bw, bh, cell, n){
  const key = [bw|0, bh|0, cell|0, s.cock ? s.cock.join("") : s.order.join(""), s.got.map(g => g ? 1 : 0).join(""), s.rush ? 1 : 0, s.vip ? 1 : 0, s.critic ? 1 : 0, s.regular ? 1 : 0, s.sig ? 1 : 0, s.favHit ? 1 : 0, s.pair ? 1 : 0, save.cb ? 1 : 0, drinkTheme].join("|");
  let sp = BCACHE.get(key);
  if (!sp){
    if (BCACHE.size > 120) BCACHE.clear();
    const w = bw + 24, h = bh + 30, cv2 = document.createElement("canvas"); cv2.width = Math.ceil(w*VRES); cv2.height = Math.ceil(h*VRES);
    const c = cv2.getContext("2d"); c.setTransform(VRES, 0, 0, VRES, 0, 0);
    const bx = 12, by = 14, px = bx + bw/2;
    c.fillStyle = "#f6ead6"; rr(c, bx, by, bw, bh, 14); c.fill();
    if (s.rush){ c.strokeStyle = "#d9473a"; c.lineWidth = 3; rr(c, bx, by, bw, bh, 14); c.stroke();
    c.fillStyle = "#d9473a"; rr(c, bx + bw - 34, by - 9, 36, 18, 9); c.fill(); c.fillStyle = "#fff"; c.font = `900 11px "Zen Kaku Gothic New",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("急ぎ", bx + bw - 16, by); }
    const tag = (txt, col, fg) => { c.font = `900 11px "Zen Kaku Gothic New",sans-serif`; const tw = c.measureText(txt).width + 14; c.strokeStyle = col; c.lineWidth = 3; rr(c, bx, by, bw, bh, 14); c.stroke();
    c.fillStyle = col; rr(c, bx + bw - tw + 2, by - 9, tw, 18, 9); c.fill(); c.fillStyle = fg; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, bx + bw - tw/2 + 2, by); };
    if (s.critic) tag("評論家", "#8e5cc4", "#fff");
    if (s.cock) tag("カクテル", "#d6418f", "#fff");
    if (s.regular) tag("常連さん", "#3f8f4a", "#fff");
    if (s.sig) tag("看板メニュー", "#b5562a", "#fff");
    if (s.favHit && !s.sig){ c.fillStyle = "#ef6b8a"; c.beginPath(); c.arc(bx + 8, by, 10, 0, 7); c.fill(); c.fillStyle = "#fff"; heart(c, bx + 8, by + 1, 5); }
    if (s.pair) tag("ペア", "#ef6b8a", "#fff");
    if (s.vip){ c.strokeStyle = "#e0a020"; c.lineWidth = 3; rr(c, bx, by, bw, bh, 14); c.stroke();
    c.fillStyle = "#e0a020"; rr(c, bx + bw - 40, by - 9, 42, 18, 9); c.fill(); c.fillStyle = "#2a1a0c"; c.font = `900 11px "Zen Kaku Gothic New",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("団体", bx + bw - 19, by); }
    c.fillStyle = "#f6ead6";
    c.beginPath(); c.moveTo(px - 7, by + bh - 1); c.lineTo(px, by + bh + 8); c.lineTo(px + 7, by + bh - 1); c.fill();
    if (s.cock) drawCock(c, px, by + bh - 13, bh*.66, s.cock, false);
    else s.order.forEach((cc, j) => { const mx = px + (j - (n-1)/2)*cell; miniBottle(c, mx, by + bh - 14, (bh - 13)*.62, COLORS[cc], s.got[j], cc);
      // 飲み物の名前（小さく、瓶の上に）
      const nm = drinkOf(cc).short, fs = Math.min(10.5, (bh - 13)*.18); c.font = `900 ${fs}px "Zen Kaku Gothic New",sans-serif`; const tw = c.measureText(nm).width, sc = Math.min(1, (cell - 3)/tw);
      c.save(); c.translate(mx, by + 16); c.scale(sc, 1); c.fillStyle = s.got[j] ? "rgba(90,60,40,.4)" : "#5a3a24"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(nm, 0, 0); c.restore(); });
    sp = {cv: cv2, w, h}; BCACHE.set(key, sp);
  }
  return sp;
}
