import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

export function mappedBuffer(device, data, args) { 
    const buffer = device.createBuffer({
        ...args,
        size: data.byteLength,
        mappedAtCreation: true
    });
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
}

export function randomOrientation() {
    return vec3.create(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
    );
}

export function randomDirection() {
    const dir = vec3.create(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
    );
    vec3.normalize(dir, dir);
    return dir;
}

export function randomInSphere(radius = 100) {
    let p;
    do {
        p = vec3.create(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        );
    } while (vec3.len(p) > 1);   // reject if outside unit sphere

    vec3.mulScalar(p, radius, p);   // scale to desired radius
    return p;
}