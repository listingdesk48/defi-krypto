/* Stav prihlásenia na každej stránke. Pýta sa servera (/api/ja), nastaví triedu "prihlaseny" na <body>,
   doplní meno do hlavičky a menu a obslúži Odhlásiť sa. Výsledok je v window.KV_JA (Promise). */
(function(){
  function inic(m,p){return ((m||'').charAt(0)+(p||'').charAt(0)).toUpperCase()||'?'}
  var H=document.documentElement;
  window.KV_PRIHLAS=function(ja){
    H.classList.add('prihlaseny');document.body.classList.add('prihlaseny');
    try{localStorage.setItem('kv-ja',JSON.stringify({meno:ja.meno,priezvisko:ja.priezvisko,stav:ja.stav,schvalena_suma:ja.schvalena_suma,poplatok_uhradeny:ja.poplatok_uhradeny}))}catch(e){}
    var a=document.getElementById('navInic'),b=document.getElementById('drInic'),c=document.getElementById('navMeno'),d=document.getElementById('drMeno');
    if(a)a.textContent=inic(ja.meno,ja.priezvisko);if(b)b.textContent=inic(ja.meno,ja.priezvisko);
    /* Po schválení ukáže čierne tlačidlo v hlavičke schválenú sumu namiesto mena. V menu ostáva meno. */
    var fmt=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
    var ok=ja.stav==='schvalene'&&ja.schvalena_suma;
    /* Pred schválením a po zrušení ukáže tlačidlo stav žiadosti, rovnako ako v účte. */
    var zv=!!ja.poplatok_uhradeny;window.KV_SUMA_TXT=zv?'Zverejnené':ok?fmt(ja.schvalena_suma)+' €':ja.stav==='posudzuje'?'Posudzuje sa':ja.stav==='zrusene'?'Zrušené':null;H.setAttribute('data-stav',zv?'zverejnene':(ja.stav||''));window.KV_MENO=ja.meno||'';window.KV_HLAVA();if(d)d.textContent=(ja.meno||'')+' '+(ja.priezvisko||'');
  };
  /* Skrytie sumy (očko v účte). Pamätá sa v tomto prehliadači. */
  window.KV_HLAVA=function(){var c=document.getElementById('navMeno');if(!c)return;c.textContent=window.KV_SUMA_TXT||window.KV_MENO||''};
  window.KV_ODHLAS=function(){
    try{localStorage.removeItem('kv-ja')}catch(e){}
    fetch('/api/odhlasenie',{method:'POST'}).catch(function(){}).then(function(){window.location.href='/'});
  };
  /* Zapamätaný stav z minula sa ukáže hneď, aby hlavička nepreblikla. Server ho vzápätí potvrdí alebo zruší. */
  try{var z=JSON.parse(localStorage.getItem('kv-ja')||'null');if(z)window.KV_PRIHLAS(z)}catch(e){}
  window.KV_JA=fetch('/api/ja',{credentials:'same-origin',cache:'no-store'}).then(function(r){return r.json()}).catch(function(){return {prihlaseny:false}});
  window.KV_JA.then(function(ja){
    if(ja.prihlaseny)window.KV_PRIHLAS(ja);else{H.classList.remove('prihlaseny');document.body.classList.remove('prihlaseny');try{localStorage.removeItem('kv-ja')}catch(e){}}
    var stranka=location.pathname.split('/').pop().replace(/\.html$/,'');
    if(stranka==='ucet'&&!ja.prihlaseny)window.location.replace('/prihlasenie');
    if(stranka==='prihlasenie'&&ja.prihlaseny)window.location.replace('/ucet');
  });
  document.addEventListener('click',function(e){var o=e.target.closest('#drOdhlasit,[data-odhlasit]');if(o){e.preventDefault();window.KV_ODHLAS()}});
})();
