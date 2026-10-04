/* ============================================================
   tardu — Firebase (Auth + Realtime Database) destekli uygulama
   ============================================================ */
(() => {
'use strict';

/* ---------- Firebase kurulum ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyD4Wc1xBC_BQZwjXMHAnusVYlCa2lpNAbk",
  authDomain: "tardushop.firebaseapp.com",
  databaseURL: "https://tardushop-default-rtdb.firebaseio.com",
  projectId: "tardushop",
  storageBucket: "tardushop.firebasestorage.app",
  messagingSenderId: "1078554363493",
  appId: "1:1078554363493:web:e037968aab4efd4c0c688c",
  measurementId: "G-5CLSQYRJ3J"
};

let FB_OK = false, FAuth = null, RDB = null, SV = null;

/* ----- site sahibinin IBAN bilgileri (BURAYI KENDİ BİLGİLERİNLE DEĞİŞTİR) ----- */
const OWNER_NAME = 'TARDU PAZAR';
const OWNER_IBAN = 'TR00 0000 0000 0000 0000 0000 00';
try{
  firebase.initializeApp(firebaseConfig);
  FAuth = firebase.auth();
  RDB = firebase.database();
  SV = firebase.database.ServerValue;
  FB_OK = true;
}catch(e){
  console.error('Firebase başlatılamadı:', e);
}

/* ---------- yardımcılar ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const $id = id => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const money = n => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
const money0 = n => Math.round(Number(n || 0)).toLocaleString('tr-TR') + ' TL';
const hhmm = d => new Date(d).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
const dayLabel = d => {
  const t = new Date(d), n0 = new Date();
  const diff = (new Date(n0.getFullYear(), n0.getMonth(), n0.getDate()) - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5;
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  return t.toLocaleDateString('tr-TR', { day:'2-digit', month:'long' });
};
const icon = (id, cls) => '<svg viewBox="0 0 24 24"' + (cls ? ' class="' + cls + '"' : '') + '><use href="#i-' + id + '"/></svg>';
const needFB = () => { if (!FB_OK){ toast('Firebase bağlantısı yok. İnterneti kontrol et.', 'err', 'x'); return false; } return true; };

/* ---------- kategoriler ---------- */
const CATS = [
  { id:'efootball',    name:'eFootball',         g:'g-efootball',    c1:'#0f9d58', c2:'#065f46' },
  { id:'pubg',         name:'PUBG Mobile',       g:'g-pubg',         c1:'#f59e0b', c2:'#b45309' },
  { id:'brawl',        name:'Brawl Stars',       g:'g-brawl',        c1:'#f97316', c2:'#dc2626' },
  { id:'clashroyale',  name:'Clash Royale',      g:'g-clashroyale',  c1:'#3b82f6', c2:'#1e40af' },
  { id:'clashofclans', name:'Clash of Clans',    g:'g-clashofclans', c1:'#a855f7', c2:'#6b21a8' },
  { id:'lol',          name:'League of Legends', g:'g-lol',          c1:'#06b6d4', c2:'#0f766e' },
  { id:'valorant',     name:'Valorant',          g:'g-valorant',     c1:'#fb7185', c2:'#9f1239' },
  { id:'cs',           name:'Counter-Strike 2',  g:'g-cs',           c1:'#f87171', c2:'#7f1d1d' },
  { id:'mlbb',         name:'Mobile Legends',    g:'g-mlbb',         c1:'#38bdf8', c2:'#0369a1' },
  { id:'fortnite',     name:'Fortnite',          g:'g-fortnite',     c1:'#818cf8', c2:'#4338ca' }
];
const catOf = id => CATS.find(c => c.id === id) || CATS[0];
const catMark = id => icon(catOf(id).g);
const FEE = 0.04;
const TAGS = ['Full+Full','Mail değişir','Efsane kadro','Skin ağır','Klan dahil','Anında teslim','Rank yüksek','Çift şifre'];

const SEED = [
  ['valorant','Full+Full Valorant Hesabı — 120 Skin, Reaver Vandal','EU TR hesap, 3 yıl emektar. Immortal 3. derece, 5 ekipman skin, tüm ajanlar açık. Bağlı mail alıcıya devredilir.',4500,'vpazar34',4.9,1840,'Full+Full'],
  ['efootball','eFootball Efsane Kadro — 3.400 güç, 52 Epic oyuncu','Tam efsane seti, dereceli forma hazır, 11 oyuncuncu dolu. Sesli sohbet yasak, temiz hesap.',2850,'pesmaster',4.8,1210,'Efsane kadro'],
  ['pubg','PUBG Mobile — M416 Glacier + 74 Destansı','Sezon 8’den beri oynuyor, Royale Pass tamam, 9. seviye kıyafetler. Tek mail, anında teslim.',3250,'pubgshop',4.7,960,'Anında teslim'],
  ['brawl','Brawl Stars — 56K Kupa, tüm şampiyonlar Max','Hiper şarjlar full, 11 kıyafeti max, kulüp başkanlığı devredilir.',1950,'starboy',4.9,1430,'Skin ağır'],
  ['clashroyale','Clash Royale — 8.100 Kupa, kartlar Max','14 seviye deste kurulu, klan kasası dolu, 2 turnuva şampiyonu.',1450,'kral34',4.6,720,'Klan dahil'],
  ['clashofclans','Clash of Clans — TH16 Full Max duvarlar','Duvar, donatı, asker, sihirbaz her şey full. 6 inşaatçı yükseltildi.',2250,'cocpro',4.8,1080,'Full+Full'],
  ['lol','League of Legends — 512 Skin, Prestij 3+','EUW hesap, 14 şampiyon, tüm eski sezon ödülleri. İsim değişimi açık.',3900,'riftci',4.9,1650,'Skin ağır'],
  ['cs','CS2 Envanterli Hesap — 15K envanter, 40 madalya','VAC temiz, bıçak ve eldiven dahil, 12 yıllık hesap. Trade tag açık.',9500,'global34',5.0,2110,'Rank yüksek'],
  ['mlbb','Mobile Legends — Mythic 300+ skin, 7 epic','124 hero açık, rank 5 kez yıldız, 3 legendary skin.',2600,'mlbbmaster',4.7,880,'Çift şifre'],
  ['fortnite','Fortnite — 1.250 V-Bucks, 62 kıyafet','Battle Pass tamam, 1.250 V-Bucks kaldı, skinler trade edilebilir.',3800,'vbucks',4.6,640,'Mail değişir'],
  ['valorant','Valorant — 25.000 VP, Oni ve Prime seti','TR hesap, 2 yıllık, 18 skin. Kesinlikle temiz, faturalı.',2900,'vpazar34',4.8,1150,'Rank yüksek'],
  ['efootball','eFootball — 1.800 coin, Standard lig kontrol','Sane coaching yasak, 24 squad hazır, mega pack satın alınmış.',1600,'pesmaster',4.5,520,'Anında teslim']
];

/* ---------- durum ---------- */
let fbUser = null;          // firebase auth kullanıcısı
let profile = null;         // /users/{uid}
let favs = {};              // /users/{uid}/favs
let txList = [];            // /users/{uid}/tx
let listings = [];          // /listings
let threadCache = {};       // tid -> thread
let myTids = [];            // /userThreads/{uid}
const threadRefs = {};      // tid -> ref (dinleyici takibi)

const K_UI = 'tardu.ui';
const uiState = { collapsed:false };
try{ Object.assign(uiState, JSON.parse(localStorage.getItem(K_UI) || '{}')); }catch(e){}
const saveUI = () => { try{ localStorage.setItem(K_UI, JSON.stringify(uiState)); }catch(e){} };

const uid = () => fbUser ? fbUser.uid : null;
const isAuthed = () => !!fbUser && !!profile;
const isMine = x => !!fbUser && x.sellerUid === fbUser.uid;
const myName = () => profile ? profile.user : 'misafir';
function peerOf(t){
  if (!t) return '?';
  if (fbUser && t.buyerUid === fbUser.uid) return t.seller || 'Satıcı';
  return t.buyer || 'Alıcı';
}

/* ---------- bildirim ---------- */
function toast(msg, kind, ico){
  kind = kind || 'info';
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = '<span class="ti">' + (ico ? icon(ico) : (kind === 'ok' ? icon('check') : kind === 'err' ? icon('x') : icon('spark'))) + '</span><span>' + esc(msg) + '</span>';
  $id('toasts').appendChild(el);
  setTimeout(() => { el.remove(); }, 3000);
  while ($id('toasts').children.length > 3) $id('toasts').firstChild.remove();
}

/* ---------- modal ---------- */
let activeModal = null, pendingPage = null;
function openModal(id){
  if (activeModal && activeModal !== id) $id(activeModal).classList.remove('on');
  activeModal = id;
  $id(id).classList.add('on');
  $id('scrim').classList.add('on');
}
function closeModal(){
  if (!activeModal) return;
  $id(activeModal).classList.remove('on');
  $id('scrim').classList.remove('on');
  activeModal = null;
}

/* ---------- yönlendirme ---------- */
const LOCKED = ['ilanlarim','favorilerim','mesajlarim','cuzdanim','ayarlar'];
let page = 'kesfet', tab = 'aktif', cat = 'tumu', term = '', sort = 'pop';

function go(p, force){
  if (LOCKED.includes(p) && !isAuthed() && !force){
    pendingPage = p;
    openAuthWall('Bu bölümü kullanmak için hesabına giriş yap.');
    return;
  }
  page = p;
  $$('.nav-i').forEach(b => b.classList.toggle('is-on', b.dataset.page === p));
  $$('.tabbar .t-i').forEach(b => b.classList.toggle('is-on', b.dataset.page === p));
  $$('.page').forEach(s => s.classList.toggle('is-on', s.id === 'p-' + p));
  render(p);
  movePill();
  closeDrawer();
  window.scrollTo(0, 0);
}
function movePill(){
  const btn = $('.nav-i[data-page="' + page + '"]'), pill = $id('navPill');
  if (!btn || !pill) return;
  pill.style.height = btn.offsetHeight + 'px';
  pill.style.transform = 'translateY(' + (btn.offsetTop - 3) + 'px)';
}
function moveTabInd(){
  const on = $('.tab.is-on'), ind = $('.tab-ind');
  if (!on || !ind) return;
  ind.style.width = on.offsetWidth + 'px';
  ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
}

/* ---------- kart ---------- */
function starLine(r, v){
  return '<div class="card-sel"><span class="stars">' + icon('star') + '</span><span>' + r.toFixed(1).replace('.', ',') + '</span>' +
    '<span>&middot;</span><span>' + money0(v) + ' gösterimlenme</span></div>';
}
function cardHTML(x){
  const mine = isMine(x);
  const c = catOf(x.cat);
  const isFav = !!favs[x.id];
  const off = x.state !== 'active';
  const acts = mine
    ? '<button class="card-alt" data-act="toggle" data-id="' + x.id + '" title="' + (off ? 'Aktive et' : 'Pasife al') + '">' + icon(off ? 'play' : 'pause') + '</button>' +
      '<button class="card-alt bad" data-act="del" data-id="' + x.id + '" title="Sil">' + icon('trash') + '</button>'
    : '<button class="card-buy" data-act="buy" data-id="' + x.id + '">Satın al</button>' +
      '<button class="card-alt" data-act="msg" data-id="' + x.id + '" title="Satıcıya mesaj at">' + icon('chat') + '</button>' +
      '<button class="card-alt" data-act="fav" data-id="' + x.id + '" title="Favorilere ekle">' + icon('heart') + '</button>';
  return '<article class="card" data-id="' + x.id + '" style="--c1c:' + c.c1 + ';--c2c:' + c.c2 + '">' +
    '<div class="card-art ' + (x.image ? 'has-img' : '') + '"' + (x.image ? ' style="--img:url(' + x.image + ')"' : '') + '>' +
      (off ? '<div class="card-off">Pasif ilan</div>' : '') +
      '<button class="card-fav ' + (isFav ? 'on' : '') + '" data-act="fav" data-id="' + x.id + '" title="Favori">' + icon('heart') + '</button>' +
      '<span class="card-kat">' + c.name + '</span>' +
      '<span class="card-mark">' + catMark(x.cat) + '</span>' +
    '</div>' +
    '<div class="card-body">' +
      '<h3>' + esc(x.title) + '</h3>' +
      '<p class="card-desc">' + esc(x.desc) + '</p>' +
      '<div class="tagrow">' + (x.tag ? '<span class="hot">' + esc(x.tag) + '</span>' : '') +
        '<span>' + (mine ? (off ? 'Pasif' : 'Yayında') : 'Satıcı: ' + esc(x.seller)) + '</span></div>' +
      (mine ? '' : starLine(x.rating || 5, x.views || 0)) +
      '<div class="card-price"><b>' + money(x.price) + '</b>' + (mine ? '<s>net ' + money(x.price * (1 - FEE)) + '</s>' : '') + '</div>' +
    '</div>' +
    '<div class="card-foot">' + acts + '</div>' +
  '</article>';
}
function emptyState(){
  if (page === 'favorilerim')
    return '<div class="empty"><span class="e-ico">' + icon('heart') + '</span><b>Favori listen boş</b><p>Keşfet sayfasında bir ilanın kalbini doldur, buraya düşsün.</p></div>';
  if (page === 'ilanlarim')
    return '<div class="empty"><span class="e-ico">' + icon('box') + '</span><b>Bu listede ilanın yok</b><p>Yeni ilan oluştur, saniyeler içinde yayına al.</p><button class="btn primary" data-act="new">' + icon('plus') + 'İlan oluştur</button></div>';
  if (page === 'mesajlarim')
    return '';
  return '<div class="empty"><span class="e-ico">' + icon('search') + '</span><b>Sonuç bulunamadı</b><p>Aramayı kısalt ya da başka bir oyun dene.</p></div>';
}
function paint(el, list, fn){
  if (!el) return;
  el.innerHTML = list.length ? list.map(fn).join('') : emptyState();
}
function listFor(p){
  let L = listings.slice();
  if (p === 'kesfet'){
    L = L.filter(x => x.state === 'active');
    if (cat !== 'tumu') L = L.filter(x => x.cat === cat);
    if (term){
      const t = term.toLocaleLowerCase('tr');
      L = L.filter(x => (x.title + ' ' + x.desc + ' ' + catOf(x.cat).name).toLocaleLowerCase('tr').includes(t));
    }
    L.sort({ pop:(a,b)=>(b.views||0)-(a.views||0), asc:(a,b)=>a.price-b.price, desc:(a,b)=>b.price-a.price, yeni:(a,b)=>(b.created||0)-(a.created||0) }[sort]);
  } else if (p === 'favorilerim'){
    L = L.filter(x => favs[x.id]);
  } else if (p === 'ilanlarim'){
    L = L.filter(x => isMine(x) && x.state === tab);
  }
  return L;
}

/* ---------- render ---------- */
function render(p){
  p = p || page;
  if (p === 'kesfet'){
    $id('resTitle').textContent = cat === 'tumu' ? (term ? '"' + term + '" için sonuçlar' : 'Tüm ilanlar') : catOf(cat).name;
    paint($id('exploreGrid'), listFor('kesfet'), cardHTML);
  }
  if (p === 'ilanlarim'){
    paint($id('mineGrid'), listFor('ilanlarim'), cardHTML);
    const mine = listings.filter(isMine);
    const aktif = mine.filter(x => x.state === 'active');
    $id('kAktif').textContent = aktif.length;
    $id('kPasif').textContent = mine.filter(x => x.state === 'paused').length;
    $id('kKazanc').textContent = money(aktif.reduce((t, x) => t + x.price * (1 - FEE), 0));
    $id('kHit').textContent = new Intl.NumberFormat('tr-TR').format(mine.reduce((t, x) => t + (x.views || 0), 0));
  }
  if (p === 'favorilerim') paint($id('favGrid'), listFor('favorilerim'), cardHTML);
  if (p === 'mesajlarim'){ renderThreads(); moveMsgTabInd(); }
  if (p === 'cuzdanim'){
    $id('walletBig').textContent = money(profile ? profile.balance || 0 : 0);
    $id('txList').innerHTML = txList.length ? txList.map(t =>
      '<div class="tx-row"><span class="tx-ico">' + icon(t.v >= 0 ? 'arrow-d' : 'arrow-u') + '</span>' +
      '<span class="tx-t"><b>' + esc(t.t) + '</b><small>' + esc(t.d || '') + '</small></span>' +
      '<span class="tx-amt ' + (t.v >= 0 ? 'in' : 'out') + '">' + (t.v >= 0 ? '+' : '−') + money(Math.abs(t.v)) + '</span></div>').join('')
      : '<div class="empty"><span class="e-ico">' + icon('coins') + '</span><b>İşlem yok</b><p>Cüzdan hareketlerin burada listelenir.</p></div>';
  }
  if (p === 'ayarlar') paintSettings();
  $id('bakiyeText').textContent = money(profile ? profile.balance || 0 : 0);
  $id('cntIlan').textContent = listings.filter(x => isMine(x) && x.state === 'active').length;
  $id('cntFav').textContent = Object.keys(favs).length;
  $id('cntMsg').textContent = unreadTotal();
  $$('#tabs .tab').forEach(t => t.classList.toggle('is-on', t.dataset.tab === tab));
  moveTabInd();
}

/* ---------- kategori rayı ---------- */
function rail(){
  const n = c => listings.filter(x => x.cat === c && x.state === 'active').length;
  $id('rail').innerHTML =
    '<button class="catchip ' + (cat === 'tumu' ? 'is-on' : '') + '" data-cat="tumu">' +
      '<span class="cg">' + icon('globe') + '</span><b>Tümü</b><small>' + listings.filter(x => x.state === 'active').length + ' ilan</small></button>' +
    CATS.map(c => '<button class="catchip ' + (cat === c.id ? 'is-on' : '') + '" data-cat="' + c.id + '">' +
      '<span class="cg" style="background:' + c.c1 + '2e">' + catMark(c.id) + '</span><b>' + c.name + '</b><small>' + n(c.id) + ' ilan</small></button>').join('');
}

/* ---------- Firebase dinleyiciler ---------- */
function attachListings(){
  if (!FB_OK) return;
  RDB.ref('listings').on('value', snap => {
    const v = snap.val() || {};
    listings = Object.keys(v).map(k => Object.assign({ id:k }, v[k]));
    rail();
    if (page === 'kesfet' || page === 'ilanlarim' || page === 'favorilerim') render(page);
    else { $id('cntIlan').textContent = listings.filter(x => isMine(x) && x.state === 'active').length; }
    if (!listings.length && fbUser) seedListings();
  }, () => {
    toast('İlanlar yüklenemedi. Veritabanı kurallarını kontrol et.', 'err', 'x');
  });
}
function seedListings(){
  const ups = {};
  SEED.forEach(s => {
    const k = RDB.ref('listings').push().key;
    ups['listings/' + k] = { cat:s[0], title:s[1], desc:s[2], price:s[3], seller:s[4],
      sellerUid:null, rating:s[5], views:s[6], tag:s[7], state:'active', created:Date.now() };
  });
  RDB.ref().update(ups).catch(() => {});
}

let profRef = null, favRef = null, txQuery = null, idxRef = null;
function detachUser(){
  [profRef, favRef, txQuery, idxRef].forEach(r => { if (r) r.off(); });
  Object.keys(threadRefs).forEach(t => { threadRefs[t].off(); delete threadRefs[t]; });
  profRef = favRef = txQuery = idxRef = null;
}
function attachUser(u){
  const base = 'users/' + u;
  profRef = RDB.ref(base);
  profRef.on('value', snap => {
    profile = snap.val();
    paintAccount();
    if (page === 'cuzdanim' || page === 'ayarlar' || page === 'ilanlarim') render(page);
    $id('bakiyeText').textContent = money(profile ? profile.balance || 0 : 0);
  });
  favRef = RDB.ref(base + '/favs');
  favRef.on('value', snap => {
    favs = snap.val() || {};
    $id('cntFav').textContent = Object.keys(favs).length;
    if (page === 'favorilerim' || page === 'kesfet') render(page);
  });
  txQuery = RDB.ref(base + '/tx').orderByChild('at').limitToLast(40);
  txQuery.on('value', snap => {
    const v = snap.val() || {};
    txList = Object.keys(v).map(k => v[k]).sort((a, b) => (b.at || 0) - (a.at || 0));
    if (page === 'cuzdanim') render(page);
  });
  idxRef = RDB.ref('userThreads/' + u);
  idxRef.on('value', snap => {
    const v = snap.val() || {};
    myTids = Object.keys(v).sort((a, b) => (v[b] || 0) - (v[a] || 0));
    const keep = {};
    myTids.forEach(t => {
      keep[t] = 1;
      if (!threadRefs[t]){
        const r = RDB.ref('threads/' + t);
        threadRefs[t] = r;
        r.on('value', s2 => {
          if (s2.exists()) threadCache[t] = Object.assign({ id:t }, s2.val());
          else { delete threadCache[t]; }
          $id('cntMsg').textContent = unreadTotal();
          if (page === 'mesajlarim') renderThreads();
        });
      }
    });
    Object.keys(threadRefs).forEach(t => { if (!keep[t]){ threadRefs[t].off(); delete threadRefs[t]; delete threadCache[t]; } });
    $id('cntMsg').textContent = unreadTotal();
    if (page === 'mesajlarim') renderThreads();
  });
}

/* ---------- hesap ---------- */
function authErr(e){
  const c = (e && e.code) || '';
  if (c === 'auth/email-already-in-use') return 'Bu e-posta zaten kayıtlı.';
  if (c === 'auth/weak-password') return 'Şifre en az 6 karakter olmalı.';
  if (c === 'auth/invalid-email') return 'Geçerli bir e-posta gir.';
  if (c === 'auth/user-not-found' || c === 'auth/wrong-password' || c === 'auth/invalid-credential') return 'E-posta veya şifre hatalı.';
  if (c === 'auth/too-many-requests') return 'Çok fazla deneme. Biraz bekleyip tekrar dene.';
  if (c === 'auth/network-request-failed') return 'Bağlantı hatası. İnterneti kontrol et.';
  if (c === 'auth/requires-recent-login') return 'Güvenlik için yeniden giriş yapmalısın.';
  return 'İşlem başarısız. Tekrar dene.';
}
function openAuthWall(note, which){
  $id('authwall').hidden = false;
  $id('awNote').textContent = note || 'Bu bölümü kullanmak için hesabına giriş yap.';
  switchAuthTab(which || 'register');
}
function closeAuthWall(){ $id('authwall').hidden = true; pendingPage = null; }
function switchAuthTab(t){
  $id('awTitle').textContent = t === 'register' ? 'Kayıt ol' : 'Giriş yap';
  $id('regForm').hidden = t !== 'register';
  $id('logForm').hidden = t !== 'login';
}
async function doRegister(e){
  e.preventDefault();
  if (!needFB()) return;
  const user = $id('rUser').value.trim().toLowerCase();
  const name = $id('rName').value.trim();
  const mail = $id('rMail').value.trim().toLowerCase();
  const tel  = $id('rTel').value.trim();
  const p1   = $id('rPass').value, p2 = $id('rPass2').value;
  if (!/^[a-z0-9_.]{3,20}$/.test(user)) return toast('Kullanıcı adı 3-20 karakter, küçük harf ve rakam olmalı.', 'err', 'user');
  if (name.length < 3) return toast('Ad soyad en az 3 karakter olmalı.', 'err', 'user');
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) return toast('Geçerli bir e-posta gir.', 'err', 'mail');
  if (tel.replace(/\D/g, '').length < 10) return toast('Telefon numarası eksik.', 'err', 'phone');
  if (p1.length < 6) return toast('Şifre en az 6 karakter olmalı.', 'err', 'key');
  if (p1 !== p2) return toast('Şifreler eşleşmiyor.', 'err', 'key');
  if (!$id('rAgree').checked) return toast('Sözleşmeyi kabul etmelisin.', 'err', 'x');
  let cred = null;
  try{ cred = await FAuth.createUserWithEmailAndPassword(mail, p1); }
  catch(err){ return toast(authErr(err), 'err', 'user'); }
  const u = cred.user.uid;
  try{
    const claim = await RDB.ref('usernames/' + user).transaction(cur => cur === null ? mail : undefined);
    if (!claim.committed){
      await cred.user.delete().catch(() => {});
      return toast('Bu kullanıcı adı alınmış.', 'err', 'user');
    }
    await RDB.ref('users/' + u).set({ user, name, mail, tel, avatar:'', created:Date.now(),
      balance:1250, defCat:'valorant', notif:{ msg:true, offer:true, sale:true } });
    await RDB.ref('users/' + u + '/tx').push({ t:'Hoş geldin bonusu', v:1250, d:'Hesabın açıldı', at:SV.TIMESTAMP });
  }catch(err){
    return toast('Kayıt yarıda kaldı: ' + (err.message || 'veritabanı hatası'), 'err', 'x');
  }
  afterAuth('Hoş geldin ' + name.split(' ')[0] + '. Hesabın hazır.');
}
async function doLogin(e){
  e.preventDefault();
  if (!needFB()) return;
  const idv = $id('lId').value.trim().toLowerCase();
  const pw = $id('lPass').value;
  let email = idv.includes('@') ? idv : null;
  try{
    if (!email){
      const s = await RDB.ref('usernames/' + idv).get();
      if (!s.exists()) return toast('Kayıt bulunamadı.', 'err', 'user');
      email = s.val();
    }
    await FAuth.signInWithEmailAndPassword(email, pw);
    $id('lPass').value = '';
    const u = (await RDB.ref('users/' + FAuth.currentUser.uid).get()).val() || {};
    afterAuth('Tekrar hoş geldin ' + (u.name || 'knk').split(' ')[0] + '.');
  }catch(err){ toast(authErr(err), 'err', 'key'); }
}
function afterAuth(msg){
  const target = pendingPage || 'kesfet';
  pendingPage = null;
  closeAuthWall();
  applyLockState();
  go(target, true);
  toast(msg, 'ok', 'check');
}
async function logout(){
  if (!confirm('Çıkış yapılsın mı?')) return;
  try{ await FAuth.signOut(); }catch(e){}
  closeAuthWall(); closeModal();
  toast('Çıkış yapıldı.', 'info', 'logout');
}
function applyLockState(){
  const on = !!fbUser;
  $$('[data-locked]').forEach(el => el.classList.toggle('unlocked', on));
}

/* ---------- ilan işlemleri ---------- */
async function buy(id){
  const x = listings.find(l => l.id === id);
  if (!x || !needFB()) return;
  if (isMine(x)) return toast('Bu senin ilanın knk.', 'err', 'x');
  if (!fbUser){ pendingPage = 'cuzdanim'; openAuthWall('Satın almak için hesabına giriş yap.'); return; }
  if (!profile) return toast('Profilin yüklenemedi. Veritabanı kurallarını kontrol et.', 'err', 'x');
  const balRef = RDB.ref('users/' + uid() + '/balance');
  let res = null;
  try{ res = await balRef.transaction(b => { b = b || 0; if (b < x.price) return; return b - x.price; }); }
  catch(e){ return toast('Ödeme sırasında hata oldu.', 'err', 'x'); }
  if (!res.committed){
    toast('Bakiye yetersiz. ' + money(x.price - (profile.balance || 0)) + ' eksik.', 'err', 'wallet');
    go('cuzdanim');
    return;
  }
  await RDB.ref('users/' + uid() + '/tx').push({ t:'Satın alma — ' + x.title.slice(0, 26), v:-x.price, d:x.seller, at:SV.TIMESTAMP }).catch(() => {});
  RDB.ref('listings/' + id + '/views').transaction(v => (v || 0) + 1).catch(() => {});
  toast('Hesabın senin. Bilgiler gönderildi.', 'ok', 'check');
  go('cuzdanim');
}
async function fav(id){
  if (!needFB()) return;
  if (!fbUser){ pendingPage = 'favorilerim'; openAuthWall('Favoriye eklemek için giriş yap.'); return; }
  if (!profile) return toast('Profilin yüklenemedi. Veritabanı kurallarını kontrol et.', 'err', 'x');
  const r = RDB.ref('users/' + uid() + '/favs/' + id);
  try{
    if (favs[id]){ await r.remove(); toast('Favorilerden çıkarıldı', 'info', 'x'); }
    else { await r.set(true); toast('Favorilere eklendi', 'info', 'heart'); }
  }catch(e){ toast('İşlem başarısız.', 'err', 'x'); }
}
async function mineToggle(id){
  const x = listings.find(l => l.id === id);
  if (!x || !fbUser) return;
  const ns = x.state === 'active' ? 'paused' : 'active';
  try{ await RDB.ref('listings/' + id + '/state').set(ns); }
  catch(e){ toast('İşlem başarısız.', 'err', 'x'); }
}
async function mineDel(id){
  const x = listings.find(l => l.id === id);
  if (!x || !fbUser) return;
  try{ await RDB.ref('listings/' + id).remove(); toast('İlan silindi', 'info', 'trash'); }
  catch(e){ toast('Silme başarısız.', 'err', 'x'); }
}

/* ---------- ilan görseli ---------- */
let listingImage = '';
let customImage = false;
function glyphMarkup(catId){
  const g = $('#i-' + catOf(catId).g);
  return g ? g.innerHTML : '';
}
function defaultImage(catId){
  const c = catOf(catId);
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">' +
    '<defs>' +
      '<linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.c1 + '"/><stop offset="1" stop-color="' + c.c2 + '"/></linearGradient>' +
      '<pattern id="p1" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="#ffffff" stroke-opacity=".08" stroke-width="1"/></pattern>' +
    '</defs>' +
    '<rect width="800" height="450" fill="url(#g1)"/>' +
    '<rect width="800" height="450" fill="url(#p1)"/>' +
    '<circle cx="650" cy="100" r="160" fill="#ffffff" fill-opacity=".07"/>' +
    '<circle cx="90" cy="400" r="110" fill="#ffffff" fill-opacity=".05"/>' +
    '<g fill="none" stroke="#ffffff" stroke-opacity=".92" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" transform="translate(64,150) scale(4.2)">' + glyphMarkup(catId) + '</g>' +
    '<text x="64" y="392" font-family="Segoe UI,Arial,Helvetica,sans-serif" font-size="36" font-weight="700" fill="#ffffff">' + c.name + '</text>' +
    '<text x="64" y="422" font-family="Segoe UI,Arial,Helvetica,sans-serif" font-size="17" fill="#ffffff" fill-opacity=".78">tardu \u00b7 hesap pazar\u0131</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function shrinkImage(file, maxW, quality){
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try{
        const sc = Math.min(1, maxW / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * sc));
        c.height = Math.max(1, Math.round(img.height * sc));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', quality));
      }catch(e){ rej(e); }
    };
    img.onerror = rej;
    img.src = url;
  });
}
function paintImgPick(){
  const box = $id('imgPick'), prev = $id('imgPrev'), ph = $id('imgPh');
  if (!box) return;
  if (listingImage){ prev.src = listingImage; prev.hidden = false; ph.hidden = true; box.classList.add('has'); }
  else { prev.hidden = true; ph.hidden = false; box.classList.remove('has'); }
}
function applyDefaultImage(){
  listingImage = defaultImage($id('fCat').value);
  paintImgPick();
  calcListing();
}

/* ---------- ilan oluşturma ---------- */
function openListing(){
  if (!needFB()) return;
  if (!fbUser){ pendingPage = 'ilanlarim'; openAuthWall('İlan vermek için önce hesabına giriş yap.'); return; }
  openModal('mListing');
  applyDefaultImage();
  calcListing();
  setTimeout(() => $id('fPrice').focus(), 200);
}
function calcListing(){
  const price = Math.max(0, +($id('fPrice').value || '').replace(/[^0-9]/g, '') || 0);
  const fee = price * FEE, net = price - fee;
  $id('cPrice').textContent = money(price);
  $id('cFee').textContent = '− ' + money(fee);
  $id('cNet').textContent = money(net);
  const pct = price ? net / price * 100 : 0;
  $id('ringPct').textContent = '%' + Math.round(pct);
  const C = 339.3;
  $id('ringFg').style.strokeDashoffset = C - C * pct / 100;
  const note = $id('calcNote');
  if (!price) note.textContent = 'Fiyatı gir, kazancın anında hesaplansın.';
  else note.innerHTML = 'Alıcı <b>' + money(price) + '</b> ödüyor, senin cebine <b>' + money(net) + '</b> giriyor. Tardu komisyonu <b>' + money(fee) + '</b>.';
  $id('calc').classList.toggle('live', price > 0);
  const ok = !!listingImage && price >= 50 && $id('fTitle').value.trim().length >= 8 &&
             $id('fDesc').value.trim().length >= 15 && $id('fAgree').checked;
  $id('publishBtn').disabled = !ok;
  $id('publishBtn').querySelector('span').textContent = ok ? 'Yayınla · ' + money(net) + ' kazanç' : 'Yayınla';
}
async function publishListing(){
  if (!fbUser) return;
  if (!profile) return toast('Profilin yüklenemedi. Veritabanı kurallarını kontrol et.', 'err', 'x');
  const price = +($id('fPrice').value || '').replace(/[^0-9]/g, '');
  const t = $('#fTags .tchip.on');
  const data = { cat:$id('fCat').value, title:$id('fTitle').value.trim(), desc:$id('fDesc').value.trim(),
    price, seller:profile.user, sellerUid:uid(), rating:5, views:0, tag:t ? t.dataset.t : '',
    image:listingImage || defaultImage($id('fCat').value), state:'active', created:SV.TIMESTAMP };
  try{
    const k = RDB.ref('listings').push().key;
    const ups = {};
    ups['listings/' + k] = data;
    ups['users/' + uid() + '/tx/' + RDB.ref('users/' + uid() + '/tx').push().key] =
      { t:'İlan yayınlandı — ' + data.title.slice(0, 22), v:0, d:'%4 komisyon bekleniyor', at:SV.TIMESTAMP };
    await RDB.ref().update(ups);
  }catch(e){ return toast('Yayınlama başarısız: ' + ((e && (e.message || e.code)) || 'bilinmeyen hata'), 'err', 'x'); }
  closeModal();
  $id('fTitle').value = ''; $id('fDesc').value = ''; $id('fPrice').value = ''; $id('fAgree').checked = false;
  $$('#fTags .tchip').forEach(e => e.classList.remove('on'));
  customImage = false;
  applyDefaultImage();
  tab = 'aktif';
  go('ilanlarim');
  toast('İlanın yayında. Beklenen net kazancın ' + money(price * (1 - FEE)) + '.', 'ok', 'check');
}

/* ---------- detay ---------- */
function detail(id){
  const x = listings.find(l => l.id === id);
  if (!x) return;
  const c = catOf(x.cat);
  $id('dBody').innerHTML =
    '<div class="d-art ' + (x.image ? 'has-img' : '') + '"' + (x.image ? ' style="--img:url(' + x.image + ')"' : '') + '>' +
      '<span class="d-mark">' + catMark(x.cat) + '</span><span class="dk">' + c.name + '</span></div>' +
    '<div class="d-body">' +
      '<h2>' + esc(x.title) + '</h2>' +
      '<div class="d-seller"><span class="d-ava">' + esc((x.seller || '?')[0].toUpperCase()) + '</span> ' + esc(x.seller) +
        ' <span class="stars">' + (x.rating || 5).toFixed(1).replace('.', ',') + '</span> &middot; ' + money0(x.views || 0) + ' gösterimlenme</div>' +
      '<p class="d-desc">' + esc(x.desc) + '</p>' +
      '<div class="d-facts">' +
        '<div class="d-fact"><span>Kategori</span><b>' + c.name + '</b></div>' +
        '<div class="d-fact"><span>Teslim</span><b>Anında (~4 dk)</b></div>' +
        '<div class="d-fact"><span>Koruma</span><b>tardu garantisi</b></div>' +
        '<div class="d-fact"><span>Ödeme</span><b>Cüzdanla anında</b></div>' +
      '</div>' +
    '</div>' +
    '<div class="d-foot">' +
      '<div class="calc" style="padding:14px"><div class="calc-lines">' +
        '<div class="cl"><span>İlan fiyatı</span><b>' + money(x.price) + '</b></div>' +
        '<div class="cl minus"><span>tardu komisyonu <em>(%4)</em></span><b>− ' + money(x.price * FEE) + '</b></div>' +
        '<div class="cl total"><span>Satıcıya kalan net</span><b>' + money(x.price * (1 - FEE)) + '</b></div>' +
      '</div></div>' +
      (isMine(x) ? '<div class="msg-sys">Bu senin ilanın.</div>' :
        '<button class="btn primary lg" data-act="buy" data-id="' + x.id + '">' + money(x.price) + ' · Satın al</button>' +
        '<div style="display:flex;gap:9px">' +
          '<button class="btn ghost" style="flex:1" data-act="msg" data-id="' + x.id + '">' + icon('chat') + 'Satıcıya mesaj</button>' +
          '<button class="btn ghost" data-act="fav" data-id="' + x.id + '" title="Favori">' + icon('heart') + '</button>' +
        '</div>') +
    '</div>';
  openModal('mDetail');
}

/* ---------- mesajlaşma ---------- */
let openThreadId = null;
const SELLER_REPLIES = [
  [/fiyat|ne kadar|indirim/i, 'Selam, fiyat şu an geçerli. Acelen varsa anlaşma yapıp hızlıca teslim edebiliriz.'],
  [/mail|eposta|şifre|teslim/i, 'Teslim anında mail ve şifre bilgileri sana geçer. Değişiklik yapılmış, sıfır sıkıntı.'],
  [/düşük|ucuz|pazarlık/i, 'Biraz esnemek mümkün, ama bu fiyat son. Seni kaybetmemek için son kez bakıyorum.'],
  [/stok|var mı|hâlâ/i, 'Stokta duruyor, şu an kimse almadı. Hemen geçebilirsen ayırırım.'],
  [/emniyet|güven|garanti/i, 'tardu garantisi devrede, teslimden sonra sorun olursa destekten yazabilirsin.']
];
function sellerReply(text){
  const r = SELLER_REPLIES.find(x => x[0].test(text.toLocaleLowerCase('tr')));
  return r ? r[1] : 'Mesajını aldım, birazdan detaylı yazıyorum. Acele edersen hemen dönerim.';
}
function myUnread(t){
  if (!fbUser) return 0;
  if (t.buyerUid === fbUser.uid) return t.unreadBuyer || 0;
  if (t.sellerUid === fbUser.uid) return t.unreadSeller || 0;
  return 0;
}
function unreadTotal(){
  return myTids.reduce((n, t) => n + myUnread(threadCache[t] || {}), 0);
}
async function messageSeller(listingId){
  if (!needFB()) return;
  if (!fbUser){ pendingPage = 'mesajlarim'; openAuthWall('Satıcıya mesaj atmak için hesabına giriş yap.'); return; }
  if (!profile) return toast('Profilin yüklenemedi. Veritabanı kurallarını kontrol et.', 'err', 'x');
  const l = listings.find(x => x.id === listingId);
  if (!l) return;
  if (isMine(l)) return toast('Bu senin ilanın knk.', 'err', 'x');
  const mine = myTids.map(t => threadCache[t]).find(t => t && t.listingId === listingId && t.buyerUid === uid());
  if (mine){ openThreadId = mine.id; go('mesajlarim'); setTimeout(() => $id('msgInput').focus(), 60); return; }
  try{
    const k = RDB.ref('threads').push().key;
    const base = { listingId, buyerUid:uid(), buyer:profile.user, sellerUid:l.sellerUid || null,
      seller:l.seller, cat:l.cat, title:l.title, price:l.price,
      created:SV.TIMESTAMP, updated:SV.TIMESTAMP, unreadBuyer:0, unreadSeller:0 };
    const ups = {};
    ups['threads/' + k] = base;
    ups['userThreads/' + uid() + '/' + k] = SV.TIMESTAMP;
    if (l.sellerUid) ups['userThreads/' + l.sellerUid + '/' + k] = SV.TIMESTAMP;
    ups['threads/' + k + '/msgs/' + RDB.ref('threads/' + k + '/msgs').push().key] =
      { from:'sys', uname:'sistem', text:'Bu ilan için yazışmaya başladın. Satıcıya sorunu yaz, cevabı burada gör.', at:SV.TIMESTAMP };
    await RDB.ref().update(ups);
    openThreadId = k;
    go('mesajlarim');
    setTimeout(() => $id('msgInput').focus(), 60);
  }catch(e){
    const code = (e && (e.code || e.message)) || 'bilinmeyen hata';
    toast('Sohbet açılamadı (' + code + '). Rules güncellenmeli.', 'err', 'x');
  }
}
async function sendMessage(text){
  const t = threadCache[openThreadId];
  if (!t || !fbUser || !profile || !text.trim()) return;
  const other = t.buyerUid === uid() ? t.sellerUid : t.buyerUid;
  const otherField = t.buyerUid === uid() ? 'unreadSeller' : 'unreadBuyer';
  try{
    await RDB.ref('threads/' + t.id + '/msgs').push({ from:uid(), uname:profile.user, text:text.trim(), at:SV.TIMESTAMP });
    const ups = {};
    ups['threads/' + t.id + '/updated'] = SV.TIMESTAMP;
    ups['userThreads/' + t.buyerUid + '/' + t.id] = SV.TIMESTAMP;
    if (t.sellerUid) ups['userThreads/' + t.sellerUid + '/' + t.id] = SV.TIMESTAMP;
    await RDB.ref().update(ups);
    if (other) RDB.ref('threads/' + t.id + '/' + otherField).transaction(v => (v || 0) + 1).catch(() => {});
    if (!t.sellerUid){
      setTimeout(async () => {
        try{
          await RDB.ref('threads/' + t.id + '/msgs').push({ from:'seller', uname:t.seller, text:sellerReply(text), at:SV.TIMESTAMP });
          const u2 = {};
          u2['threads/' + t.id + '/updated'] = SV.TIMESTAMP;
          u2['userThreads/' + t.buyerUid + '/' + t.id] = SV.TIMESTAMP;
          await RDB.ref().update(u2);
          RDB.ref('threads/' + t.id + '/unreadBuyer').transaction(v => (v || 0) + 1).catch(() => {});
        }catch(e){}
      }, 1400);
    }
  }catch(e){ toast('Mesaj gönderilemedi (' + ((e && (e.code || e.message)) || 'hata') + ')', 'err', 'x'); }
}
function clearUnread(t){
  if (!fbUser) return;
  const f = t.buyerUid === uid() ? 'unreadBuyer' : (t.sellerUid === uid() ? 'unreadSeller' : null);
  if (f && t[f]) RDB.ref('threads/' + t.id + '/' + f).set(0).catch(() => {});
}
function renderThreadList(){
  const el = $id('threadList');
  const arr = myTids.map(t => threadCache[t]).filter(Boolean);
  el.innerHTML = arr.length ? arr.map(t => {
    const last = (t.msgs ? Object.keys(t.msgs).map(k => t.msgs[k]) : []).pop() || {};
    const peer = peerOf(t);
    const prev = last.from === 'sys' ? '' : last.uname === myName() ? 'Sen: ' : (last.uname || peer) + ': ';
    return '<button class="th-item ' + (openThreadId === t.id ? 'is-on' : '') + '" data-tid="' + t.id + '">' +
      '<span class="th-av">' + esc(peer[0].toUpperCase()) + '</span>' +
      '<span class="th-txt">' +
        '<span class="th-row1"><b>' + esc(peer) + '</b><time>' + (last.at ? dayLabel(last.at) : '') + '</time></span>' +
        '<span class="th-sub">' + esc((t.title || '').slice(0, 30)) + '</span>' +
        '<span class="th-last">' + esc(prev + (last.text || '')) + '</span>' +
      '</span>' +
      (myUnread(t) ? '<span class="th-badge">' + myUnread(t) + '</span>' : '') +
    '</button>';
  }).join('') : '';
}
function renderThreadBody(t){
  const body = $id('threadBody');
  const msgs = t.msgs ? Object.keys(t.msgs).map(k => t.msgs[k]).sort((a, b) => (a.at || 0) - (b.at || 0)) : [];
  let day = '';
  body.innerHTML = msgs.map(m => {
    let pre = '';
    if (m.from !== 'sys'){
      const d = dayLabel(m.at);
      if (d !== day){ day = d; pre = '<div class="msg-day">' + d + '</div>'; }
    }
    if (m.from === 'sys') return pre + '<div class="msg-sys">' + esc(m.text) + '</div>';
    const isMe = fbUser && (m.from === uid() || m.uname === myName());
    return pre + '<div class="msg ' + (isMe ? 'me' : 'them') + '">' + esc(m.text) + '<time>' + (m.at ? hhmm(m.at) : '') + '</time></div>';
  }).join('');
  body.scrollTop = body.scrollHeight;
}
function renderThreads(){
  renderThreadList();
  const t = threadCache[openThreadId];
  if (!t){
    $id('threadEmpty').hidden = false;
    $id('threadInner').hidden = true;
    $id('threadView').classList.remove('is-open');
    return;
  }
  clearUnread(t);
  const peer = peerOf(t);
  $id('threadEmpty').hidden = true;
  $id('threadInner').hidden = false;
  $id('threadView').classList.add('is-open');
  $id('thName').textContent = peer;
  $id('thListing').textContent = (t.title || '').slice(0, 46);
  $id('thAv').textContent = peer[0].toUpperCase();
  renderThreadBody(t);
}

/* ---------- mesaj sekmeleri: DM + genel sohbet ---------- */
let mtab = 'dm';
function moveMsgTabInd(){
  const on = $('#msgTabs .tab.is-on'), ind = $('#msgTabs .tab-ind');
  if (!on || !ind) return;
  ind.style.width = on.offsetWidth + 'px';
  ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
}
function switchMtab(t){
  mtab = t;
  $$('#msgTabs .tab').forEach(x => x.classList.toggle('is-on', x.dataset.mtab === t));
  $id('dmWrap').hidden = t !== 'dm';
  $id('genWrap').hidden = t !== 'gen';
  moveMsgTabInd();
  if (t === 'gen') renderGeneral();
}
let genMsgs = [], genQuery = null;
function attachGeneral(){
  if (!FB_OK || genQuery || !fbUser) return;
  genQuery = RDB.ref('general').orderByChild('at').limitToLast(60);
  genQuery.on('value', snap => {
    const v = snap.val() || {};
    genMsgs = Object.keys(v).map(k => v[k]).sort((a, b) => (a.at || 0) - (b.at || 0));
    if (mtab === 'gen' && page === 'mesajlarim') renderGeneral();
    $id('genCount').textContent = genMsgs.length ? genMsgs.length + ' mesaj · tardu üyeleri burada' : 'tardu üyeleri burada';
  }, () => { genQuery = null; });
}
function detachGeneral(){
  if (genQuery){ genQuery.off(); genQuery = null; }
  genMsgs = [];
}
function renderGeneral(){
  const body = $id('genBody');
  if (!genMsgs.length){
    body.innerHTML = '<div class="msg-sys">Henüz mesaj yok. İlk yazan sen ol.</div>';
    return;
  }
  body.innerHTML = genMsgs.map(m => {
    const isMe = fbUser && m.uid === uid();
    return '<div class="msg ' + (isMe ? 'me' : 'them') + '">' +
      (isMe ? '' : '<span class="gen-name">' + esc(m.uname || 'üye') + '</span>') +
      esc(m.text) + '<time>' + (m.at ? hhmm(m.at) : '') + '</time></div>';
  }).join('');
  body.scrollTop = body.scrollHeight;
}
async function sendGeneral(text){
  if (!needFB()) return;
  if (!fbUser){ pendingPage = 'mesajlarim'; openAuthWall('Genel sohbete katılmak için giriş yap.'); return; }
  if (!profile) return toast('Profilin yüklenemedi. Veritabanı kurallarını kontrol et.', 'err', 'x');
  text = (text || '').trim();
  if (!text) return;
  try{ await RDB.ref('general').push({ uid:uid(), uname:profile.user, text:text.slice(0, 300), at:SV.TIMESTAMP }); }
  catch(e){ toast('Mesaj gönderilemedi.', 'err', 'x'); }
}

/* ---------- cüzdan (IBAN ile yatırma / çekme talebi) ---------- */
const myRefCode = () => 'TARDU-' + String(uid() || 'XXXXXX').slice(0, 6).toUpperCase();
async function walletAsk(kind){
  if (!fbUser || !needFB()) return;
  openMoney(kind);
}
function openMoney(kind){
  $id('moneyTitle').textContent = kind === 'in' ? 'Para yatır' : 'Para çek';
  moneyAmountStep(kind);
  openModal('mMoney');
}
function moneyAmountStep(kind){
  const B = $id('moneyBody'), F = $id('moneyFoot');
  if (kind === 'in'){
    B.innerHTML =
      '<label class="field"><span>Yatırmak istediğin tutar (TL) <i>*</i></span>' +
      '<div class="input-money"><span>₺</span><input id="mAmount" inputmode="numeric" placeholder="0" /></div></label>' +
      '<div class="money-note">Havale / EFT ile site sahibinin IBAN adresine gönderim yapacaksın. Sonraki adımda IBAN ve açıklama kodu gösterilecek.</div>';
    F.innerHTML = '<button class="btn ghost" id="mCancel">Vazgeç</button><button class="btn primary" id="mNext"><span>Devam et</span></button>';
  } else {
    B.innerHTML =
      '<label class="field"><span>Çekmek istediğin tutar (TL) <i>*</i></span>' +
      '<div class="input-money"><span>₺</span><input id="mAmount" inputmode="numeric" placeholder="0" /></div></label>' +
      '<label class="field"><span>Paranın geleceği IBAN <i>*</i></span><input id="mIban" placeholder="TR__ ____ ____ ____ ____ ____ __" /></label>' +
      '<div class="money-note">Talebin site sahibine iletilir. Mevcut bakiyen: <b>' + money(profile ? profile.balance || 0 : 0) + '</b></div>';
    F.innerHTML = '<button class="btn ghost" id="mCancel">Vazgeç</button><button class="btn primary" id="mNext"><span>Talebi gönder</span></button>';
  }
  $id('mCancel').onclick = closeModal;
  $id('mNext').onclick = () => {
    const v = Math.round(+($id('mAmount').value || '').replace(/[^0-9]/g, '') || 0);
    if (!v || v < 10) return toast('En az 10 TL olmalı.', 'err', 'coins');
    if (kind === 'in') moneyIbanStep(v);
    else {
      const iban = ($id('mIban').value || '').trim();
      if (iban.replace(/\s/g, '').length < 15) return toast('Geçerli bir IBAN gir.', 'err', 'x');
      submitWithdraw(v, iban);
    }
  };
  setTimeout(() => { const a = $id('mAmount'); if (a) a.focus(); }, 200);
}
function moneyIbanStep(amount){
  const B = $id('moneyBody'), F = $id('moneyFoot');
  const ref = myRefCode();
  B.innerHTML =
    '<div class="money-note">Aşağıdaki IBAN adresine <b>' + money(amount) + '</b> gönder. Açıklama kısmına kodu yazmayı unutma, yoksa ödemen eşleşmez.</div>' +
    '<label class="field"><span>Alıcı</span><input value="' + esc(OWNER_NAME) + '" readonly tabindex="-1" /></label>' +
    '<label class="field"><span>IBAN</span><div class="iban-box"><code>' + esc(OWNER_IBAN) + '</code>' +
    '<button class="copy-btn" id="mCopy">' + icon('coins') + 'Kopyala</button></div></label>' +
    '<label class="field"><span>Açıklama kodu</span><span class="ref-code">' + esc(ref) + '</span></label>';
  F.innerHTML = '<button class="btn ghost" id="mBack">Geri</button><button class="btn primary" id="mDone"><span>Parayı gönderdim</span></button>';
  $id('mBack').onclick = () => moneyAmountStep('in');
  $id('mCopy').onclick = async () => {
    try{ await navigator.clipboard.writeText(OWNER_IBAN.replace(/\s/g, '')); toast('IBAN kopyalandı.', 'ok', 'check'); }
    catch(e){ toast('Kopyalanamadı, IBANı elle seçip kopyala.', 'err', 'x'); }
  };
  $id('mDone').onclick = () => submitDeposit(amount, ref);
}
async function submitDeposit(amount, ref){
  try{
    await RDB.ref('deposits/' + uid()).push({ type:'in', amount, ref, at:SV.TIMESTAMP, status:'pending' });
    await RDB.ref('users/' + uid() + '/tx').push({ t:'Yatırma talebi — ' + money(amount) + ' (onay bekleniyor)', v:0, d:'Açıklama: ' + ref, at:SV.TIMESTAMP });
    closeModal();
    toast('Talebin alındı. Onay sonrası bakiyene eklenecek.', 'ok', 'check');
  }catch(e){ toast('Talep gönderilemedi.', 'err', 'x'); }
}
async function submitWithdraw(amount, iban){
  if (amount > (profile.balance || 0)) return toast('Bakiyenden fazla çekemezsin.', 'err', 'wallet');
  try{
    await RDB.ref('deposits/' + uid()).push({ type:'out', amount, iban, at:SV.TIMESTAMP, status:'pending' });
    await RDB.ref('users/' + uid() + '/tx').push({ t:'Çekim talebi — ' + money(amount) + ' (onay bekleniyor)', v:0, d:'IBAN: ' + iban.slice(0, 12) + '…', at:SV.TIMESTAMP });
    closeModal();
    toast('Talebin alındı. Onay sonrası gönderim yapılacak.', 'ok', 'check');
  }catch(e){ toast('Talep gönderilemedi.', 'err', 'x'); }
}
function clearTx(){
  toast('İşlem geçmişi sunucuda tutulur, silinemez.', 'info', 'coins');
}

/* ---------- profil ---------- */
function paintAccount(){
  const letter = profile ? (profile.name || profile.user || '?')[0].toUpperCase()
    : fbUser && fbUser.email ? fbUser.email[0].toUpperCase() : '?';
  [$id('avatarFace'), $id('sbUserAv')].forEach(el => {
    el.style.backgroundImage = profile && profile.avatar ? 'url(' + profile.avatar + ')' : '';
    el.textContent = profile && profile.avatar ? '' : letter;
  });
  $id('sbUserName').textContent = profile ? profile.name : (fbUser ? 'Yükleniyor…' : 'Giriş yap');
  $id('sbUserSub').textContent = profile ? '@' + profile.user : (fbUser ? fbUser.email : 'Ücretsiz hesap aç');
}
function paintSettings(){
  if (!fbUser || !profile) return;
  $id('sUser').value = profile.user || '';
  $id('sName').value = profile.name || '';
  $id('sMail').value = profile.mail || '';
  $id('sTel').value = profile.tel || '';
  const ap = $id('avatarPrev');
  ap.style.backgroundImage = profile.avatar ? 'url(' + profile.avatar + ')' : '';
  ap.textContent = profile.avatar ? '' : ((profile.name || '?')[0].toUpperCase());
  $id('nMsg').checked = profile.notif ? profile.notif.msg !== false : true;
  $id('nOffer').checked = profile.notif ? profile.notif.offer !== false : true;
  $id('nSale').checked = profile.notif ? profile.notif.sale !== false : true;
  $id('accDate').textContent = profile.created ? new Date(profile.created).toLocaleDateString('tr-TR') : '—';
  $id('accUser').textContent = '@' + profile.user;
  $id('accId').textContent = String(uid()).slice(0, 8).toUpperCase();
  $$('#p-ayarlar .switch input, #p-ayarlar .field input').forEach(i => {
    if (i.dataset.bound) return;
    i.dataset.bound = '1';
    i.addEventListener('input', markDirty);
  });
}
function markDirty(){ $id('saveBar').classList.add('show'); }
async function saveProfile(){
  if (!fbUser || !profile || !needFB()) return;
  const nu = $id('sUser').value.trim().toLowerCase();
  const nm = $id('sName').value.trim();
  const tl = $id('sTel').value.trim();
  if (!/^[a-z0-9_.]{3,20}$/.test(nu)) return toast('Kullanıcı adı 3-20 karakter, küçük harf ve rakam olmalı.', 'err', 'user');
  if (nm.length < 3) return toast('Ad soyad en az 3 karakter olmalı.', 'err', 'user');
  if (tl.replace(/\D/g, '').length < 10) return toast('Telefon numarası eksik.', 'err', 'phone');
  try{
    if (nu !== profile.user){
      const claim = await RDB.ref('usernames/' + nu).transaction(cur => cur === null ? profile.mail : undefined);
      if (!claim.committed) return toast('Bu kullanıcı adı alınmış.', 'err', 'user');
      const ups = {};
      ups['usernames/' + profile.user] = null;
      ups['users/' + uid() + '/user'] = nu;
      listings.filter(x => x.sellerUid === uid()).forEach(x => { ups['listings/' + x.id + '/seller'] = nu; });
      await RDB.ref().update(ups);
    }
    await RDB.ref('users/' + uid()).update({ name:nm, tel:tl,
      notif:{ msg:$id('nMsg').checked, offer:$id('nOffer').checked, sale:$id('nSale').checked } });
    $id('saveBar').classList.remove('show');
    toast('Profil güncellendi.', 'ok', 'check');
  }catch(e){ toast('Kaydetme başarısız.', 'err', 'x'); }
}
async function changePassword(){
  if (!fbUser || !needFB()) return;
  const o = $id('pwOld').value, n1 = $id('pwNew').value, n2 = $id('pwNew2').value;
  if (n1.length < 6) return toast('Yeni şifre en az 6 karakter olmalı.', 'err', 'key');
  if (n1 !== n2) return toast('Yeni şifreler eşleşmiyor.', 'err', 'key');
  try{
    const cred = firebase.auth.EmailAuthProvider.credential(fbUser.email, o);
    await fbUser.reauthenticateWithCredential(cred);
    await fbUser.updatePassword(n1);
    $id('pwOld').value = ''; $id('pwNew').value = ''; $id('pwNew2').value = '';
    $id('pwBar').style.width = '0';
    toast('Şifren güncellendi.', 'ok', 'check');
  }catch(e){ toast(authErr(e) === 'İşlem başarısız. Tekrar dene.' ? 'Mevcut şifre hatalı.' : authErr(e), 'err', 'key'); }
}
async function changeEmail(){
  if (!fbUser || !needFB()) return;
  const nm = $id('mailNew').value.trim().toLowerCase();
  const pw = $id('mailPw').value;
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(nm)) return toast('Geçerli bir e-posta gir.', 'err', 'mail');
  try{
    const cred = firebase.auth.EmailAuthProvider.credential(fbUser.email, pw);
    await fbUser.reauthenticateWithCredential(cred);
    await fbUser.updateEmail(nm);
    await RDB.ref('users/' + uid() + '/mail').set(nm);
    $id('mailNew').value = ''; $id('mailPw').value = '';
    toast('E-postan güncellendi.', 'ok', 'check');
  }catch(e){
    toast(e.code === 'auth/email-already-in-use' ? 'Bu e-posta zaten kayıtlı.' : (authErr(e) === 'İşlem başarısız. Tekrar dene.' ? 'Şifre hatalı.' : authErr(e)), 'err', 'mail');
  }
}
function pwStrength(){
  const v = $id('pwNew').value;
  let s = 0;
  if (v.length >= 6) s++;
  if (v.length >= 10) s++;
  if (/[A-ZĞÜŞİÖÇ]/.test(v) && /[a-zğüşıöç]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  const bar = $id('pwBar');
  bar.style.width = Math.min(100, s * 22) + '%';
  bar.style.background = s <= 2 ? 'var(--bad)' : s <= 3 ? 'var(--warn)' : 'var(--ok)';
}
function fileToAvatar(file){
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try{
        const sc = Math.min(1, 256 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * sc));
        c.height = Math.max(1, Math.round(img.height * sc));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.82));
      }catch(e){ rej(e); }
    };
    img.onerror = rej;
    img.src = url;
  });
}
async function removeAvatar(){
  if (!fbUser) return;
  try{ await RDB.ref('users/' + uid() + '/avatar').set(''); toast('Profil fotoğrafı kaldırıldı.', 'info', 'image'); }
  catch(e){ toast('İşlem başarısız.', 'err', 'x'); }
}
async function resetData(){
  if (!fbUser) return;
  if (!confirm('Hesap verilerin silinsin mi? İlanların pazarda kalır. Bu işlem geri alınamaz.')) return;
  try{
    const ups = {};
    ups['users/' + uid()] = null;
    ups['userThreads/' + uid()] = null;
    if (profile) ups['usernames/' + profile.user] = null;
    await RDB.ref().update(ups);
    await FAuth.signOut();
    location.reload();
  }catch(e){ toast('Silme başarısız.', 'err', 'x'); }
}

/* ---------- bağlantı kendi kendine testi ---------- */
async function selfTest(){
  const out = [];
  const put = s => { out.push(s); $id('testOut').innerHTML = out.join('<br>'); };
  $id('testOut').innerHTML = 'Test çalışıyor…';
  if (!FB_OK){ put('1) Firebase SDK: YÜKLENEMEDİ (internet ya da script hatası)'); return; }
  put('1) Firebase SDK: tamam');
  if (!fbUser){ put('2) Giriş: YOK — önce giriş yap'); return; }
  put('2) Giriş: tamam (' + fbUser.email + ')');
  try{
    await RDB.ref('listings').limitToFirst(1).get();
    put('3) İlan okuma: tamam');
  }catch(e){ put('3) İlan okuma: HATA (' + ((e && e.code) || e.message || e) + ')'); }
  try{
    const p = RDB.ref('users/' + uid() + '/_probe');
    await p.set({ at:Date.now() });
    await p.remove();
    put('4) Yazma yetkisi: tamam');
  }catch(e){ put('4) Yazma yetkisi: HATA (' + ((e && e.code) || e.message || e) + ')'); }
  put(profile ? '5) Profil: yüklendi (@' + profile.user + ')' : '5) Profil: Y\u00d9KLENEMED\u0130 \u2014 Rules k\u0131sm\u0131n\u0131 kontrol et');
  try{
    const t = RDB.ref('threads/_probe');
    await t.set({ buyerUid:uid(), sellerUid:null, created:Date.now() });
    await t.remove();
    put('6) Sohbet yazma: tamam');
  }catch(e){ put('6) Sohbet yazma: HATA (' + ((e && e.code) || e.message || e) + ') \u2190 Rules i\u011findeki threads k\u0131sm\u0131n\u0131 g\u00f6ncelle'); }
}

/* ---------- destek ---------- */
const BOT_REPLIES = [
  [/komisyon|oran|nedir/i, 'Her satışta <b>%4</b> komisyon alıyoruz. Gizli kesinti yok: 1.500 TL fiyata 60 TL komisyon, 1.440 TL satıcıya geçiyor.'],
  [/ne zaman|teslim/i, 'Ödeme onaylandıktan sonra bilgiler genelde <b>2-5 dakika</b> içinde iletilir. Yoğun saatlerde 10 dakikayı bulabilir.'],
  [/ödeme|cüzdan/i, 'Satıcıya ödeme cüzdan bakiyenden anında yapılır. <b>Cüzdanım &rarr; İşlem geçmişi</b> bölümünde görürsün.'],
  [/mesaj|yaz/i, 'Her ilanın üzerindeki mesaj düğmesinden satıcıya yazabilirsin. Yazışma <b>Mesajlarım</b> sekmesinde birikir.'],
  [/hesap aç|kayıt|üyelik/i, 'Ücretsiz hesap açmak için kullanıcı adı, ad soyad, e-posta ve telefon yeterli. Giriş sonrası tüm bölümler açılır.'],
  [/güven|garanti|sahte/i, 'Tüm hesaplar satıcı doğrulamasından geçiyor. Yine de <b>ödemesi teslimattan sonra</b> yapmanı öneriyoruz.']
];
function botSay(text){
  const body = $id('chatBody');
  const mine = document.createElement('div');
  mine.className = 'msg me2'; mine.textContent = text; body.appendChild(mine);
  body.scrollTop = body.scrollHeight;
  const r = BOT_REPLIES.find(x => x[0].test(text.toLocaleLowerCase('tr')));
  setTimeout(() => {
    const b = document.createElement('div');
    b.className = 'msg bot';
    b.innerHTML = r ? r[1] : 'Anladım knk. Ekibimiz ilgileniyor, birazdan dönüş yapacağız.';
    body.appendChild(b); body.scrollTop = body.scrollHeight;
  }, 700);
}

/* ---------- komut paleti ---------- */
let cmdIdx = 0, cmdArr = [];
function cmdItems(){
  const arr = [
    { i:'compass', t:'Keşfet sayfası', s:'ilanları gör', k:'1', act:() => go('kesfet') },
    { i:'box', t:'İlanlarım', s:'aktif ve pasif ilanlar', k:'2', act:() => go('ilanlarim') },
    { i:'heart', t:'Favorilerim', s:'sakladığın hesaplar', k:'3', act:() => go('favorilerim') },
    { i:'chat', t:'Mesajlarım', s:'satıcı yazışmaları', k:'4', act:() => go('mesajlarim') },
    { i:'wallet', t:'Cüzdanım', s:'bakiye ve geçmiş', k:'5', act:() => go('cuzdanim') },
    { i:'cog', t:'Ayarlar', s:'profil ve güvenlik', k:'6', act:() => go('ayarlar') },
    { i:'plus', t:'Yeni ilan oluştur', s:'%4 komisyonlu', k:'N', act:openListing },
    { i:'headset', t:'Destek', s:'asistanla konuş', k:'', act:() => openModal('mChat') }
  ];
  CATS.forEach(c => arr.push({ i:c.g, t:c.name, s:'kategoriye göz at', k:'', act:() => { cat = c.id; rail(); go('kesfet'); } }));
  return arr;
}
function openCmd(){
  openModal('mCmd'); $id('cmdText').value = ''; cmFilter(''); setTimeout(() => $id('cmdText').focus(), 150);
}
function cmFilter(q){
  const all = cmdItems();
  cmdArr = (q ? all.filter(c => (c.t + ' ' + c.s).toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr'))) : all).slice(0, 12);
  cmdIdx = 0;
  $id('cmdList').innerHTML = cmdArr.length
    ? cmdArr.map((c, i) => '<div class="cm-i ' + (i === 0 ? 'on' : '') + '" data-i="' + i + '"><span class="ci">' + icon(c.i) + '</span>' +
        '<span class="ct"><b>' + c.t + '</b><small>' + c.s + '</small></span>' + (c.k ? '<span class="cs">' + c.k + '</span>' : '') + '</div>').join('')
    : '<div class="cm-sep">Sonuç yok</div>';
}
function cmRun(i){
  const c = cmdArr[i];
  if (!c) return;
  closeModal();
  setTimeout(() => c.act(), 150);
}
function cmSel(i){
  cmdIdx = i;
  $$('.cm-i').forEach((x, k) => x.classList.toggle('on', k === i));
}

/* ---------- panel ---------- */
function setCollapsed(on){
  uiState.collapsed = on;
  document.body.classList.toggle('sb-collapsed', on);
  saveUI();
  setTimeout(movePill, 20);
}
function closeDrawer(){ document.body.classList.remove('sb-open'); }

/* ---------- ilerleme çubuğu ---------- */
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const h = document.documentElement.scrollHeight - innerHeight;
    $id('progressBar').style.transform = 'scaleX(' + (h > 0 ? clamp(scrollY / h, 0, 1) : 0) + ')';
    ticking = false;
  });
}, { passive:true });

/* ---------- başlat ---------- */
function init(){
  document.body.classList.toggle('sb-collapsed', !!uiState.collapsed);

  if (!FB_OK){
    $id('connText').textContent = 'Bağlantı yok';
    $id('connDot').classList.add('off');
    toast('Firebase yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenile.', 'err', 'x');
  } else {
    RDB.ref('.info/connected').on('value', s => {
      const on = !!s.val();
      $id('connDot').classList.toggle('on', on);
      $id('connDot').classList.toggle('off', !on);
      $id('connText').textContent = on ? 'Çevrimiçi' : 'Çevrimdışı';
    });
    attachListings();
    FAuth.onAuthStateChanged(u => {
      fbUser = u;
      detachUser();
      profile = null; favs = {}; txList = []; threadCache = {}; myTids = [];
      openThreadId = null;
      if (u){
        attachUser(u.uid); attachGeneral();
        setTimeout(() => {
          if (fbUser && fbUser.uid === u.uid && !profile)
            toast('Verilerin yüklenemedi. Firebase Rules kısmını kontrol et.', 'err', 'x');
        }, 7000);
      }
      else { detachGeneral(); }
      applyLockState();
      paintAccount();
      render(page);
    });
  }

  $id('fCat').innerHTML = CATS.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
  $id('fTags').innerHTML = TAGS.map(t => '<button type="button" class="tchip" data-t="' + t + '">' + t + '</button>').join('');

  rail();
  render('kesfet');
  applyLockState();
  paintAccount();

  $$('.nav-i').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
  $$('.tabbar .t-i').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
  $$('.tabs .tab').forEach(t => t.addEventListener('click', () => { tab = t.dataset.tab; render('ilanlarim'); }));
  $$('#msgTabs .tab').forEach(t => t.addEventListener('click', () => switchMtab(t.dataset.mtab)));
  $id('sbToggle').onclick = () => setCollapsed(!uiState.collapsed);
  $id('burger').onclick = () => document.body.classList.toggle('sb-open');
  $id('sbScrim').onclick = closeDrawer;
  $id('balanceBtn').onclick = () => go('cuzdanim');
  $id('avatarBtn').onclick = () => {
    if (fbUser){ go('ayarlar'); return; }
    pendingPage = 'ayarlar';
    openAuthWall('Hesabına giriş yap. Hesabın yoksa kayıt olabilirsin.', 'login');
  };
  $id('sbUser').onclick = () => {
    if (fbUser){ go('ayarlar'); return; }
    pendingPage = 'ayarlar';
    openAuthWall('Hesabına giriş yap. Hesabın yoksa kayıt olabilirsin.', 'login');
  };
  $id('supportBtn').onclick = () => openModal('mChat');
  $id('omni').onclick = () => $id('arama').focus();
  $id('heroCta').onclick = openListing;
  $id('newListingBtn').onclick = openListing;
  $id('tabFab').onclick = openListing;
  $id('heroRail').onclick = () => $id('railWrap').scrollIntoView({ block:'center' });

  $id('rail').addEventListener('click', e => {
    const b = e.target.closest('.catchip');
    if (!b) return;
    cat = b.dataset.cat; rail(); render('kesfet');
    toast(cat === 'tumu' ? 'Tüm kategoriler' : catOf(cat).name + ' seçildi', 'info', 'filter');
  });
  $$('[data-rail]').forEach(b => b.onclick = () => { const r = $id('rail'); r.scrollBy({ left:(+b.dataset.rail) * (r.clientWidth * .55), behavior:'smooth' }); });
  $$('.sort').forEach(b => b.onclick = () => { $$('.sort').forEach(x => x.classList.remove('is-on')); b.classList.add('is-on'); sort = b.dataset.sort; render('kesfet'); });
  $id('arama').addEventListener('input', e => { term = e.target.value.trim(); render('kesfet'); });

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (t){
      e.stopPropagation();
      const id = t.dataset.id, a = t.dataset.act;
      if (a === 'buy'){ closeModal(); setTimeout(() => buy(id), 150); }
      else if (a === 'fav') fav(id);
      else if (a === 'msg'){ closeModal(); messageSeller(id); }
      else if (a === 'toggle') mineToggle(id);
      else if (a === 'del') mineDel(id);
      else if (a === 'new') openListing();
      return;
    }
    const th = e.target.closest('.th-item');
    if (th){ openThreadId = th.dataset.tid; renderThreads(); return; }
    const card = e.target.closest('.card');
    if (card && !e.target.closest('button')) detail(card.dataset.id);
  });

  ['fPrice','fTitle','fDesc','fAgree'].forEach(id => {
    const el = $id(id);
    el.addEventListener('input', calcListing);
    el.addEventListener('change', calcListing);
  });
  $id('fTitle').addEventListener('input', () => $id('tCnt').textContent = $id('fTitle').value.length + '/60');
  $id('fDesc').addEventListener('input', () => $id('dCnt').textContent = $id('fDesc').value.length + '/400');
  $id('fTags').addEventListener('click', e => { const b = e.target.closest('.tchip'); if (b) b.classList.toggle('on'); });
  $id('publishBtn').onclick = publishListing;
  $id('imgPick').onclick = () => $id('imgFile').click();
  $id('imgUpload').onclick = () => $id('imgFile').click();
  $id('imgReset').onclick = () => { customImage = false; applyDefaultImage(); toast('Varsayılan görsel seçildi.', 'info', 'image'); };
  $id('fCat').addEventListener('change', () => { if (!customImage) applyDefaultImage(); });
  $id('imgFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 6e6) return toast('Dosya 6MB üzerinde.', 'err', 'image');
    try{
      const out = await shrinkImage(f, 900, 0.72);
      if (out.length > 500000) return toast('Görsel çok büyük, başka bir foto dene.', 'err', 'image');
      listingImage = out; customImage = true;
      paintImgPick();
      calcListing();
      toast('Görsel eklendi.', 'ok', 'check');
    }catch(err){ toast('Görsel okunamadı.', 'err', 'x'); }
    e.target.value = '';
  });
  $$('[data-close]').forEach(b => b.onclick = closeModal);
  $id('scrim').onclick = closeModal;

  $id('threadForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = $id('msgInput').value.trim();
    if (!v) return;
    sendMessage(v);
    $id('msgInput').value = '';
  });
  $id('genForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = $id('genInput').value.trim();
    if (!v) return;
    sendGeneral(v);
    $id('genInput').value = '';
  });
  $id('threadBack').onclick = () => { $id('threadView').classList.remove('is-open'); openThreadId = null; renderThreads(); };
  $id('thListingBtn').onclick = () => { const t = threadCache[openThreadId]; if (t) detail(t.listingId); };

  $id('chatForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = $id('chatText').value.trim();
    if (!v) return;
    botSay(v); $id('chatText').value = '';
  });
  $$('.chat-quick button').forEach(b => b.onclick = () => botSay(b.dataset.q));

  $id('cmdText').addEventListener('input', e => cmFilter(e.target.value));
  $id('cmdList').addEventListener('click', e => { const i = e.target.closest('.cm-i'); if (i) cmRun(+i.dataset.i); });
  $id('cmdList').addEventListener('pointermove', e => { const i = e.target.closest('.cm-i'); if (i) cmSel(+i.dataset.i); });

  $id('walletIn').onclick = () => walletAsk('in');
  $id('walletOut').onclick = () => walletAsk('out');
  $id('txClear').onclick = clearTx;

  $id('saveProfile').onclick = saveProfile;
  $id('pwSave').onclick = changePassword;
  $id('mailSave').onclick = changeEmail;
  $id('pwNew').addEventListener('input', pwStrength);
  $id('avatarRemove').onclick = removeAvatar;
  $id('logoutBtn').onclick = logout;
  $id('resetData').onclick = resetData;
  $id('testConn').onclick = selfTest;
  $id('avatarFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f || !fbUser) return;
    if (f.size > 3e6) return toast('Dosya 3MB üzerinde.', 'err', 'image');
    try{
      const av = await fileToAvatar(f);
      await RDB.ref('users/' + uid() + '/avatar').set(av);
      toast('Profil fotoğrafı güncellendi.', 'ok', 'camera');
    }catch(err){ toast('Yükleme başarısız.', 'err', 'x'); }
    e.target.value = '';
  });

  $id('regForm').addEventListener('submit', doRegister);
  $id('logForm').addEventListener('submit', doLogin);
  $('.aw-alt [data-atab]').onclick = () => switchAuthTab('register');
  $id('authwall').addEventListener('click', e => { if (e.target === $id('authwall')) closeAuthWall(); });

  addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); openCmd(); return; }
    if (e.key === 'Escape'){
      if (!$id('authwall').hidden) closeAuthWall();
      else if (activeModal) closeModal();
      else closeDrawer();
      return;
    }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    if (e.key === '/'){ e.preventDefault(); $id('arama').focus(); return; }
    if (e.key === 'n' || e.key === 'N'){ openListing(); return; }
    if (e.key === 'f' || e.key === 'F'){ setCollapsed(!uiState.collapsed); return; }
    if (e.key.length === 1 && '123456'.indexOf(e.key) > -1) go(['kesfet','ilanlarim','favorilerim','mesajlarim','cuzdanim','ayarlar'][+e.key - 1]);
    if (activeModal === 'mCmd'){
      if (e.key === 'ArrowDown'){ e.preventDefault(); cmSel(Math.min(cmdIdx + 1, cmdArr.length - 1)); }
      if (e.key === 'ArrowUp'){ e.preventDefault(); cmSel(Math.max(cmdIdx - 1, 0)); }
      if (e.key === 'Enter'){ e.preventDefault(); cmRun(cmdIdx); }
    }
  });

  addEventListener('resize', () => { movePill(); moveTabInd(); moveMsgTabInd(); }, { passive:true });
  requestAnimationFrame(() => { movePill(); moveTabInd(); moveMsgTabInd(); });
}
document.addEventListener('DOMContentLoaded', init);

window.openListing = openListing;
window.toast = toast;
})();