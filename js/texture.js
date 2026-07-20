import { device } from "./setup.js";

export async function loadTexture(url, label) {
    if (!label) label = url;
    const res = await fetch(`./textures/${url}`);
    const blob = await res.blob();
    const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
    const texture = device.createTexture({
        label,
        format: 'rgba8unorm',
        size: [source.width, source.height],
        usage: GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
        { source, flipY: true },
        { texture },
        { width: source.width, height: source.height },
    );
    return texture;
}

