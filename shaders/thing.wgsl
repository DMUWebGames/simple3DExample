// from the vertexbufffer
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>
};

struct Asteroid {
    modelMatrix: mat4x4<f32>
};

struct Camera {
    viewMatrix: mat4x4<f32>,
    projMatrix: mat4x4<f32>
}

@group(0) @binding(0) var<storage> asteroids: array<Asteroid>;
@group(0) @binding(1) var<uniform> camera: Camera;

@group(0) @binding(2) var mySampler: sampler;
@group(0) @binding(3) var myTexture: texture_2d<f32>;

@vertex
fn vsMain(@builtin(instance_index) instanceIndex: u32, input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let asteroid = asteroids[instanceIndex];
    output.position = camera.projMatrix * camera.viewMatrix * asteroid.modelMatrix * vec4<f32>(input.position, 1);
    output.uv = input.uv;//vec4(1-input.position.x, 1, 1, 1);
    return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {

    // I need uv coordinates for this
    let s = mySampler;
    let t = myTexture;

    // return input.colour;
    return textureSample(myTexture, mySampler, input.uv);
}