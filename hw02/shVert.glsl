#version 300 es

layout(location=0) in vec3 aPos;

uniform vec3 uCenter;

void main() {
    gl_Position = vec4(uCenter[0] + aPos[0], uCenter[1] + aPos[1], uCenter[2] + aPos[2], 1.0);
} 