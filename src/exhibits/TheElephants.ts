import * as T from 'three';
import {ARTWORKS} from '../Artwork';
import {box} from '../shared';
import {buildElephantSculptures,elephantPoint} from './ElephantSculptures';
import type {Atmosphere} from './World';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {Floor,QualityProfile} from '../Graphics';
const horizonRidge=[[0,721],[63,717],[86,699],[112,691],[137,696],[158,711],[183,707],[202,716],[235,710],[275,714],[304,736],[365,741],[427,751],[472,750],[548,749],[612,739],[657,740],[715,747],[773,740],[842,741],[905,748],[957,740],[1000,746]].map(([x,y])=>elephantPoint(x,y,-92));
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const standard=(color:number,roughness=.85,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});

/** Salvador Dalí — The Elephants, 1948. Fully modeled, traversable desert. */
export class TheElephants implements Floor {
  readonly id='the-elephants';readonly floorNumber='12';
  readonly title='Salvador Dalí — The Elephants, 1948';
  readonly artwork=ARTWORKS['the-elephants'];
  readonly group=new T.Group();
  private readonly legs:{a:T.Vector3;b:T.Vector3;radius:number}[]=[];
  private readonly obstacles:{x:number;z:number;r:number}[]=[];
  private readonly uniforms:{time:{value:number}}[]=[];
  readonly atmosphere:Atmosphere={sky:0xb93625,horizon:0xe8b841,ground:0x66402a,sun:0xffd991,sunPosition:[36,16,10],fog:.0012,extent:70,sunIntensity:2.1,hemisphereIntensity:.85,environmentIntensity:.35,exposure:1.0};
  private dust:T.Points;
  private readonly geometries={sphere:new T.SphereGeometry(1,20,12),joint:new T.SphereGeometry(1,12,8)};
  private readonly skin=standard(0x8c7168,.94);private readonly ear=standard(0x9a766b,.95);private readonly ivory=standard(0xc4b79a,.68);private readonly dark=standard(0x4b3c38,.86);private readonly stone=standard(0xc0ae81,.9);private readonly gold=standard(0xb79c62,.6,.35);

  constructor(scene:T.Scene){
    this.group.name='The Elephants — sunset desert';scene.add(this.group);
    this.buildSky();this.buildSand();
    this.legs.push(...buildElephantSculptures(this.group,(x,z)=>this.height(x,z)).legs);
    this.pavilion();this.figure(-3.15,-49,1.2,0x9d826c);this.figure(3.25,-50,1.4,0xc4baa1);
    this.buildContactShadows();
    this.group.children.filter(child=>child instanceof T.Group).forEach(child=>this.batch(child));
    this.batch(this.group);
    const positions:number[]=[];
    let seed=91;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let i=0;i<180;i++){const x=(random()-.5)*100,z=-5-random()*100;positions.push(x,this.height(x,z)+.2+random()*2.5,z);}
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    const uniforms={time:{value:0}};this.uniforms.push(uniforms);
    this.dust=new T.Points(geometry,new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:`uniform float time;varying float fade;void main(){vec3 p=position;p.x+=sin(time*.065+position.z)*.8; p.y+=sin(time*.12+position.x)*.09;vec4 mv=modelViewMatrix*vec4(p,1.);fade=smoothstep(1.,9.,-mv.z)*(1.-smoothstep(55.,110.,-mv.z));gl_PointSize=clamp(34./max(1.,-mv.z),1.,4.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float fade;void main(){float r=length(gl_PointCoord-.5);float a=(1.-smoothstep(.1,.5,r))*.18*fade;gl_FragColor=vec4(.95,.55,.21,a);}` }));
    this.dust.name='Wind-carried sand motes';this.dust.frustumCulled=false;this.group.add(this.dust);
  }
  /** Combine static parts by material; articulated body groups stay independent. */
  private batch(parent:T.Object3D,descendants=false){
    parent.updateWorldMatrix(true,true);
    const inverse=parent.matrixWorld.clone().invert(),buckets=new Map<T.Material,T.Mesh[]>();
    const collect=(object:T.Object3D)=>{if(!(object instanceof T.Mesh)||Array.isArray(object.material))return;const bucket=buckets.get(object.material)??[];bucket.push(object);buckets.set(object.material,bucket);};
    if(descendants)parent.traverse(collect);else parent.children.forEach(collect);
    for(const [mat,objects]of buckets){
      if(objects.length<2)continue;
      const geometries=objects.map(object=>{const g=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();if(!(mat instanceof T.MeshStandardMaterial&&mat.map))g.deleteAttribute('uv');g.applyMatrix4(inverse.clone().multiply(object.matrixWorld));return g;});
      const combined=mergeGeometries(geometries,false);if(!combined)throw Error('Cannot batch elephant geometry');
      combined.computeBoundingSphere();objects.forEach(object=>object.removeFromParent());geometries.forEach(g=>g.dispose());
      const result=this.mesh(parent,combined,mat);result.name='Batched solid sculpture';
    }
  }
  private mesh(parent:T.Object3D,geometry:T.BufferGeometry,mat:T.Material){const m=new T.Mesh(geometry,mat);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
  private ellipsoid(parent:T.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,mat:T.Material,joint=false){const m=this.mesh(parent,joint?this.geometries.joint:this.geometries.sphere,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
  private pipe(parent:T.Object3D,points:T.Vector3[],radius:number,mat:T.Material,segments=16){return this.mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,radius,6,false),mat);}
  private taper(parent:T.Object3D,points:T.Vector3[],r0:number,r1:number,mat:T.Material){
    const curve=new T.CatmullRomCurve3(points),n=20,radial=7,frames=curve.computeFrenetFrames(n,false),p:number[]=[],uv:number[]=[],ix:number[]=[];
    for(let j=0;j<=n;j++){const center=curve.getPointAt(j/n),radius=T.MathUtils.lerp(r0,r1,j/n);for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2;const q=center.clone().addScaledVector(frames.normals[j],Math.cos(a)*radius).addScaledVector(frames.binormals[j],Math.sin(a)*radius);p.push(q.x,q.y,q.z);uv.push(i/radial,j/n);if(j<n&&i<radial){const k=j*(radial+1)+i;ix.push(k,k+1,k+radial+1,k+1,k+radial+2,k+radial+1);}}}
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(ix);geometry.computeVertexNormals();return this.mesh(parent,geometry,mat);
  }
  private pavilion(){
    const x=-1.25,z=-70,y=this.terrainHeight(x,z),p=new T.Group();p.name='Horizon pavilion';p.position.set(x,y,z);p.scale.setScalar(.6);this.group.add(p);this.obstacles.push({x,z,r:.85});
    box(p,2.2,.2,1.9,0,.1,0,this.stone);box(p,2.45,.08,2.1,0,.23,0,this.gold);
    for(const xx of [-.8,.8])for(const zz of [-.65,.65]){box(p,.16,2.2,.16,xx,1.34,zz,this.stone);}
    box(p,2.1,.15,1.8,0,2.45,0,this.gold);
    const roof=this.mesh(p,new T.ConeGeometry(1.55,.65,4),this.skin);roof.rotation.y=Math.PI/4;roof.position.y=2.85;
    const ring=this.mesh(p,new T.TorusGeometry(.36,.04,6,32),this.gold);ring.position.set(0,1.32,-.02);
  }
  private figure(x:number,z:number,height:number,color:number){
    const group=new T.Group();group.name='Small human silhouette';group.position.set(x,this.height(x,z),z);this.group.add(group);const mat=standard(color);
    this.ellipsoid(group,0,height*.88,0,.11,.15,.11,mat,true);
    this.ellipsoid(group,0,height*.62,0,.14,.26,.11,mat);
    this.taper(group,[v(-.05,height*.48,0),v(-.08,.25,0),v(-.11,.02,.03)],.065,.025,mat);
    this.taper(group,[v(.05,height*.48,0),v(.1,.24,.04),v(.18,.02,.07)],.065,.025,mat);
    this.pipe(group,[v(-.13,height*.76,0),v(-.2,height*.5,-.02),v(-.16,height*.42,-.01)],.035,mat,10);
    this.pipe(group,[v(.13,height*.76,0),v(.3,height*.9,0),v(.38,height*1.03,.02)],.035,mat,10);
    this.obstacles.push({x,z,r:.24});
  }
  private buildContactShadows(){
    const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
    const patch=(x:number,z:number,length:number,width:number,angle:number)=>{
      const start=positions.length/3;for(const [u,v]of [[0,0],[1,0],[0,1],[1,1]]){const xx=(u-.5)*length,zz=(v-.5)*width,wx=x+xx*Math.cos(angle)-zz*Math.sin(angle),wz=z+xx*Math.sin(angle)+zz*Math.cos(angle);positions.push(wx,this.height(wx,wz)+.018,wz);uvs.push(u,v);}indices.push(start,start+2,start+1,start+1,start+2,start+3);
    };
    // Geometry remains static after arrival.
    for(const [x,,z]of this.group.userData.stiltFeet as number[][])patch(x-.16,z+.035,.55,.16,-.2);
    patch(-4.7,-48.7,3.4,.18,-.18);patch(1.5,-49.7,3.8,.2,-.18);patch(-1.4,-70,1.8,1.2,0);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);
    const m=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 q;void main(){float a=pow(max(0.,1.-length((q-.5)*2.)),.7)*.46;gl_FragColor=vec4(.018,.009,.004,a);}'});
    const shadow=this.mesh(this.group,g,m);shadow.name='Soft grounded stilt and figure shadows';shadow.castShadow=shadow.receiveShadow=false;
  }
  private buildSky(){
    const sky=this.mesh(this.group,new T.SphereGeometry(350,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new T.Color(0xba3526)},middle:{value:new T.Color(0xdb4228)},horizon:{value:new T.Color(0xf4d951)}},vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform vec3 top;uniform vec3 middle;uniform vec3 horizon;varying vec3 direction;void main(){float h=normalize(direction).y;vec3 c=mix(horizon,middle,smoothstep(-.27,-.11,h));c=mix(c,top,smoothstep(-.06,.7,h));float d=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);c+=(d-.5)*.003;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`}));
    (sky.material as T.ShaderMaterial).toneMapped=false;sky.name='Crimson-to-gold sunset shader';sky.castShadow=sky.receiveShadow=false;sky.renderOrder=-1000;
  }
  private buildSand(){
    const g=new T.PlaneGeometry(145,135,96,96);g.rotateX(-Math.PI/2);g.translate(0,0,-43);
    const positions=g.getAttribute('position');for(let i=0;i<positions.count;i++)positions.setY(i,this.terrainHeight(positions.getX(i),positions.getZ(i)));g.computeVertexNormals();
    const mat=standard(0xffffff,1);const time={value:0};this.uniforms.push({time});
    mat.onBeforeCompile=shader=>{
      shader.uniforms.time=time;
      shader.vertexShader='varying vec3 sandPosition;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsandPosition=(modelMatrix*vec4(position,1.)).xyz;');
      shader.fragmentShader='uniform float time;varying vec3 sandPosition;\nfloat grit(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float distanceFade=smoothstep(0.,95.,-sandPosition.z);
        float goldenPool=exp(-pow((sandPosition.x-2.)/10.,2.)-pow((sandPosition.z+55.)/15.,2.));
        vec3 sand=mix(vec3(.035,.014,.007),vec3(.13,.065,.012),distanceFade)+vec3(.18,.14,.025)*goldenPool;
        float ripple=sin(sandPosition.x*12.+sin(sandPosition.z*.6)*3.);
        float wind=sin(sandPosition.x*1.7+sandPosition.z*.22+time*.14);
        float grain=grit(floor(sandPosition.xz*100.));
        diffuseColor.rgb*=sand*(.97+.012*ripple+.03*grain+.008*wind);`);
    };
    this.mesh(this.group,g,mat).name='Walkable wind-swept sand shader';
  }
  private terrainHeight(x:number,z:number){let crest=0;for(let i=1;i<horizonRidge.length;i++){const a=horizonRidge[i-1],b=horizonRidge[i];if(x>=a.x&&x<=b.x){crest=Math.max(0,T.MathUtils.lerp(a.y,b.y,(x-a.x)/(b.x-a.x))+.26*89);break;}}const ridge=crest*Math.exp(-Math.pow((z+92)/5,2));const fade=T.MathUtils.smoothstep(-z,5,22);return -.26*Math.max(0,-z-3)*T.MathUtils.smoothstep(-z,3,8)+.035*Math.sin(x*.08)*Math.sin(z*.09)*fade+ridge;}
  height(x:number,z:number){return this.terrainHeight(x,z);}
  blocked(x:number,z:number){
    if(Math.abs(x)>59||z<-102||z>23)return true;
    for(const leg of this.legs){const dx=leg.b.x-leg.a.x,dz=leg.b.z-leg.a.z,len=dx*dx+dz*dz;const t=len>.0001?T.MathUtils.clamp(((x-leg.a.x)*dx+(z-leg.a.z)*dz)/len,0,1):0,boneY=T.MathUtils.lerp(leg.a.y,leg.b.y,t),ground=this.height(x,z);if(boneY>ground+1.85||boneY<ground-.2)continue;if(Math.hypot(x-leg.a.x-dx*t,z-leg.a.z-dz*t)<leg.radius+.23)return true;}
    return this.obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.23);
  }
  update(_dt:number,time:number){this.uniforms.forEach(u=>u.time.value=time);}
  setQuality(profile:QualityProfile){this.dust.geometry.setDrawRange(0,profile.dust);}
}
