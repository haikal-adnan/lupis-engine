export function MapToCanvasPixels(e, canvas) {
    const rect = canvas.getBoundingClientRect();

    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    // css pixel -> canvas pixel (independent of DPR)
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;

    const px = (cx - rect.left) * scaleX;
    const py = (cy - rect.top)  * scaleY;

    return {
        px: Math.max(0, Math.min(canvas.width,  px)),
        py: Math.max(0, Math.min(canvas.height, py))
    };
}
