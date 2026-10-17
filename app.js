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

/* ---------- 3D Starfield (Three.js) + fallback 2D ---------- */
(function(){
  var canvas=document.getElementById('stars');
  if(!canvas) return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth<640;

  /* --- coba Three.js dulu --- */
  if(window.THREE && !reduceMotion){
    try{
      var renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:false});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, isMobile?1.5:2));
      renderer.setSize(window.innerWidth,window.innerHeight);
      var scene=new THREE.Scene();
      scene.fog=new THREE.FogExp2(0x050507,0.028);
      var camera=new THREE.PerspectiveCamera(62,window.innerWidth/window.innerHeight,.1,120);
      camera.position.z=26;

      var COUNT=isMobile?900:2200;
      var pos=new Float32Array(COUNT*3), col=new Float32Array(COUNT*3);
      var lime=new THREE.Color('#C6F24E'), white=new THREE.Color('#ffffff'),
          cyan=new THREE.Color('#7dd3fc'), tmp=new THREE.Color();
      for(var i=0;i<COUNT;i++){
        var r=18+Math.random()*55, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
        pos[i*3]=r*Math.sin(ph)*Math.cos(th);
        pos[i*3+1]=r*Math.sin(ph)*Math.sin(th);
        pos[i*3+2]=r*Math.cos(ph)-20;
        var pick=Math.random();
        if(pick<.1) tmp.copy(lime); else if(pick<.16) tmp.copy(cyan); else tmp.copy(white);
        tmp.multiplyScalar(.45+Math.random()*.55);
        col[i*3]=tmp.r; col[i*3+1]=tmp.g; col[i*3+2]=tmp.b;
      }
      var geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
      geo.setAttribute('color',new THREE.BufferAttribute(col,3));
      var dotCv=document.createElement('canvas'); dotCv.width=dotCv.height=64;
      var dg=dotCv.getContext('2d'), dgrd=dg.createRadialGradient(32,32,0,32,32,32);
      dgrd.addColorStop(0,'rgba(255,255,255,1)'); dgrd.addColorStop(.4,'rgba(255,255,255,.9)');
      dgrd.addColorStop(1,'rgba(255,255,255,0)');
      dg.fillStyle=dgrd; dg.fillRect(0,0,64,64);
      var mat=new THREE.PointsMaterial({size:.85,vertexColors:true,transparent:true,
        opacity:.95,sizeAttenuation:true,depthWrite:false,map:new THREE.CanvasTexture(dotCv)});
      var stars=new THREE.Points(geo,mat);
      scene.add(stars);

      /* nebula glow sprites */
      function glow(colorHex,ox,oy,s,op){
        var cv=document.createElement('canvas'); cv.width=cv.height=128;
        var g=cv.getContext('2d'), grd=g.createRadialGradient(64,64,0,64,64,64);
        grd.addColorStop(0,colorHex); grd.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle=grd; g.fillRect(0,0,128,128);
        var tex=new THREE.CanvasTexture(cv);
        var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,opacity:op,depthWrite:false}));
        sp.position.set(ox,oy,-30); sp.scale.set(s,s,1); scene.add(sp);
      }
      glow('rgba(198,242,78,0.55)',-22,10,42,.16);
      glow('rgba(125,211,252,0.5)',24,-12,46,.13);
      glow('rgba(198,242,78,0.4)',18,16,30,.1);

      var tmx=0,tmy=0,mx=0,my=0,sy=0;
      window.addEventListener('mousemove',function(e){
        tmx=(e.clientX/window.innerWidth-.5); tmy=(e.clientY/window.innerHeight-.5);
      },{passive:true});
      window.addEventListener('scroll',function(){ sy=window.scrollY; },{passive:true});
      window.addEventListener('resize',function(){
        camera.aspect=window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth,window.innerHeight);
      });

      var t0=performance.now();
      (function loop(){
        var t=(performance.now()-t0)*.001;
        mx+=(tmx-mx)*.04; my+=(tmy-my)*.04;
        stars.rotation.y=t*.018 + mx*.35;
        stars.rotation.x=my*.25 + Math.sin(t*.1)*.02;
        camera.position.y=-(sy*.004);
        camera.lookAt(mx*4,my*3- sy*.004,0);
        renderer.render(scene,camera);
        requestAnimationFrame(loop);
      })();
      return; /* 3D sukses — selesai */
    }catch(e){ /* jatuh ke fallback 2D */ }
  }

  /* --- fallback 2D canvas --- */
  var x=canvas.getContext('2d'), W,H,s2=[],fmx=0,fmy=0,ftmx=0,ftmy=0,fsy=0;
  var N2=window.innerWidth<640?130:260;
  function rs(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
  rs(); window.addEventListener('resize',rs);
  for(var j=0;j<N2;j++) s2.push({x:Math.random(),y:Math.random(),z:Math.random()*.75+.25,
    r:Math.random()*1.3+.3,tw:Math.random()*Math.PI*2,lime:Math.random()<.12});
  window.addEventListener('mousemove',function(e){
    ftmx=(e.clientX/window.innerWidth-.5); ftmy=(e.clientY/window.innerHeight-.5);
  },{passive:true});
  window.addEventListener('scroll',function(){ fsy=window.scrollY; },{passive:true});
  (function loop2(t){
    x.clearRect(0,0,W,H);
    fmx+=(ftmx-fmx)*.045; fmy+=(ftmy-fmy)*.045;
    for(var k=0;k<s2.length;k++){
      var s=s2[k];
      var px=(((s.x-fmx*s.z*.05-fsy*.000035*s.z)%1)+1)%1*W;
      var py=(((s.y-fmy*s.z*.05)%1)+1)%1*H;
      x.globalAlpha=(.22+.78*Math.abs(Math.sin(t*.0011+s.tw)))*s.z;
      x.fillStyle=s.lime?'#C6F24E':'#ffffff';
      x.beginPath(); x.arc(px,py,s.r*s.z,0,7); x.fill();
    }
    x.globalAlpha=1;
    requestAnimationFrame(loop2);
  })(0);
})();

/* ---------- Intro ---------- */
(function(){
  var intro=document.getElementById('intro');
  if(!intro) return;
  var num=document.getElementById('introNum'),
      bar=document.getElementById('introBar'), p=0, done=false;
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
