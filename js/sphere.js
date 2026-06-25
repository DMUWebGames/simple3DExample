import { mappedBuffer } from "./tools.js";

function createVertex(theta, phi, r) {
    const x = Math.sin(theta) * Math.cos(phi) * r;
    const y = Math.sin(theta) * Math.sin(phi) * r;
    const z = Math.cos(theta) * r;
    const u = phi / (2 * Math.PI);
    const v = theta / Math.PI;
    return [x, y, z, u, v];
}

export function sphericalVertices(segmentCount, size) {
    const latitudeSegments = Math.max(3, segmentCount);
    const longitudeSegments = Math.max(3, segmentCount);
    const thetaStep = Math.PI / latitudeSegments;
    const phiStep = (2 * Math.PI) / longitudeSegments;

    const coords = Array.from({ length: latitudeSegments * longitudeSegments }, (_, i) => {
        const lonIndex = i % longitudeSegments;
        const latIndex = Math.floor(i / longitudeSegments);

        const phi1 = lonIndex * phiStep;
        const phi2 = phi1 + phiStep;
        const theta1 = latIndex * thetaStep;
        const theta2 = theta1 + thetaStep;

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