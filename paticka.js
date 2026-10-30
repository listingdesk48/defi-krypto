/* Pätička: časti sa jemne objavia, keď k nim doscrolujete. */
(function(){
var z=document.querySelectorAll('.pt-zjav');
if(!z.length)return;
if(!('IntersectionObserver' in window)){z.forEach(function(x){x.classList.add('vid')});return}
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('vid');io.unobserve(x.target)}})},{threshold:.12});
z.forEach(function(x){io.observe(x)});
})();

/* Zákaz kopírovania textu v pätičke a v obchodných podmienkach. */
(function(){
function chr(e){var t=e.target;return t&&t.closest&&t.closest('.pt, .pt-txt')}
['copy','cut','contextmenu','selectstart','dragstart'].forEach(function(ev){
document.addEventListener(ev,function(e){
if(ev==='copy'||ev==='cut'){var sel=window.getSelection&&window.getSelection();if(sel&&sel.rangeCount){var n=sel.getRangeAt(0).commonAncestorContainer;n=n.nodeType===1?n:n.parentNode;if(n&&n.closest&&n.closest('.pt, .pt-txt')){e.preventDefault();return}}}
if(chr(e))e.preventDefault();
},true)});
})();
