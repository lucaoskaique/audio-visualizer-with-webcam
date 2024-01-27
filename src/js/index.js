// Importe Three.js
import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

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
  // document.body.classList.add(classNameForLoading);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  renderer = new THREE.WebGLRenderer();
  document.getElementById("content").appendChild(renderer.domElement);

  clock = new THREE.Clock();

  initCamera();
  onWindowResize();

  if (typeof navigator.mediaDevices === "undefined") {
    navigator.mediaDevices = {};
  }

  if (typeof navigator.mediaDevices.getUserMedia === "undefined") {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // Primeiro, tente obter a versão padrão
      var getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      // Algumas versões do navegador não suportam a função
      // Retorna uma promessa rejeitada com um erro
      if (!getUserMedia) {
        return Promise.reject(
          new Error("getUserMedia is not implemented in this browser")
        );
      }

      // Caso contrário, use a função com um callback
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

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

function initCamera() {
  const fov = 45;
  const aspect = width / height;

  camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 10000);
  const z = Math.min(window.innerWidth, window.innerHeight);
  camera.position.set(0, 0, z);
  camera.lookAt(0, 0, 0);

  scene.add(camera);
}

function initAudio() {
  // Function implementation goes here
  const audioListener = new THREE.AudioListener();
  audio = new THREE.Audio(audioListener);


  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("./src/assets/agua.mp3", (buffer) => {
    document.body.classList.remove(classNameForLoading);

    audio.setBuffer(buffer);
    audio.setLoop(true);
    audio.setVolume(0.5);
    audio.play();
  });

  analyser = new THREE.AudioAnalyser(audio, fftSize);

  document.body.addEventListener("click", function () {
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

/**
 * https://github.com/processing/p5.js-sound/blob/v0.14/lib/p5.sound.js#L1765
 *
 * @param data
 * @param _frequencyRange
 * @returns {number} 0.0 ~ 1.0
 */
const getFrequencyRange = (data, _frequencyRange) => {
  const nyquist = 48000 / 2;
  const lowIndex = Math.round((_frequencyRange[0] / nyquist) * data.length);
  const highIndex = Math.round((_frequencyRange[1] / nyquist) * data.length);
  let total = 0;
  let numFrequencies = 0;

  for (let i = lowIndex; i <= highIndex; i++) {
    total += data[i];
    numFrequencies += 1;
  }
  return total / numFrequencies / 255;
};

// function draw(t) {
//   // Function implementation goes here
//   clock.getDelta();

//   const time = clock.elapsedTime;

//   let r, g, b;

//   if (analyser) {
//     const data = analyser.getFrequencyData();

//     const bass = getFrequencyRange(data, frequencyRange.bass);
//     const mid = getFrequencyRange(data, frequencyRange.mid);
//     const treble = getFrequencyRange(data, frequencyRange.treble);

//     r = bass;
//     g = mid;
//     b = treble;
//   }

//   if (particles) {
//     particles.material.color.r = 1 - r;
//     particles.material.color.g = 1 - g;
//     particles.material.color.b = 1 - b;

//     const density = 2;
//     const useCache = parseInt(t) % 2 === 0; // To reduce CPU usage.
//     const imageData = getImageData(video, useCache);
//     for (
//       let i = 0, length = particles.geometry.vertices.length;
//       i < length;
//       i++
//     ) {
//       const particle = particles.geometry.vertices[i];
//       if (i % density !== 0) {
//         particle.z = 10000;
//         continue;
//       }
//       let index = i * 4;
//       let gray =
//         (imageData.data[index] +
//           imageData.data[index + 1] +
//           imageData.data[index + 2]) /
//         3;
//       let threshold = 300;
//       if (gray < threshold) {
//         if (gray < threshold / 3) {
//           particle.z = gray * r * 5;
//         } else if (gray < threshold / 2) {
//           particle.z = gray * g * 5;
//         } else {
//           particle.z = gray * b * 5;
//         }
//       } else {
//         particle.z = 10000;
//       }
//     }
//     particles.geometry.verticesNeedUpdate = true;
//   }

//   renderer.render(scene, camera);

//   requestAnimationFrame(draw);
// }
function draw(t) {
  clock.getDelta();

  const time = clock.elapsedTime;

  let r, g, b;

  if (analyser) {
    const data = analyser.getFrequencyData();

    const bass = getFrequencyRange(data, frequencyRange.bass);
    const mid = getFrequencyRange(data, frequencyRange.mid);
    const treble = getFrequencyRange(data, frequencyRange.treble);

    r = bass;
    g = mid;
    b = treble;
  }

  if (particles) {
    particles.material.color.r = 1 - r;
    particles.material.color.g = 1 - g;
    particles.material.color.b = 1 - b;

    const density = 2;
    const useCache = parseInt(t) % 2 === 0; // To reduce CPU usage.
    const imageData = getImageData(video, useCache);
    const positions = particles.geometry.attributes.position.array;
    const vertexCount = positions.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      if (i % density !== 0) {
        positions[i * 3 + 2] = 10000;
        continue;
      }

      let index = i * 4;
      let gray =
        (imageData.data[index] +
          imageData.data[index + 1] +
          imageData.data[index + 2]) /
        3;
      let threshold = 300;

      if (gray < threshold) {
        if (gray < threshold / 3) {
          positions[i * 3 + 2] = gray * r * 5;
        } else if (gray < threshold / 2) {
          positions[i * 3 + 2] = gray * g * 5;
        } else {
          positions[i * 3 + 2] = gray * b * 5;
        }
      } else {
        positions[i * 3 + 2] = 10000;
      }
    }

    particles.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(draw);
}

function getImageData(image, useCache) {
  if (useCache && imageCache) {
    return imageCache;
  }

  const w = image.videoWidth;
  const h = image.videoHeight;

  canvas.width = w;
  canvas.height = h;

  ctx.translate(w, 0);
  ctx.scale(-1, 1);

  ctx.drawImage(image, 0, 0);
  imageCache = ctx.getImageData(0, 0, w, h);

  return imageCache;
}

// function createParticles() {
//   const imageData = getImageData(video);
//   const geometry = new THREE.Geometry();
//   geometry.morphAttributes = {};

//   const material = new THREE.PointsMaterial({
//     size: 1,
//     color: 0xffffff,
//     sizeAttenuation: false,
//   });

//   for (let y = 0, height = imageData.height; y < height; y++) {
//     for (let x = 0, width = imageData.width; x < width; x += 1) {
//       const vertex = new THREE.Vector3(
//         x - imageData.width / 2,
//         -y + imageData.height / 2,
//         0
//       );
//       geometry.vertices.push(vertex);
//     }
//   }

//   particles = new THREE.Points(geometry, material);
//   scene.add(particles);
// }

function createParticles() {
  const imageData = getImageData(video);
  const numVertices = imageData.width * imageData.height;

  // Criar buffer de posição para todos os vértices
  const positions = new Float32Array(numVertices * 3); // cada vértice tem 3 coordenadas (x, y, z)
  let i = 0;

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      const posX = x - imageData.width / 2;
      const posY = -y + imageData.height / 2;
      const posZ = 0; // Z permanece 0 pois é um plano 2D

      // Adicionar posição ao buffer de posição
      positions[i * 3] = posX;
      positions[i * 3 + 1] = posY;
      positions[i * 3 + 2] = posZ;

      i++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 1,
    color: 0xffffff,
    sizeAttenuation: false,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

window.addEventListener("resize", onWindowResize);

init();
