import * as T from 'three';
import {ARTWORKS} from '../Artwork';
import {Reflector} from 'three/examples/jsm/objects/Reflector.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {box} from '../shared';
import type {WalkableWorld} from '../Controls';
import type {QualityProfile} from '../Graphics';

const vector=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const material=(color:number,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const gold=material(0xb59838,.32,.72),silver=material(0x768b85,.32,.7),wood=material(0x53584a,.96);
const skin=material(0xc4b6a0,.91),darkSkin=material(0x766447,.96),ochre=material(0x9c702f,.96);

function mesh(parent:T.Object3D,geometry:T.BufferGeometry,mat:T.Material){const object=new T.Mesh(geometry,mat);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;}
function tube(parent:T.Object3D,points:T.Vector3[],radius:number,mat:T.Material,segments=32){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,radius,8,false),mat);}
function sphere(parent:T.Object3D,position:T.Vector3,scale:T.Vector3,mat:T.Material){const object=mesh(parent,new T.SphereGeometry(1,24,16),mat);object.position.copy(position);object.scale.copy(scale);return object;}

/** A watch is a curved, thick, closed surface; its dial is a local procedural
 * texture. No part of the original painting is used as a scenery billboard. */
function watch(parent:T.Object3D,name:string,shape:(u:number,v:number)=>T.Vector3,rim:T.Material,blue:string){
  const group=new T.Group();group.name=name;parent.add(group);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const c=canvas.getContext('2d')!;const grad=c.createRadialGradient(450,360,0,512,512,520);grad.addColorStop(0,blue);grad.addColorStop(1,'#698e85');c.fillStyle=grad;c.fillRect(0,0,1024,1024);
  // Fixed grain, fine concentric rings, minute marks and hand-drawn numerals.
  let seed=271;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<6500;i++){c.fillStyle=`rgba(20,34,30,${random()*.055})`;c.fillRect(random()*1024,random()*1024,2,2);}
  c.strokeStyle='#273d37';c.lineWidth=2;c.beginPath();c.arc(512,512,458,0,Math.PI*2);c.stroke();
  c.fillStyle='#1f3734';c.textAlign='center';c.textBaseline='middle';c.font='61px Georgia';
  for(let i=0;i<60;i++){const a=i/60*Math.PI*2;const inner=i%5===0?426:443;c.beginPath();c.moveTo(512+Math.sin(a)*inner,512-Math.cos(a)*inner);c.lineTo(512+Math.sin(a)*454,512-Math.cos(a)*454);c.stroke();}
  for(let i=1;i<=12;i++){const a=i/12*Math.PI*2;c.fillText(String(i),512+Math.sin(a)*369,512-Math.cos(a)*369);}
  c.font='italic 18px Georgia';c.fillStyle='#34504a';c.fillText('1931',512,655);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  const rings=28,segments=96,positions:number[]=[],uvs:number[]=[],indices:number[]=[],backs:number[]=[];
  function normal(u:number,v:number){const a=shape(u+.002,v).sub(shape(u-.002,v)),b=shape(u,v+.002).sub(shape(u,v-.002));return b.cross(a).normalize();}
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
    const a=i/segments*Math.PI*2,r=j/rings,u=Math.cos(a)*r,v=Math.sin(a)*r;
    const p=shape(u,v),n=normal(u,v);positions.push(p.x,p.y,p.z);uvs.push((u+1)/2,(1-v)/2);p.addScaledVector(n,-.035);backs.push(p.x,p.y,p.z);
    if(j<rings&&i<segments){const k=j*(segments+1)+i;indices.push(k,k+segments+1,k+1,k+1,k+segments+1,k+segments+2);}
  }
  for(let i=0;i<indices.length;i+=3){const swap=indices[i+1];indices[i+1]=indices[i+2];indices[i+2]=swap;}
  const front=new T.BufferGeometry();front.setAttribute('position',new T.Float32BufferAttribute(positions,3));front.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));front.setIndex(indices);front.computeVertexNormals();
  mesh(group,front,new T.MeshStandardMaterial({map:texture,roughness:.72,side:T.DoubleSide}));
  const back=front.clone();back.setIndex([...indices].reverse());back.setAttribute('position',new T.Float32BufferAttribute(backs,3));back.computeVertexNormals();mesh(group,back,rim);
  const engraving:T.Vector3[]=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,u=Math.cos(a)*.8,v=Math.sin(a)*.8;engraving.push(shape(u,v).addScaledVector(normal(u,v),-.04));}
  mesh(group,new T.TubeGeometry(new T.CatmullRomCurve3(engraving),100,.005,6,false),material(0x586b61,.45,.5));
  const edge:T.Vector3[]=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;edge.push(shape(Math.cos(a),Math.sin(a)));}
  mesh(group,new T.TubeGeometry(new T.CatmullRomCurve3(edge),160,.026,10,false),rim);
  const handMaterial=material(0x172d29,.44,.5);
  for(const [a,length,width]of [[2.55,.72,.012],[-.9,.53,.018]]){const points=[];for(let i=0;i<=30;i++){const r=i/30*length,u=Math.sin(a)*r,v=-Math.cos(a)*r;points.push(shape(u,v).addScaledVector(normal(u,v),.016));}tube(group,points,width,handMaterial,40);}
  sphere(group,shape(0,0).addScaledVector(normal(0,0),.025),vector(.032,.032,.032),rim);
  const crown=shape(0,-1.08);sphere(group,crown,vector(.075,.04,.045),rim);
  return group;
}

function taperedBranch(parent:T.Object3D,points:T.Vector3[],start:number,end:number){
  const curve=new T.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(60,false),positions:number[]=[],indices:number[]=[];
  for(let j=0;j<=60;j++){const p=curve.getPointAt(j/60),r=T.MathUtils.lerp(start,end,j/60);for(let i=0;i<=12;i++){const a=i/12*Math.PI*2,irregular=1+.07*Math.sin(j*1.7+i*3.1);const v=p.clone().addScaledVector(frames.normals[j],Math.cos(a)*r*irregular).addScaledVector(frames.binormals[j],Math.sin(a)*r*irregular);positions.push(v.x,v.y,v.z);if(j<60&&i<12){const k=j*13+i;indices.push(k,k+1,k+13,k+1,k+14,k+13);}}}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();mesh(parent,geometry,wood);
}

const formOutline=[vector(.38,0,-3.65),vector(.35,0,-4.15),vector(.7,0,-4.72),vector(1.08,0,-5.42),vector(1.55,0,-5.65),vector(2.25,0,-5.7),vector(3.7,0,-5.9),vector(3.1,0,-5.25),vector(2.0,0,-4.95),vector(1.9,0,-4.5),vector(1.5,0,-4.25),vector(1.1,0,-3.55),vector(.8,0,-3.3)];
function distanceToBoundary(x:number,z:number){let d=Infinity;for(let i=0;i<formOutline.length;i++){const a=formOutline[i],b=formOutline[(i+1)%formOutline.length],dx=b.x-a.x,dz=b.z-a.z,t=T.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);d=Math.min(d,Math.hypot(x-a.x-dx*t,z-a.z-dz*t));}return d;}
function formHeight(x:number,z:number){const edge=T.MathUtils.smoothstep(distanceToBoundary(x,z),0,.42),hump=.78*Math.exp(-((x-1.4)**2/.8+(z+5.05)**2/1.1)),head=.34*Math.exp(-((x-.75)**2/.5+(z+3.9)**2/.55));return .035+edge*(hump+head+.08);}
function sleepingForm(parent:T.Object3D){
  const contour=new T.CatmullRomCurve3(formOutline,true,'catmullrom',.2).getPoints(180);contour.pop();
  const center=vector(1.25,0,-4.85),positions:number[]=[],indices:number[]=[];const rings=34,n=contour.length;
  for(let j=0;j<=rings;j++)for(let i=0;i<=n;i++){const point=center.clone().lerp(contour[i%n],j/rings);point.y=formHeight(point.x,point.z);positions.push(point.x,point.y,point.z);if(j<rings&&i<n){const k=j*(n+1)+i;indices.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  mesh(parent,geometry,new T.MeshStandardMaterial({color:0xc9bda9,roughness:.95,side:T.DoubleSide}));
  // The closed lid and long lashes follow the surface of the actual sculpt.
  const eyelid:T.Vector3[]=[];
  for(let i=0;i<=32;i++){const t=i/32,x=.62+t*.45,z=-3.77-Math.sin(t*Math.PI)*.22;eyelid.push(vector(x,formHeight(x,z)+.008,z));}
  const lashes=material(0x51402d,.9);tube(parent,eyelid,.009,lashes,48);
  for(let i=1;i<27;i++){const p=eyelid[Math.min(31,i)],length=.19+.12*Math.sin(i/27*Math.PI);tube(parent,[p.clone(),p.clone().add(vector(-.035,.01,length*.4)),p.clone().add(vector(-.09,-.035,length))],.0045,lashes,10);}
  const lip=[vector(.47,.05,-3.75),vector(.55,.09,-3.55),vector(.78,.07,-3.36)];tube(parent,lip,.016,darkSkin,32);
  sphere(parent,vector(1.05,.055,-3.55),vector(.2,.045,.12),darkSkin);
  const clockShape=(u:number,v:number)=>{const angle=-.3,x=1.31+(u*Math.cos(angle)-v*Math.sin(angle))*.61,z=-4.92+(u*Math.sin(angle)+v*Math.cos(angle))*.59;return vector(x,formHeight(x,z)+.055,z);};
  watch(parent,'Soft silver watch over the sleeping form',clockShape,silver,'#99beb4');
}

function orangeWatch(parent:T.Object3D){
  const group=new T.Group();group.name='Closed orange watch with ants';group.position.set(-1.82,.7,-3.03);group.rotation.y=-.4;parent.add(group);
  const copper=material(0xb86617,.34,.6);sphere(group,vector(0,0,0),vector(.39,.068,.33),copper);
  const ring=new T.Mesh(new T.TorusGeometry(.342,.015,12,72),gold);ring.rotation.x=Math.PI/2;ring.scale.y=.89;ring.position.y=.036;group.add(ring);
  sphere(group,vector(.38,.008,-.04),vector(.075,.045,.045),gold);
  const black=material(0x131712,.4,.25);
  for(let i=0;i<24;i++){
    const a=i*2.39996,r=.29*Math.sqrt((i+.5)/24),x=Math.cos(a)*r,z=Math.sin(a)*r*.83;
    const ant=new T.Group();ant.position.set(x,.068,z);ant.rotation.y=i*1.71;group.add(ant);
    sphere(ant,vector(0,.005,.018),vector(.011,.009,.019),black);sphere(ant,vector(0,.005,-.009),vector(.007,.007,.01),black);sphere(ant,vector(0,.007,-.025),vector(.009,.009,.009),black);
    for(let k=0;k<3;k++)for(const side of [-1,1])tube(ant,[vector(0,.005,-.016+k*.014),vector(side*.018,.01,-.025+k*.021),vector(side*.028,-.003,-.033+k*.029)],.0017,black,5);
    for(const side of [-1,1])tube(ant,[vector(side*.004,.008,-.029),vector(side*.012,.012,-.045),vector(side*.017,.008,-.047)],.0012,black,4);
  }
}

function cliffs(parent:T.Object3D){
  const rockColors=[0x987d4d,0xb8914b,0xc6a45c,0xa58a57,0x6c7567,0xd0ac60].map(c=>material(c,.95));
  // Closed, irregular rock volumes, with vertical fissures and a receding ridge.
  const chunks=[ [6,-31,4.8,3.4,4],[9.5,-33,5,4.1,5],[13,-36,5.8,4.4,6],[17,-39,6,4.7,7],[21,-43,6.5,5,8],[26,-47,8,4.6,9] ];
  chunks.forEach(([x,z,w,h,d],index)=>{
    const sides=18,positions:number[]=[],colors:number[]=[],indices:number[]=[];
    const rings=5;
    for(let j=0;j<=rings;j++)for(let i=0;i<sides;i++){
      const a=i/sides*Math.PI*2,level=j/rings,taper=1-.28*level+Math.sin(i*2.1+j)*.08;
      const xx=x+Math.cos(a)*w*.55*taper,zz=z+Math.sin(a)*d*.5*taper,yy=j===0?-.2:h*level*(.9+.1*Math.sin(i*3.7+index));positions.push(xx,yy,zz);
      const color=new T.Color(rockColors[(i+index+j)%rockColors.length].color);color.multiplyScalar(.82+.18*Math.sin(i*7.3)**2);colors.push(color.r,color.g,color.b);
      if(j<rings){const k=j*sides+i,n=j*sides+(i+1)%sides;indices.push(k,n,k+sides,n,n+sides,k+sides);}
    }
    positions.push(x,h*.93,z);colors.push(.35,.27,.14);const top=positions.length/3-1;
    for(let i=0;i<sides;i++)indices.push(top,rings*sides+i,rings*sides+(i+1)%sides);
    for(let k=0;k<indices.length;k+=3){const swap=indices[k+1];indices[k+1]=indices[k+2];indices[k+2]=swap;}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();mesh(parent,g,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));

  });
}

export class PersistenceOfMemory implements WalkableWorld {
  readonly artwork=ARTWORKS['persistence-of-memory'];
  private mirror?:Reflector;private simpleSea?:T.Mesh;
  readonly id='persistence-of-memory';readonly floorNumber='11';readonly title='Salvador Dalí — The Persistence of Memory, 1931';
  readonly group=new T.Group();
  constructor(scene:T.Scene){
    this.group.name='The Persistence of Memory — explorable world';scene.add(this.group);
    const ground=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
    ground.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 vGround;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=(modelMatrix*vec4(position,1.)).xyz;');
      shader.fragmentShader='varying vec3 vGround;\nfloat grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat warmth=(1.-smoothstep(-32.,-4.,vGround.z));\nvec3 earth=mix(vec3(.035,.022,.015),vec3(.24,.145,.045),warmth);\nfloat fine=grain(floor(vGround.xz*180.));float broad=grain(floor(vGround.xz*5.));\ndiffuseColor.rgb*=earth*(.91+.12*fine+.06*broad);');
    };
    const earth=mesh(this.group,new T.PlaneGeometry(190,112),ground);earth.rotation.x=-Math.PI/2;earth.position.set(0,-.006,24);
    const sea=new Reflector(new T.PlaneGeometry(360,300),{color:0x8daba4,textureWidth:768,textureHeight:768,clipBias:.003,multisample:0});this.mirror=sea;sea.name='Still pale sea';sea.rotation.x=-Math.PI/2;sea.position.set(0,-.055,-182);this.group.add(sea);
    this.simpleSea=mesh(this.group,new T.PlaneGeometry(360,300),new T.MeshStandardMaterial({color:0x8daba4,roughness:.27,metalness:.32}));this.simpleSea.rotation.x=-Math.PI/2;this.simpleSea.position.copy(sea.position);this.simpleSea.castShadow=false;
    // Narrow mineral edge connects the actual ground to the water.
    box(this.group,190,.08,.25,0,-.045,-32,material(0x9e956b));
    const platform=mesh(this.group,new RoundedBoxGeometry(2.7,.65,3.7,3,.035),ochre);platform.position.set(-2.25,.325,-4.5);
    const bevel=box(this.group,2.76,.035,3.74,-2.25,.665,-4.5,material(0xa78342));bevel.name='Platform top';
    box(this.group,6,.13,4.3,-6,.055,-18,material(0x347f80,.4,.12));
    const tree=new T.Group();tree.name='Bare olive tree';this.group.add(tree);
    taperedBranch(tree,[vector(-2.5,.67,-5.55),vector(-2.38,1.1,-5.6),vector(-2.3,1.72,-5.7),vector(-2.32,2.2,-5.76),vector(-2.33,2.65,-5.75)],.15,.085);
    taperedBranch(tree,[vector(-2.31,1.72,-5.7),vector(-1.85,1.93,-5.8),vector(-1.35,2.1,-5.88),vector(-.7,2.08,-5.92),vector(-.18,2.12,-5.9)],.09,.022);
    taperedBranch(tree,[vector(-1.84,1.93,-5.8),vector(-1.6,2.2,-5.84),vector(-1.32,2.48,-5.8)],.045,.009);
    for(let i=0;i<5;i++){const a=i*1.4;taperedBranch(tree,[vector(-2.5,.72,-5.55),vector(-2.5+Math.cos(a)*.25,.69,-5.55+Math.sin(a)*.2),vector(-2.5+Math.cos(a)*.55,.685,-5.55+Math.sin(a)*.45)],.075,.008);}
    const cap=mesh(tree,new T.CircleGeometry(.084,20),material(0x302e24));cap.rotation.x=-Math.PI/2;cap.position.set(-2.33,2.651,-5.75);
    watch(this.group,'Soft watch folded over the branch',(u,v)=>vector(-1.0+u*.35*(1-.3*v),2.09-.48-v*.5-.1*Math.max(0,v)*(1-u*u),-5.85+.13+.2*(1-v*v)+.07*u*u),silver,'#78a7a3');
    watch(this.group,'Gold watch melting over the ochre platform',(u,v)=>{const x=-1.15+u*.52;return vector(x,.72-Math.pow(Math.max(0,(x+.92)/.29),1.1)*.63,-3.45+v*.58);},gold,'#48a6ad');
    orangeWatch(this.group);sleepingForm(this.group);cliffs(this.group);
    // A few small stones give the distant shoreline physical scale.
    const pebbleMaterial=material(0x8b805c);
    for(let i=0;i<24;i++){const x=-12+Math.sin(i*7.41)*18,z=-17-(i*3.7)%13;if(x>-5&&x<5)continue;const rock=mesh(this.group,new T.DodecahedronGeometry(.06+(i%4)*.05),pebbleMaterial);rock.position.set(x,.025,z);rock.scale.y=.55;rock.rotation.y=i;}
    this.batchDetails();
  }
  /** The ants, branch rings and metalwork stay fully modeled in a few draws. */
  private batchDetails(){
    this.group.updateMatrixWorld(true);const buckets=new Map<T.MeshStandardMaterial,T.Mesh[]>();
    this.group.traverse(object=>{if(object instanceof T.Mesh&&object.material instanceof T.MeshStandardMaterial&&!object.material.map){const bucket=buckets.get(object.material)??[];bucket.push(object);buckets.set(object.material,bucket);}});
    for(const [mat,objects]of buckets){if(objects.length<2)continue;const geometries=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.deleteAttribute('uv');g.applyMatrix4(o.matrixWorld);return g;});const combined=mergeGeometries(geometries);if(!combined)throw Error('Cannot batch clock-shore details');objects.forEach(o=>o.removeFromParent());geometries.forEach(g=>g.dispose());mesh(this.group,combined,mat).name='Solid clock-shore details';}
  }
  setQuality(profile:QualityProfile){if(this.mirror)this.mirror.visible=profile.reflections;if(this.simpleSea)this.simpleSea.visible=!profile.reflections;}
  height(_x:number,_z:number){return 0;}
  blocked(x:number,z:number){
    if(Math.abs(x)>34||z>24||z<-31.45)return true;
    const r=.23;
    if(x>-3.6-r&&x<-.9+r&&z>-6.35-r&&z<-2.65+r)return true;
    if(x>-9-r&&x<-3+r&&z>-20.15-r&&z<-15.85+r)return true;
    // Polygon collision around the sculpture, with radius clearance at its edge.
    let inside=false;for(let i=0,j=formOutline.length-1;i<formOutline.length;j=i++){
      const a=formOutline[i],b=formOutline[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
    }
    if(inside||distanceToBoundary(x,z)<r)return true;
    if(x>3.4&&z<-27)return true;
    return false;
  }
}

export function addSky(scene:T.Scene){
  const sky=new T.Mesh(new T.SphereGeometry(400,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{horizon:{value:new T.Color(0xd6cf92)},zenith:{value:new T.Color(0x216e88)}},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 horizon;uniform vec3 zenith;varying vec3 vDirection;void main(){float h=normalize(vDirection).y;vec3 color=mix(horizon,zenith,smoothstep(-.015,.16,h));gl_FragColor=vec4(color,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}',fog:false}));sky.name='Open painted sky';scene.add(sky);return sky;
}
