export async function loadMesh(name) {
    return loadVertices(`./data/meshes/${name}.json`);
}

export async function loadVertices(url) { 
    const res = await fetch(url);
    const data = await res.json();
    return new Float32Array(data.vertices);
}