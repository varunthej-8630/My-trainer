/* ═══════════════════════════════════════════════════════════
   CUSTOS — Guardian Intelligence Systems
   Multi-Purpose Training Engine
   Supports: Webcam | Images | Videos | GIFs | All Types
   Author: Varunthej Parimi
═══════════════════════════════════════════════════════════ */

// ─── DOM REFS ──────────────────────────────────────────────
const video        = document.getElementById("video");
const canvas       = document.getElementById("canvas");
const ctx          = canvas.getContext("2d");
const statusEl     = document.getElementById("train-status");
const confFill     = document.getElementById("conf-fill");
const confReadout  = document.getElementById("conf-readout");
const confPred     = document.getElementById("conf-prediction");
const progressWrap = document.getElementById("progress-wrap");
const progressFill = document.getElementById("progress-fill");
const progressLbl  = document.getElementById("progress-label");
const procLog      = document.getElementById("proc-log");

// ─── STATE ─────────────────────────────────────────────────
let currentMode = "webcam";   // webcam | images | videos | gifs | all
let recording   = null;       // active recording label key
let model       = null;
let holisticReady = false;
let countdownTimer = null;
let recordTimer    = null;

let samples = {
  class_a: [],   // label from #label-a input
  class_b: []    // label from #label-b input
};

let fileQueue  = [];    // uploaded File objects + assigned label
let filesProcessed = 0;

// ─── LABEL HELPERS ─────────────────────────────────────────
const getLabelA = () => document.getElementById("label-a").value.trim() || "class_a";
const getLabelB = () => document.getElementById("label-b").value.trim() || "class_b";

// sync display badges whenever user types
["label-a", "label-b"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    document.getElementById("label-a-display").textContent = getLabelA().toUpperCase();
    document.getElementById("label-b-display").textContent = getLabelB().toUpperCase();
    updateRecButtons();
  });
});

function updateRecButtons() {
  document.getElementById("btn-rec-a").innerHTML =
    `● Record <b>${getLabelA()}</b> <span class="key-badge">1</span>`;
  document.getElementById("btn-rec-b").innerHTML =
    `● Record <b>${getLabelB()}</b> <span class="key-badge">2</span>`;
}

// ─── UPDATE COUNTS ─────────────────────────────────────────
function updateCounts() {
  const na = samples.class_a.length;
  const nb = samples.class_b.length;
  document.getElementById("count-a").textContent = na;
  document.getElementById("count-b").textContent = nb;
  document.getElementById("stat-total").textContent = na + nb;
  document.getElementById("stat-files").textContent = filesProcessed;
  document.getElementById("stat-ratio").textContent =
    nb === 0 ? "—" : `${na}:${nb}`;
}

// ─── MEDIAPIPE HOLISTIC ─────────────────────────────────────
const holistic = new Holistic({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${f}`
});
holistic.setOptions({ modelComplexity: 1, smoothLandmarks: true });

holistic.onResults(res => {
  if (currentMode !== "webcam") return;

  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;

  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  if (res.rightHandLandmarks) drawHand(res.rightHandLandmarks);
  if (res.leftHandLandmarks)  drawHand(res.leftHandLandmarks);

  captureFrame(res.rightHandLandmarks, res.leftHandLandmarks);

  if (model && res.rightHandLandmarks && res.leftHandLandmarks) {
    const vec = extract(res.rightHandLandmarks, res.leftHandLandmarks);
    runInference(vec);
  }
});

// Start webcam
const cam = new Camera(video, {
  width: 640, height: 480,
  onFrame: async () => {
    if (currentMode === "webcam") await holistic.send({ image: video });
  }
});
cam.start().then(() => {
  holisticReady = true;
  document.getElementById("cam-hud").textContent = "CUSTOS VISION · FEED ACTIVE";
});

// ─── HAND DRAWING ──────────────────────────────────────────
function drawHand(lm) {
  const segs = [
    [0,1,2,3,4], [0,5,6,7,8],
    [0,9,10,11,12], [0,13,14,15,16], [0,17,18,19,20]
  ];
  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 1.5;
  for (const seg of segs) {
    ctx.beginPath();
    seg.forEach((i, idx) => {
      const x = canvas.width - lm[i].x * canvas.width;
      const y = lm[i].y * canvas.height;
      idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  lm.forEach(p => {
    ctx.beginPath();
    ctx.arc(canvas.width - p.x * canvas.width, p.y * canvas.height, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffaa00";
    ctx.fill();
  });
}

// ─── LANDMARK UTILS ─────────────────────────────────────────
function normalize(lm) {
  const w = lm[0], mcp = lm[9];
  const scale = Math.sqrt(
    (mcp.x-w.x)**2 + (mcp.y-w.y)**2 + (mcp.z-w.z)**2
  ) || 1;
  const out = [];
  for (let i = 0; i < 21; i++) {
    out.push((lm[i].x-w.x)/scale);
    out.push((lm[i].y-w.y)/scale);
    out.push((lm[i].z-w.z)/scale);
  }
  return out;
}

function extract(right, left) {
  return [...normalize(right), ...normalize(left)];
}

// ─── WEBCAM CAPTURE ──────────────────────────────────────────
function captureFrame(right, left) {
  if (!recording || !right || !left) return;
  const vec = extract(right, left);
  if (recording === "class_a") samples.class_a.push(vec);
  else                         samples.class_b.push(vec);
  updateCounts();
}

// ─── RECORD COUNTDOWN ────────────────────────────────────────
const COUNTDOWN    = 3;
const RECORD_SECS  = 4;

function startCountdown(cls) {
  cancelRecording();
  const badge = document.getElementById("rec-badge");
  let rem = COUNTDOWN;
  badge.classList.add("active");
  badge.textContent = `READY… ${rem}`;
  statusEl.className = "status-line";
  statusEl.textContent = `Recording "${cls === "class_a" ? getLabelA() : getLabelB()}" in ${rem}s…`;

  countdownTimer = setInterval(() => {
    rem--;
    if (rem > 0) {
      badge.textContent = `READY… ${rem}`;
    } else {
      clearInterval(countdownTimer);
      startRec(cls);
    }
  }, 1000);
}

function startRec(cls) {
  recording = cls;
  const badge = document.getElementById("rec-badge");
  badge.classList.add("active");
  let rem = RECORD_SECS;
  badge.textContent = `● REC ${rem}s`;

  recordTimer = setInterval(() => {
    rem--;
    badge.textContent = rem > 0 ? `● REC ${rem}s` : "● REC";
    if (rem <= 0) {
      stopRec();
      statusEl.className = "status-line ok";
      statusEl.textContent = "Capture complete. Record more or train.";
    }
  }, 1000);
}

function stopRec() {
  recording = null;
  clearInterval(recordTimer);
  document.getElementById("rec-badge").classList.remove("active");
}

function cancelRecording() {
  clearInterval(countdownTimer);
  clearInterval(recordTimer);
  countdownTimer = recordTimer = null;
  recording = null;
  document.getElementById("rec-badge").classList.remove("active");
}

document.getElementById("btn-rec-a").addEventListener("click", () => startCountdown("class_a"));
document.getElementById("btn-rec-b").addEventListener("click", () => startCountdown("class_b"));

document.addEventListener("keydown", e => {
  if (e.repeat) return;
  if (e.key === "1") startCountdown("class_a");
  if (e.key === "2") startCountdown("class_b");
});

// ─── MODE SWITCHING ───────────────────────────────────────────
const modeButtons    = document.querySelectorAll(".mode-btn");
const cameraSection  = document.getElementById("camera-section");
const uploadZone     = document.getElementById("upload-zone");
const fileQueueEl    = document.getElementById("file-queue");
const webcamControls = document.getElementById("webcam-controls");
const uploadControls = document.getElementById("upload-controls");
const fileInput      = document.getElementById("file-input");

const MODE_CONFIG = {
  webcam: {
    accept: null,
    icon: "📷", title: "WEBCAM LIVE", desc: "Using live camera feed",
    showCamera: true
  },
  images: {
    accept: "image/jpeg,image/png,image/webp,image/bmp",
    icon: "🖼", title: "DROP IMAGE FILES",
    desc: "Accepts: JPG, PNG, WEBP, BMP",
    showCamera: false
  },
  videos: {
    accept: "video/mp4,video/avi,video/webm,video/mov,video/x-msvideo",
    icon: "🎬", title: "DROP VIDEO FILES",
    desc: "Accepts: MP4, AVI, WEBM, MOV",
    showCamera: false
  },
  gifs: {
    accept: "image/gif",
    icon: "🎞", title: "DROP GIF FILES",
    desc: "Accepts: GIF animations",
    showCamera: false
  },
  all: {
    accept: "image/*,video/*",
    icon: "⚡", title: "DROP ANY MEDIA",
    desc: "Accepts: Images, Videos, GIFs — all supported",
    showCamera: false
  }
};

modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentMode = btn.dataset.mode;
    modeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    applyMode(currentMode);
  });
});

function applyMode(mode) {
  const cfg = MODE_CONFIG[mode];

  if (mode === "webcam") {
    cameraSection.style.display = "block";
    uploadZone.classList.remove("visible");
    fileQueueEl.classList.remove("visible");
    webcamControls.style.display = "block";
    uploadControls.style.display = "none";
  } else {
    cameraSection.style.display = "none";
    uploadZone.classList.add("visible");
    webcamControls.style.display = "none";
    uploadControls.style.display = "block";

    // Update upload zone UI
    document.getElementById("upload-icon").textContent  = cfg.icon;
    document.getElementById("upload-title").textContent = cfg.title;
    document.getElementById("upload-desc").textContent  = cfg.desc;
    fileInput.accept = cfg.accept || "*";
  }

  cancelRecording();
}

// ─── DRAG & DROP ──────────────────────────────────────────────
const uploadZoneEl = document.getElementById("upload-zone");

uploadZoneEl.addEventListener("dragover", e => {
  e.preventDefault();
  uploadZoneEl.classList.add("drag-over");
});

uploadZoneEl.addEventListener("dragleave", () => {
  uploadZoneEl.classList.remove("drag-over");
});

uploadZoneEl.addEventListener("drop", e => {
  e.preventDefault();
  uploadZoneEl.classList.remove("drag-over");
  const files = Array.from(e.dataTransfer.files);
  addFilesToQueue(files);
});

fileInput.addEventListener("change", e => {
  addFilesToQueue(Array.from(e.target.files));
  fileInput.value = "";
});

// ─── FILE QUEUE MANAGEMENT ────────────────────────────────────
function getFileType(file) {
  if (file.type.startsWith("image/gif")) return "GIF";
  if (file.type.startsWith("image/"))    return "IMAGE";
  if (file.type.startsWith("video/"))    return "VIDEO";
  return "UNKNOWN";
}

function getFileIcon(type) {
  return { GIF: "🎞", IMAGE: "🖼", VIDEO: "🎬" }[type] || "📄";
}

function addFilesToQueue(files) {
  const validFiles = files.filter(f => {
    const t = f.type;
    return t.startsWith("image/") || t.startsWith("video/");
  });

  validFiles.forEach(f => {
    fileQueue.push({ file: f, label: "class_a", type: getFileType(f) });
  });

  renderQueue();

  if (validFiles.length < files.length) {
    logProc(`⚠ ${files.length - validFiles.length} unsupported file(s) skipped`, "err");
  }
}

function renderQueue() {
  const list = document.getElementById("queue-list");
  document.getElementById("queue-count").textContent = fileQueue.length;

  if (fileQueue.length === 0) {
    fileQueueEl.classList.remove("visible");
    list.innerHTML = "";
    return;
  }

  fileQueueEl.classList.add("visible");
  list.innerHTML = fileQueue.map((item, i) => `
    <div class="queue-item" data-idx="${i}">
      <span class="qi-icon">${getFileIcon(item.type)}</span>
      <span class="qi-name" title="${item.file.name}">${item.file.name}</span>
      <span class="qi-type">${item.type}</span>
      <span class="qi-label">
        <select onchange="setFileLabel(${i}, this.value)">
          <option value="class_a" ${item.label === "class_a" ? "selected" : ""}>${getLabelA()}</option>
          <option value="class_b" ${item.label === "class_b" ? "selected" : ""}>${getLabelB()}</option>
        </select>
      </span>
      <button class="qi-remove" onclick="removeFromQueue(${i})" title="Remove">✕</button>
    </div>
  `).join("");
}

function setFileLabel(idx, val) { fileQueue[idx].label = val; }
function removeFromQueue(idx) {
  fileQueue.splice(idx, 1);
  renderQueue();
}

document.getElementById("btn-clear-queue").addEventListener("click", () => {
  fileQueue = [];
  renderQueue();
});

// ─── PROCESS FILES ────────────────────────────────────────────
const FRAMES_PER_VIDEO = 15; // frames to extract per video/gif

document.getElementById("btn-process-files").addEventListener("click", async () => {
  if (fileQueue.length === 0) {
    logProc("No files in queue. Upload some files first.", "err");
    return;
  }

  logProc("⚡ Starting processing...", "ok");
  procLog.classList.add("visible");

  // We use a hidden off-screen canvas for frame extraction
  const offCanvas = document.createElement("canvas");
  offCanvas.width  = 224;
  offCanvas.height = 224;
  const offCtx = offCanvas.getContext("2d");

  let processed = 0;
  filesProcessed = 0;

  for (const item of fileQueue) {
    const { file, label, type } = item;
    logProc(`Processing [${type}] ${file.name} → ${label === "class_a" ? getLabelA() : getLabelB()}`);

    try {
      if (type === "IMAGE") {
        const vec = await extractImageFeatures(file, offCanvas, offCtx);
        if (vec) {
          samples[label].push(vec);
          processed++;
        }

      } else if (type === "VIDEO") {
        const frames = await extractVideoFrames(file, offCanvas, offCtx, FRAMES_PER_VIDEO);
        frames.forEach(vec => { samples[label].push(vec); processed++; });
        logProc(`  └─ ${frames.length} frames extracted`, "ok");

      } else if (type === "GIF") {
        const frames = await extractGifFrames(file, offCanvas, offCtx, FRAMES_PER_VIDEO);
        frames.forEach(vec => { samples[label].push(vec); processed++; });
        logProc(`  └─ ${frames.length} frames extracted`, "ok");
      }

      filesProcessed++;
      updateCounts();

    } catch (err) {
      logProc(`  ✕ Error: ${err.message}`, "err");
    }
  }

  fileQueue = [];
  renderQueue();
  updateCounts();

  logProc(`✅ Done! ${processed} feature vectors added from ${filesProcessed} file(s).`, "ok");
  statusEl.className = "status-line ok";
  statusEl.textContent = `Processed ${filesProcessed} files → ${processed} samples added.`;
});

// ─── FEATURE EXTRACTION (Image→Pixels as flat vector) ─────────
// Note: For a full pose-based approach, MediaPipe would need to run on each frame.
// Here we extract a compact 224×224→flatten→PCA-style approach via pixel averaging
// giving a 1024-dim feature vector usable with TF.js dense layers.

function imageToFeatureVector(canvas, offCanvas, offCtx, img) {
  offCtx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);
  const px = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
  // Downsample to 32×32 grid, average RGB per cell → 32*32*3 = 3072 → but we'll use 16×16=768
  const size = 16;
  const vec = [];
  const cellW = offCanvas.width  / size;
  const cellH = offCanvas.height / size;

  for (let cy = 0; cy < size; cy++) {
    for (let cx = 0; cx < size; cx++) {
      let r=0, g=0, b=0, n=0;
      for (let py = Math.floor(cy*cellH); py < Math.floor((cy+1)*cellH); py++) {
        for (let px2 = Math.floor(cx*cellW); px2 < Math.floor((cx+1)*cellW); px2++) {
          const i = (py * offCanvas.width + px2) * 4;
          r += px[i]; g += px[i+1]; b += px[i+2];
          n++;
        }
      }
      vec.push(r/n/255, g/n/255, b/n/255);
    }
  }
  return vec; // 768-dim
}

async function extractImageFeatures(file, offCanvas, offCtx) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const vec = imageToFeatureVector(canvas, offCanvas, offCtx, img);
      URL.revokeObjectURL(url);
      resolve(vec);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function extractVideoFrames(file, offCanvas, offCtx, maxFrames) {
  return new Promise((resolve) => {
    const vid = document.createElement("video");
    const url = URL.createObjectURL(file);
    const frames = [];

    vid.onloadedmetadata = () => {
      const dur      = vid.duration;
      const interval = dur / (maxFrames + 1);
      let   frIdx    = 0;

      function seekNext() {
        if (frIdx >= maxFrames) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }
        vid.currentTime = interval * (frIdx + 1);
        frIdx++;
      }

      vid.onseeked = () => {
        const vec = imageToFeatureVector(canvas, offCanvas, offCtx, vid);
        frames.push(vec);
        seekNext();
      };

      seekNext();
    };

    vid.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
    vid.src = url;
    vid.load();
  });
}

async function extractGifFrames(file, offCanvas, offCtx, maxFrames) {
  // For GIFs we create an image element and capture its current frame
  // (browsers render the first frame for static access)
  // For multi-frame GIFs we do time-based grabs via a canvas trick
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const frames = [];

    img.onload = () => {
      // Capture multiple times with slight delays (animated GIF cycles)
      let count = 0;
      const maxTries = Math.min(maxFrames, 8);

      function grabFrame() {
        if (count >= maxTries) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }
        const vec = imageToFeatureVector(canvas, offCanvas, offCtx, img);
        frames.push(vec);
        count++;
        setTimeout(grabFrame, 150); // wait for next GIF frame
      }

      grabFrame();
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
    img.src = url;
  });
}

// ─── INFERENCE ────────────────────────────────────────────────
function runInference(vec) {
  if (!model) return;
  const input = tf.tensor2d([vec]);
  const prob  = model.predict(input).dataSync()[0];
  input.dispose();
  updateConf(prob);
}

function updateConf(prob) {
  const pct  = (prob * 100).toFixed(0);
  confFill.style.width = `${pct}%`;
  confReadout.textContent = `${pct}%`;

  const isA = prob >= 0.5;
  const lbl = isA ? getLabelA() : getLabelB();
  const conf = isA ? pct : (100 - parseInt(pct));
  confPred.textContent = `DETECTION: ${lbl.toUpperCase()} — ${conf}% confidence`;
  confPred.style.color = isA ? "var(--red)" : "var(--green)";
}

// ─── TRAINING ─────────────────────────────────────────────────
// Detect input size: webcam uses 126-dim (hand landmarks),
// upload mode uses 768-dim (pixel features)
function getInputSize() {
  const sample = samples.class_a[0] || samples.class_b[0];
  return sample ? sample.length : 126;
}

document.getElementById("btn-train").addEventListener("click", async () => {
  const na = samples.class_a.length;
  const nb = samples.class_b.length;

  if (na < 5 || nb < 5) {
    statusEl.className = "status-line err";
    statusEl.textContent = `Need ≥5 samples each. Have: ${getLabelA()}=${na}, ${getLabelB()}=${nb}`;
    return;
  }

  const xs = [], ys = [];
  samples.class_a.forEach(s => { xs.push(s); ys.push(1); });
  samples.class_b.forEach(s => { xs.push(s); ys.push(0); });

  // Shuffle
  for (let i = xs.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [xs[i],xs[j]] = [xs[j],xs[i]];
    [ys[i],ys[j]] = [ys[j],ys[i]];
  }

  const inputSize = getInputSize();
  const xT = tf.tensor2d(xs);
  const yT = tf.tensor1d(ys);

  if (model) model.dispose();

  // Build model based on input size
  model = tf.sequential();
  if (inputSize <= 126) {
    // Landmark model (webcam)
    model.add(tf.layers.dense({ inputShape: [inputSize], units: 64, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  } else {
    // Pixel feature model (upload)
    model.add(tf.layers.dense({ inputShape: [inputSize], units: 256, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.4 }));
    model.add(tf.layers.dense({ units: 128, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 64,  activation: "relu" }));
  }
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
  model.compile({ optimizer: "adam", loss: "binaryCrossentropy", metrics: ["accuracy"] });

  document.getElementById("btn-train").disabled = true;
  progressWrap.classList.add("visible");
  statusEl.className = "status-line";
  statusEl.textContent = "Initializing training...";

  const EPOCHS = 60;

  await model.fit(xT, yT, {
    epochs: EPOCHS,
    batchSize: 16,
    shuffle: true,
    validationSplit: 0.1,
    callbacks: {
      onEpochEnd: (ep, logs) => {
        const pct = Math.round(((ep+1)/EPOCHS)*100);
        progressFill.style.width = `${pct}%`;
        progressLbl.textContent  = `TRAINING — EPOCH ${ep+1} / ${EPOCHS} — ACC ${(logs.acc*100).toFixed(1)}%`;
        statusEl.textContent     = `Epoch ${ep+1}/${EPOCHS} · acc: ${(logs.acc*100).toFixed(1)}% · val_acc: ${((logs.val_acc||0)*100).toFixed(1)}%`;
      }
    }
  });

  xT.dispose();
  yT.dispose();
  document.getElementById("btn-train").disabled = false;
  statusEl.className = "status-line ok";
  statusEl.textContent = `Training complete! ${na+nb} samples · Model is live.`;
  progressLbl.textContent = "TRAINING COMPLETE";
});

// ─── EXPORT JSON ──────────────────────────────────────────────
document.getElementById("btn-export-json").addEventListener("click", () => {
  const payload = {
    metadata: {
      created: new Date().toISOString(),
      labels: { class_a: getLabelA(), class_b: getLabelB() },
      counts: { class_a: samples.class_a.length, class_b: samples.class_b.length }
    },
    samples
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, "custos-dataset.json");
});

// ─── EXPORT CSV ───────────────────────────────────────────────
document.getElementById("btn-export-csv").addEventListener("click", () => {
  const la = getLabelA(), lb = getLabelB();
  const rows = [];

  // Header
  const vecLen = getInputSize();
  const header = ["label", ...Array.from({length: vecLen}, (_,i) => `f${i}`)];
  rows.push(header.join(","));

  samples.class_a.forEach(vec => rows.push([la, ...vec].join(",")));
  samples.class_b.forEach(vec => rows.push([lb, ...vec].join(",")));

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  downloadBlob(blob, "custos-dataset.csv");

  statusEl.className = "status-line ok";
  statusEl.textContent = `CSV exported: ${rows.length-1} samples.`;
});

// ─── IMPORT DATA ──────────────────────────────────────────────
document.getElementById("btn-import-data").addEventListener("click", () => {
  document.getElementById("import-data-input").click();
});

document.getElementById("import-data-input").addEventListener("change", e => {
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      // Support both old format and new CUSTOS format
      const src = data.samples || data;
      if (src.class_a) samples.class_a.push(...src.class_a);
      if (src.class_b) samples.class_b.push(...src.class_b);
      // Legacy support
      if (src.clone_sign) samples.class_a.push(...src.clone_sign);
      if (src.not_sign)   samples.class_b.push(...src.not_sign);
      updateCounts();
      statusEl.className = "status-line ok";
      statusEl.textContent = "Data imported successfully.";
    } catch(err) {
      statusEl.className = "status-line err";
      statusEl.textContent = "Import failed: invalid JSON.";
    }
  };
  reader.readAsText(e.target.files[0]);
});

// ─── SAVE MODEL ───────────────────────────────────────────────
document.getElementById("btn-save-model").addEventListener("click", async () => {
  if (!model) {
    statusEl.className = "status-line err";
    statusEl.textContent = "Train a model first.";
    return;
  }
  await model.save("downloads://custos-model");
  statusEl.className = "status-line ok";
  statusEl.textContent = "Model saved: custos-model.json + custos-model.weights.bin";
});

// ─── CLEAR ALL ────────────────────────────────────────────────
document.getElementById("btn-clear-data").addEventListener("click", () => {
  if (!confirm("Clear ALL collected samples and reset? This cannot be undone.")) return;
  samples = { class_a: [], class_b: [] };
  filesProcessed = 0;
  fileQueue = [];
  renderQueue();
  updateCounts();
  confFill.style.width = "0%";
  confReadout.textContent = "0%";
  confPred.textContent = "Awaiting model — train first";
  confPred.style.color = "";
  procLog.innerHTML = "";
  procLog.classList.remove("visible");
  progressWrap.classList.remove("visible");
  if (model) { model.dispose(); model = null; }
  statusEl.className = "status-line";
  statusEl.textContent = "All data cleared. Start fresh.";
});

// ─── UTILITY ──────────────────────────────────────────────────
function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

function logProc(msg, cls = "") {
  procLog.classList.add("visible");
  const p = document.createElement("p");
  p.textContent = `> ${msg}`;
  if (cls) p.className = cls;
  procLog.appendChild(p);
  procLog.scrollTop = procLog.scrollHeight;
}

// ─── INIT ─────────────────────────────────────────────────────
updateCounts();
updateRecButtons();
