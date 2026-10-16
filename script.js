const W=1000,H=600,SKY=30,PPM=20,G=9.81,DT=.2,TOL=.3,cv=document.getElementById('cv'),c=cv.getContext('2d'),$=id=>document.getElementById(id);
const RO=[{m:1,c:'#ff4d4d',c2:'#a80f1a',n:'Arachne 1.0 kg',s:0},{m:2.5,c:'#2ee59d',c2:'#06703f',n:'Nemesis 2.5 kg',s:.72},{m:5,c:'#ffc83d',c2:'#b36b00',n:'Dango 5.0 kg',s:.5}];
const skins={};const D2R=Math.PI/180,cfg={F:{lab:'Force F',u:[['N',1],['lbf',4.4482216]],lo:1,hi:500,si:'N',rt:'1–500 N'},v:{lab:'Launch speed v₀',u:[['m/s',1],['km/h',1/3.6],['mph',.44704]],lo:1,hi:40,si:'m/s',rt:'1–40 m/s'},th:{lab:'Launch angle θ',u:[['deg (°)',D2R],['rad',1]],lo:5*D2R,hi:85*D2R,si:'rad',rt:'5°–85° (0.087–1.484 rad)'},dt:{lab:'Contact time Δt',u:[['s',1]],lo:.01,hi:.5,si:'s',rt:'0.01–0.5 s'},R:{lab:'Range R',u:[['m',1],['ft',.3048]],lo:1,hi:60,si:'m',rt:'1–60 m',chk:1,tol:()=>.2},m:{lab:'Mass m',u:[['kg',1],['lb',.45359237]],lo:.1,hi:50,si:'kg',rt:'0.1–50 kg'},T:{lab:'Time of flight T',u:[['s',1]],lo:.1,hi:10,si:'s',rt:'0.1–10 s',chk:1,tol:()=>.03},H:{lab:'Maximum height H',u:[['m',1],['ft',.3048]],lo:.1,hi:50,si:'m',rt:'0.1–50 m',chk:1,tol:()=>.1},KE:{lab:'Kinetic energy KE',u:[['J',1],['kJ',1000]],lo:1,hi:5000,si:'J',rt:'1–5000 J',chk:1,tol:x=>Math.max(.5,.01*x)},p:{lab:'Momentum p',u:[['kg·m/s',1]],lo:1,hi:300,si:'kg·m/s',rt:'1–300 kg·m/s',chk:1,tol:x=>Math.max(.1,.01*x)}};let mis={},lastH=0;let curSol='',lastDiff=0,mode='classic',state='PLAY',pi=0,B=[],bi=0,score=0,cam=0,tcam=0,ch=null,aim=null,force=0,hs=[],parts=[],tick=0;
try{hs=JSON.parse(localStorage.getItem('hs')||'[]')}catch(e){}
const fm=(x,d=3)=>Number(x).toFixed(d);

/* physics */
function model(m,F,dt,th){const v0=F*dt/m,vy=v0*Math.sin(th),t=2*vy/G;return{v0,p:m*v0,KE:.5*m*v0*v0,t,H:vy*vy/(2*G),R:v0*Math.cos(th)*t}}
function reqF(m,d,th,dt){const v=Math.sqrt(d*G/Math.sin(2*th));return{s2:Math.sin(2*th),v,F:m*v/dt}}

/* world */
function genB(){B=[];if(mode==='classic'){B.push({x:80,y:420,w:140,h:180});let lx=80;for(let i=0;i<120;i++){const g=180+Math.random()*100|0,w=110+Math.random()*40|0,h=200+Math.random()*180|0;lx+=g+50;B.push({x:lx,y:H-h,w,h})}}
 else{B.push({x:80,y:400,w:140,h:200});for(let i=1;i<80;i++){const p=B[i-1],d=Math.round((12+Math.random()*12)*10)/10,t=['F','v','th','dt','R','m','T','H','KE','p'][Math.random()*10|0],a=(t==='th'?[20,25,30,35,40]:[30,35,40,45,50,55,60])[Math.random()*(t==='th'?5:7)|0],dt0=Math.round((.2+Math.random()*.25)*100)/100;B.push({x:p.x+d*PPM,y:400,w:140,h:200,d,a,t,dt0})}}}
function spawn(){const R=RO[pi],b=B[bi],rad=36+Math.floor(R.m*3);ch={m:R.m,c:R.c,c2:R.c2,slide:mode==='classic'?R.s:0,rad,x:b.x+b.w/2,y:b.y-rad,vx:0,vy:0,launched:false,sliding:false,dead:0,trail:[]};force=0}
function startRun(i){pi=i;score=0;bi=0;cam=tcam=0;genB();spawn();state='PLAY';$('ov').hidden=true;
 $('pills').innerHTML=RO.map((r,k)=>`<button class="sm ${k===i?'on':''}" data-i="${k}">${r.n}</button>`).join(' ');$('pills').querySelectorAll('button').forEach(b=>b.onclick=()=>startRun(+b.dataset.i));
 if(mode==='trainer'){$('solC').hidden=true;$('cheatD').open=true;$('msg').textContent='';$('out').className='muted';$('out').textContent='Launch to see the numbers computed from your force.';render()}}
function render(){const n=B[bi+1],th=n.a*D2R,m=ch.m,t=n.t,d=n.d,s2=Math.sin(2*th),vq=Math.sqrt(d*G/s2),C=cfg[t];
 const A=['Launch angle θ',n.a+'° = '+fm(th,4)+' rad'],Dd=['Distance to flag d',fm(d,1)+' m'],S1=`sin(2θ) = sin(${2*n.a}°) = ${fm(s2)}<br>`,V1=`v₀ = √(d·g / sin2θ) = √(${fm(d,1)}×9.81/${fm(s2)}) = ${fm(vq)} m/s<br>`;
 let g=[['Mass m',m+' kg'],['Gravity g','9.81 m/s²']],truth,F0=0,sol;
 if(t==='F'){g.push(A,['Contact time Δt',DT+' s'],Dd);truth=m*vq/DT;sol=S1+V1+`F = m·v₀/Δt = ${m}×${fm(vq)}/${DT} = <b>${fm(truth,2)} N</b>`}
 else if(t==='v'){g.push(A,Dd);truth=vq;sol=S1+`v₀ = √(d·g / sin2θ) = √(${fm(d,1)}×9.81/${fm(s2)}) = <b>${fm(vq)} m/s</b>`}
 else if(t==='th'){F0=Math.ceil(m*vq/DT*10)/10;const v0=F0*DT/m,x=d*G/(v0*v0),a2=Math.asin(x);truth=a2/2;g.push(['Applied force F',fm(F0,1)+' N'],['Contact time Δt',DT+' s'],Dd);sol=`v₀ = F·Δt/m = ${fm(F0,1)}×${DT}/${m} = ${fm(v0)} m/s<br>sin2θ = d·g/v₀² = ${fm(d,1)}×9.81/${fm(v0)}² = ${fm(x,4)}<br>2θ = ${fm(a2/D2R,2)}° ⇒ θ = <b>${fm(truth/D2R,2)}°</b> (the other solution ${fm(90-truth/D2R,2)}° lands too)`}
 else if(t==='dt'){F0=Math.round(m*vq/n.dt0*10)/10;truth=m*vq/F0;g.push(['Applied force F',fm(F0,1)+' N'],A,Dd);sol=S1+V1+`Δt = m·v₀/F = ${m}×${fm(vq)}/${fm(F0,1)} = <b>${fm(truth,4)} s</b>`}
 else if(t==='m'){F0=Math.round(m*vq/DT*10)/10;truth=F0*DT/vq;g=g.filter(x=>x[0]!=='Mass m');g.push(['Applied force F',fm(F0,1)+' N'],['Contact time Δt',DT+' s'],A,Dd);sol=S1+V1+`m = F·Δt/v₀ = ${fm(F0,1)}×${DT}/${fm(vq)} = <b>${fm(truth,3)} kg</b>`}
 else{F0=Math.round(m*vq/DT*10)/10;const v0=F0*DT/m,fl=flight(m,v0,th);truth={R:fl.R,T:fl.t,H:fl.H,KE:fl.KE,p:fl.p}[t];g.push(['Applied force F',fm(F0,1)+' N'],['Contact time Δt',DT+' s'],A,Dd);const b=`v₀ = F·Δt/m = ${fm(F0,1)}×${DT}/${m} = ${fm(v0)} m/s<br>`;
  sol=b+({R:S1+`R = v₀²·sin2θ/g = ${fm(v0)}²×${fm(s2)}/9.81 = <b>${fm(fl.R,3)} m</b>`,T:`T = 2·v₀·sinθ/g = 2×${fm(v0)}×sin(${n.a}°)/9.81 = <b>${fm(fl.t,3)} s</b>`,H:`H = (v₀·sinθ)²/2g = (${fm(v0)}×sin(${n.a}°))²/(2×9.81) = <b>${fm(fl.H,3)} m</b>`,KE:`KE = ½·m·v₀² = 0.5×${m}×${fm(v0)}² = <b>${fm(fl.KE,2)} J</b>`,p:`p = m·v₀ = ${m}×${fm(v0)} = <b>${fm(fl.p,3)} kg·m/s</b>`})[t]}
 mis={t,truth,F0};curSol=sol;
 $('given').innerHTML=`<div class="t" style="margin:8px 0 4px">Solve for: ${C.lab}</div><table><tr><th>Given quantity</th><th>Value</th></tr>${g.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}<tr><td><b>Find</b></td><td><b>${C.lab} (${C.si})</b></td></tr></table><div class="muted" style="margin-top:6px">💡 ${({F:'Step 1: use d = v₀²·sin2θ/g to find the speed v₀. Step 2: the push gives the speed, F·Δt = m·v₀, so F = m·v₀/Δt.',v:'Set the range equal to the flag distance, d = v₀²·sin2θ/g, and solve for v₀.',th:'Step 1: v₀ = F·Δt/m. Step 2: put it in d = v₀²·sin2θ/g, solve for sin2θ, take the inverse sine, then halve it.',dt:'Step 1: find v₀ from d = v₀²·sin2θ/g. Step 2: F·Δt = m·v₀, so Δt = m·v₀/F.',R:'Step 1: v₀ = F·Δt/m. Step 2: R = v₀²·sin2θ/g.',m:'Step 1: find v₀ from d = v₀²·sin2θ/g. Step 2: F·Δt = m·v₀, so m = F·Δt/v₀. Use 3 decimals.',T:'Step 1: v₀ = F·Δt/m. Step 2: T = 2·v₀·sinθ/g.',H:'Step 1: v₀ = F·Δt/m. Step 2: H = (v₀·sinθ)²/(2g).',KE:'Step 1: v₀ = F·Δt/m. Step 2: KE = ½·m·v₀².',p:'Step 1: v₀ = F·Δt/m. Step 2: p = m·v₀.'})[t]}</div>`;
 $('Fu').innerHTML=C.u.map(u=>`<option value="${u[1]}">${u[0]}</option>`).join('');$('flab').textContent='Your answer: '+C.lab;$('rng').textContent='Valid range: '+C.rt+' (other units are converted to SI).';
 $('F').value='';$('F').classList.remove('bad');$('err').innerHTML=''}
function flight(m,v0,th){const vy=v0*Math.sin(th);return{p:m*v0,KE:.5*m*v0*v0,t:2*vy/G,H:vy*vy/(2*G),R:v0*v0*Math.sin(2*th)/G}}
function say(t,col){const m=$('msg');m.style.color=col;m.textContent=t}
function over(){state='OVER';hs.push(score);hs.sort((a,b)=>b-a);hs=hs.slice(0,5);try{localStorage.setItem('hs',JSON.stringify(hs))}catch(e){}
 const o=$('ov');o.hidden=false;o.innerHTML=`<h2>GAME OVER</h2><div>Buildings cleared: <b>${score}</b></div><div>🏆 Top 5: ${hs.join(' · ')}</div><button class="on" id="again">Play again</button>`;$('again').onclick=()=>startRun(pi)}
function confetti(x,y){for(let i=0;i<60;i++)parts.push({x,y,vx:(Math.random()-.5)*8,vy:-Math.random()*9-2,l:70+Math.random()*30,c:['#ff4d4d','#ffd23f','#2ee59d','#4d9bff','#c04dff'][i%5]})}
function miss(){if(lastH*PPM>400-ch.rad-SKY)say('✘ Too high: you left the atmosphere zone. Check your angle or speed.','var(--bad)');else say((lastDiff>0?'✘ Overshot by ':'✘ Undershot by ')+fm(Math.abs(lastDiff),2)+' m. Check your calculation and try again.','var(--bad)')}

/* classic physics (port of the tkinter version) */
function lock(b){ch.vx=0;tcam=b.x+b.w/2-160;force=0}
function stepClassic(){const k=ch;k.vy+=0.40;k.x+=k.vx;k.y+=k.vy;if(k.y>H+50||k.y<SKY){over();return}
 for(let i=0;i<B.length;i++){const b=B[i];
  if(b.x-5<=k.x+k.rad&&k.x+k.rad<=b.x+10&&k.y+k.rad>b.y+10)k.vx=-k.vx*.3;
  if(b.x<=k.x&&k.x<=b.x+b.w&&b.y<=k.y+k.rad&&k.y+k.rad<=b.y+16&&k.vy>0){k.y=b.y-k.rad;k.vy=0;k.launched=false;
   if(i>bi){score+=i-bi;bi=i}
   if(Math.abs(k.vx)>.5&&k.slide>0)k.sliding=true;else lock(b);break}}}
/* trainer physics: 40 sub-steps per frame so the landing point is accurate */
function stepTrainer(){const k=ch;if(k.dead>0){if(--k.dead===0)spawn();return}if(!k.launched)return;
 const n=40,df=1/n,g=G*PPM/3600;
 for(let s=0;s<n;s++){k.vy+=g*df;k.x+=k.vx*df;k.y+=k.vy*df;
  if(k.vy>0&&k.y+k.rad>=400&&k.y-k.vy*df+k.rad<400){const bx=B.findIndex(b=>b.x<=k.x&&k.x<=b.x+b.w);
   if(bx>=0){k.y=400-k.rad;k.launched=false;k.vy=0;const f=B[bi+1],off=(k.x-(f.x+f.w/2))/PPM;
    if(bx===bi+1&&Math.abs(off)<=TOL){score++;bi=bx;k.x=f.x+f.w/2;lock(B[bx]);say('✔ Perfect landing! Next mission loaded.','var(--ac)');$('sol').innerHTML=curSol;$('solC').hidden=false;confetti(k.x-cam,k.y+k.rad);render()}
    else{k.vx=0;k.dead=75;miss()}return}}}
 k.trail.push([k.x,k.y]);if(k.trail.length>50)k.trail.shift();
 if(k.y>H+50||k.y<SKY){miss();spawn()}}
function step(){cam+=(tcam-cam)*.08;if(!ch)return;
 if(mode==='trainer')stepTrainer();else{if(ch.launched)stepClassic();else if(ch.sliding){const k=ch,b=B[bi];k.vx*=k.slide;k.x+=k.vx;if(!(b.x<=k.x&&k.x<=b.x+b.w)){k.sliding=false;k.launched=true}else if(Math.abs(k.vx)<.2){k.sliding=false;lock(b)}}}}

/* input */
function launchVel(a,sp){ch.vx=sp*Math.cos(a);ch.vy=sp*Math.sin(a);ch.launched=true}
function pos(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
function aimVec(){const dx=aim.x-(ch.x-cam),dy=aim.y-ch.y;return{ang:Math.atan2(dy,dx),d:Math.hypot(dx,dy)}}
cv.onpointerdown=e=>{if(mode==='classic'&&state==='PLAY'&&!ch.launched&&!ch.sliding){aim=pos(e);cv.setPointerCapture(e.pointerId);force=Math.min(aimVec().d*.75,200)}};
cv.onpointermove=e=>{if(aim){aim=pos(e);force=Math.min(aimVec().d*.75,200)}};
cv.onpointerup=()=>{if(!aim)return;const a=aimVec();aim=null;launchVel(a.ang,Math.min(a.d*.75,200)/ch.m*.42)};
function fire(){if(mode!=='trainer'||state!=='PLAY'||ch.launched||ch.dead)return;
 const nb=B[bi+1],T=mis.t,C=cfg[T],s=$('F').value.trim(),n=Number(s),er=[];let a=0;
 if(s===''||!isFinite(n))er.push(C.lab+' must be a number (got "'+s+'").');
 else{a=n*$('Fu').value;if(a<C.lo||a>C.hi)er.push(C.lab+' = '+a.toPrecision(4)+' '+C.si+' is outside the model range '+C.rt+'.')}
 $('F').classList.toggle('bad',er.length>0);$('err').innerHTML=er.map(e=>'<li>'+e+'</li>').join('');if(er.length)return;
 let v0,th=nb.a*D2R,extra=[];const m=ch.m;
 if(T==='F'){v0=a*DT/m;extra=[['Applied force F',a,'N']]}
 else if(T==='v')v0=a;
 else if(T==='th'){th=a;v0=mis.F0*DT/m}
 else if(T==='dt'){v0=mis.F0*a/m;extra=[['Contact time Δt',a,'s']]}
 else if(T==='m'){v0=mis.F0*DT/a;extra=[['Your mass m',a,'kg']]}
 else{const tl=C.tol(mis.truth);if(Math.abs(a-mis.truth)>tl){say((a>mis.truth?'✘ Overestimated by ':'✘ Underestimated by ')+fm(Math.abs(a-mis.truth),3)+' '+C.si+'. Recheck your calculation; no jump yet.','var(--bad)');return}v0=mis.F0*DT/m;extra=[['Your answer: '+C.lab,a,C.si]]}
 const o=flight(T==='m'?a:m,v0,th);lastDiff=o.R-nb.d;lastH=o.H;
 const rows=[...extra,['Launch speed v₀',v0,'m/s'],['Momentum p = m·v₀ (mass × speed)',o.p,'kg·m/s'],['Kinetic energy KE = ½mv₀²',o.KE,'J'],['Time of flight T = 2v₀sinθ/g',o.t,'s'],['Max height H = (v₀sinθ)²/2g',o.H,'m'],['Predicted range R = v₀²sin2θ/g',o.R,'m'],['Target distance d',nb.d,'m'],['Difference R − d',o.R-nb.d,'m']];
 $('out').className='';$('out').innerHTML='<table>'+rows.map(r=>`<tr><td>${r[0]}</td><td><b>${fm(r[1],4)}</b> ${r[2]}</td></tr>`).join('')+'</table>';
 say('Launched…','var(--mu)');launchVel(-th,v0*PPM/60)}
$('go').onclick=fire;$('F').addEventListener('keydown',e=>{if(e.key==='Enter')fire()});
function setMode(m){mode=m;$('mC').classList.toggle('on',m==='classic');$('mT').classList.toggle('on',m==='trainer');$('tr').hidden=m==='classic';$('helpC').hidden=m==='trainer';startRun(pi);if(m==='trainer')$('cheatD').open=true}
$('mC').onclick=()=>setMode('classic');$('mT').onclick=()=>setMode('trainer');

/* drawing */
function cloud(x,y,s){c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(x,y,22*s,0,7);c.arc(x+26*s,y-10*s,28*s,0,7);c.arc(x+55*s,y,22*s,0,7);c.rect(x,y,55*s,22*s);c.fill()}
function flag(x,y,t){c.strokeStyle='#26323f';c.lineWidth=4;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-80);c.stroke();
 const w=Math.sin(tick/8)*4;c.fillStyle='#ff3b4e';c.beginPath();c.moveTo(x,y-80);c.quadraticCurveTo(x+22,y-86+w,x+44,y-72);c.quadraticCurveTo(x+22,y-62-w,x,y-56);c.fill();
 c.fillStyle='#26323f';c.font='bold 13px Arial';c.textAlign='left';c.fillText(t,x+6,y-90)}
function bld(b,i){const sx=b.x-cam;if(sx<-200||sx>W+200)return;if(skins.building){c.drawImage(skins.building,sx,b.y,b.w,H-b.y);return}
 const g=c.createLinearGradient(sx,b.y,sx+b.w,b.y);g.addColorStop(0,'#4f6b5c');g.addColorStop(1,'#6f917d');c.fillStyle=g;c.fillRect(sx,b.y,b.w,H-b.y);
 c.fillStyle='#2ee59d';c.fillRect(sx-3,b.y-6,b.w+6,8);c.fillStyle='#0a8f4e';c.fillRect(sx-3,b.y,b.w+6,3);
 for(let r=0;r<Math.floor((H-b.y-30)/34);r++)for(let k=0;k<Math.floor((b.w-14)/26);k++){c.fillStyle=((i*7+r*3+k*5)%5<2)?'#ffe58a':'#33465a';c.fillRect(sx+10+k*26,b.y+18+r*34,16,20)}}
function draw(){tick++;c.clearRect(0,0,W,H);if(skins.background)c.drawImage(skins.background,0,0,W,H);else{const sg=c.createLinearGradient(0,0,0,H);sg.addColorStop(0,'#2fcf7f');sg.addColorStop(.7,'#bff3d6');sg.addColorStop(1,'#effff6');c.fillStyle=sg;c.fillRect(0,0,W,H);
 const sun=c.createRadialGradient(850,110,5,850,110,120);sun.addColorStop(0,'#fff6b0');sun.addColorStop(.25,'#ffe45c');sun.addColorStop(1,'rgba(255,228,92,0)');c.fillStyle=sun;c.fillRect(600,0,400,300);
 for(let i=0;i<6;i++){const x=((i*260-cam*.25+tick*.15)%1500+1500)%1500-200;cloud(x,90+(i%3)*55,.8+(i%2)*.4)}}
 c.strokeStyle='#ff3b4e';c.setLineDash([8,6]);c.lineWidth=2;c.beginPath();c.moveTo(0,SKY);c.lineTo(W,SKY);c.stroke();c.setLineDash([]);
 c.fillStyle='#ff3b4e';c.font='bold 10px Arial';c.textAlign='right';c.fillText('OUT OF ATMOSPHERE ZONE',W-15,SKY+14);
 B.forEach(bld);if(!ch)return;const cx=ch.x-cam;
 if(mode==='trainer'){const a=B[bi],n=B[bi+1],x0=a.x+a.w/2-cam,x1=n.x+n.w/2-cam,y=a.y-130;
  const zw=TOL*PPM;c.fillStyle='rgba(255,230,0,.9)';c.fillRect(x1-zw,n.y-8,zw*2,8);c.strokeStyle='#8a4f00';c.lineWidth=1;c.strokeRect(x1-zw,n.y-8,zw*2,8);
  c.strokeStyle='#8a4f00';c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();c.setLineDash([]);
  c.beginPath();c.moveTo(x0,y-8);c.lineTo(x0,y+8);c.moveTo(x1,y-8);c.lineTo(x1,y+8);c.stroke();
  c.fillStyle='rgba(6,16,34,.85)';c.beginPath();c.roundRect((x0+x1)/2-60,y-34,120,26,13);c.fill();c.fillStyle='#ffd166';c.font='bold 16px Arial';c.textAlign='center';c.fillText('d = '+fm(n.d,1)+' m',(x0+x1)/2,y-16);
  flag(x1,n.y,'FLAG')}
 if(aim){const a=aimVec();c.strokeStyle='#16222e';c.lineWidth=2;c.setLineDash([4,3]);c.beginPath();c.moveTo(cx,ch.y);c.lineTo(aim.x,aim.y);c.stroke();c.setLineDash([]);
  let sx=cx,sy=ch.y,sp=Math.min(a.d*.75,200)/ch.m*.42,vx=sp*Math.cos(a.ang),vy=sp*Math.sin(a.ang);c.fillStyle='#ff7a00';
  for(let i=0;i<45;i++){vy+=.4;sx+=vx;sy+=vy;if(sy>H||sy<SKY)break;c.beginPath();c.arc(sx,sy,2.5,0,7);c.fill()}}
 if(ch.trail)ch.trail.forEach((p,i,a)=>{c.fillStyle=`rgba(255,255,255,${i/a.length*.8})`;c.beginPath();c.arc(p[0]-cam,p[1],3+i/a.length*3,0,7);c.fill()});
 if(!ch.launched){c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(cx,B[bi].y,ch.rad*.9,6,0,0,7);c.fill()}
 const bg=c.createRadialGradient(cx-ch.rad*.35,ch.y-ch.rad*.4,3,cx,ch.y,ch.rad);bg.addColorStop(0,'#fff');bg.addColorStop(.25,ch.c);bg.addColorStop(1,ch.c2);
 const sk=skins[['small','medium','large'][pi]+'_'+(ch.launched?'launched':(ch.sliding||score>0)?'landed':'idle')];
 if(sk)c.drawImage(sk,cx-ch.rad,ch.y-ch.rad,ch.rad*2,ch.rad*2);else{c.fillStyle=bg;c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.arc(cx,ch.y,ch.rad,0,7);c.fill();c.stroke()}
  parts=parts.filter(p=>p.l>0);parts.forEach(p=>{p.vy+=.3;p.x+=p.vx;p.y+=p.vy;p.l--;c.fillStyle=p.c;c.fillRect(p.x,p.y,6,6)});
 const hud=(x,y,w,t,col)=>{c.fillStyle='rgba(6,16,34,.8)';c.beginPath();c.roundRect(x,y,w,30,15);c.fill();c.fillStyle=col;c.font='bold 15px Arial';c.textAlign='left';c.fillText(t,x+14,y+20)};
 hud(20,16,150,'SCORE  '+score,'#5dffb0');hud(20,54,250,RO[pi].n,'#7dffa8');
 if(mode==='classic'){c.fillStyle='rgba(6,16,34,.8)';c.beginPath();c.roundRect(W-270,16,250,30,15);c.fill();c.fillStyle='#ff9f1a';c.beginPath();c.roundRect(W-262,23,Math.max(0,force),16,8);c.fill();c.fillStyle='#7dffa8';c.font='bold 13px Arial';c.textAlign='right';c.fillText(fm(force,1)+' N',W-30,36);
  if(!ch.launched&&!ch.sliding&&!aim){c.textAlign='center';c.font='bold 18px Arial';c.fillStyle='#16222e';c.fillText('Click / touch anywhere and drag to aim, then release to jump',W/2,H-24)}
  const nb=B[bi+1];hud(20,92,250,'Next gap: '+(nb.x-(B[bi].x+B[bi].w))+' px','#ffd166')}}
let acc=0,last=performance.now();
function loop(t){acc+=Math.min(t-last,100);last=t;while(acc>=1000/60){if(state==='PLAY')step();acc-=1000/60}draw();requestAnimationFrame(loop)}
const t0=Date.now();setInterval(()=>{const q=((Date.now()-t0)/1000)|0;$('clk').textContent='T+ '+String(q/60|0).padStart(2,'0')+':'+String(q%60).padStart(2,'0')},1000);
['background','building'].concat(['small','medium','large'].flatMap(k=>['idle','launched','landed'].map(x=>k+'_'+x))).forEach(n=>{const im=new Image();im.onload=()=>{if(im.naturalWidth)skins[n]=im};im.src=n+'.png'});
startRun(0);requestAnimationFrame(loop);
