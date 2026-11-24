import * as T from 'three';

export function box(parent: T.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, material: T.Material) {
  const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function label(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 192;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#101b19'; context.fillRect(0, 0, 256, 192);
  context.fillStyle = '#ebca84'; context.font = '96px Georgia';
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText(text, 128, 104);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
export const smooth = (t: number) => { const v = T.MathUtils.clamp(t, 0, 1); return v * v * (3 - 2 * v); };
