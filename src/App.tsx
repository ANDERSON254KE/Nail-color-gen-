import React, { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import ImageProcessor from './ImageProcessor';

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FF0066');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [nailAreas, setNailAreas] = useState<Array<{x: number, y: number, width: number, height: number}>>([]);
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentNail, setCurrentNail] = useState<{startX: number, startY: number, width: number, height: number} | null>(null);
  const [adjustments, setAdjustments] = useState<{
    brightness: number;
    opacity: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
  }>({
    brightness: 100,
    opacity: 80,
    rotation: 0,
    offsetX: 0,
    offsetY: 0
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Define the handleAdjustmentChange function
  const handleAdjustmentChange = (
    adjustment: keyof typeof adjustments,
    value: number
  ) => {
    setAdjustments(prev => ({
      ...prev,
      [adjustment]: value
    }));
  };
  
  // Handle file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setOriginalImage(event.target.result as string);
        setNailAreas([]);
        setError(null);
        
        // Reset adjustments
        setAdjustments({
          brightness: 100,
          opacity: 80,
          rotation: 0,
          offsetX: 0,
          offsetY: 0
        });
      }
    };
    reader.onerror = () => {
      setError('Error reading the image file');
    };
    reader.readAsDataURL(file);
  };
  
  // Detect nail areas (simplified version - in a real app, this would use ML)
  const detectNailAreas = (img: HTMLImageElement) => {
    // This is a simplified placeholder for nail detection
    // In a real app, this would use a machine learning model
    
    // For demo purposes, we'll create some mock nail areas
    // These would normally be detected by an AI model
    const width = img.width;
    const height = img.height;
    
    // Create 5 nail areas (simplified approximation of finger positions)
    const mockNailAreas = [
      { x: width * 0.2, y: height * 0.3, width: width * 0.1, height: height * 0.1 },
      { x: width * 0.35, y: height * 0.25, width: width * 0.1, height: height * 0.1 },
      { x: width * 0.5, y: height * 0.2, width: width * 0.1, height: height * 0.1 },
      { x: width * 0.65, y: height * 0.25, width: width * 0.1, height: height * 0.1 },
      { x: width * 0.8, y: height * 0.3, width: width * 0.1, height: height * 0.1 }
    ];
    
    return mockNailAreas;
  };
  
  // Apply nail color
  const applyNailColor = () => {
    if (!originalImage || !canvasRef.current) return;
    
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Use manually defined nail areas or detect them
      const areasToUse = manualMode && nailAreas.length > 0 
        ? nailAreas 
        : detectNailAreas(img);
      
      if (!manualMode) {
        setNailAreas(areasToUse);
      }
      
      // Apply color to each nail area
      areasToUse.forEach(area => {
        const { x, y, width, height } = area;
        
        // Save the current state
        ctx.save();
        
        // Apply transformations
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        ctx.translate(
          centerX + adjustments.offsetX, 
          centerY + adjustments.offsetY
        );
        ctx.rotate((adjustments.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
        
        // Apply the selected color with opacity
        ctx.fillStyle = selectedColor;
        ctx.globalAlpha = adjustments.opacity / 100;
        ctx.fillRect(x, y, width, height);
        
        // Apply brightness adjustment
        if (adjustments.brightness !== 100) {
          ctx.globalCompositeOperation = adjustments.brightness > 100 ? 'lighten' : 'darken';
          ctx.fillStyle = adjustments.brightness > 100 ? 'white' : 'black';
          ctx.globalAlpha = Math.abs(adjustments.brightness - 100) / 200;
          ctx.fillRect(x, y, width, height);
        }
        
        // Restore the context
        ctx.restore();
      });
      
      // Set the processed image
      setProcessedImage(canvas.toDataURL('image/png'));
      setIsProcessing(false);
    };
    
    img.onerror = () => {
      setIsProcessing(false);
    };
    
    img.src = originalImage;
  };
  
  // Apply color when image is loaded or adjustments change
  useEffect(() => {
    if (originalImage) {
      applyNailColor();
    }
  }, [originalImage, selectedColor, adjustments, nailAreas, manualMode]);
  
  // Initialize selection canvas when image is loaded
  useEffect(() => {
    if (originalImage && selectionCanvasRef.current && manualMode) {
      const img = new Image();
      img.onload = () => {
        const canvas = selectionCanvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          drawNailAreas(ctx);
        }
      };
      img.src = originalImage;
    }
  }, [originalImage, manualMode, nailAreas]);
  
  // Draw nail areas on selection canvas
  const drawNailAreas = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas first
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw the original image
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
    }
    
    // Draw each nail area with a border
    nailAreas.forEach((area, index) => {
      ctx.strokeStyle = '#FF0066';
      ctx.lineWidth = 2;
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      
      // Add a label
      ctx.fillStyle = '#FF0066';
      ctx.font = '12px Arial';
      ctx.fillText(`Nail ${index + 1}`, area.x, area.y - 5);
    });
    
    // Draw current selection if drawing
    if (isDrawing && currentNail) {
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        currentNail.startX,
        currentNail.startY,
        currentNail.width,
        currentNail.height
      );
    }
  };
  
  // Mouse events for drawing nail areas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!manualMode || !selectionCanvasRef.current) return;
    
    const canvas = selectionCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDrawing(true);
    setCurrentNail({
      startX: x,
      startY: y,
      width: 0,
      height: 0
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentNail || !selectionCanvasRef.current) return;
    
    const canvas = selectionCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const width = x - currentNail.startX;
    const height = y - currentNail.startY;
    
    setCurrentNail({
      ...currentNail,
      width,
      height
    });
    
    if (ctx) {
      drawNailAreas(ctx);
    }
  };
  
  const handleMouseUp = () => {
    if (!isDrawing || !currentNail) return;
    
    // Add the new nail area
    const newNailArea = {
      x: currentNail.width >= 0 ? currentNail.startX : currentNail.startX + currentNail.width,
      y: currentNail.height >= 0 ? currentNail.startY : currentNail.startY + currentNail.height,
      width: Math.abs(currentNail.width),
      height: Math.abs(currentNail.height)
    };
    
    // Only add if the area is large enough
    if (newNailArea.width > 5 && newNailArea.height > 5) {
      setNailAreas([...nailAreas, newNailArea]);
    }
    
    setIsDrawing(false);
    setCurrentNail(null);
  };
  
  // Clear all nail areas
  const clearNailAreas = () => {
    setNailAreas([]);
  };
  
  // Toggle between auto and manual modes
  const toggleMode = () => {
    setManualMode(!manualMode);
    if (!manualMode) {
      // Switching to manual mode, clear auto-detected areas
      setNailAreas([]);
    }
  };

  // Reset all adjustments
  const resetAdjustments = () => {
    setAdjustments({
      brightness: 100,
      opacity: 80,
      rotation: 0,
      offsetX: 0,
      offsetY: 0
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 flex flex-col items-center">
      <header className="bg-white shadow-md py-4 w-full">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center text-pink-600">
            AI Nail Color Visualizer
          </h1>
        </div>
      </header>
      
      <div className="flex flex-col md:flex-row container mx-auto px-4 py-8">
        <div className="w-full md:w-1/2 p-4">
          <h2 className="text-xl font-semibold mb-2">Upload Hand Image</h2>
          <div className="border-dashed border-2 border-gray-300 p-4 text-center">
            <input type="file" onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto mb-2" />
              <p>Click to upload or drag and drop</p>
              <p className="text-gray-500">PNG, JPG or JPEG</p>
            </label>
          </div>
          
          <h2 className="text-xl font-semibold mt-4">Choose Nail Color</h2>
          <input 
            type="color" 
            value={selectedColor} 
            onChange={(e) => setSelectedColor(e.target.value)} 
            className="w-full h-10 border rounded"
          />
          
          <div className="flex flex-wrap mt-2">
            {/* Color palette */}
            {['#FF0066', '#FF6699', '#FFCC00', '#66FF66', '#00CCFF', '#CC00FF'].map(color => (
              <div key={color} className="w-1/4 p-1">
                <div 
                  className="h-10 cursor-pointer" 
                  style={{ backgroundColor: color }} 
                  onClick={() => setSelectedColor(color)}
                ></div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold mt-4">Custom Color</h2>
          <input 
            type="text" 
            value={selectedColor} 
            onChange={(e) => {
              const newColor = e.target.value;
              // Allow any input, but update the selected color
              setSelectedColor(newColor);
            }} 
            placeholder="Enter hex code or color name (e.g., #FF0066 or green)" 
            className="w-full border rounded p-2"
          />
          {error && <p className="text-red-500">{error}</p>}

          <h2 className="text-xl font-semibold mt-4">Adjustments</h2>
          <label>
            Brightness:
            <input 
              type="range" 
              min="0" 
              max="200" 
              value={adjustments.brightness} 
              onChange={(e) => handleAdjustmentChange('brightness', Number(e.target.value))} 
            />
          </label>
          <label>
            Opacity:
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={adjustments.opacity} 
              onChange={(e) => handleAdjustmentChange('opacity', Number(e.target.value))} 
            />
          </label>
          
          <button onClick={resetAdjustments} className="mt-4 bg-blue-500 text-white p-2 rounded">
            Reset Adjustments
          </button>
        </div>
        
        <div className="w-full md:w-1/2 p-4">
          <h2 className="text-xl font-semibold mb-2">Nail Color Preview</h2>
          <div className="border-2 border-gray-300 p-4 h-64 flex items-center justify-center">
            {isProcessing ? (
              <p className="text-gray-500">Processing...</p>
            ) : processedImage ? (
              <img src={processedImage} alt="Processed" className="max-h-full max-w-full" />
            ) : (
              <p className="text-gray-500">Upload an image to see the preview</p>
            )}
          </div>
          <ImageProcessor />
        </div>
      </div>
      
      <footer className="bg-white py-6 mt-12 w-full">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600">
            © 2025 AI Nail Color Visualizer | Created with React and Canvas
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;