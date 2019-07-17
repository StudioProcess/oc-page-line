/* globals dat */
import { params, reformatLine, regenerateLine } from './main.js';

export function create() {
  let gui = new dat.GUI();
  gui.addColor(params, 'color').onChange(reformatLine);
  gui.add(params, 'pageOffset', 0, 9, 1).onFinishChange(regenerateLine);
  gui.add(params, 'pages', 1, 160, 1).onFinishChange(regenerateLine);
  gui.add(params, 'startAngle', -90, 90).onFinishChange(regenerateLine);
  gui.add(params, 'stepAngle', 0, 20).onFinishChange(regenerateLine);
  gui.add(params, 'length', 10, 1000).onFinishChange(regenerateLine);
  gui.add(params, 'compose', ['none', 'join', 'grid']).onChange(reformatLine);
  gui.add(params, 'gap', 0, 100).onChange(reformatLine);
  gui.add(params, 'gridWidth', 0, 200).onChange(reformatLine);
  gui.add(params, 'continueAngle').onChange(reformatLine);
  gui.add(params, 'centerOnPage').onChange(reformatLine);
}
