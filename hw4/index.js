import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let bigRotationAngle = 0;
let smallRotationAngle = 0;
let startTime = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupBuffers() {
    const Vertices = new Float32Array([
        //기둥
        -0.10,  0.50,  // 좌상단
        -0.10, -0.50,  // 좌하단
        0.10, -0.50,  // 우하단
        0.10,  0.50,   // 우상단

        //가운데 날개
        -0.35,  0.55,  // 좌상단
        -0.35, 0.45,  // 좌하단
        0.35, 0.45,  // 우하단
        0.35,  0.55,   // 우상단

        //오른쪽 날개
        0.25,  0.52,  // 좌상단
        0.25, 0.48,  // 좌하단
        0.45, 0.48,  // 우하단
        0.45,  0.52,   // 우상단

        //왼쪽 날개
        -0.25,  0.52,  // 좌상단
        -0.25, 0.48,  // 좌하단
        -0.45, 0.48,  // 우하단
        -0.45,  0.52,   // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    
        0, 2, 3,
        4, 5, 6,
        4, 6, 7,
        8, 9, 10,
        8, 10, 11,
        12, 13, 14,
        12, 14, 15
    ]);

    const Colors = new Float32Array([
        //갈색
        0.8, 0.4, 0.1, 1.0,  
        0.8, 0.4, 0.1, 1.0,
        0.8, 0.4, 0.1, 1.0,
        0.8, 0.4, 0.1, 1.0,

        //흰색
        1.0, 1.0, 1.0, 1.0,  
        1.0, 1.0, 1.0, 1.0, 
        1.0, 1.0, 1.0, 1.0, 
        1.0, 1.0, 1.0, 1.0, 

        //회색
        0.5, 0.5, 0.5, 1.0,  
        0.5, 0.5, 0.5, 1.0, 
        0.5, 0.5, 0.5, 1.0,  
        0.5, 0.5, 0.5, 1.0, 

        //회색
        0.5, 0.5, 0.5, 1.0,  
        0.5, 0.5, 0.5, 1.0, 
        0.5, 0.5, 0.5, 1.0,  
        0.5, 0.5, 0.5, 1.0
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Vertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for color
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Colors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);
    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    shader.use();
    gl.bindVertexArray(vao);

    //각 사각형별로 mat4생성 후 적용
    let transform1 = mat4.create();
    shader.setMat4("u_transform", transform1);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    let transform2 = mat4.create();
    mat4.translate(transform2, transform2, [0.0, 0.5, 0.0]);
    mat4.rotate(transform2, transform2, bigRotationAngle, [0,0,1]);
    mat4.translate(transform2, transform2, [0.0, -0.5, 0.0]);
    shader.setMat4("u_transform", transform2);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12);

    let transform3 = mat4.create();
    mat4.translate(transform3, transform3, [0.0, 0.5, 0.0]);
    mat4.rotate(transform3, transform3, bigRotationAngle, [0,0,1]);
    mat4.translate(transform3, transform3, [0.0, -0.5, 0.0]);
    mat4.translate(transform3, transform3, [0.35, 0.5, 0.0]);
    mat4.rotate(transform3, transform3, smallRotationAngle, [0,0,1]);
    mat4.translate(transform3, transform3, [-0.35, -0.5, 0.0]);
    shader.setMat4("u_transform", transform3);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 24);

    let transform4 = mat4.create();
    mat4.translate(transform4, transform4, [0.0, 0.5, 0.0]);
    mat4.rotate(transform4, transform4, bigRotationAngle, [0,0,1]);
    mat4.translate(transform4, transform4, [0.0, -0.5, 0.0]);
    mat4.translate(transform4, transform4, [-0.35, 0.5, 0.0]);
    mat4.rotate(transform4, transform4, smallRotationAngle, [0,0,1]);
    mat4.translate(transform4, transform4, [0.35, -0.5, 0.0]);
    shader.setMat4("u_transform", transform4);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 36);
    
}

function animate(currentTime) {
    // elapsed time (in seconds)으로 변경
    const elapsedTime = (currentTime - startTime) / 1000;

    //큰 날개 회전 각도
    bigRotationAngle = Math.sin(elapsedTime) * Math.PI * 2.0;
    //작은 날개 회전 각도
    smallRotationAngle = Math.sin(elapsedTime) * Math.PI * -10.0;

    render();

    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        await initShader();

        setupBuffers();

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}


