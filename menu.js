(function(){var b=document.getElementById('pcBtn'),m=document.getElementById('pcMenu'),bg=document.querySelector('.pm-bg');if(!b||!m)return;
var it=[].slice.call(m.querySelectorAll('.pm-i'));it.forEach(function(e,i){e.style.transitionDelay=(0.04+i*0.035)+'s'});
function set(o){document.body.classList.toggle('pm-open',o);b.setAttribute('aria-expanded',o);b.querySelector('.mb-t').textContent=o?'Zavrieť':'Menu';if(!o)it.forEach(function(e){e.style.transitionDelay='0s'});else it.forEach(function(e,i){e.style.transitionDelay=(0.06+i*0.035)+'s'})}
b.addEventListener('click',function(e){e.stopPropagation();set(!document.body.classList.contains('pm-open'))});
if(bg)bg.addEventListener('click',function(){set(false)});
document.addEventListener('click',function(e){if(document.body.classList.contains('pm-open')&&!e.target.closest('#pcMenu')&&!e.target.closest('#mainNav'))set(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
m.querySelectorAll('.pm-x').forEach(function(x){x.addEventListener('click',function(){set(false)})});
})();
