import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

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
    tm = mat4.rotateX(tm, 4 * Math.PI * (Math.random() - 0.5));
    tm = mat4.rotateY(tm, 4 * Math.PI * (Math.random() - 0.5));
    return mat4.rotateZ(tm, 4 * Math.PI * (Math.random() - 0.5));
}

export function randomTranslation() {    
    return mat4.translation([
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        0.25,        
    ]);
}