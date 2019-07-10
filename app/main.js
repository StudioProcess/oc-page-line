import * as gui from './gui.js';
import { SVG } from './svg.js';

const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
let data;
let line, lineMat;


export let params = {
  color: '#009CE1',
  lineWidth: 0.1,
  lineCap: 'butt',
  lineJoin: 'bevel',
  pageOffset: 0,
  pages: 1,
  startAngle: 45,
  stepAngle: 10,
  length: 22,
  join: true,
  gap: 0,
  continueAngle: true,
  cameraZ: 192,
};

(async function main() {
  
  // let svg = new SVG();
  // // svg.setSize(100, 100);
  // svg.addPolyline([[0,0], [100,100], [10,50]], {stroke:'black', strokeWeight:'1px'});
  // console.log( svg.getText() );
  
  // let data = await getPDFTextData();
  // console.log(data);
  // return;
  
  await setup(); // set up scene
  loop(); // start game loop

})();


async function setup() {
  gui.create();
  
  data = await getBookData();
  
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
  controls.screenSpacePanning = true;
  camera.position.z = params.cameraZ;

  lineMat = new THREE.LineBasicMaterial({ color:params.color });
  line = await getLineForBook(params.pageOffset, params.pages, lineMat);
  formatLine(params);
  scene.add( line );

  // testSVG();
}

function testSVG() {
  let style = { stroke: '#009CE1', fill:'none', strokeWidth:'3', strokeLinecap:'round', strokeLinejoin:'bevel' };
  let svg = new SVG();
  svg.setSize(100, 100);
  svg.setStyle(style);
  svg.addPolyline(
    [ [0,100], [50,25], [50,75], [100,0] ]
  );
  svg.save();
}

function saveLine(lineobj) {
  let style = { stroke:params.color, fill:'none', strokeWidth:params.lineWidth, strokeLinecap:params.lineCap, strokeLinejoin:params.lineJoin };
  let svg = new SVG();
  // svg.setSize(100, 100);
  svg.setStyle(style);
  
  let points = lineobj.geometry.vertices.map(p => {
    return [p.x, -p.y];
  });
  console.log(points)
  svg.addPolyline(points);
  svg.save();
}

function loop(_time) { // eslint-disable-line no-unused-vars
  
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
  
  else if (e.key == 'x') {
    for (let l of line.children) {
      // console.log(l);
      // console.log(l.geometry.vertices)
      saveLine(l);
      return;
    }
  }
  
  else if (e.key == 'Backspace') {
    camera.position.set(0, 0, params.cameraZ)
    controls.update();
  }
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

async function hashPage(n) {
  return crypto.subtle.digest('SHA-256', data[n])
    .then(buf => bufferToBinary(buf));
}


function bufferToBinary(buf) {
  let arr = new Uint8Array(buf);
  // console.log(arr);
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
  let a = params.startAngle; // turtle angle
  let r = opts.length / bits.length; // step length
  // console.log("stepLength", r);
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

async function getGeoForPage(n) {
  let bits = await hashPage( Math.floor(n) );
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

async function getLineForBook(pageOffset, totalPages, material) {
  let line = new THREE.Object3D();
  for (let i=0; i<totalPages; i++) {
    let geo = await getGeoForPage(pageOffset + i, totalPages);
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
  getLineForBook(params.pageOffset, params.pages, lineMat).then(newline => {
    scene.remove(line);
    line = newline;
    reformatLine();
    scene.add(line);
  });
}

async function getSampleData() {
  const numPages = 300;
  let buf = await readFile('app/data/alice30.txt');
  let charsPerPage = Math.floor(buf.byteLength/numPages);
  let data = [];
  for (let i=0; i<numPages; i++) {
    let pageData = buf.slice( i*charsPerPage, (i+1)*charsPerPage );
    data.push(pageData);
  }
  return data;
}

async function getPDFTextData(url) {
  let pdf = await pdfjsLib.getDocument(url);
  data = [];
  for (let i=1; i<=pdf.numPages; i++) {
    let pageData = await pdf.getPage(i);
    // let ops = await pageData.getOperatorList();
    // list of operators: https://github.com/mozilla/pdf.js/blob/master/src/shared/util.js#L171
    // operator definitions (annex a, p.643): https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf
    // let ans = await pageData.getAnnotations();
    // console.log(ops);
    // console.log(ans);
    let textData = await pageData.getTextContent();
    let pageText = "";
    textData.items.forEach(item => {
      pageText += item.str + "\n";
    });
    pageText = pageText.trim();
    // data.push(Uint8Array.from(pageText).buffer);
    data.push(Uint8Array.from(pageText).buffer);
  }
  return data;
}

// return book data as Array of pages, each page represented by the page data as ArrayBuffer
async function getBookData() {
  // return await getSampleData();
  return await getPDFTextData('./app/data/27-Open-Codes_2019-06-25.pdf');
}


async function getPDFData(url) {
  let pdf = await pdfjsLib.getDocument(url);
  let dests = await pdf.getDestinations();
  console.log(dests);
  let dest = await pdf.getDestination('img_p0_1');
  console.log(dest);
  
  data = [];
  for (let i=1; i<=pdf.numPages; i++) {
    let page = await pdf.getPage(i);
    let ops = await page.getOperatorList();
    // list of operators: https://github.com/mozilla/pdf.js/blob/master/src/shared/util.js#L171
    // operator definitions (annex a, p.643): https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf
    // text data: pdfjsLib.OPS.showText (44)
    // image ref: pdfjsLib.OPS.paintJpegXObject (82), pdfjsLib.OPS.paintImageXObject (85)
    // get image data from: page.objs.imageRef
    console.log(`page ${i}`, page, ops);
    let paintops = ops.fnArray.filter(op => op >= 82 && op <= 89);
    if (paintops.length > 0) console.log(paintops);
    // console.log(ans);
    let textData = await page.getTextContent();
    let pageText = "";
    textData.items.forEach(item => {
      pageText += item.str + "\n";
    });
    pageText = pageText.trim();
    data.push(Uint8Array.from(pageText).buffer);
    
    // let pageData = Uint8Array.from([page.objs.objs, page.intentStates.operatorList]);
    // console.log(pageData);
    // data.push(pageData.buffer);
  }
  return data;
}
