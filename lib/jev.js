// lib/jev.js
//
// Small, isolated wrapper around TypeSafe AI's Jev model
// (https://typesafe.ai, docs: https://docs.typesafe.ai/) for fast, typed
// decisions — here, spam detection + lead scoring on inbound contact-form
// messages, instead of a full free-form LLM call.
//
// Design notes:
//  - Lazily imports `@typesafe-ai/sdk` so nothing else in the app takes a
//    hard dependency on it, and a missing install can't crash unrelated code.
//  - Reads TYPESAFE_API_KEY from the environment only — never hardcoded.
//  - Degrades gracefully: if the package isn't installed, the key isn't
//    set, or the API call fails, callers get back `{ available: false }`
//    with a clear reason instead of a thrown exception.

let cachedClient = null;
let cachedModule = null;

class JevUnavailableError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'JevUnavailableError';
  }
}

async function loadClient() {
  if (cachedClient) return cachedClient;

  if (!process.env.TYPESAFE_API_KEY) {
    throw new JevUnavailableError(
      'TYPESAFE_API_KEY is not set; skipping Jev classification'
    );
  }

  if (!cachedModule) {
    try {
      // Lazy import: only pulled in when a key is actually configured.
      cachedModule = await import('@typesafe-ai/sdk');
    } catch (err) {
      throw new JevUnavailableError(
        '@typesafe-ai/sdk is not installed (run `npm install @typesafe-ai/sdk`); skipping Jev classification',
        { cause: err }
      );
    }
  }

  const { TypeSafeClient } = cachedModule;
  cachedClient = new TypeSafeClient(); // reads TYPESAFE_API_KEY from env
  return cachedClient;
}

/**
 * Classify an inbound contact-form message with Jev: is it spam, how
 * promising a lead is it, and what kind of message is it.
 *
 * Never throws — on any failure (missing package, missing key, network/API
 * error) it resolves to `{ available: false, reason }` so callers can fall
 * back to accepting the message without classification.
 */
async function classifyContactMessage({ name, email, message }) {
  let client;
  try {
    client = await loadClient();
  } catch (err) {
    return { available: false, reason: err.message };
  }

  const { choice, score, noul } = cachedModule;

  try {
    const { answers } = await client.systemOne({
      state: { name, email, message },
      questions: {
        spam: noul(
          'Is this contact-form submission spam, an advertisement, or a scripted/bot message rather than a genuine inquiry?'
        ),
        leadQuality: score(
          'How promising is this message as a potential freelance-work lead?',
          ['Not a lead', 'Weak lead', 'Reasonable lead', 'Strong lead']
        ),
        category: choice('What kind of message is this?', {
          project_inquiry: 'Asking about hiring for, or discussing, a project',
          general_question: 'A general question or comment',
          spam_or_ad: 'Spam, advertising, or an unrelated solicitation',
        }),
      },
    });

    return {
      available: true,
      isSpam: answers.spam.noul >= 0.5,
      spamProbability: answers.spam.noul,
      leadScore: answers.leadQuality.score,
      leadConfidence: answers.leadQuality.confidence,
      category: answers.category.choice,
    };
  } catch (err) {
    return { available: false, reason: `Jev request failed: ${err.message}` };
  }
}

module.exports = { classifyContactMessage, JevUnavailableError };
