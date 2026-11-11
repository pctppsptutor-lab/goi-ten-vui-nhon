const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(app,'index.html'),'utf8'),catalog=vm.runInNewContext(fs.readFileSync(path.join(app,'games/i18n.js'),'utf8')+'\nALL_GAMES_30;');
assert.equal(catalog.length,30);assert.equal(new Set(catalog.map(g=>g.id)).size,30);for(let v=1;v<=5;v++)assert.equal(catalog.filter(g=>g.vol===v).length,6);
const modules=Object.fromEntries(catalog.map(g=>[g.id,{id:g.id,assets:[],ready:true,loading:Promise.resolve(),vol:g.vol}]));
const saved={classes:[{id:'class A',name:'A'}],activeId:'class A',called:{'class A':['Emma']},settings:{duration:10,plotTwist:true,game4:'g20'}};
const original=JSON.stringify({classes:saved.classes,called:saved.called});let pushes=0;
const c={URL,URLSearchParams,ALL_GAMES_30:catalog,GAMES:catalog,store:saved,activeGameId:'g1',currentVol:1,race:null,location:{href:'https://example.test/goi-ten-vui-nhon/GoiTenVuiNhon/?keep=1#mark'},history:{pushState(a,b,url){pushes++;c.location.href=url;}},save(){},renderGameTabs(){},GameSound:{stop(){},prepare(){}},hideResult(){},IMGSETS:{},gameAssets:id=>modules[id],prepareGame(){},retainGame(){},AUD:{ctx:null},updateUI(){},VOL_PACKS:Object.fromEntries(['g1',1,2,3,4,5].map(v=>[v,{}]))};
c.curGame=()=>c.activeGameId;vm.createContext(c);
vm.runInContext(html.slice(html.indexOf('function getGameUrl(g) {'),html.indexOf('\nfunction openDrawer()')),c);
vm.runInContext(html.slice(html.indexOf('function activateGame('),html.indexOf('\nfunction addTrail(')),c);
(async()=>{
 for(const id of ['g7','g30','g1']){await c.activateGame(id);assert.equal(c.activeGameId,id);assert.equal(new URL(c.location.href).searchParams.get('game'),id);assert.equal(new URL(c.location.href).searchParams.get('cls'),'class A');assert.equal(new URL(c.location.href).hash,'#mark');}
 assert.equal(pushes,3);await c.activateGame('g1');assert.equal(pushes,3);await c.activateGame('https://evil.test');assert.equal(pushes,3);
 c.race={phase:'run'};await c.activateGame('g7');assert.equal(c.activeGameId,'g1');c.race=null;
 assert.equal(c.store.settings.game2,'g7');assert.equal(c.store.settings.game5,'g30');assert.equal(c.store.settings.game4,'g20');assert.equal(JSON.stringify({classes:saved.classes,called:saved.called}),original);
 const images=Object.fromEntries(['g2','g3','g4','g5'].map(id=>[id,{}]));const releases=[];
 const mem={Promise,IMGSETS:images,gameAssets:id=>modules[id],curGame:()=> 'g5',VOL_PACKS:{1:{backgrounds:{release(id){releases.push(id);}}}},bgCanvas:null};
 vm.createContext(mem);vm.runInContext(html.slice(html.indexOf('let recentGames = []'),html.indexOf('function prepareGame(')),mem);
 for(const id of ['g2','g3','g4','g5'])mem.retainGame(id);await new Promise(setImmediate);assert.deepEqual(Object.keys(images),['g3','g4','g5']);assert.deepEqual(releases,['g2']);assert.equal(modules.g2.ready,false);
 console.log('PASS unified app: 30 IDs / 5 groups, safe routes, URL history, class/history preservation, remembered Vol games and bounded image memory');
})().catch(e=>{console.error(e);process.exitCode=1;});
