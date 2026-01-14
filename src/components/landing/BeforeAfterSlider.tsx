import { useState, useRef, useCallback } from 'react';
import Container from '../ui/Container';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <section id="demo" className="py-20 bg-gray-50">
      <Container className="text-center">
        {/* Section Header */}
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
          See the Magic
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Precision in every pixel
        </h2>

        {/* Slider Container */}
        <div
          ref={containerRef}
          className="relative w-full max-w-3xl mx-auto aspect-[4/3] rounded-2xl overflow-hidden cursor-ew-resize select-none bg-gray-200"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          {/* Before Image (Full) */}
          <img
            src={beforeImage}
            alt="Before"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />

          {/* After Image (Clipped) */}
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
          >
            {/* Checkerboard background */}
            <div className="absolute inset-0 checkerboard" />
            <img
              src={afterImage}
              alt="After"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Slider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
            style={{ left: `${sliderPosition}%` }}
          />

          {/* Slider Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full border-2 border-primary shadow-lg flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform"
            style={{ left: `${sliderPosition}%` }}
          >
            <span className="text-primary font-bold text-lg">⇔</span>
          </div>
        </div>

        {/* Helper Text */}
        <p className="text-gray-text mt-6">Drag the slider to see the magic</p>
      </Container>
    </section>
  );
}
