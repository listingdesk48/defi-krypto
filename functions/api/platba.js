/* Údaje na úhradu poplatku pre prihláseného klienta (uhradit-poplatok.html): jeho bitcoinová adresa a stav.
   Pri otvorení stránky sa platba klienta skontroluje hneď (najviac raz za minútu), nečaká sa na 5-minútovú kontrolu. */
import { prihlaseny } from '../_lib/auth.js';
import { pridelAdresu } from '../_lib/adresa.js';
import { skontrolujZiadost } from '../_lib/platby.js';
export async function onRequestGet(context) {
  var hl = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  var z = await prihlaseny(context.env, context.request);
  if (!z) return new Response(JSON.stringify({ prihlaseny: false }), { headers: hl });
  var adresa = z.adresa;
  if (!adresa) { try { adresa = await pridelAdresu(context.env, z.id); } catch (e) { adresa = null; } }
  var uhradeny = !!z.poplatok_uhradeny;
  if (adresa && !uhradeny && (!z.platba_kontrola || Date.now() - new Date(z.platba_kontrola).getTime() > 60000)) {
    try { z.adresa = adresa; uhradeny = await skontrolujZiadost(context, z, { kurz: null, vysl: { skontrolovane: 0, zaplatene: 0 } }); } catch (e) {}
  }
  /* QR kód sa ukáže len po schválení žiadosti (alebo keď je už uhradené). Kým sa žiadosť posudzuje, napr. po zmene sumy, klient neplatí. */
  var moze = uhradeny || z.stav === 'schvalene';
  return new Response(JSON.stringify({ prihlaseny: true, adresa: moze ? adresa : null, caka: !moze, poplatok: 300, stav: z.stav, poplatok_uhradeny: uhradeny }), { headers: hl });
}
