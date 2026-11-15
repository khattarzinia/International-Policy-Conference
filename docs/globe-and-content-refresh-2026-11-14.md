# Globe and content refresh — 14 November 2026

Preview: http://localhost:4318/?v=20261114-atlas#examples

## Content comparison

The official repository's current default-branch `index.html` was fetched through
the GitHub connector. Blob SHA: `4739e662e073b7295ed4804620e2ee92a788bda6`.
Its content matches the 9 November official hosted snapshot exactly, ignoring
the final newline. No new conference information was available to incorporate.

All 195 previously recorded content checks still pass against the updated local
homepage, all 12 unique original link destinations remain, and both local sample
PDFs retain their previously verified hashes. Existing published date conflicts
remain as documented in `content-parity-2026-11-09.md`.

Direct fresh HTTPS downloads of the official domain failed certificate
verification in both Python and curl. TLS verification was not bypassed. The
web tool's accessible official-site snapshot and the freshly fetched GitHub
source agree; this is not a claim that a new live-host byte comparison succeeded.

## Visual changes

- Reused the locally served, pinned Three.js r186 engine.
- Replaced shaded/bumped earth textures and atmospheric lighting with a flat
  forest sphere, fine graticule, paper-colored instanced continent tiles and an
  ink outline. Existing landmask geometry supplies geographic placement.
- Twelve coral, mint and cream trails leave separate geographic origins,
  taper in width and fade to zero opacity at their free ends. No Cambridge hub.
- Continuous local-axis rotation at 0.105 radians/second, approximately one
  revolution per minute. Dragging, country selection and keyboard focus retain
  their temporary control; pause and reduced-motion preferences stop animation.
- Replaced page-wide converging routes/docking dots with separate fading margin
  strokes. Preserved section-progress effects and page motion preferences.
- Added cache versions to the four changed JS/CSS URLs.

## Verification

- `npm run check`, `git diff --check`, `npm run build` pass.
- All changed files, the Three.js modules and the landmask return HTTP 200 from
  the persistent preview and match the on-disk source bytes.
- Native Safari displayed the new WebGL globe at narrow and desktop widths.
  Country selection changed the story and camera view; pause/resume labels and
  state changed correctly. Screenshots show the new continents and fading trails.
- Browser-host automation was unavailable. Native Safari worked but intermittent
  native capture failures limited additional motion inspection; a complete timed
  revolution and OS reduced-motion emulation were not browser-verified.

No detector code, model, production deployment or conference copy was changed.
The preview remains managed by the existing `local.ipc.website-preview` job.
