# IPC geographic globe assets

All globe rendering modules and map assets are served locally. No external map or JavaScript import requests are needed at runtime.

## Three.js

`three-0.186.1/three.module.js` and its required sibling `three.core.js` are unmodified official ES module builds from the pinned `three@0.186.1` npm release (Three.js r186). This was npm's stable release when retrieved on October 28, 2026. The npm tarball's SHA-512 integrity was verified before extracting these three allowlisted package files. `three-0.186.1/SOURCE.json` records source, integrity and individual SHA-256 hashes. The package's MIT license is retained at `three-0.186.1/LICENSE.txt`.

Import the local `three.module.js` directly. Its only local dependency is the adjacent `three.core.js`; browser and Node imports were checked. There are no add-ons, package install step, or new application dependencies. This release no longer supplies minified module builds; these vendor files deliberately remain unchanged, and normal HTTP compression applies on the host.

Official reference: https://threejs.org/manual/pages/installation.html

Color handling: https://threejs.org/manual/pages/color-management.html. Use `texture.colorSpace = THREE.SRGBColorSpace` for the colored earth map, with the renderer output in sRGB. The landmask is data and should retain `THREE.NoColorSpace`.

## Geographic data and textures

- `land-110m.json`: `world-atlas@2.0.2`, derived from Natural Earth 1:110 million land geometry. Source: https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json. Natural Earth data is public domain: https://www.naturalearthdata.com/about/terms-of-use/
- `textures/earth-policy.png`: 2048×1024 equirectangular map rendered from that exact topology, using warm cream land, deep forest ocean, fine coastlines and a subtle 10° geographic grid. Its source vector rendering is retained at `textures/earth-policy.svg` and is also suitable as a static fallback.
- `textures/earth-landmask.png`: 2048×1024 data map, white land and black ocean, from the identical geographic paths. Suitable for shader land coloring or bump/emissive masks; it contains no baked lighting.

Both PNGs were rasterized from locally generated SVG geometry using the browser's native image/canvas renderer. They use no third-party satellite imagery, paid service or generated photograph. The derived map assets are dedicated to the public domain, consistent with the source geography.

Image coordinates: `x = (longitude + 180) / 360`, `y = (90 - latitude) / 180`. North is up; the antimeridian is at both horizontal edges; Greenwich crosses the image center. Default Three.js `SphereGeometry` UVs and the default `Texture.flipY=true` map a geographic point to `[cos(lat)*cos(lon), sin(lat), -cos(lat)*sin(lon)]` on a unit sphere. If the scene uses Greenwich on +Z instead of +X, rotate the textured sphere by `-Math.PI/2` about Y to align it with `[cos(lat)*sin(lon), sin(lat), cos(lat)*cos(lon)]` marker coordinates.

The land geometry is illustrative at this scale. It is not a detailed jurisdiction-boundary dataset. Policy-location anchors do not represent IPC chapter locations or participant activity.

## Retained map tooling

`d3-geo-3.1.1.js` is the previously pinned `d3-geo@3.1.1` ESM bundle, including its required `d3-array` helpers. It was used to project the TopoJSON geography into the equirectangular source paths. Source: https://esm.sh/d3-geo@3.1.1/es2022/d3-geo.bundle.mjs. D3-geo and d3-array ISC licenses remain in this directory. API documentation: https://d3js.org/d3-geo
