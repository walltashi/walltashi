import { useState, useEffect } from 'react';
import type { ImageManager } from "@/lib/wasm/wasm";

interface ImageResizerProps {
  imageManager: ImageManager; 
  selectedImage: number; 
  setVersion: React.Dispatch<React.SetStateAction<number>>;
}

const ImageResizer: React.FC<ImageResizerProps> = ({ imageManager, selectedImage, setVersion }) => {
  const [draggingCorner, setDraggingCorner] = useState<string | null>(null);
  const [initialSize, setInitialSize] = useState<{ width: number, height: number } | null>(null);
  const [initialMouse, setInitialMouse] = useState<{ x: number, y: number } | null>(null);
  const [initialPosition, setInitialPosition] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!draggingCorner) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imageManager || selectedImage === null || !initialSize || !initialMouse || !initialPosition) return;

      const [width, height, originalWidth, originalHeight] = imageManager.get_image_size(selectedImage);
      const rotation = imageManager.get_image_rotation(selectedImage);

      // Calculate mouse movement in screen coordinates
      const dx = e.clientX - initialMouse.x;
      const dy = e.clientY - initialMouse.y;

      // Convert rotation to radians
      const radians = rotation * (Math.PI / 180);
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);

      // Calculate rotated mouse movement for size adjustments
      const rotatedDx = dx * cos + dy * sin;
      const rotatedDy = -dx * sin + dy * cos;

      // Calculate unrotated mouse movement for position adjustments
      // const unrotatedDx = dx * cos - dy * sin;
      // const unrotatedDy = dx * sin + dy * cos;

      let newWidth = width;
      let newHeight = height;
      let newX = initialPosition.x;
      let newY = initialPosition.y;

      // Adjust width, height, and position based on the dragging corner
      switch (draggingCorner) {
        case 'top-left':
          newWidth = initialSize.width - rotatedDx;
          newHeight = initialSize.height - rotatedDy;
          newX += rotatedDx;
          newY += rotatedDy;
          break;
        case 'top-right':
          newWidth = initialSize.width + rotatedDx;
          newHeight = initialSize.height - rotatedDy;
          newY += rotatedDy;
          break;
        case 'bottom-left':
          newWidth = initialSize.width - rotatedDx;
          newHeight = initialSize.height + rotatedDy;
          newX += rotatedDx;
          break;
        case 'bottom-right':
          newWidth = initialSize.width + rotatedDx;
          newHeight = initialSize.height + rotatedDy;
          break;
      }

      // Maintain aspect ratio if shift key is pressed
      if (e.shiftKey) {
        const aspectRatio = originalWidth / originalHeight;
        if (newWidth / newHeight > aspectRatio) {
          newWidth = newHeight * aspectRatio;
        } else {
          newHeight = newWidth / aspectRatio;
        }
      }

      // Apply size limits
      newWidth = Math.max(10, Math.min(2560, newWidth));
      newHeight = Math.max(10, Math.min(2560, newHeight));
      if (newX > initialPosition.x + initialSize.width) {
        newX = 0;
      }
      if (newY > initialPosition.y + initialSize.height) {
        newY = 0;
      }

      imageManager.update_image_size(selectedImage, Math.round(newWidth), Math.round(newHeight));
      imageManager.move_image_absolute(selectedImage, Math.round(newX), Math.round(newY));
      setVersion((prev) => prev + 1);
    };

    const handleMouseUp = () => {
      setDraggingCorner(null);
      setInitialSize(null);
      setInitialMouse(null);
      setInitialPosition(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingCorner, imageManager, selectedImage, initialSize, initialMouse, initialPosition, setVersion]);

  if (!imageManager || selectedImage === null) return null;

  const [width, height] = imageManager.get_image_size(selectedImage);
  const [xPos, yPos] = imageManager.get_image_pos(selectedImage);
  const rotation = imageManager.get_image_rotation(selectedImage);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${xPos}px`,
        top: `${yPos}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: '2px solid red',
        backgroundColor: 'transparent',
        zIndex: 0,
        pointerEvents: 'none',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
        <div
          key={corner}
          className={`resize-handle ${corner}`}
          style={{
            position: 'absolute',
            width: '16px',
            height: '16px',
            backgroundColor: 'red',
            cursor: `${corner === 'top-left' || corner === 'bottom-right' ? 'nwse' : 'nesw'}-resize`,
            pointerEvents: 'auto',
            ...getCornerStyle(corner),
          }}
          onMouseDown={(e) => {
            setDraggingCorner(corner);
            setInitialSize({ width, height });
            setInitialMouse({ x: e.clientX, y: e.clientY });
            setInitialPosition({ x: xPos, y: yPos });
          }}
        />
      ))}
    </div>
  );
};

function getCornerStyle(corner: string) {
  switch (corner) {
    case 'top-left':
      return { left: -8, top: -8 };
    case 'top-right':
      return { right: -8, top: -8 };
    case 'bottom-left':
      return { left: -8, bottom: -8 };
    case 'bottom-right':
      return { right: -8, bottom: -8 };
  }
}

export default ImageResizer;