/* Úprava osobných údajov v účte (ucet.html). Klient si sám opraví meno, priezvisko, dátum narodenia,
   občianstvo, adresu, číslo občianskeho preukazu a telefón. E-mail, suma, doba ani údaje v inzeráte sa tu nemenia.
   Po úhrade poplatku sa nemení nič (inzerát je pevný). Časť 'prijem' mení zdroj príjmu, príjem a exekúcie, časť 'ucel' účel a popis účelu. */
import { txt, json } from '../_lib/mail.js';
import { prihlaseny, teraz } from '../_lib/auth.js';

export async function onRequestPost(context) {
  try { return await spracuj(context); } catch (e) {
    console.log('udaje chyba', String(e && e.stack || e));
    return json({ ok: false, chyba: 'Chyba servera.' }, 500);
  }
}

async function spracuj(context) {
  var env = context.env;
  var z = await prihlaseny(env, context.request);
  if (!z) return json({ ok: false, chyba: 'Nie ste prihlásený.' }, 401);
  if (z.poplatok_uhradeny) return json({ ok: false, chyba: 'Poplatok je uhradený, údaje už nie je možné meniť.' }, 400);
  var d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }
  if (d.cast === 'prijem') return await ulozPrijem(env, z, d);
  if (d.cast === 'ucel') return await ulozUcel(env, z, d);

  var meno = txt(d.meno, 80), priez = txt(d.priezvisko, 80), nar = txt(d.narodenie, 10), obc = txt(d.obcianstvo, 60);
  var ulica = txt(d.ulica, 120), mesto = txt(d.mesto, 80), psc = txt(d.psc, 12), krajina = txt(d.krajina, 60);
  var op = txt(d.op, 20).toUpperCase().replace(/\s+/g, ''), telKod = txt(d.telKod, 6).replace(/\s+/g, ''), tel = txt(d.tel, 30).replace(/[^\d]/g, '');

  var chyby = [];
  if (meno.length < 2) chyby.push('meno');
  if (priez.length < 2) chyby.push('priezvisko');
  var iso = datumIso(nar);
  if (!iso) chyby.push('dátum narodenia');
  else if (vek(iso) < 18) chyby.push('vek (musíte mať 18 rokov a viac)');
  if (!obc) chyby.push('občianstvo');
  /* Rovnaké pravidlá ako vo formulári žiadosti (index.html) */
  var MENO = /^[A-Za-zÀ-ž][A-Za-zÀ-ž' \-]*[A-Za-zÀ-ž]$/;
  if (meno.length >= 2 && !MENO.test(meno)) chyby.push('meno (len písmená)');
  if (priez.length >= 2 && !MENO.test(priez)) chyby.push('priezvisko (len písmená)');
  var skcz = krajina === 'Slovensko' || krajina === 'Česko';
  if ((ulica.match(/[A-Za-zÀ-ž]/g) || []).length < 3) chyby.push('ulica');
  else if (skcz && !/\d/.test(ulica)) chyby.push('ulica (chýba číslo)');
  if (!/^[A-Za-zÀ-ž][A-Za-zÀ-ž' \-\.]*$/.test(mesto) || (mesto.match(/[A-Za-zÀ-ž]/g) || []).length < 2) chyby.push('mesto');
  psc = skcz ? psc.replace(/\s+/g, '') : psc;
  if (skcz ? !/^\d{5}$/.test(psc) : !/^[A-Za-z0-9\- ]{3,10}$/.test(psc)) chyby.push('PSČ');
  if (!krajina) chyby.push('krajina');
  if (obc === 'Slovensko' ? !/^[A-Z]{2}\d{6}$/.test(op) : obc === 'Česko' ? !/^(\d{9}|[A-Z]{2}\d{6})$/.test(op) : (op.replace(/[\-\/\.]/g, '').length < 5 || !/^[A-Z0-9\-\/\.]+$/.test(op))) chyby.push('číslo občianskeho preukazu');
  if (!/^\+\d{1,4}$/.test(telKod)) chyby.push('predvoľba');
  if ((telKod === '+421' || telKod === '+420') && tel.charAt(0) === '0') tel = tel.slice(1);
  if (telKod === '+421' ? !/^[2-9]\d{8}$/.test(tel) : telKod === '+420' ? !/^\d{9}$/.test(tel) : (tel.length < 6 || tel.length > 13)) chyby.push('telefónne číslo');
  if (chyby.length) return json({ ok: false, chyba: 'Skontrolujte: ' + chyby.join(', ') + '.' }, 400);

  var udaje = {}; try { udaje = JSON.parse(z.udaje || '{}') || {}; } catch (e) { udaje = {}; }

  udaje.zkMeno = meno; udaje.zkPriezvisko = priez;
  udaje.zkNarodenieTxt = nar; udaje.zkNarodenie = iso;
  udaje.zkObcianstvo = obc; udaje.zkObcianstvoText = obc;
  udaje.zkUlica = ulica; udaje.zkMesto = mesto; udaje.zkPsc = psc;
  udaje.zkKrajina = krajina; udaje.zkKrajinaText = krajina;
  udaje.zkOp = op; udaje.zkTelKod = telKod; udaje.zkTel = tel;
  udaje.udajeUpravene = teraz();
  delete udaje.zkHeslo;

  await env.DB.prepare('UPDATE ziadosti SET meno = ?, priezvisko = ?, telefon = ?, udaje = ? WHERE id = ?')
    .bind(meno, priez, (telKod + ' ' + tel).trim(), JSON.stringify(udaje), z.id).run();
  return json({ ok: true });
}

function datumIso(t) {
  var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(t || ''); if (!m) return null;
  var dd = +m[1], mm = +m[2], rr = +m[3], x = new Date(rr, mm - 1, dd);
  if (rr < 1900 || x.getFullYear() !== rr || x.getMonth() !== mm - 1 || x.getDate() !== dd || x > new Date()) return null;
  return rr + '-' + ('0' + mm).slice(-2) + '-' + ('0' + dd).slice(-2);
}
function vek(iso) {
  var dn = new Date(iso), dnes = new Date(), v = dnes.getFullYear() - dn.getFullYear(), m = dnes.getMonth() - dn.getMonth();
  if (m < 0 || (m === 0 && dnes.getDate() < dn.getDate())) v--; return v;
}

var ZDROJE = ['Som zamestnaný', 'Pracujem v zahraničí', 'Podnikám', 'Som bez práce', 'Študujem', 'Som na dôchodku', 'Som na materskej alebo rodičovskej', 'Poberám dávky od štátu', 'Niečo iné'];
var PRIJMY = ['do 800 €', '800 až 1 500 €', '1 500 až 2 500 €', 'nad 2 500 €'];
var EXEKUCIE = ['Mám exekúciu', 'Nemám exekúciu'];
var UCELY = ['Bývanie', 'Rekonštrukcia', 'Auto', 'Splatenie dlhov', 'Nákupy', 'Cestovanie', 'Škola a vzdelávanie', 'Osobné výdavky', 'Podnikanie', 'Niečo iné'];

function nacitaj(z) { var u = {}; try { u = JSON.parse(z.udaje || '{}') || {}; } catch (e) { u = {}; } delete u.zkHeslo; return u; }
async function uloz(env, z, udaje) {
  udaje.udajeUpravene = teraz();
  await env.DB.prepare('UPDATE ziadosti SET udaje = ? WHERE id = ?').bind(JSON.stringify(udaje), z.id).run();
  return json({ ok: true });
}

async function ulozPrijem(env, z, d) {
  var zdroj = txt(d.zdroj, 60), ine = txt(d.zamIne, 60), prijem = txt(d.prijem, 30), exek = txt(d.exekucie, 30);
  var chyby = [];
  if (ZDROJE.indexOf(zdroj) < 0) chyby.push('zdroj príjmu');
  if (zdroj === 'Niečo iné' && ine.length < 3) chyby.push('zdroj príjmu (napíšte aspoň 3 znaky)');
  if (PRIJMY.indexOf(prijem) < 0) chyby.push('mesačný príjem');
  if (EXEKUCIE.indexOf(exek) < 0) chyby.push('exekúcie');
  if (chyby.length) return json({ ok: false, chyba: 'Skontrolujte: ' + chyby.join(', ') + '.' }, 400);
  var u = nacitaj(z);
  u.zkZamestnanie = zdroj; u.zkZamestnanieText = zdroj; u.zkZamIne = zdroj === 'Niečo iné' ? ine : '';
  u.zkPrijem = prijem; u.zkPrijemText = prijem; u.zkExekucie = exek; u.zkExekucieText = exek;
  return uloz(env, z, u);
}

async function ulozUcel(env, z, d) {
  var ucel = txt(d.ucel, 40), opis = txt(d.opis, 600);
  var chyby = [];
  if (UCELY.indexOf(ucel) < 0) chyby.push('účel');
  if (opis.length < 10) chyby.push('popis účelu (napíšte aspoň 10 znakov)');
  if (chyby.length) return json({ ok: false, chyba: 'Skontrolujte: ' + chyby.join(', ') + '.' }, 400);
  var u = nacitaj(z);
  u.zkUcelSel = ucel; u.zkUcelSelText = ucel; u.zkUcel = ucel; u.zkOpis = opis;
  return uloz(env, z, u);
}
