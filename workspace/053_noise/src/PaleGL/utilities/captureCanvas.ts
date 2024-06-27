export function captureCanvas(canvas: HTMLCanvasElement) {
    const a = document.createElement('a');
    window.addEventListener('keypress', (e) => {
        if (e.code === 'KeyR') {
            const dataURL = canvas.toDataURL('image/png', 1);
            a.href = dataURL;
            a.download = 'capture.png';
            a.click();
        }
        return false;
    });
}
