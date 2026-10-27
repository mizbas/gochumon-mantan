// ご注文は満タンで：ゲームのデータ（色・ワールド・ステージ・ショップの品・ほうびなど）
"use strict";
const $ = id => document.getElementById(id);
const COLORS = ["#e63946","#f6c945","#3a6ee8","#2fae74","#f06aa8","#9b5de5","#f4842d","#3cc6e4"];
const CNAME  = ["赤","黄","青","緑","桃","紫","橙","水"];
const CAP = 4;

/* ステージ表：色数・注文の本数・席・お客さんの人数・待てる時間(秒)・棚の瓶・空き瓶・目標・？の色・急ぎの客の割合 */
const WORLDS = [
  {w:1, name:"夜のバー",       note:""},
  {w:2, name:"昼下がりのカフェ", note:"瓶の下のほうの色が「？」で隠れています。上の色を注ぎ出すと見えます。"},
  {w:3, name:"夏祭りの屋台",   note:"「急ぎ」のお客さんが来ます。待てる時間は短いけれど、代金は1.4倍。"},
  {w:4, name:"雪山のロッジ",   note:"ときどき<b>寒波</b>が来て、瓶が1本凍ります。凍った瓶は注ぐことも注がれることもできません（3秒前に「寒波が来る！」と出るので、中身を注ぎ出して逃がすこともできます）。満タン瓶を1本渡すか、10秒たつと溶けます。"},
  {w:6, name:"ホテルのカクテルバー", note:"棚の端に<b>カクテルグラス</b>があります。グラスにはどの色でも<b>1杯ずつ</b>注げます。カクテルの注文は、下から順に層の色が決まっています。注文どおりに重ねると自動でお出しして、高い代金がもらえます。順番を間違えたら、グラスを選んで流しへ。"},
  {w:7, name:"屋上のビアガーデン", note:"<b>予約制</b>のお店です。上の<b>予約ボード</b>に、次に来る2人の注文が先に出ます。先回りして満タン瓶を用意しておき、お客さんが来てすぐ出せると<b>予約ボーナス</b>（代金1.3倍）。"},
  {w:8, name:"からくり時計のバー", note:"<b>カギのかかった瓶</b>があります。カギと同じ色の満タン瓶をお客さんに渡すと開きます（30秒たっても開きます）。ときどき別の瓶にもカギがかかります（3秒前に予告）。開くまでは注ぐことも注がれることもできません。"},
  {w:9, name:"月夜の灯台カフェ", note:"ときどき<b>停電</b>します。暗い間は瓶の色が見えません。<b>灯台の光</b>が当たった瓶だけ色が見えます。停電の前に色を覚えておこう。後半はこれまでのお店のしかけが勢ぞろいします。"},
  {w:5, name:"港町の酒場",     note:"仕入れは回数に限りがあります（残り回数は仕入れ台に表示）。「団体さん」は2色を2本ずつ、満タン瓶4本の大口注文で、待てる時間は長く、代金は2倍。"},
];
WORLDS.sort((a, b) => a.w - b.w);
const STAGES = [
  {w:1, colors:3, ord:[1,1], seats:2, guests:6,  pat:60, shelf:3, spare:2, goal:700},
  {w:1, colors:3, ord:[1,2], seats:2, guests:8,  pat:55, shelf:3, spare:2, goal:1400},
  {w:1, colors:4, ord:[1,2], seats:3, guests:9,  pat:52, shelf:4, spare:2, goal:1600},
  {w:1, colors:4, ord:[1,2], seats:3, guests:10, pat:50, shelf:4, spare:2, goal:1800},
  {w:1, colors:5, ord:[1,2], seats:3, guests:10, pat:46, shelf:5, spare:2, goal:2100},
  {w:1, colors:5, ord:[1,3], seats:3, guests:11, pat:48, shelf:5, spare:2, goal:2300},
  {w:1, colors:6, ord:[1,3], seats:3, guests:11, pat:52, shelf:6, spare:2, goal:2500},
  {w:1, colors:6, ord:[2,3], seats:3, guests:10, pat:58, shelf:6, spare:2, goal:3000},
  {w:2, colors:4, ord:[1,2], seats:3, guests:8,  pat:58, shelf:4, spare:2, goal:1400, hide:true},
  {w:2, colors:4, ord:[1,2], seats:3, guests:9,  pat:56, shelf:4, spare:2, goal:1500, hide:true},
  {w:2, colors:5, ord:[1,2], seats:3, guests:9,  pat:55, shelf:5, spare:2, goal:1700, hide:true},
  {w:2, colors:5, ord:[1,2], seats:3, guests:10, pat:54, shelf:5, spare:2, goal:2000, hide:true},
  {w:2, colors:5, ord:[1,3], seats:3, guests:10, pat:55, shelf:5, spare:2, goal:2200, hide:true},
  {w:2, colors:6, ord:[1,3], seats:3, guests:10, pat:57, shelf:6, spare:2, goal:2400, hide:true},
  {w:2, colors:6, ord:[1,3], seats:3, guests:11, pat:57, shelf:6, spare:2, goal:2500, hide:true},
  {w:2, colors:6, ord:[2,3], seats:3, guests:9,  pat:70, shelf:6, spare:2, goal:2800, hide:true},
  {w:3, colors:5, ord:[1,2], seats:3, guests:9,  pat:52, shelf:5, spare:2, goal:2200, rush:.25},
  {w:3, colors:5, ord:[1,2], seats:3, guests:10, pat:50, shelf:5, spare:2, goal:2600, rush:.3},
  {w:3, colors:6, ord:[1,2], seats:3, guests:10, pat:52, shelf:6, spare:2, goal:2800, rush:.3},
  {w:3, colors:6, ord:[1,3], seats:3, guests:10, pat:54, shelf:6, spare:2, goal:3000, rush:.3},
  {w:3, colors:6, ord:[1,3], seats:3, guests:11, pat:56, shelf:6, spare:2, goal:3200, rush:.3, hide:true},
  {w:3, colors:7, ord:[1,3], seats:3, guests:11, pat:56, shelf:7, spare:2, goal:3700, rush:.3},
  {w:3, colors:7, ord:[1,3], seats:3, guests:12, pat:58, shelf:7, spare:2, goal:4000, rush:.35, hide:true},
  {w:3, colors:7, ord:[2,3], seats:3, guests:11, pat:64, shelf:7, spare:2, goal:4300, rush:.35, hide:true},
  {w:4, colors:5, ord:[1,2], seats:3, guests:9,  pat:56, shelf:5, spare:2, goal:2400, ice:[1]},
  {w:4, colors:5, ord:[1,2], seats:3, guests:10, pat:55, shelf:5, spare:2, goal:2600, ice:[2]},
  {w:4, colors:6, ord:[1,2], seats:3, guests:10, pat:56, shelf:6, spare:2, goal:2700, ice:[2]},
  {w:4, colors:6, ord:[1,3], seats:3, guests:10, pat:62, shelf:6, spare:2, goal:2900, ice:[1,2]},
  {w:4, colors:6, ord:[1,3], seats:3, guests:11, pat:58, shelf:6, spare:2, goal:3100, ice:[2], hide:true},
  {w:4, colors:7, ord:[1,3], seats:3, guests:11, pat:58, shelf:7, spare:2, goal:3200, ice:[1,2]},
  {w:4, colors:7, ord:[1,3], seats:3, guests:11, pat:58, shelf:7, spare:2, goal:3400, ice:[2,2], rush:.3},
  {w:4, colors:7, ord:[2,3], seats:3, guests:10, pat:66, shelf:7, spare:2, goal:3600, ice:[2,3], hide:true},
  {w:5, colors:5, ord:[1,2], seats:3, guests:9,  pat:56, shelf:5, spare:2, goal:3100, supply:26, vip:.15},
  {w:5, colors:5, ord:[1,2], seats:3, guests:10, pat:55, shelf:5, spare:2, goal:3200, supply:28, vip:.2},
  {w:5, colors:6, ord:[1,2], seats:3, guests:10, pat:56, shelf:6, spare:2, goal:3400, supply:30, vip:.2},
  {w:5, colors:6, ord:[1,3], seats:3, guests:10, pat:64, shelf:6, spare:2, goal:3600, supply:32, vip:.2, rush:.2},
  {w:5, colors:6, ord:[1,3], seats:3, guests:11, pat:64, shelf:6, spare:2, goal:3600, supply:34, vip:.2, hide:true},
  {w:5, colors:7, ord:[1,3], seats:3, guests:11, pat:64, shelf:7, spare:2, goal:3800, supply:36, vip:.25, ice:[1,2]},
  {w:5, colors:7, ord:[1,3], seats:3, guests:12, pat:64, shelf:7, spare:2, goal:4000, supply:38, vip:.25, rush:.25, hide:true},
  {w:5, colors:7, ord:[2,3], seats:3, guests:11, pat:72, shelf:7, spare:2, goal:4200, supply:36, vip:.3, ice:[2,3], hide:true},
  {w:6, colors:5, ord:[1,2], seats:3, guests:9,  pat:62, shelf:5, spare:2, goal:2500, cocktail:.3,  cockLen:[3,3]},
  {w:6, colors:5, ord:[1,2], seats:3, guests:10, pat:62, shelf:5, spare:2, goal:2900, cocktail:.35, cockLen:[3,3]},
  {w:6, colors:6, ord:[1,2], seats:3, guests:10, pat:62, shelf:6, spare:2, goal:3500, cocktail:.35, cockLen:[3,4]},
  {w:6, colors:6, ord:[1,3], seats:3, guests:11, pat:64, shelf:6, spare:2, goal:3900, cocktail:.4,  cockLen:[3,4]},
  {w:6, colors:6, ord:[1,3], seats:3, guests:11, pat:64, shelf:6, spare:2, goal:4000, cocktail:.4,  cockLen:[3,4], hide:true},
  {w:6, colors:7, ord:[1,3], seats:3, guests:11, pat:64, shelf:7, spare:2, goal:4300, cocktail:.4,  cockLen:[4,4], rush:.2},
  {w:6, colors:7, ord:[1,3], seats:3, guests:12, pat:66, shelf:7, spare:2, goal:4600, cocktail:.45, cockLen:[4,4], ice:[1,2]},
  {w:6, colors:7, ord:[2,3], seats:3, guests:12, pat:72, shelf:7, spare:2, goal:5000, cocktail:.5,  cockLen:[4,4], hide:true, vip:.2},
  {w:7, colors:6, ord:[1,2], seats:3, guests:10, pat:60, shelf:6, spare:2, goal:3600, reserve:true},
  {w:7, colors:6, ord:[1,2], seats:3, guests:11, pat:58, shelf:6, spare:2, goal:3900, reserve:true},
  {w:7, colors:6, ord:[1,3], seats:3, guests:11, pat:60, shelf:6, spare:2, goal:4100, reserve:true},
  {w:7, colors:7, ord:[1,3], seats:3, guests:11, pat:60, shelf:7, spare:2, goal:4400, reserve:true},
  {w:7, colors:7, ord:[1,3], seats:3, guests:12, pat:60, shelf:7, spare:2, goal:4700, reserve:true, rush:.25},
  {w:7, colors:7, ord:[1,3], seats:3, guests:12, pat:62, shelf:7, spare:2, goal:4900, reserve:true, hide:true},
  {w:7, colors:7, ord:[2,3], seats:3, guests:12, pat:66, shelf:7, spare:2, goal:5100, reserve:true, rush:.3},
  {w:7, colors:8, ord:[2,3], seats:3, guests:12, pat:70, shelf:8, spare:2, goal:5400, reserve:true, hide:true},
  {w:8, colors:6, ord:[1,2], seats:3, guests:10, pat:62, shelf:6, spare:2, goal:3800, lock:1},
  {w:8, colors:6, ord:[1,2], seats:3, guests:11, pat:62, shelf:6, spare:2, goal:4000, lock:1, relock:true},
  {w:8, colors:6, ord:[1,3], seats:3, guests:11, pat:64, shelf:6, spare:2, goal:4300, lock:2},
  {w:8, colors:7, ord:[1,3], seats:3, guests:11, pat:64, shelf:7, spare:2, goal:4500, lock:1, relock:true},
  {w:8, colors:7, ord:[1,3], seats:3, guests:12, pat:64, shelf:7, spare:2, goal:4800, lock:2, relock:true, hide:true},
  {w:8, colors:7, ord:[1,3], seats:3, guests:12, pat:64, shelf:7, spare:2, goal:5000, lock:1, relock:true, rush:.25},
  {w:8, colors:7, ord:[2,3], seats:3, guests:12, pat:68, shelf:7, spare:2, goal:5200, lock:2, relock:true, ice:[1]},
  {w:8, colors:8, ord:[2,3], seats:3, guests:12, pat:72, shelf:8, spare:2, goal:5600, lock:2, relock:true, hide:true},
  {w:9, colors:6, ord:[1,2], seats:3, guests:10, pat:62, shelf:6, spare:2, goal:4000, dark:true},
  {w:9, colors:6, ord:[1,3], seats:3, guests:11, pat:62, shelf:6, spare:2, goal:4200, dark:true},
  {w:9, colors:7, ord:[1,3], seats:3, guests:11, pat:64, shelf:7, spare:2, goal:4500, dark:true, hide:true},
  {w:9, colors:7, ord:[1,3], seats:3, guests:12, pat:64, shelf:7, spare:2, goal:4800, dark:true, reserve:true},
  {w:9, colors:7, ord:[1,3], seats:3, guests:12, pat:64, shelf:7, spare:2, goal:5000, dark:true, lock:1, relock:true},
  {w:9, colors:7, ord:[1,3], seats:3, guests:12, pat:66, shelf:7, spare:2, goal:5100, dark:true, ice:[1,2], rush:.25},
  {w:9, colors:7, ord:[1,3], seats:3, guests:12, pat:68, shelf:7, spare:2, goal:5400, dark:true, cocktail:.35, cockLen:[3,4], reserve:true},
  {w:9, colors:8, ord:[2,3], seats:3, guests:12, pat:74, shelf:8, spare:2, goal:5800, dark:true, lock:1, relock:true, hide:true, reserve:true, vip:.2},
];
STAGES.forEach(st => { const n = STAGES.filter(x => x.w === st.w).indexOf(st) + 1; st.id = st.w + "-" + n; st.n = n; });
const STORE_MAX = 3, RACK_COST = [200, 400], BUY_COST = [300, 600];
let storeCap = 1, paused = false, pendingStore = -1, sandUsed = false;
const storeMax = () => has("rack") ? 4 : STORE_MAX;
const RACK_COST_ALL = [200, 400, 800];
const PRICE = 150, DUMP_COST = 10, SUPPLY_COST = 60;
// 1回の営業の家賃・光熱費（目標の15%くらい）
const rentOf = st => st.mode === "endless" ? 300 : Math.round(st.goal*.15/50)*50;
let expSupply = 0;
const UPG = [
  {id:"pat",    name:"くつろげる椅子",   desc:"お客さんの待てる時間 +12%。椅子がどんどん豪華に",        max:6, cost:[400, 1000, 2000, 4000, 7000, 12000]},
  {id:"price",  name:"上等なお酒",       desc:"1本あたりの値段 +10%。壁の棚に高いお酒が並ぶ",              max:8, cost:[500, 1200, 2500, 4500, 8000, 14000, 22000, 35000]},
  {id:"tip",    name:"笑顔の接客",       desc:"早く出したときのチップ +10%。カウンターに花が増える",       max:5, cost:[400, 1000, 2500, 5000, 9000]},
  {id:"refill", name:"仕入れの目利き",   desc:"仕入れる瓶に入っている色の種類が少なくなる", max:2, cost:[700, 2000]},
];
const BOTTLES = [
  {id:"classic", name:"定番の瓶",       cost:0},
  {id:"flask",   name:"三角フラスコ",   cost:1500},
  {id:"tube",    name:"試験管",         cost:2500},
  {id:"square",  name:"角瓶",           cost:4000},
  {id:"gold",    name:"金の瓶",         cost:120000, rank:12},
  {id:"crystal", name:"クリスタルの瓶", cost:250000, rank:15},
];
const SPECIAL = [
  {id:"cat",    ic:"🐈", name:"看板ねこ",       desc:"カウンターに猫が座ります。チップ +20%",              cost:30000,  rank:7},
  {id:"spout",  ic:"✨", name:"金の注ぎ口",     desc:"注ぐ速さが1.5倍に",                                  cost:50000,  rank:9},
  {id:"ledger", ic:"📒", name:"目利きの帳面",   desc:"仕入れ台で3本先まで中身が見える",                    cost:60000,  rank:10},
  {id:"rack",   ic:"🗄️", name:"大きな保管棚",   desc:"保管棚が最初から2つ（最大4つまで増やせる）",         cost:90000,  rank:11},
  {id:"juke",   ic:"🎵", name:"ジュークボックス", desc:"連続ボーナスの上限が2倍→3倍に",                    cost:150000, rank:13},
  {id:"sand",   ic:"⏳", name:"魔法の砂時計",   desc:"1ステージに1回、待っている全員の待ち時間を+10秒",    cost:200000, rank:14},
  {id:"branch", ic:"🏪", name:"二号店の看板",   desc:"毎回の売上の10%が「評判ボーナス」として財布に入る",  cost:300000, rank:16},
];
const ROOMS = [
  {id:"walnut", name:"木のバー",         cost:0,    wall:["#5a3a24","#2a1b12","#140e0b"], counter:"#6a4129", ctop:"#8a5a3a", under:"#24170f", shelf:"#5b3c27", stop:"#7a5436", chair:"rgba(0,0,0,.25)"},
  {id:"marble", name:"大理石のラウンジ", cost:2000, wall:["#6b6a72","#34333a","#1a1a1f"], counter:"#d9d4cc", ctop:"#f4f1ea", under:"#26252b", shelf:"#8d8a86", stop:"#bdb8b0", chair:"rgba(0,0,0,.3)"},
  {id:"neon",   name:"ネオンの夜",       cost:3500, wall:["#5b2a7a","#22123a","#0d0818"], counter:"#2a2140", ctop:"#e94fd0", under:"#120b1f", shelf:"#3a2f5c", stop:"#4fd8e9", chair:"rgba(233,79,208,.18)"},
  {id:"wafu",   name:"和の酒場",         cost:5000, wall:["#6b4a2a","#3a2a1a","#1a120b"], counter:"#c49a5c", ctop:"#e2c08a", under:"#2a1d12", shelf:"#8a6a3e", stop:"#b08a52", chair:"rgba(30,60,40,.35)"},
  {id:"palace", name:"宮殿のバー",       cost:300000, rank:17, wall:["#8a2a3a","#4a1020","#1e050c"], counter:"#c9a03a", ctop:"#f3d77a", under:"#2a0a12", shelf:"#9a7a2a", stop:"#f3d77a", chair:"rgba(243,215,122,.18)"},
  {id:"space",  name:"宇宙のバー",       cost:500000, rank:20, wall:["#24305e","#0e1430","#04060f"], counter:"#3a4670", ctop:"#8fd3f4", under:"#0a0e20", shelf:"#2a3560", stop:"#8fd3f4", chair:"rgba(143,211,244,.15)"},
];
// ランク：累計売上で 1〜30。数ランクごとに称号が変わる
const RANK_MAX = 30;
// 後半ほど急に重くなる：全ステージを一通りクリアしてランク14〜15、最高ランク30は累計約410万円
const rankReq = n => n <= 1 ? 0 : Math.round(400*Math.pow(n-1, 2)*Math.pow(1.09, n-1)/100)*100;
const rankOf = total => { let r = 1; while (r < RANK_MAX && total >= rankReq(r+1)) r++; return r; };
const rankReward = n => Math.max(150*n, Math.round((rankReq(n) - rankReq(n-1))*.05/50)*50);
const TITLES = [[1,"見習い"],[3,"新人バーテンダー"],[6,"一人前のバーテンダー"],[9,"シェイカーの達人"],[12,"名店の店長"],[15,"街の人気者"],[18,"満タン職人"],[21,"伝説のマスター"],[25,"満タンの神様"],[30,"永遠の看板"]];
const titleOfRank = r => { let t = TITLES[0][1]; for (const [n, name] of TITLES) if (r >= n) t = name; return t; };
const has = id => (save.special || []).includes(id);
/* ---------- インテリア（ごほうびでもらえる。天井・壁・カウンターに1つずつ飾れる） ---------- */
const SLOTS = [["ceil","天井"],["wall","壁"],["counter","カウンター"]];
const DECOR = [
  {id:"lights",     slot:"ceil",    name:"きらきらライト"},
  {id:"garland",    slot:"ceil",    name:"旗のガーランド"},
  {id:"chandelier", slot:"ceil",    name:"金のシャンデリア"},
  {id:"mobile",     slot:"ceil",    name:"星のモビール"},
  {id:"clock",      slot:"wall",    name:"振り子時計"},
  {id:"painting",   slot:"wall",    name:"夕焼けの絵"},
  {id:"darts",      slot:"wall",    name:"ダーツボード"},
  {id:"calendar",   slot:"wall",    name:"日めくりカレンダー"},
  {id:"record",     slot:"wall",    name:"金のレコード"},
  {id:"plaque",     slot:"wall",    name:"満タン賞の盾"},
  {id:"neonsign",   slot:"wall",    name:"「満タン」ネオンサイン"},
  {id:"plant",      slot:"counter", name:"観葉植物"},
  {id:"register",   slot:"counter", name:"レトロなレジ"},
  {id:"lamp",       slot:"counter", name:"ランプ"},
  {id:"globe",      slot:"counter", name:"地球儀"},
  {id:"maneki",     slot:"counter", name:"金の招き猫"},
  {id:"alembic",    slot:"counter", name:"仕込みの蒸留器"},
];
// 到達ほうび：それぞれ1回だけ。何度到達しても2回目はない
const REWARDS = [
  {id:"el3",   k:"elv",  v:3,     give:{decor:"lights"}},
  {id:"el4",   k:"elv",  v:4,     give:{cos:"fit:stripe"}},
  {id:"el6",   k:"elv",  v:6,     give:{cos:"acc:star"}},
  {id:"el8",   k:"elv",  v:8,     give:{cos:"ava:8"}},
  {id:"el18",  k:"elv",  v:18,    give:{cos:"ava:13"}},
  {id:"el5",   k:"elv",  v:5,     give:{money:3000}},
  {id:"el7",   k:"elv",  v:7,     give:{decor:"darts"}},
  {id:"el10",  k:"elv",  v:10,    give:{decor:"clock", title:"眠らない店主"}},
  {id:"el12",  k:"elv",  v:12,    give:{money:10000}},
  {id:"el15",  k:"elv",  v:15,    give:{decor:"chandelier", title:"不夜城の主"}},
  {id:"el20",  k:"elv",  v:20,    give:{decor:"maneki", title:"伝説の夜番"}},
  {id:"el25",  k:"elv",  v:25,    give:{money:30000, title:"夜明けまで満タン"}},
  {id:"el30",  k:"elv",  v:30,    give:{money:50000, title:"満タンの神話"}},
  {id:"em5",   k:"emon", v:5000,  give:{decor:"plant"}},
  {id:"em15",  k:"emon", v:15000, give:{cos:"acc:hearts"}},
  {id:"em40",  k:"emon", v:40000, give:{cos:"ava:11"}},
  {id:"em60",  k:"emon", v:60000, give:{cos:"fit:kimono"}},
  {id:"em100", k:"emon", v:100000, give:{cos:"acc:halo"}},
  {id:"em10",  k:"emon", v:10000, give:{money:2000}},
  {id:"em20",  k:"emon", v:20000, give:{decor:"painting"}},
  {id:"em30",  k:"emon", v:30000, give:{money:8000}},
  {id:"em50",  k:"emon", v:50000, give:{decor:"record", title:"エンドレスの帝王"}},
  {id:"em80",  k:"emon", v:80000, give:{decor:"mobile", money:20000}},
  {id:"em150", k:"emon", v:150000, give:{money:30000}},
  {id:"em200", k:"emon", v:200000, give:{decor:"neonsign", title:"エンドレスの覇者"}},
  {id:"rk5",   k:"rank", v:5,     give:{decor:"garland"}},
  {id:"rk10",  k:"rank", v:10,    give:{decor:"register"}},
  {id:"rk15",  k:"rank", v:15,    give:{decor:"lamp"}},
  {id:"rk20",  k:"rank", v:20,    give:{decor:"globe"}},
  {id:"rk30",  k:"rank", v:30,    give:{decor:"plaque", title:"満タンの伝説"}},
  {id:"pp8",   k:"prep", v:8,     give:{cos:"fit:lab"}},
  {id:"pp24",  k:"prep", v:24,    give:{cos:"acc:monocle"}},
  {id:"pp40",  k:"prep", v:40,    give:{decor:"alembic", title:"仕込みの名人"}},
  {id:"pp60",  k:"prep", v:60,    give:{money:20000}},
  {id:"pp80",  k:"prep", v:80,    give:{money:30000, title:"満タンの錬金術師"}},
  {id:"dy1",   k:"day",  v:1,     give:{cos:"ava:9"}},
  {id:"dy3",   k:"day",  v:3,     give:{title:"今日のおすすめ担当"}},
  {id:"dy5",   k:"day",  v:5,     give:{cos:"acc:flower"}},
  {id:"dy10",  k:"day",  v:10,    give:{cos:"ava:10"}},
  {id:"dy20",  k:"day",  v:20,    give:{cos:"fit:happi"}},
  {id:"dy7",   k:"day",  v:7,     give:{decor:"calendar"}},
  {id:"dy14",  k:"day",  v:14,    give:{money:10000}},
  {id:"dy30",  k:"day",  v:30,    give:{title:"毎日が特別営業"}},
];
const KNAME = {prep: v => `仕込みを${v}問クリア`, elv: v => `エンドレス レベル${v}`, emon: v => `エンドレス 売上${yen(v)}`, rank: v => `ランク${v}`, day: v => `日替わりの目標を${v}日達成`};
const cosOfKey = k => { const [t, id] = k.split(":"); return cosFind(t, t === "ava" ? +id : id); };
const giveText = g => [g.cos && `着せかえ「${cosName(cosOfKey(g.cos))}」`, g.decor && `インテリア「${DECOR.find(d => d.id === g.decor).name}」`, g.title && `称号「${g.title}」`, g.money && yen(g.money)].filter(Boolean).join("＋");
function claim(k, val){
  const got = [];
  REWARDS.forEach(r => { if (r.k !== k || val < r.v || save.claimed[r.id]) return;
    save.claimed[r.id] = Date.now(); const g = r.give;
    if (g.money) save.wallet += g.money;
    if (g.decor && !save.decor.owned.includes(g.decor)) save.decor.owned.push(g.decor);
    if (g.cos && !save.cos.includes(g.cos)) save.cos.push(g.cos);
    if (g.title && !save.titles.includes(g.title)) save.titles.push(g.title);
    got.push(r); toastQ.push({ic:"🎁", name: giveText(g), sub: `${KNAME[k](r.v)} のほうび`}); });
  if (got.length){ persist(); runToast(); }
  return got;
}
function titleShown(){ const r = rankOf(save.total), own = TITLES.filter(([n]) => n <= r).map(t => t[1]).concat(save.titles || []);
  return save.titleSel && own.includes(save.titleSel) ? save.titleSel : titleOfRank(r); }
const TROPHIES = [
  {id:"first",   ic:"🥂", name:"はじめてのお客さん", desc:"お客さんの注文に1回応える",  ok: s => s.stats.served >= 1},
  {id:"c5",      ic:"🔥", name:"5連続",              desc:"5人続けて満足させる",        ok: s => s.stats.maxCombo >= 5},
  {id:"c15",     ic:"🔥", name:"15連続",             desc:"15人続けて満足させる",       ok: s => s.stats.maxCombo >= 15},
  {id:"allhappy",ic:"😊", name:"全員満足",           desc:"1人も帰さずにステージを終える", ok: s => s.stats.allHappy >= 1},
  {id:"star3",   ic:"⭐", name:"3つ星",              desc:"どこかのステージで★3",       ok: s => Object.values(s.stars).some(v => v >= 3)},
  {id:"w1",      ic:"🏁", name:"ワールド1制覇",      desc:"1-8 をクリアする",           ok: s => (s.stars["1-8"]||0) >= 1},
  {id:"w1all",   ic:"👑", name:"夜のバーの主",       desc:"ワールド1をすべて★3",        ok: s => STAGES.filter(x => x.w === 1).every(x => (s.stars[x.id]||0) >= 3)},
  {id:"w2",      ic:"☕", name:"カフェ制覇",          desc:"2-8 をクリアする",           ok: s => (s.stars["2-8"]||0) >= 1},
  {id:"w3",      ic:"🏮", name:"お祭り制覇",          desc:"3-8 をクリアする",           ok: s => (s.stars["3-8"]||0) >= 1},
  {id:"w4",      ic:"❄️", name:"ロッジ制覇",          desc:"4-8 をクリアする",           ok: s => (s.stars["4-8"]||0) >= 1},
  {id:"w7",      ic:"🍺", name:"ビアガーデン制覇",    desc:"7-8 をクリアする",           ok: s => (s.stars["7-8"]||0) >= 1},
  {id:"w8",      ic:"🔑", name:"からくり制覇",        desc:"8-8 をクリアする",           ok: s => (s.stars["8-8"]||0) >= 1},
  {id:"w9",      ic:"🌙", name:"灯台制覇",            desc:"9-8 をクリアする（全ステージ制覇）", ok: s => (s.stars["9-8"]||0) >= 1},
  {id:"w6",      ic:"🍸", name:"カクテル制覇",        desc:"6-8 をクリアする",           ok: s => (s.stars["6-8"]||0) >= 1},
  {id:"w5",      ic:"⚓", name:"港町制覇",            desc:"5-8 をクリアする",           ok: s => (s.stars["5-8"]||0) >= 1},
  {id:"s100",    ic:"🍾", name:"100本出荷",          desc:"満タンの瓶を累計100本渡す",  ok: s => s.stats.bottles >= 100},
  {id:"rich",    ic:"💰", name:"売上5万円",          desc:"累計売上 ¥50,000",           ok: s => s.total >= 50000},
  {id:"r10",     ic:"🥉", name:"ランク10",           desc:"ランク10になる",             ok: s => rankOf(s.total) >= 10},
  {id:"r20",     ic:"🥈", name:"ランク20",           desc:"ランク20になる",             ok: s => rankOf(s.total) >= 20},
  {id:"r30",     ic:"🥇", name:"ランク30",           desc:"最高ランクになる",           ok: s => rankOf(s.total) >= 30},
  {id:"special", ic:"🌟", name:"すごいもの",         desc:"「特別」の品を全部そろえる",   ok: s => SPECIAL.every(x => (s.special||[]).includes(x.id))},
  {id:"maxup",   ic:"🛠️", name:"こだわりの店",       desc:"強化をひとつ最大にする",     ok: s => UPG.some(u => (s.upg[u.id]||0) >= u.max)},
  {id:"fashion", ic:"🎨", name:"おしゃれ好き",       desc:"スキンを3つ買う",            ok: s => s.owned.length - 2 >= 3},
  {id:"end5",    ic:"🌙", name:"夜ふかし営業",       desc:"エンドレス営業でレベル5",     ok: s => (s.endless||{}).lv >= 5},
  {id:"end10",   ic:"🌌", name:"眠らない店",         desc:"エンドレス営業でレベル10",    ok: s => (s.endless||{}).lv >= 10},
  {id:"end15",   ic:"🌠", name:"不夜城",             desc:"エンドレス営業でレベル15",    ok: s => (s.endless||{}).lv >= 15},
  {id:"daily1",  ic:"📅", name:"今日のおすすめ",     desc:"日替わり特別営業で目標達成",   ok: s => (s.dailyClears||0) >= 1},
  {id:"cos10",   ic:"👕", name:"おしゃれ店主",       desc:"着せかえアイテムを10個そろえる", ok: s => COS.filter(c => c.src !== "free" && cosOwned(c)).length >= 10},
  {id:"prep1",   ic:"🧪", name:"はじめての仕込み",   desc:"仕込みを1問クリア",          ok: s => Object.keys((s.prep||{}).stars||{}).length >= 1},
  {id:"prep3",   ic:"⚗️", name:"仕込みの達人",       desc:"仕込みを30問★3",             ok: s => Object.values((s.prep||{}).stars||{}).filter(v => v >= 3).length >= 30},
  {id:"daily7",  ic:"🗓️", name:"常連さん",           desc:"日替わりの目標を7日達成",      ok: s => (s.dailyClears||0) >= 7},
];
