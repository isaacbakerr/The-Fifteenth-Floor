import * as T from 'three';
import type {Artwork} from '../../Artwork';
import type {Floor} from '../../Graphics';
import {coastal,night} from '../World';
import {PaintedWorld,type Pixel} from '../PaintedWorld';
export const dreamArtworks:Record<string,Artwork>={
  'dream-bee':{artist:'Salvador Dalí',title:'Dream Caused by the Flight of a Bee Around a Pomegranate a Second Before Awakening',year:'1944',background:'Gala floats above a quiet seascape while a bee’s sound becomes an elaborate dream of fish, tigers and a bayonet. Dalí connected this chain of impossible images with Freud’s account of a brief outside stimulus becoming a long dream.',source:'https://www.museothyssen.org/sites/default/files/document/2025-06/PDF_Interactivo_Terrafilia_FINAL_ENG.pdf'},
  'great-masturbator':{artist:'Salvador Dalí',title:'The Great Masturbator',year:'1929',background:'Painted soon after Dalí met Gala, this autobiographical landscape joins desire with anxiety. The enormous sleeping profile is a recurring image of the artist; the grasshopper recalls a childhood fear. Human figures, insects and coastal rock forms merge within the same dream.',source:'https://www.museoreinasofia.es/en/collections/artwork/visage-du-grand-masturbateur-face-great-masturbator/'},
  'burning-giraffe':{artist:'Salvador Dalí',title:'The Burning Giraffe',year:'1937',background:'Two elongated figures tower over a deserted plain, their bodies opened into drawers and braced by crutches. The small burning animal in the distance gives the painting its title. Painted during the Spanish Civil War, the scene brings bodily fragility into an uneasy landscape.',source:'https://catalogues.salvador-dali.org/catalogues/en/heritageobject/506-5e79/'},
  'galacidalacidesoxyribonucleicacid':{artist:'Salvador Dalí',title:'Galacidalacidesoxiribunucleicacid (Homage to Crick and Watson)',year:'1963',background:'Dalí’s monumental homage to Crick and Watson places molecular structures beside religious visions. Gala watches the scene from below, while figures form cubic frameworks and a double helix rises at the left. The painting joins his interest in genetics with his later religious imagery.',source:'https://catalogues.salvador-dali.org/catalogues/en/heritageobject/534-152a/'},
};

/** Shape-defined organic volume: triangulated front and rear surfaces swell away
 * from the silhouette, so the recognizable profile remains solid from the sides.
 * All coordinates below were traced on each painting, then optically calibrated
 * into independent closed bodies. Pigment follows those curved bodies in 3D. */
class DreamTableau extends PaintedWorld {
  private groundAnchors:{x:number;depth:number;drop:number;radius:number}[]=[];
  protected groundBelow(x:number,y:number,depth:number,radius=3.5){const q=this.point(x,y,depth);this.groundAnchors.push({x:q.x,depth,drop:Math.max(0,super.height(q.x,q.z)-q.y+.12),radius});}
  override height(x:number,z:number){
    const h=super.height(x,z);if(!this.groundAnchors?.length)return h;
    let depression=0;for(const a of this.groundAnchors){const dx=(x-a.x)/a.radius,dz=(z+a.depth)/17;depression=Math.max(depression,a.drop*Math.exp(-(dx**4+dz**4)));}
    return h-depression*T.MathUtils.smoothstep(-z,12,22);
  }
  override finish(){
    // The walkable valley must sit below foreground feet, not through them.
    const ground=this.group.getObjectByName('Walkable landscape') as T.Mesh;
    const p=ground.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,this.height(p.getX(i),p.getZ(i)));ground.geometry.computeVertexNormals();super.finish();
  }
  protected pixelRod(name:string,a:Pixel,b:Pixel,radius:number,depth:number){
    const av=this.point(...a,depth),bv=this.point(...b,depth),delta=bv.clone().sub(av),r=radius*this.painting.span/this.painting.height*(depth+1.3)/(this.painting.depth+1.3),g=new T.CylinderGeometry(r,r,delta.length(),8,1,false);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate((av.x+bv.x)/2,(av.y+bv.y)/2,(av.z+bv.z)/2);this.pigment(g);const o=this.mesh(this.group,g,this.paint);o.name=name;return o;
  }
  override bead(name:string,x:number,y:number,rx:number,ry:number,depth:number,thickness:number){
    if(Math.max(rx,ry)>5)return super.bead(name,x,y,rx,ry,depth,thickness);
    const centre=this.point(x,y,depth),factor=(depth+1.3)/(this.painting.depth+1.3),scale=this.painting.span/this.painting.height,g=new T.SphereGeometry(1,8,6);g.scale(rx*scale*factor,ry*scale*factor,thickness);g.translate(centre.x,centre.y,centre.z);this.pigment(g);const o=this.mesh(this.group,g,this.paint);o.name=name;return o;
  }
  override solid(name:string,outline:Pixel[],depth:number,bulge:number,smooth=true,opacity=1){
    // Silhouette sampling is deliberately capped per anatomical piece; detail
    // remains in the pigment and separate features instead of excess triangles.
    const edge:Pixel[]=smooth?new T.CatmullRomCurve3(outline.map(([x,y])=>new T.Vector3(x,y,0)),true,'centripetal').getPoints(Math.min(40,Math.max(24,outline.length*2))).slice(0,-1).map(p=>[p.x,p.y]):outline;
    return super.solid(name,edge,depth,bulge,false,opacity);
  }
  protected grounded(x:number,y:number,depth:number,rx:number,rz:number){const p=this.point(x,y,depth);this.obstacle(p.x,p.z,rx,rz);}
  protected details(name:string,paths:Pixel[][],radius:number,depth:number){paths.forEach((p,i)=>this.stroke(`${name} ${i+1}`,p,radius,depth));}
  protected seaAt(y:number,color:number){
    const p=this.point(this.painting.width/2,y,70),water=this.mesh(this.group,new T.PlaneGeometry(250,190,1,1),this.mat(color,.28,.2));water.rotation.x=-Math.PI/2;water.position.set(0,p.y,-160);water.castShadow=false;
  }
}

class BeeDream extends DreamTableau{
  constructor(scene:T.Scene){super(scene,'dream-bee','21',dreamArtworks['dream-bee'],{...coastal,sky:0x7bafbd,horizon:0xd6d9bd,ground:0x80a6a5,sunPosition:[-28,32,15],extent:55,fog:.0007,sunIntensity:1.45,environmentIntensity:.32,hemisphereIntensity:1.3},{image:'/textures/dream-bee-pigment.jpg',width:813,height:1024,span:18,depth:36,horizon:644/1024,centreY:.2});
    this.seaAt(644,0x82b8c1);
    // A rock shelf and the levitating sleeper anchor the near composition.
    this.solid('Floating limestone shelf',[[49,831],[113,821],[216,826],[311,811],[397,798],[500,791],[573,786],[674,781],[730,778],[813,789],[813,870],[742,871],[679,895],[628,900],[591,925],[532,940],[481,966],[404,967],[381,938],[314,928],[259,904],[225,900],[182,919],[122,909],[68,895]],30,1.25,false);
    this.solid('Gala abdomen and torso',[[319,716],[370,697],[421,697],[455,708],[502,693],[540,684],[580,697],[608,711],[650,720],[675,741],[666,760],[614,771],[560,773],[512,772],[467,796],[437,810],[391,806],[364,789],[330,770],[307,746]],28.8,.65);
    this.solid('Extended near thigh calf and foot',[[438,779],[414,802],[356,815],[283,817],[220,820],[160,815],[113,798],[94,783],[85,758],[91,752],[101,766],[112,776],[128,780],[161,790],[231,791],[279,785],[332,766],[389,755],[421,762]],28.35,.49);
    this.solid('Bent far leg',[[438,717],[400,702],[360,700],[331,706],[310,726],[313,745],[336,755],[369,757],[402,749],[426,748],[466,767],[479,778],[493,768],[480,749]],29.4,.58);
    this.solid('Shoulder and upturned sleeping face',[[589,700],[614,684],[641,674],[660,650],[683,638],[705,638],[718,654],[727,675],[719,689],[705,698],[686,697],[677,710],[656,721],[626,720]],28.7,.44);
    this.solid('Right arm folded behind the head',[[644,671],[649,648],[665,633],[691,632],[709,644],[710,651],[689,650],[675,654],[673,671],[693,696],[716,705],[745,704],[766,696],[783,699],[788,710],[776,725],[744,742],[702,752],[670,749],[656,736],[676,717]],29.2,.31);
    this.solid('Near arm resting behind the head',[[612,711],[635,706],[657,717],[677,735],[705,738],[744,727],[778,710],[788,716],[783,736],[747,752],[711,770],[675,774],[639,764],[613,746]],28.35,.31);
    this.bead('Gala breast rounded form',596,728,33,24,28.12,.29);
    this.solid('Gala flowing hair',[[704,650],[721,658],[734,674],[734,697],[722,709],[718,740],[713,785],[705,809],[700,801],[705,755],[702,724],[699,703],[709,685]],29.25,.13);
    // Detailed tiger anatomy is split into actual torso, head, muzzle and limbs.
    this.solid('First tiger shoulders and ribcage',[[216,386],[233,374],[270,377],[305,389],[329,417],[340,461],[349,494],[337,519],[305,522],[274,506],[254,477],[223,456],[207,432],[201,408]],35.6,.91);
    this.solid('First tiger roaring head',[[223,338],[232,314],[253,308],[262,300],[280,295],[299,302],[314,305],[329,320],[341,346],[339,370],[331,389],[311,415],[287,419],[262,406],[239,393],[224,371]],34.7,.63);
    this.solid('First tiger left foreleg and paw',[[229,449],[250,461],[271,486],[283,516],[280,537],[264,550],[244,545],[237,531],[236,506],[216,485],[213,466]],34.1,.38);
    this.solid('First tiger right foreleg and paw',[[303,455],[324,462],[342,490],[362,522],[383,545],[389,560],[381,577],[365,589],[349,583],[331,572],[330,548],[319,523],[300,503],[292,478]],34.2,.42);
    this.solid('Tiger first open mouth jaw',[[269,340],[286,334],[307,340],[322,359],[323,388],[311,404],[291,405],[277,392],[267,368]],34.18,.15);
    this.solid('First tiger upper muzzle left',[[254,329],[268,324],[284,329],[285,342],[272,349],[256,343]],33.99,.16);
    this.solid('First tiger upper muzzle right',[[286,326],[301,322],[314,332],[316,345],[302,350],[284,343]],33.97,.16);
    this.solid('Second tiger torso and haunch',[[350,397],[363,377],[390,361],[416,350],[445,351],[469,363],[484,386],[477,412],[466,439],[446,456],[421,462],[393,451],[365,439],[348,422]],40.2,.88);
    this.solid('Second tiger face',[[467,383],[487,375],[508,380],[525,399],[533,420],[530,443],[513,465],[492,480],[477,471],[468,447],[463,422]],38.9,.62);
    this.solid('Second tiger near foreleg and open paw',[[512,454],[530,458],[542,479],[550,497],[566,503],[578,510],[584,524],[577,531],[560,524],[548,519],[537,523],[521,512],[510,491],[501,472]],38.4,.36);
    this.solid('Second tiger far foreleg and reaching claws',[[426,441],[446,441],[468,449],[479,462],[469,480],[449,484],[435,498],[421,503],[405,499],[397,486],[405,475],[405,456]],38.6,.35);
    this.solid('Second tiger open mouth',[[481,423],[493,416],[510,423],[518,438],[511,457],[496,466],[485,459],[478,443]],38.05,.14);
    this.bead('First tiger left ear',235,324,13,16,35.1,.21);this.bead('First tiger right ear',310,319,12,13,35.05,.2);
    this.bead('Second tiger nose',501,419,14,10,37.93,.15);
    for(const [name,points]of [['First tiger tail',[[332,390],[350,398],[354,397],[347,385],[345,370]]],['Second tiger tail',[[352,402],[340,392],[329,386]]]] as [string,Pixel[]][])this.stroke(name,points,5,39);
    this.details('First tiger curved whiskers',[[[260,337],[234,323],[202,316]],[[259,342],[230,340],[199,346]],[[260,350],[230,355],[210,365]],[[305,334],[326,318],[348,312]],[[308,341],[336,335],[361,333]]],.7,33.75);
    // Separate curved tooth volumes preserve the silhouette of both open jaws.
    for(const [x,y,depth,size]of [[274,343,33.8,10],[308,346,33.8,11],[284,393,33.8,9],[309,392,33.8,9],[487,429,37.8,7],[509,430,37.8,7],[487,452,37.8,7],[506,453,37.8,7]])this.solid('Tiger curved ivory canine',[[x-3,y],[x+3,y-1],[x+2,y+size],[x,y+size+4],[x-2,y+size*.4]],depth,.035,false);
    // Split pomegranate, seed jewels, rising fish and projecting fins.
    this.solid('Exploding pomegranate rind',[[23,565],[43,548],[66,547],[86,561],[104,578],[122,602],[125,625],[112,648],[93,663],[70,669],[41,659],[23,639],[13,615],[15,586]],42.4,.73);
    this.solid('Pomegranate broken flesh',[[48,561],[69,556],[84,570],[96,586],[109,595],[104,612],[113,626],[99,646],[78,652],[60,642],[47,618],[43,592]],41.6,.26);
    this.solid('Orange fish body',[[91,546],[81,526],[78,497],[88,469],[108,440],[124,414],[139,398],[158,389],[182,386],[199,398],[202,418],[194,442],[179,466],[164,489],[147,513],[127,536],[109,553]],40.9,.65);
    this.solid('Fish gaping mouth',[[161,388],[184,380],[208,386],[222,403],[215,418],[202,429],[187,433],[168,424],[156,410]],40,.22);
    this.bead('Fish eye glass',148,407,11,15,39.9,.13);
    this.solid('Fish dorsal spines',[[83,492],[86,466],[96,449],[97,433],[111,435],[113,416],[125,420],[128,401],[140,403],[144,387],[157,394],[165,378],[172,389],[160,416],[137,446],[108,483]],41.4,.12,false);
    // Long-legged white elephant, set well behind the tigers for genuine parallax.
    this.solid('Elephant distant ivory torso',[[501,177],[521,158],[551,153],[582,154],[609,163],[620,178],[620,206],[609,227],[585,236],[555,233],[533,220],[516,203]],55,1.1);
    this.solid('Elephant head and folded ear',[[482,170],[494,165],[508,173],[515,190],[508,205],[500,218],[491,212],[486,198],[476,190]],54,.42);
    this.solid('Elephant hanging ear',[[501,184],[516,184],[527,197],[526,214],[535,231],[525,226],[513,212],[505,216],[501,200]],53.7,.2);
    this.stroke('Elephant curved raised trunk',[[488,191],[478,208],[467,213],[453,205],[440,190],[429,184],[424,187]],3.3,54.3);
    this.details('Elephant tall legs',[[[537,220],[526,312],[508,386],[479,492],[411,662]],[[550,229],[550,309],[571,404],[587,493],[625,645]],[[598,221],[630,285],[652,346],[687,401],[723,429]],[[606,215],[616,261],[641,286],[654,313]]],1.35,55.6);
    this.blockPixels('Elephant embroidered saddle',[[531,144],[574,148],[575,174],[550,190],[529,177]],54.2,.16);
    this.solid('Elephant tapered obelisk',[[527,15],[538,25],[542,54],[551,99],[566,133],[572,143],[531,145],[529,114],[527,69]],55,.33,false);
    this.solid('Right distant golden cliffs',[[731,234],[768,229],[784,215],[813,218],[813,397],[792,392],[771,380],[748,377],[725,363],[718,337],[720,299]],49,1.6,false);
    this.solid('Right projecting stone shelf',[[706,381],[735,375],[768,386],[813,390],[813,433],[779,426],[748,414],[709,411],[694,401]],46.5,.6,false);
    this.details('Bayonet and gold trigger',[[[624,650],[595,595],[550,528],[522,504]],[[523,503],[513,527],[503,538],[494,523],[491,497]]],2.2,31.6);
    this.bead('Near pomegranate',573,876,24,27,28.5,.33);this.bead('Hovering bee',589,850,4,3,28.1,.04);
    for(const [x,y,r]of [[482,825,8],[466,841,5],[686,852,8],[676,869,5],[84,694,8],[129,678,6]])this.bead('Suspended water droplet',x,y,r,r*.63,29,.05);
    this.groundBelow(420,967,30,7.5);this.grounded(420,883,30,6.1,2.1);this.grounded(770,390,46.5,1.8,1.4);
    this.finish();
  }
}

class GreatMasturbator extends DreamTableau{
  constructor(scene:T.Scene){super(scene,'great-masturbator','22',dreamArtworks['great-masturbator'],{...coastal,sky:0x244775,horizon:0xc3cf7c,ground:0x929457,sun:0xffe5b3,sunPosition:[-24,21,16],fog:.0006,sunIntensity:1.35,environmentIntensity:.3,hemisphereIntensity:1.25},{image:'/textures/great-pigment.jpg',width:370,height:269,span:16.5,depth:36,horizon:233/269,centreY:.2});
    // Museum photograph includes its frame; UV cropping retains only the canvas.
    this.paint.map!.repeat.set(1382/1440,1009/1066);this.paint.map!.offset.set(30/1440,32/1066);
    // The downturned nose, eyelid and radial lashes retain the painting's left silhouette.
    this.solid('Monumental golden sleeping profile',[[35,125],[44,111],[50,99],[63,86],[77,78],[93,75],[111,74],[135,77],[156,76],[179,70],[195,71],[203,76],[217,73],[222,62],[227,63],[236,68],[247,79],[254,91],[263,98],[267,116],[268,133],[276,142],[289,141],[298,144],[303,158],[303,177],[300,186],[294,178],[287,168],[278,166],[269,171],[258,179],[247,182],[229,182],[210,182],[191,185],[172,190],[154,197],[143,204],[141,216],[146,238],[150,255],[145,260],[137,256],[122,244],[112,231],[101,220],[86,211],[75,204],[65,202],[55,192],[48,177],[42,160]],36,2.05);
    this.solid('Closed eyelid raised ridge',[[74,116],[82,115],[92,119],[99,126],[98,134],[88,133],[81,129],[76,127]],33.5,.14);
    this.details('Individual radial lashes',[[[91,130],[90,123],[87,116]],[[94,131],[94,121],[94,109]],[[97,130],[98,120],[102,107]],[[99,130],[104,120],[111,105]],[[102,130],[109,122],[117,112]],[[104,130],[113,125],[124,119]],[[106,132],[116,130],[128,129]]],.42,33.2);
    this.stroke('Long nose crease',[[73,133],[66,146],[66,160],[73,175],[80,185],[84,194]],.65,33.8);
    // Pale female profile rises from the back of the golden head.
    this.solid('Female shoulder neck and upturned profile',[[208,115],[222,110],[234,101],[242,91],[244,79],[251,74],[258,72],[260,66],[267,64],[271,66],[274,71],[280,74],[285,78],[281,81],[280,86],[285,89],[282,94],[274,97],[270,107],[265,115],[263,125],[254,136],[244,143],[232,141],[222,134]],34.6,.75);
    this.solid('Flowing hair behind female profile',[[179,89],[192,81],[204,69],[212,51],[227,39],[240,29],[254,25],[268,26],[274,31],[278,39],[274,46],[266,45],[256,42],[252,47],[256,52],[260,59],[258,69],[252,76],[245,81],[243,89],[237,98],[226,110],[218,113],[204,113],[192,116],[179,117],[190,109],[203,105],[213,94],[223,80],[227,63],[232,48],[219,54],[211,71],[199,82]],36.6,.65);
    this.details('Hair raised curling ribbons',[[[183,88],[201,79],[211,63],[220,49],[238,38],[251,32]],[[201,91],[216,85],[226,66],[232,49],[245,41],[256,43]],[[231,109],[244,95],[250,84],[249,74],[254,62]]],.6,34.2);
    // The truncated standing figure above her is modeled as a separate solid body.
    this.solid('Standing figure shorts',[[283,-3],[318,-3],[318,31],[313,55],[303,57],[297,51],[292,53],[283,49],[280,35]],39,1.05,false);
    this.solid('Standing near thigh knee calf',[[302,53],[313,54],[315,76],[316,92],[321,111],[323,121],[319,126],[310,124],[304,114],[303,102],[304,87],[301,72]],37.6,.53);
    this.solid('Standing far thigh and knee',[[284,51],[295,52],[297,68],[296,84],[302,95],[303,108],[299,118],[291,118],[286,109],[285,95],[283,78]],38.4,.47);
    this.solid('Lower pale lily petal',[[267,97],[276,94],[285,97],[288,105],[284,113],[277,117],[273,129],[267,140],[259,148],[265,132],[269,117],[265,110]],33.6,.12);
    this.stroke('Lily pointed stamen',[[275,109],[277,103],[279,98]],.65,33.3);
    this.solid('Curled golden throat foreground lobe',[[261,128],[273,123],[287,127],[296,136],[303,150],[312,159],[329,166],[349,170],[370,172],[370,183],[350,179],[332,177],[316,174],[304,168],[299,161],[292,153],[282,148],[274,148],[267,156],[264,171],[261,183],[256,192],[250,193],[247,187],[248,171],[252,154]],35.9,.9);
    this.solid('Right black and ivory curled form',[[370,200],[352,197],[330,193],[311,194],[296,198],[284,203],[279,213],[281,225],[289,236],[307,247],[329,253],[354,254],[370,254],[370,236],[351,236],[341,230],[337,219],[331,214],[321,214],[313,220],[313,228],[320,237],[306,234],[301,225],[304,215],[314,207],[332,204],[351,207],[370,214]],32.5,1.1);
    // The original insect now has individual bulging body, head, wings and legs.
    this.solid('Grasshopper folded transparent wings',[[156,200],[176,199],[191,198],[214,200],[236,199],[253,203],[268,207],[271,214],[263,219],[243,217],[225,215],[202,215],[180,214],[163,212]],31.8,.16);
    this.solid('Grasshopper abdomen',[[155,199],[168,201],[179,207],[184,215],[176,218],[164,215],[157,211],[149,210]],31.4,.24);
    this.solid('Grasshopper large head',[[145,195],[155,195],[160,203],[157,214],[150,219],[141,216],[137,209],[138,201]],31.1,.3);
    this.bead('Grasshopper eye',146,206,3.2,4,30.8,.085);
    this.details('Grasshopper jointed legs',[[[158,202],[173,183],[181,179],[190,165],[193,155]],[[165,208],[177,226],[183,230],[186,227],[198,202],[208,193],[212,184]],[[171,210],[181,223],[186,224],[194,209],[199,205]]],1.0,31.05);
    this.stroke('Grasshopper antenna',[[142,204],[122,211],[98,218],[76,223]],.26,30.8);
    // Insects on the face occupy their exact painted coordinates, not random scatter.
    for(const [x,y]of [[158,95],[162,93],[166,96],[170,94],[173,97],[160,98],[166,100],[222,146],[225,150],[221,153],[226,156],[222,160],[227,163],[223,167]])this.bead('Ant body on golden skin',x,y,.55,.85,x<200?33.6:33.1,.025);
    this.solid('Small lion apparition',[[211,134],[217,129],[226,130],[232,133],[239,132],[242,139],[239,147],[233,150],[224,148],[218,150],[211,146]],33,.19);
    this.bead('Pebble on top of the sleeping head',91,59,14,10,36.4,.3);this.bead('Floating upper stone',92,20,11,7,40,.3);this.bead('Small floating pebble',121,70,6,4,36.5,.14);
    this.stroke('Needle above top stone',[[92,54],[93,45],[92,40],[94,35]],.7,36.3);
    this.solid('Distant standing figure',[[40,229],[42,228],[43,230],[43,234],[44,237],[44,240],[43,241],[42,236],[41,239],[40,244],[39,245],[39,240]],45,.07);
    this.solid('Embracing near figures',[[218,220],[220,216],[224,217],[225,220],[228,221],[231,226],[231,233],[230,240],[226,242],[220,245],[216,241],[215,233],[214,227]],28,.22);
    this.bead('Foreground white oval stone',245,258,5,3.8,27,.12);
    this.details('Branch beside the right curl',[[[370,214],[357,212],[349,207],[342,201],[337,191]],[[370,230],[358,226],[351,220],[344,213],[340,207]],[[370,240],[361,235],[355,232],[352,225]]],.52,31.4);
    this.groundBelow(144,260,36,2);this.groundBelow(221,245,28,1);this.groundBelow(317,253,32.5,2);this.grounded(144,255,36,1.3,1.5);this.grounded(221,240,28,.5,.5);this.grounded(317,247,32.5,1.9,1.2);this.finish();
  }
}

class BurningGiraffe extends DreamTableau{
  constructor(scene:T.Scene){super(scene,'burning-giraffe','23',dreamArtworks['burning-giraffe'],{...night,ground:0x5b3528,sky:0x112536,horizon:0x507d84,sunPosition:[-27,24,12],extent:56,fog:.0008,sunIntensity:1.6,environmentIntensity:.3,hemisphereIntensity:1.0},{image:'/textures/burning-giraffe-pigment.jpg',width:400,height:545.5,span:19,depth:37,horizon:443/545.5,centreY:.2});
    // Ruched, tapering dress follows a curved spine rather than a cylinder.
    this.solid('Main figure draped hips and full length dress',[[133,167],[146,163],[156,174],[163,194],[162,211],[171,229],[186,241],[190,264],[196,290],[208,316],[211,340],[217,364],[228,390],[231,414],[242,441],[251,461],[253,479],[253,503],[263,518],[260,528],[247,532],[219,528],[203,529],[186,534],[170,532],[159,523],[154,503],[149,477],[144,455],[143,432],[137,407],[132,379],[126,352],[119,326],[112,301],[106,277],[101,255],[99,235],[101,216],[98,202],[104,185],[116,176]],37.5,1.2);
    this.solid('Main figure twisting ribcage',[[144,63],[157,59],[166,63],[177,72],[193,76],[205,75],[216,81],[225,94],[224,110],[218,127],[207,141],[192,151],[177,160],[160,169],[149,165],[144,151],[146,135],[142,118],[139,102],[140,83]],36.9,.96);
    this.solid('Main figure elongated neck',[[207,43],[215,42],[215,52],[218,62],[225,72],[237,80],[227,80],[215,75],[204,68],[202,58]],37.2,.34);
    this.solid('Main figure rose coloured head',[[195,26],[202,16],[216,7],[230,7],[241,14],[245,23],[245,33],[238,42],[226,47],[213,48],[203,42],[198,35]],36.9,.56);
    this.solid('Raised left shoulder and upper arm',[[147,64],[138,65],[129,69],[116,72],[106,77],[94,82],[82,82],[78,90],[88,95],[103,93],[119,89],[131,84],[142,84],[150,77]],36,.37);
    this.solid('Outstretched forearm to searching hand',[[88,82],[78,81],[67,83],[55,84],[43,84],[34,86],[28,89],[21,88],[11,89],[6,96],[12,99],[24,98],[35,98],[45,96],[57,96],[68,95],[82,94]],35.6,.25);
    this.solid('Raised searching hand palm',[[23,87],[17,83],[13,78],[11,73],[8,70],[5,65],[5,60],[8,60],[12,66],[16,70],[19,71],[23,70],[26,73],[29,76],[27,83]],35.3,.13);
    this.details('Searching hand long fingers',[[[13,75],[8,71],[4,65]],[[16,76],[11,69],[6,63]],[[20,76],[16,69],[10,62]],[[23,79],[20,73],[14,69]],[[22,88],[16,92],[8,94]]],.85,35.1);
    this.solid('Lower reaching upper arm',[[207,91],[215,100],[212,112],[203,124],[193,132],[184,140],[175,149],[164,156],[154,157],[150,149],[156,139],[168,130],[177,121],[185,110],[197,100]],35.7,.41);
    this.solid('Lower reaching forearm',[[159,150],[158,157],[150,165],[139,171],[126,176],[113,181],[101,185],[92,185],[89,179],[95,172],[109,169],[121,163],[131,157],[141,151],[151,147]],35.4,.26);
    this.solid('Lower searching hand palm',[[95,177],[91,183],[82,187],[76,188],[71,186],[64,189],[60,187],[62,181],[70,177],[79,176],[86,176]],35,.14);
    this.details('Lower hand long fingers',[[[72,187],[65,192],[58,199]],[[70,184],[61,189],[53,195]],[[68,182],[59,186],[51,190]],[[73,179],[63,178],[57,175]],[[82,184],[78,192],[73,197]]],.8,34.8);
    // Drawers are individual solid wooden boxes projecting beyond the torso.
    const drawers:[Pixel[],number][]=[[[[125,110],[142,104],[158,111],[166,120],[154,132],[138,128],[125,120]],35.25],[[[151,125],[173,121],[194,127],[191,142],[175,146],[154,139]],35.7],[[[150,273],[164,270],[182,273],[184,283],[173,292],[150,291],[145,282]],35.6],[[[155,297],[172,294],[187,296],[185,309],[174,315],[154,311]],35.5],[[[161,319],[179,317],[192,322],[190,334],[177,339],[160,334]],35.4],[[[169,341],[186,337],[197,342],[196,354],[184,358],[168,353]],35.2],[[[177,362],[192,359],[202,365],[203,375],[190,381],[176,375]],35.0],[[[187,383],[199,381],[208,387],[208,397],[197,402],[185,397]],34.8],[[[197,407],[207,403],[215,408],[216,417],[207,422],[196,417]],34.6]];
    drawers.forEach(([outline,d],i)=>this.solid(`Open ochre drawer ${i+1}`,outline,d,.25,false));
    // Crutch ends and their separate shafts stand behind the figure.
    this.details('Large reverse crutch arms',[[[219,126],[231,131],[245,128],[254,131]],[[170,226],[184,221],[201,216],[223,215],[253,218]],[[191,317],[208,303],[227,291],[249,279],[282,282]]],2.6,39.3);
    this.details('Long wooden support shafts',[[[238,122],[244,225],[249,321],[239,424],[230,505]],[[224,203],[220,271],[207,365],[205,412]],[[255,268],[252,353],[238,438],[232,475]]],1.15,39.8);
    this.details('Draped dress raised fold ridges',[[[110,219],[113,263],[128,318],[142,373],[145,428],[155,477],[167,514]],[[116,225],[126,275],[139,315],[150,350],[167,390],[181,426],[201,472],[221,514]],[[127,221],[137,260],[146,300],[159,341],[177,380],[192,417],[216,462],[238,503]],[[119,243],[117,275],[129,314],[139,351],[149,383]],[[153,349],[163,389],[167,436],[176,475],[190,516]]],.62,35.9);
    this.solid('Left ochre slipper',[[159,515],[160,526],[153,534],[138,535],[123,538],[114,536],[112,531],[121,529],[135,524],[144,517]],35.5,.15);
    this.solid('Right ochre slipper',[[249,501],[260,505],[271,516],[281,521],[283,527],[279,532],[270,530],[260,522],[252,519]],35.4,.18);
    // The farther figure retains its lean silhouette and thorn-like crutches.
    this.solid('Far figure body and long legs',[[339,232],[348,230],[353,239],[348,249],[349,260],[354,270],[353,281],[348,294],[348,310],[352,331],[350,354],[346,377],[345,400],[344,423],[342,444],[340,462],[341,474],[348,477],[356,479],[358,483],[347,487],[336,485],[330,479],[329,468],[330,447],[330,425],[330,405],[331,387],[330,368],[326,346],[325,328],[325,309],[328,293],[325,278],[328,265],[333,252]],46,.55);
    this.solid('Far raised arm',[[335,264],[329,264],[322,256],[316,245],[310,233],[305,222],[302,209],[301,201],[304,199],[309,207],[314,220],[322,233],[328,241],[336,245]],45.3,.2);
    this.solid('Far lowered arm',[[329,279],[323,282],[315,289],[308,294],[297,299],[284,304],[277,308],[272,310],[273,315],[280,314],[292,310],[307,305],[320,302],[330,294]],45.3,.18);
    const thornPaths:Pixel[][]=[];for(let i=0;i<10;i++){const y=237+i*12;thornPaths.push([[345,y],[355,y-3],[371,y-6],[375,y-4]]);}this.details('Far figure thorned dorsal supports',thornPaths,1.35,46.4);
    this.details('Far supporting crutches',[[[369,231],[357,326],[347,414],[342,478]],[[367,278],[359,367],[345,475]],[[365,333],[356,411],[343,477]]],.8,46.9);
    this.details('Far figure hair branching twigs',[[[343,233],[343,216],[348,200],[350,188]],[[344,231],[350,216],[360,207],[368,198]],[[347,230],[359,216],[374,210],[381,202]]],.42,45.5);
    this.solid('Far held red cloth',[[302,203],[305,205],[303,224],[303,243],[299,253],[300,235]],45,.05,false);
    // The titular animal stays small and distant at left, as in the painting.
    this.solid('Small giraffe torso and ascending neck',[[16,426],[21,418],[30,413],[43,404],[55,394],[65,378],[76,366],[83,359],[87,360],[88,366],[86,372],[82,371],[75,387],[68,401],[61,416],[52,426],[39,433],[26,434],[17,432]],52.8,.41);
    this.details('Giraffe four grounded legs',[[[18,431],[15,447],[10,464],[8,478]],[[25,431],[27,452],[26,477]],[[44,428],[43,450],[43,476]],[[50,423],[49,451],[48,477]]],.75,53.1);
    // Subtle fire remains a real animated shader on small planes above its back.
    const fire=new T.ShaderMaterial({uniforms:{time:this.time},side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time;varying vec2 q;void main(){float sway=sin(q.y*11.-time*2.4)*.14*q.y;float edge=(1.-q.y)*.45;float a=(1.-smoothstep(edge*.6,edge,abs(q.x-.5+sway)))*pow(1.-q.y,.7);gl_FragColor=vec4(mix(vec3(.8,.12,.015),vec3(1.,.65,.18),1.-q.y),a*.22);}' });
    for(let i=0;i<6;i++){const p=this.point(25+i*7,405-i*7,52.1),flame=this.mesh(this.group,new T.PlaneGeometry(.48,1.4),fire);flame.position.copy(p);flame.position.y+=.65;flame.castShadow=flame.receiveShadow=false;}
    this.solid('Low left horizon rock',[[69,442],[85,435],[100,421],[110,423],[114,433],[128,440],[140,444]],65,.75,false);
    this.solid('Low far horizon mountains',[[247,443],[260,436],[273,438],[282,441],[291,439],[306,442],[328,445]],70,.5,false);
    this.groundBelow(180,535,35.5,3.2);this.groundBelow(338,487,46,1.3);this.groundBelow(35,478,53,1.5);this.grounded(180,526,37.5,3.3,1.3);this.grounded(338,477,46,1.1,.8);this.grounded(35,474,53,1,.7);
    this.finish();
  }
}

class Galacid extends DreamTableau{
  constructor(scene:T.Scene){super(scene,'galacidalacidesoxyribonucleicacid','24',dreamArtworks.galacidalacidesoxyribonucleicacid,{...coastal,sky:0x5b6157,horizon:0xd7b789,ground:0xa28c71,sun:0xffdfae,sunPosition:[-13,34,-28],fog:.0006,extent:63,sunIntensity:1.25,environmentIntensity:.25,hemisphereIntensity:1.2},{image:'/textures/galacid-pigment.jpg',width:1024,height:766,span:18.5,depth:38,horizon:375/766,centreY:.2});
    this.seaAt(369,0xb5beb0);
    // Gala, seen from behind, is the near anchor below the vast vision.
    this.solid('Gala white cloak foreground',[[402,570],[424,567],[443,577],[465,586],[476,604],[480,636],[488,668],[502,699],[518,730],[538,766],[317,766],[335,743],[346,717],[353,688],[358,661],[365,630],[375,604],[387,587]],29.8,.93);
    this.solid('Gala back of head hair and exposed neck',[[410,535],[418,524],[434,518],[449,521],[461,530],[467,544],[471,560],[479,574],[472,590],[455,594],[445,586],[430,586],[419,580],[411,568]],29,.38);
    this.details('Gala cloak major folds',[[[387,602],[379,640],[370,686],[355,729],[341,762]],[[413,598],[407,648],[401,703],[389,762]],[[453,599],[459,642],[472,692],[500,756]]],1.4,28.9);
    // Golden cloud opening and a reaching arm: actual layered rounded volumes,
    // separated deeply behind the lattices rather than a sky photograph.
    this.solid('Cloud arch left warm billowing volume',[[111,22],[172,16],[220,34],[239,55],[258,80],[247,116],[270,144],[269,174],[284,207],[284,250],[263,286],[250,331],[219,352],[185,335],[167,307],[131,290],[106,255],[84,216],[83,177],[67,146],[69,106],[81,70]],61,3.2,true,.75);
    this.solid('Cloud arch right green shadow volume',[[683,9],[747,4],[789,18],[836,24],[865,45],[908,53],[941,84],[960,126],[956,172],[939,218],[923,253],[892,274],[858,269],[836,240],[809,218],[787,188],[768,153],[733,125],[704,99],[681,63]],65,3.4,true,.73);
    this.solid('Cloud left bank beneath prophet',[[93,252],[129,266],[161,296],[189,331],[231,365],[254,408],[288,448],[299,490],[324,524],[354,561],[371,602],[355,628],[324,617],[299,590],[263,571],[221,557],[175,522],[144,491],[101,464],[69,429],[49,394],[37,351],[52,309]],51.5,2.4,true,.78);
    this.solid('Cloud central distant rose fold',[[412,180],[445,162],[482,157],[520,164],[547,182],[575,182],[603,176],[628,190],[643,214],[641,243],[620,267],[595,276],[556,280],[525,267],[495,258],[463,261],[433,250],[411,221]],66,2.6,true,.68);
    this.solid('Cloud right lower light bank',[[787,304],[830,295],[864,314],[883,345],[898,379],[918,407],[941,437],[948,473],[935,512],[918,547],[886,568],[854,571],[820,554],[801,521],[785,494],[771,460],[769,423],[757,386],[762,349]],57,2.8,true,.65);
    // The gigantic arm has separate muscular masses, curved fingers and depth.
    this.solid('Divine reaching upper arm',[[297,216],[316,210],[335,213],[348,231],[353,254],[365,275],[374,297],[379,322],[376,343],[363,354],[349,345],[342,326],[332,305],[320,285],[310,263],[300,245]],54.5,1.05);
    this.solid('Divine reaching forearm',[[350,335],[367,333],[380,348],[387,370],[394,397],[399,426],[407,450],[411,477],[408,504],[401,522],[388,524],[379,511],[375,489],[373,466],[366,440],[359,414],[353,388],[350,360]],51,.83);
    this.solid('Divine hand above Gala',[[384,497],[400,494],[410,503],[415,519],[419,536],[414,550],[405,552],[395,545],[387,534],[382,518]],48.2,.44);
    this.details('Divine curved fingers',[[[400,526],[405,539],[403,551],[399,559]],[[406,523],[412,538],[410,550],[407,556]],[[391,522],[393,538],[391,547]]],2.1,47.8);
    // The prophet, scroll and cloth are independent floating sculptural pieces.
    this.solid('Isaiah flowing robe',[[119,92],[139,91],[152,100],[160,119],[169,139],[174,163],[173,188],[179,207],[194,227],[202,247],[199,269],[188,283],[172,280],[158,261],[148,239],[136,218],[123,203],[111,183],[105,159],[104,132],[110,108]],59,1.05);
    this.solid('Isaiah head',[[125,57],[139,54],[150,59],[155,71],[154,84],[148,97],[136,99],[126,91],[122,78]],58,.34);
    this.solid('Isaiah arm over scroll',[[128,105],[143,109],[151,118],[165,121],[180,118],[191,113],[203,114],[212,122],[203,129],[185,136],[170,140],[153,137],[139,127]],57.2,.3);
    this.solid('Isaiah scroll held open',[[179,119],[194,121],[210,129],[227,138],[246,147],[267,156],[271,166],[263,178],[250,180],[231,172],[211,160],[190,149],[176,140]],56.6,.19);
    this.solid('Isaiah dark trailing cloth',[[250,160],[265,155],[279,165],[291,184],[288,198],[282,208],[281,222],[287,236],[275,232],[261,222],[250,208],[245,190]],57.8,.28);
    // The small Christ and the upper angel are individually shaped human forms.
    this.solid('Christ golden torso in cloud',[[366,117],[383,119],[394,130],[397,145],[393,161],[381,175],[367,177],[356,171],[350,160],[355,145],[353,130]],60,.55);
    this.solid('Christ head in upper cloud',[[373,107],[381,103],[389,108],[391,119],[386,129],[376,130],[370,121]],59.2,.25);
    this.solid('Christ reclining legs',[[366,170],[382,171],[391,180],[385,192],[368,202],[351,208],[335,215],[317,218],[305,215],[303,208],[316,203],[336,196],[349,184]],59.8,.45);
    this.details('Christ bent arms',[[[357,138],[345,150],[332,158],[318,153]],[[391,139],[401,151],[397,167],[388,174]]],3.7,59.6);
    this.solid('Upper angel body and drapery',[[523,83],[533,82],[540,90],[539,102],[535,114],[537,126],[542,137],[539,149],[529,155],[519,152],[514,142],[516,129],[519,115],[514,102]],64,.37);
    this.bead('Upper angel head',528,77,7,8,63.8,.16);
    this.solid('Upper angel left open wing',[[520,93],[506,87],[491,80],[474,74],[459,77],[450,84],[465,86],[483,94],[501,101],[515,104]],64.7,.14);
    this.solid('Upper angel right open wing',[[536,94],[547,84],[555,72],[565,64],[578,59],[589,61],[576,69],[566,81],[556,92],[542,101]],64.7,.14);
    this.solid('Far right floating figure cloak',[[722,146],[735,143],[747,153],[752,170],[765,188],[772,209],[769,229],[756,242],[739,237],[728,225],[721,207],[715,183],[716,160]],68,.7,true,.8);
    // DNA, two spatial helices made of molecular balls at the left.
    const chains:Pixel[][]=[[[52,352],[63,373],[78,391],[96,403],[117,407],[140,404],[160,393],[176,377],[185,360]],[[57,341],[65,330],[74,341],[80,358],[88,373],[101,384],[118,385],[133,379],[141,366],[141,351]],[[39,410],[52,425],[72,434],[92,438],[113,435],[137,426],[155,410],[169,395]],[[79,358],[77,379],[81,399],[97,416],[117,426],[140,429],[159,424],[182,412],[201,399],[218,395]],[[106,349],[112,362],[117,379],[115,395],[107,413],[106,431],[113,447],[131,458],[150,456],[166,448],[180,433]],[[159,363],[165,374],[162,391],[150,405],[137,412],[131,428],[134,446],[145,462],[159,470],[175,470],[189,461],[198,444]]];
    let atom=0;for(const chain of chains){for(let i=0;i<chain.length-1;i++){const a=chain[i],b=chain[i+1],steps=Math.max(2,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/8));for(let j=0;j<steps;j++){const t=j/steps,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;this.bead('DNA molecular atom',x,y,2.6+Math.sin(atom++)*.5,2.8,43+2*Math.sin(y*.07+x*.02),.075);}this.pixelRod('DNA connecting molecular bond',a,b,.36,45.4);}}
    // Human cube-lattice: each vertex is a miniature full figure, connected by
    // the long arms/rods of the painted framework. Low-poly bodies keep cost low.
    const lattices:{x:number;y:number;size:number;d:number}[]=[{x:858,y:620,size:77,d:33},{x:773,y:554,size:63,d:38},{x:695,y:519,size:53,d:43},{x:685,y:452,size:43,d:49},{x:745,y:420,size:32,d:54},{x:725,y:371,size:24,d:59},{x:680,y:360,size:19,d:64}];
    for(const [n,c]of lattices.entries()){
      const s=c.size,base:Pixel[]=[[c.x,c.y],[c.x+s,c.y-7],[c.x+s,c.y+s*.63],[c.x,c.y+s*.69]],back:Pixel[]=base.map(([x,y])=>[x-s*.42,y-s*.4]);
      const vertices=[...base,...back];for(const [i,p]of vertices.entries())this.latticePerson(p[0],p[1],s*.24,c.d+(i>3?1.8:0),`Cube ${n+1} person ${i+1}`);
      for(let i=0;i<4;i++){this.pixelRod('Human cube framework edge',base[i],base[(i+1)%4],Math.max(.36,s*.008),c.d);this.pixelRod('Human cube receding edge',base[i],back[i],Math.max(.36,s*.008),c.d+.7);this.pixelRod('Human cube back edge',back[i],back[(i+1)%4],Math.max(.36,s*.008),c.d+1.8);}
      if(n<2){this.groundBelow(c.x,c.y+s*.7,c.d,1.8);this.groundBelow(c.x+s,c.y+s*.65,c.d,1.8);this.grounded(c.x,c.y+s*.7,c.d,.4,.5);this.grounded(c.x+s,c.y+s*.65,c.d,.4,.5);}
    }
    // Warm rays are modeled arches of translucent atmosphere, with no post pass.
    this.details('Warm cloud crests',[[[268,296],[280,273],[290,257],[309,251],[330,251]],[[355,326],[372,304],[392,296],[415,295],[432,288]],[[686,288],[717,280],[751,279],[784,288],[804,299]]],2.1,62.1);
    this.groundBelow(432,766,29.8);this.grounded(432,720,29.8,1.7,1.3);this.finish();
  }
  private latticePerson(x:number,y:number,h:number,d:number,name:string){
    // The narrow polygon is a complete closed human silhouette, not a cross.
    this.solid(name,[[x-h*.09,y-h*.55],[x-h*.12,y-h*.72],[x-h*.03,y-h*.83],[x+h*.1,y-h*.73],[x+h*.08,y-h*.56],[x+h*.18,y-h*.5],[x+h*.13,y],[x+h*.09,y+h*.22],[x,y],[x-h*.06,y+h*.25],[x-h*.15,y+h*.24],[x-h*.12,y],[x-h*.19,y-h*.24],[x-h*.17,y-h*.48]],d,.075,false);
  }
}

export function createDreamWorlds(scene:T.Scene):Floor[]{return [new BeeDream(scene),new GreatMasturbator(scene),new BurningGiraffe(scene),new Galacid(scene)];}


