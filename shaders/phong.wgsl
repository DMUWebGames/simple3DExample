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

struct RenderCamera {
    viewProjMatrix: mat4x4<f32>,
    position: vec3<f32>,
    _pad: f32
}

@group(0) @binding(0) var<storage, read> transformIndices: array<u32>;
@group(0) @binding(1) var<storage, read> transforms: array<mat4x4<f32>>;

// @group(1) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(1) var<uniform> light: Light;
@group(1) @binding(2) var sampler2D: sampler;
@group(1) @binding(3) var<storage, read> cameras: array<RenderCamera>;
@group(1) @binding(4) var<uniform> activeCamera: u32;

@group(2) @binding(0) var albedoTexture: texture_2d<f32>;

@vertex
fn vsMain(@builtin(instance_index) instanceIndex: u32, input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let transformIndex = transformIndices[instanceIndex];
    let transform = transforms[transformIndex];
    let worldPos = transform * vec4<f32>(input.position, 1.0);
    let camera = cameras[activeCamera];

    output.position = camera.viewProjMatrix * worldPos;
    output.uv = input.uv;
    output.normal = normalize((transform * vec4<f32>(input.normal, 0.0)).xyz);
    output.worldPos = worldPos.xyz;
    return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let textureColor = textureSample(albedoTexture, sampler2D, input.uv);
    let camera = cameras[activeCamera];
    
    let N = normalize(input.normal);
    let L = normalize(-light.direction);
    let V = normalize(camera.position - input.worldPos);
    let R = reflect(-L, N);
    
    // Phong lighting
    let ambient = 0.2;
    let diffuse = max(dot(N, L), 0.0);
    let specular = pow(max(dot(R, V), 0.0), 16.0) * 0.65;
    let lighting = ambient + diffuse + specular;

    return textureColor * vec4<f32>(light.color.r * lighting, light.color.g * lighting, light.color.b * lighting, 1.0);

}
