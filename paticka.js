/* Pätička: časti sa jemne objavia, keď k nim doscrolujete. */
(function(){
var z=document.querySelectorAll('.pt-zjav');
if(!z.length)return;
if(!('IntersectionObserver' in window)){z.forEach(function(x){x.classList.add('vid')});return}
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('vid');io.unobserve(x.target)}})},{threshold:.12});
z.forEach(function(x){io.observe(x)});
})();
