
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const PAGES = ["#formCard","#video1Card","#video2Card","#quizCard","#ratingCard","#doneCard"];
function show(id){ PAGES.forEach(p => $(p).classList.add("hidden")); $(id).classList.remove("hidden"); window.scrollTo({top:0,behavior:"smooth"}); }
function setProgress(step){ const bar = $("#bar"); const steps = PAGES.length-1; bar.style.width = Math.round((step/steps)*100) + "%"; }
const isSaudiId = v => /^[12]\d{9}$/.test((v||"").trim());
const isSaPhone = v => /^05\d{8}$/.test((v||"").trim());
$("#scrollStart").addEventListener("click", ()=> $("#formCard").scrollIntoView({behavior:'smooth'}));

$("#startBtn").addEventListener("click", async () => {
  const name = $("#name").value.trim();
  const id = $("#idNumber").value.trim();
  const phone = $("#phone").value.trim();
  const email = $("#email").value.trim();
  const birth = $("#birthdate").value;
  if(!name) return alert("الرجاء إدخال الاسم الرباعي");
  if(!isSaudiId(id)) return alert("رقم الهوية غير صحيح (10 أرقام سعودية)");
  if(!isSaPhone(phone)) return alert("رقم الجوال السعودي يبدأ بـ05 ويتكون من 10 أرقام");
  if(!email) return alert("الرجاء إدخال البريد الإلكتروني");
  if(!birth) return alert("الرجاء اختيار تاريخ الميلاد");

  const localIds = JSON.parse(localStorage.getItem("hm_ids") || "[]");
  if(localIds.includes(id)) return alert("⚠️ رقم الهوية مسجل مسبقًا في هذا المتصفح.");
  try{
    const existsRes = await fetch(`${window.APP_CONFIG.APPS_SCRIPT_URL}?action=exists&id=${encodeURIComponent(id)}`, {method:"GET"});
    const existsJson = await existsRes.json();
    if(existsJson && existsJson.exists === true){
      return alert("⚠️ رقم الهوية مسجل مسبقًا في النظام، لا يمكن التسجيل مرتين.");
    }
  }catch(e){ console.warn("Existence check failed", e); }
  sessionStorage.setItem("hm_user", JSON.stringify({name,id,phone,email,birth,ts:new Date().toISOString()}));
  show("#video1Card"); setProgress(1);
});

$("#prevVideo1").addEventListener("click", ()=> { show("#formCard"); setProgress(0); });
$("#nextVideo1").addEventListener("click", ()=> { show("#video2Card"); setProgress(2); });
$("#prevVideo2").addEventListener("click", ()=> { show("#video1Card"); setProgress(1); });
$("#nextVideo2").addEventListener("click", ()=> { show("#quizCard"); setProgress(3); });
$("#prevQuiz").addEventListener("click", ()=> { show("#video2Card"); setProgress(2); });

$("#resultBtn").addEventListener("click", () => {
  const q1 = $$("input[name=q1]").find(r => r.checked)?.value;
  const q2 = $$("input[name=q2]").find(r => r.checked)?.value;
  const q3 = $$("input[name=q3]").find(r => r.checked)?.value;
  if(!q1 || !q2 || !q3) return alert("الرجاء الإجابة على جميع الأسئلة.");
  let score = 0; if(q1==="نعم") score++; if(q2==="نعم") score++; if(q3==="خطأ") score++;
  $("#result").textContent = `نتيجتك: ${score} من 3`;
  $("#resultNote").innerHTML = score>=2 ? '<span class="badge">ممتاز، انتقل للتقييم</span>' : '<span class="badge">يفضل إعادة مشاهدة المقاطع</span>';
  show("#ratingCard"); setProgress(4);
});

$("#prevRating").addEventListener("click", ()=> { show("#quizCard"); setProgress(3); });

$("#finishBtn").addEventListener("click", async () => {
  const user = JSON.parse(sessionStorage.getItem("hm_user") || "{}");
  if(!user?.id) return alert("بيانات المستخدم غير مكتملة، ابدأ من جديد.");
  const record = {
    name: user.name, id: user.id, phone: user.phone, email: user.email, birth: user.birth,
    quiz: { q1: $$("input[name=q1]").find(r=>r.checked)?.value || "", q2: $$("input[name=q2]").find(r=>r.checked)?.value || "", q3: $$("input[name=q3]").find(r=>r.checked)?.value || "" },
    score: ($("#result").textContent.match(/\d+/)||["0"])[0],
    ratings: { presenter: $("#rate1").value, content: $("#rate2").value },
    finished_at: new Date().toISOString()
  };

  try{
    const existsRes = await fetch(`${window.APP_CONFIG.APPS_SCRIPT_URL}?action=exists&id=${encodeURIComponent(record.id)}`);
    const existsJson = await existsRes.json();
    if(existsJson && existsJson.exists === true){
      return alert("⚠️ رقم الهوية مسجل مسبقًا في النظام، لا يمكن الإرسال.");
    }
  }catch{}

  try{
    const resp = await fetch(window.APP_CONFIG.APPS_SCRIPT_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(record) });
    const j = await resp.json();
    if(j && j.status === "duplicate"){ 
      alert("⚠️ رقم الهوية مسجل مسبقًا في النظام، لا يمكن الإرسال.");
      return;
    }
    if(j && j.status === "success"){
      const localIds = JSON.parse(localStorage.getItem("hm_ids") || "[]");
      if(!localIds.includes(record.id)){ localIds.push(record.id); localStorage.setItem("hm_ids", JSON.stringify(localIds)); }
      $("#saveStatus").innerHTML = 'تم الحفظ في Google Sheets ✅';
    } else {
      $("#saveStatus").innerHTML = 'تعذّر الحفظ في Google Sheets ❌';
    }
  }catch(e){
    $("#saveStatus").innerHTML = 'تعذّر الحفظ، تحقق من الاتصال ❌';
  }
  show("#doneCard"); setProgress(5);
});

window.openAdmin = function(){ location.href = "admin.html"; };
