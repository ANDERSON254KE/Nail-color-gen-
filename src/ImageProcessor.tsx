import React, { useState, useRef } from 'react';
import axios from 'axios';

const ImageProcessor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Handle file upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setOriginalImage(event.target.result as string);
                setProcessedImage(null);
                setError(null);
            }
        };
        reader.onerror = () => {
            setError('Error reading the image file');
        };
        reader.readAsDataURL(file);
    };

    // Process the image (for demonstration, we just convert it to grayscale)
    const processImage = () => {
        if (!originalImage || !canvasRef.current) return;

        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current!;
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError('Canvas context not available');
                return;
            }

            ctx.drawImage(img, 0, 0);
            // Example processing: Convert to grayscale
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
                imageData.data[i] = avg;     // Red
                imageData.data[i + 1] = avg; // Green
                imageData.data[i + 2] = avg; // Blue
            }
            ctx.putImageData(imageData, 0, 0);
            setProcessedImage(canvas.toDataURL('image/png'));
        };
        img.src = originalImage;
    };

    // Save the processed image
    const saveImage = () => {
        if (!processedImage) return;
        const link = document.createElement('a');
        link.href = processedImage;
        link.download = 'processed-image.png';
        link.click();
    };

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <button onClick={processImage}>Process Image</button>
            {error && <p>{error}</p>}
            {processedImage && (
                <div>
                    <img src={processedImage} alt="Processed" />
                    <button onClick={saveImage}>Save Processed Image</button>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default ImageProcessor;
