/* gallery.js - halaman galeri */
async function gal(){
  let ps=[];try{ps=await api('photos')}catch(e){}
  $('#gg').innerHTML=ps.map(p=>`<div class="card"><img class="th" src="${p.d}"><div class="row"><a class="btn b" download="zewsnap-${p.id}.png" href="${p.d}">Download</a><button class="btn" onclick="delP(${p.id})">Hapus</button></div></div>`).join('')||'<p>Belum ada foto. Ambil foto pertamamu di booth.</p>';
}
async function delP(id){try{await api('photo_del',{id})}catch(e){toast(e.message)}gal()}
boot().then(ok=>ok&&gal());
