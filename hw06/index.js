import {
  resizeAspectRatio,
  Axes,
  setupText,
  updateText,
} from "../util/util.js";
import { Shader, readShaderFile } from "../util/shader.js";
import { Cube } from "../util/cube.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
let shader;
let startTime;
let lastFrameTime;
let isInitialized = false;

// model matrix
let modelMatrix1 = mat4.create();
let modelMatrix2 = mat4.create();
let modelMatrix3 = mat4.create();
let modelMatrix4 = mat4.create();
let modelMatrix5 = mat4.create();

// view matrix
let leftViewMatrix = mat4.create();
let rightViewMatrix = mat4.create();

// projection matrix
let leftProjMatrix = mat4.create();
let rightProjMatrix = mat4.create();

const cube1 = new Cube(gl);
const cube2 = new Cube(gl);
const cube3 = new Cube(gl);
const cube4 = new Cube(gl);
const cube5 = new Cube(gl);

const axes = new Axes(gl, 2.0);

// Camera
let leftCameraPos = vec3.fromValues(0, 0, 5);
let leftCameraFront = vec3.fromValues(0, 0, -1);
let leftCameraUp = vec3.fromValues(0, 1, 0);
let leftYaw = -90; // yaw angle, rotation about y-axis (degree)
let leftPitch = 0; // pitch angle, rotation about x-axis (degree)

let rightCameraPos = vec3.fromValues(0, 15, 0);
let rightCameraFront = vec3.fromValues(0, -1, 0);
let rightCameraUp = vec3.fromValues(0, 0, -1);

const mouseSensitivity = 0.1; // mouse sensitivity
const cameraSpeed = 2.5; // camera speed (unit distance/sec)

// text overlay
let textOverlay;

const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
};

// mouse 쓸 때 main call 방법
document.addEventListener("DOMContentLoaded", () => {
  if (isInitialized) {
    console.log("Already initialized");
    return;
  }

  main()
    .then((success) => {
      if (!success) {
        console.log("program terminated");
        return;
      }
      isInitialized = true;
    })
    .catch((error) => {
      console.error("program terminated with error:", error);
    });
});

// keyboard event listener for document
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key in keys) {
    keys[key] = true;
  }
});

document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (key in keys) {
    keys[key] = false;
  }
});

canvas.addEventListener("click", () => {
  canvas.requestPointerLock();
  // Changing the pointer lock state
  console.log("Canvas clicked, requesting pointer lock");
});

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === canvas) {
    console.log("Pointer is locked");
    document.addEventListener("mousemove", updateCamera);
  } else {
    console.log("Pointer is unlocked");
    document.removeEventListener("mousemove", updateCamera);
  }
});

// camera update function
function updateCamera(e) {
  const xoffset = e.movementX * mouseSensitivity; // movementX 사용
  const yoffset = -e.movementY * mouseSensitivity; // movementY 사용

  leftYaw += xoffset;
  leftPitch += yoffset;

  // pitch limit
  if (leftPitch > 89.0) leftPitch = 89.0;
  if (leftPitch < -89.0) leftPitch = -89.0;

  // camera direction calculation
  // sperical coordinates (r, theta, phi) = (r, yaw, pitch) = (sx, sy, sz)
  // sx = cos(yaw) * cos(pitch)
  // sy = sin(pitch)
  // sz = sin(yaw) * cos(pitch)
  const direction = vec3.create();
  direction[0] =
    Math.cos(glMatrix.toRadian(leftYaw)) *
    Math.cos(glMatrix.toRadian(leftPitch));
  direction[1] = Math.sin(glMatrix.toRadian(leftPitch));
  direction[2] =
    Math.sin(glMatrix.toRadian(leftYaw)) *
    Math.cos(glMatrix.toRadian(leftPitch));
  vec3.normalize(leftCameraFront, direction);
}

function initWebGL() {
  if (!gl) {
    console.error("WebGL 2 is not supported by your browser.");
    return false;
  }

  canvas.width = 1400;
  canvas.height = 700;
  resizeAspectRatio(gl, canvas);

  return true;
}

async function initShader() {
  const vertexShaderSource = await readShaderFile("shVert.glsl");
  const fragmentShaderSource = await readShaderFile("shFrag.glsl");
  shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function initModelMatrices() {
  mat4.translate(modelMatrix1, modelMatrix1, vec3.fromValues(0, 0, 0));
  mat4.translate(modelMatrix2, modelMatrix2, vec3.fromValues(2, 0.5, -3));
  mat4.translate(modelMatrix3, modelMatrix3, vec3.fromValues(-1.5, -0.5, -2.5));
  mat4.translate(modelMatrix4, modelMatrix4, vec3.fromValues(3, 0, -4));
  mat4.translate(modelMatrix5, modelMatrix5, vec3.fromValues(-3, 0, 1));
}

function initPerspective() {
  mat4.perspective(
    leftProjMatrix,
    glMatrix.toRadian(60), // field of view (fov, degree)
    1, // aspect ratio
    0.1, // near
    100.0, // far
  );

  mat4.ortho(
    rightProjMatrix,
    -10, // left
    10, // right
    -10, // bottom
    10, // top
    0.1, // near
    100.0, // far
  );
}

function drawCubes(cube, modelMatrix, viewMatrix, projMatrix) {
  shader.use();
  shader.setMat4("u_model", modelMatrix);
  shader.setMat4("u_view", viewMatrix);
  shader.setMat4("u_projection", projMatrix);

  cube.draw(shader);
}

function render() {
  const currentTime = Date.now();
  const deltaTime = (currentTime - lastFrameTime) / 1000.0;
  lastFrameTime = currentTime;

  // camera movement based on keyboard input
  const cameraSpeedWithDelta = cameraSpeed * deltaTime;

  // vec3.scaleAndAdd(v1, v2, v3, s): v1 = v2 + v3 * s
  if (keys["w"]) {
    // move camera forward (to the +cameraFront direction)
    vec3.scaleAndAdd(
      leftCameraPos,
      leftCameraPos,
      leftCameraFront,
      cameraSpeedWithDelta,
    );
  }
  if (keys["s"]) {
    // move camera backward (to the -cameraFront direction)
    vec3.scaleAndAdd(
      leftCameraPos,
      leftCameraPos,
      leftCameraFront,
      -cameraSpeedWithDelta,
    );
  }
  if (keys["a"]) {
    // move camera to the left (to the -cameraRight direction)
    const leftCameraRight = vec3.create();
    vec3.cross(leftCameraRight, leftCameraFront, leftCameraUp);
    vec3.normalize(leftCameraRight, leftCameraRight);
    vec3.scaleAndAdd(
      leftCameraPos,
      leftCameraPos,
      leftCameraRight,
      -cameraSpeedWithDelta,
    );
  }
  if (keys["d"]) {
    // move camera to the right (to the +cameraRight direction)
    const leftCameraRight = vec3.create();
    vec3.cross(leftCameraRight, leftCameraFront, leftCameraUp);
    vec3.normalize(leftCameraRight, leftCameraRight);
    vec3.scaleAndAdd(
      leftCameraPos,
      leftCameraPos,
      leftCameraRight,
      cameraSpeedWithDelta,
    );
  }

  // update view matrix
  mat4.lookAt(
    leftViewMatrix,
    leftCameraPos, // from position (camera position)
    vec3.add(vec3.create(), leftCameraPos, leftCameraFront), // target position (camera position + cameraFront)
    leftCameraUp,
  );

  mat4.lookAt(
    rightViewMatrix,
    rightCameraPos, // from position (camera position)
    vec3.add(vec3.create(), rightCameraPos, rightCameraFront), // target position (camera position + cameraFront)
    rightCameraUp,
  );

  gl.enable(gl.SCISSOR_TEST);
  gl.enable(gl.DEPTH_TEST);

  // left viewport
  gl.scissor(0, 0, canvas.width / 2, canvas.height);
  gl.viewport(0, 0, canvas.width / 2, canvas.height);
  gl.clearColor(0.1, 0.2, 0.3, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  drawCubes(cube1, modelMatrix1, leftViewMatrix, leftProjMatrix);
  drawCubes(cube2, modelMatrix2, leftViewMatrix, leftProjMatrix);
  drawCubes(cube3, modelMatrix3, leftViewMatrix, leftProjMatrix);
  drawCubes(cube4, modelMatrix4, leftViewMatrix, leftProjMatrix);
  drawCubes(cube5, modelMatrix5, leftViewMatrix, leftProjMatrix);

  axes.draw(leftViewMatrix, leftProjMatrix);

  // right viewport
  gl.scissor(canvas.width / 2, 0, canvas.width / 2, canvas.height);
  gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
  gl.clearColor(0.1, 0.1, 0.2, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  drawCubes(cube1, modelMatrix1, rightViewMatrix, rightProjMatrix);
  drawCubes(cube2, modelMatrix2, rightViewMatrix, rightProjMatrix);
  drawCubes(cube3, modelMatrix3, rightViewMatrix, rightProjMatrix);
  drawCubes(cube4, modelMatrix4, rightViewMatrix, rightProjMatrix);
  drawCubes(cube5, modelMatrix5, rightViewMatrix, rightProjMatrix);

  axes.draw(rightViewMatrix, rightProjMatrix);

  updateText(
    textOverlay,
    `Camera pos: (${leftCameraPos[0].toFixed(1)}, ${leftCameraPos[1].toFixed(
      1,
    )}, ${leftCameraPos[2].toFixed(1)}) | Yaw: ${leftYaw.toFixed(
      1,
    )}° | Pitch: ${leftPitch.toFixed(1)}°`,
  );

  requestAnimationFrame(render);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error("Failed to initialize WebGL");
    }

    await initShader();

    initModelMatrices();
    initPerspective();

    startTime = Date.now();
    lastFrameTime = startTime;

    textOverlay = setupText(
      canvas,
      "Camera pos: (x.x, y.y, z.z) | Yaw: ddd.d° | Pitch: ddd.d°",
      1,
    );
    setupText(
      canvas,
      "mWASD: move | Mouse: rotate (click to lock) | ESC: unlock",
      2,
    );
    setupText(
      canvas,
      "Left: Perspective (FP) | Right: Orthographic (Top-Down)",
      3,
    );

    requestAnimationFrame(render);

    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    alert("Failed to initialize program");
    return false;
  }
}
