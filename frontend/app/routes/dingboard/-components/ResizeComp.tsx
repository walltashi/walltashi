import { useState, useEffect } from 'react';
import type { ImageManager } from "@/lib/wasm/wasm";

interface ImageResizerProps {
  imageManager: ImageManager; 
  selectedImage: number; 
  setVersion: React.Dispatch<React.SetStateAction<number>>;
}

const ImageResizer: React.FC<ImageResizerProps> = ({ imageManager, selectedImage, setVersion }) => {
  const [draggingCorner, setDraggingCorner] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    if (!draggingCorner) return;

    const handleMouseMove = (e: MouseEvent) => {
      const maintainRatio = e.shiftKey;

      if (!draggingCorner || !imageManager || selectedImage === null) return;

      const [width, height] = imageManager.get_image_size(selectedImage);
      const [xPos, yPos] = imageManager.get_image_pos(selectedImage);
      if (!xPos || !yPos || !height || !width) return;

      const deltaX = e.clientX - xPos ;
      const deltaY = e.clientY - yPos;

      let newWidth = width;
      let newHeight = height;
      let newX = xPos;
      let newY = yPos;

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

      // Apply limits to the size (max width 2560px)
      if (newWidth > 2560) newWidth = 2560;
      if (newWidth === 0) newWidth = 1;
      if (newWidth < 0) newWidth = -newWidth;

      if (newHeight > 2560) newHeight = 2560;
      if (newHeight === 0) newHeight = 1;
      if (newHeight < 0) newHeight = -newHeight;

      if (maintainRatio && aspectRatio) {
        newHeight = newWidth / aspectRatio;
      }
      imageManager.update_image_size(selectedImage, newWidth, newHeight, newX, newY);
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
  }, [draggingCorner, imageManager, selectedImage, aspectRatio, setVersion]);

  return (
    <>
      {imageManager && selectedImage !== null && (() => {
        const [width, height] = imageManager.get_image_size(selectedImage);
        const [xPos, yPos] = imageManager.get_image_pos(selectedImage);
        
        return (
          <div
            style={{
              position: 'absolute',
              left: `${xPos - 2}px`,
              top: `${yPos - 2}px`,
              width: `${width + 4}px`,
              height: `${height + 4}px`,
              border: '2px solid red',
              backgroundColor: 'transparent',
              zIndex: 0,
              pointerEvents: 'none', // Make the border div not interactable
            }}
          >
            {/* Top-left corner */}
            <div
              className="resize-handle top-left"
              style={{
                left: -8,
                top: -8,
                position: 'absolute',
                width: '16px',
                height: '16px',
                backgroundColor: 'red',
                cursor: 'nwse-resize',
                pointerEvents: 'auto', // Make the child divs interactable
              }}
              onMouseDown={() => {
                setDraggingCorner('top-left');
                setAspectRatio(width / height);
              }}
            />
            {/* Top-right corner */}
            <div
              className="resize-handle top-right"
              style={{
                right: -8,
                top: -8,
                position: 'absolute',
                width: '16px',
                height: '16px',
                backgroundColor: 'red',
                cursor: 'nesw-resize',
                pointerEvents: 'auto', // Make the child divs interactable
              }}
              onMouseDown={() => {
                setDraggingCorner('top-right');
                setAspectRatio(width / height);
              }}
            />
            {/* Bottom-left corner */}
            <div
              className="resize-handle bottom-left"
              style={{
                left: -8,
                bottom: -8,
                position: 'absolute',
                width: '16px',
                height: '16px',
                backgroundColor: 'red',
                cursor: 'nesw-resize',
                pointerEvents: 'auto', // Make the child divs interactable
              }}
              onMouseDown={() => {
                setDraggingCorner('bottom-left');
                setAspectRatio(width / height);
              }}
            />
            {/* Bottom-right corner */}
            <div
              className="resize-handle bottom-right"
              style={{
                right: -8,
                bottom: -8,
                position: 'absolute',
                width: '16px',
                height: '16px',
                backgroundColor: 'red',
                cursor: 'nwse-resize',
                pointerEvents: 'auto', // Make the child divs interactable
              }}
              onMouseDown={() => {
                setDraggingCorner('bottom-right');
                setAspectRatio(width / height);
              }}
            />
          </div>
        );
      })()}
    </>
  );
};

export default ImageResizer;
