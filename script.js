import { getPosts } from "./storage.js";

const competitionBrands = ["Hilton","Wyndham","Sheraton"];
const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const weekdays = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

let posts = [];
let currentView = "general";
let monthlyChart, brandInteractionChart;

function n(num){ return new Intl.NumberFormat("es-EC").format(num || 0); }
function getMonthKey(post){ const d = new Date(post.date + "T00:00:00"); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function monthLabel(key){ const [y,m]=key.split("-").map(Number); return `${monthNames[m-1]} ${y}`; }
function interaction(post){
  if(post.format === "Reel") return (+post.views||0)+(+post.likes||0)+(+post.comments||0)+(+post.shares||0);
  return (+post.likes||0)+(+post.comments||0)+(+post.shares||0);
}
function scopePosts(){
  if(currentView === "general") return posts.filter(p => competitionBrands.includes(p.brand));
  return posts.filter(p => p.brand === currentView);
}
function countBy(arr, keyFn){
  return arr.reduce((acc,item)=>{ const k=keyFn(item); acc[k]=(acc[k]||0)+1; return acc; }, {});
}
function sortKeysMonths(keys){ return [...keys].sort((a,b)=> a.localeCompare(b)); }

function setView(view){
  currentView = view;
  document.querySelectorAll(".nav-item[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  const label = view === "general" ? "General de la competencia" : `Dashboard ${view}`;
  document.querySelector("#viewLabel").textContent = label;
  document.querySelector("#viewTitle").textContent = view === "general" ? "Dashboard competitivo" : `Análisis de ${view}`;
  document.querySelector("#scopePill").textContent = view === "general" ? "Competencia" : view;
  document.querySelector("#viewDescription").textContent = view === "general"
    ? "Lectura general de Hilton, Wyndham y Sheraton. Oro Verde queda separado como marca propia."
    : `Vista individual con datos, calendario, contenidos destacados e insights de ${view}.`;
  document.querySelector("#positionPanel").style.display = view === "general" ? "block" : "none";
  renderAll();
}

function renderKPIs(data){
  document.querySelector("#kpiPosts").textContent = n(data.length);
  document.querySelector("#kpiInteraction").textContent = n(data.reduce((s,p)=>s+interaction(p),0));
  const cat = Object.entries(countBy(data,p=>p.category)).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";
  const fmt = Object.entries(countBy(data,p=>p.format)).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";
  document.querySelector("#kpiCategory").textContent = cat;
  document.querySelector("#kpiFormat").textContent = fmt;
}

function renderCharts(data){
  const monthKeys = sortKeysMonths(new Set(data.map(getMonthKey)));
  const labels = monthKeys.map(monthLabel);
  const brands = currentView === "general" ? competitionBrands : [currentView];

  const monthlyDatasets = brands.map(brand => ({
    label: brand,
    data: monthKeys.map(key => data.filter(p => p.brand===brand && getMonthKey(p)===key).length),
    borderWidth: 1
  }));

  const brandInteraction = currentView === "general"
    ? competitionBrands.map(b => data.filter(p=>p.brand===b).reduce((s,p)=>s+interaction(p),0))
    : [data.reduce((s,p)=>s+interaction(p),0)];

  if(monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.querySelector("#monthlyChart"), {
    type:"bar",
    data:{ labels, datasets: monthlyDatasets },
    options: chartOptions()
  });

  if(brandInteractionChart) brandInteractionChart.destroy();
  brandInteractionChart = new Chart(document.querySelector("#brandInteractionChart"), {
    type:"bar",
    data:{ labels: currentView==="general" ? competitionBrands : [currentView],
      datasets:[{ label:"Interacción general", data:brandInteraction, borderWidth:1 }] },
    options: chartOptions()
  });
}

function chartOptions(){
  return {
    responsive:true,
    plugins:{ legend:{ labels:{ color:"#f7f7f8" } } },
    scales:{
      x:{ ticks:{ color:"#a3adbb" }, grid:{ color:"rgba(255,255,255,.08)" } },
      y:{ ticks:{ color:"#a3adbb" }, grid:{ color:"rgba(255,255,255,.08)" } }
    }
  };
}

function renderCalendar(data){
  const select = document.querySelector("#calendarMonth");
  const monthKeys = sortKeysMonths(new Set(data.map(getMonthKey)));
  const old = select.value;
  select.innerHTML = monthKeys.map(k => `<option value="${k}">${monthLabel(k)}</option>`).join("");
  if(monthKeys.includes(old)) select.value = old;
  else select.value = monthKeys[0] || "";
  drawCalendar(data, select.value);
  select.onchange = () => drawCalendar(data, select.value);
}

function drawCalendar(data, key){
  const cal = document.querySelector("#calendar");
  if(!key){ cal.innerHTML = "<p>No hay datos registrados.</p>"; return; }
  const [year,month] = key.split("-").map(Number);
  const first = new Date(year, month-1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthData = data.filter(p => getMonthKey(p) === key);
  const byDate = {};
  monthData.forEach(p => { byDate[p.date] = byDate[p.date] || []; byDate[p.date].push(p); });

  let html = weekdays.map(d => `<div class="cal-head">${d}</div>`).join("");
  for(let i=0;i<first.getDay();i++) html += `<div class="cal-day empty"></div>`;
  for(let day=1; day<=daysInMonth; day++){
    const date = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const items = byDate[date] || [];
    const has = items.length > 0;
    const totalInter = items.reduce((s,p)=>s+interaction(p),0);
    const brands = [...new Set(items.map(p=>p.brand))].join(", ");
    const tooltip = has ? `
      <div class="cal-tooltip">
        <strong>${day} de ${monthNames[month-1]}</strong>
        <p>${items.length} publicación(es)</p>
        <p>${brands}</p>
        <p>Interacción: ${n(totalInter)}</p>
        ${items.slice(0,4).map(p=>`<p>• ${p.brand}: ${p.title}</p>`).join("")}
      </div>` : "";
    html += `
      <div class="cal-day ${has ? "has-posts" : ""}">
        <div class="cal-date">${day}</div>
        ${has ? `<span class="cal-count">${items.length} post</span>` : ""}
        ${tooltip}
      </div>`;
  }
  cal.innerHTML = html;
}

function contentCard(post, index){
  const viewMetric = post.format === "Reel" ? `<span>Views: ${n(post.views)}</span>` : "";
  return `
    <article class="content-card">
      <div class="rank-box">#${index+1}</div>
      <div>
        <h4>${post.title}</h4>
        <div class="meta">
          <span class="tag">${post.brand}</span>
          <span class="tag">${post.format}</span>
          <span class="tag">${post.category}</span>
          <span class="tag">${post.date}</span>
        </div>
        <div class="metrics">
          ${viewMetric}
          <span>Likes: ${n(post.likes)}</span>
          <span>Comentarios: ${n(post.comments)}</span>
          <span>Compartidos: ${n(post.shares)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderFeatured(data){
  const reels = data.filter(p=>p.format==="Reel")
    .sort((a,b)=>(b.views-a.views)||(b.likes-a.likes)||(b.comments-a.comments)||(b.shares-a.shares))
    .slice(0,4);
  const staticPosts = data.filter(p=>p.format==="Post" || p.format==="Carrusel")
    .sort((a,b)=>(b.likes-a.likes)||(b.comments-a.comments)||(b.shares-a.shares))
    .slice(0,4);

  document.querySelector("#featuredReels").innerHTML = reels.length ? reels.map(contentCard).join("") : "<p>No hay reels registrados.</p>";
  document.querySelector("#featuredStatic").innerHTML = staticPosts.length ? staticPosts.map(contentCard).join("") : "<p>No hay posts/carruseles registrados.</p>";
}

function renderInsights(data){
  const topCat = Object.entries(countBy(data,p=>p.category)).sort((a,b)=>b[1]-a[1])[0]?.[0] || "Sin dato";
  const topFmt = Object.entries(countBy(data,p=>p.format)).sort((a,b)=>b[1]-a[1])[0]?.[0] || "Sin dato";
  const topPost = [...data].sort((a,b)=>interaction(b)-interaction(a))[0];
  const cards = [
    ["Categoría dominante", `${topCat} concentra la mayor actividad dentro del dashboard seleccionado.`],
    ["Formato dominante", `${topFmt} es el formato más utilizado en el periodo analizado.`],
    ["Contenido de mayor interacción", topPost ? `${topPost.title} destaca por su nivel de interacción general.` : "No hay datos suficientes."],
  ];
  document.querySelector("#insightCards").innerHTML = cards.map(c=>`<article class="insight-card"><h4>${c[0]}</h4><p>${c[1]}</p></article>`).join("");
}

function renderAll(){
  const data = scopePosts();
  renderKPIs(data);
  renderCharts(data);
  renderCalendar(data);
  renderFeatured(data);
  renderInsights(data);
}

async function init(){
  posts = await getPosts();
  document.querySelectorAll(".nav-item[data-view]").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
  setView("general");
}
init();
