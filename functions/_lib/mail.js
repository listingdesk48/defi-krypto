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
  if (r.ok) { await kontrolaKvoty(env, r); return { ok: true }; }
  var t = await r.text();
  console.log('Resend chyba', r.status, t);
  return { ok: false, status: r.status, text: t };
}

/* Upozornenie majiteľovi mimo Resend (ide cez Cloudflare, prejde aj pri vyčerpanom limite). */
export function upozorni(context, predmet, text, html, replyTo) {
  var env = context.env;
  if (!env.UPOZORNENIE) return;
  html = html || zakladneHtml(predmet, text);
  context.waitUntil(env.UPOZORNENIE.fetch('https://upozornenie/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ predmet: predmet, text: text, html: html || null, replyTo: replyTo || null })
  }).catch(function () {}));
}
/* E-mail majiteľovi cez Cloudflare (zadarmo, nepočíta sa do limitu Resend). Čaká na výsledok. */
export async function posliMajitelovi(context, predmet, text, html, replyTo) {
  var env = context.env;
  if (!env.UPOZORNENIE) return { ok: false };
  html = html || zakladneHtml(predmet, text);
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
    '\n\nČo robiť: v Resend prepnúť na platený plán (Settings → Billing). Pri dennom limite stačí aj počkať, ráta sa za posledných 24 hodín.\n\nNeodoslané od: ' + odKoho,
    majitelHtml({ problem: true, stitok: 'E-maily sa neposielajú', nadpis: 'Vyčerpaný limit e-mailov v Resend',
      text: 'Resend odmietol odoslať e-mail (' + odkial + '), lebo je vyčerpaný denný alebo mesačný limit.',
      sekcie: [{ nadpis: 'Čo robiť', text: 'V Resend prepnúť na platený plán (Settings → Billing). Pri dennom limite stačí aj počkať, ráta sa za posledných 24 hodín.' },
        { nadpis: 'Podrobnosti', riadky: [['Neodoslané od', odKoho]] }, { nadpis: 'Odpoveď Resend', kod: vysledok.text }] }));
}

/* Upozornenie vopred: Resend pri každom odoslanom e-maile vráti, koľko e-mailov je už minutých.
   Bezplatný plán: 100 denne (za posledných 24 hodín) a 3 000 mesačne. Hlavičku s denným počtom posiela len pri bezplatnom pláne.
   Upozornenie príde pri 95 denne a pri 2 900 mesačne, každé iba raz (záznam v tabuľke upozornenia). */
var KVOTA = [
  { kluc: 'kvota-den', hlavicka: 'x-resend-daily-quota', hranica: 95, limit: '100', hodin: 24, nadpis: 'Denný limit e-mailov v Resend sa blíži', label: 'Minuté za posledných 24 hodín',
    znamena: 'Po dosiahnutí limitu web prestane posielať e-maily klientom, kým neprejde 24 hodín.' },
  { kluc: 'kvota-mesiac', hlavicka: 'x-resend-monthly-quota', hranica: 2900, limit: '3 000', hodin: 24 * 25, nadpis: 'Mesačný limit e-mailov v Resend sa blíži', label: 'Minuté tento mesiac',
    znamena: 'Po dosiahnutí limitu web prestane posielať e-maily klientom.' }
];
async function kontrolaKvoty(env, r) {
  try {
    if (!env.DB || !env.UPOZORNENIE || !r.headers.get('x-resend-daily-quota')) return;
    for (var i = 0; i < KVOTA.length; i++) {
      var k = KVOTA[i], pouzite = parseInt(r.headers.get(k.hlavicka) || '', 10), pocet = String(pouzite).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      if (!(pouzite >= k.hranica)) continue;
      await env.DB.prepare('CREATE TABLE IF NOT EXISTS upozornenia (kluc TEXT PRIMARY KEY, kedy TEXT)').run();
      var z = await env.DB.prepare('SELECT kedy FROM upozornenia WHERE kluc = ?').bind(k.kluc).first();
      if (z && Date.now() - new Date(z.kedy).getTime() < k.hodin * 3600000) continue;
      await env.DB.prepare('INSERT OR REPLACE INTO upozornenia (kluc, kedy) VALUES (?, ?)').bind(k.kluc, new Date().toISOString()).run();
      var text = k.nadpis + '.\n' + k.label + ': ' + pocet + ' z ' + k.limit + '.\n' + k.znamena + '\nČo robiť: v Resend prepnúť na platený plán (Settings → Billing).';
      await env.UPOZORNENIE.fetch('https://upozornenie/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predmet: k.nadpis, text: text, html: majitelHtml({ problem: true, stitok: 'Blíži sa limit e-mailov', nadpis: k.nadpis,
          hlavne: { label: k.label, value: pocet + ' z ' + k.limit },
          sekcie: [{ nadpis: 'Čo to znamená', text: k.znamena }, { nadpis: 'Čo robiť', text: 'V Resend prepnúť na platený plán (Settings → Billing).' }] }) }) });
    }
  } catch (e) { console.log('kvota', String(e)); }
}

/* Jednoduché upozornenie majiteľovi, keď volajúci nepošle vlastný vzhľad (napr. chyby na webe). */
function zakladneHtml(predmet, text) {
  var chyba = /^Chyba/.test(predmet);
  return majitelHtml({ problem: /Chyba|nepodarilo|nižšia|limit/i.test(predmet), stitok: chyba ? 'Chyba na webe' : 'Upozornenie z webu', nadpis: predmet,
    text: chyba ? '' : text, sekcie: chyba ? [{ nadpis: 'Technický popis chyby', kod: text }] : [] });
}

/* Vzhľad e-mailov pre majiteľa. Iný ako e-maily klientom: sivé pozadie, karta s farebným pruhom (šampanský bežná správa, červený problém)
   a tmavý rámik s hlavným údajom. o = { problem, stitok, nadpis, kedy, text, hlavne: { label, value, pod: [html] }, sekcie: [{ nadpis, text, html, kod, riadky: [[k, v, tucne]] }], poznamka } */
export function majitelHtml(o) {
  var F = "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Inter','Helvetica Neue',Arial,sans-serif";
  var pruh = o.problem ? '#df1b41' : '#c2ad8c', stitokF = o.problem ? '#df1b41' : '#a89373';
  function t(s) { return 'font-family:' + F + ';' + s; }
  function riadky(r) {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + r.map(function (x, i) {
      var v = esc(x[1]), dlhe = String(x[1]).indexOf(' ') < 0 && String(x[1]).length > 22;
      var hr = i < r.length - 1 ? 'border-bottom:1px solid #ececf0;' : '';
      if (dlhe) return '<tr><td colspan="2" style="' + t('padding:10px 0;' + hr + 'font-size:13px;color:#86868b') + '">' + esc(x[0]) + '<div style="font-family:Menlo,Consolas,monospace;font-size:13px;color:#1d1d1f;word-break:break-all;margin-top:3px">' + v + '</div></td></tr>';
      return '<tr><td style="' + t('padding:10px 0;' + hr + 'font-size:14px;color:#86868b;vertical-align:top') + '">' + esc(x[0]) + '</td><td align="right" style="' + t('padding:10px 0 10px 14px;' + hr + 'font-size:14px;color:#1d1d1f;text-align:right;vertical-align:top;' + (String(x[1]).length <= 20 ? 'white-space:nowrap;' : '') + (x[2] ? 'font-weight:700' : 'font-weight:500')) + '">' + v + '</td></tr>';
    }).join('') + '</table>';
  }
  var h = '<tr><td style="padding:22px 22px 0"><div style="' + t('font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:' + stitokF) + '">' + esc(o.stitok) + '</div>' +
    '<div style="' + t('font-size:22px;line-height:1.25;font-weight:800;letter-spacing:-.5px;color:#1d1d1f;margin-top:6px') + '">' + esc(o.nadpis) + '</div>' +
    (o.kedy ? '<div style="' + t('font-size:13px;color:#86868b;margin-top:4px') + '">' + esc(o.kedy) + '</div>' : '') + '</td></tr>';
  if (o.text) h += '<tr><td style="' + t('padding:14px 22px 0;font-size:15px;line-height:1.55;color:#1d1d1f') + '">' + esc(o.text).replace(/\n/g, '<br>') + '</td></tr>';
  if (o.hlavne) h += '<tr><td style="padding:18px 22px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1d1d1f;border-radius:14px"><tr><td style="padding:18px 20px">' +
    '<div style="' + t('font-size:12px;color:rgba(255,255,255,.6);margin-bottom:4px') + '">' + esc(o.hlavne.label) + '</div>' +
    '<div style="' + t('font-size:26px;line-height:1.15;font-weight:800;letter-spacing:-.6px;color:' + (o.problem ? '#ffffff' : '#c2ad8c')) + '">' + esc(o.hlavne.value) + '</div>' +
    (o.hlavne.pod || []).map(function (p) { return '<div style="' + t('font-size:13px;line-height:1.5;color:rgba(255,255,255,.75);margin-top:8px;word-break:break-word') + '">' + p + '</div>'; }).join('') +
    '</td></tr></table></td></tr>';
  (o.sekcie || []).forEach(function (s) {
    h += '<tr><td style="padding:22px 22px 0"><div style="' + t('font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#86868b;margin-bottom:4px') + '">' + esc(s.nadpis) + '</div>' +
      (s.text ? '<div style="' + t('font-size:14px;line-height:1.55;color:#1d1d1f;margin:4px 0 6px') + '">' + (s.html ? s.text : esc(s.text).replace(/\n/g, '<br>')) + '</div>' : '') +
      (s.kod ? '<div style="font-family:Menlo,Consolas,monospace;font-size:12px;line-height:1.5;color:#1d1d1f;background:#f5f5f7;border-radius:10px;padding:12px;white-space:pre-wrap;word-break:break-all">' + esc(s.kod) + '</div>' : '') +
      (s.riadky ? riadky(s.riadky) : '') + '</td></tr>';
  });
  if (o.poznamka) h += '<tr><td style="' + t('padding:16px 22px 0;font-size:12px;line-height:1.5;color:#86868b') + '">' + esc(o.poznamka) + '</td></tr>';
  return '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#f2f2f4"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f2f4"><tr><td align="center" style="padding:24px 12px 32px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;border-top:5px solid ' + pruh + '">' + h +
    '<tr><td style="padding:22px"></td></tr></table>' +
    '<div style="' + t('font-size:12px;color:#86868b;margin-top:14px;text-align:center') + '">Upozornenie z webu pre majiteľa</div>' +
    '</td></tr></table></body></html>';
}
