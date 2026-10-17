/* ============================================================
   MAGERWEB® — Cosmic interactions
   starfield · intro · clock · reveal · faq · nav
   ============================================================ */
(function(){
'use strict';

/* ---------- Lucide ---------- */
function initIcons(){
  if(window.lucide && typeof window.lucide.createIcons==='function'){
    try{ window.lucide.createIcons(); }catch(e){}
  }
}
initIcons();
if(document.fonts && document.fonts.ready){ document.fonts.ready.then(initIcons); }

/* ---------- Starfield ---------- */
(function(){
  var c=document.getElementById('stars');
  if(!c) return;
  var x=c.getContext('2d'), W,H,stars=[],mx=0,my=0,tmx=0,tmy=0,sy=0;
  var N = window.innerWidth<640 ? 130 : 260;
  function rs(){ W=c.width=window.innerWidth; H=c.height=window.innerHeight; }
  rs(); window.addEventListener('resize',rs);
  for(var i=0;i<N;i++){
    stars.push({
      x:Math.random(), y:Math.random(),
      z:Math.random()*.75+.25,
      r:Math.random()*1.3+.3,
      tw:Math.random()*Math.PI*2,
      lime:Math.random()<.12   /* segelintir bintang lime */
    });
  }
  window.addEventListener('mousemove',function(e){
    tmx=(e.clientX/window.innerWidth-.5); tmy=(e.clientY/window.innerHeight-.5);
  },{passive:true});
  window.addEventListener('scroll',function(){ sy=window.scrollY; },{passive:true});
  var shooting=null, nextShoot=0;
  function loop(t){
    x.clearRect(0,0,W,H);
    mx+=(tmx-mx)*.045; my+=(tmy-my)*.045;
    var i,s,px,py,a;
    for(i=0;i<stars.length;i++){
      s=stars[i];
      px=(((s.x - mx*s.z*.05 - sy*.000035*s.z)%1)+1)%1*W;
      py=(((s.y - my*s.z*.05)%1)+1)%1*H;
      a=(.22+.78*Math.abs(Math.sin(t*.0011+s.tw)))*s.z;
      x.globalAlpha=a;
      x.fillStyle=s.lime ? '#C6F24E' : '#ffffff';
      x.beginPath(); x.arc(px,py,s.r*s.z,0,7); x.fill();
    }
    /* shooting star sesekali */
    if(!shooting && t>nextShoot){
      shooting={x:Math.random()*W*.7+W*.15, y:Math.random()*H*.3,
                vx:-(6+Math.random()*5), vy:3+Math.random()*2, life:1};
      nextShoot=t+9000+Math.random()*14000;
    }
    if(shooting){
      var sh=shooting;
      x.globalAlpha=sh.life*.9;
      var grad=x.createLinearGradient(sh.x,sh.y,sh.x-sh.vx*12,sh.y-sh.vy*12);
      grad.addColorStop(0,'#C6F24E'); grad.addColorStop(1,'transparent');
      x.strokeStyle=grad; x.lineWidth=1.6;
      x.beginPath(); x.moveTo(sh.x,sh.y);
      x.lineTo(sh.x-sh.vx*12, sh.y-sh.vy*12); x.stroke();
      sh.x+=sh.vx; sh.y+=sh.vy; sh.life-=.02;
      if(sh.life<=0||sh.x<0||sh.y>H) shooting=null;
    }
    x.globalAlpha=1;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ---------- Intro ---------- */
(function(){
  var intro=document.getElementById('intro');
  if(!intro) return;
  var num=document.getElementById('introNum'),
      bar=document.getElementById('introBar'),
      pct=document.getElementById('introPct'), p=0, done=false;
  function finish(){
    if(done) return; done=true;
    intro.classList.add('gone');
    var heroRvs=document.querySelectorAll('.hero .rv');
    for(var i=0;i<heroRvs.length;i++){
      (function(el,j){ setTimeout(function(){ el.classList.add('in'); },160+j*130); })(heroRvs[i],i);
    }
  }
  var iv=setInterval(function(){
    p=Math.min(100, p+Math.random()*15+7);
    if(bar) bar.style.width=p+'%';
    if(pct) pct.textContent=Math.floor(p);
    if(num) num.textContent=String(Math.floor(p/100*999)+1).padStart(3,'0');
    if(p>=100){ clearInterval(iv); setTimeout(finish,380); }
  },130);
  setTimeout(finish,4200); /* failsafe */
})();

/* ---------- Clock + date ---------- */
(function(){
  var el=document.getElementById('clock');
  function tick(){
    if(!el) return;
    var d=new Date(), h=String(d.getHours()).padStart(2,'0'), m=String(d.getMinutes()).padStart(2,'0');
    el.textContent=h+':'+m+' WIB';
  }
  tick(); setInterval(tick,15000);
  var hd=document.getElementById('heroDate');
  if(hd){
    try{ hd.textContent=new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}).toUpperCase(); }
    catch(e){ hd.textContent=''; }
  }
})();

/* ---------- Navbar ---------- */
(function(){
  var nav=document.getElementById('nav');
  function onScroll(){ nav.classList.toggle('scrolled', window.scrollY>30); }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  var burger=document.getElementById('navBurger'), links=document.getElementById('navLinks');
  function closeMenu(){
    burger.classList.remove('open'); links.classList.remove('open');
    burger.setAttribute('aria-expanded','false'); document.body.style.overflow='';
  }
  burger.addEventListener('click',function(){
    var open=links.classList.toggle('open');
    burger.classList.toggle('open',open);
    burger.setAttribute('aria-expanded',open?'true':'false');
    document.body.style.overflow=open?'hidden':'';
  });

  document.querySelectorAll('[data-scroll]').forEach(function(a){
    a.addEventListener('click',function(e){
      var id=a.getAttribute('href');
      if(id && id.charAt(0)==='#'){
        var t=document.querySelector(id);
        if(t){ e.preventDefault(); closeMenu(); t.scrollIntoView({behavior:'smooth',block:'start'}); }
      }
    });
  });
})();

/* ---------- Reveal on scroll ---------- */
(function(){
  var els=document.querySelectorAll('.rv');
  /* hero .rv di-handle intro; skip di sini */
  var rest=[];
  els.forEach(function(el){ if(!el.closest('.hero')) rest.push(el); });
  if(!('IntersectionObserver' in window)){ rest.forEach(function(el){ el.classList.add('in'); }); return; }
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  },{threshold:.1,rootMargin:'0px 0px -6% 0px'});
  rest.forEach(function(el){ io.observe(el); });
})();

/* ---------- FAQ accordion ---------- */
(function(){
  document.querySelectorAll('.faq-item').forEach(function(item){
    var q=item.querySelector('.faq-q'), a=item.querySelector('.faq-a');
    q.addEventListener('click',function(){
      var isOpen=item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(o){
        o.classList.remove('open');
        o.querySelector('.faq-a').style.maxHeight=null;
        o.querySelector('.faq-q').setAttribute('aria-expanded','false');
      });
      if(!isOpen){
        item.classList.add('open');
        a.style.maxHeight=a.scrollHeight+'px';
        q.setAttribute('aria-expanded','true');
      }
    });
  });
})();

/* ---------- To top ---------- */
(function(){
  var b=document.getElementById('toTop');
  if(b) b.addEventListener('click',function(){ window.scrollTo({top:0,behavior:'smooth'}); });
})();

})();
