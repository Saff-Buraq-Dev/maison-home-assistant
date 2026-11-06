import obj2gltf from 'obj2gltf';import fs from 'fs';import sharp from 'sharp';
import {Document,NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS,EXTMeshoptCompression} from '@gltf-transform/extensions';
import {dedup,prune,join,weld,simplify,flatten,textureCompress,meshopt,mergeDocuments,unpartition,normals} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptSimplifier,MeshoptDecoder} from 'meshoptimizer';
await MeshoptEncoder.ready;await MeshoptSimplifier.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const RATIO={walls:1,floors:1,open:.2,furn:.2},ERR={walls:1e-4,floors:1e-4,open:.015,furn:.015},TEX={walls:256,floors:384,open:128,furn:192};
for(const n of process.argv.slice(2)){
 const dir=`../gl/${n}`;let out=null;
 for(const p of ['floors','walls','open','furn']){
  const glb=await obj2gltf(`${dir}/${p}.obj`,{binary:true,secure:false,materialsCommon:false,unlit:false});
  const d=await io.readBinary(new Uint8Array(glb));
  await d.transform(dedup(),flatten(),weld(),
    ...(RATIO[p]<1?[simplify({simplifier:MeshoptSimplifier,ratio:RATIO[p],error:ERR[p],lockBorder:false})]:[]),
    join({keepNamed:false}),prune(),textureCompress({encoder:sharp,targetFormat:'webp',quality:62,resize:[TEX[p],TEX[p]]}));
  const root=d.getRoot();const g=d.createNode(p);const sc=root.listScenes()[0];for(const c of sc.listChildren()){sc.removeChild(c);g.addChild(c);}sc.addChild(g);
  for(const m of root.listMaterials()){m.setRoughnessFactor(.85).setMetallicFactor(0);}
  if(!out){out=d}else{const map=mergeDocuments(out,d);const s0=out.getRoot().listScenes()[0],s1=out.getRoot().listScenes()[1];for(const c of s1.listChildren()){s1.removeChild(c);s0.addChild(c);}s1.dispose();}
 }
 await out.transform(dedup(),prune(),unpartition(),meshopt({encoder:MeshoptEncoder,level:'medium'}));
 const b=await io.writeBinary(out);fs.writeFileSync(`../gl/maison-${n}.glb`,b);
 let tri=0;for(const m of out.getRoot().listMeshes())for(const q of m.listPrimitives())tri+=(q.getIndices()?q.getIndices().getCount():q.getAttribute('POSITION').getCount())/3;
 console.log(n,(b.length/1024/1024).toFixed(2)+'MB',tri|0,'tris',out.getRoot().listMaterials().length,'mats',out.getRoot().listTextures().length,'tex');
}
