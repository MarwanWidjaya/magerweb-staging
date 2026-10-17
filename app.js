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

/* ---------- 3D COSMIC JOURNEY: black hole → wormhole → tesseract ---------- */
(function(){
  var canvas=document.getElementById('stars');
  if(!canvas) return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth<640;

  if(window.THREE && !reduceMotion){
    try{
      var renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:!isMobile});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, isMobile?1.5:2));
      renderer.setSize(window.innerWidth,window.innerHeight);
      var scene=new THREE.Scene();
      scene.fog=new THREE.FogExp2(0x050507,0.02);
      var camera=new THREE.PerspectiveCamera(62,window.innerWidth/window.innerHeight,.1,220);
      camera.position.set(0,0,26);

      /* ===== STARFIELD ===== */
      var COUNT=isMobile?900:2200;
      var pos=new Float32Array(COUNT*3), col=new Float32Array(COUNT*3);
      var lime=new THREE.Color('#C6F24E'), white=new THREE.Color('#ffffff'),
          cyan=new THREE.Color('#7dd3fc'), gold=new THREE.Color('#E9A13B'), tmp=new THREE.Color();
      for(var i=0;i<COUNT;i++){
        var r=18+Math.random()*60, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
        pos[i*3]=r*Math.sin(ph)*Math.cos(th);
        pos[i*3+1]=r*Math.sin(ph)*Math.sin(th);
        pos[i*3+2]=r*Math.cos(ph)-20;
        var pick=Math.random();
        if(pick<.1) tmp.copy(lime); else if(pick<.15) tmp.copy(cyan);
        else if(pick<.18) tmp.copy(gold); else tmp.copy(white);
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
      var starMat=new THREE.PointsMaterial({size:.85,vertexColors:true,transparent:true,
        opacity:.95,sizeAttenuation:true,depthWrite:false,map:new THREE.CanvasTexture(dotCv)});
      var stars=new THREE.Points(geo,starMat);
      scene.add(stars);

      /* ===== BLACK HOLE (Gargantua-style) ===== */
      var bh=new THREE.Group();
      bh.add(new THREE.Mesh(new THREE.SphereGeometry(3.1,isMobile?24:48,isMobile?16:32),
        new THREE.MeshBasicMaterial({color:0x000000})));
      var photon=new THREE.Mesh(new THREE.RingGeometry(3.12,3.44,isMobile?64:128),
        new THREE.MeshBasicMaterial({color:0xffe6b0,transparent:true,opacity:.95,
          side:THREE.DoubleSide,depthWrite:false}));
      bh.add(photon);
      // lensed arcs — cahaya cakram jauh yang tertekuk gravitasi (khas Gargantua)
      function lensedArc(){
        var c=document.createElement('canvas'); c.width=256; c.height=32;
        var g=c.getContext('2d');
        var grd=g.createLinearGradient(0,0,256,0);
        grd.addColorStop(0,'rgba(255,196,110,0)');
        grd.addColorStop(.3,'rgba(255,196,110,.95)');
        grd.addColorStop(.55,'rgba(255,180,100,.55)');
        grd.addColorStop(.8,'rgba(255,170,90,.25)');
        grd.addColorStop(1,'rgba(255,160,80,0)');
        g.fillStyle=grd; g.fillRect(0,10,256,12);
        return new THREE.CanvasTexture(c);
      }
      var arcTex=lensedArc();
      function addArc(bottom){
        var arc=new THREE.Mesh(
          new THREE.TorusGeometry(3.85,.24,10,isMobile?48:96,Math.PI),
          new THREE.MeshBasicMaterial({map:arcTex,transparent:true,
            blending:THREE.AdditiveBlending,depthWrite:false}));
        if(bottom) arc.rotation.z=Math.PI;
        arc.position.y=bottom?-0.5:0.5;
        arc.rotation.x=0.1;
        bh.add(arc);
      }
      addArc(false); addArc(true);
      // accretion disk: kanvas 512 — gradasi panas + streak + doppler beaming
      var dc=document.createElement('canvas'); dc.width=dc.height=512;
      var g2=dc.getContext('2d'), cx=256;
      for(var rr=150;rr<256;rr+=2){
        var tt=(rr-150)/106;
        var baseA=.95*(1-tt*.72);
        for(var aa=0;aa<360;aa+=4){
          var rad=aa*Math.PI/180;
          var doppler=.5+.5*Math.cos(rad);
          var streak=.72+.28*Math.sin(aa*7+rr*.16)*Math.sin(aa*3-rr*.11);
          var heat=1-tt;
          var cr=Math.floor(255*(.3+.7*heat)),
              cg=Math.floor(190*(.22+.78*heat*streak)),
              cb=Math.floor(110*heat*heat);
          g2.fillStyle='rgba('+cr+','+cg+','+cb+','+(baseA*doppler*streak).toFixed(3)+')';
          g2.fillRect(cx+Math.cos(rad)*rr-1.4, cx+Math.sin(rad)*rr-1.4, 2.8, 2.8);
        }
      }
      var disk=new THREE.Mesh(
        new THREE.RingGeometry(3.35,8.6,isMobile?64:128,4),
        new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(dc),transparent:true,
          side:THREE.DoubleSide,depthWrite:false}));
      disk.rotation.x=-Math.PI/2+0.1; // nyaris edge-on ala Gargantua
      bh.add(disk);
      // gravitational lensing glow (atas & bawah cakram yang tertekuk)
      function bhGlow(colorHex,s,op,py){
        var c2=document.createElement('canvas'); c2.width=c2.height=128;
        var gg=c2.getContext('2d'), grd=gg.createRadialGradient(64,64,0,64,64,64);
        grd.addColorStop(0,colorHex); grd.addColorStop(1,'rgba(0,0,0,0)');
        gg.fillStyle=grd; gg.fillRect(0,0,128,128);
        var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c2),
          transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));
        sp.scale.set(s,s*.42,1); sp.position.y=py; bh.add(sp);
      }
      bhGlow('rgba(233,161,59,0.85)',17,.5,3.5);
      bhGlow('rgba(233,161,59,0.85)',17,.42,-3.5);
      bhGlow('rgba(255,230,176,0.6)',9,.5,0);
      bh.position.set(0,2.4,-10);
      bh.rotation.z=0.12;
      scene.add(bh);

      /* ===== WORMHOLE — cincin cahaya berdenyut ===== */
      var rings=[];
      for(var w=0;w<14;w++){
        var ring=new THREE.Mesh(new THREE.TorusGeometry(6+w*1.7,.08,8,isMobile?32:64),
          new THREE.MeshBasicMaterial({color:0xC6F24E,transparent:true,opacity:0,
            depthWrite:false,blending:THREE.AdditiveBlending}));
        ring.position.z=-40-w*9;
        scene.add(ring); rings.push(ring);
      }

      /* ===== TESSERACT — hypercube 4D wireframe ===== */
      var tessVerts=[];
      for(var vi=0;vi<16;vi++) tessVerts.push([(vi&1?1:-1),(vi&2?1:-1),(vi&4?1:-1),(vi&8?1:-1)]);
      var tessEdges=[];
      for(var ei=0;ei<16;ei++) for(var ej=ei+1;ej<16;ej++){
        var df=0; for(var ek=0;ek<4;ek++) if(((ei>>ek)&1)!==((ej>>ek)&1)) df++;
        if(df===1) tessEdges.push(ei,ej);
      }
      var tessPos=new Float32Array(tessEdges.length*3);
      var tessGeo=new THREE.BufferGeometry();
      tessGeo.setAttribute('position',new THREE.BufferAttribute(tessPos,3));
      var tessMat=new THREE.LineBasicMaterial({color:0xC6F24E,transparent:true,opacity:0,
        blending:THREE.AdditiveBlending,depthWrite:false});
      var tesseract=new THREE.LineSegments(tessGeo,tessMat);
      tesseract.position.set(0,0,-14);
      tesseract.visible=false;
      scene.add(tesseract);
      function updateTesseract(t){
        var p=0;
        for(var q=0;q<tessEdges.length;q++){
          var v=tessVerts[tessEdges[q]];
          var x=v[0],y=v[1],z=v[2],w=v[3];
          var a=t*.45, x1=x*Math.cos(a)-w*Math.sin(a), w1=x*Math.sin(a)+w*Math.cos(a);
          var b=t*.32, y1=y*Math.cos(b)-w1*Math.sin(b), w2=y*Math.sin(b)+w1*Math.cos(b);
          var s=2.7/(2.7-w2);
          tessPos[p++]=x1*s*2.4; tessPos[p++]=y1*s*2.4; tessPos[p++]=z*2.4;
        }
        tessGeo.attributes.position.needsUpdate=true;
      }

      /* ===== NEBULA ===== */
      function nebula(colorHex,ox,oy,s,op){
        var cv=document.createElement('canvas'); cv.width=cv.height=128;
        var ng=cv.getContext('2d'), grd=ng.createRadialGradient(64,64,0,64,64,64);
        grd.addColorStop(0,colorHex); grd.addColorStop(1,'rgba(0,0,0,0)');
        ng.fillStyle=grd; ng.fillRect(0,0,128,128);
        var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),
          transparent:true,opacity:op,depthWrite:false}));
        sp.position.set(ox,oy,-32); sp.scale.set(s,s,1); scene.add(sp);
      }
      nebula('rgba(198,242,78,0.5)',-26,14,46,.13);
      nebula('rgba(125,211,252,0.45)',28,-16,50,.1);
      nebula('rgba(233,161,59,0.4)',0,-22,40,.08);

      /* ===== JOURNEY: scroll menggerakkan kamera menembus ruang-waktu ===== */
      var tmx=0,tmy=0,mx=0,my=0,journey=0,lastY=window.scrollY,scrollVel=0;
      var dmFill=document.getElementById('dmFill'), dmMarker=document.getElementById('dmMarker'),
          dmStage=document.getElementById('dmStage');
      var stages=[[0,'EVENT HORIZON'],[.16,'SINGULARITY'],[.36,'TESSERACT'],
                  [.58,'WORMHOLE'],[.8,'DEEP FIELD'],[.94,'RETURN']];
      window.addEventListener('mousemove',function(e){
        tmx=(e.clientX/window.innerWidth-.5); tmy=(e.clientY/window.innerHeight-.5);
      },{passive:true});
      function onScroll(){
        var y=window.scrollY, max=document.documentElement.scrollHeight-window.innerHeight;
        journey=max>0?Math.min(y/max,1):0;
        scrollVel=Math.abs(y-lastY); lastY=y;
        var pct=Math.round(journey*100);
        if(dmFill) dmFill.style.height=pct+'%';
        if(dmMarker) dmMarker.style.top=pct+'%';
        if(dmStage){ var s=stages[0][1];
          for(var k=0;k<stages.length;k++) if(journey>=stages[k][0]) s=stages[k][1];
          if(dmStage.textContent!==s) dmStage.textContent=s; }
      }
      window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
      window.addEventListener('resize',function(){
        camera.aspect=window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth,window.innerHeight);
      });

      var t0=performance.now();
      (function loop(){
        var t=(performance.now()-t0)*.001;
        mx+=(tmx-mx)*.04; my+=(tmy-my)*.04;
        scrollVel*=.9;
        var warp=Math.min(scrollVel*.05,1.1);

        stars.rotation.y=t*.016+mx*.35;
        stars.rotation.x=my*.25+Math.sin(t*.1)*.02;
        starMat.size=.85+warp*1.7;

        // DIVE: 0→30% scroll kita jatuh melewati black hole
        var dive=Math.min(journey/.3,1), ease=dive*dive*(3-2*dive);
        bh.position.z=-10-ease*52;
        bh.position.y=2.4-ease*10;
        var bhs=1+ease*.5; bh.scale.set(bhs,bhs,bhs);
        disk.rotation.z=t*.13;
        photon.material.opacity=.92+Math.sin(t*2.2)*.07;
        // tesseract muncul di stage TESSERACT (36%→58% journey)
        var tessIn=Math.max(0,Math.min((journey-.34)/.06,1)),
            tessOut=Math.max(0,Math.min((journey-.58)/.06,1));
        var tessOp=tessIn*(1-tessOut);
        tesseract.visible=tessOp>0.01;
        tessMat.opacity=tessOp*.85;
        if(tesseract.visible){ updateTesseract(t); tesseract.rotation.z=t*.1; }

        // WORMHOLE: 35%→85% — cincin berdenyut mendekat
        var wh=Math.max(0,Math.min((journey-.35)/.5,1));
        for(var q=0;q<rings.length;q++){
          var ph=(t*.65+q*.5)%1;
          rings[q].material.opacity=wh*.55*(1-ph);
          var sc=1+ph*2.4; rings[q].scale.set(sc,sc,1);
          rings[q].position.z=camera.position.z-6-ph*52;
        }

        // kamera: dolly + parallax + fov warp
        camera.position.z=26-ease*15-wh*7;
        camera.position.x=mx*3;
        camera.position.y=-ease*2.2+my*2;
        camera.lookAt(mx*4,2.4-ease*10+my*2,-10-ease*22);
        var nf=62+warp*13;
        if(Math.abs(camera.fov-nf)>.1){ camera.fov=nf; camera.updateProjectionMatrix(); }

        renderer.render(scene,camera);
        requestAnimationFrame(loop);
      })();
      return;
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
