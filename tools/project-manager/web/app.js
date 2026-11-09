/* Local workspace UI. All source text is rendered as text, never executable HTML. */
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const iconPaths={network:'M5 5h5v5H5z M14 14h5v5h-5z M14 5h5v5h-5z M10 7.5h4 M16.5 10v4 M7.5 10v6.5h6.5',back:'M19 12H5 M11 6l-6 6 6 6',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',list:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',book:'M12 5C8 2 4 3 2 4v16c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1v16',play:'m9 5 10 7-10 7Z',image:'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M8 7h.01',arrow:'M7 17 17 7 M7 7h10v10',plus:'M12 5v14 M5 12h14',search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',folder:'M3 7V4h6l2 3h10v13H3z',refresh:'M20 7A9 9 0 1 0 21 15 M20 2v6h-6',cloud:'M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18z M12 17v-6 M9.5 13.5 12 11l2.5 2.5',menu:'M3 6h18 M3 12h18 M3 18h18',close:'M6 6l12 12 M18 6 6 18',channel:'M4 5h16v14H4z M8 9h8 M8 13h5',spark:'m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z',mic:'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3',music:'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',pause:'M7 5h3v14H7z M14 5h3v14h-3z'};
function icon(name){return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${iconPaths[name]||iconPaths.folder}"/></svg>`;}
function dirtyNotes(){
  if(!state.drawer||$('#drawer').hidden)return false;
  if(state.drawer.workflow)return Boolean(state.drawer.editing&&$('#workflow-rules'))&&(workflowRules().join('\n')!==state.drawer.rulesText||$('#workflow-notes').value.replace(/\s+$/,'')!==state.drawer.notes);
  return Boolean(!state.drawer.book&&$('#notes-text')&&state.drawer.notes!==$('#notes-text').value);
}
function canLeaveNotes(){return !dirtyNotes()||confirm('Ghi chú chưa được lưu. Bạn có muốn rời hồ sơ này?');}
function setMenu(open){$('#sidebar').classList.toggle('open',open);$('#menu-backdrop').hidden=!open;$('.workspace').inert=open||!$('#drawer').hidden;$('#mobile-menu').setAttribute('aria-expanded',String(open));document.body.classList.toggle('overlay-open',open||!$('#drawer').hidden);if(open)$('#close-mobile-menu').focus();}
const params=new URLSearchParams(location.search);
const resourceViews={voices:'Giọng đọc',music:'Nhạc nền & hiệu ứng',system:'Bản đồ hệ thống',backup:'Sao lưu Drive'};
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
  try{state.data=await api('/api/workspace');state.workflowStale=true;state.resourceStale=true;state.channelProfileStale=true;$('#load-error').hidden=true;$('#connection').classList.remove('offline');$('#connection').lastChild.textContent='Đã kết nối';render();if(initial)openHash();}
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
  let html=`<button class="nav-button ${!state.channel&&!state.series&&state.view==='projects'?'active':''}" data-nav="all"><span class="nav-icon">${icon("grid")}</span>Tất cả dự án<span class="nav-count">${projects.length}</span></button><button class="nav-button ${state.view==='books'?'active':''}" data-nav="books"><span class="nav-icon">${icon("book")}</span>Tủ sách nghiên cứu<span class="nav-count">${books.length}</span></button><button class="nav-button ${state.view==='voices'?'active':''}" data-nav="voices"><span class="nav-icon">${icon("mic")}</span>Giọng đọc</button><button class="nav-button ${state.view==='music'?'active':''}" data-nav="music"><span class="nav-icon">${icon("music")}</span>Nhạc nền & hiệu ứng</button><button class="nav-button ${state.view==='system'?'active':''}" data-nav="system"><span class="nav-icon">${icon("network")}</span>Bản đồ hệ thống</button><button class="nav-button ${state.view==='backup'?'active':''}" data-nav="backup"><span class="nav-icon">${icon("cloud")}</span>Sao lưu Drive<span class="nav-count backup-badge" id="backup-nav-badge"></span></button><div class="nav-divider"></div>`;
  html+=`<div class="nav-section-title">KÊNH NỘI DUNG</div>`+channels.filter(c=>contentChannels.includes(c.id)).map(channelNav).join('');
  if(others.length)html+=`<div class="nav-section-title">NGOÀI KÊNH</div>`+others.map(channelNav).join('');
  // Navigation entries become links (VoiceStudio is opened from the Giọng đọc page).
  $('#navigation').innerHTML=html.replaceAll('<button class="nav-button','<a class="nav-button').replaceAll('</button>','</a>');
  renderVoiceStudio();updateBackupBadge();
  $('#navigation').querySelectorAll('a').forEach(a=>{const p=new URLSearchParams();if(a.dataset.nav&&a.dataset.nav!=='all')p.set('view',a.dataset.nav);if(a.dataset.channel)p.set('channel',a.dataset.channel);if(a.dataset.series){const item=state.data.series.find(s=>s.id===a.dataset.series);p.set('channel',item.channel);p.set('series',item.id);}a.href=p.size?'/?'+p:'/';if(a.classList.contains('active'))a.setAttribute('aria-current','page');});
}
function render(){
  if(!state.data)return;
  renderNav();
  const resource=Boolean(resourceViews[state.view]);
  $('#resource-view').hidden=!resource;$('#stats').hidden=resource;$('.library').hidden=resource;if(resource)$('#channel-profile').hidden=true;
  if(resource){
    $('#new-book-button').hidden=true;$('#book-banner').hidden=true;$('#workflow').hidden=true;$('#new-project-button').hidden=true;
    $('#page-title').textContent=resourceViews[state.view];renderBreadcrumbs();
    if(state.view!=='backup')state.backupView='';
    if(state.view==='backup'){$('#eyebrow').textContent='DỮ LIỆU NGOÀI GIT';$('#page-description').textContent='Media, bản xuất, sách và lịch sử chỉnh sửa được chép lên Google Drive. Xem phần chưa sao lưu và chạy sao lưu nền.';if(state.backupView!=='backup'){state.backup=null;}state.backupView='backup';renderBackup();refreshBackup();return;}
    if(state.view==='system'){$('#eyebrow').textContent='MỖI REPO LÀM GÌ, Ở BƯỚC NÀO';$('#page-description').textContent='Quy trình làm một tập, các tầng của hệ thống và vai trò thật của từng repo, đo trực tiếp trên máy.';renderSystem();return;}
    $('#eyebrow').textContent=state.view==='voices'?'NHỮNG GIỌNG KỂ CHUYỆN':'ÂM THANH CỦA TỪNG TẬP';
    $('#page-description').textContent=state.view==='voices'?'Nghe thử từng giọng VieNeu và xem tập nào đang dùng giọng nào.':'Nguồn nhạc, credit và hiệu ứng âm thanh mà các tập đang dùng.';
    renderResources();return;
  }
  $('#resource-view').replaceChildren();state.resourceKey='';state.backupView='';
  $('#new-book-button').hidden=state.view!=='books'&&state.series!=='book-insights';
  const channel=state.data.channels.find(c=>c.id===state.channel),series=state.data.series.find(s=>s.id===state.series);
  $('#page-title').textContent=state.view==='books'?'Tủ sách nghiên cứu':series?.title||channel?.title||'Không gian sáng tạo';
  renderBreadcrumbs();
  // "Thêm dự án" only where projects are listed: all projects and a channel/series (user 2026-11-09: on Tủ sách,
  // Giọng đọc… it was easy to mistake for adding a book or a voice).
  $('#new-project-button').hidden=state.view==='books';$('#new-project-button').className='button primary';
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
  renderChannelProfile();
  renderCards();
}
// Card line for a project the agent is working on (from its live progress plan).
function cardProgress(g){
  const stop=g.interrupted+g.failed,label=stop?'Bị ngắt':g.running?'Đang làm':g.done===g.total?'Xong kế hoạch':'Tạm dừng';
  return `<div class="card-progress${stop?' is-warn':''}" title="${g.done}/${g.total} việc xong"><span class="pbar"><span data-width="${g.overall}"></span></span><small>${label} · ${g.overall}%</small></div>`;
}
function projectCard(p,index=0){
  const hasImage=Boolean(p.previewType);
  const status=p.importedVideo?'Đã import video':statusNames[p.status]||p.status;
  return `<article class="project-card card-channel-${esc(p.channel)}"><a href="#project/${encodeURIComponent(p.id)}" class="card-cover" data-project="${esc(p.id)}" aria-label="Mở dự án ${esc(p.title)}">${hasImage?`<img width="1080" height="1920" loading="${index<3?'eager':'lazy'}" decoding="async" src="/api/preview/${encodeURIComponent(p.id)}" alt="" data-preview-image>`:'<span class="cover-placeholder" aria-hidden="true">✧</span>'}<span class="format-badge">${p.format==='short'?'SHORT':'VIDEO DÀI'}</span>${hasImage?`<span class="preview-label">${{thumbnail:'Thumbnail','thumbnail-background':'Nền thumbnail','video-frame':'Khung hình video'}[p.previewType]||'Ảnh cảnh'}</span>`:''}<span class="duration-badge">${duration(p.durationSeconds)}</span></a><div class="card-body"><div class="card-series">${esc(p.seriesTitle)}</div><a href="#project/${encodeURIComponent(p.id)}" class="card-title" data-project="${esc(p.id)}">${esc(p.title)}</a><div class="card-id">${esc(p.id)}${p.autoNamed?'<span class="temp-name" title="Tên tạm, sẽ được đổi cho hợp nội dung khi bắt đầu làm">Tên tạm</span>':''}</div>${p.progress?cardProgress(p.progress):''}<div class="card-footer"><span class="status ${esc(p.importedVideo?'existing':p.status)}">${esc(status)}</span><div class="card-links">${p.videoId||p.renderedVideo?`<button data-watch="video" data-id="${esc(p.id)}" title="Xem video" aria-label="Xem video ${esc(p.title)}">${icon("play")}<span>Video</span></button>`:''}${p.thumbnailId?`<a data-watch="thumbnail" data-id="${esc(p.id)}" href="${studio(p.thumbnailId)}" target="_blank" rel="noopener" title="Xem thumbnail" aria-label="Xem thumbnail ${esc(p.title)}">${icon("image")}<span>Thumbnail</span></a>`:''}<button data-project="${esc(p.id)}" title="Mở hồ sơ" aria-label="Mở hồ sơ ${esc(p.title)}">${icon("folder")}<span>Hồ sơ</span></button></div></div></div></article>`;
}
function bookCoverUrl(book){return `/api/book-cover?series=${encodeURIComponent(book.series)}&book=${encodeURIComponent(book.id)}&v=${encodeURIComponent(book.cover||'')}`;}
function bookArtwork(book){return book.cover?`<span class="book-image-frame"><img class="uploaded-book-cover" width="136" height="174" src="${bookCoverUrl(book)}" alt="Bìa ${esc(book.title)}" loading="lazy" data-book-cover="${esc(book.id)}" data-cover-series="${esc(book.series)}"></span>`:`<span class="book-object" aria-hidden="true"><span class="book-cover-title">${esc(book.title)}</span><small class="book-cover-author">${esc(book.authors.join(', '))}</small></span>`;}
function bookCard(b){
  const status=b.hasSource&&b.status==='awaiting-source'?'Chờ kiểm tra nguồn':bookStatusNames[b.status]||b.status;
  const c=b.chapters,pct=c?Math.round(c.read/c.total*100):0;
  const reading=c?`<div class="book-reading" title="Đã đọc ${c.read} trên ${c.total} chương"><small>Đã đọc ${c.read}/${c.total} chương</small><span class="pbar" role="progressbar" aria-label="Tiến độ đọc" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span data-width="${pct}"></span></span></div>`
   :`<div class="book-reading is-empty"><small>${b.hasSource?'Có PDF · chưa lập mục lục':'Chưa có PDF nguồn'}</small></div>`;
  return `<article class="project-card book-card"><button class="card-cover" data-book="${esc(b.id)}" data-book-series="${esc(b.series)}" aria-label="Mở hồ sơ ${esc(b.title)}">${bookArtwork(b)}</button><div class="card-body"><button class="card-title" data-book="${esc(b.id)}" data-book-series="${esc(b.series)}">${esc(b.title)}</button><div class="card-id">${esc(b.authors.join(', '))}</div><div class="book-facts">${reading}</div><div class="card-footer"><span class="status ${b.hasSource?'production':'planning'}">${esc(status)}</span></div></div></article>`;
}
// Episodes made from a book, from series.json links only (project "book"; a short that leads to a long episode names it
// in "promotes"). The sidebar keeps one summary line; the "Các tập" tab shows each long episode wide with the shorts
// made for it underneath (user 2026-11-04: the sidebar list was cramped).
const bookEps=book=>{const eps=state.data.projects.filter(p=>p.book===book.id),longs=eps.filter(p=>p.format==='long'),shorts=eps.filter(p=>p.format==='short');
  return {eps,longs,shorts,loose:shorts.filter(x=>!longs.some(l=>l.id===x.promotes))};};
const epCount=({longs,shorts})=>[longs.length?`${longs.length} video dài`:'',shorts.length?`${shorts.length} dự án short`:''].filter(Boolean).join(' · ');
function bookEpisodes(book){
  const e=bookEps(book);
  return `<section class="drawer-section book-episode-summary"><h3>Các tập từ sách này</h3><p>${e.eps.length?esc(epCount(e)):'Chưa có tập nào.'}</p>${e.eps.length?'<button class="button secondary" data-book-document="__episodes">Xem các tập</button>':''}</section>`;
}
function bookEpisodesView(book){
  const {eps,longs,shorts,loose}=bookEps(book);
  if(!eps.length)return '<div class="episodes-empty"><p>Chưa có tập nào từ sách này.</p><button class="button primary" data-project-from-book>＋ Lên ý tưởng một tập</button></div>';
  const status=p=>`<span class="status ${esc(p.importedVideo?'existing':p.status)}">${esc(p.importedVideo?'Đã import video':statusNames[p.status]||p.status)}</span>`;
  const preview=(p,cls)=>`<a class="episode-preview ${cls}" href="#project/${encodeURIComponent(p.id)}" data-project="${esc(p.id)}" aria-label="Mở hồ sơ ${esc(p.title)}">${p.previewType?`<img src="/api/preview/${encodeURIComponent(p.id)}" alt="" loading="lazy" decoding="async">`:'<span aria-hidden="true">✧</span>'}</a>`;
  const actions=p=>`<div class="episode-actions"><button class="button secondary" data-project="${esc(p.id)}">${icon('folder')} Mở hồ sơ</button>${p.videoId||p.renderedVideo?`<button class="button secondary" data-watch="video" data-id="${esc(p.id)}">${icon('play')} Xem video</button>`:''}</div>`;
  // A shorts project spans the width: its header, then one tile per short with that short's own cover (an exported
  // cover Still when there is one), number and name; a tile opens the media dialog on that short.
  const shortCard=p=>{const vids=p.videos||[],covers=p.thumbnails||[];
    const cover=v=>{const c=covers.find(x=>x.number===v.number&&x.name);return c?`/api/media?id=${encodeURIComponent(p.id)}&kind=thumbnail&file=${encodeURIComponent(c.name)}`:p.previewType?`/api/preview/${encodeURIComponent(p.id)}`:'';};
    const tiles=vids.map(v=>{const src=cover(v),name=v.title.replace(/^Short \d+ · /,'');
      return `<li><button class="short-tile" data-watch="video" data-id="${esc(p.id)}" data-number="${v.number}" aria-label="Xem short ${v.number}: ${esc(name)}${v.name?'':' (chưa xuất)'}"><span class="short-tile-cover">${src?`<img src="${src}" alt="" loading="lazy" decoding="async">`:'<span aria-hidden="true">✧</span>'}</span><span class="short-tile-text"><span class="short-number">${v.number}</span><span>${esc(name)}</span></span>${v.name?'':'<span class="short-tile-state">Chưa xuất</span>'}</button></li>`;}).join('');
    return `<article class="episode-short-card${tiles?' has-tiles':''}">${tiles?'':preview(p,'is-vertical')}<div class="episode-body"><div class="episode-head"><div><span class="episode-kind">${p.compositionCount>1?`${p.compositionCount} short`:'Short'}</span><a class="episode-title" href="#project/${encodeURIComponent(p.id)}" data-project="${esc(p.id)}">${esc(p.title)}</a><div class="episode-meta">${status(p)}<span>${esc(duration(p.durationSeconds))}</span></div></div>${actions(p)}</div>${tiles?`<ol class="short-tiles">${tiles}</ol>`:''}</div></article>`;};
  const longCard=p=>{const own=shorts.filter(x=>x.promotes===p.id);
    return `<section class="episode-group"><article class="episode-long-card">${preview(p,'is-wide')}<div class="episode-body"><span class="episode-kind">Video dài</span><a class="episode-title" href="#project/${encodeURIComponent(p.id)}" data-project="${esc(p.id)}">${esc(p.title)}</a><div class="episode-meta">${status(p)}<span>${esc(duration(p.durationSeconds))}</span></div>${actions(p)}</div></article>
      ${own.length?`<div class="episode-shorts-block"><h4>Short giới thiệu tập này <span class="count">${own.length}</span></h4><div class="episode-short-grid">${own.map(shortCard).join('')}</div></div>`:'<p class="episode-none">Chưa có short giới thiệu cho tập này.</p>'}</section>`;};
  return `<div class="episodes-view"><p class="episodes-summary">${esc(epCount({longs,shorts}))}. Lấy từ liên kết sách của từng dự án (series.json): short nằm dưới video dài mà nó giới thiệu.</p>${longs.map(longCard).join('')}${loose.length?`<section class="episode-group"><h4>Short khác từ sách này</h4><div class="episode-short-grid">${loose.map(shortCard).join('')}</div></section>`:''}</div>`;
}
// A→Z ignores leading quotes and punctuation, so “Để mai” sorts under Đ.
const sortKey=t=>String(t||'').replace(/^[^\p{L}\p{N}]+/u,''),byTitle=(a,b)=>sortKey(a.title).localeCompare(sortKey(b.title),'vi');
function renderCards(){
  if(!state.data)return;
  const q=fold(state.query);let items;
  if(state.view==='books')items=state.data.books.filter(b=>(!state.series||b.series===state.series)&&(!state.channel||b.channel===state.channel)&&(!q||fold(`${b.title} ${b.authors.join(' ')}`).includes(q)));
  else items=state.data.projects.filter(p=>(!state.channel||p.channel===state.channel)&&(!state.series||p.series===state.series)&&(!state.status||p.status===state.status)&&(!q||fold(`${p.title} ${p.id} ${p.seriesTitle}`).includes(q)));
  items.sort((a,b)=>state.sort==='title'?byTitle(a,b):String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))||byTitle(a,b));
  $('#project-count').textContent=items.length;
  $('#project-grid').className='project-grid'+(state.view==='books'?' books-grid':'')+(state.layout==='list'?' list':'');
  $('#project-grid').innerHTML=items.length?items.slice(0,state.limit).map(state.view==='books'?bookCard:projectCard).join(''):`<div class="empty-state"><span class="empty-icon">${state.query?'⌕':'✧'}</span><strong>${state.query?'Chưa tìm thấy dự án phù hợp':'Một câu chuyện mới bắt đầu ở đây'}</strong><p>${state.query?'Thử từ khóa khác hoặc bỏ bớt bộ lọc.':'Series này chưa có tập sản xuất. Bạn có thể thêm một ý tưởng để bắt đầu chuẩn bị.'}</p><button class="button secondary" data-empty-action>${state.query?'Xóa bộ lọc':'Thêm dự án đầu tiên'}</button></div>`;
  $('#pagination').innerHTML=items.length?`<span>Hiển thị ${Math.min(state.limit,items.length)} / ${items.length} ${state.view==='books'?'cuốn sách':'dự án'}</span>${items.length>state.limit?'<button class="button secondary" data-more>Xem thêm ↓</button>':''}`:'';
  bindBookCoverFallbacks();
  document.querySelectorAll('.card-progress [data-width],.book-reading [data-width]').forEach(n=>{n.style.width=n.dataset.width+'%';});
  document.querySelectorAll('[data-preview-image]').forEach(image=>image.addEventListener('error',()=>{image.replaceWith(Object.assign(document.createElement('span'),{className:'cover-placeholder',textContent:'✧'}));},{once:true}));
}
// Books and projects open as full pages beside the sidebar; short workflow-step details remain a side panel.
function setPageMode(kind=false){const drawer=$('#drawer'),page=Boolean(kind);drawer.classList.toggle('detail-page',page);drawer.classList.toggle('book-page',kind==='book');drawer.classList.toggle('project-page',kind==='project');drawer.setAttribute('role',page?'region':'dialog');if(page)drawer.removeAttribute('aria-modal');else drawer.setAttribute('aria-modal','true');}
function showDrawer(page=false){renderBreadcrumbs();focusBeforeDrawer=document.activeElement;setMenu(false);setPageMode(page);$('.workspace').inert=true;$('#sidebar').inert=!page;$('#drawer').hidden=false;$('#drawer-backdrop').hidden=page;document.body.classList.add('overlay-open');if(page){$('#drawer').scrollTo(0,0);$('#drawer-title').focus();}else $('#close-drawer').focus();}
function closeDrawer(){if(!canLeaveNotes())return;hideDrawer();recordRoute(location.pathname+location.search);renderBreadcrumbs();focusBeforeDrawer?.focus();}
// Project page has two areas: Hồ sơ (documents, notes, folders) and Duyệt sản xuất (review), each with its own URL.
const PROJECT_TABS=['docs','review','progress'],TAB_PATH={review:'/duyet',progress:'/tien-trinh'};
const projectHash=(id,tab)=>'#project/'+encodeURIComponent(id)+(TAB_PATH[tab]||'');
function showProjectTab(tab){
  for(const t of PROJECT_TABS){const on=t===tab,button=$(`#tab-${t}`),panel=$(`#panel-${t}`);if(!button)return;button.setAttribute('aria-selected',on);button.tabIndex=on?0:-1;panel.hidden=!on;}
  state.projectTab=tab;
  if(tab==='progress'&&state.drawer)loadProgress(state.drawer.id,true);
}
function selectProjectTab(tab,focus=false){
  if(!state.drawer||state.projectTab===tab)return;showProjectTab(tab);
  recordRoute(location.pathname+location.search+projectHash(state.drawer.id,tab),true);if(focus)$(`#tab-${tab}`).focus();
}
$('#drawer-content').addEventListener('click',event=>{const t=event.target.closest('[data-project-tab]');if(t)selectProjectTab(t.dataset.projectTab);});
$('#drawer-content').addEventListener('keydown',event=>{
  const t=event.target.closest('[data-project-tab]');if(!t||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const i=PROJECT_TABS.indexOf(state.projectTab),n=PROJECT_TABS.length;
  selectProjectTab(PROJECT_TABS[event.key==='Home'?0:event.key==='End'?n-1:(i+(event.key==='ArrowRight'?1:n-1))%n],true);
});
async function openProject(id,record=true,tab='docs'){
  if(!canLeaveNotes())return;
  try{
    const request=++routeRequest;const detail=await api('/api/project?id='+encodeURIComponent(id));if(request!==routeRequest)return;state.drawer=detail;state.documentRequest++;
    if(record)recordRoute(location.pathname+location.search+projectHash(id,tab),true);
    $('#drawer-eyebrow').textContent='HỒ SƠ DỰ ÁN';
    const metadata=state.data.projects.find(p=>p.id===id),video=detail.registrations.find(r=>r.kind==='Composition'),thumb=detail.registrations.find(r=>r.kind==='Still'),projectStatus=metadata?.importedVideo?'Đã import video':statusNames[metadata?.status||detail.status];
    $('#drawer-content').innerHTML=`<header class="project-page-head"><h2 id="drawer-title" tabindex="-1">${esc(detail.title)}</h2><div class="drawer-meta"><span>${esc(detail.seriesTitle)}</span><span>·</span><span>${metadata?.format==='short'?'Short':'Video dài'} · ${duration(metadata?.durationSeconds)}</span><span class="status ${esc(metadata?.importedVideo?'existing':metadata?.status||detail.status)}">${esc(projectStatus)}</span></div><div class="drawer-actions">${video||metadata?.renderedVideo?`<button class="button primary" data-watch="video" data-id="${esc(id)}">${icon("play")} Xem video</button>`:''}${video?`<button class="button studio-button" data-studio="${esc(video.id)}" data-id="${esc(id)}">${icon("arrow")} Mở Studio</button>`:''}${thumb?`<a class="button secondary" data-watch="thumbnail" data-id="${esc(id)}" href="${studio(thumb.id)}" target="_blank" rel="noopener">${icon("image")} Xem thumbnail</a>`:''}</div></header><div class="project-tabs" role="tablist" aria-label="Khu vực của dự án"><button role="tab" id="tab-docs" aria-controls="panel-docs" data-project-tab="docs">Hồ sơ</button><button role="tab" id="tab-review" aria-controls="panel-review" data-project-tab="review">Duyệt sản xuất<span class="tab-flag" hidden></span></button><button role="tab" id="tab-progress" aria-controls="panel-progress" data-project-tab="progress">Tiến trình<span class="tab-flag" hidden></span></button></div><div class="project-tab-panel" role="tabpanel" id="panel-docs" aria-labelledby="tab-docs"><div class="project-page-layout"><div class="project-page-main"><section class="drawer-section"><h3>Tài liệu của tập</h3><div class="document-tabs" id="document-tabs">${detail.documents.map(d=>`<button data-document="${esc(d.id)}">${esc(d.name)}</button>`).join('')}</div><div id="document-view" class="document-view">Đang mở tài liệu…</div></section><section class="drawer-section"><h3>Ghi chú của bạn</h3><textarea id="notes-text" class="notes-input" maxlength="40000" placeholder="Ý tưởng cần bổ sung, điều cần sửa, việc cần làm…" aria-label="Ghi chú dự án">${esc(detail.notes)}</textarea><div class="notes-footer"><small id="notes-status">Lưu thành file riêng trong thư mục tài liệu.</small><button class="button primary" id="save-notes">Lưu ghi chú</button></div></section></div><aside class="project-page-aside"><section class="drawer-section"><h3>Đi đến thư mục</h3><div class="folder-list">${Object.entries(detail.paths).map(([kind,folder])=>`<button class="folder-button" data-folder="${esc(kind)}">${icon("folder")} ${esc({source:'Bản dựng',scripts:'Công cụ của tập',docs:'Tài liệu',assets:'Ảnh & âm thanh'}[kind]||kind)}<small>${esc(folder)}</small></button>`).join('')}${metadata?.videoFolder?`<button class="folder-button" data-folder="video">${icon("play")} ${metadata.importedVideo?'Video khách hàng':'Video đã xuất'}<small>${esc(metadata.videoFolder)}</small></button>`:''}</div></section><section class="drawer-section project-danger"><h3>Quản lý dự án</h3><button class="button danger" data-delete-project>Xóa dự án</button></section></aside></div></div><div class="project-tab-panel review-page" role="tabpanel" id="panel-review" aria-labelledby="tab-review"><section class="drawer-section" id="gates" aria-label="Duyệt sản xuất"><p class="muted">Đang đọc trạng thái duyệt…</p></section></div><div class="project-tab-panel progress-page" role="tabpanel" id="panel-progress" aria-labelledby="tab-progress"><section class="drawer-section" id="progress" aria-label="Tiến trình"><p class="muted">Đang đọc tiến trình…</p></section></div>`;
    showDrawer('project');showProjectTab(tab);
    loadGates(id);loadProgress(id);
    if(detail.documents.length)openDocument(detail.documents[0].id);else $('#document-view').innerHTML='<p class="empty-document">Chưa có tài liệu. Hãy bắt đầu bằng ghi chú của bạn.</p>';
  }catch(error){toast(error.message);}
}
// Production review (docs/architecture/review-workflow.md): initial lock of five items, then patches: each one
// bundles what the agent changed or produced (text diffs, scene videos, audio) for you to look at, mark Đạt /
// Chưa đạt with notes, and accept or return; then the final look in Studio. One "next action" on top.
const when=iso=>iso?new Date(iso).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
const gatePhase=g=>g.state==='approved'?'done':g.state==='stale'?'redo':g.blockedBy.length||g.missing.length?'locked':'turn';
const phaseText={done:'Đã duyệt',redo:'Cần duyệt lại',turn:'Đến lượt duyệt',locked:'Chưa tới lượt'};
const patchText={pending:'Chờ duyệt',accepted:'Đã chấp nhận',returned:'Đã trả lại',superseded:'Đã thay bằng bản mới'};
const names=list=>list.map(f=>f.name||f).filter((x,i,a)=>a.indexOf(x)===i).join(', ');
// What a patch holds, in words: the text documents changed, then how many videos and audio files to check.
// Requests you made in chat that a patch handled: one folded line, opened on demand.
const requestList=list=>list?.length?`<details class="patch-requests"><summary>Đã xử lý ${list.length} góp ý của bạn trong chat</summary><ul>${list.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>`:'';
const patchContents=p=>[p.files.length?`Chữ: ${p.files.join(', ')}`:'',...(p.changes||[]).map(c=>`${c.count} sửa ${c.area.toLowerCase()}`),p.videos?`${p.videos} video`:'',p.audios?`${p.audios} âm thanh`:''].filter(Boolean);
async function loadGates(id){
  const box=$('#gates');if(!box)return;
  try{const data=await api('/api/approvals?id='+encodeURIComponent(id));if(state.drawer?.id!==id)return;state.gates=data;renderGates();}
  catch(error){box.innerHTML=`<h3 id="gates-title">Duyệt sản xuất</h3><p class="warn">Không đọc được trạng thái duyệt: ${esc(error.message)}</p>`;}
}
function nextAction(d){
  if(d.state==='unlocked'&&d.returned&&!d.returned.revisedItems.length)return {tone:'idle',title:'Đã trả lại gói chốt; agent đang sửa theo ghi chú',small:`Trả lại ${when(d.returned.at)}${d.returned.notedTitles.length?` · có ghi chú ở: ${esc(d.returned.notedTitles.join(', '))}`:''}`};
  if(d.state==='unlocked'&&d.returned&&!d.missing.length)return {tone:'turn',title:'Gói chốt đã sửa theo ghi chú của bạn',small:`Mục đã sửa: ${esc(d.returned.revisedTitles.join(', '))}`,button:'<button class="button primary" data-review-open="lock">Xem lại và chốt</button>'};
  if(d.state==='unlocked')return d.missing.length?{tone:'idle',title:'Chuẩn bị gói chốt ban đầu',small:`Còn thiếu: ${esc(names(d.missing))}`}
    :{tone:'turn',title:'Chốt ban đầu: kịch bản, nhạc nền, giọng mẫu, thông tin đã chốt, prompt từng cảnh',button:'<button class="button primary" data-review-open="lock">Xem và chốt</button>'};
  if(d.pending)return {tone:'turn',title:`Bản vá ${esc(d.pending.id)}: ${esc(d.pending.reason)}`,small:`Cần bạn xem và góp ý · ${esc(patchContents(d.pending).join(' · '))}`,button:`<button class="button primary" data-review-open="patch" data-patch="${esc(d.pending.id)}">Xem và góp ý</button>`};
  if(d.final.ready&&d.preview&&d.preview.state!=='approved')return {tone:'turn',title:'Xem bản dựng trong Studio',button:'<button class="button primary" data-gate-review="review-preview">Mở</button>'};
  return {tone:'idle',title:d.final.ready?'Đã duyệt xong':'Chưa có gì cần bạn duyệt',small:d.final.ready?'':esc(d.final.blockers.join(' · '))};
}
function renderGates(){
  const box=$('#gates'),d=state.gates;if(!box||!d)return;
  if(!d.available){box.innerHTML=`<h3 id="gates-title">Duyệt sản xuất</h3><p class="muted">Tập này chưa có quy trình duyệt.</p>`;return;}
  const next=nextAction(d);
  const flag=$('#tab-review .tab-flag');if(flag){flag.hidden=next.tone!=='turn';flag.textContent=next.tone==='turn'?'Cần bạn':'';}
  // Three stages in order: lock once, then patches (results and edits to look at, any number of rounds), then the final look.
  const locked=d.version>0,accepted=d.patches.filter(p=>p.status==='accepted').length,previewDone=d.preview?.state==='approved';
  const stage=(n,done,current,title,line,action='')=>`<li class="gate-step ${done?'is-done':current?'is-current':'is-later'}"><span class="gate-dot" aria-hidden="true">${done?'✓':n}</span><div class="gate-main"><strong>${title}</strong><small>${line}</small>${action}</div></li>`;
  const stepper=[
    stage(1,locked,!locked,'Chốt ban đầu',locked?`Đang dùng bản v${d.version}`:d.missing.length?`Còn thiếu ${esc(names(d.missing))}`:d.returned?(d.returned.revisedItems.length?'Đã sửa sau lần bạn trả lại, chờ bạn xem':`Bạn trả lại ${when(d.returned.at)}, chờ agent sửa`):'Đủ 5 mục, chờ bạn chốt',
      locked||!d.missing.length?`<button class="link-button" data-review-open="lock">${locked?'Xem bản chốt':'Mở gói chốt'}</button>`:''),
    stage(2,locked&&!d.pending&&accepted>0&&d.final.ready,locked&&!d.final.ready,'Bản vá: xem và góp ý',!locked?'Sau khi chốt':d.pending?`Bản vá ${esc(d.pending.id)} chờ bạn`:accepted?`${accepted} bản vá đã chấp nhận`:'Chờ agent gửi bản vá đầu tiên'),
    stage(3,previewDone,d.final.ready&&!previewDone,'Xem bản dựng',previewDone?`Đã xem ${when(d.preview.approvedAt)}`:d.final.ready?'Sẵn sàng':'Khi không còn bản vá chờ'),
  ].join('');
  const summary=locked?`Chốt lần đầu ${when(d.lockedAt)}${d.lockedBy?` · ${esc(d.lockedBy)}`:''}${d.version>1?` · ${d.version-1} lần sửa đã vào bản chốt`:''}`:'Chưa chốt: sản xuất bắt đầu sau khi bạn chốt gói ban đầu.';
  const contents=p=>patchContents(p).map(c=>`<li>${esc(c)}</li>`).join('');
  const patchItem=p=>`<li class="patch-item status-${esc(p.status)}"><div class="patch-item-head"><button class="link-button" data-review-open="patch" data-patch="${esc(p.id)}">Bản vá ${esc(p.id)}</button><span class="patch-badge">${esc(patchText[p.status]||p.status)}${p.via==='chat'?' (qua chat)':''}</span><time>${when(p.decidedAt||p.createdAt)}</time></div><p>${esc(p.reason)}</p>${contents(p)?`<ul class="patch-contents">${contents(p)}</ul>`:''}${p.note?`<small class="patch-note">${p.via==='chat'?'Bạn góp ý qua chat':'Ghi chú'}: ${esc(p.note)}</small>`:''}${(p.itemNotes||[]).map(n=>`<small class="patch-note">${esc(n.name)}: ${esc(n.text)}</small>`).join('')}</li>`;
  const history=d.patches.filter(p=>p.status!=='pending'&&p.status!=='superseded'),replaced=d.patches.filter(p=>p.status==='superseded').length;
  const pendingCard=d.pending?`<div class="patch-pending"><div class="patch-pending-main"><span class="patch-badge">Chờ bạn xem</span><strong>Bản vá ${esc(d.pending.id)}</strong><p>${esc(d.pending.reason)}</p>${requestList(d.pending.requests)}<ul class="patch-contents">${contents(d.pending)}</ul><small>Gửi ${when(d.pending.createdAt)}</small></div><button class="button primary" data-review-open="patch" data-patch="${esc(d.pending.id)}">Xem và góp ý</button></div>`:'';
  const patches=`<section class="patch-panel" aria-labelledby="patches-title"><div class="block-head"><h4 id="patches-title">Bản vá</h4>${history.length?`<span class="count">${history.length} đã xem</span>`:''}</div><p class="patch-intro">${locked?'Mỗi bản vá gom những gì agent đã làm hoặc sửa: chữ (so với bản chốt), video cảnh, âm thanh. Bạn xem từng mục, bấm Đạt hoặc ghi chỗ chưa đạt, rồi chấp nhận hoặc trả lại.':'Sau khi chốt, mọi kết quả và chỉnh sửa sẽ đến đây thành bản vá để bạn xem và góp ý.'}</p>${d.drift.length?`<p class="warn patch-drift">Có thay đổi chưa vào bản vá: ${esc(names(d.drift))}. Agent cần tạo bản vá để bạn xem.</p>`:''}${pendingCard}${history.length?`<ol class="patch-list">${history.map(patchItem).join('')}</ol>${replaced?`<p class="patch-replaced">${replaced} bản vá cũ đã được thay bằng bản mới hơn.</p>`:''}`:locked&&!d.pending?'<p class="empty-block">Chưa có bản vá nào.</p>':''}</section>`;
  box.innerHTML=`<div class="review-top"><div class="review-summary"><span class="lock-chip state-${esc(d.state)}">${esc(d.state==='unlocked'?'Chưa chốt':`Bản chốt v${d.version}`)}</span><span>${summary}</span></div><ol class="review-stepper" aria-label="Các giai đoạn duyệt">${stepper}</ol></div><div class="gate-next is-${next.tone}"><div><span>Việc của bạn</span><strong>${next.title}</strong>${next.small?`<small>${next.small}</small>`:''}</div>${next.button||''}</div><div class="review-grid">${patches}</div>`;
  box.querySelectorAll('[data-width]').forEach(n=>{n.style.width=n.dataset.width+'%';});
}
// Review dialog: per file, what changed since the last approval (lines and words), or the whole text the first time.
const statusText={earlier:'Đã duyệt ở bước trước',changed:'Đã sửa',unchanged:'Không đổi',new:'Mới',missing:'Chưa có','no-baseline':'Đã sửa',binary:'Đã sửa'};
const diffText=row=>row.parts?row.parts.map(([c,x])=>c?`<mark>${esc(x)}</mark>`:esc(x)).join(''):esc(row.text)||'&nbsp;';
// Readable changes of a document: each changed passage under its section heading, "Trước" and "Sau" as prose
// (markdown marks, pauses, notes and table rows shown as text, changed words highlighted), unchanged text hidden.
function richText(text,parts,mark){
  const chars=[],flags=[];
  if(parts)for(const [c,str] of parts)for(const ch of str){chars.push(ch);flags.push(c);}else for(const ch of text){chars.push(ch);flags.push(0);}
  let out='',bold=false,open=false,i=0;const close=()=>{if(open){out+='</mark>';open=false;}};
  if(chars[0]==='{'){chars.shift();flags.shift();if(chars.at(-1)==='}'){chars.pop();flags.pop();}}
  const at=(str)=>chars.slice(i,i+str.length).join('')===str;
  while(i<chars.length){
    if(at('**')){close();out+=bold?'</strong>':'<strong>';bold=!bold;i+=2;continue;}
    if(at('[nghỉ]')){close();out+='<span class="pd-pause">nghỉ</span>';i+=6;continue;}
    if(chars[i]==='|'){close();if(i>0&&i<chars.length-1)out+='<span class="pd-sep" aria-hidden="true"></span>';i++;continue;}
    if(i===0&&chars[0]==='#'){while(chars[i]==='#'||chars[i]===' ')i++;continue;}
    if(flags[i]&&!open){out+=`<mark class="${mark}">`;open=true;}else if(!flags[i]&&open)close();
    out+=esc(chars[i]);i++;
  }
  close();if(bold)out+='</strong>';return out;
}
const proseLine=(r,mark)=>{const t=r.text.trim();if(!t||/^\|[\s:|-]+\|?$/.test(t))return '';
  const cls=t.startsWith('{')?'pd-note':t.startsWith('#')?'pd-head':t.startsWith('|')?'pd-row':t.startsWith('>')?'pd-quote':'pd-text';
  return `<p class="${cls}">${cls==='pd-note'?'<span class="pd-note-label">Ghi chú</span> ':''}${richText(r.text,r.parts,mark)}</p>`;};
function proseDiff(rows){
  const hunks=[];let heading='',cur=null;
  for(const r of rows){
    if(r.t===' '||r.t==='+'){if(/^#{1,4}\s/.test(r.text.trim()))heading=r.text.replace(/^#+\s*/,'').replace(/\s*\((≈|trên|trước)[^)]*\)\s*$/,'');}
    if(r.t===' '){cur=null;continue;}
    if(!r.text.trim()&&!cur)continue;
    if(!cur){cur={heading,del:[],add:[]};hunks.push(cur);}
    (r.t==='-'?cur.del:cur.add).push(r);
  }
  const block=(list,side)=>list.map(r=>proseLine(r,side==='del'?'pd-del':'pd-add')).join('');
  return hunks.filter(h=>block(h.del,'del')||block(h.add,'add')).map((h,n)=>{const del=block(h.del,'del'),add=block(h.add,'add');
    return `<article class="pd-hunk"><header><span class="pd-num">${n+1}</span><strong>${esc(h.heading||'Đầu tài liệu')}</strong><span class="pd-kind">${del&&add?'Sửa':add?'Thêm mới':'Bỏ đi'}</span></header>${del?`<div class="pd-side is-before"><span class="pd-label">${add?'Trước':'Đã bỏ'}</span>${del}</div>`:''}${add?`<div class="pd-side is-after"><span class="pd-label">${del?'Sau':'Thêm'}</span>${add}</div>`:''}</article>`;}).join('')||'<p class="muted">Chỉ đổi khoảng trắng.</p>';
}
function diffRows(rows,key){
  const out=[];let k=0;
  const line=r=>`<tr><td class="d-no">${r.o}</td><td class="d-no">${r.n}</td><td class="d-sign"></td><td class="d-text">${diffText(r)}</td></tr>`;
  while(k<rows.length){
    if(rows[k].t!==' '){const r=rows[k++];out.push(`<tr class="d-${r.t==='+'?'add':'del'}"><td class="d-no">${r.o??''}</td><td class="d-no">${r.n??''}</td><td class="d-sign">${r.t==='+'?'+':'−'}</td><td class="d-text">${diffText(r)}</td></tr>`);continue;}
    let e=k;while(e<rows.length&&rows[e].t===' ')e++;
    const run=rows.slice(k,e),keepHead=k===0?0:3,keepTail=e===rows.length?0:3;
    if(run.length>keepHead+keepTail+2&&!state.reviewExpanded?.[`${key}:${k}`])
      out.push(...run.slice(0,keepHead).map(line),`<tr class="d-fold"><td colspan="4"><button class="link-button" data-unfold="${esc(key)}:${k}">Hiện ${run.length-keepHead-keepTail} dòng không đổi</button></td></tr>`,...run.slice(run.length-keepTail).map(line));
    else out.push(...run.map(line));
    k=e;
  }
  return `<div class="diff-wrap"><table class="diff"><tbody>${out.join('')}</tbody></table></div>`;
}
// Checklist items: media first (listen / look), then each document that is new, edited or missing.
function reviewItems(r){
  const items=[],m=r.media||{};
  if(m.watch)items.push({key:'watch',kind:'watch',name:'Xem video',status:'media',detail:'Xem trong Studio'});
  if(m.voices)items.push({key:'voices',kind:'voices',name:m.watch?'Nghe lời đọc và nhạc':'Nghe giọng đọc',status:'media',detail:`${m.voices.length} đoạn${m.music?' · nhạc nền':''}`});
  if(m.images)items.push({key:'images',kind:'images',name:'Xem hình ảnh',status:'media',detail:`${(m.compositions||[]).length} composition${m.images.length?` · ${m.images.length} ảnh`:''}`});
  // Source code is folded away (still part of the approval hash); documents and data are shown readable.
  r.files.forEach((f,i)=>{if(!f.code&&!['earlier','unchanged'].includes(f.status))items.push({key:'f'+i,file:f,name:f.name,status:f.status,detail:f.status==='changed'?`+${f.added} −${f.removed} dòng`:statusText[f.status]});});
  return items;
}
function mediaPanel(r,item){
  const id=encodeURIComponent(state.drawer.id),m=r.media||{};
  if(item.kind==='watch'){
    return `<p class="review-hint">Xem liền cả tập trong Studio (bản dựng hiện tại, đã có giọng, nhạc, phụ đề); nếu không nghe tiếng, tải lại tab Studio.</p><ul class="studio-links">${m.watch.compositions.slice(0,1).map(c=>`<li><a class="button primary" href="${studio(c)}" target="_blank" rel="noopener">Mở ${esc(c)} trong Studio</a></li>`).join('')}</ul>${m.watch.compositions.length>1?`<details class="setting-more"><summary>Mở từng phần trong Studio (${m.watch.compositions.length-1})</summary><ul class="studio-links">${m.watch.compositions.slice(1).map(c=>`<li><a class="button secondary" href="${studio(c)}" target="_blank" rel="noopener">${esc(c)}</a></li>`).join('')}</ul></details>`:''}`;
  }
  if(item.kind==='voices')return m.voices.length||m.music||m.musicList?.length?`<p class="review-hint">Nghe hết các đoạn: đúng giọng, rõ chữ, đúng thanh điệu, không vấp.</p><ul class="voice-takes">${m.voices.map(v=>`<li><strong>${esc(v.name)}</strong><span>${v.durationSeconds?`${Math.round(v.durationSeconds*10)/10} giây`:''}</span><audio controls preload="none" src="/api/project-media?id=${id}&kind=voice&file=${encodeURIComponent(v.file)}"></audio></li>`).join('')}${(m.musicList||(m.music?[m.music]:[])).map(x=>`<li><strong>Nhạc: ${esc(x.title)}</strong><span>bản gốc đầy đủ</span><audio controls preload="none" src="/api/project-media?id=${id}&kind=music&file=${encodeURIComponent(x.file)}"></audio></li>`).join('')}</ul>`:'<p class="warn">Chưa có file giọng nào trong thư mục audio của tập.</p>';
  const comps=m.compositions||[];
  return `<p class="review-hint">Hình vẽ bằng code nằm trong các composition. Mở trong Studio để xem chuyển động, rồi quay lại đây đánh dấu đã xem.</p>${comps.length?`<ul class="studio-links">${comps.map(c=>`<li><a class="button secondary" href="${studio(c)}" target="_blank" rel="noopener">Mở ${esc(c)}</a></li>`).join('')}</ul>`:''}${m.images.length?`<div class="image-grid">${m.images.map(f=>`<figure><img loading="lazy" alt="" src="/api/project-media?id=${id}&kind=image&file=${encodeURIComponent(f)}"><figcaption>${esc(f)}</figcaption></figure>`).join('')}</div>`:''}`;
}
function filePanel(f,key){
  if(f.status==='changed')return `<p class="review-hint">So với bản đã duyệt: dòng <span class="d-plus">thêm</span> nền xanh, dòng <span class="d-minus">bỏ</span> nền đỏ, chữ đổi được tô đậm.</p>${f.tooLarge?'<p class="muted">Tài liệu quá dài để so từng dòng.</p>':diffRows(f.rows,key)}`;
  if(f.status==='new'||f.status==='no-baseline')return `<p class="review-hint">${f.status==='new'?'Tài liệu mới của bước này: đọc toàn bộ.':'Lần duyệt trước chưa lưu nội dung, nên chỉ xem được bản hiện tại.'}</p><div class="review-doc document-view"></div>`;
  if(f.status==='missing'){const info=(state.review.gate.missingInfo||[]).find(m=>m.path===f.path);return `<p class="warn">Chưa có tài liệu này${info?.by?`. Nó được tạo ở bước “${esc(info.by)}”`:''}.</p>`;}
  return '<p class="muted">Tài liệu đã đổi nhưng không xem được dạng chữ.</p>';
}
function renderReview(){if(state.reviewMode==='detail')return renderDetail();return renderGateReview();}
function renderGateReview(){
  const r=state.review;if(!r)return;const g=r.gate,phase=gatePhase(g),items=reviewItems(r),prior=r.files.filter(f=>['earlier','unchanged'].includes(f.status)),code=r.files.filter(f=>f.code&&!['earlier','unchanged'].includes(f.status));
  const canApprove=phase==='turn'||phase==='redo',seen=state.reviewSeen,current=items[state.reviewIndex]||items[0],done=items.filter(i=>seen.has(i.key)).length;
  const rail=`<aside class="review-rail" aria-label="Danh sách cần xem"><p class="rail-title">${canApprove?'Cần bạn xem':'Nội dung'} <span>${done}/${items.length}</span></p><ol>${items.map((it,i)=>`<li><button class="rail-item${it===current?' is-current':''}${seen.has(it.key)?' is-seen':''}" data-review-item="${i}" aria-current="${it===current}"><span class="rail-check" aria-hidden="true">${seen.has(it.key)?'✓':i+1}</span><span class="rail-name">${esc(it.name)}<small>${esc(it.detail||'')}</small></span></button></li>`).join('')||'<li class="rail-empty">Không có gì mới cần xem.</li>'}</ol>${prior.length?`<details class="rail-prior"><summary>Đã duyệt trước, không đổi (${prior.length})</summary><ul>${prior.map(f=>`<li>${esc(f.name)}</li>`).join('')}</ul></details>`:''}${code.length?`<details class="rail-prior"><summary>Mã dựng, không cần đọc (${code.length})</summary><ul>${code.map(f=>`<li>${esc(f.path.split('/').pop())}</li>`).join('')}</ul><p>Vẫn được ghi khi duyệt; nội dung xem qua video.</p></details>`:''}</aside>`;
  const panel=current?`<section class="review-panel" aria-labelledby="panel-title"><header><span class="tag ${current.status==='missing'?'tag-warn':''}">${esc(current.status==='media'?'Nghe / xem':statusText[current.status])}</span><h3 id="panel-title">${esc(current.name)}</h3>${current.file?`<code>${esc(current.file.path)}</code>`:''}</header><div class="panel-body">${current.status==='media'?mediaPanel(r,current):filePanel(current.file,current.key)}</div>${canApprove?`<div class="panel-actions">${state.reviewIndex>0?'<button class="button quiet" data-review-prev>Mục trước</button>':'<span></span>'}<button class="button ${seen.has(current.key)?'secondary':'primary'}" data-review-seen>${seen.has(current.key)?(state.reviewIndex<items.length-1?'Mục tiếp theo':'Đã xem mục này'):state.reviewIndex<items.length-1?'Đã xem, sang mục tiếp':'Đã xem mục này'}</button></div>`:''}</section>`
    :'<section class="review-panel"><p class="muted">Không có gì mới cần xem ở bước này.</p></section>';
  const ready=done===items.length;
  const foot=!canApprove?`<footer class="review-foot"><p>${phase==='done'?`Đã duyệt ${when(g.approvedAt)}.`:g.blockedBy.length?`Chưa tới lượt: cần ${esc(g.blockedBy.join(', ').toLowerCase())} trước.`:`Chưa tới lượt: còn chờ ${esc(g.missingInfo.map(m=>m.by||m.name).filter((x,i,a)=>a.indexOf(x)===i).join(', '))}.`}</p><div class="review-actions"><button class="button secondary" data-review-close>Đóng</button></div></footer>`
    :`<form class="review-foot" id="review-form"><span class="foot-progress${ready?' is-ready':''}">${ready?'✓ Đã xem hết':`Đã xem ${done}/${items.length}`}</span><label class="review-note"><span>Ghi chú</span><input name="note" maxlength="1000" autocomplete="off" placeholder="Không bắt buộc"></label><p class="review-status" role="status"></p><div class="review-actions"><button type="button" class="button quiet" data-review-close>Để sau</button><button type="submit" class="button primary"${ready?'':' disabled'}>${esc(g.title)}</button></div></form>`;
  const note=$('#review-form input[name=note]')?.value||'';
  $('#review-content').innerHTML=`<header class="review-head"><div><span class="gate-badge phase-${phase}">${phaseText[phase]}</span><h2 id="review-title">${esc(g.title)}</h2><p>${r.previous?`Lần duyệt trước: ${when(r.previous.at)}. Chỉ hiện phần đã đổi từ lúc đó.`:'Lần duyệt đầu cho bước này.'}${prior.length?` ${prior.length} tài liệu đã duyệt ở bước trước được ẩn.`:''}</p></div><button class="icon-button" data-review-close aria-label="Đóng">${icon('close')}</button></header><div class="review-layout">${rail}<div class="review-body">${panel}</div></div>${foot}`;
  if($('#review-form input[name=note]'))$('#review-form input[name=note]').value=note;
  const box=$('#review-dialog .review-doc');if(box&&current?.file)box.append(readableFile(current.file.path,current.file.text));
}
// Review panels show files the way the Hồ sơ tab does: Markdown rendered, captions as a timed table, other JSON as
// labelled fields; the exact text stays one click away.
const clockMs=ms=>{const t=Math.max(0,ms)/1000,m=Math.floor(t/60);return `${m}:${(t-m*60).toFixed(1).padStart(4,'0').replace('.',',')}`;};
// captions.json in any of the project shapes, read as a script with times: scene groups ([[page…]…]), a long episode
// ({pages:[{part,…}]}, grouped by part) or several shorts ({shorts:{id:{title,durationSeconds,pages}}}).
const isPage=c=>c&&typeof c.text==='string'&&Number.isFinite(c.startMs);
function captionGroups(data){
  if(Array.isArray(data)&&data.length&&data.every(g=>Array.isArray(g)&&g.every(isPage)))return data.map((pages,i)=>({title:`Cảnh ${i+1}`,pages}));
  if(data&&typeof data.shorts==='object'&&!Array.isArray(data.shorts)){const list=Object.entries(data.shorts).map(([id,x],i)=>({title:x.title||`Short ${i+1}`,sub:[x.composition,Number.isFinite(x.durationSeconds)?`${String(x.durationSeconds).replace('.',',')} giây`:''].filter(Boolean).join(' · '),pages:x.pages||[]}));return list.every(g=>g.pages.every(isPage))?list:null;}
  const pages=Array.isArray(data)?data:data&&Array.isArray(data.pages)?data.pages:null;
  if(!pages||!pages.length||!pages.every(isPage))return null;
  if(!pages.some(c=>c.part))return [{title:'Phụ đề',pages}];
  const groups=[];for(const c of pages){const last=groups.at(-1);if(last&&last.title===c.part)last.pages.push(c);else groups.push({title:c.part,pages:[c]});}
  return groups;
}
function captionsView(data){
  const groups=captionGroups(data);if(!groups)return null;
  const total=groups.reduce((n,g)=>n+g.pages.length,0);
  const rows=pages=>{let part='';return pages.map(c=>{const tag=c.part&&c.part!==part&&groups.length===1?h('span',{class:'caption-part'},c.part):null;part=c.part||part;
    return h('li',{class:'caption-line'},h('span',{class:'caption-time'},clockMs(c.startMs)),h('span',{class:'caption-text'},tag,tag?' ':null,c.text));});};
  // Inside a short, mark where its parts (opening, excerpt, invitation) begin.
  const shortRows=pages=>{let part='';return pages.map(c=>{const start=c.part&&c.part!==part;part=c.part||part;
    return h('li',{class:'caption-line'+(start?' part-start':'')},h('span',{class:'caption-time'},clockMs(c.startMs)),h('span',{class:'caption-text'},start?h('span',{class:'caption-part'},c.part):null,start?' ':null,c.text));});};
  return h('div',{class:'caption-view'},h('p',{class:'caption-summary'},`${total} trang phụ đề · ${groups.length} ${data&&data.shorts?'short':'phần'}. Mỗi dòng là một trang hiện trên màn hình, kèm thời điểm bắt đầu.`),
    ...groups.map(g=>h('section',{class:'caption-group'},h('h4',{},g.title,g.sub?h('small',{},g.sub):null,h('span',{class:'count'},`${g.pages.length} trang`)),h('ol',{class:'caption-lines'},...(data&&data.shorts?shortRows(g.pages):rows(g.pages))))));
}
function readableFile(file,text){
  if(file.endsWith('.md'))return renderMarkdown(text);
  if(!file.endsWith('.json'))return h('pre',{class:'doc-code'},text);
  let data;try{data=JSON.parse(text);}catch{return h('pre',{class:'doc-code'},text);}
  const view=(file.endsWith('captions.json')&&captionsView(data))||jsonView(data);
  return h('div',{},view,h('details',{class:'setting-more'},h('summary',{},'Xem file gốc'),h('pre',{class:'setting-raw'},text)));
}
// A newly opened review starts empty: render functions keep typed notes only across re-renders of the same item.
const freshDialog=()=>{$('#review-content').innerHTML='';};
async function openReview(gate){
  try{freshDialog();state.reviewMode='gate';state.review=await api(`/api/approval-review?id=${encodeURIComponent(state.drawer.id)}&gate=${encodeURIComponent(gate)}`);state.reviewExpanded={};state.reviewSeen=new Set();state.reviewIndex=0;renderReview();$('#review-dialog').showModal();$('#review-dialog .rail-item')?.focus();}
  catch(error){toast(error.message);}
}
function showItem(i){document.querySelectorAll('#review-dialog audio').forEach(a=>a.pause());if(state.reviewMode==='detail')flushNotes();state.reviewIndex=i;renderReview();$('#review-dialog .review-body').scrollTop=0;$('#review-dialog .rail-item.is-current')?.focus();}
// Tiến trình: what the agent planned after the lock and is doing now. Read-only; refreshed while the tab is open.
// What needs you and what is still open come first; finished work folds away so the end of the plan is never far.
const taskText={pending:'Chưa làm',running:'Đang làm',done:'Xong',failed:'Lỗi',blocked:'Đang chờ',interrupted:'Bị ngắt'};
const eventText={plan:'Lập kế hoạch',replan:'Cập nhật kế hoạch','plan-add':'Thêm việc',running:'Bắt đầu',update:'Cập nhật',done:'Xong',failed:'Lỗi',blocked:'Đang chờ',pending:'Đặt lại',log:'Ghi chú',patch:'Gửi bản vá','patch-accepted':'Bạn chấp nhận','patch-returned':'Bạn trả lại'};
const ago=iso=>{if(!iso)return '';const s=Math.max(0,(Date.now()-Date.parse(iso))/1000);return s<60?'vừa xong':s<3600?`${Math.round(s/60)} phút trước`:s<86400?`${Math.round(s/3600)} giờ trước`:when(iso);};
const dayOf=iso=>{const d=new Date(iso),t=new Date();const k=x=>x.toDateString();if(k(d)===k(t))return 'Hôm nay';t.setDate(t.getDate()-1);if(k(d)===k(t))return 'Hôm qua';const w=d.toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'});return w[0].toUpperCase()+w.slice(1);};
const bar=(pct,cls='')=>`<span class="pbar ${cls}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span data-width="${pct}"></span></span>`;
const progressUi={kind:'',doneOpen:false,events:15,patches:3,summaryOpen:false};
async function loadProgress(id,quiet=false){
  const box=$('#progress');if(!box)return;
  try{const data=await api('/api/progress?id='+encodeURIComponent(id));if(state.drawer?.id!==id)return;if(state.progress?.projectId!==data.projectId)Object.assign(progressUi,{kind:'',doneOpen:false,events:15,patches:3,summaryOpen:false});state.progress=data;renderProgress();}
  catch(error){if(!quiet)box.innerHTML=`<p class="warn">Không đọc được tiến trình: ${esc(error.message)}</p>`;}
}
function renderProgress(){
  const box=$('#progress'),d=state.progress;if(!box||!d)return;
  const flag=$('#tab-progress .tab-flag');if(flag){const live=d.counts?.running,stop=d.counts?.interrupted+d.counts?.failed;flag.hidden=!d.plan||!(live||stop);flag.textContent=stop?'Bị ngắt':live?`${d.overall}%`:'';flag.classList.toggle('is-warn',Boolean(stop));}
  if(!d.available){box.innerHTML=`<p class="muted">Tập này chưa có quy trình sản xuất.</p>`;return;}
  if(!d.plan){box.innerHTML=`<div class="empty-block progress-empty"><strong>${d.locked?`Đã chốt v${d.lockVersion}. Agent chưa lập kế hoạch thực hiện.`:'Tiến trình bắt đầu sau khi bạn chốt ban đầu.'}</strong><p>Sau khi chốt, agent phân tích và chia việc (giọng đọc, hình ảnh/animation, nhạc nền, dựng, clip duyệt cảnh…) rồi cập nhật trực tiếp ở đây: đang làm gì, xong bao nhiêu phần trăm so với kế hoạch. Nếu bị ngắt giữa chừng, trạng thái cuối cùng vẫn được giữ.</p></div>`;return;}
  const focusKey=box.contains(document.activeElement)?document.activeElement.dataset.focusKey:null;
  const c=d.counts,v=progressUi,kinds=[...new Set(d.tasks.map(t=>t.kindTitle))];
  if(v.kind&&!kinds.includes(v.kind))v.kind='';
  const shown=d.tasks.filter(t=>!v.kind||t.kindTitle===v.kind),by=s=>shown.filter(t=>s.includes(t.display));
  const waiting=(d.patches||[]).find(p=>p.status==='pending');
  const long=(d.plan.summary||'').length>160;
  const head=`<div class="progress-head"><div class="progress-figure"><strong>${d.overall}%</strong><span>so với kế hoạch</span></div><div class="progress-head-main">${bar(d.overall,'is-big')}<p>${c.done}/${c.total} việc xong${c.running?` · ${c.running} đang làm`:''}${c.blocked?` · ${c.blocked} đang chờ`:''}${c.pending?` · ${c.pending} chưa làm`:''}${c.interrupted?` · <b class="t-warn">${c.interrupted} bị ngắt</b>`:''}${c.failed?` · <b class="t-warn">${c.failed} lỗi</b>`:''}${waiting?` · <b class="t-wait">bản vá ${esc(waiting.id)} chờ bạn</b>`:''}</p></div><span class="live-dot${c.running?' is-on':''}">${c.running?'Đang chạy':'Tự cập nhật'}<small>${d.lastActivity?`hoạt động ${ago(d.lastActivity)}`:''}</small></span></div>`
   +(d.plan.summary?`<div class="plan-summary${v.summaryOpen||!long?' is-open':''}"><p id="plan-summary-text"><b>Kế hoạch theo bản chốt v${d.plan.lockVersion||d.lockVersion}:</b> ${esc(d.plan.summary)}</p>${long?`<button type="button" class="link-button" data-plan-more data-focus-key="plan-more" aria-expanded="${v.summaryOpen}" aria-controls="plan-summary-text">${v.summaryOpen?'Thu gọn':'Xem đủ'}</button>`:''}</div>`:'');
  const chips=kinds.length>1?`<div class="kind-filter" role="group" aria-label="Lọc theo loại việc">${[['',d.tasks],...kinds.map(k=>[k,d.tasks.filter(t=>t.kindTitle===k)])].map(([k,list])=>{const done=list.filter(t=>t.display==='done').length,open=list.length-done;return `<button type="button" data-progress-kind="${esc(k)}" data-focus-key="kind-${esc(k)}" aria-pressed="${v.kind===k}" class="${open?'':'is-complete'}"><span>${esc(k||'Tất cả')}</span><small>${done}/${list.length}</small></button>`;}).join('')}</div>`:'';
  const meta=t=>[t.steps?`${t.steps.done}/${t.steps.total} phần`:'',t.display!=='done'&&t.steps?.names?.[t.steps.done]?`tiếp: ${esc(t.steps.names[t.steps.done])}`:'',t.display==='interrupted'?`dừng từ ${ago(t.updatedAt)}`:t.updatedAt?`cập nhật ${ago(t.updatedAt)}`:''].filter(Boolean).join(' · ');
  const icon=t=>t.display==='done'?'✓':t.display==='running'?'●':t.display==='interrupted'||t.display==='failed'?'!':t.display==='blocked'?'‖':'○';
  const kindTag=t=>v.kind?'':`<span class="task-kind">${esc(t.kindTitle)}</span>`;
  // Open work in full: bar, step, note. Pending and finished work one line each.
  const active=t=>`<li class="task-row is-active status-${t.display}"><span class="task-icon" aria-hidden="true">${icon(t)}</span><div class="task-main"><div class="task-line"><strong>${esc(t.title)}</strong>${kindTag(t)}</div>${t.display==='blocked'?'':bar(t.percent)}<small class="task-meta">${[`<b>${t.percent}%</b>`,meta(t)].filter(Boolean).join(' · ')}</small>${t.note||t.detail?`<small class="task-note">${esc(t.note||t.detail)}</small>`:''}</div><span class="task-badge">${taskText[t.display]}</span></li>`;
  const line=t=>`<li class="task-row is-line status-${t.display}"><span class="task-icon" aria-hidden="true">${icon(t)}</span><div class="task-main"><strong>${esc(t.title)}</strong>${t.note||t.detail?`<small>${esc(t.note||t.detail)}</small>`:''}</div><span class="task-end">${kindTag(t)}<small>${t.display==='done'?esc(ago(t.finishedAt||t.updatedAt)):t.steps?`${t.steps.total} phần`:''}</small></span></li>`;
  const section=(cls,title,list,render,extra='')=>list.length?`<section class="progress-section ${cls}" aria-labelledby="ps-${cls}"><h4 id="ps-${cls}">${title} <small>${list.length}</small></h4>${extra}<ul class="task-list">${list.map(render).join('')}</ul></section>`:'';
  const wait=waiting?`<section class="progress-section ps-wait" aria-labelledby="ps-wait"><h4 id="ps-wait">Chờ bạn</h4><div class="wait-card"><div><strong>Bản vá ${esc(waiting.id)} chờ bạn duyệt</strong><p>${esc(waiting.reason)}</p><small>Gửi ${ago(waiting.createdAt)}${waiting.media?` · ${waiting.media} kết quả để xem/nghe`:''}</small></div><button type="button" class="button primary" data-goto-tab="review">Mở Duyệt sản xuất</button></div></section>`:'';
  const stopped=by(['interrupted','failed','blocked']),done=by(['done']);
  const rounds=d.patches||[],roundRow=p=>`<li class="round-row is-${p.status}"><span class="round-id">${esc(p.id)}</span><div class="task-main"><strong>${esc(p.reason)}</strong>${p.note&&p.status==='returned'?`<small>Bạn ghi: ${esc(p.note)}</small>`:''}</div><span class="task-end"><span class="round-badge">${p.via==='chat'&&p.status==='returned'?'Trả lại qua chat':patchText[p.status]||esc(p.status)}</span><small>${ago(p.createdAt)}</small></span></li>`;
  const roundsBlock=rounds.length?`<section class="progress-section ps-rounds" aria-labelledby="ps-rounds"><h4 id="ps-rounds">Vòng sửa theo góp ý <small>${rounds.length}</small></h4><p class="section-hint">Mỗi bản vá là một lượt agent làm theo góp ý của bạn, kể cả việc ngoài kế hoạch.</p><ul class="task-list">${rounds.slice(0,v.patches).map(roundRow).join('')}</ul>${rounds.length>v.patches?`<button type="button" class="link-button more" data-more-patches data-focus-key="more-patches">Xem cả ${rounds.length} vòng</button>`:rounds.length>3?`<button type="button" class="link-button more" data-less-patches data-focus-key="more-patches">Thu gọn</button>`:''}</section>`:'';
  const doneBlock=done.length?`<details class="progress-section ps-done" data-done-list${v.doneOpen?' open':''}><summary data-focus-key="done"><span>Đã xong</span> <small>${done.length}</small><span class="summary-hint">${v.doneOpen?'Thu gọn':'Xem lại'}</span></summary><ul class="task-list">${done.map(line).join('')}</ul></details>`:'';
  const open=shown.length-done.length;
  const main=`<div class="progress-main">${chips}${wait}${section('ps-now','Đang làm',by(['running']),active)}${section('ps-stop','Cần chú ý',stopped,active,c.interrupted&&stopped.some(t=>t.display==='interrupted')?'<p class="warn progress-warn">Có việc bị ngắt giữa chừng; trạng thái cuối cùng được giữ nguyên để biết đang làm tới đâu.</p>':'')}${section('ps-next','Tiếp theo',by(['pending']),line)}${!open&&shown.length?`<p class="all-done">${v.kind?`Đã xong mọi việc ${esc(v.kind.toLowerCase())}.`:'Đã xong mọi việc trong kế hoạch.'}</p>`:''}${doneBlock}${v.kind?'':roundsBlock}</div>`;
  const events=d.events.slice(0,v.events);let day='';
  const timeline=`<aside class="progress-timeline" aria-labelledby="timeline-title"><h4 id="timeline-title">Hoạt động</h4><ol>${events.map(e=>{const label=dayOf(e.at),headRow=label!==day?`<li class="ev-day">${esc(label)}</li>`:'';day=label;return `${headRow}<li class="ev-${esc(e.type)}"><time datetime="${esc(e.at)}" title="${esc(when(e.at))}">${new Date(e.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</time><span><b>${esc(eventText[e.type]||e.type)}</b>${e.title?` · ${esc(e.title)}`:''}${e.percent!=null&&e.type==='update'?` · ${e.percent}%`:''}${e.message?`<small>${esc(e.message)}</small>`:''}</span></li>`;}).join('')}</ol>${d.events.length>v.events?`<button type="button" class="link-button more" data-more-events data-focus-key="more-events">Xem thêm (còn ${d.events.length-v.events})</button>`:''}${d.runs.length?`<h4 class="runs-title">Lượt chạy model local</h4><ul class="runs">${d.runs.map(r=>`<li><span>${esc(r.stage)}</span><small>${esc(r.status)} · ${ago(r.createdAt)}</small></li>`).join('')}</ul>`:''}</aside>`;
  box.innerHTML=head+`<div class="progress-grid">${main}${timeline}</div>`;
  box.querySelectorAll('[data-width]').forEach(n=>{n.style.width=n.dataset.width+'%';});
  if(focusKey)box.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
}
$('#drawer-content').addEventListener('click',event=>{
  const t=event.target.closest('#progress [data-progress-kind],#progress [data-plan-more],#progress [data-more-events],#progress [data-more-patches],#progress [data-less-patches],#progress [data-goto-tab]');if(!t)return;
  const v=progressUi;
  if(t.dataset.gotoTab){selectProjectTab(t.dataset.gotoTab,true);return;}
  if(t.hasAttribute('data-progress-kind'))v.kind=v.kind===t.dataset.progressKind?'':t.dataset.progressKind;
  else if(t.hasAttribute('data-plan-more'))v.summaryOpen=!v.summaryOpen;
  else if(t.hasAttribute('data-more-events'))v.events+=30;
  else if(t.hasAttribute('data-more-patches'))v.patches=Infinity;
  else if(t.hasAttribute('data-less-patches'))v.patches=3;
  renderProgress();
});
$('#drawer-content').addEventListener('toggle',event=>{if(event.target.matches?.('#progress [data-done-list]')){progressUi.doneOpen=event.target.open;const h=event.target.querySelector('.summary-hint');if(h)h.textContent=event.target.open?'Thu gọn':'Xem lại';}},true);
// Live events refresh Tiến trình as it changes; this slow timer is only a fallback (and turns "running" into
// "interrupted" when an agent process is gone, which writes no file).
setInterval(()=>{if(state.drawer&&state.projectTab==='progress'&&!$('#drawer').hidden&&document.visibilityState==='visible')loadProgress(state.drawer.id,true);},15000);
// Music and voice settings in words: the choices you check first, other parameters folded, the raw file last.
const vnNum=v=>String(+(+v).toFixed(2)).replace('.',','),pct=v=>`${Math.round(v*100)}%`,sec=v=>`${vnNum(v)} giây`,rate=v=>`${vnNum(v)}×`,listOf=v=>Array.isArray(v)?v.join(', '):v;
const pick=(o,k)=>k.split('.').reduce((a,p)=>a?.[p],o);
const SETTINGS={
  music:[['credit.title','Bài'],['credit.artists','Tác giả',listOf],['credit.source','Nguồn'],['credit.sourceUrl','Trang nguồn'],['file','File nhạc'],
    ['speechVolume','Âm lượng khi có lời',pct],['pauseVolume','Âm lượng lúc ngừng lời',pct],['baseVolume','Âm lượng nền',pct],['fadeInSeconds','Fade vào',sec],['fadeOutSeconds','Fade ra',sec],
    ['playbackRate','Tốc độ phát',rate],['preservePitch','Giữ cao độ khi đổi tốc độ',v=>v?'Có':'Không'],
    [o=>Number.isFinite(o.lowerFromSeconds)&&`Từ giây ${vnNum(o.lowerFromSeconds)}, hạ dần trong ${sec(o.lowerOverSeconds||0)} xuống ${pct(o.lowerToVolume||0)}`,'Hạ nhạc'],
    [o=>Number.isFinite(o.videoStartSeconds)&&`${sec(o.videoStartSeconds)} – ${Number.isFinite(o.videoEndSeconds)?sec(o.videoEndSeconds):'hết video'}`,'Đoạn trên video'],
    [o=>Number.isFinite(o.sourceStartSeconds)&&`${sec(o.sourceStartSeconds)} – ${Number.isFinite(o.sourceEndSeconds)?sec(o.sourceEndSeconds):'hết bài'}`,'Đoạn dùng trong bài'],
    ['credit.processing','Xử lý'],['editingNote','Ghi chú dựng']],
  voice:[[o=>o.name||o.voice,'Giọng'],['option','Cách chọn giọng',v=>({1:'Cách 1: giọng có sẵn (VieNeu)',2:'Cách 2: clone giọng'})[v]||v],['gender','Giới tính',v=>({male:'Nam',female:'Nữ'})[v]||v],
    ['engine','Công cụ'],['consent','Sự đồng ý',v=>({self:'Giọng của bạn',permission:'Người trong bản ghi đã đồng ý'})[v]||v],['reference','Bản ghi mẫu'],['referenceText','Lời của bản ghi mẫu'],
    ['pitchSemitones','Cao độ',v=>+v?`${v>0?'+':''}${vnNum(v)} bán cung`:'Giữ nguyên'],[o=>o.speed??o.playbackRate,'Tốc độ',rate],['durationSeconds','Thời lượng',sec],
    ['processing','Cách xử lý'],['selection','Lựa chọn'],['sample.status','Đoạn mẫu'],['listeningReview','Nghe duyệt',v=>typeof v==='object'?JSON.stringify(v):v],
    [o=>o.segments&&Object.keys(o.segments).length&&`${Object.keys(o.segments).length} đoạn: ${Object.keys(o.segments).join(', ')}`,'Các đoạn đã ghép']]};
const USED={music:['credit','file','speechVolume','pauseVolume','baseVolume','fadeInSeconds','fadeOutSeconds','playbackRate','preservePitch','lowerFromSeconds','lowerOverSeconds','lowerToVolume','videoStartSeconds','videoEndSeconds','sourceStartSeconds','sourceEndSeconds','editingNote'],
  voice:['name','voice','option','gender','engine','consent','reference','referenceText','pitchSemitones','speed','playbackRate','durationSeconds','processing','selection','sample','listeningReview','segments']};
const shortValue=v=>Array.isArray(v)?`${v.length} mục`:v&&typeof v==='object'?`${Object.keys(v).length} mục`:String(v);
function settingsView(kind,text){
  let data;try{data=JSON.parse(text);}catch{return null;}
  const rows=SETTINGS[kind].map(([k,label,fmt])=>{const raw=typeof k==='function'?k(data):pick(data,k);return raw===undefined||raw===null||raw===''||raw===false&&typeof k==='function'?null:[label,fmt?fmt(raw):listOf(raw)];}).filter(Boolean);
  const rest=Object.entries(data).filter(([k])=>!USED[kind].includes(k));
  return `<dl class="setting-list">${rows.map(([l,v])=>`<div${String(v).length>90?' class="is-long"':''}><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${rest.length?`<details class="setting-more"><summary>Thông số khác (${rest.length})</summary><dl class="setting-list is-compact">${rest.map(([k,v])=>`<div><dt><code>${esc(k)}</code></dt><dd>${esc(shortValue(v))}</dd></div>`).join('')}</dl></details>`:''}<details class="setting-more"><summary>Xem file gốc</summary><pre class="setting-raw">${esc(text)}</pre></details>`;
}
// Where a patch is watched: one Studio button per main composition of the project (no exported review clips).
const studioStrip=list=>list?.length?`<span class="studio-strip"><span>Xem trong Studio:</span>${list.map(c=>`<button type="button" class="button studio-button" data-studio-launch="${esc(c.id)}">${esc(c.title)}</button>`).join('')}</span>`:'';
// Lock and patch: the same checklist layout (items on the left, one at a time on the right, "seen" before deciding).
function detailPanel(item){
  const id=encodeURIComponent(state.drawer.id);
  if(item.change){const c=item.change;return `<p class="review-hint">${esc(item.guide)}</p><dl class="change-card"><div><dt>Sửa gì</dt><dd>${esc(c.what)}</dd></div>${c.why?`<div><dt>Vì sao</dt><dd>${esc(c.why)}</dd></div>`:''}${c.before?`<div class="is-before"><dt>Trước</dt><dd>${esc(c.before)}</dd></div>`:''}${c.after?`<div class="is-after"><dt>Sau</dt><dd>${esc(c.after)}</dd></div>`:''}</dl>`;}
  if(item.media){const src=`/api/review/media?id=${id}&kind=patch&key=${encodeURIComponent(item.media.src)}`;
    return `<p class="review-hint">${esc(item.guide)}</p>${item.media.changedSince?'<p class="warn">File này đã đổi sau khi agent gửi bản vá; agent cần gửi bản vá mới.</p>':''}${item.media.kind==='video'?`<p class="studio-instead">Xem đoạn này trực tiếp trong Studio (bản dựng hiện tại), không cần clip xuất riêng.</p>${studioStrip(state.review.compositions)}`:`<audio class="patch-audio" controls preload="metadata" src="${src}"></audio><p class="media-path"><code>${esc(item.media.path)}</code></p>`}`;}
  const audio=item.audio.length?`<ul class="voice-takes is-pair">${item.audio.map(a=>`<li><strong>${esc(a.name)}</strong><audio controls preload="none" src="/api/review/media?id=${id}&kind=${encodeURIComponent(a.kind)}&key=${encodeURIComponent(a.key)}"></audio></li>`).join('')}</ul>`:'';
  const files=item.files.map((f,i)=>`<section class="detail-file"><h4>${esc(f.name)} <code>${esc(f.path)}</code></h4>${
    f.status==='changed'&&/\.md$/i.test(f.path)&&!f.tooLarge?`<p class="review-hint">${state.review?.returned?'So với bản bạn đã trả lại':f.base&&f.base!=='lock'?`Chỉ phần mới so với bản vá ${esc(f.base)}`:'So với bản chốt'}: chỉ hiện đoạn đã đổi, theo từng phần. Chữ <mark class="pd-add">thêm</mark>, chữ <mark class="pd-del">bỏ</mark>.</p><div class="prose-diff">${proseDiff(f.rows)}</div><details class="diff-raw"><summary>Xem so từng dòng (bản gốc)</summary>${diffRows(f.rows,`${item.key}-${i}`)}</details>`
    :f.status==='changed'?`<p class="review-hint">${state.review?.returned?'So với bản bạn đã trả lại':'So với bản chốt'}: dòng <span class="d-plus">thêm</span> nền xanh, dòng <span class="d-minus">bỏ</span> nền đỏ, chữ đổi được tô đậm.</p>${f.tooLarge?'<p class="muted">Tài liệu quá dài để so từng dòng.</p>':diffRows(f.rows,`${item.key}-${i}`)}`
    :f.status==='text'&&SETTINGS[item.kind]&&f.path.endsWith('.json')&&settingsView(item.kind,f.text)?settingsView(item.kind,f.text)
    :f.status==='text'?`<div class="review-doc document-view" data-doc="${i}"></div>`
    :f.status==='missing'?'<p class="warn">Chưa có file này.</p>':'<p class="muted">Không xem được dạng chữ.</p>'}</section>`).join('');
  return `<p class="review-hint">${esc(item.guide)}</p>${audio?`<h4 class="listen-title">Nghe</h4>${audio}`:''}${files}`;
}
// Per-item notes: typed under the item, saved as you go (agents read them even before the lock), editable on return.
const noteContext=()=>state.review.mode==='lock'?'lock':state.review.patch.id;
const railSmall=it=>{const d=state.reviewDecisions?.[it.key];return [it.type==='video'?'Video':it.type==='audio'?'Âm thanh':it.type==='text'?'Chữ':it.type==='change'?'Mô tả thay đổi':'',d==='pass'?'Đạt':d==='fail'?'Chưa đạt':'',...it.files.map(f=>f.status==='changed'?'đã sửa':f.status==='missing'?'chưa có':'')].filter(Boolean).join(' · ');};
function noteStateText(key){
  const n=state.reviewNotes[key];if(state.noteTimers[key])return 'Đang lưu…';
  return n?`Đã lưu ${when(n.at)}${n.changedSince?' · nội dung đã sửa sau ghi chú này':''}`:'Tự lưu khi bạn gõ. Agent đọc được ngay, kể cả khi bạn chưa chốt.';
}
async function saveNote(key){
  clearTimeout(state.noteTimers[key]);delete state.noteTimers[key];
  const text=state.noteDrafts[key];if(text===undefined||text===(state.reviewNotes[key]?.text||''))return;
  try{const out=await api('/api/review/note',{id:state.drawer.id,context:noteContext(),item:key,text});
    if(out.note)state.reviewNotes[key]=out.note;else delete state.reviewNotes[key];delete state.noteDrafts[key];}
  catch(error){toast(`Chưa lưu được ghi chú: ${error.message}`);return;}
  const items=state.review.items,i=items.findIndex(it=>it.key===key),small=$(`#review-dialog [data-review-item="${i}"] small`);if(small)small.textContent=railSmall(items[i]);
  const st=$('#review-dialog .note-state');if(st&&$('#item-note')?.dataset.key===key)st.textContent=noteStateText(key);
}
const flushNotes=()=>Promise.all(Object.keys(state.noteDrafts).map(saveNote));
function renderDetail(){
  const r=state.review,lock=r.mode==='lock',items=r.items,dec=state.reviewDecisions,current=items[state.reviewIndex]||items[0];
  const editable=lock?r.state==='unlocked':r.patch.status==='pending',done=items.filter(i=>dec[i.key]).length,fails=items.filter(i=>dec[i.key]==='fail');
  const noteOf=key=>(state.noteDrafts[key]??state.reviewNotes[key]?.text??'').trim(),missingNotes=fails.filter(i=>!noteOf(i.key));
  const ready=done===items.length&&!missingNotes.length;
  const title=lock?(r.state==='unlocked'?'Chốt ban đầu':`Bản chốt v${state.gates.version}`):`Bản vá ${r.patch.id}`;
  const badge=lock?(r.state==='unlocked'?'Chờ bạn chốt':'Đã chốt'):patchText[r.patch.status]||r.patch.status;
  const intro=lock?(r.state==='unlocked'?(r.returned?`Bạn đã trả lại gói lúc ${when(r.returned.at)}${r.returned.note?` (“${esc(r.returned.note)}”)`:''}. ${r.returned.revisedItems.length?'Phần đã sửa được so với bản bạn trả lại; ghi chú cũ hiện ở từng mục.':'Agent chưa sửa mục nào.'} Xem lại từng mục: tất cả đạt thì chốt, còn mục chưa đạt thì trả lại tiếp.`:'Xem từng mục và bấm Đạt hoặc Chưa đạt (mục chưa đạt thì ghi chỗ cần sửa). Tất cả đạt thì chốt; có mục chưa đạt thì trả lại cho agent sửa tới khi đạt. Sau khi chốt, mọi chỉnh sửa đi qua bản vá.'):'Nội dung đang dùng; phần sửa sau bản chốt được so với bản chốt.')
    :`${studioStrip(r.compositions)}${esc(r.patch.reason)} · tạo ${when(r.patch.createdAt)} trên bản v${r.patch.baseVersion}${r.patch.note?` · Ghi chú: ${esc(r.patch.note)}`:''}${requestList(r.patch.requests)}${r.patch.previous?`<span class="review-prev">Chỉ hiện phần mới so với bản vá ${esc(r.patch.previous.id)}${r.patch.previous.unchanged.length?`; không đổi từ đó: ${esc(r.patch.previous.unchanged.join(', '))}`:''}. Chấp nhận là nhận cả những gì đã sửa từ bản chốt.</span>`:''}`;
  const rail=`<aside class="review-rail" aria-label="Danh sách cần xem"><p class="rail-title">${editable?'Cần bạn xem':'Nội dung'} <span>${editable?`${done}/${items.length}`:items.length}</span></p><ol>${items.map((it,i)=>`<li><button class="rail-item${it===current?' is-current':''}${dec[it.key]==='pass'?' is-seen':''}${dec[it.key]==='fail'?' is-fail':''}" data-review-item="${i}" aria-current="${it===current}"><span class="rail-check" aria-hidden="true">${dec[it.key]==='pass'?'✓':dec[it.key]==='fail'?'!':i+1}</span><span class="rail-name">${esc(it.title)}<small>${esc(railSmall(it))}</small></span></button></li>`).join('')}</ol></aside>`;
  const recorded=current&&state.reviewLockedNotes[current.key]?`<div class="note-recorded"><span>Ghi chú của bạn khi ${r.returned?'trả lại':lock?'chốt':'duyệt'} (${when(state.reviewLockedNotes[current.key].at)})</span><p>${esc(state.reviewLockedNotes[current.key].text)}</p></div>`:'';
  const draft=current?state.noteDrafts[current.key]??state.reviewNotes[current.key]?.text??'':'';
  // Per item: Đạt needs nothing more; Chưa đạt opens the note, which then is required.
  const d=current?dec[current.key]:null,last=state.reviewIndex>=items.length-1;
  const noteBar=current&&editable?`<div class="panel-foot">${d==='fail'?`<label class="item-note" for="item-note"><span>Chỗ chưa đạt ở mục “${esc(current.title)}”</span><textarea id="item-note" data-key="${esc(current.key)}" rows="3" maxlength="4000" placeholder="Chưa đạt ở đâu và cần sửa thế nào? Agent sửa theo ghi chú này.">${esc(draft)}</textarea></label><p class="note-state" role="status">${esc(noteStateText(current.key))}</p>`:''}<div class="panel-actions">${state.reviewIndex>0?'<button type="button" class="button quiet" data-review-prev>Mục trước</button>':'<span></span>'}<div class="decide-buttons" role="group" aria-label="Đánh giá mục này"><button type="button" class="button ${d==='fail'?'is-fail-on':'secondary'}" data-item-fail aria-pressed="${d==='fail'}">Chưa đạt</button><button type="button" class="button ${d==='pass'?'is-pass-on':d?'secondary':'primary'}" data-item-pass aria-pressed="${d==='pass'}">Đạt</button>${d==='fail'&&!last?'<button type="button" class="button quiet" data-review-next>Mục tiếp theo</button>':''}</div></div></div>`:'';
  const panel=current?`<section class="review-panel" aria-labelledby="panel-title"><header><h3 id="panel-title">${esc(current.title)}</h3></header><div class="panel-body">${r.returned?recorded+detailPanel(current):detailPanel(current)+recorded}</div>${noteBar}</section>`:'<section class="review-panel"><p class="muted">Không có nội dung.</p></section>';
  const note=$('#review-form [name=note]')?.value||'';
  const foot=!editable?`<footer class="review-foot"><p>${lock?`Đã chốt; đang dùng bản v${state.gates.version}.`:`${esc(patchText[r.patch.status]||r.patch.status)}.`}</p><div class="review-actions"><button class="button secondary" data-review-close>Đóng</button></div></footer>`
    :`<form class="review-foot" id="review-form"><span class="foot-progress${ready?' is-ready':''}">Đã xem ${done}/${items.length}${fails.length?` · <b class="t-warn">${fails.length} chưa đạt</b>`:done===items.length?' · tất cả đạt':''}</span>${fails.length?`<label class="review-note"><span>Ghi chú chung</span><input name="note" maxlength="${lock?1000:2000}" autocomplete="off" placeholder="Không bắt buộc"></label>`:'<span class="review-note"></span>'}<p class="review-status" role="status">${missingNotes.length?`Ghi chỗ chưa đạt ở: ${esc(missingNotes.map(i=>i.title).join(', '))}`:''}</p><div class="review-actions"><button type="button" class="button quiet" data-review-close>Để sau</button><button type="submit" class="button primary"${ready?'':' disabled'}>${fails.length?'Trả lại cho agent sửa':lock?'Chốt ban đầu':'Chấp nhận'}</button></div></form>`;
  $('#review-content').innerHTML=`<header class="review-head"><div><span class="gate-badge phase-${editable?'turn':'done'}">${esc(badge)}</span><h2 id="review-title">${esc(title)}</h2><div class="review-intro">${intro}</div></div><button class="icon-button" data-review-close aria-label="Đóng">${icon('close')}</button></header><div class="review-layout">${rail}<div class="review-body">${panel}</div></div>${foot}`;
  if($('#review-form [name=note]'))$('#review-form [name=note]').value=note;
  document.querySelectorAll('#review-dialog [data-doc]').forEach(box=>{const f=current.files[Number(box.dataset.doc)];box.append(readableFile(f.path,f.text));});
}
// While typing a Chưa đạt note: enable the main button once every Chưa đạt item has its note.
function refreshDecisionFoot(){
  if(state.reviewMode!=='detail')return;const items=state.review.items,dec=state.reviewDecisions,button=$('#review-form button[type=submit]'),status=$('#review-form .review-status');if(!button)return;
  const missing=items.filter(i=>dec[i.key]==='fail'&&!(state.noteDrafts[i.key]??state.reviewNotes[i.key]?.text??'').trim());
  button.disabled=items.some(i=>!dec[i.key])||missing.length>0;
  if(status&&!status.dataset.error)status.textContent=missing.length?`Ghi chỗ chưa đạt ở: ${missing.map(i=>i.title).join(', ')}`:'';
}
async function openDetail(mode,patch){
  try{state.review=await api(`/api/review-detail?id=${encodeURIComponent(state.drawer.id)}&mode=${mode}${patch?`&patch=${encodeURIComponent(patch)}`:''}`);
    freshDialog();state.reviewMode='detail';state.reviewExpanded={};state.reviewSeen=new Set();state.reviewIndex=0;
    state.reviewNotes={...state.review.notes};state.reviewLockedNotes=state.review.lockedNotes||{};state.noteDrafts={};state.noteTimers={};
    // Decisions are remembered while the page is open, and start over once the content changes.
    const memoKey=`${state.drawer.id}:${mode}:${patch||''}`,memo=(state.decisionMemo||={})[memoKey];
    state.reviewDecisions=memo&&memo.revision===state.review.revision?memo.decisions:{};state.decisionMemo[memoKey]={revision:state.review.revision,decisions:state.reviewDecisions};
    for(const key of Object.keys(state.reviewNotes))state.reviewDecisions[key]='fail'; // a saved note means "chưa đạt"
    renderReview();$('#review-dialog').showModal();$('#review-dialog .rail-item')?.focus();}
  catch(error){toast(error.message);}
}
// "Chưa đạt" on the initial package: back to the agent with the notes (overall and per item); nothing is locked.
async function returnLock(){
  const form=$('#review-form'),status=form.querySelector('.review-status');await flushNotes();
  if(!(form.elements.note?.value||'').trim()&&!Object.keys(state.reviewNotes).length){status.textContent='Ghi chỗ chưa đạt để agent biết cần sửa gì.';return;}
  form.querySelectorAll('button').forEach(b=>{b.disabled=true;});
  try{await api('/api/review/lock-return',{id:state.drawer.id,note:form.elements.note?.value||'',revision:state.review.revision});$('#review-dialog').close();await loadGates(state.drawer.id);toast('Đã trả lại gói chốt kèm ghi chú.');}
  catch(error){status.textContent=error.message;form.querySelectorAll('button').forEach(b=>{b.disabled=false;});}
}
async function decidePatch(decision){
  await flushNotes();
  const form=$('#review-form'),status=form.querySelector('.review-status'),r=state.review;
  if(decision==='returned'&&!(form.elements.note?.value||'').trim()&&!Object.keys(state.reviewNotes).length){status.textContent='Ghi chỗ chưa đạt để agent biết cần sửa gì.';return;}
  form.querySelectorAll('button').forEach(b=>{b.disabled=true;});
  try{const out=await api('/api/review/patch',{id:state.drawer.id,patch:r.patch.id,decision,note:form.elements.note?.value||'',revision:r.revision});$('#review-dialog').close();await loadGates(state.drawer.id);toast(decision==='accepted'?`Đã chấp nhận ${r.patch.id}; đang dùng bản chốt v${out.version}.`:`Đã trả lại ${r.patch.id}.`);}
  catch(error){status.textContent=error.message;form.querySelectorAll('button').forEach(b=>{b.disabled=false;});}
}
const reviewList=()=>state.reviewMode==='detail'?state.review.items:reviewItems(state.review);
$('#drawer-content').addEventListener('click',event=>{
  const t=event.target.closest('[data-gate-review]');if(t){openReview(t.dataset.gateReview);return;}
  const d=event.target.closest('[data-review-open]');if(d){openDetail(d.dataset.reviewOpen,d.dataset.patch);return;}
});
$('#review-dialog').addEventListener('click',event=>{
  if(event.target===event.currentTarget||event.target.closest('[data-review-close]')){$('#review-dialog').close();return;}
  const sl=event.target.closest('[data-studio-launch]');if(sl&&state.drawer?.id){launchStudio(state.drawer.id,sl.dataset.studioLaunch);return;}
  const item=event.target.closest('[data-review-item]');if(item){showItem(Number(item.dataset.reviewItem));return;}
  if(event.target.closest('[data-review-prev]')){showItem(Math.max(0,state.reviewIndex-1));return;}
  if(event.target.closest('[data-patch-return]')){decidePatch('returned');return;}
  if(event.target.closest('[data-lock-return]')){returnLock();return;}
  if(event.target.closest('[data-item-pass]')){const items=state.review.items,key=items[state.reviewIndex].key;state.reviewDecisions[key]='pass';
    if(state.reviewNotes[key]||state.noteDrafts[key]){state.noteDrafts[key]='';saveNote(key);}
    const next=items.findIndex((it,i)=>i>state.reviewIndex&&!state.reviewDecisions[it.key]),undecided=items.findIndex(it=>!state.reviewDecisions[it.key]);
    showItem(next>=0?next:undecided>=0?undecided:state.reviewIndex);return;}
  if(event.target.closest('[data-item-fail]')){state.reviewDecisions[state.review.items[state.reviewIndex].key]='fail';renderReview();$('#item-note')?.focus();return;}
  if(event.target.closest('[data-review-next]')){showItem(Math.min(state.reviewIndex+1,state.review.items.length-1));return;}
  if(event.target.closest('[data-review-seen]')){const items=reviewList();state.reviewSeen.add((items[state.reviewIndex]||items[0]).key);const next=items.findIndex((it,i)=>i>state.reviewIndex&&!state.reviewSeen.has(it.key));showItem(next>=0?next:Math.min(state.reviewIndex+1,items.length-1));return;}
  const fold=event.target.closest('[data-unfold]');if(fold){state.reviewExpanded[fold.dataset.unfold]=true;const top=$('#review-dialog .review-body').scrollTop;renderReview();$('#review-dialog .review-body').scrollTop=top;}
});
$('#review-dialog').addEventListener('close',()=>{document.querySelectorAll('#review-dialog audio,#review-dialog video').forEach(a=>a.pause());if(state.reviewMode==='detail')flushNotes().then(()=>state.drawer&&loadGates(state.drawer.id));else if(state.liveMissed&&state.drawer)loadGates(state.drawer.id);state.liveMissed=false;});
$('#review-dialog').addEventListener('input',event=>{
  const box=event.target.closest('#item-note');if(!box)return;const key=box.dataset.key;state.noteDrafts[key]=box.value;
  refreshDecisionFoot();
  clearTimeout(state.noteTimers[key]);state.noteTimers[key]=setTimeout(()=>saveNote(key),700);$('#review-dialog .note-state').textContent='Đang lưu…';
});
$('#review-dialog').addEventListener('play',event=>document.querySelectorAll('#review-dialog audio').forEach(a=>{if(a!==event.target)a.pause();}),true);
$('#review-dialog').addEventListener('submit',async event=>{
  event.preventDefault();
  if(state.reviewMode==='detail'){
    const items=state.review.items,status=event.target.querySelector('.review-status'),dec=state.reviewDecisions;
    if(items.some(it=>!dec[it.key])){status.textContent='Hãy đánh giá Đạt hoặc Chưa đạt cho từng mục.';return;}
    if(items.some(it=>dec[it.key]==='fail'))return state.review.mode==='patch'?decidePatch('returned'):returnLock();
    if(state.review.mode==='patch')return decidePatch('accepted');
    await flushNotes();
    const button=event.target.querySelector('button[type=submit]');button.disabled=true;
    try{const out=await api('/api/review/lock',{id:state.drawer.id,note:event.target.elements.note?.value||'',revision:state.review.revision,confirm:true});$('#review-dialog').close();await loadGates(state.drawer.id);toast(`Đã chốt ban đầu (v${out.version}).`);}
    catch(error){status.textContent=error.message;button.disabled=false;}
    return;
  }
  const form=event.target,g=state.review.gate,status=form.querySelector('.review-status'),button=form.querySelector('button[type=submit]');
  const items=reviewItems(state.review);if(items.some(it=>!state.reviewSeen.has(it.key))){status.textContent='Hãy xem hết các mục trong danh sách trước khi duyệt.';return;}
  button.disabled=true;
  try{await api('/api/approve',{id:state.drawer.id,gate:g.id,note:form.elements.note.value,revision:g.revision,confirm:true});$('#review-dialog').close();await loadGates(state.drawer.id);toast(`Đã ghi nhận: ${g.title}.`);}
  catch(error){status.textContent=error.message;button.disabled=false;}
});
async function openDocument(key,quiet=false){
  if(!state.drawer)return;const id=state.drawer.id,request=++state.documentRequest;state.documentKey=key;
  document.querySelectorAll('[data-document]').forEach(b=>b.classList.toggle('active',b.dataset.document===key));
  // A live refresh keeps the current text and scroll position until the new version arrives.
  const view=$('#document-view'),top=view.scrollTop;if(!quiet)view.textContent='Đang mở…';
  try{const doc=await api(`/api/document?id=${encodeURIComponent(id)}&file=${encodeURIComponent(key)}`);if(request!==state.documentRequest)return;renderDocument(doc);if(quiet)view.scrollTop=top;}
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
  target.append(doc.filename==='book.json'?bookInfoView(data):doc.filename==='chapters.json'&&state.drawer?.book?chapterMapView(data):(doc.filename==='captions.json'&&captionsView(data))||jsonView(data));
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
  $('#drawer-content').innerHTML=`<header class="book-page-head"><div id="book-identity">${bookIdentity(book,status)}</div><div class="book-notice">${esc(book.note||'Hồ sơ nghiên cứu dùng chung cho các tập trong series.')}</div></header><div class="book-page-layout"><aside class="book-page-aside"><section class="book-cover-editor"><div class="book-cover-preview">${bookArtwork(book)}</div><div><h3>Ảnh bìa</h3><p>JPG, PNG hoặc WebP · tối đa 8 MB.</p><label class="button secondary cover-picker">${book.cover?'Thay ảnh bìa':'Thêm ảnh bìa'}<input id="book-cover-upload" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Chọn ảnh bìa sách"></label><p id="cover-upload-status" role="status"></p></div></section><button class="button primary" data-project-from-book>＋ Lên ý tưởng một tập</button>${bookEpisodes(book)}<section class="drawer-section"><h3>Nguồn sách</h3><p>Chép PDF vào thư mục riêng của cuốn sách trên máy. Không tự đọc, OCR hoặc gửi ra dịch vụ khác.</p><ul>${(book.sources||[]).map(f=>`<li>${esc(f.name)} · ${(f.size/1048576).toFixed(1)} MB</li>`).join('')||'<li>Chưa có PDF nguồn.</li>'}</ul><label class="field"><span>Thêm PDF (tối đa 200 MB/file)</span><input id="book-upload" type="file" accept=".pdf,application/pdf" multiple></label><p id="upload-status" role="status"></p></section></aside><div class="book-page-main"><section class="drawer-section"><h3>Tài liệu nghiên cứu</h3><div class="document-tabs">${bookEps(book).eps.length?`<button data-book-document="__episodes">Các tập <span class="tab-count">${bookEps(book).eps.length}</span></button>`:''}${book.documents.map(file=>`<button data-book-document="${esc(file)}">${esc(names[file]||file)}</button>`).join('')}</div><div id="document-view" class="document-view">Đang mở…</div></section></div></div>`;
  bindBookCoverFallbacks();
  showDrawer('book');if(bookEps(book).eps.length)openBookDocument('__episodes');else if(book.documents.length)openBookDocument(book.documents.includes('season-plan.md')?'season-plan.md':book.documents[0]);
}
async function openBookDocument(file){const book=state.drawer;if(!book?.book)return;const request=++state.documentRequest;document.querySelectorAll('.document-tabs [data-book-document]').forEach(b=>b.classList.toggle('active',b.dataset.bookDocument===file));
  if(file==='__episodes'){const record=state.data.books.find(b=>b.id===book.id&&b.series===book.series);$('#document-view').innerHTML=bookEpisodesView(record);$('#document-view').lastDocument=null;$('.document-tabs [data-book-document="__episodes"]')?.scrollIntoView({block:'nearest',inline:'nearest'});return;}try{const doc=await api(`/api/book-document?series=${encodeURIComponent(book.series)}&book=${encodeURIComponent(book.id)}&file=${encodeURIComponent(file)}`);if(request===state.documentRequest)renderDocument(doc);}catch(error){if(request===state.documentRequest)$('#document-view').textContent=error.message;}}
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
    $('#create-fields').innerHTML=`<label class="field"><span>Series</span><select name="series" id="create-series">${state.data.series.map(s=>`<option value="${esc(s.id)}" ${s.id===selected?'selected':''}>${esc(state.data.channels.find(c=>c.id===s.channel)?.title)} / ${esc(s.title)}</option>`).join('')}</select></label>${field('title','Tên dự án (không bắt buộc)','text','','Để trống thì hệ thống đặt tên tạm “Chưa đặt tên N”; tên sẽ được đổi cho hợp nội dung khi bắt đầu làm.')}${field('id','Mã dự án (không bắt buộc)','text','','Tự tạo theo tên. Để trống cùng tên để nhận mã tạm chua-dat-ten-N.')}<div class="field-row"><label class="field"><span>Định dạng</span><select name="format" id="create-format"></select></label>${field('duration','Thời lượng (giây)','number','','Để trống nếu chưa chốt video dài.')}</div><label class="field" id="create-book-field"><span>Gắn với sách</span><select name="book" id="create-book"><option value="">Chưa gắn sách</option></select></label><section class="create-import" id="create-import" hidden><label class="create-import-choice"><input type="checkbox" id="create-import-toggle"><span><strong>Import video có sẵn của khách hàng</strong><small>Tùy chọn · chép một bản vào workspace, không thay đổi file gốc.</small></span></label><label class="field create-video-field" id="create-video-field" hidden><span>Video ${esc(state.data.videoFormats?.label||'MP4, WebM')} (tối đa 8 GB)</span><input id="create-video-file" name="projectVideo" type="file" accept="${esc((state.data.videoFormats?.extensions||['.mp4','.webm']).join(','))},video/*" autocomplete="off"><small>Video được lưu tại <code>public/&lt;mã-dự-án&gt;/</code> . MP4, MOV, M4V, WebM, MKV xem được ngay trong hồ sơ; định dạng khác (AVI, WMV, MPG, TS…) vẫn lưu được và mở bằng thư mục.</small></label></section>`;
    for(const name of ['title','id'])$(`#create-fields input[name="${name}"]`).required=false;
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
  updateCreateDuration();updateCreateImport();
}
function updateCreateDuration(){const form=$('#create-form');const series=state.data.series.find(s=>s.id===form.elements.series?.value);form.elements.duration.value=series?.channel==='tam-ly-cuoc-song'&&form.elements.format.value==='short'?'45':'';}
function updateCreateImport(){
  const panel=$('#create-import');if(!panel)return;const series=state.data.series.find(s=>s.id===$('#create-series').value),external=series&&!contentChannels.includes(series.channel),toggle=$('#create-import-toggle'),field=$('#create-video-field'),file=$('#create-video-file');
  panel.hidden=!external;if(!external){toggle.checked=false;file.value='';}field.hidden=!external||!toggle.checked;file.required=external&&toggle.checked;$('#submit-create').textContent=external&&toggle.checked?'Tạo và import video':'Tạo dự án';
}
// Channel profiles on social platforms (tools/project-manager/channels.cjs): name, link, description and images per
// platform. Metadata only; the page never signs in to, reads from or posts to a platform.
function channelImageUrl(channel,file){return `/api/channel-image?channel=${encodeURIComponent(channel)}&file=${encodeURIComponent(file)}`;}
async function loadChannelProfile(id){
  state.channelProfileStale=false;
  try{state.channelProfile=await api('/api/channel-profile?channel='+encodeURIComponent(id));}catch(error){state.channelProfile={channel:id,error:error.message};}
  if(state.channel===id&&!state.series&&state.view==='projects')renderChannelProfile();return state.channelProfile;
}
function renderChannelProfile(){
  const box=$('#channel-profile'),show=Boolean(state.channel)&&!state.series&&state.view==='projects'&&contentChannels.includes(state.channel);box.hidden=!show;if(!show)return;
  const profile=state.channelProfile;
  if(!profile||profile.channel!==state.channel||state.channelProfileStale){loadChannelProfile(state.channel);if(!profile||profile.channel!==state.channel){box.innerHTML='<p class="workflow-empty">Đang đọc hồ sơ kênh…</p>';return;}}
  if(profile.error){box.innerHTML=`<p class="workflow-empty">Không đọc được hồ sơ kênh: ${esc(profile.error)}</p>`;return;}
  const list=profile.platforms;
  const heading=`<div class="channel-heading"><div><h2 id="channel-profile-title">Kênh trên các nền tảng</h2><p>${list.length?`${list.length} nền tảng. `:''}Tên, link, mô tả và ảnh của kênh ở từng nơi đăng video. Chỉ lưu trên máy, không kết nối tài khoản.</p></div>${list.length?`<button class="button secondary" data-channel-add>${icon('plus')}Thêm nền tảng</button>`:''}</div>`;
  if(!list.length){box.innerHTML=heading+`<div class="channel-empty"><p>Chưa lưu nền tảng nào cho ${esc(profile.title)}. Thêm YouTube, TikTok, Facebook… để giữ tên, link và mô tả kênh ở một chỗ.</p><button class="button primary" data-channel-add>${icon('plus')}Thêm nền tảng đầu tiên</button></div>`;return;}
  // A re-render (refresh on window focus, a save) keeps keyboard focus on the same control.
  const focused=box.contains(document.activeElement)?document.activeElement:null,key=focused?.dataset.channelEdit!==undefined?`[data-channel-edit="${CSS.escape(focused.dataset.channelEdit)}"]`:focused?.hasAttribute('data-channel-add')?'.channel-heading [data-channel-add]':'';
  box.innerHTML=heading+`<ul class="platform-grid">${list.map(p=>platformCard(profile,p)).join('')}</ul>`;
  if(key)box.querySelector(key)?.focus({preventScroll:true});
  box.querySelectorAll('.platform-description').forEach(node=>{const more=node.nextElementSibling;if(more?.hasAttribute('data-channel-more'))more.hidden=node.scrollHeight<=node.clientHeight+2;});
}
function platformCard(profile,p){
  const label=profile.platformNames[p.platform]||p.platform,initial=[...p.name.trim()][0]||'?';
  // Compact row: the banner is kept in the profile and shown in the edit dialog, not on the card.
  return `<li class="platform-card platform-${esc(p.platform)}"><span class="platform-avatar">${p.avatar?`<img src="${channelImageUrl(profile.channel,p.avatar)}" alt="" width="96" height="96" loading="lazy" decoding="async">`:`<span aria-hidden="true">${esc(initial.toUpperCase())}</span>`}</span>
<div class="platform-main"><div class="platform-title"><h3>${esc(p.name)}</h3><span class="platform-tag">${esc(label)}</span></div>${p.handle?`<p class="platform-handle">${esc(p.handle)}</p>`:''}
${p.description?`<p class="platform-description">${esc(p.description)}</p><button class="text-button" data-channel-more aria-expanded="false" hidden>Xem cả mô tả</button>`:'<p class="platform-description is-empty">Chưa có mô tả kênh.</p>'}
${p.notes?`<p class="platform-notes"><span>Ghi chú riêng:</span> ${esc(p.notes)}</p>`:''}</div>
<div class="platform-actions">${p.url?`<a class="button secondary" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Mở kênh<span class="sr-only"> ${esc(label)} trong tab mới</span></a>`:'<span class="platform-nolink">Chưa có link</span>'}<button class="button quiet" data-channel-edit="${esc(p.id)}">Sửa<span class="sr-only"> ${esc(label)}: ${esc(p.name)}</span></button></div></li>`;
}
// One dialog adds or edits a platform; chosen images upload after the text is saved, each against the newest revision.
function openChannelDialog(id){
  const profile=state.channelProfile;if(!profile||profile.error)return;
  const item=id?profile.platforms.find(p=>p.id===id):null;if(id&&!item){toast('Nền tảng này vừa bị xóa. Trang đã đọc lại hồ sơ kênh.');loadChannelProfile(state.channel);return;}
  const form=$('#channel-form'),used=new Set(profile.platforms.map(p=>p.platform));
  state.channelEdit={id:item?.id||'',images:{avatar:item?.avatar||null,banner:item?.banner||null},picked:{},cleared:{}};
  form.reset();$('#channel-error').hidden=true;
  $('#channel-platform').innerHTML=Object.entries(profile.platformNames).map(([key,name])=>`<option value="${esc(key)}">${esc(name)}</option>`).join('');
  $('#channel-platform').value=item?.platform||Object.keys(profile.platformNames).find(k=>!used.has(k))||'other';
  for(const field of ['name','handle','url','description','notes'])form.elements[field].value=item?.[field]||'';
  if(!item)form.elements.name.value=profile.title;
  $('#channel-dialog-title').textContent=item?`Sửa ${profile.platformNames[item.platform]||item.platform}`:'Thêm nền tảng';
  $('#channel-dialog-description').textContent=`${profile.title} · lưu trong ${profile.file}`;
  $('#delete-channel').hidden=!item;$('#channel-order').hidden=!item||profile.platforms.length<2;
  $('#submit-channel').textContent=item?'Lưu thay đổi':'Thêm nền tảng';
  for(const kind of ['avatar','banner'])showChannelImage(kind);
  updateChannelCount();$('#channel-dialog').showModal();form.elements.name.focus();form.elements.name.select();
}
function showChannelImage(kind){
  const e=state.channelEdit,picked=e.picked[kind],current=e.cleared[kind]?null:e.images[kind],box=$(`#channel-${kind}-preview`);
  const src=picked?.dataUrl||(current?channelImageUrl(state.channelProfile.channel,current):'');
  box.innerHTML=src?`<img src="${esc(src)}" alt="${kind==='avatar'?'Ảnh đại diện':'Ảnh bìa'} đã chọn">`:`<span>${kind==='avatar'?'Chưa có':'Chưa có ảnh bìa'}</span>`;
  $(`#channel-${kind}-pick`).textContent=src?'Đổi ảnh':'Chọn ảnh';$(`[data-channel-clear="${kind}"]`).hidden=!src;
}
function updateChannelCount(){const value=$('#channel-form').elements.description.value;$('#channel-description-count').textContent=value?`${value.length.toLocaleString('vi-VN')}/5.000`:'';}
async function uploadChannelImage(kind,file,revision){
  const profile=state.channelProfile,q=new URLSearchParams({channel:profile.channel,platform:state.channelEdit.id,kind,revision});
  const response=await fetch('/api/channel-image?'+q,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Workspace-Token':state.data.token},body:file});
  let data;try{data=await response.json();}catch{throw Error('Không đọc được phản hồi của trang quản lý.');}
  if(!response.ok)throw Error(data.error||'Không tải được ảnh lên.');return data;
}
async function saveChannelPlatform(event){
  event.preventDefault();const form=event.target,button=$('#submit-channel'),e=state.channelEdit,original=button.textContent;
  const values=Object.fromEntries(['platform','name','handle','url','description','notes'].map(k=>[k,form.elements[k].value]));
  if(!values.name.trim()){showChannelError('Cần nhập tên kênh.');form.elements.name.focus();return;}
  if(values.url.trim()&&!/^https?:\/\/\S+$/i.test(values.url.trim())){showChannelError('Link cần bắt đầu bằng https:// hoặc http://');form.elements.url.focus();return;}
  form.setAttribute('aria-busy','true');button.disabled=true;button.textContent='Đang lưu…';$('#channel-error').hidden=true;
  try{
    let profile=await api('/api/channel-platform',{channel:state.channelProfile.channel,revision:state.channelProfile.revision,platform:{...values,id:e.id||undefined}});
    e.id=profile.saved;state.channelProfile=profile;
    for(const kind of ['avatar','banner']){
      if(e.picked[kind]){button.textContent=kind==='avatar'?'Đang tải ảnh đại diện…':'Đang tải ảnh bìa…';profile=await uploadChannelImage(kind,e.picked[kind].file,profile.revision);}
      else if(e.cleared[kind]&&e.images[kind])profile=await api('/api/channel-image-remove',{channel:profile.channel,revision:profile.revision,id:e.id,kind});
      state.channelProfile=profile;
    }
    $('#channel-dialog').close();renderChannelProfile();toast('Đã lưu nền tảng.');
  }catch(error){showChannelError(error.message);if(/nơi khác/.test(error.message))loadChannelProfile(state.channel);}
  finally{form.removeAttribute('aria-busy');button.disabled=false;button.textContent=original;}
}
function showChannelError(message){$('#channel-error').textContent=message;$('#channel-error').hidden=false;$('#channel-error').focus();}
async function channelAction(url,body,done){
  try{state.channelProfile=await api(url,{channel:state.channelProfile.channel,revision:state.channelProfile.revision,id:state.channelEdit.id,...body});renderChannelProfile();if(done)done();}
  catch(error){showChannelError(error.message);if(/nơi khác/.test(error.message))loadChannelProfile(state.channel);}
}
$('#channel-profile').addEventListener('click',event=>{
  const target=event.target.closest('[data-channel-add],[data-channel-edit],[data-channel-more]');if(!target)return;
  if(target.hasAttribute('data-channel-more')){const open=target.getAttribute('aria-expanded')!=='true';target.previousElementSibling.classList.toggle('is-open',open);target.setAttribute('aria-expanded',String(open));target.textContent=open?'Thu gọn mô tả':'Xem cả mô tả';}
  else openChannelDialog(target.dataset.channelEdit||'');
});
$('#channel-form').addEventListener('submit',saveChannelPlatform);
$('#channel-form').addEventListener('input',event=>{if(event.target.name==='description')updateChannelCount();});
$('#channel-form').addEventListener('change',event=>{
  const kind=event.target.id==='channel-avatar-file'?'avatar':event.target.id==='channel-banner-file'?'banner':'';if(!kind)return;
  const file=event.target.files[0];event.target.value='';if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){showChannelError('Chỉ nhận ảnh JPG, PNG hoặc WebP.');return;}
  if(file.size>8*1024*1024){showChannelError('Ảnh tối đa 8 MB.');return;}
  // The page's CSP allows data: images but not blob: URLs, so the preview reads the file as a data URL.
  const reader=new FileReader();reader.onload=()=>{state.channelEdit.picked[kind]={file,dataUrl:reader.result};state.channelEdit.cleared[kind]=false;$('#channel-error').hidden=true;showChannelImage(kind);};reader.readAsDataURL(file);
});
$('#channel-form').addEventListener('click',event=>{
  const clear=event.target.closest('[data-channel-clear]'),move=event.target.closest('[data-channel-move]');
  if(clear){const kind=clear.dataset.channelClear;delete state.channelEdit.picked[kind];state.channelEdit.cleared[kind]=true;showChannelImage(kind);$(`#channel-${kind}-file`).focus();}
  if(move)channelAction('/api/channel-platform-move',{direction:move.dataset.channelMove},()=>toast(move.dataset.channelMove==='up'?'Đã đưa lên trước.':'Đã đưa xuống sau.'));
});
$('#delete-channel').addEventListener('click',()=>{
  const item=state.channelProfile.platforms.find(p=>p.id===state.channelEdit.id);if(!item)return;
  const label=state.channelProfile.platformNames[item.platform]||item.platform;
  if(!confirm(`Xóa ${label} “${item.name}” khỏi hồ sơ kênh? Bản cũ vẫn được giữ trong lịch sử sửa của thư mục kênh.`))return;
  channelAction('/api/channel-platform-delete',{},()=>{$('#channel-dialog').close();toast('Đã xóa nền tảng.');});
});
$('#close-channel').addEventListener('click',()=>$('#channel-dialog').close());$('#cancel-channel').addEventListener('click',()=>$('#channel-dialog').close());
$('#channel-dialog').addEventListener('cancel',event=>{if($('#channel-form').hasAttribute('aria-busy'))event.preventDefault();});
$('#channel-dialog').addEventListener('close',()=>{const id=state.channelEdit?.id,edit=id&&$(`#channel-profile [data-channel-edit="${CSS.escape(id)}"]`);(edit||$('#channel-profile [data-channel-add]'))?.focus({preventScroll:true});});
async function openHash(){try{const parts=location.hash.slice(1).split('/').map(decodeURIComponent);if(parts[0]==='workflow'&&parts[1]&&parts[2])await openWorkflowStage(parts[1],parts[2],false);if(parts[0]==='project'&&parts[1]){const tab=parts[2]==='duyet'?'review':parts[2]==='tien-trinh'?'progress':'docs';if(state.drawer?.id===parts[1]&&!$('#drawer').hidden)showProjectTab(tab);else await openProject(parts[1],false,tab);}if(parts[0]==='book'&&parts[1]&&parts[2])await openBook(parts[1],parts[2],false);}catch{toast('Đường dẫn hồ sơ không hợp lệ.');}}
document.addEventListener('click',async event=>{
  const target=event.target.closest('button,a[data-project],a[data-channel],a[data-series],a[data-nav],a[data-watch],a[data-route],[data-books]');if(!target||target.disabled)return;
  if(target.tagName==='A'){if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;event.preventDefault();}
  if(target.hasAttribute('data-back'))back();
  else if(target.hasAttribute('data-route')){const p=new URL(target.href).searchParams;navigate({channel:p.get('channel')||'',series:p.get('series')||'',view:p.get('view')||'projects'});}
  else if(target.dataset.watch){event.preventDefault();watch(target.dataset.id,target.dataset.watch,Number(target.dataset.number)||0);}
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
  else if(target.hasAttribute('data-workflow-toggle'))toggleWorkflow();
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
$('#drawer-content').addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(event.target.closest('#book-identity-form')){event.stopPropagation();editBook(false);}});
$('#drawer-content').addEventListener('click',event=>{if(event.target.closest('[data-edit-book]'))editBook(true);if(event.target.closest('[data-cancel-book]'))editBook(false);if(event.target.closest('#save-notes'))saveNotes();if(event.target.closest('#save-workflow'))saveWorkflowStage();});
$('#close-drawer').addEventListener('click',closeDrawer);$('#drawer-backdrop').addEventListener('click',closeDrawer);
$('#help-button').addEventListener('click',()=>$('#help-dialog').showModal());$('#close-help').addEventListener('click',()=>$('#help-dialog').close());
$('#mobile-menu').addEventListener('click',()=>setMenu(!$('#sidebar').classList.contains('open')));
$('#close-mobile-menu').addEventListener('click',()=>setMenu(false));$('#menu-backdrop').addEventListener('click',()=>setMenu(false));
$('#close-create').addEventListener('click',()=>$('#create-dialog').close());$('#cancel-create').addEventListener('click',()=>$('#create-dialog').close());
$('#create-fields').addEventListener('change',event=>{if(event.target.id==='create-series')updateCreateSeries();if(event.target.id==='create-format')updateCreateDuration();if(event.target.id==='create-import-toggle')updateCreateImport();});
$('#create-fields').addEventListener('input',event=>{if(event.target.name==='id')event.target.dataset.manuallyEdited='true';if(event.target.name==='title'){const input=$('#create-fields input[name="id"]');if(!input.dataset.manuallyEdited)input.value=fold(event.target.value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90).replace(/-$/,'');}});
$('#create-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('#submit-create'),form=event.target,video=state.createMode==='project'&&$('#create-import-toggle')?.checked?$('#create-video-file')?.files[0]:null,original=button.textContent;button.disabled=true;$('#close-create').disabled=true;$('#cancel-create').disabled=true;form.setAttribute('aria-busy','true');$('#create-error').hidden=true;
  try{if(video&&video.size>8*1024*1024*1024)throw Error('Video tối đa 8 GB');const data=new FormData(form),body=Object.fromEntries([...data].filter(([key])=>key!=='projectVideo'));
    let result;if(video){button.textContent='Đang import video…';const q=new URLSearchParams({...body,name:video.name}),response=await fetch('/api/projects/import?'+q,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Workspace-Token':state.data.token},body:video});try{result=await response.json();}catch{throw Error('Không đọc được phản hồi của trang quản lý.');}if(!response.ok)throw Error(result.error||'Không thể import video.');}
    else result=await api(state.createMode==='book'?'/api/books':'/api/projects',body);
    $('#create-dialog').close();await refresh();if(state.createMode==='book'){toast('Đã tạo hồ sơ sách.');openBook(result.series,result.id);}else{toast(video?'Đã tạo dự án và import video khách hàng.':'Đã tạo hồ sơ dự án.');openProject(result.id);}
  }catch(error){$('#create-error').textContent=error.message;$('#create-error').hidden=false;$('#create-error').focus();}finally{button.disabled=false;button.textContent=original;$('#close-create').disabled=false;$('#cancel-create').disabled=false;form.removeAttribute('aria-busy');}});
$('#create-dialog').addEventListener('cancel',event=>{if($('#create-form').hasAttribute('aria-busy'))event.preventDefault();});
document.addEventListener('keydown',event=>{
  const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
  if(event.key==='/'&&!typing&&!$('#create-dialog').open&&!$('#help-dialog').open&&!$('#media-dialog').open&&!$('#delete-dialog').open&&!$('#review-dialog').open&&!$('#channel-dialog').open){event.preventDefault();(resourceViews[state.view]?$('#resource-search'):$('#search'))?.focus();}
  if(event.key==='Escape'&&!$('#create-dialog').open&&!$('#help-dialog').open&&!$('#media-dialog').open&&!$('#delete-dialog').open&&!$('#review-dialog').open&&!$('#channel-dialog').open){if(!$('#drawer').hidden)closeDrawer();setMenu(false);}
  if(event.key==='Tab'&&!$('#drawer').hidden&&!$('#drawer').classList.contains('detail-page')&&!$('#create-dialog').open&&!$('#help-dialog').open&&!$('#media-dialog').open&&!$('#delete-dialog').open&&!$('#review-dialog').open&&!$('#channel-dialog').open){const nodes=[...$('#drawer').querySelectorAll('button,a,textarea,select,input')].filter(n=>!n.disabled&&n.offsetParent!==null);const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
window.addEventListener('beforeunload',event=>{if(dirtyNotes()){event.preventDefault();event.returnValue='';}});
window.addEventListener('focus',()=>{if(state.data)refresh();});
document.querySelectorAll('[data-icon]').forEach(node=>node.innerHTML=icon(node.dataset.icon));
$('#status-filter').value=state.status;$('#sort-filter').value=state.sort;
$('#grid-view').classList.toggle('active',state.layout==='grid');$('#list-view').classList.toggle('active',state.layout==='list');
window.addEventListener('popstate',restoreRoute);
refresh(true);
// Live updates (tools/project-manager/live.cjs): the server says which projects changed; the page re-fetches only
// what is on screen. An open review dialog is left alone and caught up when it closes; the notes box is never touched.
function liveUpdate(event){
  const ids=new Set(event.projects||[]),open=state.drawer&&!state.drawer.book&&!$('#drawer').hidden?state.drawer.id:null;
  if(event.catalog||ids.size)refresh();
  if(!open||!ids.has(open))return;
  if($('#review-dialog').open)state.liveMissed=true;else loadGates(open);
  loadProgress(open,true);
  if(state.documentKey&&$('#document-view'))openDocument(state.documentKey,true);
}
if(window.EventSource){
  let dropped=false;const events=new EventSource('/api/events');
  events.onmessage=message=>{try{liveUpdate(JSON.parse(message.data));}catch{}};
  // After a lost connection (server restart, sleep) catch up on everything that may have changed meanwhile.
  events.onerror=()=>{dropped=true;$('#connection').classList.add('offline');$('#connection').lastChild.textContent='Mất kết nối, đang thử lại…';};
  events.onopen=()=>{if(dropped){dropped=false;refresh();if(state.drawer&&!state.drawer.book&&!$('#drawer').hidden)liveUpdate({projects:[state.drawer.id]});}};
}

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
async function watch(id,kind,number=0){
  const p=state.data.projects.find(p=>p.id===id);if(!p)return;
  // A project with several videos or thumbnails (three shorts and their covers) always opens the dialog with one numbered,
  // named button each: exported ones show here, the others open the right composition in Studio.
  const list=(kind==='video'?p.videos:p.thumbnails)||[],many=!p.importedVideo&&list.length>1;
  selectedMedia={id,kind,composition:kind==='video'?p.videoId:p.thumbnailId};
  if(!many&&!(kind==='video'?p.renderedVideo:p.renderedThumbnail))return launchStudio(id,selectedMedia.composition);
  $('#media-folder').textContent=kind==='video'?'Mở thư mục video':'Mở thư mục thumbnail';
  const exportedNote=p.importedVideo?'Video khách hàng đã import vào workspace; file gốc bên ngoài không bị thay đổi.':'Bản đã xuất trên máy; các chỉnh sửa mới trong Studio có thể chưa có trong bản này.';
  $('#media-title').textContent=p.title;$('#media-status').textContent=exportedNote;$('#media-studio').hidden=!selectedMedia.composition;
  // Formats Chrome cannot play inline (AVI, WMV, MPG, TS…): say so and offer the folder instead of a broken player.
  if(kind==='video'&&p.importedVideo&&!p.videoInline){const note=document.createElement('div');note.className='media-unplayable';note.append(Object.assign(document.createElement('p'),{textContent:`Trình duyệt không phát trực tiếp được định dạng ${(p.videoFile||'').split('.').pop().toUpperCase()}. Video đã được lưu trong thư mục của dự án.`}),Object.assign(document.createElement('button'),{className:'button secondary',textContent:'Mở thư mục video',onclick:()=>api('/api/open-folder',{id,group:'assets'}).catch(e=>toast(e.message))}));
    $('#media-title').textContent=p.title;$('#media-status').textContent='Video khách hàng đã import vào workspace; file gốc bên ngoài không bị thay đổi.';$('#media-studio').hidden=true;$('#media-content').replaceChildren(note);$('#media-dialog').showModal();return;}
  if(kind==='video'&&p.importedVideo&&!(await preparePlayback(id)))return;
  let pick=many?(list.find(v=>v.number===number)||list.find(v=>v.name)||list[0]):null;
  const noun=kind==='video'?'Video':'Ảnh bìa';
  const show=()=>{
    if(pick){selectedMedia.composition=pick.composition;$('#media-studio').hidden=false;}
    $('#media-folder').hidden=Boolean(pick&&!pick.name);
    $('#media-content').classList.toggle('is-empty',Boolean(pick&&!pick.name));
    if(pick&&!pick.name){
      // Not exported yet (user 2026-11-09: the dark box with a floating note looked broken): a light 16:9 frame that says
      // where the work is watched (Studio) and carries the one action; the footer Studio button is hidden meanwhile.
      const note=document.createElement('div');note.className='media-pending';
      const frame=document.createElement('div');frame.className='media-pending-frame';frame.setAttribute('aria-hidden','true');
      frame.append(Object.assign(document.createElement('span'),{className:'media-pending-play'}));
      const text=document.createElement('div');text.className='media-pending-text';
      text.append(Object.assign(document.createElement('strong'),{textContent:'Chưa có bản xuất'}),
        Object.assign(document.createElement('p'),{textContent:`${pick.title} đang được dựng: xem trực tiếp trong Studio. Khi video xong và bạn xuất, bản xuất sẽ phát ngay tại đây.`}),
        Object.assign(document.createElement('button'),{type:'button',className:'button studio-button',textContent:'Mở trong Studio',onclick:()=>launchStudio(id,pick.composition)}));
      note.append(frame,text);
      $('#media-studio').hidden=true;$('#media-status').textContent='';$('#media-content').replaceChildren(note);return;
    }
    const media=document.createElement(kind==='video'?'video':'img');
    media.src=`/api/media?id=${encodeURIComponent(id)}&kind=${kind}${pick?'&file='+encodeURIComponent(pick.name):''}`;
    if(kind==='video'){media.controls=true;media.playsInline=true;media.preload='metadata';if(p.renderedThumbnail&&!many)media.poster=`/api/media?id=${encodeURIComponent(id)}&kind=thumbnail`;}else media.alt='Thumbnail đã xuất — '+(pick?pick.title:p.title);
    media.addEventListener('error',()=>$('#media-status').textContent=selectedMedia.composition?'Không đọc được bản xuất. Bạn có thể mở Studio bằng nút bên dưới.':'Trình duyệt không phát được video này (có thể do codec, ví dụ MOV ProRes). Video vẫn được lưu trong thư mục của dự án.');
    $('#media-status').textContent=exportedNote;$('#media-content').replaceChildren(media);
  };
  const bar=$('#media-switch');bar.hidden=!many;bar.replaceChildren();
  if(many){
    bar.setAttribute('aria-label',kind==='video'?'Chọn video của dự án':'Chọn ảnh bìa của dự án');
    for(const v of list){
      const button=Object.assign(document.createElement('button'),{type:'button',className:'media-switch-item'+(v.name?'':' not-exported'),title:v.name||'Chưa xuất'});
      button.setAttribute('aria-pressed',String(v===pick));button.setAttribute('aria-label',`${noun} ${v.number}/${list.length} · ${v.title}${v.name?'':' · chưa xuất'}`);
      button.append(Object.assign(document.createElement('span'),{className:'media-switch-number',textContent:String(v.number)}),Object.assign(document.createElement('span'),{className:'media-switch-title',textContent:v.title}));
      if(!v.name)button.append(Object.assign(document.createElement('span'),{className:'media-switch-state',textContent:'Chưa xuất'}));
      button.onclick=()=>{if(v===pick)return;$('#media-content video')?.pause();pick=v;show();bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};
      bar.append(button);
    }
  }
  show();if(!$('#media-dialog').open)$('#media-dialog').showModal();
}
async function preparePlayback(id){
  // HEVC/ProRes imports get a one-time H.264 copy on the server; the imported file stays untouched.
  for(let shown=false;;){
    let state;try{state=await (await fetch(`/api/playback?id=${encodeURIComponent(id)}`)).json();}catch{state={failed:true};}
    if(state.ready)return true;
    if(!shown){$('#media-content').replaceChildren(Object.assign(document.createElement('p'),{className:'media-preparing'}));$('#media-dialog').showModal();shown=true;}
    const note=$('#media-content .media-preparing');if(!note||!$('#media-dialog').open)return false;
    if(state.failed||state.error){note.textContent='Không tạo được bản xem cho video này. File gốc vẫn nằm trong thư mục dự án.';return false;}
    note.textContent=`Trình duyệt không phát được codec ${(state.codec||'này').toUpperCase()} của video gốc. Đang tạo bản xem H.264 (chỉ làm một lần, file gốc giữ nguyên)…`;
    await new Promise(resolve=>setTimeout(resolve,2000));
  }
}
$('#close-media').onclick=()=>$('#media-dialog').close();
$('#media-dialog').addEventListener('close',()=>{$('#media-content').replaceChildren();$('#media-switch').replaceChildren();$('#media-switch').hidden=true;});
$('#media-studio').onclick=()=>launchStudio(selectedMedia.id,selectedMedia.composition);
$('#media-folder').onclick=()=>api('/api/open-folder',{id:selectedMedia.id,group:selectedMedia.kind}).catch(error=>toast(error.message));
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
// The flow chart can fold to one summary line; the choice is a per-browser convenience.
function workflowOpen(){try{return localStorage.getItem('pm.workflowOpen')==='1';}catch{return false;}}
function toggleWorkflow(){const open=!workflowOpen();try{localStorage.setItem('pm.workflowOpen',open?'1':'0');}catch{}renderWorkflow();$('#workflow-toggle')?.focus();}
// Column of each stage = longest dependency chain before it, so parallel steps stack in one column.
function workflowLevels(stages){const byId=Object.fromEntries(stages.map(s=>[s.id,s])),level={};const of=id=>level[id]??=byId[id].dependencies.reduce((m,d)=>Math.max(m,of(d)+1),0);stages.forEach(s=>of(s.id));return level;}
function renderWorkflow(){
  const box=$('#workflow'),show=Boolean(state.series)&&state.view==='projects';box.hidden=!show;if(!show)return;
  const flow=state.workflow;
  if(!flow||flow.series!==state.series||state.workflowStale){loadWorkflow(state.series);if(!flow||flow.series!==state.series){box.innerHTML='<p class="workflow-empty">Đang đọc quy trình của series…</p>';return;}}
  if(flow.error){box.innerHTML=`<p class="workflow-empty">Không đọc được quy trình: ${esc(flow.error)}</p>`;return;}
  const general=stepCount(flow.general),byId=Object.fromEntries(flow.stages.map(s=>[s.id,s])),open=workflowOpen()&&flow.stages.length>0;
  const total=flow.stages.reduce((n,s)=>n+stepCount(s.config),0);
  const summary=flow.stages.length?`${flow.profileTitle?esc(flow.profileTitle)+' · ':''}${flow.stages.length} bước${total?` · ${total} quy tắc/ghi chú theo bước`:''}`:'Chưa có quy trình được duyệt';
  const toggle=flow.stages.length?`<button class="button secondary" id="workflow-toggle" data-workflow-toggle aria-expanded="${open}" aria-controls="workflow-chart">${open?'Ẩn sơ đồ':'Hiện sơ đồ'}</button>`:'';
  const heading=`<div class="workflow-heading"><div><h2 id="workflow-title">Quy trình sản xuất</h2><p>${summary}</p></div><div class="workflow-actions">${toggle}<button class="button secondary" data-workflow-stage="general">Quy tắc chung${general?` <span class="workflow-count">${general}</span>`:''}</button></div></div>`;
  if(!flow.stages.length){box.innerHTML=heading+'<p class="workflow-empty">Series này chưa có quy trình sản xuất được duyệt. Bạn vẫn có thể ghi quy tắc chung cho series.</p>';return;}
  if(!open){box.innerHTML=heading+`<ol class="workflow-strip" aria-label="Các giai đoạn">${flow.phases.map(p=>`<li>${esc(p.title)} <span>${p.stages.length}</span></li>`).join('')}</ol>`;return;}
  const level=workflowLevels(flow.stages),first=Math.min(...Object.values(level)),last=Math.max(...Object.values(level));
  const node=s=>{
    const deps=s.dependencies.map(d=>byId[d].number),parallel=flow.stages.filter(o=>o.id!==s.id&&o.dependencies.join()===s.dependencies.join()).map(o=>o.number);
    const count=stepCount(s.config),order=deps.length?`Sau bước ${deps.join(', ')}${parallel.length?`, song song với bước ${parallel.join(', ')}`:''}`:'Bước đầu tiên';
    return `<li><button class="workflow-step mode-${esc(s.automation.mode)}" data-workflow-stage="${esc(s.id)}" title="${esc(stepModes[s.automation.mode])} · ${order}" aria-label="Bước ${s.number}: ${esc(s.title)}, ${esc(stepModes[s.automation.mode])}. ${order}${count?`. ${count} quy tắc hoặc ghi chú`:''}"><span class="step-number">${s.number}</span><strong>${esc(s.title)}</strong>${count?`<span class="step-notes" title="Quy tắc và ghi chú đã thêm">${count}</span>`:''}</button></li>`;
  };
  const columnCount=p=>new Set(p.stages.map(id=>level[id])).size;
  const columns=p=>{const groups=[];for(const s of p.stages.map(id=>byId[id]).sort((a,b)=>a.number-b.number)){const g=groups.find(g=>g.level===level[s.id]);if(g)g.stages.push(s);else groups.push({level:level[s.id],stages:[s]});}
    return groups.sort((a,b)=>a.level-b.level).map(g=>`<ol class="flow-column${g.level===first?' flow-start':''}${g.level===last?' flow-end':''}${g.stages.length>1?' flow-fork':''}">${g.stages.map(node).join('')}</ol>`).join('');};
  const legend=[...new Set(flow.stages.map(s=>s.automation.mode))].map(m=>`<li class="mode-${esc(m)}">${esc(stepModes[m])}</li>`).join('');
  box.innerHTML=heading+`<div class="workflow-chart" id="workflow-chart"><ul class="workflow-legend" aria-label="Chú thích">${legend}<li class="legend-hint">Bấm một bước để xem việc cần làm và thêm quy tắc, ghi chú cho agent.</li></ul><div class="workflow-flow">${flow.phases.map(p=>`<section class="workflow-phase" data-cols="${columnCount(p)}" aria-label="${esc(p.title)}"><h3>${esc(p.title)}</h3><div class="flow-columns">${columns(p)}</div></section>`).join('')}</div></div>`;
  // The CSP forbids style attributes in markup; CSSOM sets each phase's column count.
  box.querySelectorAll('.workflow-phase').forEach(el=>el.style.setProperty('--cols',el.dataset.cols));
  linkWorkflowRows();
}
// Phases wrap onto new rows; a drawn link turns down from the end of one row into the start of the next.
const workflowResize=new ResizeObserver(()=>requestAnimationFrame(linkWorkflowRows));
function linkWorkflowRows(){
  const flowBox=$('#workflow .workflow-flow');if(!flowBox)return;workflowResize.observe(flowBox);
  flowBox.querySelector('.flow-wrap')?.remove();flowBox.querySelectorAll('.row-start,.row-end').forEach(e=>e.classList.remove('row-start','row-end'));
  if(getComputedStyle(flowBox).display!=='flex')return;
  const phases=[...flowBox.querySelectorAll('.workflow-phase')],base=flowBox.getBoundingClientRect(),paths=[];
  const rel=el=>{const r=el.getBoundingClientRect();return {l:r.left-base.left+flowBox.scrollLeft,r:r.right-base.left+flowBox.scrollLeft,t:r.top-base.top,b:r.bottom-base.top,m:(r.top+r.bottom)/2-base.top};};
  for(let i=1;i<phases.length;i++){
    const prev=phases[i-1],next=phases[i];if(next.offsetTop<=prev.offsetTop)continue;
    prev.classList.add('row-end');next.classList.add('row-start');
    const from=rel([...prev.querySelectorAll('.flow-column')].pop()),to=rel(next.querySelector('.flow-column')),gap=rel(next).t-6;
    paths.push(`M${from.r} ${from.m}H${from.r+8}V${gap}H${to.l-8}V${to.m}H${to.l}`);
  }
  if(!paths.length)return;
  flowBox.insertAdjacentHTML('beforeend',`<svg class="flow-wrap" width="${flowBox.scrollWidth}" height="${flowBox.scrollHeight}" aria-hidden="true">${paths.map(d=>`<path d="${d}"/>`).join('')}</svg>`);
}
async function openWorkflowStage(series,key,record=true){
  if(!canLeaveNotes())return;
  const flow=state.workflow?.series===series&&!state.workflow.error?state.workflow:await loadWorkflow(series);if(!flow)return toast('Không đọc được quy trình của series.');
  const stage=key==='general'?null:flow.stages.find(s=>s.id===key);if(key!=='general'&&!stage)return toast('Không tìm thấy bước này.');
  const config=stage?stage.config:flow.general,title=stage?stage.title:'Quy tắc chung';
  state.drawer={workflow:true,id:key,series,title:'Quy trình: '+title,revision:flow.revision,rulesText:config.rules.join('\n'),notes:config.notes,file:flow.file,general:!stage,editing:false};state.documentRequest++;
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
<section class="drawer-section workflow-form" id="workflow-own"></section>`;
  renderWorkflowRules();
  showDrawer();
}
// The user's own rules read as a numbered list; editing gives each rule its own growing field.
function renderWorkflowRules(focus){
  const d=state.drawer,box=$('#workflow-own');if(!d?.workflow||!box)return;
  const rules=d.rulesText?d.rulesText.split('\n'):[],scope=d.general?'mọi bước của series':'bước này';
  const heading=`<h3>${d.general?'Quy tắc chung của bạn':'Quy tắc và ghi chú của bạn'}</h3>`;
  if(!d.editing){
    box.innerHTML=heading+(rules.length||d.notes?`${rules.length?`<p class="workflow-label">Quy tắc bổ sung</p><ol class="rule-list">${rules.map(r=>`<li>${esc(r)}</li>`).join('')}</ol>`:''}${d.notes?`<p class="workflow-label">Ghi chú cho agent</p><p class="rule-notes">${esc(d.notes)}</p>`:''}`
      :`<p class="workflow-aside">Chưa có quy tắc hay ghi chú riêng cho ${scope}.</p>`)
      +`<div class="notes-footer"><small id="workflow-status">Lưu trong <code>${esc(d.file)}</code>.</small><button class="button secondary" id="edit-workflow" data-edit-workflow>${rules.length||d.notes?'Sửa quy tắc và ghi chú':'Thêm quy tắc hoặc ghi chú'}</button></div>`;
    if(focus)$('#edit-workflow').focus();return;
  }
  box.innerHTML=heading+`<p class="workflow-label" id="rules-label">Quy tắc bổ sung</p><p class="workflow-aside rules-hint">Mỗi ô một quy tắc agent phải theo ở ${scope}. Enter để thêm ô mới.</p>
<ol class="rule-editor" id="workflow-rules" aria-labelledby="rules-label"></ol><button class="button quiet add-rule" data-add-rule>+ Thêm quy tắc</button>
<label class="field"><span>Ghi chú cho agent</span><textarea id="workflow-notes" class="notes-input workflow-input" rows="4" maxlength="10000" placeholder="Bối cảnh, ví dụ nên theo, điều cần tránh…">${esc(d.notes)}</textarea></label>
<div class="notes-footer"><small id="workflow-status">Lưu vào <code>${esc(d.file)}</code>. Không mở khóa render, đăng tải hay sinh nội dung trả phí.</small><div class="workflow-actions"><button class="button secondary" data-cancel-workflow>Hủy</button><button class="button primary" id="save-workflow">Lưu</button></div></div>`;
  (rules.length?rules:['']).forEach(r=>addRuleField(r));
  if(focus)$('#workflow-rules .rule-input')?.focus();
}
function addRuleField(text='',after=null){
  const li=document.createElement('li');
  li.innerHTML=`<textarea class="rule-input" rows="1" maxlength="500" aria-label="Quy tắc" placeholder="Ví dụ: Mở đầu bằng một tình huống cụ thể">${esc(text)}</textarea><button class="button quiet rule-remove" data-remove-rule aria-label="Xóa quy tắc này">Xóa</button>`;
  const list=$('#workflow-rules');after?after.after(li):list.append(li);requestAnimationFrame(()=>growRule(li.firstChild));return li.firstChild;
}
function growRule(el){el.style.height='auto';el.style.height=el.scrollHeight+2+'px';}
function workflowRules(){return [...document.querySelectorAll('#workflow-rules .rule-input')].flatMap(el=>el.value.split('\n')).map(r=>r.trim()).filter(Boolean);}
function editWorkflow(on){const d=state.drawer;if(!d?.workflow)return;if(!on&&dirtyNotes()&&!confirm('Bỏ các thay đổi chưa lưu?'))return;d.editing=on;renderWorkflowRules(true);}
async function saveWorkflowStage(){
  const drawer=state.drawer;if(!drawer?.workflow)return;const button=$('#save-workflow'),rules=workflowRules(),notes=$('#workflow-notes').value;button.disabled=true;
  try{
    const result=await api('/api/workflow',{series:drawer.series,stage:drawer.id,rules,notes,revision:drawer.revision});
    if(state.drawer===drawer){Object.assign(drawer,{revision:result.revision,rulesText:rules.join('\n'),notes:notes.replace(/\s+$/,''),editing:false});renderWorkflowRules(true);$('#workflow-status').textContent='Đã lưu · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});}
    toast('Đã lưu quy tắc và ghi chú.');if(state.series===drawer.series)await loadWorkflow(drawer.series);
  }catch(error){toast(error.message);}finally{button.disabled=false;}
}
$('#drawer-content').addEventListener('click',event=>{
  const t=event.target.closest('button');if(!t)return;
  if(t.hasAttribute('data-edit-workflow'))editWorkflow(true);
  else if(t.hasAttribute('data-cancel-workflow'))editWorkflow(false);
  else if(t.hasAttribute('data-add-rule'))addRuleField().focus();
  else if(t.hasAttribute('data-remove-rule')){const li=t.closest('li'),next=li.nextElementSibling||li.previousElementSibling;li.remove();if(!$('#workflow-rules li'))addRuleField();(next?.querySelector('.rule-input')||$('#workflow-rules .rule-input')).focus();}
});
$('#drawer-content').addEventListener('input',event=>{if(event.target.classList?.contains('rule-input'))growRule(event.target);});
$('#drawer-content').addEventListener('keydown',event=>{
  const el=event.target;if(!el.classList?.contains('rule-input'))return;
  if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();addRuleField('',el.closest('li')).focus();}
  else if(event.key==='Backspace'&&!el.value&&$('#workflow-rules').children.length>1){event.preventDefault();const prev=el.closest('li').previousElementSibling||el.closest('li').nextElementSibling;el.closest('li').remove();const p=prev.querySelector('.rule-input');p.focus();p.setSelectionRange(p.value.length,p.value.length);}
});

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

// System map (Bản đồ hệ thống): workflow, architecture and repo catalog from /api/system. Read-only view.
const sysTabs={flow:'Quy trình sản xuất',layers:'Kiến trúc',repos:'Danh mục repo'};
const sysKinds={'draft-task':['Agent soạn nháp','agent'],'operator-task':['Chạy công cụ','tool'],check:['Kiểm tra','check'],'human-approval':['Bạn duyệt','gate']};
Object.assign(state,{sysTab:sysTabs[params.get('sys')]?params.get('sys'):'flow',sysRepo:params.get('repo')||'',sysStatus:'',sysQuery:'',sysStage:'',sysNode:''});
function sysUrl(){const u=new URL(location.href);u.searchParams.set('sys',state.sysTab);if(state.sysTab==='repos'&&state.sysRepo)u.searchParams.set('repo',state.sysRepo);else u.searchParams.delete('repo');history.replaceState(history.state,'',u);}
const sysPill=(m,status)=>`<span class="sys-pill sys-${esc(status)}">${esc(m.statuses[status]?.title||status)}</span>`;
const sysRepoChip=(m,r)=>`<button type="button" class="sys-chip sys-${esc(r.status)}" data-sys-repo="${esc(r.id)}" title="${esc(m.statuses[r.status]?.title||'')}">${esc(r.title)}</button>`;
function sysUsage(r){
  const f=r.facts;
  if(r.status==='skill'){const n=f.skills.filter(s=>s.present).length;return n?`${n} skill trong skills/`:'Tài liệu tham chiếu';}
  if(f.binary&&!f.binary.present)return f.usedBy.length?'Có lệnh gọi, chưa cài trên máy':'Chưa cài trên máy';
  if(f.usedBy.length)return `${f.usedBy.length} file dùng`;
  if(f.python?.version)return `${f.python.env} · ${f.python.version}`;
  if(r.packages?.length)return 'Đã cài, chưa file nào dùng';
  return f.cloned?'Chỉ có bản clone':'Chưa clone';
}
// ---- System map diagrams: plain buttons laid out by the page, connectors drawn in SVG with attributes only
// (user 2026-11-09: Mermaid rendered black boxes in their browser; "tự thiết kế bằng giao diện… theo phong cách
// diagram"). Nodes are real buttons, so keyboard, focus and selection work without any library.
const stageKind=s=>(sysKinds[s.kind]||[0,'tool'])[1];
// Rank of a stage = longest dependency chain before it; each rank is one row of the flow.
function stageRows(m){
  const rank={},get=id=>{if(rank[id]!==undefined)return rank[id];const s=m.stages.find(x=>x.id===id);rank[id]=0;
    rank[id]=Math.max(0,...(s?.dependencies||[]).filter(d=>m.stages.some(x=>x.id===d)).map(d=>get(d)+1));return rank[id];};
  m.stages.forEach(s=>get(s.id));const rows=[];m.stages.forEach(s=>(rows[rank[s.id]]||=[]).push(s));return rows.filter(Boolean);
}
function sysFlowHtml(m){
  return `<div class="dg dg-flow" id="sys-diagram" role="group" aria-label="Sơ đồ quy trình sản xuất"><svg class="dg-edges" aria-hidden="true" focusable="false"></svg>${stageRows(m).map(row=>`<div class="dg-row">${row.map(s=>`<button type="button" class="dg-node k-${stageKind(s)}" data-dg-stage="${esc(s.id)}" aria-pressed="${s.id===state.sysStage}" title="${esc((sysKinds[s.kind]||[s.kind])[0])}">${stageKind(s)==='gate'?'<span class="dg-gate-mark" aria-hidden="true"></span>':''}<span>${esc(s.title)}</span></button>`).join('')}</div>`).join('')}</div>`;
}
function sysArchNodes(m){
  const out=[],repo=id=>m.repos.find(r=>r.id===id);
  out.push({key:'u',layer:'user',label:'Bạn duyệt và xuất',cls:'me'});
  for(const c of m.components)out.push({key:'c:'+c.id,layer:c.layer,label:c.title,cls:'tool',component:c});
  for(const e of m.environments)out.push({key:'e:'+e.id,layer:'runtime',label:e.title,cls:'env',env:e});
  const engine=new Set(m.components.filter(c=>c.layer==='engine').flatMap(c=>c.repos));
  for(const id of engine)if(repo(id))out.push({key:'r:'+id,layer:'engine',label:repo(id).title,cls:'repo',repo:id});
  for(const r of m.repos.filter(r=>r.status==='skill'))out.push({key:'r:'+r.id,layer:'knowledge',label:r.title,cls:'skill',repo:r.id});
  return out;
}
function sysArchHtml(m){
  const nodes=sysArchNodes(m);
  const node=n=>n.repo?`<button type="button" class="dg-node k-${n.cls==='skill'?'skill':'repo'}" data-sys-repo="${esc(n.repo)}" title="Mở trong danh mục repo"><span>${esc(n.label)}</span><span class="dg-go" aria-hidden="true">→</span></button>`
    :`<button type="button" class="dg-node k-${n.cls}" data-dg-node="${esc(n.key)}" aria-pressed="${n.key===state.sysNode}"><span>${esc(n.label)}</span></button>`;
  return `<div class="dg dg-layers" id="sys-diagram" role="group" aria-label="Sơ đồ kiến trúc">${m.layers.filter(l=>nodes.some(n=>n.layer===l.id)).map(l=>`<section class="dg-layer${l.id==='knowledge'?' is-aside':''}"><h3>${esc(l.title)}</h3><div class="dg-row is-wrap">${nodes.filter(n=>n.layer===l.id).map(node).join('')}</div></section>`).join('')}</div>`;
}
// Connectors of the flow: from the bottom of each dependency to the top of the stage, redrawn when the size changes.
function drawFlowEdges(){
  const box=$('#sys-diagram.dg-flow'),svg=box?.querySelector('.dg-edges');if(!svg||!state.system)return;
  const base=box.getBoundingClientRect(),pos=id=>{const r=box.querySelector(`[data-dg-stage="${CSS.escape(id)}"]`)?.getBoundingClientRect();return r&&{x:r.left-base.left+r.width/2,top:r.top-base.top,bottom:r.bottom-base.top};};
  svg.setAttribute('width',box.scrollWidth);svg.setAttribute('height',box.scrollHeight);svg.setAttribute('viewBox',`0 0 ${box.scrollWidth} ${box.scrollHeight}`);
  const ns='http://www.w3.org/2000/svg',parts=[];
  for(const s of state.system.stages)for(const d of s.dependencies||[]){const a=pos(d),b=pos(s.id);if(!a||!b)continue;
    const y1=a.bottom+2,y2=b.top-7,mid=(y1+y2)/2,on=s.id===state.sysStage||d===state.sysStage;
    const path=document.createElementNS(ns,'path');path.setAttribute('d',`M${a.x} ${y1} C${a.x} ${mid} ${b.x} ${mid} ${b.x} ${y2}`);
    path.setAttribute('fill','none');path.setAttribute('stroke',on?'#b79554':'#a9bcae');path.setAttribute('stroke-width',on?'2.4':'1.6');
    const head=document.createElementNS(ns,'path');head.setAttribute('d',`M${b.x-5} ${y2} L${b.x+5} ${y2} L${b.x} ${y2+6} Z`);head.setAttribute('fill',on?'#b79554':'#a9bcae');head.setAttribute('stroke','none');
    parts.push(on?[1,path,head]:[0,path,head]);}
  parts.sort((x,y)=>x[0]-y[0]);svg.replaceChildren(...parts.flatMap(p=>[p[1],p[2]]));
}
let edgeObserver=null;
function watchFlowEdges(){
  edgeObserver?.disconnect();const box=$('#sys-diagram.dg-flow');if(!box)return;
  edgeObserver=new ResizeObserver(()=>drawFlowEdges());edgeObserver.observe(box);document.fonts?.ready.then(drawFlowEdges);drawFlowEdges();
}
function sysSelect({stage,node}){
  if(stage)state.sysStage=stage;else state.sysNode=node;
  const side=$('#sys-side');if(side)side.innerHTML=stage?sysStagePanel(state.system,stage):sysNodePanel(state.system,node);
  document.querySelectorAll('#sys-diagram [data-dg-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dgStage===state.sysStage)));
  document.querySelectorAll('#sys-diagram [data-dg-node]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dgNode===state.sysNode)));
  if(stage)drawFlowEdges();side?.scrollIntoView({block:'nearest'});
}
function sysOpenRepo(id){state.sysRepo=id;state.sysQuery='';if(state.system&&!state.system.repos.some(r=>r.id===id&&(!state.sysStatus||r.status===state.sysStatus)))state.sysStatus='';sysSetTab('repos');$('#sys-detail')?.scrollIntoView({block:'start'});$('#sys-detail')?.focus({preventScroll:true});}
const sysRepoList=(m,ids)=>{const list=ids.map(id=>m.repos.find(r=>r.id===id)).filter(Boolean);return list.length?`<h4>Repo bên ngoài</h4><div class="sys-uses">${list.map(r=>sysRepoChip(m,r)).join('')}</div>`:'';};
function sysStagePanel(m,id){
  const s=m.stages.find(x=>x.id===id);if(!s)return '<p class="sys-empty">Chọn một bước trên sơ đồ.</p>';
  const [kindTitle,kindClass]=sysKinds[s.kind]||[s.kind,'tool'],comps=m.components.filter(c=>c.stages.includes(s.id));
  const deps=(s.dependencies||[]).map(d=>m.stages.find(x=>x.id===d)?.title).filter(Boolean);
  return `<p class="sys-side-kind"><span class="sys-mark ${kindClass}" aria-hidden="true"></span>${esc(kindTitle)}</p><h3>${esc(s.title)}</h3><p>${esc(s.guide)}</p>${deps.length?`<p class="sys-note">Sau: ${esc(deps.join(', '))}</p>`:''}
${comps.length?`<h4>Công cụ trong repo</h4><ul class="sys-comp-list">${comps.map(c=>`<li><strong>${esc(c.title)}</strong><code>${esc(c.command)}</code></li>`).join('')}</ul>`:''}${sysRepoList(m,m.repos.filter(r=>r.stages.includes(s.id)).map(r=>r.id))}`;
}
function sysNodePanel(m,key){
  const n=sysArchNodes(m).find(x=>x.key===key);if(!n)return '<p class="sys-empty">Chọn một khối trên sơ đồ.</p>';
  const layer=m.layers.find(l=>l.id===n.layer);
  if(n.key==='u'){const gates=m.stages.filter(s=>s.kind==='human-approval');return `<p class="sys-side-kind">${esc(layer?.title||'')}</p><h3>Việc chỉ bạn làm</h3><p>${esc(layer?.summary||'')}</p><ul class="sys-comp-list">${gates.map(g=>`<li><strong>${esc(g.title)}</strong></li>`).join('')}<li><strong>Nghe duyệt giọng, render và đăng tải</strong></li></ul>`;}
  if(n.component){const c=n.component;return `<p class="sys-side-kind">${esc(layer?.title||'')}</p><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><dl class="sys-facts"><dt>Lệnh</dt><dd><code>${esc(c.command)}</code></dd><dt>Thư mục</dt><dd><code>${esc(c.path)}</code></dd></dl>${c.stages.length?`<h4>Tham gia các bước</h4><div class="sys-uses">${c.stages.map(id=>`<button type="button" class="sys-tool sys-stage-link" data-sys-stage="${esc(id)}">${esc(m.stages.find(s=>s.id===id)?.title||id)}</button>`).join('')}</div>`:''}${sysRepoList(m,c.repos)}`;}
  const e=n.env;return `<p class="sys-side-kind">${esc(layer?.title||'')}</p><h3>${esc(e.title)} <span class="sys-present ${e.present?'yes':'no'}">${e.present?'Có trên máy':'Chưa có'}</span></h3><p>${esc(e.summary)}</p><dl class="sys-facts"><dt>Thư mục</dt><dd><code>${esc(e.path)}</code></dd></dl>${sysRepoList(m,e.repos)}`;
}
async function renderSystem(){
  const box=$('#resource-view');
  if(!state.system||state.resourceStale){
    if(!state.system)box.innerHTML='<p class="workflow-empty">Đang đo hệ thống…</p>';
    try{state.system=await api('/api/system');state.resourceStale=false;}
    catch(error){if(state.view==='system')box.innerHTML=`<p class="workflow-empty">Không đọc được bản đồ hệ thống: ${esc(error.message)}</p>`;return;}
    if(state.view!=='system')return;
  }
  const m=state.system,key='system'+state.sysTab+JSON.stringify(m);
  if(state.resourceKey!==key||!box.querySelector('#sys-body')){
    state.resourceKey=key;
    const warn=m.warnings.length?`<div class="sys-warnings" role="status"><strong>${m.warnings.length} điểm bản đồ lệch với thực tế</strong><ul>${m.warnings.map(w=>`<li>${w.repo?`<button type="button" class="link-button" data-sys-repo="${esc(w.repo)}">${esc(w.title)}</button>`:esc(w.title)}: ${esc(w.message)}</li>`).join('')}</ul><p>Sửa mô tả trong <code>${esc(m.source)}</code>.</p></div>`:'';
    // Repo statuses as one stacked bar plus a legend; each entry opens the repo catalog filtered to that status
    // (user 2026-11-09: the six tall cards looked clumsy and clicking should lead straight to the catalog).
    const total=m.repos.length,statusRow=`<section class="sys-overview" aria-labelledby="sys-overview-title"><h2 id="sys-overview-title">${total} repo trong <code>repos/</code></h2><div class="sys-bar" aria-hidden="true">${Object.keys(m.statuses).filter(k=>m.counts[k]).map(k=>`<span class="sys-${esc(k)}" data-n="${m.counts[k]}"></span>`).join('')}</div><ul class="sys-key">${Object.entries(m.statuses).map(([k,st])=>`<li><button type="button" class="sys-key-item sys-${esc(k)}" data-sys-status="${esc(k)}" title="${esc(st.summary)}"><span class="sys-dot" aria-hidden="true"></span><strong>${m.counts[k]||0}</strong> ${esc(st.title)}</button></li>`).join('')}</ul></section>`;
    const tabs=`<div class="sys-tabs" role="tablist" aria-label="Góc nhìn">${Object.entries(sysTabs).map(([k,t])=>`<button type="button" role="tab" id="sys-tab-${k}" aria-controls="sys-body" aria-selected="${state.sysTab===k}" tabindex="${state.sysTab===k?0:-1}" data-sys-tab="${k}">${esc(t)}${k==='repos'?` <span class="count">${m.repos.length}</span>`:''}</button>`).join('')}</div>`;
    box.innerHTML=`${warn}${statusRow}${tabs}<div id="sys-body" role="tabpanel" aria-labelledby="sys-tab-${state.sysTab}"></div><p class="resource-note">Mô tả vai trò do người viết trong <code>${esc(m.source)}</code> (cập nhật ${esc(m.updated)}). Số liệu đo trực tiếp mỗi lần mở trang: commit trong repos-manifest.json, phiên bản trong package.json và các môi trường Python, ${m.scanned} file nguồn trong src, scripts, tools. Bước quy trình lấy từ tools/production-automation.</p>`;
  }
  // The page's CSP blocks inline style attributes; widths are set through the DOM instead.
  box.querySelectorAll('.sys-bar span').forEach(sp=>{sp.style.flex=sp.dataset.n;});
  renderSystemBody();
}
function renderSystemBody(){
  const m=state.system,body=$('#sys-body');if(!m||!body)return;
  body.setAttribute('aria-labelledby','sys-tab-'+state.sysTab);
  $('#resource-view').querySelectorAll('[data-sys-status]').forEach(b=>b.setAttribute('aria-pressed',String(state.sysStatus===b.dataset.sysStatus)));
  const shown=r=>!state.sysStatus||r.status===state.sysStatus;
  if(state.sysTab==='flow'){
    if(!m.stages.some(x=>x.id===state.sysStage))state.sysStage=m.stages[0]?.id||'';
    const legend=`<ul class="sys-legend" aria-label="Chú giải">${Object.values(sysKinds).map(([t,c])=>`<li><span class="sys-mark ${c}" aria-hidden="true"></span>${esc(t)}</li>`).join('')}</ul>`;
    body.innerHTML=`<div class="resource-heading"><h2>Một tập đi qua những bước nào</h2><p>Quy trình đầy đủ của series Đọc sách, hiểu mình (các series khác bỏ bước Nguồn sách). Mũi tên là thứ tự phụ thuộc. Bấm một bước để xem công cụ và repo tham gia; bấm tên repo để mở danh mục repo.</p></div>${legend}<div class="sys-split"><div class="sys-diagram">${sysFlowHtml(m)}</div><aside class="sys-side" id="sys-side" aria-live="polite">${sysStagePanel(m,state.sysStage)}</aside></div>`;
    watchFlowEdges();
  } else if(state.sysTab==='layers'){
    const sel=state.sysNode&&sysArchNodes(m).find(n=>n.key===state.sysNode)?state.sysNode:'c:manager';state.sysNode=sel;
    body.innerHTML=`<div class="resource-heading"><h2>Các tầng của hệ thống</h2><p>Đọc từ trên xuống: bạn điều khiển qua trang quản lý và Studio, công cụ của repo chạy trong môi trường riêng và gọi engine; skill chỉ hướng dẫn agent. Bấm một khối để xem chi tiết; khối có mũi tên là repo bên ngoài, bấm vào mở thẳng danh mục repo.</p></div><div class="sys-split"><div class="sys-diagram">${sysArchHtml(m)}</div><aside class="sys-side" id="sys-side" aria-live="polite">${sysNodePanel(m,sel)}</aside></div>`;
    edgeObserver?.disconnect();
  } else {
    const q=fold(state.sysQuery),list=m.repos.filter(r=>shown(r)&&(!q||fold([r.title,r.id,r.category,r.general,r.role,r.facts.upstream].join(' ')).includes(q)));
    if(!list.some(r=>r.id===state.sysRepo))state.sysRepo=list[0]?.id||'';
    const focused=document.activeElement?.id==='sys-search';
    body.innerHTML=`<div class="sys-catalog"><div class="sys-list"><label class="search-field"><span aria-hidden="true">${icon('search')}</span><input id="sys-search" type="search" autocomplete="off" placeholder="Tìm repo, chức năng, vai trò" aria-label="Tìm repo" value="${esc(state.sysQuery)}"></label><p class="filter-result" aria-live="polite">${list.length} repo${state.sysStatus?` · ${esc(m.statuses[state.sysStatus].title)}`:''}</p>
<ul>${list.map(r=>`<li><button type="button" class="sys-row" data-sys-pick="${esc(r.id)}" aria-current="${r.id===state.sysRepo}"><span class="sys-row-title">${esc(r.title)}</span>${sysPill(m,r.status)}<small>${esc(r.category)} · ${esc(sysUsage(r))}</small></button></li>`).join('')||'<li class="sys-empty">Không có repo khớp.</li>'}</ul></div><div class="sys-detail" id="sys-detail" tabindex="-1">${sysDetail(m,m.repos.find(r=>r.id===state.sysRepo))}</div></div>`;
    if(focused){const input=$('#sys-search');input.focus();input.setSelectionRange(input.value.length,input.value.length);}
  }
}
function sysDetail(m,r){
  if(!r)return '<p class="sys-empty">Chọn một repo để xem chi tiết.</p>';
  const f=r.facts,stage=id=>m.stages.find(s=>s.id===id)?.title||id;
  const facts=[
    ['Nguồn',f.upstream?`<a href="https://github.com/${esc(f.upstream)}" target="_blank" rel="noopener noreferrer">${esc(f.upstream)}</a>`:'Chưa ghi trong manifest'],
    ['Bản clone',f.cloned?`repos/${esc(r.id)} · commit <code>${esc(f.commit)}</code>`:'Chưa clone'],
    ...(f.packages.length?[['Package npm',f.packages.map(p=>`<code>${esc(p.name)}</code> ${p.version?esc(p.version):'<em>chưa cài</em>'}`).join('<br>')]]:[]),
    ...(f.python?[['Gói Python',`${esc(f.python.env)} · ${f.python.version?esc(f.python.version):'<em>chưa cài</em>'}`]]:[]),
    ...(f.binary?[['Chương trình',`<code>${esc(f.binary.path)}</code> ${f.binary.present?'có':'<em>chưa có trên máy</em>'}`]]:[]),
    ...(f.runtime?[['Runtime',`<code>${esc(f.runtime.path)}</code> ${f.runtime.present?'có':'<em>chưa có</em>'}`]]:[]),
    ...(f.graph?[['Đồ thị code',f.graph.built?`dựng ${esc(new Date(f.graph.built).toLocaleString('vi-VN'))} · ${f.graph.stale?'<em>cũ hơn code, sẽ tự dựng lại</em>':'khớp code hiện tại'}`:'<em>chưa dựng</em>']]:[]),
    ...(f.skills.length?[['Skill',f.skills.map(s=>`<code>${esc(s.name)}</code>${s.present?'':' <em>thiếu</em>'}`).join(' ')]]:[]),
    ['Giấy phép',esc(r.license||'Chưa ghi')]
  ];
  const used=f.usedBy.length?`<details class="sys-files"><summary>${f.usedBy.length} file trong repo dùng tới</summary><ul>${f.usedBy.map(x=>`<li><code>${esc(x)}</code></li>`).join('')}</ul></details>`:'<p class="sys-note">Không có file nào trong src, scripts, tools import hay tham chiếu tới repo này.</p>';
  return `<div class="sys-detail-head"><h3>${esc(r.title)}</h3>${sysPill(m,r.status)}<span class="tag">${esc(r.category)}</span></div>
<h4>Chức năng chung</h4><p>${esc(r.general)}</p><h4>Vai trò trong hệ thống này</h4><p>${esc(r.role)}</p>
${r.stages.length?`<h4>Tham gia các bước</h4><div class="sys-uses">${r.stages.map(s=>`<button type="button" class="sys-tool sys-stage-link" data-sys-stage="${esc(s)}">${esc(stage(s))}</button>`).join('')}</div>`:''}
${r.usedVia.length?`<h4>Gọi qua</h4><ul class="sys-via">${r.usedVia.map(x=>`<li><code>${esc(x)}</code></li>`).join('')}</ul>`:''}
<h4>Số liệu đo trên máy</h4><dl class="sys-facts">${facts.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>${used}
${r.notes.length?`<div class="sys-warnings"><strong>Lệch với mô tả</strong><ul>${r.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></div>`:''}
<h4>Dùng lại ở hệ thống khác</h4><p>${esc(r.reuse)}</p>${r.ideas.length?`<h4>Gợi ý cải thiện</h4><ul class="sys-ideas">${r.ideas.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}`;
}
function sysSetTab(tab,focus){state.sysTab=tab;sysUrl();renderSystemBody();$('#resource-view').querySelectorAll('[data-sys-tab]').forEach(b=>{const on=b.dataset.sysTab===tab;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus();});}
$('#resource-view').addEventListener('click',event=>{
  if(state.view!=='system')return;
  const dg=event.target.closest('[data-dg-stage],[data-dg-node]');if(dg){sysSelect({stage:dg.dataset.dgStage,node:dg.dataset.dgNode});return;}
  const t=event.target.closest('[data-sys-tab],[data-sys-repo],[data-sys-pick],[data-sys-status],[data-sys-stage]');if(!t)return;
  if(t.dataset.sysTab)sysSetTab(t.dataset.sysTab);
  else if(t.dataset.sysStatus){const k=t.dataset.sysStatus;state.sysStatus=state.sysTab==='repos'&&state.sysStatus===k?'':k;state.sysRepo='';state.sysQuery='';sysSetTab('repos');}
  else if(t.dataset.sysPick){state.sysRepo=t.dataset.sysPick;sysUrl();renderSystemBody();const d=$('#sys-detail'),top=d.getBoundingClientRect().top;if(top<0||top>innerHeight-120)d.scrollIntoView({block:'start'});$(`[data-sys-pick="${CSS.escape(state.sysRepo)}"]`)?.focus();}
  else if(t.dataset.sysRepo)sysOpenRepo(t.dataset.sysRepo);
  else if(t.dataset.sysStage){state.sysStage=t.dataset.sysStage;state.sysStatus='';sysSetTab('flow');$('#sys-side')?.scrollIntoView({block:'nearest'});}
});
$('#resource-view').addEventListener('input',event=>{if(state.view!=='system'||event.target.id!=='sys-search')return;state.sysQuery=event.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(renderSystemBody,100);});
$('#resource-view').addEventListener('keydown',event=>{
  const tab=event.target.closest?.('[data-sys-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const keys=Object.keys(sysTabs),i=keys.indexOf(tab.dataset.sysTab);event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?keys.length-1:(i+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;sysSetTab(keys[next],true);
});
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
  state.resourceKey=key;view==='voices'?voiceShell(state.library.voices):musicShell(state.library.music);renderResourceList();renderVoiceStudio();if(view==='voices')loadVoiceRefs();
}
const toolbar=(placeholder,selects)=>`<div class="resource-toolbar"><label class="search-field"><span data-icon="search" aria-hidden="true">${icon('search')}</span><input id="resource-search" type="search" autocomplete="off" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" value="${esc(state.query)}"></label>${selects}<span class="filter-result" id="resource-count" aria-live="polite"></span></div>`;
const select=(id,label,options,value)=>`<label class="sr-only" for="${id}">${esc(label)}</label><select id="${id}">${options.map(([v,t])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
const usageList=(items,extra=()=> '')=>`<ul class="usage-list">${items.map(p=>`<li><a href="#project/${encodeURIComponent(p.id)}" data-project="${esc(p.id)}">${esc(p.title)}</a><small>${esc(p.seriesTitle)}${extra(p)}</small></li>`).join('')}</ul>`;

function voiceShell(data){
  const regions=[...new Set(data.voices.map(v=>v.region))],f=state.voiceFilters||{};
  $('#resource-view').innerHTML=`<section class="voice-options" aria-labelledby="voice-options-title"><h2 id="voice-options-title">Hai cách lấy giọng cho video mới</h2>
<div class="voice-option-grid"><article class="voice-option"><div class="vo-head"><span class="vo-num" aria-hidden="true">1</span><strong>Giọng có sẵn</strong><span class="tag">Mặc định</span></div><p>25 giọng VieNeu chạy trên máy, nhanh. Ưu tiên nhóm giọng đã chọn; video thiếu nhi giữ Trúc Ly giọng B. Nghe và chọn ở danh sách bên dưới.</p><div class="vs-actions"><button class="button secondary" data-scroll-chosen>Xem giọng có sẵn</button></div></article>
<article class="voice-option studio-callout" id="vs-panel" aria-labelledby="vs-title" aria-live="polite"></article></div>
<p class="resource-note">Ghi lựa chọn vào brief của tập, ví dụ “Giọng: cách 1 — Hải Đăng”. Không ghi thì dùng cách 1.</p></section><section class="resource-block ref-block" id="voice-refs" aria-labelledby="refs-title"></section><section class="resource-block" aria-labelledby="chosen-title"><div class="resource-heading"><h2 id="chosen-title">${esc(data.playlist?.name||'Giọng đã chọn')} <span class="count" id="chosen-count"></span></h2><p>Nhóm ưu tiên khi làm nội dung mới. Bấm “Chọn giọng” ở bất kỳ giọng nào để thêm vào đây. Chọn giọng không đổi giọng của video đã có.</p></div><div class="voice-grid" id="chosen-list"></div></section>
<section class="resource-block" aria-labelledby="all-voices-title"><div class="resource-heading"><h2 id="all-voices-title">Tất cả giọng VieNeu <span class="count">${data.voices.length}</span></h2><p>Mỗi mẫu đọc cùng một đoạn: “${esc(data.sampleText)}” Mẫu đã qua kiểm tra nhận dạng chữ, chưa có nghĩa là đã nghe duyệt. Giọng B thiếu nhi là Trúc Ly nâng 2,5 semitone; mẫu ở đây là preset gốc.</p></div>
${toolbar('Tìm tên giọng hoặc tên tập',select('voice-gender','Lọc giới tính',[['','Nam và nữ'],['Nam','Giọng nam'],['Nữ','Giọng nữ']],f.gender||'')+select('voice-region','Lọc vùng',[['','Mọi vùng'],...regions.map(r=>[r,'Giọng '+r])],f.region||'')+select('voice-use','Lọc theo sử dụng',[['','Mọi giọng'],['used','Đang dùng trong tập'],['unused','Chưa tập nào dùng']],f.use||''))}
<div class="voice-grid" id="resource-list"></div>${data.otherVoices.length||data.unrecorded?`<p class="resource-note">${data.otherVoices.map(o=>`${esc(o.name)}: ${o.usedBy.length} tập (không có trong bộ mẫu). `).join('')}${data.unrecorded?`${data.unrecorded} tập chưa ghi giọng trong metadata.`:''}</p>`:''}</section>`;
}
// Voice reference recordings (for cloning later): add with consent, pick a 10–30 s window on the waveform, cut.
const clock=s=>{s=Math.max(0,s);const m=Math.floor(s/60),r=s-m*60;return `${m}:${r.toFixed(1).padStart(4,'0')}`;};
const parseClock=t=>{const m=String(t).trim().match(/^(?:(\d+):)?(\d+(?:[.,]\d+)?)$/);return m?Number(m[1]||0)*60+Number(m[2].replace(',','.')):NaN;};
async function loadVoiceRefs(){
  const box=$('#voice-refs');if(!box)return;
  try{state.voiceRefs=(await api('/api/voice-references')).references;}catch(error){box.innerHTML=`<p class="workflow-empty">Không đọc được bản ghi giọng mẫu: ${esc(error.message)}</p>`;return;}
  state.refSel=state.refSel||{};for(const r of state.voiceRefs)if(!state.refSel[r.id]&&r.suggestion)state.refSel[r.id]={start:r.suggestion.startSeconds,len:r.suggestion.durationSeconds};
  renderVoiceRefs();
}
function refWave(r){
  const sel=state.refSel[r.id],w=900,x=sel.start/r.durationSeconds*w,width=sel.len/r.durationSeconds*w;
  return `<svg class="ref-wave" viewBox="0 0 ${w} 80" preserveAspectRatio="none" role="slider" tabindex="0" aria-label="Chọn điểm bắt đầu đoạn mẫu, phím mũi tên để dời 1 giây" aria-valuemin="0" aria-valuemax="${Math.floor(r.durationSeconds)}" aria-valuenow="${Math.floor(sel.start)}" aria-valuetext="Bắt đầu ${clock(sel.start)}" data-ref-wave="${esc(r.id)}"><rect class="ref-sel" x="${x}" y="0" width="${Math.max(2,width)}" height="80" /><g class="ref-bars">${r.peaks.map((p,i)=>`<rect x="${i}" y="${40-Math.max(1,p*.38)}" width="1" height="${Math.max(2,p*.76)}" />`).join('')}</g><line class="ref-head" x1="${x}" x2="${x}" y1="0" y2="80" /></svg>`;
}
// One compact row per recording; the editor (waveform, window, cut) or the clip list opens for one row at a time.
function refRow(r){
  const open=state.refOpen===r.id,clip=r.clips[r.clips.length-1],used=[...new Set(r.clips.flatMap(c=>c.usedBy))];
  const play=clip?playButton('reference-clip',`${r.id}/${clip.file}`,`${r.title} · đoạn mẫu`,`${r.speaker} · ${clip.durationSeconds} giây`):r.hasSource?playButton('reference',r.id,r.title,`${r.speaker} · cả bản ghi`):'<span class="play-missing" title="Chưa có đoạn mẫu">—</span>';
  const clipState=r.clips.length?`<span class="ref-chip ref-chip-ready">${r.clips.length} đoạn mẫu</span>`:'<span class="ref-chip ref-chip-warn">Chưa cắt đoạn mẫu</span>';
  const usage=used.length?`<span class="ref-usage">Dùng trong ${used.map(esc).join(', ')}</span>`:'<span class="ref-usage muted">Chưa dùng trong tập nào</span>';
  return `<li class="resource-row ref-row${open?' open':''}" data-ref="${esc(r.id)}">${play}<div class="row-title ref-identity"><strong>${esc(r.title)}</strong><small class="ref-meta"><span class="ref-speaker">${esc(r.speaker)}</span><span class="ref-consent">${esc(r.consentLabel)}</span>${clipState}${usage}</small></div><button class="button quiet expand-button ref-toggle" data-ref-toggle aria-expanded="${open}"><span>${open?'Thu gọn':r.hasSource?'Chọn đoạn mẫu':'Chi tiết'}</span><i aria-hidden="true"></i></button>
${open?`<div class="ref-panel">${state.refEdit===r.id?refMetaForm(r):'<div class="ref-panel-toolbar"><button class="button quiet" data-ref-edit>Sửa thông tin</button></div>'}${r.hasSource?refEditor(r):''}${r.clips.length?refClips(r):''}${!r.hasSource&&!r.clips.length?'<p class="muted">Không còn file gốc và chưa có đoạn mẫu.</p>':''}</div>`:''}</li>`;
}
function refMetaForm(r){
  const clip=r.clips[r.clips.length-1];
  return `<form class="ref-meta-form" data-revision="${esc(r.revision)}"><div class="ref-edit-head"><div><strong>Chỉnh sửa thông tin bản ghi</strong><p>Mã thư mục <code>${esc(r.id)}</code> được giữ nguyên để không làm hỏng liên kết.</p></div></div><div class="ref-edit-grid"><label class="field"><span>Tên bản ghi</span><input name="title" value="${esc(r.title)}" maxlength="160" required autocomplete="off"></label><label class="field"><span>Người nói</span><input name="speaker" value="${esc(r.speaker)}" maxlength="120" required autocomplete="off"></label><label class="field"><span>Xác nhận</span><select name="consent" required><option value="self" ${r.consent==='self'?'selected':''}>Đây là giọng của tôi</option><option value="permission" ${r.consent==='permission'?'selected':''}>Đã được người nói đồng ý</option></select></label>${clip?`<label class="field ref-file-field"><span>Tên file đoạn mẫu</span><input name="fileName" class="ref-file-name" value="${esc(clip.file)}" data-clip-file="${esc(clip.file)}" maxlength="124" pattern="[A-Za-z0-9](?:[A-Za-z0-9._]|-){0,119}[.]wav" required autocomplete="off" spellcheck="false"><small>Dùng chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới; kết thúc bằng .wav.</small></label>`:''}</div><div class="ref-edit-actions"><p class="ref-edit-status" role="status"></p><button type="button" class="button quiet" data-ref-edit-cancel>Hủy</button><button type="submit" class="button primary">Lưu thay đổi</button></div></form>`;
}
function refEditor(r){
  const sel=state.refSel[r.id];
  return `${refWave(r)}<div class="ref-scale"><span>0:00</span><span>${clock(r.durationSeconds).replace(/\.\d$/,'')}</span></div>
<div class="ref-controls"><label class="field"><span>Bắt đầu</span><input class="ref-start" value="${clock(sel.start)}" inputmode="decimal" aria-label="Bắt đầu đoạn mẫu (phút:giây)"></label><label class="field"><span>Độ dài</span><select class="ref-len" aria-label="Độ dài đoạn mẫu">${[10,15,20,30].filter(n=>n<=r.durationSeconds).map(n=>`<option value="${n}" ${n===sel.len?'selected':''}>${n} giây</option>`).join('')}</select></label>
<p class="ref-range">Đoạn chọn: <strong>${clock(sel.start)} – ${clock(sel.start+sel.len)}</strong></p>
<div class="ref-actions"><button class="button quiet" data-ref-suggest>Dùng gợi ý ${clock(r.suggestion.startSeconds)}</button><button class="button secondary" data-ref-preview aria-pressed="false">Nghe đoạn này</button><button class="button primary" data-ref-cut>Cắt, lưu đoạn mẫu và xóa file gốc</button></div></div>
<p class="ref-note">Sau khi lưu đoạn mẫu, file ghi âm đầy đủ sẽ bị xóa; chỉ giữ đoạn đã cắt.</p><p class="ref-status" role="status"></p>`;
}
const refClips=r=>`<ul class="ref-clips">${r.clips.map(c=>`<li><div class="ref-clip-line"><span class="ref-clip-label">Đoạn mẫu</span><strong>${clock(c.startSeconds)} – ${clock(c.startSeconds+c.durationSeconds)}</strong><span>${c.durationSeconds} giây</span></div>${c.usedBy.length?`<div class="ref-clip-line ref-clip-pair"><span class="ref-clip-label">Đã dùng</span><span>${c.usedBy.map(esc).join(', ')}</span></div>`:''}<div class="ref-clip-line ref-clip-pair"><span class="ref-clip-label">Đường dẫn</span><code class="ref-path">${esc(c.path)}</code></div><details class="ref-command"><summary>Lệnh dùng đoạn này để clone</summary><small><code>npm run voicestudio -- clone --project &lt;mã-tập&gt; --take &lt;tên-take&gt; --ref ${esc(c.path)} --consent ${esc(r.consent)} --scene 1</code></small></details></li>`).join('')}</ul><p class="ref-status" role="status"></p>`;
function renderVoiceRefs(){
  const box=$('#voice-refs');if(!box)return;const open=state.addRefOpen;
  box.innerHTML=`<div class="resource-heading ref-heading"><div><div class="ref-title-line"><h2 id="refs-title">Bản ghi giọng mẫu để clone sau</h2><span class="ref-count">${state.voiceRefs.length} bản ghi</span></div><p>Giữ những đoạn giọng 10–30 giây đã được đồng ý để dùng lại khi một tập chọn giọng clone.</p><p class="ref-local-note"><strong>Chỉ lưu trên máy</strong><code>library/voice-references/</code><span>Không đưa lên Git · không tự clone</span></p></div><button class="button ${open?'quiet':'primary'}" data-add-ref aria-expanded="${open?'true':'false'}">${open?'Đóng':'＋ Thêm bản ghi giọng'}</button></div>
${open?`<form id="add-ref-form" class="inline-edit add-ref-form"><label class="field"><span>File ghi âm (WAV, MP3, M4A, OGG, FLAC; tối đa 500 MB)</span><input id="ref-file" type="file" accept=".wav,.mp3,.m4a,.ogg,.flac,audio/*" required></label><div class="field-row"><label class="field"><span>Người nói</span><input id="ref-speaker" maxlength="120" required autocomplete="off" placeholder="Tên người trong bản ghi"></label><label class="field"><span>Tên bản ghi <small>(không bắt buộc)</small></span><input id="ref-title" maxlength="160" autocomplete="off" placeholder="Mặc định lấy tên file"></label></div><fieldset class="add-audio-kind"><legend>Xác nhận</legend><label><input type="radio" name="ref-consent" value="self"> Đây là giọng của tôi</label><label><input type="radio" name="ref-consent" value="permission"> Người trong bản ghi đã đồng ý cho clone</label></fieldset><p class="resource-note">Không thêm giọng lấy từ video, người nổi tiếng hay người sáng tạo khác khi chưa có sự đồng ý của họ.</p><div class="inline-edit-actions"><p id="add-ref-status" role="status"></p><button type="submit" class="button primary">Thêm bản ghi</button></div></form>`:''}
${state.voiceRefs.length?`<ul class="resource-rows ref-rows">${state.voiceRefs.map(refRow).join('')}</ul>`:'<p class="workflow-empty">Chưa có bản ghi giọng mẫu.</p>'}`;
  syncPlayButtons();
}
function updateRefCard(id){const r=state.voiceRefs.find(x=>x.id===id),card=document.querySelector(`[data-ref="${CSS.escape(id)}"]`);if(!r||!card)return;const sel=state.refSel[id];
  sel.start=Math.min(Math.max(0,sel.start),Math.max(0,r.durationSeconds-sel.len));
  if(!card.querySelector('.ref-wave'))return;card.querySelector('.ref-wave').outerHTML=refWave(r);card.querySelector('.ref-start').value=clock(sel.start);card.querySelector('.ref-range strong').textContent=`${clock(sel.start)} – ${clock(sel.start+sel.len)}`;}
const refPreview=new Audio();refPreview.preload='none';let refPreviewId=null;
function stopRefPreview(){refPreview.pause();if(refPreviewId)document.querySelector(`[data-ref="${CSS.escape(refPreviewId)}"] [data-ref-preview]`)?.setAttribute('aria-pressed','false');document.querySelectorAll('[data-ref-preview]').forEach(b=>{b.textContent='Nghe đoạn này';});refPreviewId=null;}
refPreview.addEventListener('timeupdate',()=>{const sel=refPreviewId&&state.refSel[refPreviewId];if(!sel)return;
  const card=document.querySelector(`[data-ref="${CSS.escape(refPreviewId)}"]`),r=state.voiceRefs.find(x=>x.id===refPreviewId),head=card?.querySelector('.ref-head');
  if(head&&r){const x=refPreview.currentTime/r.durationSeconds*900;head.setAttribute('x1',x);head.setAttribute('x2',x);}
  if(refPreview.currentTime>=sel.start+sel.len)stopRefPreview();});
async function refAction(target){
  const card=target.closest('[data-ref]'),id=card.dataset.ref,r=state.voiceRefs.find(x=>x.id===id),sel=state.refSel[id],status=card.querySelector('.ref-status');
  if(target.hasAttribute('data-ref-suggest')){sel.start=r.suggestion.startSeconds;updateRefCard(id);status.textContent='Đã chọn đoạn gợi ý: ít khoảng lặng nhất.';}
  else if(target.hasAttribute('data-ref-preview')){
    if(refPreviewId===id){stopRefPreview();return;}stopRefPreview();if(!player.paused)player.pause();
    refPreviewId=id;refPreview.src=audioUrl('reference',id);target.setAttribute('aria-pressed','true');target.textContent='Dừng nghe';
    try{await new Promise((ok,fail)=>{if(refPreview.readyState>=1)return ok();refPreview.addEventListener('loadedmetadata',ok,{once:true});refPreview.addEventListener('error',()=>fail(Error('Không phát được bản ghi')),{once:true});refPreview.load();});refPreview.currentTime=sel.start;await refPreview.play();}
    catch(error){if(error.name!=='AbortError'){status.textContent=error.message;stopRefPreview();}}
  }else if(target.hasAttribute('data-ref-cut')){
    target.disabled=true;status.textContent='Đang cắt đoạn mẫu…';
    try{stopRefPreview();const clip=await api('/api/voice-reference-clip',{id,startSeconds:sel.start,durationSeconds:sel.len});await loadVoiceRefs();
      const s=document.querySelector(`[data-ref="${CSS.escape(id)}"] .ref-status`);if(s)s.textContent=`Đã lưu ${clip.path}; đã xóa file ghi âm đầy đủ.`;toast('Đã lưu đoạn mẫu và xóa file gốc.');}
    catch(error){status.textContent=error.message;target.disabled=false;}
  }
}
async function submitRef(event){
  event.preventDefault();const file=$('#ref-file').files[0],consent=document.querySelector('input[name="ref-consent"]:checked')?.value,status=$('#add-ref-status'),button=event.target.querySelector('button[type=submit]');
  if(!file||!consent){status.textContent='Chọn file và xác nhận sự đồng ý.';return;}
  button.disabled=true;status.textContent=`Đang chép và phân tích ${file.name}…`;
  try{const q=new URLSearchParams({name:file.name,speaker:$('#ref-speaker').value,title:$('#ref-title').value,consent});
    const response=await fetch('/api/voice-reference?'+q,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Workspace-Token':state.data.token},body:file});
    let result;try{result=await response.json();}catch{throw Error('Không đọc được phản hồi của trang quản lý.');}if(!response.ok)throw Error(result.error);
    state.addRefOpen=false;state.refOpen=result.id;await loadVoiceRefs();toast(`Đã thêm “${result.title}”. Đoạn gợi ý bắt đầu ở ${clock(result.suggestion.startSeconds)}.`);
    document.querySelector(`[data-ref="${CSS.escape(result.id)}"] .ref-wave`)?.focus();
  }catch(error){status.textContent=error.message;button.disabled=false;}
}
async function saveRefMeta(form){
  const card=form.closest('[data-ref]'),id=card.dataset.ref,status=form.querySelector('.ref-edit-status'),buttons=form.querySelectorAll('button'),file=form.querySelector('.ref-file-name');
  buttons.forEach(b=>b.disabled=true);status.textContent='Đang lưu…';stopRefPreview();if(!player.paused)player.pause();
  try{
    await api('/api/voice-reference-meta',{id,title:form.elements.title.value,speaker:form.elements.speaker.value,consent:form.elements.consent.value,revision:form.dataset.revision,clipFile:file?.dataset.clipFile,fileName:file?.value});
    state.refEdit=null;await loadVoiceRefs();toast('Đã cập nhật thông tin bản ghi và tên file.');document.querySelector(`[data-ref="${CSS.escape(id)}"] [data-ref-edit]`)?.focus();
  }catch(error){status.textContent=error.message;buttons.forEach(b=>b.disabled=false);}
}
$('#resource-view').addEventListener('click',event=>{
  const t=event.target;const toggle=t.closest('[data-ref-toggle]');if(toggle){const id=toggle.closest('[data-ref]').dataset.ref;stopRefPreview();state.refOpen=state.refOpen===id?null:id;if(state.refOpen!==id)state.refEdit=null;renderVoiceRefs();document.querySelector(`[data-ref="${CSS.escape(id)}"] [data-ref-toggle]`)?.focus();return;}
  const edit=t.closest('[data-ref-edit]');if(edit){const id=edit.closest('[data-ref]').dataset.ref;state.refEdit=id;renderVoiceRefs();document.querySelector(`[data-ref="${CSS.escape(id)}"] .ref-meta-form [name="title"]`)?.focus();return;}
  const cancel=t.closest('[data-ref-edit-cancel]');if(cancel){const id=cancel.closest('[data-ref]').dataset.ref;state.refEdit=null;renderVoiceRefs();document.querySelector(`[data-ref="${CSS.escape(id)}"] [data-ref-edit]`)?.focus();return;}
  if(t.closest('[data-add-ref]')){state.addRefOpen=!state.addRefOpen;renderVoiceRefs();(state.addRefOpen?$('#ref-file'):$('[data-add-ref]'))?.focus();return;}
  const action=t.closest('[data-ref-suggest],[data-ref-preview],[data-ref-cut]');if(action){refAction(action);return;}
  const wave=t.closest('[data-ref-wave]');if(wave){const id=wave.dataset.refWave,r=state.voiceRefs.find(x=>x.id===id),box=wave.getBoundingClientRect();state.refSel[id].start=Math.round((event.clientX-box.left)/box.width*r.durationSeconds*10)/10;updateRefCard(id);document.querySelector(`[data-ref="${CSS.escape(id)}"] .ref-wave`)?.focus();}
});
$('#resource-view').addEventListener('keydown',event=>{
  if(event.key==='Escape'&&event.target.closest?.('.ref-meta-form')){event.preventDefault();const id=event.target.closest('[data-ref]').dataset.ref;state.refEdit=null;renderVoiceRefs();document.querySelector(`[data-ref="${CSS.escape(id)}"] [data-ref-edit]`)?.focus();return;}
  const wave=event.target.closest?.('[data-ref-wave]');if(!wave||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();
  const id=wave.dataset.refWave,r=state.voiceRefs.find(x=>x.id===id),sel=state.refSel[id],step=event.shiftKey?5:1;
  sel.start=event.key==='Home'?0:event.key==='End'?r.durationSeconds-sel.len:sel.start+(event.key==='ArrowRight'?step:-step);updateRefCard(id);document.querySelector(`[data-ref="${CSS.escape(id)}"] .ref-wave`)?.focus();
});
$('#resource-view').addEventListener('change',event=>{
  const card=event.target.closest?.('[data-ref]');if(!card)return;const id=card.dataset.ref,sel=state.refSel[id];
  if(event.target.matches('.ref-start')){const v=parseClock(event.target.value);if(Number.isFinite(v))sel.start=v;updateRefCard(id);}
  if(event.target.matches('.ref-len')){sel.len=Number(event.target.value);updateRefCard(id);}
});
$('#resource-view').addEventListener('submit',event=>{if(event.target.id==='add-ref-form')submitRef(event);else if(event.target.matches('.ref-meta-form')){event.preventDefault();saveRefMeta(event.target);}});
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

// Drive backup (tools/project-manager/backup.cjs). The backup runs as its own process, so this page only reads
// its status file: polled every 2 s on this page while running, every 5 s for the sidebar badge, slower when idle.
let backupTimer=null;
const backupPhases={starting:'Đang khởi động',['checking-remote']:'Đang kết nối Google Drive',copying:'Đang tải lên Drive',verifying:'Đang đối chiếu checksum với Drive',manifest:'Đang ghi biên bản sao lưu'};
const bytesVi=b=>{b=b||0;const u=['B','KB','MB','GB','TB'];let i=0;while(b>=1024&&i<u.length-1){b/=1024;i++;}return `${b.toLocaleString('vi-VN',{maximumFractionDigits:i<2?0:1})} ${u[i]}`;};
const etaVi=s=>s==null||!Number.isFinite(s)?'':s<60?'dưới 1 phút':s<3600?`khoảng ${Math.round(s/60)} phút`:`khoảng ${Math.floor(s/3600)} giờ ${Math.round(s%3600/60)} phút`;
const countVi=n=>(n||0).toLocaleString('vi-VN');
async function refreshBackup(){
  clearTimeout(backupTimer);
  const onPage=state.view==='backup';
  try{
    if(onPage){state.backup=await api('/api/backup');state.backupSummary={running:state.backup.running,status:state.backup.status};renderBackup();}
    else state.backupSummary=await api('/api/backup/summary');
    state.backupError='';
  }catch(error){state.backupError=error.message;if(onPage)renderBackup();}
  updateBackupBadge();
  const running=state.backupSummary?.running;
  backupTimer=setTimeout(refreshBackup,document.hidden?60000:running?(onPage?2000:5000):onPage?20000:30000);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshBackup();});
function updateBackupBadge(){
  const badge=$('#backup-nav-badge');if(!badge)return;const s=state.backupSummary,st=s?.status;
  badge.className='nav-count backup-badge';badge.textContent='';
  if(s?.running){badge.textContent=st&&backupPhases[st.phase]?`${Math.floor(st.percent||0)}%`:'Đang chạy';badge.classList.add('is-running');}
  else if(st&&['failed','interrupted','stopped'].includes(st.phase)){badge.textContent=st.phase==='stopped'?'Đã dừng':'Lỗi';badge.classList.add('is-warn');}
}
function backupHeadline(d){
  const st=d.status,p=d.pending,phase=st?.phase;
  if(d.running&&st&&backupPhases[phase])return {tone:'run',title:`${backupPhases[phase]}…`,text:st.action==='verify'?'So từng file trên máy với bản trên Drive, không tải gì lên.':'Chỉ tải file mới hoặc đã đổi; file đã giống trên Drive được bỏ qua.'};
  if(d.running)return {tone:'run',title:'Một bản sao lưu chạy từ dòng lệnh đang chạy',text:`Tiến trình ${d.untracked.join(', ')} được khởi động trước khi trang có phần theo dõi, nên chưa báo phần trăm. Trang sẽ cập nhật số file chưa sao lưu khi lần chạy sau đối chiếu xong.`};
  if(phase==='failed')return {tone:'err',title:'Lần sao lưu gần nhất bị lỗi',text:st.error||'Xem nhật ký bên dưới.'};
  if(phase==='interrupted')return {tone:'warn',title:'Lần sao lưu gần nhất bị ngắt giữa chừng',text:`Tiến trình dừng mà không báo xong (tắt máy hoặc bị dừng) lúc ${when(st.updatedAt)}. Bấm Sao lưu để chạy tiếp; file đã lên Drive không phải tải lại.`};
  if(phase==='stopped')return {tone:'warn',title:'Đã dừng sao lưu',text:`Dừng lúc ${when(st.finishedAt)}. Bấm Sao lưu để chạy tiếp; file đã lên Drive không phải tải lại.`};
  if(!p.indexUpdatedAt)return {tone:'warn',title:'Chưa có lần đối chiếu nào với Drive',text:'Trang chưa biết file nào đã có trên Drive nên đang tính mọi file là chưa sao lưu. Bấm Sao lưu lên Drive: lần chạy tự so với Drive và bỏ qua file đã có.'};
  if(p.pendingFiles)return {tone:'warn',title:`${countVi(p.pendingFiles)} file chưa có trên Drive`,text:`${bytesVi(p.pendingBytes)} mới hoặc đã đổi kể từ lần Drive xác nhận gần nhất (${when(p.indexUpdatedAt)}).`};
  return {tone:'ok',title:'Mọi dữ liệu đã có trên Drive',text:`Drive xác nhận bằng checksum lúc ${when(p.indexUpdatedAt)}. Có file mới thì trang báo ở đây.`};
}
function backupNow(d){
  const st=d.status;if(!d.running||!st||!backupPhases[st.phase])return '';
  const src=st.sources?.find(s=>s.relative===st.current),stats=src?.stats;
  const done=(st.sources||[]).filter(s=>s.state==='verified'||s.state==='differs').length;
  let line=`Nguồn ${done+(src?1:0)}/${st.sources?.length||0}${src?`: ${esc(src.relative)}`:''}`;
  if(stats&&st.phase==='copying'){
    line+=stats.totalTransfers?` · ${countVi(stats.transfers)}/${countVi(stats.totalTransfers)} file`:stats.totalChecks?` · đã so ${countVi(stats.checks)}/${countVi(stats.totalChecks)} file`:'';
    if(stats.totalBytes)line+=` · ${bytesVi(stats.bytes)} / ${bytesVi(stats.totalBytes)}`;
    if(stats.speed)line+=` · ${bytesVi(stats.speed)}/giây`;
    const eta=etaVi(stats.eta);if(eta&&stats.totalTransfers>stats.transfers)line+=` · còn ${eta} cho nguồn này`;
  }else if(stats&&st.phase==='verifying'&&stats.totalChecks)line+=` · đã so ${countVi(stats.checks)}/${countVi(stats.totalChecks)} file`;
  const files=(stats?.transferring||[]).map(f=>`<li><span class="backup-file-name">${esc(f.name)}</span><span>${f.percentage??0}% của ${bytesVi(f.size)}</span></li>`).join('');
  return `<p class="backup-now">${line}</p>${files?`<ul class="backup-transfers" aria-label="File đang tải">${files}</ul>`:''}<p class="backup-started">Bắt đầu ${when(st.startedAt)}${stats?.errors?` · <b class="t-warn">${stats.errors} lỗi sẽ được thử lại</b>`:''}</p>`;
}
const sourceStates={waiting:'Chờ tới lượt',copying:'Đang tải lên',verifying:'Đang kiểm tra',verified:'Drive đã xác nhận',differs:'Còn file khác Drive'};
function backupSourceRow(s,live){
  const open=state.backupOpen===s.relative,run=live?.state&&sourceStates[live.state];
  const pending=s.pendingFiles?`<span class="tag tag-warn">${countVi(s.pendingFiles)} file · ${bytesVi(s.pendingBytes)}</span>`:'<span class="tag">Đã có đủ</span>';
  return `<li class="backup-source${open?' open':''}"><div class="row-title"><strong>${esc(s.label)}</strong><small><code>${esc(s.relative)}</code></small></div><span class="row-meta"><span class="m-label">Trên máy: </span>${countVi(s.files)} file · ${bytesVi(s.bytes)}</span><span class="row-meta"><span class="m-label">Chưa sao lưu: </span>${pending}</span><span class="row-meta">${run?`<span class="backup-state is-${esc(live.state)}">${esc(run)}</span>`:''}</span>${s.pendingFiles?`<button class="button quiet expand-button" data-backup-files="${esc(s.relative)}" aria-expanded="${open}">${open?'Thu gọn':'Xem file'}</button>`:'<span></span>'}${open?`<div class="row-detail backup-files" id="backup-files">${state.backupFiles?.relative===s.relative?backupFileList(state.backupFiles):'<p class="muted">Đang đọc danh sách…</p>'}</div>`:''}</li>`;
}
function backupFileList(f){
  if(!f.items.length)return '<p class="muted">Không còn file nào chờ sao lưu.</p>';
  return `<table class="usage-table"><thead><tr><th scope="col">File</th><th scope="col">Dung lượng</th><th scope="col">Lý do</th></tr></thead><tbody>${f.items.map(i=>`<tr><td><code>${esc(i.path)}</code></td><td>${bytesVi(i.size)}</td><td>${i.reason==='changed'?'Đã sửa':'Mới'}</td></tr>`).join('')}</tbody></table>${f.total>f.items.length?`<p class="resource-note">Hiện ${countVi(f.items.length)} file lớn nhất trên ${countVi(f.total)}.</p>`:''}`;
}
function renderBackup(){
  const box=$('#resource-view');if(state.view!=='backup')return;
  const d=state.backup;
  if(!d){box.innerHTML=state.backupError?`<p class="workflow-empty">Không đọc được trạng thái sao lưu: ${esc(state.backupError)}</p>`:'<p class="workflow-empty">Đang đọc trạng thái sao lưu…</p>';return;}
  const head=backupHeadline(d),st=d.status,tracked=d.running&&st&&backupPhases[st.phase],pct=tracked?Math.floor(st.percent||0):null;
  const live=Object.fromEntries((d.running&&st?.sources||[]).map(s=>[s.relative,s]));
  const focusId=document.activeElement?.closest?.('#resource-view')?(document.activeElement.dataset.backupFiles?`[data-backup-files="${CSS.escape(document.activeElement.dataset.backupFiles)}"]`:document.activeElement.dataset.backupAction?`[data-backup-action="${document.activeElement.dataset.backupAction}"]`:''):'';
  const actions=d.running?`<button class="button secondary" data-backup-action="stop">Dừng sao lưu</button>`
    :`<button class="button primary" data-backup-action="run">${d.pending.pendingFiles?'Sao lưu lên Drive':'Sao lưu lại và kiểm tra'}</button>`;
  const status=`<section class="backup-status is-${head.tone}" aria-labelledby="backup-status-title" aria-live="polite">
<div class="backup-status-main">${tracked?`<div class="progress-figure"><strong>${pct}%</strong><span>ước tính</span></div>`:''}<div class="backup-status-text"><h2 id="backup-status-title">${esc(head.title)}</h2><p>${esc(head.text)}</p></div><div class="backup-actions">${actions}</div></div>
${tracked?`${bar(pct,'is-big')}${backupNow(d)}`:''}
<p class="backup-note">Chạy nền trên máy này: đóng tab hay tắt trang quản lý không làm dừng. Chỉ sao chép lên Drive, không bao giờ xóa file trên Drive; bản cũ của file bị thay được giữ trong <code>versions/</code>.</p></section>`;
  const sources=`<section class="resource-block" aria-labelledby="backup-sources-title"><div class="resource-heading"><h2 id="backup-sources-title">Dữ liệu sao lưu <span class="count">${countVi(d.pending.totalFiles)} file · ${bytesVi(d.pending.totalBytes)}</span></h2><p>Những thư mục Git không lưu, theo danh sách trong <code>scripts/backup/drive-config.json</code>. File chưa sao lưu là file mới hoặc đã sửa kể từ khi Drive xác nhận bằng checksum. Bỏ qua credential, <code>.env</code>, cache và môi trường cài lại được.</p></div>
<div class="row-head backup-row-head" aria-hidden="true"><span>Nguồn</span><span>Trên máy</span><span>Chưa sao lưu</span><span>Lần chạy này</span><span></span></div><ul class="resource-rows backup-sources">${d.pending.sources.map(s=>backupSourceRow(s,live[s.relative])).join('')}</ul></section>`;
  const history=`<section class="resource-block" aria-labelledby="backup-history-title"><div class="resource-heading"><h2 id="backup-history-title">Các lần sao lưu đã hoàn tất</h2><p>Mỗi lần xong có biên bản trên Drive ở <code>_manifests/</code>. Thư mục Drive: <code>${esc(d.configured.folderId)}</code>, remote <code>${esc(d.configured.remote)}</code>.</p></div>
${d.history.length?`<ul class="backup-history">${d.history.map(r=>`<li><strong>${esc(when(r.completedAt))}</strong><span>${countVi(r.totalFiles)} file · ${bytesVi(r.totalBytes)}</span><code>${esc(r.runId)}</code></li>`).join('')}</ul>`:'<p class="workflow-empty">Chưa có lần sao lưu nào hoàn tất trên máy này.</p>'}
${d.log.length?`<details class="backup-log"${state.backupLogOpen?' open':''}><summary>Nhật ký lần chạy gần nhất</summary><pre>${esc(d.log.join('\n'))}</pre></details>`:''}</section>`;
  box.innerHTML=`${state.backupError?`<p class="error-banner">Mất kết nối tạm thời: ${esc(state.backupError)}</p>`:''}${status}${sources}${history}`;
  box.querySelectorAll('[data-width]').forEach(n=>{n.style.width=n.dataset.width+'%';});
  if(focusId)box.querySelector(focusId)?.focus({preventScroll:true});
}
async function loadBackupFiles(relative){
  try{state.backupFiles=await api('/api/backup/pending?source='+encodeURIComponent(relative));}
  catch(error){state.backupFiles={relative,items:[],total:0};toast(error.message);}
  renderBackup();
}
async function backupAction(action,button){
  if(action==='stop'&&!confirm('Dừng sao lưu? File đã tải lên vẫn ở trên Drive; lần sau bấm Sao lưu sẽ chạy tiếp phần còn lại.'))return;
  button.disabled=true;
  try{
    if(action==='stop'){const r=await api('/api/backup/stop',{});toast(r.stopped?'Đã gửi lệnh dừng sao lưu.':'Không có bản sao lưu nào đang chạy.');}
    else{await api('/api/backup/start',{action});toast('Đã bắt đầu sao lưu. Tiến trình chạy nền, có thể đóng trang.');}
  }catch(error){toast(error.message);}
  finally{button.disabled=false;await refreshBackup();}
}
$('#resource-view').addEventListener('click',event=>{
  if(state.view!=='backup')return;
  const files=event.target.closest('[data-backup-files]');
  if(files){const rel=files.dataset.backupFiles;state.backupOpen=state.backupOpen===rel?'':rel;renderBackup();$(`[data-backup-files="${CSS.escape(rel)}"]`)?.focus();if(state.backupOpen)loadBackupFiles(rel);return;}
  const action=event.target.closest('[data-backup-action]');if(action)backupAction(action.dataset.backupAction,action);
});
$('#resource-view').addEventListener('toggle',event=>{if(state.view==='backup'&&event.target.matches?.('.backup-log'))state.backupLogOpen=event.target.open;},true);
refreshBackup();
