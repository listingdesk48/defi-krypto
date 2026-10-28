/* Stránky, ktoré sú súčasťou účtu (Úhrada poplatku, Môj účet), vidí iba prihlásený klient.
   Neprihláseného presmeruje na Prihlásenie. Google ich neindexuje (X-Robots-Tag: noindex).
   Ktoré adresy sem chodia, určuje _routes.json. */
import { prihlaseny } from './_lib/auth.js';
var CHRANENE = ['/uhradit-poplatok', '/uhradit-poplatok.html'];
var NOINDEX = ['/uhradit-poplatok', '/uhradit-poplatok.html', '/ucet', '/ucet.html'];
export async function onRequest(context) {
  var p = new URL(context.request.url).pathname;
  if (CHRANENE.indexOf(p) >= 0) {
    var z = null;
    try { z = await prihlaseny(context.env, context.request); } catch (e) { z = null; }
    if (!z) return new Response(null, { status: 302, headers: { 'Location': '/prihlasenie.html', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  var res = await context.next();
  if (NOINDEX.indexOf(p) >= 0) {
    res = new Response(res.body, res);
    res.headers.set('X-Robots-Tag', 'noindex');
    res.headers.set('Cache-Control', 'no-store');
  }
  return res;
}
