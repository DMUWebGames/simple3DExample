export async function loadVertices(url) { 
    const res = await fetch(url);
    const data = await res.json();
    return new Float32Array(data.vertices);
}