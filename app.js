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

      /* black hole kini via ray-traced shader (#bh) */

      /* ===== WORMHOLE — cincin cahaya berdenyut ===== */
      var rings=[];
      for(var w=0;w<14;w++){
        var ring=new THREE.Mesh(new THREE.TorusGeometry(6+w*1.7,.08,8,isMobile?32:64),
          new THREE.MeshBasicMaterial({color:0xC6F24E,transparent:true,opacity:0,
            depthWrite:false,blending:THREE.AdditiveBlending}));
        ring.position.z=-40-w*9;
        scene.add(ring); rings.push(ring);
      }

            /* ===== TESSERACT ala Interstellar — kisi ruangan tak berujung ===== */
      var tessGroup=new THREE.Group();
      var tessLineMat, tessPtsMat;
      (function buildLattice(){
        var CELL=6, GRID=8, half=(GRID*CELL)/2, v=[];
        var y,x,z;
        for(y=0;y<=GRID;y++) for(z=0;z<=GRID;z++)
          v.push(-half,-half+y*CELL,-half+z*CELL, half,-half+y*CELL,-half+z*CELL);
        for(x=0;x<=GRID;x++) for(z=0;z<=GRID;z++)
          v.push(-half+x*CELL,-half,-half+z*CELL, -half+x*CELL,half,-half+z*CELL);
        for(x=0;x<=GRID;x++) for(y=0;y<=GRID;y++)
          v.push(-half+x*CELL,-half+y*CELL,-half, -half+x*CELL,-half+y*CELL,half);
        var lg=new THREE.BufferGeometry();
        lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(v),3));
        tessLineMat=new THREE.LineBasicMaterial({color:0xcbb27f,transparent:true,opacity:0});
        tessGroup.add(new THREE.LineSegments(lg,tessLineMat));
        // titik cahaya di persimpangan (subset agar ringan)
        var pv=[];
        for(x=0;x<=GRID;x++) for(y=0;y<=GRID;y++) for(z=0;z<=GRID;z++)
          if((x+y+z)%2===0) pv.push(-half+x*CELL,-half+y*CELL,-half+z*CELL);
        var pg=new THREE.BufferGeometry();
        pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pv),3));
        var dc2=document.createElement('canvas'); dc2.width=dc2.height=64;
        var dg2=dc2.getContext('2d'),
            grd2=dg2.createRadialGradient(32,32,0,32,32,32);
        grd2.addColorStop(0,'rgba(255,236,190,1)'); grd2.addColorStop(.5,'rgba(255,220,160,.5)');
        grd2.addColorStop(1,'rgba(255,220,160,0)');
        dg2.fillStyle=grd2; dg2.fillRect(0,0,64,64);
        tessPtsMat=new THREE.PointsMaterial({color:0xffe2ae,size:.5,transparent:true,
          opacity:0,map:new THREE.CanvasTexture(dc2),depthWrite:false,
          blending:THREE.AdditiveBlending});
        tessGroup.add(new THREE.Points(pg,tessPtsMat));
        tessGroup.userData.cell=CELL;
      })();
      tessGroup.position.set(0,0,-16);
      tessGroup.visible=false;
      scene.add(tessGroup);

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
      var stages=[[0,'CH.00 · THE VOID','SCROLL TO EXPLORE'],
                  [.14,'CH.01 · THE PROBLEM','EVERY BUSINESS HITS THIS WALL'],
                  [.28,'CH.02 · TRANSFORMATION','FROM CHAOS TO SYSTEM'],
                  [.44,'CH.03 · THE WORKS','DESCENDING INTO THE WORK'],
                  [.66,'CH.04 · THE SERVICES','CHOOSE YOUR MODULE'],
                  [.86,'CH.05 · NEXT CHAPTER','FIND YOUR NEXT CHAPTER']];
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
        if(dmStage){ var s=stages[0][1],h=stages[0][2];
          for(var k=0;k<stages.length;k++) if(journey>=stages[k][0]){s=stages[k][1];h=stages[k][2];}
          if(dmStage.textContent!==s) dmStage.textContent=s;
          var dh=document.getElementById('dmHint');
          if(dh&&dh.textContent!==h) dh.textContent=h; }
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

        // DIVE: 0→30% — black hole shader (uDive) + fade; kamera 3D utk stars/wormhole
        var dive=Math.min(journey/.3,1), ease=dive*dive*(3-2*dive);
        if(window.__bh){ __bh.uDive=dive;
          var _bhC=document.getElementById('bh');
          if(_bhC) _bhC.style.opacity=Math.max(0,1-Math.max(0,(journey-.3)/.08)).toFixed(3);
        }
        // TESSERACT: kisi tak berujung — fade in, melayang melewatinya, fade out
        var tessIn=Math.max(0,Math.min((journey-.33)/.07,1)),
            tessOut=Math.max(0,Math.min((journey-.6)/.07,1));
        var tessOp=tessIn*(1-tessOut);
        tessGroup.visible=tessOp>0.01;
        if(tessGroup.visible){
          tessLineMat.opacity=tessOp*.5;
          tessPtsMat.opacity=tessOp*.8;
          // drift maju tanpa henti (loop mulus per sel)
          var drift=(t*.9)%tessGroup.userData.cell;
          tessGroup.position.z=-16+drift;
          tessGroup.rotation.y=Math.sin(t*.08)*.04+mx*.06;
        }

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
        camera.lookAt(mx*4,my*2,-20);
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

/* ============================================================
   RAY-TRACED BLACK HOLE — fisika lensing gravitasi asli.
   Tiap piksel menelusuri berkas cahaya yang dibengkokkan
   gravitasi (pers. Binet), bukan gambar tempelan.
   ============================================================ */
(function(){
'use strict';
var canvas=document.getElementById('bh');
if(!canvas) return;
var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var isMobile=window.innerWidth<640;
var gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false});
if(!gl){ canvas.style.display='none'; return; }

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
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){canvas.style.display='none';return null;}return s;}
var vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);
if(!vs||!fs) return;
var pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);
if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){canvas.style.display='none';return;}
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
