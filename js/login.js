/* login.js - halaman masuk / daftar */
async function auth(reg){
  const u=$('#au').value.trim(),p=$('#ap').value;if(!u||!p)return toast('Isi username dan password');
  try{await api(reg?'register':'login',{u,p})}catch(e){return toast(e.message)}
  location.href='booth.html';
}
document.addEventListener('keydown',e=>{if(e.key=='Enter'&&(e.target.id=='ap'||e.target.id=='au'))auth(0)});
boot();
