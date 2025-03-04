# nail_integration.py

"""
Dependencies:
- Install Segment Anything Model (SAM):
  pip install git+https://github.com/facebookresearch/segment-anything.git
- Install OpenCV and NumPy:
  pip install opencv-python-headless numpy

Note: Download the SAM checkpoint file (e.g., "sam_vit_h_4b8939.pth") from the SAM repository or Hugging Face.
"""

import cv2
import numpy as np
from segment_anything import sam_model_registry, SAMModel
from typing import Tuple
from flask import Flask, request, send_file
import base64

# Constant for the SAM checkpoint path
CHECKPOINT_PATH = "sam_vit_h_4b8939.pth"

def load_sam_model() -> 'SAMModel':
    """
    Load the SAM model from the checkpoint.
    Returns:
        SAMModel: The loaded SAM model.
    """
    try:
        sam = sam_model_registry.from_pretrained(CHECKPOINT_PATH)
        return sam
    except Exception as e:
        raise RuntimeError(f"Failed to load SAM model: {e}")

def apply_nail_color_to_image(image: np.ndarray, color: Tuple[int, int, int]) -> np.ndarray:
    """
    Applies the specified nail polish color to the nail regions of a hand image.
    Args:
        image (np.ndarray): The input image as a NumPy array (BGR format).
        color (Tuple[int, int, int]): The desired nail polish color in BGR format.
    Returns:
        np.ndarray: The processed image with the nail polish applied.
    """
    # Load the SAM model
    sam = load_sam_model()

    # Hardcoded prompt points for nail segmentation (to be adjusted later)
    prompt_points = np.array([[100, 200], [150, 250], [200, 300]])  # Example coordinates

    try:
        # Obtain segmentation masks from SAM
        masks = sam.predict(image, prompt_points)

        # Select the first mask (or iterate over multiple masks if needed)
        mask = masks[0]

        # Apply the color to the nail regions using OpenCV
        colored_image = image.copy()
        colored_image[mask] = color  # Apply the color to the mask region

        return colored_image

    except Exception as e:
        raise RuntimeError(f"Error during SAM prediction or processing: {e}")

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process_image():
    # Get the uploaded image and color
    data = request.get_json()
    image_data = data['image']
    color_hex = data['color']
    
    # Convert hex color to BGR
    color = tuple(int(color_hex[i:i+2], 16) for i in (5, 3, 1))  # Convert to BGR

    # Read the image
    in_memory_file = np.frombuffer(base64.b64decode(image_data.split(',')[1]), np.uint8)
    image = cv2.imdecode(in_memory_file, cv2.IMREAD_COLOR)

    # Apply nail color
    processed_image = apply_nail_color_to_image(image, color)

    # Save the processed image to a temporary file
    output_path = 'processed_image.jpg'
    cv2.imwrite(output_path, processed_image)

    return send_file(output_path, mimetype='image/jpeg')

if __name__ == '__main__':
    app.run(debug=True)
