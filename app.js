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

/* ---------- EMBED MODE (?embed=1): demo di dalam iframe ----------
   Mencegah iframe bersarang + meringankan efek di dalam demo. */

/* ============ TEXT SCRAMBLE — signature animation ============
   Pakai: scramble(el) atau tambah class .scramble ke heading.
   Hormat prefers-reduced-motion. Sekali jalan per elemen. */
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GLYPHS='!<>-_\\/[]{}=+*^?#@$%&';
  function scrambleText(node, done){
    var orig=node.textContent;
    if(!orig.trim()){ done(); return; }
    var len=orig.length, frame=0;
    var q=[];
    for(var i=0;i<len;i++) q.push({c:orig[i], start:(Math.random()*15)|0, end:((Math.random()*15)|0)+18});
    var startMs=performance.now();
    (function update(){
      // safety: paksa selesai setelah 3 detik
      if(performance.now()-startMs>3000){ node.textContent=orig; done(); return; }
      var out='', n=0;
      for(var i=0;i<len;i++){
        if(frame>=q[i].end){ n++; out+=q[i].c; }
        else if(frame>=q[i].start){ out+=GLYPHS[(Math.random()*GLYPHS.length)|0]; }
        else { n++; out+=q[i].c; }
      }
      node.textContent=out;
      if(n===len){ node.textContent=orig; done(); }
      else { frame++; requestAnimationFrame(update); }
    })();
  }
  function scrambleEl(el){
    if(el.dataset.scrambled || reduceMotion) return;
    el.dataset.scrambled='1';
    // kumpulkan text nodes (termasuk dalam <em>, <br> diskip)
    var nodes=[];
    (function walk(n){
      for(var i=0;i<n.childNodes.length;i++){
        var c=n.childNodes[i];
        if(c.nodeType===3 && c.textContent.trim()) nodes.push(c);
        else if(c.nodeType===1 && c.tagName!=='BR') walk(c);
      }
    })(el);
    var pending=nodes.length;
    if(!pending) return;
    nodes.forEach(function(nd){
      scrambleText(nd, function(){ if(--pending===0){} });
    });
  }
  window.scramble=scrambleEl;
  // auto: semua .scramble saat masuk viewport (sekali)
  if(!reduceMotion && 'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          io.unobserve(e.target);
          if(!e.target.dataset.scrambled) scrambleEl(e.target);
        }
      });
    },{threshold:.4});
    document.addEventListener('DOMContentLoaded',function(){
      document.querySelectorAll('.scramble').forEach(function(el){ io.observe(el); });
    });
  }
})();

var EMBED_MODE = /[?&]embed=1/.test(location.search);

/* ---------- 3D COSMIC JOURNEY: black hole → wormhole → tesseract ---------- */

/* Main-thread 3D fallback (jika worker gagal) */
function initMainThread3D(canvas, isMobile){
  try{
    var renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:!isMobile});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, isMobile?1.5:2));
    renderer.setSize(window.innerWidth,window.innerHeight);
    var scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x060503,0.011);
    var camera=new THREE.PerspectiveCamera(62,window.innerWidth/window.innerHeight,.1,900);
    // Black hole (fallback sederhana)
    var bh=new THREE.Group();
    bh.add(new THREE.Mesh(new THREE.SphereGeometry(3.2,32,32),
      new THREE.MeshBasicMaterial({color:0x000000})));
    var disk=new THREE.Mesh(new THREE.RingGeometry(3.7,8.6,64),
      new THREE.MeshBasicMaterial({color:0xE9A13B,transparent:true,opacity:.9,side:THREE.DoubleSide}));
    disk.rotation.x=-Math.PI/2.25; bh.add(disk);
    var halo=new THREE.Mesh(new THREE.RingGeometry(3.4,10.5,64),
      new THREE.MeshBasicMaterial({color:0xd98a3a,transparent:true,opacity:.16,
        side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
    halo.rotation.x=-Math.PI/2.25; bh.add(halo);
    scene.add(bh);
    // Tesseract fallback: rak buku sederhana di koridor
    var tess=new THREE.Group();
    tess.add(new THREE.AmbientLight(0x9a7a55,1.1));
    var key=new THREE.DirectionalLight(0xffd9a0,1.4); key.position.set(12,18,8); tess.add(key);
    var wood=new THREE.MeshStandardMaterial({color:0x9a6535,roughness:.7});
    var shelfG=new THREE.BoxGeometry(4.4,.22,1.3);
    var dummy=new THREE.Object3D(); var n=0;
    var fallShelf=new THREE.InstancedMesh(shelfG,wood,200);
    for(var z=-190;z>=-600&&n<200;z-=16){
      for(var sd=0;sd<4&&n<200;sd++){
        dummy.rotation.set(0,0,0); dummy.scale.set(1,1,1);
        if(sd===0) dummy.position.set(-7,(n%3-1)*2.6,z);
        else if(sd===1) dummy.position.set(7,(n%3-1)*2.6,z);
        else if(sd===2) dummy.position.set((n%3-1)*2.6,7,z);
        else dummy.position.set((n%3-1)*2.6,-7,z);
        dummy.updateMatrix(); fallShelf.setMatrixAt(n++,dummy.matrix);
      }
    }
    fallShelf.count=n; fallShelf.instanceMatrix.needsUpdate=true;
    tess.add(fallShelf); tess.visible=false; scene.add(tess);
    // Stars
    var sc=isMobile?700:1600, sp=new Float32Array(sc*3);
    for(var i=0;i<sc;i++){sp[i*3]=(Math.random()-.5)*420;sp[i*3+1]=(Math.random()-.5)*420;sp[i*3+2]=40-Math.random()*480;}
    var sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
    var stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xcfd8ff,size:.75,transparent:true,opacity:.85}));
    scene.add(stars);
    var journey=0, tj=0;
    window.addEventListener('scroll',function(){
      var max=document.documentElement.scrollHeight-window.innerHeight;
      tj=max>0?window.scrollY/max:0;
    },{passive:true});
    (function anim(t){
      requestAnimationFrame(anim);
      journey+=(tj-journey)*.08;
      var time=(t||0)*.001, j=journey;
      if(j<.30){
        var p=j/.30, e=p*p*(3-2*p);
        camera.position.set(0,0,30-e*26); camera.lookAt(0,.4,0);
        var s=(1+e*2.1)*(1+Math.sin(time*.8)*.015); bh.scale.set(s,s,s);
        bh.visible=true; tess.visible=false; stars.visible=true;
        disk.rotation.z=time*.12;
      } else if(j<.44){
        var p2=(j-.30)/.14;
        camera.position.set(0,.3,4-p2*10); camera.lookAt(0,.4,-20);
        camera.fov=62+Math.sin(p2*Math.PI)*43; camera.updateProjectionMatrix();
        var ffs=3.1*(1+p2*4); bh.scale.set(ffs,ffs,ffs); stars.visible=true;
      } else {
        var p3=(j-.44)/.56;
        camera.position.set(0,Math.sin(time*.25)*.12,-172-p3*380);
        camera.lookAt(0,0,-212-p3*380);
        camera.fov=62; camera.updateProjectionMatrix();
        bh.visible=false; stars.visible=false; tess.visible=true;
      }
      renderer.render(scene,camera);
    })();
  }catch(e){}
}

(function(){
  var canvas=document.getElementById('stars');
  if(!canvas) return;
  if(EMBED_MODE){ return; }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth<640;
  if(reduceMotion || !window.THREE) return;

  var journey=0, targetJourney=0, worker=null, useWorker=false;

  function onScroll(){
    var max=document.documentElement.scrollHeight-window.innerHeight;
    targetJourney=max>0?window.scrollY/max:0;
    if(useWorker && worker) worker.postMessage({type:'scroll', journey:targetJourney});
  }

  // Coba Web Worker + OffscreenCanvas
  function initWorker(){
    try{
      if(!window.Worker || !canvas.transferControlToOffscreen) return false;
      worker=new Worker('worker-3d.js');
      var off=canvas.transferControlToOffscreen();
      var ready=false;
      worker.onmessage=function(e){
        if(e.data.type==='ready'){ ready=true; }
        else if(e.data.type==='error'){ initFallback(); }
      };
      worker.onerror=function(){ initFallback(); };
      worker.postMessage({type:'init', canvas:off,
        width:window.innerWidth, height:window.innerHeight,
        dpr:window.devicePixelRatio||1, isMobile:isMobile}, [off]);
      // Timeout: jika worker tidak ready dalam 5 detik, fallback
      setTimeout(function(){ if(!ready) initFallback(); }, 5000);
      useWorker=true;
      // Worker aktif = satu-satunya renderer 3D. Matikan ray-tracer #bh (hemat GPU).
      window.__worker3D=true;
      var bhc=document.getElementById('bh');
      if(bhc) bhc.style.display='none';
      window.addEventListener('scroll', onScroll, {passive:true});
      window.addEventListener('resize', function(){
        if(worker) worker.postMessage({type:'resize', width:window.innerWidth, height:window.innerHeight});
      });
      document.addEventListener('visibilitychange', function(){
        if(!worker) return;
        worker.postMessage({type: document.hidden?'pause':'resume'});
      });
      return true;
    }catch(e){ return false; }
  }

  // Fallback: render di main thread (kode 3D yang sudah ada)
  function initFallback(){
    if(worker){ try{worker.terminate();}catch(e){} worker=null; }
    useWorker=false;
    startMainThread();
  }

  function startMainThread(){
    // (implementasi main-thread dipindah ke fungsi terpisah di bawah)
    initMainThread3D(canvas, isMobile);
  }

  if(!initWorker()){
    initFallback();
  } else {
    // Worker mode: tetap perlu scroll listener awal
    onScroll();
  }
})();

/* ---------- TEXT DIVE: hero text jatuh ke dalam black hole saat scroll ----------
   progress 0→1 selama 85% viewport pertama:
   scale 1→0.18, melayang ke pusat black hole (~42% viewport), fade + blur */
(function(){
  var wrap=document.querySelector('.hero .wrap');
  var prompt=document.querySelector('.hero-scroll');
  var divePrompt=document.querySelector('.dive-prompt');
  if(!wrap) return;
  var reduceM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceM) return;
  var ticking=false;
  function update(){
    ticking=false;
    var vh=window.innerHeight;
    var p=Math.max(0,Math.min(1,window.scrollY/(vh*0.85)));
    if(p<=0.001){
      wrap.style.transform=''; wrap.style.opacity=''; wrap.style.filter='';
    } else {
      var e=p*p*(3-2*p); // smoothstep
      var scale=1-e*0.82;
      var dy=-e*vh*0.10;  // hanyut ke atas, menuju pusat black hole
      wrap.style.transform='translateY('+dy.toFixed(1)+'px) scale('+scale.toFixed(3)+')';
      wrap.style.opacity=String(Math.max(0,1-e*0.97));
      wrap.style.filter=e>0.02?('blur('+(e*7).toFixed(1)+'px)'):'';
    }
    var pp=Math.max(0,Math.min(1,window.scrollY/(vh*0.22)));
    if(prompt) prompt.style.opacity=String(1-pp);
    if(divePrompt) divePrompt.style.opacity=String(1-Math.max(0,Math.min(1,window.scrollY/(vh*0.3))));
  }
  window.addEventListener('scroll',function(){
    if(!ticking){ ticking=true; requestAnimationFrame(update); }
  },{passive:true});
  update();
})();

/* ---------- Intro ---------- */
(function(){
  /* ===== BIG BANG: ledakan kosmik — flash inti + shockwave + burst partikel =====
     Fase 1 (0–0.7s):   inti putih panas meledak, shockwave mengembang
     Fase 2 (0.7–3.5s): partikel burst keluar dengan trail, warna mendingin
                         putih → emas → ungu → biru, lalu merajut cosmic web */
  (function(){
    var bc=document.getElementById('bangCanvas');
    if(!bc) return;
    var bctx=bc.getContext('2d'), BW, BH, pts=[];
    var reduceM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function bresize(){ BW=bc.width=window.innerWidth; BH=bc.height=window.innerHeight; }
    bresize(); window.addEventListener('resize',bresize);
    var isMob=window.innerWidth<640;
    var N=isMob?90:170;
    for(var i=0;i<N;i++){
      var a=Math.random()*Math.PI*2;
      // kecepatan burst: cepat di awal, melambat (easing alami via pow)
      pts.push({a:a, v:.55+Math.random()*1.15, s:Math.random()*2.2+.6,
        hue:20+Math.random()*300, tw:Math.random()*6.28});
    }
    var bt0=performance.now();
    var DUR=3500;
    (function bang(){
      var intro=document.getElementById('intro');
      if(!intro || intro.classList.contains('gone')) return;
      var el=(performance.now()-bt0)/1000; // detik
      var t=Math.min(1,el/(DUR/1000));
      bctx.fillStyle='rgba(4,4,6,.16)';
      bctx.fillRect(0,0,BW,BH);
      var cx=BW/2, cy=BH/2, maxR=Math.max(BW,BH)*.75;

      /* --- Fase 1: inti ledakan --- */
      if(el<1.1){
        var ft=el/1.1;
        var coreR=(1-Math.pow(1-ft,3))*maxR*.28;
        var coreA=Math.max(0,1-ft*1.15);
        // inti putih panas
        var g=bctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(1,coreR));
        g.addColorStop(0,'rgba(255,252,244,'+(.95*coreA+.05)+')');
        g.addColorStop(.35,'rgba(255,214,150,'+(.75*coreA)+')');
        g.addColorStop(1,'rgba(233,161,59,0)');
        bctx.fillStyle=g;
        bctx.beginPath(); bctx.arc(cx,cy,Math.max(1,coreR),0,7); bctx.fill();
        // shockwave ring
        var sw=(1-Math.pow(1-Math.min(1,ft*1.25),2))*maxR*.62;
        bctx.strokeStyle='rgba(255,220,160,'+(.5*Math.max(0,1-ft))+')';
        bctx.lineWidth=2.5*(1-ft)+.5;
        bctx.beginPath(); bctx.arc(cx,cy,Math.max(1,sw),0,7); bctx.stroke();
      }

      /* --- Fase 2: burst partikel --- */
      for(var i=0;i<pts.length;i++){
        var p=pts[i];
        // easing keluar: cepat lalu melambat
        var rt=1-Math.pow(1-Math.min(1,t*1.15),2.2);
        var r=rt*p.v*maxR;
        var x=cx+Math.cos(p.a)*r, y=cy+Math.sin(p.a)*r;
        // warna mendingin seiring waktu: putih → emas → ungu → biru
        var hue, sat=85, lit=68;
        if(t<.25){ hue=45; lit=88; }
        else if(t<.5){ hue=30+p.hue*.1; lit=70; }
        else { hue=265+((p.hue*37)%60); }
        var alpha=Math.min(1,t*3)*Math.max(0,1-t*.55)*(.55+.45*Math.sin(el*4+p.tw));
        // trail: garis pendek ke arah gerak
        var tx=cx+Math.cos(p.a)*Math.max(0,r-14*p.v), ty=cy+Math.sin(p.a)*Math.max(0,r-14*p.v);
        bctx.strokeStyle='hsla('+hue+','+sat+'%,'+lit+'%,'+(alpha*.5)+')';
        bctx.lineWidth=p.s*.7;
        bctx.beginPath(); bctx.moveTo(tx,ty); bctx.lineTo(x,y); bctx.stroke();
        bctx.fillStyle='hsla('+hue+','+sat+'%,'+Math.min(95,lit+12)+'%,'+alpha+')';
        bctx.beginPath(); bctx.arc(x,y,p.s,0,7); bctx.fill();
      }

      /* --- cosmic web: merajut setelah ledakan mereda --- */
      if(t>.45){
        var wt=(t-.45)/.55;
        for(var i2=0;i2<pts.length;i2+=3){
          var p1=pts[i2], p2=pts[i2+1];
          if(!p2) break;
          var r1=(1-Math.pow(1-Math.min(1,t*1.15),2.2))*p1.v*maxR;
          var r2=(1-Math.pow(1-Math.min(1,t*1.15),2.2))*p2.v*maxR;
          var x1=cx+Math.cos(p1.a)*r1, y1=cy+Math.sin(p1.a)*r1;
          var x2=cx+Math.cos(p2.a)*r2, y2=cy+Math.sin(p2.a)*r2;
          var dist=Math.hypot(x1-x2,y1-y2);
          if(dist<maxR*.2){
            bctx.strokeStyle='hsla(272,70%,62%,'+(wt*.13*(1-dist/(maxR*.2)))+')';
            bctx.lineWidth=.6;
            bctx.beginPath(); bctx.moveTo(x1,y1); bctx.lineTo(x2,y2); bctx.stroke();
          }
        }
      }
      if(!reduceM && t<1) requestAnimationFrame(bang);
    })();
  })();

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
    // hero scramble setelah intro selesai
    setTimeout(function(){
      var hh=document.querySelector('.hero .scramble');
      if(hh && window.scramble) window.scramble(hh);
    }, 400);
  }
  var seen=false;
  try{ seen=!!localStorage.getItem('mw_seen'); localStorage.setItem('mw_seen','1'); }catch(e){}
  var iv=setInterval(function(){
    p=Math.min(100, p+(seen?Math.random()*30+18:Math.random()*15+7));
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


/* ---------- Room slider (horizontal) ---------- */
(function(){
  var track=document.querySelector('.slider-track');
  if(!track) return;
  var rooms=track.querySelectorAll('.room');
  var dotsBox=document.querySelector('.slider-dots');
  var prev=document.querySelector('.slider-prev'), next=document.querySelector('.slider-next');
  var dots=[];
  rooms.forEach(function(_,i){
    var d=document.createElement('button');
    d.setAttribute('aria-label','Ke karya '+(i+1));
    d.addEventListener('click',function(){ goTo(i); });
    dotsBox.appendChild(d); dots.push(d);
  });
  function cur(){
    var w=rooms[0].offsetWidth+24;
    return Math.max(0,Math.min(rooms.length-1,Math.round(track.scrollLeft/w)));
  }
  function goTo(i){
    i=Math.max(0,Math.min(rooms.length-1,i));
    track.scrollTo({left:i*(rooms[0].offsetWidth+24),behavior:'smooth'});
  }
  function paint(){
    var c=cur();
    dots.forEach(function(d,i){ d.classList.toggle('on',i===c); });
    var rc=document.getElementById('roomCur');
    if(rc) rc.textContent=String(c+1).padStart(2,'0');
    if(prev) prev.style.opacity=c===0?.35:1;
    if(next) next.style.opacity=c===rooms.length-1?.35:1;
  }
  if(prev) prev.addEventListener('click',function(){ goTo(cur()-1); });
  if(next) next.addEventListener('click',function(){ goTo(cur()+1); });
  var st; track.addEventListener('scroll',function(){
    clearTimeout(st); st=setTimeout(paint,80);
  },{passive:true});
  /* drag to scroll */
  var down=false,sx=0,sl=0;
  track.addEventListener('pointerdown',function(e){
    down=true; sx=e.clientX; sl=track.scrollLeft; track.classList.add('dragging');
  });
  window.addEventListener('pointermove',function(e){
    if(!down) return; track.scrollLeft=sl-(e.clientX-sx);
  });
  window.addEventListener('pointerup',function(){
    down=false; track.classList.remove('dragging'); paint();
  });
  /* keyboard */
  track.setAttribute('tabindex','0');
  track.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight') goTo(cur()+1);
    if(e.key==='ArrowLeft') goTo(cur()-1);
  });
  paint();
})();

})();

/* ============================================================
   RAY-TRACED BLACK HOLE — fisika lensing gravitasi asli.
   Tiap piksel menelusuri berkas cahaya yang dibengkokkan
   gravitasi (pers. Binet), bukan gambar tempelan.
   ============================================================ */
(function(){
'use strict';
var canvas=document.getElementById('bh');
if(!canvas) return;
if(EMBED_MODE){ canvas.style.display='none'; return; } // demo iframe: tanpa ray-tracer
var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var isMobile=window.innerWidth<640;
var gl=null;
try{ gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false}); }catch(e){}
if(!gl){ return; } // biarkan CSS fallback (radial gradient) yang tampil

var VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
var FS=[
'precision highp float;',
'uniform vec2 uRes;uniform float uTime;uniform float uDive;uniform vec2 uMouse;uniform float uSteps;',
'float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}',
'float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
' float a=hash12(i),b=hash12(i+vec2(1.,0.)),c=hash12(i+vec2(0.,1.)),d=hash12(i+vec2(1.,1.));',
' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
'void main(){',
' vec2 uv=(gl_FragCoord.xy*2.-uRes)/min(uRes.x,uRes.y);',
 // kamera: jauh → dive ke horizon; mouse parallax halus
' float camZ=mix(9.5,2.9,uDive);',
' vec3 ro=vec3(uMouse.x*.9,.55+uMouse.y*.5,camZ);',
' vec3 rd=normalize(vec3(uv.x,uv.y,-2.1));',
' vec3 p=ro,v=rd,col=vec3(0.);',
' float hit=0.;', // 0 miss, 1 disk, 2 captured
' float diskIn=1.55,diskOut=4.7,dt=.13;',
' for(float i=0.;i<110.;i++){',
'  if(i>=uSteps)break;',
'  float r2=dot(p,p),r=sqrt(r2);',
'  if(r<1.){hit=2.;break;}',
'  vec3 acc=-1.5*p/(r2*r2*r+1e-5);', // pembengkokan gravitasi
'  v=normalize(v+acc*dt);',
'  vec3 np=p+v*dt;',
'  if(p.y*np.y<=0.&&abs(p.y-np.y)>1e-6){', // lintas bidang cakram
'   float t=p.y/(p.y-np.y);vec3 x=mix(p,np,t);float cr=length(x.xz);',
'   if(cr>diskIn&&cr<diskOut){',
'    float ang=atan(x.z,x.x);',
'    float omega=1.7*pow(cr,-1.5);', // Kepler: dalam lebih cepat
'    float a2=ang-uTime*omega;',
'    float streak=vnoise(vec2(a2*3.,cr*4.))*.6+vnoise(vec2(a2*7.+13.,cr*9.))*.4;',
'    streak=.5+.85*streak;',
'    float temp=clamp(pow(2.7/max(cr-.9,.15),.85),0.,2.3);',
'    vec3 tang=vec3(x.z,0.,-x.x)/max(cr,1e-4);', // arah orbit (kiri terang)
'    vec3 toCam=normalize(ro-x);',
'    float dop=dot(tang,toCam);',
'    float beam=clamp(1.+dop*1.15,.32,2.5);', // doppler beaming
'    vec3 dcol=mix(vec3(.72,.26,.09),vec3(1.,.6,.26),clamp(temp*.7,0.,1.));',
'    dcol=mix(dcol,vec3(1.,.93,.8),clamp(temp-1.,0.,1.));',
'    float edge=smoothstep(diskIn,diskIn+.55,cr)*(1.-smoothstep(diskOut-1.3,diskOut,cr));',
'    col+=dcol*(temp*beam*streak)*1.2*edge;',
'    hit=1.;break;',
'   }',
'  }',
'  p=np;',
'  if(r>26.)break;',
' }',
' if(hit<.5){', // latar bintang dari arah akhir berkas (ter-lensing)
'  vec2 sp=v.xy/(abs(v.z)+.45);',
'  vec2 g=sp*34.;vec2 id=floor(g);vec2 f2=fract(g)-.5;',
'  float h=hash12(id);',
'  float star=step(.993,h)*smoothstep(.3,.04,length(f2));',
'  float tw=.7+.3*sin(uTime*2.5+h*44.);',
'  col+=vec3(.82,.88,1.)*star*tw*.9;',
'  float band=exp(-pow((sp.y+sp.x*.22)*1.5,2.))*0.045;',
'  col+=vec3(.35,.45,.75)*band;',
'  col+=vec3(.012,.016,.03);',
' }',
' float vig=1.-.32*dot(uv,uv);',
' gl_FragColor=vec4(col*vig,1.);',
'}'
].join('\n');

function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){return null;}return s;}
var vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);
if(!vs||!fs) return;
var pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);
if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){return;}
gl.useProgram(pr);
var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
var loc=gl.getAttribLocation(pr,'p');
gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
function U(n){return gl.getUniformLocation(pr,n);}
var uRes=U('uRes'),uTime=U('uTime'),uDive=U('uDive'),uMouse=U('uMouse'),uSteps=U('uSteps');

var scale=isMobile?.55:.7, mx=0,my=0,tmx=0,tmy=0;
function size(){
  var w=Math.floor(window.innerWidth*scale),h=Math.floor(window.innerHeight*scale);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);
}
size();window.addEventListener('resize',size);
window.addEventListener('mousemove',function(e){
  tmx=(e.clientX/window.innerWidth-.5);tmy=(e.clientY/window.innerHeight-.5);
},{passive:true});

var bhState={uDive:0};
window.__bh=bhState;
var t0=performance.now(),lastT=0;
(function frame(){
  var now=performance.now(),t=(now-t0)*.001;
  // Worker 3D aktif = ray-tracer tidak perlu render sama sekali
  if(window.__worker3D){requestAnimationFrame(frame);return;}
  // hemat baterai: skip frame bila tab hidden atau bh sudah fade out
  var op=parseFloat(canvas.style.opacity||'1');
  if(document.hidden||op<=0.01){requestAnimationFrame(frame);return;}
  if(t-lastT<1/45&&!reduceMotion){requestAnimationFrame(frame);return;}
  lastT=t;
  mx+=(tmx-mx)*.05;my+=(tmy-my)*.05;
  size();
  gl.uniform2f(uRes,canvas.width,canvas.height);
  gl.uniform1f(uTime,reduceMotion?0:t);
  gl.uniform1f(uDive,bhState.uDive);
  gl.uniform2f(uMouse,mx,my);
  gl.uniform1f(uSteps,isMobile?52:84);
  gl.drawArrays(gl.TRIANGLES,0,3);
  requestAnimationFrame(frame);
})();
})();

/* ---------- TESSERACT DEMO controls ---------- */
(function(){
  if(/[?&]embed=1/.test(location.search)) return; // tidak ada panel di dalam iframe
  var d=document.getElementById('tessDemo'); if(!d) return;
  var explore=document.getElementById('tdExplore'),
      back=document.getElementById('tdBack'),
      close=document.getElementById('tdClose');
  function lockScroll(l){
    document.documentElement.style.overflow = l?'hidden':'';
    document.body.style.overflow = l?'hidden':'';
  }
  if(explore) explore.addEventListener('click', function(){
    d.classList.add('explore');
    if(back) back.hidden=false;
    explore.hidden=true;
    lockScroll(true);
  });
  function exitExplore(){
    d.classList.remove('explore');
    if(back) back.hidden=true;
    if(explore) explore.hidden=false;
    lockScroll(false);
  }
  if(back) back.addEventListener('click', exitExplore);
  if(close) close.addEventListener('click', function(){
    exitExplore();
    d.classList.remove('on'); d.classList.add('off');
    d.dataset.dismissed='1';
    d.setAttribute('aria-hidden','true');
    setTimeout(function(){ d.classList.remove('off'); }, 600);
  });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && d.classList.contains('explore')) exitExplore();
  });
})();

/* ===== TESSERACT DEMO — standalone trigger (tidak bergantung pada journey/onScroll) ===== */
(function(){
  if(/[?&]embed=1/.test(location.search)) return;
  var d=document.getElementById('tessDemo');
  if(!d || d.dataset.standalone==='1') return;
  d.dataset.standalone='1';
  var inZone=false, dismissed=false;
  function show(){
    if(dismissed || d.classList.contains('explore')) return;
    if(!d.classList.contains('on')){
      d.classList.add('on'); d.setAttribute('aria-hidden','false');
      var lf=document.getElementById('tdFrame');
      if(lf && !lf.getAttribute('src')) lf.src='https://marwanwidjaya.github.io/magerweb/?embed=1';
    }
  }
  function hide(){
    if(d.classList.contains('explore')) return;
    d.classList.remove('on'); d.setAttribute('aria-hidden','true');
  }
  function check(){
    var nz=false;
    try{
      ['why','process'].forEach(function(id){
        var el=document.getElementById(id);
        if(!el) return;
        var r=el.getBoundingClientRect(), vh=window.innerHeight;
        if(r.top<vh*.75 && r.bottom>vh*.25) nz=true;
      });
    }catch(e){}
    // fallback: posisi scroll tengah halaman
    if(!nz){
      try{
        var max=document.documentElement.scrollHeight-window.innerHeight;
        var j=max>0?window.scrollY/max:0;
        if(j>=.3 && j<=.7) nz=true;
      }catch(e){}
    }
    if(nz && !inZone){ inZone=true; dismissed=false; show(); }
    else if(!nz && inZone){ inZone=false; hide(); }
  }
  setInterval(check, 500);
  window.addEventListener('scroll', check, {passive:true});
  check();
  var c=document.getElementById('tdClose');
  if(c) c.addEventListener('click', function(){ dismissed=true; hide(); });
})();

/* ============ HYPERSPACE WARP ============ */
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var warpEl=document.getElementById('warp'), cv=document.getElementById('warpCanvas');
  var toTop=document.getElementById('toTop');
  if(!warpEl || !cv || !toTop) return;
  var ctx=cv.getContext('2d'), W, H, streaks=[], raf=null, startT=0;
  var DUR=1200; // 1.2 detik

  function resize(){ W=cv.width=window.innerWidth; H=cv.height=window.innerHeight; }
  function initStreaks(){
    streaks=[];
    var N=window.innerWidth<640?60:120;
    for(var i=0;i<N;i++){
      var a=Math.random()*Math.PI*2;
      var r=Math.max(W,H)*(.1+Math.random()*.4);
      streaks.push({
        x:W/2+Math.cos(a)*r, y:H/2+Math.sin(a)*r,
        a:a, r:r, len:2+Math.random()*8,
        sp:.6+Math.random()*.9,
        hue:Math.random()<.7?'125,211,252':'255,255,255'
      });
    }
  }
  function frame(t){
    var el=(t-startT)/DUR;
    if(el>=1){ end(); return; }
    // ease-in: makin cepat
    var speed=1+el*el*14;
    ctx.fillStyle='rgba(2,2,4,.28)';
    ctx.fillRect(0,0,W,H);
    var cx=W/2, cy=H/2;
    for(var i=0;i<streaks.length;i++){
      var s=streaks[i];
      s.r-=s.sp*speed*3;
      if(s.r<2){ // reset ke tepi
        s.a=Math.random()*Math.PI*2;
        s.r=Math.max(W,H)*(.5+Math.random()*.3);
      }
      var x=cx+Math.cos(s.a)*s.r, y=cy+Math.sin(s.a)*s.r;
      var tail=s.len*(1+el*8);
      var x2=cx+Math.cos(s.a)*(s.r+tail), y2=cy+Math.sin(s.a)*(s.r+tail);
      ctx.strokeStyle='rgba('+s.hue+','+(.25+el*.65)+')';
      ctx.lineWidth=1+el;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x2,y2); ctx.stroke();
    }
    // flash putih di akhir
    if(el>.85){
      ctx.fillStyle='rgba(255,255,255,'+((el-.85)/.15*.9)+')';
      ctx.fillRect(0,0,W,H);
    }
    raf=requestAnimationFrame(frame);
  }
  function end(){
    cancelAnimationFrame(raf); raf=null;
    window.scrollTo(0,0);
    warpEl.classList.remove('on');
  }
  function start(){
    if(reduceMotion){ window.scrollTo(0,0); return; }
    resize(); initStreaks();
    warpEl.classList.add('on');
    startT=performance.now();
    // ESC untuk skip
    function onKey(e){ if(e.key==='Escape'){ end(); window.removeEventListener('keydown',onKey); } }
    window.addEventListener('keydown',onKey);
    setTimeout(function(){ window.removeEventListener('keydown',onKey); }, DUR+100);
    raf=requestAnimationFrame(frame);
  }
  toTop.addEventListener('click', function(e){ e.preventDefault(); start(); });
  window.addEventListener('resize', resize);
})();


/* ---------- Cinematic scroll journey (ala referensi) ---------- */
(function(){
  var heroBg=document.querySelector('.hero .cine-bg img');
  var hero=document.querySelector('.hero');
  if(!heroBg||!hero) return;
  var ticking=false;
  // Matikan Ken Burns di hero (diganti scroll-driven)
  heroBg.style.animation='none';
  function update(){
    var r=hero.getBoundingClientRect();
    var vh=window.innerHeight;
    // prog: 0 = hero penuh terlihat, 1 = hero sudah di-scroll habis
    var prog=Math.max(0,Math.min(1,-r.top/vh));
    // DIVE: gambar membesar seolah kita terbang masuk
    var scale=1+prog*2.5;
    // FADE: semakin dalam, semakin gelap (masuk lubang hitam)
    var bright=1-prog*.85;
    heroBg.style.transform='scale('+scale+')';
    heroBg.style.filter='brightness('+bright+')';
    // Teks hero fade out saat dive
    var heroContent=hero.querySelector('.wrap');
    if(heroContent) heroContent.style.opacity=Math.max(0,1-prog*2.5);
    ticking=false;
  }
  window.addEventListener('scroll',function(){
    if(!ticking){ requestAnimationFrame(update); ticking=true; }
  },{passive:true});
  update();
})();
