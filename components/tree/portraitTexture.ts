import * as THREE from 'three';
import { tokens } from '@/lib/tokens';

/**
 * Circular portrait textures for graph nodes. Each src is drawn once into a canvas clipped to a disc
 * with a gold ring; the texture is shared by every sprite that uses it and updated when the image loads.
 */
const cache = new Map<string, THREE.CanvasTexture>();
const SIZE = 128;

export function portraitTexture(src: string, ring: string = tokens.color.gold): THREE.CanvasTexture {
  const key = src + ring;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const draw = (img?: HTMLImageElement) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = tokens.color.cosmos3;
    ctx.fillRect(0, 0, SIZE, SIZE);
    if (img) {
      // cover-fit
      const s = Math.max(SIZE / img.width, SIZE / img.height);
      const w = img.width * s;
      const h = img.height * s;
      ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = ring;
    ctx.stroke();
    tex.needsUpdate = true;
  };
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  draw();
  const img = new Image();
  img.onload = () => draw(img);
  img.src = src;
  cache.set(key, tex);
  return tex;
}

/** Plain <img> cache for the 2D canvas renderer. */
const imgCache = new Map<string, HTMLImageElement>();
export function portraitImage(src: string): HTMLImageElement {
  const hit = imgCache.get(src);
  if (hit) return hit;
  const img = new Image();
  img.src = src;
  imgCache.set(src, img);
  return img;
}
