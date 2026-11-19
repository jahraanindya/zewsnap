/* booth.js - halaman booth: langkah strip, frame, filter, kamera, foto, retake, stiker */
const FILTERS={'Normal':'none','Cool Blue':'saturate(1.2) sepia(.3) hue-rotate(170deg)','Cherry Pop':'saturate(1.7) contrast(1.1) sepia(.2) hue-rotate(-15deg)','Vintage Cream':'sepia(.6) contrast(.9) brightness(1.1)','B&W lembut':'grayscale(1) contrast(1.1)'};
const BF={apple:['#2f6fe4','🍎','Apple Blue'],star:['#fff3c4','⭐','Star Cream'],dot:['#e63222','💙','Cherry Dot'],plain:['#ffffff','','Putih polos']};
let stream=null,shots=[],stk='',pose='',FR=[],step=1,maxS=1,busy=false,chosen={m:0,f:0},PL=[];
function curFr(){const v=$('#fr').value;return v&&v.startsWith('u:')?FR.find(f=>f.id==v.slice(2)):null}
function nShots(){const f=curFr();return f&&f.holes&&f.holes.length?f.holes.length:+$('#mode').value}
async function refreshFr(){
  try{FR=await api('frames')}catch(e){FR=[]}
  $('#fr').innerHTML=Object.entries(BF).map(([k,v])=>`<option value="b:${k}">${v[2]}</option>`).join('')+FR.map(f=>`<option value="u:${f.id}">${esc(f.n)}</option>`).join('');
  $('#frs').innerHTML=Object.entries(BF).map(([k,v])=>`<button class="frb" data-v="b:${k}" onclick="pickFr('b:${k}')"><span class="sw" style="background:${v[0]}"></span>${v[2]}</button>`).join('')+FR.map(f=>`<button class="frb" data-v="u:${f.id}" onclick="pickFr('u:${f.id}')"><img class="sw" src="${f.d}">${esc(f.n)}</button>`).join('');
}
function bUp(){const f=$('#bf').files[0];if(!f||!f.type.startsWith('image/'))return toast('Pilih gambar frame dulu');openEd(f,async fr=>{$('#bf').value='';await refreshFr();pickFr('u:'+fr.id)})}
async function composeT(f){
  const c=$('#out'),x=c.getContext('2d');c.width=f.w;c.height=f.h;x.fillStyle='#fff';x.fillRect(0,0,f.w,f.h);
  f.holes.forEach((h,i)=>{const s=shots[i];
    if(s){const k=Math.max(h.w/s.width,h.h/s.height),sw=h.w/k,sh=h.h/k;x.drawImage(s,(s.width-sw)/2,(s.height-sh)/2,sw,sh,h.x,h.y,h.w,h.h)}
    else{x.fillStyle='#cfe8ff';x.fillRect(h.x,h.y,h.w,h.h);x.fillStyle='#14213d';x.font='bold '+Math.max(16,h.h/6|0)+'px Fredoka,sans-serif';x.textAlign='center';x.fillText('foto '+(i+1),h.x+h.w/2,h.y+h.h/2);x.textAlign='left'}});
  x.drawImage(await cimg(f.d),0,0,f.w,f.h);drawPL(x);
}
function thumb(s){const c=document.createElement('canvas');c.width=96;c.height=72;c.getContext('2d').drawImage(s,0,0,96,72);return c.toDataURL('image/jpeg',.6)}
async function retake(i){
  if(busy)return;busy=true;upd();$('#prompt').textContent='Retake foto '+(i+1);
  await count(3);shots[i]=grab();busy=false;$('#prompt').textContent='Selesai! Simpan atau download hasilnya.';upd();compose();
}
function flash(){
  const f=$('#fl');f.style.opacity=1;setTimeout(()=>f.style.opacity=0,120);
  try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=900;
    g.gain.setValueAtTime(.15,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.12);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.13)}catch(e){}
}
function confetti(){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  for(let i=0;i<28;i++){const e=document.createElement('span');e.className='cf';e.textContent=['🍎','⭐','🎀','✨','💙'][i%5];
    e.style.cssText=`left:${Math.random()*100}vw;animation-delay:${Math.random()*.4}s;font-size:${18+Math.random()*18}px`;document.body.append(e);setTimeout(()=>e.remove(),2300)}
}
function printAnim(){const o=$('#out');o.classList.remove('prt');void o.offsetWidth;o.classList.add('prt')}
function addPL(e){PL.push({e,fx:.5,fy:.5,s:.16});compose()}
function drawPL(x){const c=x.canvas;PL.forEach(p=>{x.font=(p.s*c.width)+'px serif';x.textAlign='center';x.textBaseline='middle';x.fillText(p.e,p.fx*c.width,p.fy*c.height)});x.textAlign='left';x.textBaseline='alphabetic'}
function bindStk(){
  const o=$('#out');let dg=null,raf=0;
  const pos=e=>{const r=o.getBoundingClientRect();return {X:(e.clientX-r.left)*o.width/r.width,Y:(e.clientY-r.top)*o.height/r.height,fx:(e.clientX-r.left)/r.width,fy:(e.clientY-r.top)/r.height}};
  const hit=e=>{const q=pos(e);for(let i=PL.length-1;i>=0;i--){const p=PL[i],h=p.s*o.width/2;if(Math.abs(q.X-p.fx*o.width)<h&&Math.abs(q.Y-p.fy*o.height)<h)return i}return -1};
  const redraw=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;compose()})};
  o.onpointerdown=e=>{const i=hit(e);if(i<0)return;dg=PL[i];PL.push(PL.splice(i,1)[0]);o.setPointerCapture(e.pointerId);e.preventDefault()};
  o.onpointermove=e=>{if(!dg)return;const q=pos(e);dg.fx=q.fx;dg.fy=q.fy;redraw()};
  o.onpointerup=()=>dg=null;
  o.ondblclick=e=>{const i=hit(e);if(i>=0){PL.splice(i,1);compose()}};
  o.onwheel=e=>{const i=hit(e);if(i<0)return;e.preventDefault();PL[i].s=Math.max(.05,Math.min(.6,PL[i].s*(e.deltaY<0?1.1:.9)));redraw()};
}
async function booth(){
  try{FR=await api('frames')}catch(e){FR=[]}
  $('#fr').innerHTML=Object.entries(BF).map(([k,v])=>`<option value="b:${k}">${v[2]}</option>`).join('')+FR.map(f=>`<option value="u:${f.id}">${esc(f.n)}</option>`).join('');
  $('#frs').innerHTML=Object.entries(BF).map(([k,v])=>`<button class="frb" data-v="b:${k}" onclick="pickFr('b:${k}')"><span class="sw" style="background:${v[0]}"></span>${v[2]}</button>`).join('')+FR.map(f=>`<button class="frb" data-v="u:${f.id}" onclick="pickFr('u:${f.id}')"><img class="sw" src="${f.d}">${esc(f.n)}</button>`).join('');
  $('#fls').innerHTML=Object.keys(FILTERS).map((k,i)=>`<button class="frb${i?'':' on'}" onclick="pickFlt(${i},this)">${k}</button>`).join('');
  $('#opts').innerHTML=[[1,'Foto tunggal','▭'],[3,'Strip 3 foto','▯▯▯'],[4,'Strip 4 foto','▯▯▯▯']].map(([v,t,i])=>`<div class="opt" data-v="${v}" onclick="pickMode(${v})"><div><b>${i}</b>${t}</div></div>`).join('');
  chosen={m:0,f:0};maxS=1;shots=[];busy=false;PL=[];$('#flt').value='Normal';$('#vid').style.filter='none';$('#n2').disabled=true;
  await stks();setStep(1);
}
async function stks(){
  let ss=[];try{ss=await api('stickers')}catch(e){}
  $('#sts').innerHTML='<span>Stiker:</span>'+ss.map(t=>`<span class="stk" onclick="addPL('${t.e}')">${t.e}</span>`).join('');
}
function pickMode(v){$('#mode').value=v;chosen.m=1;shots=[];document.querySelectorAll('.opt').forEach(e=>e.classList.toggle('on',e.dataset.v==v));setStep(2)}
function pickFr(v){$('#fr').value=v;chosen.f=1;document.querySelectorAll('#frs .frb').forEach(e=>e.classList.toggle('on',e.dataset.v==v));$('#n2').disabled=false;compose()}
function pickFlt(i,b){const k=Object.keys(FILTERS)[i];$('#flt').value=k;shots=[];$('#vid').style.filter=FILTERS[k];document.querySelectorAll('#fls .frb').forEach(e=>e.classList.toggle('on',e===b))}
async function cam(){
  if(stream)return;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480}});$('#vid').srcObject=stream;$('#err').textContent=''}
  catch(e){$('#err').textContent='Kamera tidak bisa diakses. Izinkan kamera dan buka lewat localhost atau HTTPS.'}
}
async function setStep(n){
  if(busy)return;
  if(n>=2&&!chosen.m)n=1;if(n>=3&&!chosen.f)n=2;
  step=n;maxS=Math.max(maxS,n);
  $('#p1').style.display=n==1?'block':'none';$('#p2').style.display=n==2?'grid':'none';$('#p34').style.display=n>=3?'grid':'none';
  if(n==2){$('#pv2').append($('#out'));compose()}
  if(n>=3){$('#pv4').append($('#out'));$('#c3').style.display=n==3?'block':'none';$('#c4').style.display=n==4?'block':'none';$('#sn').style.display=n==4?'inline-block':'none';$('#vid').style.filter=FILTERS[$('#flt').value];await cam();compose()}
  upd();
}
function upd(){
  $('#stp').innerHTML=['Strip','Frame','Filter','Foto'].map((t,i)=>`<button class="btn ${step==i+1?'y':'b'}" ${i+1>maxS||busy?'disabled':''} onclick="setStep(${i+1})">${i+1}. ${t}</button>`).join('');
  const r=shots.length>0;$('#sn').textContent=r?'🔁 Retake semua':'📸 Mulai foto';$('#rb').style.display=r?'flex':'none';
  $('#rtk').innerHTML=shots.map((s,i)=>`<div style="text-align:center"><img src="${thumb(s)}" style="width:96px;border:2px solid var(--ink);border-radius:6px;display:block"><button class="btn y" style="padding:2px 10px;margin-top:4px" ${busy?'disabled':''} onclick="retake(${i})">Retake</button></div>`).join('');
  $('#sum').textContent=(curFr()&&curFr().holes&&curFr().holes.length?curFr().holes.length+' foto (ikut template)':$('#mode').selectedOptions[0].text)+' · '+($('#fr').selectedOptions[0]?$('#fr').selectedOptions[0].text:'')+' · '+$('#flt').value;
}
async function count(s){for(let i=s;i>0;i--){$('#cnt').textContent=i;await sleep(1000)}flash();$('#cnt').textContent='📸';await sleep(200);$('#cnt').textContent=''}
function grab(){
  const c=document.createElement('canvas');c.width=640;c.height=480;const x=c.getContext('2d'),v=$('#vid');
  x.filter=FILTERS[$('#flt').value];x.save();x.translate(640,0);x.scale(-1,1);x.drawImage(v,0,0,640,480);x.restore();x.filter='none';
    return c;
}
async function snap(){
  if(!stream)return toast('Kamera belum aktif');
  busy=true;upd();$('#sn').disabled=true;shots=[];const n=nShots();
  $('#prompt').textContent=pose?'Pose: '+pose:'';
  for(let i=0;i<n;i++){$('#prompt').textContent=(pose?'Pose: '+pose+' · ':'')+'Foto '+(i+1)+' dari '+n;await count(pose?5:3);shots.push(grab());compose()}
  confetti();printAnim();pose='';$('#prompt').textContent='Selesai! Simpan atau download hasilnya.';$('#sn').disabled=false;busy=false;upd();compose();
}
async function compose(){
  const f0=curFr();if(f0&&f0.holes&&f0.holes.length)return composeT(f0);
  const n=shots.length||nShots(),W=440,H=n*320+70,c=$('#out'),x=c.getContext('2d');
  c.width=W;c.height=H;const v=$('#fr').value||'b:apple';
  const b=v.startsWith('b:')?BF[v.slice(2)]:BF.plain;
  x.fillStyle=b[0];x.fillRect(0,0,W,H);x.font='18px serif';
  if(b[1])for(let y=20;y<H;y+=34){x.fillText(b[1],2,y+4);x.fillText(b[1],W-20,y+4)}
  for(let i=0;i<n;i++){const y=20+i*320;x.fillStyle='#fff';x.fillRect(16,y-4,408,308);if(shots[i])x.drawImage(shots[i],20,y,400,300);else{x.fillStyle='#cfe8ff';x.fillRect(20,y,400,300);x.font='60px serif';x.fillStyle='#14213d';x.fillText('📷',190,y+170)}}
  if(v.startsWith('u:')){const f=FR.find(f=>f.id==v.slice(2));if(f)x.drawImage(await cimg(f.d),0,0,W,H)}
  x.font='bold 24px Fredoka,sans-serif';x.fillStyle=(b[0]=='#e63222'||b[0]=='#2f6fe4')?'#fff':'#14213d';x.fillText('Zewsnap! 🍎  '+new Date().toLocaleDateString('id-ID'),20,n*320+42);
  drawPL(x);
}
async function save(){
  if(!shots.length)return toast('Ambil foto dulu');
  const f=curFr();try{await api('photo_add',{data:$('#out').toDataURL('image/png'),frame_id:f?f.id:null});toast('Tersimpan di galeri')}catch(e){toast(e.message)}
}

async function initBooth(){
  document.fonts&&document.fonts.load('bold 26px Fredoka');
  $('#flt').innerHTML=Object.keys(FILTERS).map(k=>`<option>${k}</option>`).join('');
  bindStk();
  await booth();
  // Dari Arcade > Pose Roulette: langsung jepret satu foto dengan pose acak
  if(new URLSearchParams(location.search).get('roulette')){
    const P=['pose paling sok cool','ekspresi kaget','pura-pura jadi apel','senyum paling lebar','pose detektif','ekspresi lagi laper'];
    pose=P[Math.random()*P.length|0];$('#mode').value=1;chosen={m:1,f:1};maxS=4;shots=[];await setStep(4);snap();
  }
}
boot().then(ok=>ok&&initBooth());
