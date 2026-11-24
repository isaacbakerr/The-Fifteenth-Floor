import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const SCALE=18/796,DISTANCE=37.3,EYE_Y=1.7,EYE_Z=1.3,CENTRE_Y=-.25;
type XY=[number,number];
type Control=[number,number,number];
export interface Stilt {a:T.Vector3;b:T.Vector3;radius:number}
export function elephantPoint(x:number,y:number,z:number){const k=(EYE_Z-z)/DISTANCE;return new T.Vector3((x-500)*SCALE*k,EYE_Y+(CENTRE_Y+(398-y)*SCALE-EYE_Y)*k,z);}

/** Anatomical volumes and bent bone-like stilts calibrated to the actual canvas.
 * Every painted mark is attached to geometry; there is no scenery image plane. */
export function buildElephantSculptures(parent:T.Group,height:(x:number,z:number)=>number){
  const texture=new T.TextureLoader().load('/textures/elephants-pigment.jpg');texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  const pigment=new T.MeshStandardMaterial({map:texture,roughness:.78,metalness:.025});pigment.toneMapped=false;pigment.userData.surfaceDetail=true;
  pigment.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float pigmentBone;varying float elephantBone;varying float elephantFacing;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nelephantFacing=normal.z;elephantBone=pigmentBone;');
    shader.fragmentShader='varying float elephantBone;varying float elephantFacing;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float redSpill=step(.18,diffuseColor.r)*step(diffuseColor.g*3.1,diffuseColor.r)*(1.-step(.12,diffuseColor.g));
      float goldSpill=step(diffuseColor.g*1.5,diffuseColor.r)*step(diffuseColor.b*3.,diffuseColor.g)*elephantBone;
      diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.28,.20,.13),vec3(.53,.41,.25),elephantBone),max(redSpill,goldSpill));`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(diffuseColor.rgb,outgoingLight,mix(.85,.28,smoothstep(-.15,.8,elephantFacing)));\n#include <opaque_fragment>');
  };pigment.customProgramCacheKey=()=> 'elephants-pigment-volume-v1';
  const legs:Stilt[]=[],geometries:T.BufferGeometry[]=[],gold=new T.MeshStandardMaterial({color:0xab8b45,roughness:.53,metalness:.45}),ivory=new T.MeshStandardMaterial({color:0xc5b28b,roughness:.72});
  function uv(g:T.BufferGeometry){const p=g.attributes.position,coords:number[]=[];for(let i=0;i<p.count;i++){const k=DISTANCE/(EYE_Z-p.getZ(i));coords.push((500+p.getX(i)*k/SCALE)/1000,1-(398-((p.getY(i)-EYE_Y)*k+EYE_Y-CENTRE_Y)/SCALE)/796);}g.setAttribute('uv',new T.Float32BufferAttribute(coords,2));}
  function collect(g:T.BufferGeometry,bone=false){uv(g);g.setAttribute('pigmentBone',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(bone?1:0),1));const raw=g.index?g.toNonIndexed():g.clone();geometries.push(raw);g.dispose();}
  function volume(outline:XY[],z:number,thickness:number,smooth=true){
    const edge=smooth?new T.CatmullRomCurve3(outline.map(([x,y])=>new T.Vector3(x,y,0)),true,'centripetal').getPoints(64).slice(0,-1).map(p=>new T.Vector2(p.x,p.y)):outline.map(p=>new T.Vector2(...p));
    const triangles=T.ShapeUtils.triangulateShape(edge,[]),positions:number[]=[];
    function push(p:T.Vector2,rear:boolean){
      let distance=Infinity;for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length],delta=b.clone().sub(a),t=T.MathUtils.clamp(p.clone().sub(a).dot(delta)/delta.lengthSq(),0,1);distance=Math.min(distance,p.distanceTo(a.clone().addScaledVector(delta,t)));}
      const rounded=Math.sqrt(T.MathUtils.clamp(distance/(smooth?22:7),0,1)),depth=thickness*(.025+.975*rounded),point=elephantPoint(p.x,p.y,z+(rear?-depth:depth));positions.push(point.x,point.y,point.z);
    }
    function split(a:T.Vector2,b:T.Vector2,c:T.Vector2,n:number,rear:boolean){if(!n){push(a,rear);push(rear?c:b,rear);push(rear?b:c,rear);return;}const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);split(a,ab,ca,n-1,rear);split(ab,b,bc,n-1,rear);split(ca,bc,c,n-1,rear);split(ab,bc,ca,n-1,rear);}
    for(const [ia,ib,ic]of triangles){const a=edge[ia],b=edge[ib],c=edge[ic],positive=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0;split(a,positive?c:b,positive?b:c,2,false);split(a,positive?c:b,positive?b:c,2,true);}
    for(let i=0;i<edge.length;i++)for(let j=0;j<4;j++){const a=edge[i].clone().lerp(edge[(i+1)%edge.length],j/4),b=edge[i].clone().lerp(edge[(i+1)%edge.length],(j+1)/4);push(a,false);push(a,true);push(b,false);push(a,true);push(b,true);push(b,false);}
    const raw=new T.BufferGeometry();raw.setAttribute('position',new T.Float32BufferAttribute(positions,3));uv(raw);const merged=mergeVertices(raw);merged.computeVertexNormals();raw.dispose();collect(merged);
  }
  function tube(controls:Control[],z:number,collision=false,material?:T.Material){
    const points=controls.map(([x,y])=>elephantPoint(x,y,z));if(collision){const bodyDepth=controls[0][0]<500?-36:-42;points[0]=elephantPoint(controls[0][0],controls[0][1],bodyDepth+(z-bodyDepth)*.25);const end=points[points.length-1];end.y=height(end.x,end.z)+.025;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(Math.min(a.y,b.y)<height((a.x+b.x)/2,(a.z+b.z)/2)+2.2)legs.push({a:a.clone(),b:b.clone(),radius:.08});}}
    const curve=new T.CatmullRomCurve3(points),steps=Math.max(24,controls.length*9),radial=8,frames=curve.computeFrenetFrames(steps,false),positions:number[]=[],indices:number[]=[];
    for(let j=0;j<=steps;j++){const t=j/steps,p=curve.getPointAt(t),index=Math.min(controls.length-2,Math.floor(t*(controls.length-1))),f=t*(controls.length-1)-index,r=T.MathUtils.lerp(controls[index][2],controls[index+1][2],f)*SCALE*(EYE_Z-z)/DISTANCE;
      for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2,q=p.clone().addScaledVector(frames.normals[j],Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);positions.push(q.x,q.y,q.z);if(j<steps&&i<radial){const k=j*(radial+1)+i;indices.push(k,k+1,k+radial+1,k+1,k+radial+2,k+radial+1);}}
    }
    // Close both ends, including the trunk tips and grounded stilt feet.
    for(const [ring,reverse]of [[0,true],[steps,false]] as const){const centre=positions.length/3,p=curve.getPointAt(ring/steps);positions.push(p.x,p.y,p.z);for(let i=0;i<radial;i++){const a=ring*(radial+1)+i,b=a+1;indices.push(centre,reverse?b:a,reverse?a:b);}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    if(material){const m=new T.Mesh(g,material);m.castShadow=m.receiveShadow=true;parent.add(m);}else collect(g,collision);
  }
  // Four impossibly long articulated legs, each grounded independently.
  tube([[67,197,7],[35,285,5],[28,301,2.7],[18,423,1.9],[-7,720,1.1]],-37.1,true);
  tube([[78,206,8],[65,294,5],[65,312,3],[72,532,2.1],[126,759,1.1]],-36.6,true);
  tube([[145,203,7],[131,293,5],[128,311,3.1],[124,520,2.1],[179,763,1.1]],-34.8,true);
  tube([[164,201,6],[160,302,4],[167,323,3],[218,554,2],[356,762,.9]],-34.2,true);
  tube([[923,203,7],[938,258,6],[956,279,3],[987,466,1.8],[1006,756,.9]],-43.2,true);
  tube([[913,205,6],[895,284,5],[891,310,2.6],[887,500,1.8],[900,763,.9]],-42.6,true);
  tube([[845,195,6],[830,280,4],[826,297,2.5],[804,520,1.7],[769,763,.9]],-40.8,true);
  tube([[858,198,6],[854,292,4.2],[858,312,2.6],[890,479,1.9],[843,753,1]],-40.2,true);
  // Fine dark tendons echo the thin black strokes in the painting.
  tube([[109,190,1.2],[105,238,.7],[100,263,.3]],-35.1);
  tube([[862,177,1.4],[873,247,.7],[872,282,.3]],-40.6);
  volume([[52,174],[64,154],[89,145],[117,141],[142,145],[152,161],[151,183],[140,200],[116,207],[87,211],[67,205],[57,190]],-36,1.05);
  volume([[844,128],[865,115],[891,121],[919,136],[935,155],[942,180],[938,207],[921,211],[901,198],[879,197],[858,187],[845,170]],-42,1.15);
  volume([[139,150],[158,147],[169,159],[167,181],[151,196],[142,187]],-35.7,.6);
  volume([[824,147],[839,137],[858,151],[860,179],[847,197],[835,187]],-41.4,.65);
  volume([[163,132],[172,125],[180,130],[185,144],[197,156],[197,173],[187,191],[183,215],[172,208],[166,189],[159,177],[157,153]],-35.4,.5);
  volume([[804,132],[815,127],[830,135],[837,151],[832,172],[822,186],[811,197],[796,187],[790,170],[790,153]],-41.4,.55);
  // Broad three-dimensional ears and temple folds.
  volume([[155,140],[164,145],[169,163],[165,184],[159,205],[153,219],[148,208],[149,181],[146,163]],-34.9,.16);
  volume([[818,141],[831,145],[843,157],[850,178],[849,199],[859,211],[847,208],[831,190],[823,171]],-40.8,.19);
  tube([[192,173,8],[202,190,6],[216,195,4],[228,179,3],[239,161,2.4],[245,161,1.1]],-35.1);
  tube([[798,180,7],[792,207,5],[788,234,3.8],[793,254,2.9],[805,267,2],[815,265,1]],-41.1);
  tube([[183,180,2.5],[199,188,2],[217,183,.2]],-34.7,false,ivory);
  tube([[809,190,2.5],[808,208,1.6],[819,219,.2]],-40.5,false,ivory);
  tube([[55,164,2.3],[48,183,1.7],[47,207,.6]],-36.2);
  tube([[933,166,2.2],[947,178,1.3],[954,184,.4]],-42.3);
  // Draped saddle, straps and sparse tassels; all are geometry, not decals.
  volume([[99,145],[122,147],[147,151],[142,191],[115,195],[91,180]],-34.98,.075,false);
  volume([[842,119],[864,118],[892,127],[893,165],[864,160],[845,147]],-40.87,.075,false);
  for(let i=0;i<10;i++){const x=95+i*4.3;tube([[x,181,1.1],[x+1,194,.7],[x-1,201,.35]],-34.8,false,gold);}
  for(let i=0;i<9;i++){const x=848+i*4.7;tube([[x,150,1.1],[x+1,164,.7],[x-1,172,.35]],-40.7,false,gold);}
  // Raised relief symbols avoid high-resolution textures and remain visible up close.
  // The original relief's fine marks also remain in the local pigment texture.
  volume([[108,125],[117,72],[120,31],[142,0],[158,27],[157,126],[133,136]],-36.05,.36,false);
  volume([[800,107],[790,29],[796,0],[819,2],[837,34],[849,102],[824,115]],-42.05,.4,false);
  for(const [x,y,z]of [[127,112,-35.65],[137,80,-35.65],[813,82,-41.6],[810,45,-41.6]]){
    const ring=new T.Mesh(new T.TorusGeometry(.055,.009,6,18),gold);ring.position.copy(elephantPoint(x,y,z));ring.castShadow=true;parent.add(ring);
  }
  const geometry=mergeGeometries(geometries);if(!geometry)throw Error('Cannot merge elephant sculpture');geometries.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,pigment);mesh.name='Reference-matched elephants, stilts and engraved obelisks';mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  parent.userData.elephantCentres=[elephantPoint(119,181,-36).toArray(),elephantPoint(876,166,-42).toArray()];parent.userData.stiltFeet=legs.map(l=>l.b.toArray());
  return {legs};
}
