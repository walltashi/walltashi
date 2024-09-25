import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { ImageManager } from "@/lib/wasm/wasm";
import { useEffect, useRef, useState } from 'react';
import ImageResizer from "./-components/ResizeComp";
import { Slider } from "@/components/ui/slider"


export const Route = createFileRoute("/dingboard/")({
  component: DingBoard,
});


function DingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageManager, setImageManager] = useState<ImageManager | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setImageManager(new ImageManager());
  }, []);

  useEffect(() => {
    if (imageManager && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', { alpha: true });
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.globalCompositeOperation = "source-over";
        imageManager.render(ctx);
      }
    }
  }, [imageManager, version]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files[0];
      if (file) {
        processImageFile(file);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (imageManager) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { alpha: true });
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Add this line to make sure the alpha is respected when drawing the image
          ctx.globalCompositeOperation = 'source-over';

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const id = imageManager.add_image(img.width, img.height, new Uint8Array(imageData.data.buffer));
          setSelectedImage(id);
          setVersion((prev) => prev + 1);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (imageManager) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = imageManager.select_image(x, y);
        setSelectedImage(id !== undefined ? id : null);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (imageManager) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = imageManager.select_image(x, y);
        setSelectedImage(id !== undefined ? id : null);
        if (id !== undefined) {
          setIsDragging(true);
          setDragStart({ x, y });
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && selectedImage !== null && imageManager) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        imageManager.move_image(selectedImage, x - dragStart.x, y - dragStart.y);
        setDragStart({ x, y });
        setVersion((prev) => prev + 1);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDeleteSelected = () => {
    if (imageManager && selectedImage !== null) {
      imageManager.delete_selected_image();
      setSelectedImage(null);
      setVersion((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedImage !== null){
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage]);

  const handleSliderChange = (value: number[]) => {
    if (imageManager && selectedImage !== null) {
      imageManager.update_image_rotation(selectedImage, value[0]);
      setVersion((prev) => prev + 1);
    }
  };

  return (
    <div>
      <div className="absolute">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <Button onClick={handleDeleteSelected} disabled={selectedImage === null}>
          Delete Selected Image
        </Button>
        <Slider defaultValue={[0]} max={360} step={1} onValueChange={handleSliderChange} />
      </div>
      <canvas
        ref={canvasRef}
        width={2560}
        height={1440}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleCanvasClick(e as unknown as React.MouseEvent<HTMLCanvasElement>);
          }
        }}
        tabIndex={0} 
        style={{ border: '1px solid black', background: 'transparent' }}
      />
      {selectedImage !== null && imageManager !== null && (
        <ImageResizer
          imageManager={imageManager}
          selectedImage={selectedImage}
          version={version}
          setVersion={setVersion}
        />
      )}
    </div>
  );
};
