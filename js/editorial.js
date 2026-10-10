(() => {
  const root = document.documentElement;
  try { const saved=localStorage.getItem('reading-theme'); if(saved==='light'||saved==='dark') root.dataset.theme=saved; } catch {}
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const dark=root.dataset.theme ? root.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme=dark?'light':'dark';
    try { localStorage.setItem('reading-theme',root.dataset.theme); } catch {}
  });
  const catalog=document.querySelector('[data-catalog]');
  if(!catalog) return;
  const search=document.getElementById('article-search'), topic=document.getElementById('topic-filter'), sort=document.getElementById('sort-order');
  const results=document.getElementById('article-results'), status=document.getElementById('results-status');
  const params=new URLSearchParams(location.search);
  search.value=params.get('q')||'';
  if([...topic.options].some(o=>o.value===params.get('topic'))) topic.value=params.get('topic');
  if([...sort.options].some(o=>o.value===params.get('sort'))) sort.value=params.get('sort');
  let articles;
  function link(text,href){const a=document.createElement('a');a.textContent=text;a.href=href;return a;}
  function render(){
    if(!articles)return;
    const query=search.value.trim().toLowerCase(), number=query.match(/^#?0*(\d+)$/);
    const terms=query.split(/\s+/).filter(Boolean);
    const rows=articles.filter(p=>(!catalog.dataset.period||p.date.startsWith(catalog.dataset.period))&&(!catalog.dataset.tag||p.tags.includes(catalog.dataset.tag))&&(!topic.value||p.topic===topic.value)&&(number?p.id===Number(number[1]):terms.every(t=>`${p.title} ${p.topic} ${p.tags.join(' ')} ${p.summary} ${p.text}`.toLowerCase().includes(t))));
    rows.sort(sort.value==='number'?(a,b)=>a.id-b.id:sort.value==='title'?(a,b)=>a.title.localeCompare(b.title):sort.value==='oldest'?(a,b)=>a.date.localeCompare(b.date)||a.id-b.id:(a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
    const fragment=document.createDocumentFragment();
    for(const p of rows){
      const item=document.createElement('article');item.className='catalog-item';
      const meta=document.createElement('div');meta.className='catalog-meta';
      const id=document.createElement('span');id.className='article-number';id.textContent='#'+String(p.id).padStart(3,'0');
      const date=document.createElement('time');date.textContent=p.date;date.dateTime=p.date;
      meta.append(id,link(p.topic,'/categories/'+encodeURIComponent(p.topic)+'/'),date);
      const heading=document.createElement('h2');heading.append(link(p.title,'/'+p.path));
      const summary=document.createElement('p');summary.textContent=p.summary;
      const tags=document.createElement('div');tags.className='catalog-tags';for(const t of p.tags){const tag=document.createElement('span');tag.textContent=t;tags.append(tag);}
      item.append(meta,heading,summary,tags);fragment.append(item);
    }
    results.replaceChildren(fragment);status.textContent=`显示 ${rows.length} / ${articles.length} 篇文章`;
    document.getElementById('no-results').hidden=rows.length!==0;
    const next=new URL(location.href);for(const [key,value] of [['q',search.value],['topic',topic.value],['sort',sort.value==='newest'?'':sort.value]]){if(value)next.searchParams.set(key,value);else next.searchParams.delete(key);}
    history.replaceState(null,'',next);
  }
  search.addEventListener('input',render);topic.addEventListener('change',render);sort.addEventListener('change',render);
  document.getElementById('clear-filters').addEventListener('click',()=>{search.value='';topic.value='';sort.value='newest';render();search.focus();});
  fetch('/library/articles.json').then(r=>{if(!r.ok)throw new Error('catalog unavailable');return r.json();}).then(data=>{articles=data;render();}).catch(()=>{document.getElementById('search-error').hidden=false;});
})();
