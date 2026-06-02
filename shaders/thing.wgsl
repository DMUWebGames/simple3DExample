struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) colour: vec4<f32>
};

struct Thing {
    transformationMatrix: mat4x4<f32>
};

@group(0) @binding(1) var<storage> things: array<Thing>;

@vertex
fn vsMain(@builtin(instance_index) instanceIndex: u32, @location(0) position: vec3<f32>) -> VertexOutput {
    var output: VertexOutput;
    let thing = things[instanceIndex];
    output.colour = vec4(position.z + position.x, position.x + position.y, 1 - position.y, 1);
    output.position = (vec4<f32>(position, 1) * thing.transformationMatrix);
    return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
    return input.colour;
}