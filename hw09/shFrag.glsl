#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;
in vec3 normal;

struct Material {
    vec3 diffuse;      // surface's diffuse color
    vec3 specular;     // surface's specular color
    float shininess;   // specular shininess
};

struct Light {
    vec3 direction;    // light direction (vector from surface to the light)
    vec3 ambient;      // ambient strength
    vec3 diffuse;      // diffuse strength
    vec3 specular;     // specular strength
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform int toonLevels;   // number of toon shading levels

void main() {
    // ambient
    vec3 rgb = material.diffuse;
    vec3 ambient = light.ambient * rgb;

    // diffuse
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
    // diff toon quantization
    diff = floor(diff * float(toonLevels)) / float(toonLevels);
    vec3 diffuse = light.diffuse * diff * rgb;

    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = 0.0;
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    }
    // spec toon quantization
    spec = floor(spec * float(toonLevels)) / float(toonLevels);
    vec3 specular = light.specular * spec * material.specular;

    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}
