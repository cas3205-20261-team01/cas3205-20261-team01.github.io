// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 현재 window 전체를 canvas로 사용
canvas.width = 500;
canvas.height = 500;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);

// Start rendering
render();

// Render loop
function render() {
    gl.enable(gl.SCISSOR_TEST);

    const sectionWidth = canvas.width / 2;
    const sectionHeigiht = canvas.height / 2;

    gl.scissor(0, 0, sectionWidth, sectionHeigiht);
    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.scissor(sectionWidth, 0, sectionWidth, sectionHeigiht);
    gl.clearColor(1.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.scissor(0, sectionHeigiht, sectionWidth, sectionHeigiht);
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.scissor(sectionWidth, sectionHeigiht, sectionWidth, sectionHeigiht);
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.disable(gl.SCISSOR_TEST);
}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    const size = window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth;
    canvas.width = size;
    canvas.height = size;

    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
});

