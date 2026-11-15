// A fixed pool of short-lived Three.js strokes. Every launch starts at its node.
export function createNodeTrails(T, world, nodes, random = Math.random) {
  const colors = [0xff805e, 0xd9e8b4, 0x8ccfbd];
  const routes = [];
  const vertexShader = 'varying float distanceAlong; void main(){distanceAlong=uv.x;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
  const fragmentShader = `
    uniform vec3 ink;
    uniform float head;
    uniform float tailLength;
    uniform float strength;
    varying float distanceAlong;
    void main(){
      float u=distanceAlong;
      float front=1.0-smoothstep(head-.018,head+.003,u);
      float tail=smoothstep(head-tailLength,head-tailLength*.28,u);
      float dissolve=1.0-smoothstep(.68,1.0,u);
      float alpha=front*tail*dissolve*strength;
      if(alpha<.002) discard;
      gl_FragColor=vec4(ink,alpha);
      #include <colorspace_fragment>
    }`;

  function launch(route, time) {
    // Move at least 55 degrees from the preceding direction on each relaunch.
    route.bearing = (route.bearing + .96 + random() * (Math.PI * 2 - 1.92)) % (Math.PI * 2);
    const normal = route.node.position.clone().normalize();
    const reference = Math.abs(normal.y) > .95 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 1, 0);
    const east = new T.Vector3().crossVectors(reference, normal).normalize();
    const north = new T.Vector3().crossVectors(normal, east).normalize();
    const tangent = east.multiplyScalar(Math.cos(route.bearing)).addScaledVector(north, Math.sin(route.bearing));
    const sweep = .85 + random() * .75, lift = .45 + random() * .45;
    const twist = (random() - .5) * .55;
    const sideways = new T.Vector3().crossVectors(normal, tangent).normalize();
    const radius = route.node.position.length();
    const points = Array.from({ length: 49 }, (_, i) => {
      const t = i / 48, angle = sweep * t;
      return normal.clone().multiplyScalar(Math.cos(angle)).addScaledVector(tangent, Math.sin(angle))
        .addScaledVector(sideways, twist * t * t).normalize().multiplyScalar(radius + lift * t);
    });
    // Preserve the precise source even if normalization introduced round-off.
    points[0].copy(route.node.position);
    const curve = new T.CatmullRomCurve3(points);
    const geometry = new T.TubeGeometry(curve, 72, route.strand ? .0035 : .0055, 5, false);
    const vertices = geometry.attributes.position;
    const vertex = new T.Vector3();
    for (let i = 0; i < vertices.count; i++) {
      const t = geometry.attributes.uv.getX(i), center = curve.getPointAt(t);
      vertex.fromBufferAttribute(vertices, i).sub(center).multiplyScalar(1 - .65 * t).add(center);
      vertices.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeBoundingSphere();
    route.mesh.geometry.dispose();
    route.mesh.geometry = geometry;
    route.startedAt = time;
    route.duration = 2.8 + random() * 1.8;
    route.gap = .3 + random() * 1.1;
    route.material.uniforms.tailLength.value = .2 + random() * .12;
    route.material.uniforms.ink.value.setHex(colors[Math.floor(random() * colors.length)]);
  }

  nodes.forEach((node, index) => {
    for (let strand = 0; strand < 2; strand++) {
      const material = new T.ShaderMaterial({
        uniforms: { ink: { value: new T.Color(colors[index % colors.length]) }, head: { value: 0 },
          tailLength: { value: .27 }, strength: { value: .8 } },
        vertexShader, fragmentShader, transparent: true, depthWrite: false, side: T.DoubleSide,
      });
      const mesh = new T.Mesh(new T.BufferGeometry(), material);
      world.add(mesh);
      const route = { node, strand, mesh, material, bearing: random() * Math.PI * 2 };
      launch(route, -(index * .41 + strand * 1.7));
      routes.push(route);
    }
  });

  return {
    update(time, selected) {
      for (const route of routes) {
        if (time >= route.startedAt + route.duration + route.gap) launch(route, time);
        const progress = Math.max(0, (time - route.startedAt) / route.duration);
        // The head advances beyond the curve so the tail fully disappears before reuse.
        route.material.uniforms.head.value = progress * 1.36;
        route.material.uniforms.strength.value = route.node.id === selected ? 1 : route.strand ? .62 : .82;
        route.mesh.visible = progress < 1;
      }
    },
  };
}
