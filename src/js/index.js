// Importe Three.js
import * as THREE from "three";

let scene, renderer, camera, clock, width, height, video;
let particles, videoWidth, videoHeight, imageCache;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const classNameForLoading = "loading";

let audio, analyser;

const fftSize = 2048;

const frequencyRange = {
  bass: [20, 140],
  lowMid: [140, 400],
  mid: [400, 2600],
  highMid: [2600, 5200],
  treble: [5200, 14000],
};

function init() {
  document.body.classList.add(classNameForLoading);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  renderer = new THREE.WebGLRenderer();
  document.getElementById("content").appendChild(renderer.domElement);

  clock = new THREE.Clock();

  initCamera();
  onWindowResize();

  navigator.mediaDevices =
    navigator.mediaDevices ||
    (navigator.mozGetUserMedia || navigator.webkitGetUserMedia
      ? {
          getUserMedia: (c) => {
            return new Promise(function (y, n) {
              (navigator.mozGetUserMedia || navigator.webkitGetUserMedia).call(
                navigator,
                c,
                y,
                n
              );
            });
          },
        }
      : null);

  if (navigator.mediaDevices) {
    initAudio();
    initVideo();
  } else {
    showAlert();
  }

  draw();
}

function onWindowResize() {
  width = window.innerWidth;
  height = window.innerHeight;

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    videoTexture.needsUpdate = true;
  }

  // Animação das partículas
  particles.rotation.x += 0.005;
  particles.rotation.y += 0.005;

  renderer.render(scene, camera);
}

function initCamera() {
  const fov = 45;
  const aspect = width / height;

  camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 10000);
  camera.position.z = Math.min(window.innerWidth, window.innerHeight);
  camera.position.set(0, 0, z);
  camera.lookAt(0, 0, 0);

  scene.add(camera);
}

function initAudio() {
  // Function implementation goes here
  const audioListener = new THREE.AudioListener();
  audio = new THREE.Audio(audioListener);

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("audio/ambient.mp3", (buffer) => {
    document.body.classList.remove(classNameForLoading);

    audio.setBuffer(buffer);
    audio.setLoop(true);
    audio.setVolume(0.5);
    audio.play();
  });

  analyser = new THREE.AudioAnalyser(audio, fftSize);

  document.body.addEventListener("click", () => {
    if (audio) {
      if (audio.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    }
  });
}

function initVideo() {
  video = document.getElementById("video");
  video.autoplay = true;

  const option = {
    audio: false,
    video: {
      facingMode: "user",
    },
  };

  navigator.mediaDevices
    .getUserMedia(option)
    .then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", () => {
        videoWidth = video.videoWidth;
        videoHeight = video.videoHeight;

        createParticles();
      });
    })
    .catch((error) => {
      console.log(error);
      showAlert();
    });
}

function showAlert() {
  document.getElementById("message").classList.remove("hidden");
}

function draw() {
  // Function implementation goes here
  
}

function createParticles() {
  const imageData = getImageData(video);
  const geometry = new THREE.Geometry();
  geometry.morphAttributes = {};

  const material = new THREE.PointsMaterial({
    size: 1,
    color: 0xffffff,
    sizeAttenuation: false,
  });

  for (let y = 0, height = imageData.height; y < height; y++) {
    for (let x = 0, width = imageData.width; x < width; x += 1) {
      const vertex = new THREE.Vector3(
        x - imageData.width / 2,
        -y + imageData.height / 2,
        0
      );
      geometry.vertices.push(vertex);
    }
  }

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}
