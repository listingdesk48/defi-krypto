/* Domovská stránka: formulár žiadosti a ďalšie skripty (presunuté z index.html, poradie zachované). */
try{
/* Video sa začne sťahovať až po načítaní celej stránky. */
window.addEventListener('load',function(){var v=document.querySelector('.fotopas video');if(!v)return;var sp=navigator.connection;if(sp&&(sp.saveData||/2g|3g/.test(sp.effectiveType||'')))return;/* slabý signál alebo úsporný režim: ostane fotka namiesto videa */v.src=window.innerWidth<=820?'video/hero-960.mp4':'video/hero-1920.mp4';v.play&&v.play().catch(function(){});});
}catch(e){console.error(e)}
try{
/* ══════════ ŽIADOSŤ O ÚVER: kalkulačka, kroky, kontrola, podpis ══════════ */
(function () {
  var form = document.getElementById('zkForm');
  if (!form) return;

  var UROK = 0.05;      /* ročný úrok, fixný */
  var POPLATOK = 0;     /* poplatok za inzerát sa do súčtu nezarátava, je to cena služby, nie úveru */
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var fmt2 = function (n) { var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + p[1]; };
  /* RPMN podľa zákona: hľadá ročnú sadzbu X, pri ktorej sa suma úveru (po odpočítaní poplatku) rovná splátkam prepočítaným na dnešnú hodnotu */
  function rpmn(s, m, p) {
    var lo = 0, hi = 50, X, i, pv, k;
    for (var n = 0; n < 100; n++) {
      X = (lo + hi) / 2; i = Math.pow(1 + X, 1 / 12) - 1; pv = 0;
      for (k = 1; k <= m; k++) pv += p / Math.pow(1 + i, k);
      if (pv > s - POPLATOK) lo = X; else hi = X;
    }
    return X * 100;
  }
  var paint = function (el) { el.style.setProperty('--pct', ((el.value - el.min) / (el.max - el.min) * 100) + '%'); };

  /* ── Kalkulačka ── */
  var suma = document.getElementById('zkSuma'), doba = document.getElementById('zkDoba');
  function splatka(s, m) {
    var r = UROK / 12;
    return s * r / (1 - Math.pow(1 + r, -m));
  }
  /* Posuvník smie stáť len na hodnote zo zoznamu: prichytí sa k najbližšej. */
  function prichyt(list, val) {
    var best = list[0];
    list.forEach(function (x) { if (Math.abs(x - val) < Math.abs(best - val)) best = x; });
    return best;
  }
  function prepocitaj() {
    suma.value = prichyt(SUMY, +suma.value);
    doba.value = prichyt(DOBY, +doba.value);
    var s = +suma.value, m = +doba.value;
    var sp = Math.round(splatka(s, m) * 100) / 100;
    var celkom = sp * m + POPLATOK;
    var rp = rpmn(s, m, sp);
    nastavSel(sumaSel, s, function (v) { return fmt(v) + ' €'; });
    nastavSel(dobaSel, m, popisDoby);
    document.getElementById('zkSplatka').textContent = fmt2(sp) + ' €';
    document.getElementById('zkCelkom').textContent = fmt2(celkom) + ' €';
    document.getElementById('zkTopSuma').textContent = fmt(s) + ' €';
    document.getElementById('zkTopDoba').textContent = popisDoby(m);
    document.getElementById('zkTopSplatka').textContent = fmt2(sp) + ' €';
    document.getElementById('zkTopCelkom').textContent = fmt2(celkom) + ' €';
    paint(suma); paint(doba);
  }
  /* ── Výber zo zoznamu (náhrada posuvníka) ── */
  var sumaSel = document.getElementById('zkSumaSel'), dobaSel = document.getElementById('zkDobaSel');
  function popisDoby(m) {
    var r = Math.round(m / 12); return r + (r === 1 ? ' rok' : r < 5 ? ' roky' : ' rokov');
  }
  var SUMY = [], DOBY = [], v;
  for (v = 1000; v < 10000; v += 500) SUMY.push(v);
  for (v = 10000; v < 50000; v += 1000) SUMY.push(v);
  for (v = 50000; v <= 250000; v += 5000) SUMY.push(v);
  for (v = 12; v <= 300; v += 12) DOBY.push(v);
  function naplnSel(sel, list, popis) {
    list.forEach(function (x) { var o = document.createElement('option'); o.value = x; o.textContent = popis(x); sel.appendChild(o); });
  }
  naplnSel(sumaSel, SUMY, function (x) { return fmt(x) + ' €'; });
  naplnSel(dobaSel, DOBY, popisDoby);
  /* Ak posuvník stojí na hodnote, ktorá v zozname nie je, dočasne ju do zoznamu vloží. */
  function nastavSel(sel, val, popis) {
    var stary = sel.querySelector('option[data-docasna]');
    if (stary && +stary.value !== val) stary.remove();
    if (!sel.querySelector('option[value="' + val + '"]')) {
      var o = document.createElement('option'); o.value = val; o.textContent = popis(val); o.setAttribute('data-docasna', '1');
      var pred = null;
      Array.prototype.some.call(sel.options, function (op) { if (+op.value > val) { pred = op; return true; } });
      sel.insertBefore(o, pred);
    }
    sel.value = val;
  }
  sumaSel.addEventListener('change', function () { suma.value = sumaSel.value; prepocitaj(); });
  dobaSel.addEventListener('change', function () { doba.value = dobaSel.value; prepocitaj(); });

  suma.addEventListener('input', prepocitaj);
  doba.addEventListener('input', prepocitaj);
  prepocitaj();

  /* ── Krajiny (občianstvo): abecedne, predvybrané Slovensko ── */
  var KRAJINY = ['Slovensko','Česko','Afganistan','Albánsko','Alžírsko','Andorra','Angola','Antigua a Barbuda','Argentína','Arménsko','Austrália','Azerbajdžan','Bahamy','Bahrajn','Bangladéš','Barbados','Belgicko','Belize','Benin','Bhután','Bielorusko','Bolívia','Bosna a Hercegovina','Botswana','Brazília','Brunej','Bulharsko','Burkina Faso','Burundi','Cyprus','Čad','Čierna Hora','Čile','Čína','Dánsko','Dominika','Dominikánska republika','Džibutsko','Egypt','Ekvádor','Eritrea','Estónsko','Eswatini','Etiópia','Fidži','Filipíny','Fínsko','Francúzsko','Gabon','Gambia','Ghana','Grécko','Grenada','Gruzínsko','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Holandsko','Honduras','Chorvátsko','India','Indonézia','Irak','Irán','Írsko','Island','Izrael','Jamajka','Japonsko','Jemen','Jordánsko','Južná Afrika','Južná Kórea','Južný Sudán','Kambodža','Kamerun','Kanada','Kapverdy','Katar','Kazachstan','Keňa','Kirgizsko','Kiribati','Kolumbia','Komory','Kongo','Konžská demokratická republika','Kostarika','Kuba','Kuvajt','Laos','Lesotho','Libanon','Libéria','Líbya','Lichtenštajnsko','Litva','Lotyšsko','Luxembursko','Madagaskar','Maďarsko','Malajzia','Malawi','Maldivy','Mali','Malta','Maroko','Marshallove ostrovy','Maurícius','Mauritánia','Mexiko','Mikronézia','Mjanmarsko','Moldavsko','Monako','Mongolsko','Mozambik','Namíbia','Nauru','Nemecko','Nepál','Niger','Nigéria','Nikaragua','Nórsko','Nový Zéland','Omán','Pakistan','Palau','Panama','Papua-Nová Guinea','Paraguaj','Peru','Pobrežie Slonoviny','Poľsko','Portugalsko','Rakúsko','Rovníková Guinea','Rumunsko','Rusko','Rwanda','Salvádor','Samoa','San Maríno','Saudská Arábia','Senegal','Severná Kórea','Severné Macedónsko','Seychely','Sierra Leone','Singapur','Slovinsko','Somálsko','Spojené arabské emiráty','Spojené kráľovstvo','Spojené štáty americké','Srbsko','Srí Lanka','Stredoafrická republika','Sudán','Surinam','Svätá Lucia','Svätý Krištof a Nevis','Svätý Tomáš a Princov ostrov','Svätý Vincent a Grenadíny','Sýria','Šalamúnove ostrovy','Španielsko','Švajčiarsko','Švédsko','Tadžikistan','Taliansko','Tanzánia','Thajsko','Togo','Tonga','Trinidad a Tobago','Tunisko','Turecko','Turkménsko','Tuvalu','Uganda','Ukrajina','Uruguaj','Uzbekistan','Vanuatu','Vatikán','Venezuela','Vietnam','Východný Timor','Zambia','Zimbabwe'];
  var selO = document.getElementById('zkObcianstvo');
  var selK = document.getElementById('zkKrajina');
  KRAJINY.slice().sort(function (a, b) { return a.localeCompare(b, 'sk'); }).forEach(function (k) { var o = document.createElement('option'); o.textContent = k; selO.appendChild(o); if (selK) selK.appendChild(o.cloneNode(true)); });
  selO.value = 'Slovensko';
  if (selK) { selK.value = 'Slovensko'; selO.addEventListener('change', function () { if (selO.value) selK.value = selO.value; }); }

  /* ── Kroky ── */
  var krok = 1;
  var panes = form.querySelectorAll('.pane');
  var dots = document.querySelectorAll('#zkStepper .sp-dot'); /* ukazovateľ krokov je vypnutý, dots je prázdne */
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  function ukaz(n, bezScrollu) {
    krok = n;
    panes.forEach(function (p) { p.classList.toggle('on', +p.dataset.pane === n); });
    dots.forEach(function (d) {
      var k = +d.dataset.krok;
      d.classList.toggle('on', k === n);
      d.classList.toggle('done', k < n);
      d.querySelector('.sp-n').innerHTML = k < n ? CHECK : k;
    });
    if (!bezScrollu) {
      var top = document.getElementById('ziadost').getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
    if (n === 11 && window.zkNaplnSuhrn) window.zkNaplnSuhrn();
  }
  window.zkUkaz = ukaz;
  dots.forEach(function (d) {
    d.addEventListener('click', function () { var k = +d.dataset.krok; if (k < krok && krok <= 7) ukaz(k); });
  });

  /* ── Kontrola polí v aktuálnom kroku ── */
  function chyba(el, ano) {
    el.classList.toggle('err', !!ano);
    if (el.type === 'checkbox') el.closest('.suhlas').classList.toggle('err', !!ano);
  }
  /* Hláška pod nevyplneným povinným poľom. Text podľa typu poľa. */
  function hlaska(el, txt) {
    var m = el._hlaska;
    if (txt === null) { if (m) m.classList.remove('on'); return; }
    if (!m) {
      m = document.createElement('p'); m.className = 'err-msg zq-auto'; el._hlaska = m;
      var kotva = el;
      if (el.tagName === 'SELECT' && el.nextElementSibling && el.nextElementSibling.classList.contains('k-chips')) kotva = el.nextElementSibling;
      else if (el.type === 'checkbox') kotva = el.closest('.suhlas') || el;
      else if (el.parentElement && /zq-chk|zq-eur|zq-hes|s9-tel/.test(el.parentElement.className)) kotva = el.parentElement;
      kotva.insertAdjacentElement('afterend', m);
    }
    if (!txt) {
      if (el.tagName === 'SELECT') txt = 'Vyberte jednu z možností.';
      else if (el.type === 'checkbox') txt = 'Potvrďte súhlas.';
      else if (el.type === 'date' || el.id === 'zkNarodenieTxt') txt = 'Zadajte dátum narodenia.';
      else txt = 'Vyplňte toto pole.';
    }
    m.textContent = txt; m.classList.add('on');
  }
  function skontroluj(n) {
    var pane = form.querySelector('.pane[data-pane="' + n + '"]');
    var ok = true, prvy = null;
    if (n === 2 || n === 3) {
      var ui = document.getElementById('zkOpis'), ue = document.getElementById('zkOpisErr');
      var uz = n === 2 && ui.value.trim() && ui.value.trim().length < 10;
      ue.classList.toggle('on', !!uz);
      if (uz) { chyba(ui, true); ok = false; prvy = prvy || ui; }
      if (n === 3) ['zkMeno', 'zkPriezvisko'].forEach(function (id) {
        var el = document.getElementById(id), er = document.getElementById(id + 'Err');
        var zle = el.value.trim() && !/^[A-Za-zÀ-ž][A-Za-zÀ-ž' \-]*[A-Za-zÀ-ž]$/.test(el.value.trim());
        er.classList.toggle('on', !!zle);
        if (zle) { chyba(el, true); ok = false; prvy = prvy || el; }
      });
    }
    pane.querySelectorAll('[required]').forEach(function (el) {
      var zle = el.type === 'checkbox' ? !el.checked : !String(el.value).trim();
      var prazdne = zle;
      if (el.type === 'email' && !zle) zle = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      chyba(el, zle);
      hlaska(el, zle ? (prazdne ? '' : 'Zadajte správnu e-mailovú adresu.') : null);
      if (zle) { ok = false; prvy = prvy || el; }
    });
    if (n === 3 || n === 4 || n === 5 || n === 7) {
      var d = document.getElementById('zkNarodenie'), e = document.getElementById('zkNarodenieErr'), dt = document.getElementById('zkNarodenieTxt');
      var mlady = false, nezmysel = false;
      if (n === 3 && dt.value.trim() && !d.value) nezmysel = true;
      if (n === 3 && d.value) {
        var dn = new Date(d.value), dnes = new Date();
        var rokN = +d.value.slice(0, 4);
        nezmysel = isNaN(dn.getTime()) || rokN < 1900 || dn > dnes;
        var vek = dnes.getFullYear() - dn.getFullYear();
        var m = dnes.getMonth() - dn.getMonth();
        if (m < 0 || (m === 0 && dnes.getDate() < dn.getDate())) vek--;
        mlady = !nezmysel && vek < 18;
      }
      e.textContent = nezmysel ? 'Dátum narodenia nie je správny.' : 'Žiadateľ musí mať 18 rokov a viac.';
      e.classList.toggle('on', mlady || nezmysel);
      if (mlady || nezmysel) { chyba(dt, true); ok = false; prvy = prvy || dt; }
      if (n === 7 && window.zkOpKontrola) { var och = window.zkOpKontrola(); if (och) { ok = false; prvy = prvy || document.getElementById('zkOp'); } }
      if (n === 7) { var o1 = document.getElementById('zkOp'), o2 = document.getElementById('zkOp2'), oe = document.getElementById('zkOp2Err'); var orz = o1.value.trim() && o2.value.trim() && o1.value.trim().toUpperCase() !== o2.value.trim().toUpperCase(); oe.classList.toggle('on', !!orz); if (orz) { chyba(o2, true); ok = false; prvy = prvy || o2; } }
      if (n === 4 && window.zkAdresaKontrola) { var ach = window.zkAdresaKontrola(); if (ach) { ok = false; prvy = prvy || ach; } }
    }
    if (n === 5) { var zi = document.getElementById('zkZamIne'), ze = document.getElementById('zkZamIneErr'); var zz = !zi.hidden && zi.value.trim() && zi.value.trim().length < 3; ze.classList.toggle('on', !!zz); if (zz) { chyba(zi, true); ok = false; prvy = prvy || zi; } }
    if (n === 9 && window.zkTelKontrola) { if (window.zkTelKontrola()) { ok = false; prvy = prvy || document.getElementById('zkTel'); } }
    if (n === 8 || n === 10) {
      var e1 = document.getElementById('zkEmail'), e2 = document.getElementById('zkEmail2'), ee = document.getElementById('zkEmail2Err');
      var rozne = n === 8 && e1.value.trim() && e2.value.trim() && e1.value.trim().toLowerCase() !== e2.value.trim().toLowerCase();
      ee.classList.toggle('on', !!rozne);
      if (rozne) { chyba(e2, true); ok = false; prvy = prvy || e2; }
      var hs = document.getElementById('zkHeslo'), he = document.getElementById('zkHesloErr');
      var kratke = n === 10 && hs.value.trim() && hs.value.length < 5;
      he.classList.toggle('on', !!kratke);
      if (kratke) { chyba(hs, true); ok = false; prvy = prvy || hs; }
      var hs2 = document.getElementById('zkHeslo2'), he2 = document.getElementById('zkHeslo2Err');
      var hrozne = n === 10 && hs2 && hs.value && hs2.value && hs.value !== hs2.value;
      if (he2) he2.classList.toggle('on', !!hrozne);
      if (hrozne) { chyba(hs2, true); ok = false; prvy = prvy || hs2; }
    }
    if (n === 12 && cv) {
      var sig = document.getElementById('zkSig'), se = document.getElementById('zkSigErr');
      var sirka = cv.getBoundingClientRect().width || 300;
      var maly = podpisany && (sigDlzka < 150 || (sigMaxX - sigMinX) < sirka * 0.2 || (sigMaxY - sigMinY) < 12);
      sig.classList.toggle('err', !podpisany || maly);
      se.textContent = maly ? 'Podpíšte sa prosím celým podpisom.' : 'Podpíšte sa prosím.';
      se.classList.toggle('on', !podpisany || maly);
      if (!podpisany || maly) { ok = false; prvy = prvy || sig; }
    }
    if (prvy) prvy.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return ok;
  }
  form.addEventListener('change', function (e) { if (e.target._hlaska && String(e.target.type === 'checkbox' ? e.target.checked : e.target.value).trim() && e.target.value !== 'false') hlaska(e.target, null); });
  form.addEventListener('input', function (e) {
    if (e.target._hlaska && String(e.target.value || '').trim()) hlaska(e.target, null);
    if (e.target.classList.contains('err')) chyba(e.target, false);
    if (e.target.id === 'zkEmail2' || e.target.id === 'zkEmail') document.getElementById('zkEmail2Err').classList.remove('on');
    if (e.target.id === 'zkHeslo') document.getElementById('zkHesloErr').classList.remove('on');
    if (e.target.id === 'zkNarodenieTxt') document.getElementById('zkNarodenieErr').classList.remove('on');
    if (e.target.id === 'zkOpis') document.getElementById('zkOpisErr').classList.remove('on');
    if (e.target.id === 'zkZamIne') document.getElementById('zkZamIneErr').classList.remove('on');
    if (e.target.id === 'zkOp') document.getElementById('zkOpErr').classList.remove('on');
    if (e.target.id === 'zkOp' || e.target.id === 'zkOp2') document.getElementById('zkOp2Err').classList.remove('on');
    if (e.target.id === 'zkTel') document.getElementById('zkTelErr').classList.remove('on');
    if (e.target.id === 'zkUlica' || e.target.id === 'zkMesto' || e.target.id === 'zkPsc') document.getElementById('zkAdresaErr').classList.remove('on');
    if (e.target.id === 'zkMeno' || e.target.id === 'zkPriezvisko') document.getElementById(e.target.id + 'Err').classList.remove('on');
  });
  form.addEventListener('change', function (e) { if (e.target.type === 'checkbox') chyba(e.target, false); });

  form.querySelectorAll('[data-dalej]').forEach(function (b) {
    b.addEventListener('click', function () { if (skontroluj(krok)) { if (window.zkUprava && krok < 11 && krok >= (window.zkUpravaPo || krok)) { window.zkUprava = false; ukaz(11); } else ukaz(krok + 1); } });
  });
  form.querySelectorAll('[data-spat]').forEach(function (b) {
    b.addEventListener('click', function () { if (window.zkUprava && krok < 11) { window.zkUprava = false; ukaz(11); } else ukaz(krok - 1); });
  });

  /* Heslo: zobraziť / skryť. */
  var hOko = document.getElementById('zkHesloOko'), hInp = document.getElementById('zkHeslo');
  /* Očko ako v účte a pri prihlásení: prepne obe polia hesla naraz a ikonu (oko / preškrtnuté oko) */
  var oka = Array.prototype.slice.call(form.querySelectorAll('.zq-oko'));
  if (hOko && hInp) oka.forEach(function (ok) { ok.addEventListener('click', function () {
    var vid = hInp.type === 'password';
    hInp.type = vid ? 'text' : 'password';
    var hInp2 = document.getElementById('zkHeslo2'); if (hInp2) hInp2.type = hInp.type;
    oka.forEach(function (x) { x.classList.toggle('skryta', vid); x.setAttribute('aria-label', vid ? 'Skryť heslo' : 'Zobraziť heslo'); });
  }); });

  /* Email pre kontrolu sa nedá vložiť zo schránky. */
  var em2 = document.getElementById('zkEmail2');
  ['paste', 'drop'].forEach(function (ev) { em2.addEventListener(ev, function (e) { e.preventDefault(); }); });

  /* ── Podpis ── */
  /* Podpis bol z formulára odstránený (15.10.2026). Kód ostáva neaktívny, kým na stránke nie je plátno zkSigCanvas. */
  if (cv) {
  var box = document.getElementById('zkSig'), cv = document.getElementById('zkSigCanvas'), ctx = cv ? cv.getContext('2d') : null;
  var kresli = false, podpisany = false, last = null;
  var sigDlzka = 0, sigMinX = 1e9, sigMaxX = -1e9, sigMinY = 1e9, sigMaxY = -1e9; /* dĺžka ťahov a rozmer podpisu */
  function velkost() {
    var r = box.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (!r.width) return;
    var img = podpisany ? cv.toDataURL() : null;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1d1d1f';
    if (img) { var i = new Image(); i.onload = function () { ctx.drawImage(i, 0, 0, r.width, r.height); }; i.src = img; }
  }
  function bod(e) {
    var r = cv.getBoundingClientRect();
    var p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  }
  function start(e) { e.preventDefault(); kresli = true; last = bod(e); }
  function tah(e) {
    if (!kresli) return; e.preventDefault();
    var p = bod(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    sigDlzka += Math.hypot(p.x - last.x, p.y - last.y);
    sigMinX = Math.min(sigMinX, p.x, last.x); sigMaxX = Math.max(sigMaxX, p.x, last.x); sigMinY = Math.min(sigMinY, p.y, last.y); sigMaxY = Math.max(sigMaxY, p.y, last.y);
    last = p; podpisany = true; box.classList.add('ma'); box.classList.remove('err'); document.getElementById('zkSigErr').classList.remove('on');
  }
  function koniec() { kresli = false; }
  cv.addEventListener('pointerdown', start); cv.addEventListener('pointermove', tah);
  window.addEventListener('pointerup', koniec); cv.addEventListener('pointerleave', koniec);
  document.getElementById('zkSigClear').addEventListener('click', function () {
    sigDlzka = 0; sigMinX = 1e9; sigMaxX = -1e9; sigMinY = 1e9; sigMaxY = -1e9; document.getElementById('zkSigErr').classList.remove('on');
    ctx.clearRect(0, 0, cv.width, cv.height); podpisany = false; box.classList.remove('ma');
  });
  window.addEventListener('resize', velkost);
  /* Plátno dostane rozmer, keď sa krok 5 zobrazí (dovtedy je skryté a má nulovú šírku). */
  var ro = new MutationObserver(function () { if (form.querySelector('.pane[data-pane="12"]').classList.contains('on')) velkost(); });
  ro.observe(form.querySelector('.pane[data-pane="12"]'), { attributes: true, attributeFilter: ['class'] });
  }

  /* ── Odoslanie: zatiaľ len obrazovka Žiadosť sme prijali ── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!skontroluj(11)) return;
    if (form.dataset.odosielam === '1') return;
    /* Zber údajov a odoslanie na server (functions/api/ziadost.js). Až po úspechu sa ukáže Žiadosť sme prijali. */
    var udaje = {};
    form.querySelectorAll('input[id^="zk"],select[id^="zk"],textarea[id^="zk"]').forEach(function (el) {
      if (el.type === 'password' || el.id === 'zkHeslo' || el.id === 'zkHeslo2' || el.type === 'checkbox' || el.type === 'button' || el.type === 'submit') return;
      udaje[el.id] = el.value;
      if (el.tagName === 'SELECT' && el.selectedIndex >= 0) udaje[el.id + 'Text'] = el.options[el.selectedIndex].text;
    });
    var kod = document.getElementById('zkTelKod');
    if (kod && kod.selectedIndex >= 0) udaje.zkTelKod = (kod.options[kod.selectedIndex].text.match(/\+\d+/) || [kod.value])[0];
    var podpis = null; try { var cv = document.getElementById('zkSigCanvas'); if (cv) podpis = cv.toDataURL('image/png'); } catch (x) {}
    var odBtn = document.getElementById('zkOdoslat'), chybaEl = document.getElementById('zkChyba');
    form.dataset.odosielam = '1'; odBtn.disabled = true; odBtn.textContent = 'Odosielam…'; if (chybaEl) chybaEl.style.display = 'none';
    fetch('/api/ziadost', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ udaje: udaje, heslo: document.getElementById('zkHeslo').value, podpis: podpis,
        suhlas: !!(document.getElementById('zkS1').checked && document.getElementById('zkS2').checked), novinky: !!document.getElementById('zkS4').checked }) })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (x) {
      form.dataset.odosielam = '0'; odBtn.disabled = false; odBtn.textContent = 'Odoslať žiadosť';
      if (!x.ok) {
        if (chybaEl) { chybaEl.innerHTML = x.d && x.d.kod === 'existuje' ? 'Na tento e-mail už máte účet. <a href="/prihlasenie">Prihláste sa</a>.' : 'Žiadosť sa nepodarilo odoslať. ' + ((x.d && x.d.chyba) ? x.d.chyba : 'Skúste to prosím o chvíľu znova.'); chybaEl.style.display = 'block'; }
        return;
      }
      if (window.KV_PRIHLAS) window.KV_PRIHLAS({ meno: udaje.zkMeno, priezvisko: udaje.zkPriezvisko });
      poOdoslani();
    })
    .catch(function (er) { form.dataset.odosielam = '0'; odBtn.disabled = false; odBtn.textContent = 'Odoslať žiadosť'; if (chybaEl) { chybaEl.textContent = 'Žiadosť sa nepodarilo odoslať (spojenie: ' + String(er && er.message || er) + '). Skúste to prosím o chvíľu znova.'; chybaEl.style.display = 'block'; } });
  });
  function poOdoslani() {
    if (window.zkZmazRozpracovanu) window.zkZmazRozpracovanu();
    /* Najprv hneď vyskočí na začiatok formulára, až potom sa ukáže obrazovka Žiadosť sme prijali. Inak by animácia prebehla mimo obrazovky. */
    var hore = document.getElementById('ziadost').getBoundingClientRect().top + window.scrollY - 20;
    var de = document.documentElement;
    de.style.scrollBehavior = 'auto';
    window.scrollTo(0, hore);
    requestAnimationFrame(function () {
      de.style.scrollBehavior = '';
      ukaz(12);
      /* Poistka: po prepnutí obrazovky ešte raz dorovná polohu, keby ju prehliadač posunul. */
      requestAnimationFrame(function () {
        var t = document.getElementById('ziadost').getBoundingClientRect().top + window.scrollY - 20;
        de.style.scrollBehavior = 'auto'; window.scrollTo(0, t); de.style.scrollBehavior = '';
      });
    });
  }
})();
}catch(e){console.error(e)}
try{
(function(){var n=document.getElementById('mainNav');if(!n)return;var last=window.scrollY,tick=false;
function upd(){var y=window.scrollY;if(n.classList.contains('menu-open')){last=y;tick=false;return;}
if(y<40){n.classList.remove('skryta');}else if(y>last+6){n.classList.add('skryta');}else if(y<last-6){n.classList.remove('skryta');}
last=y;tick=false;}
window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd);}},{passive:true});})();
}catch(e){console.error(e)}
try{
/* Súhrn žiadosti na poslednom kroku */
(function(){
  var f=document.getElementById('zkForm');if(!f)return;
  function v(id){var e=document.getElementById(id);return e?String(e.value||'').trim():'';}
  function sel(id){var e=document.getElementById(id);return e&&e.selectedIndex>0?e.options[e.selectedIndex].textContent:'';}
  function set(id,val){var e=document.getElementById(id);if(e)e.textContent=val||'';}
  function datum(s){if(!s)return '';var p=s.split('-');return p.length===3?p[2]+'. '+p[1]+'. '+p[0]:s;}
  window.zkNaplnSuhrn=function(){
    set('zsSuma',document.getElementById('zkTopSuma').textContent);
    set('zsDoba',document.getElementById('zkTopDoba').textContent);
    set('zsSplatka',document.getElementById('zkTopSplatka').textContent);
    set('zsCelkom',document.getElementById('zkTopCelkom').textContent);
    set('zsUcel',sel('zkUcelSel'));set('zsOpis',v('zkOpis'));set('zsMeno',(v('zkMeno')+' '+v('zkPriezvisko')).trim());set('zsObcianstvo',sel('zkObcianstvo'));
    set('zsNarodenie',v('zkNarodenieTxt'));set('zsOp',v('zkOp'));
    set('zsAdresa',[v('zkUlica'),v('zkMesto'),v('zkPsc'),sel('zkKrajina')].filter(Boolean).join(', '));
    set('zsEmail',v('zkEmail'));set('zsTel',window.zkTelCele?window.zkTelCele():v('zkTel'));
    set('zsZamestnanie',sel('zkZamestnanie')==='Niečo iné'&&v('zkZamIne')?'Niečo iné: '+v('zkZamIne'):sel('zkZamestnanie'));set('zsPrijem',sel('zkPrijem'));set('zsExekucie',sel('zkExekucie'));
  };
  f.querySelectorAll('[data-uprav]').forEach(function(b){b.addEventListener('click',function(){window.zkUprava=true;window.zkUpravaPo=+b.getAttribute('data-po');if(window.zkUkaz)window.zkUkaz(+b.getAttribute('data-uprav'));});});
})();
}catch(e){console.error(e)}
try{
/* Dátum narodenia: písanie DD.MM.RRRR, bodky sa dopĺňajú samy; skrytá hodnota je v tvare RRRR-MM-DD */
(function(){
  var t=document.getElementById('zkNarodenieTxt'),h=document.getElementById('zkNarodenie');if(!t||!h)return;
  t.addEventListener('input',function(){
    var c=t.value.replace(/\D/g,'').slice(0,8),o=c;
    if(c.length>4)o=c.slice(0,2)+'.'+c.slice(2,4)+'.'+c.slice(4);else if(c.length>2)o=c.slice(0,2)+'.'+c.slice(2);
    if(o!==t.value)t.value=o;
    h.value='';
    if(c.length===8){var dd=+c.slice(0,2),mm=+c.slice(2,4),rr=+c.slice(4);var x=new Date(rr,mm-1,dd);if(x.getFullYear()===rr&&x.getMonth()===mm-1&&x.getDate()===dd)h.value=rr+'-'+('0'+mm).slice(-2)+'-'+('0'+dd).slice(-2);}
  });
})();
}catch(e){console.error(e)}
try{
(function(){
  var sel=document.getElementById('zkZamestnanie'),inp=document.getElementById('zkZamIne');if(!sel||!inp)return;
  sel.addEventListener('change',function(){
    var ine=sel.value==='Niečo iné';
    inp.hidden=!ine; if(ine){inp.setAttribute('required','');inp.focus();} else {inp.removeAttribute('required');inp.value='';inp.classList.remove('err');}
  });
})();
}catch(e){console.error(e)}
try{
/* Číslo občianskeho preukazu: tvar podľa občianstva */
(function(){
  var inp=document.getElementById('zkOp'),err=document.getElementById('zkOpErr'),lbl=document.getElementById('zkOpLbl'),obc=document.getElementById('zkObcianstvo');
  if(!inp||!err||!lbl||!obc)return;
  function popis(){
    var o=obc.value;
    if(o==='Slovensko'){lbl.innerHTML='Číslo občianskeho preukazu<i>*</i>';inp.placeholder='';}
    else if(o==='Česko'){lbl.innerHTML='Číslo občianskeho preukazu<i>*</i>';inp.placeholder='';}
    else{lbl.innerHTML='Číslo občianskeho preukazu<i>*</i>';inp.placeholder='';}
  }
  var lbl2=document.getElementById('zkOp2Lbl'),inp2=document.getElementById('zkOp2');
  function popis2(){popis();if(lbl2)lbl2.innerHTML=lbl.innerHTML;}
  obc.addEventListener('change',popis2);popis2();
  inp.addEventListener('input',function(){var v=inp.value.toUpperCase().replace(/\s+/g,'');if(v!==inp.value)inp.value=v;});
  if(inp2)inp2.addEventListener('input',function(){var v=inp2.value.toUpperCase().replace(/\s+/g,'');if(v!==inp2.value)inp2.value=v;});
  function zhoda(){if(!inp2)return;var a=inp.value.trim(),b=inp2.value.trim(),ok=!!(a&&b&&a===b&&!window.zkOpKontrola());var w1=inp.closest('.zq-chk'),w2=inp2.closest('.zq-chk'),tx=document.getElementById('zkOpZhoda');w2.classList.add('druhy');if(ok&&w1.classList.contains('ok'))return;w1.classList.toggle('ok',ok);w2.classList.toggle('ok',ok);if(tx)tx.classList.toggle('on',ok);}
  inp.addEventListener('input',zhoda);if(inp2)inp2.addEventListener('input',zhoda);
  window.zkOpKontrola=function(){
    var s=inp.value.trim(); if(!s)return false;
    var o=obc.value,ch='';
    if(o==='Slovensko'){ if(!/^[A-Z]{2}\d{6}$/.test(s))ch='Číslo občianskeho preukazu nie je správne.'; }
    else if(o==='Česko'){ if(!/^(\d{9}|[A-Z]{2}\d{6})$/.test(s))ch='Číslo občianskeho preukazu nie je správne.'; }
    else { if(s.replace(/[\-\/\.]/g,'').length<5||!/^[A-Z0-9\-\/\.]+$/.test(s))ch='Číslo dokladu nie je správne.'; }
    err.textContent=ch; err.classList.toggle('on',!!ch); inp.classList.toggle('err',!!ch);
    return !!ch;
  };
})();
}catch(e){console.error(e)}
try{
/* Adresa: ulica s číslom, mesto z písmen, PSČ podľa krajiny pobytu */
(function(){
  var ul=document.getElementById('zkUlica'),me=document.getElementById('zkMesto'),ps=document.getElementById('zkPsc'),kr=document.getElementById('zkKrajina'),err=document.getElementById('zkAdresaErr');
  if(!ul||!me||!ps||!kr||!err)return;
  window.zkAdresaKontrola=function(){
    var skcz=kr.value==='Slovensko'||kr.value==='Česko';
    var u=ul.value.trim(),m=me.value.trim(),p=ps.value.replace(/\s+/g,'');
    var chyby=[],prvy=null;
    function zle(el,txt){el.classList.add('err');chyby.push(txt);prvy=prvy||el;}
    if(u){ var pism=(u.match(/[A-Za-zÀ-ž]/g)||[]).length; if(pism<3)zle(ul,'Ulica nie je správna.'); else if(skcz&&!/\d/.test(u))zle(ul,'Chýba číslo ulice.'); }
    if(m){ if(!/^[A-Za-zÀ-ž][A-Za-zÀ-ž' \-\.]*$/.test(m)||(m.match(/[A-Za-zÀ-ž]/g)||[]).length<2)zle(me,'Mesto nie je správne.'); }
    if(p){ if(skcz){ if(!/^\d{5}$/.test(p))zle(ps,'PSČ nie je správne.'); else if(ps.value!==p)ps.value=p; } else if(!/^[A-Za-z0-9\- ]{3,10}$/.test(ps.value.trim()))zle(ps,'PSČ nie je správne.'); }
    err.textContent=chyby.join(' '); err.classList.toggle('on',chyby.length>0);
    return prvy;
  };
})();
}catch(e){console.error(e)}
try{
/* IBAN: dĺžka podľa krajiny a kontrolný súčet (modulo 97), ako v banke */
(function(){
  var inp=document.getElementById('zkIban'),err=document.getElementById('zkIbanErr');if(!inp||!err)return;
  var DLZKA={AD:24,AE:23,AL:28,AT:20,AZ:28,BA:20,BE:16,BG:22,BH:22,BR:29,BY:28,CH:21,CR:22,CY:28,CZ:24,DE:22,DK:18,DO:28,EE:20,EG:29,ES:24,FI:18,FO:18,FR:27,GB:22,GE:22,GI:23,GL:18,GR:27,GT:28,HR:21,HU:28,IE:22,IL:23,IS:26,IT:27,JO:30,KW:30,KZ:20,LB:28,LI:21,LT:20,LU:20,LV:21,MC:27,MD:24,ME:22,MK:19,MR:27,MT:31,MU:30,NL:18,NO:15,PK:24,PL:28,PS:29,PT:25,QA:29,RO:24,RS:22,SA:24,SE:24,SI:19,SK:24,SM:27,TN:24,TR:26,UA:29,VA:22,VG:24,XK:20};
  inp.addEventListener('input',function(){
    var v=inp.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,34);
    var s=v.replace(/(.{4})/g,'$1 ').trim();
    if(s!==inp.value)inp.value=s;
  });
  function platny(s){
    var c=s.replace(/\s+/g,'');
    if(!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(c))return false;
    var d=DLZKA[c.slice(0,2)];
    if(!d||c.length!==d)return false;
    var p=c.slice(4)+c.slice(0,4),num='';
    for(var i=0;i<p.length;i++){var ch=p.charCodeAt(i);num+=ch>=65?String(ch-55):p[i];}
    var z=0;for(var j=0;j<num.length;j++)z=(z*10+ (+num[j]))%97;
    return z===1;
  }
  window.zkIbanKontrola=function(){
    var s=inp.value.trim(); if(!s)return false;
    var zle=!platny(s);
    err.classList.toggle('on',zle); inp.classList.toggle('err',zle);
    return zle;
  };
})();
}catch(e){console.error(e)}
try{
/* Email pre kontrolu: nedá sa vložiť skopírovaný text, klient ho musí napísať */
(function(){
  var e2=document.getElementById('zkEmail2');if(!e2)return;
  ['paste','drop'].forEach(function(t){e2.addEventListener(t,function(ev){ev.preventDefault();});});
  var h2=document.getElementById('zkHeslo2');if(h2)['paste','drop'].forEach(function(t){h2.addEventListener(t,function(ev){ev.preventDefault();});});
  var o2=document.getElementById('zkOp2');if(o2)['paste','drop'].forEach(function(t){o2.addEventListener(t,function(ev){ev.preventDefault();});});
})();
}catch(e){console.error(e)}
try{
/* Telefón: predvoľba krajiny s vlajkou, číslo sa kontroluje podľa krajiny */
(function(){
  var kod=document.getElementById('zkTelKod'),inp=document.getElementById('zkTel'),err=document.getElementById('zkTelErr');if(!kod||!inp||!err)return;
  /* [ISO, predvoľba, názov, počet číslic od-do] */
  var K=[['SK','421','Slovensko',9,9],['CZ','420','Česko',9,9],['AT','43','Rakúsko',6,13],['HU','36','Maďarsko',8,9],['PL','48','Poľsko',9,9],['UA','380','Ukrajina',9,9],['DE','49','Nemecko',6,13],['GB','44','Spojené kráľovstvo',10,10],['IE','353','Írsko',7,9],['NL','31','Holandsko',9,9],['BE','32','Belgicko',8,9],['FR','33','Francúzsko',9,9],['CH','41','Švajčiarsko',9,9],['IT','40','Taliansko',6,11],['ES','34','Španielsko',9,9],['PT','351','Portugalsko',9,9],['DK','45','Dánsko',8,8],['SE','46','Švédsko',7,10],['NO','47','Nórsko',8,8],['FI','358','Fínsko',5,12],['HR','385','Chorvátsko',8,9],['SI','386','Slovinsko',8,8],['RS','381','Srbsko',8,9],['BA','387','Bosna a Hercegovina',8,8],['RO','40','Rumunsko',9,9],['BG','359','Bulharsko',8,9],['GR','30','Grécko',10,10],['LT','370','Litva',8,8],['LV','371','Lotyšsko',8,8],['EE','372','Estónsko',7,8],['LU','352','Luxembursko',6,11],['CY','357','Cyprus',8,8],['MT','356','Malta',8,8],['IS','354','Island',7,7],['AL','355','Albánsko',8,9],['MK','389','Severné Macedónsko',8,8],['ME','382','Čierna Hora',8,8],['LI','423','Lichtenštajnsko',7,9],['MC','377','Monako',8,9],['AD','376','Andorra',6,9],['SM','378','San Maríno',6,10],['AZ','994','Azerbajdžan',9,9],['FO','298','Faerské ostrovy',6,6],['GI','350','Gibraltár',8,8],['TR','90','Turecko',10,10],['AE','971','Spojené arabské emiráty',8,9],['IL','972','Izrael',8,9],['US','1','USA',10,10],['CA','1','Kanada',10,10],['AU','61','Austrália',9,9],['RU','7','Rusko',10,10],['BY','375','Bielorusko',9,9],['MD','373','Moldavsko',8,8],['GE','995','Gruzínsko',9,9],['AM','374','Arménsko',8,8],['KZ','7','Kazachstan',10,10],['VN','84','Vietnam',9,10],['TH','66','Thajsko',8,9],['IN','91','India',10,10],['CN','86','Čína',11,11],['JP','81','Japonsko',9,10],['KR','82','Južná Kórea',9,10],['BR','55','Brazília',10,11],['MX','52','Mexiko',10,10],['ZA','27','Južná Afrika',9,9],['EG','20','Egypt',10,10],['MA','212','Maroko',9,9],['NG','234','Nigéria',10,10]];
  K[13][1]='39'; /* Taliansko má +39 */
  function vlajka(iso){return String.fromCodePoint(iso.charCodeAt(0)+127397,iso.charCodeAt(1)+127397);}
  K.forEach(function(k){var o=document.createElement('option');o.value=k[0];o.textContent=vlajka(k[0])+' +'+k[1];o.title=k[2];kod.appendChild(o);});
  kod.value='SK';
  /* Úprava čísla: odstráni predvoľbu (+421, 00421, 421) a nulu na začiatku podľa krajiny. Pri inej predvoľbe prepne krajinu. */
  var TR={HU:['06'],LT:['8','0'],RU:['8'],KZ:['8'],BY:['8']},BEZ=['PL','ES','PT','DK','NO','GR','LV','EE','LU','CY','MT','IS','US','CA','IT','MX','LI','MC','AD','SM','FO','GI'];
  function trunk(iso){return TR[iso]||(BEZ.indexOf(iso)>-1?[]:['0'])}
  function kInfo(iso){for(var i=0;i<K.length;i++)if(K[i][0]===iso)return K[i];return K[0]}
  function dlz(d,k){return d.length>=k[3]&&d.length<=k[4]}
  function telNorm(v,iso){var raw=String(v||'').trim(),d=raw.replace(/\D/g,''),k=kInfo(iso),intl=false;
    if(raw.charAt(0)==='+')intl=true;else if(d.slice(0,2)==='00'){intl=true;d=d.slice(2)}
    if(intl){if(d.indexOf(k[1])===0)d=d.slice(k[1].length);else{var b=null;K.forEach(function(x){if(d.indexOf(x[1])===0&&(!b||x[1].length>b[1].length))b=x});if(b){k=b;d=d.slice(b[1].length)}}}
    else if(d.indexOf(k[1])===0&&!dlz(d,k)&&dlz(d.slice(k[1].length),k))d=d.slice(k[1].length);
    trunk(k[0]).some(function(t){if(d.indexOf(t)===0&&d.length-t.length>=k[3]){d=d.slice(t.length);return true}return false});
    return {iso:k[0],n:d,ok:dlz(d,k)&&!(k[0]==='SK'&&!/^[2-9]/.test(d)),intl:intl};}
  function telFiltr(el){el.addEventListener('input',function(){var v=el.value.replace(/[^\d\s+]/g,'').replace(/(?!^)\+/g,'');if(v!==el.value)el.value=v})}
  telFiltr(inp);
  function uprav(){var r=telNorm(inp.value,kod.value);if(r.iso!==kod.value){kod.value=r.iso;kod.dispatchEvent(new Event('change',{bubbles:true}))}if(r.intl||r.iso!==kod.value)inp.value=r.n;return r}
  inp.addEventListener('blur',function(){if(inp.value.replace(/\D/g,''))uprav()});
  window.zkTelKontrola=function(){
    if(!inp.value.replace(/\D/g,''))return false;
    var r=uprav(),zle=!r.ok;
    err.classList.toggle('on',zle); inp.classList.toggle('err',zle); return zle;
  };
  window.zkTelCele=function(){var r=telNorm(inp.value,kod.value);return '+'+kInfo(r.iso)[1]+' '+r.n;};
})();
}catch(e){console.error(e)}
try{
/* Rozpracovaná žiadosť sa ukladá v prehliadači (bez hesla a podpisu) a po návrate sa doplní */
(function(){
  var f=document.getElementById('zkForm');if(!f)return;
  var KEY='kveltoZiadostKroky';
  var polia=function(){return Array.prototype.filter.call(f.querySelectorAll('input,select'),function(el){return el.id&&el.type!=='password'&&el.id!=='zkHeslo'&&el.id!=='zkHeslo2'&&el.type!=='range'&&el.id!=='zkSumaSel'&&el.id!=='zkDobaSel';});};
  function uloz(){
    try{
      var d={};polia().forEach(function(el){d[el.id]=el.type==='checkbox'?el.checked:el.value;});
      d.zkSuma=document.getElementById('zkSuma').value;d.zkDoba=document.getElementById('zkDoba').value;
      var on=f.querySelector('.pane.on');d._krok=on?+on.getAttribute('data-pane'):1;if(d._krok>12)return; /* po odoslaní sa už nič neukladá */
      localStorage.setItem(KEY,JSON.stringify(d));
    }catch(e){}
  }
  function obnov(){
    try{
      var d=JSON.parse(localStorage.getItem(KEY)||'null');if(!d)return;
      polia().forEach(function(el){if(!(el.id in d))return;if(el.type==='checkbox')el.checked=!!d[el.id];else el.value=d[el.id];});
      if(d.zkSuma){document.getElementById('zkSuma').value=d.zkSuma;}
      if(d.zkDoba){document.getElementById('zkDoba').value=d.zkDoba;}
      document.getElementById('zkSuma').dispatchEvent(new Event('input',{bubbles:true}));
      ['zkObcianstvo','zkUcelSel','zkTelKod'].forEach(function(id){var el=document.getElementById(id);if(el)el.dispatchEvent(new Event('change',{bubbles:true}));});
      if(d._krok&&d._krok>1&&d._krok<=11&&window.zkUkaz){window.zkUkaz(d._krok,true);} /* po načítaní bez scrollu, nech stránka ostane hore */
    }catch(e){}
  }
  window.zkZmazRozpracovanu=function(){try{localStorage.removeItem(KEY);}catch(e){}};
  f.addEventListener('input',uloz);f.addEventListener('change',uloz);
  new MutationObserver(uloz).observe(f,{attributes:true,subtree:true,attributeFilter:['class']});
  window.addEventListener('load',function(){setTimeout(obnov,50);});
  /* Po odoslaní: tlačidlo vráti formulár na začiatok a stránku hore */
  var zn=document.getElementById('zkZnova');
  if(zn)zn.addEventListener('click',function(){
    window.zkZmazRozpracovanu();
    f.reset();
    var cl=document.getElementById('zkSigClear');if(cl)cl.click();
    ['zkObcianstvo','zkKrajina'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='Slovensko';});
    document.getElementById('zkSuma').dispatchEvent(new Event('input',{bubbles:true}));
    window.zkUprava=false;
    if(window.zkUkaz)window.zkUkaz(1);
    setTimeout(function(){window.scrollTo({top:0,behavior:'smooth'});},50);
  });
})();
}catch(e){console.error(e)}
try{
/* Žiadosť v krokoch: čiara postupu, číslo kroku, možnosti ako tlačidlá, Enter = Ďalej. Pravidlá kontroly polí sú bez zmeny. */
(function(){var $=function(i){return document.getElementById(i)},f=$('zkForm'),N=12;
function cur(){var on=f.querySelector('.pane.on');return on?+on.getAttribute('data-pane'):1}
f.querySelectorAll('.pane .s1-n').forEach(function(e){var n=+e.closest('.pane').getAttribute('data-pane');e.textContent=(n<10?'0':'')+n});
function upd(){var n=cur();$('zqBar').style.width=(Math.min(n,N)/N*100)+'%';$('zqSpat').style.visibility=(n>1&&n<=N)?'visible':'hidden';$('zkTop').hidden=!(n>=2&&n<=N&&n!==11);$('zqOk').classList.toggle('show',n>N);$('zqDov').style.display=n>N?'none':''}
new MutationObserver(upd).observe(f,{attributes:true,subtree:true,attributeFilter:['class']});upd();
function chipy(selId,boxId,auto){var s=$(selId),b=$(boxId);
 [].slice.call(s.options).forEach(function(o){if(!o.value)return;var c=document.createElement('button');c.type='button';c.className='k-chip';c.textContent=o.textContent;
  c.onclick=function(){s.value=o.value;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
   if(auto&&selId!=='zkUcelSel'&&!(selId==='zkZamestnanie'&&o.value==='Niečo iné'))setTimeout(function(){s.closest('.pane').querySelector('[data-dalej]').click()},250)};b.appendChild(c)});
 function sync(){b.querySelectorAll('.k-chip').forEach(function(c){c.classList.toggle('on',c.textContent===s.value)})}
 s.addEventListener('change',sync);return sync}
var syncs=[chipy('zkUcelSel','zqUcel',true),chipy('zkZamestnanie','zqZam',true),chipy('zkPrijem','zqPrijem',false),chipy('zkExekucie','zqExe',false)];
function vsetky(){syncs.forEach(function(x){x()})}
window.addEventListener('load',function(){setTimeout(vsetky,150)});
f.addEventListener('reset',function(){setTimeout(vsetky,0)});
document.addEventListener('keydown',function(e){var a=document.activeElement;if(e.key==='Enter'&&a&&a.tagName==='INPUT'&&a.type!=='checkbox'&&a.closest('#zkForm')){e.preventDefault();var b=a.closest('.pane').querySelector('[data-dalej]');if(b)b.click()}});
})();
}catch(e){console.error(e)}
