import { seedPosts } from "./data.js";
import { USE_FIREBASE, firebaseConfig } from "./firebase.js";

const LOCAL_KEY = "benchmark_extra_posts_v5";

async function firebaseHelpers(){
  if(!USE_FIREBASE) return null;
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  return { db, collection, addDoc, getDocs, updateDoc, doc, serverTimestamp };
}

export async function getPosts(){
  const fb = await firebaseHelpers();
  if(fb){
    const snap = await fb.getDocs(fb.collection(fb.db, "posts"));
    return [...seedPosts, ...snap.docs.map(d => ({ id:d.id, ...d.data(), source:d.data().source || "Admin" }))];
  }
  const extra = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  return [...seedPosts, ...extra];
}

export async function getAdminPosts(){
  const all = await getPosts();
  return all.filter(post => post.source === "Admin");
}

export async function addPost(post){
  const fb = await firebaseHelpers();
  const clean = cleanPost(post);
  if(fb){
    await fb.addDoc(fb.collection(fb.db, "posts"), {...clean, source:"Admin", createdAt: fb.serverTimestamp()});
    return;
  }
  const extra = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  extra.push({...clean, id:crypto.randomUUID(), source:"Admin"});
  localStorage.setItem(LOCAL_KEY, JSON.stringify(extra));
}

export async function updatePost(id, updatedPost){
  const fb = await firebaseHelpers();
  const clean = cleanPost(updatedPost);
  if(fb){
    await fb.updateDoc(fb.doc(fb.db, "posts", id), {...clean, source:"Admin", updatedAt: fb.serverTimestamp()});
    return;
  }
  const extra = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  const updated = extra.map(post => post.id === id ? {...post, ...clean, source:"Admin"} : post);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
}

function cleanPost(post){
  return {
    brand: post.brand,
    date: post.date,
    format: post.format,
    category: post.category,
    views: +post.views || 0,
    likes: +post.likes || 0,
    comments: +post.comments || 0,
    shares: +post.shares || 0,
    title: (post.title || "").trim()
  };
}

export async function deletePost(id){
  const fb = await firebaseHelpers();
  if(fb){
    await fb.deleteDoc(fb.doc(fb.db, "posts", id));
    return;
  }
  const extra = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  const filtered = extra.filter(post => post.id !== id);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
}

export function usingFirebase(){
  return USE_FIREBASE;
}
