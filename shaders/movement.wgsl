@group(0) @binding(0) var<storage, read_write> positions: array<vec3<f32>>;
@group(0) @binding(1) var<storage, read_write> velocities: array<vec3<f32>>;
@group(0) @binding(2) var<uniform> deltaTime: f32;
@group(0) @binding(3) var<uniform> size: f32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    if (i >= arrayLength(&positions)) {
        return;
    }
    var position = positions[i];
    position = position + velocities[i] * deltaTime;

    // wrap if necessary
    if (length(position) > size) {
        position = -position;
    }
    positions[i] = position;
}
