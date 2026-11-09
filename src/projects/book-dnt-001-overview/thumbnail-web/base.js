// Preview mode scales the 1280×720 stage to the window; ?capture (the capture tool) keeps it 1:1.
if(!new URLSearchParams(location.search).has('capture')){
  document.documentElement.classList.add('preview');
  const fit=()=>document.documentElement.style.setProperty('--fit',Math.min(1,(innerWidth-16)/1280,(innerHeight-16)/720));
  addEventListener('resize',fit);fit();
}
