import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const sources={
  "airport-light": "/Users/ilyas/.codex/generated_images/01a18959-230a-7341-9b9a-ad270ecd1b56/exec-4c032d05-6449-41e7-b259-eb872adedbe9.png",
  "campus-light": "/Users/ilyas/.codex/generated_images/01a18959-230a-7341-9b9a-ad270ecd1b56/exec-39d0da43-9d4b-4fbb-aae9-c3278e3c6200.png",
  "hospital-light": "/Users/ilyas/.codex/generated_images/01a18959-230a-7341-9b9a-ad270ecd1b56/exec-a6290178-7048-4b2a-b0aa-1d340fdd7567.png",
  "airport-dark": "/Users/ilyas/.codex/generated_images/01a18959-230a-7341-9b9a-ad270ecd1b56/exec-d133fa95-e41b-462d-b7e3-f043248b97a4.png",
  "campus-dark": "/Users/ilyas/.codex/generated_images/01a18959-230a-7341-9b9a-ad270ecd1b56/exec-33d968a3-9764-4888-8e5d-4b291d77a10b.png",
  "hospital-dark": "/Users/ilyas/.codex/generated_images/01a18959-230a-7341-9b9a-ad270ecd1b56/exec-5a227b3c-e584-4f79-9b36-532a90e8676b.png"
};
await mkdir('public/art/immersive/refined',{recursive:true});
for(const [name,path] of Object.entries(sources)){
 for(const width of [480,1024]){
 const info=await sharp(path).resize({width,withoutEnlargement:true}).webp({quality:84,effort:6}).toFile(`public/art/immersive/refined/${name}-${width}.webp`);
 console.log(name,width,info.size);
 }
}
