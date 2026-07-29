@group(0) @binding(0) var<storage, read> positions: array<vec3<f32>>;
@group(0) @binding(1) var<storage, read> orientations: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> scales: array<vec3<f32>>;
@group(0) @binding(3) var<storage, read_write> transforms: array<mat4x4<f32>>;

fn quatToMat4(q: vec4<f32>) -> mat4x4<f32> {
    let x = q.x;
    let y = q.y;
    let z = q.z;
    let w = q.w;

    let xx = x * x;
    let yy = y * y;
    let zz = z * z;
    let xy = x * y;
    let xz = x * z;
    let yz = y * z;
    let wx = w * x;
    let wy = w * y;
    let wz = w * z;

    return mat4x4<f32>(
        vec4<f32>(
            1.0 - 2.0 * (yy + zz),
            2.0 * (xy + wz),
            2.0 * (xz - wy),
            0.0
        ),
        vec4<f32>(
            2.0 * (xy - wz),
            1.0 - 2.0 * (xx + zz),
            2.0 * (yz + wx),
            0.0
        ),
        vec4<f32>(
            2.0 * (xz + wy),
            2.0 * (yz - wx),
            1.0 - 2.0 * (xx + yy),
            0.0
        ),
        vec4<f32>(0.0, 0.0, 0.0, 1.0)
    );
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;

    if (i >= arrayLength(&orientations)) {
        return;
    }

    let position = positions[i];
    let orientation = normalize(orientations[i]);
    let scale = scales[i];
    var transform = quatToMat4(orientation);
    transform[0] *= scale.x;
    transform[1] *= scale.y;
    transform[2] *= scale.z;
    transform[3] = vec4<f32>(
        position.x,
        position.y,
        position.z,
        1.0
    );
    transforms[i] = transform;
}