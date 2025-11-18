# import traceback
# import os
# import asyncio
# from pathlib import Path

# def convert_dwf_to_pdf(dwf_file_path: str) -> str:
#     """Convert DWF to PDF using ConvertAPI."""
#     try:
#         import convertapi
#         convertapi.api_credentials = os.getenv("Convert_API_KEY")
#         print(f"📐 Converting DWF file: {dwf_file_path}")

#         dwf_file_path = os.path.abspath(dwf_file_path)
#         output_dir = os.path.dirname(dwf_file_path) or os.getcwd()

#         result = convertapi.convert("pdf", {"File": dwf_file_path}, from_format="dwf")
#         saved_files = result.save_files(output_dir)

#         if saved_files:
#             pdf_path = saved_files[0]
#             print(f"✅ DWF successfully converted to PDF: {pdf_path}")
#             return pdf_path
#         raise Exception("ConvertAPI did not return any files")
#     except Exception as e:
#         print(f"🚫 DWF to PDF conversion failed: {e}")
#         print(traceback.format_exc())
#         raise


# BASE_DIR = Path(__file__).resolve().parent
# UPLOAD_DIR = BASE_DIR / "uploads"
# OUTPUT_DIR =  BASE_DIR /"outputs"
# # uploaded_files = list(UPLOAD_DIR.glob("file.*"))

# uploaded_files = list(UPLOAD_DIR.glob("file.*"))
# if not uploaded_files:
#     print('{"status": "failed", "error": "No uploaded file found"}')

# input_path = uploaded_files[0]
# ext = input_path.suffix.lower()
# pdf_output_dir = OUTPUT_DIR / "pdf_pages"
# pdf_output_dir.mkdir(exist_ok=True)

# pdf_output_dir.mkdir(exist_ok=True)

    
# if ext == ".dwf":
#     # Offload blocking DWF conversion to thread
#     pdf_path = await asyncio.to_thread(convert_dwf_to_pdf, input_path)
    
# else:
#     print(' {"status": "failed", "error": f"Unsupported file format: {ext}"}')