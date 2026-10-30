// ご注文は満タンで：毎月のイベント（日付で自動に始まって終わる。毎年くり返す）
// 期間中は、お店とマップが季節の飾りになり、お客さんが仮装して来て、イベントだけのキャラクターもときどき来る。
// マップの「イベントのお店」では、そのイベントだけのしかけの5ステージが遊べる。印をためると限定の小物と称号、5ステージ全部★3で限定インテリア
// gm：イベントのお店だけのしかけ / luck：ラッキーカラー（COLORS の番号） / chara：イベントのキャラクター / w：お店の背景に使うワールド
const EVENTS = [
  {id: "newyear", name: "お正月", ic: "🎍", mark: "福", from: [12, 30], to: [1, 31], items: ["sensu", "kagami"], title: "福を注ぐ店主", col: ["#e8483e", "#6a2a1a"], w: 3,
   shop: "新春の福茶屋", gm: "fuku", gmName: "福袋", gmDesc: "仕入れると、ときどき<b>福袋</b>が当たって、いきなり満タン瓶になります。", luck: 0,
   chara: {name: "福とら", line: "あけまして、満タンでございます！", fur: "#f0a53a", ear: "tiger", cheek: "#f3b8a0", wear: "#d33a32", acc: "kagami"},
   decor: {id: "ev_newyear", slot: "counter", name: "門松", emoji: "🎍"}},
  {id: "valentine", name: "バレンタイン", ic: "💝", mark: "ハート", from: [2, 1], to: [2, 29], items: ["choco", "lovebox"], title: "甘い夜の店主", col: ["#ef6b8a", "#4a1f2c"], w: 6,
   shop: "ショコラのバー", gm: "pair", gmName: "ペアの注文", gmDesc: "<b>同じ色を2本</b>そろえるペアの注文が来ます。代金1.6倍。", luck: 0,
   chara: {name: "ショコラうさぎ", line: "とびきり甘いのをお願い♡", fur: "#8a5a3a", ear: "rabbit", cheek: "#f4b3c2", wear: "#ef6b8a", acc: "ribbon"},
   decor: {id: "ev_valentine", slot: "counter", name: "バラの花束", emoji: "💐"}},
  {id: "hina", name: "ひなまつり", ic: "🎎", mark: "ひなあられ", from: [3, 1], to: [3, 19], items: ["nanohana", "bonbori"], title: "ひなの宵の店主", col: ["#f7a8c4", "#3a6a3a"], w: 2,
   shop: "ひなだんカフェ", gm: "hina", gmName: "ひなカクテル", gmDesc: "<b>桃・黄・緑</b>の3色を重ねる、ひしもちのカクテルの注文が来ます。", luck: 4,
   chara: {name: "おひなさま", line: "今日はお祝いですのよ", fur: "#f6eedd", ear: "cat", cheek: "#f4b3c2", wear: "#c0392b", acc: "crown"},
   decor: {id: "ev_hina", slot: "wall", name: "ひな人形", emoji: "🎎"}},
  {id: "hanami", name: "お花見", ic: "🌸", mark: "花びら", from: [3, 20], to: [4, 30], items: ["sakura", "dango"], title: "花より満タン", col: ["#f7a8c4", "#7a3a52"], w: 7,
   shop: "夜桜テラス", gm: "hide", gmName: "花びらの目かくし", gmDesc: "花びらが舞いこんで、瓶の下のほうの色が<b>？</b>で隠れています。", luck: 4,
   chara: {name: "さくらねこ", line: "夜桜で一杯いかが？", fur: "#f7c4d4", ear: "cat", cheek: "#f39aa8", wear: "#7a3a52", acc: "sakura"},
   decor: {id: "ev_hanami", slot: "ceil", name: "桜の枝", emoji: "🌸"}},
  {id: "kodomo", name: "こどもの日", ic: "🎏", mark: "こいのぼり", from: [5, 1], to: [5, 31], items: ["koi", "kashiwa"], title: "こいのぼり店長", col: ["#3a6ee8", "#1a2a4a"], w: 3,
   shop: "こいのぼり食堂", gm: "koi", gmName: "こいのぼりラッシュ", gmDesc: "<b>1本だけ</b>の短い注文のお客さんが、次々とたくさん来ます。", luck: 2,
   chara: {name: "かぶとパンダ", line: "せいくらべしよう！", fur: "#f4f1ea", ear: "panda", cheek: "#f4b3c2", wear: "#3a6ee8", acc: "koi"},
   decor: {id: "ev_kodomo", slot: "ceil", name: "こいのぼり", emoji: "🎏"}},
  {id: "tsuyu", name: "梅雨", ic: "☔", mark: "あじさい", from: [6, 1], to: [6, 30], items: ["umbrella", "snail"], title: "雨の日の常連", col: ["#7a8ee8", "#1f2a4a"], w: 2,
   shop: "あじさい喫茶", gm: "rain", gmName: "雨もり", gmDesc: "ときどき<b>雨もり</b>で、どれかの瓶の上に1杯、色が降ってきます。", luck: 2,
   chara: {name: "あまがえるさん", line: "いい雨だねえ", fur: "#8fd17a", ear: "frog", cheek: "#f4b3c2", wear: "#f6c945", acc: "umbrella"},
   decor: {id: "ev_tsuyu", slot: "wall", name: "虹の飾り", emoji: "🌈"}},
  {id: "tanabata", name: "七夕", ic: "🎋", mark: "星", from: [7, 1], to: [7, 31], items: ["star2", "tanzaku"], title: "星に願う店主", col: ["#f6c945", "#14203f"], w: 7,
   shop: "天の川テラス", gm: "star", gmName: "流れ星", gmDesc: "<b>流れ星</b>（ハッピーアワー）が何度も来ます。来ているあいだは代金1.5倍。", luck: 1,
   chara: {name: "おりひめひつじ", line: "願いごと、書いた？", fur: "#f6eedd", ear: "sheep", cheek: "#f4b3c2", wear: "#9b5de5", acc: "star2"},
   decor: {id: "ev_tanabata", slot: "ceil", name: "七夕かざり", emoji: "🎋"}},
  {id: "natsu", name: "夏祭り", ic: "🎆", mark: "花火", from: [8, 1], to: [8, 31], items: ["furin", "kakigori"], title: "夏祭りの屋台主", col: ["#f4842d", "#1a1030"], w: 3,
   shop: "花火の屋台", gm: "fire", gmName: "花火の連続ボーナス", gmDesc: "続けて満足させると<b>花火</b>が上がり、連続ボーナスが<b>2倍</b>になります。", luck: 6,
   chara: {name: "はっぴのいぬ", line: "たーまやー！", fur: "#c7c2b8", ear: "dog", cheek: "#e7b0a0", wear: "#3a6ee8", acc: "hachi"},
   decor: {id: "ev_natsu", slot: "ceil", name: "ちょうちん", emoji: "🏮"}},
  {id: "tsukimi", name: "お月見", ic: "🌕", mark: "おだんご", from: [9, 1], to: [9, 30], items: ["moon", "susuki"], title: "月見の店主", col: ["#f6e08a", "#14203f"], w: 9,
   shop: "月見の縁側", gm: "dango", gmName: "お月見カクテル", gmDesc: "3色を重ねる<b>お月見カクテル</b>の注文が来ます。", luck: 1,
   chara: {name: "月のうさぎ", line: "おだんご、ひとつどうぞ", fur: "#f2efe8", ear: "rabbit", cheek: "#f4b3c2", wear: "#3a2a6a", acc: "halo"},
   decor: {id: "ev_tsukimi", slot: "wall", name: "まんまるお月さま", emoji: "🌕"}},
  {id: "halloween", name: "ハロウィン", ic: "🎃", mark: "かぼちゃ", from: [10, 1], to: [10, 31], items: ["pumpkin", "witch"], title: "かぼちゃの店主", col: ["#f08a24", "#3a2350"], w: 8,
   shop: "おばけ屋敷のバー", gm: "ghost", gmName: "おばけのいたずら", gmDesc: "ときどき<b>おばけ</b>がいたずらして、2本の瓶の中身が入れ替わります（3秒前に予告）。", luck: 2,
   chara: {name: "おばけのモモ", line: "ばあっ！ …なんてね", fur: "#f4f4fa", ear: "ghost", cheek: "#c9b8f0", ghost: true, acc: "witch"},
   decor: {id: "ev_halloween", slot: "counter", name: "ジャック・オ・ランタン", emoji: "🎃"}},
  {id: "harvest", name: "収穫祭", ic: "🍁", mark: "どんぐり", from: [11, 1], to: [11, 30], items: ["momiji", "kuri"], title: "実りの秋の店主", col: ["#d9643a", "#3a2214"], w: 4,
   shop: "もみじの山小屋", gm: "harvest", gmName: "大盛り", gmDesc: "満タン瓶4本の<b>団体さん</b>がたくさん来ます。代金2倍。", luck: 0,
   chara: {name: "くりきつね", line: "秋の実り、もってきたよ", fur: "#c8743a", ear: "fox", cheek: "#f3b8a0", wear: "#6a4a2a", acc: "kuri"},
   decor: {id: "ev_harvest", slot: "counter", name: "ぶどうのかご", emoji: "🍇"}},
  {id: "xmas", name: "クリスマス", ic: "🎄", mark: "ベル", from: [12, 1], to: [12, 25], items: ["antler", "santa"], title: "聖夜のバーテンダー", col: ["#d33a32", "#1f5a3a"], w: 4,
   shop: "雪の聖夜のバー", gm: "gift", gmName: "サンタのプレゼント", gmDesc: "包み紙で色が<b>？</b>で隠れていますが、ときどき<b>サンタ</b>が空き瓶に満タン瓶を届けてくれます。", luck: 0,
   chara: {name: "サンタくま", line: "ホッホー！ 良い子にプレゼントだ", fur: "#8a6a55", ear: "bear", cheek: "#d79a86", wear: "#d33a32", acc: "santa", beard: true},
   decor: {id: "ev_xmas", slot: "counter", name: "プレゼントの箱", emoji: "🎁"}}
];
const EV_NEED = [8, 24];               // この数の印で1つめ・2つめの小物（2つめで称号も）
const EV_N = 5;                        // イベントのお店のステージ数
// 絵文字で描く小物
const EMACC = {choco: "🍫", lovebox: "💝", nanohana: "🌼", bonbori: "🏮", koi: "🎏", kashiwa: "🍃", umbrella: "☂️", snail: "🐌", star2: "🌟", tanzaku: "🎋", furin: "🎐", kakigori: "🍧", moon: "🌕", susuki: "🌾", momiji: "🍁", kuri: "🌰"};
const EMACC_TOP = {umbrella: 1, kakigori: 1, moon: 1};
function emAcc(c, acc, s){ const em = EMACC[acc]; if (!em) return false;
  c.font = `${s*(EMACC_TOP[acc] ? .62 : .42)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
  if (EMACC_TOP[acc]) c.fillText(em, 0, -s*.62); else c.fillText(em, s*.34, -s*.38); return true; }
// 限定インテリアを登録（ショップのインテリアの棚に並ぶ）
EVENTS.forEach(e => { if (!DECOR.some(d => d.id === e.decor.id)) DECOR.push(Object.assign({how: `イベント「${e.name}」のお店を全部★3でもらえる`}, e.decor)); });
let evMemo = null, evMemoT = -1;
function evNow(){
  const m = Math.floor(Date.now()/60000) + (window.__evForce || ""); if (m === evMemoT) return evMemo; evMemoT = m; return (evMemo = evCalc());
}
function evCalc(){
  const t = todayJST(), md = t.m*100 + t.d;
  const e = EVENTS.find(x => x.id === window.__evForce) || EVENTS.find(x => { const a = x.from[0]*100 + x.from[1], b = x.to[0]*100 + x.to[1]; return a <= b ? md >= a && md <= b : md >= a || md <= b; });
  if (!e) return null;
  const y = e.from[0] > e.to[0] && t.m <= e.to[0] ? t.y - 1 : t.y;  // 年をまたぐイベントは始まった年で数える
  return Object.assign({key: `${e.id}-${y}`, end: `${e.to[0]}/${e.to[1]}`, year: y}, e);
}
function evState(e){ if (!save.ev || save.ev.key !== e.key) save.ev = {key: e.key, pts: 0}; return save.ev; }
function evRec(e){ const r = save.evs || (save.evs = {}); return r[e.key] || (r[e.key] = {st: {}, best: {}}); }
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
  const st = evState(e), done = st.pts >= EV_NEED[1], next = EV_NEED.find(x => x > st.pts) || EV_NEED[1], rec = evRec(e), stars = Object.values(rec.st).reduce((a, b) => a + b, 0);
  el.style.setProperty("--ev1", e.col[0]); el.style.setProperty("--ev2", e.col[1]);
  el.innerHTML = `<span class="evic" aria-hidden="true">${e.ic}</span><span class="evt"><b>${e.name} 開催中！</b><small>${e.end}まで　イベントのお店「${e.shop}」がオープン</small>` +
    `<span class="evbar"><i style="width:${Math.min(100, st.pts/EV_NEED[1]*100)}%"></i></span><small>${e.mark} ${st.pts}${done ? "　ごほうび全部もらいました！" : ` / ${next}`}　お店の★ ${stars} / ${EV_N*3}</small></span><span class="evgo">お店へ ›</span>`;
  el.onclick = openEvShop; el.classList.remove("hidden");
}
/* ---------- イベントのお店（5ステージ） ---------- */
const evId = n => "ev" + n;
const evOpen = n => { const e = evNow(); if (!e) return false; if (n === 1) return true; return (evRec(e).st[n-1] || 0) >= 1; };
function evStageDef(n){
  const e = evNow() || EVENTS.find(x => x.id === "halloween"), colors = [4, 5, 5, 6, 6][n-1];
  const d = {id: `${e.ic}${n}`, mode: "event", ev: e.id, evg: e.gm, n, w: e.w, colors, ord: n <= 2 ? [1,2] : [1,3], seats: 3, guests: 9 + n, pat: 60, shelf: colors, spare: 2, goal: [3800, 4500, 5200, 6000, 6700][n-1]};
  if (e.gm === "hide" || e.gm === "gift"){ d.hide = true; d.pat += 4; d.goal -= 200; }
  if (e.gm === "hina"){ d.colors = d.shelf = Math.max(5, colors); d.cocktail = .4; d.cockLen = [3, 3]; d.pat += 4; }
  if (e.gm === "dango"){ d.cocktail = .4; d.cockLen = [3, 3]; d.pat += 4; }
  if (e.gm === "koi"){ d.ord = [1, 1]; d.rush = .3; d.guests += 5; d.pat -= 6; }
  if (e.gm === "harvest"){ d.vip = .35; d.pat += 4; d.goal += 600; }
  if (e.gm === "pair"){ d.goal += 300; }
  if (e.gm === "fire" || e.gm === "star"){ d.goal += 500; }
  if (e.gm === "fuku"){ d.goal += 200; }
  if (e.gm === "rain" || e.gm === "ghost"){ d.pat += 4; d.goal -= 200; }
  return d;
}
let evcServed = 0, luckyN = 0, evT = Infinity, evWarn = null;
function evStart(){
  evcServed = 0; luckyN = 0; evWarn = null; evT = Infinity;
  if (!S || S.mode !== "event") return;
  if (S.evg === "rain") evT = 15000; if (S.evg === "ghost") evT = 22000; if (S.evg === "gift") evT = 26000;
  if (S.evg === "star"){ hhT = 20000; hhOn = false; }
}
// 毎コマ：イベントのしかけ
function evTick(){
  if (!S || S.mode !== "event" || !lay) return;
  if (S.evg === "star" && T > hhT + HH_LEN + 14000) hhT = T + 3000;
  if (T < evT) return;
  const ok = i => { const b = bottles[i]; return b && !b.glass && !b.keg && !b.corked && !b.ice && b.lock == null && !busy.has(i) && sel !== i; };
  const idx = bottles.map((b, i) => i);
  if (S.evg === "rain"){
    const c = idx.filter(i => ok(i) && bottles[i].units.length && bottles[i].units.length < CAP);
    if (c.length){ const i = c[Math.floor(Math.random()*c.length)], col = pick(palette()); bottles[i].units.push({c: col}); waveT[i] = T; undoSnap = null;
      floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, `雨もり！ ${CNAME[col]}が1杯`, "#9ec4f0", .8); play("pour", {gain:.25}); if (isFull(bottles[i])) cork(i); }
    evT = T + 14000; return;
  }
  if (S.evg === "ghost"){
    if (!evWarn){ const c = idx.filter(i => ok(i) && bottles[i].units.length); if (c.length < 2){ evT = T + 5000; return; }
      const a = c.splice(Math.floor(Math.random()*c.length), 1)[0], b = c[Math.floor(Math.random()*c.length)]; evWarn = {a, b, t0: T};
      floatText(W/2, lay.counterY + 40, "おばけがいたずらしそう…", "#c9b8f0", 1); play("reveal", {gain:.3, rate:.7}); evT = T + 3000; return; }
    const {a, b} = evWarn, hit = i => { const o = bottles[i]; return o && !o.glass && !o.corked && !o.ice && o.lock == null; };
    if ((busy.has(a) || busy.has(b)) && T - evWarn.t0 < 7000) return; evWarn = null;
    if (hit(a) && hit(b) && !busy.has(a) && !busy.has(b)){ gimHit(a); gimHit(b); const t = bottles[a].units; bottles[a].units = bottles[b].units; bottles[b].units = t; waveT[a] = waveT[b] = T; undoSnap = null;
      floatText(W/2, lay.counterY + 40, "ばあっ！ 中身が入れ替わった", "#c9b8f0", 1.05); play("kira", {gain:.4, rate:.8});
      [a, b].forEach(i => { for (let k=0;k<10;k++) parts.push({x: lay.pos[i].x + R(-lay.sh.w*.4, lay.sh.w*.4), y: lay.pos[i].y + R(-lay.sh.H*.3, lay.sh.H*.3), vx: R(-1,1), vy: R(-1.4,-.2), t0: T, life: R(500,900), r: R(1.5,3), ice: true}); }); }
    evT = T + 24000; return;
  }
  if (S.evg === "gift"){
    const i = emptyIdx(), need = wantedNow();
    if (i >= 0 && need.length){ const col = need[0]; bottles[i].units = Array.from({length: CAP}, () => ({c: col})); cork(i); waveT[i] = T; undoSnap = null;
      floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.7, "サンタからのプレゼント！", "#ffd56b", .9); play("bonus", {gain:.5}); evT = T + 30000; }
    else evT = T + 5000;
  }
}
// 仕入れたとき：福袋
function evOnSupply(i){
  if (!S || S.evg !== "fuku" || Math.random() >= .18) return;
  const need = wantedNow(), col = need.length ? pick(need) : pick(palette());
  bottles[i].units = Array.from({length: CAP}, () => ({c: col})); cork(i);
  floatText(lay.pos[i].x, lay.pos[i].y - lay.sh.H*.75, "福袋！ 大当たり", "#ffd56b", .95); play("bonus", {gain:.5});
}
// お客さんが来たとき：イベントのキャラクター・ペアの注文
function evOnGuest(s, r){
  s.evc = false; s.pair = false; const e = evNow();
  if (!e || S.mode === "prep" || (typeof stg === "number" && stg < 1)) return;
  if (!s.cock && !s.vip && !s.sig && r < (S.mode === "event" ? .15 : .05)){ s.evc = true; s.pat *= 1.3; }
  if (S.evg === "pair" && !s.cock && !s.vip && !s.sig && !s.evc && !s.resv && Math.random() < .3){ const c = s.order[0]; s.order = [c, c]; s.got = [false, false]; s.res = [false, false]; s.pair = true; s.favHit = c === FAVC[s.g]; }
}
function evArrive(s, k){ if (!s.evc) return; const e = evNow(); if (!e) return; const p = lay.seatPos[k]; floatText(p.x, lay.counterY - 150, `${e.chara.name}「${e.chara.line}」`, e.col[0], .8, 300); play("kira", {gain:.35}); }
function evPay(s){ const e = evNow(); let m = 1;
  if (s.evc && e){ m *= 2; evcServed++; const z = save.evMet || (save.evMet = {}); z[e.id] = (z[e.id] || 0) + 1; }
  if (s.pair) m *= 1.6;
  if (S.mode === "event" && e){ const n = s.order.filter(c => c === e.luck).length; if (n) luckyN += n; }
  return m; }
// HUD・結果に出す今のイベント印（ステージで手に入る分）
const evMarksNow = clear => (S.mode === "event" ? (clear ? 2 : 0) + Math.floor(luckyN/2) : 0) + evcServed;
function endEventStage(){
  ended = true; running = false; sel = -1;
  const e = evNow() || EVENTS.find(x => x.id === S.ev), rec = evRec(e), n = S.n, clear = money >= S.goal;
  const st = money >= S.goal*STAR3 ? 3 : money >= S.goal*STAR2 ? 2 : clear ? 1 : 0, rankBefore = rankOf(save.total), pf = profitOf();
  save.wallet += pf.profit; save.total += money;
  const rankAfter = rankOf(save.total); let rankGift = 0; for (let r = rankBefore + 1; r <= rankAfter; r++) rankGift += rankReward(r); save.wallet += rankGift; claim("rank", rankAfter);
  save.stats.served += servedN; save.stats.bottles += bottlesOut; save.stats.maxCombo = Math.max(save.stats.maxCombo, maxCombo); countDay();
  const prevBest = rec.best[n] || 0, newBest = money > prevBest && servedN > 0; if (newBest) rec.best[n] = money; if (st > (rec.st[n] || 0)) rec.st[n] = st;
  let decorGot = false; if ([1,2,3,4,5].every(k => (rec.st[k] || 0) >= 3) && !save.decor.owned.includes(e.decor.id)){ save.decor.owned.push(e.decor.id); decorGot = true; }
  const newTr = checkTrophies(true); persist();
  $("resH").textContent = clear ? `${e.shop} 目標達成！` : "閉店… 目標まであと少し";
  $("resMoney").textContent = yen(money);
  $("resGoal").innerHTML = `目標 ${yen(S.goal)}` + (clear ? "" : `（あと ${yen(S.goal - money)}）`) + (newBest ? `<span class="newbest">ベスト更新</span>` : `<br>ベスト ${yen(prevBest)}`);
  $("resStars").classList.remove("hidden"); $("resStars").innerHTML = [0,1,2].map(k => `<span class="${k < st ? "on" : ""}">★</span>`).join("");
  $("resList").innerHTML = [["満足したお客さん", `${servedN}人`], [`${e.chara.name}`, `${evcServed}人`], ["ラッキーカラー", `${CNAME[e.luck]} ${luckyN}本`], ["最高連続", `${maxCombo}連続`], ["帰ってしまったお客さん", `${missed}人`]]
    .map(([a,b]) => `<li><span>${a}</span><b>${b}</b></li>`).join("");
  let earned = profitHTML(pf);
  if (rankAfter > rankBefore) earned += `<br>ランクアップ！ <b>ランク${rankAfter}</b>（ごほうび +${yen(rankGift)}）`;
  if (newTr.length) earned += `<br>トロフィー：<b>${newTr.map(t => t.name).join("、")}</b>`;
  earned += evAward(evMarksNow(clear));
  if (decorGot) earned += `<br>5ステージ全部★3！ 限定インテリア <b>「${e.decor.name}」</b>（ショップのインテリアで飾れます）`;
  $("resEarned").innerHTML = earned + `</div>`;
  const nx = n < EV_N && (rec.st[n] || 0) >= 1 ? n + 1 : null;
  $("nextBtn").classList.remove("hidden"); $("nextBtn").disabled = !nx; $("nextBtn").textContent = nx ? `${e.ic}${nx} へ` : n < EV_N ? "クリアで次へ" : "イベントのお店へ";
  if (n === EV_N){ $("nextBtn").disabled = false; }
  setTimeout(() => { $("result").classList.remove("hidden"); if (clear){ play("fanfare", {gain:.6}); play("clap", {gain:.45, delay:.3}); } else play("wrong", {gain:.3}); }, 700);
}
function evNext(){ const n = S.n; $("result").classList.add("hidden"); if (n < EV_N && evOpen(n + 1)) showIntro(evId(n + 1)); else openEvShop(); }
function evIntro(){
  const e = evNow() || EVENTS.find(x => x.id === S.ev), rec = evRec(e), n = S.n;
  $("introH").textContent = `${e.ic} ${e.shop} ${n}`;
  $("introGoal").textContent = `目標 ${yen(S.goal)}・お客さん ${S.guests}人・${S.colors}色`;
  $("introRules").innerHTML = `<b>${e.name}だけのしかけ「${e.gmName}」</b><br>${e.gmDesc}<br>` +
    `・<b>ラッキーカラーは${CNAME[e.luck]}</b>。${CNAME[e.luck]}の注文を2本出すごとに${e.mark}が1つ<br>・<b>${e.chara.name}</b>がときどき来ます。代金2倍で、満足させると${e.mark}が1つ<br>・クリアで${e.mark}2つ。5ステージ全部★3で限定インテリア「${e.decor.name}」`;
  $("introRec").innerHTML = recBox(`${e.shop} ${n} の記録`, rec.best[n] ? [["ベスト", yen(rec.best[n]), 1], ["星", "★".repeat(rec.st[n] || 0) + "☆".repeat(3 - (rec.st[n] || 0))]] : [], "まだ記録はありません");
  $("intro").classList.remove("hidden"); bgm("w" + S.w);
}
function openEvShop(){
  const e = evNow(); if (!e){ showMap(); return; } audio();
  ["map", "play", "result", "intro", "prepSel"].forEach(id => $(id).classList.add("hidden"));
  const rec = evRec(e), st = evState(e), box = $("evStages");
  $("evH").textContent = `${e.ic} ${e.shop}`; $("evSub").textContent = `${e.name}（〜${e.end}）`;
  $("evInfo").innerHTML = `<b>しかけ「${e.gmName}」</b>　${e.gmDesc}<br><b>ラッキーカラー</b>　<span class="sigdot" style="background:${COLORS[e.luck]};width:14px;height:14px;vertical-align:-2px"></span> ${CNAME[e.luck]}` +
    `<br><b>${e.mark}</b> ${st.pts}　${EV_NEED[0]}つで「${evAccName(e.items[0])}」・${EV_NEED[1]}つで「${evAccName(e.items[1])}」と称号「${e.title}」<br><b>限定インテリア</b>「${e.decor.name}」${save.decor.owned.includes(e.decor.id) ? "（もらいました）" : "：5ステージ全部★3"}`;
  { const c = $("evChara"), x = c.getContext("2d"); x.clearRect(0, 0, 150, 150); evDrawChara(x, e, 75, 82, 50, "happy", 600); }
  $("evCharaT").innerHTML = `<b>${e.chara.name}</b><small>「${e.chara.line}」</small><small>${e.name}のあいだ、どのお店にもときどき来ます。代金2倍</small>`;
  box.innerHTML = "";
  for (let n = 1; n <= EV_N; n++){ const open = evOpen(n), s2 = rec.st[n] || 0, b = document.createElement("button");
    b.className = "sbtn" + (open ? "" : " locked"); b.innerHTML = `<span class="n">${n}</span><span class="s">${open ? "★".repeat(s2) + "☆".repeat(3 - s2) : "🔒"}</span><span class="b">${open && rec.best[n] ? yen(rec.best[n]) : ""}</span>`;
    b.onclick = () => { audio(); if (!open){ play("bad", {gain:.3}); return; } $("evShop").classList.add("hidden"); showIntro(evId(n)); }; box.appendChild(b); }
  $("evShop").classList.remove("hidden"); bgm("w" + e.w);
}
/* ---------- イベントのキャラクターの描き方 ---------- */
function evDrawChara(c, e, x, y, s, mood, t){
  const ch = e.chara, G = {fur: ch.fur, ear: ch.ear, cheek: ch.cheek, wear: ch.wear || "#555"};
  if (ch.ghost){ c.save(); c.translate(x, y); c.fillStyle = ch.fur; c.globalAlpha = .95; c.beginPath(); c.moveTo(-s*.5, s*.2); c.lineTo(-s*.5, s*1.0);
    for (let k=0;k<5;k++){ const x0 = -s*.5 + k*s*.2, wob = Math.sin(t/220 + k)*s*.05; c.quadraticCurveTo(x0 + s*.1, s*1.18 + wob, x0 + s*.2, s*1.0); } c.lineTo(s*.5, s*.2); c.closePath(); c.fill(); c.restore(); }
  drawGuest(c, G, x, y, s, mood, t, !!ch.ghost, ch.wear);
  if (ch.beard){ c.save(); c.translate(x, y); c.fillStyle = "#fffaf0"; c.beginPath(); c.ellipse(0, s*.3, s*.34, s*.2, 0, 0, Math.PI); c.fill(); c.beginPath(); c.ellipse(-s*.12, s*.2, s*.14, s*.06, -.3, 0, 7); c.ellipse(s*.12, s*.2, s*.14, s*.06, .3, 0, 7); c.fill(); c.restore(); }
  if (ch.acc){ c.save(); c.translate(x, y); c.lineCap = "round"; c.lineJoin = "round"; accDraw(c, ch.acc, s, t); c.restore(); }
}
// お客さんの仮装（3人に1人くらい。評論家・常連さん・キャラクターはいつもの格好）
function evHat(s, k){ const e = evNow(); if (!e || s.critic || s.regular || s.evc) return null; return (s.g + k) % 3 === 0 ? e.items[(s.g + k) % 2] : null; }
function evGuestHat(c, s, k, x, y, size, t){ const h = evHat(s, k); if (!h) return; c.save(); c.translate(x, y); c.lineCap = "round"; c.lineJoin = "round"; accDraw(c, h, size, t); c.restore(); }
// 旗と、カウンターの両はしの絵文字（手で描いた飾りがないイベント用）
function evGeneric(c, w, cy, e){
  c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 8); c.quadraticCurveTo(w/2, 34, w, 8); c.stroke();
  const n = Math.max(7, Math.round(w/44)), cols = [e.col[0], "#fffaf0", e.col[1]];
  for (let i=0;i<n;i++){ const t = (i + .5)/n, x = t*w, y = 8 + 26*t*(1-t) + 2; c.fillStyle = cols[i % 3]; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x + 9, y); c.lineTo(x, y + 16); c.closePath(); c.fill(); }
  const sz = Math.min(30, w*.075); c.font = `${sz}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.textAlign = "center"; c.textBaseline = "bottom";
  c.fillText(e.decor.emoji, w*.06, cy + 2); c.fillText(e.ic, w*.94, cy + 2);
}
// 動かない飾り（背景に1回だけ描く）。cy = カウンターの高さ
function evDecor(c, w, cy){
  const e = evNow(); if (!e) return;
  if (!["halloween", "xmas", "newyear", "hanami"].includes(e.id)){ evGeneric(c, w, cy, e); return; }
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
  if (e.id === "tsuyu"){ c.strokeStyle = "rgba(160,190,240,.55)"; c.lineWidth = 1.2; c.beginPath(); for (let i=0;i<24;i++){ const x = (i*53 + t*.05) % w, y = (i*41 + t*.35) % cy; c.moveTo(x, y); c.lineTo(x - 2, y + 9); } c.stroke(); }
  if (e.id === "harvest"){ for (let i=0;i<10;i++){ const x = (i*89 + Math.sin(t/800 + i)*20 + t*.01) % w, y = (i*43 + t*.03*(1 + i%2)) % cy; c.save(); c.translate(x, y); c.rotate(t/600 + i); c.fillStyle = ["#d9643a", "#e0a020", "#b5562a"][i % 3]; c.beginPath(); c.ellipse(0, 0, 5, 3, 0, 0, 7); c.fill(); c.restore(); } }
  if (e.id === "tanabata" || e.id === "tsukimi"){ c.fillStyle = "rgba(255,240,170,.85)"; for (let i=0;i<12;i++){ const a = (Math.sin(t/500 + i*1.7) + 1)/2, x = (i*71) % w, y = (i*29) % (cy*.5); c.globalAlpha = .2 + a*.7; c.beginPath(); c.arc(x, y, 1 + a*1.6, 0, 7); c.fill(); } c.globalAlpha = 1; }
  if (e.id === "natsu"){ const k = Math.floor(t/1600), p = (t % 1600)/1600, x = w*(.2 + ((k*37) % 60)/100), y = cy*(.18 + ((k*13) % 20)/100); if (p < .7){ c.globalAlpha = 1 - p/.7; c.fillStyle = ["#ff5a4a", "#ffd56b", "#6ec3ff", "#f06aa8"][k % 4];
    for (let i=0;i<14;i++){ const a = i/14*Math.PI*2, r = p*cy*.18; c.beginPath(); c.arc(x + Math.cos(a)*r, y + Math.sin(a)*r, 2, 0, 7); c.fill(); } c.globalAlpha = 1; } }
  if (e.id === "valentine" || e.id === "hina"){ c.fillStyle = e.id === "hina" ? "rgba(247,168,196,.8)" : "rgba(239,107,138,.7)"; for (let i=0;i<8;i++){ const x = (i*97 + Math.sin(t/900 + i)*16) % w, y = cy - ((i*53 + t*.025) % cy); heart(c, x, y, 4); } }
}

$("evBack").onclick = () => { $("evShop").classList.add("hidden"); showMap(); };
