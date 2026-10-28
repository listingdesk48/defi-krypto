/* Prepínač krajín. Názvy krajín sú vždy v jazyku zvolenej krajiny (berie ich priamo z prehliadača). */
(function(){
var K=[['at','de-AT','Austria'],['be','nl-BE','Belgium'],
['bg','bg','Bulgaria'],['hr','hr','Croatia'],['cz','cs','Czechia'],['dk','da','Denmark'],['ee','et','Estonia'],['fi','fi','Finland'],
['fr','fr','France'],['de','de','Germany'],['gr','el','Greece'],['hu','hu','Hungary'],['ie','en-IE','Ireland'],['it','it','Italy'],
['lv','lv','Latvia'],['lt','lt','Lithuania'],['lu','fr-LU','Luxembourg'],
['nl','nl','Netherlands'],['no','nb','Norway'],['pl','pl','Poland'],
['pt','pt-PT','Portugal'],['ro','ro','Romania'],['sk','sk','Slovakia'],
['si','sl','Slovenia'],['es','es','Spain'],['se','sv','Sweden'],['ch','de-CH','Switzerland'],['ua','uk','Ukraine'],['gb','en-GB','United Kingdom'],['us','en-US','United States']];
var L={};K.forEach(function(k){L[k[0]]=k});
/* Zatiaľ pôsobíme len na Slovensku: po načítaní stránky je vždy zvolené Slovensko. */
var cur='sk';
function nazvy(loc){var dn=null;try{if(window.Intl&&Intl.DisplayNames){if(!Intl.DisplayNames.supportedLocalesOf([loc]).length)loc='en';dn=new Intl.DisplayNames([loc],{type:'region'})}}catch(e){}
 var o={};K.forEach(function(k){var r=k[0].toUpperCase(),n=null;try{n=dn&&dn.of(r)}catch(e){}o[k[0]]=(n&&n!==r)?n:k[2]});return o}
var nat={};K.forEach(function(k){try{nat[k[0]]=new Intl.DisplayNames([k[1]],{type:'region'}).of(k[0].toUpperCase())}catch(e){nat[k[0]]=k[2]}});
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function kod(c){return c==='gb'?'UK':c.toUpperCase()}
function vykresli(){
 var loc=L[cur][1],n=nazvy(loc),col;try{col=new Intl.Collator(loc)}catch(e){col=new Intl.Collator('en')}
 var zor=K.map(function(k){return k[0]}).sort(function(a,b){return col.compare(n[a],n[b])});
 var html=zor.map(function(c){return '<a href="#" class="jz-item'+(c===cur?' je':'')+'" data-c="'+c+'" data-s="'+norm(n[c]+' '+nat[c]+' '+L[c][2])+'"><img class="fl" loading="lazy" src="img/vlajky/'+c+'.png" alt=""><span>'+n[c]+'</span></a>'}).join('');
 document.querySelectorAll('.jz-list').forEach(function(l){l.innerHTML=html});
 var ft=zor.map(function(c){return '<a href="#" class="ft-kr-item'+(c===cur?' je':'')+'" data-c="'+c+'"><img class="fl ft-kr-fl" loading="lazy" src="img/vlajky/'+c+'.png" alt=""><span>'+n[c]+'</span></a>'}).join('');
 document.querySelectorAll('.ft-krajiny').forEach(function(l){l.innerHTML=ft});
 document.querySelectorAll('.jz-cur-fl').forEach(function(f){f.src='img/vlajky/'+cur+'.png'});
 document.querySelectorAll('.jz-cur-k').forEach(function(f){f.textContent=kod(cur)});
 document.querySelectorAll('.jz-cur-nm').forEach(function(f){f.textContent=n[cur]});
 document.querySelectorAll('.jz-hlw input').forEach(function(i){i.value=''});
 document.querySelectorAll('.jz-nic').forEach(function(x){x.style.display='none'});
}
var st=document.createElement('style');
st.textContent=K.map(function(k){return '.fl-'+k[0]+'{background-image:url(img/vlajky/'+k[0]+'.svg)}'}).join('');
document.head.appendChild(st);
function zavri(){document.querySelectorAll('.jz.open').forEach(function(j){j.classList.remove('open')});var o=document.getElementById('jzOkno');if(o)o.classList.remove('open');document.documentElement.style.overflow=''}
function otvorOkno(){var o=document.getElementById('jzOkno');if(!o)return;o.classList.add('open');document.documentElement.style.overflow='hidden'}
document.addEventListener('click',function(e){
 var it=e.target.closest('.jz-item,.ft-kr-item');
 if(it){e.preventDefault();e.stopPropagation();cur=it.dataset.c;vykresli();zavri();return}
 var b=e.target.closest('.jz-btn');
 if(b){e.stopPropagation();var j=b.closest('.jz'),bol=j.classList.contains('open');zavri();if(!bol){j.classList.add('open');var i=j.querySelector('input');if(i&&window.matchMedia('(hover:hover)').matches)setTimeout(function(){i.focus()},50)}return}
 if(e.target.closest('.dr-jz')){e.stopPropagation();otvorOkno();return}
 if(e.target.closest('.jz-zavri')){zavri();return}
 if(e.target.closest('.jz-panel,.jz-okno-in'))return;
 zavri();
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')zavri()});
document.addEventListener('input',function(e){var w=e.target.closest('.jz-hlw');if(!w)return;var q=norm(e.target.value.trim()),c=0;
 w.querySelectorAll('.jz-item').forEach(function(a){var ok=!q||a.dataset.s.indexOf(q)>-1;a.classList.toggle('skry',!ok);if(ok)c++});
 var nic=w.querySelector('.jz-nic');if(nic)nic.style.display=c?'none':'block'});
vykresli();
})();
