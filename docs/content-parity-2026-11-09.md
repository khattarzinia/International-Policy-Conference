# Official IPC content parity — 9 November 2026

Source: https://internationalpolicyconference.org/ (fresh HTTP snapshot, 9 November 2026).
Working preview: http://localhost:4318/ . The separate September mock at
https://ipc-globe-mockup.vercel.app/ was not changed or redeployed.

The working homepage retains its design, Three.js globe, motion and local
submission portal. Restored the official application announcement, full mission
wording, Spring 2027 Cambridge finals line, chapter application wording,
past-proposals classification, student-leadership label, Contact navigation and
page title. Existing conference rules and content were checked against the source.

## Verification

- 195 source content checks passed: paragraphs, requirements, rubric rows,
  categories, regional examples, stages, awards, document metadata, timeline,
  leadership names and roles.
- All 12 unique source link destinations are retained; all local fragment
  targets and referenced local images, stylesheets and font preloads exist.
- Both sample PDFs are byte-identical to the official downloads and to the
  files served by the local preview.
- The page title, meta tags and JSON-LD match the official page. Editorial
  display headings and navigation for the extra local submission portal remain.
- The running server returns the edited source. JavaScript syntax and public
  build checks pass.
- Browser visual QA was unavailable because the browser access host was
  unavailable. This records content parity, not visual or interaction parity.

## Published inconsistencies preserved

The official hero says Spring 2027 finals in Cambridge, but its timeline says
Summer 2027 Boston finals. Its registration timing also differs between the
FAQ and timeline, and it still displays the August 21 chapter priority date
and September 30 resources notice. These are reproduced as published, not
silently resolved or treated as newly confirmed dates. The official page title
says finals at Harvard; no additional affiliation or endorsement was added.

## Source evidence

Official HTML SHA-256:
`da238893872940c4c5610887a2f45964899a08852b4fac936353a3a7ce0ede4b`

Healthcare PDF SHA-256:
`b81068ed744480bee54bb96ed33f7228cfd96c334e7423b9f19b790eb98923c0`

Technology PDF SHA-256:
`a7cc37c4f289ee39a12e13354a16b092748cb291df4975c2c653d9f619c7242c`

The full local comparison record and fetched HTML are saved outside the repository
in `/Users/johnny/Documents/Codex/2026-11-09/ipc-content-parity/`.
