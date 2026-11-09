// Preview mode scales the 1280×720 stage to the window; ?capture (the capture tool) keeps it 1:1. Inside the project
// manager's Thumbnail tab (an iframe) the stage fills the frame edge to edge.
if(!new URLSearchParams(location.search).has('capture')){
  document.documentElement.classList.add('preview');
  const framed=window.self!==window.top,gap=framed?0:16;
  const fit=()=>document.documentElement.style.setProperty('--fit',Math.min(framed?4:1,(innerWidth-gap)/1280,(innerHeight-gap)/720));
  addEventListener('resize',fit);fit();
}
