import { zrusRelaciu, cookieZmaz } from '../_lib/auth.js';
export async function onRequestPost(context) {
  await zrusRelaciu(context.env, context.request);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieZmaz() } });
}
