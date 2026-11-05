import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
const [inputArg, outputArg, base='/aroomtopray-preview'] = process.argv.slice(2);
if (!inputArg || !outputArg || !/^\/[a-z0-9-]+$/.test(base)) throw new Error('Usage: node prepare-github-preview.mjs INPUT OUTPUT /repository');
const input=resolve(inputArg),output=resolve(outputArg);
if (input===output || output===resolve('/') || !output.startsWith(resolve('.')+'/')) throw new Error('Use a distinct output directory inside the working directory.');
if(input.startsWith(output+'/') || output.startsWith(input+'/')) throw new Error('Input and output must not contain one another.');
try { const existing=await readdir(output); if(existing.length && !existing.includes('preview-version.json')) throw new Error('Refusing to replace a directory that is not a generated preview.'); } catch(error) { if(error.code!=='ENOENT') throw error; }
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(input,output,{recursive:true});
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const roots=(await readdir(input)).filter(name=>!name.startsWith('.'));
roots.push('api');
const rootURL=new RegExp('(["\x27`(]|&quot;|&#34;|&#39;)/('+roots.map(escape).join('|')+')(?=[/\\s"\x27`?#),]|&quot;|&#34;|&#39;|$)','g');
const note={en:'Review preview: this form is disabled.',fr:'Aperçu : ce formulaire est désactivé.',ar:'معاينة: هذا النموذج معطّل.',es:'Vista previa: este formulario está desactivado.'};
let pages=0;
async function walk(dir) {
 for(const item of await readdir(dir,{withFileTypes:true})) {
  const file=join(dir,item.name);
  if(item.isDirectory()){await walk(file);continue;}
  if(!['.html','.css','.js','.json','.webmanifest','.svg'].includes(extname(file)))continue;
  // The saved catalog uses canonical, unmounted IDs, matching saved-place storage.
  if(file===join(output,'saved','places.json'))continue;
  let text=await readFile(file,'utf8');const protectedValues=[];
  const protect=value=>{const key=`__PREVIEW_CANONICAL_${protectedValues.length}__`;protectedValues.push(value);return key;};
  if(file.endsWith('.html')) {
   text=text.replace(/<script\b[^>]*\bdata-place-notes\b[^>]*>[\s\S]*?<\/script>/g,protect);
   text=text.replace(/data-save-place="[^"]*"/g,protect);
  }
  text=text.replace(rootURL,(_,quote,root)=>`${quote}${base}/${root}`);
  if(file.endsWith('.html'))text=text.replace(/srcset="([^"]*)"/g,(_,value)=>'srcset="'+value.split(',').map(part=>part.trim().replace(/^\/(?!\/|aroomtopray-preview\/)/,base+'/')).join(', ')+'"');
  // Root-only hrefs include the brand and English language option, never slash regexes.
  text=text.replace(/\b(href|action|value)="\/(?=["?#])/g,`$1="${base}/`);
  text=text.replace(/("start_url"\s*:\s*)"\/"/g,`$1"${base}/"`);
  text=text.replace(/aroomtopray\.(?=(?:theme|focus|saved-places|reading)\.v[0-9])/g,'aroomtopray-preview.');
  text=text.replace(/navigator\.sendBeacon(?:\?\.)?\(/g,'(()=>false)(');
  if(file.endsWith('.html')) {
   const language=text.match(/<html[^>]*lang="([^"]+)"/)?.[1]||'en';
   text=text.replace(/<form\b[^>]*action="[^"]*\/api\/[^\"]*"[^>]*>[\s\S]*?<\/form>/g,form=>form.replace(/<(input|button|textarea|select)\b/g,'<$1 disabled').replace(/(<form\b[^>]*>)/,`$1<p class="note" data-preview-disabled>${note[language]||note.en}</p>`));
   // Keep source links and original attribution intact; replace only preview metadata URLs.
   text=text.replace(/<(?:meta|link)\b[^>]*(?:property="og:|rel="canonical"|hreflang=)[^>]*>/g,tag=>tag.replaceAll('https://aroomtopray.com',`https://a7mad7amdoun.github.io${base}`));
   for(let i=0;i<protectedValues.length;i++)text=text.replace(`__PREVIEW_CANONICAL_${i}__`,protectedValues[i]);
   if(!text.includes('name="robots" content="noindex"'))throw new Error(`Missing preview noindex: ${file}`);
   pages++;
  }
  await writeFile(file,text.trimEnd()+'\n');
 }
}
await walk(output);
for(const name of await readdir(output)) {
 if(name==='CNAME'||name==='_headers'||name==='_redirects'||name.startsWith('sitemap')||/^[a-f0-9]{32}\.txt$/.test(name))await rm(join(output,name),{force:true});
}
await writeFile(join(output,'.nojekyll'),'');
await writeFile(join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
await writeFile(join(output,'preview-version.json'),JSON.stringify({preview:true,pages,base,generated:new Date().toISOString(),backend:'disabled'},null,2));
console.log(`Prepared ${pages} preview pages at ${base}; server submissions disabled, attribution retained.`);
