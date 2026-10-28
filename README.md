# International-Policy-Conference
The International Policy Conference, or IPC, was established in 2026 by a group of Harvard students and graduates in hopes of providing exposure to global perspectives to future leaders early in their education. We strive to encourage students to take some of the problems they might have seen in their communities and ask not just “what is the problem” but “why does it persist, how can we solve it, and who can we work with to change it.” IPC challenges students by delving deep into fields they might never have encountered in school, such as economics, international law, public health, environmental science, and more. In the process of developing research, synthesis, public speaking, negotiation, and persuasive communication skills, students will be given the unique opportunity to get their policy recommendations to the legislators whose vote influences real-world outcomes in their communities. Official website: https://internationalpolicyconference.org/

## Written submission portal

`submit.html` accepts a policy brief and participant/team details, records academic-integrity certification and processing consent, and provides a private receipt. `submissions.html` gives organizers two independent checks: shared wording across submissions, and AI likelihood. Organizers can inspect matching passages, download originals, record notes, and update review status.

Supported uploads are PDF, DOCX, and UTF-8 TXT, up to 4 MB. PDFs are limited to 80 pages for processing. Scanned/image-only PDFs are saved for manual review when text cannot be extracted. Encrypted or damaged documents are rejected with a useful error. The current portal handles written briefs; video uploads, web-wide plagiarism comparison, judging rubrics, participant accounts, and email notifications are outside this implementation.

The homepage uses locally hosted Archivo and IBM Plex fonts with an editorial cream, forest and coral design. A locally hosted Three.js scene fills the policy-example section with lit Natural Earth geography, raised routes and selectable country markers. Country selection turns the globe, switches the policy story and highlights its corresponding category; six category links enter the same scene. Geography stays north-up during selection, while dragging and arrow keys allow free exploration. Three.js loads when the scene approaches the viewport. Animation pauses offscreen and respects reduced-motion preferences; policy controls still work when WebGL or textures are unavailable. Font, Three.js and geography licenses are included beside the assets.

### Run locally

Use Node 24:

```sh
npm ci --ignore-scripts
npm run setup
npm run dev
```

Open `http://localhost:4318/submit.html`. The generated `.env.local` contains the organizer password used at `submissions.html`; it is ignored by Git and must stay private. Local submissions and original files persist in `.local/ipc/submissions.sqlite`, with private filesystem permissions. Local mode refuses to run on Vercel or with `NODE_ENV=production`.

The local preview uses real persistent storage. Cross-submission comparison runs after a brief is saved. AI scanning is disabled until a trained model service (or an explicitly selected external provider) and daily allowance are configured; pending screening always displays a blank score. No simulated scores or heuristic fallback detector are used in the application.

### Cross-submission comparison

`lib/similarity.js` compares normalized wording against other saved IPC briefs. It finds substantive shared phrases of at least 10 words, excludes standard headings, recognizable citation markers, and late reference sections, and reports the share of eligible target-body words covered by matches. Overlapping matches from multiple sources count only once. Similarity is directional: the percentage describes the selected brief's body, so a short brief copied into a longer one can produce different percentages in each direction.

The organizer sees each matching entry and side-by-side excerpts with original character offsets. Long excerpts are shortened for display; the complete matching ranges still contribute to the score. A reference section is excluded only after a conservative late standalone heading. Quoted prose can legitimately match, so reviewers must inspect context. This is a wording comparison within IPC's collection, not an internet search, semantic paraphrase detector, or plagiarism verdict.

Comparison results are available only through the signed organizer session at `POST /api/admin/compare`. Public receipts never include another entrant's title or passages. The stored summary includes the time and number of eligible entries compared. When the submission collection changes, the inbox marks old summaries **Needs refresh** and withholds their stale percentage; use **Compare submissions** to refresh. The complete comparison corpus is paginated independently of the organizer inbox's display limit. Incoming briefs are not used for model training by default.

### Deploy the backend

The website needs a Node-capable host such as Vercel for `/api/*`. GitHub Pages can publish the site, but cannot run the submission API. On a static-only host the submission form stays closed when its API is unavailable.

1. Create a **dedicated IPC Supabase project** and run `database/schema.sql` in its SQL editor. This creates a private `ipc-briefs` bucket, restricted submission tables, and atomic server-only functions for review updates, scan claims, and rate limits. Do not use another project's database or public bucket.
2. Configure `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the host's server environment. A legacy `SUPABASE_SERVICE_ROLE_KEY` is also accepted. Never put these keys in browser scripts or public environment variables.
3. Set `IPC_LOCAL_STORAGE=false`, `IPC_ORIGIN` to the exact HTTPS website origin with no trailing slash, and unique random `IPC_ADMIN_PASSWORD` (at least 24 characters) and `IPC_SESSION_SECRET` (at least 32 characters). Keep `IPC_ACCEPT_SUBMISSIONS=false` until the deployment is checked; change it to `true` when IPC is ready to receive briefs.
4. Deploy this repository using its `vercel.json`. The build publishes only allowlisted assets under `public/`; server source, database files, and settings are excluded. API responses are never cached.
5. Check receipt lookup, organizer sign-in, private downloads, and persistence after a fresh deployment before opening submissions. Access without an organizer session must return 401. Verify anonymous Supabase credentials cannot read either table or storage files.

The setup files do not provision accounts automatically. The development IPC database has separately been created in JohnnyPei's Supabase organization; its schema, private bucket, server-only access grants, update functions, scan claims, and rate limiting were verified against live Postgres. Hosting still needs the project's server secret and IPC's hosting access. Verify the complete hosted file-upload and private-download flow before opening real entries.

### AI screening

The default integration uses IPC's own experimental text model, served by `ml/server.py`. See [the model workflow](ml/README.md) for training, evaluation, provenance, and setup. The model must be a completed encoder fine-tune before the service will load it. Only public labeled training data is used by the prototype; it is not claimed to be validated on IPC policy briefs.

Configure the local service in `.env.local`, then run it separately from the website:

```sh
IPC_AI_PROVIDER=local
IPC_AI_ENDPOINT=http://127.0.0.1:4319
IPC_MODEL_DIR=.local/ml-model
IPC_MODEL_VERSION=the-exact-version-in-your-checkpoint-metadata
IPC_MODEL_TOKEN=your-unique-random-service-token
IPC_ENABLE_AI_SCANS=true
IPC_MAX_SCANS_PER_DAY=100
```

```sh
npm run model:serve
```

The token must contain at least 24 characters; `npm run setup` generates it for new installations. Keep the model service running alongside `npm run dev`. A production deployment must use an authenticated HTTPS model endpoint. HTTP loopback is allowed only for local development, and the model service itself binds to loopback. Python dependencies, datasets and model weights are kept out of the Vercel website bundle and all public files.

The own-model score is **experimental model confidence**, not a calibrated authorship probability or percentage of AI-written words. The response records checkpoint version and analyzed text coverage. Long documents are sampled across windows if they exceed the model's bounded workload; partial coverage is shown explicitly. A missing model or service outage produces no score. No entry is automatically rejected by either check.

The October 28 raw v2 checkpoint was fine-tuned on 22,022 balanced public examples, up from 3,600. On the unchanged 800-document held-out-generator evaluation, accuracy improved from 94% to 96% and human false positives fell from 12/400 to 7/400. These are public-corpus measurements, not measured accuracy on IPC policy briefs. See `ml/README.md` for frozen-split checks and the full comparison.

Set `IPC_MODEL_VERSION` to the checkpoint's exact metadata version in both local and hosted environments. The backend checks that the model service returns that version. After a version change, older scores are marked for reanalysis; an organizer can explicitly run screening again. Historical scores are not silently rewritten, and simultaneous retry requests share one persisted scan claim. Leaving this setting empty retains completed-result caching without version-aware reanalysis.

Optional external integrations remain available for [GPTZero](https://docs.gptzero.me/api-reference/) and [Sapling](https://sapling.ai/docs/api/detector/). Check the selected provider's pricing and privacy terms before enabling it. Only the extracted brief text is sent to the provider; contact details are excluded from the API payload. Names or personal details written inside the brief remain part of that text.

To explicitly select an external provider:

```sh
IPC_AI_PROVIDER=gptzero
GPTZERO_API_KEY=your-server-side-key
IPC_ENABLE_AI_SCANS=true
IPC_MAX_SCANS_PER_DAY=10
```

For Sapling, use `IPC_AI_PROVIDER=sapling` and `SAPLING_API_KEY`. The default daily allowance is 0 and scanning is disabled. The allowance limits attempts across app instances, including unsuccessful requests; it is an application control, not a provider billing cap. Completed scans are reused, and concurrent calls share a persisted claim. An organizer can retry failed or quota-deferred scans. Do not enable scanning against a billed account without an approved budget.

GPTZero reports the probability of the AI-only class alongside separate mixed and human probabilities, its classification, confidence band, and model version. Sapling reports its document AI probability. These are estimates; **they are not the percentage of words written by AI, a plagiarism match rate, or proof of misconduct**. Entries are never automatically rejected. The existing website’s 15% plagiarism-review rule is separate and is not applied to AI probabilities.

The original brief is saved before a detector is called. Missing keys, insufficient readable text, timeouts, invalid responses, and exhausted allowances leave the submission available for organizer review, with no fabricated score. Text below 300 or above 150,000 characters goes to manual screening rather than being silently truncated. New provider choices should be reflected in participant disclosures before screening previously received documents.

### Verification and operating limits

```sh
npm run check
npm test
npm run build
```

Tests cover real SQLite persistence, original-file retrieval, real PDF/DOCX extraction, malformed and forged archives, receipt isolation, consent checks, organizer sessions, cross-origin protection, substantive phrase matches, excluded references, multi-source coverage, comparisons beyond the inbox limit, private comparison evidence, model-service provenance and coverage checks, absent/invalid detector results, quota limits, and concurrent scans. Provider transports in automated tests are controlled fixtures; real model inference is separately verified against the trained checkpoint.

The current organizer inbox loads the most recent 500 entries. Uploads are limited to 10 attempts per hour per network address and 200 per day overall; organizer sign-in is limited to 8 attempts per 15 minutes. Adjust these limits deliberately for a large event. Shared organizer access uses an 8-hour HttpOnly session; use a unique strong password and rotate it and the session secret when organizer access changes. Establish IPC's retention/deletion process before collecting live entries; no automatic deletion policy is assumed.
