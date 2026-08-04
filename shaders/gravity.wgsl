@group(0) @binding(0) var<storage, read_write> forces: array<vec3<f32>>;
@group(0) @binding(1) var<storage, read> masses: array<f32>;
@group(0) @binding(2) var<storage, read> positions: array<vec3<f32>>;
@group(0) @binding(3) var<uniform> gravityConfig: GravityConfig;

struct GravityConfig {
    G: f32,
    minDistance: f32,
    maxDistance: f32,
    _pad: f32
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    let j = id.y;

    if (i >= arrayLength(&forces) || j >= arrayLength(&positions)) {
        return;
    }

    if (i == j) {
        return;
    }

    let massI = masses[i];
    let massJ = masses[j];
    if (abs(massI) < 0.0001 || abs(massJ) < 0.0001) {
        return;
    }

    let delta = positions[j] - positions[i];
    let distanceSquared = dot(delta, delta);
    let minDistanceSquared = gravityConfig.minDistance * gravityConfig.minDistance;
    let maxDistanceSquared = gravityConfig.maxDistance * gravityConfig.maxDistance;

    if (distanceSquared < minDistanceSquared || distanceSquared > maxDistanceSquared) {
        return;
    }

    let distance = sqrt(distanceSquared);
    let direction = delta / max(distance, 0.0001);
    let strength = gravityConfig.G * massI * massJ / distanceSquared;
    let gravityForce = direction * strength;

    forces[i] += vec3(10, 1, 2);//gravityForce;
}