import { vec3, mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';
import { mappedBuffer, randomDirection, randomInSphere, randomOrientation } from "./tools.js";

export const cubeVertices = new Float32Array([
  // Each vertex: position (x, y, z), uv (u, v), normal (nx, ny, nz)
  // +X face
  0.5, -0.5, -0.5,   1, 0,   1, 0, 0,
  0.5,  0.5, -0.5,   1, 1,   1, 0, 0,
  0.5,  0.5,  0.5,   0, 1,   1, 0, 0,

  0.5, -0.5, -0.5,   1, 0,   1, 0, 0,
  0.5,  0.5,  0.5,   0, 1,   1, 0, 0,
  0.5, -0.5,  0.5,   0, 0,   1, 0, 0,

  // -X face
 -0.5, -0.5,  0.5,   1, 0,  -1, 0, 0,
 -0.5,  0.5,  0.5,   1, 1,  -1, 0, 0,
 -0.5,  0.5, -0.5,   0, 1,  -1, 0, 0,

 -0.5, -0.5,  0.5,   1, 0,  -1, 0, 0,
 -0.5,  0.5, -0.5,   0, 1,  -1, 0, 0,
 -0.5, -0.5, -0.5,   0, 0,  -1, 0, 0,

  // +Y face
 -0.5,  0.5, -0.5,   0, 0,   0, 1, 0,
 -0.5,  0.5,  0.5,   0, 1,   0, 1, 0,
  0.5,  0.5,  0.5,   1, 1,   0, 1, 0,

 -0.5,  0.5, -0.5,   0, 0,   0, 1, 0,
  0.5,  0.5,  0.5,   1, 1,   0, 1, 0,
  0.5,  0.5, -0.5,   1, 0,   0, 1, 0,

  // -Y face
 -0.5, -0.5,  0.5,   0, 0,   0,-1, 0,
 -0.5, -0.5, -0.5,   0, 1,   0,-1, 0,
  0.5, -0.5, -0.5,   1, 1,   0,-1, 0,

 -0.5, -0.5,  0.5,   0, 0,   0,-1, 0,
  0.5, -0.5, -0.5,   1, 1,   0,-1, 0,
  0.5, -0.5,  0.5,   1, 0,   0,-1, 0,

  // +Z face
 -0.5, -0.5,  0.5,   0, 0,   0, 0, 1,
  0.5, -0.5,  0.5,   1, 0,   0, 0, 1,
  0.5,  0.5,  0.5,   1, 1,   0, 0, 1,

 -0.5, -0.5,  0.5,   0, 0,   0, 0, 1,
  0.5,  0.5,  0.5,   1, 1,   0, 0, 1,
 -0.5,  0.5,  0.5,   0, 1,   0, 0, 1,

  // -Z face
  0.5, -0.5, -0.5,   0, 0,   0, 0,-1,
 -0.5, -0.5, -0.5,   1, 0,   0, 0,-1,
 -0.5,  0.5, -0.5,   1, 1,   0, 0,-1,

  0.5, -0.5, -0.5,   0, 0,   0, 0,-1,
 -0.5,  0.5, -0.5,   1, 1,   0, 0,-1,
  0.5,  0.5, -0.5,   1, 0,   0, 0,-1,
]);

export function cubeVertexBuffer(device) {
    const vertexBuffer = mappedBuffer(device, cubeVertices, {
        label: "cube vertices",
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    return [vertexBuffer, cubeVertices.length / 8];
}
