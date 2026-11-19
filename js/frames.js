/* frames.js - halaman frame saya */
function upFrame(){const f=$('#ff').files[0];if(!f||!f.type.startsWith('image/'))return toast('Pilih file gambar');openEd(f,()=>{$('#ff').value='';frames()})}
async function frames(){
  let fs=[];try{fs=(await api('frames')).filter(f=>f.own)}catch(e){}
  $('#fg').innerHTML=fs.map(f=>`<div class="card"><img class="th" style="background:#cfe8ff" src="${f.d}"><b>${esc(f.n)}</b> <small>(${f.holes&&f.holes.length?f.holes.length+' lubang foto':'frame biasa'})</small><div class="row"><button class="btn" onclick="delF(${f.id})">Hapus</button></div></div>`).join('')||'<p>Belum ada frame. Upload frame pertamamu.</p>';
}
async function delF(id){try{await api('frame_del',{id})}catch(e){toast(e.message)}frames()}
boot().then(ok=>ok&&frames());
