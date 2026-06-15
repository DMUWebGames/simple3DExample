struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) colour: vec4<f32>
};

struct Thing {
    modelMatrix: mat4x4<f32>
};

struct Camera {
    viewMatrix: mat4x4<f32>,
    projMatrix: mat4x4<f32>
}

@group(0) @binding(0) var<storage> things: array<Thing>;
@group(0) @binding(1) var<uniform> camera: Camera;

@vertex
fn vsMain(@builtin(instance_index) instanceIndex: u32, @location(0) position: vec3<f32>) -> VertexOutput {
    var output: VertexOutput;
    let thing = things[instanceIndex];
    // var aspect = camera.projMatrix[0][0] / camera.projMatrix[1][1];
    output.colour = vec4(1-position.x, 1-position.y, 0.5, 1);
    // output.position = (thing.transformationMatrix * vec4<f32>(position.x, position.y * aspect, position.z, 1));
    // output.position = (vec4<f32>(position.x * canvas.width, position.y * canvas.height, position.z, 1) * thing.transformationMatrix);
    output.position = camera.projMatrix * camera.viewMatrix * thing.modelMatrix * vec4<f32>(position, 1);
    return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
    return input.colour;
}