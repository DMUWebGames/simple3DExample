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
