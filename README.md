# Elecrical-Symbol-Detection

Detect architectural/electrical symbols from design files (PDF, JPEG, JPG, PNG, DWG)

https://github.com/user-attachments/assets/2e249a62-f80f-4dac-84c7-c458d4421aae

## 📌 Overview  
Electrical‑Symbol‑Detection is a tool designed to automatically detect and identify architectural and electrical design symbols from input files such as PDF, JPEG, JPG, PNG and DWG. The goal is to streamline the process of extracting schematic or layout elements from drawings, making it easier to analyse, classify or digitise these symbols.

## 🧰 Features  
- Supports multiple file formats (PDF, JPEG, JPG, PNG, DWG)  
- Detects various architectural/electrical symbols (switches, outlets, lighting fixtures, etc)  
- Modular architecture: separated frontend and backend for flexibility  
- Built using a mix of Python (backend) and JavaScript/HTML/CSS (frontend)  

## 📂 Repository Structure  
The project is structured roughly as:
```
/
├─ backend/         ← The server side code (model, API endpoints, processing)  
├─ frontend/        ← The client side (UI for uploading files, visualising detections)  
├─ .gitignore       ← Files/folders to ignore  
└─ README.md        ← This document  
```

## 🚀 Getting Started  
### Prerequisites  
- Python (version X.Y)  
- Node.js / npm (for frontend)  
- [Any other dependencies, e.g., OpenCV, PyTorch, etc]  

### Installation  
1. Clone the repository:  
   ```bash
   git clone https://github.com/KHIZARABBASI/Elecrical‑Symbol‑Detection.git
   cd Elecrical‑Symbol‑Detection
   ```  
2. Setup backend:  
   ```bash
   cd backend
   pip install -r requirements.txt
   ```  
3. Setup frontend:  
   ```bash
   cd ../frontend
   npm install
   ```  
4. (Optional) Run any database migrations or download pretrained model weights if required.

### Running the Application  
- Start the backend server:  
  ```bash
  cd backend
  python app.py
  ```  
- Start the frontend UI:  
  ```bash
  cd ../frontend
  npm run start
  ```  
- Open your browser and navigate to `http://localhost:3000` to upload a drawing and view detections.

## 🧬 Model / Methodology  
- The core detection model is trained to recognise architectural/electrical symbols using a custom dataset.  
- Pre‑processing steps: converting DWG to raster, normalising images, etc.  
- The detection pipeline: input → symbol localisation → classification → output bounding boxes + labels  
- Output formats: e.g., JSON with coordinates, or overlay bounding boxes on the original image.

## ✅ Usage Example  
1. Upload a design file in the UI (PDF, PNG, DWG, etc).  
2. The backend processes the file, detects symbols and returns results.  
3. The frontend visualises the detection: bounding boxes drawn around each symbol, each labelled with symbol type.  
4. You can export results (optional) as CSV/JSON.

## 🛠 Customisation & Extension  
- Add detections for new symbol types by updating the training dataset and label dictionary.  
- Extend support for additional file formats.  
- Integrate with external systems (BIM, CAD tools) via API endpoints.  

## 🌟 Why This Matters  
Automating symbol detection saves time, reduces errors, and improves the efficiency of electrical and architectural design analysis.

## 🧑‍💻 Contribution  
1. Fork the repository  
2. Create a new branch (`git checkout ‑b feature/YourNewFeature`)  
3. Make your changes and add tests if possible  
4. Submit a Pull Request  


