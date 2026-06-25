
struct Light {
    direction: vec3<f32>,
    _pad: f32,             // alignment
    color: vec3<f32>,
    _pad2: f32,
};

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) normal: vec3<f32>,
    @location(1) worldPos: vec3<f32>,
};

struct Cube {
    modelMatrix: mat4x4<f32>
};

struct Camera {
    viewMatrix: mat4x4<f32>,
    projMatrix: mat4x4<f32>,
    position: vec3<f32>,
    _pad: f32
};

@group(0) @binding(0) var<storage> cubes: array<Cube>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(0) @binding(2) var<uniform> light: Light;

@vertex
fn vsMain(
    @builtin(instance_index) instanceIndex: u32,
    input: VertexInput
) -> VertexOutput {

    var output: VertexOutput;
    let cube = cubes[instanceIndex];

    let worldPos = cube.modelMatrix * vec4<f32>(input.position, 1.0);

    output.position =
        camera.projMatrix *
        camera.viewMatrix *
        worldPos;

    // transform normal (ignore translation)
    output.normal =
        normalize((cube.modelMatrix * vec4<f32>(input.normal, 0.0)).xyz);

    output.worldPos = worldPos.xyz;

    return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {

    let N = normalize(input.normal);

    // Directional light: same direction everywhere
    let L = normalize(-light.direction);

    // View direction
    let V = normalize(camera.position - input.worldPos);

    let R = reflect(-L, N);

    // Phong components
    let ambient = 0.1;

    let diffuse = max(dot(N, L), 0.0);

    let specular = pow(max(dot(R, V), 0.0), 32.0);

    let baseColor = vec3<f32>(1.0, 1, 1);

    let color =
        baseColor * ambient +
        baseColor * diffuse +
        light.color * specular;

    return vec4<f32>(color, 1.0);
}