import { useState, useEffect } from 'react';
import type { ImageManager } from "@/lib/wasm/wasm";

interface ImageResizerProps {
  imageManager: ImageManager; 
  selectedImage: number; 
  version: number;
  setVersion: React.Dispatch<React.SetStateAction<number>>;
}

const ImageResizer: React.FC<ImageResizerProps> = ({ imageManager, selectedImage, version, setVersion }) => {
  const [draggingCorner, setDraggingCorner] = useState<string | null>(null);

  useEffect(() => {
    if (!draggingCorner) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingCorner || !imageManager || selectedImage === null) return;

      const [height, width] = imageManager.get_image_size(selectedImage);
      const [xPos, yPos] = imageManager.get_image_pos(selectedImage);
      if (!xPos || !yPos || !height || !width) return;

      const deltaX = e.clientX - xPos;
      const deltaY = e.clientY - yPos;

      let newWidth = width;
      let newHeight = height;
      let newX = xPos;
      let newY = yPos;

      console.log('deltaX:', deltaX, 'deltaY:', deltaY);

      switch (draggingCorner) {
        case 'top-left':
          newWidth = width - deltaX;
          newHeight = height - deltaY;
          newX = xPos + deltaX;
          newY = yPos + deltaY;
          break;
        case 'top-right':
          newWidth = deltaX;
          newHeight = height - deltaY;
          newY = yPos + deltaY;
          break;
        case 'bottom-left':
          newWidth = width - deltaX;
          newHeight = deltaY;
          newX = xPos + deltaX;
          break;
        case 'bottom-right':
          newWidth = deltaX;
          newHeight = deltaY;
          break;
        default:
          break;
      }
      console.log('newX:', newX, 'newY:', newY, 'newWidth:', newWidth, 'newHeight:', newHeight);


      // Apply limits to the size (max width 2560px)
      if (newWidth > 2560) newWidth = 2560;
      if (newHeight > 2560) newHeight = 2560;

      imageManager.update_image(selectedImage, newWidth, newHeight, newX, newY);
      setVersion((prev) => prev + 1);
    };

    const handleMouseUp = () => {
      setDraggingCorner(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingCorner, imageManager, selectedImage, version, setVersion]);

  //if (!selectedImage || !imageManager) return null;
  
  return (
    <>
      {imageManager && selectedImage !== null && (() => {
        const [height, width] = imageManager.get_image_size(selectedImage);
        const [xPos, yPos] = imageManager.get_image_pos(selectedImage);
        return (
          <>
            {/* Top-left corner */}
            <div
              className="resize-handle top-left"
              style={{
                left: `${xPos}px`,
                top: `${yPos}px`,
                position: 'absolute',
                width: '10px',
                height: '10px',
                backgroundColor: 'red',
                cursor: 'nwse-resize',
              }}
              onMouseDown={() => setDraggingCorner('top-left')}
            />
            {/* Top-right corner */}
            <div
              className="resize-handle top-right"
              style={{
                left: `${xPos + width}px`,
                top: `${yPos}px`,
                position: 'absolute',
                width: '10px',
                height: '10px',
                backgroundColor: 'red',
                cursor: 'nesw-resize',
              }}
              onMouseDown={() => setDraggingCorner('top-right')}
            />
            {/* Bottom-left corner */}
            <div
              className="resize-handle bottom-left"
              style={{
                left: `${xPos}px`,
                top: `${yPos + height}px`,
                position: 'absolute',
                width: '10px',
                height: '10px',
                backgroundColor: 'red',
                cursor: 'nesw-resize',
              }}
              onMouseDown={() => setDraggingCorner('bottom-left')}
            />
            {/* Bottom-right corner */}
            <div
              className="resize-handle bottom-right"
              style={{
                left: `${xPos + width}px`,
                top: `${yPos + height}px`,
                position: 'absolute',
                width: '10px',
                height: '10px',
                backgroundColor: 'red',
                cursor: 'nwse-resize',
              }}
              onMouseDown={() => setDraggingCorner('bottom-right')}
            />
          </>
        );
      })()}
    </>
  );
};

export default ImageResizer;
