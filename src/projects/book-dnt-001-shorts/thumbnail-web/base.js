// Preview mode scales the stage to the window; ?capture (the capture tool) keeps it 1:1. Inside the project manager's
// Thumbnail tab (an iframe) the stage fills the frame.
if(!new URLSearchParams(location.search).has('capture')){
  document.documentElement.classList.add('preview');
  const stage=document.getElementById('thumb'),W=stage.offsetWidth,H=stage.offsetHeight;
  const framed=window.self!==window.top,gap=framed?0:16;
  const fit=()=>document.documentElement.style.setProperty('--fit',Math.min(framed?4:1,(innerWidth-gap)/W,(innerHeight-gap)/H));
  addEventListener('resize',fit);fit();
}
