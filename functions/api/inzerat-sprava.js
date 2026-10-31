/* Formulár Ozvať sa pri inzeráte: správu záujemcu pošle e-mailom zadávateľovi inzerátu (OP čl. VIII ods. 3).
   Odpoveď zadávateľa ide priamo záujemcovi (reply_to). Testovacie inzeráty TEST1 až TEST5 idú na testovaciu adresu. */
import { txt, json, jeMail, posli, skontrolujLimit, posliMajitelovi, majitelHtml } from '../_lib/mail.js';
import { skontrolujText, odtlacok, skontrolujPocet } from '../_lib/filter.js';
import { spravaHtml } from '../_lib/platby.js';

var TEST_EMAIL = 'listingdesk@proton.me';

export async function onRequestPost(context) {
  var env = context.env;
  var d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }
  var inz = txt(d.inzerat, 20).toUpperCase(), meno = txt(d.meno, 80), email = txt(d.email, 160), sprava = txt(d.sprava, 5000);
  if (!inz || meno.length < 2 || sprava.length < 20 || !jeMail(email)) return json({ ok: false, chyba: 'Chýbajú údaje.' }, 400);
  /* Súhlas záujemcu s odovzdaním správy zadávateľovi (Ochrana osobných údajov čl. II ods. 5). */
  if (d.suhlas !== true) return json({ ok: false, chyba: 'Chýba súhlas.' }, 400);

  var komu = null;
  if (/^TEST[1-5]$/.test(inz)) komu = TEST_EMAIL;
  else if (env.DB) {
    var z = await env.DB.prepare('SELECT email FROM ziadosti WHERE upper(substr(id,1,10)) = ? AND poplatok_uhradeny = 1 AND zverejnene_do > ? LIMIT 1')
      .bind(inz, new Date().toISOString()).first();
    if (z && z.email) komu = z.email;
  }
  if (!komu) return json({ ok: false, chyba: 'Inzerát už nie je zverejnený.' }, 404);

  /* Filter: správa so zakázaným slovom alebo údajom, priveľa správ od jedného človeka alebo rovnaká správa na viac inzerátov
     nejde zadávateľovi, ale majiteľovi na kontrolu (cez Cloudflare, mimo Resend). Záujemca vždy vidí, že správa odišla. */
  var pocet = await skontrolujPocet(env, email, inz, await odtlacok(sprava));
  /* Tretia a ďalšia správa od jedného e-mailu za 24 hodín sa nikam neposiela. Záujemca vidí, že odišla. */
  if (pocet.zahodit) return json({ ok: true });
  var nalezy = skontrolujText(meno + '\n' + sprava).concat(pocet.nalezy);
  if (nalezy.length) {
    var predmet = 'Správa na kontrolu: ' + inz;
    var text = 'Správa k inzerátu ' + inz + ' nebola odoslaná zadávateľovi. Záujemca vidí, že odišla.\n\nPrečo:\n' + nalezy.join('\n') +
      '\n\nInzerát: ' + inz + '\nZadávateľ (komu mala ísť): ' + komu + '\nMeno záujemcu: ' + meno + '\nE-mail záujemcu: ' + email +
      '\n\nSpráva:\n' + sprava + '\n\nAk je správa v poriadku, prepošli ju zadávateľovi.';
    var html = majitelHtml({ problem: true, stitok: 'Správa na kontrolu', nadpis: 'Správa k inzerátu ' + inz + ' nebola odoslaná',
      text: 'Záujemca vidí, že správa odišla. Zadávateľovi neprišla.',
      sekcie: [{ nadpis: 'Prečo', text: nalezy.join('\n') },
        { nadpis: 'Údaje', riadky: [['Inzerát', inz], ['Zadávateľ (komu mala ísť)', komu], ['Meno záujemcu', meno], ['E-mail záujemcu', email]] },
        { nadpis: 'Správa', text: sprava }],
      poznamka: 'Ak je správa v poriadku, prepošli ju zadávateľovi.' });
    var m = await posliMajitelovi(context, predmet, text, html);
    if (!m.ok) console.log('Správu na kontrolu sa nepodarilo poslať majiteľovi', inz, email);
    return json({ ok: true });
  }

  /* Ako odosielateľ sa zobrazí meno záujemcu, adresa je naša (reply@mail.emailyapp.com). */
  var odosielatel = '"' + meno.replace(/["\\<>\r\n]/g, '') + '" <reply@mail.emailyapp.com>';
  var v = await posli(env, { from: odosielatel, to: [komu], reply_to: email, subject: 'Nová správa k inzerátu',
    html: spravaHtml(inz, meno, email, sprava),
    text: 'Nová správa k Vášmu inzerátu ' + inz + '\n\nMeno záujemcu: ' + meno + '\n\nSpráva:\n' + sprava +
      '\n\nAk mu chcete odpovedať, stačí odpísať na tento e-mail.' });
  if (!v.ok) { skontrolujLimit(context, v, 'správa k inzerátu', email); return json({ ok: false, chyba: 'Odoslanie zlyhalo.' }, 502); }
  return json({ ok: true });
}
