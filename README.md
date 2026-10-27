# International-Policy-Conference
The International Policy Conference, or IPC, was established in 2026 by a group of Harvard students and graduates in hopes of providing exposure to global perspectives to future leaders early in their education. We strive to encourage students to take some of the problems they might have seen in their communities and ask not just “what is the problem” but “why does it persist, how can we solve it, and who can we work with to change it.” IPC challenges students by delving deep into fields they might never have encountered in school, such as economics, international law, public health, environmental science, and more. In the process of developing research, synthesis, public speaking, negotiation, and persuasive communication skills, students will be given the unique opportunity to get their policy recommendations to the legislators whose vote influences real-world outcomes in their communities. Official website: https://internationalpolicyconference.org/

## Written submission portal

`submit.html` accepts a policy brief and participant/team details, records academic-integrity certification and processing consent, and provides a private receipt. `submissions.html` lets organizers download original files, view screening results, record notes, and update review status.

Supported uploads are PDF, DOCX, and UTF-8 TXT, up to 4 MB. PDFs are limited to 80 pages for processing. Scanned/image-only PDFs are saved for manual review when text cannot be extracted. Encrypted or damaged documents are rejected with a useful error. The current portal handles written briefs; video uploads, plagiarism comparison, judging rubrics, participant accounts, and email notifications are outside this implementation.

### Run locally

Use Node 24:

```sh
npm ci --ignore-scripts
npm run setup
npm run dev
```

Open `http://localhost:4318/submit.html`. The generated `.env.local` contains the organizer password used at `submissions.html`; it is ignored by Git and must stay private. Local submissions and original files persist in `.local/ipc/submissions.sqlite`, with private filesystem permissions. Local mode refuses to run on Vercel or with `NODE_ENV=production`.

The local preview uses real persistent storage. AI scanning is disabled until a real provider key and explicit daily allowance are configured; pending screening always displays a blank score. No simulated scores or fallback heuristics are used in the application.

### Deploy the backend

The website needs a Node-capable host such as Vercel for `/api/*`. GitHub Pages can publish the site, but cannot run the submission API. On a static-only host the submission form stays closed when its API is unavailable.

1. Create a **dedicated IPC Supabase project** and run `database/schema.sql` in its SQL editor. This creates a private `ipc-briefs` bucket, restricted submission tables, and atomic server-only functions for review updates, scan claims, and rate limits. Do not use another project's database or public bucket.
2. Configure `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the host's server environment. A legacy `SUPABASE_SERVICE_ROLE_KEY` is also accepted. Never put these keys in browser scripts or public environment variables.
3. Set `IPC_LOCAL_STORAGE=false`, `IPC_ORIGIN` to the exact HTTPS website origin with no trailing slash, and unique random `IPC_ADMIN_PASSWORD` (at least 24 characters) and `IPC_SESSION_SECRET` (at least 32 characters). Keep `IPC_ACCEPT_SUBMISSIONS=false` until the deployment is checked; change it to `true` when IPC is ready to receive briefs.
4. Deploy this repository using its `vercel.json`. The build publishes only allowlisted assets under `public/`; server source, database files, and settings are excluded. API responses are never cached.
5. Check receipt lookup, organizer sign-in, private downloads, and persistence after a fresh deployment before opening submissions. Access without an organizer session must return 401. Verify anonymous Supabase credentials cannot read either table or storage files.

No live IPC database or detector account is provisioned by these files. Production setup requires the relevant account owner and credentials. The SQL and REST adapter have local/contract tests, but must also be verified against the dedicated live project.

### AI screening

The portal supports [GPTZero](https://docs.gptzero.me/api-reference/) and [Sapling](https://sapling.ai/docs/api/detector/). Check the selected provider's pricing and privacy terms before enabling it. Only the extracted brief text is sent to the provider; contact details are excluded from the API payload. Names or personal details written inside the brief remain part of that text.

To enable a configured provider, set all three:

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

Tests cover real SQLite persistence, original-file retrieval, real PDF/DOCX extraction, malformed and forged archives, receipt isolation, consent checks, organizer sessions, cross-origin protection, provider request formats, absent/invalid detector results, quota limits, and concurrent scans. Provider transports in automated tests are controlled fixtures; live detector scoring requires a real key and is not claimed by a passing test.

The current organizer inbox loads the most recent 500 entries. Uploads are limited to 10 attempts per hour per network address and 200 per day overall; organizer sign-in is limited to 8 attempts per 15 minutes. Adjust these limits deliberately for a large event. Shared organizer access uses an 8-hour HttpOnly session; use a unique strong password and rotate it and the session secret when organizer access changes. Establish IPC's retention/deletion process before collecting live entries; no automatic deletion policy is assumed.
