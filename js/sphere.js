import { mappedBuffer } from "./tools.js";

function createVertex(theta, phi, r) {
    const x = Math.sin(theta) * Math.cos(phi) * r;
    const y = Math.sin(theta) * Math.sin(phi) * r;
    const z = Math.cos(theta) * r;
    const u = Math.atan2(x, z) / 2 * Math.PI;
    const v = Math.asin(y) / Math.PI
    return [x, y, z, u, v];
}

export function sphericalVertices(segmentCount, size) {
    const segmentAngle = 2 * Math.PI / segmentCount;
    const coords = Array.from({ length: segmentCount ** 2 }, (_, i) => {

        const x = (i % segmentCount);
        const y = Math.floor(i / segmentCount);

        const phi1 = segmentAngle * x;
        const theta1 = segmentAngle * y;
        const phi2 = phi1 + segmentAngle;
        const theta2 = theta1 + segmentAngle;        

        return [
            createVertex(theta1, phi1, size),
            createVertex(theta1, phi2, size),
            createVertex(theta2, phi1, size),
            createVertex(theta2, phi1, size),
            createVertex(theta1, phi2, size),
            createVertex(theta2, phi2, size),
        ];
    });
    return new Float32Array(coords.flat(2));
}

export function sphericalVertexBuffer(device, segments, size) {
    const vertices = sphericalVertices(segments, size);
    const vertexBuffer = mappedBuffer(device, vertices, {
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,        
    });
    return [vertexBuffer, vertices.length];
}