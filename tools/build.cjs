const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),app=path.join(root,'GoiTenVuiNhon'),read=p=>fs.readFileSync(path.join(app,p));
const outputs=new Map(),check=process.argv.includes('--check');
const minify=source=>esbuild.transformSync(source,{minifySyntax:true,minifyWhitespace:true,minifyIdentifiers:false,target:'es2020',charset:'utf8',legalComments:'inline'}).code;
outputs.set('games/dist/runtime.js',minify(['bgm','sfx','i18n','fx'].map(n=>read('games/'+n+'.js').toString()).join('\n;\n')));
outputs.set('games/dist/duck-decor.js',minify('(()=>{'+read('games/packs/vol1/decor.js').toString()+';VOL_PACKS.g1={decor:DECOR};})();'));
for(let vol=1;vol<=5;vol++){
 const body=['decor','bases','scenes'].map(n=>read('games/packs/vol'+vol+'/'+n+'.js').toString()).join('\n;\n');
 outputs.set('games/dist/vol'+vol+'.js',minify('(()=>{\n'+body+'\nVOL_PACKS['+vol+']={backgrounds:BASES,scenes:SCENES,decor:DECOR};\n})();'));
}
for(const name of fs.readdirSync(path.join(app,'games'))){const id=/^(g\d+)-.*\.js$/.exec(name)?.[1];if(id)outputs.set('games/dist/'+id+'.js',minify(read('games/'+name).toString()));}
const text=data=>data.toString().replace(/\r\n/g,'\n');
const digest=entries=>{const h=crypto.createHash('sha256');for(const [name,data] of entries){h.update(name);h.update('\0');h.update(/\.(html|js|css|json|txt|svg|webmanifest)$/.test(name)?text(data):data);h.update('\0');}return h.digest('hex').slice(0,20);};
for(const name of ['sample.js','manifest.webmanifest']) require('node:assert/strict').equal(digest([[name,'a\r\nb']]),digest([[name,'a\nb']]));
const group=name=>/assets\/(g\d+|duck-race)\//.exec(name)?.[1]?.replace('duck-race','g1')||/assets\/bgm\/(g\d+)\.mp3$/.exec(name)?.[1]||'shared';
const assets=fs.readdirSync(path.join(app,'assets'),{recursive:true}).map(n=>n.replaceAll('\\','/')).filter(n=>fs.statSync(path.join(app,'assets',n)).isFile()).sort().map(n=>['assets/'+n,read('assets/'+n)]);
const gameCaches=Object.fromEntries(Array.from({length:30},(_,i)=>{const id='g'+(i+1);return[id,'name-picker-vol1-'+id+'-'+digest(assets.filter(([name])=>group(name)===id))];}));
const media='name-picker-vol1-assets-'+digest(assets.filter(([name])=>group(name)==='shared'));
let sw=read('sw.js').toString();
const normalized=sw.replace(/const (CACHE_NAME|ASSET_CACHE_NAME) = '[^']+';/g,"const $1 = '';" ).replace(/const GAME_CACHES = [^\n]+;/,'const GAME_CACHES = {};');
const shell='name-picker-vol1-shell-'+digest([['index.html',read('index.html')],['manifest.webmanifest',read('manifest.webmanifest')],...outputs,['sw.js',normalized]]);
sw=sw.replace(/const CACHE_NAME = '[^']+';/,"const CACHE_NAME = '"+shell+"';").replace(/const ASSET_CACHE_NAME = '[^']+';/,"const ASSET_CACHE_NAME = '"+media+"';").replace(/const GAME_CACHES = [^\n]+;/,'const GAME_CACHES = '+JSON.stringify(gameCaches)+';');
outputs.set('sw.js',sw);
for(const [file,data] of outputs){const dest=path.join(app,file);if(check){if(!fs.existsSync(dest)||text(fs.readFileSync(dest))!==text(data))throw Error('Run npm run build: '+file);}else{fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);}}
console.log((check?'Verified':'Built')+' '+outputs.size+' files, 30 game caches and one shared cache');
