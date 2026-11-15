# AI percentage display — 14 November 2026

The organizer inbox and detail view now present the existing detector score as the primary AI likelihood percentage, with a 0–100 scale and Model confidence label. Participant confirmation and receipt lookup use the same component. Local-model binary AI/human classifications are no longer displayed. External-provider classification semantics are preserved.

The saved score is unchanged. It remains uncalibrated model confidence, not a measured probability of authorship or the proportion of AI-written words. Missing, pending, failed, invalid and outdated results have no displayed percentage; a valid zero remains 0.0%. Review status remains independent.

The configured V2 service had stopped. Restarted it on loopback port 4319 under launchd job local.ipc.detector, using its existing settings and checkpoint. No paid APIs or new weights were used.

Verification: syntax checks, four local-model integration tests, git diff --check and the public build passed. Display checks cover 0%, 100%, invalid scores, pending/error states and stale model results. An isolated temporary portal processed a synthetic QA brief through real V2 HTTP inference, stored 99.8%, and returned that same percentage through receipt lookup. Safari showed the 99.8% organizer result, model-confidence label and accessible meter; the entry remained Received. This is functional verification, not a new accuracy benchmark. The working preview serves all updated assets byte-for-byte. Full mobile visual verification was not performed.

Preview: http://localhost:4318/submissions.html?v=20261114-percent
