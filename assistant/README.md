# Ask the guide — backend

Cloudflare Worker behind the "Ask the guide" chat in the docs
(`components/AskTheGuide.jsx`). It is deployed separately from the docs site and
is not part of the Next.js build.

How it works:

- The widget POSTs `{ messages, page }` to the Worker.
- The Worker only accepts requests from `https://docs.polaris.finance` (and
  `http://localhost:3000` for local testing).
- Each visitor (salted hash of the IP, never the IP itself) can ask
  **30 questions per rolling 24 hours**. Change `LIMIT_PER_DAY` in `src/worker.js`.
- The Worker fetches `https://docs.polaris.finance/llms-full.txt` (refreshed every
  15 minutes), so the guide follows the published docs without redeploying.
- Rules live in `src/rules.js`. Videos the guide may show are listed there and in
  `VIDEOS` in `components/AskTheGuide.jsx`; keep both lists in sync.
- Model: `claude-sonnet-5-5`, with the docs prompt-cached.
- Every question and answer is stored in D1 (`questions` table), without any
  visitor identifier.

## First deploy

Requirements: Node 22, a Cloudflare account, an Anthropic API key for Polaris
(set a monthly spend limit in the Anthropic Console).

```sh
cd assistant
npx wrangler login
npx wrangler d1 create polaris-ask-the-guide       # copy the database_id into wrangler.toml
npx wrangler d1 execute polaris-ask-the-guide --remote --file=schema.sql
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put VISITOR_SALT               # any long random string
npx wrangler deploy                                # prints the Worker URL
```

Then put the Worker URL in `ASK_GUIDE_ENDPOINT` in `app/site-config.mjs` and push.
While `ASK_GUIDE_ENDPOINT` is empty the widget does not render.

## Reading the question log

```sh
npx wrangler d1 execute polaris-ask-the-guide --remote \
  --command "SELECT datetime(ts/1000,'unixepoch') AS time, page, question FROM questions ORDER BY ts DESC LIMIT 50"
```

## Turning it off

Set `ASK_GUIDE_ENDPOINT` to `''` and push (hides the widget), or
`npx wrangler delete` (stops the backend).
