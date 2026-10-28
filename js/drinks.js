// ご注文は満タンで：飲み物の名前と見た目（ワールドごと・イベントごと）
// 色の番号（0赤 1黄 2青 3緑 4桃 5紫 6橙 7水）ごとに「名前|短い名前|模様」
// 模様：fizz=炭酸の泡 / foam=層の上に泡の帯（どの位置でも） / steam=湯気 / pulp=つぶ / milk=ミルクのうず / sparkle=きらきら / boil=ぶくぶく / （空）=なし
const DRINKS = {
  w1: "赤ワイン|ワイン|,レモンサワー|サワー|fizz,ブルーハワイ|ハワイ|sparkle,ミントジュレップ|ミント|pulp,ピーチフィズ|ピーチ|fizz,カシスソーダ|カシス|fizz,スクリュードライバー|スクリュ|pulp,ジントニック|ジン|fizz",
  w2: "いちごミルク|いちご|milk,はちみつレモン|はちみつ|,バタフライピー|ピー|,抹茶ラテ|抹茶|foam,さくらラテ|さくら|foam,ぶどうジュース|ぶどう|,オレンジジュース|オレンジ|pulp,クリームソーダ|ソーダ|fizz",
  w3: "いちご水|いちご|pulp,レモネード|レモン|fizz,ブルーハワイ|ハワイ|sparkle,メロンソーダ|メロン|fizz,もも水|もも|pulp,ぶどうラムネ|ぶどう|fizz,みかん水|みかん|pulp,ラムネ|ラムネ|fizz",
  w4: "ホットワイン|ワイン|steam,ホットレモン|レモン|steam,ベリーティー|ベリー|steam,ハーブティー|ハーブ|steam,いちごココア|ココア|foam,ホットカシス|カシス|steam,しょうが湯|しょうが|steam,雪どけ水|雪水|sparkle",
  w5: "ラム酒|ラム|,ビール|ビール|foam,ブルーキュラソー|キュラソ|,モヒート|モヒート|pulp,いちご酒|いちご|,ぶどう酒|ぶどう|,オレンジエール|エール|foam,海の水割り|水割り|sparkle",
  w6: "コスモポリタン|コスモ|,シャンパン|シャンパ|fizz,ブルーラグーン|ラグーン|sparkle,グラスホッパー|グラス|milk,ピンクレディ|ピンク|foam,バイオレットフィズ|すみれ|fizz,マイタイ|マイタイ|pulp,ジンフィズ|ジン|fizz",
  w7: "レッドアイ|レッド|foam,生ビール|ビール|foam,ブルーソーダ|ソーダ|fizz,青りんごサワー|りんご|fizz,ピーチビール|ピーチ|foam,ぶどうサワー|ぶどう|fizz,みかんサワー|みかん|fizz,ハイボール|ハイボ|fizz",
  w8: "ルビーの酒|ルビー|sparkle,こはくの蜜酒|こはく|sparkle,サファイアの酒|サファ|sparkle,エメラルドの酒|エメラ|sparkle,ローズの酒|ローズ|,アメジストの酒|アメジ|sparkle,トパーズの酒|トパーズ|sparkle,水晶の水|水晶|sparkle",
  w9: "夕焼けティー|夕焼け|,月のはちみつ|月蜜|sparkle,夜空ソーダ|夜空|sparkle,森のハーブティー|ハーブ|,星くずミルク|星くず|milk,ラベンダーティー|ラベンダ|,灯台オレンジ|灯台|pulp,海のしずく|しずく|sparkle",
  newyear: "梅酒|梅酒|,ゆず湯|ゆず|steam,藍の水|藍水|,抹茶|抹茶|foam,桜湯|桜湯|steam,黒豆茶|黒豆|steam,みかん酒|みかん|pulp,お屠蘇|屠蘇|sparkle",
  valentine: "ベリーショコラ|ベリー|milk,ハニーミルク|ハニー|milk,ブルーキッス|キッス|sparkle,ミントショコラ|ミント|milk,いちごショコラ|いちご|milk,カシスショコラ|カシス|milk,オレンジショコラ|オレンジ|pulp,恋のソーダ|恋ソーダ|fizz",
  hina: "梅ジュース|梅|,菜の花ティー|菜の花|,ひなソーダ|ソーダ|fizz,よもぎ茶|よもぎ|,桃の甘酒|甘酒|milk,すみれ茶|すみれ|,あられ茶|あられ|pulp,白酒|白酒|milk",
  hanami: "花見酒|花見酒|,菜の花茶|菜の花|,夜桜ソーダ|夜桜|sparkle,抹茶ラテ|抹茶|foam,桜ラテ|桜|foam,藤の花茶|藤|,春みかん|みかん|pulp,花びらソーダ|花びら|fizz",
  kodomo: "いちごミルク|いちご|milk,バナナジュース|バナナ|milk,こいのぼりソーダ|こいソーダ|fizz,メロンソーダ|メロン|fizz,ピーチジュース|ピーチ|,ぶどうジュース|ぶどう|,オレンジジュース|オレンジ|pulp,ラムネ|ラムネ|fizz",
  tsuyu: "梅シロップ|梅|,レモンスカッシュ|レモン|fizz,あじさいソーダ|あじさい|fizz,新茶|新茶|,ピンクあじさい|ピンク|,あじさいティー|紫陽花|,あんずジュース|あんず|pulp,雨つぶソーダ|雨つぶ|fizz",
  tanabata: "織姫ベリー|織姫|,星のはちみつ|星蜜|sparkle,天の川|天の川|sparkle,笹の葉茶|笹茶|,彦星ピーチ|彦星|,夜空のぶどう|夜空|sparkle,流れ星|流れ星|sparkle,銀河ソーダ|銀河|sparkle",
  natsu: "いちごかき氷|いちご|pulp,レモンかき氷|レモン|pulp,ブルーハワイ|ハワイ|sparkle,メロンソーダ|メロン|fizz,ももラムネ|もも|fizz,ぶどうラムネ|ぶどう|fizz,みかん氷|みかん|pulp,ラムネ|ラムネ|fizz",
  tsukimi: "もみじ茶|もみじ|,月見ミルク|月見|milk,夜空のお茶|夜空|,すすき茶|すすき|,だんごミルク|だんご|milk,月夜のぶどう|月夜|sparkle,くりラテ|くり|foam,月のしずく|しずく|sparkle",
  halloween: "吸血鬼ジュース|吸血鬼|,おばけレモン|おばけ|fizz,こうもりソーダ|こうもり|fizz,魔女の薬|魔女薬|boil,いちごの呪い|呪い|,魔女のぶどう|魔女|boil,かぼちゃスープ|かぼちゃ|steam,ゴーストソーダ|ゴースト|fizz",
  harvest: "りんごジュース|りんご|,梨ジュース|梨|,ブルーベリー|ベリー|pulp,マスカット|マスカ|pulp,もものネクター|もも|,ぶどう酒|ぶどう|pulp,かぼちゃラテ|かぼちゃ|foam,湧き水|湧き水|sparkle",
  xmas: "ホットワイン|ワイン|steam,エッグノッグ|ノッグ|milk,雪の結晶ソーダ|結晶|sparkle,ツリーのミント|ミント|,いちごミルク|いちご|milk,ベリーパンチ|パンチ|,ジンジャーティー|ジンジャ|steam,雪どけソーダ|雪ソーダ|fizz"
};
const DRINK = {};
for (const k in DRINKS) DRINK[k] = DRINKS[k].split(",").map(s => { const [name, short, tex] = s.split("|"); return {name, short, tex: tex || ""}; });
let drinkTheme = "w1";
function setDrinkTheme(){ drinkTheme = S && S.mode === "event" && DRINK[S.ev] ? S.ev : S && S.w && DRINK["w" + S.w] ? "w" + S.w : "w1"; }
const drinkOf = c => (DRINK[drinkTheme] || DRINK.w1)[c] || {name: CNAME[c], short: CNAME[c], tex: ""};
const drinkName = c => drinkOf(c).name;
// 瓶の中の模様（液体の層ごと）。seed で位置を固定して、止まった瓶の絵を使い回せるようにする
function drinkTex(c, tex, x0, x1, yTop, yBot, cx, seed, isTop, w){
  if (!tex || yBot - yTop < 3) return;
  const r = k => { const v = Math.sin(seed*12.9898 + k*78.233)*43758.5453; return v - Math.floor(v); }, hgt = yBot - yTop, wid = x1 - x0;
  c.save();
  if (tex === "fizz"){ c.fillStyle = "rgba(255,255,255,.55)"; const n = Math.max(3, Math.round(hgt/7)); for (let k=0;k<n;k++){ c.beginPath(); c.arc(x0 + wid*(.15 + .7*r(k)), yTop + hgt*r(k + 9), Math.max(.8, w*.03 + r(k+3)*w*.03), 0, 7); c.fill(); } }
  if (tex === "pulp"){ const n = Math.max(4, Math.round(hgt/5)); for (let k=0;k<n;k++){ c.fillStyle = k % 2 ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.14)"; c.beginPath(); c.ellipse(x0 + wid*(.12 + .76*r(k)), yTop + hgt*r(k + 5), w*.045, w*.025, r(k+7)*3, 0, 7); c.fill(); } }
  if (tex === "sparkle"){ c.fillStyle = "rgba(255,255,255,.8)"; const n = Math.max(2, Math.round(hgt/10)); for (let k=0;k<n;k++){ const px = x0 + wid*(.18 + .64*r(k)), py = yTop + hgt*(.1 + .8*r(k + 4)), z = w*(.04 + .03*r(k+2));
    c.beginPath(); c.moveTo(px, py - z); c.lineTo(px + z*.3, py - z*.3); c.lineTo(px + z, py); c.lineTo(px + z*.3, py + z*.3); c.lineTo(px, py + z); c.lineTo(px - z*.3, py + z*.3); c.lineTo(px - z, py); c.lineTo(px - z*.3, py - z*.3); c.closePath(); c.fill(); } }
  if (tex === "milk"){ c.strokeStyle = "rgba(255,255,255,.32)"; c.lineWidth = Math.max(1, w*.05); c.lineCap = "round"; c.beginPath();
    for (let k=0;k<2;k++){ const py = yTop + hgt*(.3 + .4*k); c.moveTo(x0 + wid*.18, py); c.bezierCurveTo(x0 + wid*.4, py - hgt*.18, x0 + wid*.6, py + hgt*.18, x0 + wid*.82, py); } c.stroke(); }
  if (tex === "boil"){ c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = Math.max(1, w*.03); for (let k=0;k<3;k++){ c.beginPath(); c.arc(x0 + wid*(.25 + .5*r(k)), yTop + hgt*(.25 + .5*r(k + 2)), w*(.06 + .05*r(k+5)), 0, 7); c.stroke(); } }
  if (tex === "foam"){ c.fillStyle = "rgba(255,255,255,.5)"; const n = Math.max(3, Math.round(hgt/8)); for (let k=0;k<n;k++){ c.beginPath(); c.arc(x0 + wid*(.18 + .64*r(k)), yTop + hgt*(.35 + .6*r(k + 9)), Math.max(.8, w*.03 + r(k+3)*w*.025), 0, 7); c.fill(); } }
  // 泡の飲み物は、上にあっても下に埋まっていても、層の上に泡の帯をつける（見た目をそろえる）
  if (tex === "foam"){ const fh = Math.min(hgt*.45, w*.22); c.fillStyle = "rgba(255,250,240,.92)"; c.fillRect(x0, yTop, wid, fh*.7);
    for (let k=0;k<6;k++){ c.beginPath(); c.arc(x0 + wid*(k + .5)/6, yTop + fh*.62, wid/10, 0, Math.PI); c.fill(); } }
  if (isTop && tex === "steam"){ c.strokeStyle = "rgba(255,255,255,.4)"; c.lineWidth = Math.max(1, w*.04); c.lineCap = "round";
    for (let k=0;k<2;k++){ const px = cx + (k ? 1 : -1)*w*.12; c.beginPath(); c.moveTo(px, yTop - 1); c.bezierCurveTo(px - w*.08, yTop - w*.12, px + w*.08, yTop - w*.2, px, yTop - w*.32); c.stroke(); } }
  c.restore();
}
