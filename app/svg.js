function svgElement(vars) {
  vars = Object.assign( {viewBox: '', style: '', content: ''}, vars );
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="100%" height="100%" viewBox="${vars.viewBox}" version="1.1" xmlns="http://www.w3.org/2000/svg"  style="${vars.style}">
  ${vars.content}
</svg>`;
}

function polylineElement(vars) {
  vars = Object.assign( {points: '', style: ''}, vars );
  return `<polyline points="${vars.points}" style="${vars.style}"/>`;
}

function camelCaseToDash(str) {
  return str.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();
}

function styleAttr(props) {
  let str = '';
  for (let p of Object.keys(props)) {
    str += `${camelCaseToDash(p)}:${props[p]}; `;
  }
  return str.trimRight();
}

function pointsAttr(points) {
  let str = '';
  for (let p of points) {
    str += `${p[0]},${p[1]} `;
  }
  return str.trimRight();
}


export class SVG {
  
  constructor() {
    this.w = 0;
    this.h = 0;
    this.lines = [];
    this.style = {};
  }
  
  setSize(w, h) {
    this.w = w;
    this.h = h;
  }
  
  setStyle(style) {
    this.style = style;
  }
  
  // points specified as: [[x0,y0], [x1, y1], ...]
  addPolyline(points, style={}) {
    this.lines.push( {points, style} );
  }
  
  getText() {
    let polylineElements = [];
    for (let l of this.lines) {
      console.log(l);
      polylineElements.push(polylineElement({
        points: pointsAttr(l.points),
        style: styleAttr(l.style)
      }));
    }
    
    let content = polylineElements.join('\n');
    let viewBox = !this.w || !this.h ? '' : `0 0 ${this.w} ${this.h}`;
    return svgElement( {content, viewBox, style:this.style} );
  }
  
}
