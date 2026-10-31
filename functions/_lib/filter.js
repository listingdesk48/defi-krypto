/* Filter správ záujemcov k inzerátom.
   Správa so zakázaným slovom alebo údajom nejde zadávateľovi, ale majiteľovi na kontrolu.
   Zoznam je len na serveri (nie vo verejnom JS), aby sa nedal obísť.
   Zápis: hviezdička na konci slova = stačí začiatok slova (všetky tvary). Bez hviezdičky = len celé slovo.
   Viac slov = musia ísť po sebe. Diakritika a veľké písmená sa ignorujú. */

var SLOVA = {
  'Podvod': [
    'podvod*', 'podvies*', 'podvest*', 'podvied*', 'podved*', 'podvad*', 'oklam*', 'klam*', 'luh*', 'lhal*', 'lhar*',
    'zlodej*', 'ukrad*', 'okrad*', 'vylak*', 'zneuz*', 'falosn*', 'falesn*', 'podozriv*', 'podezrel*', 'nedoveryhodn*', 'neduveryhodn*',
    'pozor', 'podfuk*', 'podraz*', 'svindl*', 'smejd*', 'napali*', 'napalen*', 'obabra*', 'zlodejin*', 'vytunel*',
    'lhat', 'obalamut*', 'osidi*', 'osizen*', 'sidil*', 'sizen*', 'scam*', 'fraud*', 'fake', 'cheat*'
  ],
  'Polícia a trestné konanie': [
    'polic*', 'kriminal*', 'vysetrov*', 'trestn*', 'trestnopravn*', 'stihan*', 'prokurat*', 'statn* zastup*', 'obvinen*',
    'oznamen*', 'oznami*', 'nahlas*', 'udal', 'udala', 'udali', 'udam', 'udame', 'udat', 'udav*', 'podam na vas', 'podam na teba'
  ],
  'Súd a právnici': [
    'sud*', 'soud*', 'zalob*', 'zalov*', 'advokat*', 'pravnik*', 'lawyer*', 'court*'
  ],
  'Úrady, NBS, povolenia': [
    'nbs', 'cnb', 'narodn* bank*', 'centraln* bank*', 'dohlad', 'dohladu', 'dohladom', 'dohladov*', 'dohled', 'dohledu',
    'regulac*', 'regulovan*', 'neregulovan*', 'povolen*', 'nepovolen*', 'licen*', 'opravnen*', 'neopravnen*',
    'legaln*', 'nelegaln*', 'nezakon*', 'protizakon*', 'certifik*', 'permit*',
    'dozor*', 'soi', 'coi', 'inspekc*', 'ochran* spotrebitel*', 'dtest', 'ombudsman*', 'stazn*', 'stazov*', 'stiznost*', 'stezova*'
  ],
  'Médiá': [
    'novinar*', 'redakc*', 'reportaz*', 'markiz*', 'joj', 'aktuality', 'novy cas', 'noveho casu', 'plus jeden den', 'nova tv', 'blesk', 'ceska televize', 'ceske televize', 'ct24', 'idnes*', 'seznam zpravy', 'denik n', 'dennik n'
  ],
  'Recenzie a skúsenosti': [
    'skusen*', 'zkusen*', 'recenz*', 'odporuc*', 'doporuc*', 'hodnoten*', 'hodnocen*', 'referenc*', 'varov*', 'varuj*',
    'diskus*', 'diskuz*', 'forum', 'trustpilot*', 'modry konik', 'modreho konika', 'heureka*', 'review*', 'experience*', 'feedback*'
  ],
  'Krypto': [
    'bitcoin*', 'btc', 'usdt', 'krypto*', 'ethereum*', 'tether*', 'wallet*', 'penazenk*', 'penezenk*', 'seed*', 'binance*', 'coinbase*'
  ],
  'Kontakty': [
    'whatsapp*', 'whats app', 'telegram*', 'viber*', 'signal*', 'messenger*', 'facebook*', 'instagram*', 'tiktok*', 'tik tok',
    'skype*', 'discord*', 'zavinac*', 'gmail*', 'yahoo*', 'hotmail*', 'outlook*', 'proton*', 'icloud*', 'azet*',
    'seznam cz', 'centrum cz', 'email cz', 'post cz', 'bodka com', 'bodka sk', 'bodka cz', 'bodka eu', 'tecka com', 'tecka cz', 'tecka sk', 'dot com'
  ],
  'Platby vopred a poplatky': [
    'poplat* vopred', 'poplat* dopredu', 'poplat* predem', 'zaplat* vopred', 'zaplat* dopredu', 'zaplat* predem',
    'platb* vopred', 'platb* predem', 'platb* dopredu', 'zaloh*', 'manipulac* poplat*', 'spracovatel* poplat*', 'zpracovatel* poplat*',
    'aktivac* poplat*', 'overovac* poplat*', 'poplat* za vybaven*', 'poplat* za vyrizen*', 'poisten* uver*', 'pojisten* uver*',
    'notar*', 'kolok*', 'kolky', 'kolkov', 'kolek*', 'kolku', 'poukazk*', 'poukazek', 'kauc*', 'western union', 'westernunion', 'moneygram*', 'paysafe*',
    'darcekov* kart*', 'darkov* kart*', 'gift card*', 'giftcard*', 'kupon*'
  ],
  'Platobné služby': [
    'paypal*', 'revolut*', 'skrill*', 'wise', 'payoneer*', 'monese*'
  ],
  'Citlivé údaje': [
    'rodn* cisl*', 'cisl* kart*', 'cvv', 'cvc', 'pin', 'pinu', 'pinkod*', 'hesl*', 'internet* banking*', 'internetbanking*',
    'prihlasovac* udaj*', 'fotk* obciansk*', 'fotk* obcansk*', 'fotk* obcank*', 'fotk* op', 'selfie*'
  ],
  'Vzdialený prístup': [
    'anydesk*', 'any desk', 'teamviewer*', 'team viewer', 'rustdesk*', 'quicksupport*', 'quick support'
  ],
  'Bankové údaje': [
    'iban*', 'cisl* uct*', 'bankov* uct*', 'swift*', 'bic'
  ],
  'Vyhrážky': [
    'zabij*', 'zabit*', 'dobij*', 'zlomim*', 'zapalim*', 'najdem ta', 'najdeme ta', 'najdem vas', 'najdeme vas', 'najdu te', 'najdu vas',
    'viem kde byv*', 'vim kde bydl*', 'pozabija*', 'zmlat*', 'podpal*', 'rozbij* hub*', 'najdem si ta', 'najdu si te'
  ],
  'Vulgarizmy': [
    'kurv*', 'skurv*', 'pic', 'pica', 'pice', 'picu', 'pico*', 'pici*', 'picus*', 'jeb*', 'zjeb*', 'ojeb*', 'najeb*', 'dojeb*', 'vyjeb*',
    'rozjeb*', 'pojeb*', 'kokot*', 'chuj*', 'debil*', 'idiot*', 'kreten*', 'zmrd*', 'mrd*', 'hajzl*', 'prdel*', 'hovn*', 'srack*', 'kkt', 'curak*', 'srac', 'sraci', 'zkurv*', 'vyser*', 'nasrat*', 'posrat*', 'kunda'
  ]
};

/* Odstráni diakritiku a zmení na malé písmená. */
function bezDiakritiky(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* Čísla a znaky v slovách preloží späť na písmená (p0dv0d → podvod, b1tc0in → bitcoin). */
var LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i', '|': 'i' };

function slovaZTextu(text) {
  var kusy = bezDiakritiky(text).split(/\s+/), slova = [];
  kusy.forEach(function (k) {
    if (/[a-z]/.test(k)) k = k.replace(/[013457@$!|]/g, function (c) { return LEET[c]; });
    k.replace(/[^a-z]+/g, ' ').trim().split(' ').forEach(function (w) { if (w) slova.push(w); });
  });
  /* Rozsekané slová ("b i t c o i n", "p.o.d.v.o.d") spojí do jedného. */
  var navyse = [], beh = [];
  function koniec() { if (beh.length >= 3) navyse.push(beh.join('')); beh = []; }
  slova.forEach(function (w) { if (w.length === 1) beh.push(w); else koniec(); });
  koniec();
  /* Spojené slová idú za oddeľovač, aby nevytvárali falošné dvojice so zvyškom textu. */
  return navyse.length ? slova.concat(['|'], navyse) : slova;
}

/* Pripravené vzory: [skupina, pôvodný zápis, časti [{t, zac}]] */
var VZORY = [];
Object.keys(SLOVA).forEach(function (sk) {
  SLOVA[sk].forEach(function (z) {
    var casti = bezDiakritiky(z).split(/\s+/).map(function (c) {
      return { t: c.replace(/\*$/, ''), zac: /\*$/.test(c) };
    });
    VZORY.push([sk, z.replace(/\*/g, '…'), casti]);
  });
});

function sedi(w, c) {
  return c.zac ? w.indexOf(c.t) === 0 : w === c.t;
}

/* Telefónne číslo napísané slovami: aspoň 7 čísloviek po sebe. */
var CISLOVKY = ['nula', 'jedna', 'jeden', 'dva', 'dve', 'tri', 'styri', 'ctyri', 'pat', 'pet', 'sest', 'sedem', 'sedm', 'osem', 'osm', 'devat', 'devet'];

function vzoryUdajov(text) {
  var n = [], t = String(text || '');
  /* Telefón: aspoň 9 číslic, môžu byť oddelené medzerami, bodkami, pomlčkami. */
  (t.match(/\+?\d[\d\s().\/-]{7,}\d/g) || []).forEach(function (m) {
    if (m.replace(/\D/g, '').length >= 9) n.push('telefónne číslo: ' + m.trim());
  });
  var w = bezDiakritiky(t).replace(/[^a-z]+/g, ' ').trim().split(' '), beh = 0;
  for (var i = 0; i < w.length; i++) { if (CISLOVKY.indexOf(w[i]) >= 0) { if (++beh >= 7) { n.push('číslo napísané slovami'); break; } } else beh = 0; }
  /* E-mail */
  (t.match(/[^\s@]+\s?@\s?[^\s@]+\.[a-z]{2,}/gi) || []).forEach(function (m) { n.push('e-mail: ' + m); });
  /* Odkaz na web */
  (t.match(/(https?:\/\/|www\.)\S+/gi) || []).forEach(function (m) { n.push('odkaz: ' + m); });
  (t.match(/\b[a-z0-9-]{2,}\.(com|sk|cz|eu|net|org|io|info|online|app|xyz|ru|hu|pl|biz|site|link)\b/gi) || [])
    .forEach(function (m) { n.push('odkaz: ' + m); });
  /* IBAN a staré číslo účtu */
  (t.match(/\b[a-z]{2}\s?\d{2}(\s?[a-z0-9]){10,30}/gi) || []).forEach(function (m) {
    if (m.replace(/\D/g, '').length >= 10) n.push('číslo účtu: ' + m.trim());
  });
  (t.match(/\b(\d{1,6}-)?\d{6,10}\s?\/\s?\d{4}\b/g) || []).forEach(function (m) { n.push('číslo účtu: ' + m); });
  /* Adresa kryptopeňaženky */
  (t.match(/\b(bc1[a-z0-9]{25,60}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-fA-F0-9]{40}|T[a-zA-Z0-9]{33})\b/g) || [])
    .forEach(function (m) { n.push('adresa kryptopeňaženky: ' + m); });
  return n;
}

/* Jednoslovné vzory v rýchlych zoznamoch, viacslovné zvlášť. */
var CELE = {}, ZACIATKY = {}, VIACSLOVNE = [];
VZORY.forEach(function (v) {
  if (v[2].length > 1) { VIACSLOVNE.push(v); return; }
  var c = v[2][0], m = c.zac ? ZACIATKY : CELE;
  (m[c.t] = m[c.t] || []).push(v);
});

/* Vráti zoznam nálezov (prázdny = správa je v poriadku). */
export function skontrolujText(text) {
  var najdene = [], videne = {};
  function pridaj(v, nal) {
    var kluc = v[0] + ':' + v[1];
    if (!videne[kluc]) { videne[kluc] = 1; najdene.push(v[0] + ': „' + nal + '“ (pravidlo ' + v[1] + ')'); }
  }
  var w = slovaZTextu(text);
  w.forEach(function (x) {
    if (x === '|') return;
    (CELE[x] || []).forEach(function (v) { pridaj(v, x); });
    for (var k = 1; k <= x.length; k++) (ZACIATKY[x.slice(0, k)] || []).forEach(function (v) { pridaj(v, x); });
  });
  var podla = {};
  w.forEach(function (x, i) { (podla[x[0]] = podla[x[0]] || []).push(i); });
  VIACSLOVNE.forEach(function (v) {
    var casti = v[2], poz = podla[casti[0].t[0]] || [];
    for (var p = 0; p < poz.length; p++) {
      var i = poz[p];
      if (i + casti.length > w.length) break;
      var ok = true;
      for (var j = 0; j < casti.length; j++) if (w[i + j] === '|' || !sedi(w[i + j], casti[j])) { ok = false; break; }
      if (ok) { pridaj(v, w.slice(i, i + casti.length).join(' ')); break; }
    }
  });
  vzoryUdajov(text).forEach(function (x) { if (!videne[x]) { videne[x] = 1; najdene.push('Údaj: ' + x); } });
  return najdene;
}

/* Odtlačok textu na zistenie rovnakých správ: len písmená a čísla, bez diakritiky. Ukladá sa len odtlačok, nie text. */
export async function odtlacok(text) {
  var t = bezDiakritiky(text).replace(/[^a-z0-9]+/g, '');
  var h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return Array.from(new Uint8Array(h)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

export var LIMIT_ZA_DEN = 2;

/* Zistí, či odosielateľ neposiela priveľa správ alebo rovnakú správu na viac inzerátov. Zapíše pokus do záznamu.
   Vráti { zahodit, nalezy }: zahodit = prekročený denný limit, správa sa nikam neposiela. */
export async function skontrolujPocet(env, email, inzerat, odt) {
  var n = [], zahodit = false;
  if (!env.DB) return { zahodit: zahodit, nalezy: n };
  try {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS spravy_zaznam (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, inzerat TEXT, odtlacok TEXT, kedy TEXT)').run();
    var teraz = new Date(), den = new Date(teraz - 864e5).toISOString(), tyzden = new Date(teraz - 7 * 864e5).toISOString();
    var e = email.toLowerCase();
    var p = await env.DB.prepare('SELECT count(*) AS c FROM spravy_zaznam WHERE email = ? AND kedy > ?').bind(e, den).first();
    if (p && p.c >= LIMIT_ZA_DEN) zahodit = true;
    var d = await env.DB.prepare('SELECT count(DISTINCT inzerat) AS c FROM spravy_zaznam WHERE odtlacok = ? AND inzerat <> ? AND kedy > ?').bind(odt, inzerat, tyzden).first();
    if (d && d.c > 0) n.push('Rovnaká správa už bola za posledných 7 dní poslaná na iný inzerát (' + d.c + 'x).');
    await env.DB.prepare('INSERT INTO spravy_zaznam (email, inzerat, odtlacok, kedy) VALUES (?, ?, ?, ?)').bind(e, inzerat, odt, teraz.toISOString()).run();
    await env.DB.prepare('DELETE FROM spravy_zaznam WHERE kedy < ?').bind(new Date(teraz - 30 * 864e5).toISOString()).run();
  } catch (err) { console.log('zaznam sprav chyba', String(err)); }
  return { zahodit: zahodit, nalezy: n };
}
