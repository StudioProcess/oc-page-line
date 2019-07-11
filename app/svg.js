function attributes(attrs) {
  let str = ' ';
  for (let p of Object.keys(attrs)) {
    str += `${camelCaseToDash(p)}="${attrs[p]}" `;
  }
  return str.trimRight();
}

function element(name, content = '', attrs = {}) {
  return `<${name}${attributes(attrs)}>${content}</${name}>`
}

function svgElement(content = '', attrs = {}) {
  let defaults = {
    version: '1.1',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '',
    style: ''
  };
  attrs = Object.assign( defaults, attrs );
  return element('svg', content, attrs);
}

function polylineElement(attrs = {}) {
  let defaults = {
    points: '',
    style: ''
  };
  attrs = Object.assign( defaults, attrs );
  return element('polyline', '', attrs);
}


function camelCaseToDash(str) {
  return str.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();
}

function styleAttributeValue(props) {
  let str = '';
  for (let p of Object.keys(props)) {
    str += `${camelCaseToDash(p)}:${props[p]}; `;
  }
  return str.trimRight();
}

function pointsAttributeValue(points) {
  let str = '';
  for (let p of points) {
    str += `${p[0]},${p[1]} `;
  }
  return str.trimRight();
}


function saveURL(url, filename) {
  let link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
}

function saveBlob(blob, filename) {
  let url = URL.createObjectURL(blob);
  saveURL(url, filename);
  URL.revokeObjectURL(url);
}

function saveSVG(string, filename) {
  let blob = new Blob( [string], {type: 'image/svg+xml'} );
  saveBlob(blob, filename);
}

export class SVG {
  
  constructor(w = 0, h = 0) {
    this.left = 0;
    this.top = 0;
    this.width = w;
    this.height = h;
    this.lines = [];
    this.style = {};
    this.transform = "";
  }
  
  setSize(w, h) {
    this.width = w;
    this.height = h;
  }
  
  setViewBox(l, t, w, h) {
    this.left = l;
    this.top = t;
    this.width = w;
    this.height = h;
  }
  
  setStyle(style) {
    this.style = style;
  }
  
  setTransform(transform) {
    this.transform = transform;
  }
  
  // points specified as: [[x0,y0], [x1, y1], ...]
  addPolyline(points, style={}, transform="") {
    this.lines.push( {points, style, transform} );
  }
  
  getText() {
    let polylineElements = [];
    for (let l of this.lines) {
      // console.log(l);
      polylineElements.push(polylineElement({
        points: pointsAttributeValue(l.points),
        style: styleAttributeValue(l.style),
        transform: l.transform
      }));
    }
    
    let content = polylineElements.join('\n');
    let viewBox = !this.width || !this.height ? '' : `${this.left} ${this.top} ${this.width} ${this.height}`;
    return svgElement(content, {
      viewBox,
      transform: this.transform,
      style: styleAttributeValue(this.style),
    });
  }
  
  save(filename = 'download.svg') {
    saveSVG(this.getText(), filename);
  }
}
