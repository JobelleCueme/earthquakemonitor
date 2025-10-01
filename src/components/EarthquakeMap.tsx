import { useEffect, useRef, useState } from 'react';
import { Earthquake } from '../types/earthquake';
import { getMagnitudeColor, getMagnitudeSize } from '../services/earthquakeService';

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  onSelectEarthquake: (earthquake: Earthquake) => void;
  selectedEarthquake: Earthquake | null;
  searchCoordinates: { lat: number; lng: number } | null;
  userLocation: { lat: number; lng: number } | null;
}

export const EarthquakeMap = ({
  earthquakes,
  onSelectEarthquake,
  selectedEarthquake,
  searchCoordinates,
  userLocation
}: EarthquakeMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 🟢 Handle zoom with non-passive listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // ✅ no warning now
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Center on searched coordinates
  useEffect(() => {
    if (searchCoordinates) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const x = ((searchCoordinates.lng + 180) / 360) * canvas.width;
      const y = ((90 - searchCoordinates.lat) / 180) * canvas.height;

      setPan({
        x: centerX - x * 2,
        y: centerY - y * 2
      });
      setZoom(2);
    }
  }, [searchCoordinates]);

  // Draw map + quakes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawMap();
    };

    const drawMap = () => {
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      drawGrid(ctx, canvas.width, canvas.height);
      drawContinents(ctx, canvas.width, canvas.height);

      earthquakes.forEach(quake => {
        const [lng, lat] = quake.geometry.coordinates;
        const x = ((lng + 180) / 360) * canvas.width;
        const y = ((90 - lat) / 180) * canvas.height;

        const isSelected = selectedEarthquake?.id === quake.id;
        const size = getMagnitudeSize(quake.properties.mag);
        const color = getMagnitudeColor(quake.properties.mag);

        ctx.beginPath();
        ctx.arc(x, y, size / zoom, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = isSelected ? 1 : 0.7;
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      });

      if (searchCoordinates) {
        const x = ((searchCoordinates.lng + 180) / 360) * canvas.width;
        const y = ((90 - searchCoordinates.lat) / 180) * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 8 / zoom, 0, Math.PI * 2);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();
      }

      if (userLocation) {
        const x = ((userLocation.lng + 180) / 360) * canvas.width;
        const y = ((90 - userLocation.lat) / 180) * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 10 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 10 / zoom, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 15 / zoom, 0, Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5 / zoom;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5 / zoom;

      for (let i = 0; i <= 360; i += 30) {
        const x = (i / 360) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let i = 0; i <= 180; i += 30) {
        const y = (i / 180) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const drawContinents = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = '#1e3a5f';
      ctx.globalAlpha = 0.3;

      const continents = [
        { x: 0.15, y: 0.25, w: 0.15, h: 0.25 },
        { x: 0.3, y: 0.15, w: 0.25, h: 0.3 },
        { x: 0.4, y: 0.4, w: 0.12, h: 0.2 },
        { x: 0.7, y: 0.2, w: 0.2, h: 0.25 },
        { x: 0.75, y: 0.5, w: 0.15, h: 0.15 },
        { x: 0.85, y: 0.65, w: 0.1, h: 0.1 },
      ];

      continents.forEach(cont => {
        ctx.fillRect(cont.x * width, cont.y * height, cont.w * width, cont.h * height);
      });

      ctx.globalAlpha = 1;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [earthquakes, zoom, pan, selectedEarthquake, searchCoordinates, userLocation]);

  // 🖱️ Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;

    for (const quake of earthquakes) {
      const [lng, lat] = quake.geometry.coordinates;
      const x = ((lng + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;

      const distance = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2));
      const size = getMagnitudeSize(quake.properties.mag);

      if (distance <= size) {
        onSelectEarthquake(quake);
        return;
      }
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-700">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
      <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-slate-300 border border-slate-700">
        Zoom: {zoom.toFixed(1)}x
      </div>
    </div>
  );
};
