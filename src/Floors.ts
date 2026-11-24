import * as T from 'three';
import {MemoryReconstruction as PersistenceOfMemory} from './exhibits/MemoryReconstruction';
import {TheElephants} from './exhibits/TheElephants';
import {Sleep} from './exhibits/Sleep';
import {createSacredWorlds} from './exhibits/collection/Sacred';
import {createIllusionWorlds} from './exhibits/collection/Illusions';
import {createDreamWorlds} from './exhibits/collection/Dreams';
import type {Floor,QualityProfile} from './Graphics';

/** A shuffled circuit visits every world before reshuffling, without repeated stops. */
export class Floors {
  readonly available:Floor[];current?:Floor;
  private remaining:Floor[]=[];
  constructor(scene:T.Scene){this.available=[new PersistenceOfMemory(scene),new TheElephants(scene),new Sleep(scene),...createSacredWorlds(scene),...createIllusionWorlds(scene),...createDreamWorlds(scene)].sort((a,b)=>Number(a.floorNumber)-Number(b.floorNumber));this.available.forEach(f=>f.group.visible=false);}
  arrive(preferredId?:string){
    const preferred=this.available.find(f=>f.id===preferredId);
    if(!this.remaining.length){this.remaining=[...this.available];for(let i=this.remaining.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.remaining[i],this.remaining[j]]=[this.remaining[j],this.remaining[i]];}if(this.remaining[this.remaining.length-1]===this.current)[this.remaining[0],this.remaining[this.remaining.length-1]]=[this.remaining[this.remaining.length-1],this.remaining[0]];}
    const next=preferred??this.remaining[this.remaining.length-1];this.remaining=this.remaining.filter(f=>f!==next);
    this.available.forEach(f=>f.group.visible=f===next);this.current=next;return next;
  }
  setQuality(profile:QualityProfile){this.available.forEach(f=>f.setQuality?.(profile));}
  update(dt:number,time:number){this.current?.update?.(dt,time);}
  blocked(x:number,z:number){return this.current?.blocked(x,z)??z<-1.6;}
  height(x:number,z:number){return this.current?.height(x,z)??0;}
}
