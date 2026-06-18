"""Image preprocessing utilities — improve OCR accuracy via cleaning."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger(__name__)


def preprocess_image(
    image_path: str | Path,
    *,
    grayscale: bool = True,
    enhance_contrast: bool = True,
    denoise: bool = True,
    normalize_resolution: bool = True,
    target_dpi: int = 300,
) -> str:
    """Apply a pipeline of preprocessing steps to improve OCR accuracy.

    Returns the path to the preprocessed image (a temporary PNG alongside the original).
    cv2 (OpenCV) is imported lazily — it will only be loaded if denoise is enabled.
    On headless servers (Railway, Docker slim) use ``opencv-python-headless``.
    """
    path = Path(image_path)
    pil_img = Image.open(path)

    # ── 1. Convert to grayscale ──────────────────────────────────
    if grayscale and pil_img.mode != "L":
        pil_img = pil_img.convert("L")

    # ── 2. Enhance contrast ──────────────────────────────────────
    if enhance_contrast:
        enhancer = ImageEnhance.Contrast(pil_img)
        pil_img = enhancer.enhance(2.0)

    # ── 3. Denoise via OpenCV (lazy import) ──────────────────────
    if denoise:
        try:
            import cv2
            import numpy as np
        except ImportError as exc:
            logger.warning("OpenCV not available, skipping denoise: %s", exc)
        else:
            cv_img = _pil_to_cv2(pil_img, np)
            cv_img = cv2.fastNlMeansDenoising(cv_img, None, h=10, templateWindowSize=7, searchWindowSize=21)
            pil_img = _cv2_to_pil(cv_img)

    # ── 4. Sharpen ───────────────────────────────────────────────
    pil_img = pil_img.filter(ImageFilter.SHARPEN)

    # ── 5. Normalize resolution (scale to target DPI) ────────────
    if normalize_resolution:
        dpi = pil_img.info.get("dpi", (72, 72))
        current_dpi = dpi[0] if isinstance(dpi, (tuple, list)) else dpi
        if current_dpi > 0 and current_dpi < target_dpi:
            scale = target_dpi / current_dpi
            new_size = (int(pil_img.width * scale), int(pil_img.height * scale))
            pil_img = pil_img.resize(new_size, Image.LANCZOS)

    # ── Save preprocessed image ──────────────────────────────────
    out_path = path.parent / f"_ocr_preprocessed_{path.stem}.png"
    pil_img.save(out_path, "PNG")
    logger.debug("Preprocessed %s → %s", path.name, out_path.name)

    return str(out_path)


# ── OpenCV ↔ Pillow helpers (only used when cv2 is available) ────


def _pil_to_cv2(pil_img: Image.Image, np: Any) -> Any:
    arr = np.array(pil_img)
    if len(arr.shape) == 2:
        return arr
    import cv2
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def _cv2_to_pil(cv_img: Any) -> Image.Image:
    if len(cv_img.shape) == 2:
        return Image.fromarray(cv_img, mode="L")
    import cv2
    return Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
