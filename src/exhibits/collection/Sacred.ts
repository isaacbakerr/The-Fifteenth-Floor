import * as T from 'three';
import type {Artwork} from '../../Artwork';
import {World,coastal,marble,night} from '../World';
import {PaintedWorld,type Pixel} from '../PaintedWorld';

export const sacredArtworks:Record<string,Artwork>={
  'last-supper':{artist:'Salvador Dalí',title:'The Sacrament of the Last Supper',year:'1955',background:'A transparent Christ and twelve bowed apostles gather inside a luminous dodecahedron. Dalí joined Renaissance symmetry, the landscape of Port Lligat and the geometry of twelve in a vision of communion shaped by his renewed Catholic faith.',source:'https://www.nga.gov/artworks/46590-sacrament-last-supper'},
  'christ-of-saint-john':{artist:'Salvador Dalí',title:'Christ of Saint John of the Cross',year:'1951',background:'Dalí suspended the crucifixion above the quiet waters of Port Lligat, viewing Christ from an extraordinary elevated angle. The composition was inspired by a drawing attributed to the mystic Saint John of the Cross; the painting is held in Glasgow’s Kelvingrove collection.',source:'https://www.glasgowlife.org.uk/museums/venues/kelvingrove-art-gallery-and-museum/salvador-dalis-christ-of-st-john-of-the-cross'},
  'madonna-port-lligat':{artist:'Salvador Dalí',title:'The Madonna of Port Lligat',year:'1949',background:'Gala appears as the Madonna above the bay where she and Dalí lived. Openings through the sacred figures and separated architectural fragments bring atomic-era ideas into a Renaissance-inspired altarpiece. This floor follows the smaller first version, preserved at Marquette’s Haggerty Museum.',source:'https://haggerty.zetcom.net/en/collection/item/943/'},
  'discovery-of-america':{artist:'Salvador Dalí',title:'The Discovery of America by Christopher Columbus',year:'1958–1959',background:'One of Dalí’s monumental historical paintings, this vision combines a youthful Columbus, religious banners, ships and a forest of crosses. Gala appears as a sacred figure within an imagined landing that mixes Spanish history with the artist’s personal mythology.',source:'https://npg.si.edu/object/npg_FL900021'},
};

// Folded cloth is modeled all the way around so these figures remain sculptures
// when approached from the sides, rather than a painted facade. The contours
// below follow the actual silhouettes, not interchangeable mannequin meshes.
function grounded(w:PaintedWorld,x:number,y:number,depth:number,rx:number,rz:number){const p=w.point(x,y,depth);w.obstacle(p.x,-depth,rx,rz);}
function detail(w:PaintedWorld,name:string,points:Pixel[],width:number,depth:number){return w.stroke(name,points,width,depth);}
function coast(w:PaintedWorld,contours:Pixel[][],depth:number){contours.forEach((outline,i)=>w.solid(`Distant coastal ridge ${i+1}`,outline,depth+i*2,.55,true));}
// The source's perspective places foreground feet at different elevations. Small
// smooth shelves in the shore meet their real bottoms without moving silhouettes.
function shelf(x:number,z:number,cx:number,cz:number,halfWidth:number,radiusZ:number,rise:number){return rise*Math.exp(-((Math.max(0,Math.abs(x-cx)-halfWidth)/1.8)**2+((z-cz)/radiusZ)**2));}

class LastSupper extends PaintedWorld {
  override height(x:number,z:number){return super.height(x,z)+Math.max(shelf(x,z,-5.2,-31.05,2.2,2.3,.5),shelf(x,z,5.25,-31.65,2.2,2.3,.55));}
  constructor(scene:T.Scene){
    super(scene,'last-supper','14',sacredArtworks['last-supper'],{...marble,ground:0x5e5844,sky:0x7295a0,horizon:0xc9c4a1,sunPosition:[-20,27,14],fog:.0008,extent:54},{image:'/textures/sacred-supper-pigment.jpg',width:600,height:368,span:18,depth:40,horizon:.98,centreY:.2});
    this.solid('Left distant luminous cloud',[[75,137],[95,131],[121,134],[143,129],[165,133],[171,139],[151,144],[125,142],[101,146],[83,143]],72,.3,true,.64);
    this.solid('Central distant luminous cloud',[[232,120],[254,116],[276,120],[297,116],[316,122],[337,122],[344,128],[322,132],[297,129],[277,133],[252,128]],74,.3,true,.62);
    coast(this,[[[0,183],[11,176],[23,178],[31,171],[44,178],[55,174],[60,188],[89,192],[86,200],[0,204]],[[88,187],[98,178],[105,179],[112,174],[127,181],[141,190],[171,190],[171,199],[86,200]],[[359,181],[391,172],[419,176],[441,171],[455,159],[477,147],[493,143],[507,150],[516,157],[531,147],[548,148],[555,143],[575,145],[588,139],[600,136],[600,193],[365,198]]],65);
    // Pentagonal structural bays form an actual open, walkable volume.
    const beams:Pixel[][]=[[[41,106],[145,0],[163,0],[58,109],[61,178],[47,183]],[[148,0],[170,0],[201,42],[402,43],[435,0],[454,0],[416,62],[189,62]],[[42,105],[57,111],[62,191],[49,191]],[[166,0],[183,0],[212,42],[201,45]],[[196,65],[209,74],[171,199],[155,201]],[[207,64],[402,64],[396,77],[214,77]],[[397,77],[411,62],[442,198],[426,197]],[[436,0],[454,0],[556,104],[543,115]],[[543,109],[559,103],[560,190],[547,197]]];
    beams.forEach((p,i)=>this.blockPixels(`Pentagonal golden beam ${i+1}`,p,i<4?49:45,.24));
    for(const [x,d]of [[50,46],[552,46],[163,48],[435,48]])grounded(this,x,196,d,.32,.32);
    // The upper apparition is separated into torso and arms, each a closed volume.
    this.solid('Luminous upper torso',[[279,0],[310,0],[318,13],[342,11],[358,23],[350,47],[326,48],[306,47],[281,47],[257,46],[246,28],[261,13],[275,10]],55,.8,true,.53);
    this.solid('Upper left arm and open hand',[[257,16],[244,29],[225,38],[204,46],[187,54],[165,61],[151,66],[139,72],[125,82],[116,87],[109,83],[115,76],[106,83],[99,86],[102,77],[112,66],[132,60],[157,51],[178,43],[198,34],[218,23],[237,14]],54,.45,true,.65);
    this.solid('Upper right arm and open hand',[[342,16],[360,21],[379,33],[399,42],[420,48],[441,55],[464,63],[483,74],[492,82],[499,85],[501,80],[495,70],[510,86],[516,88],[511,76],[499,66],[478,57],[455,47],[430,39],[402,30],[378,18],[358,11]],54,.45,true,.65);
    // A thick tabletop and hanging linen front retain their long perspective.
    this.blockPixels('Linen tabletop',[[0,252],[119,230],[479,230],[600,253],[600,269],[0,269]],39,.22);
    this.blockPixels('Deep linen table front',[[0,263],[600,263],[600,316],[0,316]],39.7,.65);
    for(const x of [59,161,242,342,436,538])detail(this,'Woven linen crease',[[x,265],[x+.3,287],[x+1,312]],.35,38.95);
    grounded(this,300,314,39.7,14.1,2.0);
    const timber=this.mat(0x3a382b);for(const x of [55,545])for(const depth of [39.5,43]){const p=this.point(x,314,depth),foot=p.clone();foot.y=this.height(foot.x,foot.z)+.03;this.limb(this.group,foot.toArray(),p.toArray(),.12,.14,timber);}
    // Twelve bowed apostles; their arrangement mirrors the original painting.
    const rear:{body:Pixel[];head:[number,number,number,number];depth:number}[]=[
      {body:[[0,243],[11,229],[26,224],[36,232],[40,250],[30,256],[5,258]],head:[22,235,10,12],depth:45},
      {body:[[36,243],[43,225],[57,216],[73,222],[81,238],[68,246],[51,249]],head:[65,221,11,13],depth:46},
      {body:[[109,232],[112,216],[123,204],[136,208],[146,225],[139,234]],head:[127,214,8,11],depth:47},
      {body:[[149,229],[157,211],[172,201],[186,207],[199,229],[183,238],[164,235]],head:[178,215,11,12],depth:46},
      {body:[[206,234],[208,212],[216,198],[230,194],[243,201],[251,222],[247,235]],head:[228,207,14,16],depth:47},
      {body:[[351,235],[354,212],[363,197],[376,194],[390,201],[396,221],[391,233]],head:[378,208,13,16],depth:47},
      {body:[[405,230],[414,211],[427,202],[441,210],[449,229],[432,237]],head:[425,215,10,11],depth:46},
      {body:[[459,231],[463,212],[476,207],[487,215],[490,232]],head:[477,219,9,11],depth:47},
      {body:[[514,242],[519,223],[533,214],[547,221],[555,241],[542,247]],head:[535,222,11,13],depth:46},
      {body:[[560,250],[566,233],[579,225],[592,232],[600,246],[599,259],[579,257]],head:[579,237,11,13],depth:45},
    ];
    rear.forEach((f,i)=>{this.solid(`Apostle ${i+1} bowed shoulders and cloak`,f.body,f.depth,.55);this.bead(`Apostle ${i+1} bowed head`,...f.head,f.depth-.56,.38);const [x,y,rx,ry]=f.head;this.bead(`Apostle ${i+1} prayer hands`,x+(x<300?8:-8),y+ry+5,rx*.47,ry*.35,f.depth-.7,.12);});
    // Each foreground kneeler has a broad folded cloak, face, hands and rolled hem.
    this.solid('Left foreground kneeling apostle robe',[[169,233],[183,229],[191,235],[199,252],[203,277],[208,306],[209,335],[201,358],[188,363],[160,361],[134,358],[108,354],[99,349],[111,341],[125,316],[137,288],[149,260]],31,1.15);
    this.bead('Left kneeling apostle bowed head',183,227,12,14,30.2,.43);
    this.solid('Left kneeling apostle forearms',[[178,241],[188,236],[197,239],[204,251],[195,257],[187,250],[176,251]],30.3,.2);
    this.solid('Right foreground kneeling apostle robe',[[407,234],[418,230],[432,238],[446,259],[456,283],[469,317],[480,341],[495,349],[480,356],[450,361],[427,362],[406,359],[398,347],[397,319],[400,294],[400,268]],31.6,1.15);
    this.bead('Right kneeling apostle bowed head',415,226,12,14,30.9,.43);
    this.solid('Right kneeling apostle forearms',[[404,240],[415,236],[425,243],[425,253],[414,253],[408,249],[398,253]],30.8,.2);
    for(const points of [[[174,246],[157,280],[140,316],[123,345]],[[185,251],[179,294],[180,337],[192,354]],[[424,247],[433,280],[445,317],[468,350]],[[407,251],[410,294],[411,337],[420,356]]] as Pixel[][])detail(this,'Raised folded robe seam',points,.5,30.8);
    grounded(this,172,354,31,2.65,1.5);grounded(this,435,355,31.6,2.65,1.5);
    // Christ's bare chest, drapery, hands and face are independent curved solids.
    this.solid('Transparent Christ chest',[[288,188],[299,184],[309,189],[313,203],[321,221],[316,230],[302,231],[288,226],[283,210]],47,.52,true,.78);
    this.solid('Christ white shoulder drapery',[[287,191],[293,197],[296,211],[306,216],[319,214],[331,223],[329,233],[307,234],[294,227],[284,225],[280,210]],46.4,.3);
    this.bead('Christ face',302,180,10,15,45.9,.35);
    this.solid('Christ raised left hand and arm',[[286,195],[281,195],[278,204],[271,216],[266,218],[263,214],[269,198],[274,185],[278,180],[279,185],[276,192],[282,189]],45.8,.17);
    this.solid('Christ right forearm across chest',[[307,198],[313,200],[318,206],[324,211],[336,216],[338,221],[330,222],[317,215],[307,210],[300,207]],45.8,.2);
    this.bead('Left broken bread half',256,252,8,6,37.7,.2);this.bead('Right broken bread half',350,251,8,6,37.7,.2);
    this.blockPixels('Wine glass body',[[280,227],[286,227],[285,243],[281,243]],43,.06);
    this.group.userData.sacredReconstruction={parts:'twelve apostles, Christ, apparition, linen table, pentagonal bays',source:[1600,983],trace:[600,368]};this.finish();
  }
}

class ChristCross extends PaintedWorld {
  override height(x:number,z:number){return super.height(x,z)+Math.max(shelf(x,z,0,-34,1.1,2.5,.23),shelf(x,z,-4.4,-33,.6,2,.14),shelf(x,z,-6.2,-44,2.2,2.5,1.5));}
  constructor(scene:T.Scene){
    super(scene,'christ-of-saint-john','15',sacredArtworks['christ-of-saint-john'],{...night,sky:0x030607,horizon:0x243d45,ground:0x525342,sun:0xc7b68d,sunPosition:[-19,35,16],fog:.0005,extent:48},{image:'/textures/sacred-cross-pigment.jpg',width:238,height:423,span:20,depth:38,horizon:.98,centreY:.2});
    this.solid('High ochre cloudbank',[[8,281],[25,279],[37,273],[55,270],[73,275],[91,273],[109,277],[126,269],[143,273],[161,281],[180,277],[201,283],[227,281],[231,290],[213,300],[194,296],[178,300],[154,292],[136,297],[112,287],[89,291],[63,286],[43,290],[24,286]],70,.65,true,.66);
    this.solid('Middle cloudbank',[[0,308],[21,312],[38,304],[59,311],[80,306],[99,315],[119,309],[143,316],[163,309],[184,318],[211,309],[238,318],[238,331],[210,328],[185,335],[160,328],[132,333],[110,325],[85,329],[64,320],[38,325],[20,321],[0,324]],72,.6,true,.72);
    this.solid('Lower luminous cloudbank',[[0,342],[21,343],[40,337],[62,341],[83,337],[103,344],[120,341],[139,345],[161,340],[182,343],[208,339],[238,344],[237,354],[217,352],[192,359],[165,354],[144,358],[118,351],[96,355],[69,348],[45,353],[20,348],[0,351]],74,.5,true,.62);
    coast(this,[[[0,375],[15,366],[32,367],[44,371],[60,376],[73,373],[91,377],[107,374],[129,377],[151,371],[169,373],[185,368],[197,370],[210,365],[228,370],[238,368],[238,383],[0,385]]],62);
    // Cross timber is separate from the anatomy and retains the foreshortened form.
    this.blockPixels('Long receding vertical cross timber',[[89,0],[151,0],[132,260],[106,261]],41,1.1);
    this.blockPixels('Broad foreshortened crossbeam',[[5,35],[233,35],[227,72],[13,73]],40.6,1.05);
    this.blockPixels('Small cross inscription panel',[[109,16],[129,16],[130,32],[110,32]],39.25,.08);
    // Suspended crucifix: shoulder girdle, ribcage, abdomen and legs have depth.
    this.solid('Christ shoulder girdle and upper back',[[89,89],[103,89],[115,94],[126,94],[140,85],[151,89],[146,104],[134,113],[130,127],[112,129],[100,113],[89,105]],37.2,.85);
    this.solid('Christ left upper arm',[[90,91],[82,85],[70,72],[60,62],[54,66],[60,80],[70,96],[88,108],[98,109],[101,101]],36.6,.34);
    this.solid('Christ left forearm and hand',[[60,63],[50,56],[43,46],[37,43],[32,46],[25,44],[20,45],[28,51],[35,55],[42,62],[48,70],[57,75]],35.9,.25);
    this.solid('Christ right upper arm',[[143,91],[154,82],[165,68],[172,64],[179,67],[174,81],[162,98],[147,107],[136,106]],36.6,.34);
    this.solid('Christ right forearm and hand',[[172,64],[181,57],[189,48],[198,46],[204,41],[210,42],[205,48],[214,47],[210,53],[198,57],[187,64],[179,73]],35.8,.25);
    this.solid('Christ abdomen',[[109,112],[126,110],[136,119],[132,139],[126,150],[110,146],[103,134]],36.2,.68);
    this.solid('Christ bowed head and hair',[[112,111],[123,109],[132,117],[136,128],[133,139],[126,148],[114,146],[107,137],[106,123]],34.5,.6);
    this.bead('Christ crown and bowed neck',119,117,11,9,35,.42);
    this.solid('Golden loincloth',[[104,129],[112,138],[120,143],[130,139],[132,151],[126,160],[111,158],[103,150],[100,139]],36.2,.3);
    this.solid('Christ left thigh and knee',[[109,153],[118,156],[120,167],[116,176],[108,174],[106,164]],36.7,.32);
    this.solid('Christ right thigh and bent leg',[[120,155],[128,153],[130,165],[124,176],[118,179],[115,172]],36.1,.3);
    this.solid('Christ crossed feet',[[109,169],[114,171],[117,178],[123,176],[127,174],[126,180],[117,186],[110,182]],35.7,.18);
    // Boat and fishermen occupy real lower foreground depths beneath the cross.
    this.solid('Golden fishing boat hull',[[103,407],[108,402],[124,406],[141,401],[146,405],[142,416],[128,420],[113,417]],35,.42);
    this.solid('Fishing boat interior',[[109,406],[123,410],[140,405],[137,413],[125,415],[115,413]],34.6,.13);
    detail(this,'Fishing boat mast',[[113,411],[114,391],[115,385]],.55,35.1);
    detail(this,'Boat right upright',[[140,413],[140,398],[142,394]],.7,34.8);
    this.solid('Left fisherman coat',[[10,396],[14,395],[17,400],[16,406],[15,417],[11,416],[10,408],[7,406]],33,.15);this.bead('Left fisherman head',13,392,2.1,3,32.9,.1);
    detail(this,'Left fisherman left leg',[[11,406],[10,414],[8,421]],.75,32.9);detail(this,'Left fisherman right leg',[[14,406],[15,413],[16,418]],.75,32.8);
    this.solid('Shore fisherman bent body',[[109,397],[112,394],[117,395],[122,400],[125,405],[120,407],[116,404],[113,406],[109,404]],33.5,.16);
    detail(this,'Shore fisherman left leg',[[113,405],[112,410],[110,416]],.8,33.4);detail(this,'Shore fisherman right leg',[[118,405],[120,411],[124,416]],.8,33.3);
    this.solid('Near right rocky quay',[[173,396],[185,393],[202,384],[220,381],[238,379],[238,423],[177,423],[173,411]],31,1.1,false);
    this.solid('Near left coastal rocks',[[0,371],[14,372],[23,379],[30,379],[39,383],[36,388],[21,387],[14,393],[0,393]],44,.7);
    grounded(this,125,417,35,1.3,.6);grounded(this,13,417,33,.25,.25);grounded(this,217,416,31,2.2,1.7);
    this.group.userData.sacredReconstruction={parts:'foreshortened cross, anatomy, boat, fishermen, quay',source:[800,1426],trace:[238,423]};this.finish();
  }
}

class Madonna extends PaintedWorld {
  override height(x:number,z:number){return super.height(x,z)+shelf(x,z,0,-35.2,7,2.5,.78);}
  constructor(scene:T.Scene){
    super(scene,'madonna-port-lligat','19',sacredArtworks['madonna-port-lligat'],{...coastal,ground:0x8e9b80,sky:0x5d74a7,horizon:0xc0c8b9,sunPosition:[-17,28,18],fog:.0006,extent:48},{image:'/textures/sacred-madonna-pigment.jpg',width:276,height:362,span:19,depth:36,horizon:.98,centreY:.2});
    // The catalogue photograph includes the frame. Restrict pigment sampling to
    // the painted canvas, calibrated against the two arch corners and altar.
    this.paint.map!.repeat.set(.9008,.9111);this.paint.map!.offset.set(.062,.0476);
    coast(this,[[[0,156],[11,148],[23,155],[31,153],[42,160],[62,160],[63,165],[0,166]],[[218,158],[227,145],[234,137],[242,124],[250,127],[256,120],[268,128],[276,125],[276,164],[215,164]]],64);
    // Detached altarpiece sections; their hollow cavities have modeled depth.
    const blocks:{name:string;shape:Pixel[];depth:number;thick:number}[]=[
      {name:'Upper left stone arch fragment',shape:[[59,39],[118,39],[121,62],[116,73],[105,76],[97,85],[93,99],[86,103],[59,99]],depth:43,thick:.8},
      {name:'Upper right stone arch fragment',shape:[[164,38],[221,39],[224,99],[193,103],[187,91],[177,81],[163,76],[160,66]],depth:43.5,thick:.8},
      {name:'Lower left upper cabinet rear',shape:[[60,141],[106,132],[106,193],[62,204]],depth:42,thick:.35},
      {name:'Lower right upper cabinet rear',shape:[[175,132],[219,141],[219,202],[175,194]],depth:42,thick:.35},
      {name:'Lower left cabinet lower fragment',shape:[[60,211],[85,205],[88,272],[60,278]],depth:41.5,thick:.6},
      {name:'Lower right cabinet lower fragment',shape:[[192,206],[220,212],[222,278],[192,273]],depth:41.5,thick:.6},
    ];blocks.forEach(b=>this.blockPixels(b.name,b.shape,b.depth,b.thick));
    for(const [x,y,sign,d]of [[61,142,1,41],[219,142,-1,41],[61,211,1,40],[220,212,-1,40]]){
      this.blockPixels('Detached cabinet thick outer jamb',[[x,y],[x+sign*4,y-1],[x+sign*4,y+58],[x,y+60]],d,.5);
      this.blockPixels('Detached cabinet thick upper lintel',[[x,y],[x+sign*41,y-8],[x+sign*41,y-3],[x+sign*4,y+5]],d,.5);
    }
    // A real rectangular opening passes through the Madonna's upper body.
    this.solid('Madonna left blue shoulder and sleeve',[[119,132],[111,139],[108,152],[102,161],[103,177],[113,187],[124,182],[130,171],[125,158],[124,145]],35.2,.5);
    this.solid('Madonna right blue shoulder and sleeve',[[151,133],[162,139],[165,151],[173,165],[173,178],[165,188],[155,182],[149,170],[154,156]],35.3,.5);
    this.solid('Madonna upper red bodice',[[120,128],[128,123],[146,123],[153,130],[157,143],[148,151],[142,144],[137,147],[131,145],[124,150],[116,141]],36,.4);
    this.solid('Madonna open torso left frame',[[122,154],[128,155],[126,176],[127,194],[117,199],[114,185],[117,169]],35.3,.26);
    this.solid('Madonna open torso right frame',[[149,155],[155,154],[159,170],[161,186],[154,198],[147,194],[151,176]],35.3,.26);
    this.solid('Madonna praying left forearm and hand',[[111,158],[115,160],[123,151],[130,140],[132,129],[136,128],[137,139],[132,151],[121,166],[115,170],[109,168]],33.8,.2);
    this.solid('Madonna praying right forearm and hand',[[159,157],[155,161],[149,151],[142,140],[141,130],[137,128],[136,140],[141,152],[152,167],[159,170],[165,165]],33.7,.2);
    this.solid('Gala face and auburn hair',[[128,101],[137,98],[147,101],[152,110],[150,121],[144,130],[137,133],[129,127],[125,116]],34.9,.45);
    this.bead('Gala forehead',139,112,8,11,34.5,.32);
    // Golden and rose drapery is split into overlapping, thick folded volumes.
    this.solid('Madonna left rose skirt',[[108,192],[124,193],[139,204],[140,219],[130,238],[118,256],[99,268],[82,267],[87,250],[89,228],[96,210]],35.1,.95);
    this.solid('Madonna right golden skirt',[[148,193],[164,194],[179,210],[185,236],[194,258],[210,280],[209,292],[190,296],[168,291],[151,299],[133,298],[121,288],[125,271],[135,249],[140,225]],35.5,1.05);
    this.solid('Madonna forward gold robe folds',[[140,217],[152,219],[161,234],[159,254],[171,275],[176,291],[157,300],[139,297],[124,287],[115,280],[120,267],[130,248]],33.8,.6);
    this.solid('Infant green lower drapery',[[122,187],[133,184],[146,185],[153,193],[151,202],[139,209],[127,207],[116,201]],32.8,.4);
    this.solid('Infant torso and knees',[[130,173],[137,170],[144,174],[146,184],[140,192],[131,196],[124,195],[122,189],[129,182]],32.5,.34);
    this.bead('Infant Christ head',138,165,6,9,32.2,.3);
    detail(this,'Infant left arm',[[132,177],[125,174],[121,168]],1.4,32.1);detail(this,'Infant right arm',[[142,176],[149,179],[151,172]],1.4,32.1);
    detail(this,'Infant bent left leg',[[132,191],[125,201],[118,199]],2.2,32.0);
    // Shell ribs and egg hang independently above the praying figure.
    this.solid('Suspended scallop shell',[[124,11],[134,7],[146,8],[157,13],[155,23],[148,32],[137,34],[128,27]],44,.35);
    this.bead('Suspended golden egg',141,60,3.6,5.6,43,.2);
    detail(this,'Egg suspension filament',[[141,33],[141,48],[141,55]],.17,43.4);
    for(let i=0;i<8;i++)detail(this,'Scallop shell radial rib',[[137,31],[130+i*3,23],[125+i*4,13]],.35,43.5);
    // Thick stepped altar slabs are independent volumes, not a base image plane.
    this.blockPixels('Upper stone altar slab',[[39,294],[241,294],[251,312],[28,312]],34.7,.42);
    this.blockPixels('Middle green altar step',[[31,315],[247,315],[250,329],[29,329]],34.9,.2);
    this.blockPixels('Lowest green altar step',[[31,332],[247,332],[253,348],[24,348]],35.2,.2);
    grounded(this,139,336,35,6.4,1.65);
    // Lemons, shell and sea urchin echo the foreground still life.
    this.bead('Left lemon',207,305,5,5,33.7,.2);this.bead('Right lemon',219,304,5,5,33.7,.2);
    this.solid('Golden altar shell',[[76,305],[86,295],[96,300],[101,308],[97,313],[80,316],[71,311]],33.5,.2);
    this.bead('Floating foreground sea urchin',22,255,20,24,30.7,.82);
    this.solid('Urchin supporting cloth ribbon',[[25,278],[31,282],[38,280],[36,288],[25,293],[10,295],[13,291],[19,288],[18,281]],30.6,.13);
    this.solid('Floating fish',[[39,231],[44,227],[51,225],[59,222],[64,224],[58,229],[53,237],[44,238]],32.6,.22);
    detail(this,'Fish tail',[[53,227],[63,219],[67,222]],.8,32.4);
    this.group.userData.sacredReconstruction={parts:'open Madonna torso, infant, separate robes, detached altar, shell, egg, fish and urchin',source:[768,986],trace:[276,362],pigmentCrop:[.062,.0413,.9008,.9111]};this.finish();
  }
}

class Discovery extends PaintedWorld {
  override height(x:number,z:number){return super.height(x,z)+Math.max(shelf(x,z,-2.2,-34.3,1.3,2,2.36),shelf(x,z,1.6,-35.5,1,2,2.1),shelf(x,z,5.4,-35.5,1.7,2.2,1.84),shelf(x,z,0,-46,2,2.7,2.83));}
  private shoreMesh(){
    // Concentrate terrain vertices beneath the feet rather than increasing the
    // resolution of the entire landscape. Rendered shore and collision agree.
    const xs:number[]=[],zs:number[]=[];for(let i=0;i<=20;i++)xs.push(-75+i*3);for(let i=1;i<=60;i++)xs.push(-15+i*.5);for(let i=1;i<=20;i++)xs.push(15+i*3);
    for(let i=0;i<=16;i++)zs.push(-100+i*3);for(let i=1;i<=70;i++)zs.push(-52+i*.4);for(let i=1;i<=25;i++)zs.push(-24+i*74/25);
    const positions:number[]=[],uvs:number[]=[],indices:number[]=[];for(let j=0;j<zs.length;j++)for(let i=0;i<xs.length;i++){const x=xs[i],z=zs[j];positions.push(x,this.height(x,z),z);uvs.push((x+75)/150,(z+100)/150);if(i<xs.length-1&&j<zs.length-1){const a=j*xs.length+i;indices.push(a,a+xs.length,a+1,a+1,a+xs.length,a+xs.length+1);}}
    const ground=this.group.getObjectByName('Walkable landscape') as T.Mesh,g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();ground.geometry.dispose();ground.geometry=g;
  }
  constructor(scene:T.Scene){
    super(scene,'discovery-of-america','25',sacredArtworks['discovery-of-america'],{...marble,sky:0x8b9691,horizon:0xc9cbb8,ground:0x646c58,sunPosition:[-24,30,14],fog:.0007,extent:54},{image:'/textures/sacred-discovery-pigment.jpg',width:274,height:363,span:20,depth:39,horizon:.99,centreY:.2});
    this.shoreMesh();
    coast(this,[[[0,266],[24,261],[41,269],[58,265],[75,272],[92,267],[113,276],[134,272],[147,280],[159,279],[171,282],[188,278],[203,282],[219,273],[240,274],[258,266],[274,270],[274,289],[0,290]]],64);
    // Tall processional banner: modeled cloth and the sacred apparition stand free.
    this.solid('Upper long floating banner silk',[[24,50],[50,43],[79,41],[108,47],[107,68],[98,84],[91,111],[84,143],[80,171],[68,194],[53,196],[36,186],[23,167]],44,.24,false);
    this.solid('Gala white gown on the banner',[[57,87],[65,85],[75,95],[79,112],[75,133],[69,159],[75,178],[66,185],[48,181],[44,172],[48,153],[48,129],[43,113],[46,96]],42.6,.6);
    this.solid('Gala head and hair on banner',[[58,55],[67,52],[75,57],[78,65],[74,73],[68,79],[61,77],[54,72],[53,63]],42.1,.33);
    this.bead('Gala face on the banner',66,65,6.5,8,41.7,.25);
    detail(this,'Gala right sleeve',[[69,86],[76,99],[75,114],[71,121]],2.4,42.0);
    detail(this,'Gala left sleeve',[[57,87],[51,99],[49,117],[48,130]],2.3,42.0);
    this.solid('Long sacred banner trailing ribbon',[[53,183],[62,190],[59,210],[52,224],[54,240],[62,255],[56,259],[47,248],[43,230],[46,214],[47,197]],42.4,.12);
    detail(this,'Banner standard shaft',[[48,43],[49,120],[49,193],[49,275],[50,354]],.65,43.9);
    // Columbus: a shaped anatomical silhouette divided into limbs and folded cloth.
    this.solid('Columbus flowing tunic',[[72,236],[82,235],[91,245],[94,260],[104,270],[111,286],[110,307],[99,319],[92,317],[89,298],[83,281],[78,265],[70,252]],35.2,.65);
    this.solid('Columbus left reaching arm',[[74,239],[68,232],[62,226],[58,216],[55,212],[53,216],[56,227],[62,237],[69,247]],34.6,.24);
    this.solid('Columbus right outstretched arm',[[86,244],[95,246],[105,254],[117,260],[123,263],[122,267],[113,266],[100,262],[89,254]],34.6,.22);
    this.solid('Columbus dark hair and face',[[74,220],[82,219],[87,224],[88,231],[84,237],[78,240],[72,236],[70,230]],34.5,.33);
    this.bead('Columbus cheek',80,230,5,6,34.2,.22);
    this.solid('Columbus forward bare leg',[[77,269],[84,271],[85,284],[80,299],[79,311],[83,316],[81,319],[74,317],[73,308],[74,292]],34.1,.28);
    this.solid('Columbus rear bare leg',[[88,277],[94,285],[95,300],[101,311],[105,316],[101,320],[95,316],[90,306],[87,295],[84,285]],34.5,.28);
    grounded(this,82,316,34.3,.7,.65);
    // Principal ship, with full hull, mast, yards, rigging and bowed sail surfaces.
    this.solid('Ship rounded stern hull',[[111,279],[121,268],[136,266],[148,273],[157,290],[157,306],[149,318],[132,322],[119,317],[111,302]],46,1.1);
    this.solid('Ship dark aft interior',[[118,286],[127,279],[139,278],[147,287],[150,301],[142,313],[127,313],[119,302]],44.9,.4);
    this.blockPixels('Lower square sail',[[103,211],[167,214],[179,247],[167,264],[143,269],[120,263],[108,245]],47.2,.28);
    this.blockPixels('Upper square sail',[[113,167],[156,165],[169,208],[103,210]],48.2,.28);
    detail(this,'Ship lower mast',[[135,315],[135,263],[135,211],[135,164]],.68,45.8);
    detail(this,'Ship left rigging',[[135,164],[111,213],[119,300]],.24,46.4);detail(this,'Ship right rigging',[[135,164],[171,216],[147,305]],.24,46.4);
    detail(this,'Upper sail horizontal yard',[[111,166],[137,166],[158,166]],.52,47.6);
    detail(this,'Lower sail horizontal yard',[[104,211],[137,212],[169,215]],.6,46.6);
    grounded(this,135,313,46,1.4,1.2);
    // Forest of spears and cruciform standards occupies the right background.
    const standards:[number,number,number,number][]=[[165,39,325,53],[180,19,326,51],[197,2,327,49],[213,0,327,47],[231,5,328,45],[249,0,327,43],[265,22,328,41],[150,86,324,56],[172,62,325,54],[188,46,325,52]];
    standards.forEach(([x,top,bottom,d],i)=>{detail(this,`Processional standard ${i+1}`,[[x,top],[x+.4,(top+bottom)/2],[x+.9,bottom]],i>5?.45:.65,d);if(i<7)detail(this,`Crossbar ${i+1}`,[[x-6,top+12],[x,top+12],[x+6,top+12]],.55,d-.1);grounded(this,x,bottom,d,.12,.12);});
    this.solid('Right red and gold processional flag',[[164,181],[181,174],[199,164],[215,153],[218,159],[205,173],[187,186],[170,192]],50,.08,false);
    this.solid('Upper ochre processional flag',[[184,118],[199,111],[214,97],[223,89],[225,94],[215,108],[197,123],[186,128]],52,.08,false);
    // Individually traced kneeling figures replace the former generic row.
    const kneelers:{name:string;outline:Pixel[];head:[number,number,number,number];depth:number}[]=[
      {name:'Monk beside ship',outline:[[156,298],[160,294],[170,297],[176,306],[181,319],[175,325],[159,324],[154,317],[156,309]],head:[160,292,5,5],depth:35.5},
      {name:'White kneeling attendant',outline:[[209,304],[218,301],[224,310],[224,320],[235,329],[222,331],[210,326],[207,315]],head:[215,292,4.5,7],depth:36},
      {name:'Dark kneeling monk',outline:[[238,301],[246,296],[254,305],[258,319],[266,329],[245,330],[234,323],[234,310]],head:[243,291,4.5,7],depth:35},
    ];kneelers.forEach(f=>{this.solid(f.name+' robes',f.outline,f.depth,.45);this.bead(f.name+' bowed head',...f.head,f.depth-.4,.22);grounded(this,f.head[0],325,f.depth,.65,.5);});
    // A sea urchin in the foreground is a distinctive motif of the original.
    this.bead('Foreground urchin',127,335,20,15,30.5,.75);
    const bed=this.point(127,349,30.5);bed.y=this.height(bed.x,bed.z)+.4;this.rock(this.group,bed.toArray(),[1.2,.5,.9],this.mat(0x575747),3).name='Low shoreline rock beneath the urchin';
    const dark=this.mat(0x4b5042,.83);for(let i=0;i<30;i++){const a=i*2.39996,r=15+4*Math.sin(i*2.1),x=127+Math.cos(a)*r,y=335+Math.sin(a)*r*.65;this.stroke('Urchin radial spine',[[x,y],[127+Math.cos(a)*(r+5),335+Math.sin(a)*(r+5)*.65]],.24,30.1,dark);}
    grounded(this,127,342,30.5,1.2,.75);
    this.solid('Near left dark shoreline rock',[[0,337],[21,337],[31,342],[45,342],[61,355],[75,363],[0,363]],30.5,.55,false);
    this.solid('Near right dark shoreline rock',[[154,338],[177,336],[193,341],[206,344],[225,339],[247,341],[274,337],[274,363],[156,363]],31,.6,false);
    this.group.userData.sacredReconstruction={parts:'Columbus, Gala on separate banner, full ship, independent crosses, kneeling figures and urchin',source:[800,1055],trace:[274,363]};this.finish();
  }
}

export function createSacredWorlds(scene:T.Scene):World[]{return [new LastSupper(scene),new ChristCross(scene),new Madonna(scene),new Discovery(scene)];}

