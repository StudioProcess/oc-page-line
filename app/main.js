import * as gui from './gui.js';

const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
let buf;
let line, lineGeo, lineMat;

let page = 0;

export let params = {
  start:[0,0], 
  startAngle:45, 
  stepAngle:10, 
  stepLength:1
};

(async function main() {  
  
  await setup(); // set up scene
  loop(); // start game loop

})();


async function setup() {
  gui.create();
  
  buf = await readFile('app/alice30.txt');
  // console.log(buf);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize( W, H );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( renderer.domElement );
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.enableKeys = false;
  camera.position.z = 192;

  lineMat = new THREE.LineBasicMaterial({ color: 0xff1050 });
  let lineGeo = new THREE.Geometry();
  line = new THREE.Line( lineGeo, lineMat );
  scene.add( line );
  
  setGeoForPage(page);
}


function loop(time) { // eslint-disable-line no-unused-vars
  
  requestAnimationFrame( loop );
  renderer.render( scene, camera );
  
}


document.addEventListener('keydown', e => {
  // console.log(e.key, e.keyCode, e);
  
  if (e.key == 'f') { // f .. fullscreen
    if (!document.webkitFullscreenElement) {
      document.querySelector('body').webkitRequestFullscreen();
    } else { document.webkitExitFullscreen(); }
  }
  
  else if (e.keyCode == 39) { setPage(page+1); } 
  else if (e.keyCode == 37) { setPage(page-1); }
});


async function readFile(name) {
  return fetch(name).then( res => res.arrayBuffer() );
}


async function hashPage(n, charsPerPage = 3000) {
  let data = buf.slice( n*charsPerPage, (n+1)*charsPerPage );
  return crypto.subtle.digest('SHA-256', data)
    .then(buf => bufferToBinary(buf));
}


function bufferToBinary(buf) {
  let arr = new Uint8Array(buf);
  console.log(arr);
  return arr.reduce( (acc, octet) => {
    for (let i=0; i<8; i++) {
      acc.push( (octet >> i) & 1 ); // NOTE: pushes bits LSB first
    }
    return acc;
  }, []);
}


function createLineGeo(bits, opts = { start:[0,0], startAngle:45, stepAngle:10, stepLength:1 }) {
  let geo = new THREE.Geometry();
  let p = new THREE.Vector3(opts.start[0], opts.start[1], 0); // turtle position
  let a = opts.startAngle; // turtle angle
  geo.vertices.push(p.clone());
  for (let b of bits) {
    if (b) { a += opts.stepAngle; } else { a -= opts.stepAngle; } // adjust angle
    // move forward
    let arad = a / 360 * Math.PI * 2;

    let d = new THREE.Vector3( opts.stepLength * Math.cos(arad), opts.stepLength * Math.sin(arad), 0 ); // direction vector
    p.add(d);
    geo.vertices.push(p.clone());
  }
  return geo;
}


async function setGeoForPage(n) {
  let bits = await hashPage(n);
  lineGeo = createLineGeo(bits, params);
  line.geometry = lineGeo;
  console.log(bits);
}

function setPage(n) {
  if (n < 0) { n = 0; }
  page = n;
  setGeoForPage(page);
}

export function updateLine() {
  setGeoForPage(page);
}
