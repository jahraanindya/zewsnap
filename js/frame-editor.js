/* frame-editor.js - deteksi lubang foto dan editor slot (dipakai halaman booth dan frame saya) */
function comps(test,W,H){
  const N=W*H,lab=new Int32Array(N),st=new Int32Array(N),cs=[];let L=0;
  for(let s0=0;s0<N;s0++){
    if(lab[s0]||!test(s0*4))continue;L++;let sp=0,x0=W,y0=H,x1=0,y1=0,ar=0;st[sp++]=s0;lab[s0]=L;
    while(sp){const p=st[--sp],X=p%W,Y=(p/W)|0;ar++;if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y;
      if(X>0&&!lab[p-1]&&test((p-1)*4)){lab[p-1]=L;st[sp++]=p-1}
      if(X<W-1&&!lab[p+1]&&test((p+1)*4)){lab[p+1]=L;st[sp++]=p+1}
      if(Y>0&&!lab[p-W]&&test((p-W)*4)){lab[p-W]=L;st[sp++]=p-W}
      if(Y<H-1&&!lab[p+W]&&test((p+W)*4)){lab[p+W]=L;st[sp++]=p+W}}
    cs.push({l:L,x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,a:ar});
  }
  return {lab,cs};
}
const okC=(k,W,H)=>k.a>W*H*.008&&k.x>0&&k.y>0&&k.x+k.w<W&&k.y+k.h<H;
const mkMask=(lab,l,N)=>{const m=new Uint8Array(N);for(let p=0;p<N;p++)if(lab[p]==l)m[p]=1;return m};
const ED={};
function detect(tol){
  const {c,W,H}=ED,N=W*H,px=c.getContext('2d').getImageData(0,0,W,H).data;
  const near=t=>i=>px[i+3]>200&&Math.abs(px[i]-t[0])+Math.abs(px[i+1]-t[1])+Math.abs(px[i+2]-t[2])<=tol;
  const tests=[i=>px[i+3]<128,near([0,0,0]),near([0,255,0]),near([255,0,255]),near([255,255,255])];
  for(let t=0;t<tests.length;t++){
    const r=comps(tests[t],W,H),cs=r.cs.filter(k=>okC(k,W,H)&&(t<4||k.a<N*.35));
    if(cs.length)return cs.map(k=>({x:k.x,y:k.y,w:k.w,h:k.h,m:mkMask(r.lab,k.l,N)}));
  }
  return [];
}
function clearM(px,m0,W,H){
  const N=W*H,m=m0.slice();
  for(let it=0;it<2;it++){const m2=m.slice();for(let p=0;p<N;p++){if(m[p])continue;const i=p*4;
    if(px[i]+px[i+1]+px[i+2]>420||Math.max(px[i],px[i+1],px[i+2])-Math.min(px[i],px[i+1],px[i+2])>40)continue;
    const X=p%W;if((X>0&&m[p-1])||(X<W-1&&m[p+1])||(p>=W&&m[p-W])||(p<N-W&&m[p+W]))m2[p]=1}m.set(m2)}
  for(let p=0;p<N;p++)if(m[p])px[p*4+3]=0;
}
async function openEd(file,after){
  const src=await new Promise(r=>{const a=new FileReader();a.onload=()=>r(a.result);a.readAsDataURL(file)});
  const im=await loadImg(src),sc=Math.min(1,1800/Math.max(im.width,im.height)),W=Math.round(im.width*sc),H=Math.round(im.height*sc);
  const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d',{willReadFrequently:true}).drawImage(im,0,0,W,H);
  Object.assign(ED,{c,W,H,after,name:file.name.replace(/\.\w+$/,''),sl:[]});
  $('#etol').value=60;$('#ed').style.display='flex';redetect();
}
function redetect(){ED.tol=+$('#etol').value;ED.sl=detect(ED.tol);drawEd()}
function drawEd(){
  const {c,W,H,sl}=ED,v=$('#edc');v.width=W;v.height=H;const x=v.getContext('2d'),k=W/(v.clientWidth||W);
  x.drawImage(c,0,0);x.lineWidth=3*k;x.setLineDash([8*k,5*k]);x.textAlign='center';x.textBaseline='middle';
  sl.forEach((s,i)=>{x.strokeStyle='#ff2d95';x.fillStyle='rgba(255,45,149,.18)';x.fillRect(s.x,s.y,s.w,s.h);x.strokeRect(s.x,s.y,s.w,s.h);
    const h=22*k;x.fillStyle='#ff2d95';x.fillRect(s.x+s.w-h,s.y,h,h);x.fillRect(s.x+s.w-h,s.y+s.h-h,h,h);
    x.fillStyle='#fff';x.font='bold '+14*k+'px sans-serif';x.fillText('✕',s.x+s.w-h/2,s.y+h/2);x.fillText('↘',s.x+s.w-h/2,s.y+s.h-h/2);
    x.font='bold '+Math.min(60*k,s.h/3)+'px sans-serif';x.fillStyle='#ff2d95';x.fillText(i+1,s.x+s.w/2,s.y+s.h/2)});
  x.setLineDash([]);$('#ecnt').textContent=sl.length+' slot foto';
}
function addAt(p){
  const {c,W,H}=ED,tol=ED.tol,x0=p.x|0,y0=p.y|0,px=c.getContext('2d').getImageData(0,0,W,H).data,s=(y0*W+x0)*4,t=[px[s],px[s+1],px[s+2],px[s+3]];
  const ok=i=>t[3]<128?px[i+3]<128:(px[i+3]>200&&Math.abs(px[i]-t[0])+Math.abs(px[i+1]-t[1])+Math.abs(px[i+2]-t[2])<=tol);
  const r=comps(ok,W,H),k=r.cs.find(q=>q.l==r.lab[y0*W+x0]);
  if(k&&k.a>W*H*.004&&k.a<W*H*.6&&k.x>0&&k.y>0&&k.x+k.w<W&&k.y+k.h<H)ED.sl.push({x:k.x,y:k.y,w:k.w,h:k.h,m:mkMask(r.lab,k.l,W*H)});
  else{const w=W*.4|0,h=w*.75|0;ED.sl.push({x:Math.max(0,Math.min(W-w,x0-w/2|0)),y:Math.max(0,Math.min(H-h,y0-h/2|0)),w,h,m:null})}
  drawEd();
}
(()=>{
  let dr=null;const ev=()=>$('#edc');
  const pt=e=>{const v=ev(),r=v.getBoundingClientRect();return {x:(e.clientX-r.left)*v.width/r.width,y:(e.clientY-r.top)*v.height/r.height,k:v.width/r.width}};
  document.addEventListener('pointerdown',e=>{
    if(e.target!==ev())return;const p=pt(e),h=22*p.k,sl=ED.sl;
    for(let i=sl.length-1;i>=0;i--){const s=sl[i];
      if(p.x>s.x+s.w-h&&p.x<s.x+s.w&&p.y>s.y&&p.y<s.y+h){sl.splice(i,1);return drawEd()}
      if(p.x>s.x+s.w-h&&p.x<s.x+s.w&&p.y>s.y+s.h-h&&p.y<s.y+s.h){dr={s,t:'r'};ev().setPointerCapture(e.pointerId);return}
      if(p.x>s.x&&p.x<s.x+s.w&&p.y>s.y&&p.y<s.y+s.h){dr={s,t:'m',dx:p.x-s.x,dy:p.y-s.y};ev().setPointerCapture(e.pointerId);return}}
    addAt(p);
  });
  document.addEventListener('pointermove',e=>{
    if(!dr)return;const p=pt(e),s=dr.s;s.m=null;
    if(dr.t=='m'){s.x=Math.max(0,Math.min(ED.W-s.w,p.x-dr.dx))|0;s.y=Math.max(0,Math.min(ED.H-s.h,p.y-dr.dy))|0}
    else{s.w=Math.max(30,Math.min(ED.W-s.x,p.x-s.x))|0;s.h=Math.max(30,Math.min(ED.H-s.y,p.y-s.y))|0}drawEd();
  });
  document.addEventListener('pointerup',()=>dr=null);
})();
async function saveEd(){
  const {c,W,H,sl}=ED;
  if(!sl.length&&!confirm('Belum ada slot foto. Simpan sebagai frame biasa (tanpa lubang)?'))return;
  const x=c.getContext('2d'),id=x.getImageData(0,0,W,H),px=id.data;
  sl.forEach(s=>{if(s.m)clearM(px,s.m,W,H);else for(let yy=s.y;yy<s.y+s.h;yy++)for(let xx=s.x;xx<s.x+s.w;xx++)px[(yy*W+xx)*4+3]=0});
  x.putImageData(id,0,0);
  const slots=sl.map(s=>({x:s.x,y:s.y,w:s.w,h:s.h})).sort((a,b)=>(a.y+a.h/2)-(b.y+b.h/2)||a.x-b.x);
  toast('Menyimpan frame...');
  try{const f=await api('frame_add',{name:ED.name,data:c.toDataURL('image/png'),w:W,h:H,slots});$('#ed').style.display='none';toast(slots.length+' slot foto tersimpan');ED.after&&ED.after(f)}
  catch(e){toast(e.message)}
}
document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="ed"><div class="card" style="max-width:900px;width:100%;max-height:94vh;overflow:auto"><h2>Atur slot foto</h2>
<p>Kotak merah muda = tempat foto. Klik area kosong untuk menambah slot, seret kotak untuk memindah, tarik pojok kanan-bawah untuk mengubah ukuran, klik ✕ untuk menghapus.</p>
<div class="row"><label>Toleransi warna <input type="range" id="etol" min="20" max="200" value="60" onchange="redetect()"></label><b id="ecnt"></b></div>
<canvas id="edc"></canvas>
<div class="row"><button class="btn" onclick="saveEd()">Simpan frame</button><button class="btn y" onclick="$('#ed').style.display='none'">Batal</button></div></div></div>`);
