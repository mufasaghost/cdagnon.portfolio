// api/contact.js
//
// EXAMPLE serverless API route (Vercel-style Node function).
//
// This portfolio is a static site (index.html/script.js/style.css) with no
// pre-existing server-side form handling — the contact form doesn't post
// anywhere. This route is a small, clearly-marked example showing where
// Jev (TypeSafe AI) would plug in: scoring/flagging inbound contact
// messages for spam and lead quality before they're forwarded on.
//
// It is intentionally minimal: it classifies the message and reports the
// result. Wiring up real delivery (email, a database, a Slack webhook,
// etc.) is left as a TODO, since that's specific to how the site owner
// actually wants to receive messages.

const { classifyContactMessage } = require('../lib/jev');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: 'name, email, and message are all required' });
  }

  // Typed, fast decision via Jev: spam / lead-quality / category. Degrades
  // gracefully to `available: false` if TYPESAFE_API_KEY or the SDK isn't
  // present, so the form keeps working either way.
  const classification = await classifyContactMessage({ name, email, message });

  if (classification.available && classification.isSpam) {
    // Return 200 (don't tip off bots) but don't forward the message.
    return res.status(200).json({
      status: 'received',
      forwarded: false,
      reason: 'flagged as likely spam',
    });
  }

  // TODO: forward the message on (email / DB / webhook) — out of scope
  // for this example, which only demonstrates the Jev classification step.

  return res.status(200).json({
    status: 'received',
    forwarded: true,
    leadScore: classification.available ? classification.leadScore : null,
    category: classification.available ? classification.category : null,
  });
};
