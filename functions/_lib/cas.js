/* Čas v slovenskom pásme a plánovanie e-mailu o schválení.
   Pravidlo: 2 až 4 hodiny po podaní, ale len medzi 7:00 a 20:00. Mimo toho ráno medzi 7:00 a 9:00. */

var TZ = 'Europe/Bratislava';

export function castiSk(d) {
  var p = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  var m = {}; p.forEach(function (x) { m[x.type] = x.value; });
  return { y: +m.year, m: +m.month, d: +m.day, h: +m.hour % 24, mi: +m.minute };
}
/* Posun pásma (ms) v danom okamihu. */
function posun(d) { var c = castiSk(d); return Date.UTC(c.y, c.m - 1, c.d, c.h, c.mi) - Math.floor(d.getTime() / 60000) * 60000; }
/* Dátum pre slovenský lokálny čas (y, m, d, h, mi). */
export function skCas(y, m, d, h, mi) {
  var odhad = new Date(Date.UTC(y, m - 1, d, h, mi) - posun(new Date(Date.UTC(y, m - 1, d, h, mi))));
  return new Date(Date.UTC(y, m - 1, d, h, mi) - posun(odhad));
}
export function datumSk(d) {
  var c = castiSk(d);
  return c.d + '. ' + c.m + '. ' + c.y + ' o ' + String(c.h).padStart(2, '0') + ':' + String(c.mi).padStart(2, '0');
}
function nahodneMin(od, do_) { return od + Math.floor(Math.random() * (do_ - od + 1)); }

export function naplanujSchvalenie(teraz) {
  var k = new Date(teraz.getTime() + nahodneMin(120, 240) * 60000);
  var c = castiSk(k);
  if (c.h >= 7 && c.h < 20) return k;
  var rano = nahodneMin(0, 120);
  if (c.h < 7) return new Date(skCas(c.y, c.m, c.d, 7, 0).getTime() + rano * 60000);
  var zajtra = new Date(skCas(c.y, c.m, c.d, 12, 0).getTime() + 86400000);
  var z = castiSk(zajtra);
  return new Date(skCas(z.y, z.m, z.d, 7, 0).getTime() + rano * 60000);
}
