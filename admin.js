import { addPost, updatePost, deletePost, getAdminPosts, usingFirebase } from "./storage.js";

const PASSWORD = "admin123";
let adminPosts = [];
let editingId = null;
let searchTerm = "";

const overlay = document.querySelector("#passwordOverlay");
const content = document.querySelector("#adminContent");
const input = document.querySelector("#passwordInput");
const btn = document.querySelector("#passwordButton");
const error = document.querySelector("#passwordError");

function checkPassword(){
  if(input.value === PASSWORD){
    overlay.classList.add("hidden");
    content.classList.remove("hidden");
  } else {
    error.textContent = "Contraseña incorrecta.";
  }
}
btn.addEventListener("click", checkPassword);
input.addEventListener("keydown", e => { if(e.key === "Enter") checkPassword(); });

const formatSelect = document.querySelector("#format");
const viewsField = document.querySelector(".reel-metric");
formatSelect.addEventListener("change", updateMetricVisibility);

function updateMetricVisibility(){
  viewsField.style.display = formatSelect.value === "Reel" ? "grid" : "none";
  if(formatSelect.value !== "Reel") document.querySelector("#views").value = 0;
}

function getFormData(){
  return {
    brand: document.querySelector("#brand").value,
    date: document.querySelector("#date").value,
    format: document.querySelector("#format").value,
    category: document.querySelector("#category").value,
    views: +document.querySelector("#views").value || 0,
    likes: +document.querySelector("#likes").value || 0,
    comments: +document.querySelector("#comments").value || 0,
    shares: +document.querySelector("#shares").value || 0,
    title: document.querySelector("#title").value.trim()
  };
}

function fillForm(post){
  editingId = post.id;
  document.querySelector("#editingId").value = post.id;
  document.querySelector("#brand").value = post.brand;
  document.querySelector("#date").value = post.date;
  document.querySelector("#format").value = post.format;
  document.querySelector("#category").value = post.category;
  document.querySelector("#views").value = post.views || 0;
  document.querySelector("#likes").value = post.likes || 0;
  document.querySelector("#comments").value = post.comments || 0;
  document.querySelector("#shares").value = post.shares || 0;
  document.querySelector("#title").value = post.title || "";
  document.querySelector("#adminTitle").textContent = "Editar publicación";
  document.querySelector("#adminSubtitle").textContent = "Modifica los datos y guarda los cambios.";
  document.querySelector("#submitButton").textContent = "Guardar cambios";
  document.querySelector("#cancelEditButton").classList.remove("hidden");
  updateMetricVisibility();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm(){
  editingId = null;
  document.querySelector("#postForm").reset();
  document.querySelector("#editingId").value = "";
  document.querySelector("#views").value = 0;
  document.querySelector("#likes").value = 0;
  document.querySelector("#comments").value = 0;
  document.querySelector("#shares").value = 0;
  document.querySelector("#adminTitle").textContent = "Agregar publicación";
  document.querySelector("#adminSubtitle").textContent = "La información se actualizará en dashboards, gráficos, calendario y contenidos destacados.";
  document.querySelector("#submitButton").textContent = "Guardar publicación";
  document.querySelector("#cancelEditButton").classList.add("hidden");
  viewsField.style.display = "grid";
}

document.querySelector("#cancelEditButton").addEventListener("click", () => {
  resetForm();
  document.querySelector("#status").textContent = "Edición cancelada.";
});

document.querySelector("#postForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const post = getFormData();

  if(editingId){
    await updatePost(editingId, post);
    document.querySelector("#status").textContent = usingFirebase()
      ? "Publicación actualizada online en Firebase."
      : "Publicación actualizada en este navegador.";
  } else {
    await addPost(post);
    document.querySelector("#status").textContent = usingFirebase()
      ? "Publicación guardada online en Firebase."
      : "Publicación guardada en este navegador. Para guardar online, activa Firebase.";
  }

  resetForm();
  await renderList();
});

function n(num){ return new Intl.NumberFormat("es-EC").format(num || 0); }

async function renderList(){
  adminPosts = (await getAdminPosts()).slice().sort((a,b)=> new Date(b.date) - new Date(a.date));

  const filtered = adminPosts.filter(p => {
    const text = `${p.brand} ${p.title} ${p.date} ${p.format} ${p.category}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  document.querySelector("#adminList").innerHTML = filtered.length ? filtered.map(p=>`
    <div class="admin-item">
      <div>
        <strong>${p.brand} · ${p.title}</strong>
        <p>${p.date} · ${p.format} · ${p.category} · Likes ${n(p.likes)} · Comentarios ${n(p.comments)} · Compartidos ${n(p.shares)} ${p.format==="Reel" ? "· Views " + n(p.views) : ""}</p>
      </div>
      <div class="admin-actions">
        <button class="small-button edit-button" data-id="${p.id}" title="Editar">Editar</button>
        <button class="small-button delete-button" data-id="${p.id}" title="Eliminar">Eliminar</button>
      </div>
    </div>
  `).join("") : "<p>No hay publicaciones que coincidan con la búsqueda.</p>";

  document.querySelectorAll(".edit-button").forEach(button => {
    button.addEventListener("click", () => {
      const post = adminPosts.find(item => item.id === button.dataset.id);
      if(post) fillForm(post);
    });
  });

  document.querySelectorAll(".delete-button").forEach(button => {
    button.addEventListener("click", async () => {
      const post = adminPosts.find(item => item.id === button.dataset.id);
      if(!post) return;

      const confirmed = confirm(`¿Seguro que deseas eliminar esta publicación?\\n\\n${post.brand} · ${post.title}\\n${post.date}`);
      if(!confirmed) return;

      await deletePost(post.id);

      if(editingId === post.id){
        resetForm();
      }

      document.querySelector("#status").textContent = usingFirebase()
        ? "Publicación eliminada online en Firebase."
        : "Publicación eliminada de este navegador.";

      await renderList();
    });
  });
}

const searchInput = document.querySelector("#adminSearch");
if(searchInput){
  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value;
    renderList();
  });
}

renderList();
