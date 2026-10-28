// ご注文は満タンで：今日の仕込み・友達と比べる・お客さん図鑑
const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));
const PD_WD = ["日", "月", "火", "水", "木", "金", "土"];

/* ---------- 今日の仕込み（毎日1問、みんな同じ問題） ---------- */
// 曜日で難しさが変わる：月曜がいちばんやさしく、日曜がいちばん難しい
function prepDailyCh(){ const t = todayJST(), wd = new Date(Date.UTC(t.y, t.m-1, t.d)).getUTCDay(); return [9, 3, 4, 5, 6, 7, 8][wd]; }
function prepDailyWd(){ const t = todayJST(); return PD_WD[new Date(Date.UTC(t.y, t.m-1, t.d)).getUTCDay()]; }
function strSeed(s){ let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 1000000007; }
function prepDailyDef(){
  const key = todayKey(), c = prepDailyCh(), [k, e, hide, ice] = PREP_CH[c-1], cid = "pd:" + key;
  if (!prepCache[cid]) prepCache[cid] = prepGen(k, e, CAP, strSeed("mantan-" + key), mulberry);
  const g = prepCache[cid];
  return {id: "今日の仕込み", pid: "pd", key, daily: true, mode: "prep", ch: c, n: 0, w: 1 + ((c - 1) % 9), colors: k, shelf: k, spare: e, seats: 0, guests: 0, pat: 60, goal: 0,
    hide: !!hide, ice: ice ? [2] : null, prep: g, par: g ? g.sol.length : 99, label: `${key.slice(5).replace("-", "/")}（${prepDailyWd()}）`};
}
const pdToday = () => { const pd = save.prepDaily; return pd && pd.key === todayKey() ? pd : null; };
function endPrepDaily(){
  running = false; sel = -1;
  const st = prepStars(); let pd = pdToday(); if (!pd) pd = save.prepDaily = {key: S.key, best: 0, st: 0, bonus: false};
  const prev = pd.best, newBest = !prev || prepMoves < prev; if (newBest) pd.best = prepMoves; pd.st = Math.max(pd.st || 0, st);
  let reward = 0; if (!pd.bonus){ pd.bonus = true; reward = 300 + 50*S.ch; save.wallet += reward; save.prepDailyClears = (save.prepDailyClears || 0) + 1; }
  { const h = save.prepDailyHist || (save.prepDailyHist = {}), cur = h[S.key] || {m: 0, st: 0}; cur.m = cur.m ? Math.min(cur.m, prepMoves) : prepMoves; cur.st = Math.max(cur.st, st); h[S.key] = cur;
    Object.keys(h).sort().slice(0, -30).forEach(k => delete h[k]); }
  countDay(); const newTr = checkTrophies(true); persist();
  $("resH").textContent = newBest && prev ? "今日の仕込み ベスト更新！" : "今日の仕込み 完了！"; $("resMoney").textContent = `${prepMoves}手`;
  $("resGoal").innerHTML = `${S.label}・目安 ${S.par}手　今日のベスト ${pd.best}手` + (prepHelp ? `<br><small>助けを使ったので★は最大${prepStarCap()}つ</small>` : "");
  $("resStars").classList.remove("hidden"); $("resStars").innerHTML = [0,1,2].map(k => `<span class="${k < st ? "on" : ""}">★</span>`).join("");
  $("resList").innerHTML = [["かかった手数", `${prepMoves}手`], ["目安の手数", `${S.par}手（★3）`], ["★2", `${Math.ceil(S.par*1.3)}手まで`]].map(([a,b]) => `<li><span>${a}</span><b>${b}</b></li>`).join("");
  $("resEarned").innerHTML = `<div class="earned">` + (reward ? `今日はじめてのクリア！ 財布に <b>+${yen(reward)}</b>` : `今日のごほうびは受け取り済みです`) + `<br>明日はまた新しい1問が出ます。友達と手数を比べてみよう` + (newTr.length ? `<br>トロフィー：<b>${newTr.map(t => t.name).join("、")}</b>` : "") + `</div>`;
  $("nextBtn").classList.remove("hidden"); $("nextBtn").disabled = false; $("nextBtn").textContent = "記録をシェア"; resNext = null;
  setTimeout(() => { $("result").classList.remove("hidden"); play("fanfare", {gain:.55}); }, 500);
}

/* ---------- 友達と比べる（オンラインなし：記録コードを送り合う） ---------- */
const KPRE = "KURABE1-";
const okCos = (t, id, def) => COS.some(c => c.t === t && c.id === id) ? id : def;
function myCard(){
  const p = save.profile, k = todayKey(), d = (save.dailyHist || {})[k], q = pdToday();
  return {v: 1, id: p.id, shop: pShop(), name: pName(), g: p.g, wear: p.wear, acc: p.acc, fit: p.fit || "plain", rk: rankOf(save.total),
    st: Object.values(save.stars).reduce((a, b) => a + b, 0), ps: Object.keys(save.prep.stars).length,
    eb: save.endless.best || 0, el: save.endless.lv || 0, dk: d ? k : "", db: d ? d.best : 0, ds: d ? d.st : 0,
    qk: q && q.best ? k : "", qm: q ? q.best : 0, qs: q ? q.st : 0, t: Date.now()};
}
const cardCode = o => { const b = btoa(unescape(encodeURIComponent(JSON.stringify(o)))); return KPRE + b + "-" + sum(b) + "!"; };
const num = (v, max) => { v = Math.round(+v); return Number.isFinite(v) && v >= 0 ? Math.min(v, max) : 0; };
const day = v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
function cleanCard(o){
  if (!o || typeof o !== "object" || typeof o.id !== "string" || !/^[A-Z0-9-]{3,12}$/.test(o.id)) return null;
  return {id: o.id, shop: sanitize(o.shop, 12) || "名前のないお店", name: sanitize(o.name, 10) || "店主",
    g: num(o.g, GUESTS.length - 1), wear: num(o.wear, COLORS.length - 1), acc: okCos("acc", o.acc, "none"), fit: okCos("fit", o.fit, "plain"),
    rk: num(o.rk, 999), st: num(o.st, 999), ps: num(o.ps, 999), eb: num(o.eb, 1e9), el: num(o.el, 999),
    dk: day(o.dk), db: num(o.db, 1e8), ds: num(o.ds, 3), qk: day(o.qk), qm: num(o.qm, 9999), qs: num(o.qs, 3), t: num(o.t, 1e14)};
}
function readCard(txt){
  const t = String(txt || "").replace(/\s+/g, ""), m = t.match(/KURABE1-([A-Za-z0-9+/=]+)-([0-9a-z]+)!/);
  if (!m || sum(m[1]) !== m[2]) return null;
  try { return cleanCard(JSON.parse(decodeURIComponent(escape(atob(m[1]))))); } catch(e){ return null; }
}
function shareText(kind){
  const c = myCard(), lines = [`${c.shop}（店主 ${c.name}）の記録`, "ご注文は満タンで"];
  if (kind === "daily" || (!kind && c.dk)) lines.push(`今日の日替わり ${c.dk ? yen(c.db) + " " + "★".repeat(c.ds) : "まだ"}`);
  if (kind === "pd" || (!kind && c.qk)) lines.push(`今日の仕込み ${c.qk ? c.qm + "手 " + "★".repeat(c.qs) : "まだ"}`);
  if (kind === "endless" || !kind) lines.push(`エンドレス ベスト ${yen(c.eb)}（レベル${c.el}）`);
  lines.push("", "↓ このメッセージをゲームの「友達と比べる」に貼ると、記録を並べて比べられます", cardCode(c), "https://mizbas.github.io/gochumon-mantan/");
  return lines.join("\n");
}
// スマホなら共有メニュー（LINEなど）、それ以外はコピー
function shareMine(kind, btn){
  const t = shareText(kind), label = btn ? btn.textContent : "";
  const done = ok => { if (!btn) return; btn.textContent = ok ? "コピーしました" : "コピーできませんでした"; setTimeout(() => btn.textContent = label, 1800); };
  if (navigator.share && /iPhone|iPad|Android/i.test(navigator.userAgent)) return navigator.share({text: t}).catch(() => copyText(t).then(done));
  return copyText(t).then(done);
}
function addFriend(txt){
  const c = readCard(txt);
  if (!c) return [false, "記録コードが見つかりませんでした。届いたメッセージをまるごと貼ってください"];
  if (c.id === save.profile.id) return [false, "これは自分の記録です"];
  const f = save.friends || (save.friends = {}), had = f[c.id];
  if (had && had.t > c.t) return [false, `${c.name}さんの、もっと新しい記録がすでに入っています`];
  f[c.id] = c;
  const ids = Object.keys(f); if (ids.length > 30) ids.sort((a, b) => f[a].t - f[b].t).slice(0, ids.length - 30).forEach(id => delete f[id]);
  persist(); return [true, had ? `${c.name}さんの記録を新しくしました` : `${c.name}さん（${c.shop}）を追加しました`];
}
function ago(t){ const m = Math.max(0, Math.round((Date.now() - t)/60000)); return m < 60 ? `${m}分前` : m < 1440 ? `${Math.round(m/60)}時間前` : `${Math.round(m/1440)}日前`; }
function renderFriends(){
  const me = Object.assign(myCard(), {me: true}), k = todayKey(), all = [me].concat(Object.values(save.friends || {}));
  const board = (title, rows, fmt, empty) => {
    if (!rows.length) return `<div class="fr-b"><h3>${title}</h3><p class="fr-empty">${empty}</p></div>`;
    return `<div class="fr-b"><h3>${title}</h3>` + rows.map((c, i) => `<div class="fr-r${c.me ? " me" : ""}"><span class="fr-n">${i + 1}</span><canvas class="fr-av" width="64" height="64" data-i="${all.indexOf(c)}"></canvas><span class="fr-t"><b>${c.me ? "あなた" : esc(c.name)}</b><small>${esc(c.shop)}</small></span><span class="fr-v">${fmt(c)}</span></div>`).join("") + `</div>`;
  };
  const daily = all.filter(c => c.dk === k && c.db > 0).sort((a, b) => b.db - a.db);
  const pd = all.filter(c => c.qk === k && c.qm > 0).sort((a, b) => a.qm - b.qm);
  const en = all.filter(c => c.eb > 0).sort((a, b) => b.eb - a.eb);
  const stars = all.slice().sort((a, b) => b.st - a.st || b.rk - a.rk);
  $("frBoards").innerHTML = (all.length === 1 ? `<p class="set-p" style="text-align:center">まだ友達がいません。「自分の記録を送る」で友達に送って、友達からも送ってもらおう。</p>` : "") +
    board(`今日の日替わり <small>${k.slice(5).replace("-", "/")}</small>`, daily, c => `${yen(c.db)}<small>${"★".repeat(c.ds)}</small>`, "今日はまだだれも遊んでいません") +
    board(`今日の仕込み <small>少ない手数が上</small>`, pd, c => `${c.qm}手<small>${"★".repeat(c.qs)}</small>`, "今日はまだだれも解いていません") +
    board("エンドレスのベスト", en, c => `${yen(c.eb)}<small>Lv${c.el}</small>`, "まだ記録がありません") +
    board("ステージの★", stars, c => `★${c.st}<small>ランク${c.rk}</small>`, "");
  $("frBoards").querySelectorAll("canvas.fr-av").forEach(cv2 => { const c = all[+cv2.dataset.i], x = cv2.getContext("2d"); x.clearRect(0, 0, 64, 64); x.save(); x.beginPath(); x.arc(32, 32, 32, 0, 7); x.clip(); drawAvatar(x, c, 32, 38, 26, 600); x.restore(); });
  const fr = Object.values(save.friends || {}).sort((a, b) => b.t - a.t);
  $("frList").innerHTML = fr.length ? `<div class="set-h">追加した友達（${fr.length}人）</div>` + fr.map(c => `<div class="fr-l"><span><b>${esc(c.name)}</b>（${esc(c.shop)}）<small>${ago(c.t)}の記録</small></span><button data-id="${esc(c.id)}" aria-label="${esc(c.name)}さんを消す">消す</button></div>`).join("") : "";
  $("frList").querySelectorAll("button[data-id]").forEach(b => b.onclick = () => { delete save.friends[b.dataset.id]; persist(); play("pick", {gain:.3}); renderFriends(); });
}
function openFriends(){ audio(); $("frMsg").textContent = ""; $("frIn").value = ""; renderFriends(); $("friendsOv").classList.remove("hidden"); $("friendsOv").querySelector(".card").scrollTop = 0; }
$("frShare").onclick = () => shareMine(null, $("frShare"));
$("frAdd").onclick = () => { const [ok, m] = addFriend($("frIn").value); $("frMsg").textContent = m; $("frMsg").classList.toggle("ng", !ok); if (ok){ $("frIn").value = ""; play("kira", {gain:.4}); checkTrophies(false); renderFriends(); } else play("bad", {gain:.3}); };
$("frClose").onclick = () => $("friendsOv").classList.add("hidden");
$("friendBtn").onclick = openFriends;

/* ---------- お客さん図鑑 ---------- */
const ZOO_TXT = [
  "夜ふかしが得意。いつも同じ席に座りたがる", "大きな体で、注文はいつもゆっくり考える", "耳がいいので、栓の音で満タンに気づく",
  "雨の日によく来る、しずかなお客さん", "人なつっこくて、ほかのお客さんともすぐ仲よし", "見た目はこわいが、甘いお酒が大好き",
  "いたずら好き。たまに注文をころっと変えたくなる", "竹の色のお酒をいつか飲んでみたいらしい", "寒いところから来た。氷の入った瓶が好き",
  "ほっぺに何か入っている。ナッツのおつまみが目当て", "雨上がりが大好き。歌がちょっとうるさい", "しましまの服が自慢。たくさん飲む",
  "もこもこで眠そう。数を数えるとすぐ寝てしまう", "お店の王様のつもりでいる。チップは気前がいい"];
const ZOO_TYPES = [["regular", "常連さん"], ["critic", "評論家"], ["rush", "急ぎ"], ["vip", "団体さん"], ["cock", "カクテル"]];
function zooRec(g){ const z = save.zoo || (save.zoo = {}); return z[g] || (z[g] = {n: 0, ok: 0, ty: {}}); }
function zooSeen(s){ if (!s || s.g == null) return; zooRec(s.g).n++; }
function zooServed(s){ if (!s || s.g == null) return; const r = zooRec(s.g); r.ok++; ZOO_TYPES.forEach(([t]) => { if (s[t]) r.ty[t] = (r.ty[t] || 0) + 1; }); }
const zooStars = ok => ok >= 100 ? 3 : ok >= 30 ? 2 : ok >= 5 ? 1 : 0;
function openZoo(){
  audio(); const z = save.zoo || {}, met = GUESTS.filter((_, g) => z[g] && z[g].n > 0).length;
  $("zooSum").innerHTML = `出会ったお客さん <b>${met} / ${GUESTS.length}</b>　満足させた数で★が増えます（5人・30人・100人）`;
  $("zooList").innerHTML = GUESTS.map((_, g) => { const r = z[g], seen = r && r.n > 0, st = seen ? zooStars(r.ok) : 0;
    return `<div class="zoo-c${seen ? "" : " unk"}"><canvas width="120" height="110" data-g="${g}"></canvas><b>${seen ? GNAME[g] : "？？？"}</b>` +
      (seen ? `<span class="zs">${"★".repeat(st)}${"☆".repeat(3 - st)}</span><small>来店 ${r.n}回・満足 ${r.ok}人</small><p>${ZOO_TXT[g]}</p>` +
        `<div class="zt">${ZOO_TYPES.map(([t, n]) => `<span class="${r.ty[t] ? "on" : ""}" style="${r.ty[t] ? `background:${GTYPE[t === "cock" ? "cock" : t][1]}` : ""}">${n}</span>`).join("")}</div>`
        : `<small>まだ来たことがありません</small>`) + `</div>`; }).join("");
  $("zooList").querySelectorAll("canvas").forEach(cv2 => { const g = +cv2.dataset.g, x = cv2.getContext("2d"), seen = z[g] && z[g].n > 0;
    x.clearRect(0, 0, 120, 110); drawGuest(x, g, 60, 64, 42, "happy", 600);
    if (!seen){ x.save(); x.globalCompositeOperation = "source-in"; x.fillStyle = "rgba(70,50,38,.45)"; x.fillRect(0, 0, 120, 110); x.restore(); } });
  $("zooOv").classList.remove("hidden"); $("zooOv").querySelector(".card").scrollTop = 0;
}
$("zooBtn").onclick = openZoo;
$("zooClose").onclick = () => $("zooOv").classList.add("hidden");
