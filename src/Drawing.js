import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PhysicsWorld } from "./physicsWorld";
import {
  AmbientLight,
  PerspectiveCamera,
  WebGLRenderer,
  DirectionalLight,
  PointLight,
  SpotLight,
  Vector3,
} from "three";
import * as dat from "dat.gui";

var physics = new PhysicsWorld();
var sail, sailBoat;
var canvas = document.getElementById("scene");
const scene = new THREE.Scene();
var camera = new PerspectiveCamera(40, canvas.width / canvas.height, 1, 1000000);
var renderer = new WebGLRenderer({
  canvas,
});
const controls = new OrbitControls(camera, renderer.domElement);

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
  controls.dampingFactor = 0.02;
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = Math.PI;
  controls.maxDistance = 1000000;
  camera.position.set(0, 1000, 1000);

  // Ambient Light
  var ambientLight = new AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Directional Light
  var directionalLight = new DirectionalLight(0xffffff, 1);
  directionalLight.position.set(20, 30, -10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  scene.add(directionalLight);

  // Point Light
  var pointLight = new PointLight(0xffffff, 1.5, 150);
  pointLight.position.set(50, 50, 50);
  pointLight.castShadow = true;
  scene.add(pointLight);

  // Spot Light
  var spotLight = new SpotLight(0xffffff, 1.2);
  spotLight.position.set(-50, 50, -50);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.2;
  spotLight.decay = 2;
  spotLight.distance = 200;
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 2048;
  spotLight.shadow.mapSize.height = 2048;
  scene.add(spotLight);



  var sail_boat = new URL("../models/sailBoat/scene.gltf", import.meta.url);
  var sea_url = new URL("../models/ocean_wave_-__wmaya/scene.gltf", import.meta.url);
  var sail_url = new URL("../models/sail1/scene.gltf", import.meta.url);

  var assetLoader = new GLTFLoader();

  // sea 
  assetLoader.load(
    sea_url.href,
    function (gltf) {
      let sea = gltf.scene;
      scene.add(sea);
      sea.position.set(0, 0, 0);
      sea.scale.set(10000, 1, 10000);

      // sail and boat
      var boatGroup = new THREE.Group();
      scene.add(boatGroup);

      //  sailboat 
      assetLoader.load(
        sail_boat.href,
        function (gltf) {
          sailBoat = gltf.scene;
          boatGroup.add(sailBoat);
          sailBoat.position.set(0, 0, 0);
          sailBoat.scale.set(-100, 100, -100);
          const axesHelper = new THREE.AxesHelper(50);
          sailBoat.add(axesHelper);
        

          // sail 
          assetLoader.load(
            sail_url.href,
            function (gltf) {
              sail = gltf.scene;
              boatGroup.add(sail);
              sail.position.set(0, 20, 0);
              sail.scale.set(-20, 20, -20);
            },
            undefined,
            function (error) {
              console.error("Error loading sail model:", error);
            }
          );
        },
        undefined,
        function (error) {
          console.error("Error loading sailboat model:", error);
        }
      );
    },
    undefined,
    function (error) {
      console.error("Error loading ocean wave model:", error);
    }
  );

  window.addEventListener("resize", handleWindowResize);
  window.addEventListener("load", handleWindowResize);
  window.addEventListener("keydown", onKeyDown);
};

// Keyboard input
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

  if (sailBoat) {
    sailBoat.position.copy(physics.position);  // تحديث موضع القارب
    sailBoat.parent.position.copy(physics.position);
    sailBoat.parent.position.y = Math.max(sailBoat.parent.position.y, -2400);
    sailBoat.rotation.y = physics.rotationAngle.y;
    
    if (sail) {
      const sailPosition = physics.calculateSailPosition();
      sail.position.set(sailPosition.x, sailPosition.y, sailPosition.z);
    }
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