/* admin.js - dashboard admin */
async function admin(){
  let d;try{d=await api('admin_stats')}catch(e){return toast(e.message)}
  $('#st').innerHTML=[['Pengguna',d.users.length],['Foto',d.photos],['Frame',d.frames]].map(([a,b])=>`<div class="card"><h2>${b}</h2>${a}</div>`).join('');
  $('#ut').innerHTML='<table><tr><th>Username</th><th>Role</th><th>Foto</th><th>Skor terbaik</th></tr>'+d.users.map(u=>`<tr><td>${esc(u.u)}</td><td>${u.role}</td><td>${u.photos}</td><td>${esc(u.best||'-')}</td></tr>`).join('')+'</table>';
  $('#sl').innerHTML=d.stickers.map(t=>`<span class="stk" onclick="delStk(${t.id})" title="Klik untuk hapus">${esc(t.e)}</span>`).join('');
}
async function addStk(){const v=$('#ns').value.trim();if(!v)return;try{await api('sticker_add',{e:v});$('#ns').value='';admin()}catch(e){toast(e.message)}}
async function delStk(id){try{await api('sticker_del',{id})}catch(e){toast(e.message)}admin()}
boot().then(ok=>ok&&admin());
