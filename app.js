// Noctis Flow - app.js
// Local demo: documents, templates, clients stored in localStorage


// -------------------------
// Billing Timer
// -------------------------
let timerInterval = null;
let elapsedSeconds = 0;
let currentBillingDocId = null;

function startTimer(docId) {
  currentBillingDocId = docId;
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    const display = document.getElementById('billingTimer');
    if (display) display.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function stopTimer() {
  pauseTimer();
  if (currentBillingDocId) saveBillingSession(currentBillingDocId, elapsedSeconds);
  elapsedSeconds = 0;
  const display = document.getElementById('billingTimer');
  if (display) display.textContent = '00:00:00';
}

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2,'0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2,'0');
  const s = String(sec % 60).padStart(2,'0');
  return `${h}:${m}:${s}`;
}
function saveBillingSession(docId, seconds) {
  if (typeof window !== "undefined" && window.localStorage) {
    const doc = findDoc(docId);
    const clientId = doc ? doc.clientId : null;
    const log = JSON.parse(localStorage.getItem('billingSessions') || '[]');
    log.push({ docId, clientId, seconds, timestamp: new Date().toISOString() });
    localStorage.setItem('billingSessions', JSON.stringify(log));
  }
}


// -------------------------
// Data Stores
// -------------------------
let documents = JSON.parse(localStorage.getItem("documents") || "[]");
let templates = JSON.parse(localStorage.getItem("templates") || "[]");
let clients = JSON.parse(localStorage.getItem("clients") || "[]");
let activityLog = [];

let currentDocId = null;

// -------------------------
// Helpers
// -------------------------
function saveAll() {
  localStorage.setItem("documents", JSON.stringify(documents));
  localStorage.setItem("templates", JSON.stringify(templates));
  localStorage.setItem("clients", JSON.stringify(clients));
}

function logActivity(msg) {
  const time = new Date().toLocaleTimeString();
  activityLog.unshift(`${time} — ${msg}`);
  renderActivity();
}

function renderActivity() {
  const ul = document.getElementById("activityLog");
  if (!ul) return;
  ul.innerHTML = "";
  activityLog.slice(0, 20).forEach((a) => {
    const li = document.createElement("li");
    li.textContent = a;
    ul.appendChild(li);
  });
}

// -------------------------
// Markdown Helper
// -------------------------
function markdownToHTML(md) {
  if (!md) return "";
  let html = md
    .replace(/\n/g, "<br>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>")
    .replace(/\*(.*?)\*/gim, "<i>$1</i>");
  return html;
}

function findDoc(id) {
  return documents.find((d) => d.id === id);
}

// -------------------------
// Render Functions
// -------------------------
function renderDocsList() {
  const list = document.getElementById("docsList");
  list.innerHTML = "";
  documents.forEach((doc) => {
    const li = document.createElement("li");
    li.className =
      "p-2 border rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between";
    li.textContent = doc.title || "Untitled";
    li.onclick = () => openDoc(doc.id);
    list.appendChild(li);
  });
}

function renderTemplatesList() {
  const list = document.getElementById("templatesList");
  list.innerHTML = "";
  templates.forEach((tpl) => {
    const li = document.createElement("li");
    li.className =
      "p-2 border rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between";
    li.textContent = tpl.name;
    li.onclick = () => openTemplateModal(tpl.id);
    list.appendChild(li);
  });

  const sel = document.getElementById("applyTemplate");
  sel.innerHTML = '<option value="">— select template —</option>';
  templates.forEach((tpl) => {
    const opt = document.createElement("option");
    opt.value = tpl.id;
    opt.textContent = tpl.name;
    sel.appendChild(opt);
  });
}
checklist.addEventListener("click", (e) => {
  if (e.target.type === "checkbox") {
    const span = e.target.nextElementSibling;
    if (e.target.checked) {
      span.classList.add("line-through", "text-gray-400");
    } else {
      span.classList.remove("line-through", "text-gray-400");
    }
  }
});

function renderClientsList() {
  const list = document.getElementById("clientsList");
  list.innerHTML = "";

  clients.forEach((c) => {
    const li = document.createElement("li");
    li.className = "p-2 border rounded flex justify-between items-center bg-white";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = c.name;

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "flex gap-2";

    const viewBtn = document.createElement("button");
    viewBtn.className = "view-btn px-2 py-1 border rounded text-sm";
    viewBtn.textContent = "View Details";
    viewBtn.addEventListener("click", () => showClientDetails(c.id));

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn px-2 py-1 border rounded text-sm";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeClient(c.id));

    buttonContainer.appendChild(viewBtn);
    buttonContainer.appendChild(removeBtn);

    li.appendChild(nameSpan);
    li.appendChild(buttonContainer);

    list.appendChild(li);
  });

  const sel = document.getElementById("clientSelector");
  sel.innerHTML = '<option value="">No client</option>';
  clients.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
}
function showClientDetails(id) {
  const client = clients.find(c => c.id === id);
  if (!client) return;

  document.getElementById("detailName").textContent = client.name;
  document.getElementById("detailEmail").textContent = client.email || "N/A";
  document.getElementById("detailNotes").textContent = client.notes || "No notes";

  // Make details panel visible if hidden
  document.getElementById("clientDetails").classList.remove("hidden");
}


function renderCurrentDoc() {
  const doc = currentDocId ? findDoc(currentDocId) : null;
  if (!doc) {
    document.getElementById("docTitle").value = "";
    document.getElementById("editor").value = "";
    document.getElementById("docTags").value = "";
    document.getElementById("previewPane").innerHTML = "";
    document.getElementById("metaPane").innerHTML = "";
    return;
  }
  document.getElementById("docTitle").value = doc.title;
  document.getElementById("editor").value = doc.content;
  document.getElementById("docTags").value = doc.tags || "";
  document.getElementById("clientSelector").value = doc.clientId || "";
  updatePreview();
}

function updatePreview() {
  const content = document.getElementById("editor").value;
  document.getElementById("previewPane").innerHTML = markdownToHTML(content);

  const meta = [];
  if (currentDocId) {
    const doc = findDoc(currentDocId);
    if (doc) {
      meta.push(`Client: ${doc.clientId || "none"}`);
      meta.push(`Tags: ${doc.tags || "—"}`);
      meta.push(`Last updated: ${doc.updated}`);
    }
  }
  document.getElementById("metaPane").innerHTML = meta.join("<br>");
}

// -------------------------
// Document Actions
// -------------------------
function openDoc(id) {
  currentDocId = id;
  renderCurrentDoc();
  logActivity("Opened document");
}

function saveDoc() {
  if (!currentDocId) {
    currentDocId = Date.now().toString();
    documents.push({
      id: currentDocId,
      title: "",
      content: "",
      tags: "",
      clientId: "",
      updated: new Date().toLocaleString(),
      files: [] // <-- add this line
    });
  }

  const doc = findDoc(currentDocId);
  doc.title = document.getElementById("docTitle").value;
  doc.content = document.getElementById("editor").value;
  doc.tags = document.getElementById("docTags").value;
  doc.clientId = document.getElementById("clientSelector").value;
  doc.updated = new Date().toLocaleString();

  saveAll();
  renderDocsList();
  renderCurrentDoc();
  renderUploadedFiles(); // <-- refresh uploaded files
  logActivity("Saved document");
}


function newDoc() {
  currentDocId = null;
  renderCurrentDoc();
  logActivity("Started new document");
}

function clearDoc() {
  if (currentDocId) {
    documents = documents.filter((d) => d.id !== currentDocId);
    currentDocId = null;
    saveAll();
    renderDocsList();
    renderCurrentDoc();
    logActivity("Cleared document");
  }
}

function downloadDoc() {
  if (!currentDocId) return;
  const doc = findDoc(currentDocId);
  const blob = new Blob([doc.content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${doc.title || "document"}.txt`;
  a.click();
  logActivity("Downloaded document");
}

// -------------------------
// Template Actions
// -------------------------
function openTemplateModal(id) {
  document.getElementById("templateModal").classList.remove("hidden");
  if (id) {
    const tpl = templates.find((t) => t.id === id);
    document.getElementById("templateName").value = tpl.name;
    document.getElementById("templateTags").value = tpl.tags;
    document.getElementById("templateContent").value = tpl.content;
    document.getElementById("saveTemplateBtn").dataset.editing = id;
  } else {
    document.getElementById("templateName").value = "";
    document.getElementById("templateTags").value = "";
    document.getElementById("templateContent").value = "";
    delete document.getElementById("saveTemplateBtn").dataset.editing;
  }
}

function closeTemplateModal() {
  document.getElementById("templateModal").classList.add("hidden");
}

function saveTemplate() {
  const name = document.getElementById("templateName").value;
  const tags = document.getElementById("templateTags").value;
  const content = document.getElementById("templateContent").value;
  const editing = document.getElementById("saveTemplateBtn").dataset.editing;
  if (editing) {
    const tpl = templates.find((t) => t.id === editing);
    tpl.name = name;
    tpl.tags = tags;
    tpl.content = content;
  } else {
    templates.push({
      id: Date.now().toString(),
      name,
      tags,
      content,
    });
  }
  saveAll();
  renderTemplatesList();
  closeTemplateModal();
  logActivity("Saved template");
}

function applyTemplate(id) {
  if (!id) return;
  const tpl = templates.find((t) => t.id === id);
  if (!tpl) return;
  let content = tpl.content;
  const clientId = document.getElementById("clientSelector").value;
  if (clientId) {
    const c = clients.find((c) => c.id === clientId);
    if (c) {
      content = content.replace(/{{client_name}}/g, c.name);
    }
  }
  content = content.replace(/{{date}}/g, new Date().toLocaleDateString());
  document.getElementById("editor").value = content;
  updatePreview();
  logActivity("Applied template");
}

// -------------------------
// Client Actions
// -------------------------
function addClient() {
  const name = prompt("Client name?");
  if (!name) return;

  const email = prompt("Client email?") || "";
  const notes = prompt("Any notes for this client?") || "";

  clients.push({
    id: Date.now().toString(),
    name,
    email,
    notes
  });

  saveAll();
  renderClientsList();
  logActivity("Added client");
}
function removeClient(id) {
  const client = clients.find(c => c.id === id);
  if (!client) return;

  const confirmed = confirm(`Are you sure you want to remove "${client.name}"?`);
  if (!confirmed) return;

  const index = clients.findIndex(c => c.id === id);
  if (index !== -1) {
    clients.splice(index, 1);
    saveAll();
    renderClientsList();
    logActivity(`Removed client "${client.name}"`);

    // Hide details if the deleted client was being viewed
    const detailName = document.getElementById("detailName").textContent;
    if (detailName === client.name) {
      document.getElementById("clientDetails").classList.add("hidden");
      document.getElementById("detailName").textContent = "";
      document.getElementById("detailEmail").textContent = "";
      document.getElementById("detailNotes").textContent = "";
    }
  }
}




// -------------------------
// Navigation
// -------------------------
function switchView(view) {
  // Hide all left panel views
  document.querySelectorAll("#leftContent > div").forEach(v => v.classList.add("hidden"));
  
  // Show the selected left panel view
  const target = document.getElementById(view + "View");
  if (target) target.classList.remove("hidden");

  // Handle right panel visibility
  const rightPanel = document.querySelector("main .col-span-2");
  const leftPanel = document.getElementById("leftCol");

  // Hide all view-specific right-side panes by default
  ["editorPane", "previewPane", "metaPane", "templateModal", "settingsPane", "assistantPane"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  if (view === "dashboard") {
    // Dashboard layout
    if (rightPanel) rightPanel.classList.add("hidden");
    if (leftPanel) {
      leftPanel.classList.remove("col-span-1");
      leftPanel.classList.add("col-span-3");
    }
  } else if (view === "documents") {
    if (rightPanel) rightPanel.classList.remove("hidden");
    if (leftPanel) {
      leftPanel.classList.remove("col-span-3");
      leftPanel.classList.add("col-span-1");
    }
    // Show document editor
    const editorPane = document.getElementById("editorPane");
    if (editorPane) editorPane.classList.remove("hidden");
    renderCurrentDoc();
  } else if (view === "templates") {
    const templateModal = document.getElementById("templateModal");
    if (templateModal) templateModal.classList.remove("hidden");
  } else if (view === "settings") {
    const settingsPane = document.getElementById("settingsPane");
    if (settingsPane) settingsPane.classList.remove("hidden");
  }

  // Update active nav buttons
  document.querySelectorAll("nav button[data-nav]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === view);
  });
}


// -------------------------
// DOMContentLoaded
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  renderDocsList();
  renderTemplatesList();
  renderClientsList();
  renderCurrentDoc();
  renderActivity();
  switchView("documents");
  

  // -------------------------
  // Activity Chart
  // -------------------------
  const ctx = document.getElementById('activityChart').getContext('2d');
  const activityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Activity Events',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  const originalRenderActivity = renderActivity;
  renderActivity = function() {
    originalRenderActivity();
    if (!activityChart) return;
    const latestActivities = activityLog.slice(0, 10).reverse();
    activityChart.data.labels = latestActivities.map(a => a.split(' — ')[0]);
    activityChart.data.datasets[0].data = latestActivities.map(() => 1);
    activityChart.update();
  };

  // -------------------------
  // Billing Timer Controls
  // -------------------------
  const timerBar = document.createElement('div');
  timerBar.className = "flex items-center gap-2 mt-2";
  timerBar.innerHTML = `
    <span id="billingTimer" class="font-mono text-sm">00:00:00</span>
    <button id="startTimerBtn" class="px-2 py-1 border rounded text-sm">Start</button>
    <button id="pauseTimerBtn" class="px-2 py-1 border rounded text-sm">Pause</button>
    <button id="stopTimerBtn" class="px-2 py-1 border rounded text-sm">Stop</button>
  `;
  document.querySelector('#editor').parentNode.insertBefore(timerBar, document.querySelector('#editor').nextSibling);

  document.getElementById('exportBillingBtn').onclick = () => {
    const log = JSON.parse(localStorage.getItem('billingSessions') || '[]');
    if (log.length === 0) return alert('No sessions to export.');

    let csv = 'Document,Client,Seconds,Timestamp\n';
    log.forEach(s => {
      const doc = findDoc(s.docId);
      const docTitle = doc ? doc.title : 'Untitled';
      const clientName = doc ? clients.find(c => c.id === doc.clientId)?.name || 'No client' : 'No client';
      csv += `"${docTitle}","${clientName}",${s.seconds},"${s.timestamp}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `billing_sessions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  document.getElementById('startTimerBtn').onclick = () => startTimer(currentDocId);
  document.getElementById('pauseTimerBtn').onclick = pauseTimer;
  document.getElementById('stopTimerBtn').onclick = stopTimer;

  // -------------------------
  // Core Buttons
  // -------------------------
  document.getElementById("saveDoc").onclick = saveDoc;
  document.getElementById("newDocBtn").onclick = newDoc;
  document.getElementById("clearBtn").onclick = clearDoc;
  document.getElementById("downloadBtn").onclick = downloadDoc;
  document.getElementById("previewBtn").onclick = updatePreview;

  document.getElementById("newTemplateBtn").onclick = () =>
    openTemplateModal(null);
  document.getElementById("saveTemplateBtn").onclick = saveTemplate;
  document.getElementById("cancelTemplateBtn").onclick = closeTemplateModal;
  document.getElementById("closeTemplateModal").onclick = closeTemplateModal;

  document.getElementById("addClientBtn").onclick = addClient;
  document.getElementById("applyTemplate").onchange = (e) =>
    applyTemplate(e.target.value);

  document.querySelectorAll("nav button[data-nav]").forEach((btn) => {
    btn.onclick = () => switchView(btn.dataset.nav);
  });

  // -------------------------
  // AI Assistant
  // -------------------------
  document.getElementById("askAssistantBtn").onclick = async () => {
    const input = document.getElementById("assistantInput");
    const output = document.getElementById("assistantOutput");
    const question = input.value.trim();
    if (!question) return;

    output.innerHTML += `<div><em>Asking...</em></div>`;

    try {
      const res = await fetch("http://localhost:3000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      if (data.answer) {
        output.innerHTML += `<div><strong>You:</strong> ${question}</div>`;
        output.innerHTML += `
          <div class="assistant-message">
            <span class="assistant-disclaimer">⚠️ Disclaimer: I am not providing legal advice. Always consult a licensed attorney for professional legal guidance.</span><br>
            <strong>Assistant:</strong><br>${data.answer.replace(/\n/g, '<br>')}
          </div>
        `;
        output.scrollTop = output.scrollHeight;
      }
    } catch (err) {
      console.error(err);
      output.innerHTML += `<div><em>Error contacting assistant</em></div>`;
    }

    input.value = "";
  };

  // -------------------------
  // Theme Toggle & Search
  // -------------------------
  document.getElementById("themeToggle").onclick = () => {
    const body = document.body;
    const theme = body.dataset.theme === "light" ? "dark" : "light";
    body.dataset.theme = theme;
  };

  document.getElementById("globalSearch").oninput = (e) => {
    const q = e.target.value.toLowerCase();
    const list = document.getElementById("docsList");
    list.innerHTML = "";
    documents
      .filter((d) => d.title.toLowerCase().includes(q))
      .forEach((doc) => {
        const li = document.createElement("li");
        li.className =
          "p-2 border rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between";
        li.textContent = doc.title;
        li.onclick = () => openDoc(doc.id);
        list.appendChild(li);
      });
  };
});
// File storage in localStorage
let uploadedFiles = JSON.parse(localStorage.getItem("uploadedFiles") || "[]");

// Update UI
function renderUploadedFiles() {
  const ul = document.getElementById("uploadedFiles");
  ul.innerHTML = "";
  uploadedFiles.forEach((file, index) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center";

    let preview = file.name;
    if (file.type.startsWith("image/")) preview = `[IMG] ${file.name}`;
    if (file.type.startsWith("audio/")) preview = `[AUDIO] ${file.name}`;
    if (file.type === "application/pdf") preview = `[PDF] ${file.name}`;

    li.textContent = preview;

    const del = document.createElement("button");
    del.textContent = "✕";
    del.className = "ml-2 text-red-600 text-xs";
    del.onclick = () => {
      uploadedFiles.splice(index, 1);
      saveFiles();
      renderUploadedFiles();
    };

    li.appendChild(del);
    ul.appendChild(li);
  });
}

// Save to localStorage
document.getElementById("fileUploader").addEventListener("change", async (e) => {
  if (!currentDocId) return alert("Create or open a document first!");

  const files = Array.from(e.target.files);
  const doc = findDoc(currentDocId);

  for (const file of files) {
    const data = await fileToBase64(file);
    doc.files.push({
      name: file.name,
      type: file.type,
      size: file.size,
      content: data,
      uploaded: new Date().toISOString(),
    });
  }

  saveAll();
  renderUploadedFiles();
  e.target.value = ""; // reset input
});


// Helper: convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Initial render
renderUploadedFiles();
if (file.type.startsWith("image/")) {
  const img = document.createElement("img");
  img.src = file.content;
  img.className = "w-32 mt-1";
  li.appendChild(img);
}
function renderUploadedFiles() {
  const ul = document.getElementById("uploadedFiles");
  ul.innerHTML = "";

  uploadedFiles.forEach((file, index) => {
    const li = document.createElement("li");
    li.className = "flex flex-col gap-1 border rounded p-2";

    const topRow = document.createElement("div");
    topRow.className = "flex justify-between items-center";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = file.name;
    topRow.appendChild(nameSpan);

    const btnGroup = document.createElement("div");
    btnGroup.className = "flex gap-2";

    // Preview / Open button
    const previewBtn = document.createElement("button");
    previewBtn.textContent = "Preview";
    previewBtn.className = "px-2 py-1 text-xs bg-blue-100 rounded";
    previewBtn.onclick = () => previewFile(file);
    btnGroup.appendChild(previewBtn);

    // Download button
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download";
    downloadBtn.className = "px-2 py-1 text-xs bg-green-100 rounded";
    downloadBtn.onclick = () => downloadFile(file);
    btnGroup.appendChild(downloadBtn);

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.className = "px-2 py-1 text-xs bg-red-100 rounded";
    delBtn.onclick = () => {
      uploadedFiles.splice(index, 1);
      saveFiles();
      renderUploadedFiles();
    };
    btnGroup.appendChild(delBtn);

    topRow.appendChild(btnGroup);
    li.appendChild(topRow);

    // Optional: show a preview for images or text
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = file.content;
      img.className = "w-32 mt-1";
      li.appendChild(img);
    } else if (file.type.startsWith("text/")) {
      const txt = document.createElement("pre");
      txt.textContent = file.content.slice(0, 200); // first 200 chars
      txt.className = "text-xs bg-gray-50 p-1 rounded mt-1 overflow-auto max-h-24";
      li.appendChild(txt);
    }

    ul.appendChild(li);
  });
}

// Preview function
function previewFile(file) {
  if (file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type === "application/pdf") {
    const win = window.open(file.content, "_blank");
    if (!win) alert("Popup blocked, cannot preview file.");
  } else if (file.type.startsWith("text/")) {
    alert(file.content); // or render in modal
  } else {
    alert("Cannot preview this file type.");
  }
}

// Download function
function downloadFile(file) {
  const a = document.createElement("a");
  a.href = file.content;
  a.download = file.name;
  a.click()};

  