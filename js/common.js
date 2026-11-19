/* common.js - dipakai semua halaman: helper, panggilan API, menu atas, cek login */
const $=s=>document.querySelector(s),sleep=t=>new Promise(r=>setTimeout(r,t));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',2200)};
const loadImg=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=s});
const IC={},cimg=async u=>IC[u]||(IC[u]=await loadImg(u));
const api=async(r,body)=>{
  const o=body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};
  const x=await fetch('api/index.php?r='+r,o),j=await x.json().catch(()=>({error:'Respon server tidak valid'}));
  if(!x.ok){const e=new Error(j.error||'Terjadi kesalahan');e.status=x.status;throw e}return j;
};

let me=null;
function nav(){
  const L=[['booth.html','Booth'],['frames.html','Frame saya'],['gallery.html','Galeri'],['arcade.html','Arcade']];
  if(me&&me.role=='admin')L.push(['admin.html','Admin']);
  const cur=location.pathname.split('/').pop()||'index.html';
  $('#nv').innerHTML=me?L.map(([h,t])=>`<a href="${h}"${h==cur?' class="on"':''}>${t}</a>`).join('')+`<a href="#" onclick="logout();return false">Keluar (${esc(me.username)})</a>`:`<a href="login.html">Masuk</a>`;
}
async function logout(){try{await api('logout',{})}catch(e){}location.href='index.html'}
// Dipanggil tiap halaman: cek sesi, arahkan ke login bila perlu, lalu tampilkan menu
async function boot(){
  try{me=await api('me')}catch(e){me=null}
  const need=document.body.dataset.need,pg=document.body.dataset.page;
  if(need&&!me){location.replace('login.html');return false}
  if(need=='admin'&&me.role!='admin'){location.replace('booth.html');return false}
  if(pg=='login'&&me){location.replace('booth.html');return false}
  const m=$('#mqt');if(m)m.innerHTML+=m.innerHTML;
  nav();return true;
}
