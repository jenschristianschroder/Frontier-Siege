import { createSprites } from './sprites.mjs';
import { playSound, setMuted, unlockAudio } from './audio.mjs';
import { storeMatch, readMatch, removeMatch } from './save.mjs';
import { route, footprintDistance, formationSlots } from './navigation.mjs';
const T=48,MW=35,MH=26,canvas=document.getElementById('game');
let ctx=canvas.getContext('2d',{alpha:false}),mini=document.getElementById('mini'),mc=mini.getContext('2d'),area=document.getElementById('gameArea');
const el=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*47.2)*43758.5453;return n-Math.floor(n)};
const TYPES={worker:{name:'Worker',icon:'🧑‍🌾',hp:58,speed:2.7,damage:4,range:.8,cooldown:1.2,food:1,costG:60,costW:0,train:6},guard:{name:'Swordsman',icon:'⚔️',hp:115,speed:2.5,damage:17,range:1.0,cooldown:1.05,food:2,costG:75,costW:20,train:8},archer:{name:'Ranger',icon:'🏹',hp:67,speed:2.75,damage:11,range:4.1,cooldown:1.3,food:2,costG:95,costW:45,train:10},raider:{name:'Crimson Raider',icon:'🪓',hp:84,speed:2.25,damage:11,range:.9,cooldown:1.25,food:1,costG:55,costW:10,train:9},shooter:{name:'Crimson Bowman',icon:'🏹',hp:66,speed:2.4,damage:9,range:3.6,cooldown:1.45,food:2,costG:70,costW:30,train:11}};
const BT={keep:{name:'Keep',icon:'🏰',w:3,h:3,hp:730,food:12,costG:300,costW:250,build:20},barracks:{name:'Barracks',icon:'🏘️',w:3,h:2,hp:375,costG:120,costW:160,build:8},farm:{name:'Farm',icon:'🌾',w:2,h:2,hp:180,costG:35,costW:85,build:5,food:6},tower:{name:'Watchtower',icon:'🗼',w:1,h:1,hp:235,costG:105,costW:120,build:7,damage:15,range:5.0,cooldown:1.2}};
let units=[],buildings=[],nodes=[],objects=[],effects=[],idCounter=1,world=[],explored=[],visible=[],gold=350,wood=260,selected=[],placement=null,gameState='intro',gameTime=0,raidTime=65,wave=0,uid=0,toastUntil=0,toastText='',lastUI=0,lastFog=0,lastAI=0,cam={x:2,y:7},scale=1.35,viewW=0,viewH=0,devicePixel=1,lastFrame=0,pointer=null,miniPointer=false,story={barracks:false,army:false},lastDamageSound=0;
let redStock = { gold: 220, wood: 180 };
let blockedGrid;
function id(){return idCounter++}function building(team,type,x,y,under=false){const t=BT[type],b={id:id(),kind:'building',team,type,x,y,w:t.w,h:t.h,hp:t.hp,maxHp:t.hp,under,progress:under?0:1,queue:[],trainLeft:0,attackTimer:0};buildings.push(b);blockedGrid=null;return b}
function unit(team,type,x,y){const t=TYPES[type],u={id:id(),kind:'unit',team,type,x,y,hp:t.hp,maxHp:t.hp,path:[],order:null,attackTimer:rand(x,y)*.4,workTimer:0,carry:0,carryType:null,retask:0,wobble:rand(x,y,9)*7};units.push(u);return u}
function node(type,x,y,amount){const n={id:id(),kind:'resource',type,x,y,amount};nodes.push(n);return n}
function worldInit(){blockedGrid=null;world=[];for(let y=0;y<MH;y++){const row=[];for(let x=0;x<MW;x++){let water=(x>=14&&x<=17&&y>=2&&y<=4&&((x-15.5)**2+(y-3)**2)<4.5)||(x>=17&&x<=21&&y>=22&&y<=24&&((x-19)**2+(y-23)**2)<6)||(x===1&&y>=20&&y<=22);row.push({water,ridge:(x>=15&&x<=19&&y>=10&&y<=14&&Math.abs(x-17)+Math.abs(y-12)<3&&![12,13].includes(y) || x>=27&&x<=31&&y>=2&&y<=3),rough:rand(x,y,3)})}world.push(row)}
terrainCache = null;
const treeCoords=[[3,6],[4,6],[5,6],[9,6],[10,6],[2,8],[3,8],[2,15],[3,16],[4,17],[7,18],[8,18],[10,17],[11,16],[12,15],[14,9],[14,10],[15,10],[17,7],[18,8],[20,8],[21,8],[20,12],[21,12],[18,15],[19,15],[22,18],[23,19],[24,20],[26,4],[27,4],[28,4],[29,5],[31,7],[32,8],[30,20],[31,21],[32,21],[27,23],[26,23],[6,21],[5,22],[4,23],[11,21],[12,21],[15,19],[15,20],[2,4],[3,3],[8,3],[9,3],[23,5],[24,5],[17,12],[17,13]];
for(const [x,y] of treeCoords)node('tree',x,y,rand(x,y)>0.5?200:140);
for(const [x,y] of [[11,10],[12,10],[10,12],[19,17],[20,17],[23,12],[24,12],[25,6],[26,6],[8,22]])node('gold',x,y,rand(x,y)>0.4?900:650);
}
function reset(){idCounter=1;units=[];buildings=[];nodes=[];effects=[];gold=350;wood=260;selected=[];placement=null;gameTime=0;raidTime=95;lastSave=0;attackMove=false;setBoxMode(false);redStock={gold:220,wood:180};wave=0;lastUI=0;lastFog=0;lastAI=0;story={barracks:false,army:false};worldInit();building('blue','keep',5,10);building('red','keep',28,10);unit('red','worker',29.5,13.5);unit('red','worker',27.5,11.5);unit('red','worker',28.5,9.5);building('red','tower',24,9);unit('blue','worker',4.5,11.5);unit('blue','worker',8.5,12.5);unit('blue','worker',6.5,14.5);unit('blue','guard',9.5,14.5);unit('blue','guard',4.5,9.5);unit('red','raider',26.5,13.5);unit('red','raider',31.5,14.5);unit('red','shooter',25.5,14.5);unit('red','raider',22.5,10.5);explored=Array.from({length:MH},()=>Array(MW).fill(false));visible=Array.from({length:MH},()=>Array(MW).fill(false));computeFog();selectOne(units.find(u=>u.team==='blue'&&u.type==='worker'));centerOn(6.8,11.7);gameState='playing';updateUI();toast('Your settlers await orders. Gather wood and gold!')}
function popUsed(team='blue'){return units.filter(u=>u.team===team).reduce((a,u)=>a+TYPES[u.type].food,0)+buildings.filter(b=>b.team===team).reduce((a,b)=>a+b.queue.reduce((v,t)=>v+TYPES[t].food,0),0)}
function popMax(team='blue'){return buildings.filter(b=>b.team===team&&!b.under).reduce((a,b)=>a+(BT[b.type].food||0),0)}
function entity(idv){return units.find(x=>x.id===idv)||buildings.find(x=>x.id===idv)||nodes.find(x=>x.id===idv)}
function selEntities(){selected=selected.filter(z=>{const e=entity(z);return e&&e.team==='blue'});return selected.map(entity).filter(Boolean)}
function selectOne(e){selected=e&&e.team==='blue'?[e.id]:[];placement=null;attackMove=false;updateUI()}
function selectGroup(which){placement=null;attackMove=false;let a=which==='workers'?units.filter(u=>u.team==='blue'&&u.type==='worker'):units.filter(u=>u.team==='blue'&&u.type!=='worker');if(!a.length){toast(which==='workers'?'Train workers at your Keep':'Train soldiers at your Barracks');return}selected=a.map(u=>u.id);centerOn(a[0].x,a[0].y);updateUI();toast(`${a.length} ${which==='workers'?'workers':'fighters'} selected`)}
function centerOn(x,y){cam.x=x-viewW/(2*T*scale);cam.y=y-viewH/(2*T*scale);clampCam()}function clampCam(){cam.x=clamp(cam.x,0,Math.max(0,MW-viewW/(T*scale)));cam.y=clamp(cam.y,0,Math.max(0,MH-viewH/(T*scale)))}function zoom(by){let cx=cam.x+viewW/(2*T*scale),cy=cam.y+viewH/(2*T*scale);scale=clamp(Math.round((scale+by)*100)/100,.62,1.55);centerOn(cx,cy)}
function navigationGrid() {
  if (blockedGrid) return blockedGrid;
  blockedGrid = new Uint8Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    blockedGrid[y * MW + x] = Number(!x || !y || x === MW - 1 || y === MH - 1 || world[y][x].water || world[y][x].ridge);
  }
  for (const n of nodes) if (n.amount > 0) blockedGrid[n.y * MW + n.x] = 1;
  for (const b of buildings) for (let y = b.y; y < b.y + b.h; y++) {
    blockedGrid.fill(1, y * MW + b.x, y * MW + b.x + b.w);
  }
  return blockedGrid;
}
function isBlocked(x, y) {
  return x < 0 || y < 0 || x >= MW || y >= MH || Boolean(navigationGrid()[y * MW + x]);
}
function pathTo(u, x, y) {
  const tx = clamp(Math.floor(x), 1, MW - 2) + .5;
  const ty = clamp(Math.floor(y), 1, MH - 2) + .5;
  const distance = (px, py) => Math.hypot(px - tx, py - ty);
  u.path = route(navigationGrid(), MW, MH, u.x, u.y, (px, py) => px === tx && py === ty, distance);
}
function approach(u, target, range) {
  const distance = (x, y) => footprintDistance(x, y, target);
  u.path = route(navigationGrid(), MW, MH, u.x, u.y,
    (x, y) => distance(x, y) <= range,
    (x, y) => Math.max(0, distance(x, y) - range));
}
function rangeTo(u, target) { return footprintDistance(u.x, u.y, target); }
function targetPoint(t){return t.kind==='building'?{x:t.x+t.w/2,y:t.y+t.h/2}:{x:t.x,y:t.y}}
function orderMove(u,x,y){u.order={kind:'move',x,y};pathTo(u,x,y,0)}
function orderAttack(u, target, raid = false) {
  u.order = { kind: 'attack', target: target.id, raid };
  u.path = [];
  u.retask = 0;
}
function orderHarvest(u, n) {
  if (u.type !== 'worker') return;
  u.order = { kind: 'harvest', target: n.id, stage: u.carry ? 'return' : 'approach', resource: n.type };
  u.path = [];
  u.retask = 0;
}
function orderBuild(u, b) {
  if (u.type !== 'worker') return;
  u.order = { kind: 'build', target: b.id };
  u.path = [];
  u.retask = 0;
}
function findKeep(team='blue'){return buildings.find(b=>b.team===team&&b.type==='keep'&&!b.under)}
function canAfford(t){return gold>=(t.costG||0)&&wood>=(t.costW||0)}function spend(t){if(!canAfford(t)){toast('Not enough resources — gather more gold or timber!');return false}gold-=t.costG||0;wood-=t.costW||0;return true}
function canPlace(type,x,y,team='blue'){const bt=BT[type];if(x<1||y<1||x+bt.w>MW-1||y+bt.h>MH-1)return false;for(let yy=y;yy<y+bt.h;yy++)for(let xx=x;xx<x+bt.w;xx++)if(isBlocked(xx,yy)||(team==='blue'&&!tileVisible(xx,yy))||units.some(u=>Math.floor(u.x)===xx&&Math.floor(u.y)===yy))return false;const near=buildings.some(b=>b.team===team&&!b.under&&Math.hypot(b.x+b.w/2-(x+bt.w/2),b.y+b.h/2-(y+bt.h/2))<10);return near}
function buildPlace(x,y){if(!placement)return;const type=placement.type,t=BT[type];if(!canPlace(type,x,y)){toast('Build on clear land within reach of your settlement');return}if(!spend(t))return;const b=building('blue',type,x,y,true),builders=selEntities().filter(u=>u.kind==='unit'&&u.type==='worker');if(builders.length){builders.forEach(u=>orderBuild(u,b))}else {const nearest=units.find(u=>u.team==='blue'&&u.type==='worker');if(nearest)orderBuild(nearest,b)}placement=null;selected=[b.id];updateUI();toast(`${t.name} foundation placed. Workers are building it!`)}
function train(b, type) {
  const allowed = b.type === 'keep' ? ['worker']
    : b.type === 'barracks' ? (b.team === 'blue' ? ['guard', 'archer'] : ['raider', 'shooter']) : [];
  if (b.under || !allowed.includes(type) || b.queue.length >= 5) return false;
  const t = TYPES[type];
  if (popUsed(b.team) + t.food > popMax(b.team)) {
    if (b.team === 'blue') toast('Build a Farm to raise your supply limit.');
    return false;
  }
  if (b.team === 'blue') {
    if (!spend(t)) return false;
  } else {
    if (!spendRed(t)) return false;
  }
  b.queue.push(type);
  if (b.queue.length === 1) b.trainLeft = t.train;
  if (b.team === 'blue') {
    updateUI();
    toast(`${t.name} added to training queue`);
  }
  return true;
}
function spendRed(t) {
  if (redStock.gold < (t.costG || 0) || redStock.wood < (t.costW || 0)) return false;
  redStock.gold -= t.costG || 0;
  redStock.wood -= t.costW || 0;
  return true;
}
function findSpawn(b){let cx=b.x+b.w/2,cy=b.y+b.h/2;for(let r=1;r<7;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){if(Math.abs(dx)!==r&&Math.abs(dy)!==r)continue;let x=Math.floor(cx+dx),y=Math.floor(cy+dy);if(!isBlocked(x,y)&&!units.some(u=>Math.hypot(u.x-x-.5,u.y-y-.5)<.65))return{x:x+.5,y:y+.5}}return null}
function cellHit(wx,wy){for(let i=units.length-1;i>=0;i--){let u=units[i];if(u.team==='red'&&!tileVisible(Math.floor(u.x),Math.floor(u.y)))continue;if(Math.hypot(wx-u.x,wy-u.y)<.55)return u}for(let i=buildings.length-1;i>=0;i--){let b=buildings[i];if(b.team==='red'&&!tileVisible(Math.floor(b.x+b.w/2),Math.floor(b.y+b.h/2)))continue;if(wx>=b.x&&wx<b.x+b.w&&wy>=b.y&&wy<b.y+b.h)return b}return tileVisible(Math.floor(wx),Math.floor(wy)) ? nodes.find(n=>n.amount>0&&Math.floor(wx)===n.x&&Math.floor(wy)===n.y) : null}
function tapWorld(px,py){if(gameState!=='playing')return;const wx=cam.x+px/(T*scale),wy=cam.y+py/(T*scale);if(placement){buildPlace(Math.floor(wx),Math.floor(wy));return}unlockAudio();playSound('order');const hit=cellHit(wx,wy),selectedEnt=selEntities(),fighters=selectedEnt.filter(e=>e.kind==='unit'),workers=fighters.filter(u=>u.type==='worker');if(hit&&hit.team==='blue'){if(hit.kind==='building'&&hit.under&&workers.length){workers.forEach(u=>orderBuild(u,hit));toast('Workers assigned to construction');return}selectOne(hit);return}
if(!selectedEnt.length){if(hit&&hit.team==='red')toast('Choose your army to attack enemies');else toast('Tap one of your units to select it');return}
if(hit&&hit.team==='red'){if(!fighters.length){toast('Select a fighting unit to attack');return}fighters.forEach(u=>orderAttack(u,hit));toast(`Attacking ${hit.type==='keep'?'Crimson Keep':BT[hit.type]?.name||TYPES[hit.type]?.name||'enemy'}!`);return}
if(hit&&hit.kind==='resource'){if(!workers.length){toast('Select workers to gather resources');return}workers.forEach(u=>orderHarvest(u,hit));toast(hit.type==='tree'?'Harvesting timber 🌲':'Mining gold 🪙');return}
if (fighters.length) {
  moveFormation(fighters, wx, wy, attackMove);
  attackMove = false;
  updateUI();
}
}
let attackMove = false;
function moveFormation(group, x, y, aggressive) {
  const cx = group.reduce((sum, u) => sum + u.x, 0) / group.length;
  const cy = group.reduce((sum, u) => sum + u.y, 0) / group.length;
  const fighters = [...group].sort((a, b) => TYPES[a.type].range - TYPES[b.type].range);
  const slots = formationSlots(clamp(x, 1.5, MW - 2.5), clamp(y, 1.5, MH - 2.5),
    group.length, MW, MH, isBlocked, Math.atan2(y - cy, x - cx));
  fighters.forEach((u, i) => {
    const slot = slots[i] || { x, y };
    orderMove(u, slot.x, slot.y);
    u.order.aggressive = aggressive && u.type !== 'worker';
  });
}
function handleAction(action){if(gameState!=='playing')return;const sel=selEntities(),one=sel.length===1?sel[0]:null;if(action.startsWith('build:')){if(!sel.some(s=>s.kind==='unit'&&s.type==='worker'))return;placement={type:action.slice(6),x:Math.floor(cam.x+viewW/(2*T*scale)),y:Math.floor(cam.y+viewH/(2*T*scale))};updateUI();toast('Tap an empty nearby space to place the building');return}if(action.startsWith('train:')&&one?.kind==='building'){train(one,action.slice(6));return}if(action==='attackMove'){attackMove=!attackMove;updateUI();toast(attackMove?'Tap terrain to attack-move':'Attack-move cancelled');return}if(action==='stop'){sel.filter(s=>s.kind==='unit').forEach(u=>{u.path=[];u.order=null});toast('Units standing by')}if(action==='cancel'){placement=null;updateUI();toast('Placement cancelled')}if(action==='focus'){if(one)centerOn(...(one.kind==='building'?[one.x+one.w/2,one.y+one.h/2]:[one.x,one.y]))}}
function toast(msg){toastText=msg;toastUntil=performance.now()+2700;el('toast').textContent=msg;el('toast').classList.add('show')}
function actionPicture(action) {
  const [verb, type] = action.key.split(':');
  if (verb === 'train' || verb === 'build') return `<img alt="" src="./art/${type}.webp">`;
  return action.icon;
}
function resourceCost(cost) {
  return cost.replaceAll('🪙', '<img src="./art/gold.webp" alt="Gold ">').replaceAll('🪵', '<img src="./art/wood.webp" alt="Wood ">');
}
function updateUI(){const entities=selEntities();el('gold').textContent=Math.floor(gold);el('wood').textContent=Math.floor(wood);el('pop').textContent=`${popUsed()}/${popMax()}`;
let name='🌿 Your frontier awaits',status='Select a worker to harvest wood or ore.',health=100,one=entities.length===1?entities[0]:null;
if(entities.length>1){name=`${entities.length} units selected`;status=`${entities.filter(u=>u.type==='worker').length} workers · ${entities.filter(u=>u.type!=='worker').length} fighters`;health=entities.reduce((sum,u)=>sum+u.hp/u.maxHp,0)/entities.length*100}
else if(one){const desc=one.kind==='unit'?TYPES[one.type]:BT[one.type];name=`${one.team==='red'?'Crimson ':''}${desc.name}`;health=one.hp/one.maxHp*100;if(one.kind==='unit'){status=`HP ${Math.ceil(one.hp)}/${one.maxHp}`+(one.carry?` · Carrying ${one.carry} ${one.carryType}`:'')+(one.order?.kind?` · ${one.order.kind}`:' · Standing by')}else{status=one.under?`Building · ${Math.round(one.progress*100)}% complete`:`HP ${Math.ceil(one.hp)}/${one.maxHp}`+(one.queue.length?` · Training ${one.queue.length} (${Math.ceil(one.trainLeft)}s)`:'')}}
const subject = one || entities[0];
const portrait = subject?.type === 'worker' ? 'worker-portrait' : subject?.type === 'guard' ? 'guard-portrait' : subject?.type || 'keep';
const portraitUrl = './art/' + portrait + '.webp';
if (el('portrait').dataset.art !== portrait) {
  el('portrait').src = portraitUrl;
  el('portrait').dataset.art = portrait;
}
el('healthValue').textContent = one ? Math.ceil(one.hp)+'/'+one.maxHp : entities.length ? Math.round(health)+'%' : '';
el('health').style.visibility = entities.length ? 'visible' : 'hidden';
if (one) status = status.replace(/^HP [\d/]+ ·?\s*/, '') || 'Standing by';
el('selectedName').textContent=name;el('selectedStatus').textContent=status;el('healthfill').style.width=clamp(health,0,100)+'%';el('healthfill').style.background=health<30?'#e07359':health<60?'#e5c16a':'#98d481';
const acts=[];function add(key,label,icon,cost='',disabled=false,extra=''){acts.push({key,label,icon,cost,disabled,extra})}if(placement){add('cancel','Cancel','✖️','',false,'special active')}
else if(!one&&entities.length===0){add('hint','Select units','👆','Tap on map',true);add('hint','Scout east','🧭','Find enemy camp',true)}
else if((one?.kind==='unit'&&one.type==='worker')||(entities.length>1&&entities.some(e=>e.type==='worker'))){for(const type of ['barracks','farm','tower','keep']){let b=BT[type];add('build:'+type,b.name,b.icon,`🪙${b.costG} 🪵${b.costW}`,!canAfford(b))}add('stop','Stop','✋','Hold position')}
else if(one?.kind==='building'){if(one.type==='keep')add('train:worker','Worker','🧑‍🌾',`🪙${TYPES.worker.costG}`,one.under||popUsed()+1>popMax()||!canAfford(TYPES.worker));if(one.type==='barracks'){for(const type of ['guard','archer']){let t=TYPES[type];add('train:'+type,t.name,t.icon,`🪙${t.costG} 🪵${t.costW}`,one.under||popUsed()+t.food>popMax()||!canAfford(t))}}if(one.type==='farm')add('hint','Housing','🌾','+6 supply',true);if(one.type==='tower')add('hint','Defense','🎯','Auto attacks',true);if(one.under)add('hint','Building','🪚','Assign workers',true);add('focus','Center','🎯','Locate')}
else{add('stop','Stop','✋','Hold position');add('attackMove','Attack move','⚔️','Tap destination',false,attackMove?'active':'')}
const target=el('actions');const markup=acts.map(a=>`<button class="action ${a.extra||''}" data-action="${a.key}" ${a.disabled?'disabled':''}><span class="picture">${actionPicture(a)}</span><span class="title">${a.label}</span><span class="cost">${resourceCost(a.cost)}</span></button>`).join('');if(target.dataset.markup!==markup){target.innerHTML=markup;target.dataset.markup=markup}el('objective').textContent='⚔ Destroy the Crimson Keep';el('helpLine').textContent=placement?'Building mode: tap open grass near your base • Cancel to exit':entities.some(e=>e.type==='worker')?'Tap a 🌲 tree or 🪙 ore to gather • Drag map to pan • Tap to build':'Tap map to move • Tap enemy to attack • Use minimap to scout east';}
function computeFog(){visible=Array.from({length:MH},()=>Array(MW).fill(false));const observers=[...units.filter(u=>u.team==='blue').map(u=>({x:u.x,y:u.y,r:u.type==='archer'?5.5:5})),...buildings.filter(b=>b.team==='blue').map(b=>({x:b.x+b.w/2,y:b.y+b.h/2,r:b.under?2.3:6.5}))];for(const o of observers){for(let y=Math.max(0,Math.floor(o.y-o.r));y<Math.min(MH,Math.ceil(o.y+o.r));y++)for(let x=Math.max(0,Math.floor(o.x-o.r));x<Math.min(MW,Math.ceil(o.x+o.r));x++){if(Math.hypot(x+.5-o.x,y+.5-o.y)<=o.r){visible[y][x]=true;explored[y][x]=true}}}}
function tileVisible(x,y){return x>=0&&y>=0&&x<MW&&y<MH&&visible[y][x]}
function strike(attacker, target, damage, ranged) {
  const from = targetPoint(attacker);
  const to = targetPoint(target);
  const color = attacker.team === 'blue' ? '#ffdf91' : '#ff9274';
  if (tileVisible(Math.floor(from.x), Math.floor(from.y))) playSound(ranged ? 'arrow' : 'hit');
  attacker.vertical = Math.abs(to.y - from.y) > Math.abs(to.x - from.x) ? Math.sign(to.y - from.y) : 0;
  attacker.swing = gameTime + .28;
  attacker.facing = to.x < from.x ? -1 : 1;
  if (ranged) {
    const travel = Math.max(.13, Math.hypot(to.x - from.x, to.y - from.y) / 14);
    effects.push({ kind: 'arrow', ...from, tx: to.x, ty: to.y, color,
      life: travel, maxLife: travel, target: target.id, damage });
  } else {
    impact(to, color);
    hurt(target, damage);
  }
}
function impact(point, color) {
  effects.push({ kind: 'impact', ...point, color, life: .24, maxLife: .24 });
}
function hurt(target, damage) {
  if (target.hp <= 0) return;
  target.hp = Math.max(0, target.hp - damage);
  if (target.hp) return;
  const p = targetPoint(target);
  const duration = target.kind === 'unit' ? .55 : 2.1;
  effects.push({ kind: target.kind === 'unit' ? 'fall' : 'ruin', ...p,
    unit: target.kind === 'unit' ? { ...target, path: [] } : null,
    life: duration, maxLife: duration });
  if (target.kind === 'unit') {
    units = units.filter(u => u !== target);
  } else {
    buildings = buildings.filter(b => b !== target);
    blockedGrid = null;
    if (target.type === 'keep' && !findKeep(target.team)) finish(target.team === 'red');
  }
  if (selected.includes(target.id)) updateUI();
}
function tickEffects(dt) {
  const active = effects;
  effects = [];
  for (const fx of active) {
    fx.life -= dt;
    if (fx.life > 0) {
      effects.push(fx);
    } else if (fx.kind === 'arrow') {
      const target = entity(fx.target);
      if (target) {
        impact(targetPoint(target), fx.color);
        hurt(target, fx.damage);
        if (gameState !== 'playing') return;
      }
    }
  }
}
function moveUnit(u, dt) {
  if (!u.path.length) return;
  const p = u.path[0];
  if (isBlocked(Math.floor(p.x), Math.floor(p.y))) {
    u.path = [];
    u.retask = 0;
    return;
  }
  const dx = p.x - u.x;
  const dy = p.y - u.y;
  const d = Math.hypot(dx, dy);
  const step = TYPES[u.type].speed * dt;
  u.vertical = Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0;
  if (Math.abs(dx) > .05) u.facing = Math.sign(dx);
  if (d <= step + .015) {
    u.x = p.x;
    u.y = p.y;
    u.path.shift();
  } else {
    u.x += dx / d * step;
    u.y += dy / d * step;
  }
}
function walkTo(u, target, range, dt) {
  if (u.retask <= 0) {
    approach(u, target, range);
    u.retask = .65 + u.wobble * .025;
  }
  moveUnit(u, dt);
}
function closest(origin, collection, maxDistance = Infinity) {
  let nearest;
  for (const item of collection) {
    const distance = rangeTo(origin, item);
    if (distance >= maxDistance) continue;
    maxDistance = distance;
    nearest = item;
  }
  return nearest;
}
function threat(u, radius, includeBuildings = true) {
  const enemies = includeBuildings ? [...units, ...buildings] : units;
  return closest(u, enemies.filter(e => {
    const p = targetPoint(e);
    return e.team !== u.team && (u.team === 'red' || tileVisible(Math.floor(p.x), Math.floor(p.y)));
  }), radius);
}
function unitTick(u, dt) {
  const type = TYPES[u.type];
  u.attackTimer -= dt;
  u.retask -= dt;
  const order = u.order;
  if (!order || order.kind === 'move') {
    if (u.type !== 'worker' && (!order || order.aggressive) && u.retask <= 0) {
      const enemy = threat(u, Math.max(type.range + .3, 3.5), Boolean(order));
      u.retask = .33;
      if (enemy) {
        orderAttack(u, enemy);
        u.order.follow = order;
        return;
      }
    }
    if (order) {
      moveUnit(u, dt);
      if (!u.path.length) u.order = null;
    }
    return;
  }
  if (order.kind === 'attack') {
    let target = entity(order.target);
    if (order.raid && u.retask <= 0) {
      target = threat(u, 5, false) || target || findKeep('blue');
      if (target) order.target = target.id;
    }
    if (!target) {
      if (order.follow) moveFormation([u], order.follow.x, order.follow.y, true);
      else { u.order = null; u.path = []; }
      return;
    }
    const range = type.range;
    if (rangeTo(u, target) <= range + .08) {
      u.path = [];
      u.retask = 0;
      if (u.attackTimer <= 0) {
        u.attackTimer = type.cooldown;
        strike(u, target, type.damage, range > 2);
      }
    } else {
      walkTo(u, target, range, dt);
    }
    return;
  }
  if (order.kind === 'build') {
    const b = entity(order.target);
    if (!b?.under) { u.order = null; u.path = []; return; }
    if (rangeTo(u, b) > 1.15) { walkTo(u, b, 1.15, dt); return; }
    u.path = [];
    b.progress = Math.min(1, b.progress + dt / BT[b.type].build);
    b.under = b.progress < 1;
    if (!b.under && b.team === 'blue') {
      story.barracks ||= b.type === 'barracks';
      playSound('complete');
      toast(`${BT[b.type].name} completed!`);
      updateUI();
    }
    return;
  }
  const hq = closest(u, buildings.filter(b => b.type === 'keep' && b.team === u.team && !b.under));
  let n = entity(order.target);
  if (!hq) { u.order = null; u.path = []; return; }
  if (order.stage === 'return' || (!n && u.carry)) {
    if (rangeTo(u, hq) > 1.15) { walkTo(u, hq, 1.15, dt); return; }
    if (u.team === 'red') redStock[u.carryType === 'tree' ? 'wood' : 'gold'] += u.carry;
    else if (u.carryType === 'tree') wood += u.carry;
    else gold += u.carry;
    u.carry = 0;
    u.carryType = null;
    order.stage = 'approach';
    u.retask = 0;
  }
  if (!n) {
    n = closest(u, nodes.filter(node => node.type === order.resource &&
      (u.team === 'red' || explored[node.y][node.x])).map(node => ({ ...node, x: node.x + .5, y: node.y + .5 })));
    if (!n) { u.order = null; u.path = []; return; }
    orderHarvest(u, entity(n.id));
    return;
  }
  const point = { x: n.x + .5, y: n.y + .5 };
  if (rangeTo(u, point) > 1.48) {
    walkTo(u, point, 1.48, dt);
    return;
  }
  u.path = [];
  if (order.stage !== 'mining') {
    order.stage = 'mining';
    u.workTimer = .45;
  }
  u.facing = point.x < u.x ? -1 : 1;
  u.workTimer -= dt;
  if (u.workTimer > 0) return;
  const amount = Math.min(20, 40 - u.carry, n.amount);
  n.amount -= amount;
  u.carry += amount;
  u.carryType = n.type;
  u.workTimer = 1.3;
  if (!n.amount) {
    nodes = nodes.filter(r => r !== n);
    blockedGrid = null;
  }
  if (u.carry >= 40 || !n.amount) {
    order.stage = 'return';
    u.retask = 0;
  }
}
function buildingTick(b, dt) {
  if (b.under) return;
  if (b.queue.length) {
    b.trainLeft -= dt;
    if (b.trainLeft <= 0) {
      const spawn = findSpawn(b);
      if (spawn) {
        const type = b.queue.shift();
        unit(b.team, type, spawn.x, spawn.y);
        b.trainLeft = TYPES[b.queue[0]]?.train || 0;
        if (b.team === 'blue' && type !== 'worker') {
          story.army = true;
          toast(`${TYPES[type].name} ready for battle!`);
        }
      } else {
        b.trainLeft = 1;
      }
    }
  }
  if (b.type !== 'tower') return;
  b.attackTimer -= dt;
  if (b.attackTimer > 0) return;
  const tower = BT.tower;
  const foe = closest(targetPoint(b), units.filter(u => u.team !== b.team), tower.range);
  if (foe) {
    strike(b, foe, tower.damage, true);
    b.attackTimer = tower.cooldown;
  }
}
function enemyBuild(type, keep, workers) {
  if (buildings.some(b => b.team === 'red' && b.type === type && b.under)) return;
  const options = [];
  for (let y = keep.y - 6; y < keep.y + 8; y++) for (let x = keep.x - 6; x < keep.x + 7; x++) {
    if (canPlace(type, x, y, 'red')) options.push({ x, y });
  }
  const site = closest({ x: keep.x - 2, y: keep.y + 4 }, options);
  if (!site || !spendRed(BT[type])) return;
  orderBuild(closest(site, workers), building('red', type, site.x, site.y, true));
}
function enemyThink(dt) {
  raidTime -= dt;
  if (gameTime - lastAI < 2) return;
  lastAI = gameTime;
  const camp = findKeep('red');
  const goal = findKeep('blue');
  if (!camp || !goal) return;
  const workers = units.filter(u => u.team === 'red' && u.type === 'worker');
  const army = units.filter(u => u.team === 'red' && u.type !== 'worker');
  const barracks = buildings.find(b => b.team === 'red' && b.type === 'barracks');
  const labor = workers.filter(u => u.order?.kind !== 'build');
  if (workers.length + camp.queue.length < 5) train(camp, 'worker');
  const abandoned = buildings.find(b => b.team === 'red' && b.under &&
    !workers.some(u => u.order?.kind === 'build' && u.order.target === b.id));
  if (abandoned && labor.length) orderBuild(labor.pop(), abandoned);
  const needsFarm = popMax('red') < 30 && popMax('red') - popUsed('red') < 4;
  if (labor.length) {
    if (!barracks) enemyBuild('barracks', camp, labor);
    else if (needsFarm) enemyBuild('farm', camp, labor);
  }
  for (const u of workers.filter(u => !u.order)) {
    const woodWorkers = workers.filter(w => w.order?.resource === 'tree').length;
    const goldWorkers = workers.filter(w => w.order?.resource === 'gold').length;
    const preferred = woodWorkers < goldWorkers ? 'tree' : 'gold';
    const resource = closest(u, nodes.filter(n => n.type === preferred)) || closest(u, nodes);
    if (resource) orderHarvest(u, resource);
  }
  if (barracks && barracks.queue.length < 2 && army.length < 16 && (!needsFarm || redStock.wood >= 115)) {
    const hasArchers = army.filter(u => u.type === 'shooter').length + barracks.queue.filter(t => t === 'shooter').length;
    if (hasArchers * 3 < army.length) train(barracks, 'shooter') || train(barracks, 'raider');
    else train(barracks, 'raider');
  }
  const available = army.filter(u => !u.order?.raid);
  if (raidTime <= 0 && available.length >= Math.min(9, 5 + wave)) {
    wave++;
    raidTime = Math.max(35, 64 - wave * 4);
    available.forEach(u => orderAttack(u, goal, true));
    playSound('raid');
    toast(`Crimson raid ${wave} incoming from the east!`);
  }
}
function update(dt) {
  if (gameState !== 'playing') return;
  gameTime += dt;
  for (const u of [...units]) {
    if (u.hp > 0) unitTick(u, dt);
    if (gameState !== 'playing') return;
  }
  for (const b of [...buildings]) if (b.hp > 0) buildingTick(b, dt);
  tickEffects(dt);
  if (gameState !== 'playing') return;
  enemyThink(dt);
  if (gameTime - lastFog > .2) { computeFog(); lastFog = gameTime; }
  if (gameTime - lastUI > .25) { updateUI(); lastUI = gameTime; }
  if (gameTime - lastSave >= 12) saveMatch();
}
function finish(won){clearSave();gameState=won?'won':'lost';placement=null;el('modalMark').textContent=won?'🏆':'🏚️';el('modalTitle').textContent=won?'VICTORY!':'THE KEEP HAS FALLEN';el('modalSubtitle').textContent=won?'The frontier is secure':'The Crimson horde prevails';el('modalBody').textContent=won?`The Crimson Keep is destroyed! You defended Ironwood in ${Math.floor(gameTime/60)}m ${Math.floor(gameTime%60)}s and survived ${wave} raid(s).`:`Your fortress was destroyed after ${Math.floor(gameTime/60)}m ${Math.floor(gameTime%60)}s. Rebuild stronger and rally your defenders.`;el('modalSteps').style.display='none';el('mainButton').textContent='PLAY AGAIN';el('restartButton').style.display='none';el('modalSmall').textContent='Original browser RTS • Made for touch';el('overlay').classList.remove('hidden')}
function rect(x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h)}
function strokeRect(x,y,w,h,color,lw=1){ctx.lineWidth=lw;ctx.strokeStyle=color;ctx.strokeRect(x,y,w,h)}
function circle(x,y,r,fill,stroke=null,lw=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke()}}
function oval(x,y,rx,ry,fill,stroke=null,lw=1){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke()}}
function line(x1,y1,x2,y2,color,lw=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=lw;ctx.strokeStyle=color;ctx.stroke()}
function poly(points,fill,stroke=null,lw=1){if(!points.length)return;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke()}}
function tileNearWater(x,y){for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){if(!xx&&!yy)continue;let nx=x+xx,ny=y+yy;if(nx>=0&&ny>=0&&nx<MW&&ny<MH&&world[ny][nx].water)return true}return false}
let terrainCache;
function paintTerrain(){
  const meadow = ctx.createLinearGradient(0, 0, MW*T, MH*T);
  meadow.addColorStop(0, '#799a35');
  meadow.addColorStop(.4, '#94ac40');
  meadow.addColorStop(.75, '#82a23d');
  meadow.addColorStop(1, '#a3ac4c');
  rect(0,0,MW*T,MH*T,meadow);
  // Paths lead from the keep gate onto the main lane and toward the ore.
  ctx.save();
  ctx.scale(T,T);
  ctx.strokeStyle='#ebc585'; ctx.lineWidth=.55; ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(6.5,12.8); ctx.bezierCurveTo(6.1,13.9,4.8,13.5,4.2,14.1);
  ctx.moveTo(6.5,12.8); ctx.bezierCurveTo(8.1,12.1,8.5,10.7,11.4,10.8);
  ctx.stroke(); ctx.restore();
  const left=0,right=MW,top=0,bottom=MH;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
    const tile=world[y][x],px=x*T,py=y*T,r=tile.rough;
    if(tile.water){
      // Round exposed shoreline corners while joining adjacent water cells.
      const water = (dx,dy) => world[y+dy]?.[x+dx]?.water;
      const corners = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([dx,dy]) =>
        !water(dx,0) && !water(0,dy) ? T*.48 : 0);
      ctx.beginPath(); ctx.roundRect(px,py,T+.2,T+.2,corners);
      ctx.fillStyle='#217fa0'; ctx.fill();
      if (!water(0,-1)) oval(px+T*.5,py+9,T*.24,1.6,'#72bfc2');
      continue;
    }
    if (tile.ridge) {
      poly([[px,py+39],[px+16,py+7],[px+24,py+2],[px+45,py+37],[px+34,py+45],[px+11,py+46]], '#25312d');
      poly([[px+3,py+37],[px+19,py+7],[px+24,py+4],[px+26,py+24],[px+18,py+39]], '#8d9480');
      poly([[px+24,py+4],[px+45,py+37],[px+30,py+41],[px+26,py+24]], '#515e54');
      poly([[px+19,py+10],[px+24,py+4],[px+31,py+16],[px+26,py+14],[px+21,py+16]], '#c5cbb3');
      continue;
    }
    const road = offset => (12.5 + 2*Math.sin((x+offset)/5))*T;
    const west = road(0), east = road(1), half = T*.47;
    if (py < Math.max(west,east)+half && py+T > Math.min(west,east)-half) {
      ctx.save();
      ctx.beginPath(); ctx.rect(px,py,T,T); ctx.clip();
      poly([[px,west-half],[px+T,east-half],[px+T,east+half],[px,west+half]],'#ebc585');
      line(px,west+half-2,px+T,east+half-2,'#d7b87b',3);
      for (let i=0; i<5; i++) {
        const offset=rand(x,y,i+13), pebbleY=road(offset)+(rand(y,x,i+25)-.5)*half*1.8;
        oval(px+offset*T,pebbleY,2.8,1.1,'#e2c28c');
      }
      ctx.restore();
    }
    if (r>.87) {
      const gx=px+6+rand(x,y,4)*32, gy=py+9+rand(x,y,5)*30;
      poly([[gx-5,gy-4],[gx-1,gy-1],[gx,gy-8],[gx+2,gy-2],[gx+5,gy-5],[gx+3,gy]],'#719754');
    }

  }
}
function drawTerrain() {
  if (!terrainCache) {
    terrainCache = document.createElement('canvas');
    terrainCache.width = MW * T;
    terrainCache.height = MH * T;
    const screen = ctx;
    ctx = terrainCache.getContext('2d');
    paintTerrain();
    ctx = screen;
  }
  const left = Math.floor(cam.x * T);
  const top = Math.floor(cam.y * T);
  const width = Math.min(MW * T - left, Math.ceil(viewW / scale) + 1);
  const height = Math.min(MH * T - top, Math.ceil(viewH / scale) + 1);
  ctx.drawImage(terrainCache, left, top, width, height, left, top, width, height);
  for (let y = Math.floor(top / T); y < Math.ceil((top + height) / T); y++) {
    for (let x = Math.floor(left / T); x < Math.ceil((left + width) / T); x++) {
      if (!world[y][x].water) continue;
      const phase = (gameTime * 11 + x * 7 + y * 3) % 29;
      rect(x * T + 5 + Math.floor(phase), y * T + 19, 8, 1, '#98ddd36e');
      rect(x * T + 30 - Math.floor(phase / 2), y * T + 32, 9, 1, '#6cb8bf');
    }
  }
}
const { buildingArt, resourceArt, unitArt } = createSprites(T, ctx, {
  rect, oval, circle, poly, line, strokeRect
});
function drawHealth(e){
  let x,y,w;if(e.kind==='building'){x=e.x*T+6;y=e.y*T-12;w=e.w*T-12}else{x=e.x*T-14;y=e.y*T-34;w=28}
  if(e.hp>=e.maxHp-.1 && !selected.includes(e.id) && (e.kind==='building' || e.type==='worker'))return;
  rect(x,y,w,6,'#241817cc'); rect(x+1,y+1,w-2,4,'#55312d'); rect(x+1,y+1,(w-2)*clamp(e.hp/e.maxHp,0,1),4,e.team==='blue'?'#8be082':'#f18269');
  strokeRect(x,y,w,6,'#dbcda0',1);
}
// One pixel per cell gives the fog a soft boundary at every camera zoom.
let fogCanvas, paintedVisibility;
function drawFog() {
  if (!fogCanvas) {
    fogCanvas = document.createElement('canvas');
    fogCanvas.width = MW;
    fogCanvas.height = MH;
  }
  if (paintedVisibility !== visible) {
    const mask = fogCanvas.getContext('2d');
    mask.clearRect(0, 0, MW, MH);
    for (let y=0; y<MH; y++) for (let x=0; x<MW; x++) {
      if (visible[y][x]) continue;
      mask.fillStyle = explored[y][x] ? '#334c36a8' : '#263e35';
      mask.fillRect(x,y,1,1);
    }
    paintedVisibility = visible;
  }
  ctx.drawImage(fogCanvas,0,0,MW*T,MH*T);
}
function drawSelection(){for(const e of selEntities()){let x=e.kind==='unit'?e.x*T:(e.x+e.w/2)*T,y=e.kind==='unit'?e.y*T:(e.y+e.h/2)*T,r=e.kind==='unit'?18:Math.max(e.w,e.h)*T*.48;ctx.strokeStyle='#f7e69a';ctx.lineWidth=2.6;ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(x,y+(e.kind==='unit'?10:15),r,r*.42,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#fff8c6';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+(e.kind==='unit'?10:15),r-4,r*.33,0,0,Math.PI*2);ctx.stroke()}}
function drawGhost(){if(!placement)return;let b=BT[placement.type],x=placement.x,y=placement.y,valid=canPlace(placement.type,x,y);ctx.fillStyle=valid?'#a7f0aa66':'#fa6d5d66';ctx.fillRect(x*T,y*T,b.w*T,b.h*T);ctx.strokeStyle=valid?'#e0ffd2':'#ffd0c1';ctx.lineWidth=3;ctx.strokeRect(x*T+1,y*T+1,b.w*T-2,b.h*T-2);for(let i=0;i<b.w*T+b.h*T;i+=10)line(x*T+i,y*T,x*T,y*T+i,valid?'#d7f8c3aa':'#ffc8bf99',1)}
function drawEffects() {
  for (const fx of effects) {
    if (!tileVisible(Math.floor(fx.x), Math.floor(fx.y)) &&
        !tileVisible(Math.floor(fx.tx), Math.floor(fx.ty))) continue;
    const time = 1 - fx.life / fx.maxLife;
    const x = fx.x * T;
    const y = fx.y * T;
    if (fx.kind === 'arrow') {
      const dx = (fx.tx - fx.x) * T;
      const dy = (fx.ty - fx.y) * T;
      const px = x + dx * time;
      const py = y + dy * time - 18 - 22 * Math.sin(Math.PI * time);
      const length = Math.hypot(dx, dy) || 1;
      line(px - dx / length * 11, py - dy / length * 11, px, py, fx.color, 2);
      rect(px - 1, py - 1, 3, 3, '#fff0b9');
    } else if (fx.kind === 'fall') {
      ctx.save();
      ctx.globalAlpha = 1 - time;
      ctx.translate(x, y);
      ctx.rotate(time * 1.6);
      unitArt({ ...fx.unit, x: 0, y: 0 }, gameTime);
      ctx.restore();
    } else {
      ctx.globalAlpha = 1 - time;
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const size = fx.kind === 'ruin' ? 8 + i : 3;
        const travel = time * (fx.kind === 'ruin' ? 45 : 20);
        rect(Math.round(x + Math.cos(angle) * travel),
          Math.round(y - 12 + Math.sin(angle) * travel - time * 12), size, size,
          fx.color || (i % 2 ? '#d18c60' : '#69574e'));
      }
      ctx.globalAlpha = 1;
    }
  }
}
let lastMinimap = -Infinity;
function render() {
  if (!viewW || !viewH) return;
  ctx.setTransform(devicePixel, 0, 0, devicePixel, 0, 0);
  ctx.imageSmoothingEnabled = true;
  rect(0, 0, viewW, viewH, '#0a1812');
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-cam.x * T, -cam.y * T);
  drawTerrain();
  const right = cam.x + viewW / (T * scale);
  const bottom = cam.y + viewH / (T * scale);
  const sprites = [...nodes, ...buildings, ...units].filter(e => {
    if (e.x + (e.w || 1) < cam.x - 1 || e.x > right + 1 ||
        e.y + (e.h || 1) < cam.y - 1 || e.y > bottom + 2) return false;
    if (e.team === 'blue') return true;
    const p = targetPoint(e);
    return e.kind === 'resource' ? explored[e.y]?.[e.x] : tileVisible(Math.floor(p.x), Math.floor(p.y));
  });
  sprites.sort((a, b) => a.y + (a.h || 0) - b.y - (b.h || 0));
  for (const e of sprites) {
    if (e.kind === 'resource') resourceArt(e);
    else {
      if (e.kind === 'unit') unitArt(e, gameTime);
      else {
        buildingArt(e);
        if (!e.under && e.hp < e.maxHp * .45) {
          const p = targetPoint(e);
          for (let i = 0; i < 4; i++) {
            const age = (gameTime * 1.6 + i * .24) % 1;
            ctx.globalAlpha = (1 - age) * .64;
            rect(p.x * T + Math.floor(age * 16) - i * 3, p.y * T - age * 34, 6 + i * 2, 6 + i * 2,
              age < .25 ? '#ff9c50' : '#8b8980');
          }
          ctx.globalAlpha = 1;
        }
      }
      drawHealth(e);
    }
  }
  drawEffects();
  drawFog();
  drawSelection();
  drawGhost();
  ctx.restore();
  if (box) {
    const { origin, end } = box;
    const dx = end.x - origin.x;
    const dy = end.y - origin.y;
    rect(origin.x, origin.y, dx, dy, '#a9f8c62d');
    strokeRect(origin.x, origin.y, dx, dy, '#c4f5a1', 2);
  }
  const now = performance.now();
  if (now - lastMinimap > 85) { drawMinimap(); lastMinimap = now; }
  if (now > toastUntil) el('toast').classList.remove('show');
}
function drawMinimap(){const w=mini.width,h=mini.height,cx=w/MW,cy=h/MH;mc.fillStyle='#1a3023';mc.fillRect(0,0,w,h);for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){mc.fillStyle=!explored[y]?.[x]?'#07160f':world[y]?.[x]?.water?'#2f7385':visible[y]?.[x]?'#6e8c55':'#39553c';mc.fillRect(x*cx,y*cy,Math.ceil(cx),Math.ceil(cy))}for(const n of nodes)if(explored[n.y]?.[n.x]){mc.fillStyle=n.type==='tree'?'#98b85a':'#e8c16d';mc.fillRect(n.x*cx,n.y*cy,Math.max(2,cx*1.1),Math.max(2,cy*1.1))}for(const b of buildings)if(b.team==='blue'||tileVisible(Math.floor(b.x+b.w/2),Math.floor(b.y+b.h/2))){mc.fillStyle=b.team==='blue'?'#8fdad0':'#e88473';mc.fillRect(b.x*cx,b.y*cy,b.w*cx,b.h*cy)}for(const u of units)if(u.team==='blue'||tileVisible(Math.floor(u.x),Math.floor(u.y))){mc.fillStyle=u.team==='blue'?'#d2fff2':'#ff9b80';mc.fillRect(u.x*cx-1,u.y*cy-1,3.5,3.5)}mc.strokeStyle='#f5e3a1';mc.lineWidth=2;mc.strokeRect(cam.x*cx,cam.y*cy,viewW/(T*scale)*cx,viewH/(T*scale)*cy);mc.strokeStyle='#7e8c63';mc.strokeRect(1,1,w-2,h-2)}
function resize(){const rect=area.getBoundingClientRect();viewW=rect.width;viewH=rect.height;devicePixel=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(viewW*devicePixel));canvas.height=Math.max(1,Math.round(viewH*devicePixel));clampCam();render()}
function frame(ts){let dt=lastFrame?Math.min(.06,(ts-lastFrame)/1000):0;lastFrame=ts;update(dt);render();requestAnimationFrame(frame)}
function screenPoint(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
const touches = new Map();
let pinch;
let boxMode = false;
let box;
function setBoxMode(value) {
  boxMode = value;
  box = null;
  el('boxSelect').setAttribute('aria-pressed', String(value));
}
function pinchPosition() {
  const [a, b] = touches.values();
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, span: Math.hypot(a.x - b.x, a.y - b.y) };
}
canvas.addEventListener('pointerdown', e => {
  if (gameState !== 'playing' || e.button !== 0) return;
  const p = screenPoint(e);
  touches.set(e.pointerId, p);
  canvas.setPointerCapture(e.pointerId);
  if (touches.size === 2) {
    const center = pinchPosition();
    pinch = { span: Math.max(1, center.span), scale,
      wx: cam.x + center.x / (T * scale), wy: cam.y + center.y / (T * scale) };
    pointer = null;
    box = null;
  } else if (touches.size === 1) {
    pointer = { id: e.pointerId, start: p, last: p, moved: false, select: !placement && (boxMode || e.shiftKey) };
  }
});
canvas.addEventListener('pointermove', e => {
  const p = screenPoint(e);
  if (placement) {
    placement.x = Math.floor(cam.x + p.x / (T * scale));
    placement.y = Math.floor(cam.y + p.y / (T * scale));
  }
  if (!touches.has(e.pointerId)) return;
  touches.set(e.pointerId, p);
  if (pinch && touches.size >= 2) {
    const center = pinchPosition();
    scale = clamp(pinch.scale * center.span / pinch.span, .55, 1.75);
    cam.x = pinch.wx - center.x / (T * scale);
    cam.y = pinch.wy - center.y / (T * scale);
    clampCam();
  } else if (pointer?.id === e.pointerId) {
    const origin = pointer.start;
    pointer.moved ||= Math.hypot(p.x - origin.x, p.y - origin.y) > 6;
    if (pointer.moved && pointer.select) box = { origin, end: p };
    else if (pointer.moved) {
      cam.x -= (p.x - pointer.last.x) / (T * scale);
      cam.y -= (p.y - pointer.last.y) / (T * scale);
      clampCam();
    }
    pointer.last = p;
  }
});
function endPointer(e, cancelled) {
  touches.delete(e.pointerId);
  if (touches.size < 2) pinch = null;
  if (pointer?.id !== e.pointerId) return;
  const gesture = pointer;
  pointer = null;
  box = null;
  if (cancelled || gameState !== 'playing') return;
  const p = screenPoint(e);
  if (!gesture.moved) {
    tapWorld(p.x, p.y);
  } else if (gesture.select) {
    const a = gesture.start;
    selected = units.filter(u => {
      const x = (u.x - cam.x) * T * scale;
      const y = (u.y - cam.y) * T * scale;
      return u.team === 'blue' && x >= Math.min(a.x, p.x) && x <= Math.max(a.x, p.x) &&
        y >= Math.min(a.y, p.y) && y <= Math.max(a.y, p.y);
    }).map(u => u.id);
    attackMove = false;
    setBoxMode(false);
    updateUI();
  }
}
canvas.addEventListener('pointerup', e => endPointer(e, false));
canvas.addEventListener('pointercancel', e => endPointer(e, true));
canvas.addEventListener('lostpointercapture', e => endPointer(e, true));
el('boxSelect').addEventListener('click', () => {
  if (gameState !== 'playing') return;
  setBoxMode(!boxMode);
  if (boxMode) toast('Drag a box around your units');
});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.shiftKey)zoom(e.deltaY>0?-.1:.1);else{cam.y+=e.deltaY/(T*scale);cam.x+=e.deltaX/(T*scale);clampCam()}},{passive:false});
mini.addEventListener('pointerdown',e=>{miniPointer=true;mini.setPointerCapture(e.pointerId);miniTap(e)});mini.addEventListener('pointermove',e=>{if(miniPointer)miniTap(e)});mini.addEventListener('pointerup',()=>miniPointer=false);mini.addEventListener('pointercancel',()=>miniPointer=false);function miniTap(e){const r=mini.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*MW,y=(e.clientY-r.top)/r.height*MH;centerOn(x,y)}
el('zoomIn').addEventListener('click',()=>zoom(.15));el('zoomOut').addEventListener('click',()=>zoom(-.15));el('actions').addEventListener('click',e=>{const button=e.target.closest('button[data-action]');if(button)handleAction(button.dataset.action)});document.querySelectorAll('[data-quick]').forEach(b=>b.addEventListener('click',()=>{let cmd=b.dataset.quick;if(cmd==='keep'){let k=findKeep('blue');if(k){selectOne(k);centerOn(k.x+1.5,k.y+1.5)}}else selectGroup(cmd)}));
let lastSave = 0;
let muted = false;
function localStore() {
  try { return window.localStorage; } catch { return null; }
}
function saveMatch() {
  lastSave = gameTime;
  return storeMatch(localStore(), { units, buildings, nodes, effects, explored, idCounter,
    gold, wood, redStock, gameTime, raidTime, wave, lastAI, story, cam, scale, selected });
}
function clearSave() {
  removeMatch(localStore());
  el('loadButton').hidden = true;
}
function resumeSaved() {
  const save = readMatch(localStore());
  if (!save) { el('loadButton').hidden = true; return; }
  worldInit();
  ({ units, buildings, nodes, effects, explored, idCounter, gold, wood, redStock,
    gameTime, raidTime, wave, lastAI, story, cam, scale, selected } = save);
  lastSave = lastFog = lastUI = gameTime;
  placement = null;
  attackMove = false;
  clampCam();
  computeFog();
  gameState = 'playing';
  updateUI();
  el('overlay').classList.add('hidden');
}
el('loadButton').hidden = !readMatch(localStore());
el('loadButton').addEventListener('click', () => { unlockAudio(); resumeSaved(); });
el('muteButton').addEventListener('click', () => {
  muted = !muted;
  setMuted(muted);
  if (!muted) unlockAudio();
  el('muteButton').textContent = muted ? 'SOUND OFF' : 'SOUND ON';
  el('muteButton').setAttribute('aria-pressed', String(muted));
});
function showPause(){if(gameState!=='playing')return;const saved=saveMatch();gameState='paused';el('modalMark').textContent='⏸️';el('modalTitle').textContent='CAMPAIGN PAUSED';el('modalSubtitle').textContent=`${Math.floor(gameTime/60)}m ${Math.floor(gameTime%60)}s elapsed`;el('modalBody').textContent='The frontier will wait for your next command. Continue, or restart the mission.';el('modalSteps').style.display='none';el('mainButton').textContent='RESUME BATTLE';el('restartButton').style.display='block';el('loadButton').hidden=true;el('modalSmall').textContent=saved?'Progress saved on this device':'Local storage is unavailable';el('overlay').classList.remove('hidden')}
el('pauseBtn').addEventListener('click',showPause);el('mainButton').addEventListener('click',()=>{unlockAudio();if(gameState==='paused'){gameState='playing';el('overlay').classList.add('hidden');return}clearSave();reset();saveMatch();el('overlay').classList.add('hidden')});el('restartButton').addEventListener('click',()=>{clearSave();reset();saveMatch();el('overlay').classList.add('hidden')});window.addEventListener('keydown',e=>{if(e.key==='Escape'&&placement){placement=null;updateUI()}else if(e.key==='Escape'&&gameState==='playing')showPause();else if(e.key===' '&&gameState==='playing'){e.preventDefault();selectGroup('army')}else if(e.key==='w'&&gameState==='playing')selectGroup('workers')});window.addEventListener('resize',resize);window.addEventListener('pagehide',()=>{if(gameState==='playing'||gameState==='paused')saveMatch()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&gameState==='playing')showPause()});
worldInit();explored=Array.from({length:MH},()=>Array(MW).fill(false));visible=Array.from({length:MH},()=>Array(MW).fill(false));building('blue','keep',5,10);building('red','keep',28,10);computeFog();resize();requestAnimationFrame(frame);
