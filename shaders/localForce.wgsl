fn quatRotateVector(q: vec4<f32>, v: vec3<f32>) -> vec3<f32> {
    let qv = q.xyz;
    let uv = cross(qv, v);
    let uuv = cross(qv, uv);
    return v + 2.0 * (q.w * uv + uuv);
}

@group(0) @binding(0) var<storage, read_write> forces: array<vec3<f32>>;
@group(0) @binding(1) var<storage, read> thrusts: array<vec3<f32>>;
@group(0) @binding(2) var<storage, read> orientations: array<vec4<f32>>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    if (i >= arrayLength(&forces)) {
        return;
    }

    let orientation = normalize(orientations[i]);
    let worldForce = quatRotateVector(orientation, thrusts[i]);
    forces[i] += worldForce;
}