
fn quatMul(a: vec4<f32>, b: vec4<f32>) -> vec4<f32> {
    return vec4<f32>(
        a.w * b.xyz +
        b.w * a.xyz +
        cross(a.xyz, b.xyz),

        a.w * b.w -
        dot(a.xyz, b.xyz)
    );
}


fn quatSlerp(a: vec4<f32>, b: vec4<f32>, t: f32) -> vec4<f32> {
    var end = b;

    var cosTheta = dot(a, b);

    // Take shortest path
    if (cosTheta < 0.0) {
        end = -b;
        cosTheta = -cosTheta;
    }

    // Nearly identical: use lerp
    if (cosTheta > 0.9995) {
        return normalize(mix(a, end, t));
    }

    let theta = acos(clamp(cosTheta, -1.0, 1.0));
    let sinTheta = sin(theta);

    let wa = sin((1.0 - t) * theta) / sinTheta;
    let wb = sin(t * theta) / sinTheta;

    return normalize(a * wa + end * wb);
}

fn updateOrientation(
    orientation: vec4<f32>,
    rotation: vec4<f32>,
    deltaTime: f32
) -> vec4<f32> {
    let identity = vec4<f32>(0.0, 0.0, 0.0, 1.0);

    let frameDelta = quatSlerp(
        identity,
        rotation,
        deltaTime
    );

    let newOrientation = quatMul(
        orientation,
        frameDelta
    );

    return normalize(newOrientation);
}


@group(0) @binding(0) var<storage, read_write> torques: array<vec3<f32>>;
@group(0) @binding(1) var<storage, read_write> angularVelocities: array<vec3<f32>>;
@group(0) @binding(2) var<storage, read_write> inverseInertias: array<f32>;
@group(0) @binding(3) var<uniform> deltaTime: f32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    if (i >= arrayLength(&torques)) {
        return;
    }

    let angularAcceleration = torques[i] * inverseInertias[i];
    let angularVelocity = angularVelocities[i];
    angularVelocities[i] += angularAcceleration * deltaTime;
}