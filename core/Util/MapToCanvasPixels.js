export function MapToCanvasPixels(e, canvas) {
    const rect = canvas.getBoundingClientRect();

    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;

    const px = (cx - rect.left) * scaleX;
    const py = (cy - rect.top)  * scaleY;

    return {
        px: Math.max(0, Math.min(canvas.width,  px)),
        py: Math.max(0, Math.min(canvas.height, py))
    };
}

export function CanvasToWorld(px, py, camera, canvas) {
    const scale = camera.scale || 1;
    return {
        x: (px - canvas.width * 0.5) / scale + camera.x,
        y: (py - canvas.height * 0.5) / scale + camera.y
    };
}