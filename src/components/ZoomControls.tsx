import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  min?: number;
  max?: number;
}

export const ZoomControls = ({ 
  zoom, 
  onZoomChange, 
  min = 4, 
  max = 12 
}: ZoomControlsProps) => {
  const handleZoomIn = () => {
    onZoomChange(Math.max(min, zoom - 0.5));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.min(max, zoom + 0.5));
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border shadow-sm">
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8"
        onClick={handleZoomIn}
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <div className="w-24">
        <Slider
          value={[zoom]}
          onValueChange={([value]) => onZoomChange(value)}
          min={min}
          max={max}
          step={0.5}
          className="cursor-pointer"
        />
      </div>
      
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8"
        onClick={handleZoomOut}
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
        {((12 - zoom) / 8 * 100).toFixed(0)}%
      </span>
    </div>
  );
};
