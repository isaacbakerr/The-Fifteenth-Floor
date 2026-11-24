import * as T from 'three';

export interface WalkableWorld { blocked(x:number,z:number):boolean; height(x:number,z:number):number }
export class Controls {
  keys=new Set<string>(); active=false; fallback=false; autoWalk=false;
  yaw=0; pitch=-.05; private dragging=false;
  constructor(readonly camera:T.PerspectiveCamera,readonly canvas:HTMLCanvasElement){
    document.addEventListener('keydown',event=>{
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE'].includes(event.code))event.preventDefault();
      if(event.code==='Escape'){this.autoWalk=false;this.keys.clear();if(this.fallback){this.active=false;document.body.classList.remove('playing');}}
      if(!this.active)return;
      this.keys.add(event.code);
      if(event.code==='KeyR'&&!event.repeat)this.autoWalk=!this.autoWalk;
      if(this.fallback){if(event.code==='ArrowLeft')this.yaw+=.12;if(event.code==='ArrowRight')this.yaw-=.12;if(event.code==='ArrowUp')this.pitch=T.MathUtils.clamp(this.pitch+.08,-1.4,1.4);if(event.code==='ArrowDown')this.pitch=T.MathUtils.clamp(this.pitch-.08,-1.4,1.4);}
    });
    document.addEventListener('keyup',event=>this.keys.delete(event.code));
    document.addEventListener('pointerlockchange',()=>{if(!this.fallback)this.active=document.pointerLockElement===canvas;this.keys.clear();this.autoWalk=false;document.body.classList.toggle('playing',this.active);});
    canvas.addEventListener('pointerdown',()=>{this.dragging=this.active&&this.fallback;});
    window.addEventListener('pointerup',()=>{this.dragging=false;});
    document.addEventListener('mousemove',event=>{if(!this.active||(this.fallback&&!this.dragging))return;this.yaw-=event.movementX*.002;this.pitch=T.MathUtils.clamp(this.pitch-event.movementY*.002,-1.4,1.4);});
    window.addEventListener('blur',()=>{this.keys.clear();this.autoWalk=false;});
  }
  async enter(){
    if(this.active)return;this.fallback=false;
    try{await this.canvas.requestPointerLock();}
    catch{this.fallback=true;this.active=true;document.body.classList.add('playing');document.querySelector('footer')!.textContent='WASD WALK ? DRAG / ARROWS LOOK ? SHIFT STRIDE ? E LIFT PANEL ? ESC PAUSE';}
  }
  update(dt:number,world:WalkableWorld){
    this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
    if(!this.active)return;
    const direction=new T.Vector3(Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA')),0,Number(this.keys.has('KeyS'))-Number(this.keys.has('KeyW')||this.autoWalk));
    if(direction.lengthSq()>0)direction.normalize().applyAxisAngle(new T.Vector3(0,1,0),this.yaw).multiplyScalar(dt*(this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')?4.4:2.4));
    // Small substeps keep low-frame-rate movement from crossing a wall.
    const steps=Math.max(1,Math.ceil(direction.length()/.08));direction.divideScalar(steps);
    const p=this.camera.position;
    for(let i=0;i<steps;i++){if(!world.blocked(p.x+direction.x,p.z))p.x+=direction.x;if(!world.blocked(p.x,p.z+direction.z))p.z+=direction.z;}
    p.y=T.MathUtils.damp(p.y,world.height(p.x,p.z)+1.7,18,dt);
  }
}
