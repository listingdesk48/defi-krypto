/* Kto je prihlásený a aký má stav žiadosti. */
import { prihlaseny, cookieNastav } from '../_lib/auth.js';
export async function onRequestGet(context) {
  var z = await prihlaseny(context.env, context.request);
  var hl = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (!z) return new Response(JSON.stringify({ prihlaseny: false }), { headers: hl });
  hl['Set-Cookie'] = cookieNastav(z.relacia_token);
  var udaje = {}; try { udaje = JSON.parse(z.udaje || '{}') || {}; } catch (e) { udaje = {}; } delete udaje.zkHeslo;
  var LEHOTA_DNI = 7, poplatok_do = null, stav = z.stav;
  if (z.schvalene_o) poplatok_do = new Date(new Date(z.schvalene_o).getTime() + LEHOTA_DNI * 86400000).toISOString();
  /* Po 7 dňoch od schválenia bez úhrady poplatku je schválenie zrušené (cron to zapíše do databázy, tu je to pre istotu aj hneď). */
  if (stav === 'schvalene' && !z.poplatok_uhradeny && poplatok_do && poplatok_do <= new Date().toISOString()) stav = 'zrusene';
  return new Response(JSON.stringify({ prihlaseny: true, cislo: String(z.id || '').slice(0, 10).toUpperCase(), meno: z.meno, priezvisko: z.priezvisko, email: z.email,
    suma: z.suma, doba: z.doba, splatka: z.splatka, celkom: z.celkom, stav: stav, poplatok_do: poplatok_do, poplatok_lehota_dni: LEHOTA_DNI, schvalena_suma: z.schvalena_suma,
    vytvorene: z.vytvorene, schvalene_o: z.schvalene_o, doklad_predna: !!z.doklad_predna, doklad_zadna: !!z.doklad_zadna, poplatok_uhradeny: !!z.poplatok_uhradeny, poplatok_uhradeny_o: z.poplatok_uhradeny_o, poplatok: 300, urok: 5, telefon: z.telefon, udaje: udaje, podpis: !!z.podpis }), { headers: hl });
}
