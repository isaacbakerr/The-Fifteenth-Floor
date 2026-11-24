import * as T from 'three';
import type {Artwork} from '../../Artwork';
import {coastal,marble} from '../World';
import {PaintedWorld,type Pixel} from '../PaintedWorld';
import {Galatea} from '../Galatea';
import type {Floor} from '../../Graphics';

export const illusionArtworks:Record<string,Artwork>={
  'galatea-spheres':{artist:'Salvador Dalí',title:'Galatea of the Spheres',year:'1952',background:'Gala’s portrait dissolves into suspended spheres. Painted during Dalí’s nuclear-mystical period, the work brings together his fascination with atomic matter and classical beauty. The apparently solid face emerges from separate forms, with air and space between them.',source:'https://catalogues.salvador-dali.org/catalogues/en/heritageobject/54/'},
  'swans-reflecting-elephants':{artist:'Salvador Dalí',title:'Swans Reflecting Elephants',year:'1937',background:'Three swans and bare trees stand beside a still lake, where their reflections become elephants. Dalí uses a double image to make ordinary things unstable: looking again changes what is seen. The rocky Catalan landscape makes the impossible transformation feel strangely tangible.',source:'https://catalogues.salvador-dali.org/catalogues/en/heritageobject/389/'},
  'metamorphosis-narcissus':{artist:'Salvador Dalí',title:'Metamorphosis of Narcissus',year:'1937',background:'Dalí retells the ancient myth of Narcissus, absorbed by his own reflection. The crouching figure is echoed by a stone hand holding an egg from which a flower grows. A poem accompanied the painting, linking its doubled forms to transformation and desire.',source:'https://catalogues.salvador-dali.org/catalogues/en/heritageobject/1198-965c/'},
  'swallows-tail':{artist:'Salvador Dalí',title:'The Swallow’s Tail',year:'1983',background:'In his final years Dalí explored René Thom’s catastrophe theory, which describes sudden changes in apparently stable systems. Here, sweeping mathematical curves meet the shapes of a cello. This walkable sculpture gives physical depth to the painting’s spare lines and folded surface.',source:'https://www.museoreinasofia.es/en/collections/artwork/cola-de-golondrina-swallows-tail/'},
};

/** Independently rounded subjects, traced from the painting; no backdrop plane. */
class Swans extends PaintedWorld {
  private readonly waterY=-3.15;
  constructor(scene:T.Scene){
    super(scene,'swans-reflecting-elephants','17',illusionArtworks['swans-reflecting-elephants'],{...coastal,sky:0x9b9bbd,horizon:0xe8dbc2,ground:0x88713b,sunPosition:[-30,23,12]}, {image:'/textures/swans-pigment.jpg',width:395,height:252,span:14.7,depth:35,horizon:1,centreY:.4});
    const cliffs:{name:string;edge:Pixel[];d:number;b:number}[]=[
      {name:'Left golden cliff face',edge:[[0,72],[22,75],[38,74],[55,79],[72,83],[87,93],[104,101],[116,122],[128,131],[133,158],[125,176],[96,183],[74,180],[56,181],[29,180],[0,183]],d:45,b:2.4},
      {name:'Dark high cliff crest',edge:[[0,78],[9,43],[16,40],[24,62],[29,75],[57,78],[78,91],[80,111],[53,101],[41,90],[25,101],[11,96]],d:46,b:1.5},
      {name:'Gold cleft in left bank',edge:[[25,110],[39,95],[49,95],[49,117],[64,128],[59,148],[45,154],[34,146],[31,130]],d:42,b:1},
      {name:'Left foreground promontory',edge:[[0,183],[20,187],[38,181],[58,185],[73,199],[67,219],[52,240],[0,252]],d:24,b:.8},
      {name:'Right sunlit cliff',edge:[[274,102],[291,91],[310,86],[330,86],[344,80],[360,83],[377,80],[395,83],[395,186],[378,181],[367,167],[344,162],[324,169],[304,160],[290,155],[280,138]],d:46,b:2.5},
      {name:'Right cliff buttress',edge:[[305,118],[321,108],[343,108],[355,120],[350,141],[361,159],[348,170],[330,164],[319,148]],d:42,b:1.8},
      {name:'Right foreground bank',edge:[[395,178],[384,184],[379,197],[382,211],[369,223],[363,239],[350,245],[395,252]],d:25,b:1.1},
      {name:'Far central rocky island',edge:[[132,146],[147,141],[160,147],[178,146],[199,150],[220,147],[238,155],[256,149],[273,157],[282,171],[272,179],[243,184],[209,179],[176,182],[151,179],[137,171]],d:38,b:.55},
    ];cliffs.forEach(c=>this.solid(c.name,c.edge,c.d,c.b));
    // The reflected grove is actual inverted geometry; additional broad ears
    // make the double-image elephant reading legible through the water.
    const reflections:Pixel[][]=[
      [[90,187],[102,188],[110,197],[119,207],[126,206],[130,199],[132,190],[138,187],[141,199],[138,213],[129,220],[120,222],[113,216],[107,206],[97,203],[94,217],[87,229],[79,232],[78,227],[84,216],[84,206]],
      [[137,181],[153,184],[158,190],[164,190],[172,185],[180,181],[188,184],[187,195],[179,204],[176,218],[176,239],[169,239],[166,218],[161,216],[158,239],[151,240],[152,217],[145,211],[140,202]],
      [[215,181],[231,186],[247,186],[258,180],[271,182],[277,195],[272,210],[274,235],[269,240],[264,224],[260,208],[253,211],[246,235],[239,239],[243,221],[242,208],[236,209],[228,219],[221,218],[218,207],[223,195]],
    ];reflections.forEach((edge,i)=>this.submerge(this.solid(`Submerged elephant reflection ${i+1}`,edge,33,.7),33));
    this.submerge(this.solid('Curled reflected trunk',[[215,190],[219,192],[225,196],[232,199],[240,199],[244,195],[247,191],[249,193],[247,202],[238,207],[229,206],[221,201],[217,197]],32,.3),32);
    const waterEdge:Pixel[]=[[35,181],[93,182],[136,180],[183,181],[223,184],[270,181],[294,174],[325,172],[354,175],[380,185],[376,201],[379,212],[365,225],[361,236],[336,241],[306,242],[267,242],[223,243],[184,242],[142,242],[106,241],[67,240],[51,232],[56,215],[63,201],[58,190]];
    const points=waterEdge.map(p=>this.onWater(p[0],p[1],this.waterY)),shape=points.map(p=>new T.Vector2(p.x,p.z)),ix=T.ShapeUtils.triangulateShape(shape,[]).flat(),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flatMap(p=>[p.x,p.y,p.z]),3));g.setIndex(ix);g.computeVertexNormals();
    const water=this.mat(0x72a6a0,.13,.25);water.transparent=true;water.opacity=.32;water.depthWrite=false;water.side=T.DoubleSide;
    const lake=this.mesh(this.group,g,water);lake.name='Transparent still lake above modeled reflections';lake.castShadow=false;
    const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minZ=Math.min(...points.map(p=>p.z)),maxZ=Math.max(...points.map(p=>p.z));this.obstacle((minX+maxX)/2,(minZ+maxZ)/2,(maxX-minX)*.46,(maxZ-minZ)*.46);
    // Thin bent branch geometry keeps its silhouette when seen from the banks.
    const branches:{p:Pixel[];r:number;d:number}[]=[
      {p:[[154,177],[158,146],[155,109],[152,75],[150,36],[143,11],[137,5]],r:2,d:38},
      {p:[[152,77],[165,50],[165,30],[158,8]],r:1.6,d:39},
      {p:[[164,42],[179,24],[191,5],[200,0]],r:1.1,d:40},
      {p:[[163,31],[170,11],[168,3]],r:1.2,d:39},
      {p:[[156,113],[144,99],[137,91],[137,71]],r:1.2,d:37},
      {p:[[139,94],[128,80],[128,66]],r:.9,d:38},
      {p:[[183,176],[181,147],[184,125],[180,114],[182,101]],r:2,d:38},
      {p:[[220,177],[227,149],[231,125],[225,107],[218,95],[215,80],[220,72]],r:2.2,d:40},
      {p:[[223,102],[238,95],[247,85],[248,67],[245,53],[239,40]],r:1,d:41},
      {p:[[248,83],[258,70],[266,57]],r:1,d:41},
      {p:[[244,66],[237,57],[230,55],[226,47]],r:.8,d:40},
      {p:[[263,176],[270,155],[270,136],[277,116],[279,92],[283,66],[283,40]],r:2.4,d:41},
    ];const branchWood=this.mat(0x504b36,.9);branches.forEach((b,i)=>this.stroke(`Bare branch ${i+1}`,b.p,b.r,b.d,branchWood));
    const swans:{name:string;edge:Pixel[];d:number;b:number}[]=[
      {name:'Left swan body',edge:[[117,160],[122,170],[135,178],[153,177],[162,170],[158,161],[146,154],[140,158],[137,167],[128,168]],d:34,b:.7},
      {name:'Left swan raised neck',edge:[[131,175],[128,162],[130,151],[135,138],[135,131],[129,130],[124,137],[121,139],[122,134],[127,127],[134,127],[139,132],[139,140],[135,154],[134,169]],d:33,b:.3},
      {name:'Centre swan body',edge:[[164,166],[169,173],[179,180],[194,180],[201,172],[198,160],[189,159],[185,169],[177,169]],d:32,b:.8},
      {name:'Centre swan folded neck',edge:[[180,174],[178,160],[180,148],[181,139],[185,135],[189,136],[191,141],[188,145],[186,153],[186,168]],d:31,b:.35},
      {name:'Right swan body',edge:[[213,170],[221,180],[235,184],[248,179],[255,171],[245,167],[232,169],[223,165]],d:34,b:.9},
      {name:'Right swan curled neck',edge:[[223,175],[216,169],[211,166],[209,158],[211,153],[216,151],[220,153],[224,158],[221,160],[217,156],[214,156],[214,163],[221,169],[229,173]],d:33,b:.28},
    ];swans.forEach(s=>this.solid(s.name,s.edge,s.d,s.b));
    this.solid('Small figure on left bank',[[85,188],[91,191],[94,198],[90,203],[88,211],[81,215],[77,212],[80,205],[78,199],[81,196]],27,.3);this.stroke('Bank figure raised arm',[[82,199],[74,194],[72,190]],1.3,26);
    this.sea(-79,0x8cae9d);this.finish();
  }
  private onWater(x:number,y:number,plane:number){const p=this.point(x,y),t=(plane-1.7)/(p.y-1.7);return new T.Vector3(p.x*t,plane,1.3+(p.z-1.3)*t);}
  private submerge(o:T.Mesh,depth:number){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),plane=this.waterY-.09+(z+depth)*.07,t=(plane-1.7)/(y-1.7);p.setXYZ(i,x*t,plane,1.3+(z-1.3)*t);}this.pigment(o.geometry);o.geometry.computeVertexNormals();}
}

class Narcissus extends PaintedWorld {
  constructor(scene:T.Scene){
    super(scene,'metamorphosis-narcissus','18',illusionArtworks['metamorphosis-narcissus'],{...coastal,sky:0x537c80,horizon:0xc8d3ae,ground:0x765333,sunPosition:[-28,24,18]}, {image:'/textures/narcissus-pigment.jpg',width:391,height:255,span:14.9,depth:34,horizon:1,centreY:.5});
    // The bent knee, hanging forearm, bowed head and raised shoulder repeat
    // the three-pronged silhouette of the stone hand opposite.
    this.solid('Narcissus raised shoulder',[[102,31],[117,22],[133,23],[140,33],[145,49],[148,62],[159,72],[168,80],[168,89],[156,90],[144,79],[135,61],[122,55],[115,45]],33,1.3);
    this.solid('Narcissus bowed oval head',[[101,28],[111,29],[116,39],[115,52],[109,63],[99,67],[90,62],[89,53],[91,41]],31,.9);
    this.solid('Narcissus folded back and torso',[[100,69],[110,64],[121,64],[132,73],[141,88],[142,105],[133,124],[132,145],[126,164],[116,173],[105,168],[101,153],[107,132],[110,117],[104,104],[95,91]],34,1.8);
    this.solid('Narcissus left forearm',[[96,76],[105,80],[111,96],[109,113],[108,130],[112,148],[111,164],[106,174],[101,169],[102,155],[99,142],[94,123],[92,105],[91,89]],30.5,.65);
    this.solid('Narcissus long right shin',[[150,104],[160,101],[168,104],[168,116],[163,133],[159,150],[155,168],[155,186],[149,192],[140,191],[136,184],[140,172],[143,154],[145,136],[148,119]],31,1);
    this.solid('Narcissus lifted knee',[[82,114],[90,118],[98,127],[99,140],[91,145],[79,146],[71,140],[71,128],[75,118]],32,.85);
    this.solid('Narcissus foot by pool',[[75,152],[87,149],[100,155],[105,165],[102,174],[95,179],[83,178],[73,173]],30,.55);
    // Separated fingers have round joints and flattened nails, not a single cutout.
    this.solid('Stone hand palm',[[253,139],[263,134],[275,138],[284,154],[287,176],[293,199],[295,215],[290,224],[279,226],[265,224],[257,216],[253,200],[251,178],[251,157]],34,1.7);
    this.solid('Stone hand left finger',[[244,80],[250,77],[257,83],[262,96],[264,110],[268,127],[273,139],[271,151],[262,155],[254,143],[250,128],[247,114],[242,101],[239,90]],31.5,.75);
    this.solid('Stone hand right thumb',[[269,30],[273,26],[277,31],[281,40],[290,49],[299,59],[303,71],[308,79],[314,87],[315,96],[312,108],[306,120],[303,132],[301,144],[297,156],[294,170],[293,184],[294,195],[292,208],[288,212],[284,208],[284,195],[285,181],[286,167],[287,154],[290,142],[292,129],[295,117],[298,106],[301,98],[301,89],[296,82],[292,75],[289,66],[284,59],[281,50],[279,42],[273,37],[270,34]],35,.85);
    this.bead('Egg held by the stone fingers',244,52,20,24,31.8,.85);this.stroke('Crack through the egg',[[239,33],[241,39],[238,43],[242,47],[241,52],[245,56]],.7,30.9);
    this.stroke('Narcissus flower stem',[[242,38],[243,24],[248,11],[252,5]],.7,31.4);this.stroke('Narcissus branching stem',[[245,19],[257,17],[261,10]],.5,31.5);
    for(const [x,y,r]of [[252,6,4],[262,9,3],[248,14,3]] as [number,number,number][]){for(let k=0;k<5;k++){const a=k*Math.PI*2/5;this.bead('White narcissus petal',x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.6,r*.6,r*.35,31,.035);}}
    // A low still pool holds the warm inverted silhouette of Narcissus.
    this.solid('Warm reflection of the bowed head',[[88,177],[101,175],[106,188],[101,205],[101,223],[92,237],[85,233],[83,213],[85,194]],29,.12);this.solid('Warm reflection of the knee',[[74,178],[85,181],[85,196],[81,207],[70,207],[63,197],[63,185]],28.5,.12);
    this.solid('Dark foreground shore',[[0,236],[37,240],[70,238],[104,235],[132,229],[156,223],[178,218],[205,215],[230,213],[248,222],[269,232],[300,234],[333,230],[365,221],[391,219],[391,255],[0,255]],24,.35,false);
    const banks:{p:Pixel[];d:number;b:number}[]=[
      {p:[[0,0],[34,0],[46,8],[42,25],[30,47],[24,73],[20,99],[21,125],[29,140],[17,155],[0,154]],d:43,b:2},
      {p:[[43,11],[70,7],[92,14],[109,17],[103,38],[88,58],[82,84],[85,108],[76,117],[63,111],[57,91],[53,63],[38,46]],d:41,b:1.8},
      {p:[[117,0],[152,0],[171,4],[186,15],[188,38],[182,60],[175,83],[170,99],[166,91],[165,70],[155,58],[141,42],[130,30]],d:43,b:2},
      {p:[[283,0],[316,0],[338,14],[344,32],[358,40],[377,34],[391,36],[391,91],[368,87],[347,78],[330,72],[318,62],[301,63],[290,45]],d:48,b:2.7},
      {p:[[352,80],[367,72],[377,82],[379,98],[389,103],[391,140],[379,149],[366,135],[361,119],[349,108]],d:43,b:1.3},
    ];banks.forEach((b,i)=>this.solid(`Rocky amphitheatre ${i+1}`,b.p,b.d,b.b));
    const cream=this.mat(0xcdcba5),dark=this.mat(0x46574b);for(let x=0;x<7;x++)for(let y=0;y<3;y++){const left=303+x*12,top=96+y*6,o=this.blockPixels('Distant checkerboard tile',[[left,top],[left+12,top],[left+12,top+6],[left,top+6]],46,.045);o.material=(x+y)%2?cream:dark;}
    const people:Pixel[][]=[[[181,104],[183,97],[186,97],[187,102],[185,109],[186,117],[182,118],[182,110]],[[190,100],[192,92],[195,93],[195,100],[197,108],[194,117],[190,116],[191,107]],[[200,98],[203,90],[205,92],[205,99],[207,107],[205,117],[201,116],[202,106]],[[210,96],[212,90],[215,90],[217,95],[215,103],[219,111],[218,118],[213,117],[213,108]],[[221,97],[225,94],[228,97],[226,104],[229,112],[227,119],[224,117],[224,108]]];people.forEach((p,i)=>this.solid(`Distant onlooker ${i+1}`,p,44-i*.2,.12));
    this.solid('Dog on the right shore',[[318,179],[327,181],[332,187],[342,190],[351,187],[357,190],[365,188],[368,192],[364,197],[357,198],[355,207],[351,210],[348,201],[339,199],[335,208],[330,207],[331,199],[325,195],[317,191]],28,.35);this.stroke('Dog tail',[[322,187],[317,179],[316,174]],.9,28);
    const n=this.point(105,172,31),h=this.point(272,220,34);this.obstacle(n.x,n.z,2.8,1.6);this.obstacle(h.x,h.z,2.4,2);this.obstacle(this.point(343,198,28).x,-28,1.7,.6);
    const ground=this.group.getObjectByName('Walkable landscape') as T.Mesh;ground.userData.keep=true;
    for(const [px,py,depth,rx,rz]of [[90,179,30,1.5,.8],[148,192,31,1.1,1.4],[272,226,34,2.1,2.1],[343,210,28,2.1,1.2]]){
      const p=this.point(px,py,depth),g=new T.PlaneGeometry(rx*2.1,rz*2.1,24,24);g.rotateX(-Math.PI/2);g.translate(p.x,0,p.z);const a=g.attributes.position;
      for(let i=0;i<a.count;i++)a.setY(i,this.height(a.getX(i),a.getZ(i))+.012);g.computeVertexNormals();const bank=this.mesh(this.group,g,ground.material as T.Material);bank.name='Walkable local supporting bank';bank.userData.keep=true;
    }
    this.sea(-79,0x74917d);this.finish();
  }  override height(x:number,z:number){
    const base=super.height(x,z);if(!this.painting)return base;
    // Low local banks physically support the figure, stone hand and dog;
    // the surrounding basin remains lower, with a clear route around each.
    let result=base;
    const feet:[number,number,number,number,number][]=[[90,179,30,1.5,.8],[148,192,31,1.1,1.4],[272,226,34,2.1,2.1],[343,210,28,2.1,1.2]];
    for(const [px,py,depth,rx,rz]of feet){const p=this.point(px,py,depth),q=((x-p.x)/rx)**2+((z-p.z)/rz)**2,w=1-T.MathUtils.smoothstep(q,.12,1),top=p.y-.12;result=Math.max(result,base+(top-base)*w);}
    return result;
  }
}
class Swallow extends PaintedWorld {
  constructor(scene:T.Scene){
    super(scene,'swallows-tail','20',illusionArtworks['swallows-tail'],{...marble,sky:0xabb8c7,horizon:0xd4dce7,ground:0xb0bfce,sun:0xe5edf7,sunPosition:[-20,28,20]}, {image:'/textures/swallow-pigment.jpg',width:750,height:582,span:15,depth:34,horizon:1,centreY:.7});
    const graphite=this.mat(0x303638,.5,.18),red=this.mat(0xa33e2e,.58),edge=this.mat(0x8292a1,.8);
    // The painting's folded pale surface becomes a low rolling marble terrain,
    // while its catastrophe curve and cello f-holes become freestanding rods.
    this.stroke('Catastrophe lower cusp left',[[188,88],[204,181],[239,284],[293,370],[364,440],[438,505],[474,544]],1.25,35,graphite);
    this.stroke('Catastrophe lower cusp right',[[544,86],[528,183],[492,286],[438,370],[364,440],[296,501],[250,544]],1.25,35,graphite);
    this.stroke('Catastrophe cubic upper sweep',[[226,462],[310,455],[364,440],[435,414],[499,389],[528,368],[524,347],[493,328],[437,310],[388,294],[365,280],[371,252],[411,216],[472,174],[551,136],[664,102]],.85,32,graphite);
    this.stroke('Vertical tangent at the right cusp',[[527,168],[527,276],[528,368],[528,499]],.85,34,graphite);this.stroke('Vertical tangent at the left cusp',[[367,268],[366,354],[364,440],[364,481]],.85,34,graphite);this.stroke('Short lower tangent',[[466,404],[466,447],[466,500]],.7,33,graphite);
    this.stroke('Straight lower closure',[[250,544],[334,539],[405,539],[474,544]],1.2,35,graphite);
    // Thick f-holes are individually modeled at three different depths.
    this.stroke('Large red cello f-hole',[[65,284],[56,276],[47,282],[48,302],[65,335],[107,389],[143,439],[164,476],[166,494],[157,502],[149,495],[153,486],[162,490]],4,29,red);
    this.stroke('Central black f-hole left',[[362,155],[358,147],[350,150],[346,172],[341,198],[337,211],[329,214],[325,209],[328,201],[333,201]],2.1,32,graphite);
    this.stroke('Central black f-hole right',[[371,154],[376,147],[384,150],[389,173],[393,194],[398,207],[406,214],[412,210],[411,202],[405,202]],2.1,31,graphite);
    this.stroke('Small red cello f-hole',[[355,478],[360,474],[365,482],[367,500],[374,514],[382,514],[385,508],[381,504]],1.25,27,red);
    // The broad ghost of a cello edge occupies a second depth layer.
    this.solid('Pale cello edge',[[13,24],[31,18],[49,25],[61,39],[63,66],[70,81],[54,86],[48,96],[50,115],[60,127],[74,128],[64,143],[61,159],[66,176],[62,192],[51,211],[35,222],[18,221],[28,201],[31,179],[31,153],[30,129],[32,104],[30,84],[30,63],[22,43]],38,.45);
    // Fold ridges are actual shallow marble landforms, never a painting plane.
    const fold1=this.rock(this.group,[-7,this.height(-7,-44)-.2,-44],[6,.8,12],edge,21);fold1.castShadow=false;const fold2=this.rock(this.group,[7,this.height(7,-48)-.35,-48],[5,.6,13],this.mat(0xc6d3e0),23);fold2.castShadow=false;
    for(const [x,y,d]of [[364,440,34],[527,499,34],[250,544,35],[474,544,35],[166,494,29]] as [number,number,number][]){const p=this.point(x,y,d);this.obstacle(p.x,p.z,.25);}this.finish();
  }
}

export function createIllusionWorlds(scene:T.Scene):Floor[]{return [new Galatea(scene,illusionArtworks['galatea-spheres']),new Swans(scene),new Narcissus(scene),new Swallow(scene)];}





