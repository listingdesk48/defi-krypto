/* Stav prihlásenia na každej stránke. Pýta sa servera (/api/ja), nastaví triedu "prihlaseny" na <body>,
   doplní meno do hlavičky a menu a obslúži Odhlásiť sa. Výsledok je v window.KV_JA (Promise). */
(function(){
  function inic(m,p){return ((m||'').charAt(0)+(p||'').charAt(0)).toUpperCase()||'?'}
  window.KV_PRIHLAS=function(ja){
    document.body.classList.add('prihlaseny');
    var a=document.getElementById('navInic'),b=document.getElementById('drInic'),c=document.getElementById('navMeno'),d=document.getElementById('drMeno');
    if(a)a.textContent=inic(ja.meno,ja.priezvisko);if(b)b.textContent=inic(ja.meno,ja.priezvisko);
    /* Po schválení ukáže čierne tlačidlo v hlavičke schválenú sumu namiesto mena. V menu ostáva meno. */
    var fmt=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
    var ok=ja.stav==='schvalene'&&ja.schvalena_suma;
    if(c)c.textContent=ok?fmt(ja.schvalena_suma)+' €':(ja.meno||'');if(d)d.textContent=(ja.meno||'')+' '+(ja.priezvisko||'');
  };
  window.KV_ODHLAS=function(){
    fetch('/api/odhlasenie',{method:'POST'}).catch(function(){}).then(function(){window.location.href='index.html'});
  };
  window.KV_JA=fetch('/api/ja',{credentials:'same-origin',cache:'no-store'}).then(function(r){return r.json()}).catch(function(){return {prihlaseny:false}});
  window.KV_JA.then(function(ja){
    if(ja.prihlaseny)window.KV_PRIHLAS(ja);else document.body.classList.remove('prihlaseny');
    var stranka=location.pathname.split('/').pop();
    if(stranka==='ucet.html'&&!ja.prihlaseny)window.location.replace('prihlasenie.html');
    if(stranka==='prihlasenie.html'&&ja.prihlaseny)window.location.replace('ucet.html');
  });
  document.addEventListener('click',function(e){var o=e.target.closest('#drOdhlasit,[data-odhlasit]');if(o){e.preventDefault();window.KV_ODHLAS()}});
})();
