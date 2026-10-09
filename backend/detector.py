"""
AI-based deepfake/synthetic-image detection fallback.
Uses prithivMLmods/deepfake-detector-model-v1 (SigLIP-based binary classifier).

On first call the model downloads from HuggingFace (~350 MB).
Subsequent calls use the local cache.

We use AutoModelForImageClassification instead of SiglipForImageClassification
for forward compatibility across transformers versions.
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Lazy-loaded globals to avoid blocking app startup
_model = None
_processor = None
_load_attempted = False
_load_error: str | None = None

MODEL_ID = "prithivMLmods/deepfake-detector-model-v1"


def _load_model():
    global _model, _processor, _load_attempted, _load_error
    if _load_attempted:
        return
    _load_attempted = True
    try:
        from transformers import AutoImageProcessor, AutoModelForImageClassification
        import torch
        logger.info(f"Loading deepfake detection model: {MODEL_ID}")
        _processor = AutoImageProcessor.from_pretrained(MODEL_ID)
        _model = AutoModelForImageClassification.from_pretrained(MODEL_ID)
        _model.eval()
        logger.info("Model loaded successfully.")
    except Exception as e:
        _load_error = str(e)
        logger.error(f"Failed to load detection model: {e}")


def run_detection(image_path: str | Path) -> dict:
    """
    Run the deepfake detector on a given image path.

    Returns a dict:
        {
          "status": "ok" | "model_unavailable" | "error",
          "label": "Real" | "Fake",
          "confidence": float (0-100),
          "fake_probability": float (0-100),
          "real_probability": float (0-100),
          "explanation": str,
          "model": str,
        }
    """
    _load_model()

    if _load_error or _model is None:
        return {
            "status": "model_unavailable",
            "label": "Unknown",
            "confidence": None,
            "fake_probability": None,
            "real_probability": None,
            "explanation": (
                "The AI detection model could not be loaded. "
                f"Reason: {_load_error or 'model not initialised'}. "
                "This result is a placeholder — install transformers and torch to enable detection."
            ),
            "model": MODEL_ID,
        }

    try:
        import torch
        import torch.nn.functional as F
        from PIL import Image

        image = Image.open(image_path).convert("RGB")
        inputs = _processor(images=image, return_tensors="pt")

        with torch.no_grad():
            outputs = _model(**inputs)
            probs = F.softmax(outputs.logits, dim=1)[0]

        # Build label → probability map using model's id2label
        id2label = _model.config.id2label
        scores = {id2label[i].lower(): float(probs[i]) for i in range(len(probs))}
        logger.info(f"Detection scores: {scores}")

        # Normalise: look for keys containing "real" / "fake" / "ai"
        real_prob = next((v for k, v in scores.items() if "real" in k), None)
        fake_prob = next(
            (v for k, v in scores.items() if "fake" in k or "ai" in k or "synthetic" in k),
            None
        )

        if real_prob is None or fake_prob is None:
            # fallback: argmax strategy using first two entries
            vals = list(scores.values())
            keys = list(scores.keys())
            # If we can't parse labels, treat the higher scoring as "Fake" if > 0.5
            real_prob = vals[0] if len(vals) > 0 else 0.5
            fake_prob = vals[1] if len(vals) > 1 else 1 - real_prob

        label = "Fake" if fake_prob > real_prob else "Real"
        confidence = max(fake_prob, real_prob) * 100

        # Build a plain-language explanation
        if label == "Fake":
            if confidence > 90:
                explanation = (
                    "The AI detector is highly confident this image shows signs of synthetic generation. "
                    "Patterns inconsistent with camera-captured photos were detected throughout the image."
                )
            elif confidence > 70:
                explanation = (
                    "The AI detector found moderate evidence of synthetic manipulation. "
                    "Some regions appear inconsistent with natural image statistics."
                )
            else:
                explanation = (
                    "The AI detector found weak signals that may indicate synthetic origin. "
                    "Results are inconclusive — treat with caution and seek additional evidence."
                )
        else:
            if confidence > 90:
                explanation = (
                    "The AI detector found no strong signs of synthetic manipulation. "
                    "Image statistics appear consistent with a camera-captured photo."
                )
            elif confidence > 70:
                explanation = (
                    "The AI detector found mostly natural image patterns, "
                    "though some minor anomalies were noted."
                )
            else:
                explanation = (
                    "The AI detector is uncertain. The image has mixed signals. "
                    "Do not rely on this result alone for trust decisions."
                )

        return {
            "status": "ok",
            "label": label,
            "confidence": round(confidence, 1),
            "fake_probability": round(fake_prob * 100, 1),
            "real_probability": round(real_prob * 100, 1),
            "explanation": explanation,
            "model": MODEL_ID,
        }

    except Exception as e:
        logger.exception("Error during detection inference")
        return {
            "status": "error",
            "label": "Unknown",
            "confidence": None,
            "fake_probability": None,
            "real_probability": None,
            "explanation": f"Detection failed with error: {str(e)}",
            "model": MODEL_ID,
        }
