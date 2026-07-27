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

export class Cube {

    static random({center=vec3.create(0, 0, 0), radius=10000, maxCrossTimeInSeconds=10000, size=1}) {
        const location = randomInSphere(radius);
        vec3.add(location, center, location);
        const speed = (radius * 2) / maxCrossTimeInSeconds * Math.random();   // units per second
        const velocity = randomDirection();
        vec3.mulScalar(velocity, speed, velocity);
        return new Cube(location, randomOrientation(), vec3.create(size,size,size), velocity);        
    }

    static place(z, size) {
        return new Cube (
            vec3.create(0, 0, z),
            randomOrientation(),
            vec3.create(size, size, size),
            vec3.create(0, 0, 0)            
        )
    }


    static center(size) {
        return new Cube (
            vec3.create(0, 0, 0),
            randomOrientation(),
            vec3.create(size, size, size),
            vec3.create(0, 0, 0)            
        )
    }

    constructor(translation, orientation, scale, velocity) {
        this.translation = translation;
        this.orientation = orientation;
        this.angle = Math.random() * 2 * Math.PI;
        this.scale = scale;

        // movement
        this.velocity = velocity;
        this.rotationSpeed = Math.random() * 2 * Math.PI;

    }

    update(elapsed) {
        
        this.translation[0] += this.velocity[0] * elapsed;
        this.translation[1] += this.velocity[1] * elapsed;
        this.translation[2] += this.velocity[2] * elapsed;
        this.angle += this.rotationSpeed * elapsed;
    }

    get matrix() {
        const result = mat4.identity();
        mat4.translate(result, this.translation, result);
        mat4.rotate(result, this.orientation, this.angle, result);
        mat4.scale(result, this.scale, result);
        
        return [...result];
    }
}
