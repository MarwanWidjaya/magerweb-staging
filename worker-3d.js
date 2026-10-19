/* worker-3d.js — MagerWeb cinematic journey di Web Worker via OffscreenCanvas.
   BLACK HOLE: PURE GLSL fragment shader (WebGL2, raw context). NO Three.js.
     - Satu fullscreen triangle, satu draw call
     - Simulasi cahaya prosedural ala poggufanz.xyz:
       Big Bang intro (flash + radial lines) -> Voronoi cosmic web (ungu/pink)
       -> stars -> black hole forms (disk EMAS-PUTIH TERANG, lensing jelas)
     - gasColor palette: warm only where bright (cream/gold),
       dim areas = violet/indigo (NEVER dim orange/brown)
     - Doppler beaming, photon ring, strong bloom
   TESSERACT: Three.js bookshelf corridor (0.44-1.00) — unchanged.
   THE JOURNEY (journey 0..1, dari scroll):
     0.00-0.30  BLACK HOLE — shader (uApproach 0->1, BH membesar)
     0.30-0.44  THE FALL   — shader warp (uFall 0->1): streaks + flash
     0.44-1.00  TESSERACT  — Three.js corridor
   Menerima: {type:'init', canvas, width, height, dpr, isMobile}
             {type:'scroll', journey}
             {type:'resize', width, height}
             {type:'pause'} / {type:'resume'}
   Mengirim: {type:'ready'} / {type:'error', msg}
*/
importScripts('https://unpkg.com/three@0.160.0/build/three.min.js');

/* ==================== PURE GLSL BLACK HOLE ==================== */
var BH_VERT_SRC = [
'#version 300 es',
'layout(location=0) in vec2 aPos;',
'void main(){ gl_Position=vec4(aPos,0.0,1.0); }'
].join('\n');

var BH_FRAG_SRC = [
'#version 300 es',
'precision highp float;',
'uniform vec2 uRes;',
'uniform float uTime;',
'uniform float uApproach;',
'uniform float uFall;',
'uniform vec2 uCenter;',
'uniform float uHorizon;',
'out vec4 fragColor;',
'',
'float hash11(float p){ p=fract(p*0.1031); p*=p+33.33; p*=p+p; return fract(p); }',
'float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }',
'vec2 hash22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }',
'float vnoise(vec2 p){',
'  vec2 i=floor(p); vec2 f=fract(p);',
'  vec2 u=f*f*(3.0-2.0*f);',
'  float a=hash12(i); float b=hash12(i+vec2(1.0,0.0));',
'  float c=hash12(i+vec2(0.0,1.0)); float d=hash12(i+vec2(1.0,1.0));',
'  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);',
'}',
'float fbm(vec2 p){',
'  float v=0.0; float a=0.5;',
'  mat2 r=mat2(0.8,0.6,-0.6,0.8);',
'  for(int i=0;i<5;i++){ v+=a*vnoise(p); p=r*p*2.03; a*=0.5; }',
'  return v;',
'}',
'vec2 voronoi(vec2 p){',
'  vec2 ip=floor(p); vec2 fp=fract(p);',
'  float f1=8.0; float f2=8.0;',
'  for(int j=-1;j<=1;j++){',
'    for(int i=-1;i<=1;i++){',
'      vec2 g=vec2(float(i),float(j));',
'      vec2 o=hash22(ip+g);',
'      vec2 r=g+o-fp;',
'      float d=dot(r,r);',
'      if(d<f1){ f2=f1; f1=d; } else if(d<f2){ f2=d; }',
'    }',
'  }',
'  return sqrt(vec2(f1,f2));',
'}',
'/* gasColor: warm only where bright. Dim orange would read as brown,',
'   so dim areas go violet/indigo. */',
'vec3 gasColor(float g){',
'  vec3 cream=vec3(1.00,0.93,0.80);',
'  vec3 gold =vec3(1.00,0.76,0.42);',
'  vec3 amber=vec3(0.82,0.46,0.22);',
'  vec3 viol =vec3(0.40,0.16,0.72);',
'  vec3 indi =vec3(0.12,0.07,0.36);',
'  vec3 c=mix(indi,viol,smoothstep(0.00,0.34,g));',
'  c=mix(c,amber,smoothstep(0.34,0.60,g));',
'  c=mix(c,gold,smoothstep(0.60,0.84,g));',
'  c=mix(c,cream,smoothstep(0.84,1.00,g));',
'  return c;',
'}',
'void main(){',
'  vec2 uv=gl_FragCoord.xy/uRes;',
'  float aspect=uRes.x/uRes.y;',
'  vec2 p=(uv-0.5)*vec2(aspect,1.0);',
'  float t=uTime;',
'  vec3 col=vec3(0.004,0.003,0.010);',
'',
'  /* ---------- INTRO: Big Bang (time-driven) ---------- */',
'  float bt=(t-0.45)*5.0;',
'  float bangFlash=exp(-bt*bt);',
'  float radialAmt=smoothstep(0.30,0.45,t)*(1.0-smoothstep(0.75,1.15,t));',
'  float webAmt=smoothstep(0.65,0.95,t)*(1.0-smoothstep(1.35,1.85,t));',
'  float starsAmt=smoothstep(1.05,1.55,t);',
'  float bhAmt=smoothstep(1.65,2.65,t);',
'  col+=vec3(1.0,0.98,0.94)*bangFlash*2.4;',
'  {',
'    vec2 d0=p-uCenter;',
'    float r0=length(d0);',
'    float a0=atan(d0.y,d0.x);',
'    float s=0.5+0.5*sin(a0*36.0+fbm(p*3.0+t*0.7)*5.0);',
'    float rays=s*s; rays*=rays; rays*=s;',
'    col+=vec3(1.0,0.88,0.70)*rays*exp(-r0*2.4)*radialAmt*1.5;',
'  }',
'  {',
'    vec2 vv=voronoi(p*6.0+vec2(t*0.04,-t*0.025));',
'    float edge=1.0-smoothstep(0.0,0.10,vv.y-vv.x);',
'    vec3 wc=mix(vec3(0.42,0.14,0.78),vec3(0.88,0.28,0.58),fbm(p*4.0+3.7));',
'    col+=wc*edge*webAmt*0.85;',
'  }',
'  {',
'    vec2 sp=p*80.0;',
'    vec2 cell=floor(sp);',
'    vec2 fpos=fract(sp)-0.5;',
'    vec2 spos=(hash22(cell)-0.5)*0.7;',
'    vec2 so=fpos-spos;',
'    float sd=length(so);',
'    float h=hash12(cell);',
'    float on=step(0.90,h);',
'    float tw=0.65+0.35*sin(t*2.5+h*50.0);',
'    float s=(1.0-smoothstep(0.01,0.09,sd))*on*tw;',
'    float fl=step(0.986,h);',
'    float cross=(exp(-abs(so.y)*36.0)+exp(-abs(so.x)*36.0))*fl*0.4;',
'    col+=vec3(0.82,0.88,1.0)*(s+cross)*starsAmt;',
'  }',
'',
'  /* ---------- BLACK HOLE ---------- */',
'  float fz=1.0+uFall*2.2;',
'  float az=1.0/(1.0+uApproach*0.9);',
'  vec2 d=(p-uCenter)*az/fz;',
'  float r=length(d);',
'  float ang=atan(d.y,d.x);',
'  float H=uHorizon*(1.0+0.008*sin(t*0.9));',
'  vec3 bh=vec3(0.0);',
'',
'  /* Lensed arcs: far side of disk bent over/under by gravity */',
'  {',
'    float arx=H*2.30; float ary=H*1.25;',
'    vec2 ep=vec2(d.x/arx,d.y/ary);',
'    float er=length(ep);',
'    float q=(er-1.0)/0.085;',
'    float band=exp(-q*q);',
'    float sm=sin(atan(ep.y,ep.x));',
'    float upm=smoothstep(0.06,0.60,sm);',
'    float heat=pow(clamp(upm,0.0,1.0),1.4);',
'    vec3 ac=gasColor(0.55+0.40*heat);',
'    float at=fbm(vec2(atan(ep.y,ep.x)*2.0,er*4.0-t*0.4));',
'    bh+=ac*band*upm*(1.55+0.50*at)*bhAmt;',
'  }',
'  {',
'    float arx=H*2.05; float ary=H*1.10;',
'    vec2 ep=vec2(d.x/arx,d.y/ary);',
'    float er=length(ep);',
'    float q=(er-1.0)/0.10;',
'    float band=exp(-q*q);',
'    float sm=sin(atan(ep.y,ep.x));',
'    float dnm=smoothstep(-0.06,-0.60,sm);',
'    float heat=pow(clamp(dnm,0.0,1.0),1.5);',
'    vec3 ac=gasColor(0.28+0.30*heat);',
'    bh+=ac*band*dnm*0.80*bhAmt;',
'  }',
'',
'  /* Direct disk: edge-on band, GOLD-WHITE, doppler beaming */',
'  {',
'    float diskIn=H*1.10; float diskOut=H*3.30;',
'    float inM=smoothstep(diskIn,diskIn*1.18,r);',
'    float outM=1.0-smoothstep(diskOut*0.62,diskOut,r);',
'    float thick=0.030+0.055*smoothstep(diskIn,diskOut,r);',
'    float bq=abs(d.y)/max(thick,1e-4);',
'    float band=exp(-pow(bq,1.7));',
'    float rad=1.0-clamp((r-diskIn)/(diskOut-diskIn),0.0,1.0);',
'    float heat=pow(clamp(rad,0.0,1.0),1.5);',
'    float beam=1.0-0.58*cos(ang);',
'    float turb=fbm(vec2(ang*2.5,r*7.0-t*1.1));',
'    float streak=0.85+0.30*sin(ang*22.0+r*26.0-t*2.2);',
'    float db=band*inM*outM*(0.30+0.70*heat)*beam*(0.70+0.60*turb)*streak;',
'    vec3 dc=gasColor(clamp(0.18+heat*0.72*beam,0.0,1.0));',
'    bh+=dc*db*3.0*bhAmt;',
'  }',
'',
'  /* Bloom: STRONG */',
'  {',
'    float q1=r/(H*4.2); float q2=r/(H*1.9);',
'    bh+=vec3(1.0,0.80,0.52)*exp(-q1*q1)*0.50*bhAmt;',
'    bh+=vec3(1.0,0.86,0.62)*exp(-q2*q2)*0.38*bhAmt;',
'  }',
'',
'  /* Event horizon: black, sharp */',
'  float hor=(1.0-smoothstep(H*0.985,H*1.015,r))*bhAmt;',
'  bh*=1.0-hor;',
'',
'  /* Photon ring: thin, brilliant */',
'  {',
'    float q=(r-H*1.03)/(H*0.020);',
'    bh+=vec3(1.0,0.96,0.88)*exp(-q*q)*2.4*bhAmt*(1.0-hor);',
'  }',
'  col+=bh;',
'',
'  /* ---------- THE FALL: warp streaks + flash ---------- */',
'  float uF=clamp(uFall,0.0,1.0);',
'  if(uF>0.001){',
'    float sa=atan(d.y,d.x);',
'    float cells=floor((sa+3.14159)*12.0);',
'    float sh=hash11(cells*1.7+3.0);',
'    float wstreak=smoothstep(0.72,1.0,sh);',
'    float rr=clamp(r/(H*4.0),0.0,1.0);',
'    col+=vec3(0.55,0.75,1.0)*wstreak*(1.0-rr)*uF*1.3;',
'    float flash=sin(uF*3.14159);',
'    col=mix(col,vec3(1.0,0.97,0.92),clamp(flash,0.0,1.0)*0.70);',
'  }',
'',
'  /* ---------- tonemap ---------- */',
'  col=vec3(1.0)-exp(-col*1.55);',
'  col=pow(col,vec3(0.92));',
'  fragColor=vec4(col,1.0);',
'}'
].join('\n');

/* ==================== RAW WebGL2 ENGINE ==================== */
var gl=null, bhProg=null, bhVAO=null;
var uResL=null, uTimeL=null, uApproachL=null, uFallL=null, uCenterL=null, uHorizonL=null;
var canvasEl=null, bufW=0, bufH=0, aspectNow=1.6;
var glBHReady=false;

function bhCompile(type, src){
  var s=gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
    var log=gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('BH shader compile failed: '+log);
  }
  return s;
}

function initBHGL(){
  var vs=bhCompile(gl.VERTEX_SHADER, BH_VERT_SRC);
  var fs=bhCompile(gl.FRAGMENT_SHADER, BH_FRAG_SRC);
  bhProg=gl.createProgram();
  gl.attachShader(bhProg, vs);
  gl.attachShader(bhProg, fs);
  gl.linkProgram(bhProg);
  if(!gl.getProgramParameter(bhProg, gl.LINK_STATUS)){
    throw new Error('BH program link failed: '+gl.getProgramInfoLog(bhProg));
  }
  uResL=gl.getUniformLocation(bhProg,'uRes');
  uTimeL=gl.getUniformLocation(bhProg,'uTime');
  uApproachL=gl.getUniformLocation(bhProg,'uApproach');
  uFallL=gl.getUniformLocation(bhProg,'uFall');
  uCenterL=gl.getUniformLocation(bhProg,'uCenter');
  uHorizonL=gl.getUniformLocation(bhProg,'uHorizon');
  bhVAO=gl.createVertexArray();
  gl.bindVertexArray(bhVAO);
  var vbo=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function renderBH(time, approach, fall, cx, cy, horizon){
  var W=canvasEl.width, H=canvasEl.height;
  gl.viewport(0, 0, W, H);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.SCISSOR_TEST);
  gl.disable(gl.STENCIL_TEST);
  gl.useProgram(bhProg);
  gl.uniform2f(uResL, W, H);
  gl.uniform1f(uTimeL, time);
  gl.uniform1f(uApproachL, approach);
  gl.uniform1f(uFallL, fall);
  gl.uniform2f(uCenterL, cx, cy);
  gl.uniform1f(uHorizonL, horizon);
  gl.bindVertexArray(bhVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);
  gl.useProgram(null);
}

/* Reset GL state sebelum Three.js render (konteks dipakai bersama). */
function glResetForThree(){
  gl.bindVertexArray(null);
  gl.useProgram(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.disable(gl.BLEND);
  gl.enable(gl.DEPTH_TEST);
  gl.depthMask(true);
  gl.depthFunc(gl.LESS);
  gl.colorMask(true,true,true,true);
  gl.clearColor(0,0,0,1);
}

/* ==================== 2D FALLBACK (tanpa WebGL2) ==================== */
var fallback2D=false, ctx2d=null, fbStars=null;
function initFallback2D(){
  try{ ctx2d=canvasEl.getContext('2d'); }catch(e){ ctx2d=null; }
  if(!ctx2d) return false;
  fbStars=[];
  for(var i=0;i<220;i++) fbStars.push([Math.random(),Math.random(),Math.random()]);
  fallback2D=true;
  return true;
}
function renderFallback2D(time){
  var w=canvasEl.width, h=canvasEl.height;
  ctx2d.fillStyle='#030308';
  ctx2d.fillRect(0,0,w,h);
  var i, s;
  for(i=0;i<fbStars.length;i++){
    s=fbStars[i];
    var tw=0.5+0.5*Math.sin(time*2+s[2]*20);
    ctx2d.fillStyle='rgba(200,210,255,'+(0.25+0.55*tw*s[2]).toFixed(3)+')';
    ctx2d.fillRect(s[0]*w, s[1]*h, 2, 2);
  }
  var cx=w*0.68, cy=h*0.45, R=Math.min(w,h)*0.15;
  var pulse=1+0.012*Math.sin(time*0.9);
  R*=pulse;
  var g=ctx2d.createRadialGradient(cx,cy,R,cx,cy,R*3.4);
  g.addColorStop(0,'rgba(255,196,120,0.55)');
  g.addColorStop(0.5,'rgba(210,130,70,0.20)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx2d.fillStyle=g;
  ctx2d.fillRect(cx-R*3.4,cy-R*3.4,R*6.8,R*6.8);
  ctx2d.save();
  ctx2d.translate(cx,cy);
  ctx2d.scale(1,0.17);
  var dg=ctx2d.createRadialGradient(0,0,R*1.05,0,0,R*3.2);
  dg.addColorStop(0,'rgba(255,242,214,0.95)');
  dg.addColorStop(0.35,'rgba(255,196,110,0.60)');
  dg.addColorStop(0.7,'rgba(190,120,80,0.25)');
  dg.addColorStop(1,'rgba(90,50,120,0)');
  ctx2d.fillStyle=dg;
  ctx2d.beginPath(); ctx2d.arc(0,0,R*3.2,0,6.3); ctx2d.fill();
  ctx2d.restore();
  ctx2d.fillStyle='#000000';
  ctx2d.beginPath(); ctx2d.arc(cx,cy,R,0,6.3); ctx2d.fill();
  ctx2d.strokeStyle='rgba(255,250,235,0.92)';
  ctx2d.lineWidth=Math.max(2,w*0.0016);
  ctx2d.beginPath(); ctx2d.arc(cx,cy,R*1.045,0,6.3); ctx2d.stroke();
}

/* ==================== Three.js: TESSERACT ONLY ==================== */
var renderer=null, scene=null, camera=null;
var tessGroup=null;
var journey=0, targetJourney=0;
var isMobile=false, running=true, rafId=0;
var baseFov=62;
var simTime=0, lastT=-1;

function buildTesseract(){
  scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x060503,0.011);
  var W=canvasEl.width, H=canvasEl.height;
  camera=new THREE.PerspectiveCamera(baseFov, W/Math.max(1,H), .1, 900);

  tessGroup=new THREE.Group();

  tessGroup.add(new THREE.AmbientLight(0x8a6a48,0.85));
  var key=new THREE.DirectionalLight(0xffd9a0,1.8);
  key.position.set(12,18,8); tessGroup.add(key);
  var warmA=new THREE.PointLight(0xff9a50,2.4,150);
  warmA.position.set(-10,4,-220); tessGroup.add(warmA);
  var warmB=new THREE.PointLight(0xffb060,2.0,150);
  warmB.position.set(10,-4,-320); tessGroup.add(warmB);
  var warmC=new THREE.PointLight(0xff8a30,1.4,130);
  warmC.position.set(0,6,-420); tessGroup.add(warmC);
  var coolRim=new THREE.PointLight(0x5a7aff,.6,130);
  coolRim.position.set(0,10,-480); tessGroup.add(coolRim);
  var divine=new THREE.PointLight(0xffc080,1.2,200);
  divine.position.set(0,0,-600); tessGroup.add(divine);

  var woodMat=new THREE.MeshStandardMaterial({color:0x9a6535, roughness:.68, metalness:.05});
  var woodDark=new THREE.MeshStandardMaterial({color:0x6e4525, roughness:.75, metalness:.04});
  var bookColors=[0x8a3a2a,0x2a5a8a,0x3a6a3a,0xd4a95a,0x5a3a6a,0xb56a3a,0x2a3a5a,0x9a2a2a,0xc9b458,0x4a7a6a];
  var shelfGeo=new THREE.BoxGeometry(4.4,.22,1.3);
  var frameGeo=new THREE.BoxGeometry(.24,3.4,1.3);
  var bookGeo=new THREE.BoxGeometry(.26,.95,.85);
  var dummy=new THREE.Object3D(), col=new THREE.Color();

  var shelfMesh=new THREE.InstancedMesh(shelfGeo,woodMat,400);
  var frameMesh=new THREE.InstancedMesh(frameGeo,woodDark,400);
  var bookMesh=new THREE.InstancedMesh(bookGeo,
    new THREE.MeshStandardMaterial({color:0xffffff,roughness:.82}),2400);
  var si=0,fi=0,bi=0;

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
        dummy.position.x+=(sd===0?2.2:sd===1?-2.2:0);
        dummy.updateMatrix();
        if(fi<400) frameMesh.setMatrixAt(fi++,dummy.matrix);
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

  var destGlow=new THREE.Mesh(
    new THREE.CircleGeometry(26,32),
    new THREE.MeshBasicMaterial({color:0xff9a40, transparent:true, opacity:.32,
      blending:THREE.AdditiveBlending, depthWrite:false})
  );
  destGlow.position.set(0,0,-640);
  tessGroup.add(destGlow);

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

  tessGroup.visible=true;
  scene.add(tessGroup);
}

function setSize(W,H,DPR){
  var dpr=Math.min(DPR||1, isMobile?1.5:2);
  aspectNow=W/Math.max(1,H);
  if(renderer){
    renderer.setPixelRatio(dpr);
    renderer.setSize(W,H,false);
    bufW=canvasEl.width; bufH=canvasEl.height;
    if(camera){ camera.aspect=W/H; camera.updateProjectionMatrix(); }
  }else{
    bufW=Math.max(2,Math.round(W*dpr));
    bufH=Math.max(2,Math.round(H*dpr));
    canvasEl.width=bufW; canvasEl.height=bufH;
  }
}

function buildScene(canvas, W, H, DPR, mobile){
  canvasEl=canvas;
  isMobile=mobile;
  try{
    gl=canvas.getContext('webgl2',{antialias:false,alpha:false,desynchronized:true,powerPreference:'high-performance'});
  }catch(e){ gl=null; }
  if(gl){
    try{
      initBHGL();
      glBHReady=true;
    }catch(e){
      postMessage({type:'error', msg:'BH-GLSL: '+(e&&e.message||e)});
      return false;
    }
    try{
      renderer=new THREE.WebGLRenderer({canvas:canvas, context:gl, antialias:false, alpha:false});
    }catch(e){
      postMessage({type:'error', msg:'THREE: '+(e&&e.message||e)});
      return false;
    }
    buildTesseract();
  }else{
    if(!initFallback2D()){
      postMessage({type:'error', msg:'WebGL2 dan 2D tidak tersedia'});
      return false;
    }
  }
  setSize(W,H,DPR);
  return true;
}

function frame(t){
  if(!running) return;
  rafId=requestAnimationFrame(frame);
  if(lastT<0){ lastT=t; }
  var dt=Math.min((t-lastT)/1000, 0.1); lastT=t;
  simTime+=dt;

  var dj=Math.abs(targetJourney-journey);
  var distToEdge=Math.min(Math.abs(journey-.30), Math.abs(journey-.44));
  var slowF=distToEdge<.06 ? .35+.65*(distToEdge/.06) : 1;
  var lerpF=Math.min(.12,.03+dj*.25)*slowF+.02*slowF;
  journey+=(targetJourney-journey)*Math.max(.015,lerpF);
  if(Math.abs(targetJourney-journey)<.0004) journey=targetJourney;
  var j=journey, time=simTime;
  var hz=isMobile?0.115:0.135;

  if(fallback2D){
    renderFallback2D(time);
    return;
  }

  if(j<.30){
    /* BLACK HOLE (pure GLSL): kamera mendekat */
    var p=j/.30;
    var e=p*p*(3-2*p);
    var cx=aspectNow*(0.30-0.20*e);
    var cy=0.06-0.05*e;
    renderBH(time, e, 0, cx, cy, hz);
  }else if(j<.44){
    /* THE FALL: warp shader */
    var p2=(j-.30)/.14;
    renderBH(time, 1.0, p2, aspectNow*0.10, 0.01, hz);
  }else{
    /* TESSERACT (Three.js) */
    glResetForThree();
    var p3=(j-.44)/.56;
    var camZ2=-172-p3*380;
    camera.position.set(0, Math.sin(time*.25)*.12, camZ2);
    camera.lookAt(0, Math.sin(time*.25)*.12, camZ2-40);
    camera.fov=baseFov; camera.updateProjectionMatrix();
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
    renderer.render(scene,camera);
  }
}

onmessage=function(e){
  var m=e.data;
  try{
    if(m.type==='init'){
      var ok=buildScene(m.canvas, m.width, m.height, m.dpr, m.isMobile);
      if(ok){
        postMessage({type:'ready'});
        rafId=requestAnimationFrame(frame);
      }
    }else if(m.type==='scroll'){
      targetJourney=Math.max(0,Math.min(1,m.journey));
    }else if(m.type==='resize'){
      setSize(m.width, m.height, m.dpr);
    }else if(m.type==='pause'){
      running=false; if(rafId) cancelAnimationFrame(rafId); rafId=0;
    }else if(m.type==='resume'){
      if(!running){ running=true; lastT=-1; rafId=requestAnimationFrame(frame); }
    }
  }catch(err){
    postMessage({type:'error', msg:String(err&&err.message||err)});
  }
};
