import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PhysicsWorld } from "./physicsWorld";
import { Vector3 } from "three";
import {
  AmbientLight,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  WebGLRenderer,
} from "three";
import heather_bk from "/src/img/heather_bk.jpg";
import heather_dn from "/src/img/heather_dn.jpg";
import heather_ft from "/src/img/heather_ft.jpg";
import heather_lf from "/src/img/heather_lf.jpg";
import heather_up from "/src/img/heather_up.jpg";
import heather_rt from "/src/img/heather_rt.jpg";

var physics = new PhysicsWorld();
var sail;
var sea;
var cameraOffset = new Vector3(0, 10, -60); // Adjust camera offset as needed
var canvas = document.getElementById("scene");
const scene = new THREE.Scene();
var camera = new PerspectiveCamera(40, canvas.width / canvas.height, 1, 10000);
var renderer = new WebGLRenderer({
  canvas,
});
const controls = new OrbitControls(camera, renderer.domElement);
const textureLoader = new THREE.TextureLoader();

const handleWindowResize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderer.setSize(canvas.width, canvas.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = canvas.width / canvas.height;
  camera.updateProjectionMatrix();
  controls.update();
};

const init = () => {
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = Math.PI;
  controls.maxDistance = 10000;
  camera.position.set(10, 1, -50); // Initial camera position, adjust as needed

  var ambientLight = new AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  var sail_boat = new URL("../models/rowing_boat/scene.gltf", import.meta.url);
  var sea_url = new URL("../models/ocean_wave_-__wmaya/scene.gltf", import.meta.url);

  var assetLoader = new GLTFLoader();

  assetLoader.load(
    sea_url.href,
    function (gltf) {
      sea = gltf.scene;
      scene.add(sea);
      sea.position.set(0, -2500, 0);
      sea.scale.set(5000, 1, 5000);


      assetLoader.load(
        sail_boat.href,
        function (gltf) {
          sail = gltf.scene;
          scene.add(sail);
          sail.position.set(0, -2400, 0);
          sail.scale.set(0.1, 0.1, 0.1);
        },
        undefined,
        function (error) {
          console.error("Error loading sail boat model:", error);
        }
      );
    },
    undefined,
    function (error) {
      console.error("Error loading ocean wave model:", error);
    }
  );

  const textureBK = textureLoader.load(heather_bk);
  const textureDN = textureLoader.load(heather_dn);
  const textureFT = textureLoader.load(heather_ft);
  const textureLF = textureLoader.load(heather_lf);
  const textureUP = textureLoader.load(heather_up);
  const textureRT = textureLoader.load(heather_rt);

  const materials = [
    new MeshStandardMaterial({ map: textureFT, side: THREE.BackSide }),
    new MeshStandardMaterial({ map: textureBK, side: THREE.BackSide }),
    new MeshStandardMaterial({ map: textureUP, side: THREE.BackSide }),
    new MeshStandardMaterial({ map: textureDN, side: THREE.BackSide }),
    new MeshStandardMaterial({ map: textureRT, side: THREE.BackSide }),
    new MeshStandardMaterial({ map: textureLF, side: THREE.BackSide }),
  ];

  const cubeGeometry = new BoxGeometry(5000, 5000, 5000);
  var cube = new Mesh(cubeGeometry, materials);
  scene.add(cube);

  window.addEventListener("resize", handleWindowResize);
  window.addEventListener("load", handleWindowResize);

  // Add keyboard controls
  window.addEventListener("keydown", onKeyDown);
};

//  keyboard input
function onKeyDown(event) {
  switch (event.key) {
    case "ArrowUp":
      moveCameraForward();
      break;
    case "ArrowDown":
      moveCameraBackward();
      break;
    case "ArrowLeft":
      moveCameraLeft();
      break;
    case "ArrowRight":
      moveCameraRight();
      break;
    case "PageUp": 
      moveCameraUp();
      break;
    case "PageDown": 
      moveCameraDown();
      break;
    default:
      break;
  }
}

// Functions to move the camera
function moveCameraForward() {
  camera.position.z -= 10; 
}

function moveCameraBackward() {
  camera.position.z += 10; 
}

function moveCameraLeft() {
  camera.position.x -= 10; 
}

function moveCameraRight() {
  camera.position.x += 10;
}

function moveCameraUp() {
  camera.position.y += 10;
}

function moveCameraDown() {
  camera.position.y -= 10; 
}

const update = (deltaTime) => {
  physics.update(deltaTime / 1000);
  controls.update();

  if (sail && sea) {
    sail.position.copy(physics.position);
    sail.position.y = Math.max(sail.position.y, sea.position.y + 0.1);
    const halfSkyboxSize = 1700;
    sail.position.clampScalar(-halfSkyboxSize, halfSkyboxSize);
  }
};

const render = () => {
  renderer.render(scene, camera);
};

export const Main = () => {
  let lastTime = new Date().getTime();
  const loop = () => {
    window.requestAnimationFrame(loop);
    const currentTime = new Date().getTime();
    const delta = currentTime - lastTime;
    lastTime = currentTime;
    update(delta);
    render();
  };
  init();
  loop();
};

Main();
