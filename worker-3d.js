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

  // Event horizon — hitam pekat
  var bhSphere=new THREE.Mesh(
    new THREE.SphereGeometry(3.2,48,48),
    new THREE.MeshBasicMaterial({color:0x000000})
  );
  bhGroup.add(bhSphere);

  // Accretion disk — gradasi panas: putih-kuning (dalam) → emas → oranye tua (luar)
  var diskGeo=new THREE.RingGeometry(3.7,8.6,96,10);
  var posAttr=diskGeo.attributes.position;
  var colors=new Float32Array(posAttr.count*3);
  var cHot=new THREE.Color(0xfff6dd), cMid=new THREE.Color(0xf5b545),
      cOut=new THREE.Color(0x7a2f0c), tmpC=new THREE.Color();
  for(var i=0;i<posAttr.count;i++){
    var x=posAttr.getX(i), y=posAttr.getY(i);
    var r=Math.sqrt(x*x+y*y);
    var f=Math.max(0,Math.min(1,(r-3.7)/4.9));
    if(f<.45) tmpC.copy(cHot).lerp(cMid,f/.45);
    else tmpC.copy(cMid).lerp(cOut,(f-.45)/.55);
    // Turbulensi lembut — variasi brightness organik, bukan noise acak
    var turb=.82+.28*Math.sin(x*1.9+y*1.4)*Math.cos(y*2.1-x*1.1)
                 +.1*Math.sin(x*4.7-y*3.3);
    colors[i*3]=tmpC.r*turb; colors[i*3+1]=tmpC.g*turb; colors[i*3+2]=tmpC.b*turb;
  }
  diskGeo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  disk=new THREE.Mesh(diskGeo, new THREE.MeshBasicMaterial({
    vertexColors:true, transparent:true, opacity:.96, side:THREE.DoubleSide
  }));
  disk.rotation.x=-Math.PI/2.25;
  bhGroup.add(disk);

  // Inner glow — cincin terang di tepi event horizon
  glowInner=new THREE.Mesh(
    new THREE.RingGeometry(3.25,4.1,96),
    new THREE.MeshBasicMaterial({color:0xffe9b8, transparent:true, opacity:.55,
      side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false})
  );
  glowInner.rotation.x=-Math.PI/2.25;
  bhGroup.add(glowInner);

  // Outer halo — lembut, hangat
  glowOuter=new THREE.Mesh(
    new THREE.RingGeometry(3.4,10.5,96),
    new THREE.MeshBasicMaterial({color:0xd98a3a, transparent:true, opacity:.16,
      side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false})
  );
  glowOuter.rotation.x=-Math.PI/2.25;
  bhGroup.add(glowOuter);

  // Lensing arc — cahaya yang dibengkokkan di atas horizon (Einstein ring fragment)
  arc=new THREE.Mesh(
    new THREE.TorusGeometry(4.9,.3,14,96,Math.PI),
    new THREE.MeshBasicMaterial({color:0xffd890, transparent:true, opacity:.55,
      blending:THREE.AdditiveBlending, depthWrite:false})
  );
  arc.position.y=1.35;
  bhGroup.add(arc);

  // Back glow — popler di belakang BH agar silhouette tegas
  var backGlow=new THREE.Mesh(
    new THREE.CircleGeometry(7.5,48),
    new THREE.MeshBasicMaterial({color:0x3a1e08, transparent:true, opacity:.5,
      blending:THREE.AdditiveBlending, depthWrite:false})
  );
  backGlow.position.z=-2;
  bhGroup.add(backGlow);

  scene.add(bhGroup);

  /* ================= WORLD 2: TESSERACT (Cooper) ================= */
  tessGroup=new THREE.Group();

  // Pencahayaan hangat kayu — megah, bukan muram
  tessGroup.add(new THREE.AmbientLight(0x9a7a55,1.05));
  var key=new THREE.DirectionalLight(0xffd9a0,1.5);
  key.position.set(12,18,8); tessGroup.add(key);
  var warmA=new THREE.PointLight(0xff9a50,2.0,140);
  warmA.position.set(-10,4,-220); tessGroup.add(warmA);
  var warmB=new THREE.PointLight(0xffb060,1.6,140);
  warmB.position.set(10,-4,-320); tessGroup.add(warmB);
  var coolRim=new THREE.PointLight(0x5a7aff,.5,120);
  coolRim.position.set(0,10,-420); tessGroup.add(coolRim);

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
    new THREE.MeshBasicMaterial({color:0xff9a40, transparent:true, opacity:.28,
      blending:THREE.AdditiveBlending, depthWrite:false})
  );
  destGlow.position.set(0,0,-640);
  tessGroup.add(destGlow);

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
  journey+=(targetJourney-journey)*.08;
  var j=journey, time=t*.001;

  if(j<.30){
    /* ---- BLACK HOLE: kamera mendekat, BH membesar & mendominasi ---- */
    var p=j/.30;
    // ease-in: mulai jauh, lalu "jatuh" mendekat
    var e=p*p*(3-2*p);
    var camZ=30-e*26;             // 30 → 4
    camera.position.set(Math.sin(time*.12)*.6, Math.cos(time*.09)*.5, camZ);
    camera.lookAt(0,.4,0);
    camera.fov=baseFov; camera.updateProjectionMatrix();
    var s=1+e*2.1;                // BH membesar 3x lipat
    // "bernapas": pulsasi halus ±1.5%
    var breathe=1+Math.sin(time*.8)*.015;
    bhGroup.scale.set(s*breathe,s*breathe,s*breathe);
    bhGroup.visible=true;
    disk.rotation.z=time*.12;     // rotasi disk pelan & anggun
    glowInner.rotation.z=-time*.05;
    arc.material.opacity=.4+Math.sin(time*.6)*.12;
    tessGroup.visible=false;
    stars.visible=true;
    resetStars();
    flashPlane.visible=false;
  } else if(j<.44){
    /* ---- THE FALL: warp ke singularitas ---- */
    var p2=(j-.30)/.14;           // 0..1
    camera.position.set(0,.3,4-p2*10);  // menembus horizon
    camera.lookAt(0,.4,-20);
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
