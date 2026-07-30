@group(0) @binding(0) var<storage, read_write> velocities: array<vec3<f32>>;
@group(0) @binding(1) var<storage, read_write> accelerations: array<vec3<f32>>;
@group(0) @binding(2) var<uniform> deltaTime: f32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    if (i >= arrayLength(&velocities)) {
        return;
    }

    velocities[i] = velocities[i] + accelerations[i] * deltaTime;
}
