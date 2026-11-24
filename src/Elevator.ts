import * as T from 'three';
import {box,label,smooth} from './shared';
export class Elevator {
  readonly group=new T.Group(); readonly panel=new T.Vector3(1.96,1.4,-1.69);
  private left:T.Mesh;private right:T.Mesh;private display:T.Mesh;
  openness=0;phase:'idle'|'closing'|'travel'|'opening'|'open'='idle';timer=0;
  private lastText='';private numbers:number[]=[];
  constructor(scene:T.Scene){
    scene.add(this.group);
    const metal=new T.MeshStandardMaterial({color:0x695642,metalness:.7,roughness:.4});
    const dark=new T.MeshStandardMaterial({color:0x172321,metalness:.3,roughness:.6});
    const brass=new T.MeshStandardMaterial({color:0xa58146,metalness:.7,roughness:.36});
    box(this.group,5.5,.18,6.2,0,-.09,.9,dark);
    for(const x of [-2.65,2.65]){box(this.group,.18,3.6,6.2,x,1.7,.9,metal);box(this.group,.03,.06,5.6,x*.96,.95,.8,brass);for(let i=0;i<10;i++)box(this.group,.025,2.8,.013,x*.965,1.8,-1.65+i*.55,brass);}
    box(this.group,5.5,3.6,.18,0,1.7,4,metal);box(this.group,5.5,.2,6.2,0,3.5,.9,metal);
    // A human-scale, landscape-shaped opening gives the painting its high horizon.
    for(const x of [-2.13,2.13])box(this.group,1.05,3.6,.25,x,1.7,-2,metal);
    box(this.group,3.25,1.12,.25,0,2.92,-2,metal);
    for(const x of [-1.66,1.66])box(this.group,.12,2.45,.33,x,1.19,-2,brass);
    box(this.group,3.44,.15,.33,0,2.37,-2,brass);box(this.group,3.44,.06,.5,0,.025,-2,brass);
    this.left=box(this.group,1.61,2.3,.1,-.805,1.15,-2,metal);this.right=box(this.group,1.61,2.3,.1,.805,1.15,-2,metal);
    box(this.group,.59,1.05,.1,1.96,1.5,-1.78,dark);
    this.display=box(this.group,.44,.33,.02,1.96,1.76,-1.71,new T.MeshBasicMaterial({map:label('01')}));
    box(this.group,.24,.24,.08,1.96,1.35,-1.67,new T.MeshStandardMaterial({color:0xffd79a,emissive:0xffbd62,emissiveIntensity:.8,metalness:.35,roughness:.4}));
    box(this.group,3.3,.035,.7,0,3.37,1,new T.MeshBasicMaterial({color:0xffd99a}));
    const light=new T.PointLight(0xffc67c,25,8,2);light.position.set(0,3.1,.9);this.group.add(light);
  }
  text(value:string){if(value===this.lastText)return;const m=this.display.material as T.MeshBasicMaterial;m.map?.dispose();m.map=label(value);m.needsUpdate=true;this.lastText=value;}
  travel(){if(this.phase!=='idle'&&this.phase!=='open')return false;this.phase='closing';this.timer=0;this.numbers=Array.from({length:7},()=>1+Math.floor(Math.random()*29));return true;}
  update(dt:number,arrive:()=>string){
    this.timer+=dt;
    if(this.phase==='closing'){this.openness=Math.max(0,this.openness-dt*.55);if(this.openness===0){this.phase='travel';this.timer=0;}}
    else if(this.phase==='travel'){this.text(String(this.numbers[Math.min(6,Math.floor(this.timer*1.6))]).padStart(2,'0'));if(this.timer>4.2){const destination=arrive();this.text(destination);this.phase='opening';this.timer=0;}}
    else if(this.phase==='opening'){this.openness=smooth(this.timer/3.8);if(this.timer>=3.8){this.openness=1;this.phase='open';}}
    this.left.position.x=-.805-this.openness*1.72;this.right.position.x=.805+this.openness*1.72;
  }
  blocked(x:number,z:number){
    const r=.23;
    // Solid cabin and facade, including when viewed from the shore.
    if(z>-2.4&&z<4.3&&Math.abs(x)>2.35&&Math.abs(x)<2.99)return true;
    if(z>3.7&&z<4.4&&Math.abs(x)<2.99)return true;
    if(z>-2.38&&z<-1.63&&Math.abs(x)<2.99){
      if(Math.abs(x)>1.34)return true;
      if(this.phase==='closing'||this.phase==='travel')return true;
      if(Math.abs(x)+r>=this.openness*1.72)return true;
    }
    return false;
  }
}
