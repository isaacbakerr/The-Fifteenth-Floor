import * as T from 'three';

// One noise loop and two voices are reused between floors, never accumulated.
const soundscape=(id:string)=>{
  if(id==='the-elephants')return {wind:.21,filter:1050,notes:[98,146.83],level:.035,range:52};
  if(id==='sleep')return {wind:.09,filter:650,notes:[65.4,98],level:.013,range:28};
  if(['last-supper','christ-of-saint-john','madonna-port-lligat','discovery-of-america'].includes(id))return {wind:.07,filter:380,notes:[130.81,196],level:.018,range:45};
  if(id==='burning-giraffe')return {wind:.16,filter:1550,notes:[73.42,110],level:.012,range:40};
  if(id==='swallows-tail'||id==='galacidalacidesoxyribonucleicacid')return {wind:.065,filter:500,notes:[174.61,261.63],level:.014,range:38};
  return {wind:.12,filter:520,notes:[110,164.81],level:id==='persistence-of-memory'?0:.014,range:35};
};

/** Small synthesized soundscape: one noise loop, two quiet spatial tones,
 * gesture-activated one-shots, and walking sounds. No audio downloads. */
export class Sound {
  private context?:AudioContext;private output?:GainNode;private wind?:GainNode;private filter?:BiquadFilterNode;
  private tones:{gain:GainNode;pan:StereoPannerNode;frequency:OscillatorNode}[]=[];
  private paused=true;private floor='';private stepTimer=0;private chimeTimer=0;
  enabled=true;
  constructor(){try{this.enabled=localStorage.getItem('eleventh-floor-sound')!=='off';}catch{}}
  start(){
    if(this.context){void this.context.resume();this.setPaused(false);return;}
    const ctx=this.context=new AudioContext();this.output=ctx.createGain();this.output.gain.value=this.enabled?.35:0;this.output.connect(ctx.destination);
    const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;
    for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.035)/1.025;data[i]=brown*3;}
    const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
    this.filter=ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=450;
    const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=65;
    this.wind=ctx.createGain();this.wind.gain.value=.15;noise.connect(this.filter);this.filter.connect(high);high.connect(this.wind);this.wind.connect(this.output);noise.start();
    for(let i=0;i<2;i++){const frequency=ctx.createOscillator(),gain=ctx.createGain(),pan=ctx.createStereoPanner();frequency.type='sine';frequency.frequency.value=i?146.83:98;gain.gain.value=0;frequency.connect(gain);gain.connect(pan);pan.connect(this.output);frequency.start();this.tones.push({frequency,gain,pan});}
    this.setFloor(this.floor);void ctx.resume();
  }
  toggle(){const wasPaused=this.paused;this.start();this.enabled=!this.enabled;try{localStorage.setItem('eleventh-floor-sound',this.enabled?'on':'off');}catch{}this.setPaused(wasPaused);}
  setPaused(paused:boolean){this.paused=paused;if(this.context&&this.output)this.output.gain.setTargetAtTime(this.enabled&&!paused?.35:0,this.context.currentTime,.08);}
  setFloor(id:string){this.floor=id;this.chimeTimer=0;if(this.context){const bed=soundscape(id);this.tones.forEach((tone,i)=>tone.frequency.frequency.setTargetAtTime(bed.notes[i],this.context!.currentTime,2));this.filter?.frequency.setTargetAtTime(bed.filter,this.context.currentTime,1.8);this.wind?.gain.setTargetAtTime(bed.wind,this.context.currentTime,2);}}
  tone(frequency:number,duration:number,volume=.4,type:OscillatorType='sine'){
    if(!this.context||!this.output||!this.enabled)return;
    const ctx=this.context,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.value=frequency;gain.gain.setValueAtTime(.001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(volume,ctx.currentTime+.025);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);osc.connect(gain);gain.connect(this.output);osc.start();osc.stop(ctx.currentTime+duration);
  }
  hum(){this.tone(55,4,.21,'triangle');this.tone(82.5,4,.08);}
  bell(){this.tone(660,2,.25);this.tone(990,1.5,.09);}
  update(dt:number,time:number,position:T.Vector3,yaw:number,walking:boolean,sprinting:boolean){
    if(!this.context||!this.output)return;
    const ctx=this.context,bed=soundscape(this.floor);this.wind?.gain.setTargetAtTime(bed.wind*(1+.18*Math.sin(time*.19)),ctx.currentTime,.6);
    this.tones.forEach((tone,i)=>{
      const desert=this.floor==='the-elephants',x=desert?(i?10:-8.6):(i?6:-4),z=desert?(i?-42:-36):-34,dx=x-position.x,dz=z-position.z,distance=Math.hypot(dx,dz);
      const gain=bed.level*Math.max(0,1-distance/bed.range)*(1+.2*Math.sin(time*.16));
      tone.gain.gain.setTargetAtTime(gain,ctx.currentTime,.4);
      tone.pan.pan.setTargetAtTime(T.MathUtils.clamp((dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(1,distance),-1,1),ctx.currentTime,.2);
    });
    if(walking){this.stepTimer-=dt;if(this.stepTimer<=0){this.stepTimer=sprinting?.31:.46;this.tone(72+Math.random()*22,.12,.045,'triangle');}}
    else this.stepTimer=0;
    this.chimeTimer+=dt;
    if(this.floor==='the-elephants'&&this.chimeTimer>17){this.chimeTimer=0;this.tone(293.66,3,.035);this.tone(440,2.2,.014);}
  }
}
