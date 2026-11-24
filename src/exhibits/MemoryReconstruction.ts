import * as T from 'three';
import {PaintedWorld,type Pixel} from './PaintedWorld';
import {ARTWORKS} from '../Artwork';
const pixels=(p:Pixel[]):Pixel[]=>p.map(([x,y])=>[x*2,y*2]);

/** The clock shore rebuilt as separate painted, rounded objects in a coastal
 * basin. The watches retain their drooping silhouettes from the reveal. */
export class MemoryReconstruction extends PaintedWorld {
  constructor(scene:T.Scene){
    super(scene,'persistence-of-memory','11',ARTWORKS['persistence-of-memory'],{sky:0x297b8b,horizon:0xd4c99b,ground:0x443322,sun:0xffe4a8,sunPosition:[-26,20,8],fog:.0015,extent:66,sunIntensity:2.0,hemisphereIntensity:1.0,environmentIntensity:.35,exposure:.98},{image:'/textures/memory-pigment.jpg',width:2000,height:1446,span:13,depth:30,horizon:.82,centreY:.2});
    this.group.name='The Persistence of Memory — painted clock shore';
    const ground=this.group.getObjectByName('Walkable landscape') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
    ground.material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 memoryGround;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nmemoryGround=(modelMatrix*vec4(position,1.)).xyz;');shader.fragmentShader='varying vec3 memoryGround;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(.24,1.08,smoothstep(12.,61.,-memoryGround.z));');};
    ground.material.customProgramCacheKey=()=> 'memory-ground-dark-shore';
    this.platform();
    this.solid('Bare olive trunk',pixels([[52,369],[81,356],[94,312],[103,255],[108,172],[106,92],[108,64],[122,59],[134,63],[130,94],[133,151],[141,178],[158,184],[180,180],[219,162],[249,148],[281,151],[244,166],[206,185],[162,201],[132,211],[123,264],[111,326],[98,363],[72,379]]),33,.23);
    this.solid('Forked upper branch',pixels([[234,155],[246,138],[249,128],[282,106],[264,125],[257,141],[289,149],[366,145],[414,145],[453,148],[454,153],[415,152],[365,154],[306,155],[271,162]]),33,.08);
    this.solid('Soft watch folded over the branch',pixels([[280,148],[297,145],[307,155],[321,146],[358,144],[372,142],[383,150],[390,174],[388,200],[379,224],[373,249],[369,277],[360,293],[348,294],[337,283],[329,270],[319,261],[301,260],[286,247],[279,226],[276,200],[276,170]]),31.7,.28);
    this.bead('Winding crown beneath the branch watch',310*2,270*2,12*2,8*2,31.4,.09);
    this.solid('Gold watch melting over the platform',pixels([[128,408],[137,395],[160,389],[210,388],[248,390],[270,401],[283,420],[288,447],[286,485],[286,522],[279,560],[273,600],[264,615],[251,611],[241,590],[237,552],[237,517],[230,493],[210,484],[182,479],[154,468],[137,456],[128,436]]),20,.19);
    this.seatOnPlatform(this.bead('Closed orange watch with painted ants',80*2,560*2,67*2,58*2,9,.12));
    this.seatOnPlatform(this.solid('Copper winding crown',pixels([[141,500],[153,497],[166,511],[168,518],[161,525],[152,519]]),9,.07));
    this.solid('Pale sleeping form with eyelid and lashes',pixels([[384,541],[392,511],[410,486],[443,462],[476,447],[510,430],[538,408],[557,380],[585,365],[600,363],[625,372],[661,387],[698,392],[748,393],[812,395],[879,399],[956,394],[927,408],[876,420],[829,432],[776,442],[733,449],[683,449],[643,447],[624,457],[619,483],[615,508],[602,518],[581,519],[554,535],[529,552],[515,576],[506,595],[502,616],[486,617],[468,602],[445,594],[422,584],[402,570]]),27,1.05);
    this.solid('Soft silver watch across the sleeping form',pixels([[447,420],[460,408],[480,406],[502,411],[520,405],[535,397],[552,395],[565,401],[573,417],[577,437],[574,453],[562,464],[548,467],[533,459],[518,446],[503,435],[485,431],[466,432],[451,430]]),25.7,.20);
    this.solid('Dangling silver crown',pixels([[551,469],[560,466],[571,474],[572,486],[564,498],[555,496],[550,483]]),25.4,.10);
    // Cliff faces are independent substantial rock volumes, rather than a
    // photograph behind the sea. Their painted fissures remain visible nearby.
    this.solid('Western end of the golden cliffs',pixels([[594,186],[611,173],[639,153],[674,143],[699,137],[736,134],[759,125],[783,126],[807,132],[816,154],[803,181],[773,197],[742,206],[710,218],[666,218],[635,205],[610,201]]),66,2.1,false);
    this.solid('Golden cliff face and fissures',pixels([[738,144],[774,141],[802,139],[827,132],[848,134],[861,120],[885,123],[910,115],[941,111],[972,111],[999,104],[1000,223],[964,222],[926,219],[888,220],[851,218],[812,224],[772,219],[716,218],[725,202]]),70,2.5,false);
    const sea=this.sea(-68,0x91bab4);sea.position.y=4;sea.name='Pale sea beyond the rising shore';
    const shore=this.mat(0x9d864e);this.block(this.group,[120,.16,.3],[0,3.91,-68],shore);
    this.obstacle(1.8,-27,3.8,2.1);this.obstacle(-5.4,-23,4.4,11.5);
    this.ants();
    this.group.userData.inspectionPoints=[[0,-18],[7,-27],[8,-38],[-12,-39],[0,-60]];
    this.finish();
  }
  private platform(){
    const corners=[this.point(0,680,34),this.point(610,680,34),this.point(500,1446,6),this.point(0,1446,6)];
    const positions:number[]=[];for(const p of corners)positions.push(p.x,p.y,p.z);for(const p of corners)positions.push(p.x,this.height(p.x,p.z)-.05,p.z);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,4,1,5,4,1,2,5,2,6,5,2,3,6,3,7,6,3,0,7,0,4,7]);g.computeVertexNormals();this.pigment(g);this.mesh(this.group,g,this.paint).name='Solid ochre platform with receding top';
  }
  private seatOnPlatform(o:T.Mesh){
    const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),top=-z*.02175-.295+.055;if(y>=top)continue;const t=(-.235-1.3*.02175-1.7)/(y-1.7+(z-1.3)*.02175);p.setXYZ(i,x*t,1.7+(y-1.7)*t,1.3+(z-1.3)*t);}o.geometry.computeVertexNormals();return o;
  }
  private ants(){
    const material=this.mat(0x17170f,.72,.1),bodies=new T.InstancedMesh(new T.SphereGeometry(1,8,6),material,60),legs=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,6),material,120),dummy=new T.Object3D();let body=0,leg=0;
    for(let i=0;i<20;i++){const a=i*2.39996,r=Math.sqrt((i+.5)/20),p=this.point((80+Math.cos(a)*45*r)*2,(560+Math.sin(a)*32*r)*2,8.8);p.y=Math.max(p.y,-p.z*.02175-.295+.09);const yaw=i*1.7,axis=new T.Vector3(Math.sin(yaw),0,Math.cos(yaw)),side=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
      for(let j=0;j<3;j++){dummy.position.copy(p).addScaledVector(axis,(j-1)*.025);dummy.scale.set(j===0?.017:.012,.009,j===0?.022:.014);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();bodies.setMatrixAt(body++,dummy.matrix);}
      for(let j=0;j<3;j++)for(const sign of [-1,1]){const start=p.clone().addScaledVector(axis,(j-1)*.018),end=start.clone().addScaledVector(side,sign*.038).addScaledVector(axis,(j-1)*.012);end.y-=.009;const delta=end.clone().sub(start);dummy.position.copy(start).add(end).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());dummy.scale.set(.0018,delta.length(),.0018);dummy.updateMatrix();legs.setMatrixAt(leg++,dummy.matrix);}
    }
    bodies.name='Modeled ant bodies';legs.name='Modeled ant legs';bodies.castShadow=legs.castShadow=true;this.group.add(bodies,legs);
  }
  override height(x:number,z:number){const d=-z;if(d<3)return 0;const basin=-5.2*T.MathUtils.smoothstep(d,3,23),shore=9.2*T.MathUtils.smoothstep(d,43,68),mound=1.3*Math.exp(-((x-.8)**2/18+(z+27)**2/18));return basin+shore+mound;}
  override blocked(x:number,z:number){return z<-67.5||super.blocked(x,z);}
}
