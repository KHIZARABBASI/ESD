
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from ultralytics import YOLO
import shutil, os, time, traceback
import convertapi
from PIL import Image
import fitz, io
from dotenv import load_dotenv
import asyncio
from concurrent.futures import ProcessPoolExecutor


from meta_data import extract_drawing_metadata


# ============================================================
# ⚙️ Setup
# ============================================================
app = FastAPI(title="Detection Backend", version="1.0")

# Directories inside the project. These will be created at runtime if missing.
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Model path handling: prefer a project-relative model at ./model/best.pt.
# If an environment variable MODEL_PATH is set, use that. If neither exists but
# the original absolute Windows path exists (development machine), fall back to it.
DEFAULT_WIN_MODEL = r"E:\\internship\\JS\\backend\\model\\best.pt"
env_model = os.getenv("MODEL_PATH")
candidate = Path(env_model) if env_model else (BASE_DIR / "model" / "best.pt")
if not candidate.exists() and Path(DEFAULT_WIN_MODEL).exists():
    candidate = Path(DEFAULT_WIN_MODEL)

MODEL_PATH = str(candidate)

# Try to load model but don't let a failure crash the app at import time. The
# `load_model` route can be used to (re)load later if needed.
try:
    MODEL = YOLO(MODEL_PATH)
except Exception as e:
    MODEL = None
    print(f"Warning: could not load MODEL at {MODEL_PATH}: {e}")

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")

load_dotenv()

# convertapi.api_secret = os.getenv("Convert_API_KEY")

# ---------------------------
# Setup
# ---------------------------
app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
MODEL_DIR = BASE_DIR / "model"

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
MODEL_DIR.mkdir(exist_ok=True)

# ---------------------------
# CORS Setup
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Static Files
# ---------------------------
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")

# ---------------------------
# Global Model
# ---------------------------
model = None


# ---------------------------
# Utility Functions
# ---------------------------

def clear_directory(path: Path):
    """Delete all contents of a directory"""
    if path.exists():
        for item in path.iterdir():
            if item.is_file():
                item.unlink()
            elif item.is_dir():
                shutil.rmtree(item)



def convert_dwf_to_pdf(dwf_file_path: str) -> str:
    """Convert DWF to PDF using ConvertAPI."""
    try:
        import convertapi
        convertapi.api_credentials = os.getenv("Convert_API_KEY")
        print(f"📐 Converting DWF file: {dwf_file_path}")

        dwf_file_path = os.path.abspath(dwf_file_path)
        output_dir = os.path.dirname(dwf_file_path) or os.getcwd()

        result = convertapi.convert("pdf", {"File": dwf_file_path,'SpaceToConvert': "all"}, from_format="dwf")
        saved_files = result.save_files(output_dir)

        if saved_files:
            pdf_path = saved_files[0]
            print(f"✅ DWF successfully converted to PDF: {pdf_path}")
            return pdf_path
        raise Exception("ConvertAPI did not return any files")
    except Exception as e:
        print(f"🚫 DWF to PDF conversion failed: {e}")
        print(traceback.format_exc())
        raise


# Worker function for parallel page conversion (must be at module level for pickling)
def _convert_page_worker(pdf_path_str, page_num, output_dir_str):
    """Convert a single PDF page to image."""
    try:
        doc = fitz.open(pdf_path_str)
        page = doc.load_page(page_num)
        pix = page.get_pixmap(matrix=fitz.Matrix(6, 6))
        img_path = Path(output_dir_str) / f"page_{page_num + 1}.jpg"
        pix.save(str(img_path))
        doc.close()
        return {"page": page_num + 1, "path": str(img_path), "success": True}
    except Exception as e:
        return {"page": page_num + 1, "error": str(e), "success": False}





# Worker function for parallel inference (must be at module level)
def _inference_worker(model_path, img_path_str, run_dir_str, page_num):
    """Run YOLO inference on a single page."""
    try:
        from ultralytics import YOLO
        
        # Load model in worker process
        model = YOLO(model_path)
        
        results = model.predict(
            source=img_path_str,
            project=str(Path(run_dir_str).parent),
            name=Path(run_dir_str).name,
            exist_ok=True,
            save=True,
            conf=0.10,
            iou=0.20,
            save_txt=True,
            save_conf=True,
            hide_labels=True
        )
        
        return {
            "page": page_num,
            "image": img_path_str,
            "success": True,
            "detections": len(results[0].boxes) if results else 0
        }
    except Exception as e:
        return {
            "page": page_num,
            "image": img_path_str,
            "success": False,
            "error": str(e)
        }




async def pdf_to_images(pdf_path, output_dir, max_workers=4):
    """Asynchronously convert PDF to images using parallel workers."""
    pdf_path = Path(pdf_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)

    try:
        # Get page count first
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        doc.close()
        
        print(f"📄 Processing PDF with {total_pages} pages using {max_workers} workers...")

        # Create parallel tasks for all pages
        loop = asyncio.get_event_loop()
        with ProcessPoolExecutor(max_workers=max_workers) as executor:
            tasks = [
                loop.run_in_executor(
                    executor,
                    _convert_page_worker,
                    str(pdf_path),
                    i,
                    str(output_dir)
                )
                for i in range(total_pages)
            ]
            
            # Execute all pages in parallel
            results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect results
        image_paths = []
        failed = []
        
        for result in results:
            if isinstance(result, Exception):
                failed.append({"error": str(result)})
            elif result.get("success"):
                image_paths.append(result["path"])
                print(f"🖼️ Saved page {result['page']}: {result['path']}")
            else:
                failed.append(result)

        print(f"✅ All {len(image_paths)}/{total_pages} pages converted successfully.")
        
        return {
            "status": "success" if len(image_paths) == total_pages else "partial",
            "pages": total_pages,
            "images": image_paths,
            "failed": failed if failed else None
        }

    except Exception as e:
        print(f"❌ Error converting PDF to images: {e}")
        return {"status": "failed", "error": str(e)}





# ---------------------------
# Routes
# ---------------------------

@app.get("/reset")
def reset_storage():
    """Clear all uploaded and output files."""
    try:
        for d in (UPLOAD_DIR, OUTPUT_DIR):
            for item in d.iterdir():
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()

        global last_uploaded_file
        last_uploaded_file = None
        print("🧹 All files cleared successfully.")
        return {"status": "ok", "message": "uploads and outputs cleared"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Save uploaded file."""
    try:
        ext = Path(file.filename).suffix.lower()
        filename = f"file{ext}"
        file_path = UPLOAD_DIR / filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        print(f"✅ Uploaded: {filename}")
        return {"filename": filename, "path": str(file_path), "status": "Complete"}
    except Exception as e:
        return {"error": str(e), "status": "failed"}



@app.get("/preprocess")
async def preprocess_file():
    """Convert uploaded file (PDF/DWF/Image) to images in pdf_pages folder."""
    try:
        uploaded_files = list(UPLOAD_DIR.glob("file.*"))
        if not uploaded_files:
            return {"status": "failed", "error": "No uploaded file found"}

        input_path = uploaded_files[0]
        ext = input_path.suffix.lower()
        pdf_output_dir = OUTPUT_DIR / "pdf_pages"
        pdf_output_dir.mkdir(exist_ok=True)

        # Clear old pages first
        clear_directory(pdf_output_dir)
        pdf_output_dir.mkdir(exist_ok=True)

        if ext == ".pdf":
            return await pdf_to_images(input_path, pdf_output_dir, max_workers=4)
            
        elif ext in [".dwf", ".dwfx", "dwg", ".dxf"]:
            # Offload blocking DWF conversion to thread
            pdf_path = await asyncio.to_thread(convert_dwf_to_pdf, input_path)
            return await pdf_to_images(pdf_path, pdf_output_dir, max_workers=4)
            
        elif ext in [".jpg", ".jpeg", ".png"]:
            dest = pdf_output_dir / "page_1.jpg"
            # Offload file copy to thread
            await asyncio.to_thread(shutil.copy2, input_path, dest)
            print(f"🖼️ Image copied to {dest}")
            return {"status": "success", "pages": 1, "images": [str(dest)]}
            
        else:
            return {"status": "failed", "error": f"Unsupported file format: {ext}"}

    except Exception as e:
        traceback.print_exc()
        return {"status": "failed", "error": str(e)}

@app.get("/load_model")
async def load_model():
    """Load YOLO model once."""
    global model
    try:
        if model is None:
            model_path = MODEL_DIR / "best.pt"
            print(f"📦 Loading model from {model_path}")
            model = YOLO(str(model_path))
            print("✅ Model loaded.")
        else:
            print("⚡ Model already loaded.")
        return {"status": "ok"}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e), "status": "failed"}


@app.get("/inference")
async def run_inference(max_workers=4):
    """Run YOLO inference on all pages in parallel."""
    global model
    try:
        if model is None:
            return {"status": "failed", "error": "Model not loaded"}

        images_dir = OUTPUT_DIR / "pdf_pages"
        image_files = sorted(images_dir.glob("*.jpg"), key=os.path.getmtime)
        if not image_files:
            return {"status": "failed", "error": "No images found for inference"}

        timestamp = time.strftime("%Y%m%d_%H%M%S")
        run_dir = OUTPUT_DIR / "run" / f"run_{timestamp}"
        run_dir.mkdir(parents=True, exist_ok=True)

        total_pages = len(image_files)
        print(f"🚀 Running inference on {total_pages} pages using {max_workers} workers...")

        # Get model path for workers
        model_path = model.model_name if hasattr(model, 'model_name') else str(model.ckpt_path)

        # Create parallel tasks for all pages
        loop = asyncio.get_event_loop()
        with ProcessPoolExecutor(max_workers=max_workers) as executor:
            tasks = [
                loop.run_in_executor(
                    executor,
                    _inference_worker,
                    model_path,
                    str(img),
                    str(run_dir),
                    i
                )
                for i, img in enumerate(image_files, start=1)
            ]
            
            # Execute all inferences in parallel
            results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect results
        successful = []
        failed = []
        total_detections = 0
        
        for result in results:
            if isinstance(result, Exception):
                failed.append({"error": str(result)})
            elif result.get("success"):
                successful.append(result)
                total_detections += result.get("detections", 0)
                print(f"✅ Page {result['page']}/{total_pages}: {result['detections']} detections")
            else:
                failed.append(result)
                print(f"❌ Page {result['page']}/{total_pages}: {result.get('error')}")

        print(f"✅ Inference completed: {len(successful)}/{total_pages} pages, {total_detections} total detections")
        
        return {
            "status": "success" if len(successful) == total_pages else "partial",
            "run_dir": str(run_dir),
            "total_pages": total_pages,
            "successful": len(successful),
            "failed": len(failed),
            "total_detections": total_detections,
            "errors": failed if failed else None
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "failed", "error": str(e)}

@app.get("/results")
async def get_results():
    """Return detection results with per-page detection data (async OCR)."""
    try:
        total_detections = 0
        detection_details = []
        preview_url = None
        page_detections = {}
        meta_data_list = {}

        results_dir = OUTPUT_DIR / "run"

        # Get all inference result images sorted by name (not time)
        all_images = sorted(list(results_dir.rglob("*.jpg")))
        total_pages = len(all_images)

        if all_images:
            last_img = all_images[-1]
            rel_path = last_img.relative_to(OUTPUT_DIR)
            preview_url = f"/outputs/{rel_path.as_posix()}"
            page_previews = [
                {"page": idx + 1, "url": f"/outputs/{img.relative_to(OUTPUT_DIR).as_posix()}"}
                for idx, img in enumerate(all_images)
            ]
        else:
            page_previews = []

        # Get all label files sorted by name to match images
        label_files = sorted(list(results_dir.rglob("labels/*.txt")))

        # ============================================================
        # STEP 1: Run OCR extractions asynchronously for all pages
        # ============================================================
        # print("🚀 Running asynchronous OCR extractions...")

        # ocr_tasks = [extract_drawing_metadata(str(img_file)) for img_file in all_images]
        # ocr_results = await asyncio.gather(*ocr_tasks, return_exceptions=True)

        # for page_idx, (img_file, ocr_result) in enumerate(zip(all_images, ocr_results), start=1):
        #     if isinstance(ocr_result, Exception):
        #         print(f"❌ OCR failed for page {page_idx}: {ocr_result}")
        #         meta_data_list[page_idx] = {}
        #     else:
        #         meta_data_list[page_idx] = ocr_result
        #     page_detections[page_idx] = []
        # STEP 1: Run OCR extractions for all pages
        print("🚀 Running OCR extractions...")
        meta_data_list = {}
        
        for page_idx, img_file in enumerate(all_images, start=1):
            try:
                result = extract_drawing_metadata(str(img_file))
                meta_data_list[page_idx] = result
            except Exception as e:
                print(f"❌ OCR failed for page {page_idx}: {e}")
                meta_data_list[page_idx] = {}
            page_detections[page_idx] = []

        # ============================================================
        # STEP 2: Parse label files and count detections
        # ============================================================
        for page_idx, (img_file, label_file) in enumerate(zip(all_images, label_files), start=1):
            img_name = img_file.stem
            label_name = label_file.stem
            if img_name != label_name:
                print(f"⚠️ Mismatch between image {img_name} and label {label_name}")

            with open(label_file, "r") as lf:
                lines = lf.read().strip().splitlines()
                for line in lines:
                    if not line.strip():
                        continue

                    total_detections += 1
                    parts = line.split()
                    if len(parts) >= 5:
                        cls_id = int(parts[0])
                        conf = float(parts[-1])

                        detection = {
                            "class_id": cls_id,
                            "confidence": round(conf, 2)
                        }

                        detection_details.append(detection)
                        page_detections[page_idx].append(detection)

        # ============================================================
        # STEP 3: Add class names
        # ============================================================
        class_names = [
            "Cove Light", "Door", "Downlight", "Emergency Light Fitting",
            "Fluorescent Light", "Socket Outlet", "Exit Sign"
        ]

        for d in detection_details:
            d["class_name"] = class_names[d["class_id"]] if d["class_id"] < len(class_names) else "Unknown"

        for page_num, detections in page_detections.items():
            for d in detections:
                d["class_name"] = class_names[d["class_id"]] if d["class_id"] < len(class_names) else "Unknown"

        # ============================================================
        # STEP 4: Build Summary and Response
        # ============================================================
        summary = {
            "total_pages": total_pages,
            "items_found": len(set([d["class_name"] for d in detection_details])),
            "total_detections": total_detections,
            "pages": page_previews,
        }

        print(f"📊 Summary: {summary}")
        print(f"🧾 Metadata Extracted for {len(meta_data_list)} pages")

        return {
            "summary": summary,
            "detections": detection_details,
            "page_detections": page_detections,
            "preview": preview_url,
            "pages": page_previews,
            "meta_data": meta_data_list
        }

    except Exception as e:
        print(f"❌ Error during result processing: {e}")
        return {"error": str(e)}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}