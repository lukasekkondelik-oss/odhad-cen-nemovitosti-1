// Odesílání e-mailů přes Resend (zdarma do 3 000 e-mailů/měsíc, 100/den).
// Chceš jiného poskytovatele (Brevo, Mailgun, SMTP2GO…)? Vyměň jen tělo této funkce.
export async function sendMail(env, { from, to, subject, html, text, replyTo }) {
  if (!env.RESEND_API_KEY) throw new Error('Chybí RESEND_API_KEY');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, text, reply_to: replyTo })
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
