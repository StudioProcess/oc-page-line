/* globals dat */
import { params, updateLine } from './main.js';

export function create() {
  let gui = new dat.GUI();
  gui.addColor(params, 'color').onChange(updateLine);
  gui.add(params, 'startAngle', 0, 90).onChange(updateLine);
  gui.add(params, 'stepAngle', 0, 90).onChange(updateLine);
  gui.add(params, 'stepLength', 0, 5).onChange(updateLine);
}
