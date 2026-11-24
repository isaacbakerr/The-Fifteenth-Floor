import * as T from 'three';
import type {Controls,WalkableWorld} from './Controls';
import type {Elevator} from './Elevator';
import type {Floors} from './Floors';

/** Optional browser QA panel. Routes use the production movement and E handler. */
export function setupVerification(c:Controls,lift:Elevator,floors:Floors,camera:T.PerspectiveCamera,world:WalkableWorld){
  const panel=document.createElement('aside');panel.style.cssText='position:fixed;right:20px;top:95px;width:300px;background:#10252dee;padding:15px;color:white;font:12px monospace;z-index:100;line-height:1.6';
  const status=document.createElement('div'),button=document.createElement('button');button.textContent='Run next world check';panel.append(status,button);document.body.append(panel);
  let step=0;const results:string[]=[];
  const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
  async function until(predicate:()=>boolean,timeout=20000){const start=performance.now();while(!predicate()){if(performance.now()-start>timeout)throw Error('Timed out waiting for lift');await wait(100);}}
  async function walk(points:number[][]){
    c.active=true;c.fallback=true;c.autoWalk=false;document.body.classList.add('playing');
    for(const [x,z]of points){const start=performance.now();await new Promise<void>((resolve,reject)=>{function advance(){const dx=x-camera.position.x,dz=z-camera.position.z;if(Math.hypot(dx,dz)<.1){c.keys.clear();resolve();return;}if(performance.now()-start>22000){c.keys.clear();reject(Error(`Obstructed at ${camera.position.x.toFixed(2)}, ${camera.position.z.toFixed(2)}`));return;}c.yaw=Math.atan2(-dx,-dz);c.keys.add('KeyW');if(floors.current?.id!=='persistence-of-memory'&&Math.hypot(dx,dz)>12)c.keys.add('ShiftLeft');else c.keys.delete('ShiftLeft');requestAnimationFrame(advance);}advance();});}c.keys.clear();
  }
  function look(x:number,y:number,z:number){const dx=x-camera.position.x,dz=z-camera.position.z;c.yaw=Math.atan2(-dx,-dz);c.pitch=Math.atan2(y-camera.position.y,Math.hypot(dx,dz));camera.rotation.set(c.pitch,c.yaw,0,'YXZ');camera.updateMatrixWorld();}
  function activate(){look(lift.panel.x,lift.panel.y,lift.panel.z);document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE'}));}
  async function navigate(x:number,z:number){
    const start=[Math.round(camera.position.x),Math.round(camera.position.z)],target=[Math.round(x),Math.round(z)],key=(a:number,b:number)=>`${a},${b}`,queue=[start],parents=new Map<string,string|null>([[key(...start as [number,number]),null]]);let goal='';
    for(let i=0;i<queue.length;i++){const [a,b]=queue[i],k=key(a,b);if(Math.hypot(a-target[0],b-target[1])<1.5){goal=k;break;}
      for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=a+dx,nz=b+dz,nk=key(nx,nz);if(Math.abs(nx)>47||nz<-75||nz>3||parents.has(nk)||[0,.25,.5,.75,1].some(t=>world.blocked(a+dx*t,b+dz*t)))continue;parents.set(nk,k);queue.push([nx,nz]);}}
    if(!goal)throw Error('No clear route to inspection point');const route:number[][]=[];for(let k:string|null=goal;k;k=parents.get(k)??null)route.push(k.split(',').map(Number));route.reverse();const turns=route.filter((p,i)=>i===0||i===route.length-1||(p[0]-route[i-1][0]!==route[i+1][0]-p[0]||p[1]-route[i-1][1]!==route[i+1][1]-p[1]));await walk(turns);
  }
  button.onclick=async()=>{button.disabled=true;status.textContent='Checking…';try{
    if(step===0){await walk([[0,-1.15]]);c.yaw=0;c.keys.add('KeyW');await wait(700);c.keys.clear();if(camera.position.z<-1.66)throw Error('Closed-door collision failed');results.push('Closed doors solid');await walk([[.65,-.65]]);activate();await until(()=>lift.phase==='open');if(!floors.current)throw Error('No developed floor selected');c.yaw=0;c.pitch=-.05;results.push('Random developed floor arrived');}
    if(step===1){await walk([[0,-3],[0,-7]]);look(0,1.3,-16);results.push('Walked out into continuous 3D world');}
    if(floors.current?.group.userData.paintingSpace&&step>=2){
      if(step===2){await navigate(18,-30);look(0,world.height(0,-30)+6,-35);results.push('Inspected the tableau from the right');}
      if(step===3){await navigate(18,-52);look(0,world.height(0,-35)+8,-35);results.push('Reached the back of the tableau');}
      if(step===4){await navigate(0,-65);await navigate(-18,-48);look(0,world.height(0,-35)+6,-35);results.push('Circled to the left side');}
      if(step===5){await navigate(0,-5);await walk([[0,.2],[.65,-.65]]);activate();await until(()=>lift.phase==='open');c.yaw=0;c.pitch=-.05;results.push('Returned and travelled again');}
      step++;status.textContent=results.join(' · ');if(step>5)button.textContent='All exploration checks passed';button.disabled=false;return;
    }
    if(step===2&&floors.current?.id==='sleep'){await walk([[0,-22],[0,-34]]);look(-4,5.6,-34);results.push('Walked beneath the sleeping head');}
    else if(step===2&&floors.current?.id==='the-elephants'){const [x,y,z]=floors.current.group.userData.elephantCentres[0];await walk([[0,-16],[x,z]]);look(x,y,z-.8);results.push('Walked beneath the left elephant');}
    else if(step===2){await walk([[-4.1,-7],[-4.1,-8],[-1.2,-7.9]]);look(-1,1.55,-5.6);results.push('Explored behind the branch watch');}
    if(step===3&&floors.current?.id==='sleep'){if(!world.blocked(-6.8,-30))throw Error('Crutch collision missing');await walk([[5,-40],[11,-39]]);look(-3,6,-34);results.push('Circled the solid head; crutches block movement');}
    else if(step===3&&floors.current?.id==='the-elephants'){const [x]=floors.current.group.userData.elephantCentres[0],[fx,,fz]=floors.current.group.userData.stiltFeet[0];if(!world.blocked(fx,fz))throw Error('Stilt collision missing');await walk([[x,-32],[-14,-32],[-14,-42],[0,-55],[2,-70]]);look(-1.25,world.height(-1.25,-70)+1,-70);results.push('Stilts solid; reached the miniature pavilion');}
    else if(step===3){await walk([[4.6,-8],[4.6,-4],[2.7,-2.5]]);look(1.3,.5,-4.8);if(!world.blocked(1.2,-4.7))throw Error('Sculpture collision missing');results.push('Circled the solid sleeping sculpture');}
    if(step===4&&floors.current?.id==='sleep'){await walk([[12,-49],[10,-57]]);look(15,2,-53);if(!world.blocked(15,-53))throw Error('Settlement collision missing');results.push('Reached the pale settlement');}
    else if(step===4&&floors.current?.id==='the-elephants'){const [x,y,z]=floors.current.group.userData.elephantCentres[1];await walk([[15,-55],[15,-41],[x,z]]);look(x,y,z-.8);results.push('Reached the right elephant');}
    else if(step===4){await walk([[4.6,-3],[4.6,-11],[0,-20],[0,-30]]);c.yaw=0;c.keys.add('KeyW');await wait(1100);c.keys.clear();if(camera.position.z<-31.5)throw Error('Sea boundary failed');look(7,2.4,-33);results.push('Reached shoreline and solid cliffs');}
    if(step===5){const wasSleep=floors.current?.id==='sleep',wasElephants=floors.current?.id==='the-elephants';await walk(wasSleep?[[0,-46],[0,-10],[0,.2],[.65,-.65]]:wasElephants?[[0,-20],[0,.2],[.65,-.65]]:[[0,-21],[0,-9],[0,.2],[.65,-.65]]);activate();await until(()=>lift.phase==='open');c.yaw=0;c.pitch=-.05;results.push('Returned and travelled again');}
    step++;status.textContent=results.join(' · ');if(step>5)button.textContent='All exploration checks passed';
  }catch(error){status.textContent=String(error);}button.disabled=false;};
}
