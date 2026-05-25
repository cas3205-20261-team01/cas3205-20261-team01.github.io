// 05-both-cameras.js
// - PerspectiveCamera vs OrthographicCamera
// - OrbitControl change when camera changes

import * as THREE from 'three';  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();

// Camera를 perspective와 orthographic 두 가지로 switching 해야 해서 const가 아닌 let으로 선언
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 120;
camera.position.y = 60;
camera.position.z = 120;
camera.lookAt(scene.position);
scene.add(camera);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color(0x000000));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

// Camera가 바뀔 때 orbitControls도 바뀌어야 해서 let으로 선언
let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;


// 행성 texture들 load
const textureLoader = new THREE.TextureLoader();
const mercuryTexture = textureLoader.load('Mercury.jpg');
mercuryTexture.colorSpace = THREE.SRGBColorSpace;
const venusTexture = textureLoader.load('Venus.jpg');
venusTexture.colorSpace = THREE.SRGBColorSpace;
const earthTexture = textureLoader.load('Earth.jpg');
earthTexture.colorSpace = THREE.SRGBColorSpace;
const marsTexture = textureLoader.load('Mars.jpg');
marsTexture.colorSpace = THREE.SRGBColorSpace;


const sunGeometry = new THREE.SphereGeometry(10);
const sunMaterial = new THREE.MeshBasicMaterial({color: '#fbff00'});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 0, 0);
scene.add(sun);

const mercuryGeometry = new THREE.SphereGeometry(1.5);
const mercuryMaterial = new THREE.MeshPhongMaterial({color: '#a6a6a6', map: mercuryTexture});
const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
mercury.position.set(20, 0, 0);
scene.add(mercury);
let mercuryRotationSpeed = 0.02;
let mercuryOrbitSpeed = 0.02;

const venusGeometry = new THREE.SphereGeometry(3);
const venusMaterial = new THREE.MeshPhongMaterial({color: '#e39e1c', map: venusTexture});
const venus = new THREE.Mesh(venusGeometry, venusMaterial);
venus.position.set(35, 0, 0);
scene.add(venus);
let venusRotationSpeed = 0.015;
let venusOrbitSpeed = 0.015;

const earthGeometry = new THREE.SphereGeometry(3.5);
const earthMaterial = new THREE.MeshPhongMaterial({color: '#3498db', map: earthTexture});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.set(50, 0, 0);
scene.add(earth);
let earthRotationSpeed = 0.01;
let earthOrbitSpeed = 0.01;

const marsGeometry = new THREE.SphereGeometry(2.5);
const marsMaterial = new THREE.MeshPhongMaterial({color: '#c0392b', map: marsTexture});
const mars = new THREE.Mesh(marsGeometry, marsMaterial);
mars.position.set(65, 0, 0);
scene.add(mars);
let marsRotationSpeed = 0.008;
let marsOrbitSpeed = 0.008;


const directionalLight = new THREE.DirectionalLight(0xffffff, 5.0);
directionalLight.position.set(-20, 40, 60);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 8, 300);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);



// GUI
const gui = new GUI();
const controls = new function () {

    this.mercuryRotationSpeed = 0.02;
    this.mercuryOrbitSpeed = 0.02;
    this.venusRotationSpeed = 0.015;
    this.venusOrbitSpeed = 0.015;
    this.earthRotationSpeed = 0.01;
    this.earthOrbitSpeed = 0.01;
    this.marsRotationSpeed = 0.008;
    this.marsOrbitSpeed = 0.008;

    this.perspective = "Perspective";
    this.switchCamera = function () {
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera);
            camera = null; // 기존의 camera 제거    
            // OrthographicCamera(left, right, top, bottom, near, far)
            camera = new THREE.OrthographicCamera(window.innerWidth / -16, 
                window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / -16, -200, 500);
            camera.position.x = 120;
            camera.position.y = 60;
            camera.position.z = 120;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Orthographic";
        } else {
            scene.remove(camera);
            camera = null; 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.x = 120;
            camera.position.y = 60;
            camera.position.z = 120;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Perspective";
        }
    };
};

const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(controls, 'switchCamera').name('Switch Camera Type');
cameraFolder.add(controls, 'perspective').name('Current Camera').listen();


const mercurySpeed = gui.addFolder('Mercury');
mercurySpeed.add(controls, 'mercuryRotationSpeed', 0, 0.1).name('Rotation Speed').onChange(function (e) {
    mercuryRotationSpeed = e;
});
mercurySpeed.add(controls, 'mercuryOrbitSpeed', 0, 0.05).name('Orbit Speed').onChange(function (e) {
    mercuryOrbitSpeed = e;
});


const venusSpeed = gui.addFolder('Venus');
venusSpeed.add(controls, 'venusRotationSpeed', 0, 0.1).name('Rotation Speed').onChange(function (e) {
    venusRotationSpeed = e;
});
venusSpeed.add(controls, 'venusOrbitSpeed', 0, 0.05).name('Orbit Speed').onChange(function (e) {
    venusOrbitSpeed = e;
});


const earthSpeed = gui.addFolder('Earth');
earthSpeed.add(controls, 'earthRotationSpeed', 0, 0.1).name('Rotation Speed').onChange(function (e) {
    earthRotationSpeed = e;
});
earthSpeed.add(controls, 'earthOrbitSpeed', 0, 0.05).name('Orbit Speed').onChange(function (e) {
    earthOrbitSpeed = e;
});


const marsSpeed = gui.addFolder('Mars');
marsSpeed.add(controls, 'marsRotationSpeed', 0, 0.1).name('Rotation Speed').onChange(function (e) {
    marsRotationSpeed = e;
});
marsSpeed.add(controls, 'marsOrbitSpeed', 0, 0.05).name('Orbit Speed').onChange(function (e) {
    marsOrbitSpeed = e;
});


let mercuryStep = 0;
let venusStep = 0;
let earthStep = 0;
let marsStep = 0;


render();

function render() {
    orbitControls.update();
    stats.update();

    mercuryStep += mercuryOrbitSpeed;
    venusStep += venusOrbitSpeed;
    earthStep += earthOrbitSpeed;
    marsStep += marsOrbitSpeed;

    mercury.position.x = 20 * Math.cos(mercuryStep);
    mercury.position.z = 20 * Math.sin(mercuryStep);
    mercury.rotation.y += mercuryRotationSpeed;

    venus.position.x = 35 * Math.cos(venusStep);
    venus.position.z = 35 * Math.sin(venusStep);
    venus.rotation.y += venusRotationSpeed;

    earth.position.x = 50 * Math.cos(earthStep);
    earth.position.z = 50 * Math.sin(earthStep);
    earth.rotation.y += earthRotationSpeed;

    mars.position.x = 65 * Math.cos(marsStep);
    mars.position.z = 65 * Math.sin(marsStep);
    mars.rotation.y += marsRotationSpeed;


    // render using requestAnimationFrame
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
