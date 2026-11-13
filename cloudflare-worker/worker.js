/**
 * Cloudflare Email Routing Worker for @rana.fr
 *
 * Deploy via Cloudflare Dashboard -> Workers & Pages -> Create Worker (or `wrangler deploy`)
 * Then go to Cloudflare Dashboard -> rana.fr -> Email -> Email Routing -> Routing rules:
 *   Catch-all address -> Action: Send to a Worker -> select this worker.
 */

export default {
  async email(message, env, ctx) {
    const webhookUrl =
      env.INBOUND_WEBHOOK_URL ||
      'https://ais-pre-seyhltmd3w55jkupthjwyw-780001404467.asia-southeast1.run.app/api/inbound';

    const rawMime = await new Response(message.raw).text();
    const subject = message.headers.get('subject') || '(No subject)';

    const headers = {
      'Content-Type': 'application/json',
    };

    if (env.INBOUND_WEBHOOK_SECRET) {
      headers['X-Webhook-Secret'] = env.INBOUND_WEBHOOK_SECRET;
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: message.to,
        from: message.from,
        subject,
        raw: rawMime,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Inbound webhook error:', res.status, errText);
    }
  },
};
