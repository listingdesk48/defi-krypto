/* Fotka v menu sa stiahne až keď sa používateľ chystá menu otvoriť (šetrí 0,3 až 1 MB pri každej stránke). Iba fotka z menu, ktoré sa otvára. */
(function(){function nacitaj(kde){var k=document.getElementById(kde);if(!k)return;k.querySelectorAll('img[data-src]').forEach(function(i){if(i.dataset.srcset)i.srcset=i.dataset.srcset;i.src=i.dataset.src;i.removeAttribute('data-src');i.removeAttribute('data-srcset')})}
[['pcBtn','pcMenu'],['navBurger','navDrawer']].forEach(function(x){var b=document.getElementById(x[0]);if(!b)return;var f=function(){nacitaj(x[1])};['pointerenter','pointerdown','focus','touchstart','click'].forEach(function(ev){b.addEventListener(ev,f,{passive:true})})});})();
(function(){var b=document.getElementById('pcBtn'),m=document.getElementById('pcMenu'),bg=document.querySelector('.pm-bg');if(!b||!m)return;
var it=[].slice.call(m.querySelectorAll('.pm-i'));it.forEach(function(e,i){e.style.transitionDelay=(0.04+i*0.035)+'s'});
function set(o){document.body.classList.toggle('pm-open',o);b.setAttribute('aria-expanded',o);b.querySelector('.mb-t').textContent=o?'Zavrieť':'Menu';if(!o)it.forEach(function(e){e.style.transitionDelay='0s'});else it.forEach(function(e,i){e.style.transitionDelay=(0.06+i*0.035)+'s'})}
b.addEventListener('click',function(e){e.stopPropagation();set(!document.body.classList.contains('pm-open'))});
if(bg)bg.addEventListener('click',function(){set(false)});
document.addEventListener('click',function(e){if(document.body.classList.contains('pm-open')&&!e.target.closest('#pcMenu')&&!e.target.closest('#mainNav'))set(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
m.querySelectorAll('.pm-x').forEach(function(x){x.addEventListener('click',function(){set(false)})});
})();
/* Ochrana fotiek a videí: bez pravého kliku, bez podržania prstom, bez ťahania myšou a bez tlačidla na stiahnutie videa. */
(function(){var s=document.createElement('style');s.textContent='img,video,picture{-webkit-user-drag:none;user-drag:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}';document.head.appendChild(s);
var M='img,video,picture,svg image';function je(t){return t&&t.closest&&t.closest(M)}
['contextmenu','dragstart'].forEach(function(ev){document.addEventListener(ev,function(e){if(je(e.target))e.preventDefault()},true)});
function vid(v){v.setAttribute('controlsList','nodownload noremoteplayback');v.disablePictureInPicture=true;v.setAttribute('disablePictureInPicture','')}
function img(i){i.setAttribute('draggable','false')}
function prejdi(k){if(!k.querySelectorAll)return;if(k.matches&&k.matches('video'))vid(k);if(k.matches&&k.matches('img'))img(k);k.querySelectorAll('video').forEach(vid);k.querySelectorAll('img').forEach(img)}
prejdi(document);new MutationObserver(function(z){z.forEach(function(m){m.addedNodes.forEach(prejdi)})}).observe(document.documentElement,{childList:true,subtree:true});})();

/* Hodnotenie 4,9 v menu: po kliknutí otvorí stránku Recenzie */
(function(){
  document.querySelectorAll('.mh:not(.mh-ph)').forEach(function(m){m.setAttribute('role','link');m.setAttribute('tabindex','0');});
  function chod(e){var m=e.target.closest&&e.target.closest('.mh');if(!m||m.classList.contains('mh-ph'))return;if(e.type==='keydown'&&e.key!=='Enter')return;e.preventDefault();e.stopPropagation();window.location.href='recenzie.html';}
  document.addEventListener('click',chod,true);document.addEventListener('keydown',chod,true);
})();
