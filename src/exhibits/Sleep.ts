import * as T from 'three';
import {ARTWORKS} from '../Artwork';
import {PaintedWorld,type Pixel} from './PaintedWorld';
import {coastal} from './World';

/** A closed, sculpted head in a traversable blue-lit landscape, supported by
 * forked wooden crutches. No camera-projected imagery or scenery planes.
 * The painted pigment is attached only to independent rounded subject volumes. */
export class Sleep extends PaintedWorld {
  private readonly supports:{foot:T.Vector3;top:T.Vector3}[]=[];
  constructor(scene:T.Scene){
    super(scene,'sleep','13',ARTWORKS.sleep,{...coastal,sky:0x225b7b,horizon:0xcde0d8,ground:0x4c675e,sunPosition:[-23,20,18],fog:.003},
      {image:'/textures/sleep-pigment.jpg',width:480,height:315,span:15.7,depth:32,horizon:1,centreY:.8});
    const outline:Pixel[]=[[86,88],[96,78],[115,61],[133,45],[152,29],[169,25],[186,34],[207,53],[222,71],[233,84],[251,99],[277,119],[315,135],[352,145],[389,149],[420,147],[444,142],[454,145],[463,151],[469,168],[469,190],[466,202],[459,202],[455,193],[457,177],[456,163],[452,157],[442,164],[423,172],[400,181],[375,187],[344,193],[308,199],[274,206],[244,211],[213,216],[186,226],[167,235],[154,235],[147,226],[148,214],[157,209],[162,201],[155,199],[146,204],[134,203],[128,197],[128,190],[136,183],[145,181],[136,175],[128,177],[120,175],[117,166],[112,170],[107,175],[100,175],[95,168],[97,153],[102,135],[99,123],[96,112],[87,111],[80,107],[79,99]];
    const head=this.solid('Closed sculpted sleeping head',outline,32,1.8);head.userData.keep=true;
    // The ear is a folded independent flap, with an open gap behind its edge.
    this.solid('Folded ear on the sleeping head',[[212,80],[218,82],[222,77],[225,85],[227,98],[238,112],[246,119],[241,125],[234,123],[229,131],[222,128],[218,118],[217,104],[212,94]],30.65,.4);
    this.solid('Lower lip of the dreamer',[[128,191],[137,189],[147,190],[157,187],[162,189],[159,196],[151,199],[140,201],[131,199]],30.5,.16);
    this.solid('Upper lip and bared teeth',[[129,182],[138,178],[147,178],[156,174],[162,176],[160,183],[152,185],[141,187],[132,188]],30.4,.16);
    this.stroke('Closed eyelid',[[105,100],[113,104],[122,102],[130,98]],.65,30.2);
    this.stroke('Soft nose crease',[[111,134],[109,148],[110,158],[117,162]],.55,30.5);
    this.stroke('Lip crease',[[131,188],[141,186],[150,185],[160,182]],.45,30.1);
    // One very long, nearly vertical support behind the tapering neck.
    const wood=this.mat(0x706d4b,.85),dark=this.mat(0x53563e,.9);
    const struts:{tip:Pixel;foot:Pixel;d:number;r:number}[]=[
      {tip:[96,112],foot:[70,278],d:30,r:.035},
      {tip:[124,175],foot:[122,280],d:29,r:.033},
      {tip:[162,229],foot:[170,279],d:30,r:.038},
      {tip:[244,205],foot:[254,275],d:31,r:.04},
      {tip:[439,143],foot:[434,270],d:33,r:.033},
      {tip:[462,139],foot:[445,277],d:34,r:.032},
    ];
    for(const [i,s]of struts.entries()){
      const foot=this.point(...s.foot,s.d-1),top=this.point(...s.tip,s.d);foot.y=this.height(foot.x,foot.z)+.025;
      const middle=foot.clone().lerp(top,.55);middle.x+=i%2?.025:-.035;
      this.rod(this.group,[[foot.x,foot.y,foot.z],[middle.x,middle.y,middle.z],[top.x,top.y-.12,top.z]],s.r,wood,34);
      for(const side of [-1,1])this.limb(this.group,[top.x,top.y-.23,top.z],[top.x+side*.095,top.y+.02,top.z],s.r*.85,s.r*.6,dark);
      this.supports.push({foot,top});
    }
    this.stroke('Long staff behind the tapering neck',[[388,11],[394,48],[402,93],[413,148],[421,201]],.65,36,wood);
    this.stroke('Fork of the long staff',[[388,15],[383,8],[383,4]],.55,36,wood);this.stroke('Other fork of long staff',[[389,15],[393,9],[394,4]],.55,36,wood);
    this.solid('Small supported dog',[[14,232],[20,233],[22,239],[24,241],[24,246],[22,253],[17,254],[14,249],[14,243],[11,241]],25,.18);
    this.stroke('Small dog front leg',[[21,246],[22,254],[27,257]],.65,24.6);this.stroke('Small dog hind leg',[[16,247],[16,254],[13,258]],.6,24.7);
    this.stroke('Dog crutch',[[24,239],[30,258]],.5,25,wood);
    this.solid('Tiny upright companion',[[12,218],[15,219],[15,224],[17,227],[17,237],[14,238],[12,232],[11,226]],28,.1);
    // Closed, separately extruded building masses anchor the pale settlement.
    const buildings:Pixel[][]=[[[353,213],[355,207],[361,208],[363,215],[363,222],[351,222]],[[363,206],[366,200],[372,201],[374,210],[373,222],[362,222]],[[373,201],[376,196],[381,197],[383,210],[383,223],[374,223]],[[381,210],[387,209],[391,215],[394,218],[393,223],[382,223]],[[366,215],[370,211],[374,213],[377,220],[376,224],[366,224]]];
    buildings.forEach((p,i)=>this.blockPixels(`Pale horizon settlement ${i+1}`,p,46-i*.45,.48));
    this.blockPixels('Pale coastal bell tower',[[380,196],[380,192],[383,188],[385,193],[386,198],[385,215],[380,215]],45,.35);
    this.solid('Low coastal rock beneath settlement',[[348,222],[355,218],[368,222],[380,220],[393,221],[400,224],[399,227],[351,227]],46,.28);
    this.solid('Small left horizon rock',[[3,219],[9,214],[15,216],[22,222],[25,228],[3,228]],50,.5);
    this.solid('Tiny left horizon island',[[107,227],[111,224],[115,227],[112,229],[106,229]],51,.15);
    const dog=this.point(19,250,25);this.obstacle(dog.x,dog.z,.5,.4);const village=this.point(375,220,45);this.obstacle(village.x,village.z,1.6,1.8);
    // Transparent pale water and darkened foreground preserve the light/dark
    // division of the reference without a full-painting plane.
    const sea=this.sea(-61,0xa9c5bc);sea.position.y=-4.7;
    const ground=this.group.getObjectByName('Walkable landscape') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
    ground.material.color.set(0x83a198);ground.material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 sleepGround;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsleepGround=(modelMatrix*vec4(position,1.)).xyz;');shader.fragmentShader='varying vec3 sleepGround;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat distanceLight=(1.-smoothstep(-52.,-14.,sleepGround.z));diffuseColor.rgb*=mix(vec3(.11,.2,.18),vec3(.87,.98,.92),distanceLight);');};
    ground.material.customProgramCacheKey=()=> 'sleep-ground-pale-shore';
    ground.userData.keep=true;
    // Dense local shore patches reproduce the small supports between the wider
    // landscape grid vertices, keeping rendered feet and movement height equal.
    for(const [px,py,depth,rx,rz]of [[375,224,45,3,3],[19,258,25,1.2,1.5],[14,238,28,.55,.7]]){
      const p=this.point(px,py,depth),g=new T.PlaneGeometry(rx*2.1,rz*2.1,24,24);g.rotateX(-Math.PI/2);g.translate(p.x,0,p.z);const a=g.attributes.position;
      for(let i=0;i<a.count;i++)a.setY(i,this.height(a.getX(i),a.getZ(i))+.012);g.computeVertexNormals();const bank=this.mesh(this.group,g,ground.material);bank.name='Walkable local supporting shore';bank.userData.keep=true;
    }
    this.finish();
  }
  override height(x:number,z:number){
    const basin=super.height(x,z);if(!this.painting)return basin;
    // The distant coast rises out of the basin: buildings are grounded rather
    // than hovering several metres above the steep foreground slope.
    const shore=T.MathUtils.smoothstep(-z,35,47);let result=T.MathUtils.lerp(basin,-4.35+.035*Math.sin(x*.2),shore);
    for(const [px,py,depth,rx,rz]of [[375,224,45,3,3],[19,258,25,1.2,1.5],[14,238,28,.55,.7]]){
      const p=this.point(px,py,depth),q=((x-p.x)/rx)**2+((z-p.z)/rz)**2,w=1-T.MathUtils.smoothstep(q,.12,1),top=p.y-.08;
      result=Math.max(result,T.MathUtils.lerp(result,top,w));
    }
    return result;
  }
  override blocked(x:number,z:number){
    if(super.blocked(x,z))return true;
    return this.supports.some(s=>{const dx=s.top.x-s.foot.x,dz=s.top.z-s.foot.z,l=dx*dx+dz*dz,t=l?T.MathUtils.clamp(((x-s.foot.x)*dx+(z-s.foot.z)*dz)/l,0,1):0;return Math.hypot(x-s.foot.x-dx*t,z-s.foot.z-dz*t)<.26;});
  }
}



