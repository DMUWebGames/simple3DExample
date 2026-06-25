import { vec3, mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';
import { mappedBuffer, randomOrientation } from "./tools.js";

export const cubeVertices = new Float32Array([
  // +X face
  0.5, -0.5, -0.5,   1, 0, 0,
  0.5,  0.5, -0.5,   1, 0, 0,
  0.5,  0.5,  0.5,   1, 0, 0,

  0.5, -0.5, -0.5,   1, 0, 0,
  0.5,  0.5,  0.5,   1, 0, 0,
  0.5, -0.5,  0.5,   1, 0, 0,

  // -X face
 -0.5, -0.5,  0.5,  -1, 0, 0,
 -0.5,  0.5,  0.5,  -1, 0, 0,
 -0.5,  0.5, -0.5,  -1, 0, 0,

 -0.5, -0.5,  0.5,  -1, 0, 0,
 -0.5,  0.5, -0.5,  -1, 0, 0,
 -0.5, -0.5, -0.5,  -1, 0, 0,

  // +Y face
 -0.5,  0.5, -0.5,   0, 1, 0,
 -0.5,  0.5,  0.5,   0, 1, 0,
  0.5,  0.5,  0.5,   0, 1, 0,

 -0.5,  0.5, -0.5,   0, 1, 0,
  0.5,  0.5,  0.5,   0, 1, 0,
  0.5,  0.5, -0.5,   0, 1, 0,

  // -Y face
 -0.5, -0.5,  0.5,   0,-1, 0,
 -0.5, -0.5, -0.5,   0,-1, 0,
  0.5, -0.5, -0.5,   0,-1, 0,

 -0.5, -0.5,  0.5,   0,-1, 0,
  0.5, -0.5, -0.5,   0,-1, 0,
  0.5, -0.5,  0.5,   0,-1, 0,

  // +Z face
 -0.5, -0.5,  0.5,   0, 0, 1,
  0.5, -0.5,  0.5,   0, 0, 1,
  0.5,  0.5,  0.5,   0, 0, 1,

 -0.5, -0.5,  0.5,   0, 0, 1,
  0.5,  0.5,  0.5,   0, 0, 1,
 -0.5,  0.5,  0.5,   0, 0, 1,

  // -Z face
  0.5, -0.5, -0.5,   0, 0,-1,
 -0.5, -0.5, -0.5,   0, 0,-1,
 -0.5,  0.5, -0.5,   0, 0,-1,

  0.5, -0.5, -0.5,   0, 0,-1,
 -0.5,  0.5, -0.5,   0, 0,-1,
  0.5,  0.5, -0.5,   0, 0,-1,
]);

export function cubeVertexBuffer(device) {
    const vertexBuffer = mappedBuffer(device, cubeVertices, {
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,        
    });
    return [vertexBuffer, cubeVertices.length / 6];
}

export class Cube {

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
    }

    get matrix() {
        const result = mat4.identity();
        mat4.translate(result, this.translation, result);
        console.log(this.orientation, this.angle);
        mat4.rotate(result, this.orientation, this.angle, result);
        mat4.scale(result, this.scale, result);
        
        return [...result];
    }
}
