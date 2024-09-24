import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { ImageManager } from "@/lib/wasm/wasm";
import { useEffect, useRef, useState } from 'react';


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
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        console.log(ctx);
        try{
          imageManager.render(ctx);
        }
        catch(e){
          console.log(e);
        }
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
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const id = imageManager.add_image(img.width, img.height, new Uint8Array(imageData.data));
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
    if (selectedImage !== null) {
      setIsDragging(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragStart({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && selectedImage !== null && imageManager) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log(x - dragStart.x, y - dragStart.y);
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

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <Button onClick={handleDeleteSelected} disabled={selectedImage === null}>
        Delete Selected Image
      </Button>
      <canvas
        ref={canvasRef}
        width={2560}
        height={1440}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ border: '1px solid black' }}
      />
    </div>
  );
};
