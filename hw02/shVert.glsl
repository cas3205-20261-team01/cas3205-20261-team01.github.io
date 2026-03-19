#version 300 es

layout(location=0) in vec3 aPos;

uniform vec3 uCenter;

void main() {
    gl_Position = vec4(uCenter + aPos, 1.0);
} 