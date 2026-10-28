# IPC geographic globe assets

The globe uses actual Natural Earth land geometry in a Canvas orthographic projection. No map requests or JavaScript imports leave the website at runtime.

- `land-110m.json`: `world-atlas@2.0.2`, derived from Natural Earth 1:110 million land geometry. Downloaded from `https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json`. Natural Earth data is public domain: https://www.naturalearthdata.com/about/terms-of-use/
- `d3-geo-3.1.1.js`: pinned `d3-geo@3.1.1` ESM bundle, including only its required `d3-array` helpers. Source URL: `https://esm.sh/d3-geo@3.1.1/es2022/d3-geo.bundle.mjs`. D3-geo and d3-array ISC licenses are retained in this directory. API documentation: https://d3js.org/d3-geo

The small TopoJSON-to-GeoJSON decoder in `globe.js` preserves the original geographic coordinates and polygon rings. The geographic anchor for the European Union is Brussels; other anchors approximate each example's geographic center. Anchors illustrate policy perspectives and do not represent IPC chapters, participant locations, or conference activity.

Controls: drag to rotate; use arrow keys on the globe to rotate/tilt; Home or Reset view restores the composition. Country buttons center the selected lens and dispatch `ipc:country-select` on `document` with `{id,country}`. The globe accepts `ipc:country-focus` with `{id}` from adjacent policy-example controls. Motion pauses while offscreen, when the page is hidden, on focus, and by explicit pause. Reduced-motion preferences disable automatic rotation and animated transitions. Canvas pixel ratio is capped at2 and automatic rendering is capped near30fps.
