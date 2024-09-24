/* tslint:disable */
/* eslint-disable */
/**
*/
export class Image {
  free(): void;
}
/**
*/
export class ImageManager {
  free(): void;
/**
*/
  constructor();
/**
* @param {number} width
* @param {number} height
* @param {Uint8Array} data
* @returns {number}
*/
  add_image(width: number, height: number, data: Uint8Array): number;
/**
* @param {number} id
* @param {number} x
* @param {number} y
*/
  move_image(id: number, x: number, y: number): void;
/**
* @param {number} x
* @param {number} y
* @returns {number | undefined}
*/
  select_image(x: number, y: number): number | undefined;
/**
*/
  delete_selected_image(): void;
/**
* @param {CanvasRenderingContext2D} context
*/
  render(context: CanvasRenderingContext2D): void;
}
