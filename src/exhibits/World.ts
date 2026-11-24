import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {Artwork} from '../Artwork';
import type {Floor} from '../Graphics';

export type XYZ=[number,number,number];
export interface Atmosphere {sky:number;horizon:number;ground:number;sun:number;sunPosition:XYZ;fog:number;exposure?:number;extent?:number;sunIntensity?:number;hemisphereIntensity?:number;environmentIntensity?:number}
export const coastal:Atmosphere={sky:0x3a849d,horizon:0xd5dfcb,ground:0x85734f,sun:0xffe4b3,sunPosition:[-24,24,12],fog:.003,extent:52};
export const marble:Atmosphere={...coastal,sky:0x5c9faf,horizon:0xe1d9b7,ground:0xc2b58e};
export const night:Atmosphere={...coastal,sky:0x092a47,horizon:0x47768b,ground:0x504c42,sun:0xc1dbe6,sunPosition:[-30,27,8],fog:.004};

/** Shared construction tools, not a shared composition: each floor builds its own tableau. */
export class World implements Floor {
  readonly group=new T.Group();readonly title:string;
  readonly obstacles:{x:number;z:number;rx:number;rz:number}[]=[];
  readonly time={value:0};
  constructor(scene:T.Scene,readonly id:string,readonly floorNumber:string,readonly artwork:Artwork,readonly atmosphere:Atmosphere){
    this.title=`${artwork.artist} — ${artwork.title}, ${artwork.year}`;this.group.name=this.title;scene.add(this.group);
    const sky=this.mesh(this.group,new T.SphereGeometry(320,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new T.Color(atmosphere.sky)},bottom:{value:new T.Color(atmosphere.horizon)}},vertexShader:'varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 d;void main(){vec3 v=normalize(d);vec3 c=mix(bottom,top,pow(smoothstep(-.025,.65,v.y),.6));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));sky.name='Atmospheric sky';sky.castShadow=sky.receiveShadow=false;sky.renderOrder=-1000;
    const geometry=new T.PlaneGeometry(140,150,64,72);geometry.rotateX(-Math.PI/2);geometry.translate(0,0,-22);const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,this.height(p.getX(i),p.getZ(i)));geometry.computeVertexNormals();this.mesh(this.group,geometry,this.mat(atmosphere.ground)).name='Walkable landscape';
  }
  mat(color:number,roughness=.78,metalness=0){return new T.MeshStandardMaterial({color,roughness,metalness});}
  mesh(parent:T.Object3D,g:T.BufferGeometry,m:T.Material){const o=new T.Mesh(g,m);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  ell(parent:T.Object3D,p:XYZ,s:XYZ,m:T.Material){const o=this.mesh(parent,new T.SphereGeometry(1,24,16),m);o.position.set(...p);o.scale.set(...s);return o;}
  block(parent:T.Object3D,size:XYZ,p:XYZ,m:T.Material){const o=this.mesh(parent,new T.BoxGeometry(...size),m);o.position.set(...p);return o;}
  rod(parent:T.Object3D,points:XYZ[],radius:number,m:T.Material,segments=24){return this.mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,radius,8,false),m);}
  limb(parent:T.Object3D,a:XYZ,b:XYZ,r1:number,r2:number,m:T.Material){const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av);const o=this.mesh(parent,new T.CylinderGeometry(r2,r1,delta.length(),12),m);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
  profile(parent:T.Object3D,outline:[number,number][],depth:number,m:T.Material){const shape=new T.Shape(outline.map(p=>new T.Vector2(...p)));const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:Math.min(.18,depth*.15),bevelThickness:Math.min(.18,depth*.15),curveSegments:16});g.translate(0,0,-depth/2);g.computeVertexNormals();return this.mesh(parent,g,m);}
  obstacle(x:number,z:number,rx:number,rz=rx){this.obstacles.push({x,z,rx,rz});}
  contact(x:number,z:number,rx:number,rz:number,opacity=.25){const o=this.mesh(this.group,new T.PlaneGeometry(2,2),new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{opacity:{value:opacity}},vertexShader:'varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float opacity;varying vec2 q;void main(){float a=pow(max(0.,1.-length((q-.5)*2.)),2.)*opacity;gl_FragColor=vec4(.035,.028,.02,a);}'}));o.rotation.x=-Math.PI/2;o.scale.set(rx,rz,1);o.position.set(x,this.height(x,z)+.018,z);o.castShadow=o.receiveShadow=false;}
  sea(z=-78,color=0x81b9bd){
    const material=this.mat(color,.24,.28);material.onBeforeCompile=shader=>{
      shader.uniforms.seaTime=this.time;
      shader.vertexShader='varying vec3 seaPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nseaPosition=(modelMatrix*vec4(position,1.)).xyz;');
      shader.fragmentShader='uniform float seaTime;varying vec3 seaPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(sin(seaPosition.x*1.4+seaTime*.18)*.025,cos(seaPosition.z*1.8-seaTime*.14)*.018,0.));');
    };
    const o=this.mesh(this.group,new T.PlaneGeometry(300,200,1,1),material);o.rotation.x=-Math.PI/2;o.position.set(0,-.16,z-100);o.castShadow=false;return o;
  }
  rock(parent:T.Object3D,p:XYZ,s:XYZ,m:T.Material,seed=1){const g=new T.IcosahedronGeometry(1,2),a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),n=1+.11*Math.sin(x*7+seed)*Math.cos(z*9+y*8);a.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();const o=this.mesh(parent,g,m);o.position.set(...p);o.scale.set(...s);return o;}
  person(parent:T.Object3D,p:XYZ,scale:number,robe:T.Material,pose:'standing'|'kneeling'|'seated'='standing'){
    const root=new T.Group();root.position.set(...p);root.scale.setScalar(scale);parent.add(root);const flesh=this.mat(0xc9a782,.75),hair=this.mat(0x4b352a);
    const crouch=pose==='standing'?0:pose==='seated'?.43:.6;
    const body=this.mesh(root,new T.CylinderGeometry(.22,.43,1.03-crouch,24),robe);body.position.y=.77-crouch*.5;
    this.ell(root,[0,1.43-crouch,0],[.18,.25,.19],flesh);this.ell(root,[0,1.52-crouch,-.06],[.185,.18,.15],hair);
    for(const side of [-1,1]){this.limb(root,[side*.22,1.16-crouch,0],[side*.39,.81-crouch,.17],.1,.075,robe);this.limb(root,[side*.39,.81-crouch,.17],[side*.18,.72-crouch,.32],.075,.05,flesh);this.ell(root,[side*.18,.72-crouch,.32],[.065,.08,.065],flesh);}
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2;this.rod(root,[[Math.cos(a)*.23,1.1-crouch,Math.sin(a)*.23],[Math.cos(a)*.3,.53-crouch*.4,Math.sin(a)*.3],[Math.cos(a)*.42,.25,Math.sin(a)*.42]],.012,robe,12);}
    return root;
  }
  finish(){
    this.group.updateMatrixWorld(true);const buckets=new Map<T.Material,T.Mesh[]>();this.group.traverse(o=>{if(o instanceof T.Mesh&&!(o instanceof T.InstancedMesh)&&o.material instanceof T.MeshStandardMaterial&&!o.userData.keep){const b=buckets.get(o.material)??[];b.push(o);buckets.set(o.material,b);}});
    for(const [m,objects]of buckets){if(objects.length<2)continue;const gs=objects.map(o=>{
      const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.deleteAttribute('uv');g.deleteAttribute('color');g.applyMatrix4(o.matrixWorld);
      // Baking a reflection into vertices also reverses the triangle winding.
      if(o.matrixWorld.determinant()<0)for(const attribute of Object.values(g.attributes)){const a=attribute as T.BufferAttribute;for(let i=0;i<a.count;i+=3)for(let c=0;c<a.itemSize;c++){const offset=i*a.itemSize+c,next=(i+1)*a.itemSize+c,swap=a.array[offset];a.array[offset]=a.array[next];a.array[next]=swap;}}
      return g;
    });const g=mergeGeometries(gs);if(!g)throw Error('Cannot combine tableau geometry');objects.forEach(o=>o.removeFromParent());gs.forEach(g=>g.dispose());const o=this.mesh(this.group,g,m);o.name='Batched modeled forms';}
  }
  height(x:number,z:number){return .035*Math.sin(x*.15)*Math.sin(z*.12)*T.MathUtils.smoothstep(-z,5,18);}
  blocked(x:number,z:number){return Math.abs(x)>51||z<-79||z>24||this.obstacles.some(o=>((x-o.x)/(o.rx+.24))**2+((z-o.z)/(o.rz+.24))**2<1);}
  update(_dt:number,time:number){this.time.value=time;}
}
