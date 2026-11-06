import sharp from 'sharp';
import { mkdir,readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PLACE_IDENTITIES } from '../src/data/place-identities.js';
const out=new URL('../.local/identity-research/',import.meta.url);await mkdir(out,{recursive:true});
for(const identity of PLACE_IDENTITIES){
 const bytes=await readFile(new URL(`../public${identity.src}`,import.meta.url));
 const background=identity.variant==='inverse'?'#002a5c':'#fff';
 await sharp(bytes,{density:144}).flatten({background}).resize({width:600,height:210,fit:'contain',background}).png().toFile(fileURLToPath(new URL(`${identity.id}-review.png`,out)));
}
console.log(`Prepared ${PLACE_IDENTITIES.length} original-mark visual checks; public assets unchanged.`);
