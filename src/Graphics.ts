import * as T from 'three';
import type {WalkableWorld} from './Controls';
import type {Artwork} from './Artwork';
import type {Atmosphere} from './exhibits/World';
export type QualityName='battery'|'laptop'|'detailed';
export interface QualityProfile {name:QualityName;label:string;maxPixels:number;maxRatio:number;shadowSize:number;reflections:boolean;dust:number}
export const QUALITY:Record<QualityName,QualityProfile>={
  battery:{name:'battery',label:'Battery',maxPixels:650000,maxRatio:1,shadowSize:512,reflections:false,dust:60},
  laptop:{name:'laptop',label:'Laptop',maxPixels:1000000,maxRatio:1.25,shadowSize:1024,reflections:false,dust:120},
  detailed:{name:'detailed',label:'Detailed',maxPixels:2000000,maxRatio:1.5,shadowSize:2048,reflections:true,dust:180},
};
export interface Floor extends WalkableWorld {
  readonly id:string;readonly floorNumber:string;readonly title:string;
  readonly artwork:Artwork;readonly group:T.Group;
  readonly atmosphere?:Atmosphere;
  update?(dt:number,time:number):void;
  setQuality?(profile:QualityProfile):void;
}

/** Conservative defaults for Snapdragon X / Adreno X1-45 integrated graphics. */
export class Graphics {
  profile:QualityProfile;private adaptiveScale=1;private seconds=0;private frames=0;private elapsed=0;
  constructor(private renderer:T.WebGLRenderer,private sun:T.DirectionalLight){
    let saved='laptop';try{saved=localStorage.getItem('eleventh-floor-quality')??saved;}catch{}
    this.profile=QUALITY[saved as QualityName]??QUALITY.laptop;
    this.apply(this.profile.name);
  }
  apply(name:QualityName){
    this.profile=QUALITY[name];this.adaptiveScale=1;
    try{localStorage.setItem('eleventh-floor-quality',name);}catch{}
    this.sun.shadow.map?.dispose();this.sun.shadow.map=null;
    this.sun.shadow.mapSize.set(this.profile.shadowSize,this.profile.shadowSize);
    this.renderer.shadowMap.needsUpdate=true;this.resize();
  }
  resize(){
    const ratio=Math.min(devicePixelRatio,this.profile.maxRatio,Math.sqrt(this.profile.maxPixels/(innerWidth*innerHeight)))*this.adaptiveScale;
    this.renderer.setPixelRatio(Math.max(.1,ratio));this.renderer.setSize(innerWidth,innerHeight);
  }
  sample(dt:number,active:boolean){
    if(!active||document.hidden){this.seconds=this.frames=0;return;}
    this.seconds+=dt;this.frames++;this.elapsed+=dt;
    if(this.seconds<3)return;
    const fps=this.frames/this.seconds;
    const canvas=this.renderer.domElement;canvas.dataset.fps=fps.toFixed(0);canvas.dataset.drawCalls=String(this.renderer.info.render.calls);canvas.dataset.triangles=String(this.renderer.info.render.triangles);canvas.dataset.quality=this.profile.name;
    // Only the laptop profile adapts down, in infrequent small steps.
    if(this.profile.name==='laptop'&&fps<28&&this.adaptiveScale>.72&&this.elapsed>5){this.adaptiveScale=Math.max(.72,this.adaptiveScale*.9);this.resize();this.elapsed=0;}
    this.seconds=this.frames=0;
  }
}
