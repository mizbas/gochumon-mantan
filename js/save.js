// ご注文は満タンで：保存データの読み書き
/* ---------- 保存 ---------- */
const KEY = "tokutoku-fever-v1";
const fresh = () => ({special:[], wallet:0, total:0, stars:{}, best:{}, upg:{}, owned:["classic","walnut"], bottle:"classic", room:"walnut", trophies:{}, stats:{served:0, bottles:0, maxCombo:0, allHappy:0}, sound:true, cb:false, profile:null, cos:[], prep:{stars:{}, best:{}}, playDays:0, lastDay:"", tutDone:false, endingSeen:false, rec:{}, dailyHist:{}, claimed:{}, titles:[], titleSel:null, decor:{owned:[], ceil:null, wall:null, counter:null}, backupT:0, backupTotal:0, bgmVol:.6, seVol:1, endless:{best:0, lv:0, served:0}, daily:{}, dailyClears:0});
let save = fresh();
const loadSave = s => Object.assign(fresh(), s, {stats: Object.assign(fresh().stats, s.stats || {}), endless: Object.assign(fresh().endless, s.endless || {}), rec: s.rec || {}, dailyHist: s.dailyHist || {}, claimed: s.claimed || {}, cos: s.cos || [], prep: Object.assign({stars:{}, best:{}}, s.prep || {}), titles: s.titles || [], decor: Object.assign(fresh().decor, s.decor || {})});
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.stats) save = loadSave(s); } catch(e){}
if (!save.tutDone && (save.stars["1-1"] || 0) >= 1) save.tutDone = true;
// プロフィール（個人情報なし）。店主IDはランキングを作るときの目印として、この端末で1回だけ作る
function newId(){ const a = new Uint8Array(6); (crypto.getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random()*256)); const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let t = ""; a.forEach(v => t += abc[v % 32]); return t.slice(0,3) + "-" + t.slice(3); }
function ensureProfile(){ if (!save.profile) save.profile = {id: newId(), shop: "", name: "", msg: "", g: 0, wear: 0, acc: "none", fit: "plain", fav: 2, since: Date.now(), set: false}; if (!save.profile.since) save.profile.since = Date.now();
  const first = Math.min(...Object.values(save.trophies || {}).filter(v => typeof v === "number"), save.profile.since); save.profile.since = first; }
ensureProfile(); // 前から遊んでいる人はチュートリアル済み
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch(e){} };
// 以前の「空き瓶を増やす」強化は、ステージ中に買う形に変えたので払い戻す
if (save.upg.spare){ save.wallet += [0, 800, 3200][Math.min(2, save.upg.spare)]; delete save.upg.spare; persist(); }
const upg = id => save.upg[id] || 0;
const yen = n => "¥" + Math.round(n).toLocaleString();
