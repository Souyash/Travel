(function(){
  "use strict";
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

  /* nav scroll */
  var nav=$("#nav");
  function onScroll(){ if(nav) nav.classList.toggle("scrolled",window.scrollY>60); }
  onScroll(); window.addEventListener("scroll",onScroll,{passive:true});

  /* mobile menu */
  var mm=$("#mm");
  function openMM(){ if(mm){mm.classList.add("open"); document.body.style.overflow="hidden";} }
  function closeMM(){ if(mm){mm.classList.remove("open"); document.body.style.overflow="";} }
  var burger=$("#burger"); if(burger) burger.addEventListener("click",function(){ mm&&mm.classList.contains("open")?closeMM():openMM(); });
  var mmClose=$("#mmClose"); if(mmClose) mmClose.addEventListener("click",closeMM);
  $$("#mm a").forEach(function(a){a.addEventListener("click",closeMM)});
  document.addEventListener("keydown",function(e){ if(e.key==="Escape")closeMM(); });

  /* hero word-by-word */
  try{
    var h1=$("#heroH1");
    if(h1){ $$(".w",h1).forEach(function(w,i){ w.style.animationDelay=(0.35+i*0.12)+"s"; }); }
  }catch(e){}

  /* hero slideshow */
  try{
    var slides=$$("#heroMedia .hero-slide");
    if(slides.length>1){
      slides.forEach(function(s,i){ s.classList.toggle("on",i===0); });
      var dotsWrap=$("#heroDots");
      slides.forEach(function(s,i){ var b=document.createElement("button"); if(i===0)b.className="on"; b.addEventListener("click",function(){go(i)}); dotsWrap&&dotsWrap.appendChild(b); });
      var dots=dotsWrap?$$("button",dotsWrap):[];
      var cur=0,timer;
      function go(n){ slides[cur].classList.remove("on"); dots[cur]&&dots[cur].classList.remove("on"); cur=(n+slides.length)%slides.length; slides[cur].classList.add("on"); dots[cur]&&dots[cur].classList.add("on"); restart(); }
      function next(){ go(cur+1); }
      function restart(){ clearInterval(timer); timer=setInterval(next,5000); }
      restart();
    }
  }catch(e){}

  /* reveal on scroll */
  try{
    if("IntersectionObserver" in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target);} })},{threshold:.14,rootMargin:"0px 0px -8% 0px"});
      $$(".reveal").forEach(function(el){io.observe(el)});
    } else { $$(".reveal").forEach(function(el){el.classList.add("in")}); }
  }catch(e){ $$(".reveal").forEach(function(el){el.classList.add("in")}); }

  /* counters */
  try{
    var seen=false;
    function runCounters(){ if(seen)return; seen=true;
      $$(".num[data-count]").forEach(function(el){
        var target=+el.getAttribute("data-count"), suf=el.getAttribute("data-suf")||"", t0=performance.now(), dur=1700;
        function fmt(n){return n>=1000?Math.round(n).toLocaleString("en-IN"):String(Math.round(n))}
        function tick(now){ var p=Math.min((now-t0)/dur,1), e=1-Math.pow(1-p,3);
          el.innerHTML=fmt(target*e)+(p===1?'<span class="suf">'+suf+'</span>':''); if(p<1)requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
      });
    }
    var statSec=$(".stats");
    if(statSec && "IntersectionObserver" in window){
      var sio=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){runCounters();sio.disconnect();}})},{threshold:.3});
      sio.observe(statSec);
    } else { runCounters(); }
  }catch(e){}

  /* map interaction */
  try{
    var MAP={"kashmir": {"state": "Jammu &amp; Kashmir", "name": "Kashmir", "img": "https://images.unsplash.com/photo-1715457573748-8e8a70b2c1be?q=80&w=1100&auto=format&fit=crop", "desc": "A valley of shikaras, saffron fields and Himalayan meadows \u2014 India at its most poetic.", "best": "Apr\u2013Oct", "days": "6\u20138 days", "known": "Dal Lake"}, "ladakh": {"state": "Ladakh", "name": "Ladakh", "img": "https://images.unsplash.com/photo-1619837374214-f5b9eb80876d?q=80&w=1100&auto=format&fit=crop", "desc": "A high-altitude desert of turquoise lakes, ancient gompas and the planet's most cinematic roads.", "best": "Jun\u2013Sep", "days": "8\u201310 days", "known": "Pangong Lake"}, "rajasthan": {"state": "Rajasthan", "name": "Rajasthan", "img": "https://images.unsplash.com/photo-1638904998527-a451c1fbd1cb?q=80&w=1100&auto=format&fit=crop", "desc": "Lake palaces, clifftop forts and the golden Thar \u2014 the India of royal imagination.", "best": "Oct\u2013Mar", "days": "9\u201312 days", "known": "Lake palaces"}, "meghalaya": {"state": "Meghalaya", "name": "Meghalaya", "img": "https://images.unsplash.com/photo-1589983846997-04788035bc83?q=80&w=1100&auto=format&fit=crop", "desc": "The abode of clouds: living-root bridges, waterfalls and the greenest hills in the country.", "best": "Sep\u2013May", "days": "6\u20137 days", "known": "Root bridges"}, "goa": {"state": "Goa", "name": "Goa", "img": "https://images.unsplash.com/photo-1624554305378-0f440dd3a8c1?q=80&w=1100&auto=format&fit=crop", "desc": "Sun-warmed beaches, Portuguese heritage and the easy rhythm of the Konkan coast.", "best": "Nov\u2013Feb", "days": "4\u20136 days", "known": "Beaches"}, "kerala": {"state": "Kerala", "name": "Kerala", "img": "https://images.unsplash.com/photo-1704365159747-1f7b8913044f?q=80&w=1100&auto=format&fit=crop", "desc": "God's own country \u2014 backwaters, tea hills and a spice coast steeped in slow living.", "best": "Sep\u2013Mar", "days": "7\u20139 days", "known": "Backwaters"}};
    var panel={img:$("#mpImg"),st:$("#mpState"),nm:$("#mpName"),ds:$("#mpDesc"),be:$("#mpBest"),dy:$("#mpDays"),kn:$("#mpKnown")};
    function show(k){
      var d=MAP[k]; if(!d)return;
      if(panel.img){panel.img.src=d.img;panel.img.alt=d.name;}
      panel.st.textContent=d.state; panel.nm.textContent=d.name; panel.ds.textContent=d.desc;
      panel.be.textContent=d.best; panel.dy.textContent=d.days; panel.kn.textContent=d.known;
      $$(".mk").forEach(function(m){m.classList.toggle("active",m.getAttribute("data-k")===k)});
      $$(".state.hot").forEach(function(s){s.classList.toggle("active",s.getAttribute("data-link")===k)});
    }
    $$(".mk").forEach(function(m){
      var k=m.getAttribute("data-k");
      m.addEventListener("mouseenter",function(){show(k)});
      m.addEventListener("click",function(){show(k); var p=$("#mapPanel"); if(window.innerWidth<1024&&p)p.scrollIntoView({behavior:"smooth",block:"center"});});
      m.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();show(k);}});
    });
    show("kashmir");
  }catch(e){}

  /* landscape scroll-drive */
  try{
    var land=$(".land.drive"), landSticky=land?$(".sticky",land):null, track=$("#landTrack");
    var landMQ=window.matchMedia("(min-width:1024px)");
    var reduceMQ=window.matchMedia("(prefers-reduced-motion: reduce)");
    var landMaxX=0, landScroll=0, landTicking=false;
    function landActive(){return !!(land&&landSticky&&track&&landMQ.matches&&!reduceMQ.matches)}
    function resetLand(){
      if(!land||!track)return;
      land.style.removeProperty("--land-scroll");
      track.style.removeProperty("--land-x");
    }
    function updateLand(){
      if(!landActive())return;
      var rect=land.getBoundingClientRect();
      var p=Math.max(0,Math.min(1,-rect.top/landScroll));
      track.style.setProperty("--land-x",(-landMaxX*p).toFixed(2)+"px");
    }
    function measureLand(){
      if(!land||!track)return;
      if(!landActive()){resetLand();return;}
      landMaxX=Math.max(0,track.scrollWidth-window.innerWidth);
      landScroll=Math.max(landMaxX*1.25,window.innerHeight*1.15);
      land.style.setProperty("--land-scroll",landScroll.toFixed(0)+"px");
      updateLand();
    }
    function requestLandUpdate(){
      if(landTicking)return;
      landTicking=true;
      requestAnimationFrame(function(){landTicking=false;updateLand();});
    }
    measureLand();
    window.addEventListener("load",measureLand,{once:true});
    window.addEventListener("resize",measureLand);
    window.addEventListener("scroll",requestLandUpdate,{passive:true});
    if(landMQ.addEventListener){
      landMQ.addEventListener("change",measureLand);
      reduceMQ.addEventListener("change",measureLand);
    }else{
      landMQ.addListener(measureLand);
      reduceMQ.addListener(measureLand);
    }
  }catch(e){}

  /* image error -> soft gradient so nothing looks broken */
  $$("img").forEach(function(im){
    im.addEventListener("error",function(){
      if(im.dataset.fallback)return; im.dataset.fallback=1;
      im.style.background="linear-gradient(150deg,#12324f,#0a2036)";
      im.removeAttribute("src");
    });
  });
})();

/* --- Call FAB Interaction --- */
(function(){
  var fab=document.getElementById("callFab");
  if(!fab)return;
  /* scrolling dims it */
  window.addEventListener("scroll",function(){ fab.classList.add("dim"); },{passive:true});
  /* hovering or clicking brings it back to full — and it stays full until the next scroll */
  function wake(){ fab.classList.remove("dim"); }
  fab.addEventListener("mouseenter",wake);
  fab.addEventListener("focus",wake);
  fab.addEventListener("click",wake);
})();

/* --- Backend API & Modal Interactions --- */
(function(){
  "use strict";

  // Toast notifier
  var toastBox = document.getElementById("toastBox");
  var toastMsg = document.getElementById("toastMsg");
  var toastTimer;
  function showToast(msg, isSuccess) {
    if (!toastBox || !toastMsg) return;
    toastMsg.textContent = msg;
    toastBox.className = "toast-box show " + (isSuccess ? "success" : "error");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){
      toastBox.classList.remove("show");
    }, 4500);
  }

  // Modals management
  var inquiryModal = document.getElementById("inquiryModal");
  var callbackModal = document.getElementById("callbackModal");

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
  function closeAllModals() {
    closeModal(inquiryModal);
    closeModal(callbackModal);
  }

  // Close triggers
  var inquiryClose = document.getElementById("inquiryClose");
  var callbackClose = document.getElementById("callbackClose");
  if (inquiryClose) inquiryClose.addEventListener("click", function(){ closeModal(inquiryModal); });
  if (callbackClose) callbackClose.addEventListener("click", function(){ closeModal(callbackModal); });

  [inquiryModal, callbackModal].forEach(function(modal){
    if (!modal) return;
    modal.addEventListener("click", function(e){
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", function(e){
    if (e.key === "Escape") closeAllModals();
  });

  // Open Inquiry Modal Triggers
  function setupPlanBtn(btn, defaultDest) {
    if (!btn) return;
    btn.addEventListener("click", function(e){
      e.preventDefault();
      var destSelect = document.getElementById("iqDest");
      if (destSelect && defaultDest) {
        for (var i = 0; i < destSelect.options.length; i++) {
          if (destSelect.options[i].value.toLowerCase().indexOf(defaultDest.toLowerCase()) !== -1) {
            destSelect.selectedIndex = i;
            break;
          }
        }
      }
      openModal(inquiryModal);
    });
  }

  setupPlanBtn(document.getElementById("btnPlanNav"));
  setupPlanBtn(document.getElementById("btnPlanMobile"));
  setupPlanBtn(document.getElementById("btnPlanHero"));

  // Connect destination cards to pre-select inquiry
  var dcards = document.querySelectorAll(".dcard");
  dcards.forEach(function(card){
    var titleEl = card.querySelector("h3");
    var destName = titleEl ? titleEl.textContent.trim() : "";
    var arw = card.querySelector(".arw");
    if (arw) {
      arw.style.cursor = "pointer";
      setupPlanBtn(arw, destName);
    }
  });

  // FAB Click -> Open Callback Modal instead of direct tel navigation on desktop
  var fab = document.getElementById("callFab");
  if (fab) {
    fab.addEventListener("click", function(e){
      // On mobile devices, let standard telephone link fire if tapped, on larger screens open modal
      if (window.innerWidth > 640) {
        e.preventDefault();
        openModal(callbackModal);
      }
    });
  }

  // 1. Submit Journey Inquiry Form -> POST /api/inquiries
  var inquiryForm = document.getElementById("inquiryForm");
  if (inquiryForm) {
    inquiryForm.addEventListener("submit", async function(e){
      e.preventDefault();
      var submitBtn = inquiryForm.querySelector("button[type='submit']");
      var originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Crafting your request...";

      var payload = {
        name: document.getElementById("iqName").value,
        phone: document.getElementById("iqPhone").value,
        email: document.getElementById("iqEmail").value,
        destination: document.getElementById("iqDest").value,
        travellers: document.getElementById("iqTravellers").value,
        travel_date: document.getElementById("iqDate").value,
        travel_style: document.getElementById("iqStyle").value,
        message: document.getElementById("iqMessage").value
      };

      try {
        var res = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        var data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message, true);
          inquiryForm.reset();
          closeModal(inquiryModal);
        } else {
          showToast(data.error || "Failed to submit request", false);
        }
      } catch (err) {
        showToast("Network error. Please try again.", false);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // 2. Submit Callback Form -> POST /api/callbacks
  var callbackForm = document.getElementById("callbackForm");
  if (callbackForm) {
    callbackForm.addEventListener("submit", async function(e){
      e.preventDefault();
      var submitBtn = callbackForm.querySelector("button[type='submit']");
      var originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      var payload = {
        phone: document.getElementById("cbPhone").value,
        preferred_time: document.getElementById("cbTime").value
      };

      try {
        var res = await fetch("/api/callbacks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        var data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message, true);
          callbackForm.reset();
          closeModal(callbackModal);
        } else {
          showToast(data.error || "Could not register callback", false);
        }
      } catch (err) {
        showToast("Network error. Please try again.", false);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // 3. Submit Newsletter Form -> POST /api/newsletter
  var newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async function(e){
      e.preventDefault();
      var emailInput = document.getElementById("nlEmail");
      if (!emailInput || !emailInput.value) return;

      var submitBtn = newsletterForm.querySelector("button[type='submit']");
      var originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Connecting...";

      try {
        var res = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailInput.value, source: "homepage_cta" })
        });
        var data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message, true);
          emailInput.value = "";
        } else {
          showToast(data.error || "Subscription error", false);
        }
      } catch (err) {
        showToast("Network error. Please try again.", false);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
})();