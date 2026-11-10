/* Chủ đề hình ảnh and Phong cách animation (user 2026-11-10). Uses app.js globals ($, esc, fold, api, state, toast,
   icon). The page CSP blocks inline style attributes, so theme colours are set as CSS variables through the DOM. */
const ROLE_NAMES={background:'Nền',surface:'Mặt phụ',ink:'Chữ',muted:'Chữ phụ',accent:'Nhấn',accent2:'Nhấn 2'};
const TEXTURE_NAMES={grain:'Hạt mịn',paper:'Giấy có thớ',chalk:'Bảng phấn',glow:'Quầng sáng',marble:'Vân đá',none:'Trơn'};
const FORMAT_NAMES={short:'Short',long:'Video dài'};
const EFFORT_NAMES={1:'Nhẹ',2:'Vừa',3:'Công phu'};
const looks={data:null,format:'',query:'',favorites:false,dialog:null,edit:null,saving:false};

async function renderLooks(){
  const box=$('#resource-view');
  if(!looks.data){box.innerHTML='<p class="workflow-empty">Đang đọc thư viện…</p>';
    try{looks.data=await api('/api/looks');}catch(error){box.innerHTML=`<p class="workflow-empty">Không đọc được thư viện: ${esc(error.message)}</p>`;return;}}
  if(state.view==='themes')renderThemes();else if(state.view==='motion')renderMotion();
}
async function reloadLooks(){looks.data=await api('/api/looks');}
const themeById=id=>looks.data.themes.find(t=>t.id===id);
const styleById=id=>looks.data.styles.find(s=>s.id===id);
const projectTitle=id=>looks.data.projects.find(p=>p.id===id)?.title||id;

// Theme colours as CSS variables on a preview element.
function paint(el,t){const p=t.palette;for(const [k,v] of Object.entries(p))el.style.setProperty('--t-'+k,v);
  el.style.setProperty('--t-stroke',p[t.stroke.color]||p.accent);el.style.setProperty('--t-caption',p[t.caption.text]||p.ink);el.style.setProperty('--t-keyword',p[t.caption.keyword]||p.accent);
  el.dataset.texture=t.texture;el.classList.toggle('kw-box',Boolean(t.caption.box));}
// A small book with a sprout, drawn in the theme's stroke: the same subject in every theme so they compare fairly.
const doodle='<svg class="look-doodle" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="48" r="26" class="d-glow"/><path d="M20 86 C34 80 48 80 60 86 C72 80 86 80 100 86 L100 102 C86 96 72 96 60 102 C48 96 34 96 20 102 Z M60 86 L60 102 M60 86 C58 70 62 58 60 44 M60 66 C50 64 44 58 43 52 C50 52 58 57 60 66 Z M61 56 C70 53 76 47 77 41 C70 41 63 47 61 56 Z"/></svg>';
function caption(t){const c=t.sample.caption,k=t.sample.keyword,i=k?c.indexOf(k):-1;
  return i<0?esc(c):`${esc(c.slice(0,i))}<span class="look-kw">${esc(k)}</span>${esc(c.slice(i+k.length))}`;}
function lookStage(t,shape='tall'){return `<div class="look-stage ${shape}" data-paint="${esc(t.id)}"><span class="look-label">${esc(t.name)}</span>${doodle}<p class="look-caption">${caption(t)}</p></div>`;}
function paintAll(root){root.querySelectorAll('[data-paint]').forEach(el=>{const t=looks.edit?.id===el.dataset.paint&&looks.edit.draft?looks.edit.draft:themeById(el.dataset.paint);if(t)paint(el,t);});}

function renderThemes(){
  const box=$('#resource-view'),d=looks.data,q=fold(looks.query);
  const list=d.themes.filter(t=>(!looks.format||t.formats.includes(looks.format))&&(!q||fold([t.name,t.mood,t.description,...t.topics].join(' ')).includes(q)));
  box.innerHTML=`<div class="looks-toolbar"><label class="search-field"><span>${icon('search')}</span><input id="looks-search" type="search" autocomplete="off" placeholder="Tìm theo chủ đề muốn nói: lo âu, thói quen, khắc kỷ…" aria-label="Tìm chủ đề" value="${esc(looks.query)}"></label>
    <div class="looks-filter" role="group" aria-label="Định dạng">${[['','Tất cả'],['short','Short'],['long','Video dài']].map(([v,l])=>`<button type="button" class="chip ${looks.format===v?'active':''}" aria-pressed="${looks.format===v}" data-look-format="${v}">${l}</button>`).join('')}</div>
    <button type="button" class="button primary" data-theme-new>${icon('plus')}Thêm chủ đề</button></div>
    <p class="looks-count" role="status">${list.length} / ${d.themes.length} chủ đề · tự nhận diện được chủ đề của ${d.projects.filter(p=>p.theme).length}/${d.projects.length} dự án từ màu trong code</p>
    ${list.length?`<div class="theme-grid">${list.map(t=>`<button type="button" class="theme-card" data-theme-open="${esc(t.id)}" aria-label="Xem chủ đề ${esc(t.name)}">${lookStage(t)}
      <span class="theme-meta"><strong>${esc(t.name)}</strong><span class="theme-mood">${esc(t.mood)}</span><span class="theme-topics">Hợp: ${esc(t.topics.join(', '))}</span>
      <span class="theme-foot"><span>${t.formats.map(f=>FORMAT_NAMES[f]).join(' và ')}</span><span class="${t.usedBy.length?'in-use':''}">${t.usedBy.length?`Đang dùng: ${t.usedBy.length} dự án`:'Chưa dùng'}</span></span></span></button>`).join('')}</div>`
      :`<div class="empty-state">Không có chủ đề nào khớp. <button type="button" class="link-button" data-look-clear>Bỏ lọc</button> hoặc <button type="button" class="link-button" data-theme-new>tạo chủ đề mới</button>.</div>`}`;
  paintAll(box);
}

function renderMotion(){
  const box=$('#resource-view'),d=looks.data,q=fold(looks.query);
  const list=d.styles.filter(s=>(!looks.favorites||s.favorite)&&(!q||fold([s.name,s.summary,...s.bestFor].join(' ')).includes(q)));
  box.innerHTML=`<div class="looks-toolbar"><label class="search-field"><span>${icon('search')}</span><input id="looks-search" type="search" autocomplete="off" placeholder="Tìm theo cách dùng: câu mở, số liệu, thiền…" aria-label="Tìm phong cách" value="${esc(looks.query)}"></label>
    <div class="looks-filter" role="group" aria-label="Lọc"><button type="button" class="chip ${looks.favorites?'':'active'}" aria-pressed="${!looks.favorites}" data-look-fav="0">Tất cả</button><button type="button" class="chip ${looks.favorites?'active':''}" aria-pressed="${looks.favorites}" data-look-fav="1">Ưu tiên</button></div>
    <button type="button" class="button secondary" data-motion-all aria-pressed="false">Chạy thử tất cả</button></div>
    <p class="looks-count" role="status">${list.length} / ${d.styles.length} phong cách · tự nhận diện được phong cách của ${d.projects.filter(p=>p.style).length}/${d.projects.length} dự án từ dấu hiệu trong code</p>
    ${list.length?`<div class="theme-grid motion-grid">${list.map(s=>{const t=themeById(s.suggestedBy[0])||d.themes[0];return `<button type="button" class="theme-card motion-card" data-style-open="${esc(s.id)}" aria-label="Xem phong cách ${esc(s.name)}">
      <span class="motion-preview" data-paint="${esc(t.id)}" data-motion="${esc(s.id)}">${motionArt(s.id)}</span>
      <span class="theme-meta"><strong>${esc(s.name)}${s.favorite?' <span class="fav-mark" aria-label="ưu tiên">★</span>':''}</strong><span class="theme-mood">${esc(s.bestFor.join(', '))}</span>
      <span class="theme-foot"><span>${esc(s.pace)} · ${EFFORT_NAMES[s.effort]||s.effort}</span><span class="${s.usedBy.length?'in-use':''}">${s.usedBy.length?`Đang dùng: ${s.usedBy.length} dự án`:'Chưa dùng'}</span></span></span></button>`;}).join('')}</div>`
      :`<div class="empty-state">Chưa có phong cách nào được đánh dấu ưu tiên. <button type="button" class="link-button" data-look-fav="0">Xem tất cả</button>.</div>`}`;
  paintAll(box);
}
// Projects using a theme or style (detected from their code, or chosen), as one block that stays small however many
// projects there are: a count per series, each series a folded list of project links; a filter box once the list is
// long. Links open the project page.
function usage(ids,kind){
  if(!ids?.length)return '<p class="usage-empty">Chưa có dự án nào dùng. Video dùng màu hoặc dấu hiệu khớp sẽ tự hiện ở đây.</p>';
  const groups={};for(const id of ids){const p=looks.data.projects.find(x=>x.id===id);if(p)(groups[p.seriesTitle]||=[]).push(p);}
  const entries=Object.entries(groups).sort((a,b)=>b[1].length-a[1].length);
  return `<div class="usage-box">${ids.length>12?`<label class="usage-filter"><span class="sr-only">Lọc dự án</span><input type="search" data-usage-filter placeholder="Lọc ${ids.length} dự án…" autocomplete="off"></label>`:''}
    ${entries.map(([g,ps],i)=>`<details class="usage-series" ${entries.length===1||i===0&&ps.length<=12?'open':''}><summary><span>${esc(g)}</span><span class="usage-n">${ps.length}</span></summary>
      <ul>${ps.map(p=>`<li data-usage-title="${esc(fold(p.title))}"><a href="/#project/${encodeURIComponent(p.id)}" data-project="${esc(p.id)}">${esc(p.title)}</a>${p[kind]?.by==='chosen'?'<span class="usage-tag">bạn chọn</span>':''}</li>`).join('')}</ul></details>`).join('')}</div>`;
}
function openStyle(id){
  const s=styleById(id),t=themeById(s.suggestedBy[0])||looks.data.themes[0],dlg=ensureDialog();looks.edit=null;looks.dialog=null;
  dlg.innerHTML=`<div class="modal-heading"><div><h2 id="looks-dialog-title" tabindex="-1">${esc(s.name)}</h2><p class="modal-description">${esc(s.pace)} · độ công phu ${EFFORT_NAMES[s.effort]||s.effort}</p></div><button type="button" class="icon-button" data-looks-close aria-label="Đóng">${icon('close')}</button></div>
    <div class="look-layout"><div class="look-previews"><button type="button" class="motion-preview large is-playing" data-motion-play="${esc(s.id)}" data-paint="${esc(t.id)}" aria-label="Dừng mô phỏng" aria-pressed="true">${motionArt(s.id)}<span class="motion-hint">Dừng</span></button>
      <p class="resource-note">Khung này là mô phỏng. Mẫu thật chạy trong Studio, đổi được chủ đề ở ô props.</p></div>
    <div class="look-detail"><div class="motion-title"><p class="look-desc">${esc(s.summary)}</p><button type="button" class="star ${s.favorite?'on':''}" data-style-fav="${esc(s.id)}" aria-pressed="${s.favorite}">${s.favorite?'★ Ưu tiên':'☆ Đánh dấu ưu tiên'}</button></div>
      <dl class="look-facts"><div><dt>Hợp với</dt><dd>${esc(s.bestFor.join(', '))}</dd></div><div><dt>Nhịp</dt><dd>${esc(s.pace)}</dd></div>
        <div class="wide"><dt>Cách làm</dt><dd>${esc(s.techniques.join('; '))}</dd></div>
        <div class="wide"><dt>Chủ đề gợi ý</dt><dd>${s.suggestedBy.map(i=>`<button type="button" class="link-button" data-theme-open="${esc(i)}">${esc(themeById(i)?.name||i)}</button>`).join(', ')||'Chưa có'}</dd></div>
        <div class="wide"><dt>Đang dùng (${s.usedBy.length})</dt><dd class="usage">${usage(s.usedBy,'style')}</dd></div></dl>
      <label class="field motion-note"><span>Ghi chú của bạn</span><textarea rows="2" maxlength="1000" data-style-note="${esc(s.id)}" placeholder="Khi nào muốn dùng, điều cần tránh…">${esc(s.userNote||'')}</textarea></label>
      <div class="look-actions"><button type="button" class="button studio-button" data-style-studio="${esc(s.sample)}">${icon('play')}Xem mẫu trong Studio</button><button type="button" class="button primary" data-look-assign="style:${esc(s.id)}">Gắn cho dự án</button><span class="footer-spacer"></span><button type="button" class="button secondary" data-style-save="${esc(s.id)}" hidden>Lưu ghi chú</button></div></div></div>`;
  paintAll(dlg);looks.styleDialog=id;if(!dlg.open)dlg.showModal();dlg.querySelector('h2').focus();
}

// Simplified CSS previews of each style; the real Remotion sample opens in Studio.
function motionArt(id){
  const svg=inner=>`<svg viewBox="0 0 120 160" class="m-art m-${id}" aria-hidden="true">${inner}</svg>`;
  switch(id){
    case 'net-ve':return svg('<path class="m-draw" pathLength="1" d="M22 120 C36 114 50 114 60 120 C70 114 84 114 98 120 L98 134 C84 128 70 128 60 134 C50 128 36 128 22 134 Z M60 120 C58 100 62 86 60 66 M60 98 C48 96 42 88 41 80 C50 80 58 88 60 98 Z M61 84 C72 80 78 72 79 64 C70 64 62 72 61 84 Z"/>');
    case 'anh-tinh':return svg('<rect x="0" y="0" width="120" height="160" class="m-photo"/><path d="M0 112 L36 76 L60 96 L86 64 L120 104 L120 160 L0 160Z" class="m-hills"/><circle cx="88" cy="40" r="10" class="m-moon"/><rect x="0" y="100" width="120" height="60" class="m-fade"/>');
    case 'tranh-vector':return svg('<rect x="0" y="0" width="120" height="160" class="m-sky"/><circle cx="60" cy="90" r="30" class="m-glow"/><circle cx="60" cy="90" r="12" class="m-sunv"/><path d="M0 104 C30 92 50 100 70 106 C90 112 104 100 120 102 L120 160 L0 160Z" class="m-hill"/><path d="M0 124 C40 118 80 126 120 120 L120 160 L0 160Z" class="m-hill2"/>');
    case 'chu-chuyen-dong':return svg('<text x="60" y="64" class="m-w m-w1">Thói</text><text x="60" y="90" class="m-w m-w2">quen</text><text x="60" y="122" class="m-w m-w3 m-key">nhỏ</text><rect x="34" y="128" width="52" height="4" class="m-line"/>');
    case 'cat-giay':return svg('<circle cx="86" cy="52" r="14" class="m-sun"/><path class="m-l1" d="M0 104 C30 92 60 112 120 96 L120 160 L0 160Z"/><path class="m-l2" d="M0 120 C40 108 70 128 120 114 L120 160 L0 160Z"/><path class="m-l3" d="M0 138 C30 130 80 146 120 132 L120 160 L0 160Z"/>');
    case 'phan-bang':return svg('<circle class="m-draw m-chalk" pathLength="1" cx="60" cy="74" r="30"/><text x="60" y="82" class="m-w m-chalk-t">1%</text><path class="m-draw m-chalk2" pathLength="1" d="M26 132 C44 118 70 120 92 108 M86 104 L94 108 L88 114"/>');
    case 'bong-do':return svg('<circle cx="60" cy="96" r="38" class="m-sun"/><path d="M0 120 C40 112 80 116 120 108 L120 160 L0 160Z" class="m-ground"/><g class="m-walker"><circle cx="0" cy="-30" r="4"/><path d="M0 -26 L0 -12 M0 -12 L-4 0 M0 -12 L4 0 M0 -22 L-4 -14 M0 -22 L4 -14"/></g>');
    case 'infographic':return svg('<circle cx="60" cy="60" r="26" class="m-ring-bg"/><circle cx="60" cy="60" r="26" class="m-ring" pathLength="1"/><rect x="28" y="104" width="16" height="36" class="m-bar m-b1"/><rect x="52" y="104" width="16" height="36" class="m-bar m-b2"/><rect x="76" y="104" width="16" height="36" class="m-bar m-b3"/>');
    case 'muc-loang':return svg('<circle cx="48" cy="70" r="22" class="m-blot m-p1"/><circle cx="74" cy="84" r="16" class="m-blot m-p2"/><rect x="18" y="118" width="84" height="10" rx="5" class="m-brush"/><rect x="86" y="40" width="12" height="12" class="m-seal"/>');
    case 'hat-anh-sang':return svg('<circle cx="60" cy="80" r="30" class="m-breath"/><circle cx="60" cy="80" r="18" class="m-breath2"/>'+Array.from({length:12},(_,i)=>`<circle cx="${10+i*9}" cy="${30+(i*37)%110}" r="${1.5+(i%3)}" class="m-dot m-d${i%3}"/>`).join(''));
    case 'hinh-khoi':return svg('<rect x="38" y="58" width="44" height="44" class="m-morph"/><circle cx="60" cy="80" r="44" class="m-orbit"/>');
    case 'so-tay':return svg('<g class="m-lines">'+Array.from({length:6},(_,i)=>`<path d="M14 ${50+i*16} L106 ${50+i*16}"/>`).join('')+'</g><rect x="16" y="56" width="70" height="10" class="m-hl"/><rect x="62" y="104" width="38" height="32" class="m-note"/>');
    default:return svg('');
  }
}

// ---- theme detail / edit dialog ---------------------------------------------------------------------------
function ensureDialog(){
  let dlg=$('#looks-dialog');
  if(!dlg){dlg=document.createElement('dialog');dlg.id='looks-dialog';dlg.className='looks-dialog';dlg.setAttribute('aria-labelledby','looks-dialog-title');document.body.append(dlg);
    dlg.addEventListener('close',()=>{looks.edit=null;looks.dialog=null;looks.styleDialog=null;});dlg.addEventListener('click',onLooksClick);dlg.addEventListener('input',onDialogInput);dlg.addEventListener('change',onDialogInput);
    dlg.addEventListener('input',e=>{if(!e.target.matches('[data-usage-filter]'))return;const q=fold(e.target.value);const box=e.target.closest('.usage-box');
      box.querySelectorAll('li').forEach(li=>li.hidden=Boolean(q)&&!li.dataset.usageTitle.includes(q));box.querySelectorAll('details').forEach(d=>{const any=[...d.querySelectorAll('li')].some(li=>!li.hidden);d.hidden=!any;if(q)d.open=any;});});
    // Unsaved style note: show its save button (the note box lives in this dialog).
    dlg.addEventListener('input',e=>{const id=e.target.dataset.styleNote;if(id)dlg.querySelector(`[data-style-save="${CSS.escape(id)}"]`).hidden=e.target.value.trim()===(styleById(id).userNote||'');});}
  return dlg;
}
function openTheme(id){looks.edit=null;looks.dialog=id;const dlg=ensureDialog();renderThemeDialog();if(!dlg.open)dlg.showModal();dlg.querySelector('h2')?.focus();}
function renderThemeDialog(){
  const dlg=ensureDialog(),t=looks.edit?.draft||themeById(looks.dialog);if(!t){dlg.close();return;}
  const editing=Boolean(looks.edit),d=looks.data;
  const previews=`<div class="look-previews">${lookStage({...t,id:t.id||'_new'},'tall')}${lookStage({...t,id:t.id||'_new'},'wide')}</div>`;
  const view=`<div class="look-detail"><p class="look-desc">${esc(t.description)}</p>
    <h3>Bảng màu</h3><ul class="swatches">${Object.entries(ROLE_NAMES).map(([k,l])=>`<li><span class="swatch" data-swatch="${esc(t.palette[k])}"></span><span><strong>${l}</strong><code>${esc(t.palette[k])}</code></span></li>`).join('')}</ul>
    <dl class="look-facts"><div><dt>Không khí</dt><dd>${esc(t.mood)}</dd></div><div><dt>Hợp nói về</dt><dd>${esc(t.topics.join(', '))}</dd></div><div><dt>Định dạng</dt><dd>${t.formats.map(f=>FORMAT_NAMES[f]).join(', ')}</dd></div>
      <div><dt>Nền</dt><dd>${TEXTURE_NAMES[t.texture]}</dd></div><div><dt>Nét vẽ</dt><dd>màu ${ROLE_NAMES[t.stroke.color]}, dày ${t.stroke.width}</dd></div><div><dt>Phụ đề</dt><dd>chữ ${ROLE_NAMES[t.caption.text]}, từ khóa ${ROLE_NAMES[t.caption.keyword]}${t.caption.box?' trên dải màu':''}</dd></div>
      <div><dt>Nhạc</dt><dd>${esc(t.music)}</dd></div><div><dt>Phong cách gợi ý</dt><dd>${t.styles.map(id=>esc(styleById(id)?.name||id)).join(', ')||'Chưa chọn'}</dd></div>
      <div class="wide"><dt>Đang dùng (${t.usedBy?.length||0})</dt><dd class="usage">${usage(t.usedBy,'theme')}</dd></div></dl>
    <div class="look-actions"><button type="button" class="button primary" data-look-assign="theme:${esc(t.id)}">Gắn cho dự án</button><button type="button" class="button secondary" data-theme-edit>Sửa</button><button type="button" class="button secondary" data-theme-copy>Nhân bản</button>
      <span class="footer-spacer"></span><button type="button" class="button danger" data-theme-delete ${t.usedBy?.length?'disabled title="Đang có dự án dùng chủ đề này"':''}>Xóa</button></div></div>`;
  const opt=(v,cur,label)=>`<option value="${esc(v)}" ${v===cur?'selected':''}>${esc(label)}</option>`;
  const form=`<form class="look-form" id="look-form" novalidate><label class="field"><span>Tên chủ đề</span><input name="name" maxlength="60" required value="${esc(t.name)}"></label>
    <label class="field"><span>Không khí</span><input name="mood" maxlength="80" required value="${esc(t.mood)}"></label>
    <label class="field"><span>Mô tả</span><textarea name="description" rows="2" maxlength="400" required>${esc(t.description)}</textarea></label>
    <label class="field"><span>Hợp nói về (cách nhau bằng dấu phẩy)</span><input name="topics" maxlength="400" value="${esc(t.topics.join(', '))}"></label>
    <fieldset class="field"><legend>Bảng màu</legend><div class="color-grid">${Object.entries(ROLE_NAMES).map(([k,l])=>`<label class="color-field"><input type="color" name="palette.${k}" value="${esc(t.palette[k])}"><span>${l}<code>${esc(t.palette[k])}</code></span></label>`).join('')}</div></fieldset>
    <div class="field-row"><label class="field"><span>Nền</span><select name="texture">${Object.entries(TEXTURE_NAMES).map(([k,l])=>opt(k,t.texture,l)).join('')}</select></label>
      <label class="field"><span>Màu nét vẽ</span><select name="stroke.color">${Object.entries(ROLE_NAMES).map(([k,l])=>opt(k,t.stroke.color,l)).join('')}</select></label>
      <label class="field"><span>Độ dày nét</span><input name="stroke.width" type="number" min="1" max="8" step="0.2" value="${esc(t.stroke.width)}"></label></div>
    <div class="field-row"><label class="field"><span>Chữ phụ đề</span><select name="caption.text">${Object.entries(ROLE_NAMES).map(([k,l])=>opt(k,t.caption.text,l)).join('')}</select></label>
      <label class="field"><span>Từ khóa</span><select name="caption.keyword">${Object.entries(ROLE_NAMES).map(([k,l])=>opt(k,t.caption.keyword,l)).join('')}</select></label>
      <label class="check-field"><input type="checkbox" name="caption.box" ${t.caption.box?'checked':''}><span>Từ khóa trên dải màu</span></label></div>
    <fieldset class="field"><legend>Định dạng</legend><div class="check-row">${Object.entries(FORMAT_NAMES).map(([k,l])=>`<label class="check-field"><input type="checkbox" name="formats" value="${k}" ${t.formats.includes(k)?'checked':''}><span>${l}</span></label>`).join('')}</div></fieldset>
    <label class="field"><span>Không khí nhạc</span><input name="music" maxlength="120" required value="${esc(t.music)}"></label>
    <fieldset class="field"><legend>Phong cách animation gợi ý</legend><div class="check-row">${d.styles.map(s=>`<label class="check-field"><input type="checkbox" name="styles" value="${esc(s.id)}" ${t.styles.includes(s.id)?'checked':''}><span>${esc(s.name)}</span></label>`).join('')}</div></fieldset>
    <div class="field-row two"><label class="field"><span>Câu phụ đề mẫu</span><input name="sample.caption" maxlength="120" required value="${esc(t.sample.caption)}"></label><label class="field"><span>Từ khóa trong câu</span><input name="sample.keyword" maxlength="60" value="${esc(t.sample.keyword)}"></label></div>
    <div class="form-error" id="look-error" role="alert" tabindex="-1" hidden></div>
    <div class="look-actions"><button type="button" class="button quiet" data-theme-cancel>Hủy</button><span class="footer-spacer"></span><button type="submit" class="button primary" ${looks.saving?'disabled':''}>${looks.edit?.id?'Lưu chủ đề':'Tạo chủ đề'}</button></div></form>`;
  dlg.innerHTML=`<div class="modal-heading"><div><h2 id="looks-dialog-title" tabindex="-1">${editing?(looks.edit.id?`Sửa: ${esc(t.name)}`:'Chủ đề mới'):esc(t.name)}</h2><p class="modal-description">${editing?'Xem trước đổi theo từng thay đổi. Lưu vào src/looks/themes.json, bản cũ được giữ.':esc(t.mood)}</p></div><button type="button" class="icon-button" data-looks-close aria-label="Đóng">${icon('close')}</button></div><div class="look-layout">${previews}${editing?form:view}</div>`;
  paintAll(dlg);dlg.querySelectorAll('[data-swatch]').forEach(el=>el.style.setProperty('--sw',el.dataset.swatch));
  dlg.querySelector('#look-form')?.addEventListener('submit',saveTheme);
}
function draftFromForm(form){
  const f=new FormData(form),t=structuredClone(looks.edit.draft);
  t.name=f.get('name');t.mood=f.get('mood');t.description=f.get('description');t.topics=String(f.get('topics')||'').split(',').map(x=>x.trim()).filter(Boolean);
  for(const k of Object.keys(ROLE_NAMES))t.palette[k]=f.get('palette.'+k);
  t.texture=f.get('texture');t.stroke={color:f.get('stroke.color'),width:Number(f.get('stroke.width'))};
  t.caption={text:f.get('caption.text'),keyword:f.get('caption.keyword'),box:f.get('caption.box')==='on'};
  t.formats=f.getAll('formats');t.music=f.get('music');t.styles=f.getAll('styles');t.sample={caption:f.get('sample.caption'),keyword:f.get('sample.keyword')};
  return t;
}
// Live preview while typing: repaint and refresh the sample caption without rebuilding the form.
function onDialogInput(event){
  const form=event.target.closest('#look-form');if(!form||!looks.edit)return;
  looks.edit.draft=draftFromForm(form);const t=looks.edit.draft;
  form.querySelectorAll('.color-field').forEach(l=>{const i=l.querySelector('input');l.querySelector('code').textContent=i.value;});
  ensureDialog().querySelectorAll('.look-stage').forEach(el=>{paint(el,t);el.querySelector('.look-caption').innerHTML=caption(t);el.querySelector('.look-label').textContent=t.name;});
}
async function saveTheme(event){
  event.preventDefault();if(looks.saving)return;
  const form=event.currentTarget,err=$('#look-error');looks.edit.draft=draftFromForm(form);looks.saving=true;err.hidden=true;
  const {usedBy,...theme}=looks.edit.draft;
  try{const r=await api('/api/looks/theme',{id:looks.edit.id||'',theme,revision:looks.data.revisions.themes});
    await reloadLooks();looks.saving=false;looks.edit=null;looks.dialog=r.theme.id;renderThemeDialog();renderLooks();toast(`Đã lưu chủ đề "${r.theme.name}".`);}
  catch(error){looks.saving=false;err.textContent=error.message;err.hidden=false;err.focus();}
}

// ---- assign a theme / style to a project --------------------------------------------------------------------
function openAssign(kind,id){
  const dlg=ensureDialog(),d=looks.data,item=kind==='theme'?themeById(id):styleById(id);looks.edit=null;looks.dialog=null;
  const groups={};for(const p of d.projects)(groups[p.seriesTitle]||=[]).push(p);
  dlg.innerHTML=`<div class="modal-heading"><div><h2 id="looks-dialog-title" tabindex="-1">Gắn ${kind==='theme'?'chủ đề':'phong cách'} "${esc(item.name)}"</h2><p class="modal-description">Chỉ cần khi muốn chọn khác với điều trang tự nhận diện. Ghi vào mục dự án trong series.json (trường look); không đổi video đã dựng, agent dùng lựa chọn này khi làm.</p></div><button type="button" class="icon-button" data-looks-close aria-label="Đóng">${icon('close')}</button></div>
    <form id="assign-form" class="look-form"><label class="field"><span>Dự án</span><select name="project" required><option value="">Chọn dự án…</option>${Object.entries(groups).map(([g,ps])=>`<optgroup label="${esc(g)}">${ps.map(p=>`<option value="${esc(p.id)}">${esc(p.title)}${p.look?.[kind]?` (đang: ${esc((kind==='theme'?themeById(p.look.theme):styleById(p.look.style))?.name||p.look[kind])})`:''}</option>`).join('')}</optgroup>`).join('')}</select></label>
      <div class="form-error" id="assign-error" role="alert" tabindex="-1" hidden></div>
      <div class="look-actions"><button type="button" class="button quiet" data-looks-close>Hủy</button><span class="footer-spacer"></span><button type="submit" class="button primary">Gắn cho dự án</button></div></form>`;
  if(!dlg.open)dlg.showModal();dlg.querySelector('select').focus();
  dlg.querySelector('#assign-form').addEventListener('submit',async e=>{e.preventDefault();const project=new FormData(e.currentTarget).get('project'),err=$('#assign-error');if(!project){err.textContent='Hãy chọn một dự án.';err.hidden=false;return;}
    try{const {revision}=await api('/api/looks/series-revision?id='+encodeURIComponent(project));await api('/api/looks/project',{project,[kind]:id,revision});await reloadLooks();dlg.close();renderLooks();toast(`Đã gắn "${item.name}" cho ${projectTitle(project)}.`);}
    catch(error){err.textContent=error.message;err.hidden=false;err.focus();}});
}

// ---- events -------------------------------------------------------------------------------------------------
async function onLooksClick(event){
  if(event.target.closest('a[data-project]')){const d=$('#looks-dialog');if(d?.open)d.close();return;}
  const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.lookFormat!==undefined){looks.format=b.dataset.lookFormat;renderLooks();}
  else if(b.dataset.lookFav!==undefined){looks.favorites=b.dataset.lookFav==='1';renderLooks();}
  else if(b.hasAttribute('data-look-clear')){looks.query='';looks.format='';renderLooks();}
  else if(b.dataset.themeOpen){openTheme(b.dataset.themeOpen);}
  else if(b.dataset.styleOpen){openStyle(b.dataset.styleOpen);}
  else if(b.hasAttribute('data-theme-new')){const base=looks.data.themes[0];looks.dialog=null;looks.edit={id:'',draft:{...structuredClone(base),id:'',name:'Chủ đề mới',usedBy:[]}};const dlg=ensureDialog();renderThemeDialog();if(!dlg.open)dlg.showModal();dlg.querySelector('input[name=name]').select();}
  else if(b.hasAttribute('data-theme-edit')){const t=themeById(looks.dialog);looks.edit={id:t.id,draft:structuredClone(t)};renderThemeDialog();ensureDialog().querySelector('input[name=name]').focus();}
  else if(b.hasAttribute('data-theme-copy')){const t=themeById(looks.dialog);looks.edit={id:'',draft:{...structuredClone(t),id:'',name:t.name+' (bản sao)',usedBy:[]}};renderThemeDialog();ensureDialog().querySelector('input[name=name]').select();}
  else if(b.hasAttribute('data-theme-cancel')){if(looks.edit?.id||looks.dialog){looks.edit=null;renderThemeDialog();}else ensureDialog().close();}
  else if(b.hasAttribute('data-theme-delete')){const t=themeById(looks.dialog);if(!confirm(`Xóa chủ đề "${t.name}"? Bản cũ của danh sách vẫn được giữ trong lịch sử.`))return;
    try{await api('/api/looks/theme-delete',{id:t.id,revision:looks.data.revisions.themes});await reloadLooks();ensureDialog().close();renderLooks();toast(`Đã xóa chủ đề "${t.name}".`);}catch(error){toast(error.message);}}
  else if(b.hasAttribute('data-looks-close')){ensureDialog().close();}
  else if(b.dataset.lookAssign){const [kind,id]=b.dataset.lookAssign.split(':');openAssign(kind,id);}
  else if(b.dataset.styleStudio){b.disabled=true;try{const r=await api('/api/studio-look',{composition:b.dataset.styleStudio});window.open(r.url,'_blank','noopener');}catch(error){toast(error.message);}finally{b.disabled=false;}}
  else if(b.dataset.styleFav){const s=styleById(b.dataset.styleFav);await saveStyle(s,{favorite:!s.favorite});}
  else if(b.dataset.styleSave){const s=styleById(b.dataset.styleSave),text=$(`[data-style-note="${CSS.escape(s.id)}"]`).value;await saveStyle(s,{userNote:text});}
  else if(b.dataset.motionPlay){const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));b.classList.toggle('is-playing',on);b.querySelector('.motion-hint').textContent=on?'Dừng':'Chạy thử';b.setAttribute('aria-label',on?'Dừng mô phỏng':'Chạy mô phỏng');}
  else if(b.hasAttribute('data-motion-all')){const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));b.textContent=on?'Dừng tất cả':'Chạy thử tất cả';
    document.querySelectorAll('#resource-view [data-motion]').forEach(p=>p.classList.toggle('is-playing',on));}
}
async function saveStyle(s,change){
  try{await api('/api/looks/style-note',{id:s.id,userNote:change.userNote??s.userNote??'',favorite:change.favorite??s.favorite,revision:looks.data.revisions.styles});await reloadLooks();renderLooks();if(ensureDialog().open&&looks.styleDialog===s.id)openStyle(s.id);toast(change.userNote!==undefined?'Đã lưu ghi chú.':'Đã cập nhật ưu tiên.');}
  catch(error){toast(error.message);}
}
document.addEventListener('DOMContentLoaded',()=>{
  const box=$('#resource-view');
  box.addEventListener('click',event=>{if(state.view==='themes'||state.view==='motion')onLooksClick(event);});
  // A style card runs its preview while hovered or focused (unless "Chạy thử tất cả" already runs them all).
  const hover=(on,event)=>{const card=event.target.closest?.('.motion-card');if(!card||card.contains(event.relatedTarget))return;
    if(document.querySelector('[data-motion-all]')?.getAttribute('aria-pressed')!=='true')card.querySelector('.motion-preview').classList.toggle('is-playing',on);};
  box.addEventListener('mouseover',e=>hover(true,e));box.addEventListener('mouseout',e=>hover(false,e));box.addEventListener('focusin',e=>hover(true,e));box.addEventListener('focusout',e=>hover(false,e));
  box.addEventListener('input',event=>{
    if(event.target.id==='looks-search'){looks.query=event.target.value;clearTimeout(looks.timer);looks.timer=setTimeout(()=>{const pos=event.target.selectionStart;renderLooks();const i=$('#looks-search');i.focus();i.setSelectionRange(pos,pos);},200);}
  });
});
