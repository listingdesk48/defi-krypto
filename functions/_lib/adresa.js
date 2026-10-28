/* Pridelenie bitcoinovej adresy na úhradu poplatku.
   Adresy sa počítajú z verejného kľúča peňaženky (XPUB v nastaveniach Cloudflare Pages), číslujú sa od 0.
   Každá žiadosť má svoju adresu. Nepoužitá adresa sa po zrušení schválenia a 30 dňoch čakania pridelí znova (recyklácia),
   aby počet nepoužitých adries v peňaženke nerástol. Adresa, na ktorú kedy prišli peniaze (pouzita = 1), sa už nikdy znova nepridelí. */
import { adresaZXpub } from './btc.js';

export async function pridelAdresu(env, ziadostId) {
  if (!env.XPUB) return null;
  var ma = await env.DB.prepare('SELECT adresa FROM ziadosti WHERE id = ?').bind(ziadostId).first();
  if (ma && ma.adresa) return ma.adresa;
  var t = new Date().toISOString();
  /* 1. najnižšia uvoľnená adresa */
  var r = await env.DB.prepare(
    'UPDATE adresy SET ziadost_id = ?, pridelena_o = ?, uvolnit_po = NULL WHERE idx = (SELECT idx FROM adresy WHERE ziadost_id IS NULL AND pouzita = 0 AND (uvolnit_po IS NULL OR uvolnit_po <= ?) ORDER BY idx LIMIT 1) AND ziadost_id IS NULL RETURNING adresa'
  ).bind(ziadostId, t, t).first();
  var adr = r && r.adresa;
  /* 2. inak nová adresa s ďalším číslom */
  for (var pokus = 0; !adr && pokus < 5; pokus++) {
    var m = await env.DB.prepare('SELECT COALESCE(MAX(idx), -1) + 1 AS n FROM adresy').first();
    var idx = m.n, a = adresaZXpub(env.XPUB, idx);
    try {
      await env.DB.prepare('INSERT INTO adresy (idx, adresa, ziadost_id, pridelena_o) VALUES (?, ?, ?, ?)').bind(idx, a, ziadostId, t).run();
      adr = a;
    } catch (e) { /* súbežné pridelenie, skúsi ďalšie číslo */ }
  }
  if (adr) await env.DB.prepare('UPDATE ziadosti SET adresa = ? WHERE id = ?').bind(adr, ziadostId).run();
  return adr || null;
}
