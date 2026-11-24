import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {World,type Atmosphere} from './World';
import type {Artwork} from '../Artwork';
export type Pixel=[number,number];
export interface PaintingSpace {image:string;width:number;height:number;span:number;depth:number;horizon:number;centreY?:number}

/** Reference-calibrated geometry tools. Pigment is attached to separate solid
 * objects; the original image is never used as a full-scene backdrop. */
export class PaintedWorld extends World {
  readonly paint:T.MeshStandardMaterial;
  readonly painting:PaintingSpace;
  private readonly distance:number;private readonly scale:number;private readonly centre:number;
  constructor(scene:T.Scene,id:string,floor:string,artwork:Artwork,atmosphere:Atmosphere,painting:PaintingSpace){
    super(scene,id,floor,artwork,atmosphere);this.painting=painting;this.distance=painting.depth+1.3;this.scale=painting.span/painting.height;this.centre=painting.centreY??.2;
    // Replace the generic ground with a calibrated slope. Subclasses supply the
    // composition as independent volumes, water, architecture and fine details.
    const ground=this.group.getObjectByName('Walkable landscape') as T.Mesh;ground.geometry.dispose();
    const g=new T.PlaneGeometry(150,150,64,72);g.rotateX(-Math.PI/2);g.translate(0,0,-25);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,this.height(p.getX(i),p.getZ(i)));g.computeVertexNormals();ground.geometry=g;
    const texture=new T.TextureLoader().load(painting.image);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
    this.paint=new T.MeshStandardMaterial({map:texture,roughness:.78,metalness:.015});this.paint.toneMapped=false;this.paint.userData.surfaceDetail=true;
    this.paint.onBeforeCompile=shader=>{
      this.paint.map!.updateMatrix();shader.uniforms.paintingSpace={value:new T.Vector4(painting.width,painting.height,this.scale,this.distance)};shader.uniforms.paintingCentre={value:this.centre};shader.uniforms.paintingMapTransform={value:this.paint.map!.matrix};
      shader.vertexShader='varying float paintedFacing;varying vec3 paintedPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npaintedFacing=normal.z;paintedPosition=(modelMatrix*vec4(transformed,1.)).xyz;');
      shader.fragmentShader='uniform vec4 paintingSpace;uniform float paintingCentre;uniform mat3 paintingMapTransform;varying float paintedFacing;varying vec3 paintedPosition;\n'+shader.fragmentShader;
      // Use a fixed reference projection, not the player's current camera. This
      // keeps pigment anchored while avoiding distortion on receding surfaces.
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
        float paintingFactor=paintingSpace.w/(1.3-paintedPosition.z);
        vec2 fixedUV=vec2((paintingSpace.x*.5+paintedPosition.x*paintingFactor/paintingSpace.z)/paintingSpace.x,1.-(paintingSpace.y*.5-((paintedPosition.y-1.7)*paintingFactor+1.7-paintingCentre)/paintingSpace.z)/paintingSpace.y);
        fixedUV=(paintingMapTransform*vec3(fixedUV,1.)).xy;
        diffuseColor*=texture2D(map,fixedUV);
      #endif`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(diffuseColor.rgb,outgoingLight,mix(.88,.23,smoothstep(-.15,.8,paintedFacing)));\n#include <opaque_fragment>');
    };this.paint.customProgramCacheKey=()=> 'painted-world-pigment-v2';
    this.group.userData.paintingSpace=painting;
  }
  point(x:number,y:number,depth=this.painting.depth){const z=-depth,k=(1.3-z)/this.distance;return new T.Vector3((x-this.painting.width/2)*this.scale*k,1.7+(this.centre+(this.painting.height/2-y)*this.scale-1.7)*k,z);}
  pigment(g:T.BufferGeometry){const p=g.attributes.position,uv:number[]=[];for(let i=0;i<p.count;i++){const k=this.distance/(1.3-p.getZ(i));uv.push((this.painting.width/2+p.getX(i)*k/this.scale)/this.painting.width,1-(this.painting.height/2-((p.getY(i)-1.7)*k+1.7-this.centre)/this.scale)/this.painting.height);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;}
  solid(name:string,outline:Pixel[],depth:number,bulge:number,smooth=true,opacity=1){
    const edge=smooth?new T.CatmullRomCurve3(outline.map(([x,y])=>new T.Vector3(x,y,0)),true,'centripetal').getPoints(Math.max(32,Math.min(64,outline.length*3))).slice(0,-1).map(p=>new T.Vector2(p.x,p.y)):outline.map(p=>new T.Vector2(...p));
    const tris=T.ShapeUtils.triangulateShape(edge,[]),positions:number[]=[];
    const push=(p:T.Vector2,rear:boolean)=>{let dist=Infinity;for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length],delta=b.clone().sub(a),t=T.MathUtils.clamp(p.clone().sub(a).dot(delta)/delta.lengthSq(),0,1);dist=Math.min(dist,p.distanceTo(a.clone().addScaledVector(delta,t)));}const swell=Math.sqrt(T.MathUtils.clamp(dist/Math.max(5,Math.min(this.painting.width,this.painting.height)*.055),0,1));const q=this.point(p.x,p.y,depth+(rear?1:-1)*bulge*(.04+.96*swell));positions.push(q.x,q.y,q.z);};
    const split=(a:T.Vector2,b:T.Vector2,c:T.Vector2,n:number,rear:boolean)=>{if(!n){push(a,rear);push(rear?c:b,rear);push(rear?b:c,rear);return;}const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);split(a,ab,ca,n-1,rear);split(ab,b,bc,n-1,rear);split(ca,bc,c,n-1,rear);split(ab,bc,ca,n-1,rear);};
    for(const [ia,ib,ic]of tris){const a=edge[ia],b=edge[ib],c=edge[ic],positive=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0;split(a,positive?c:b,positive?b:c,2,false);split(a,positive?c:b,positive?b:c,2,true);}
    for(let i=0;i<edge.length;i++)for(let j=0;j<4;j++){const a=edge[i].clone().lerp(edge[(i+1)%edge.length],j/4),b=edge[i].clone().lerp(edge[(i+1)%edge.length],(j+1)/4);push(a,false);push(a,true);push(b,false);push(a,true);push(b,true);push(b,false);}
    const raw=new T.BufferGeometry();raw.setAttribute('position',new T.Float32BufferAttribute(positions,3));this.pigment(raw);const g=mergeVertices(raw);g.computeVertexNormals();raw.dispose();let material=this.paint;
    if(opacity<1){material=this.paint.clone();material.transparent=true;material.opacity=opacity;material.depthWrite=false;material.onBeforeCompile=this.paint.onBeforeCompile;material.customProgramCacheKey=this.paint.customProgramCacheKey;}
    const o=this.mesh(this.group,g,material);o.name=name;return o;
  }
  bead(name:string,x:number,y:number,rx:number,ry:number,depth:number,thickness:number){const centre=this.point(x,y,depth),factor=(depth+1.3)/this.distance,g=new T.SphereGeometry(1,20,12);g.scale(rx*this.scale*factor,ry*this.scale*factor,thickness);g.translate(centre.x,centre.y,centre.z);this.pigment(g);const o=this.mesh(this.group,g,this.paint);o.name=name;return o;}
  stroke(name:string,points:Pixel[],radiusPixels:number,depth:number,material:T.Material=this.paint){
    const curve=new T.CatmullRomCurve3(points.map(([x,y])=>this.point(x,y,depth))),steps=Math.max(18,points.length*7),tube=new T.TubeGeometry(curve,steps,radiusPixels*this.scale*(depth+1.3)/this.distance,8,false),positions=Array.from(tube.attributes.position.array),indices=Array.from(tube.index!.array);
    for(const end of [0,1]){const p=curve.getPointAt(end),normal=curve.getTangentAt(end).multiplyScalar(end?1:-1),centre=positions.length/3;positions.push(p.x,p.y,p.z);for(let i=0;i<8;i++){let a=end*steps*9+i,b=a+1;const av=new T.Vector3().fromArray(positions,a*3).sub(p),bv=new T.Vector3().fromArray(positions,b*3).sub(p);if(av.cross(bv).dot(normal)<0)[a,b]=[b,a];indices.push(centre,a,b);}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(positions.length/3*2),2));tube.dispose();if(material===this.paint)this.pigment(g);const o=this.mesh(this.group,g,material);o.name=name;return o;
  }
  blockPixels(name:string,outline:Pixel[],depth:number,thickness:number){return this.solid(name,outline,depth,thickness,false);}
  height(x:number,z:number){if(!this.painting)return 0;const target=this.centre+(this.painting.height/2-this.painting.height*this.painting.horizon)*this.scale;const slope=Math.max(.02,(1.7-target)/this.distance);return -slope*Math.max(0,-z-3)*T.MathUtils.smoothstep(-z,3,8)+.02*Math.sin(x*.1)*Math.sin(z*.09);}
  override finish(){
    this.group.updateMatrixWorld(true);const buckets=new Map<T.Material,T.Mesh[]>();this.group.traverse(o=>{if(o instanceof T.Mesh&&!(o instanceof T.InstancedMesh)&&o.material instanceof T.MeshStandardMaterial&&!o.userData.keep){const b=buckets.get(o.material)??[];b.push(o);buckets.set(o.material,b);}});
    for(const [m,objects]of buckets){if(objects.length<2)continue;const gs=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();if(!(m instanceof T.MeshStandardMaterial&&m.map))g.deleteAttribute('uv');g.deleteAttribute('color');g.applyMatrix4(o.matrixWorld);if(o.matrixWorld.determinant()<0)for(const attribute of Object.values(g.attributes)){const a=attribute as T.BufferAttribute;for(let i=0;i<a.count;i+=3)for(let c=0;c<a.itemSize;c++){const k=i*a.itemSize+c,j=(i+1)*a.itemSize+c,swap=a.array[k];a.array[k]=a.array[j];a.array[j]=swap;}}return g;});const g=mergeGeometries(gs);if(!g)throw Error('Cannot combine painted geometry');objects.forEach(o=>o.removeFromParent());gs.forEach(g=>g.dispose());this.mesh(this.group,g,m).name='Batched painted volumes';}
  }
}
