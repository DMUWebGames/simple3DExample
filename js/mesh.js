export function loadMesh(name) {
    return loadVertices(`./data/meshes/${name}.json`);
}

export async function loadVertices(url) { 
    const res = await fetch(url);
    const data = await res.json();
    data.vertices = new Float32Array(data.vertices)
    return data
}