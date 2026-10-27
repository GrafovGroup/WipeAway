import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const stage=path.join(root,'.whc-build');
const output=path.join(root,'whc-dist');
await fs.rm(stage,{recursive:true,force:true});
await fs.mkdir(stage,{recursive:true});
for(const name of ['app','lib','public','vendor','package.json','tsconfig.json','postcss.config.mjs'])await fs.cp(path.join(root,name),path.join(stage,name),{recursive:true});
await fs.symlink(path.join(root,'node_modules'),path.join(stage,'node_modules'),'dir');
await fs.writeFile(path.join(stage,'next.config.mjs'),`export default {output:'export',trailingSlash:true,images:{unoptimized:true},experimental:{cpus:2},typescript:{tsconfigPath:'tsconfig.json'}};\n`);
const source=await fs.readFile(path.join(root,'app/content.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {articles,cities,productDetails,legacyCityRoutes}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const catalog=ts.transpileModule(await fs.readFile(path.join(root,'app/catalog.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {models,industries}=await import('data:text/javascript;base64,'+Buffer.from(catalog).toString('base64'));
const enRoutes=['about','products','order','locations','clients-that-use-our-wipe-stands','blog',...Object.keys(productDetails).map(x=>'products/'+x),...cities.map(x=>'locations/'+x.slug),...Object.keys(articles).map(x=>'blog/'+x),'compare','industries',...models.map(x=>'dispensers/'+x.slug),...industries.map(x=>'industries/'+x.slug)];
const routes=[...enRoutes,'fr',...enRoutes.map(x=>'fr/'+x)];
const page=path.join(stage,'app/[...slug]/page.tsx');
await fs.appendFile(page,`\nexport const dynamicParams=false;\nexport function generateStaticParams(){return ${JSON.stringify(routes.map(x=>({slug:x.split('/')})))};}\n`);
for(const name of ['robots.ts','sitemap.ts'])await fs.appendFile(path.join(stage,'app',name),"\nexport const dynamic='force-static';\n");
// The auth helper belongs to Sites and is not part of this public static export.
await fs.rm(path.join(stage,'app/chatgpt-auth.ts'));
const result=spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:stage,stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
if(result.status!==0)process.exit(result.status||1);
await fs.rm(output,{recursive:true,force:true});
await fs.cp(path.join(stage,'out'),output,{recursive:true});
// The WHC export serves complete HTML documents. Set the document language for French routes.
for(const route of routes.filter(x=>x==='fr'||x.startsWith('fr/'))){
 const file=path.join(output,route,'index.html');
 await fs.writeFile(file,(await fs.readFile(file,'utf8')).replace('<html lang="en">','<html lang="fr-CA">'));
}

const redirects=Object.entries(legacyCityRoutes).map(([from,to])=>[from,'locations/'+to]);
redirects.push(['blog/best-pracitces-for-sanitizing-wipe-dispensers-in-office-buildings','blog/best-practices-for-sanitizing-wipe-dispensers-in-office-buildings']);
const rules=redirects.map(([from,to])=>`RewriteRule ^${from}/?$ /${to}/ [R=301,L,NE]`).join('\n');
await fs.writeFile(path.join(output,'.htaccess'),`# WipeAway static export for Apache / LiteSpeed.\n# Merge with existing host rules; preserve verification/security directives.\nOptions -Indexes -MultiViews\nDirectoryIndex index.html\nErrorDocument 404 /404.html\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteCond %{HTTPS} !=on [OR]\nRewriteCond %{HTTP_HOST} ^www\\.wipeaway\\.ca$ [NC]\nRewriteRule ^ https://wipeaway.ca%{REQUEST_URI} [R=301,L,NE]\n${rules}\n</IfModule>\n<IfModule mod_headers.c>\nHeader always set X-Content-Type-Options "nosniff"\nHeader always set Referrer-Policy "strict-origin-when-cross-origin"\n</IfModule>\n`);
await fs.writeFile(path.join(root,'whc-routes.json'),JSON.stringify({pages:['/',...routes.map(x=>'/'+x+'/')],redirects},null,2)+'\n');
console.log(`WHC export complete: ${output} (${routes.length+1} pages)`);
