import * as THREE from 'three';
import type { Anatomy, Placement } from './attachment';

export interface GraftAppearance {
  color: THREE.Color; roughness: number; metalness: number; envMapIntensity: number;
  baseColor?:THREE.Color; map?:THREE.Texture|null; roughnessMap?:THREE.Texture|null; metalnessMap?:THREE.Texture|null;
  rawRoughness?:number; rawMetalness?:number;
}
const pixelCache = new WeakMap<THREE.Texture, { data: Uint8ClampedArray; width: number; height: number }>();
function texturePixel(texture: THREE.Texture, uv: THREE.Vector2): THREE.Vector4 | null {
  if (typeof document === 'undefined') return null;
  try {
    let pixels = pixelCache.get(texture);
    if (!pixels) {
      const image = texture.image as CanvasImageSource;
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return null;
      ctx.drawImage(image, 0, 0, 128, 128);
      pixels = { data: ctx.getImageData(0, 0, 128, 128).data, width: 128, height: 128 }; pixelCache.set(texture, pixels);
    }
    texture.updateMatrix(); const coordinate = texture.transformUv(uv.clone());
    const x = Math.max(1, Math.min(pixels.width - 2, Math.round(coordinate.x * (pixels.width - 1))));
    const y = Math.max(1, Math.min(pixels.height - 2, Math.round(coordinate.y * (pixels.height - 1))));
    const color = new THREE.Vector4();
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const i = ((y + dy) * pixels.width + x + dx) * 4;
      color.add(new THREE.Vector4(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2], pixels.data[i + 3]).multiplyScalar(1 / (255 * 9)));
    }
    return color;
  } catch { return null; }
}

export function sampleGraftAppearance(anatomy: Anatomy, placement: Placement, lift: number): GraftAppearance {
  const palette = { cup: '#f4f0e8', chair: '#cdb88c', umbrella: '#8688ae', bin: '#aeb1ad' };
  const result: GraftAppearance = { color: new THREE.Color(palette[anatomy.family]), roughness: anatomy.family === 'cup' ? .24 : .65, metalness: anatomy.family === 'bin' ? .8 : 0, envMapIntensity: 1.15 };
  const point = new THREE.Vector3(...placement.joint); point.y -= lift;
  const normal = new THREE.Vector3(...placement.normal);
  if(placement.mode==='top'&&placement.id==='seal'){
    const rim=anatomy.family==='chair'?anatomy.seat:anatomy.crown;
    point.x=rim.center.x+rim.width*.48;point.z=rim.center.z;point.y=rim.y;
  }
  if(placement.mode==='bottom'){
    point.set(anatomy.foot.center.x+anatomy.foot.width*.46,anatomy.bounds.min.y+.022,anatomy.foot.center.z+(anatomy.family==='chair'?anatomy.foot.depth*.46:0));
    normal.set(1,0,0);
  }
  const ray = new THREE.Raycaster(point.clone().addScaledVector(normal, .24), normal.clone().negate());
  const hit = ray.intersectObject(anatomy.local, true)[0]; if (!hit) return result;
  const mesh = hit.object as THREE.Mesh;
  const material = (Array.isArray(mesh.material) ? mesh.material[hit.face?.materialIndex ?? 0] : mesh.material) as THREE.MeshStandardMaterial;
  if (!material?.color) return result;
  result.color.copy(material.color); result.roughness = material.roughness ?? result.roughness;
  result.metalness = material.metalness ?? 0; result.envMapIntensity = material.envMapIntensity ?? 1.15;
  result.baseColor=material.color.clone();result.map=material.map;result.roughnessMap=material.roughnessMap;result.metalnessMap=material.metalnessMap;
  result.rawRoughness=material.roughness;result.rawMetalness=material.metalness;
  if (hit.uv && material.map) {
    const pixel = texturePixel(material.map, hit.uv);
    if (pixel) result.color.multiply(new THREE.Color().setRGB(pixel.x, pixel.y, pixel.z, material.map.colorSpace === THREE.SRGBColorSpace ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace));
  }
  if (hit.uv && material.roughnessMap) { const p = texturePixel(material.roughnessMap, hit.uv); if (p) result.roughness *= p.y; }
  if (hit.uv && material.metalnessMap) { const p = texturePixel(material.metalnessMap, hit.uv); if (p) result.metalness *= p.z; }
  result.roughness = THREE.MathUtils.clamp(result.roughness, .08, 1);
  return result;
}

/** A local material/geometry instance: coat only the organ root, leaving lens/nozzle/panel details intact. */
export function prepareGraftedOrgan(source: THREE.Object3D, p: Placement, contact: THREE.Vector3, appearance: GraftAppearance) {
  const root = source.clone(true); root.updateMatrixWorld(true);
  const extent = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  const radius = Math.max(.035, Math.min(extent.x, extent.y) * .48);
  root.traverse(o => {
    const mesh = o as THREE.Mesh; if (!mesh.isMesh) return;
    mesh.geometry = mesh.geometry.clone();
    if(!mesh.geometry.getAttribute('normal'))mesh.geometry.computeVertexNormals();
    const positions = mesh.geometry.getAttribute('position');
    const normals = mesh.geometry.getAttribute('normal');
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    const weights = new Float32Array(positions.count);
    const point = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const offset = new THREE.Vector3(...p.offset);
    for (let i = 0; i < positions.count; i++) {
      if(p.id==='solar')continue; // Keep the active blue cells and thin double-sided panel unchanged.
      point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).add(offset);
      const axis = p.mode === 'side' ? point.z : p.mode === 'top' ? point.y : -point.y;
      const end = p.mode === 'side' ? contact.z : p.mode === 'top' ? contact.y : -contact.y;
      const radial = p.mode === 'side' ? Math.hypot(point.x - contact.x, point.y - contact.y) : Math.hypot(point.x - contact.x, point.z - contact.z);
      let radialWeight = p.mode === 'bottom' ? 1 : 1 - THREE.MathUtils.smoothstep(radial, radius * .45, radius * 1.45);
      if(p.mode==='top'&&p.id==='seal')radialWeight=THREE.MathUtils.smoothstep(Math.hypot(point.x/(extent.x*.5),point.z/(extent.z*.5)),.77,.99);
      normal.fromBufferAttribute(normals,i).applyNormalMatrix(normalMatrix).normalize();
      const facing=p.mode==='side'?-normal.z:p.mode==='top'?-normal.y:normal.y;
      const rearFacing=THREE.MathUtils.smoothstep(facing,-.08,.70);
      weights[i] = (1 - THREE.MathUtils.smoothstep(axis, end - .003, end + (p.mode==='bottom'?.024:.055))) * radialWeight * rearFacing;
    }
    mesh.geometry.setAttribute('graftWeight', new THREE.BufferAttribute(weights, 1));
    const coat = (original: THREE.Material) => {
      const material = original.clone() as THREE.MeshStandardMaterial;
      if (!material.isMeshStandardMaterial) return material;
      material.onBeforeCompile = shader => {
        shader.uniforms.graftColor = { value: appearance.color };
        shader.uniforms.graftRoughness = { value: appearance.roughness };
        shader.uniforms.graftMetalness = { value: appearance.metalness };
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float graftWeight;\nvarying float vGraftWeight;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGraftWeight = graftWeight;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 graftColor;\nuniform float graftRoughness;\nuniform float graftMetalness;\nvarying float vGraftWeight;')
          .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, graftColor, vGraftWeight);')
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, graftRoughness, vGraftWeight);')
          .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, graftMetalness, vGraftWeight);');
      };
      material.customProgramCacheKey = () => 'specimen-root-graft-v1';
      return material;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(coat) : coat(mesh.material);
  });
  return root;
}

export function disposeGraftedOrgan(root: THREE.Object3D) {
  root.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); for (const material of Array.isArray(m.material) ? m.material : [m.material]) material.dispose(); } });
}
