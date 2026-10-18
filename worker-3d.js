/* worker-3d.js — MagerWeb cinematic journey di Web Worker via OffscreenCanvas.
   THE JOURNEY (journey 0..1, dari scroll):
     0.00–0.30  BLACK HOLE  — Gargantua, kamera mendekat, BH membesar & mendominasi
     0.30–0.44  THE FALL    — warp: FOV punch + star-stretch + white flash (jatuh ke singularitas)
     0.44–1.00  TESSERACT   — lorong rak buku infinite ala Interstellar/Cooper,
                              kamera maju pelan & STABIL (no sway = no pusing)
   Menerima: {type:'init', canvas, width, height, dpr, isMobile}
             {type:'scroll', journey}
             {type:'resize', width, height}
             {type:'pause'} / {type:'resume'}
   Mengirim: {type:'ready'} / {type:'error', msg}
*/
importScripts('https://unpkg.com/three@0.160.0/build/three.min.js');

var renderer=null, scene=null, camera=null;
var bhGroup=null, disk=null, glowInner=null, glowOuter=null, arc=null;
var lensUp=null, lensDown=null, photonRing=null;
var tessGroup=null, flashPlane=null;
var stars=null, starPos=null, starBase=null, STAR_N=0;
var journey=0, targetJourney=0;
var isMobile=false, running=true, rafId=0;
var baseFov=62;

function buildScene(canvas, W, H, DPR, mobile){
  isMobile=mobile;
  renderer=new THREE.WebGLRenderer({canvas:canvas, alpha:true, antialias:!mobile});
  renderer.setPixelRatio(Math.min(DPR, mobile?1.5:2));
  renderer.setSize(W,H,false);
  scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x060503,0.011);
  camera=new THREE.PerspectiveCamera(baseFov,W/H,.1,900);

  /* ================= WORLD 0: BLACK HOLE (Gargantua) ================= */
  bhGroup=new THREE.Group();

  // Event horizon — hitam pekat sempurna
  var bhSphere=new THREE.Mesh(
    new THREE.SphereGeometry(3.2,64,64),
    new THREE.MeshBasicMaterial({color:0x000000})
  );
  bhGroup.add(bhSphere);

  /* ============ ACCRETION DISK — custom shader ala Gargantua ============
     Fitur:
     - Gradasi akurat: putih-biru (inner, terpanas) → emas → oranye gelap (outer)
     - Doppler beaming: sisi yang bergerak mendekati viewer LEBIH TERANG
       (efek relativistik — ciri khas disk black hole di film)
     - Turbulensi ANIMASI (time-based, bukan baked statis)
     - Inner edge SANGAT TERANG (material yang jatuh, terpanas)
     - Radial streaks (aliran akresi) */
  var DISK_IN=3.55, DISK_OUT=9.8;
  var diskUniforms={
    uTime:{value:0},
    uInnerR:{value:DISK_IN},
    uOuterR:{value:DISK_OUT}
  };
  var diskMat=new THREE.ShaderMaterial({
    uniforms:diskUniforms,
    transparent:true,
    side:THREE.DoubleSide,
    depthWrite:false,
    vertexShader:[
      'varying vec2 vPolar;',
      'uniform float uInnerR;',
      'uniform float uOuterR;',
      'void main(){',
      '  vec3 pos=position;',
      '  float r=length(pos.xy);',
      '  float radial=clamp((r-uInnerR)/(uOuterR-uInnerR),0.0,1.0);',
      '  float angular=atan(pos.y,pos.x)/6.2831853+0.5;',
      '  vPolar=vec2(radial,angular);',
      '  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);',
      '}'
    ].join('\n'),
    fragmentShader:[
      'varying vec2 vPolar;',
      'uniform float uTime;',
      'vec3 diskColor(float r){',
      '  vec3 hot=vec3(0.96,0.98,1.0);',   // putih-biru: inner terpanas
      '  vec3 mid=vec3(1.0,0.76,0.40);',    // emas
      '  vec3 outc=vec3(0.50,0.19,0.05);',  // oranye gelap: outer terdingin
      '  vec3 c=mix(hot,mid,smoothstep(0.0,0.42,r));',
      '  c=mix(c,outc,smoothstep(0.42,1.0,r));',
      '  return c;',
      '}',
      'void main(){',
      '  float r=vPolar.x;',
      '  float theta=vPolar.y*6.2831853;',
      '  vec3 col=diskColor(r);',
      // Doppler beaming: sisi kiri (mendekati viewer) lebih terang & kebiruan
      '  float side=cos(theta);',
      '  float beam=1.0+side*0.85;',
      '  col*=beam;',
      '  col.b+=max(0.0,side)*0.18*(1.0-r);',  // blue shift sisi terang
      '  col.r+=max(0.0,-side)*0.10*(1.0-r);', // red shift sisi redup
      // Inner edge menyala (material jatuh)
      '  float innerGlow=pow(1.0-r,7.0)*2.2;',
      '  col+=vec3(1.0,0.96,0.88)*innerGlow;',
      // Turbulensi animasi — pusaran gas yang hidup
      '  float turb=0.78',
      '    +0.22*sin(theta*3.0+uTime*0.7+r*14.0)*cos(theta*5.0-uTime*0.45+r*9.0)',
      '    +0.10*sin(theta*9.0+uTime*1.2+r*22.0);',
      '  col*=turb;',
      // Streaks radial — aliran akresi ke dalam
      '  float streak=0.86+0.14*sin(theta*28.0+r*36.0-uTime*2.4);',
      '  col*=streak;',
      // Alpha: solid di dalam, fade di tepi luar
      '  float alpha=0.97*(1.0-smoothstep(0.82,1.0,r));',
      '  alpha*=0.88+0.12*turb;',
      '  gl_FragColor=vec4(col,alpha);',
      '}'
    ].join('\n')
  });
  disk=new THREE.Mesh(new THREE.RingGeometry(DISK_IN,DISK_OUT,160,16), diskMat);
  disk.rotation.x=-Math.PI/2.08; // nyaris edge-on = disk tipis ala Gargantua
  bhGroup.add(disk);
  bhGroup.userData.diskUniforms=diskUniforms;

  // Inner glow — cincin terang di tepi event horizon
  glowInner=new THREE.Mesh(
    new THREE.RingGeometry(3.25,4.1,96),
    new THREE.MeshBasicMaterial({color:0xffe9b8, transparent:true, opacity:.5,
      side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false})
  );
  glowInner.rotation.x=-Math.PI/2.08;
  bhGroup.add(glowInner);

  // Outer halo — lembut, hangat
  glowOuter=new THREE.Mesh(
    new THREE.RingGeometry(3.4,10.5,96),
    new THREE.MeshBasicMaterial({color:0xd98a3a, transparent:true, opacity:.14,
      side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false})
  );
  glowOuter.rotation.x=-Math.PI/2.2;
  bhGroup.add(glowOuter);

  /* --- GARGANTUA LENSING: sisi jauh disk yang dibengkokkan gravitasi ---
     Ciri khas Interstellar: disk edge-on, tapi cahaya dari SISI JAUH disk
     (di belakang black hole) tertekuk ke ATAS — terlihat sebagai busur
     terang melengkung di atas event horizon. Sisi bawah lebih redup.
     Dibuat dengan vertex-color gradient: terang di tengah busur,
     meredup ke ujung — seperti cahaya yang dibengkokkan. */
  function lensedArc(radius, tube, yPos, colorHot, colorDim, opacity, flip){
    var geo=new THREE.TorusGeometry(radius,tube,20,160,Math.PI);
    // Gradient sepanjang busur: terang di tengah, redup di ujung
    var p=geo.attributes.position, n=p.count;
    var cols=new Float32Array(n*3);
    var cH=new THREE.Color(colorHot), cD=new THREE.Color(colorDim), tc=new THREE.Color();
    for(var i=0;i<n;i++){
      // Torus arc: parameter u sepanjang arc. Estimasi dari sudut.
      var x=p.getX(i);
      // Tengah busur (x≈0) paling terang
      var f=Math.max(0,1-Math.abs(x)/(radius*1.05));
      f=Math.pow(f,1.6);
      tc.copy(cD).lerp(cH,f);
      cols[i*3]=tc.r; cols[i*3+1]=tc.g; cols[i*3+2]=tc.b;
    }
    geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
    var m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({
      vertexColors:true, transparent:true, opacity:opacity,
      blending:THREE.AdditiveBlending, depthWrite:false}));
    if(flip) m.rotation.z=Math.PI;
    m.position.y=yPos;
    return m;
  }

  // Lensing arc lama (dipertahankan, diselaraskan)
  arc=lensedArc(4.9,.30,1.35,0xffe0a0,0x8a4a18,.5,false);
  bhGroup.add(arc);

  // Photon ring — SANGAT TIPIS, MENYILAUKAN, tepat di tepi event horizon
  photonRing=new THREE.Mesh(
    new THREE.RingGeometry(3.28,3.42,160),
    new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.95,
      side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false})
  );
  photonRing.rotation.x=-Math.PI/2.08;
  bhGroup.add(photonRing);

  // Upper lensed disk — busur TERANG di atas: sisi jauh disk tertekuk gravitasi
  lensUp=lensedArc(5.7,.62,2.35,0xfff0c8,0xa06828,.85,false);
  bhGroup.add(lensUp);

  // Lower lensed disk — busur REDUP di bawah
  lensDown=lensedArc(5.4,.42,-1.9,0xd88a3a,0x5a2a10,.35,true);
  bhGroup.add(lensDown);

  // Back glow — popler di belakang BH agar silhouette tegas
  var backGlow=new THREE.Mesh(
    new THREE.CircleGeometry(7.5,48),
    new THREE.MeshBasicMaterial({color:0x3a1e08, transparent:true, opacity:.5,
      blending:THREE.AdditiveBlending, depthWrite:false})
  );
  backGlow.position.z=-2;
  bhGroup.add(backGlow);

  // Orbit ring — bingkai orbit lingkaran abu-abu SANGAT BESAR ala poggufanz
  var orbitRing=new THREE.Mesh(
    new THREE.RingGeometry(11.9,12.12,128),
    new THREE.MeshBasicMaterial({color:0x9a9aa5, transparent:true, opacity:.30,
      side:THREE.DoubleSide, depthWrite:false})
  );
  bhGroup.add(orbitRing);
  bhGroup.userData.orbit=orbitRing;

  scene.add(bhGroup);

  /* ================= WORLD 2: TESSERACT (Cooper) ================= */
  tessGroup=new THREE.Group();

  // Pencahayaan DRAMATIS ala Interstellar — hangat kayu, megah, dalam
  // Ambient lebih rendah = kontras lebih kuat, sorotan lebih teatrikal
  tessGroup.add(new THREE.AmbientLight(0x8a6a48,0.85));
  var key=new THREE.DirectionalLight(0xffd9a0,1.8);
  key.position.set(12,18,8); tessGroup.add(key);
  // Sorotan hangat berlapis — kedalaman lorong berasa
  var warmA=new THREE.PointLight(0xff9a50,2.4,150);
  warmA.position.set(-10,4,-220); tessGroup.add(warmA);
  var warmB=new THREE.PointLight(0xffb060,2.0,150);
  warmB.position.set(10,-4,-320); tessGroup.add(warmB);
  var warmC=new THREE.PointLight(0xff8a30,1.4,130);
  warmC.position.set(0,6,-420); tessGroup.add(warmC);
  var coolRim=new THREE.PointLight(0x5a7aff,.6,130);
  coolRim.position.set(0,10,-480); tessGroup.add(coolRim);
  // Cahaya "ilahi" dari ujung lorong — tujuan perjalanan Cooper
  var divine=new THREE.PointLight(0xffc080,1.2,200);
  divine.position.set(0,0,-600); tessGroup.add(divine);

  // Lorong rak buku: dari z=-190 sampai z=-620, rak di kiri/kanan/atas/bawah.
  // Tengah lorong KOSONG (jalur kamera) — Cooper terbang di tengah tesseract.
  var woodMat=new THREE.MeshStandardMaterial({color:0x9a6535, roughness:.68, metalness:.05});
  var woodDark=new THREE.MeshStandardMaterial({color:0x6e4525, roughness:.75, metalness:.04});
  var bookColors=[0x8a3a2a,0x2a5a8a,0x3a6a3a,0xd4a95a,0x5a3a6a,0xb56a3a,0x2a3a5a,0x9a2a2a,0xc9b458,0x4a7a6a];
  var shelfGeo=new THREE.BoxGeometry(4.4,.22,1.3);
  var frameGeo=new THREE.BoxGeometry(.24,3.4,1.3);
  var bookGeo=new THREE.BoxGeometry(.26,.95,.85);
  var dummy=new THREE.Object3D(), col=new THREE.Color();

  var shelfMats=[], bookMats=[];
  var shelfMesh=new THREE.InstancedMesh(shelfGeo,woodMat,400);
  var frameMesh=new THREE.InstancedMesh(frameGeo,woodDark,400);
  var bookMesh=new THREE.InstancedMesh(bookGeo,
    new THREE.MeshStandardMaterial({color:0xffffff,roughness:.82}),2400);
  var si=0,fi=0,bi=0;

  // Rak di 4 sisi lorong: kiri (x=-7), kanan (x=+7), atas (y=+7), bawah (y=-7)
  var z;
  for(z=-190; z>=-620; z-=14){
    var sides=[
      {x:-7,y:0,ry:Math.PI/2}, {x:7,y:0,ry:-Math.PI/2},
      {x:0,y:7,rx:Math.PI/2.6}, {x:0,y:-7,rx:-Math.PI/2.6}
    ];
    for(var sd=0;sd<4;sd++){
      var s=sides[sd];
      for(var sh=0;sh<3;sh++){
        var off=(sh-1)*2.6;
        dummy.rotation.set(s.rx||0,s.ry||0,0);
        dummy.scale.set(1,1,1);
        if(sd<2){ dummy.position.set(s.x, off, z); }
        else { dummy.position.set(off, s.y, z); }
        dummy.updateMatrix();
        if(si<400) shelfMesh.setMatrixAt(si++,dummy.matrix);
        // frame vertikal di ujung rak
        dummy.position.x+=(sd===0?2.2:sd===1?-2.2:0);
        dummy.updateMatrix();
        if(fi<400) frameMesh.setMatrixAt(fi++,dummy.matrix);
        // buku-buku di atas tiap papan rak
        for(var b=0;b<8;b++){
          if(Math.random()<.18) continue;
          var bx=(sd<2)? s.x : off-1.7+b*(3.4/7);
          var by=(sd<2)? off+.62 : s.y+(sd===2?-0.62:0.62);
          dummy.position.set(bx,by,z+(Math.random()-.5)*.2);
          dummy.rotation.set(0,(Math.random()-.5)*.15,(Math.random()-.5)*.06);
          dummy.scale.set(1,.75+Math.random()*.5,1);
          dummy.updateMatrix();
          if(bi<2400){
            bookMesh.setMatrixAt(bi,dummy.matrix);
            col.setHex(bookColors[(Math.random()*bookColors.length)|0]);
            bookMesh.setColorAt(bi,col); bi++;
          }
        }
      }
    }
  }
  shelfMesh.count=si; frameMesh.count=fi; bookMesh.count=bi;
  shelfMesh.instanceMatrix.needsUpdate=true;
  frameMesh.instanceMatrix.needsUpdate=true;
  bookMesh.instanceMatrix.needsUpdate=true;
  if(bookMesh.instanceColor) bookMesh.instanceColor.needsUpdate=true;
  tessGroup.add(shelfMesh); tessGroup.add(frameMesh); tessGroup.add(bookMesh);

  // Cahaya hangat di ujung lorong — "tujuan" perjalanan
  var destGlow=new THREE.Mesh(
    new THREE.CircleGeometry(26,32),
    new THREE.MeshBasicMaterial({color:0xff9a40, transparent:true, opacity:.32,
      blending:THREE.AdditiveBlending, depthWrite:false})
  );
  destGlow.position.set(0,0,-640);
  tessGroup.add(destGlow);

  // Debu melayang — atmosfer sinematik ala Interstellar (cahaya menembus debu)
  var DUST_N=isMobile?120:300;
  var dustPos=new Float32Array(DUST_N*3);
  for(var di=0;di<DUST_N;di++){
    dustPos[di*3]=(Math.random()-.5)*16;
    dustPos[di*3+1]=(Math.random()-.5)*16;
    dustPos[di*3+2]=-180-Math.random()*440;
  }
  var dustGeo=new THREE.BufferGeometry();
  dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
  var dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({
    color:0xffd9a0,size:.35,transparent:true,opacity:.5,
    blending:THREE.AdditiveBlending,depthWrite:false}));
  dust.userData.base=dustPos.slice();
  tessGroup.add(dust);
  tessGroup.userData.dust=dust;
  tessGroup.userData.dustN=DUST_N;

  tessGroup.visible=false;
  scene.add(tessGroup);

  /* ================= STARFIELD (untuk fase BLACK HOLE + THE FALL) ================= */
  STAR_N=isMobile?700:1600;
  starPos=new Float32Array(STAR_N*3);
  starBase=new Float32Array(STAR_N*3);
  for(var i2=0;i2<STAR_N;i2++){
    starBase[i2*3]=(Math.random()-.5)*420;
    starBase[i2*3+1]=(Math.random()-.5)*420;
    starBase[i2*3+2]=40-Math.random()*480;
  }
  starPos.set(starBase);
  var sg=new THREE.BufferGeometry();
  sg.setAttribute('position',new THREE.BufferAttribute(starPos,3));
  stars=new THREE.Points(sg,new THREE.PointsMaterial({
    color:0xcfd8ff,size:.75,transparent:true,opacity:.85}));
  scene.add(stars);

  /* ================= FLASH PLANE (THE FALL) ================= */
  flashPlane=new THREE.Mesh(
    new THREE.PlaneGeometry(60,60),
    new THREE.MeshBasicMaterial({color:0xfff4e0, transparent:true, opacity:0,
      blending:THREE.AdditiveBlending, depthWrite:false})
  );
  flashPlane.visible=false;
  scene.add(flashPlane);
}

function frame(t){
  if(!running) return;
  rafId=requestAnimationFrame(frame);
  // Butter-smooth: lerp adaptif — lebih lambat di dekat batas fase (transisi mulus),
  // lebih cepat di tengah fase (responsif). Menghindari "patah" antar fase.
  var dj=Math.abs(targetJourney-journey);
  var distToEdge=Math.min(
    Math.abs(journey-.30), Math.abs(journey-.44)
  );
  // melambat dalam radius 0.06 dari batas fase
  var slowF=distToEdge<.06 ? .35+.65*(distToEdge/.06) : 1;
  var lerpF=Math.min(.12,.03+dj*.25)*slowF+.02*slowF;
  journey+=(targetJourney-journey)*Math.max(.015,lerpF);
  // snap halus saat sangat dekat (hindari jitter abadi)
  if(Math.abs(targetJourney-journey)<.0004) journey=targetJourney;
  var j=journey, time=t*.001;

  if(j<.30){
    /* ---- BLACK HOLE: kamera mendekat, BH membesar & mendominasi ----
       Posisi ala poggufanz: sepertiga KANAN, agak ke atas.
       Saat kamera mendekat, BH bergeser ke tengah-kanan (jatuh ke singularitas). */
    var p=j/.30;
    // ease-in: mulai jauh, lalu "jatuh" mendekat
    var e=p*p*(3-2*p);
    var camZ=30-e*26;             // 30 → 4
    camera.position.set(Math.sin(time*.12)*.6, Math.cos(time*.09)*.5, camZ);
    camera.lookAt(0,.4,0);
    camera.fov=baseFov; camera.updateProjectionMatrix();
    // offset kanan: proporsional terhadap lebar pandang agar konsisten di HP & desktop
    var halfW=Math.tan(baseFov*Math.PI/360)*camZ*camera.aspect;
    var fx=0.42-e*0.24;           // 0.42 (kanan) → 0.18 (tengah-kanan)
    bhGroup.position.set(halfW*fx, 1.2-e*0.6, 0);  // agak ke atas, turun perlahan
    var s=1+e*2.1;                // BH membesar 3x lipat
    // "bernapas": pulsasi halus ±1.5%
    var breathe=1+Math.sin(time*.8)*.015;
    bhGroup.scale.set(s*breathe,s*breathe,s*breathe);
    bhGroup.visible=true;
    // Shader disk: update waktu (turbulensi animasi, doppler tetap di satu sisi)
    var du=bhGroup.userData.diskUniforms;
    if(du) du.uTime.value=time;
    glowInner.rotation.z=-time*.05;
    arc.material.opacity=.4+Math.sin(time*.6)*.12;
    // Lensing arcs berdenyut halus — hidup seperti Gargantua di film
    if(lensUp) lensUp.material.opacity=.66+Math.sin(time*.55)*.12;
    if(lensDown) lensDown.material.opacity=.26+Math.sin(time*.55+1.2)*.07;
    if(photonRing) photonRing.material.opacity=.75+Math.sin(time*1.1)*.1;
    tessGroup.visible=false;
    stars.visible=true;
    resetStars();
    flashPlane.visible=false;
  } else if(j<.44){
    /* ---- THE FALL: warp ke singularitas ---- */
    var p2=(j-.30)/.14;           // 0..1
    var bhXc=bhGroup.position.x;
    camera.position.set(bhXc*p2*.85,.3,4-p2*10);  // menembus horizon, melengkung ke arah BH
    camera.lookAt(bhXc*.7,.4,-20);
    // FOV punch: 62 → 105 → 62 (efek terowongan)
    camera.fov=baseFov+Math.sin(p2*Math.PI)*43;
    camera.updateProjectionMatrix();
    // BH melahap layar — skala deterministik (kontinu dari fase 1: 3.1 → 15.5)
    var fs=3.1*(1+p2*4);
    bhGroup.scale.set(fs,fs,fs);
    // star-stretch: bintang memanjang ke arah kamera
    stretchStars(p2);
    stars.visible=true;
    // white flash memuncak di tengah fase
    flashPlane.visible=true;
    flashPlane.position.set(camera.position.x,camera.position.y,camera.position.z-8);
    flashPlane.material.opacity=Math.sin(p2*Math.PI)*.85;
    tessGroup.visible=p2>.55;
  } else {
    /* ---- TESSERACT: lorong infinite, kamera maju STABIL ---- */
    var p3=(j-.44)/.56;           // 0..1
    var camZ2=-172-p3*380;        // -172 → -552
    // STABIL: tanpa sway lateral. Hanya drift vertikal super halus (±0.12).
    camera.position.set(0, Math.sin(time*.25)*.12, camZ2);
    camera.lookAt(0, Math.sin(time*.25)*.12, camZ2-40);
    camera.fov=baseFov; camera.updateProjectionMatrix();
    bhGroup.visible=false;
    stars.visible=false;
    flashPlane.visible=false;
    tessGroup.visible=true;
    // Debu melayang lembut — hidup, sinematik
    var dust=tessGroup.userData.dust;
    if(dust){
      var dp=dust.geometry.attributes.position.array;
      var db=dust.userData.base;
      var dn=tessGroup.userData.dustN;
      for(var ddi=0;ddi<dn;ddi++){
        dp[ddi*3]=db[ddi*3]+Math.sin(time*.3+ddi*1.7)*.8;
        dp[ddi*3+1]=db[ddi*3+1]+Math.cos(time*.22+ddi*2.3)*.8;
      }
      dust.geometry.attributes.position.needsUpdate=true;
      dust.material.opacity=.4+Math.sin(time*.5)*.12;
    }
    // Cahaya ujung berdenyut lembut — menuntun mata ke depan
    // (destGlow adalah child terakhir tessGroup sebelum stars? akses via userData)
  }

  renderer.render(scene,camera);
}

function resetStars(){
  if(!stars||!stars.visible) return;
  starPos.set(starBase);
  stars.geometry.attributes.position.needsUpdate=true;
  stars.material.opacity=.85;
}

function stretchStars(p2){
  // Bintang "tertinggal": z bergerak ke kamera + opacity naik = efek warp
  for(var i=0;i<STAR_N;i++){
    var bz=starBase[i*3+2];
    starPos[i*3]=starBase[i*3];
    starPos[i*3+1]=starBase[i*3+1];
    starPos[i*3+2]=bz+p2*120*(1+((i%7)/7));
  }
  stars.geometry.attributes.position.needsUpdate=true;
  stars.material.opacity=.85+p2*.15;
}

onmessage=function(e){
  var m=e.data;
  try{
    if(m.type==='init'){
      buildScene(m.canvas, m.width, m.height, m.dpr, m.isMobile);
      postMessage({type:'ready'});
      rafId=requestAnimationFrame(frame);
    } else if(m.type==='scroll'){
      targetJourney=Math.max(0,Math.min(1,m.journey));
    } else if(m.type==='resize'){
      if(renderer && camera){
        camera.aspect=m.width/m.height;
        camera.updateProjectionMatrix();
        renderer.setSize(m.width,m.height,false);
      }
    } else if(m.type==='pause'){
      running=false; if(rafId) cancelAnimationFrame(rafId); rafId=0;
    } else if(m.type==='resume'){
      if(!running){ running=true; rafId=requestAnimationFrame(frame); }
    }
  }catch(err){
    postMessage({type:'error', msg:String(err&&err.message||err)});
  }
};
