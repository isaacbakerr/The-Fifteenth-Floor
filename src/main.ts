import * as T from 'three';
import './style.css';
import {Elevator} from './Elevator';
import {Controls} from './Controls';
import {Floors} from './Floors';
import {Sound} from './Sound';
import {updateArtworkCard} from './Artwork';
import {Graphics,type QualityName} from './Graphics';
import {addSky} from './exhibits/PersistenceOfMemory';
import {improveSurfaces} from './Surface';

const canvas=document.querySelector<HTMLCanvasElement>('#world')!;
const renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new T.Scene();scene.background=new T.Color(0xbac6ab);scene.fog=new T.FogExp2(0xbac6ab,.006);const originalSky=addSky(scene);
const camera=new T.PerspectiveCamera(60,innerWidth/innerHeight,.055,650);camera.position.set(0,1.7,1.3);
const hemisphere=new T.HemisphereLight(0xc6d6c6,0x66513a,1.5);scene.add(hemisphere);
const environmentScene=new T.Scene();addSky(environmentScene);const pmrem=new T.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(environmentScene,.02,.1,1000).texture;scene.environmentIntensity=.65;pmrem.dispose();
const sun=new T.DirectionalLight(0xffdfa2,3.1);sun.position.set(-13,9,15);sun.target.position.set(0,0,-8);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:1,far:110});sun.shadow.bias=-.00015;sun.shadow.normalBias=.025;scene.add(sun,sun.target);
const graphics=new Graphics(renderer,sun),elevator=new Elevator(scene),floors=new Floors(scene),controls=new Controls(camera,canvas),sound=new Sound();
improveSurfaces(scene);
floors.setQuality(graphics.profile);
const select=document.querySelector<HTMLSelectElement>('#graphics')!;select.value=graphics.profile.name;
select.addEventListener('change',()=>{graphics.apply(select.value as QualityName);floors.setQuality(graphics.profile);renderDirty=true;});
const prompt=document.querySelector('#prompt')!,caption=document.querySelector<HTMLElement>('#caption')!,soundButton=document.querySelector('#sound')!;
soundButton.textContent=sound.enabled?'SOUND ON':'SOUND OFF';
let captionTime=0,time=0,renderDirty=true,previousActive=false;
const parameters=new URLSearchParams(location.search);let qaFloor=parameters.get('floor');
let requestedFirstTrip=!!qaFloor&&!parameters.has('verify')&&floors.available.some(f=>f.id===qaFloor);
function say(value:string){caption.textContent=value;captionTime=6;}
const world={blocked:(x:number,z:number)=>elevator.blocked(x,z)||floors.blocked(x,z),height:(x:number,z:number)=>floors.height(x,z)};
function nearPanel(){if(camera.position.z< -1.4||camera.position.distanceTo(elevator.panel)>3.8)return false;return camera.getWorldDirection(new T.Vector3()).dot(elevator.panel.clone().sub(camera.position).normalize())>.95;}
function travel(){if(!controls.active||!nearPanel()||!elevator.travel())return;document.querySelector<HTMLElement>('#credit')!.hidden=true;document.body.classList.remove('arrived');sound.hum();controls.autoWalk=false;controls.keys.clear();say('The lift is choosing a floor.');}
function configureFloor(){
  const floor=floors.arrive(qaFloor??undefined);qaFloor=null;
  const desert=floor.id==='the-elephants',dream=floor.id==='sleep',atmosphere=floor.atmosphere;originalSky.visible=!(desert||dream||atmosphere);
  scene.fog=new T.FogExp2(desert?0xc77746:dream?0xaac4c0:0xbac6ab,desert?.0045:dream?.005:.006);
  sun.color.set(desert?0xffb768:dream?0xffe4ad:0xffdfa2);sun.intensity=desert?2.6:3.1;
  sun.position.set(desert?-45:dream?-20:-13,desert?19:dream?13:9,desert?-36:15);
  sun.target.position.set(0,0,desert?-43:dream?-26:-8);
  const extent=desert?76:dream?48:25;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,far:desert?200:dream?150:110});sun.shadow.camera.updateProjectionMatrix();
  hemisphere.color.set(desert?0xf1c4a0:dream?0xc7dfdc:0xc6d6c6);hemisphere.groundColor.set(desert?0x7e3d32:dream?0x6c7261:0x66513a);hemisphere.intensity=desert?1.2:dream?1.4:1.5;
  if(atmosphere){
    scene.fog=new T.FogExp2(atmosphere.horizon,atmosphere.fog);scene.background=new T.Color(atmosphere.horizon);
    sun.color.set(atmosphere.sun);sun.position.set(...atmosphere.sunPosition);sun.target.position.set(0,1,-30);sun.intensity=atmosphere.sunIntensity??2.8;
    const extent=atmosphere.extent??52;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,far:200});sun.shadow.camera.updateProjectionMatrix();
    hemisphere.color.set(atmosphere.horizon);hemisphere.groundColor.set(atmosphere.ground);hemisphere.intensity=atmosphere.hemisphereIntensity??1.25;
  }
  renderer.toneMappingExposure=atmosphere?.exposure??1.05;
  scene.environmentIntensity=atmosphere?.environmentIntensity??.65;
  updateArtworkCard(document.querySelector<HTMLElement>('#credit')!,floor.artwork);
  sound.setFloor(floor.id);sound.bell();say(desert?'The Elephants. Walk beneath the weight of a dream.':dream?'Sleep. A dream held together by delicate supports.':atmosphere?'You have arrived. Step into '+floor.artwork.title+'.':'You have arrived. Step through the frame.');
  document.body.classList.add('arrived');canvas.dataset.floor=floor.id;renderer.shadowMap.needsUpdate=true;return floor.floorNumber;
}
const enter=()=>{sound.start();void controls.enter();if(requestedFirstTrip&&elevator.phase==='idle'){requestedFirstTrip=false;elevator.travel();sound.hum();say('Next stop: '+floors.available.find(f=>f.id===qaFloor)!.artwork.title+'.');}};document.querySelector('#enter')!.addEventListener('click',enter);canvas.addEventListener('click',enter);
soundButton.addEventListener('click',()=>{sound.toggle();soundButton.textContent=sound.enabled?'SOUND ON':'SOUND OFF';});
document.addEventListener('keydown',event=>{if(event.code==='KeyE'&&!event.repeat)travel();});
let previous=performance.now();const lastPosition=new T.Vector3();
function frame(now:number){
  requestAnimationFrame(frame);const realDt=Math.min(.25,(now-previous)/1000),dt=Math.min(.04,realDt);previous=now;
  if(controls.active!==previousActive){sound.setPaused(!controls.active);renderDirty=true;previousActive=controls.active;}
  if(controls.active){
    time+=dt;elevator.update(dt,configureFloor);
    if(elevator.phase==='travel'){controls.yaw=T.MathUtils.damp(controls.yaw,0,2,dt);controls.pitch=T.MathUtils.damp(controls.pitch,-.05,2,dt);camera.position.x=T.MathUtils.damp(camera.position.x,0,2,dt);camera.position.z=T.MathUtils.damp(camera.position.z,1.3,2,dt);}
    lastPosition.copy(camera.position);controls.update(dt,world);floors.update(dt,time);
    const walking=lastPosition.distanceToSquared(camera.position)>.00005;
    sound.update(dt,time,camera.position,controls.yaw,walking,controls.keys.has('ShiftLeft')||controls.keys.has('ShiftRight'));
    prompt.textContent=nearPanel()&&(elevator.phase==='idle'||elevator.phase==='open')?'[ E ]  TRAVEL TO A RANDOM FLOOR':'';
    captionTime-=dt;caption.style.opacity=captionTime>0?'1':'0';
    // Static world/leg shadows are reused while walking; moving doors refresh them.
    if(elevator.phase!=='open')renderer.shadowMap.needsUpdate=true;
  }
  canvas.dataset.phase=elevator.phase;canvas.dataset.position=[camera.position.x,camera.position.y,camera.position.z].map(n=>n.toFixed(3)).join(',');
  if(controls.active||renderDirty){renderer.render(scene,camera);renderDirty=false;}
  graphics.sample(realDt,controls.active);
}
requestAnimationFrame(frame);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();graphics.resize();renderDirty=true;});
if(parameters.has('verify'))import('./verification').then(m=>m.setupVerification(controls,elevator,floors,camera,world));
