// Original canvas sprites. Geometry is kept in world pixels for crisp silhouettes.
export function createSprites(T, ctx, { rect, oval, circle, poly, line, strokeRect }) {
  const images = new Map();
  for (const name of ['keep','crimson-keep','barracks','farm','tower','tree','pine','ore',
    'worker','guard','archer','raider','shooter','crimson-worker','crimson-barracks','crimson-tower','crimson-farm']) {
    if (typeof Image === "undefined") break;
    const image = new Image();
    image.onload = () => images.set(name, image);
    image.src = new URL(`../art/${name}.webp`, import.meta.url);
  }

  // Fit each cutout inside its game footprint, anchored at the feet.
  function paint(image, center, bottom, width, height) {
    const scale = Math.min(width / image.width, height / image.height);
    const w = image.width * scale, h = image.height * scale;
    ctx.drawImage(image, center - w / 2, bottom - h, w, h);
  }
  function buildingArt(b){
    const x=b.x*T,y=b.y*T,w=b.w*T,h=b.h*T,blue=b.team==='blue';
    const wall=blue?'#b8b59c':'#ab9085',wallDark=blue?'#7f7a66':'#7a6058',roof=blue?'#3d6474':'#7c3e43',roofLite=blue?'#628f9a':'#ba6760',flag=blue?'#bdeedc':'#ff9d8d';
    oval(x+w/2,y+h+4,w*.44,9,'#10221888');
    if(b.under){
      rect(x+4,y+8,w-8,h-12,'#7c6640');
      rect(x+8,y+12,w-16,h-20,'#a48859');
      for(let i=0;i<w;i+=14){line(x+i+4,y+9,x+i+10,y+h-8,'#cfa468',2)}
      for(let i=10;i<h-4;i+=12)line(x+4,y+i,x+w-4,y+i,'#d3b578',2);
      rect(x+6,y+h-10,w-12,6,'#3f2c1f');
      rect(x+6,y+h-10,Math.max(0,(w-12)*b.progress),6,'#efd491');
      strokeRect(x+4,y+8,w-8,h-12,'#e1c286',2);
      return;
    }
    const image = images.get(blue ? b.type : 'crimson-' + b.type);
    if (image) {
      paint(image, x+w/2, y+h+2, w+4, h+10);
      return;
    }
    if (b.type === 'keep' && !blue) {
      rect(x+15,y+30,w-30,h-26,'#2e2428');
      rect(x+23,y+26,w-46,h-34,'#66514e');
      for (let row=0; row<5; row++) for (let col=0; col<4; col++) {
        const px=x+26+col*22+(row%2)*4, py=y+44+row*14;
        rect(px,py,16,9,row%2?'#79615a':'#866758');
        rect(px,py,16,2,'#b0826c');
      }
      for (const px of [x+12,x+w-39]) {
        rect(px,y+31,27,h-39,'#423337');
        rect(px+3,y+32,17,h-45,'#86685c');
        poly([[px-4,y+34],[px+12,y+4],[px+31,y+34]],'#6e343b','#302429',2);
        poly([[px+1,y+29],[px+12,y+7],[px+15,y+29]],'#b66d62');
        rect(px+10,y+43,5,15,'#281e22');
        rect(px+11,y+52,3,4,'#ffb967');
      }
      poly([[x+43,y+38],[x+w-43,y+38],[x+w/2,y+3]],'#7f3c43','#33252a',2);
      rect(x+w/2-16,y+h-43,32,40,'#3d2529');
      rect(x+w/2-11,y+h-37,22,31,'#1e1a1c');
      rect(x+w/2-2,y+h-37,4,31,'#ae7755');
      poly([[x+w/2-8,y+40],[x+w/2+8,y+40],[x+w/2+8,y+70],[x+w/2,y+75],[x+w/2-8,y+70]],'#b45052');
      rect(x+w/2-2,y+46,4,18,'#f3b383');
      return;
    }
    if(b.type==='keep'){
      rect(x+10,y+18,w-20,h-16,wallDark); rect(x+14,y+22,w-28,h-26,wall); strokeRect(x+14,y+22,w-28,h-26,'#ddd8bc',2);
      for(let xx=x+12;xx<x+w-10;xx+=18){rect(xx,y+12,12,12,wall); rect(xx+2,y+14,8,6,'#d9d7bf')}
      rect(x+20,y+10,w-40,16,roof); poly([[x+16,y+24],[x+w-16,y+24],[x+w-28,y+3],[x+28,y+3]],roof,'#2e4951',2);
      rect(x+24,y+8,w-48,5,roofLite);
      rect(x+w/2-14,y+h-40,28,36,'#4c352b'); rect(x+w/2-9,y+h-34,18,30,'#1d1916'); rect(x+w/2-3,y+h-33,6,12,'#ba985a');
      for(let yy=y+33;yy<y+h-22;yy+=12){rect(x+21,yy,8,8,'#31444d');rect(x+w-29,yy,8,8,'#31444d');rect(x+23,yy+2,4,4,'#f2e6a6');rect(x+w-27,yy+2,4,4,'#f2e6a6')}
      rect(x+w-28,y+1,4,38,'#7b5b3d'); poly([[x+w-24,y+4],[x+w+1,y+10],[x+w-24,y+17]],flag);
    }else if(b.type==='barracks'){
      rect(x+7,y+24,w-14,h-14,wallDark); rect(x+10,y+26,w-20,h-18,wall); strokeRect(x+10,y+26,w-20,h-18,'#ddd2b5',2);
      poly([[x+8,y+24],[x+w-8,y+24],[x+w-22,y+4],[x+22,y+4]],roof,'#3d2f2d',2); rect(x+16,y+10,w-32,5,roofLite);
      rect(x+w/2-13,y+h-31,26,23,'#5a4033'); rect(x+w/2-9,y+h-26,18,18,'#2d241f');
      rect(x+20,y+33,12,12,'#33434a'); rect(x+w-32,y+33,12,12,'#33434a');
      circle(x+w-22,y+19,8,blue?'#678da0':'#a65b59','#e5ddb0',2); line(x+w-25,y+19,x+w-19,y+19,'#eef3d3',2); line(x+w-22,y+16,x+w-22,y+22,'#eef3d3',2);
      rect(x+w-18,y+8,4,23,'#c7ad72'); poly([[x+w-14,y+10],[x+w+2,y+15],[x+w-14,y+20]],flag);
    }else if(b.type==='farm'){
      rect(x+5,y+18,w-10,h-10,'#957447'); rect(x+6,y+20,w-12,h-12,'#b08a54');
      for(let yy=y+24;yy<y+h-8;yy+=8) for(let xx=x+10;xx<x+w-10;xx+=10){line(xx,yy,xx,yy+7,'#ebcd63',2); line(xx+2,yy+1,xx+2,yy+6,'#f4df82',1.5)}
      rect(x+3,y+15,w-6,5,'#c89b57'); for(let i=6;i<w-6;i+=12){line(x+i,y+15,x+i,y+h-3,'#7a5d38',1.5)}
      const bx=x+w/2-12, by=y+18; rect(bx,by,24,20,'#6b4938'); poly([[bx-3,by+2],[bx+27,by+2],[bx+20,by-7],[bx+4,by-7]],roof,'#4b3028',2); rect(bx+8,by+9,8,11,'#2c2119');
    }else if(b.type==='tower'){
      rect(x+11,y+16,w-22,h-15,wallDark); rect(x+14,y+18,w-28,h-20,wall); strokeRect(x+14,y+18,w-28,h-20,'#e0d8bc',2);
      for(let xx=x+12;xx<x+w-12;xx+=10)rect(xx,y+10,6,8,wall);
      poly([[x+8,y+16],[x+w-8,y+16],[x+w-16,y+4],[x+16,y+4]],roof,'#423135',2); rect(x+15,y+10,w-30,4,roofLite);
      rect(x+w/2-5,y+h-16,10,10,'#2b1f1b'); rect(x+w-14,y+2,3,18,'#d1b67f'); poly([[x+w-11,y+4],[x+w+6,y+9],[x+w-11,y+14]],flag);
    }
    if (b.type === 'keep' || b.type === 'barracks') {
      for (let row=0; row<3; row++) {
        const py=y+47+row*13;
        for (let col=0; col<3; col++) {
          const px=x+33+col*16+(row%2)*5;
          if (py>y+h-39 && px>x+w/2-18 && px<x+w/2+18) continue;
          rect(px,py,12,2,wallDark);
          rect(px+2,py+2,9,1,blue?'#ddd4ae':'#c09988');
        }
      }
    }
    rect(x+6,y+h-4,w-12,3,blue?'#c8dbad':'#d98d7c');
  }
  function resourceArt(n){
    const x=n.x*T,y=n.y*T;
    const name = n.type === 'tree' ? ((n.x*3+n.y)%4 ? 'tree' : 'pine') : 'ore';
    const image = images.get(name);
    if (image) {
      oval(x+25,y+42,18,5,'#233d3555');
      const size = name === 'ore' ? T : T*1.45;
      paint(image,x+T/2,y+T-2,size,size);
      return;
    }
    if(n.type==='tree'){
      oval(x+24,y+42,17,6,'#12261888');
      rect(x+21,y+24,8,18,'#775230'); rect(x+23,y+18,4,27,'#8f673d');
      line(x+24,y+31,x+17,y+42,'#6e492d',2); line(x+24,y+31,x+31,y+42,'#6e492d',2);
      if ((n.x * 3 + n.y) % 4 === 0) {
        for (let i=0; i<3; i++) {
          const top=y-5+i*10, half=9+i*5;
          poly([[x+24,top],[x+24+half,top+17],[x+24-half,top+17]],'#28513e','#23392f',1);
          poly([[x+24,top+1],[x+25,top+15],[x+25-half,top+16]],'#48805a');
          rect(x+20-i*3,top+11,5,2,'#6a9f67');
        }
        return;
      }
      circle(x+17,y+26,12,'#2d5f39'); circle(x+30,y+24,11,'#346a3d'); circle(x+24,y+14,13,'#3d7845'); circle(x+14,y+18,9,'#427d49'); circle(x+34,y+16,8,'#4a8950');
      circle(x+19,y+18,3,'#72a667'); circle(x+30,y+13,3,'#84b978'); circle(x+11,y+23,2.5,'#5f955d');
    }else{
      oval(x+24,y+42,18,6,'#10201577');
      poly([[x+5,y+40],[x+10,y+22],[x+20,y+13],[x+34,y+9],[x+43,y+19],[x+44,y+38],[x+35,y+44],[x+14,y+44]],'#7d715f','#4a453d',2);
      poly([[x+18,y+28],[x+25,y+12],[x+35,y+18],[x+31,y+33]],'#d5b061','#ad8740',2);
      poly([[x+10,y+32],[x+17,y+20],[x+24,y+25],[x+21,y+37]],'#ae8f54','#7d6844',2);
      circle(x+29,y+16,2.3,'#ffe897'); circle(x+23,y+19,2,'#f7d16e'); circle(x+17,y+26,2,'#efd17b');
    }
  }
  function unitArt(u, gameTime){
    const x=u.x*T,y=u.y*T,blue=u.team==='blue',color=blue?'#5ea8b4':'#bf5b50',dark=blue?'#2f5862':'#6f3438',trim=blue?'#caeee4':'#ffcab5',step=u.path.length?Math.sin(gameTime*13+u.wobble):0,face=u.team==='blue'?'#dec0a0':'#d7ae95';
    ctx.save(); ctx.translate(Math.round(x),Math.round(y)); ctx.scale(u.facing || 1,1); ctx.translate(0,u.path.length?Math.sin(gameTime*10+u.wobble)*1.3:0);
    oval(0,16,13,5,'#11211788');
    const image = images.get(!blue && u.type === 'worker' ? 'crimson-worker' : u.type);
    if (image) {
      const working = u.order?.stage === 'mining' || (u.order?.kind === 'build' && !u.path.length);
      const strike = u.swing > gameTime ? Math.sin(Math.PI*(u.swing-gameTime)/.28) : 0;
      ctx.rotate(strike*.22 + (working ? Math.sin(gameTime*8+u.wobble)*.12 : step*.035));
      paint(image,0,17,42,48);
      if (u.carry) paint(images.get(u.carryType === 'tree' ? 'tree' : 'ore') || image,-10,-15,13,13);
      ctx.restore();
      return;
    }
    rect(-7,5+Math.max(0,step*1.5),4,11,'#4c3b30'); rect(3,5+Math.max(0,-step*1.5),4,11,'#44352c');
    if(u.type==='worker'){
      rect(-8,-7,16,15,'#b48f62'); rect(-7,-5,14,11,'#d2ad76'); rect(-6,-17,12,11,face); rect(-8,-21,16,6,'#85623b');
      rect(-8,-21,16,3,dark); rect(-8,-8,16,4,color);
      rect(9,-13,3,20,'#81563b'); poly([[11,-15],[21,-11],[13,-7]],'#c8ccb3','#7f8b82',1.5); rect(-2,-5,4,9,'#bfe0a6');
    }else if(u.type==='guard'){
      rect(-9,-8,18,18,color); rect(-4,-8,8,18,dark); rect(-6,-19,12,11,face); rect(-9,-23,18,7,dark); rect(-12,-11,7,16,'#bbc0b6');
      strokeRect(-12,-11,7,16,'#81857e',1); rect(10,-16,3,29,'#a6a39b'); poly([[13,-18],[18,-12],[13,-6]],'#eef0d7','#8f968c',1.5); rect(-1,-6,2,14,trim);
    }else if(u.type==='archer' || u.type==='shooter'){
      rect(-8,-8,16,18,blue?'#567955':'#8d4b41'); rect(-8,-18,16,12,blue?'#688d61':'#994d49'); rect(-5,-14,10,10,face); rect(-7,-21,14,5,dark);
      ctx.beginPath(); ctx.strokeStyle='#bf9156'; ctx.lineWidth=2; ctx.arc(11,-8,8,-1.2,1.2); ctx.stroke(); line(18,-15,18,4,'#d6d0ac',1.2); line(10,-15,10,8,'#bf9156',1.5);
      rect(-11,-15,2,14,'#8a6540'); rect(-13,-14,6,3,'#c1b98c'); rect(-2,-5,4,11,trim);
    }else{
      rect(-9,-8,18,18,color); rect(-5,-7,10,17,'#88493e'); rect(-6,-18,12,11,face); rect(-10,-22,20,7,dark);
      rect(10,-13,3,22,'#6c4a34'); poly([[12,-14],[20,-10],[17,-4],[12,-2]],'#b7b5ad','#7c807c',1.5); rect(-12,-10,4,7,'#e1c4a1'); rect(-1,-5,3,11,'#f5d6b4');
    }
    if (u.vertical === -1) {
      rect(-5,-15,10,6,dark);
      rect(-6,-5,12,12,color);
      rect(-1,-4,2,10,trim);
    } else {
      rect(2,-15,2,2,'#272525');
    }
    const swing = u.swing > gameTime ? (u.swing - gameTime) / .28 : 0;
    if (swing) {
      poly([[13,-12],[26,-17 + swing*20],[29,-13 + swing*20],[17,-6]],'#e8e3b4','#514d3c',1);
      rect(24,-15+swing*20,6,2,'#fff3c8');
    } else if (u.order?.stage === 'mining' || (u.order?.kind === 'build' && !u.path.length)) {
      const strike = Math.floor(gameTime*8 + u.wobble) % 4;
      line(10,-3,19,6-strike*6,'#b99260',3);
      rect(16,5-strike*6,9,3,'#e0ceab');
      if (!strike) rect(23,9,3,3,'#f9d779');
    }
    if(u.carry){rect(5,-27,13,10,u.carryType==='tree'?'#a5793c':'#e2b95d'); rect(7,-25,9,3,u.carryType==='tree'?'#c99651':'#fff0ab')}
    ctx.restore();
  }
  return { buildingArt, resourceArt, unitArt };
}
