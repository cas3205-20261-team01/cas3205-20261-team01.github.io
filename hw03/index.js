import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let isInitialized = false;  // main이 실행되는 순간 true로 change
let shader;
let vao;
let positionBuffer; // VBO

let isDrawing = false;
let startTempPoint, endTempPoint;

let circle; // [중심점, 반지름]
let line; // [시작점, 끝점]
let intersectionPoints; // [점1, 점2]

let textOverlay, textOverlay2, textOverlay3;

let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)

// DOMContentLoaded event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임
// mouse input을 사용할 때 이와 같이 main을 call 한다. 

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) { // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
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

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 하단이 (-1, -1), 우측 상단이 (1, 1)
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
        -((y / canvas.height) * 2 - 1) // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
    ];
}

/* 
    browser window
    +----------------------------------------+
    | toolbar, address bar, etc.             |
    +----------------------------------------+
    | browser viewport (컨텐츠 표시 영역)       | 
    | +------------------------------------+ |
    | |                                    | |
    | |    canvas                          | |
    | |    +----------------+              | |
    | |    |                |              | |
    | |    |      *         |              | |
    | |    |                |              | |
    | |    +----------------+              | |
    | |                                    | |
    | +------------------------------------+ |
    +----------------------------------------+

    *: mouse click position

    event.clientX = browser viewport 왼쪽 경계에서 마우스 클릭 위치까지의 거리
    event.clientY = browser viewport 상단 경계에서 마우스 클릭 위치까지의 거리
    rect.left = browser viewport 왼쪽 경계에서 canvas 왼쪽 경계까지의 거리
    rect.top = browser viewport 상단 경계에서 canvas 상단 경계까지의 거리

    x = event.clientX - rect.left  // canvas 내에서의 클릭 x 좌표
    y = event.clientY - rect.top   // canvas 내에서의 클릭 y 좌표
*/

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소 (div, body, html 등)으로 전파되지 않도록 방지
        
        if (!startTempPoint && !endTempPoint) { 
            isDrawing = true;

            const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
            const x = event.clientX - rect.left;  // canvas 내 x 좌표
            const y = event.clientY - rect.top;   // canvas 내 y 좌표

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

                updateText(textOverlay, `Circle: center (${circle[0][0].toFixed(2)}, ${circle[0][1].toFixed(2)}) radius ${circle[1].toFixed(2)}`);
            } else if (!line) {
                line = [startTempPoint, endTempPoint];
                
                updateText(textOverlay2, `Line segment: (${line[0][0].toFixed(2)}, ${line[0][1].toFixed(2)}) ~ (${line[1][0].toFixed(2)}, ${line[1][1].toFixed(2)})`);

                // 교점 계산

                updateText(textOverlay3, `Intersection Points: `)
                
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

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();
    
    // 원 그리기
    if (circle) {
        shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);

        const circlePoints = [];
        for (let i = 0; i < 1000; i++) {
            const angle = (i / 1000) * 2 * Math.PI;
            const radius = circle[1];
            circlePoints.push(circle[0][0] + radius * Math.cos(angle), circle[0][1] + radius * Math.sin(angle));
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circlePoints), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 1000);
    }
    
    // 선분 그리기
    if (line) {
        shader.setVec4("u_color", [1.0, 1.0, 1.0, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line.flat()), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 임시 원/선분 그리기
    if (isDrawing && startTempPoint && endTempPoint) {
        if (!circle) {
            shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);

            const circlePoints = [];
            for (let i = 0; i < 1000; i++) {
                const angle = (i / 1000) * 2 * Math.PI;
                const radius = Math.sqrt(Math.pow(startTempPoint[0] - endTempPoint[0], 2) + Math.pow(startTempPoint[1] - endTempPoint[1], 2));
                circlePoints.push(startTempPoint[0] + radius * Math.cos(angle), startTempPoint[1] + radius * Math.sin(angle));
            }

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circlePoints), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 1000);
        } else if (!line) {
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

        // 셰이더 초기화
        await initShader();
        
        // 버퍼 초기화
        setupBuffers();

        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        // 마우스 이벤트 설정
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
