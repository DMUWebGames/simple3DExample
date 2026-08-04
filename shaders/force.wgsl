@group(0) @binding(0) var<storage, read_write> velocities: array<vec3<f32>>;
@group(0) @binding(1) var<storage, read_write> forces: array<vec3<f32>>;
@group(0) @binding(2) var<storage, read_write> masses: array<f32>;
@group(0) @binding(3) var<uniform> deltaTime: f32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    if (i >= arrayLength(&velocities)) {
        return;
    }

    if (abs(masses[i]) < 0.0001) {
        return;
    }

    let acceleration = forces[i] / masses[i];
    velocities[i] = velocities[i] + acceleration * deltaTime;
}
