struct CameraComponent {
    aspect: f32,
    near: f32,
    far: f32,
    fov: f32,
}

struct RenderCamera {
    viewProjMatrix: mat4x4<f32>,
    position: vec3<f32>,
    _pad: f32,
}

@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> orientations: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> cameras: array<CameraComponent>;
@group(0) @binding(3) var<storage, read_write> renderCameras: array<RenderCamera>;
@group(0) @binding(4) var<uniform> cam: u32;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {

    // source data
    let position = positions[cam].xyz;
    let orientation = normalize(orientations[cam]);
    let camera = cameras[cam];

    let projMatrix = perspective(
        camera.aspect,
        camera.near,
        camera.far,
        camera.fov
    );

    let viewMatrix = makeViewMatrix(position, orientation);

    renderCameras[cam].position = position;
    renderCameras[cam].viewProjMatrix = projMatrix * viewMatrix;
    // renderCameras[cam].projMatrix = projMatrix;

    // viewProjMatrix = projMatrix * viewMatrix;
}

fn perspective(
    aspect: f32,
    near: f32,
    far: f32,
    fovDeg: f32
) -> mat4x4<f32> {

    let fovRad = radians(fovDeg);
    let f = 1.0 / tan(fovRad * 0.5);

    return mat4x4<f32>(
        vec4<f32>(f / aspect, 0.0, 0.0, 0.0),
        vec4<f32>(0.0, f, 0.0, 0.0),
        vec4<f32>(0.0, 0.0, far / (near - far), -1.0),
        vec4<f32>(0.0, 0.0, (near * far) / (near - far), 0.0)
    );
}

fn quatToMat3(q: vec4<f32>) -> mat3x3<f32> {

    let x = q.x;
    let y = q.y;
    let z = q.z;
    let w = q.w;

    return mat3x3<f32>(
        vec3<f32>(
            1.0 - 2.0*y*y - 2.0*z*z,
            2.0*x*y + 2.0*w*z,
            2.0*x*z - 2.0*w*y
        ),
        vec3<f32>(
            2.0*x*y - 2.0*w*z,
            1.0 - 2.0*x*x - 2.0*z*z,
            2.0*y*z + 2.0*w*x
        ),
        vec3<f32>(
            2.0*x*z + 2.0*w*y,
            2.0*y*z - 2.0*w*x,
            1.0 - 2.0*x*x - 2.0*y*y
        )
    );
}

fn makeViewMatrix(
    position: vec3<f32>,
    orientation: vec4<f32>
) -> mat4x4<f32> {

    let rotation = transpose(quatToMat3(orientation));

    let translation = -(rotation * position);

    return mat4x4<f32>(
        vec4<f32>(rotation[0], 0.0),
        vec4<f32>(rotation[1], 0.0),
        vec4<f32>(rotation[2], 0.0),
        vec4<f32>(translation, 1.0)
    );
}
