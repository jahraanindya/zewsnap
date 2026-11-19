/* arcade.js - halaman arcade: Apple Catch, Memory Match, Pose Roulette, papan skor */
async function saveScore(g,s){try{await api('score_add',{game:g,score:s})}catch(e){}lb()}
async function lb(){
  let sc=[];try{sc=await api('scores')}catch(e){}
  $('#lb').innerHTML=['Apple Catch','Memory Match'].map(g=>`<b>${g}</b><ol>${sc.filter(x=>x.g==g).sort((a,b)=>b.s-a.s).slice(0,5).map(x=>`<li>${esc(x.u)}: ${x.s}</li>`).join('')||'<li>Belum ada skor</li>'}</ol>`).join('');
}
let ag;
function apple(){
  const cv=$('#ac'),x=cv.getContext('2d');cancelAnimationFrame(ag);
  let s=0,t=30,bx=180,it=[],last=performance.now(),acc=0,lives=3;
  cv.onmousemove=e=>{bx=e.offsetX*360/cv.clientWidth};
  cv.ontouchmove=e=>{e.preventDefault();const r=cv.getBoundingClientRect();bx=(e.touches[0].clientX-r.left)*360/r.width};
  function loop(n){
    const dt=(n-last)/1000;last=n;t-=dt;acc+=dt;
    if(acc>.5){acc=0;it.push({x:Math.random()*330+15,y:-20,v:120+Math.random()*120+(30-t)*4,bad:Math.random()<.25})}
    x.clearRect(0,0,360,420);x.font='34px serif';x.textAlign='center';
    it.forEach(i=>{i.y+=i.v*dt;x.fillText(i.bad?'🐛':'🍎',i.x,i.y)});x.fillText('🧺',bx,405);
    it=it.filter(i=>{if(i.y>375&&i.y<420&&Math.abs(i.x-bx)<35){i.bad?lives--:s++;return false}return i.y<430});
    x.font='bold 18px Fredoka,sans-serif';x.fillStyle='#14213d';x.textAlign='left';x.fillText(`Skor ${s}   Waktu ${Math.max(0,t|0)}   Nyawa ${lives}`,10,24);
    if(t<=0||lives<=0){x.textAlign='center';x.font='bold 28px Fredoka,sans-serif';x.fillText('Selesai! Skor '+s,180,210);saveScore('Apple Catch',s);return}
    ag=requestAnimationFrame(loop);
  }
  ag=requestAnimationFrame(loop);
}
function mem(){
  const E=['🍎','⭐','🎀','🍰','🐦','🪐','💧','🍷'],d=[...E,...E].sort(()=>Math.random()-.5),g=$('#mg');
  let open=[],moves=0,done=0;g.innerHTML='';$('#mm').textContent='Langkah: 0';
  d.forEach(e=>{const b=document.createElement('button');b.className='mc';b.textContent='?';
    b.onclick=()=>{
      if(b.dataset.o||open.length>1)return;b.textContent=e;b.dataset.o=1;open.push(b);
      if(open.length<2)return;
      moves++;$('#mm').textContent='Langkah: '+moves;
      if(open[0].textContent==open[1].textContent){open=[];if(++done==8){saveScore('Memory Match',Math.max(0,100-moves*4));$('#mm').textContent='Selesai dalam '+moves+' langkah!'}}
      else setTimeout(()=>{open.forEach(z=>{z.textContent='?';delete z.dataset.o});open=[]},700);
    };g.append(b)});
}
function roulette(){location.href='booth.html?roulette=1'}
boot().then(ok=>{if(ok){mem();lb()}});
