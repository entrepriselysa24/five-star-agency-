import './style.css';
import * as THREE from 'three';

const LOGO_COMPLETO = '/brand/logo-completo.png';

/* Pulsanti "Prenota una consulenza": portano al modulo */
document.querySelectorAll('[data-prenota]').forEach(function(a){ a.href = '#modulo'; });

/* Modulo contatti */
(function(){
  var f = document.getElementById('modulo');
  if(!f) return;
  var esito = document.getElementById('f-esito'), invia = document.getElementById('f-invia');
  function dice(t, no){ esito.textContent = t; esito.classList.toggle('no', !!no); }
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var obbligatori = ['f-nome','f-attivita','f-telefono'], manca = null;
    obbligatori.forEach(function(id){
      var el = document.getElementById(id), vuoto = !el.value.trim();
      el.closest('.campo').classList.toggle('errore', vuoto);
      if(vuoto && !manca) manca = el;
    });
    if(manca){ manca.focus(); dice('Compila nome, attività e telefono per inviare la richiesta.', true); return; }
    if(!document.getElementById('f-privacy').checked){ dice('Spunta il consenso al trattamento dei dati per inviare.', true); return; }
    if(f.botcheck.value) return;

    var d = new FormData(f);
    var servizi = d.getAll('servizi').join(', ') || 'non indicato';
    var righe = [
      'Nuova richiesta di consulenza dal sito',
      'Nome: ' + d.get('nome'),
      'Attività: ' + d.get('attivita') + (d.get('tipo') ? ' (' + d.get('tipo') + ')' : ''),
      'Telefono: ' + d.get('telefono'),
      'Email: ' + (d.get('email') || 'non indicata'),
      'Servizi: ' + servizi,
      'Budget: ' + (d.get('budget') || 'non indicato'),
      'Messaggio: ' + (d.get('messaggio') || '-')
    ];

    function suWhatsApp(){
      window.open('https://wa.me/393792319527?text=' + encodeURIComponent(righe.join('\n')), '_blank', 'noopener');
    }
    invia.disabled = true; dice('Invio in corso…');
    var dati = {
      _subject: 'Nuova richiesta dal sito: ' + d.get('attivita'),
      _template: 'table',
      _captcha: 'false',
      Nome: d.get('nome'), Attivita: d.get('attivita'), Tipo: d.get('tipo') || '-',
      Telefono: d.get('telefono'), Email: d.get('email') || '-',
      Servizi: servizi, Budget: d.get('budget') || '-', Messaggio: d.get('messaggio') || '-'
    };
    if(d.get('email')) dati._replyto = d.get('email');
    fetch('https://formsubmit.co/ajax/fivestaragency.it@gmail.com', {method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json'}, body:JSON.stringify(dati)})
      .then(function(r){ return r.json(); })
      .then(function(r){
        if(r.success === 'true' || r.success === true){ f.reset(); dice('Richiesta inviata. Ti ricontattiamo al più presto.'); }
        else { suWhatsApp(); dice('Non siamo riusciti a inviare il modulo: ti abbiamo aperto WhatsApp con la richiesta già scritta.', true); }
      })
      .catch(function(){ suWhatsApp(); dice('Invio non riuscito: ti abbiamo aperto WhatsApp con la richiesta già scritta.', true); })
      .then(function(){ invia.disabled = false; });
  });
  f.querySelectorAll('input,select,textarea').forEach(function(el){
    el.addEventListener('input', function(){ var c = el.closest('.campo'); if(c) c.classList.remove('errore'); });
  });
})();

/* Menu su telefono */
(function(){
  var b = document.getElementById('burger'), m = document.getElementById('menu');
  if(!b || !m) return;
  function chiudi(){ m.classList.remove('aperto'); b.setAttribute('aria-expanded','false'); b.setAttribute('aria-label','Apri il menu'); }
  b.addEventListener('click', function(){
    var aperto = m.classList.toggle('aperto');
    b.setAttribute('aria-expanded', aperto ? 'true' : 'false');
    b.setAttribute('aria-label', aperto ? 'Chiudi il menu' : 'Apri il menu');
  });
  m.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', chiudi); });
})();

/* Link WhatsApp con il nome del pacchetto già scritto */
(function(){
  document.querySelectorAll('.pacchetto').forEach(function(card){
    var nome = card.querySelector('h3').textContent.trim();
    var b = card.querySelector('.btn');
    b.href = 'https://wa.me/393792319527?text=' + encodeURIComponent('Ciao Five Star Agency, vorrei informazioni sul pacchetto ' + nome);
    b.target = '_blank'; b.rel = 'noopener';
  });
})();

/* ---------- MOVIMENTO ---------- */
var muoviPoco = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Header compatto dopo lo scroll e voce di menu attiva */
(function(){
  var nav = document.querySelector('nav');
  var voci = [].slice.call(document.querySelectorAll('.links a'));
  var sezioni = voci.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  var inAttesa = false;
  function aggiorna(){
    inAttesa = false;
    nav.classList.toggle('compatto', window.scrollY > 40);
    var y = window.scrollY + window.innerHeight * 0.35, attiva = 0;
    sezioni.forEach(function(s,i){ if(s && s.offsetTop <= y) attiva = i; });
    voci.forEach(function(a,i){ a.classList.toggle('qui', i === attiva); });
  }
  window.addEventListener('scroll', function(){ if(!inAttesa){ inAttesa = true; requestAnimationFrame(aggiorna); } }, {passive:true});
  aggiorna();
})();

/* Comparsa morbida delle sezioni */
(function(){
  if(muoviPoco || !('IntersectionObserver' in window)) return;
  var gruppi = ['.testa','.chi-griglia > *','.team .persona','.numeri > div','.servizio','.cinque .s','.pacchetto','.caso','.domanda','.contatti .testo','.modulo'];
  var elementi = [];
  gruppi.forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el, i){ el.style.setProperty('--i', i % 6); elementi.push(el); });
  });
  var oss = new IntersectionObserver(function(voci){
    voci.forEach(function(v){
      if(!v.isIntersecting) return;
      var el = v.target; oss.unobserve(el);
      el.classList.remove('attesa');
      // a comparsa finita toglie la transizione lenta, così hover e inclinazione restano scattanti
      setTimeout(function(){ el.classList.remove('rivela'); }, 1600);
    });
  }, {rootMargin:'0px 0px -8% 0px'});
  elementi.forEach(function(el){
    // nasconde solo ciò che al caricamento è ancora sotto lo schermo
    if(el.getBoundingClientRect().top > window.innerHeight){ el.classList.add('rivela','attesa'); oss.observe(el); }
  });
})();

/* Numeri che salgono quando compaiono */
(function(){
  var numeri = document.querySelectorAll('.numeri b');
  if(muoviPoco || !('IntersectionObserver' in window)) return;
  var oss = new IntersectionObserver(function(voci){
    voci.forEach(function(v){
      if(!v.isIntersecting) return;
      oss.unobserve(v.target);
      var el = v.target, testo = el.textContent, fine = parseInt(testo, 10), suffisso = testo.replace(/[0-9]/g,'');
      if(isNaN(fine)) return;
      var t0 = performance.now(), durata = 1400;
      (function passo(t){
        var k = Math.min(1, (t - t0) / durata), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(fine * e) + suffisso;
        if(k < 1) requestAnimationFrame(passo);
      })(t0);
    });
  }, {threshold:.6});
  numeri.forEach(function(n){ oss.observe(n); });
})();

/* Schede che si inclinano appena seguendo il mouse (solo con mouse, non su telefono) */
(function(){
  if(muoviPoco || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.pacchetto,.persona').forEach(function(card){
    card.addEventListener('pointermove', function(e){
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = 'perspective(800px) rotateX(' + (-y * 5) + 'deg) rotateY(' + (x * 6) + 'deg) translateY(-4px)';
    });
    card.addEventListener('pointerleave', function(){ card.style.transform = ''; });
  });
})();

/* Scena 3D dell'entrata: telefono, icone social, nastro d'oro e stella */
(function(){
  var box = document.getElementById('scena');
  var renderer;
  // Telefoni e dispositivi meno potenti: meno pixel e meno particelle, così il 3D resta fluido
  var leggero = window.matchMedia('(max-width: 760px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  try{ renderer = new THREE.WebGLRenderer({antialias:!leggero, alpha:true, powerPreference:'high-performance'}); }catch(e){ return; }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, leggero ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  box.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1.12, 0.1, 100);
  camera.position.set(0, 0.3, 13);
  camera.lookAt(0, -0.1, 0);

  // Riflessi: stanza buia con luci morbide, per oro e vetro
  var c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  var x = c.getContext('2d');
  var bg = x.createLinearGradient(0,0,0,512);
  bg.addColorStop(0,'#2a2318'); bg.addColorStop(.55,'#080706'); bg.addColorStop(1,'#17130c');
  x.fillStyle = bg; x.fillRect(0,0,1024,512);
  function luce(px,py,w,a){ var g=x.createRadialGradient(px,py,0,px,py,w); g.addColorStop(0,'rgba(255,240,210,'+a+')'); g.addColorStop(1,'rgba(255,240,210,0)'); x.fillStyle=g; x.fillRect(px-w,py-w,w*2,w*2); }
  luce(250,130,190,1); luce(780,120,150,.7); luce(520,440,260,.35);
  x.fillStyle='rgba(255,246,225,.95)'; x.fillRect(120,40,5,220); x.fillRect(860,70,4,170); x.fillRect(470,20,140,4);
  var envTex = new THREE.CanvasTexture(c);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.encoding = THREE.sRGBEncoding;
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(envTex).texture;

  var key = new THREE.DirectionalLight(0xfff0d0, 1.1); key.position.set(4,5,6); scene.add(key);
  var rim = new THREE.DirectionalLight(0xc9a961, 0.9); rim.position.set(-5,-2,-3); scene.add(rim);

  var oro = new THREE.MeshStandardMaterial({color:0xd2b06a, metalness:1, roughness:0.2, envMapIntensity:1.3});
  var oroLucido = new THREE.MeshStandardMaterial({color:0xd8b870, metalness:1, roughness:0.12, envMapIntensity:1.5, flatShading:true});
  var nero = new THREE.MeshStandardMaterial({color:0x0c0b09, metalness:.5, roughness:.35, envMapIntensity:.8});
  var pietra = new THREE.MeshStandardMaterial({color:0x151310, metalness:.1, roughness:.85, flatShading:true});

  var mondo = new THREE.Group(); scene.add(mondo);

  function rettangoloTondo(w,h,r){
    var s = new THREE.Shape();
    s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2); s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
    s.lineTo(w/2,h/2-r); s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
    s.lineTo(-w/2+r,h/2); s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
    s.lineTo(-w/2,-h/2+r); s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    return s;
  }
  function tela(w,h){ var cv=document.createElement('canvas'); cv.width=w; cv.height=h; return cv; }
  function sfumaOro(ctx,x0,y0,x1,y1){ var g=ctx.createLinearGradient(x0,y0,x1,y1); g.addColorStop(0,'#F3E2B5'); g.addColorStop(.55,'#C9A961'); g.addColorStop(1,'#8A6C34'); return g; }
  function stella2d(ctx,cx,cy,R,r){ ctx.beginPath(); for(var i=0;i<10;i++){ var a=-Math.PI/2+i*Math.PI/5, rad=i%2?r:R; var px=cx+Math.cos(a)*rad, py=cy+Math.sin(a)*rad; if(i) ctx.lineTo(px,py); else ctx.moveTo(px,py);} ctx.closePath(); }

  /* ---------- Piedistallo ---------- */
  var base = new THREE.Mesh(new THREE.CylinderGeometry(1.75,1.85,0.28,72), nero);
  base.position.set(-0.7,-2.55,0); mondo.add(base);
  var bordo = new THREE.Mesh(new THREE.TorusGeometry(1.76,0.018,8,96), oro);
  bordo.rotation.x = Math.PI/2; bordo.position.set(-0.7,-2.41,0); mondo.add(bordo);

  /* ---------- Telefono ---------- */
  var telefono = new THREE.Group();
  var W = 2.0, H = 4.0, D = 0.16;
  var corpoGeo = new THREE.ExtrudeGeometry(rettangoloTondo(W,H,0.3), {depth:D, bevelEnabled:true, bevelThickness:0.05, bevelSize:0.05, bevelSegments:5, curveSegments:10});
  corpoGeo.center();
  telefono.add(new THREE.Mesh(corpoGeo, oro));

  var schermoTela = tela(512,1024);
  function disegnaSchermo(){
    var s = schermoTela.getContext('2d');
    var g = s.createLinearGradient(0,0,0,1024); g.addColorStop(0,'#14110c'); g.addColorStop(.5,'#060505'); g.addColorStop(1,'#0f0d0a');
    s.fillStyle=g; s.fillRect(0,0,512,1024);
    var alone = s.createRadialGradient(256,420,0,256,420,300); alone.addColorStop(0,'rgba(201,169,97,.18)'); alone.addColorStop(1,'rgba(201,169,97,0)');
    s.fillStyle=alone; s.fillRect(0,0,512,1024);
    s.fillStyle='#000'; s.beginPath(); s.ellipse(256,44,64,16,0,0,Math.PI*2); s.fill();
    if(logoSchermo.complete && logoSchermo.naturalWidth){
      // logo ufficiale al centro dello schermo del telefono
      var lw = 400, lh = lw * logoSchermo.naturalHeight / logoSchermo.naturalWidth;
      s.drawImage(logoSchermo, (512 - lw) / 2, 200, lw, lh);
    } else {
      s.fillStyle=sfumaOro(s,180,260,330,420); stella2d(s,256,340,92,38); s.fill();
    }
    s.textAlign='center';
    s.font='400 20px Manrope, sans-serif'; s.fillStyle='#8E8576';
    if('letterSpacing' in s) s.letterSpacing='8px';
    ['MARKETING','SOCIAL MEDIA','BRANDING','WEB'].forEach(function(t,i){ s.fillText(t,260,700+i*44); });
    schermoTex.needsUpdate = true;
  }
  var schermoTex = new THREE.CanvasTexture(schermoTela);
  schermoTex.encoding = THREE.sRGBEncoding;
  schermoTex.anisotropy = 4;
  var schermo = new THREE.Mesh(new THREE.ShapeGeometry(rettangoloTondo(W-0.16,H-0.16,0.24)), new THREE.MeshStandardMaterial({map:schermoTex, roughness:.08, metalness:.2, envMapIntensity:.6, emissive:0xffffff, emissiveMap:schermoTex, emissiveIntensity:.55}));
  // coordinate UV della forma: da [-w/2,w/2] a [0,1]
  (function(){ var uv=schermo.geometry.attributes.uv, p=schermo.geometry.attributes.position; for(var i=0;i<uv.count;i++){ uv.setXY(i,(p.getX(i)+(W-0.16)/2)/(W-0.16),(p.getY(i)+(H-0.16)/2)/(H-0.16)); } uv.needsUpdate=true; })();
  schermo.position.z = D/2+0.051;
  telefono.add(schermo);
  var logoSchermo = new Image();
  logoSchermo.onload = disegnaSchermo;
  logoSchermo.src = LOGO_COMPLETO;
  disegnaSchermo();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(disegnaSchermo);

  telefono.position.set(-0.7,-0.35,0.1);
  telefono.rotation.set(0.02,-0.42,-0.1);
  mondo.add(telefono);

  /* ---------- Nastro d'oro che avvolge il telefono ---------- */
  var punti = [];
  for(var i=0;i<=60;i++){
    var t = i/60, a = t*Math.PI*2.2 - 0.6;
    punti.push(new THREE.Vector3(-0.7 + Math.cos(a)*1.75, -2.2 + t*4.6 + Math.sin(a*2)*.15, Math.sin(a)*1.1));
  }
  var curva = new THREE.CatmullRomCurve3(punti);
  var nastro = new THREE.Mesh(new THREE.TubeGeometry(curva, leggero ? 140 : 260, 0.075, leggero ? 10 : 16, false), oro);
  nastro.scale.set(1,1,1);
  mondo.add(nastro);

  /* ---------- Icone social di vetro scuro ---------- */
  function iconaTela(disegna){
    var cv = tela(256,256), g = cv.getContext('2d');
    g.strokeStyle = sfumaOro(g,40,40,216,216); g.fillStyle = g.strokeStyle;
    g.lineWidth = 14; g.lineCap='round'; g.lineJoin='round';
    disegna(g);
    var tx = new THREE.CanvasTexture(cv); tx.encoding = THREE.sRGBEncoding; return tx;
  }
  function quadroTondo(g,x0,y0,w,h,r){ g.beginPath(); g.moveTo(x0+r,y0); g.arcTo(x0+w,y0,x0+w,y0+h,r); g.arcTo(x0+w,y0+h,x0,y0+h,r); g.arcTo(x0,y0+h,x0,y0,r); g.arcTo(x0,y0,x0+w,y0,r); g.closePath(); }
  var glifi = {
    ig:function(g){ quadroTondo(g,64,64,128,128,38); g.stroke(); g.beginPath(); g.arc(128,128,30,0,Math.PI*2); g.stroke(); g.beginPath(); g.arc(166,90,9,0,Math.PI*2); g.fill(); },
    tt:function(g){ g.beginPath(); g.moveTo(138,58); g.lineTo(138,164); g.stroke(); g.beginPath(); g.arc(108,164,30,0,Math.PI*2); g.stroke(); g.beginPath(); g.moveTo(138,58); g.quadraticCurveTo(146,100,192,104); g.stroke(); },
    meta:function(g){ g.beginPath(); for(var k=0;k<=120;k++){ var t=k/120*Math.PI*2, d=1+Math.sin(t)*Math.sin(t); var px=128+78*Math.cos(t)/d, py=128+62*Math.sin(t)*Math.cos(t)/d; if(k) g.lineTo(px,py); else g.moveTo(px,py);} g.stroke(); },
    li:function(g){ g.font='700 112px Manrope, Arial, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('in',128,136); },
    chart:function(g){ g.fillRect(64,150,30,46); g.fillRect(112,118,30,78); g.fillRect(160,88,30,108); g.beginPath(); g.moveTo(60,132); g.lineTo(110,92); g.lineTo(140,108); g.lineTo(196,58); g.stroke(); g.beginPath(); g.moveTo(170,58); g.lineTo(196,58); g.lineTo(196,84); g.stroke(); }
  };
  var tesseraGeo = new THREE.ExtrudeGeometry(rettangoloTondo(0.66,0.66,0.16), {depth:0.06, bevelEnabled:true, bevelThickness:0.04, bevelSize:0.04, bevelSegments:4, curveSegments:6});
  tesseraGeo.center();
  var vetro = new THREE.MeshStandardMaterial({color:0x17140f, metalness:.7, roughness:.18, envMapIntensity:1.1});
  var icone = [
    {g:'ig',    p:[-2.55, 1.35, 0.6]},
    {g:'meta',  p:[-2.75, 0.05, 0.4]},
    {g:'tt',    p:[ 0.65, 0.85, 0.8]},
    {g:'li',    p:[ 0.85,-0.25, 0.9]},
    {g:'chart', p:[ 0.7, -1.35, 0.9]}
  ].map(function(d,i){
    var grp = new THREE.Group();
    grp.add(new THREE.Mesh(tesseraGeo, vetro));
    var fronte = new THREE.Mesh(new THREE.PlaneGeometry(0.62,0.62), new THREE.MeshBasicMaterial({map:iconaTela(glifi[d.g]), transparent:true}));
    fronte.position.z = 0.072; grp.add(fronte);
    var cornice = new THREE.Mesh(new THREE.EdgesGeometry(new THREE.ShapeGeometry(rettangoloTondo(0.7,0.7,0.17))), new THREE.LineBasicMaterial({color:0xc9a961, transparent:true, opacity:.5}));
    cornice.position.z = 0.073; grp.add(cornice);
    grp.position.set(d.p[0],d.p[1],d.p[2]);
    grp.rotation.y = d.p[0] < 0 ? 0.35 : -0.3;
    grp.userData = {y:d.p[1], fase:i*1.3};
    mondo.add(grp);
    return grp;
  });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){
    var li = icone[3].children[1]; li.material.map = iconaTela(glifi.li); li.material.needsUpdate = true;
  });

  /* ---------- Stella sfaccettata sulla roccia ---------- */
  var R = 1.3, r = 0.52, alto = 0.38, v = [], giro = [];
  for(var j=0;j<10;j++){ var aa = Math.PI/2 + j*Math.PI/5, rr = j%2 ? r : R; giro.push([Math.cos(aa)*rr, Math.sin(aa)*rr]); }
  for(var k=0;k<10;k++){
    var p = giro[k], q = giro[(k+1)%10];
    v.push(0,0,alto, p[0],p[1],0, q[0],q[1],0);
    v.push(0,0,-alto, q[0],q[1],0, p[0],p[1],0);
  }
  var stellaGeo = new THREE.BufferGeometry();
  stellaGeo.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  stellaGeo.computeVertexNormals();
  var stella = new THREE.Mesh(stellaGeo, oroLucido);
  stella.add(new THREE.LineSegments(new THREE.EdgesGeometry(stellaGeo,1), new THREE.LineBasicMaterial({color:0xf3e2b5, transparent:true, opacity:.3})));
  stella.position.set(2.45,-0.75,-0.4);
  mondo.add(stella);
  var roccia = new THREE.Mesh(new THREE.DodecahedronGeometry(1,1), pietra);
  roccia.scale.set(1.25,0.38,0.9); roccia.position.set(2.45,-2.35,-0.4);
  mondo.add(roccia);

  /* ---------- Polvere d'oro ---------- */
  var N = leggero ? 40 : 80, pos = new Float32Array(N*3);
  for(var n=0;n<N;n++){ pos[n*3]=(Math.random()-.5)*8; pos[n*3+1]=(Math.random()-.5)*6; pos[n*3+2]=-1.5-Math.random()*2; }
  var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos,3));
  var polvere = new THREE.Points(pg, new THREE.PointsMaterial({color:0xe2c98e, size:0.026, transparent:true, opacity:.5, depthWrite:false}));
  scene.add(polvere);

  function resize(){
    var w = box.clientWidth, h = box.clientHeight;
    if(!w||!h) return;
    renderer.setSize(w,h,false);
    camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  var mx=0, my=0, tx=0, ty=0;
  window.addEventListener('pointermove', function(e){
    tx = (e.clientX/window.innerWidth - .5)*2;
    ty = (e.clientY/window.innerHeight - .5)*2;
  });

  var start = performance.now();
  box.classList.add('pronta');

  function frame(now){
    var t = (now - start)/1000;
    mx += (tx-mx)*.035; my += (ty-my)*.035;
    var intro = reduce ? 1 : Math.min(1, t/2.2), e = 1 - Math.pow(1-intro, 4);
    mondo.scale.setScalar(0.9 + 0.1*e);
    mondo.rotation.y = (1-e)*-0.5 + mx*.18;
    mondo.rotation.x = my*.06;
    if(!reduce){
      telefono.position.y = -0.35 + Math.sin(t*.7)*.05;
      icone.forEach(function(ic){ ic.position.y = ic.userData.y + Math.sin(t*.9+ic.userData.fase)*.09; ic.rotation.z = Math.sin(t*.6+ic.userData.fase)*.06; });
      stella.rotation.y = Math.sin(t*.35)*.5 - .3;
      polvere.rotation.y = t*.015;
    } else {
      stella.rotation.y = -.3;
    }
    renderer.render(scene, camera);
    if(attivo) requestAnimationFrame(frame); else inPausa = true;
  }
  // La scena si ferma quando non si vede (pagina scorsa o scheda in secondo piano): meno batteria e più fluidità
  var attivo = true, inPausa = false;
  function riprendi(){ if(attivo && inPausa){ inPausa = false; requestAnimationFrame(frame); } }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(v){ attivo = v[0].isIntersecting && !document.hidden; riprendi(); }).observe(box);
  }
  document.addEventListener('visibilitychange', function(){ attivo = !document.hidden; riprendi(); });
  requestAnimationFrame(frame);
})();
