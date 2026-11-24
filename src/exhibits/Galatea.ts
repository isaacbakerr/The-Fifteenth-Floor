import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {Artwork} from '../Artwork';
import type {Floor,QualityProfile} from '../Graphics';
import type {Atmosphere} from './World';

const SCALE=13.5/930,CAMERA_Z=1.3,CAMERA_Y=1.7,PLANE_Z=-29,CENTRE_Y=.25;
const DISTANCE=CAMERA_Z-PLANE_Z;
type Bead=[number,number,number,number?];
type Stroke={points:[number,number][];width:number;depth:number};

// Sphere centres and radii studied from the reference. Pigment is sampled over
// each curved surface, rather than assigning one flat colour to each sphere.
const beads:Bead[]=[
  [130,85,38],[268,86,38],[403,93,38],[542,93,40],[676,93,36],
  [185,159,31],[293,161,30],[399,162,28],[461,166,31],[513,166,27],[616,168,29],
  [127,225,38],[180,269,34],[226,218,18],[261,226,42],[318,221,25],[401,229,38],
  [482,223,24],[538,231,38],[573,234,19],[677,235,40],
  [230,305,25],[289,276,30],[334,266,18],[314,306,26],[344,303,14],[358,329,13],
  [396,278,28],[428,309,30],[472,304,25],[505,276,28],[537,277,16],[609,279,26],
  [120,364,38],[181,379,29],[248,345,18],[272,370,39],[307,379,29],[330,402,18],
  [397,371,37],[429,361,20],[450,346,17],[474,329,23],[488,349,12],[518,344,28],
  [563,310,25],[616,387,30],[676,372,40],[478,391,18],[453,380,12],[488,372,11],
  [122,505,42],[183,488,29],[225,479,21],[265,502,41],[311,480,27],[337,468,20],
  [400,502,39],[448,489,16],[480,476,24],[527,509,42],[569,494,16],[616,490,29],[674,507,39],
  [117,642,37],[178,599,29],[231,629,33],[270,641,34],[293,596,27],[330,566,21],
  [355,543,16],[375,524,12],[446,551,17],[480,570,23],[502,612,34],[532,647,39],
  [575,651,26],[617,602,28],[674,655,37],[397,639,34],[430,617,27],[421,590,17],
  [178,708,31],[292,703,29],[400,706,29],[503,712,28],[614,712,28],
  [118,777,38],[257,778,38],[397,781,39],[534,781,38],[674,782,41],
  [214,559,18],[240,551,16],[315,534,20],[335,514,17],[446,519,13],[460,536,13],
];

const strands:{start:[number,number];bend:[number,number];radius:number}[]=[
  {start:[255,356],bend:[263,424],radius:28},
  {start:[300,385],bend:[313,429],radius:23},
  {start:[520,379],bend:[502,437],radius:26},
  {start:[482,407],bend:[463,438],radius:18},
  {start:[267,501],bend:[325,461],radius:33},
  {start:[317,490],bend:[350,456],radius:23},
  {start:[523,506],bend:[461,459],radius:31},
  {start:[474,480],bend:[441,452],radius:22},
  {start:[304,594],bend:[353,489],radius:24},
  {start:[497,608],bend:[453,489],radius:25},
];

const strokes:Stroke[]=[
  // Hair ribbons extend back through the volume, so the portrait can be circled.
  {points:[[274,28],[288,45],[304,42],[321,55],[337,51],[352,61],[372,55],[389,60]],width:3,depth:-30.5},
  {points:[[313,29],[338,34],[358,29],[376,43],[392,38],[414,47],[430,43]],width:3.3,depth:-32},
  {points:[[383,21],[403,26],[414,44],[432,43],[449,58],[467,55],[490,69]],width:3.5,depth:-31.1},
  {points:[[454,20],[467,35],[489,42],[493,56],[478,66]],width:4.1,depth:-30},
  {points:[[556,18],[567,42],[584,55],[589,78],[583,104],[571,118]],width:5.5,depth:-28.9},
  {points:[[584,43],[598,66],[614,82],[625,102],[623,127],[606,139]],width:5,depth:-29.7},
  {points:[[627,101],[643,122],[645,147],[657,161]],width:3.5,depth:-31},
  {points:[[185,120],[204,111],[213,95],[226,88]],width:3.5,depth:-30.6},
  {points:[[331,112],[359,97],[383,94]],width:5.2,depth:-31.5},
  {points:[[342,157],[322,181],[305,193]],width:4.5,depth:-30.2},
  {points:[[364,258],[391,255],[421,263],[451,276],[470,278]],width:4.3,depth:-26.6},
  {points:[[518,307],[539,303],[559,309],[569,320]],width:4.2,depth:-26.5},
  {points:[[646,177],[644,202],[632,223],[630,242]],width:4.7,depth:-29.4},
  {points:[[597,300],[596,322],[579,342],[570,365]],width:5,depth:-28.8},
  {points:[[556,369],[546,400],[554,426],[575,440],[591,458]],width:6,depth:-31},
  {points:[[580,421],[591,437],[600,461],[594,483]],width:4.5,depth:-31.6},
  {points:[[224,326],[214,358],[221,396],[214,430],[198,448]],width:4.6,depth:-30},
  {points:[[160,408],[145,422],[150,437],[134,452],[137,468]],width:2.8,depth:-29.5},
  {points:[[160,443],[149,454],[152,466],[141,480]],width:2.4,depth:-28},
  {points:[[573,536],[576,549],[587,557],[584,570],[591,578]],width:2.9,depth:-27.7},
  {points:[[574,555],[570,568],[578,579],[572,590]],width:2.4,depth:-29},
  {points:[[581,788],[614,775],[641,753],[655,739]],width:6,depth:-27.4},
  {points:[[513,835],[548,827],[580,804],[607,779]],width:8,depth:-26.5},
  {points:[[686,676],[709,685],[733,689],[725,701],[701,690]],width:6.5,depth:-28.6},
  {points:[[707,699],[716,717],[709,739],[716,754],[702,774],[704,790]],width:4.7,depth:-27.6},
  {points:[[112,610],[153,580],[184,559],[210,534]],width:3.2,depth:-29},
  {points:[[153,650],[188,658],[222,680],[257,689]],width:2.8,depth:-29.5},
  {points:[[433,698],[461,685],[479,680]],width:3.8,depth:-29},
  {points:[[395,437],[411,441],[431,450],[452,466]],width:4.2,depth:-32.2},
  {points:[[402,437],[420,437],[442,446],[467,467]],width:3,depth:-33},
];

function point(px:number,py:number,z:number){
  const perspective=(CAMERA_Z-z)/DISTANCE;
  return new T.Vector3((px-400)*SCALE*perspective,CAMERA_Y+(CENTRE_Y+(478-py)*SCALE-CAMERA_Y)*perspective,z);
}
function pigmentUV(p:T.Vector3){
  const projection=DISTANCE/(CAMERA_Z-p.z);
  return new T.Vector2((400+p.x*projection/SCALE)/800,1-(478-((p.y-CAMERA_Y)*projection+CAMERA_Y-CENTRE_Y)/SCALE)/954);
}
function depth(px:number,py:number,r:number){
  const core=Math.exp(-((px-400)**2+(py-437)**2)/7000);
  const nose=Math.exp(-((px-468)**2/3600+(py-342)**2/3800));
  return -29.5-core*(7-Math.min(r,30)*.12)+nose*3.2+(py>570?1.8:0)+.5*Math.sin(px*.027+py*.013);
}

/** Reference-calibrated, walkable disintegration of Gala's portrait. Painted
 * pigment belongs to closed spheres and solid ribbons; no image plane exists. */
export class Galatea implements Floor {
  readonly id='galatea-spheres';readonly floorNumber='16';readonly group=new T.Group();readonly title:string;
  readonly atmosphere:Atmosphere={sky:0x719ba6,horizon:0xa9babb,ground:0x93abb0,sun:0xfff0d2,sunPosition:[-18,24,3],fog:.0008,exposure:.96,extent:35,sunIntensity:1.8,hemisphereIntensity:1.25,environmentIntensity:.4};
  private readonly solids:{centre:T.Vector3;radius:number}[]=[];
  private readonly sculpture:T.Mesh;
  constructor(scene:T.Scene,readonly artwork:Artwork){
    this.title=`Salvador Dalí — ${artwork.title}, ${artwork.year}`;this.group.name=this.title;scene.add(this.group);
    this.atmosphereGeometry();
    const pigment=new T.TextureLoader().load('/textures/galatea-pigment.jpg');pigment.colorSpace=T.SRGBColorSpace;pigment.anisotropy=4;
    const material=new T.MeshStandardMaterial({map:pigment,roughness:.64,metalness:.025});
    // The painting already contains light. Keep its subtle pigment relationships
    // on the front, then let physical light define the sides and rear surfaces.
    material.userData.surfaceDetail=true;material.toneMapped=false;
    material.onBeforeCompile=shader=>{
      shader.vertexShader='varying float paintFacing;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npaintFacing=normal.z;');
      shader.fragmentShader='varying float paintFacing;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(diffuseColor.rgb,outgoingLight,mix(.88,.22,smoothstep(-.15,.8,paintFacing)));\n#include <opaque_fragment>');
    };
    material.customProgramCacheKey=()=> 'galatea-pigment-volume-v1';
    const geometries:T.BufferGeometry[]=[];
    const all:Bead[]=beads.map(p=>[...p]);
    for(const strand of strands){
      const a=new T.Vector2(...strand.start),b=new T.Vector2(...strand.bend),c=new T.Vector2(400,437);let t=.08;
      while(t<.96){const p=a.clone().multiplyScalar((1-t)**2).addScaledVector(b,2*t*(1-t)).addScaledVector(c,t*t);const r=1.5+strand.radius*(1-t)**1.5;
        if(!all.some(([x,y,radius])=>Math.hypot(x-p.x,y-p.y)<(radius+r)*.72))all.push([p.x,p.y,r]);
        t+=Math.max(.035,r*1.25/a.distanceTo(c));
      }
    }
    for(const [px,py,r]of all){
      const z=depth(px,py,r),centre=point(px,py,z),radius=r*SCALE*(CAMERA_Z-z)/DISTANCE;
      const geometry=new T.SphereGeometry(1,r>26?22:r>13?16:12,r>26?14:r>13?10:8);
      geometry.scale(radius,radius,radius);geometry.translate(centre.x,centre.y,centre.z);
      this.projectPigment(geometry);geometries.push(geometry.toNonIndexed());geometry.dispose();this.solids.push({centre,radius});
    }
    for(const stroke of strokes)geometries.push(this.ribbon(stroke));
    const geometry=mergeGeometries(geometries);if(!geometry)throw Error('Cannot combine Galatea portrait');geometries.forEach(g=>g.dispose());
    this.sculpture=new T.Mesh(geometry,material);this.sculpture.name='Gala — reference-matched spherical portrait and hair';this.sculpture.castShadow=this.sculpture.receiveShadow=true;this.group.add(this.sculpture);
    const fragments=material.clone();fragments.onBeforeCompile=(shader,renderer)=>{
      material.onBeforeCompile(shader,renderer);
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float warmPigment=diffuseColor.r-diffuseColor.b*.95;
        float darkPigment=1.-smoothstep(.035,.11,max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b)));
        if(warmPigment<.013&&darkPigment<.5)discard;`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.36,.31,.19),(1.-smoothstep(-.35,.05,paintFacing))*.85);');
    };fragments.customProgramCacheKey=()=> 'galatea-sculpted-pigment-v1';
    const face=this.shell([[269,69],[410,41],[560,58],[621,136],[609,236],[580,325],[559,397],[588,463],[570,539],[531,569],[487,550],[450,498],[411,471],[381,452],[341,477],[314,534],[283,565],[231,557],[209,494],[222,412],[213,334],[220,258],[229,193]],false);
    const shoulders=this.shell([[218,535],[304,497],[366,459],[400,443],[441,477],[497,535],[558,561],[620,598],[676,652],[693,716],[657,754],[535,780],[395,785],[256,777],[144,743],[86,685],[81,637],[134,590]],true);
    const g=mergeGeometries([face,shoulders]);if(!g)throw Error('Cannot combine sculpted Galatea fragments');face.dispose();shoulders.dispose();
    const backing=new T.Mesh(g,fragments);backing.name='Gala — sculpted cheek, neck and shoulder fragments';backing.receiveShadow=true;this.group.add(backing);
    this.group.userData.spheres=all.length;this.group.userData.referenceCamera=[0,CAMERA_Y,CAMERA_Z];
  }
  private projectPigment(g:T.BufferGeometry){const p=g.attributes.position,uvs=[];for(let i=0;i<p.count;i++){const uv=pigmentUV(new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)));uvs.push(uv.x,uv.y);}g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));}
  private shell(outline:[number,number][],torso:boolean){
    const boundary=outline.map(p=>new T.Vector2(...p)),triangles=T.ShapeUtils.triangulateShape(boundary,[]),positions:number[]=[];
    const append=(p:T.Vector2,rear:boolean)=>{
      let edge=Infinity;for(let i=0;i<boundary.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length],delta=b.clone().sub(a),t=T.MathUtils.clamp(p.clone().sub(a).dot(delta)/delta.lengthSq(),0,1);edge=Math.min(edge,p.distanceTo(a.clone().addScaledVector(delta,t)));}
      const rounded=Math.sqrt(T.MathUtils.clamp(edge/(torso?140:110),0,1));
      const head=1.9*Math.exp(-((p.x-457)**2/15000+(p.y-230)**2/19000))+2.6*Math.exp(-((p.x-473)**2/2500+(p.y-340)**2/4400));
      const front=torso?-35.5+rounded*5:-36.5+rounded*(4.5+head),back=(torso?-35.5:-36.5)-rounded*(torso?2.8:3.5)-.12;
      const q=point(p.x,p.y,rear?back:front);positions.push(q.x,q.y,q.z);
    };
    const split=(a:T.Vector2,b:T.Vector2,c:T.Vector2,n:number,rear:boolean)=>{
      if(!n){append(a,rear);append(rear?c:b,rear);append(rear?b:c,rear);return;}
      const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);
      split(a,ab,ca,n-1,rear);split(ab,b,bc,n-1,rear);split(ca,bc,c,n-1,rear);split(ab,bc,ca,n-1,rear);
    };
    for(const [ia,ib,ic]of triangles){const a=boundary[ia],b=boundary[ib],c=boundary[ic];const positive=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0;split(a,positive?c:b,positive?b:c,3,false);split(a,positive?c:b,positive?b:c,3,true);}
    for(let i=0;i<boundary.length;i++)for(let j=0;j<8;j++){
      const a=boundary[i].clone().lerp(boundary[(i+1)%boundary.length],j/8),b=boundary[i].clone().lerp(boundary[(i+1)%boundary.length],(j+1)/8);
      append(a,false);append(a,true);append(b,false);append(a,true);append(b,true);append(b,false);
    }
    const raw=new T.BufferGeometry();raw.setAttribute('position',new T.Float32BufferAttribute(positions,3));this.projectPigment(raw);const smooth=mergeVertices(raw);smooth.computeVertexNormals();raw.dispose();const result=smooth.toNonIndexed();smooth.dispose();return result;
  }
  private ribbon(stroke:Stroke){
    const points=stroke.points.map(([x,y])=>new T.Vector3(x,y,0)),curve=new T.CatmullRomCurve3(points),steps=Math.max(24,points.length*9),sides=6,positions:number[]=[],indices:number[]=[];
    for(let j=0;j<=steps;j++){
      const t=j/steps,p=curve.getPoint(t),tangent=curve.getTangent(t),cross=new T.Vector2(-tangent.y,tangent.x).normalize(),width=stroke.width*(.18+.82*Math.sin(Math.PI*t)**.3);
      for(let k=0;k<=sides;k++){
        const a=k/sides*Math.PI*2,z=stroke.depth+Math.sin(t*Math.PI*2)*.3+Math.sin(a)*width*SCALE*.45;
        const q=point(p.x+cross.x*Math.cos(a)*width,p.y+cross.y*Math.cos(a)*width,z);positions.push(q.x,q.y,q.z);
        if(j<steps&&k<sides){const n=j*(sides+1)+k;indices.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();this.projectPigment(g);const result=g.toNonIndexed();g.dispose();return result;
  }
  private atmosphereGeometry(){
    const sky=new T.Mesh(new T.SphereGeometry(300,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new T.Color(0x7798a2)},bottom:{value:new T.Color(0x9ab4b8)}},vertexShader:'varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 d;void main(){vec3 n=normalize(d);float h=smoothstep(-.12,.7,n.y);vec3 c=mix(bottom,top,h);float glow=exp(-pow(n.x*2.4,2.)-pow((n.y+.06)*5.,2.))*max(0.,-n.z);c=mix(c,vec3(.78,.77,.56),glow*.2);gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}'}));sky.name='Galatea — continuous blue and pearl atmosphere';sky.renderOrder=-1000;this.group.add(sky);
    const g=new T.PlaneGeometry(160,160,48,72);g.rotateX(-Math.PI/2);g.translate(0,0,-25);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,this.height(p.getX(i),p.getZ(i)));g.computeVertexNormals();
    const ground=new T.Mesh(g,new T.ShaderMaterial({uniforms:{blue:{value:new T.Color(0x8faab0)},pearl:{value:new T.Color(0xcdcba4)}},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 blue;uniform vec3 pearl;varying vec3 p;void main(){float light=exp(-pow(p.x/10.,2.)-pow((p.z+32.)/14.,2.));vec3 c=mix(blue,pearl,light*.58);float grain=fract(sin(dot(floor(p.xz*80.),vec2(12.9898,78.233)))*43758.5453);c+=(grain-.5)*.003;gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}'}));ground.name='Galatea — seamless descending walkable colour field';this.group.add(ground);
  }
  height(_x:number,z:number){return -5.5*T.MathUtils.smoothstep(-z,3,25);}
  blocked(x:number,z:number){
    if(Math.abs(x)>36||z<-58||z>23)return true;
    const foot=this.height(x,z),head=foot+1.7;
    const bodyY=-3,dy=bodyY<foot+.15?bodyY-foot-.15:bodyY>head?bodyY-head:0;
    if(Math.abs(dy)<2.5){const width=Math.sqrt(1-(dy/2.5)**2);if((x/(4.6*width+.23))**2+((z+33.5)/(3.8*width+.23))**2<1)return true;}
    return this.solids.some(s=>{const dy=s.centre.y<foot+.15?s.centre.y-foot-.15:s.centre.y>head?s.centre.y-head:0;if(Math.abs(dy)>s.radius+.18)return false;const radius=Math.sqrt(Math.max(0,s.radius*s.radius-dy*dy))+.23;return Math.hypot(x-s.centre.x,z-s.centre.z)<radius;});
  }
  setQuality(profile:QualityProfile){this.sculpture.castShadow=profile.name!=='battery';}
}
