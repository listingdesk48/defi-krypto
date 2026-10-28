/* Odstúpenie od zmluvy (odstupenie-od-zmluvy.html): pošle údaje majiteľovi cez Cloudflare. */
import { esc, txt, json, jeMail, posliMajitelovi } from '../_lib/mail.js';

function datumSk(d) {
  var p = new Intl.DateTimeFormat('sk-SK', { timeZone: 'Europe/Bratislava', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).formatToParts(d);
  var m = {}; p.forEach(function (x) { m[x.type] = x.value; });
  return m.day + '. ' + m.month + '. ' + m.year + ' o ' + m.hour + ':' + m.minute;
}

export async function onRequestPost(context) {
  var env = context.env;
  if (!env.UPOZORNENIE) return json({ ok: false, chyba: 'Server nie je nastavený.' }, 500);

  var d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }

  var meno = txt(d.meno, 80), priez = txt(d.priezvisko, 80), email = txt(d.email, 160),
      tel = txt(d.telefon, 40), poplatok = txt(d.poplatok, 10);

  if (meno.length < 2 || priez.length < 2 || !jeMail(email) || (poplatok !== 'Áno' && poplatok !== 'Nie') || d.suhlas !== true)
    return json({ ok: false, chyba: 'Chýbajú údaje.' }, 400);

  var kedy = datumSk(new Date());

  /* 1. Majiteľovi cez Cloudflare (zadarmo, mimo limitu Resend) */
  var v1 = await posliMajitelovi(context, 'Odstúpenie od zmluvy · ' + meno + ' ' + priez,
    'Odstúpenie od zmluvy\nPodané: ' + kedy + '\nMeno: ' + meno + ' ' + priez + '\nE-mail: ' + email + '\nTelefón: ' + tel + '\nPoplatok za službu uhradený: ' + poplatok,
    '<p><b>Odstúpenie od zmluvy</b><br>Podané: ' + esc(kedy) + '</p>' +
      '<p><b>Meno:</b> ' + esc(meno) + ' ' + esc(priez) + '<br>' +
      '<b>E-mail:</b> ' + esc(email) + '<br>' +
      '<b>Telefón:</b> ' + esc(tel) + '<br>' +
      '<b>Poplatok za službu uhradený:</b> ' + esc(poplatok) + '</p>', email);
  if (!v1.ok) return json({ ok: false, chyba: 'Odoslanie zlyhalo.' }, 502);

  /* Potvrdenie klientovi sa neposiela (rozhodnutie 13.10.2026, šetrenie limitu Resend). */
  return json({ ok: true });
}
