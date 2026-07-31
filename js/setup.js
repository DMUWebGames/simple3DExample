export let device;

try {
    if (!navigator.gpu) {
        throw new Error("WebGPU is not supported by this browser.");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("Unable to get a GPU adapter.");
    }
    device = await adapter.requestDevice();
} catch (error) {
    console.error("WebGPU initialization failed:", error.message);
    alert("Failed to initialize WebGPU. Please check browser compatibility or try a different device.");
    throw error;
}

export const canvas = document.createElement('canvas');
export const statsList = document.createElement('dl');
const dialog = document.createElement('dialog');

dialog.setAttribute("closedby", "any");
window.addEventListener('keypress', ({ key }) => {
    if (key == " ") {
        dialog.showModal();
    }
});
// dialog.
dialog.append(statsList);
document.body.append(canvas, dialog);
// export const speedometer = document.createElement('meter');
// speedometer.className = "speed";
// document.body.append(canvas, speedometer);


export const format = navigator.gpu.getPreferredCanvasFormat();
export const ctx = canvas.getContext('webgpu');
const alphamode = "premultiplied";
ctx.configure({device, format, alphamode});
