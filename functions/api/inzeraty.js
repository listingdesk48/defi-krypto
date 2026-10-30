/* Zverejnené inzeráty pre stránku Inzeráty. Iba údaje podľa čl. IV ods. 1 až 5 obchodných podmienok: účel, suma, obdobie, krajina, číslo.
   Bez mena a kontaktu. Inzerát, ktorému uplynul mesiac zverejnenia, sa už nevráti (zmizne zo stránky sám). */
export async function onRequestGet(context) {
  var env = context.env, hl = { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' };
  if (!env.DB) return new Response(JSON.stringify({ inzeraty: [] }), { headers: hl });
  var r = await env.DB.prepare(
    'SELECT id, suma, doba, udaje, zverejnene_o FROM ziadosti WHERE poplatok_uhradeny = 1 AND zverejnene_do > ? ORDER BY zverejnene_o DESC LIMIT 500'
  ).bind(new Date().toISOString()).all();
  var out = (r.results || []).map(function (z) {
    var u = {}; try { u = JSON.parse(z.udaje || '{}') || {}; } catch (e) {}
    var ucel = String(u.zkUcelSelText || u.zkUcelSel || '').trim() || String(u.zkUcel || '').trim() || 'Niečo iné';
    var opis = String(u.zkOpis || '').trim().slice(0, 600);
    return { c: String(z.id).slice(0, 10).toUpperCase(), u: ucel.slice(0, 80), o: opis, s: z.suma, d: z.doba, k: String(u.zkKrajina || 'Slovensko').slice(0, 60), p: (String(u.zkZamestnanieText || u.zkZamestnanie || '').trim() + (u.zkZamIne ? ': ' + String(u.zkZamIne).trim().slice(0, 60) : '')).slice(0, 120), i: String(u.zkPrijemText || u.zkPrijem || '').slice(0, 30), e: /^Nemám/.test(String(u.zkExekucie || '')) ? 'nie' : (/^Mám/.test(String(u.zkExekucie || '')) ? 'áno' : ''), z: z.zverejnene_o };
  });
  /* Počet vybavených inzerátov: zaplatené inzeráty, ktorým už uplynul mesiac zverejnenia. Na stránke sa pripočíta k 1 543. */
  var v = 0;
  try { var q = await env.DB.prepare('SELECT COUNT(*) AS n FROM ziadosti WHERE poplatok_uhradeny = 1 AND zverejnene_do <= ?').bind(new Date().toISOString()).first(); v = (q && q.n) || 0; } catch (e) {}
  return new Response(JSON.stringify({ inzeraty: out, vybavene: v }), { headers: hl });
}
