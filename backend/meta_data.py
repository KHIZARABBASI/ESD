# ============================================================
# gemini_ocr.py — Gemini OCR Metadata Extractor
# ============================================================

from google import genai
import json
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import os
import asyncio


# Define metadata schema
class DrawingMetadata(BaseModel):
    project_name: Optional[str]
    consultant: Optional[str]
    contractor: Optional[str]
    sub_contractor: Optional[str]
    drawing_title: Optional[str]
    drawing_no: Optional[str]
    scale: Optional[str]
    date: Optional[str]
    rev: Optional[str]
    project_engineer: Optional[str]
    drawn_by: Optional[str]
    site_engineer: Optional[str]


async def extract_drawing_metadata(image_path: str) -> dict:
    """
    Extracts metadata from a drawing title block image using Gemini API.

    Args:
        image_path (str): Path to the image file (e.g. 'ocr_test.jpg')
        api_key (str): Your Google Gemini API key

    Returns:
        dict: Extracted metadata as a dictionary following DrawingMetadata schema
    """
    try:
        load_dotenv()
        api_key = os.getenv("gemni_api_key")
        print(f"🔑 Using api {api_key}")

        client = genai.Client(api_key=api_key)

        # Upload the image file
        print(f"📤 Uploading image to Gemini: {image_path}")
        file = await client.aio.files.upload(file=image_path)
        print(f"✅ Uploaded as: {file.display_name}")

        # Prepare schema prompt
        schema = DrawingMetadata.model_json_schema()
        prompt = f"""
        Extract drawing metadata from this engineering title block.
        Return the extracted information ONLY as a valid JSON object that strictly conforms to the following JSON schema:

        {schema}

        Ensure the output is only the JSON object, with no extra text, explanations, or markdown formatting (like ```json```).
        If a field cannot be extracted, set its value to null in the JSON.
        """

        # Send request to Gemini
        print("🤖 Processing image with Gemini (this may take a few seconds)...")
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[file, prompt],
        )

        # Clean up response
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Try parsing JSON
        data = json.loads(response_text)
        metadata = DrawingMetadata(**data)
        print("✅ Extraction complete!")
        return metadata.dict()

    except json.JSONDecodeError as e:
        print(f"❌ JSON Decode Error: {e}")
        print("Raw response text:")
        print(response.text)
        return {}

    except Exception as e:
        print(f"❌ Error during extraction: {e}")
        return {}


# ============================================================
# Example usage (run this file directly)
# ============================================================

# if __name__ == "__main__":
#     # Replace with your own API key and image path
#     API_KEY = "AIzaSyAOHIeN-T85BY1I7U_2JxSvfcrYlrKtnOg"
#     IMAGE_PATH = "img1.jpg"

#     result = extract_drawing_metadata(IMAGE_PATH, API_KEY)
#     print("\nFinal extracted metadata:")
#     print(json.dumps(result, indent=2, ensure_ascii=False))
