// ご注文は満タンで：画面（閉店・マップ・記録・設定・プロフィール・ショップ・トロフィー・エンディング）
/* ---------- 閉店 ---------- */
const STAR2 = 1.5, STAR3 = 2;
function starsFor(i, m){ const g = STAGES[i].goal; return m >= g*STAR3 ? 3 : m >= g*STAR2 ? 2 : m >= g ? 1 : 0; }
function titleOf(total){ return [0, titleOfRank(rankOf(total))]; }
function profitOf(){ const rent = rentOf(S), exp = expSupply + rent; return {rent, exp, profit: Math.max(0, money - exp)}; }
function profitHTML(pf){
  return `<div class="earned" style="text-align:left">売上 <b>${yen(money)}</b><br>− 仕入れ代 ${yen(expSupply)}（${expSupply/SUPPLY_COST}回）<br>− 家賃・光熱費 ${yen(pf.rent)}<br>` +
    `＝ 利益 <b>${yen(pf.profit)}</b> を財布に入れました` + (money < pf.exp ? "（赤字の分は店長がかぶりました）" : "") + `（財布 ${yen(save.wallet)}）`;
}
function endStage(){
  if (S.mode === "event") return endEventStage();
  if (S.mode) return endSpecial();
  ended = true; running = false; sel = -1;
  const id = S.id, clear = money >= S.goal, st = starsFor(stg, money);
  const rankBefore = rankOf(save.total);
  const branch = has("branch") ? Math.round(money*.1/10)*10 : 0;
  const pf = profitOf();
  save.wallet += pf.profit + branch; save.total += money;
  const rankAfter = rankOf(save.total); let rankGift = 0;
  for (let r = rankBefore + 1; r <= rankAfter; r++) rankGift += rankReward(r);
  save.wallet += rankGift; claim("rank", rankAfter);
  save.stats.served += servedN; save.stats.bottles += bottlesOut; save.stats.maxCombo = Math.max(save.stats.maxCombo, maxCombo);
  countDay();
  if (!missed && servedN > 0) save.stats.allHappy++;
  if (st > (save.stars[id]||0)) save.stars[id] = st;
  const prevBest = (stageRec(id) || {}).best || 0, newBest = money > prevBest && servedN > 0;
  if (money > (save.best[id]||0)) save.best[id] = money;
  { const r = save.rec[id] || (save.rec[id] = {best: prevBest, plays: 0, clears: 0});
    r.plays++; if (clear) r.clears++; if (newBest){ r.best = money; r.bestT = Date.now(); }
    r.combo = Math.max(r.combo||0, maxCombo); r.served = Math.max(r.served||0, servedN); if (!missed && servedN > 0) r.perfect = (r.perfect||0) + 1; }
  const newTr = checkTrophies(true);
  persist();
  const titleBefore = titleOfRank(rankBefore), titleAfter = titleOfRank(rankAfter);
  $("resH").textContent = clear ? "閉店！ 目標達成" : "閉店… 目標まであと少し";
  $("resMoney").textContent = yen(money);
  $("resGoal").innerHTML = `目標 ${yen(S.goal)}` + (clear ? "" : `（あと ${yen(S.goal - money)}）`) + (newBest ? `<span class="newbest">ベスト更新</span>` + (prevBest ? `<br>これまでのベスト ${yen(prevBest)}` : "") : `<br>ベスト ${yen(prevBest)}`);
  $("resStars").innerHTML = [0,1,2].map(k => `<span class="${k < st ? "on" : ""}">★</span>`).join("");
  $("resList").innerHTML = [["満足したお客さん", `${servedN}人`], ["渡した満タン瓶", `${bottlesOut}本`], ["最高連続", `${maxCombo}連続`], ["帰ってしまったお客さん", `${missed}人`], ["流しに捨てた量", `${dumped}杯ぶん`]]
    .map(([a,b]) => `<li><span>${a}</span><b>${b}</b></li>`).join("");
  let earned = profitHTML(pf);
  if (branch) earned += `<br>二号店の評判ボーナス <b>+${yen(branch)}</b>`;
  if (rankAfter > rankBefore){ earned += `<br>ランクアップ！ <b>ランク${rankAfter}</b>（ごほうび +${yen(rankGift)}）`; setTimeout(() => { toastQ.push({ic:"⬆️", name:`ランク${rankAfter}になりました`, sub:"ランクアップ"}); runToast(); }, 900); }
  if (titleAfter !== titleBefore) earned += `<br>称号が <b>${titleAfter}</b> になりました！`;
  if (newTr.length) earned += `<br>トロフィー：<b>${newTr.map(t => t.name).join("、")}</b>`;
  earned += evAward((clear ? 1 : 0) + evcServed);
  $("resEarned").innerHTML = earned + `</div>`;
  $("resStars").classList.remove("hidden");
  const last = stg === STAGES.length-1, endingNow = last && clear && !save.endingSeen;
  const canNext = ((save.stars[id]||0) >= 1 && stg < STAGES.length-1) || (last && clear);
  $("nextBtn").classList.remove("hidden"); $("nextBtn").disabled = !canNext; $("nextBtn").textContent = stg < STAGES.length-1 ? `${STAGES[stg+1].id} へ` : endingNow ? "エンディングへ" : "エンディングを見る";
  setTimeout(() => {
    $("result").classList.remove("hidden");
    if (clear){ play("fanfare", {gain:.6}); play("clap", {gain:.45, delay:.3}); } else play("wrong", {gain:.3});
  }, 700);
}
function endSpecial(){
  ended = true; running = false; sel = -1;
  const rankBefore = rankOf(save.total), branch = has("branch") && S.mode !== "endless" ? Math.round(money*.1/10)*10 : 0;
  let bonus = 0, clear = false, st = 0, newBest = false, shareTxt = "";
  if (S.mode === "endless"){
    const e = save.endless; newBest = money > (e.best||0);
    if (newBest) e.best = money; e.lv = Math.max(e.lv||0, elvl); e.served = Math.max(e.served||0, servedN);
    e.combo = Math.max(e.combo||0, maxCombo); e.plays = (e.plays||0) + 1;
    e.runs = (e.runs || []).concat([{m: money, lv: elvl, sv: servedN, t: Date.now()}]).sort((a,b) => b.m - a.m).slice(0, 5);
  } else {
    clear = money >= S.goal; st = money >= S.goal*STAR3 ? 3 : money >= S.goal*STAR2 ? 2 : clear ? 1 : 0;
    const dd = save.daily; if (dd.key !== S.key){ for (const k in dd) delete dd[k]; dd.key = S.key; dd.best = 0; dd.bonus = false; }
    newBest = money > (dd.best||0); if (newBest) dd.best = money;
    if (clear && !dd.bonus){ dd.bonus = true; bonus = Math.round(money*.5/10)*10; save.dailyClears = (save.dailyClears||0) + 1; }
    { const h = save.dailyHist || (save.dailyHist = {}), cur = h[S.key] || {best: 0, st: 0};
      cur.best = Math.max(cur.best, money); cur.st = Math.max(cur.st, st); h[S.key] = cur;
      Object.keys(h).sort().slice(0, -30).forEach(k => delete h[k]); }
    shareTxt = `${pShop()}（店主 ${pName()}）\nご注文は満タンで\n日替わり特別営業 ${S.label}\n売上 ${yen(dd.best)} ${"★".repeat(st)}\nhttps://mizbas.github.io/gochumon-mantan/`;
  }
  const endless = S.mode === "endless", pf = profitOf();
  if (!endless){ save.wallet += pf.profit + branch + bonus; save.total += money; }
  const rankAfter = rankOf(save.total); let rankGift = 0;
  for (let r = rankBefore + 1; r <= rankAfter; r++) rankGift += rankReward(r);
  save.wallet += rankGift;
  save.stats.served += servedN; save.stats.bottles += bottlesOut; save.stats.maxCombo = Math.max(save.stats.maxCombo, maxCombo);
  countDay();
  if (!endless) claim("day", save.dailyClears || 0);
  claim("rank", rankAfter);
  const newTr = checkTrophies(true); persist();
  $("resH").textContent = endless ? (newBest ? "閉店！ ベスト更新" : "閉店　おつかれさま") : (clear ? "閉店！ 目標達成" : "閉店… 目標まであと少し");
  $("resMoney").textContent = yen(money);
  $("resGoal").innerHTML = (endless ? `レベル${elvl}まで到達・ベスト ${yen(save.endless.best)}` : `${S.label}の目標 ${yen(S.goal)}` + (clear ? "" : `（あと ${yen(S.goal - money)}）`) + `<br>今日のベスト ${yen(save.daily.best)}`) + (newBest ? `<span class="newbest">ベスト更新</span>` : "");
  $("resStars").classList.toggle("hidden", endless);
  $("resStars").innerHTML = [0,1,2].map(k => `<span class="${k < st ? "on" : ""}">★</span>`).join("");
  $("resList").innerHTML = [["満足したお客さん", `${servedN}人`], ["渡した満タン瓶", `${bottlesOut}本`], ["最高連続", `${maxCombo}連続`], ["帰ってしまったお客さん", `${missed}人`]]
    .map(([a,b]) => `<li><span>${a}</span><b>${b}</b></li>`).join("");
  let earned = endless ? `<div class="earned">エンドレスの売上は<b>記録用</b>です（財布・ランクには入りません）。<br>レベルや売上が目標に届くと、1回だけ<b>到達ほうび</b>がもらえます` : profitHTML(pf);
  { const got = REWARDS.filter(r => save.claimed[r.id] && save.claimed[r.id] >= runStart); if (got.length) earned += `<br>もらったほうび：<b>${got.map(r => giveText(r.give)).join("、")}</b>` + (got.some(r => r.give.decor) ? "<br>（インテリアはショップの「飾り」で飾れます）" : "") + (got.some(r => r.give.title) ? "<br>（称号は「ランクとトロフィー」で付けかえられます）" : ""); }
  if (bonus) earned += `<br>今日はじめての目標達成！ 日替わりボーナス <b>+${yen(bonus)}</b>`;
  else if (!endless && save.daily.bonus) earned += `<br>今日の日替わりボーナスは受け取り済みです`;
  if (branch) earned += `<br>二号店の評判ボーナス <b>+${yen(branch)}</b>`;
  if (rankAfter > rankBefore){ earned += `<br>ランクアップ！ <b>ランク${rankAfter}</b>（ごほうび +${yen(rankGift)}）`; setTimeout(() => { toastQ.push({ic:"⬆️", name:`ランク${rankAfter}になりました`, sub:"ランクアップ"}); runToast(); }, 900); }
  if (newTr.length) earned += `<br>トロフィー：<b>${newTr.map(t => t.name).join("、")}</b>`;
  earned += evAward((bonus ? 3 : 0) + evcServed);
  $("resEarned").innerHTML = earned + `</div>`;
  $("nextBtn").disabled = false; $("nextBtn").textContent = "記録をシェア";
  $("nextBtn").classList.remove("hidden");
  resShare = shareTxt;
  setTimeout(() => {
    $("result").classList.remove("hidden");
    if (newBest || clear){ play("fanfare", {gain:.6}); play("clap", {gain:.45, delay:.3}); } else play("wrong", {gain:.3});
  }, 700);
}
let resShare = "";
function copyText(t, ta){
  const fb = () => { const x = ta || document.createElement("textarea"); if (!ta){ x.value = t; x.style.cssText = "position:fixed;left:-999px;top:0"; document.body.appendChild(x); }
    x.select(); x.setSelectionRange(0, t.length); let ok = false; try { ok = document.execCommand("copy"); } catch(e){} if (!ta) x.remove(); return ok; };
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(() => true, () => fb());
  return Promise.resolve(fb());
}
$("retryBtn").onclick = () => { $("result").classList.add("hidden"); showIntro(stg); };
$("resMap").addEventListener("click", () => { if (S && S.mode === "prep"){ setTimeout(openPrepSel, 0); } });
$("nextBtn").onclick = () => {
  if (S && S.mode === "event"){ evNext(); return; }
  if (S && S.daily){ shareMine("pd", $("nextBtn")); return; }
  if (S && S.mode === "prep"){ if (resNext){ $("result").classList.add("hidden"); showIntro(resNext); } return; }
  if (stg === STAGES.length-1){ $("result").classList.add("hidden"); showEnding(); return; }
  if (typeof stg === "string"){ if (stg === "daily" || stg === "endless") shareMine(stg, $("nextBtn")); return; }
  $("result").classList.add("hidden"); showIntro(stg+1); };
$("resMap").onclick = () => { $("result").classList.add("hidden"); if (S && S.mode === "event") openEvShop(); else showMap(); };

/* ---------- トロフィー ---------- */
let toastQ = [], toastOn = false;
function checkTrophies(quiet){
  const got = [];
  TROPHIES.forEach(t => { if (!save.trophies[t.id] && t.ok(save)){ save.trophies[t.id] = Date.now(); got.push(t); } });
  if (got.length){ persist(); got.forEach(t => toastQ.push(t)); if (!quiet) runToast(); else setTimeout(runToast, 1600); }
  return got;
}
function runToast(){
  if (toastOn || !toastQ.length) return; toastOn = true;
  const t = toastQ.shift(); $("toastB").textContent = t.name; $("toast").querySelector(".ic").textContent = t.ic; $("toastS").textContent = t.sub || "トロフィー獲得";
  $("toast").classList.add("show"); play("kira", {gain:.5});
  setTimeout(() => { $("toast").classList.remove("show"); setTimeout(() => { toastOn = false; runToast(); }, 400); }, 2400);
}

/* ---------- マップ・開店前 ---------- */
function unlocked(i){ return i === 0 || (save.stars[STAGES[i-1].id]||0) >= 1; }
/* ---------- 記録 ---------- */
const md = t => { const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}`; };
function recBox(title, rows, empty){
  return `<div class="rec"><h3>${title}</h3>` + (rows.length ? `<ul>${rows.map(([a,b,top]) => `<li class="${top ? "top" : ""}"><span>${a}</span><b>${b}</b></li>`).join("")}</ul>` : `<div class="none">${empty}</div>`) + `</div>`;
}
function rewardBox(kinds){
  const list = REWARDS.filter(r => kinds.includes(r.k));
  const short = {prep: v => `${v}問`, elv: v => `レベル${v}`, emon: v => `売上${yen(v)}`, rank: v => `ランク${v}`, day: v => `${v}日達成`};
  const gv = g => [g.cos && "👕" + cosName(cosOfKey(g.cos)), g.decor && "🎁" + DECOR.find(d => d.id === g.decor).name, g.title && "👑「" + g.title + "」", g.money && "💰" + yen(g.money)].filter(Boolean).join(" ");
  return `<div class="rec"><h3>到達ほうび（1回だけ）</h3><ul>` + list.map(r => `<li class="rw ${save.claimed[r.id] ? "got" : ""}"><span style="flex:none">${short[r.k](r.v)}</span><b style="text-align:right">${gv(r.give)}</b></li>`).join("") + `</ul></div>`;
}
function stageRec(id){ const r = save.rec[id]; if (r) return r; return save.best[id] ? {best: save.best[id], plays: 0, clears: 0} : null; }
function showIntro(i){
  stg = i; S = stageDef(i); setDrinkTheme(); setTimeout(addDrinkList, 0);
  ["map","play","result","intro","prepSel","evShop"].forEach(id => $(id).classList.add("hidden"));
  $("openBtn").textContent = S.mode === "prep" ? "はじめる" : "開店する";
  if (S.mode === "prep"){
    $("introH").textContent = S.id;
    $("introGoal").textContent = `${S.colors}色・空き瓶${S.spare}本・目安${S.par}手`;
    $("introRules").innerHTML = `お客さんは来ません。時間制限もありません。<b>全部の瓶を1色ずつ満タン</b>にそろえたら完成です。<br>
      ・<b>目安の手数</b>以内で★3、その1.3倍までで★2<br>・「↶ 戻す」は何回でも使えます<br>・「💡 ヒント」と「空き瓶 +1」は使うと★の上限が1つずつ下がります${S.hide ? "<br>・？の色があります" : ""}${S.ice ? "<br>・凍った瓶は15秒ごとに溶けていきます" : ""}${S.cloth ? "<br>・<b>ふきんの瓶</b>：中身が見えず、注ぐことも注がれることもできません。札の色の満タン瓶を作ると取れます（★はどの色でもよく、数字はその本数）" : ""}`;
    if (S.daily){ const pd = pdToday(); $("introH").textContent = `今日の仕込み ${S.label}`;
      $("introRules").innerHTML = `毎日1問、<b>遊んでいる人みんなが同じ問題</b>です。月曜がいちばんやさしく、日曜がいちばん難しくなります。<br>今日はじめて解くと、財布にごほうび。「友達と比べる」で手数を比べられます。<br>` + $("introRules").innerHTML;
      $("introRec").innerHTML = recBox("今日の記録", pd && pd.best ? [["今日のベスト", `${pd.best}手`, 1], ["星", "★".repeat(pd.st) + "☆".repeat(3 - pd.st)]] : [], "今日はまだ解いていません");
    } else {
    const best = save.prep.best[S.pid], st = save.prep.stars[S.pid] || 0;
    $("introRec").innerHTML = recBox(`${S.id} の記録`, best ? [["ベスト", `${best}手`, 1], ["星", "★".repeat(st) + "☆".repeat(3-st)]] : [], "まだ記録はありません"); }
    $("intro").classList.remove("hidden"); bgm("prep"); return;
  }
  if (S.mode === "event") return evIntro();
  if (S.mode === "endless"){
    $("introH").textContent = "エンドレス営業";
    $("introGoal").textContent = `ハート3つ・ベスト ${save.endless.best ? yen(save.endless.best) : "まだなし"}（最高レベル${save.endless.lv || 0}）`;
    $("introRules").innerHTML = `・お客さんが途切れずにやってきます。<b>帰らせるとハートが1つ減り</b>、全部なくなったら閉店です<br>
      ・5人満足させるごとにレベルアップ。色が増えたり、急ぎのお客さんや？の色、団体さんが出てきます<br>
      ・5レベルごとにハートが1つ回復します（最大3つ）<br>・<b>売上は記録用</b>で、財布やランクには入りません。代わりに、レベルや売上が目標に届くと<b>1回だけ到達ほうび</b>（お金・称号・インテリア）がもらえます`;
    const e = save.endless, runs = e.runs || [];
    $("introRec").innerHTML = recBox("エンドレスの記録",
      e.best ? [["ベスト売上", yen(e.best), 1], ["最高レベル", `レベル${e.lv||0}`], ["最多のお客さん", `${e.served||0}人`], ["最高連続", `${e.combo||0}連続`], ["挑戦した回数", `${e.plays||0}回`]]
        .concat(runs.map((r, k) => [`${k+1}位　${md(r.t)}`, `${yen(r.m)}・Lv${r.lv}・${r.sv}人`])) : [], "まだ記録はありません") + rewardBox(["elv","emon"]);
    $("intro").classList.remove("hidden"); return;
  }
  if (S.mode === "daily"){
    const dd = save.daily.key === S.key ? save.daily : {}, names = {hide:"？の色", rush:"急ぎのお客さん", ice:"寒波（瓶が凍る）", supply:"仕入れ制限と団体さん", reserve:"予約", lock:"カギつき瓶", dark:"停電"};
    $("introH").textContent = `日替わり特別営業　${S.label}`;
    $("introGoal").textContent = `目標 ${yen(S.goal)}・お客さん ${S.guests}人・${WORLDS[S.w-1].name}`;
    $("introRules").innerHTML = `今日のお題：<b>${S.colors}色・${S.gm.map(g => names[g]).join("＋")}</b><br>
      ・最初の棚とお客さんの流れは<b>今日遊ぶ人みんな同じ</b>です。友達と売上を比べてみよう<br>
      ・その日はじめて目標を達成すると、<b>売上の半分の日替わりボーナス</b>がもらえます${dd.bonus ? "（今日は受け取り済み）" : ""}<br>
      ・何回でも挑戦できます<br>・日付が変わるとお題が変わります`;
    const hist = Object.entries(save.dailyHist || {}).sort((a,b) => a[0] < b[0] ? 1 : -1).slice(0, 7);
    $("introRec").innerHTML = recBox("日替わりの記録（最近7日）", hist.map(([k, h]) => [`${+k.slice(5,7)}/${+k.slice(8)}${k === S.key ? "（今日）" : ""}`, `${yen(h.best)} ${"★".repeat(h.st||0) || "—"}`, k === S.key]), "まだ記録はありません") +
      (save.dailyClears ? `<div class="set-p" style="margin:-8px 0 12px">目標を達成した日：合計 ${save.dailyClears}日</div>` : "") + rewardBox(["day"]);
    $("intro").classList.remove("hidden"); return;
  }
  $("introH").textContent = `${S.id}　${WORLDS[S.w-1].name}`;
  $("introGoal").textContent = `目標 ${yen(S.goal)}・お客さん ${S.guests}人`;
  $("introRules").innerHTML = i === 0 ? `
    ・瓶をタップ → 別の瓶をタップで注ぎます<br>
    ・同じ色が4杯たまると<b>栓をして満タン瓶</b>のできあがり<br>
    ・満タン瓶は、その色を頼んだお客さんに自動で渡ります。注文がなければ棚で待機します<br>
    ・注文の瓶を全部渡すと代金がもらえます。早いとチップ、続けて満足させると連続ボーナス<br>
    ・「仕入れ」をタップすると、上に見えている瓶の中身が空き瓶に入ります（空き瓶が必要）<br>
    ・棚をあけたいときは、待機中の満タン瓶をタップすると「保管棚」へ下げられます（最初は1本。いっぱいのときは財布のお金で増やせます。注文が来たら自動で渡ります）<br>
    ・空き瓶が足りないときは、プレイ中に財布のお金で空き瓶を追加できます（1ステージ2本まで）<br>
    ・こまったら瓶を選んで「流し」へ（1杯 ${yen(DUMP_COST)}）<br>
    ・財布に入るのは<b>利益</b>です。売上から、仕入れ代（1回 ${yen(SUPPLY_COST)}）と家賃・光熱費（${yen(rentOf(S))}）を引いた分です` :
    (S.n === 1 && WORLDS[S.w-1].note ? `<b>新しいお店：</b>${WORLDS[S.w-1].note}<br><br>` : "") +
    `${S.colors}色・注文は${S.ord[0] === S.ord[1] ? S.ord[0] : S.ord[0]+"〜"+S.ord[1]}本・${S.seats}席${S.hide ? "・？の色あり" : ""}${S.rush ? "・急ぎのお客さん" : ""}${S.ice ? "・寒波（瓶が凍る）" : ""}${S.reserve ? "・予約" : ""}${S.lock ? "・カギつき瓶" : ""}${S.dark ? "・停電" : ""}${S.cocktail ? "・カクテル" : ""}${S.supply ? `・仕入れ${S.supply}回まで` : ""}${S.vip ? "・団体さん" : ""}<br>★2 は ${yen(S.goal*STAR2)}、★3 は ${yen(S.goal*STAR3)} 以上<br>経費：仕入れ1回 ${yen(SUPPLY_COST)}・家賃 ${yen(rentOf(S))}（財布に入るのは売上から経費を引いた利益）`;
  const r = stageRec(S.id), stn = save.stars[S.id] || 0;
  $("introRec").innerHTML = recBox(`${S.id} の記録`, r ? [["ベスト売上", yen(r.best) + (r.bestT ? `（${md(r.bestT)}）` : ""), 1], ["星", "★".repeat(stn) + "☆".repeat(3-stn)]]
      .concat(r.plays ? [["最高連続", `${r.combo||0}連続`], ["最多のお客さん", `${r.served||0}人`], ["全員満足", `${r.perfect||0}回`], ["遊んだ回数", `${r.plays}回（クリア ${r.clears||0}回）`]] : []) : [], "まだ記録はありません");
  $("intro").classList.remove("hidden");
}
$("openBtn").onclick = () => { audio(); $("intro").classList.add("hidden"); $("play").classList.remove("hidden"); startStage(stg); };
$("introBack").onclick = () => { $("intro").classList.add("hidden"); if (S && S.mode === "prep") openPrepSel(); else if (S && S.mode === "event") openEvShop(); else showMap(); };
$("buyBtn").onclick = () => { if (!paused) buyBottle(); };
$("undoBtn").onclick = () => { audio(); doUndo(); };
$("sandBtn").onclick = () => { if (S && S.mode === "prep"){ audio(); prepHintGo(); return; }
  if (paused || !running || sandUsed || !has("sand")) return;
  sandUsed = true; seats.forEach(s => { if (s.state === "wait") s.t0 = Math.min(T, s.t0 + 10000); });
  play("kira", {gain:.6}); floatText(W/2, lay.counterY - 40, "待ち時間 +10秒", "#9ed8f0", 1); hud(); };
$("rackBuy").onclick = () => closeRack(true);
$("rackNo").onclick = () => closeRack(false);
// メニューボタン：一時停止して、再開するかマップに戻るかを選ぶ
function pauseGame(){
  if (!running || !$("pauseOv").classList.contains("hidden")) return;
  $("tutBox").classList.add("hidden");
  paused = true; sel = -1;
  $("pauseP").innerHTML = S.mode === "prep" ? `いま ${prepMoves}手（目安 ${S.par}手）<br><small>やめると、この仕込みは最初からになります</small>` : `時間は止まっています。<br>いまの売上 <b>${yen(money)}</b>` + (S.mode === "endless" ? "" : `（目標 ${yen(S.goal)}）`) + `<br><small>マップに戻ると、このステージの売上は入りません</small>`;
  $("pauseTop").textContent = S.mode === "prep" ? "仕込みをやめる" : "お店を閉めてマップに戻る";
  $("pauseOv").classList.remove("hidden"); play("pick", {gain:.4});
}
// 説明画面に、このお店の飲み物の一覧を出す
function addDrinkList(){
  if (!S || S.mode === "prep" || $("intro").classList.contains("hidden") || $("introRules").querySelector(".drinks")) return;
  const pal = [...Array(S.colors).keys()];
  $("introRules").insertAdjacentHTML("beforeend", `<div class="drinks"><b>このお店の飲み物</b>` + pal.map(c => `<span><i style="background:${COLORS[c]}"></i>${drinkName(c)}</span>`).join("") + `</div>`);
}
/* ---------- しかけ・お客さんの初回の説明（1回だけ） ---------- */
const TIPS = {
  hide:     ["❓", "？の色", "瓶の下のほうの色が「？」で隠れています。上の色を注ぎ出すと見えます。<br>満タンになった瓶は、隠れていた色も見えて栓がされます。"],
  ice:      ["❄️", "寒波", "ときどき寒波が来て、瓶が1本凍ります。凍った瓶は注ぐことも注がれることもできません。<br>「寒波が来る！」と出たら、3秒のうちに中身を移せば逃がせます。12秒で溶け、満タン瓶を渡すたびに4秒早まります。"],
  supply:   ["⚓", "仕入れは回数まで", "仕入れ台を使える回数に限りがあります（残りは仕入れ台に表示）。<br>流しに捨てる量を減らして、大事に使いましょう。"],
  cocktail: ["🍸", "カクテル", "カクテルのお客さんには、グラスに<b>下から順に</b>注文どおりの色を1杯ずつ重ねます。グラスにはどの色でも注げます。<br>間違えたら、グラスを選んで流しへ。"],
  reserve:  ["📋", "予約ボード", "次に来る2人の注文が、先にボードに出ます。<br>来る前に満タン瓶を用意しておいて、来てすぐ出すと代金1.3倍です。"],
  lock:     ["🔒", "カギつき瓶", "カギのかかった瓶は使えません。<br>カギと同じ色の満タン瓶を渡すか、30秒たつと開きます。"],
  dark:     ["🔦", "停電", "ときどき7秒間停電して、瓶の色が見えなくなります。灯台の光が当たった瓶だけ見えます。<br>「停電しそう…」と出たら、先に注ぐ瓶を決めておきましょう。"],
  happy:    ["🎉", "ハッピーアワー", "20秒だけ、代金が1.5倍になります。どんどん出しましょう！"],
  regular:  ["😊", "常連さん", "緑の札のお客さんは常連さん。待てる時間が長め（1.4倍）で、チップが2倍です。"],
  critic:   ["🎩", "評論家", "紫の札のお客さんは評論家。待てる時間が少し短めですが、満足させると代金2.5倍です。"],
  rush:     ["⏱️", "急ぎのお客さん", "赤い札のお客さんは急ぎ。待てる時間が短い（0.6倍）かわりに、代金1.4倍です。"],
  fav:      ["💗", "大好物", "お客さんにはそれぞれ好きな色があります。ハートの印のお客さんは、注文に好きな色が入っていて代金1.2倍。<br>好きな色はお客さんをタップするか、図鑑で見られます。"],
  sig:      ["⭐", "看板メニュー", "あなたが決めた看板メニューの注文が来ました！ 代金1.5倍です。<br>看板メニューはプロフィールでいつでも変えられます。"],
  vip:      ["👥", "団体さん", "黄色の札のお客さんは団体さん。2色を2本ずつ、満タン瓶4本の大口注文です。待てる時間は長めで、代金は2倍。"]
};
const TIP_ORDER = ["hide", "ice", "supply", "cocktail", "reserve", "lock", "dark", "happy", "rush", "vip", "critic", "regular", "sig", "fav"];
// 前から遊んでいる人は、クリア済みのステージに出てきたものは知っているとみなす
function tipsMigrate(){
  if (save.tipsInit) return; save.tips = save.tips || {};
  STAGES.forEach((d, i) => { if (!(save.stars[d.id] >= 1)) return;
    ["hide", "ice", "supply", "cocktail", "reserve", "dark", "rush", "vip"].forEach(k => { if (d[k]) save.tips[k] = 1; });
    if (d.lock || d.relock) save.tips.lock = 1;
    if (i >= 3){ save.tips.regular = save.tips.critic = 1; } if (i >= 8) save.tips.happy = 1; });
  if (save.endless.plays || save.dailyClears) TIP_ORDER.forEach(k => { if (["regular", "critic", "rush"].includes(k)) save.tips[k] = 1; });
  save.tipsInit = true; persist();
}
tipsMigrate();
let tipT = 0, tipOpen = null;
function tipNeed(){
  if (!S || S.mode === "prep") return null;
  const g = t => seats.some(s => (s.state === "in" || s.state === "wait") && s[t]);
  const on = {hide: S.hide, ice: S.ice, supply: S.supply && isFinite(S.supply), cocktail: S.cocktail || g("cock"), reserve: S.reserve, lock: S.lock || S.relock, dark: S.dark,
    happy: happyNow(), rush: g("rush"), vip: g("vip"), critic: g("critic"), regular: g("regular"), sig: g("sig"), fav: g("favHit")};
  const k0 = TIP_ORDER.find(k => on[k] && !(save.tips || {})[k]); if (k0) return k0;
  const e = evNow(); if (e && g("evc") && !(save.tips || {})["evc_" + e.id]) return "evc_" + e.id;
  return null;
}
function tipCheck(){
  if (!running || paused || ended || tut || tipOpen || window.__bot || window.__noTips || performance.now() < tipT) return; tipT = performance.now() + 300;
  const k = tipNeed(); if (!k) return;
  const [ic, name, desc] = TIPS[k] || (() => { const e = evNow(); return [e.ic, e.chara.name, `${e.name}のあいだだけ来る、特別なお客さんです。<br>代金2倍で、満足させると${e.mark}が1つもらえます（${e.mark}をためると限定の小物と称号）。`]; })(); tipOpen = k; save.tips = save.tips || {}; save.tips[k] = 1; persist();
  paused = true; sel = -1;
  $("tipIc").textContent = ic; $("tipH").textContent = name; $("tipP").innerHTML = desc + `<br><small>（時間は止まっています。一時停止メニューの「お客さん・しかけの説明」でいつでも見られます）</small>`;
  $("tipOv").classList.remove("hidden"); play("kira", {gain:.35});
}
function closeTip(){ $("tipOv").classList.add("hidden"); tipOpen = null; if ($("pauseOv").classList.contains("hidden") && $("rackAsk").classList.contains("hidden")) paused = false; lastTs = 0; tipT = performance.now() + 600; }
$("tipGo").onclick = () => { audio(); closeTip(); };
function resumeGame(){
  $("pauseOv").classList.add("hidden");
  if (tipOpen) { lastTs = 0; return; } // 説明を見ている途中なら、そのまま止めておく
  if (tut && TUT[tut.step].shown !== false && tut.step > 0) { tutShow(); if (TUT[tut.step].next){ return; } }
  if ($("rackAsk").classList.contains("hidden")) paused = false;
  lastTs = 0; play("pick", {gain:.4, rate:1.1});
}
$("homeBtn").onclick = () => { audio(); pauseGame(); };
$("pauseGo").onclick = resumeGame;
$("pauseTop").onclick = () => { $("tipOv").classList.add("hidden"); tipOpen = null; if (S && S.mode === "prep"){ $("pauseOv").classList.add("hidden"); running = false; paused = false; openPrepSel(); return; } if (tut){ tut = null; $("tutBox").classList.add("hidden"); } $("pauseOv").classList.add("hidden"); running = false; paused = false; $("rackAsk").classList.add("hidden"); if (S && S.mode === "event") openEvShop(); else showMap(); };
// アプリを裏に回したら自動で一時停止
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && running && !$("play").classList.contains("hidden")) pauseGame(); });
function showMap(){
  running = false;
  ["play","intro","result","shop","trophies","evShop"].forEach(id => $(id).classList.add("hidden")); $("map").classList.remove("hidden");
  $("walletV").textContent = yen(save.wallet);
  { const r = rankOf(save.total); $("rankV").textContent = `ランク${r}`; $("titleV").textContent = titleShown();
    $("rankBar").style.width = r >= RANK_MAX ? "100%" : Math.min(100, (save.total - rankReq(r))/(rankReq(r+1) - rankReq(r))*100) + "%"; }
  const wbox = $("worlds"); wbox.innerHTML = ""; let next = 0;
  for (let i=0;i<STAGES.length;i++){ if (unlocked(i)) next = i; }
  for (let i=0;i<STAGES.length;i++){ if (unlocked(i) && !(save.stars[STAGES[i].id])){ next = i; break; } }
  WORLDS.forEach(wd => {
    const list = STAGES.map((st,i) => ({st, i})).filter(o => o.st.w === wd.w), open = unlocked(list[0].i);
    let total = 0; list.forEach(o => total += save.stars[o.st.id] || 0);
    const sec = document.createElement("div"); sec.className = "world" + (open ? "" : " soon");
    sec.innerHTML = `<h2><span class="wn">ワールド${wd.w}　${wd.name}</span><small>${open ? `★ ${total} / ${list.length*3}` : "🔒"}</small></h2>` + (open ? "" : `<p>${STAGES[list[0].i-1].id} をクリアするとオープンします。</p>`);
    const grid = document.createElement("div"); grid.className = "stages";
    list.forEach(({st, i}) => {
      const s2 = save.stars[st.id] || 0, lock = !unlocked(i);
      const b = document.createElement("button"); b.className = "sbtn" + (lock ? " locked" : "") + (i === next ? " next" : "");
      const bst = (stageRec(st.id) || {}).best;
      b.innerHTML = `<span class="n">${st.id}</span><span class="s">${lock ? "🔒" : "★".repeat(s2) + "☆".repeat(3-s2)}</span><span class="b">${!lock && bst ? yen(bst) : ""}</span>`;
      b.setAttribute("aria-label", `ステージ ${st.id}` + (lock ? "（まだ遊べません）" : `（★${s2}）`));
      b.onclick = () => { audio(); if (lock){ play("bad", {gain:.3}); return; } showIntro(i); };
      grid.appendChild(b);
    });
    if (open) sec.appendChild(grid);
    wbox.appendChild(sec);
  });
  $("contBtn").textContent = `${STAGES[next].id} をはじめる`; $("contBtn").onclick = () => { audio(); showIntro(next); };
  const sp = $("specials"); sp.innerHTML = "";
  const dd = save.daily.key === todayKey() ? save.daily : {}, td = todayJST();
  [["endless","🌙","エンドレス営業", specialOpen("endless") ? (save.endless.best ? `ベスト <em>${yen(save.endless.best)}</em><br>最高レベル${save.endless.lv}` : "ハートが尽きるまで<br>どこまで行ける？") : "1-8 をクリアで解放"],
   ["daily","📅",`日替わり ${td.m}/${td.d}`, specialOpen("daily") ? (dd.bonus ? `今日のベスト <em>${yen(dd.best)}</em><br>ボーナス受け取り済み` : dd.best ? `今日のベスト <em>${yen(dd.best)}</em><br>目標達成でボーナス` : "毎日ちがうお題<br>目標達成でボーナス") : "2-8 をクリアで解放"]]
  .forEach(([k, ic, name, sub]) => {
    const open = specialOpen(k), b = document.createElement("button"); b.className = "spbtn" + (open ? "" : " locked");
    b.innerHTML = `<span class="ic">${open ? ic : "🔒"}</span><b>${name}</b><small>${sub}</small>`;
    b.onclick = () => { audio(); if (!open){ play("bad", {gain:.3}); return; } showIntro(k); };
    sp.appendChild(b);
  });
  { const cl = Object.keys(save.prep.stars).length, open = prepOpen(), b = $("prepBtn"); b.classList.toggle("locked", !open);
    $("prepSub").textContent = open ? (cl ? `クリア ${cl} / ${PREP_CH.length*PREP_N}問・★${Object.values(save.prep.stars).reduce((a,b)=>a+b,0)}` : "時間制限なし。全部の瓶を1色ずつそろえよう") + (pdToday() && pdToday().best ? "・今日の1問 ✓" : "・今日の1問あり") : "1-1 をクリアで解放";
    b.onclick = () => { audio(); if (!open){ play("bad", {gain:.3}); return; } openPrepSel(); }; }
  $("prepSel").classList.add("hidden");
  bgm("map");
  renderChip(); if (!save.profile.set && save.tutDone && !save.profile.asked){ save.profile.asked = true; persist(); setTimeout(() => openForm(true), 400); }
  renderEvent(); drawHero(); checkTrophies(false); claim("rank", rankOf(save.total)); claim("day", save.dailyClears || 0); claim("elv", save.endless.lv || 0); claim("emon", save.endless.best || 0);
  // しばらく引き継ぎコードを保存していなくて、進み具合が増えていたらお知らせ
  const days = save.backupT ? Math.floor((Date.now() - save.backupT)/864e5) : null, gain = save.total - (save.backupTotal||0);
  const need = save.total >= 3000 && gain >= Math.max(3000, save.total*.1) && (days === null || days >= 7);
  $("bkupBtn").classList.toggle("hidden", !need);
  if (need) $("bkupBtn").innerHTML = `💾<span>${days === null ? "まだ引き継ぎコードを保存していません。" : `前回のバックアップから<b>${days}日</b>たちました。`}機種変更などに備えて、<b>ここをタップ</b>して保存しておくと安心です</span>`;
}
/* ---------- 設定・データの引き継ぎ ---------- */
function renderSettings(){
  $("liteTog").textContent = save.lite ? "オン" : "オフ"; $("liteTog").classList.toggle("on", !!save.lite);
  $("cbTog").textContent = save.cb ? "オン" : "オフ"; $("cbTog").classList.toggle("on", !!save.cb);
  $("sndTog").textContent = save.sound ? "オン" : "オフ"; $("sndTog").classList.toggle("on", save.sound);
  $("bgmVol").value = Math.round(save.bgmVol*100); $("bgmOut").textContent = $("bgmVol").value;
  $("seVol").value = Math.round(save.seVol*100); $("seOut").textContent = $("seVol").value;
  const p = $("protV"), last = save.backupT ? new Date(save.backupT) : null;
  p.innerHTML = (protectedOK ? "🛡️ 記録の保護：オン（ブラウザが勝手に消さない設定です）" : "⚠️ 記録の保護：オフ（ホーム画面に追加して遊ぶと守られやすくなります）") +
    `<br>💾 前回のバックアップ：${last ? `${last.getMonth()+1}月${last.getDate()}日` : "まだありません"}`;
  p.style.color = protectedOK ? "#2f7d32" : "#a0522d";
}
const markBackup = () => { save.backupT = Date.now(); save.backupTotal = save.total; persist(); renderSettings(); $("bkupBtn").classList.add("hidden"); };
$("bkupBtn").onclick = () => $("setBtn").onclick();
$("setBtn").onclick = () => { audio(); renderSettings(); $("xferMsg").textContent = ""; $("settings").classList.remove("hidden"); };
$("setClose").onclick = () => $("settings").classList.add("hidden");
$("liteTog").onclick = () => { save.lite = !save.lite; if (!save.lite) save.dprCap = 2; persist(); renderSettings(); play("pick"); };
$("cbTog").onclick = () => { save.cb = !save.cb; persist(); renderSettings(); play("pick"); };
$("sndTog").onclick = () => { audio(); save.sound = !save.sound; persist(); applyVolume(); renderSettings(); play("pick"); };
$("bgmVol").oninput = e => { save.bgmVol = e.target.value/100; $("bgmOut").textContent = e.target.value; applyVolume(); };
$("seVol").oninput = e => { save.seVol = e.target.value/100; $("seOut").textContent = e.target.value; applyVolume(); };
$("bgmVol").onchange = $("seVol").onchange = () => { persist(); play("pick"); };
const XPRE = "MANTAN1-";
function sum(t){ let h = 2166136261; for (let i=0;i<t.length;i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function exportCode(){ const b = btoa(unescape(encodeURIComponent(JSON.stringify(save)))); return XPRE + b + "-" + sum(b); }
function importCode(txt){
  const t = (txt || "").replace(/\s+/g, ""), i = t.indexOf(XPRE); if (i < 0) return null;
  const body = t.slice(i + XPRE.length), k = body.lastIndexOf("-"); if (k < 0) return null;
  const b = body.slice(0, k); if (sum(b) !== body.slice(k+1)) return null;
  try { const o = JSON.parse(decodeURIComponent(escape(atob(b)))); return o && o.stats && typeof o.wallet === "number" ? o : null; } catch(e){ return null; }
}
const xmsg = (m, ng) => { $("xferMsg").textContent = m; $("xferMsg").classList.toggle("ng", !!ng); };
$("xferCopy").onclick = () => { const c = exportCode(); $("xferTxt").value = c;
  copyText(c, $("xferTxt")).then(ok => { if (ok) markBackup(); xmsg(ok ? "引き継ぎコードをコピーしました。メモなどに貼って保存してください" : "下の枠のコードを長押しでコピーしてください", !ok); }); };
$("xferFile").onclick = () => { const c = exportCode(), t = todayJST(), a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([c], {type:"text/plain"})); a.download = `gochumon-mantan-${t.y}${String(t.m).padStart(2,"0")}${String(t.d).padStart(2,"0")}.txt`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); markBackup(); xmsg("ファイルに保存しました"); };
function askImport(o){
  const r = rankOf(o.total || 0);
  $("cfH").textContent = "読み込みますか？";
  $("cfP").innerHTML = `読み込むデータ：ランク${r}・財布 ${yen(o.wallet)}・★${Object.values(o.stars||{}).reduce((a,b)=>a+b,0)}<br><b>いまのデータは上書きされます。</b>`;
  $("cfYes").textContent = "読み込む";
  cfAction = () => { save = loadSave(o); ensureProfile(); persist(); applyVolume(); renderSettings(); xmsg("読み込みました！"); showMap(); $("settings").classList.remove("hidden"); };
  $("confirm").classList.remove("hidden");
}
$("xferLoad").onclick = () => { const o = importCode($("xferTxt").value); if (!o) return xmsg("コードが正しくありません。全部コピーできているか確かめてください", true); askImport(o); };
$("xferPick").onclick = () => $("xferIn").click();
$("xferIn").onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { e.target.value = ""; const o = importCode(t); if (!o) return xmsg("このファイルは引き継ぎデータではないようです", true); askImport(o); }); };
$("wipeBtn").onclick = () => { const b = $("wipeBtn");
  if (b.dataset.c){ const keep = {sound: save.sound, bgmVol: save.bgmVol, seVol: save.seVol}; save = Object.assign(fresh(), keep); ensureProfile(); persist(); delete b.dataset.c; b.textContent = "記録を消す"; showMap(); }
  else { b.dataset.c = "1"; b.textContent = "もう一度押すと財布も全部消えます"; setTimeout(() => { delete b.dataset.c; b.textContent = "記録を消す"; }, 3000); } };
function drawHero(){
  const c = $("heroCv"), x = c.getContext("2d"); x.clearRect(0,0,520,320);
  const rm = ROOMS.find(r => r.id === save.room) || ROOMS[0];
  // ステージの描き方をそのまま使う（一時的に画面の大きさと内装を差し替える）
  const keep = {W, lay, room}; W = 520; room = rm; lay = {seatW: 220};
  try {
    const g = x.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, rm.wall[1]); g.addColorStop(1, rm.wall[2]); x.globalAlpha = .55; x.fillStyle = g; rr(x, 0, 0, 520, 224, 24); x.fill(); x.globalAlpha = 1;
    drawFine(x, upg("price"), 200);
    if (has("branch")) drawBranchSign(x, 200);
    if (has("juke")) drawJuke(x, 200);
    { const d = decorOn("ceil"); if (d) drawDecor(x, d, 0, 0, 520, 1500); }
    { const d = decorOn("wall"); if (d) drawDecor(x, d, 260, 10, 44, 1500); }
    x.save(); x.beginPath(); x.rect(0, 0, 520, 202); x.clip();
    drawChair(x, 130, 136, 96, 200, upg("pat")); drawChair(x, 390, 142, 90, 200, upg("pat"));
    drawGuest(x, 0, 130, 136, 96, "happy", 500); drawGuest(x, 2, 390, 142, 90, "ok", 900);
    { const e = evNow(); if (e){ [[130, 136, 96, 0], [390, 142, 90, 1]].forEach(([gx, gy, gs, k]) => { x.save(); x.translate(gx, gy); accDraw(x, e.items[k], gs, 1500); x.restore(); }); } }
    x.restore();
    x.fillStyle = rm.counter; x.fillRect(0, 200, 520, 24); x.fillStyle = rm.ctop; x.fillRect(0, 200, 520, 5);
    evDecor(x, 520, 200);
    if (has("cat")) drawCat(x, 200);
    { const d = decorOn("counter"); if (d) drawDecor(x, d, 36, 201, 40, 1500); }
  } finally { W = keep.W; lay = keep.lay; room = keep.room; }
  const sh = bottleShape(save.bottle, 46);
  drawVessel(x, sh, 230, 200 - sh.H/2, 0, [{c:0,v:4}], {cork:1});
  drawVessel(x, sh, 290, 200 - sh.H/2, 0, [{c:2,v:4}], {cork:1});
}

/* ---------- プロフィール ---------- */
// 着せかえ（アバター・小物・服）。手に入れ方：free=最初から / rank=ランクで解放 / shop=ショップで買う / reward=到達ほうび
const COS = [
  // アバター（動物）
  ...[0,1,2,3,4,5].map(g => ({t:"ava", id:g, src:"free"})),
  {t:"ava", id:6,  src:"shop", cost:20000},
  {t:"ava", id:7,  src:"shop", cost:40000, rank:8},
  {t:"ava", id:8,  src:"reward"},
  {t:"ava", id:9,  src:"reward"},
  {t:"ava", id:10, src:"reward"},
  {t:"ava", id:11, src:"reward"},
  {t:"ava", id:12, src:"shop", cost:60000, rank:12},
  {t:"ava", id:13, src:"reward"},
  // 小物
  {t:"acc", id:"none", name:"なし", src:"free"}, {t:"acc", id:"bowtie", name:"蝶ネクタイ", src:"free"}, {t:"acc", id:"ribbon", name:"リボン", src:"free"}, {t:"acc", id:"glasses", name:"めがね", src:"free"},
  {t:"acc", id:"beret",   name:"ベレー帽",     src:"rank", rank:5},
  {t:"acc", id:"tophat",  name:"シルクハット", src:"rank", rank:10},
  {t:"acc", id:"crown",   name:"王冠",         src:"rank", rank:20},
  {t:"acc", id:"scarf",   name:"マフラー",     src:"shop", cost:5000},
  {t:"acc", id:"hachi",   name:"ねじりはちまき", src:"shop", cost:8000},
  {t:"acc", id:"knit",    name:"ニット帽",     src:"shop", cost:10000},
  {t:"acc", id:"phones",  name:"ヘッドホン",   src:"shop", cost:12000},
  {t:"acc", id:"shades",  name:"サングラス",   src:"shop", cost:15000},
  {t:"acc", id:"captain", name:"船長帽",       src:"shop", cost:25000, rank:10},
  {t:"acc", id:"chef",    name:"シェフ帽",     src:"shop", cost:30000, rank:12},
  {t:"acc", id:"star",    name:"星のピン",     src:"reward"},
  {t:"acc", id:"hearts",  name:"ハートめがね", src:"reward"},
  {t:"acc", id:"flower",  name:"花かんむり",   src:"reward"},
  {t:"acc", id:"halo",    name:"天使の輪",     src:"reward"},
  {t:"acc", id:"monocle", name:"片めがね",     src:"reward"},
  {t:"acc", id:"sakura",  name:"桜のかんざし",   src:"event", ev:"hanami"},
  {t:"acc", id:"dango",   name:"花見だんご",     src:"event", ev:"hanami"},
  {t:"acc", id:"choco", name:"チョコのピン", src:"event", ev:"valentine"},
  {t:"acc", id:"lovebox", name:"ハートの箱", src:"event", ev:"valentine"},
  {t:"acc", id:"nanohana", name:"菜の花のかんざし", src:"event", ev:"hina"},
  {t:"acc", id:"bonbori", name:"ぼんぼり", src:"event", ev:"hina"},
  {t:"acc", id:"koi", name:"こいのぼりのピン", src:"event", ev:"kodomo"},
  {t:"acc", id:"kashiwa", name:"かしわの葉", src:"event", ev:"kodomo"},
  {t:"acc", id:"umbrella", name:"かさの帽子", src:"event", ev:"tsuyu"},
  {t:"acc", id:"snail", name:"かたつむりのピン", src:"event", ev:"tsuyu"},
  {t:"acc", id:"star2", name:"星のかざり", src:"event", ev:"tanabata"},
  {t:"acc", id:"tanzaku", name:"笹かざり", src:"event", ev:"tanabata"},
  {t:"acc", id:"furin", name:"風鈴", src:"event", ev:"natsu"},
  {t:"acc", id:"kakigori", name:"かき氷の帽子", src:"event", ev:"natsu"},
  {t:"acc", id:"moon", name:"お月さまの帽子", src:"event", ev:"tsukimi"},
  {t:"acc", id:"susuki", name:"すすき", src:"event", ev:"tsukimi"},
  {t:"acc", id:"momiji", name:"もみじのピン", src:"event", ev:"harvest"},
  {t:"acc", id:"kuri", name:"くりのピン", src:"event", ev:"harvest"},
  {t:"acc", id:"pumpkin", name:"かぼちゃの帽子", src:"event", ev:"halloween"},
  {t:"acc", id:"witch",   name:"まほうの帽子",   src:"event", ev:"halloween"},
  {t:"acc", id:"antler",  name:"トナカイの角",   src:"event", ev:"xmas"},
  {t:"acc", id:"santa",   name:"サンタの帽子",   src:"event", ev:"xmas"},
  {t:"acc", id:"sensu",   name:"おめでた扇子",   src:"event", ev:"newyear"},
  {t:"acc", id:"kagami",  name:"鏡もちの帽子",   src:"event", ev:"newyear"},
  // 服
  {t:"fit", id:"plain",  name:"無地",       src:"free"},
  {t:"fit", id:"stripe", name:"しましま",   src:"reward"},
  {t:"fit", id:"dots",   name:"水玉",       src:"shop", cost:6000},
  {t:"fit", id:"apron",  name:"エプロン",   src:"shop", cost:9000},
  {t:"fit", id:"sweater",name:"セーター",   src:"shop", cost:12000},
  {t:"fit", id:"happi",  name:"法被",       src:"reward"},
  {t:"fit", id:"kimono", name:"着物",       src:"reward"},
  {t:"fit", id:"lab",    name:"白衣",       src:"reward"},
  {t:"fit", id:"tux",    name:"タキシード", src:"shop", cost:50000, rank:15},
];
const cosName = c => c.t === "ava" ? GNAME[c.id] : c.name;
const cosKey = c => c.t + ":" + c.id;
const cosOwned = c => c.src === "free" || (c.src === "rank" && rankOf(save.total) >= c.rank) || (save.cos || []).includes(cosKey(c));
const cosFind = (t, id) => COS.find(c => c.t === t && c.id === id);
function cosHow(c){ if (c.src === "event"){ const e = EVENTS.find(x => x.id === c.ev); return e ? `イベント「${e.name}」（毎年${e.from[0]}/${e.from[1]}〜${e.to[0]}/${e.to[1]}）でもらえる` : ""; } if (c.src === "rank") return `ランク${c.rank}で解放`; if (c.src === "shop") return `ショップ「店主」で ${yen(c.cost)}` + (c.rank ? `（ランク${c.rank}〜）` : "");
  const r = REWARDS.find(x => x.give.cos === cosKey(c)); return r ? `${KNAME[r.k](r.v)}でもらえる` : ""; }
function countDay(){ const k = todayKey(); if (save.lastDay !== k){ save.lastDay = k; save.playDays = (save.playDays||0) + 1; } }
// 小物（アバターとお客さんで共通。c は顔の中心に移動ずみ）
function accDraw(c, acc, s, t){
  switch (acc){
    case "scarf": c.fillStyle = "#c0392b"; rr(c, -s*.36, s*.34, s*.72, s*.16, s*.08); c.fill(); c.fillRect(s*.12, s*.4, s*.14, s*.34); c.fillStyle = "rgba(255,255,255,.4)"; c.fillRect(s*.12, s*.6, s*.14, s*.04); break;
    case "hachi": c.fillStyle = "#fffaf0"; c.save(); c.rotate(-.08); rr(c, -s*.47, -s*.3, s*.94, s*.1, s*.05); c.fill(); c.restore(); c.strokeStyle = "#c0392b"; c.lineWidth = s*.03; c.beginPath(); for (let k=0;k<6;k++){ c.moveTo(-s*.4 + k*s*.15, -s*.3); c.lineTo(-s*.33 + k*s*.15, -s*.2); } c.stroke(); break;
    case "knit": c.fillStyle = "#3a6ee8"; c.beginPath(); c.arc(0, -s*.24, s*.44, Math.PI, 0); c.fill(); c.fillStyle = "#fffaf0"; rr(c, -s*.46, -s*.3, s*.92, s*.12, s*.05); c.fill(); c.beginPath(); c.arc(0, -s*.7, s*.09, 0, 7); c.fill(); break;
    case "phones": c.strokeStyle = "#2a2420"; c.lineWidth = s*.07; c.beginPath(); c.arc(0, -s*.05, s*.5, Math.PI*1.05, Math.PI*1.95); c.stroke(); c.fillStyle = "#e63946"; rr(c, -s*.58, -s*.12, s*.16, s*.28, s*.06); c.fill(); rr(c, s*.42, -s*.12, s*.16, s*.28, s*.06); c.fill(); break;
    case "shades": c.fillStyle = "#1e1a16"; rr(c, -s*.3, -s*.1, s*.26, s*.15, s*.05); c.fill(); rr(c, s*.04, -s*.1, s*.26, s*.15, s*.05); c.fill(); c.fillRect(-s*.06, -s*.07, s*.12, s*.03); break;
    case "captain": c.fillStyle = "#fffaf0"; c.beginPath(); c.ellipse(0, -s*.42, s*.42, s*.16, 0, 0, 7); c.fill(); c.fillStyle = "#1e2a4a"; rr(c, -s*.4, -s*.4, s*.8, s*.1, s*.04); c.fill(); c.beginPath(); c.ellipse(s*.05, -s*.31, s*.3, s*.06, 0, 0, Math.PI); c.fill(); c.fillStyle = "#e0b54a"; c.beginPath(); c.arc(0, -s*.36, s*.05, 0, 7); c.fill(); break;
    case "chef": c.fillStyle = "#fffaf0"; rr(c, -s*.28, -s*.5, s*.56, s*.2, s*.04); c.fill(); for (const dx of [-.2, 0, .2]){ c.beginPath(); c.arc(dx*s, -s*.66, s*.17, 0, 7); c.fill(); } break;
    case "star": c.fillStyle = "#f6c945"; c.beginPath(); for (let i=0;i<10;i++){ const r2 = i%2 ? s*.05 : s*.12, a = -Math.PI/2 + i*Math.PI/5; c.lineTo(s*.32 + Math.cos(a)*r2, -s*.3 + Math.sin(a)*r2); } c.closePath(); c.fill(); break;
    case "hearts": c.fillStyle = "#ef4f8a"; heart(c, -s*.16, -s*.04, s*.1); heart(c, s*.16, -s*.04, s*.1); break;
    case "flower": for (let k=0;k<7;k++){ const a = Math.PI*(1.12 + k*.13); c.fillStyle = ["#f06aa8","#f6c945","#ffffff","#9b5de5"][k%4]; c.beginPath(); c.arc(Math.cos(a)*s*.42, Math.sin(a)*s*.38 - s*.04, s*.09, 0, 7); c.fill(); } break;
    case "monocle": c.strokeStyle = "#c9962e"; c.lineWidth = s*.04; c.beginPath(); c.arc(s*.16, -s*.03, s*.12, 0, 7); c.stroke(); c.beginPath(); c.moveTo(s*.27, s*.03); c.quadraticCurveTo(s*.34, s*.3, s*.22, s*.45); c.stroke(); break;
    case "halo": c.strokeStyle = "#ffe08a"; c.lineWidth = s*.06; c.beginPath(); c.ellipse(0, -s*.72 + Math.sin((t||0)/400)*s*.03, s*.26, s*.07, 0, 0, 7); c.stroke(); break;
    case "bowtie": c.fillStyle = "#c0392b"; c.beginPath(); c.moveTo(0, s*.52); c.lineTo(-s*.2, s*.42); c.lineTo(-s*.2, s*.62); c.closePath(); c.moveTo(0, s*.52); c.lineTo(s*.2, s*.42); c.lineTo(s*.2, s*.62); c.closePath(); c.fill(); c.beginPath(); c.arc(0, s*.52, s*.05, 0, 7); c.fill(); break;
    case "ribbon": c.fillStyle = "#f06aa8"; c.beginPath(); c.ellipse(s*.22, -s*.38, s*.14, s*.08, -.6, 0, 7); c.ellipse(s*.4, -s*.3, s*.14, s*.08, .6, 0, 7); c.fill(); c.beginPath(); c.arc(s*.31, -s*.34, s*.05, 0, 7); c.fill(); break;
    case "glasses": c.strokeStyle = "#2a2420"; c.lineWidth = s*.045; c.beginPath(); c.arc(-s*.16, -s*.03, s*.12, 0, 7); c.moveTo(s*.28, -s*.03); c.arc(s*.16, -s*.03, s*.12, 0, 7); c.moveTo(-s*.04, -s*.05); c.lineTo(s*.04, -s*.05); c.stroke(); break;
    case "beret": c.fillStyle = "#3a2a6a"; c.beginPath(); c.ellipse(-s*.05, -s*.4, s*.38, s*.14, -.15, 0, 7); c.fill(); c.beginPath(); c.arc(s*.1, -s*.53, s*.05, 0, 7); c.fill(); break;
    case "tophat": c.fillStyle = "#1e1a16"; c.fillRect(-s*.24, -s*.95, s*.48, s*.5); c.beginPath(); c.ellipse(0, -s*.44, s*.42, s*.08, 0, 0, 7); c.fill(); c.fillStyle = "#c0392b"; c.fillRect(-s*.24, -s*.56, s*.48, s*.08); break;
    case "crown": c.fillStyle = "#f3d27a"; c.beginPath(); c.moveTo(-s*.3, -s*.36); c.lineTo(-s*.3, -s*.66); c.lineTo(-s*.15, -s*.5); c.lineTo(0, -s*.72); c.lineTo(s*.15, -s*.5); c.lineTo(s*.3, -s*.66); c.lineTo(s*.3, -s*.36); c.closePath(); c.fill(); c.fillStyle = "#e63946"; c.beginPath(); c.arc(0, -s*.46, s*.05, 0, 7); c.fill(); break;
      case "pumpkin": c.fillStyle = "#e8781e"; c.beginPath(); c.ellipse(0, -s*.52, s*.32, s*.2, 0, 0, 7); c.fill(); c.strokeStyle = "rgba(120,50,0,.45)"; c.lineWidth = s*.03;
      c.beginPath(); c.ellipse(0, -s*.52, s*.13, s*.2, 0, 0, 7); c.moveTo(0, -s*.72); c.lineTo(0, -s*.32); c.stroke(); c.fillStyle = "#4a7a2a"; rr(c, -s*.04, -s*.82, s*.08, s*.14, s*.03); c.fill();
      c.fillStyle = "#3a1a08"; c.beginPath(); c.moveTo(-s*.17, -s*.56); c.lineTo(-s*.09, -s*.6); c.lineTo(-s*.09, -s*.52); c.closePath(); c.moveTo(s*.17, -s*.56); c.lineTo(s*.09, -s*.6); c.lineTo(s*.09, -s*.52); c.closePath(); c.fill(); break;
    case "witch": c.fillStyle = "#3a2350"; c.beginPath(); c.ellipse(0, -s*.43, s*.52, s*.1, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-s*.27, -s*.45); c.quadraticCurveTo(-s*.05, -s*.8, s*.2, -s*1.08); c.quadraticCurveTo(s*.12, -s*.75, s*.27, -s*.45); c.closePath(); c.fill();
      c.fillStyle = "#f08a24"; c.fillRect(-s*.25, -s*.56, s*.5, s*.08); c.fillStyle = "#f6c945"; c.fillRect(-s*.05, -s*.57, s*.1, s*.1); break;
    case "santa": c.fillStyle = "#d33a32"; c.beginPath(); c.moveTo(-s*.36, -s*.46); c.quadraticCurveTo(s*.05, -s*1.0, s*.5, -s*.72); c.lineTo(s*.36, -s*.46); c.closePath(); c.fill();
      c.fillStyle = "#fffaf0"; rr(c, -s*.42, -s*.54, s*.84, s*.14, s*.07); c.fill(); c.beginPath(); c.arc(s*.5, -s*.72, s*.1, 0, 7); c.fill(); break;
    case "antler": c.strokeStyle = "#8a5a32"; c.lineWidth = s*.07; c.beginPath();
      for (const d of [-1, 1]){ c.moveTo(d*s*.2, -s*.4); c.lineTo(d*s*.34, -s*.86); c.moveTo(d*s*.27, -s*.62); c.lineTo(d*s*.46, -s*.72); c.moveTo(d*s*.31, -s*.76); c.lineTo(d*s*.18, -s*.92); } c.stroke();
      c.fillStyle = "#d33a32"; c.beginPath(); c.arc(0, s*.1, s*.07, 0, 7); c.fill(); break;
    case "sensu": c.save(); c.translate(s*.42, -s*.2); c.rotate(-.5); const fa = -Math.PI*.85, fb = -Math.PI*.15;
      c.fillStyle = "#d33a32"; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, s*.34, fa, fb); c.closePath(); c.fill(); c.fillStyle = "#f6c945"; c.beginPath(); c.arc(0, -s*.18, s*.07, 0, 7); c.fill();
      c.strokeStyle = "rgba(90,30,10,.45)"; c.lineWidth = s*.015; c.beginPath(); for (let k=0;k<=6;k++){ const a = fa + (fb - fa)*k/6; c.moveTo(0, 0); c.lineTo(Math.cos(a)*s*.34, Math.sin(a)*s*.34); } c.stroke(); c.restore(); break;
    case "kagami": c.fillStyle = "#fbf6ea"; c.beginPath(); c.ellipse(0, -s*.48, s*.3, s*.11, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, -s*.62, s*.22, s*.09, 0, 0, 7); c.fill();
      c.strokeStyle = "rgba(0,0,0,.12)"; c.lineWidth = s*.02; c.beginPath(); c.ellipse(0, -s*.48, s*.3, s*.11, 0, 0, 7); c.stroke();
      c.fillStyle = "#f08a24"; c.beginPath(); c.arc(0, -s*.74, s*.09, 0, 7); c.fill(); c.fillStyle = "#4a8a3a"; c.beginPath(); c.ellipse(s*.08, -s*.83, s*.07, s*.03, -.5, 0, 7); c.fill(); break;
    case "sakura": c.fillStyle = "#f7a8c4"; for (let k=0;k<5;k++){ const a = -Math.PI/2 + k*Math.PI*2/5; c.beginPath(); c.ellipse(s*.3 + Math.cos(a)*s*.08, -s*.38 + Math.sin(a)*s*.08, s*.07, s*.05, a, 0, 7); c.fill(); }
      c.fillStyle = "#f6c945"; c.beginPath(); c.arc(s*.3, -s*.38, s*.03, 0, 7); c.fill(); c.strokeStyle = "#8a5a32"; c.lineWidth = s*.03; c.beginPath(); c.moveTo(s*.34, -s*.32); c.lineTo(s*.52, -s*.12); c.stroke(); break;
    case "dango": c.strokeStyle = "#c9a26a"; c.lineWidth = s*.03; c.beginPath(); c.moveTo(s*.12, -s*.2); c.lineTo(s*.56, -s*.82); c.stroke();
      [["#7cbf6a", .22], ["#fbf6ea", .34], ["#f7a8c4", .46]].forEach(([col, k]) => { c.fillStyle = col; c.beginPath(); c.arc(s*(.12 + .44*k/.5), -s*(.2 + .62*k/.5), s*.08, 0, 7); c.fill(); }); break;
    default: emAcc(c, acc, s);
  }
}
function drawAvatar(c, p, x, y, s, t){
  drawGuest(c, p.g, x, y, s, "happy", t || 0, false, COLORS[p.wear]);
  c.save(); c.translate(x, y); c.lineCap = "round"; c.lineJoin = "round";
  // 服の柄（胴の部分にだけ描く）
  c.save(); c.beginPath(); rr(c, -s*.62, s*.42, s*1.24, s*.8, s*.35); c.clip();
  switch (p.fit){
    case "stripe": c.fillStyle = "rgba(255,255,255,.45)"; for (let k=0;k<5;k++) c.fillRect(-s*.7, s*.5 + k*s*.14, s*1.4, s*.06); break;
    case "dots": c.fillStyle = "rgba(255,255,255,.6)"; for (let i=0;i<5;i++) for (let j=0;j<3;j++){ c.beginPath(); c.arc(-s*.48 + i*s*.24 + (j%2)*s*.12, s*.55 + j*s*.16, s*.035, 0, 7); c.fill(); } break;
    case "apron": c.fillStyle = "#fffaf0"; rr(c, -s*.3, s*.48, s*.6, s*.8, s*.08); c.fill(); c.strokeStyle = "#fffaf0"; c.lineWidth = s*.04; c.beginPath(); c.moveTo(-s*.3, s*.5); c.lineTo(-s*.15, s*.42); c.moveTo(s*.3, s*.5); c.lineTo(s*.15, s*.42); c.stroke(); break;
    case "sweater": c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = s*.03; c.beginPath(); for (let k=-5;k<=5;k++){ c.moveTo(k*s*.11, s*.5); c.lineTo(k*s*.11, s*1.2); } c.stroke(); c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(-s*.7, s*.42, s*1.4, s*.08); break;
    case "happi": c.fillStyle = "#fffaf0"; c.beginPath(); c.moveTo(-s*.28, s*.42); c.lineTo(-s*.08, s*1.2); c.lineTo(-s*.18, s*1.2); c.lineTo(-s*.38, s*.42); c.fill(); c.beginPath(); c.moveTo(s*.28, s*.42); c.lineTo(s*.08, s*1.2); c.lineTo(s*.18, s*1.2); c.lineTo(s*.38, s*.42); c.fill();
      c.fillStyle = "rgba(255,255,255,.85)"; c.font = `900 ${s*.2}px "Zen Kaku Gothic New",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("祭", s*.38, s*.75); break;
    case "kimono": c.strokeStyle = "#fffaf0"; c.lineWidth = s*.07; c.beginPath(); c.moveTo(-s*.25, s*.42); c.lineTo(s*.12, s*.95); c.moveTo(s*.25, s*.42); c.lineTo(-s*.02, s*.8); c.stroke(); c.fillStyle = "#e0b54a"; c.fillRect(-s*.7, s*.88, s*1.4, s*.14); break;
    case "lab": c.fillStyle = "#fbfbf6"; c.fillRect(-s*.7, s*.42, s*1.4, s*.9); c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = s*.03; c.beginPath(); c.moveTo(0, s*.45); c.lineTo(0, s*1.2); c.moveTo(-s*.2, s*.42); c.lineTo(0, s*.7); c.lineTo(s*.2, s*.42); c.stroke(); c.fillStyle = "#7fb3c9"; c.fillRect(s*.22, s*.62, s*.16, s*.04); break;
    case "tux": c.fillStyle = "#1e1a16"; c.fillRect(-s*.7, s*.42, s*1.4, s*.9); c.fillStyle = "#fffaf0"; c.beginPath(); c.moveTo(-s*.18, s*.42); c.lineTo(s*.18, s*.42); c.lineTo(0, s*.95); c.closePath(); c.fill();
      c.fillStyle = "#1e1a16"; c.beginPath(); c.moveTo(0, s*.5); c.lineTo(-s*.12, s*.44); c.lineTo(-s*.12, s*.56); c.closePath(); c.moveTo(0, s*.5); c.lineTo(s*.12, s*.44); c.lineTo(s*.12, s*.56); c.closePath(); c.fill(); break;
  }
  c.restore();
  accDraw(c, p.acc, s, t);
  c.restore();
}
const pShop = () => (save.profile.shop || "名前のないお店"), pName = () => (save.profile.name || "店主");
function renderChip(){
  $("pChipShop").textContent = pShop(); $("pChipOwn").textContent = `店主 ${pName()}　${titleShown()}`;
  const c = $("pChipCv"), x = c.getContext("2d"); x.clearRect(0, 0, 88, 88); x.save(); x.beginPath(); x.arc(44, 44, 44, 0, 7); x.clip(); drawAvatar(x, save.profile, 44, 52, 36, 600); x.restore();
}
function sanitize(t, max){ // 改行や見えない文字、URLっぽいものを除く（いずれオンラインにするときのため）
  t = String(t || "").replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, "").replace(/\s+/g, " ").trim();
  if (/https?:|www\.|\.(com|jp|net)|@/i.test(t)) return null;
  return [...t].slice(0, max).join("");
}
function openProfile(){
  audio(); const p = save.profile, r = rankOf(save.total);
  $("pfShop").textContent = pShop(); $("pfOwn").textContent = `店主　${pName()}`; $("pfTtl").textContent = `ランク${r}　${titleShown()}`;
  $("pfMsg").textContent = p.msg ? `「${p.msg}」` : ""; $("pfId").textContent = `店主ID ${p.id}`;
  $("pfShop").style.color = COLORS[p.fav]; document.querySelector(".pcard").style.boxShadow = `inset 0 0 0 3px ${COLORS[p.fav]}`;
  const c = $("pfCv"), x = c.getContext("2d"); x.clearRect(0, 0, 220, 220); x.save(); x.beginPath(); x.arc(110, 110, 110, 0, 7); x.clip(); drawAvatar(x, p, 110, 112, 100, 600); x.restore();
  const stars = Object.values(save.stars).reduce((a,b) => a+b, 0), tro = Object.keys(save.trophies).length, d = new Date(p.since);
  $("pfStats").innerHTML = [["開店日", `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`], ["営業した日数", `${save.playDays || 1}日`], ["累計売上", yen(save.total)], ["満足したお客さん", `${save.stats.served.toLocaleString()}人`],
    ["★", `${stars} / ${STAGES.length*3}`], ["トロフィー", `${tro} / ${TROPHIES.length}`], ["エンドレス", save.endless.best ? `${yen(save.endless.best)}（Lv${save.endless.lv}）` : "まだなし"], ["最高連続", `${save.stats.maxCombo}連続`]]
    .map(([a,b]) => `<div><small>${a}</small><b>${b}</b></div>`).join("");
  renderSig();
  $("pfCopied").textContent = ""; $("pfView").classList.remove("hidden"); $("pfForm").classList.add("hidden"); $("pfH").textContent = "プロフィール";
  $("profile").classList.remove("hidden");
}
let draft = null;
function openForm(first){
  draft = Object.assign({fit: "plain"}, save.profile);
  $("pfShopIn").value = draft.shop; $("pfNameIn").value = draft.name; $("pfMsgIn").value = draft.msg; $("pfErr").textContent = "";
  $("pfH").textContent = first ? "お店をひらこう" : "プロフィールを編集"; $("pfView").classList.add("hidden"); $("pfForm").classList.remove("hidden"); $("profile").classList.remove("hidden");
  renderPick();
}
function renderPick(){
  const hint = c => { $("pfErr").style.color = "#8a5a2a"; $("pfErr").textContent = `🔒 ${cosName(c)}：${cosHow(c)}`; play("bad", {gain:.25}); };
  const ava = $("pfAva"); ava.innerHTML = "";
  COS.filter(c => c.t === "ava").forEach(c => { const g = c.id, own = cosOwned(c), b = document.createElement("button"); b.className = draft.g === g ? "on" : ""; b.setAttribute("aria-label", cosName(c) + (own ? "" : "（未入手）"));
    const cv = document.createElement("canvas"); cv.width = 104; cv.height = 104; const x = cv.getContext("2d"); x.save(); x.beginPath(); x.arc(52, 52, 52, 0, 7); x.clip(); if (!own) x.globalAlpha = .3; drawAvatar(x, Object.assign({}, draft, {g}), 52, 54, 50, 600); x.restore();
    if (!own){ x.font = "28px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("🔒", 52, 52); }
    b.appendChild(cv); b.onclick = () => { if (!own) return hint(c); draft.g = g; play("pick", {gain:.4}); renderPick(); }; ava.appendChild(b); });
  const wr = $("pfWear"); wr.innerHTML = "";
  COLORS.forEach((col, k) => { const b = document.createElement("button"); b.className = draft.wear === k ? "on" : ""; b.setAttribute("aria-label", CNAME[k]); b.innerHTML = `<span class="sw" style="background:${col}"></span>`; b.onclick = () => { draft.wear = k; play("pick", {gain:.4}); renderPick(); }; wr.appendChild(b); });
  const ac = $("pfAcc"); ac.innerHTML = "";
  COS.filter(c => c.t === "acc").forEach(c => { const own = cosOwned(c), b = document.createElement("button"); b.className = "ac" + (draft.acc === c.id ? " on" : ""); if (!own) b.style.opacity = ".45"; b.textContent = (own ? "" : "🔒") + c.name; b.onclick = () => { if (!own) return hint(c); draft.acc = c.id; play("pick", {gain:.4}); renderPick(); }; ac.appendChild(b); });
  const ft = $("pfFit"); ft.innerHTML = "";
  COS.filter(c => c.t === "fit").forEach(c => { const own = cosOwned(c), b = document.createElement("button"); b.className = "ac" + ((draft.fit || "plain") === c.id ? " on" : ""); if (!own) b.style.opacity = ".45"; b.textContent = (own ? "" : "🔒") + c.name; b.onclick = () => { if (!own) return hint(c); draft.fit = c.id; play("pick", {gain:.4}); renderPick(); }; ft.appendChild(b); });
  const fv = $("pfFav"); fv.innerHTML = "";
  COLORS.forEach((col, k) => { const b = document.createElement("button"); b.className = draft.fav === k ? "on" : ""; b.setAttribute("aria-label", CNAME[k]); b.innerHTML = `<span class="sw" style="background:${col}"></span>`; b.onclick = () => { draft.fav = k; play("pick", {gain:.4}); renderPick(); }; fv.appendChild(b); });
}
$("pChip").onclick = () => { if (!save.profile.set) openForm(true); else openProfile(); };
$("pfEdit").onclick = () => openForm(false);
$("pfCancel").onclick = () => { if (!save.profile.set){ $("profile").classList.add("hidden"); return; } openProfile(); };
$("pfSave").onclick = () => {
  const shop = sanitize($("pfShopIn").value, 12), name = sanitize($("pfNameIn").value, 10), msg = sanitize($("pfMsgIn").value, 24);
  if (shop === null || name === null || msg === null){ $("pfErr").textContent = "URLやメールアドレスは入れられません"; return; }
  if (!shop){ $("pfErr").textContent = "お店の名前を入れてください"; return; }
  if (!name){ $("pfErr").textContent = "店主の名前を入れてください"; return; }
  Object.assign(save.profile, draft, {shop, name, msg, set: true}); persist(); play("pay", {gain:.5}); renderChip(); openProfile();
};
$("pfClose").onclick = () => $("profile").classList.add("hidden");
$("pfCopy").onclick = () => { const p = save.profile, r = rankOf(save.total);
  const t = `🍾 ${pShop()}\n店主：${pName()}（ランク${r}「${titleShown()}」）\n${p.msg ? "「" + p.msg + "」\n" : ""}累計売上 ${yen(save.total)}・★${Object.values(save.stars).reduce((a,b)=>a+b,0)}\nエンドレス最高 ${yen(save.endless.best||0)}（Lv${save.endless.lv||0}）\n#ご注文は満タンで https://mizbas.github.io/gochumon-mantan/`;
  copyText(t).then(ok => $("pfCopied").textContent = ok ? "コピーしました！" : "コピーできませんでした"); };

/* ---------- お客さんの説明（プレイ中にタップ）と説明一覧 ---------- */
const GTYPE = {
  plain:   ["ふつうのお客さん", "#8a7660", "注文の瓶を全部渡すと代金。早いとチップ"],
  regular: ["常連さん", "#3f8f4a", "待てる時間が長め（1.4倍）。チップが2倍"],
  critic:  ["評論家", "#8e5cc4", "待てる時間が少し短め。満足させると代金2.5倍"],
  rush:    ["急ぎ", "#d9473a", "待てる時間が短い（0.6倍）。代金1.4倍"],
  vip:     ["団体さん", "#e0a020", "2色を2本ずつ、満タン瓶4本の大口注文。代金2倍"],
  cock:    ["カクテル", "#d6418f", "カクテルグラスに、下から順に注文どおりの色を1杯ずつ重ねる"],
  resv:    ["予約", "#c9962e", "予約ボードに出ていた注文。来てすぐ出すと代金1.3倍"],
  sig:     ["看板メニュー", "#b5562a", "あなたのお店の看板メニューを注文。代金1.5倍"],
  fav:     ["大好物", "#ef6b8a", "好きな色が注文に入っている。代金1.2倍"],
  evc:     ["イベントのお客さん", "#c0392b", "イベントのあいだだけ来る特別なお客さん。代金2倍"],
  pair:    ["ペア", "#ef6b8a", "同じ色を2本の注文。代金1.6倍"]
};
const GIMMICK = [
  ["？の色", "瓶の下のほうの色が隠れています。上を注ぎ出すと見えます"],
  ["凍った瓶", "寒波で瓶が1本凍ります（3秒前に予告）。12秒で溶け、満タン瓶を渡すたびに4秒早まります。仕込みでは15秒ごとに1つ減ります"],
  ["仕入れ制限", "仕入れ台を使える回数に限りがあります"],
  ["カクテルグラス", "どの色でも1杯ずつ注げます。間違えたらグラスを選んで流しへ"],
  ["予約ボード", "次に来る2人の注文が先に出ます"],
  ["カギつき瓶", "カギと同じ色の満タン瓶を渡すか、30秒で開きます"],
  ["停電", "7秒間、色が見えなくなります。灯台の光が当たった瓶だけ見えます"],
  ["ハッピーアワー", "20秒だけ代金が1.5倍になります"]
];
function guestTypes(s){ const t = []; if (s.cock) t.push("cock"); if (s.rush) t.push("rush"); if (s.vip) t.push("vip"); if (s.critic) t.push("critic"); if (s.regular) t.push("regular"); if (s.resv) t.push("resv"); if (s.evc) t.push("evc"); if (s.pair) t.push("pair"); if (s.sig) t.push("sig"); else if (s.favHit) t.push("fav"); if (!t.length) t.push("plain"); return t; }
let gInfoT = 0;
function showGuestInfo(k){
  const s = seats[k], p = lay.seatPos[k], r = cv.getBoundingClientRect(), el = $("gInfo");
  const left = s.state === "wait" ? Math.max(0, Math.ceil((s.pat - (T - s.t0))/1000)) : Math.ceil(s.pat/1000);
  const order = s.cock ? "下から " + s.cock.map(c => CNAME[c]).join("→") : s.order.map((c, j) => drinkName(c) + (s.got[j] ? "✓" : "")).join("・");
  el.innerHTML = `<b>${s.evc && evNow() ? evNow().chara.name : GNAME[s.g] + "のお客さん"}</b>　あと${left}秒<br>` + guestTypes(s).map(t => `<span class="tg" style="background:${GTYPE[t][1]}">${GTYPE[t][0]}</span>${GTYPE[t][2]}`).join("<br>") + `<br><small>注文：${order}　好きな色：${CNAME[FAVC[s.g]]}</small>`;
  el.classList.remove("hidden"); const w = el.offsetWidth; el.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + p.x - w/2)) + "px"; el.style.top = (r.top + p.y + 8) + "px";
  clearTimeout(gInfoT); gInfoT = setTimeout(() => el.classList.add("hidden"), 3200); play("pick", {gain:.3, rate:1.2});
}
function openGuide(){
  $("guideList").innerHTML = `<div><b>お客さんの種類</b></div>` + Object.values(GTYPE).map(([n, col, d]) => `<div><span class="tg" style="background:${col};display:inline-block;border-radius:8px;padding:0 6px;color:#fff;font-weight:900;font-size:11.5px">${n}</span> ${d}</div>`).join("") +
    `<div><b>しかけ</b></div>` + GIMMICK.map(([n, d]) => `<div><b>${n}</b>：${d}</div>`).join("");
  $("guideOv").classList.remove("hidden");
}
$("pauseGuide").onclick = openGuide;
$("prepBack").onclick = () => { $("prepSel").classList.add("hidden"); showMap(); };
$("guideClose").onclick = () => $("guideOv").classList.add("hidden");

/* ---------- エンディング ---------- */
let endRaf = 0;
function showEnding(){
  save.endingSeen = true; persist();
  ["map","play","result","intro"].forEach(id => $(id).classList.add("hidden")); $("ending").classList.remove("hidden");
  const stars = Object.values(save.stars).reduce((a,b) => a+b, 0), r = rankOf(save.total);
  $("endRoll").innerHTML = `<h3>ご注文は満タンで</h3><p>全${STAGES.length}ステージ 制覇おめでとう！</p><p>夜のバーから始まったお店は、${WORLDS[WORLDS.length-1].name}まで。</p>
    <small>あなたのお店の記録</small><p>累計売上 ${yen(save.total)}</p><p>満足したお客さん ${save.stats.served.toLocaleString()}人</p><p>渡した満タン瓶 ${save.stats.bottles.toLocaleString()}本</p><p>★ ${stars} / ${STAGES.length*3}</p><p>ランク${r}「${titleShown()}」</p>
    <small>店主</small><p>${pName()}（${pShop()}）</p><small>企画・テストプレイ</small><p>あなた</p><small>制作</small><p>Claude</p><small>音楽</small><p>魔王魂</p><small>効果音</small><p>効果音ラボ</p>
    <small>ご来店のお客さん</small><p>ねこ・くま・うさぎ・いぬ　ほか常連のみなさん</p>
    <small>そして</small><p>遊んでくれたあなたと、友達のみんなへ</p><h3>ありがとうございました</h3>
    <p>お店はこれからも営業中。<br>エンドレス営業と日替わりでお待ちしています。</p>`;
  const el = $("endRoll"); el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  play("fanfare", {gain:.6}); play("clap", {gain:.5, delay:.4}); bgm("map");
  const c = $("endCv"), x = c.getContext("2d"), rm = ROOMS.find(q => q.id === save.room) || ROOMS[0], conf = [];
  for (let i=0;i<70;i++) conf.push({x: Math.random()*520, y: -Math.random()*300, v: 40 + Math.random()*60, r: 2 + Math.random()*3, c: COLORS[i % 8], w: Math.random()*6});
  const t0 = performance.now();
  cancelAnimationFrame(endRaf);
  const loop = now => {
    const t = now - t0; x.clearRect(0, 0, 520, 300);
    x.fillStyle = rm.wall[1]; rr(x, 0, 0, 520, 300, 22); x.fill();
    x.fillStyle = rm.counter; x.fillRect(0, 230, 520, 26); x.fillStyle = rm.ctop; x.fillRect(0, 230, 520, 5); x.fillStyle = rm.under; x.fillRect(0, 256, 520, 44);
    x.save(); x.beginPath(); x.rect(0, 0, 520, 232); x.clip();
    for (let g=0; g<6; g++){ const gx = 50 + g*84, jump = Math.abs(Math.sin(t/300 + g*.9))*14; drawGuest(x, g, gx, 168 - jump, 62, g % 2 ? "love" : "happy", t + g*500); }
    x.restore();
    const sh = bottleShape(save.bottle, 16); for (let k=0;k<7;k++) drawVessel(x, sh, 8 + k*84, 230 - sh.H/2, 0, [{c:k, v:4}], {cork:1});
    conf.forEach(p => { const yy = (p.y + p.v*t/1000) % 330 - 20, xx = p.x + Math.sin(t/400 + p.w)*10; x.fillStyle = p.c; x.fillRect(xx, yy, p.r*2, p.r); });
    x.fillStyle = "#f6c945"; x.font = `400 34px ${getComputedStyle(document.body).getPropertyValue("--hand") || "sans-serif"}`; x.textAlign = "center"; x.fillText("全ステージ制覇！", 260, 52);
    if (!$("ending").classList.contains("hidden")) endRaf = requestAnimationFrame(loop);
  };
  endRaf = requestAnimationFrame(loop);
}
$("endClose").onclick = () => { $("ending").classList.add("hidden"); cancelAnimationFrame(endRaf); showMap(); };
$("tutAgain").onclick = () => { save.tutDone = false; persist(); $("settings").classList.add("hidden"); showIntro(0); };
$("endAgain").onclick = () => { if (!save.endingSeen && !(save.stars[STAGES[STAGES.length-1].id] >= 1)){ xmsg("最後のステージをクリアすると見られます", true); return; } $("settings").classList.add("hidden"); showEnding(); };

/* ---------- ショップ ---------- */
let shopTab = "upg";
function openShop(){ $("shop").classList.remove("hidden"); renderShop(); }
let cfAction = null;
function confirmBuy(name, cost, action){
  $("cfH").textContent = "買いますか？"; $("cfYes").textContent = "買う";
  $("cfP").innerHTML = `<b>${name}</b> を <b>${yen(cost)}</b> で買います。<br>財布 ${yen(save.wallet)} → ${yen(save.wallet - cost)}`;
  cfAction = action; $("confirm").classList.remove("hidden"); play("pick", {gain:.4});
}
$("cfNo").onclick = () => { cfAction = null; $("confirm").classList.add("hidden"); };
$("cfYes").onclick = () => { const f = cfAction; cfAction = null; $("confirm").classList.add("hidden"); if (f) f(); };
function renderShop(){
  $("shopWallet").textContent = yen(save.wallet);
  const rank = rankOf(save.total);
  [["tabUpg","upg"],["tabSpecial","special"],["tabBottle","bottle"],["tabRoom","room"],["tabDecor","decor"],["tabCos","cos"]].forEach(([id,t]) => $(id).setAttribute("aria-selected", shopTab === t));
  const box = $("shopItems"); box.innerHTML = "";
  const done = () => { persist(); play("pay", {gain:.6}); checkTrophies(false); renderShop(); refreshWallet(); };
  if (shopTab === "cos"){
    const intro = document.createElement("p"); intro.className = "set-p"; intro.textContent = "プロフィールのアバターを着せかえるアイテムです。買ったものは「プロフィール → 編集する」で選べます。ショップにないものは、エンドレス・日替わり・ランクのほうびでもらえます。"; box.appendChild(intro);
    [["ava","アバター（動物）"],["fit","服の柄"],["acc","小物"]].forEach(([t, label]) => {
      const h = document.createElement("div"); h.className = "slot-h"; h.textContent = label; box.appendChild(h);
      COS.filter(c => c.t === t && c.src !== "free").forEach(c => {
        const own = cosOwned(c), lock = c.rank && rank < c.rank, buyable = c.src === "shop";
        const el = document.createElement("div"); el.className = "item";
        el.innerHTML = `<canvas width="88" height="120"></canvas><div class="t"><b>${cosName(c)}</b>${own ? "持っています" : cosHow(c)}</div>
          <button class="buy ${own ? "on" : ""}" ${own || !buyable || lock || save.wallet < (c.cost||0) ? "disabled" : ""}>${own ? "持っています" : !buyable ? "ほうび" : lock ? "🔒" : yen(c.cost)}</button>`;
        const x = el.querySelector("canvas").getContext("2d"); x.fillStyle = "#3a2a1c"; rr(x, 0, 0, 88, 120, 14); x.fill();
        const base = Object.assign({}, save.profile, {acc: "none", fit: "plain"}); if (t === "ava") base.g = c.id; if (t === "acc") base.acc = c.id; if (t === "fit") base.fit = c.id;
        x.save(); if (!own) x.globalAlpha = .55; drawAvatar(x, base, 44, 58, 46, 600); x.restore();
        el.querySelector(".buy").onclick = () => { if (own || !buyable || lock || save.wallet < c.cost) return;
          confirmBuy(cosName(c), c.cost, () => { if (save.wallet < c.cost || cosOwned(c)) return; save.wallet -= c.cost; save.cos.push(cosKey(c)); done(); }); };
        box.appendChild(el);
      });
    });
    return;
  }
  if (shopTab === "decor"){
    const intro = document.createElement("p"); intro.className = "set-p"; intro.textContent = "インテリアはショップでは売っていません。エンドレスや日替わり、ランクの到達ほうびでもらえます。もらったものは、天井・壁・カウンターに1つずつ好きに飾れます。"; box.appendChild(intro);
    SLOTS.forEach(([slot, label]) => {
      const h = document.createElement("div"); h.className = "slot-h"; h.textContent = `${label}に飾る`; box.appendChild(h);
      DECOR.filter(d => d.slot === slot).forEach(d => {
        const owned = save.decor.owned.includes(d.id), on = save.decor[slot] === d.id, rw = REWARDS.find(r => r.give.decor === d.id);
        const el = document.createElement("div"); el.className = "item";
        el.innerHTML = `<canvas width="88" height="120"></canvas><div class="t"><b>${owned ? d.name : "？？？"}</b>${owned ? (on ? "飾っています" : "持っています") : `${rw ? KNAME[rw.k](rw.v) + "でもらえる" : d.how || ""}`}</div>
          <button class="buy ${on ? "on" : ""}" ${owned ? "" : "disabled"}>${!owned ? "🔒" : on ? "外す" : "飾る"}</button>`;
        const rm = ROOMS.find(r => r.id === save.room) || ROOMS[0], cvx = el.querySelector("canvas"), x = cvx.getContext("2d"), g = x.createLinearGradient(0,0,0,120); g.addColorStop(0, rm.wall[1]); g.addColorStop(1, rm.wall[2]);
        x.fillStyle = g; rr(x, 0, 0, 88, 120, 14); x.fill();
        if (!owned) x.globalAlpha = .25;
        if (slot === "ceil") drawDecor(x, d.id, 0, 14, 88, 2000);
        else if (slot === "wall") drawDecor(x, d.id, 44, 28, 44, 2000);
        else { x.fillStyle = rm.counter; x.fillRect(0, 90, 88, 30); x.fillStyle = rm.ctop; x.fillRect(0, 90, 88, 3); drawDecor(x, d.id, 44, 90, 50, 2000); }
        x.globalAlpha = 1;
        el.querySelector(".buy").onclick = () => { if (!owned) return; save.decor[slot] = on ? null : d.id; persist(); play("pick"); renderShop(); };
        box.appendChild(el);
      });
    });
    return;
  }
  if (shopTab === "upg"){
    UPG.forEach(u => {
      const lv = upg(u.id), maxed = lv >= u.max, cost = maxed ? 0 : u.cost[lv];
      const el = document.createElement("div"); el.className = "item";
      el.innerHTML = `<div class="t"><b>${u.name}</b>${u.desc}<div class="lv">${[...Array(u.max)].map((_,k) => `<i class="${k < lv ? "on" : ""}"></i>`).join("")}</div></div>
        <button class="buy" ${maxed || save.wallet < cost ? "disabled" : ""}>${maxed ? "最大" : yen(cost)}</button>`;
      el.querySelector(".buy").onclick = () => { if (maxed || save.wallet < cost) return;
        confirmBuy(`${u.name}（レベル${lv+1}）`, cost, () => { if (save.wallet < cost || upg(u.id) !== lv) return; save.wallet -= cost; save.upg[u.id] = lv + 1; done(); }); };
      box.appendChild(el);
    });
  } else if (shopTab === "special"){
    SPECIAL.forEach(it => {
      const own = has(it.id), lock = rank < it.rank;
      const el = document.createElement("div"); el.className = "item";
      el.innerHTML = `<div class="ic" style="width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:22px;background:${own ? "radial-gradient(circle at 35% 35%,#ffe08a,#e0a020 70%)" : "#d5c19c"};flex:none">${lock ? "🔒" : it.ic}</div>
        <div class="t"><b>${it.name}</b>${lock ? `ランク${it.rank}で解放` : it.desc}</div>
        <button class="buy ${own ? "on" : ""}" ${own || lock || save.wallet < it.cost ? "disabled" : ""}>${own ? "持っています" : yen(it.cost)}</button>`;
      el.querySelector(".buy").onclick = () => { if (own || lock || save.wallet < it.cost) return;
        confirmBuy(it.name, it.cost, () => { if (save.wallet < it.cost || has(it.id)) return; save.wallet -= it.cost; save.special = (save.special || []).concat(it.id); done(); }); };
      box.appendChild(el);
    });
  } else {
    const list = shopTab === "bottle" ? BOTTLES : ROOMS, cur = shopTab === "bottle" ? save.bottle : save.room;
    list.forEach(it => {
      const owned = save.owned.includes(it.id), on = cur === it.id, lock = !owned && it.rank && rank < it.rank;
      const el = document.createElement("div"); el.className = "item";
      el.innerHTML = `<canvas width="88" height="120"></canvas><div class="t"><b>${it.name}</b>${lock ? `ランク${it.rank}で解放` : owned ? (on ? "使用中" : "持っています") : "まだ持っていません"}</div>
        <button class="buy ${on ? "on" : ""}" ${!owned && (lock || save.wallet < it.cost) ? "disabled" : ""}>${on ? "使用中" : owned ? "使う" : yen(it.cost)}</button>`;
      const c = el.querySelector("canvas"), x = c.getContext("2d");
      if (shopTab === "bottle"){ const sh = bottleShape(it.id, 34); drawVessel(x, sh, 44, 62, 0, [{c:5,v:2},{c:1,v:2}], {cork:1}); }
      else { const g = x.createLinearGradient(0,0,0,112); g.addColorStop(0, it.wall[0]); g.addColorStop(1, it.wall[2]); x.fillStyle = g; rr(x,0,0,88,112,14); x.fill();
        x.fillStyle = it.counter; x.fillRect(0, 70, 88, 12); x.fillStyle = it.ctop; x.fillRect(0, 70, 88, 3); x.fillStyle = it.under; x.fillRect(0, 82, 88, 30); }
      const equip = () => { if (shopTab === "bottle") save.bottle = it.id; else save.room = it.id; };
      el.querySelector(".buy").onclick = () => {
        if (on) return;
        if (owned){ equip(); persist(); play("pick"); renderShop(); refreshWallet(); return; }
        if (lock || save.wallet < it.cost) return;
        confirmBuy(it.name, it.cost, () => { if (save.wallet < it.cost || save.owned.includes(it.id)) return; save.wallet -= it.cost; save.owned.push(it.id); equip(); done(); });
      };
      box.appendChild(el);
    });
  }
}
function refreshWallet(){ $("walletV").textContent = yen(save.wallet); $("shopWallet").textContent = yen(save.wallet); drawHero(); }
$("shopBtn").onclick = () => { audio(); openShop(); };
$("shopClose").onclick = () => $("shop").classList.add("hidden");
$("tabUpg").onclick = () => { shopTab = "upg"; renderShop(); };
$("tabSpecial").onclick = () => { shopTab = "special"; renderShop(); };
$("tabBottle").onclick = () => { shopTab = "bottle"; renderShop(); };
$("tabRoom").onclick = () => { shopTab = "room"; renderShop(); };
$("tabDecor").onclick = () => { shopTab = "decor"; renderShop(); };
$("tabCos").onclick = () => { shopTab = "cos"; renderShop(); };

/* ---------- 称号とトロフィー ---------- */
$("trophyBtn").onclick = () => {
  audio();
  const r = rankOf(save.total), name = titleShown();
  $("trTitle").textContent = `ランク${r}　${name}`;
  renderTitleSel();
  const nextTitle = TITLES.find(([n]) => n > r);
  $("trNext").innerHTML = r >= RANK_MAX ? `累計売上 ${yen(save.total)}　最高ランクです` :
    `累計売上 ${yen(save.total)}<br>ランク${r+1}まで あと ${yen(rankReq(r+1) - save.total)}（ごほうび ${yen(rankReward(r+1))}）` + (nextTitle ? `<br>ランク${nextTitle[0]}で称号「${nextTitle[1]}」` : "");
  $("trProg").style.width = r >= RANK_MAX ? "100%" : Math.min(100, (save.total - rankReq(r))/(rankReq(r+1) - rankReq(r))*100) + "%";
  $("trList").innerHTML = TROPHIES.map(t => `<div class="trophy ${save.trophies[t.id] ? "got" : ""}"><div class="ic">${save.trophies[t.id] ? t.ic : "？"}</div><div class="t"><b>${t.name}</b>${t.desc}</div></div>`).join("");
  $("trophies").classList.remove("hidden");
};
function renderTitleSel(){
  const r = rankOf(save.total), own = TITLES.filter(([n]) => n <= r).map(t => t[1]).concat(save.titles || []), box = $("trSel"); box.innerHTML = "";
  [[null, `ランクの称号（自動）`]].concat(own.map(t => [t, t])).forEach(([v, label]) => {
    const b = document.createElement("button"); b.textContent = label; b.className = (save.titleSel || null) === v ? "on" : "";
    b.onclick = () => { save.titleSel = v; persist(); play("pick"); $("trTitle").textContent = `ランク${r}　${titleShown()}`; $("titleV").textContent = titleShown(); renderTitleSel(); renderChip(); };
    box.appendChild(b); });
  const rest = REWARDS.filter(x => x.give.title && !save.claimed[x.id]);
  if (rest.length){ const p = document.createElement("div"); p.className = "set-p"; p.style.cssText = "width:100%;text-align:center;margin:4px 0 0";
    p.textContent = "ほかの称号：" + rest.map(x => `${KNAME[x.k](x.v)}で「${x.give.title}」`).join("／"); box.appendChild(p); }
}
$("trClose").onclick = () => $("trophies").classList.add("hidden");
