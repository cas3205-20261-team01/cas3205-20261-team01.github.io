import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let isInitialized = false;
let shader;
let vao; // VAO
let positionBuffer; // VBO

let isDrawing = false;
let startTempPoint, endTempPoint;

let circle; // [중심점, 반지름]
let line; // [시작점, 끝점]
let intersections; // [점1, 점2]

let textOverlay, textOverlay2, textOverlay3;

let axes = new Axes(gl, 0.85);

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
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
    ];
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (!startTempPoint && !endTempPoint) { 
            isDrawing = true;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startTempPoint = [glX, glY];
        }
    }

    function handleMouseMove(event) {
        if (isDrawing && startTempPoint) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            let [glX, glY] = convertToWebGLCoordinates(x, y);
            endTempPoint = [glX, glY];

            render();
        }
    }

    function handleMouseUp() {
        if (isDrawing && endTempPoint) {
            if (!circle) {
                const radius = Math.sqrt(Math.pow(startTempPoint[0] - endTempPoint[0], 2) + Math.pow(startTempPoint[1] - endTempPoint[1], 2));
                circle = [startTempPoint, radius];

                updateText(textOverlay, `Circle: center (${circle[0][0].toFixed(2)}, ${circle[0][1].toFixed(2)}) radius = ${circle[1].toFixed(2)}`);
            } else if (!line) {
                line = [startTempPoint, endTempPoint];
                
                updateText(textOverlay2, `Line segment: (${line[0][0].toFixed(2)}, ${line[0][1].toFixed(2)}) ~ (${line[1][0].toFixed(2)}, ${line[1][1].toFixed(2)})`);

                // 교점 계산
                intersections = getIntersections(circle, line);

                if (intersections.length > 0) {
                    const intersectionText = intersections.map((intersection, index) => `Point ${index + 1}: (${intersection[0].toFixed(2)}, ${intersection[1].toFixed(2)})`).join(' ');
                    updateText(textOverlay3, `Intersection Points: ${intersections.length} ${intersectionText}`);
                } else {
                    updateText(textOverlay3, 'No intersection');
                }
                
            }

            isDrawing = false;
            startTempPoint = null;
            endTempPoint = null;

            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function getCirclePoints(center, radius) {
    const circlePoints = [];
    
    for (let i = 0; i < 10000; i++) {
        const angle = (i / 10000) * 2 * Math.PI;
        circlePoints.push([center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)]);
    }

    return circlePoints;
}

function getIntersections(circle, line) {
    const [center, radius] = circle;
    const [p1, p2] = line;

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];

    const fx = p1[0] - center[0];
    const fy = p1[1] - center[1];

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    const discriminant = b * b - 4 * a * c;

    const intersections = [];

    if (a === 0) {
        const distSq = (p1[0] - center[0]) * (p1[0] - center[0]) + (p1[1] - center[1]) * (p1[1] - center[1]);
        if (distSq === radius * radius) {
            return [p1[0], p1[1]];
        }
        return [];
    }

    // 교점 0개
    if (discriminant < 0) {
        return [];
    }

    // 교점 1개
    if (discriminant === 0) {
        const t = -b / (2 * a);

        if (t >= 0 && t <= 1) {
            intersections.push([p1[0] + t * dx, p1[1] + t * dy]);
        }

        return intersections;
    }

    // 교점 2개
    const sqrtD = Math.sqrt(discriminant);

    const t1 = (-b - sqrtD) / (2 * a);
    const t2 = (-b + sqrtD) / (2 * a);

    if (t1 >= 0 && t1 <= 1) {
        intersections.push([p1[0] + t1 * dx, p1[1] + t1 * dy]);
    }

    if (t2 >= 0 && t2 <= 1) {
        intersections.push([p1[0] + t2 * dx, p1[1] + t2 * dy]);
    }

    return intersections;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();
    
    // 원 그리기
    if (circle) {
        shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);

        const circlePoints = getCirclePoints(circle[0], circle[1]);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circlePoints.flat()), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 10000);
    }
    
    // 선분 그리기
    if (line) {
        shader.setVec4("u_color", [1.0, 1.0, 1.0, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line.flat()), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 교점 그리기
    if (intersections) {
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(intersections.flat()), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, intersections.length);
    }

    if (isDrawing && startTempPoint && endTempPoint) {
        // 임시 원 그리기
        if (!circle) {
            shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);

            const radius = Math.sqrt(Math.pow(startTempPoint[0] - endTempPoint[0], 2) + Math.pow(startTempPoint[1] - endTempPoint[1], 2));
            const circlePoints = getCirclePoints(startTempPoint, radius);

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circlePoints.flat()), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 10000);
        }
        // 임시 선분 그리기
        else if (!line) {
            shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startTempPoint, ...endTempPoint]), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
    }

    // axes 그리기
    axes.draw(mat4.create(), mat4.create()); // 두 개의 identity matrix를 parameter로 전달
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
            return false; 
        }

        await initShader();
        
        setupBuffers();

        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
