import os
import base64
from google import genai
from google.genai import types
from app.config import settings


def generate_comparison_chart(
    competitor_name: str,
    your_product_name: str,
    comparison_data: str,
) -> dict:
    """Generate a visual comparison infographic using Gemini image generation.

    Args:
        competitor_name: Name of the competitor.
        your_product_name: Name of your product.
        comparison_data: Structured comparison data with scores and verdicts.

    Returns:
        dict with status, file_path, and base64 image.
    """
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    prompt = f"""Create a professional competitive comparison infographic.

**Title:** {your_product_name} vs {competitor_name}

**Data to visualize:**
{comparison_data}

**Design requirements:**
- Clean, modern, corporate style
- Use a side-by-side comparison layout
- Green (#22c55e) for winner, Red (#ef4444) for loser, Gray (#94a3b8) for tie
- Include score bars or ratings for each feature
- Add checkmarks and X marks for feature presence
- Include an overall verdict section at the bottom
- Professional typography, no clutter
- White background, suitable for printing or slide decks
- Dimensions: landscape, roughly 1200x800 pixels
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )

        # Extract image from response
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                image_bytes = part.inline_data.data
                image_b64 = base64.b64encode(image_bytes).decode("utf-8")

                # Save to file
                os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
                safe_name = competitor_name.lower().replace(" ", "_").replace(".", "")
                file_path = os.path.join(
                    settings.OUTPUT_DIR, f"comparison_{safe_name}.png"
                )

                with open(file_path, "wb") as f:
                    f.write(image_bytes)

                return {
                    "status": "success",
                    "file_path": file_path,
                    "mime_type": part.inline_data.mime_type,
                    "image_base64": image_b64,
                    "message": f"Comparison chart saved to {file_path}",
                }

        return {
            "status": "error",
            "message": "No image was generated in the response.",
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Image generation failed: {str(e)}",
        }
