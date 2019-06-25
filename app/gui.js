/* globals dat */
import { params, reformatLine, regenerateLine } from './main.js';

export function create() {
  let gui = new dat.GUI();
  gui.addColor(params, 'color').onChange(reformatLine);
  gui.add(params, 'pageOffset', 0, 9, 1).onFinishChange(regenerateLine);
  gui.add(params, 'pages', 1, 10, 1).onFinishChange(regenerateLine);
  gui.add(params, 'stepAngle', 0, 90).onFinishChange(regenerateLine);
  gui.add(params, 'length', 1, 100).onFinishChange(regenerateLine);
  gui.add(params, 'join').onChange(reformatLine);
  gui.add(params, 'gap', 0, 3).onChange(reformatLine);
  gui.add(params, 'continueAngle').onChange(reformatLine);
}
