# CUSTOS — Guardian Intelligence Systems
### Multi-Purpose AI Training Tool
**By Varunthej Parimi**

---

## 📁 Project Files

```
CUSTOS/
├── trainer.html     → Main webpage (structure)
├── trainer.css      → Design & styling
├── trainer.js       → All logic, AI, data processing
└── README.md        → This file
```

---

## 🚀 How to Run in VS Code (with commands)

### Step 1 — Install Node.js
Download from: https://nodejs.org  
(Choose the LTS version)

Verify installation:
```bash
node --version
npm --version
```

---

### Step 2 — Install live-server globally
Open VS Code Terminal (Ctrl + ` or View → Terminal) and run:

```bash
npm install -g live-server
```

---

### Step 3 — Navigate to your project folder

```bash
cd path/to/CUSTOS
```

Example on Windows:
```bash
cd C:\Users\YourName\Desktop\CUSTOS
```

Example on Mac/Linux:
```bash
cd ~/Desktop/CUSTOS
```

---

### Step 4 — Start the server

```bash
live-server --open=trainer.html
```

This will:
✅ Start a local server at http://127.0.0.1:8080  
✅ Auto-open trainer.html in your browser  
✅ Auto-refresh when you save any file  

---

### Alternative — Python server (if you have Python)

```bash
python -m http.server 8080
```
Then open: http://localhost:8080/trainer.html

---

### ⚠️ Why you CANNOT just double-click the HTML file?
Because the browser blocks camera access and JavaScript modules  
on `file://` protocol. You MUST run it through a local server.

---

## 🌐 Languages Used & Why

### 1. HTML (trainer.html)
**What it is:** HyperText Markup Language  
**Why we used it:** It's the skeleton of the webpage. Every button,  
panel, input field, and canvas element is defined in HTML.  
**How:** We structured sections for header, mode selector, camera  
preview, upload zone, collect panel, train panel, and export panel.

---

### 2. CSS (trainer.css)
**What it is:** Cascading Style Sheets  
**Why we used it:** It handles all visual design — colors, animations,  
layout, fonts, the grid background, scanlines, glow effects, etc.  
**How:** We used CSS variables for the color palette, @keyframes  
for animations (spinning ring, pulsing dot, scrolling grid),  
and flexbox/grid for responsive layout.

**Key design features built in CSS:**
- Scrolling grid background
- Horizontal scanline overlay
- Spinning CUSTOS ring logo
- Glowing cyan panel borders
- Crosshair cursor throughout
- Corner bracket frames on camera

---

### 3. JavaScript (trainer.js)
**What it is:** The programming language of the web  
**Why we used it:** All the logic — capturing webcam, processing  
files, running AI, training the model, exporting data — runs in JS.  
**How:** We used modern async/await for file processing, the  
Web File API for uploads, Canvas API for frame extraction,  
and event listeners for all user interactions.

---

### 4. TensorFlow.js (loaded via CDN)
**What it is:** Google's machine learning library for JavaScript  
**Why we used it:** To build, train, and run the neural network  
directly in the browser — no server or Python needed.  
**How:** We create a sequential neural network with dense layers,  
compile it with Adam optimizer, train it on your collected samples,  
and run live inference on the webcam feed.

---

### 5. MediaPipe Holistic (loaded via CDN)
**What it is:** Google's pose/hand/face landmark detection library  
**Why we used it:** To extract hand skeleton coordinates (21 points  
× 3D × 2 hands = 126 numbers) from the webcam feed.  
**How:** We initialize the Holistic model, pass each video frame  
through it, and get back normalized landmark coordinates  
which we use as input features for our neural network.

---

## 🎯 Modes Explained

| Mode     | Input              | Best For                          |
|----------|--------------------|-----------------------------------|
| WEBCAM   | Live camera        | Real-time gesture/pose recording  |
| IMAGES   | JPG/PNG/WEBP files | Photo-based fall detection        |
| VIDEOS   | MP4/AVI/WEBM files | Video clip training data          |
| GIFs     | GIF animations     | Animated sequence training        |
| ALL      | Any media file     | Mixed dataset training            |

---

## 📊 Output Files

| File                     | Format | Contents                        |
|--------------------------|--------|---------------------------------|
| custos-dataset.json      | JSON   | All samples + metadata + labels |
| custos-dataset.csv       | CSV    | Feature vectors, importable to Excel |
| custos-model.json        | JSON   | Trained neural network architecture |
| custos-model.weights.bin | Binary | Model weights                   |

The CSV file can be opened directly in Microsoft Excel or Google Sheets.

---

## 🛠 Troubleshooting

**Camera not working?**
→ Make sure you're running via live-server, not file://
→ Allow camera permission when browser asks

**MediaPipe not loading?**
→ Check your internet connection (CDN libraries need internet)

**Training stuck?**
→ Need at least 5 samples per class before training

---

*CUSTOS — Guardian Intelligence Systems*  
*By Varunthej Parimi*
