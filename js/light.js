export class Light {
    constructor(dir=[0.5, -1.0, -1.0, 0], colour=[1, 1, 1, 0]) {
        this.dir = dir;
        this.colour = colour;
    }

    set dir(newDir) {
        const len = Math.hypot(...newDir);
        this._dir = [newDir[0]/len, newDir[1]/len, newDir[2]/len, 0];
    }

    get dir() {
        return this._dir;
    }

    buffer(device) {
        const buffer = device.createBuffer({
            size: 32, // 2 vec4s
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });        
        device.queue.writeBuffer(buffer, 0, this.data);
        return buffer;
    }

    get data() {
        const len = Math.hypot(...this.dir);
        return new Float32Array([
            ...this.dir,    // direction
            ...this.colour  // color
        ])
    }
}