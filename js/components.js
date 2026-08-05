export async function loadComponent(name) {
    const response = await fetch(`./data/components/${name}.json`);
    return response.json();
}