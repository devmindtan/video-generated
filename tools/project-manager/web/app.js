/* Local workspace UI. All source text is rendered as text, never executable HTML. */
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const iconPaths={back:'M19 12H5 M11 6l-6 6 6 6',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',list:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',book:'M12 5C8 2 4 3 2 4v16c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1v16',play:'m9 5 10 7-10 7Z',image:'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M8 7h.01',arrow:'M7 17 17 7 M7 7h10v10',plus:'M12 5v14 M5 12h14',search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',folder:'M3 7V4h6l2 3h10v13H3z',refresh:'M20 7A9 9 0 1 0 21 15 M20 2v6h-6',menu:'M3 6h18 M3 12h18 M3 18h18',close:'M6 6l12 12 M18 6 6 18',channel:'M4 5h16v14H4z M8 9h8 M8 13h5',spark:'m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z',mic:'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3',music:'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',pause:'M7 5h3v14H7z M14 5h3v14h-3z'};
function icon(name){return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${iconPaths[name]||iconPaths.folder}"/></svg>`;}
function dirtyNotes(){
  if(!state.drawer||$('#drawer').hidden)return false;
  if(state.drawer.workflow)return Boolean($('#workflow-rules'))&&($('#workflow-rules').value!==state.drawer.rulesText||$('#workflow-notes').value!==state.drawer.notes);
  return Boolean(!state.drawer.book&&$('#notes-text')&&state.drawer.notes!==$('#notes-text').value);
}
function canLeaveNotes(){return !dirtyNotes()||confirm('Ghi chú chưa được lưu. Bạn có muốn rời hồ sơ này?');}
function setMenu(open){$('#sidebar').classList.toggle('open',open);$('#menu-backdrop').hidden=!open;$('.workspace').inert=open||!$('#drawer').hidden;$('#mobile-menu').setAttribute('aria-expanded',String(open));document.body.classList.toggle('overlay-open',open||!$('#drawer').hidden);if(open)$('#close-mobile-menu').focus();}
const params=new URLSearchParams(location.search);
const resourceViews={voices:'Giọng đọc',music:'Nhạc nền & hiệu ứng'};
const viewOf=value=>value==='books'||resourceViews[value]?value:'projects';
const state={data:null,channel:params.get('channel')||'',series:params.get('series')||'',view:viewOf(params.get('view')),
  query:params.get('q')||'',status:params.get('status')||'',sort:params.get('sort')||'recent',limit:12,layout:params.get('layout')==='list'?'list':'grid',drawer:null,documentRequest:0,createMode:'project'};
let toastTimer,searchTimer,refreshing=false,focusBeforeDrawer;
const statusNames={existing:'Đã có bản dựng',planning:'Đang chuẩn bị',production:'Đang sản xuất'};
const bookStatusNames={'awaiting-source':'Chờ tài liệu','source-ingested':'Đã nạp nguồn, chưa đọc',research:'Đang nghiên cứu'};
// Declared before the first refresh(), which polls VoiceStudio while the script is still loading.
const vsLabels={ready:'Đang chạy',starting:'Đang khởi động',stopping:'Đang tắt…',off:'Đã tắt',occupied:'Cổng 3900 bị ứng dụng khác chiếm',missing:'Chưa cài đủ',unknown:'Không đọc được trạng thái'};
let vsTimer=null;
const gb=bytes=>`${(bytes/1073741824).toLocaleString('vi-VN',{maximumFractionDigits:1})} GB`;
const stepModes={agent:'Agent soạn nháp','operator-task':'Bạn chạy công cụ',check:'Kiểm tra',gate:'Bạn duyệt',manual:'Thủ công'};
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
async function api(url,body){
  const options=body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Workspace-Token':state.data?.token||''},body:JSON.stringify(body)};
  const response=await fetch(url,options);let data;
  try{data=await response.json();}catch{throw new Error('Không đọc được phản hồi. Hãy kiểm tra trang quản lý còn chạy.');}
  if(!response.ok)throw new Error(data.error||'Không thể thực hiện thao tác.');
  return data;
}
function studio(id){return `http://localhost:3000/${encodeURIComponent(id)}`;}
function duration(value){if(value==null)return 'Chưa chốt';const seconds=Math.round(value);return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
let routeIndex=history.state?.workspaceIndex||0,skipRoutePop=false,routeRequest=0;
history.replaceState({...history.state,workspaceIndex:routeIndex},'',location.href);
function recordRoute(url,push=false){
  const next=new URL(url,location.origin);if(next.href===location.href)return;
  if(push){routeIndex++;history.pushState({workspaceIndex:routeIndex},'',next);}else history.replaceState({workspaceIndex:routeIndex},'',next);
}
function collectionUrl({channel='',series='',view='projects'}={}){const p=new URLSearchParams();if(channel)p.set('channel',channel);if(series)p.set('series',series);if(view!=='projects')p.set('view',view);return '/'+(p.size?'?'+p:'');}
function updateUrl(push=false){const p=new URLSearchParams();if(state.channel)p.set('channel',state.channel);if(state.series)p.set('series',state.series);if(state.query)p.set('q',state.query);if(state.status)p.set('status',state.status);if(state.sort!=='recent')p.set('sort',state.sort);if(state.layout==='list')p.set('layout','list');if(state.view!=='projects')p.set('view',state.view);recordRoute(`${location.pathname}${p.size?'?'+p:''}${location.hash}`,push);}
function hideDrawer(){state.documentRequest++;routeRequest++;$('#drawer').hidden=true;setPageMode(false);$('#drawer-backdrop').hidden=true;state.drawer=null;document.body.classList.remove('overlay-open');$('.workspace').inert=false;$('#sidebar').inert=false;}
function navigate({channel='',series='',view='projects'}={}){
  if(!canLeaveNotes())return;hideDrawer();setMenu(false);
  const owner=state.data.series.find(s=>s.id===series);state.channel=owner?.channel||channel;state.series=owner?.id||'';state.view=view;state.limit=12;state.query='';state.status='';
  $('#search').value='';$('#status-filter').value='';recordRoute(collectionUrl(state),true);render();window.scrollTo(0,0);
}
function breadcrumbs(drawer=false){
  const detail=drawer?state.drawer:null;
  const series=state.data.series.find(s=>s.id===(detail?.series||state.series));
  const channel=state.data.channels.find(c=>c.id===(series?.channel||detail?.channel||state.channel));
  const entries=[{title:'Tổng quan',url:'/'}];
  if(channel)entries.push({title:channel.title,url:collectionUrl({channel:channel.id})});
  if(series)entries.push({title:series.title,url:collectionUrl({channel:channel?.id,series:series.id})});
  if(detail?.book||(!detail&&state.view==='books'))entries.push({title:'Tủ sách',url:collectionUrl({channel:channel?.id,series:series?.id,view:'books'})});
  if(!detail&&resourceViews[state.view])entries.push({title:resourceViews[state.view]});
  if(detail){const book=detail.book&&state.data.books.find(b=>b.id===detail.id&&b.series===detail.series);entries.push({title:book?.title||detail.title});}
  return '<ol>'+entries.map((e,i)=>`<li>${i===entries.length-1?`<span aria-current="page">${esc(e.title)}</span>`:`<a href="${esc(e.url)}" data-route>${esc(e.title)}</a>`}</li>`).join('')+'</ol>';
}
function renderBreadcrumbs(){
  $('#breadcrumb').innerHTML=breadcrumbs();if(state.drawer)$('#drawer-breadcrumb').innerHTML=breadcrumbs(true);
  $('#back-button').disabled=routeIndex===0&&!state.channel&&!state.series&&state.view==='projects';
}
function back(){
  if(routeIndex>0){history.back();return;}
  if(state.drawer?.book){navigate({series:state.drawer.series,view:'books'});return;}
  if(state.drawer){navigate({series:state.drawer.series});return;}
  if(state.view==='books'&&state.series){navigate({series:state.series});return;}
  if(state.series){navigate({channel:state.data.series.find(s=>s.id===state.series)?.channel||state.channel});return;}navigate();
}
async function restoreRoute(event){
  if(skipRoutePop){skipRoutePop=false;return;}
  const next=event.state?.workspaceIndex||0;
  if(!canLeaveNotes()){skipRoutePop=true;history.go(routeIndex-next);return;}
  routeIndex=next;hideDrawer();setMenu(false);
  const p=new URLSearchParams(location.search);
  Object.assign(state,{channel:p.get('channel')||'',series:p.get('series')||'',view:viewOf(p.get('view')),query:p.get('q')||'',status:p.get('status')||'',sort:p.get('sort')||'recent',layout:p.get('layout')==='list'?'list':'grid',limit:12});
  $('#status-filter').value=state.status;$('#sort-filter').value=state.sort;$('#grid-view').classList.toggle('active',state.layout==='grid');$('#list-view').classList.toggle('active',state.layout==='list');render();await openHash();
}
async function refresh(initial=false){
  if(refreshing)return;refreshing=true;$('#refresh-button').disabled=true;
  refreshVoiceStudio();
  try{state.data=await api('/api/workspace');state.workflowStale=true;state.resourceStale=true;$('#load-error').hidden=true;$('#connection').classList.remove('offline');$('#connection').lastChild.textContent='Đã kết nối';render();if(initial)openHash();}
  catch(error){$('#load-error').textContent=`Chưa kết nối được: ${error.message}`;$('#load-error').hidden=false;$('#connection').classList.add('offline');}
  finally{refreshing=false;$('#refresh-button').disabled=false;}
}
// Only the two content channels are channels; other catalog groups (client work) are listed apart.
const contentChannels=['tam-ly-cuoc-song','kids'];
function renderNav(){
  const {channels,series,projects,books}=state.data;
  const channelNav=channel=>{
    const items=series.filter(s=>s.channel===channel.id);
    let html=`<button class="nav-button nav-channel ${state.channel===channel.id&&!state.series&&state.view==='projects'?'active':''}" data-channel="${esc(channel.id)}"><span class="nav-icon">${icon(channel.id==='kids'?'spark':contentChannels.includes(channel.id)?'channel':'folder')}</span>${esc(channel.title)}<span class="nav-count">${projects.filter(p=>p.channel===channel.id).length}</span></button>`;
    if(items.length>1)for(const item of items)html+=`<button class="nav-button nav-sub ${state.series===item.id&&state.view==='projects'?'active':''}" data-series="${esc(item.id)}">${esc(item.id==='self-help-shorts'?'Self-help Shorts':item.id==='book-insights'?'Đọc sách, hiểu mình':item.title)}<span class="nav-count">${item.projectCount}</span></button>`;
    return html;
  };
  const others=channels.filter(c=>!contentChannels.includes(c.id));
  let html=`<button class="nav-button ${!state.channel&&!state.series&&state.view==='projects'?'active':''}" data-nav="all"><span class="nav-icon">${icon("grid")}</span>Tất cả dự án<span class="nav-count">${projects.length}</span></button><button class="nav-button ${state.view==='books'?'active':''}" data-nav="books"><span class="nav-icon">${icon("book")}</span>Tủ sách nghiên cứu<span class="nav-count">${books.length}</span></button><button class="nav-button ${state.view==='voices'?'active':''}" data-nav="voices"><span class="nav-icon">${icon("mic")}</span>Giọng đọc</button><button class="nav-button ${state.view==='music'?'active':''}" data-nav="music"><span class="nav-icon">${icon("music")}</span>Nhạc nền & hiệu ứng</button><!--voicestudio--><div class="nav-divider"></div>`;
  html+=`<div class="nav-section-title">KÊNH NỘI DUNG</div>`+channels.filter(c=>contentChannels.includes(c.id)).map(channelNav).join('');
  if(others.length)html+=`<div class="nav-section-title">NGOÀI KÊNH</div>`+others.map(channelNav).join('');
  // Navigation entries become links; the VoiceStudio action stays a real button, inserted after that rewrite.
  $('#navigation').innerHTML=html.replaceAll('<button class="nav-button','<a class="nav-button').replaceAll('</button>','</a>')
    .replace('<!--voicestudio-->',`<button class="nav-action nav-button" data-open-voicestudio title="Mở VoiceStudio trong tab mới"><span class="nav-icon">${icon("arrow")}</span>Studio giọng nói<span class="vs-dot" aria-hidden="true"></span><span class="sr-only vs-dot-label"></span></button>`);
  renderVoiceStudio();
  $('#navigation').querySelectorAll('a').forEach(a=>{const p=new URLSearchParams();if(a.dataset.nav&&a.dataset.nav!=='all')p.set('view',a.dataset.nav);if(a.dataset.channel)p.set('channel',a.dataset.channel);if(a.dataset.series){const item=state.data.series.find(s=>s.id===a.dataset.series);p.set('channel',item.channel);p.set('series',item.id);}a.href=p.size?'/?'+p:'/';if(a.classList.contains('active'))a.setAttribute('aria-current','page');});
}
function render(){
  if(!state.data)return;
  renderNav();
  const resource=Boolean(resourceViews[state.view]);
  $('#resource-view').hidden=!resource;$('#stats').hidden=resource;$('.library').hidden=resource;
  if(resource){
    $('#new-book-button').hidden=true;$('#book-banner').hidden=true;$('#workflow').hidden=true;$('#new-project-button').className='button secondary';
    $('#page-title').textContent=resourceViews[state.view];renderBreadcrumbs();
    $('#eyebrow').textContent=state.view==='voices'?'NHỮNG GIỌNG KỂ CHUYỆN':'ÂM THANH CỦA TỪNG TẬP';
    $('#page-description').textContent=state.view==='voices'?'Nghe thử từng giọng VieNeu và xem tập nào đang dùng giọng nào.':'Nguồn nhạc, credit và hiệu ứng âm thanh mà các tập đang dùng.';
    renderResources();return;
  }
  $('#resource-view').replaceChildren();state.resourceKey='';
  $('#new-book-button').hidden=state.view!=='books'&&state.series!=='book-insights';
  const channel=state.data.channels.find(c=>c.id===state.channel),series=state.data.series.find(s=>s.id===state.series);
  $('#page-title').textContent=state.view==='books'?'Tủ sách nghiên cứu':series?.title||channel?.title||'Không gian sáng tạo';
  renderBreadcrumbs();
  $('#new-project-button').className='button '+(state.view==='projects'?'primary':'secondary');
  $('#eyebrow').textContent=state.view==='books'?'TỪ TRANG SÁCH ĐẾN CÂU CHUYỆN':series?'TỪNG TẬP, MỘT CÂU CHUYỆN':channel?'NHỮNG CÂU CHUYỆN CỦA KÊNH':'MỘT NƠI CHO MỌI Ý TƯỞNG';
  $('#page-description').textContent=state.view==='books'?'Giữ nguồn, ghi chú và những ý tưởng cho series sách ở cùng một nơi.':series?.summary||'Tìm bản dựng, kịch bản và tài liệu theo từng series.';
  const visible=state.data.projects.filter(p=>(!state.channel||p.channel===state.channel)&&(!state.series||p.series===state.series));
  const count=status=>visible.filter(p=>p.status===status).length,shelf=state.data.books;
  const statValues=state.view==='books'?[['book',shelf.length,'Cuốn sách nghiên cứu'],['folder',shelf.filter(b=>b.hasSource).length,'Đã có PDF nguồn'],['spark',shelf.filter(b=>!b.hasSource).length,'Chờ tài liệu'],['grid',state.data.projects.filter(p=>p.book).length,'Tập gắn với sách']]
    :[['folder',visible.length,'Dự án'],['play',count('existing'),'Đã có bản dựng'],['arrow',count('production'),'Đang sản xuất'],['spark',count('planning'),'Đang chuẩn bị']];
  $('#stats').innerHTML=statValues.map(([symbol,value,label])=>`<div class="stat"><span class="stat-icon" aria-hidden="true">${icon(symbol)}</span><div><strong>${value}</strong><small>${label}</small></div></div>`).join('');
  const filteredSeries=state.data.series.filter(s=>!state.channel||s.channel===state.channel);
  $('#series-filter').innerHTML='<option value="">Tất cả series</option>'+filteredSeries.map(s=>`<option value="${esc(s.id)}">${esc(s.title)}</option>`).join('');$('#series-filter').value=state.series;
  $('#series-filter').hidden=state.view==='books';$('#status-filter').hidden=state.view==='books';
  const banner=state.series==='book-insights'&&state.view!=='books';$('#book-banner').hidden=!banner;
  if(banner)$('#book-banner').innerHTML=`<div><h2>Nhiều cuốn sách, nhiều góc nhìn</h2><p>${state.data.books.filter(b=>b.series===state.series).length} hồ sơ sách. Mỗi cuốn giữ nguồn riêng và có thể phát triển thành nhiều tập.</p></div><button class="button secondary" data-books>Mở tủ sách</button>`;
  $('#library-title').innerHTML=(state.view==='books'?'Tủ sách của bạn':'Dự án')+' <span id="project-count"></span>';
  $('#library-caption').textContent=state.view==='books'?'Một hồ sơ nguồn, nhiều câu chuyện để phát triển.':'Những câu chuyện bạn đang xây dựng.';
  $('#last-update').textContent='Đồng bộ lúc '+new Date(state.data.generatedAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
  $('#search').value=state.query;
  renderWorkflow();
  renderCards();
}
function projectCard(p,index=0){
  const hasImage=Boolean(p.previewType);
  return `<article class="project-card card-channel-${esc(p.channel)}"><a href="#project/${encodeURIComponent(p.id)}" class="card-cover" data-project="${esc(p.id)}" aria-label="Mở dự án ${esc(p.title)}">${hasImage?`<img width="1080" height="1920" loading="${index<3?'eager':'lazy'}" decoding="async" src="/api/preview/${encodeURIComponent(p.id)}" alt="" data-preview-image>`:'<span class="cover-placeholder" aria-hidden="true">✧</span>'}<span class="format-badge">${p.format==='short'?'SHORT':'VIDEO DÀI'}</span>${hasImage?`<span class="preview-label">${p.previewType==='thumbnail-background'?'Nền thumbnail':'Ảnh cảnh'}</span>`:''}<span class="duration-badge">${duration(p.durationSeconds)}</span></a><div class="card-body"><div class="card-series">${esc(p.seriesTitle)}</div><a href="#project/${encodeURIComponent(p.id)}" class="card-title" data-project="${esc(p.id)}">${esc(p.title)}</a><div class="card-id">${esc(p.id)}</div><div class="card-footer"><span class="status ${esc(p.status)}">${esc(statusNames[p.status]||p.status)}</span><div class="card-links">${p.videoId?`<a data-watch="video" data-id="${esc(p.id)}" href="${studio(p.videoId)}" target="_blank" rel="noopener" title="Xem video" aria-label="Xem video ${esc(p.title)}">${icon("play")}<span>Video</span></a>`:''}${p.thumbnailId?`<a data-watch="thumbnail" data-id="${esc(p.id)}" href="${studio(p.thumbnailId)}" target="_blank" rel="noopener" title="Xem thumbnail" aria-label="Xem thumbnail ${esc(p.title)}">${icon("image")}<span>Thumbnail</span></a>`:''}<button data-project="${esc(p.id)}" title="Mở hồ sơ" aria-label="Mở hồ sơ ${esc(p.title)}">${icon("folder")}<span>Hồ sơ</span></button></div></div></div></article>`;
}
function bookCoverUrl(book){return `/api/book-cover?series=${encodeURIComponent(book.series)}&book=${encodeURIComponent(book.id)}&v=${encodeURIComponent(book.cover||'')}`;}
function bookArtwork(book){return book.cover?`<span class="book-image-frame"><img class="uploaded-book-cover" width="136" height="174" src="${bookCoverUrl(book)}" alt="Bìa ${esc(book.title)}" loading="lazy" data-book-cover="${esc(book.id)}" data-cover-series="${esc(book.series)}"></span>`:`<span class="book-object" aria-hidden="true"><span class="book-cover-title">${esc(book.title)}</span><small class="book-cover-author">${esc(book.authors.join(', '))}</small></span>`;}
function bookCard(b){return `<article class="project-card book-card"><button class="card-cover" data-book="${esc(b.id)}" data-book-series="${esc(b.series)}" aria-label="Mở hồ sơ ${esc(b.title)}">${bookArtwork(b)}</button><div class="card-body"><button class="card-title" data-book="${esc(b.id)}" data-book-series="${esc(b.series)}">${esc(b.title)}</button><div class="card-id">${esc(b.authors.join(', '))}</div><div class="card-footer"><span class="status ${b.hasSource?'production':'planning'}">${esc(b.hasSource&&b.status==='awaiting-source'?'Chờ kiểm tra nguồn':bookStatusNames[b.status]||b.status)}</span></div></div></article>`;}
function renderCards(){
  if(!state.data)return;
  const q=fold(state.query);let items;
  if(state.view==='books')items=state.data.books.filter(b=>(!state.series||b.series===state.series)&&(!state.channel||b.channel===state.channel)&&(!q||fold(`${b.title} ${b.authors.join(' ')}`).includes(q)));
  else items=state.data.projects.filter(p=>(!state.channel||p.channel===state.channel)&&(!state.series||p.series===state.series)&&(!state.status||p.status===state.status)&&(!q||fold(`${p.title} ${p.id} ${p.seriesTitle}`).includes(q)));
  items.sort((a,b)=>state.sort==='title'?a.title.localeCompare(b.title,'vi'):String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))||a.title.localeCompare(b.title,'vi'));
  $('#project-count').textContent=items.length;
  $('#project-grid').className='project-grid'+(state.view==='books'?' books-grid':'')+(state.layout==='list'?' list':'');
  $('#project-grid').innerHTML=items.length?items.slice(0,state.limit).map(state.view==='books'?bookCard:projectCard).join(''):`<div class="empty-state"><span class="empty-icon">${state.query?'⌕':'✧'}</span><strong>${state.query?'Chưa tìm thấy dự án phù hợp':'Một câu chuyện mới bắt đầu ở đây'}</strong><p>${state.query?'Thử từ khóa khác hoặc bỏ bớt bộ lọc.':'Series này chưa có tập sản xuất. Bạn có thể thêm một ý tưởng để bắt đầu chuẩn bị.'}</p><button class="button secondary" data-empty-action>${state.query?'Xóa bộ lọc':'Thêm dự án đầu tiên'}</button></div>`;
  $('#pagination').innerHTML=items.length?`<span>Hiển thị ${Math.min(state.limit,items.length)} / ${items.length} ${state.view==='books'?'cuốn sách':'dự án'}</span>${items.length>state.limit?'<button class="button secondary" data-more>Xem thêm ↓</button>':''}`:'';
  bindBookCoverFallbacks();
  document.querySelectorAll('[data-preview-image]').forEach(image=>image.addEventListener('error',()=>{image.replaceWith(Object.assign(document.createElement('span'),{className:'cover-placeholder',textContent:'✧'}));},{once:true}));
}
// A book opens as a full page beside the sidebar (lots to read); projects and workflow steps stay a side panel.
function setPageMode(on){const drawer=$('#drawer');drawer.classList.toggle('book-page',on);drawer.setAttribute('role',on?'region':'dialog');if(on)drawer.removeAttribute('aria-modal');else drawer.setAttribute('aria-modal','true');}
function showDrawer(page=false){renderBreadcrumbs();focusBeforeDrawer=document.activeElement;setMenu(false);setPageMode(page);$('.workspace').inert=true;$('#sidebar').inert=!page;$('#drawer').hidden=false;$('#drawer-backdrop').hidden=page;document.body.classList.add('overlay-open');if(page){$('#drawer').scrollTo(0,0);$('#drawer-title').focus();}else $('#close-drawer').focus();}
function closeDrawer(){if(!canLeaveNotes())return;hideDrawer();recordRoute(location.pathname+location.search);renderBreadcrumbs();focusBeforeDrawer?.focus();}
async function openProject(id,record=true){
  if(!canLeaveNotes())return;
  try{
    const request=++routeRequest;const detail=await api('/api/project?id='+encodeURIComponent(id));if(request!==routeRequest)return;state.drawer=detail;state.documentRequest++;
    if(record)recordRoute(location.pathname+location.search+'#project/'+encodeURIComponent(id),true);
    $('#drawer-eyebrow').textContent='HỒ SƠ DỰ ÁN';
    const metadata=state.data.projects.find(p=>p.id===id),video=detail.registrations.find(r=>r.kind==='Composition'),thumb=detail.registrations.find(r=>r.kind==='Still');
    $('#drawer-content').innerHTML=`<h2 id="drawer-title">${esc(detail.title)}</h2><div class="drawer-meta"><span>${esc(detail.seriesTitle)}</span><span>·</span><span>${metadata?.format==='short'?'Short':'Video dài'} · ${duration(metadata?.durationSeconds)}</span><span class="status ${esc(detail.status)}">${esc(statusNames[detail.status])}</span></div><div class="drawer-actions">${video?`<a class="button primary" data-watch="video" data-id="${esc(id)}" href="${studio(video.id)}" target="_blank" rel="noopener">${icon("play")} Xem video</a>`:''}${video?`<button class="button studio-button" data-studio="${esc(video.id)}" data-id="${esc(id)}">${icon("arrow")} Mở Studio</button>`:''}${thumb?`<a class="button secondary" data-watch="thumbnail" data-id="${esc(id)}" href="${studio(thumb.id)}" target="_blank" rel="noopener">${icon("image")} Xem thumbnail</a>`:''}</div><section class="drawer-section"><h3>Tài liệu của tập</h3><div class="document-tabs" id="document-tabs">${detail.documents.map(d=>`<button data-document="${esc(d.id)}">${esc(d.name)}</button>`).join('')}</div><div id="document-view" class="document-view">Đang mở tài liệu…</div></section><section class="drawer-section"><h3>Ghi chú của bạn</h3><textarea id="notes-text" class="notes-input" maxlength="40000" placeholder="Ý tưởng cần bổ sung, điều cần sửa, việc cần làm…" aria-label="Ghi chú dự án">${esc(detail.notes)}</textarea><div class="notes-footer"><small id="notes-status">Lưu thành file riêng trong thư mục tài liệu.</small><button class="button primary" id="save-notes">Lưu ghi chú</button></div></section><section class="drawer-section"><h3>Đi đến thư mục</h3><div class="folder-list">${Object.entries(detail.paths).map(([kind,folder])=>`<button class="folder-button" data-folder="${esc(kind)}">${icon("folder")} ${esc({source:'Bản dựng',scripts:'Công cụ của tập',docs:'Tài liệu',assets:'Ảnh & âm thanh'}[kind]||kind)}<small>${esc(folder)}</small></button>`).join('')}</div></section>`;
    $('#drawer-content').insertAdjacentHTML('beforeend','<section class="drawer-section"><button class="button danger" data-delete-project>Xóa dự án</button></section>');
    showDrawer();
    if(detail.documents.length)openDocument(detail.documents[0].id);else $('#document-view').innerHTML='<p class="empty-document">Chưa có tài liệu. Hãy bắt đầu bằng ghi chú của bạn.</p>';
  }catch(error){toast(error.message);}
}
async function openDocument(key){
  if(!state.drawer)return;const id=state.drawer.id,request=++state.documentRequest;
  document.querySelectorAll('[data-document]').forEach(b=>b.classList.toggle('active',b.dataset.document===key));
  $('#document-view').textContent='Đang mở…';
  try{const doc=await api(`/api/document?id=${encodeURIComponent(id)}&file=${encodeURIComponent(key)}`);if(request!==state.documentRequest)return;renderDocument(doc);}
  catch(error){if(request===state.documentRequest)$('#document-view').textContent=error.message;}
}
// Documents are shown in a readable form per file type; "Xem file gốc" shows the exact text.
// Everything is built from text nodes, never from HTML in the file.
function h(tag,props={},...children){
  const node=document.createElement(tag);
  for(const [k,v] of Object.entries(props||{}))if(v!=null&&v!==false){if(k==='class')node.className=v;else if(k==='text')node.textContent=v;else node.setAttribute(k,v===true?'':v);}
  for(const child of children.flat())if(child!=null&&child!==false)node.append(child instanceof Node?child:document.createTextNode(String(child)));
  return node;
}
let rawDocuments=false;
function renderDocument(doc){
  const target=$('#document-view');target.replaceChildren();
  const ext=doc.filename.slice(doc.filename.lastIndexOf('.')).toLowerCase(),readable=ext==='.md'||ext==='.json';
  if(readable)target.append(h('div',{class:'doc-toolbar'},h('button',{class:'button quiet doc-raw-toggle','aria-pressed':String(rawDocuments),'data-raw-toggle':''},rawDocuments?'Xem dạng dễ đọc':'Xem file gốc')));
  if(!readable||rawDocuments){target.append(h('pre',{class:'doc-code'},doc.text));target.lastDocument=doc;return;}
  target.lastDocument=doc;
  if(ext==='.md'){target.append(renderMarkdown(doc.text));return;}
  let data;try{data=JSON.parse(doc.text);}catch{target.append(h('p',{class:'doc-note'},'File JSON không hợp lệ, hiển thị nguyên văn.'),h('pre',{class:'doc-code'},doc.text));return;}
  target.append(doc.filename==='book.json'?bookInfoView(data):doc.filename==='chapters.json'&&state.drawer?.book?chapterMapView(data):jsonView(data));
}
document.addEventListener('click',event=>{
  const toggle=event.target.closest('[data-raw-toggle]');if(!toggle)return;
  rawDocuments=!rawDocuments;const view=$('#document-view');if(view.lastDocument)renderDocument(view.lastDocument);$('[data-raw-toggle]')?.focus();
});

// Markdown: headings, paragraphs, lists, tables, quotes, code, rules; inline bold/italic/code/links.
function inline(text){
  const out=[],re=/(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))|((?<![\w*])\*[^*\s][^*]*\*(?![\w*]))/g;let last=0,m;
  while((m=re.exec(text))){
    if(m.index>last)out.push(text.slice(last,m.index));const s=m[0];
    if(m[1])out.push(h('code',{},s.slice(1,-1)));
    else if(m[2])out.push(h('strong',{},s.slice(2,-2)));
    else if(m[4])out.push(h('em',{},s.slice(1,-1)));
    else{const [,label,href]=s.match(/^\[([^\]]+)\]\(([^)]+)\)$/),file=href.split('/').pop();
      const tab=document.querySelector(`[data-book-document="${CSS.escape(file)}"]`)||[...document.querySelectorAll('[data-document]')].find(b=>b.dataset.document.endsWith('/'+file));
      if(tab)out.push(h('button',{class:'link-button doc-link','data-open-tab':tab.dataset.bookDocument?'book:'+file:'doc:'+tab.dataset.document},label));
      else if(/^https?:\/\//.test(href))out.push(h('a',{href,target:'_blank',rel:'noopener noreferrer'},label));
      else out.push(h('span',{class:'doc-ref',title:href},label));}
    last=m.index+s.length;
  }
  if(last<text.length)out.push(text.slice(last));return out;
}
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-open-tab]');if(!link)return;const [kind,key]=[link.dataset.openTab.slice(0,link.dataset.openTab.indexOf(':')),link.dataset.openTab.slice(link.dataset.openTab.indexOf(':')+1)];
  kind==='book'?openBookDocument(key):openDocument(key);
});
function renderMarkdown(text){
  const root=h('div',{class:'doc-markdown'}),lines=text.split('\n');let i=0;
  const cells=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
  while(i<lines.length){
    const line=lines[i];
    if(line.startsWith('```')){const code=[];i++;while(i<lines.length&&!lines[i].startsWith('```'))code.push(lines[i++]);i++;root.append(h('pre',{class:'doc-code'},code.join('\n')));continue;}
    const heading=line.match(/^(#{1,6})\s+(.+)/);
    if(heading){root.append(h('h'+Math.min(heading[1].length,4),{},inline(heading[2])));i++;continue;}
    if(/^\s*(---+|\*\*\*+)\s*$/.test(line)){root.append(h('hr'));i++;continue;}
    if(/^\s*\|/.test(line)&&i+1<lines.length&&/^\s*\|?\s*:?-{2,}/.test(lines[i+1])){
      const head=cells(line);i+=2;const rows=[];while(i<lines.length&&/^\s*\|/.test(lines[i]))rows.push(cells(lines[i++]));
      root.append(h('div',{class:'table-scroll'},h('table',{class:'doc-table'},h('thead',{},h('tr',{},head.map(c=>h('th',{scope:'col'},inline(c))))),h('tbody',{},rows.map(r=>h('tr',{},head.map((_,k)=>h('td',{},inline(r[k]??'')))))))));continue;}
    if(/^\s*>/.test(line)){const quote=[];while(i<lines.length&&/^\s*>/.test(lines[i]))quote.push(lines[i++].replace(/^\s*>\s?/,''));root.append(h('blockquote',{},inline(quote.join(' '))));continue;}
    const bullet=/^\s*[-*+]\s+/,ordered=/^\s*\d+[.)]\s+/;
    if(bullet.test(line)||ordered.test(line)){
      const isOrdered=ordered.test(line),list=h(isOrdered?'ol':'ul');
      while(i<lines.length&&(isOrdered?ordered:bullet).test(lines[i])){
        let item=lines[i++].replace(isOrdered?ordered:bullet,'');
        while(i<lines.length&&/^\s{2,}\S/.test(lines[i])&&!bullet.test(lines[i])&&!ordered.test(lines[i]))item+=' '+lines[i++].trim();
        list.append(h('li',{},inline(item)));
      }
      root.append(list);continue;
    }
    if(!line.trim()){i++;continue;}
    const para=[line];i++;
    while(i<lines.length&&lines[i].trim()&&!/^(#{1,6}\s|```|\s*[-*+]\s|\s*\d+[.)]\s|\s*\||\s*>)/.test(lines[i]))para.push(lines[i++]);
    root.append(h('p',{},inline(para.join(' '))));
  }
  return root;
}

// Generic JSON: objects as label/value lists, uniform arrays of objects as tables.
const keyLabels={file:'File',speechVolume:'Âm lượng khi có giọng',pauseVolume:'Âm lượng khoảng lặng',fadeInSeconds:'Fade in (giây)',fadeOutSeconds:'Fade out (giây)',
  durationSeconds:'Thời lượng (giây)',voice:'Giọng',composition:'Composition',text:'Lời',startMs:'Bắt đầu',endMs:'Kết thúc',timestampMs:'Mốc',confidence:'Độ tin cậy',
  editingNote:'Ghi chú dựng',playbackRate:'Tốc độ phát',sourceStartSeconds:'Nguồn từ (giây)',sourceEndSeconds:'Nguồn đến (giây)',videoStartSeconds:'Video từ (giây)',videoEndSeconds:'Video đến (giây)',
  volume:'Âm lượng',enabled:'Bật',note:'Ghi chú',title:'Tiêu đề',status:'Trạng thái',tempo:'Nhịp',captionPages:'Số trang phụ đề',
  sourcePcmPreserved:'Giữ nguyên PCM nguồn',speechPcmPreserved:'Giữ nguyên PCM giọng',captionTextUnchanged:'Lời phụ đề không đổi',sceneStartsFrames:'Khung bắt đầu từng cảnh',
  sourceDurationSeconds:'Thời lượng nguồn (giây)',addedSilenceSeconds:'Khoảng lặng thêm (giây)',redistributedSilenceSeconds:'Khoảng lặng phân bổ lại (giây)',wordMatchRatio:'Tỷ lệ khớp từ (ASR)',
  artists:'Tác giả',sampleRateHz:'Tần số mẫu (Hz)',qualityProfile:'Hồ sơ chất lượng'};
const labelOf=key=>keyLabels[key]||String(key).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').replace(/^./,c=>c.toUpperCase());
const msTime=ms=>{const s=Math.max(0,ms)/1000;return `${Math.floor(s/60)}:${(s%60).toFixed(1).padStart(4,'0')}`;};
function scalar(value,key=''){
  if(value===null||value===undefined||value==='')return h('span',{class:'muted'},'—');
  if(typeof value==='boolean')return h('span',{class:'tag '+(value?'':'tag-warn')},value?'Có':'Không');
  if(typeof value==='number')return /Ms$/.test(key)?msTime(value):value.toLocaleString('vi-VN',{maximumFractionDigits:3});
  if(typeof value==='string'&&/^[a-f0-9]{40,}(-[a-f0-9]+)?$/.test(value))return h('code',{class:'hash',title:value},value.slice(0,12)+'…'+value.slice(-6));
  if(typeof value==='string'&&/[\/\\]|\.[a-z0-9]{2,4}$/i.test(value)&&!/\s/.test(value))return h('code',{},value);
  return String(value);
}
function jsonView(data,depth=0){
  if(Array.isArray(data)){
    if(!data.length)return h('p',{class:'muted'},'Danh sách trống');
    if(data.every(x=>x===null||typeof x!=='object'))return h('div',{class:'chips'},data.slice(0,60).map(x=>h('span',{class:'tag'},scalar(x))),data.length>60?h('span',{class:'muted'},`và ${data.length-60} mục nữa`):null);
    if(data.every(x=>x&&typeof x==='object'&&!Array.isArray(x))){
      // Hide columns that are empty in every row or repeat an earlier column exactly (e.g. timestampMs = startMs).
      const empty=v=>v===null||v===undefined||v==='';
      const all=[...new Set(data.flatMap(Object.keys))].filter(k=>!data.every(r=>empty(r[k])));
      const keys=all.filter((k,i)=>!all.slice(0,i).some(j=>data.every(r=>JSON.stringify(r[j])===JSON.stringify(r[k])))).slice(0,8),shown=data.slice(0,300);
      return h('div',{},h('div',{class:'table-scroll'},h('table',{class:'doc-table'},h('thead',{},h('tr',{},h('th',{scope:'col'},'#'),keys.map(k=>h('th',{scope:'col'},labelOf(k))))),
        h('tbody',{},shown.map((row,n)=>h('tr',{},h('td',{class:'num'},n+1),keys.map(k=>h('td',{class:typeof row[k]==='number'?'num':null},row[k]&&typeof row[k]==='object'?h('code',{},JSON.stringify(row[k]).slice(0,160)):scalar(row[k],k)))))))),
        data.length>shown.length?h('p',{class:'muted'},`Đang hiện ${shown.length}/${data.length} dòng; xem file gốc để thấy đủ.`):null);
    }
    return h('ol',{class:'json-list'},data.map(x=>h('li',{},jsonView(x,depth+1))));
  }
  if(data&&typeof data==='object'){
    const entries=Object.entries(data);if(!entries.length)return h('p',{class:'muted'},'Trống');
    return h('dl',{class:'kv'+(depth?' kv-nested':'')},entries.flatMap(([k,v])=>[h('dt',{},labelOf(k)),h('dd',{},v&&typeof v==='object'?(depth>=3?h('code',{},JSON.stringify(v).slice(0,200)):jsonView(v,depth+1)):scalar(v,k))]));
  }
  return h('p',{},scalar(data));
}

// book.json: the book's source record.
// Width is set through CSSOM: the page CSP blocks inline style attributes.
function progress(done,total,label){
  const fill=h('span');fill.style.width=`${total?Math.round(done/total*100):0}%`;
  return h('div',{class:'progress'},h('div',{class:'progress-label'},h('strong',{},`${done}/${total}`),' ',label),
    h('div',{class:'progress-track',role:'progressbar','aria-valuemin':'0','aria-valuemax':String(total),'aria-valuenow':String(done),'aria-label':label},fill));
}
function bookInfoView(b){
  const e=b.editionDetails||{},known=new Set(['id','title','authors','status','sourceSha256','cacheEdition','editionDetails','chapterMap','research','seasonPlan','sourceFile','pdfPages','extractedCharacters','textLayer','ocr','chaptersTotal','chaptersRead','checkedAt','note']);
  const row=(label,value)=>value==null||value===''?null:[h('dt',{},label),h('dd',{},value)];
  const missing=()=>h('span',{class:'muted'},'Không có trong PDF');
  const extra=Object.fromEntries(Object.entries(b).filter(([k])=>!known.has(k)));
  return h('div',{class:'doc-card'},
    h('div',{class:'doc-head'},h('span',{class:'status '+(b.status==='awaiting-source'?'planning':'production')},bookStatusNames[b.status]||b.status),b.checkedAt?h('span',{class:'muted'},'Kiểm tra ngày '+b.checkedAt):null),
    b.chaptersTotal?progress(b.chaptersRead||0,b.chaptersTotal,'chương đã đọc'):null,
    h('h4',{},'Sách'),
    h('dl',{class:'kv'},row('Tác giả',(b.authors||[]).join(', ')),row('Dịch giả',e.translator||(b.editionDetails?'Không ghi trong PDF':null)),row('Ấn bản',e.edition),row('Nhà xuất bản',b.editionDetails?(e.publisher||missing()):null),row('Năm',b.editionDetails?(e.year||missing()):null)),
    h('h4',{},'File nguồn'),
    h('dl',{class:'kv'},row('Số trang PDF',b.pdfPages?.toLocaleString('vi-VN')),row('Lớp chữ',b.textLayer?(b.textLayer==='native'?'Chữ gốc của PDF':b.textLayer)+(b.ocr?', đã OCR':', không cần OCR'):null),
      row('Ký tự đã trích',b.extractedCharacters?.toLocaleString('vi-VN')),row('File',b.sourceFile?h('code',{},b.sourceFile):null),row('Mã SHA-256',b.sourceSha256?scalar(b.sourceSha256):h('span',{class:'muted'},'Chưa nạp')),row('Bản cache',b.cacheEdition?scalar(b.cacheEdition):null)),
    e.provenance?[h('h4',{},'Nguồn gốc'),h('p',{},e.provenance)]:null,
    Object.keys(extra).length?[h('h4',{},'Trường khác'),jsonView(extra,1)]:null);
}

// chapters.json: chapter map with reading progress, filter, parts and sub-sections.
const readNames={unread:'Chưa đọc',reading:'Đang đọc',partial:'Đọc một phần',read:'Đã đọc'};
function chapterMapView(m){
  const chapters=m.chapters||[];
  if(!chapters.length)return h('div',{class:'doc-card'},h('p',{class:'doc-callout'},'Chưa lập bản đồ chương. Nạp PDF và kiểm mục lục trước.'),Object.keys(m).length>2?jsonView(m):null);
  const read=chapters.filter(c=>c.readStatus==='read').length;
  const notes=[m.mappingSummary,m.orderNote,m.partNote,m.figures?.note,m.textArtifacts,m.pageNumberConvention].filter(Boolean);
  const pages=c=>`${c.pdfStart}–${c.pdfEnd}`;
  const body=h('tbody',{});let part;
  for(const c of chapters){
    if(c.part!==undefined&&c.part!==part){part=c.part;body.append(h('tr',{class:'group-row'},h('th',{colspan:'4',scope:'colgroup'},part||'Chương không thuộc phần nào')));}
    const extra=[c.startsMidPage?'Bắt đầu giữa trang':null,c.summaryPdfPage?`Tóm tắt chương: tr. ${c.summaryPdfPage}`:('summaryPdfPage' in c?'Không có trang tóm tắt':null)].filter(Boolean).join('. ');
    const sections=c.sections?.length?h('details',{class:'sections'},h('summary',{},`${c.sections.length} tiểu mục`),h('ul',{},c.sections.map(s=>h('li',{},s.title,h('span',{class:'muted'},` · tr. ${s.pdfPage}`))))):null;
    body.append(h('tr',{'data-chapter':fold(`${c.number} ${c.title} ${(c.sections||[]).map(s=>s.title).join(' ')}`)},h('td',{class:'num'},c.number??''),h('td',{},h('strong',{},c.title),extra?h('div',{class:'muted small'},extra):null,sections),h('td',{class:'num'},pages(c)),
      h('td',{},h('span',{class:'tag '+(c.readStatus==='read'?'':c.readStatus==='unread'?'tag-muted':'tag-gold')},readNames[c.readStatus]||c.readStatus||'—'))));
  }
  const filter=h('input',{type:'search',class:'doc-filter','aria-label':'Lọc chương',placeholder:'Lọc theo tên chương hoặc tiểu mục'});
  const count=h('span',{class:'muted'},`${chapters.length} chương`);
  filter.addEventListener('input',()=>{const q=fold(filter.value);let n=0;body.querySelectorAll('tr[data-chapter]').forEach(r=>{const show=!q||r.dataset.chapter.includes(q);r.hidden=!show;n+=show;});
    body.querySelectorAll('.group-row').forEach(g=>{let r=g.nextElementSibling,any=false;while(r&&!r.classList.contains('group-row')){any||=!r.hidden;r=r.nextElementSibling;}g.hidden=!any;});count.textContent=q?`${n}/${chapters.length} chương`:`${chapters.length} chương`;});
  const matter=(title,items)=>items?.length?[h('h4',{},title),h('div',{class:'table-scroll'},h('table',{class:'doc-table compact'},h('tbody',{},items.map(x=>h('tr',{},h('td',{},x.title,x.note?h('div',{class:'muted small'},x.note):null),h('td',{class:'num'},x.pdfStart===x.pdfEnd?x.pdfStart:`${x.pdfStart}–${x.pdfEnd}`))))))]:null;
  return h('div',{class:'doc-card'},
    progress(read,chapters.length,'chương đã đọc'),
    notes.length?h('details',{class:'doc-notes',open:true},h('summary',{},'Lưu ý khi dùng bản đồ này'),h('ul',{},notes.map(n=>h('li',{},n)))):null,
    m.figures?.brokenPlaceholders?.length?h('p',{class:'doc-callout warn-callout'},`Hình bị mất trong PDF: trang ${m.figures.brokenPlaceholders.join(', ')}.`):null,
    m.blankPages?.length?h('p',{class:'muted small'},`Trang trắng: ${m.blankPages.join(', ')}.`):null,
    h('div',{class:'doc-filter-row'},filter,count),
    h('div',{class:'table-scroll'},h('table',{class:'doc-table chapters'},h('thead',{},h('tr',{},h('th',{scope:'col'},'#'),h('th',{scope:'col'},'Chương'),h('th',{scope:'col'},'Trang PDF'),h('th',{scope:'col'},'Đọc'))),body)),
    matter('Phần đầu sách',m.frontMatter),matter('Phần cuối sách',m.backMatter),
    m.sourceSha256?h('p',{class:'muted small'},'Nguồn: ',scalar(m.sourceSha256),m.edition?[' · bản cache ',scalar(m.edition)]:null):null);
}
// Measure white padding for display only. Original files remain byte-for-byte unchanged.
function fitBookCover(img){
  const frame=img.closest('.book-image-frame');if(!frame||!img.naturalWidth)return;
  const canvas=document.createElement('canvas'),scale=Math.min(1,512/Math.max(img.naturalWidth,img.naturalHeight));
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  let x0=0,y0=0,x1=canvas.width,y1=canvas.height;
  try{
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);let left=canvas.width,right=-1,top=canvas.height,bottom=-1;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(data[i+3]>16&&(data[i]<245||data[i+1]<245||data[i+2]<245)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
    if(right-left>=canvas.width*.45&&bottom-top>=canvas.height*.6){x0=Math.max(0,left-2);y0=Math.max(0,top-2);x1=Math.min(canvas.width,right+3);y1=Math.min(canvas.height,bottom+3);}
  }catch{/* Use the original ratio if pixel inspection is unavailable. */}
  const w=x1-x0,h=y1-y0,ratio=w/h;
  frame.style.setProperty('--book-ratio',String(ratio));frame.style.setProperty('--cover-width',Math.min(180,200*ratio)+'px');
  img.style.width=canvas.width/w*100+'%';img.style.height=canvas.height/h*100+'%';img.style.left=-x0/w*100+'%';img.style.top=-y0/h*100+'%';
}
function bindBookCoverFallbacks(){document.querySelectorAll('[data-book-cover]').forEach(img=>{
  if(img.dataset.bound)return;img.dataset.bound='true';
  img.addEventListener('load',()=>fitBookCover(img));if(img.complete)fitBookCover(img);
  img.addEventListener('error',()=>{const book=state.data.books.find(b=>b.id===img.dataset.bookCover&&b.series===img.dataset.coverSeries);if(book)(img.closest('.book-image-frame')||img).outerHTML=bookArtwork({...book,cover:null});},{once:true});
});}
// Book title and authors, editable in place (only those two fields of book.json are written).
function bookIdentity(book,status){
  return `<div class="identity-row"><h2 id="drawer-title" tabindex="-1">${esc(book.title)}</h2><button class="button quiet edit-inline" data-edit-book aria-label="Sửa tên sách và tác giả">Sửa</button></div><div class="drawer-meta"><span id="book-authors">${book.authors.length?esc(book.authors.join(', ')):'<span class="warn">Chưa ghi tác giả</span>'}</span><span class="status ${book.hasSource?'production':'planning'}">${esc(status)}</span></div>`;
}
function bookIdentityForm(book){
  return `<form id="book-identity-form" class="inline-edit"><label class="field"><span>Tên sách</span><input id="book-title-input" maxlength="300" required value="${esc(book.title)}" autocomplete="off"></label><label class="field"><span>Tác giả <small>(cách nhau bằng dấu phẩy)</small></span><input id="book-authors-input" maxlength="600" value="${esc(book.authors.join(', '))}" autocomplete="off"></label><div class="inline-edit-actions"><p id="book-identity-status" role="status"></p><button type="button" class="button quiet" data-cancel-book>Hủy</button><button type="submit" class="button primary">Lưu</button></div></form>`;
}
const currentBook=()=>state.drawer?.book&&state.data.books.find(b=>b.id===state.drawer.id&&b.series===state.drawer.series);
const bookStatusText=book=>book.hasSource&&book.status==='awaiting-source'?'Chờ kiểm tra nguồn':bookStatusNames[book.status]||book.status;
function editBook(on){const book=currentBook();if(!book)return;$('#book-identity').innerHTML=on?bookIdentityForm(book):bookIdentity(book,bookStatusText(book));(on?$('#book-title-input'):$('[data-edit-book]'))?.focus();}
async function saveBookIdentity(event){
  event.preventDefault();const book=currentBook();if(!book)return;const status=$('#book-identity-status');
  try{
    const result=await api('/api/book-meta',{series:book.series,id:book.id,title:$('#book-title-input').value,authors:$('#book-authors-input').value,revision:book.revision});
    Object.assign(book,{title:result.title,authors:result.authors,revision:result.revision});
    // Re-read the workspace and redraw the page so the cover artwork and book record show the new name.
    await refresh();await openBook(book.series,book.id,false);toast('Đã lưu tên sách và tác giả.');
  }catch(error){status.textContent=error.message;}
}
async function openBook(series,id,record=true){
  if(!canLeaveNotes())return;
  const book=state.data.books.find(b=>b.id===id&&b.series===series);if(!book)return;
  state.drawer={book:true,id,series};state.documentRequest++;
  if(record)recordRoute(location.pathname+location.search+'#book/'+encodeURIComponent(series)+'/'+encodeURIComponent(id),true);
  $('#drawer-eyebrow').textContent='TỦ SÁCH · HỒ SƠ NGHIÊN CỨU';
  const names={'research.md':'Nghiên cứu','season-plan.md':'Kế hoạch series','chapters.json':'Bản đồ chương','book.json':'Thông tin nguồn'};
  const status=book.hasSource&&book.status==='awaiting-source'?'Chờ kiểm tra nguồn':bookStatusNames[book.status]||book.status;
  $('#drawer-content').innerHTML=`<header class="book-page-head"><div id="book-identity">${bookIdentity(book,status)}</div><div class="book-notice">${esc(book.note||'Hồ sơ nghiên cứu dùng chung cho các tập trong series.')}</div></header><div class="book-page-layout"><aside class="book-page-aside"><section class="book-cover-editor"><div class="book-cover-preview">${bookArtwork(book)}</div><div><h3>Ảnh bìa</h3><p>JPG, PNG hoặc WebP · tối đa 8 MB.</p><label class="button secondary cover-picker">${book.cover?'Thay ảnh bìa':'Thêm ảnh bìa'}<input id="book-cover-upload" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Chọn ảnh bìa sách"></label><p id="cover-upload-status" role="status"></p></div></section><button class="button primary" data-project-from-book>＋ Lên ý tưởng một tập</button><section class="drawer-section"><h3>Nguồn sách</h3><p>Chép PDF vào thư mục riêng của cuốn sách trên máy. Không tự đọc, OCR hoặc gửi ra dịch vụ khác.</p><ul>${(book.sources||[]).map(f=>`<li>${esc(f.name)} · ${(f.size/1048576).toFixed(1)} MB</li>`).join('')||'<li>Chưa có PDF nguồn.</li>'}</ul><label class="field"><span>Thêm PDF (tối đa 200 MB/file)</span><input id="book-upload" type="file" accept=".pdf,application/pdf" multiple></label><p id="upload-status" role="status"></p></section></aside><div class="book-page-main"><section class="drawer-section"><h3>Tài liệu nghiên cứu</h3><div class="document-tabs">${book.documents.map(file=>`<button data-book-document="${esc(file)}">${esc(names[file]||file)}</button>`).join('')}</div><div id="document-view" class="document-view">Đang mở…</div></section></div></div>`;
  bindBookCoverFallbacks();
  showDrawer(true);if(book.documents.length)openBookDocument(book.documents.includes('season-plan.md')?'season-plan.md':book.documents[0]);
}
async function openBookDocument(file){const book=state.drawer;if(!book?.book)return;const request=++state.documentRequest;document.querySelectorAll('[data-book-document]').forEach(b=>b.classList.toggle('active',b.dataset.bookDocument===file));try{const doc=await api(`/api/book-document?series=${encodeURIComponent(book.series)}&book=${encodeURIComponent(book.id)}&file=${encodeURIComponent(file)}`);if(request===state.documentRequest)renderDocument(doc);}catch(error){if(request===state.documentRequest)$('#document-view').textContent=error.message;}}
async function saveNotes(){if(!state.drawer||state.drawer.book)return;const button=$('#save-notes'),text=$('#notes-text').value,id=state.drawer.id;button.disabled=true;try{const result=await api('/api/notes',{id,text,revision:state.drawer.notesRevision});if(state.drawer?.id===id){state.drawer.notes=text;state.drawer.notesRevision=result.revision;$('#notes-status').textContent='Đã lưu trên máy · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});}toast('Đã lưu ghi chú.');}catch(error){toast(error.message);}finally{button.disabled=false;}}
function field(name,label,type='text',value='',hint=''){return `<label class="field"><span>${esc(label)}</span><input name="${esc(name)}" type="${esc(type)}" autocomplete="off" ${name==='id'?'spellcheck="false"':''} value="${esc(value)}" ${name==='title'||name==='id'?'required':''} ${name==='id'?'pattern="[a-z0-9]+(-[a-z0-9]+)*"':''} ${type==='number'?'min="1" max="36000"':''}>${hint?`<small>${esc(hint)}</small>`:''}</label>`;}
function showCreate(mode='project',book=null){
  if(!state.data)return;state.createMode=mode;
  $('#create-error').hidden=true;$('#create-form').reset();
  $('#create-title').textContent='Thêm dự án';$('#submit-create').textContent='Tạo dự án';
  $('#create-description').textContent='Chỉ tạo hồ sơ chuẩn bị. Kịch bản, hình ảnh và giọng đọc được làm sau.';
  if(mode==='book'){
    $('#create-title').textContent='Thêm sách';$('#submit-create').textContent='Tạo hồ sơ sách';$('#create-description').textContent='Một hồ sơ cho mỗi cuốn; thêm PDF sau khi tạo.';
    $('#create-fields').innerHTML=`<label class="field"><span>Series</span><select name="series">${state.data.series.filter(s=>s.id==='book-insights').map(s=>`<option value="${esc(s.id)}" ${s.id===(state.series||'book-insights')?'selected':''}>${esc(s.title)}</option>`).join('')}</select></label>${field('title','Tên sách')}${field('id','Mã sách')}${field('authors','Tác giả (phân cách bằng dấu phẩy)')}`;
  }else{
    const selected=book?.series||state.series||state.data.series.find(s=>s.channel===state.channel)?.id||state.data.series[0].id;
    $('#create-fields').innerHTML=`<label class="field"><span>Series</span><select name="series" id="create-series">${state.data.series.map(s=>`<option value="${esc(s.id)}" ${s.id===selected?'selected':''}>${esc(state.data.channels.find(c=>c.id===s.channel)?.title)} / ${esc(s.title)}</option>`).join('')}</select></label>${field('title','Tên dự án')}${field('id','Mã dự án','text','','Mã duy nhất trong workspace. Bạn có thể chỉnh trước khi tạo.')}<div class="field-row"><label class="field"><span>Định dạng</span><select name="format" id="create-format"></select></label>${field('duration','Thời lượng (giây)','number','','Để trống nếu chưa chốt video dài.')}</div><label class="field" id="create-book-field"><span>Gắn với sách</span><select name="book" id="create-book"><option value="">Chưa gắn sách</option></select></label>`;
    updateCreateSeries(book);
  }
  $('#create-dialog').showModal();if(matchMedia('(pointer:fine)').matches)$('#create-fields input[name="title"]')?.focus();
}
function updateCreateSeries(book){
  const series=state.data.series.find(s=>s.id===$('#create-series').value);if(!series)return;
  $('#create-format').innerHTML=series.formats.map(f=>`<option value="${f}">${f==='short'?'Short':'Video dài'}</option>`).join('');
  const books=state.data.books.filter(b=>b.series===series.id);$('#create-book-field').hidden=!books.length;
  $('#create-book').innerHTML='<option value="">Chưa gắn sách</option>'+books.map(b=>`<option value="${esc(b.id)}">${esc(b.title)}</option>`).join('');
  if(book)$('#create-book').value=book.id;
  updateCreateDuration();
}
function updateCreateDuration(){const form=$('#create-form');const series=state.data.series.find(s=>s.id===form.elements.series?.value);form.elements.duration.value=series?.channel==='tam-ly-cuoc-song'&&form.elements.format.value==='short'?'45':'';}
async function openHash(){try{const parts=location.hash.slice(1).split('/').map(decodeURIComponent);if(parts[0]==='workflow'&&parts[1]&&parts[2])await openWorkflowStage(parts[1],parts[2],false);if(parts[0]==='project'&&parts[1])await openProject(parts[1],false);if(parts[0]==='book'&&parts[1]&&parts[2])await openBook(parts[1],parts[2],false);}catch{toast('Đường dẫn hồ sơ không hợp lệ.');}}
document.addEventListener('click',async event=>{
  const target=event.target.closest('button,a[data-project],a[data-channel],a[data-series],a[data-nav],a[data-watch],a[data-route],[data-books]');if(!target||target.disabled)return;
  if(target.tagName==='A'){if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;event.preventDefault();}
  if(target.hasAttribute('data-back'))back();
  else if(target.hasAttribute('data-route')){const p=new URL(target.href).searchParams;navigate({channel:p.get('channel')||'',series:p.get('series')||'',view:p.get('view')||'projects'});}
  else if(target.dataset.watch){event.preventDefault();watch(target.dataset.id,target.dataset.watch);}
  else if(target.dataset.studio)launchStudio(target.dataset.id,target.dataset.studio);
  else if(target.hasAttribute('data-delete-project'))askDelete('project',state.drawer.id);
  else if(target.dataset.nav==='all')navigate();
  else if(target.dataset.nav)navigate({view:target.dataset.nav});
  else if(target.hasAttribute('data-books'))navigate({channel:state.channel,series:state.series,view:'books'});
  else if(target.dataset.channel)navigate({channel:target.dataset.channel});
  else if(target.dataset.series){const series=state.data.series.find(s=>s.id===target.dataset.series);navigate({channel:series.channel,series:series.id});}
  else if(target.hasAttribute('data-open-voicestudio'))launchVoiceStudio(target);
  else if(target.hasAttribute('data-stop-voicestudio'))stopVoiceStudio(target);
  else if(target.hasAttribute('data-scroll-chosen')){$('#chosen-title')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});$('#chosen-list [data-play]')?.focus({preventScroll:true});}
  else if(target.dataset.play)playAudio(target);
  else if(target.dataset.pickVoice)togglePreferred(target.dataset.pickVoice);
  else if(target.dataset.expand){state.expanded=state.expanded===target.dataset.expand?'':target.dataset.expand;renderResourceList();$(`[data-expand="${CSS.escape(target.dataset.expand)}"]`)?.focus();}
  else if(target.hasAttribute('data-add-audio')){state.addAudioOpen=!state.addAudioOpen;state.resourceKey='';renderResources().then(()=>{if(state.addAudioOpen)$('#audio-files')?.focus();else $('[data-add-audio]')?.focus();});}
  else if(target.dataset.musicTab){state.musicTab=target.dataset.musicTab;state.resourceFilter='';state.expanded='';state.resourceKey='';renderResources();}
  else if(target.dataset.resourceFilter!==undefined&&target.closest('#resource-view')){state.resourceFilter=target.dataset.resourceFilter;$('#resource-filter').value=state.resourceFilter;renderResourceList();}
  else if(target.dataset.workflowStage)openWorkflowStage(state.series,target.dataset.workflowStage);
  else if(target.dataset.project)openProject(target.dataset.project);
  else if(target.dataset.book)openBook(target.dataset.bookSeries,target.dataset.book);
  else if(target.dataset.document)openDocument(target.dataset.document);
  else if(target.dataset.bookDocument)openBookDocument(target.dataset.bookDocument);
  else if(target.hasAttribute('data-more')){state.limit+=12;renderCards();}
  else if(target.hasAttribute('data-empty-action')){if(state.query||state.status){state.query='';state.status='';$('#search').value='';$('#status-filter').value='';updateUrl();renderCards();}else showCreate(state.view==='books'?'book':'project');}
  else if(target.dataset.folder){try{await api('/api/open-folder',{id:state.drawer.id,group:target.dataset.folder});}catch(error){toast(error.message);}}
  else if(target.hasAttribute('data-project-from-book'))showCreate('project',state.drawer);
});
$('#refresh-button').addEventListener('click',()=>refresh());
$('#new-project-button').addEventListener('click',()=>showCreate());
$('#search').addEventListener('input',event=>{state.query=event.target.value;state.limit=12;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{updateUrl();renderCards();},100);});
$('#series-filter').addEventListener('change',event=>navigate({channel:state.channel,series:event.target.value}));
$('#status-filter').addEventListener('change',event=>{state.status=event.target.value;state.limit=12;updateUrl();renderCards();});
$('#sort-filter').addEventListener('change',event=>{state.sort=event.target.value;updateUrl();renderCards();});
$('#grid-view').addEventListener('click',()=>{state.layout='grid';updateUrl();$('#grid-view').classList.add('active');$('#list-view').classList.remove('active');renderCards();});
$('#list-view').addEventListener('click',()=>{state.layout='list';updateUrl();$('#grid-view').classList.remove('active');$('#list-view').classList.add('active');renderCards();});
$('#drawer-content').addEventListener('submit',event=>{if(event.target.id==='book-identity-form')saveBookIdentity(event);});
$('#drawer-content').addEventListener('keydown',event=>{if(event.key==='Escape'&&event.target.closest('#book-identity-form')){event.stopPropagation();editBook(false);}});
$('#drawer-content').addEventListener('click',event=>{if(event.target.closest('[data-edit-book]'))editBook(true);if(event.target.closest('[data-cancel-book]'))editBook(false);if(event.target.closest('#save-notes'))saveNotes();if(event.target.closest('#save-workflow'))saveWorkflowStage();});
$('#close-drawer').addEventListener('click',closeDrawer);$('#drawer-backdrop').addEventListener('click',closeDrawer);
$('#help-button').addEventListener('click',()=>$('#help-dialog').showModal());$('#close-help').addEventListener('click',()=>$('#help-dialog').close());
$('#mobile-menu').addEventListener('click',()=>setMenu(!$('#sidebar').classList.contains('open')));
$('#close-mobile-menu').addEventListener('click',()=>setMenu(false));$('#menu-backdrop').addEventListener('click',()=>setMenu(false));
$('#close-create').addEventListener('click',()=>$('#create-dialog').close());$('#cancel-create').addEventListener('click',()=>$('#create-dialog').close());
$('#create-fields').addEventListener('change',event=>{if(event.target.id==='create-series')updateCreateSeries();if(event.target.id==='create-format')updateCreateDuration();});
$('#create-fields').addEventListener('input',event=>{if(event.target.name==='id')event.target.dataset.manuallyEdited='true';if(event.target.name==='title'){const input=$('#create-fields input[name="id"]');if(!input.dataset.manuallyEdited)input.value=fold(event.target.value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90).replace(/-$/,'');}});
$('#create-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('#submit-create');button.disabled=true;$('#create-error').hidden=true;try{const body=Object.fromEntries(new FormData(event.target));const result=await api(state.createMode==='book'?'/api/books':'/api/projects',body);$('#create-dialog').close();await refresh();if(state.createMode==='book'){toast('Đã tạo hồ sơ sách.');openBook(result.series,result.id);}else{toast('Đã tạo hồ sơ dự án.');openProject(result.id);}}catch(error){$('#create-error').textContent=error.message;$('#create-error').hidden=false;$('#create-error').focus();}finally{button.disabled=false;}});
document.addEventListener('keydown',event=>{
  const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
  if(event.key==='/'&&!typing&&!$('#create-dialog').open&&!$('#help-dialog').open&&!$('#media-dialog').open&&!$('#delete-dialog').open){event.preventDefault();(resourceViews[state.view]?$('#resource-search'):$('#search'))?.focus();}
  if(event.key==='Escape'&&!$('#create-dialog').open&&!$('#help-dialog').open&&!$('#media-dialog').open&&!$('#delete-dialog').open){if(!$('#drawer').hidden)closeDrawer();setMenu(false);}
  if(event.key==='Tab'&&!$('#drawer').hidden&&!$('#drawer').classList.contains('book-page')&&!$('#create-dialog').open&&!$('#help-dialog').open&&!$('#media-dialog').open&&!$('#delete-dialog').open){const nodes=[...$('#drawer').querySelectorAll('button,a,textarea,select,input')].filter(n=>!n.disabled&&n.offsetParent!==null);const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
window.addEventListener('beforeunload',event=>{if(dirtyNotes()){event.preventDefault();event.returnValue='';}});
window.addEventListener('focus',()=>{if(state.data)refresh();});
document.querySelectorAll('[data-icon]').forEach(node=>node.innerHTML=icon(node.dataset.icon));
$('#status-filter').value=state.status;$('#sort-filter').value=state.sort;
$('#grid-view').classList.toggle('active',state.layout==='grid');$('#list-view').classList.toggle('active',state.layout==='list');
window.addEventListener('popstate',restoreRoute);
refresh(true);

let selectedMedia=null,deletePlan=null;
// VoiceStudio runs locally on 127.0.0.1:3900; the first start loads its backend (about a minute on CPU).
async function launchVoiceStudio(button){
  const popup=window.open('about:blank','_blank');
  if(popup){popup.opener=null;popup.document.title='Đang mở Studio giọng nói';popup.document.body.textContent='Đang khởi động VoiceStudio trên máy… Lần đầu có thể mất 1–2 phút.';}
  if(button)button.disabled=true;toast('Đang khởi động Studio giọng nói…');
  state.voiceStudio={...(state.voiceStudio||{}),state:state.voiceStudio?.state==='ready'?'ready':'starting'};renderVoiceStudio();
  try{const result=await api('/api/voicestudio',{});if(popup)popup.location.href=result.url;else toast(`Studio giọng nói đã sẵn sàng tại ${result.url}. Cho phép cửa sổ bật lên rồi bấm lại.`);}
  catch(e){if(popup)popup.close();toast(e.message);}
  finally{if(button)button.disabled=false;refreshVoiceStudio();}
}
async function launchStudio(id,composition){
  const popup=window.open('about:blank','_blank');
  if(popup){popup.opener=null;popup.document.title='Đang mở Studio';popup.document.body.textContent='Đang kiểm tra và khởi động Remotion Studio…';}
  toast('Đang kiểm tra và mở Studio…');
  try{const result=await api('/api/studio',{id,composition});if(popup)popup.location.href=result.url;else toast('Studio đã sẵn sàng tại localhost:3000. Cho phép cửa sổ bật lên rồi bấm lại.');}
  catch(e){if(popup)popup.close();toast(e.message);}
}
async function watch(id,kind){
  const p=state.data.projects.find(p=>p.id===id);if(!p)return;
  selectedMedia={id,composition:kind==='video'?p.videoId:p.thumbnailId};
  if(!(kind==='video'?p.renderedVideo:p.renderedThumbnail))return launchStudio(id,selectedMedia.composition);
  $('#media-title').textContent=p.title;$('#media-status').textContent='Bản đã xuất trên máy; các chỉnh sửa mới trong Studio có thể chưa có trong bản này.';
  const media=document.createElement(kind==='video'?'video':'img');media.src=`/api/media?id=${encodeURIComponent(id)}&kind=${kind}`;
  if(kind==='video'){media.controls=true;media.playsInline=true;media.preload='metadata';if(p.renderedThumbnail)media.poster=`/api/media?id=${encodeURIComponent(id)}&kind=thumbnail`;}else media.alt='Thumbnail đã xuất — '+p.title;
  media.addEventListener('error',()=>$('#media-status').textContent='Không đọc được bản xuất. Bạn có thể mở Studio bằng nút bên dưới.');
  $('#media-content').replaceChildren(media);$('#media-dialog').showModal();
}
$('#close-media').onclick=()=>$('#media-dialog').close();
$('#media-dialog').addEventListener('close',()=>$('#media-content').replaceChildren());
$('#media-studio').onclick=()=>launchStudio(selectedMedia.id,selectedMedia.composition);
$('#new-book-button').onclick=()=>showCreate('book');
async function askDelete(kind,id){
  if(!canLeaveNotes())return;
  try{deletePlan=await api('/api/delete-preview',{kind,id});$('#delete-title').textContent='Xóa '+deletePlan.title+'?';
    $('#delete-summary').textContent=deletePlan.registrations||deletePlan.rendered?`Có ${deletePlan.registrations} bản dựng/thumbnail và ${deletePlan.rendered} file đã xuất. ${deletePlan.projectCount} dự án, ${deletePlan.files} file sẽ được chuyển vào thùng rác.`:`Chưa có sản phẩm trong dự án này. Vẫn có ${deletePlan.files} file hồ sơ và ${deletePlan.projectCount} dự án. Bạn có muốn xóa?`;
    $('#delete-paths').innerHTML=deletePlan.paths.map(p=>`<li>${esc(p)}</li>`).join('');$('#delete-error').textContent='';$('#delete-dialog').showModal();
  }catch(e){toast(e.message);}
}
$('#cancel-delete').onclick=()=>$('#delete-dialog').close();
$('#confirm-delete').onclick=async()=>{const button=$('#confirm-delete');button.disabled=true;try{const result=await api('/api/delete',{...deletePlan,confirm:true});$('#delete-dialog').close();if(!$('#drawer').hidden){state.drawer=null;closeDrawer();}await refresh();toast('Đã chuyển vào '+result.trash);}catch(e){$('#delete-error').textContent=e.message;}finally{button.disabled=false;}};
$('#drawer-content').addEventListener('change',async event=>{
  if(event.target.id!=='book-upload')return;const input=event.target,book={...state.drawer},status=$('#upload-status');input.disabled=true;
  try{for(const file of input.files){if(file.size>200*1048576)throw Error('PDF tối đa 200 MB');status.textContent='Đang chép '+file.name+'…';const response=await fetch(`/api/book-source?series=${encodeURIComponent(book.series)}&book=${encodeURIComponent(book.id)}&name=${encodeURIComponent(file.name)}`,{method:'POST',headers:{'Content-Type':'application/pdf','X-Workspace-Token':state.data.token},body:file});const result=await response.json();if(!response.ok)throw Error(result.error);status.textContent='Đã chép vào '+result.path;}
    await refresh();if(state.drawer?.book&&state.drawer.id===book.id)openBook(book.series,book.id);toast('Đã thêm PDF nguồn. Chưa kiểm tra nội dung sách.');
  }catch(e){status.textContent=e.message;}finally{input.disabled=false;input.value='';}
});

$('#drawer-content').addEventListener('change',async event=>{
  if(event.target.id!=='book-cover-upload')return;
  const input=event.target,file=input.files[0],book={...state.drawer},status=$('#cover-upload-status');if(!file||!book.book)return;
  input.disabled=true;
  try{
    if(file.size>8*1024*1024)throw Error('Ảnh bìa tối đa 8 MB.');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Hãy chọn ảnh JPG, PNG hoặc WebP.');
    status.textContent='Đang kiểm tra ảnh…';let bitmap;try{bitmap=await createImageBitmap(file);}catch{throw Error('Không đọc được ảnh. Hãy chọn một ảnh khác.');}bitmap.close();
    status.textContent='Đang lưu ảnh bìa…';
    const response=await fetch(`/api/book-cover?series=${encodeURIComponent(book.series)}&book=${encodeURIComponent(book.id)}`,{method:'POST',headers:{'Content-Type':file.type,'X-Workspace-Token':state.data.token},body:file});
    const result=await response.json();if(!response.ok)throw Error(result.error||'Không lưu được ảnh bìa.');
    await refresh();if(state.drawer?.book&&state.drawer.id===book.id&&state.drawer.series===book.series)await openBook(book.series,book.id,false);
    toast('Đã lưu ảnh bìa sách.');
  }catch(e){status.textContent=e.message;}finally{input.disabled=false;input.value='';}
});

// Series production workflow: stages come from production automation; only rules/notes are editable.
async function loadWorkflow(series){
  state.workflowStale=false;
  try{const flow=await api('/api/workflow?series='+encodeURIComponent(series));if(state.series===series){state.workflow=flow;renderWorkflow();}return flow;}
  catch(error){if(state.series===series){state.workflow={series,error:error.message};renderWorkflow();}return null;}
}
function stepCount(config){return config.rules.length+(config.notes.trim()?1:0);}
function renderWorkflow(){
  const box=$('#workflow'),show=Boolean(state.series)&&state.view==='projects';box.hidden=!show;if(!show)return;
  const flow=state.workflow;
  if(!flow||flow.series!==state.series||state.workflowStale){loadWorkflow(state.series);if(!flow||flow.series!==state.series){box.innerHTML='<p class="workflow-empty">Đang đọc quy trình của series…</p>';return;}}
  if(flow.error){box.innerHTML=`<p class="workflow-empty">Không đọc được quy trình: ${esc(flow.error)}</p>`;return;}
  const general=stepCount(flow.general),byId=Object.fromEntries(flow.stages.map(s=>[s.id,s]));
  const heading=`<div class="workflow-heading"><div><h2 id="workflow-title">Quy trình sản xuất</h2><p>${flow.profileTitle?`${esc(flow.profileTitle)} · ${flow.stages.length} bước. `:''}Bấm một bước để xem việc cần làm, thêm quy tắc hoặc ghi chú cho agent.</p></div><button class="button secondary" data-workflow-stage="general">Quy tắc chung${general?` <span class="workflow-count">${general}</span>`:''}</button></div>`;
  if(!flow.stages.length){box.innerHTML=heading+'<p class="workflow-empty">Series này chưa có quy trình sản xuất được duyệt. Bạn vẫn có thể ghi quy tắc chung cho series.</p>';return;}
  const step=s=>{
    const deps=s.dependencies.map(d=>byId[d].number),sequential=deps.length===1&&deps[0]===s.number-1;
    const parallel=flow.stages.filter(o=>o.id!==s.id&&o.dependencies.join()===s.dependencies.join()).map(o=>o.number);
    const count=stepCount(s.config);
    return `<li><button class="workflow-step mode-${esc(s.automation.mode)}" data-workflow-stage="${esc(s.id)}" aria-label="Bước ${s.number}: ${esc(s.title)}, ${esc(stepModes[s.automation.mode])}${count?`, ${count} quy tắc hoặc ghi chú`:''}"><span class="step-number">${s.number}</span><span class="step-body"><strong>${esc(s.title)}</strong><small class="step-mode">${esc(stepModes[s.automation.mode])}</small>${deps.length&&!sequential?`<small>Sau bước ${deps.join(', ')}${parallel.length?`, song song với bước ${parallel.join(', ')}`:''}</small>`:''}</span>${count?`<span class="step-notes" title="Quy tắc và ghi chú đã thêm">${count}</span>`:''}</button></li>`;
  };
  const legend=[...new Set(flow.stages.map(s=>s.automation.mode))].map(m=>`<li class="mode-${esc(m)}">${esc(stepModes[m])}</li>`).join('');
  box.innerHTML=heading+`<ul class="workflow-legend" aria-label="Chú thích">${legend}</ul><div class="workflow-phases">${flow.phases.map(p=>`<section class="workflow-phase"><h3>${esc(p.title)}</h3><ol>${p.stages.map(id=>byId[id]).sort((a,b)=>a.number-b.number).map(step).join('')}</ol></section>`).join('')}</div>`;
}
async function openWorkflowStage(series,key,record=true){
  if(!canLeaveNotes())return;
  const flow=state.workflow?.series===series&&!state.workflow.error?state.workflow:await loadWorkflow(series);if(!flow)return toast('Không đọc được quy trình của series.');
  const stage=key==='general'?null:flow.stages.find(s=>s.id===key);if(key!=='general'&&!stage)return toast('Không tìm thấy bước này.');
  const config=stage?stage.config:flow.general,title=stage?stage.title:'Quy tắc chung';
  state.drawer={workflow:true,id:key,series,title:'Quy trình: '+title,revision:flow.revision,rulesText:config.rules.join('\n'),notes:config.notes};state.documentRequest++;
  if(record)recordRoute(location.pathname+location.search+'#workflow/'+encodeURIComponent(series)+'/'+encodeURIComponent(key),true);
  $('#drawer-eyebrow').textContent=stage?`QUY TRÌNH · BƯỚC ${stage.number}/${flow.stages.length}`:'QUY TRÌNH · CẢ SERIES';
  const list=items=>`<ul class="workflow-list">${items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`,paths=items=>`<ul class="workflow-paths">${items.map(i=>`<li><code>${esc(i)}</code></li>`).join('')}</ul>`;
  const byId=Object.fromEntries(flow.stages.map(s=>[s.id,s])),name=id=>`${byId[id].number}. ${byId[id].title}`;
  let body;
  if(stage){
    const a=stage.automation;
    body=`<div class="drawer-meta"><span class="workflow-mode mode-${esc(a.mode)}">${esc(stepModes[a.mode])}</span><span>${esc(flow.title)}</span></div>
<section class="drawer-section"><h3>Việc của bước</h3><p>${esc(stage.guide)}</p>${stage.dependencies.length?`<p class="workflow-aside">Làm sau: ${esc(stage.dependencies.map(name).join(', '))}.</p>`:''}</section>
<section class="drawer-section"><h3>Cách thực hiện</h3><p>${esc(a.text.replace(/`/g,''))}</p>${a.command?`<p class="workflow-command"><code>${esc(a.command)}</code></p><small class="workflow-aside">Thay &lt;slug&gt; bằng mã dự án.</small>`:''}</section>
${stage.reads.length||stage.writes.length?`<section class="drawer-section"><h3>Đầu vào và đầu ra</h3>${stage.reads.length?`<p class="workflow-label">Đọc</p>${paths(stage.reads)}`:''}${stage.writes.length?`<p class="workflow-label">Ghi</p>${paths(stage.writes)}`:''}${stage.invalidates.length?`<p class="workflow-aside">Khi kết quả bước này thay đổi, cần kiểm lại: ${esc(stage.invalidates.map(name).join(', '))}.</p>`:''}</section>`:''}`;
  }else body=`<div class="drawer-meta"><span>${esc(flow.title)}</span></div><section class="drawer-section"><h3>Quy tắc sẵn có</h3>${flow.builtInRules.length?`<p class="workflow-aside">Luôn áp dụng cho các bước agent soạn trong series này.</p>${list(flow.builtInRules)}`:'<p>Series này chưa có quy trình sản xuất được duyệt, nên chưa có quy tắc sẵn.</p>'}</section>`;
  $('#drawer-content').innerHTML=`<h2 id="drawer-title">${esc(title)}</h2>${body}
<section class="drawer-section workflow-form"><h3>${stage?'Quy tắc và ghi chú của bạn':'Quy tắc chung của bạn'}</h3>
<label class="field"><span>Quy tắc bổ sung</span><textarea id="workflow-rules" class="notes-input workflow-input" rows="5" maxlength="16000" placeholder="Mỗi dòng một quy tắc agent phải tuân theo">${esc(state.drawer.rulesText)}</textarea><small>Mỗi dòng là một quy tắc${stage?' cho bước này':' cho mọi bước của series'}.</small></label>
<label class="field"><span>Ghi chú cho agent</span><textarea id="workflow-notes" class="notes-input workflow-input" rows="6" maxlength="10000" placeholder="Bối cảnh, ví dụ nên theo, điều cần tránh…">${esc(config.notes)}</textarea></label>
<div class="notes-footer"><small id="workflow-status">Lưu vào <code>${esc(flow.file)}</code>. Không mở khóa render, đăng tải hay sinh nội dung trả phí.</small><button class="button primary" id="save-workflow">Lưu quy tắc và ghi chú</button></div></section>`;
  showDrawer();
}
async function saveWorkflowStage(){
  const drawer=state.drawer;if(!drawer?.workflow)return;const button=$('#save-workflow'),rulesText=$('#workflow-rules').value,notes=$('#workflow-notes').value;button.disabled=true;
  try{
    const rules=rulesText.split('\n').map(r=>r.trim()).filter(Boolean);
    const result=await api('/api/workflow',{series:drawer.series,stage:drawer.id,rules,notes,revision:drawer.revision});
    if(state.drawer===drawer){Object.assign(drawer,{revision:result.revision,rulesText:rules.join('\n'),notes:notes.replace(/\s+$/,'')});$('#workflow-rules').value=drawer.rulesText;$('#workflow-notes').value=drawer.notes;$('#workflow-status').textContent='Đã lưu · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});}
    toast('Đã lưu quy tắc và ghi chú.');if(state.series===drawer.series)await loadWorkflow(drawer.series);
  }catch(error){toast(error.message);}finally{button.disabled=false;}
}

// Voice and music library. One shared player at the bottom plays voice samples, music and SFX and keeps
// playing while you browse; the only write here is choosing voices for the preferred playlist.
const player=$('#player-audio');
const audioUrl=(kind,key)=>`/api/audio?kind=${kind}&key=${encodeURIComponent(key)}`;
function syncPlayButtons(){
  $('#player-toggle').innerHTML=icon(player.paused?'play':'pause');$('#player-toggle').setAttribute('aria-label',(player.paused?'Phát ':'Tạm dừng ')+$('#player-title').textContent);
  document.querySelectorAll('[data-play]').forEach(b=>{const on=state.playing===`${b.dataset.play}:${b.dataset.key}`&&!player.paused;
    b.setAttribute('aria-pressed',String(on));b.innerHTML=icon(on?'pause':'play');b.setAttribute('aria-label',(on?'Tạm dừng ':'Phát ')+b.dataset.title);});
}
function playAudio(button){
  const id=`${button.dataset.play}:${button.dataset.key}`;
  if(state.playing===id&&!player.paused){player.pause();return;}
  if(state.playing!==id){state.playing=id;player.src=audioUrl(button.dataset.play,button.dataset.key);$('#player-title').textContent=button.dataset.title;$('#player-subtitle').textContent=button.dataset.subtitle||'';}
  $('#player-bar').hidden=false;document.body.classList.add('has-player');
  // Pausing or switching before playback starts rejects play() with AbortError; that is not a failure.
  player.play().catch(error=>{if(error.name!=='AbortError')toast('Không phát được file âm thanh này.');});
}
for(const type of ['play','pause','ended'])player.addEventListener(type,syncPlayButtons);
$('#player-toggle').addEventListener('click',()=>{if(player.paused)player.play().catch(error=>{if(error.name!=='AbortError')toast('Không phát được file âm thanh này.');});else player.pause();});
$('#player-close').addEventListener('click',()=>{player.pause();player.removeAttribute('src');player.load();state.playing='';$('#player-bar').hidden=true;document.body.classList.remove('has-player');syncPlayButtons();});
const playButton=(kind,key,title,subtitle='')=>`<button class="play-button" data-play="${kind}" data-key="${esc(key)}" data-title="${esc(title)}" data-subtitle="${esc(subtitle)}" aria-pressed="false" aria-label="Phát ${esc(title)}">${icon('play')}</button>`;

async function renderResources(){
  const view=state.view,box=$('#resource-view');state.library=state.library||{};
  if(!state.library[view]||state.resourceStale){
    if(!state.library[view])box.innerHTML='<p class="workflow-empty">Đang đọc thư viện…</p>';
    try{state.library[view]=await api(view==='voices'?'/api/voices':'/api/music');state.resourceStale=false;}
    catch(error){if(state.view===view)box.innerHTML=`<p class="workflow-empty">Không đọc được thư viện: ${esc(error.message)}</p>`;return;}
    if(state.view!==view)return;
  }
  // Rebuild only when the data or tab changed, so a refresh on window focus keeps typing and playback intact.
  const key=view+(view==='music'?state.musicTab||'tracks':'')+JSON.stringify(state.library[view]);
  if(state.resourceKey===key&&box.querySelector('#resource-list'))return;
  state.resourceKey=key;view==='voices'?voiceShell(state.library.voices):musicShell(state.library.music);renderResourceList();renderVoiceStudio();
}
const toolbar=(placeholder,selects)=>`<div class="resource-toolbar"><label class="search-field"><span data-icon="search" aria-hidden="true">${icon('search')}</span><input id="resource-search" type="search" autocomplete="off" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" value="${esc(state.query)}"></label>${selects}<span class="filter-result" id="resource-count" aria-live="polite"></span></div>`;
const select=(id,label,options,value)=>`<label class="sr-only" for="${id}">${esc(label)}</label><select id="${id}">${options.map(([v,t])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
const usageList=(items,extra=()=> '')=>`<ul class="usage-list">${items.map(p=>`<li><a href="#project/${encodeURIComponent(p.id)}" data-project="${esc(p.id)}">${esc(p.title)}</a><small>${esc(p.seriesTitle)}${extra(p)}</small></li>`).join('')}</ul>`;

function voiceShell(data){
  const regions=[...new Set(data.voices.map(v=>v.region))],f=state.voiceFilters||{};
  $('#resource-view').innerHTML=`<section class="voice-options" aria-labelledby="voice-options-title"><h2 id="voice-options-title">Hai cách lấy giọng cho video mới</h2>
<div class="voice-option-grid"><article class="voice-option"><div class="vo-head"><span class="vo-num" aria-hidden="true">1</span><strong>Giọng có sẵn</strong><span class="tag">Mặc định</span></div><p>25 giọng VieNeu chạy trên máy, nhanh. Ưu tiên nhóm giọng đã chọn; video thiếu nhi giữ Trúc Ly giọng B. Nghe và chọn ở danh sách bên dưới.</p><div class="vs-actions"><button class="button secondary" data-scroll-chosen>Xem giọng có sẵn</button></div></article>
<article class="voice-option studio-callout" id="vs-panel" aria-labelledby="vs-title" aria-live="polite"></article></div>
<p class="resource-note">Ghi lựa chọn vào brief của tập, ví dụ “Giọng: cách 1 — Hải Đăng”. Không ghi thì dùng cách 1.</p></section><section class="resource-block" aria-labelledby="chosen-title"><div class="resource-heading"><h2 id="chosen-title">${esc(data.playlist?.name||'Giọng đã chọn')} <span class="count" id="chosen-count"></span></h2><p>Nhóm ưu tiên khi làm nội dung mới. Bấm “Chọn giọng” ở bất kỳ giọng nào để thêm vào đây. Chọn giọng không đổi giọng của video đã có.</p></div><div class="voice-grid" id="chosen-list"></div></section>
<section class="resource-block" aria-labelledby="all-voices-title"><div class="resource-heading"><h2 id="all-voices-title">Tất cả giọng VieNeu <span class="count">${data.voices.length}</span></h2><p>Mỗi mẫu đọc cùng một đoạn: “${esc(data.sampleText)}” Mẫu đã qua kiểm tra nhận dạng chữ, chưa có nghĩa là đã nghe duyệt. Giọng B thiếu nhi là Trúc Ly nâng 2,5 semitone; mẫu ở đây là preset gốc.</p></div>
${toolbar('Tìm tên giọng hoặc tên tập',select('voice-gender','Lọc giới tính',[['','Nam và nữ'],['Nam','Giọng nam'],['Nữ','Giọng nữ']],f.gender||'')+select('voice-region','Lọc vùng',[['','Mọi vùng'],...regions.map(r=>[r,'Giọng '+r])],f.region||'')+select('voice-use','Lọc theo sử dụng',[['','Mọi giọng'],['used','Đang dùng trong tập'],['unused','Chưa tập nào dùng']],f.use||''))}
<div class="voice-grid" id="resource-list"></div>${data.otherVoices.length||data.unrecorded?`<p class="resource-note">${data.otherVoices.map(o=>`${esc(o.name)}: ${o.usedBy.length} tập (không có trong bộ mẫu). `).join('')}${data.unrecorded?`${data.unrecorded} tập chưa ghi giọng trong metadata.`:''}</p>`:''}</section>`;
}
function voiceCard(v){
  const used=v.usedBy.length?`<details class="usage"><summary>Dùng trong ${v.usedBy.length} tập</summary>${usageList(v.usedBy)}</details>`:'<p class="usage-none">Chưa tập nào dùng</p>';
  return `<article class="voice-card${v.preferred?' is-chosen':''}">${v.sample?playButton('voice',v.id,v.name,`Giọng mẫu số ${v.number}, ${v.gender}, ${v.region}`):''}<div class="voice-main"><h3>${esc(v.name)} <small>số ${v.number}</small></h3><p>${esc(v.gender)}, giọng ${esc(v.region)}${v.durationSeconds?`, mẫu ${Math.round(v.durationSeconds)} giây`:''}</p>${v.name==='Trúc Ly'?'<div class="tags"><span class="tag">Gốc của giọng B thiếu nhi</span></div>':''}</div><button class="button pick-button ${v.preferred?'quiet':'secondary'}" data-pick-voice="${esc(v.name)}" aria-pressed="${v.preferred}">${v.preferred?'Bỏ chọn':`${icon('plus')} Chọn giọng`}</button>${used}</article>`;
}
function renderVoiceList(data){
  const f=state.voiceFilters||{},q=fold(state.query);
  const shown=data.voices.filter(v=>(!f.gender||v.gender===f.gender)&&(!f.region||v.region===f.region)&&(f.use!=='used'||v.usedBy.length)&&(f.use!=='unused'||!v.usedBy.length)
    &&(!q||fold(`${v.name} ${v.usedBy.map(p=>p.title).join(' ')}`).includes(q)));
  const chosen=data.playlist?.voiceNames.map(n=>data.voices.find(v=>v.name===n)).filter(Boolean)||[];
  $('#chosen-count').textContent=chosen.length;
  $('#chosen-list').innerHTML=chosen.map(voiceCard).join('')||'<p class="workflow-empty">Chưa chọn giọng nào. Bấm “Chọn giọng” ở danh sách bên dưới.</p>';
  $('#resource-list').innerHTML=shown.map(voiceCard).join('')||'<p class="workflow-empty">Không có giọng khớp tìm kiếm và bộ lọc.</p>';
  $('#resource-count').textContent=`${shown.length} / ${data.voices.length} giọng`;
}
async function togglePreferred(name){
  const data=state.library.voices,current=data.playlist.voiceNames,adding=!current.includes(name);
  const voiceNames=adding?[...current,name]:current.filter(n=>n!==name);
  document.querySelectorAll('[data-pick-voice]').forEach(b=>b.disabled=true);
  try{
    const result=await api('/api/voice-playlist',{voiceNames,revision:data.playlist.revision});
    data.playlist.voiceNames=result.voiceNames;data.playlist.revision=result.revision;for(const v of data.voices)v.preferred=result.voiceNames.includes(v.name);
    state.resourceKey='voices'+JSON.stringify(data);renderResourceList();
    $(`#resource-list [data-pick-voice="${CSS.escape(name)}"]`)?.focus();
    toast(adding?`Đã thêm ${name} vào ${data.playlist.name}.`:`Đã bỏ ${name} khỏi ${data.playlist.name}.`);
  }catch(error){toast(error.message);document.querySelectorAll('[data-pick-voice]').forEach(b=>b.disabled=false);}
}

const fileSize=bytes=>bytes==null?'':bytes>1048576?`${(bytes/1048576).toFixed(1)} MB`:`${Math.round(bytes/1024)} KB`;
const level=value=>value==null?'—':String(value).replace('.',',');
function musicShell(data){
  const tab=state.musicTab||'tracks',tracks=[...data.tracks,...data.unused];
  const uses=data.tracks.reduce((n,t)=>n+t.usedBy.length,0),uncredited=data.tracks.reduce((n,t)=>n+t.uncredited,0);
  const filters=tab==='tracks'?[['','Mọi bài'],['used','Đang dùng'],['unused','Chưa dùng'],['uncredited','Thiếu credit'],['shared','Dùng chung'],['own','Trong thư mục tập']]:[['','Mọi hiệu ứng'],['library','Thư viện dùng chung'],['on','Đang bật trong tập'],['off','Đang tắt trong tập']];
  const sorts=tab==='tracks'?[['used','Dùng nhiều nhất'],['title','Tên A → Z'],['size','Dung lượng lớn nhất']]:[['title','Tên tập A → Z'],['size','Dung lượng lớn nhất']];
  if(!filters.some(([v])=>v===(state.resourceFilter||'')))state.resourceFilter='';
  if(!sorts.some(([v])=>v===state.resourceSort))state.resourceSort=sorts[0][0];
  $('#resource-view').innerHTML=`<div class="segmented" role="group" aria-label="Loại âm thanh"><button data-music-tab="tracks" aria-pressed="${tab==='tracks'}">Nhạc nền <span>${tracks.length}</span></button><button data-music-tab="effects" aria-pressed="${tab==='effects'}">Hiệu ứng âm thanh <span>${data.effects.length}</span></button></div>
${addAudioPanel(tab)}
${tab==='tracks'?`<p class="resource-summary">${tracks.length} bài, ${data.tracks.length} bài đang dùng trong ${uses} tập. ${uncredited?`<button class="link-button" data-resource-filter="uncredited">${uncredited} tập thiếu tên bài hoặc tác giả</button> — mô tả đăng bài cần cả hai.`:''}</p>`:'<p class="resource-summary">Hiệu ứng dùng chung trong thư viện và lớp âm thanh của từng tập (đọc từ sfx.json).</p>'}
${toolbar(tab==='tracks'?'Tìm bài, tác giả, file hoặc tên tập':'Tìm tên tập hoặc file',select('resource-filter','Lọc',filters,state.resourceFilter||'')+select('resource-sort','Sắp xếp',sorts,state.resourceSort))}
<div class="row-head" aria-hidden="true">${tab==='tracks'?'<span></span><span>Bài nhạc</span><span>Nguồn</span><span>Đang dùng</span><span>Credit</span><span></span>':'<span></span><span>Tập</span><span>Loại</span><span>Trạng thái</span><span></span><span></span>'}</div><ul class="resource-rows" id="resource-list"></ul>`;
}
// Copy audio the user picks from any folder into public/audio-library/<music|sfx>/. Never overwrites.
function addAudioPanel(tab){
  const kind=tab==='effects'?'sfx':'music',open=state.addAudioOpen;
  return `<section class="add-audio${open?' open':''}" aria-labelledby="add-audio-title"><div class="add-audio-head"><div><h2 id="add-audio-title">Thêm vào thư viện</h2><p>Chọn file từ thư mục bất kỳ trên máy; trang chép một bản vào thư viện dùng chung của workspace. File gốc giữ nguyên.</p></div><button class="button ${open?'quiet':'primary'}" data-add-audio aria-expanded="${open?'true':'false'}" aria-controls="add-audio-form">${open?'Đóng':'＋ Thêm nhạc hoặc hiệu ứng'}</button></div>
${open?`<form id="add-audio-form" class="add-audio-form"><fieldset class="add-audio-kind"><legend>Loại</legend><label><input type="radio" name="audio-kind" value="music" ${kind==='music'?'checked':''}> Nhạc nền</label><label><input type="radio" name="audio-kind" value="sfx" ${kind==='sfx'?'checked':''}> Hiệu ứng âm thanh</label></fieldset>
<label class="field"><span>File âm thanh (WAV, MP3, M4A, OGG, FLAC)</span><input id="audio-files" type="file" accept=".wav,.mp3,.m4a,.ogg,.flac,audio/*" multiple required></label>
<div class="field-row"><label class="field"><span>Tên bài <small>(không bắt buộc, khi chọn một file)</small></span><input id="audio-title" maxlength="200" autocomplete="off" placeholder="Mặc định lấy tên file"></label><label class="field"><span>Tác giả <small>(không bắt buộc, cách nhau bằng dấu phẩy)</small></span><input id="audio-artists" maxlength="200" autocomplete="off"></label></div>
<div class="add-audio-footer"><p id="add-audio-status" role="status"></p><button class="button primary" type="submit" id="add-audio-submit">Chép vào thư viện</button></div></form>`:''}</section>`;
}
async function submitAddAudio(event){
  event.preventDefault();
  const files=[...$('#audio-files').files],kind=document.querySelector('input[name="audio-kind"]:checked').value,status=$('#add-audio-status'),button=$('#add-audio-submit');
  if(!files.length){status.textContent='Hãy chọn ít nhất một file.';return;}
  const title=files.length===1?$('#audio-title').value.trim():'',artists=$('#audio-artists').value.trim(),done=[];button.disabled=true;
  try{
    for(const file of files){
      status.textContent=`Đang chép ${file.name}…`;
      const q=new URLSearchParams({kind,name:file.name,title,artists});
      const response=await fetch('/api/library-audio?'+q,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Workspace-Token':state.data.token},body:file});
      let result;try{result=await response.json();}catch{throw Error('Không đọc được phản hồi của trang quản lý.');}
      if(!response.ok)throw Error(`${file.name}: ${result.error}`);
      done.push(result);
    }
    state.addAudioOpen=false;state.musicTab=kind==='sfx'?'effects':'tracks';state.resourceFilter=kind==='sfx'?'library':'unused';state.resourceStale=true;state.resourceKey='';
    await renderResources();toast(`Đã chép ${done.length} file vào ${kind==='sfx'?'hiệu ứng':'nhạc nền'} của thư viện.`);
  }catch(error){status.textContent=error.message+(done.length?` (đã chép ${done.length} file trước đó)`:'');if(done.length){state.resourceStale=true;}}
  finally{if($('#add-audio-submit'))$('#add-audio-submit').disabled=false;}
}
// Rename a shared track or library SFX in place (audio-library.json); project credits in music.json are separate.
function audioMetaForm(key,title,artists){
  return `<form class="inline-edit audio-meta-form" data-audio-path="${esc(key)}"><div class="field-row"><label class="field"><span>Tên bài</span><input name="title" maxlength="200" required value="${esc(title)}" autocomplete="off"></label><label class="field"><span>Tác giả <small>(cách nhau bằng dấu phẩy)</small></span><input name="artists" maxlength="600" value="${esc(artists.join(', '))}" autocomplete="off"></label></div><div class="inline-edit-actions"><p role="status" class="audio-meta-status"></p><button type="submit" class="button primary">Lưu tên</button></div></form>`;
}
async function saveAudioMeta(form){
  const status=form.querySelector('.audio-meta-status'),button=form.querySelector('button[type=submit]');button.disabled=true;
  try{
    await api('/api/audio-meta',{path:form.dataset.audioPath,title:form.elements.title.value,artists:form.elements.artists.value,revision:state.library.music.metaRevision});
    state.resourceStale=true;state.resourceKey='';await renderResources();toast('Đã lưu tên bài và tác giả.');
  }catch(error){status.textContent=error.message;button.disabled=false;}
}
function trackRow(t){
  const open=state.expanded===t.path,id='detail-'+btoa(unescape(encodeURIComponent(t.path))).replace(/[^a-z0-9]/gi,'');
  const credit=!t.usedBy.length?'<span class="muted">—</span>':t.uncredited?`<span class="tag tag-warn">${t.uncredited}/${t.usedBy.length} tập thiếu</span>`:'<span class="tag">Đủ</span>';
  return `<li class="resource-row${open?' open':''}">${t.exists?playButton('music',t.path,t.title,t.artists.join(', ')):'<span class="play-missing" title="Không tìm thấy file">!</span>'}<div class="row-title"><strong>${esc(t.title)}</strong>${t.credited?`<small>${esc(t.artists.join(', '))}</small>`:'<small class="warn">Chưa ghi tác giả</small>'}</div><span class="row-meta">${t.shared?'Dùng chung':esc('Thư mục '+t.path.split('/')[0])}</span><span class="row-meta">${t.usedBy.length?`${t.usedBy.length} tập`:'Chưa dùng'}</span><span class="row-meta">${credit}</span><button class="button quiet expand-button" data-expand="${esc(t.path)}" aria-expanded="${open}" aria-controls="${id}">${open?'Thu gọn':'Chi tiết'}</button>
${open?`<div class="row-detail" id="${id}">${t.shared&&t.exists?audioMetaForm(t.path,t.title,t.artists):''}<p><code>${esc(t.path)}</code> ${fileSize(t.bytes)}${t.exists?'':' <span class="warn">Không tìm thấy file trong public/</span>'}</p>${t.usedBy.length?`<table class="usage-table"><thead><tr><th scope="col">Tập</th><th scope="col">Series</th><th scope="col">Khi có giọng</th><th scope="col">Khoảng lặng</th><th scope="col">Credit</th></tr></thead><tbody>${t.usedBy.map(p=>`<tr><td><a href="#project/${encodeURIComponent(p.id)}" data-project="${esc(p.id)}">${esc(p.title)}</a></td><td>${esc(p.seriesTitle)}</td><td>${level(p.speechVolume)}</td><td>${level(p.pauseVolume)}</td><td>${p.credited?'Có':'<span class="warn">Thiếu</span>'}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">Chưa tập nào dùng bài này.</p>'}</div>`:''}</li>`;
}
function effectRow(e){
  const key='sfx:'+e.id,open=state.expanded===key;
  if(e.library)return `<li class="resource-row${open?' open':''}">${e.exists?playButton('sfx',e.path,'Hiệu ứng: '+e.title,'Thư viện dùng chung'):'<span class="play-missing" title="Không tìm thấy file">!</span>'}<div class="row-title"><strong>${esc(e.title)}</strong><small>${e.artists.length?esc(e.artists.join(', ')):'Thư viện dùng chung'}</small></div><span class="row-meta">File dùng chung</span><span class="row-meta"><span class="tag">Trong thư viện</span></span><span></span><button class="button quiet expand-button" data-expand="${esc(key)}" aria-expanded="${open}">${open?'Thu gọn':'Chi tiết'}</button>
${open?`<div class="row-detail">${e.exists?audioMetaForm(e.path,e.title,e.artists):''}<p><code>${esc(e.path)}</code> ${fileSize(e.bytes)}</p><p class="muted">Dùng trong tập bằng <code>staticFile('${esc(e.path)}')</code>.</p></div>`:''}</li>`;
  return `<li class="resource-row${open?' open':''}">${e.exists?playButton('sfx',e.path,'Hiệu ứng: '+e.title,e.seriesTitle):'<span class="play-missing" title="Nhiều lớp, không có một file để phát">—</span>'}<div class="row-title"><strong>${esc(e.title)}</strong><small>${esc(e.seriesTitle)}</small></div><span class="row-meta">${e.layers?`${e.layers} lớp trong Video.tsx`:'Một file đã trộn'}</span><span class="row-meta"><span class="tag ${e.enabled?'':'tag-warn'}">${e.enabled?'Đang bật':'Đang tắt'}</span></span><span></span><button class="button quiet expand-button" data-expand="${esc(key)}" aria-expanded="${open}">${open?'Thu gọn':'Chi tiết'}</button>
${open?`<div class="row-detail">${e.path?`<p><code>${esc(e.path)}</code> ${fileSize(e.bytes)}</p>`:''}${e.provenance?`<p>${esc(e.provenance)}</p>`:''}<p><a href="#project/${encodeURIComponent(e.id)}" data-project="${esc(e.id)}">Mở hồ sơ tập</a></p></div>`:''}</li>`;
}
function renderMusicList(data){
  const tab=state.musicTab||'tracks',q=fold(state.query),f=state.resourceFilter||'',sort=state.resourceSort;
  let items,total;
  if(tab==='tracks'){
    const all=[...data.tracks,...data.unused];total=all.length;
    items=all.filter(t=>(!f||(f==='used'&&t.usedBy.length)||(f==='unused'&&!t.usedBy.length)||(f==='uncredited'&&t.uncredited)||(f==='shared'&&t.shared)||(f==='own'&&!t.shared))
      &&(!q||fold(`${t.title} ${t.artists.join(' ')} ${t.path} ${t.usedBy.map(p=>p.title+' '+p.id).join(' ')}`).includes(q)));
    items.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title,'vi'):sort==='size'?(b.bytes||0)-(a.bytes||0):b.usedBy.length-a.usedBy.length||a.title.localeCompare(b.title,'vi'));
  }else{
    total=data.effects.length;
    items=data.effects.filter(e=>(!f||(f==='library'&&e.library)||(f==='on'&&!e.library&&e.enabled)||(f==='off'&&!e.library&&!e.enabled))&&(!q||fold(`${e.title} ${e.id} ${e.seriesTitle} ${e.path||''}`).includes(q)));
    items.sort((a,b)=>sort==='size'?(b.bytes||0)-(a.bytes||0):a.title.localeCompare(b.title,'vi'));
  }
  $('#resource-list').innerHTML=items.map(tab==='tracks'?trackRow:effectRow).join('')||`<li class="workflow-empty">Không có ${tab==='tracks'?'bài nhạc':'hiệu ứng'} khớp tìm kiếm và bộ lọc.</li>`;
  $('#resource-count').textContent=`${items.length} / ${total}`;
}
function renderResourceList(){
  const data=state.library?.[state.view];if(!data||!$('#resource-list'))return;
  state.view==='voices'?renderVoiceList(data):renderMusicList(data);syncPlayButtons();
}
$('#resource-view').addEventListener('input',event=>{
  if(event.target.id!=='resource-search')return;state.query=event.target.value;clearTimeout(searchTimer);
  searchTimer=setTimeout(()=>{updateUrl();renderResourceList();},100);
});
$('#resource-view').addEventListener('submit',event=>{if(event.target.id==='add-audio-form')submitAddAudio(event);else if(event.target.matches('.audio-meta-form')){event.preventDefault();saveAudioMeta(event.target);}});
$('#resource-view').addEventListener('change',event=>{
  const id=event.target.id;
  if(['voice-gender','voice-region','voice-use'].includes(id))state.voiceFilters={gender:$('#voice-gender').value,region:$('#voice-region').value,use:$('#voice-use').value};
  else if(id==='resource-filter')state.resourceFilter=event.target.value;
  else if(id==='resource-sort')state.resourceSort=event.target.value;
  else return;
  renderResourceList();
});

// VoiceStudio status: polled quickly while starting or stopping, slowly while idle, rarely in a hidden tab.
async function refreshVoiceStudio(){
  clearTimeout(vsTimer);
  if(!state.vsStopping){try{state.voiceStudio=await api('/api/voicestudio');}catch{state.voiceStudio={state:'unknown'};}}
  renderVoiceStudio();
  const s=state.voiceStudio?.state;vsTimer=setTimeout(refreshVoiceStudio,document.hidden?60000:s==='starting'||state.vsStopping?2500:15000);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshVoiceStudio();});
function vsState(){const v=state.voiceStudio;if(state.vsStopping)return 'stopping';if(!v)return 'unknown';if(v.state==='off'&&v.missing?.length)return 'missing';return vsLabels[v.state]?v.state:'unknown';}
function renderVoiceStudio(){
  const s=vsState(),v=state.voiceStudio||{};
  const nav=$('#navigation [data-open-voicestudio]');
  if(nav){nav.querySelector('.vs-dot').className='vs-dot vs-'+s;nav.querySelector('.vs-dot-label').textContent=`, ${vsLabels[s]}`;nav.title=`Studio giọng nói: ${vsLabels[s]}. Mở VoiceStudio trong tab mới.`;}
  const panel=$('#vs-panel');if(!panel)return;
  const running=s==='ready'||s==='starting';
  const meta=s==='ready'?[v.version&&`VoiceStudio ${v.version}`,v.engine&&`Engine ${v.engine.name.split(' (')[0]}`,v.memoryBytes?`RAM ${gb(v.memoryBytes)}`:null,v.device&&`Chạy trên ${v.device.toUpperCase()}`].filter(Boolean)
    :s==='starting'?[v.step||'Đang nạp backend, thường mất vài giây.']
    :s==='stopping'?['Đang dừng các tiến trình của VoiceStudio.']
    :s==='missing'?[`Thiếu ${v.missing.join(', ')}.`]
    :s==='occupied'?['Một ứng dụng khác đang dùng cổng 3900. Hãy giải phóng cổng trước khi mở.']
    :s==='off'?['Bấm mở để khởi động. Khi tạo giọng, model VoxCPM2 dùng khoảng 6 GB RAM, nên hãy tắt khi không dùng.']
    :['Thử tải lại trang.'];
  panel.replaceChildren(
    h('div',{class:'vs-info'},h('div',{class:'vo-head'},h('span',{class:'vo-num','aria-hidden':'true'},'2'),h('strong',{id:'vs-title'},'Clone giọng'),h('span',{class:'tag'},'Khi muốn'),h('span',{class:'vs-state vs-'+s},vsLabels[s])),
      h('p',{},'Dùng Studio giọng nói (VoiceStudio, VoxCPM2) để clone từ bản ghi 10–30 giây của bạn hoặc người đã đồng ý, hoặc thiết kế giọng bằng mô tả. Chậm hơn nhiều trên CPU.'),
      h('p',{class:'vs-meta'},meta.join(' · '))),
    h('div',{class:'vs-actions'},
      h('button',{class:'button primary','data-open-voicestudio':'',disabled:s==='stopping'||s==='occupied'||s==='missing'||null},s==='ready'?'Mở Studio giọng nói':s==='starting'?'Đang khởi động…':'Bật và mở Studio'),
      running||s==='stopping'?h('button',{class:'button secondary','data-stop-voicestudio':'',disabled:s==='stopping'||null},s==='stopping'?'Đang tắt…':'Tắt'):null));
}
async function stopVoiceStudio(button){
  if(!confirm('Tắt Studio giọng nói? Việc đang tạo giọng trong VoiceStudio (nếu có) sẽ dừng. Giọng đã tạo vẫn được giữ.'))return;
  state.vsStopping=true;renderVoiceStudio();
  try{const r=await api('/api/voicestudio/stop',{});toast(r.stopped?'Đã tắt Studio giọng nói.':'Studio giọng nói vốn đã tắt.');}
  catch(e){toast(e.message);}
  finally{state.vsStopping=false;await refreshVoiceStudio();$('#vs-panel [data-open-voicestudio]')?.focus();}
}
