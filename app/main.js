import * as gui from './gui.js';
import { SVG } from './svg.js';

const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
let buf;
let line, lineMat;

// let pages = 125;
// let page = 0;

export let params = {
  color: 0x0f72ff,
  pages: 125,
  stepAngle: 10,
  length: 22,
  join: true,
  gap: 0,
  continueAngle: true,
};

(async function main() {
  
  // let svg = new SVG();
  // // svg.setSize(100, 100);
  // svg.addPolyline([[0,0], [100,100], [10,50]], {stroke:'black', strokeWeight:'1px'});
  // console.log( svg.getText() );
  
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
  console.log(renderer);
  document.body.appendChild( renderer.domElement );
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 5000 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.enableKeys = false;
  camera.position.z = 192;

  lineMat = new THREE.LineBasicMaterial({ color:params.color });
  line = await getLineForBook(params.pages, lineMat);
  formatLine(params);
  scene.add( line );

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
  
  // else if (e.keyCode == 39) { setPage(page+1); } 
  // else if (e.keyCode == 37) { setPage(page-1); }
});


(function setupAspectSwitch() {
  const handler = e => {
    const body = document.querySelector('body');
    if (e.matches) body.classList.add('wide');
    else body.classList.remove('wide');
  };
  const mq = window.matchMedia(`(min-aspect-ratio:${W}/${H})`);
  mq.addListener(handler);
  handler(mq);
})();


async function readFile(name) {
  return fetch(name).then( res => res.arrayBuffer() );
}


async function hashPage(n, charsPerPage = 100) {
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

// Position is (0,0) and initial angle 0 (east)
function createLineGeo(bits, opts = { stepAngle:10, length:256 }) {
  let geo = new THREE.Geometry();
  let p = new THREE.Vector3(); // turtle position
  let a = 0; // turtle angle
  let r = opts.length / bits.length; // step length
  console.log("stepLength", r);
  geo.vertices.push(p.clone());
  for (let b of bits) {
    if (b) { a += opts.stepAngle; } else { a -= opts.stepAngle; } // adjust angle
    // move forward
    let arad = a / 360 * Math.PI * 2;

    let d = new THREE.Vector3( r * Math.cos(arad), r * Math.sin(arad), 0 ); // direction vector
    p.add(d);
    geo.vertices.push(p.clone());
  }
  geo.direction = p; // Direction Vector (since the geo starts at [0,0] this corresponds to the last vertex)
  geo.angle = a / 360 * Math.PI * 2;
  return geo;
}

// async function setGeoForPage(n) {
//   let bits = await hashPage(n);
//   lineGeo = createLineGeo(bits, params);
//   line.geometry = lineGeo;
//   console.log(bits) ;
// }

async function getGeoForPage(n, totalPages=params.pages) {
  console.log(buf);
  let bits = await hashPage(n, Math.floor(buf.byteLength/totalPages));
  return createLineGeo(bits, params);
}

function formatLine(opts = { join:true, gap:2, continueAngle:true }) {
  let position = new THREE.Vector3();
  let angle = 0;
  let lastGeo;
  
  line.children.forEach(segment => {
    if (lastGeo) {
      // Calculate new position
      if (opts.join) {
        let dir = lastGeo.direction.clone();
        if (opts.continueAngle) { dir.applyEuler(new THREE.Euler(0,0,angle)); } // Needs old angle
        position.add(dir);
      }
      // Calculate new angle
      angle = opts.continueAngle ? angle + lastGeo.angle : lastGeo.angle;
      // Add gap
      if (opts.join) {
        position.add(new THREE.Vector3(opts.gap*Math.cos(angle),opts.gap*Math.sin(angle),0)); // Needs new angle
      }
    }
    segment.position.set(position.x, position.y, position.z);
    segment.rotation.set(0,0,0);
    if (opts.continueAngle && opts.join) { segment.rotateZ(angle); }
    lastGeo = segment.geometry;
  });
}

async function getLineForBook(totalPages, material) {
  let line = new THREE.Object3D();
  for (let i=0; i<totalPages; i++) {
    let geo = await getGeoForPage(i, totalPages);
    let segment = new THREE.Line( geo, material );
    line.add(segment);
  }
  return line;
}

// function setPage(n) {
//   if (n < 0) { n = 0; }
//   page = n;
//   setGeoForPage(page);
// }

export function reformatLine() {
  formatLine(params);
  lineMat.color = new THREE.Color(params.color);
}

export function regenerateLine() {
  getLineForBook(params.pages, lineMat).then(newline => {
    scene.remove(line);
    line = newline;
    reformatLine();
    scene.add(line);
  });
}
