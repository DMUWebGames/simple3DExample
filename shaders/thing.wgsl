// from the vertexbufffer
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) normal: vec3<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) worldPos: vec3<f32>,
};

struct Light {
    direction: vec3<f32>,
    _pad: f32,
    color: vec3<f32>,
    _pad2: f32,
};

struct Asteroid {
    modelMatrix: mat4x4<f32>
};

struct Camera {
    viewMatrix: mat4x4<f32>,
    projMatrix: mat4x4<f32>,
    position: vec3<f32>,
    _pad: f32
}

@group(0) @binding(0) var<storage> asteroids: array<Asteroid>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(0) @binding(2) var<uniform> light: Light;

@group(0) @binding(3) var mySampler: sampler;
@group(0) @binding(4) var myTexture: texture_2d<f32>;

@vertex
fn vsMain(@builtin(instance_index) instanceIndex: u32, input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let asteroid = asteroids[instanceIndex];
    let worldPos = asteroid.modelMatrix * vec4<f32>(input.position, 1.0);
    output.position = camera.projMatrix * camera.viewMatrix * worldPos;
    output.uv = input.uv;
    output.normal = normalize((asteroid.modelMatrix * vec4<f32>(input.normal, 0.0)).xyz);
    output.worldPos = worldPos.xyz;
    return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let textureColor = textureSample(myTexture, mySampler, input.uv);
    
    let N = normalize(input.normal);
    let L = normalize(-light.direction);
    let V = normalize(camera.position - input.worldPos);
    let R = reflect(-L, N);
    
    // Phong lighting
    let ambient = 0.1;
    let diffuse = max(dot(N, L), 0.0);
    let specular = pow(max(dot(R, V), 0.0), 16.0);
    
    let lighting = ambient + diffuse + specular * 0.5;
    
    return textureColor * vec4<f32>(lighting, lighting, lighting, 1.0);
}