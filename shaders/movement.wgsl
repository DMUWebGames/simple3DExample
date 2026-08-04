@group(0) @binding(0) var<storage, read_write> positions: array<vec3<f32>>;
@group(0) @binding(1) var<storage, read_write> velocities: array<vec3<f32>>;
@group(0) @binding(2) var<storage, read_write> scales: array<vec3<f32>>;
@group(0) @binding(3) var<uniform> deltaTime: f32;
@group(0) @binding(4) var<uniform> size: f32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    if (i >= arrayLength(&positions)) {
        return;
    }
    var position = positions[i];
    position += velocities[i] * deltaTime;

    let max_dist = size + length(scales[i]) / 2;
    // wrap if necessary
    if (length(position) > max_dist) {
        let direction = position / length(position);
        position = -direction * max_dist;
    }
    positions[i] = position;
}
