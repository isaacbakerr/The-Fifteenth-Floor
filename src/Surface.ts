import * as T from 'three';

/** Fine world-space relief and broad pigment variation without texture downloads
 * or another render pass. Composes with each painting's existing shaders. */
export function improveSurfaces(root:T.Object3D){
  const seen=new Set<T.Material>();
  root.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    for(const m of Array.isArray(object.material)?object.material:[object.material]){
      if(!(m instanceof T.MeshStandardMaterial)||seen.has(m)||m.userData.surfaceDetail)continue;
      seen.add(m);m.userData.surfaceDetail=true;
      const original=m.onBeforeCompile;
      const previousKey=m.customProgramCacheKey();
      const relief=m.map ? .0015 : m.metalness>.5 ? .001 : m.roughness>.8 ? .006 : .0025;
      m.onBeforeCompile=(shader,renderer)=>{
        original.call(m,shader,renderer);
        shader.uniforms.surfaceRelief={value:relief};
        shader.vertexShader='varying vec3 exhibitPosition;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
          vec4 exhibitLocal=vec4(transformed,1.);
          #ifdef USE_INSTANCING
            exhibitLocal=instanceMatrix*exhibitLocal;
          #endif
          exhibitPosition=(modelMatrix*exhibitLocal).xyz;`);
        shader.fragmentShader=`uniform float surfaceRelief;varying vec3 exhibitPosition;
          float exhibitNoise(vec3 p){return .5+.5*sin(p.x+sin(p.y*1.31))*sin(p.z+sin(p.x*.73));}
        `+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          float exhibitPigment=exhibitNoise(exhibitPosition*2.3);
          diffuseColor.rgb*=.955+.075*exhibitPigment;`);
        shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
          roughnessFactor=clamp(roughnessFactor+(exhibitPigment-.5)*.07,.09,1.);`);
        shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
          float exhibitHeight=exhibitNoise(exhibitPosition*34.)*surfaceRelief;
          vec3 exhibitDx=dFdx(-vViewPosition),exhibitDy=dFdy(-vViewPosition);
          vec3 exhibitR1=cross(exhibitDy,normal),exhibitR2=cross(normal,exhibitDx);
          float exhibitDet=dot(exhibitDx,exhibitR1);
          vec3 exhibitGradient=dFdx(exhibitHeight)*exhibitR1+dFdy(exhibitHeight)*exhibitR2;
          normal=normalize(max(abs(exhibitDet),.000001)*normal-sign(exhibitDet)*exhibitGradient);`);
      };
      m.customProgramCacheKey=()=>previousKey+'-exhibit-surface-v1';m.needsUpdate=true;
    }
  });
}
