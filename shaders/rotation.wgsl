fn quatMul(a: vec4<f32>, b: vec4<f32>) -> vec4<f32> {
    return vec4<f32>(
        a.w * b.xyz +
        b.w * a.xyz +
        cross(a.xyz, b.xyz),

        a.w * b.w -
        dot(a.xyz, b.xyz)
    );
}

fn quatFromAxisAngle(
    axis: vec3<f32>,
    angle: f32
) -> vec4<f32> {
    let halfAngle = angle * 0.5;
    let s = sin(halfAngle);

    return vec4<f32>(
        axis * s,
        cos(halfAngle)
    );
}

fn deltaRotation(
    angularVelocity: vec3<f32>,
    deltaTime: f32
) -> vec4<f32> {

    let angle =
        length(angularVelocity) * deltaTime;

    if (angle < 0.000001) {
        return vec4<f32>(
            0.0,
            0.0,
            0.0,
            1.0
        );
    }

    let axis =
        normalize(angularVelocity);

    return quatFromAxisAngle(
        axis,
        angle
    );
}

@group(0) @binding(0) var<storage, read_write> orientations: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> angularVelocities: array<vec3<f32>>;
@group(0) @binding(2) var<uniform> deltaTime: f32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;

    if (i >= arrayLength(&orientations)) {
        return;
    }
    let angularVelocity = angularVelocities[i];
    let frameRotation = deltaRotation(angularVelocity, deltaTime);
    orientations[i] = normalize(quatMul(orientations[i], frameRotation));
}