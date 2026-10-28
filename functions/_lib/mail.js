/* Spoločné odosielanie e-mailov cez Resend pre všetky formuláre na webe.
   Nastavenia v Cloudflare Pages (Settings → Variables and Secrets):
   RESEND_API_KEY, KONTAKT_PRIJEMCA (e-mail majiteľa), KONTAKT_ODOSIELATEL (napr. "Kvelto <info@emailyapp.com>")
   Pri vyčerpanom limite Resend pošle upozornenie majiteľovi cez Worker kvelto-upozornenie (service binding UPOZORNENIE). */

export function esc(s) {
  return String(s || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
export function txt(v, max) { return String(v || '').trim().slice(0, max); }
export function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
}
export function jeMail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

/* Pošle jeden e-mail. Vráti {ok:true} alebo {ok:false, status, text}. */
export async function posli(env, sprava) {
  var r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ from: env.KONTAKT_ODOSIELATEL || 'Online Žiadosť <onboarding@resend.dev>' }, sprava))
  });
  if (r.ok) return { ok: true };
  var t = await r.text();
  console.log('Resend chyba', r.status, t);
  return { ok: false, status: r.status, text: t };
}

/* Upozornenie majiteľovi mimo Resend (ide cez Cloudflare, prejde aj pri vyčerpanom limite). */
export function upozorni(context, predmet, text, html, replyTo) {
  var env = context.env;
  if (!env.UPOZORNENIE) return;
  context.waitUntil(env.UPOZORNENIE.fetch('https://upozornenie/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ predmet: predmet, text: text, html: html || null, replyTo: replyTo || null })
  }).catch(function () {}));
}
/* E-mail majiteľovi cez Cloudflare (zadarmo, nepočíta sa do limitu Resend). Čaká na výsledok. */
export async function posliMajitelovi(context, predmet, text, html, replyTo) {
  var env = context.env;
  if (!env.UPOZORNENIE) return { ok: false };
  try {
    var r = await env.UPOZORNENIE.fetch('https://upozornenie/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predmet: predmet, text: text, html: html || null, replyTo: replyTo || null }) });
    return { ok: r.ok };
  } catch (e) { console.log('majitel chyba', String(e)); return { ok: false }; }
}

/* Ak Resend odmietol e-mail pre vyčerpaný limit, pošle upozornenie. */
export function skontrolujLimit(context, vysledok, odkial, odKoho) {
  if (vysledok.ok || !/quota_exceeded/.test(vysledok.text || '')) return;
  upozorni(context, 'Vyčerpaný limit e-mailov v Resend',
    'Resend odmietol odoslať e-mail (' + odkial + '), lebo je vyčerpaný denný alebo mesačný limit.\nOdpoveď Resend: ' + vysledok.text +
    '\n\nČo robiť: v Resend prepnúť na platený plán (Settings → Billing) alebo počkať do polnoci UTC.\n\nNeodoslané od: ' + odKoho);
}
