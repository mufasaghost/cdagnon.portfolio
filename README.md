# charlesmetaverse

## Contact form API (example)

The site itself is static (`index.html` / `script.js` / `style.css`), but
`api/contact.js` adds an example serverless route (Vercel-style Node
function) that the contact form posts to. It uses
[Jev](https://typesafe.ai) via the isolated wrapper in `lib/jev.js` to
classify each inbound message for spam and lead quality before it would be
forwarded on.

Setup:

```sh
npm install
cp .env.example .env   # then set TYPESAFE_API_KEY
```

If `TYPESAFE_API_KEY` isn't set (or `@typesafe-ai/sdk` isn't installed),
the form still works — classification is just skipped, never a crash.
