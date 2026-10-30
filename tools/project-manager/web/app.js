/* Local workspace UI. All source text is rendered as text, never executable HTML. */
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const iconPaths={back:'M19 12H5 M11 6l-6 6 6 6',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',list:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',book:'M12 5C8 2 4 3 2 4v16c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1v16',play:'m9 5 10 7-10 7Z',image:'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M8 7h.01',arrow:'M7 17 17 7 M7 7h10v10',plus:'M12 5v14 M5 12h14',search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',folder:'M3 7V4h6l2 3h10v13H3z',refresh:'M20 7A9 9 0 1 0 21 15 M20 2v6h-6',menu:'M3 6h18 M3 12h18 M3 18h18',close:'M6 6l12 12 M18 6 6 18',channel:'M4 5h16v14H4z M8 9h8 M8 13h5',spark:'m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z'};
function icon(name){return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${iconPaths[name]||iconPaths.folder}"/></svg>`;}
function dirtyNotes(){return Boolean(state.drawer&&!state.drawer.book&&!$('#drawer').hidden&&$('#notes-text')&&state.drawer.notes!==$('#notes-text').value);}
function canLeaveNotes(){return !dirtyNotes()||confirm('Ghi chú chưa được lưu. Bạn có muốn rời hồ sơ này?');}
function setMenu(open){$('#sidebar').classList.toggle('open',open);$('#menu-backdrop').hidden=!open;$('.workspace').inert=open||!$('#drawer').hidden;$('#mobile-menu').setAttribute('aria-expanded',String(open));document.body.classList.toggle('overlay-open',open||!$('#drawer').hidden);if(open)$('#close-mobile-menu').focus();}
const params=new URLSearchParams(location.search);
const state={data:null,channel:params.get('channel')||'',series:params.get('series')||'',view:params.get('view')==='books'?'books':'projects',
  query:params.get('q')||'',status:params.get('status')||'',sort:params.get('sort')||'recent',limit:12,layout:params.get('layout')==='list'?'list':'grid',drawer:null,documentRequest:0,createMode:'project'};
let toastTimer,searchTimer,refreshing=false,focusBeforeDrawer;
const statusNames={existing:'Đã có bản dựng',planning:'Đang chuẩn bị',production:'Đang sản xuất'};
const bookStatusNames={'awaiting-source':'Chờ tài liệu',research:'Đang nghiên cứu'};
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
function collectionUrl({channel='',series='',view='projects'}={}){const p=new URLSearchParams();if(channel)p.set('channel',channel);if(series)p.set('series',series);if(view==='books')p.set('view','books');return '/'+(p.size?'?'+p:'');}
function updateUrl(push=false){const p=new URLSearchParams();if(state.channel)p.set('channel',state.channel);if(state.series)p.set('series',state.series);if(state.query)p.set('q',state.query);if(state.status)p.set('status',state.status);if(state.sort!=='recent')p.set('sort',state.sort);if(state.layout==='list')p.set('layout','list');if(state.view==='books')p.set('view','books');recordRoute(`${location.pathname}${p.size?'?'+p:''}${location.hash}`,push);}
function hideDrawer(){state.documentRequest++;routeRequest++;$('#drawer').hidden=true;$('#drawer-backdrop').hidden=true;state.drawer=null;document.body.classList.remove('overlay-open');$('.workspace').inert=false;$('#sidebar').inert=false;}
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
  if(detail){const book=detail.book&&state.data.books.find(b=>b.id===detail.id&&b.series===detail.series);entries.push({title:book?.title||detail.title});}
  return '<ol>'+entries.map((e,i)=>`<li>${i===entries.length-1?`<span aria-current="page">${esc(e.title)}</span>`:`<a href="${esc(e.url)}" data-route>${esc(e.title)}</a>`}</li>`).join('')+'</ol>';
}
function renderBreadcrumbs(){
  $('#breadcrumb').innerHTML=breadcrumbs();if(state.drawer)$('#drawer-breadcrumb').innerHTML=breadcrumbs(true);
  $('#back-button').disabled=routeIndex===0&&!state.channel&&!state.series&&state.view!=='books';
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
  Object.assign(state,{channel:p.get('channel')||'',series:p.get('series')||'',view:p.get('view')==='books'?'books':'projects',query:p.get('q')||'',status:p.get('status')||'',sort:p.get('sort')||'recent',layout:p.get('layout')==='list'?'list':'grid',limit:12});
  $('#status-filter').value=state.status;$('#sort-filter').value=state.sort;$('#grid-view').classList.toggle('active',state.layout==='grid');$('#list-view').classList.toggle('active',state.layout==='list');render();await openHash();
}
async function refresh(initial=false){
  if(refreshing)return;refreshing=true;$('#refresh-button').disabled=true;
  try{state.data=await api('/api/workspace');$('#load-error').hidden=true;$('#connection').classList.remove('offline');$('#connection').lastChild.textContent='Đã kết nối';render();if(initial)openHash();}
  catch(error){$('#load-error').textContent=`Chưa kết nối được: ${error.message}`;$('#load-error').hidden=false;$('#connection').classList.add('offline');}
  finally{refreshing=false;$('#refresh-button').disabled=false;}
}
function renderNav(){
  const {channels,series,projects,books}=state.data;
  const total=projects.length;
  let html=`<button class="nav-button ${!state.channel&&!state.series&&state.view==='projects'?'active':''}" data-nav="all"><span class="nav-icon">${icon("grid")}</span>Tất cả dự án<span class="nav-count">${total}</span></button><button class="nav-button ${state.view==='books'?'active':''}" data-nav="books"><span class="nav-icon">${icon("book")}</span>Tủ sách nghiên cứu<span class="nav-count">${books.length}</span></button><div class="nav-divider"></div>`;
  for(const channel of channels){
    html+=`<div class="nav-section-title">${esc(channel.id==='tam-ly-cuoc-song'?'TÂM LÝ CUỘC SỐNG':channel.title.toUpperCase())}</div>`;
    html+=`<button class="nav-button ${state.channel===channel.id&&!state.series&&state.view==='projects'?'active':''}" data-channel="${esc(channel.id)}"><span class="nav-icon">${icon(channel.id==='kids'?'spark':channel.id==='client-work'?'folder':'channel')}</span>${channel.id==='tam-ly-cuoc-song'?'Toàn bộ kênh':'Tất cả dự án'}<span class="nav-count">${projects.filter(p=>p.channel===channel.id).length}</span></button>`;
    for(const item of series.filter(s=>s.channel===channel.id))html+=`<button class="nav-button nav-sub ${state.series===item.id&&state.view==='projects'?'active':''}" data-series="${esc(item.id)}">${esc(item.id==='self-help-shorts'?'Self-help Shorts':item.id==='book-insights'?'Đọc sách, hiểu mình':item.title)}<span class="nav-count">${item.projectCount}</span></button>`;
  }
  $('#navigation').innerHTML=html.replaceAll('<button class="nav-button','<a class="nav-button').replaceAll('</button>','</a>');
  $('#navigation').querySelectorAll('a').forEach(a=>{const p=new URLSearchParams();if(a.dataset.nav==='books')p.set('view','books');if(a.dataset.channel)p.set('channel',a.dataset.channel);if(a.dataset.series){const item=state.data.series.find(s=>s.id===a.dataset.series);p.set('channel',item.channel);p.set('series',item.id);}a.href=p.size?'/?'+p:'/';if(a.classList.contains('active'))a.setAttribute('aria-current','page');});
}
function render(){
  if(!state.data)return;
  renderNav();
  $('#new-book-button').hidden=state.view!=='books'&&state.series!=='book-insights';
  $('#delete-series-button').hidden=!state.series||state.view==='books';
  const channel=state.data.channels.find(c=>c.id===state.channel),series=state.data.series.find(s=>s.id===state.series);
  $('#page-title').textContent=state.view==='books'?'Tủ sách nghiên cứu':series?.title||channel?.title||'Không gian sáng tạo';
  renderBreadcrumbs();
  $('#new-project-button').className='button '+(state.view==='books'?'secondary':'primary');
  $('#eyebrow').textContent=state.view==='books'?'TỪ TRANG SÁCH ĐẾN CÂU CHUYỆN':series?'TỪNG TẬP, MỘT CÂU CHUYỆN':channel?'NHỮNG CÂU CHUYỆN CỦA KÊNH':'MỘT NƠI CHO MỌI Ý TƯỞNG';
  $('#page-description').textContent=state.view==='books'?'Giữ nguồn, ghi chú và những ý tưởng cho series sách ở cùng một nơi.':series?.summary||'Tìm bản dựng, kịch bản và tài liệu theo từng series.';
  const visible=state.data.projects.filter(p=>(!state.channel||p.channel===state.channel)&&(!state.series||p.series===state.series));
  const statValues=[['folder',state.view==='books'?state.data.books.length:visible.length,state.view==='books'?'Cuốn sách nghiên cứu':'Dự án trong không gian'],['grid',state.data.series.filter(s=>!state.channel||s.channel===state.channel).length,'Series đang quản lý'],['channel',state.data.channels.length,'Kênh nội dung'],['spark',visible.filter(p=>p.status==='planning').length,'Ý tưởng đang chuẩn bị']];
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
  renderCards();
}
function projectCard(p,index=0){
  const hasImage=Boolean(p.previewType);
  return `<article class="project-card card-channel-${esc(p.channel)}"><a href="#project/${encodeURIComponent(p.id)}" class="card-cover" data-project="${esc(p.id)}" aria-label="Mở dự án ${esc(p.title)}">${hasImage?`<img width="1080" height="1920" loading="${index<3?'eager':'lazy'}" decoding="async" src="/api/preview/${encodeURIComponent(p.id)}" alt="" data-preview-image>`:'<span class="cover-placeholder" aria-hidden="true">✧</span>'}<span class="format-badge">${p.format==='short'?'SHORT':'VIDEO DÀI'}</span>${hasImage?`<span class="preview-label">${p.previewType==='thumbnail-background'?'Nền thumbnail':'Ảnh cảnh'}</span>`:''}<span class="duration-badge">${duration(p.durationSeconds)}</span></a><div class="card-body"><div class="card-series">${esc(p.seriesTitle)}</div><a href="#project/${encodeURIComponent(p.id)}" class="card-title" data-project="${esc(p.id)}">${esc(p.title)}</a><div class="card-id">${esc(p.id)}</div><div class="card-footer"><span class="status ${esc(p.status)}">${esc(statusNames[p.status]||p.status)}</span><div class="card-links">${p.videoId?`<a data-watch="video" data-id="${esc(p.id)}" href="${studio(p.videoId)}" target="_blank" rel="noopener" title="Xem video" aria-label="Xem video ${esc(p.title)}">${icon("play")}<span>Video</span></a>`:''}${p.thumbnailId?`<a data-watch="thumbnail" data-id="${esc(p.id)}" href="${studio(p.thumbnailId)}" target="_blank" rel="noopener" title="Xem thumbnail" aria-label="Xem thumbnail ${esc(p.title)}">${icon("image")}<span>Thumbnail</span></a>`:''}<button data-project="${esc(p.id)}" title="Mở hồ sơ" aria-label="Mở hồ sơ ${esc(p.title)}">${icon("folder")}<span>Hồ sơ</span></button></div></div></div></article>`;
}
function bookCard(b){return `<article class="project-card book-card"><button class="card-cover" data-book="${esc(b.id)}" data-book-series="${esc(b.series)}" aria-label="Mở hồ sơ ${esc(b.title)}"><span class="book-object">${esc(b.title)}<small>${esc(b.authors.join(', '))}</small></span></button><div class="card-body"><div class="card-series">HỒ SƠ NGHIÊN CỨU</div><button class="card-title" data-book="${esc(b.id)}" data-book-series="${esc(b.series)}">${esc(b.title)}</button><div class="card-id">${esc(b.authors.join(', '))}</div><div class="card-footer"><span class="status ${b.hasSource?'production':'planning'}">${esc(b.hasSource&&b.status==='awaiting-source'?'Chờ kiểm tra nguồn':bookStatusNames[b.status]||b.status)}</span><div class="card-links"><button data-book="${esc(b.id)}" data-book-series="${esc(b.series)}" aria-label="Mở hồ sơ sách">${icon("folder")}<span>Hồ sơ</span></button></div></div></div></article>`;}
function renderCards(){
  if(!state.data)return;
  const q=fold(state.query);let items;
  if(state.view==='books')items=state.data.books.filter(b=>(!state.series||b.series===state.series)&&(!state.channel||b.channel===state.channel)&&(!q||fold(`${b.title} ${b.authors.join(' ')}`).includes(q)));
  else items=state.data.projects.filter(p=>(!state.channel||p.channel===state.channel)&&(!state.series||p.series===state.series)&&(!state.status||p.status===state.status)&&(!q||fold(`${p.title} ${p.id} ${p.seriesTitle}`).includes(q)));
  items.sort((a,b)=>state.sort==='title'?a.title.localeCompare(b.title,'vi'):String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))||a.title.localeCompare(b.title,'vi'));
  $('#project-count').textContent=items.length;
  $('#project-grid').className='project-grid'+(state.layout==='list'?' list':'');
  $('#project-grid').innerHTML=items.length?items.slice(0,state.limit).map(state.view==='books'?bookCard:projectCard).join(''):`<div class="empty-state"><span class="empty-icon">${state.query?'⌕':'✧'}</span><strong>${state.query?'Chưa tìm thấy dự án phù hợp':'Một câu chuyện mới bắt đầu ở đây'}</strong><p>${state.query?'Thử từ khóa khác hoặc bỏ bớt bộ lọc.':'Series này chưa có tập sản xuất. Bạn có thể thêm một ý tưởng để bắt đầu chuẩn bị.'}</p><button class="button secondary" data-empty-action>${state.query?'Xóa bộ lọc':'Thêm dự án đầu tiên'}</button></div>`;
  $('#pagination').innerHTML=items.length?`<span>Hiển thị ${Math.min(state.limit,items.length)} / ${items.length} ${state.view==='books'?'cuốn sách':'dự án'}</span>${items.length>state.limit?'<button class="button secondary" data-more>Xem thêm ↓</button>':''}`:'';
  document.querySelectorAll('[data-preview-image]').forEach(image=>image.addEventListener('error',()=>{image.replaceWith(Object.assign(document.createElement('span'),{className:'cover-placeholder',textContent:'✧'}));},{once:true}));
}
function showDrawer(){renderBreadcrumbs();focusBeforeDrawer=document.activeElement;setMenu(false);$('.workspace').inert=true;$('#sidebar').inert=true;$('#drawer').hidden=false;$('#drawer-backdrop').hidden=false;document.body.classList.add('overlay-open');$('#close-drawer').focus();}
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
function renderDocument(doc){
  const target=$('#document-view');target.replaceChildren();
  if(!doc.filename.endsWith('.md')){const pre=document.createElement('pre');pre.textContent=doc.text;target.append(pre);return;}
  let code=null,list=null,paragraph=[];
  const flush=()=>{if(paragraph.length){const p=document.createElement('p');p.textContent=paragraph.join('\n');target.append(p);paragraph=[];}list=null;};
  for(const line of doc.text.split('\n')){
    if(line.startsWith('```')){flush();if(code){code=null;}else{code=document.createElement('pre');target.append(code);}continue;}
    if(code){code.textContent+=line+'\n';continue;}
    const heading=line.match(/^(#{1,4})\s+(.+)/),bullet=line.match(/^\s*[-*]\s+(.+)/);
    if(heading){flush();const h=document.createElement('h'+Math.min(heading[1].length,3));h.textContent=heading[2];target.append(h);}
    else if(bullet){if(paragraph.length)flush();if(!list){list=document.createElement('ul');target.append(list);}const li=document.createElement('li');li.textContent=bullet[1];list.append(li);}
    else if(!line.trim()){flush();}else{list=null;paragraph.push(line);}
  }flush();
}
async function openBook(series,id,record=true){
  if(!canLeaveNotes())return;
  const book=state.data.books.find(b=>b.id===id&&b.series===series);if(!book)return;
  state.drawer={book:true,id,series};state.documentRequest++;
  if(record)recordRoute(location.pathname+location.search+'#book/'+encodeURIComponent(series)+'/'+encodeURIComponent(id),true);
  $('#drawer-eyebrow').textContent='TỦ SÁCH · HỒ SƠ NGHIÊN CỨU';
  const names={'research.md':'Nghiên cứu','season-plan.md':'Kế hoạch series','chapters.json':'Bản đồ chương','book.json':'Thông tin nguồn'};
  $('#drawer-content').innerHTML=`<h2 id="drawer-title">${esc(book.title)}</h2><div class="drawer-meta">${esc(book.authors.join(', '))}<span class="status ${book.hasSource?'production':'planning'}">${esc(book.hasSource&&book.status==='awaiting-source'?'Chờ kiểm tra nguồn':bookStatusNames[book.status]||book.status)}</span></div><div class="book-notice">${esc(book.note||'Hồ sơ nghiên cứu dùng chung cho các tập trong series.')}</div><section class="drawer-section"><h3>Tài liệu nghiên cứu</h3><div class="document-tabs">${book.documents.map(file=>`<button data-book-document="${esc(file)}">${esc(names[file]||file)}</button>`).join('')}</div><div id="document-view" class="document-view">Đang mở…</div></section><button class="button primary" data-project-from-book>＋ Lên ý tưởng một tập</button>`;
  $('#drawer-content').insertAdjacentHTML('beforeend',`<section class="drawer-section"><h3>Nguồn sách</h3><p>Chép PDF vào thư mục riêng của cuốn sách trên máy. Không tự đọc, OCR hoặc gửi ra dịch vụ khác.</p><ul>${(book.sources||[]).map(f=>`<li>${esc(f.name)} · ${(f.size/1048576).toFixed(1)} MB</li>`).join('')||'<li>Chưa có PDF nguồn.</li>'}</ul><label class="field"><span>Thêm PDF (tối đa 200 MB/file)</span><input id="book-upload" type="file" accept=".pdf,application/pdf" multiple></label><p id="upload-status" role="status"></p></section>`);
  showDrawer();if(book.documents.length)openBookDocument(book.documents.includes('season-plan.md')?'season-plan.md':book.documents[0]);
}
async function openBookDocument(file){const book=state.drawer;if(!book?.book)return;const request=++state.documentRequest;document.querySelectorAll('[data-book-document]').forEach(b=>b.classList.toggle('active',b.dataset.bookDocument===file));try{const doc=await api(`/api/book-document?series=${encodeURIComponent(book.series)}&book=${encodeURIComponent(book.id)}&file=${encodeURIComponent(file)}`);if(request===state.documentRequest)renderDocument(doc);}catch(error){if(request===state.documentRequest)$('#document-view').textContent=error.message;}}
async function saveNotes(){if(!state.drawer||state.drawer.book)return;const button=$('#save-notes'),text=$('#notes-text').value,id=state.drawer.id;button.disabled=true;try{const result=await api('/api/notes',{id,text,revision:state.drawer.notesRevision});if(state.drawer?.id===id){state.drawer.notes=text;state.drawer.notesRevision=result.revision;$('#notes-status').textContent='Đã lưu trên máy · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});}toast('Đã lưu ghi chú.');}catch(error){toast(error.message);}finally{button.disabled=false;}}
function field(name,label,type='text',value='',hint=''){return `<label class="field"><span>${esc(label)}</span><input name="${esc(name)}" type="${esc(type)}" autocomplete="off" ${name==='id'?'spellcheck="false"':''} value="${esc(value)}" ${name==='title'||name==='id'?'required':''} ${name==='id'?'pattern="[a-z0-9]+(-[a-z0-9]+)*"':''} ${type==='number'?'min="1" max="36000"':''}>${hint?`<small>${esc(hint)}</small>`:''}</label>`;}
function showCreate(mode='project',book=null){
  if(!state.data)return;state.createMode=mode;
  $('#create-error').hidden=true;$('#create-form').reset();
  $('#create-title').textContent=mode==='series'?'Tạo một series mới':'Thêm dự án';$('#submit-create').textContent=mode==='series'?'Tạo series':'Tạo dự án';
  $('#create-description').textContent=mode==='series'?'Một không gian riêng cho những câu chuyện cùng hướng.':'Chỉ tạo hồ sơ chuẩn bị. Kịch bản, hình ảnh và giọng đọc được làm sau.';
  if(mode==='book'){
    $('#create-title').textContent='Thêm sách';$('#submit-create').textContent='Tạo hồ sơ sách';$('#create-description').textContent='Một hồ sơ cho mỗi cuốn; thêm PDF sau khi tạo.';
    $('#create-fields').innerHTML=`<label class="field"><span>Series</span><select name="series">${state.data.series.filter(s=>s.id==='book-insights').map(s=>`<option value="${esc(s.id)}" ${s.id===(state.series||'book-insights')?'selected':''}>${esc(s.title)}</option>`).join('')}</select></label>${field('title','Tên sách')}${field('id','Mã sách')}${field('authors','Tác giả (phân cách bằng dấu phẩy)')}`;
  }else if(mode==='series'){
    $('#create-fields').innerHTML=`<label class="field"><span>Kênh</span><select name="channel">${state.data.channels.map(c=>`<option value="${esc(c.id)}" ${c.id===state.channel?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label>${field('title','Tên series')}${field('id','Mã series','text','','Chữ thường, số và dấu gạch nối. Ví dụ: hieu-ban-than.')}<label class="field"><span>Định dạng</span><select name="formats"><option value="long,short">Video dài và Short</option><option value="short">Chỉ Short</option><option value="long">Chỉ video dài</option></select></label>`;
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
async function openHash(){try{const parts=location.hash.slice(1).split('/').map(decodeURIComponent);if(parts[0]==='project'&&parts[1])await openProject(parts[1],false);if(parts[0]==='book'&&parts[1]&&parts[2])await openBook(parts[1],parts[2],false);}catch{toast('Đường dẫn hồ sơ không hợp lệ.');}}
document.addEventListener('click',async event=>{
  const target=event.target.closest('button,a[data-project],a[data-channel],a[data-series],a[data-nav],a[data-watch],a[data-route],[data-books]');if(!target||target.disabled)return;
  if(target.tagName==='A'){if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;event.preventDefault();}
  if(target.hasAttribute('data-back'))back();
  else if(target.hasAttribute('data-route')){const p=new URL(target.href).searchParams;navigate({channel:p.get('channel')||'',series:p.get('series')||'',view:p.get('view')||'projects'});}
  else if(target.dataset.watch){event.preventDefault();watch(target.dataset.id,target.dataset.watch);}
  else if(target.dataset.studio)launchStudio(target.dataset.id,target.dataset.studio);
  else if(target.hasAttribute('data-delete-project'))askDelete('project',state.drawer.id);
  else if(target.dataset.nav==='all')navigate();
  else if(target.dataset.nav==='books')navigate({view:'books'});
  else if(target.hasAttribute('data-books'))navigate({channel:state.channel,series:state.series,view:'books'});
  else if(target.dataset.channel)navigate({channel:target.dataset.channel});
  else if(target.dataset.series){const series=state.data.series.find(s=>s.id===target.dataset.series);navigate({channel:series.channel,series:series.id});}
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
$('#new-project-button').addEventListener('click',()=>showCreate());$('#new-series-button').addEventListener('click',()=>showCreate('series'));
$('#search').addEventListener('input',event=>{state.query=event.target.value;state.limit=12;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{updateUrl();renderCards();},100);});
$('#series-filter').addEventListener('change',event=>navigate({channel:state.channel,series:event.target.value}));
$('#status-filter').addEventListener('change',event=>{state.status=event.target.value;state.limit=12;updateUrl();renderCards();});
$('#sort-filter').addEventListener('change',event=>{state.sort=event.target.value;updateUrl();renderCards();});
$('#grid-view').addEventListener('click',()=>{state.layout='grid';updateUrl();$('#grid-view').classList.add('active');$('#list-view').classList.remove('active');renderCards();});
$('#list-view').addEventListener('click',()=>{state.layout='list';updateUrl();$('#grid-view').classList.remove('active');$('#list-view').classList.add('active');renderCards();});
$('#drawer-content').addEventListener('click',event=>{if(event.target.closest('#save-notes'))saveNotes();});
$('#close-drawer').addEventListener('click',closeDrawer);$('#drawer-backdrop').addEventListener('click',closeDrawer);
$('#help-button').addEventListener('click',()=>$('#help-dialog').showModal());$('#close-help').addEventListener('click',()=>$('#help-dialog').close());
$('#mobile-menu').addEventListener('click',()=>setMenu(!$('#sidebar').classList.contains('open')));
$('#close-mobile-menu').addEventListener('click',()=>setMenu(false));$('#menu-backdrop').addEventListener('click',()=>setMenu(false));
$('#close-create').addEventListener('click',()=>$('#create-dialog').close());$('#cancel-create').addEventListener('click',()=>$('#create-dialog').close());
$('#create-fields').addEventListener('change',event=>{if(event.target.id==='create-series')updateCreateSeries();if(event.target.id==='create-format')updateCreateDuration();});
$('#create-fields').addEventListener('input',event=>{if(event.target.name==='id')event.target.dataset.manuallyEdited='true';if(event.target.name==='title'){const input=$('#create-fields input[name="id"]');if(!input.dataset.manuallyEdited)input.value=fold(event.target.value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90).replace(/-$/,'');}});
$('#create-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('#submit-create');button.disabled=true;$('#create-error').hidden=true;try{const body=Object.fromEntries(new FormData(event.target));const result=await api(state.createMode==='book'?'/api/books':state.createMode==='series'?'/api/series':'/api/projects',body);$('#create-dialog').close();await refresh();if(state.createMode==='book'){toast('Đã tạo hồ sơ sách.');openBook(result.series,result.id);}else if(state.createMode==='project'){toast('Đã tạo hồ sơ dự án.');openProject(result.id);}else{toast('Đã tạo series.');navigate({channel:result.channel,series:result.id});}}catch(error){$('#create-error').textContent=error.message;$('#create-error').hidden=false;$('#create-error').focus();}finally{button.disabled=false;}});
document.addEventListener('keydown',event=>{
  const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
  if(event.key==='/'&&!typing&&!$('#create-dialog').open&&!$('#help-dialog').open&&!$('#media-dialog').open&&!$('#delete-dialog').open){event.preventDefault();$('#search').focus();}
  if(event.key==='Escape'&&!$('#create-dialog').open&&!$('#help-dialog').open&&!$('#media-dialog').open&&!$('#delete-dialog').open){if(!$('#drawer').hidden)closeDrawer();setMenu(false);}
  if(event.key==='Tab'&&!$('#drawer').hidden&&!$('#create-dialog').open&&!$('#help-dialog').open&&!$('#media-dialog').open&&!$('#delete-dialog').open){const nodes=[...$('#drawer').querySelectorAll('button,a,textarea,select,input')].filter(n=>!n.disabled&&n.offsetParent!==null);const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
window.addEventListener('beforeunload',event=>{if(dirtyNotes()){event.preventDefault();event.returnValue='';}});
window.addEventListener('focus',()=>{if(state.data)refresh();});
document.querySelectorAll('[data-icon]').forEach(node=>node.innerHTML=icon(node.dataset.icon));
$('#status-filter').value=state.status;$('#sort-filter').value=state.sort;
$('#grid-view').classList.toggle('active',state.layout==='grid');$('#list-view').classList.toggle('active',state.layout==='list');
window.addEventListener('popstate',restoreRoute);
refresh(true);

let selectedMedia=null,deletePlan=null;
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
$('#delete-series-button').onclick=()=>askDelete('series',state.series);
async function askDelete(kind,id){
  if(!canLeaveNotes())return;
  try{deletePlan=await api('/api/delete-preview',{kind,id});$('#delete-title').textContent='Xóa '+deletePlan.title+'?';
    $('#delete-summary').textContent=deletePlan.registrations||deletePlan.rendered?`Có ${deletePlan.registrations} bản dựng/thumbnail và ${deletePlan.rendered} file đã xuất. ${deletePlan.projectCount} dự án, ${deletePlan.files} file sẽ được chuyển vào thùng rác.`:`Chưa có sản phẩm trong ${kind==='series'?'series':'dự án'} này. Vẫn có ${deletePlan.files} file hồ sơ và ${deletePlan.projectCount} dự án. Bạn có muốn xóa?`;
    $('#delete-paths').innerHTML=deletePlan.paths.map(p=>`<li>${esc(p)}</li>`).join('');$('#delete-error').textContent='';$('#delete-dialog').showModal();
  }catch(e){toast(e.message);}
}
$('#cancel-delete').onclick=()=>$('#delete-dialog').close();
$('#confirm-delete').onclick=async()=>{const button=$('#confirm-delete');button.disabled=true;try{const result=await api('/api/delete',{...deletePlan,confirm:true});$('#delete-dialog').close();if(!$('#drawer').hidden){state.drawer=null;closeDrawer();}state.series='';updateUrl();await refresh();toast('Đã chuyển vào '+result.trash);}catch(e){$('#delete-error').textContent=e.message;}finally{button.disabled=false;}};
$('#drawer-content').addEventListener('change',async event=>{
  if(event.target.id!=='book-upload')return;const input=event.target,book={...state.drawer},status=$('#upload-status');input.disabled=true;
  try{for(const file of input.files){if(file.size>200*1048576)throw Error('PDF tối đa 200 MB');status.textContent='Đang chép '+file.name+'…';const response=await fetch(`/api/book-source?series=${encodeURIComponent(book.series)}&book=${encodeURIComponent(book.id)}&name=${encodeURIComponent(file.name)}`,{method:'POST',headers:{'Content-Type':'application/pdf','X-Workspace-Token':state.data.token},body:file});const result=await response.json();if(!response.ok)throw Error(result.error);status.textContent='Đã chép vào '+result.path;}
    await refresh();if(state.drawer?.book&&state.drawer.id===book.id)openBook(book.series,book.id);toast('Đã thêm PDF nguồn. Chưa kiểm tra nội dung sách.');
  }catch(e){status.textContent=e.message;}finally{input.disabled=false;input.value='';}
});
