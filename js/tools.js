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

export function randomOrientation(tm) {
    return vec3.create(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
    );
}

export function randomTranslation() {    
    return mat4.translation([
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        0.25,        
    ]);
}