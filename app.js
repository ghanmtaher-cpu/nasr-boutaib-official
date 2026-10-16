const CATEGORIES = [
  "العقيدة والتوحيد", "الفقه والعبادات", "القرآن الكريم وعلومه",
  "الحديث النبوي وعلومه", "السيرة النبوية", "التفسير",
  "الفتاوى المعاصرة", "الأسرة والمجتمع", "الأخلاق والآداب",
  "التاريخ الإسلامي", "البحوث والدراسات", "الردود العلمية"
];

const DEMO = [
  {id:"demo-1",title:"ما أهمية الإخلاص في العبادة؟",category:"العقيدة والتوحيد",summary:"الإخلاص هو أن يقصد المسلم بعمله وجه الله تعالى، وهو أصل مهم في العبادة.",body:"<p>الإخلاص من المعاني الأساسية في العبادة، ومعناه أن يقصد الإنسان بعبادته رضا الله تعالى.</p><h2>دليل من القرآن</h2><p>قال الله تعالى: ﴿وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ﴾ [البينة: 5].</p><div class='source'><strong>المصدر:</strong> القرآن الكريم، سورة البينة، الآية 5. المثال تعليمي ويُراجع قبل النشر.</div>",published_at:null,status:"published"},
  {id:"demo-2",title:"كيف يحافظ المسلم على الصلاة في وقتها؟",category:"الفقه والعبادات",summary:"من الوسائل العملية معرفة أوقات الصلاة وضبط التنبيهات والاستعداد للصلاة.",body:"<p>المحافظة على الصلاة تحتاج إلى عزم وأخذ بالأسباب، ومنها معرفة المواقيت الموثوقة والاستعداد للصلاة عند دخول الوقت.</p><div class='source'>تُضاف المراجع التفصيلية بعد مراجعتها من مصدر شرعي موثوق.</div>",published_at:null,status:"published"},
  {id:"demo-3",title:"كيف نتحقق من صحة حديث منتشر على الإنترنت؟",category:"الحديث النبوي وعلومه",summary:"لا يكفي انتشار الحديث؛ ينبغي البحث عن تخريجه وحكم أهل الاختصاص عليه.",body:"<p>الأفضل عدم نشر الحديث قبل التحقق من مصدره وحكم العلماء عليه، والرجوع إلى المصادر المتخصصة.</p><div class='source'>تنبيه: لا تعتمد على نتائج البحث وحدها دون مراجعة المصدر.</div>",published_at:null,status:"published"}
];

function norm(s) {
  return String(s ?? "").replace(/<[^>]*>/g, " ")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/\s+/g, " ")
    .trim().toLocaleLowerCase("ar");
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
let supabaseClient = null, allArticles = [], activeCategory = "الكل", query = "", loadFailed = false;

function initSupabase() {
  const c = window.SITE_CONFIG || {};
  if (!c.supabaseUrl || !c.supabaseAnonKey || !window.supabase ||
      c.supabaseAnonKey === "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE") return;
  try { supabaseClient = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey); }
  catch (e) { console.error("Supabase initialization failed", e); }
}
async function loadArticles() {
  if (!supabaseClient) { allArticles = DEMO; return; }
  const { data, error } = await supabaseClient.from("articles")
    .select("id,title,category,summary,body,question_text,content_type,published_at,status,created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load articles:", error);
    allArticles = [];
    loadFailed = true;
    return;
  }
  allArticles = data || [];
}
function buildCategories() {
  const grid = document.getElementById("categoryGrid");
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(c =>
    `<button class="category ${activeCategory === c ? "active" : ""}" data-category="${esc(c)}"><strong>${esc(c)}</strong><small>تصفح الموضوعات</small></button>`
  ).join("");
  const side = document.getElementById("sideCategories");
  if (side) side.innerHTML = CATEGORIES.map(c => `<li><button data-category="${esc(c)}">${esc(c)} ←</button></li>`).join("");
  [grid, side].filter(Boolean).forEach(root => root.querySelectorAll("[data-category]").forEach(b =>
    b.addEventListener("click", () => filterCategory(b.dataset.category))
  ));
}
function render() {
  const q = norm(query);
  const list = allArticles.filter(a =>
    (activeCategory === "الكل" || a.category === activeCategory) &&
    (!q || q.split(" ").every(w => norm(`${a.title} ${a.summary || ""} ${a.question_text || ""} ${a.category} ${a.body || ""}`).includes(w)))
  );
  const title = document.getElementById("listTitle");
  const count = document.getElementById("resultCount");
  const el = document.getElementById("questionList");
  if (!title || !count || !el) return;
  title.textContent = q ? `نتائج البحث عن: ${query}` : activeCategory === "الكل" ? "أحدث الفتاوى والموضوعات" : activeCategory;
  count.textContent = `${list.length} موضوع`;
  if (!list.length) {
    el.innerHTML = loadFailed
      ? '<div class="empty">تعذر تحميل الموضوعات من قاعدة البيانات. تحقق من الاتصال وسياسات القراءة في Supabase.</div>'
      : '<div class="empty">لا توجد نتائج مطابقة. جرّب كلمات أخرى أو اختر قسمًا مختلفًا.</div>';
    return;
  }
  el.innerHTML = list.map(a => {
    const date = a.published_at || a.created_at;
    const dateText = date ? new Date(date).toLocaleDateString("ar-EG") : (String(a.id).startsWith("demo-") ? "مثال توضيحي" : "");
    return `<article class="question-card"><div class="meta">${/^\d+$/.test(String(a.id)) ? `<span class="num">رقم ${esc(a.id)}</span>` : ""}<span class="pill">${esc(a.category)}</span><span>${esc(dateText)}</span></div><h3><a href="article.html?id=${encodeURIComponent(a.id)}">${esc(a.title)}</a></h3><p>${esc(a.summary || "اقرأ الموضوع كاملًا.")}</p><a class="read-more" href="article.html?id=${encodeURIComponent(a.id)}">قراءة الموضوع ←</a></article>`;
  }).join("");
}
function filterCategory(c) {
  activeCategory = c; query = "";
  const input = document.getElementById("searchInput");
  if (input) input.value = "";
  buildCategories(); render();
  document.getElementById("latest")?.scrollIntoView({behavior:"smooth"});
}
document.getElementById("searchForm")?.addEventListener("submit", e => {
  e.preventDefault(); activeCategory = "الكل";
  query = document.getElementById("searchInput")?.value || "";
  buildCategories(); render();
  document.getElementById("latest")?.scrollIntoView({behavior:"smooth"});
});
document.getElementById("showAll")?.addEventListener("click", () => filterCategory("الكل"));
document.getElementById("menuBtn")?.addEventListener("click", () => document.getElementById("mainNav")?.classList.toggle("open"));
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
(async () => { initSupabase(); await loadArticles(); buildCategories(); render(); })();
