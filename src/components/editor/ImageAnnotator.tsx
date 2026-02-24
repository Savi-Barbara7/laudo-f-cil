import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as fabric from 'fabric';
import {
  MousePointer2, ArrowRight, Circle, Square, Type,
  Minus, Save, Undo, Trash2, X, Pen,
} from 'lucide-react';

type Tool = 'select' | 'arrow' | 'circle' | 'rect' | 'text' | 'line' | 'freehand';

interface ImageAnnotatorProps {
  imageUrl: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const COLORS = ['#FF0000', '#0066FF', '#00CC44', '#FFD600', '#FF6600', '#FFFFFF', '#000000'];

export function ImageAnnotator({ imageUrl, onSave, onCancel }: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [activeColor, setActiveColor] = useState('#FF0000');
  const [textInput, setTextInput] = useState('');
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const tempObjRef = useRef<fabric.FabricObject | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: true,
      backgroundColor: '#f0f0f0',
    });
    fabricRef.current = canvas;

    // Load background image
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxW = 900;
      const maxH = 650;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      canvas.setDimensions({ width: w, height: h });

      const fabricImage = new fabric.FabricImage(img, {
        left: 0,
        top: 0,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });
      canvas.backgroundImage = fabricImage;
      canvas.renderAll();
    };
    img.src = imageUrl;

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  // Configure tool-specific canvas behavior
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const isSelect = activeTool === 'select';
    canvas.isDrawingMode = activeTool === 'freehand';
    if (activeTool === 'freehand') {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = 3;
    }

    canvas.selection = isSelect;
    canvas.discardActiveObject();
    canvas.forEachObject(o => { o.selectable = isSelect; });
    canvas.renderAll();
  }, [activeTool, activeColor]);

  // Mouse events for drawing shapes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const onMouseDown = (opt: fabric.TPointerEventInfo) => {
      if (activeTool === 'select' || activeTool === 'freehand') return;
      const pointer = canvas.getScenePoint(opt.e);
      drawStartRef.current = { x: pointer.x, y: pointer.y };

      if (activeTool === 'text') {
        const text = new fabric.IText(textInput || 'Texto', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 18,
          fontFamily: 'Arial',
          fill: activeColor,
          fontWeight: 'bold',
          editable: true,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        setActiveTool('select');
        return;
      }

      let obj: fabric.FabricObject | null = null;
      if (activeTool === 'rect') {
        obj = new fabric.Rect({
          left: pointer.x, top: pointer.y, width: 1, height: 1,
          fill: 'transparent', stroke: activeColor, strokeWidth: 3,
        });
      } else if (activeTool === 'circle') {
        obj = new fabric.Ellipse({
          left: pointer.x, top: pointer.y, rx: 1, ry: 1,
          fill: 'transparent', stroke: activeColor, strokeWidth: 3,
        });
      } else if (activeTool === 'line' || activeTool === 'arrow') {
        obj = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: activeColor, strokeWidth: 3,
        });
      }

      if (obj) {
        canvas.add(obj);
        tempObjRef.current = obj;
      }
    };

    const onMouseMove = (opt: fabric.TPointerEventInfo) => {
      if (!drawStartRef.current || !tempObjRef.current) return;
      const pointer = canvas.getScenePoint(opt.e);
      const sx = drawStartRef.current.x;
      const sy = drawStartRef.current.y;

      if (activeTool === 'rect') {
        const r = tempObjRef.current as fabric.Rect;
        r.set({
          left: Math.min(sx, pointer.x), top: Math.min(sy, pointer.y),
          width: Math.abs(pointer.x - sx), height: Math.abs(pointer.y - sy),
        });
      } else if (activeTool === 'circle') {
        const e = tempObjRef.current as fabric.Ellipse;
        e.set({
          left: Math.min(sx, pointer.x), top: Math.min(sy, pointer.y),
          rx: Math.abs(pointer.x - sx) / 2, ry: Math.abs(pointer.y - sy) / 2,
        });
      } else if (activeTool === 'line' || activeTool === 'arrow') {
        const l = tempObjRef.current as fabric.Line;
        l.set({ x2: pointer.x, y2: pointer.y });
      }
      canvas.renderAll();
    };

    const onMouseUp = () => {
      if (activeTool === 'arrow' && tempObjRef.current) {
        const l = tempObjRef.current as fabric.Line;
        const x1 = l.x1!, y1 = l.y1!, x2 = l.x2!, y2 = l.y2!;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 14;

        // Create arrowhead as a triangle
        const headPoints = [
          { x: x2, y: y2 },
          { x: x2 - headLen * Math.cos(angle - Math.PI / 6), y: y2 - headLen * Math.sin(angle - Math.PI / 6) },
          { x: x2 - headLen * Math.cos(angle + Math.PI / 6), y: y2 - headLen * Math.sin(angle + Math.PI / 6) },
        ];
        const head = new fabric.Polygon(headPoints, {
          fill: activeColor, stroke: activeColor, strokeWidth: 1,
        });
        canvas.add(head);

        // Group line + head
        const group = new fabric.Group([l, head], { selectable: true });
        canvas.remove(l);
        canvas.remove(head);
        canvas.add(group);
      }

      drawStartRef.current = null;
      tempObjRef.current = null;
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
    };
  }, [activeTool, activeColor, textInput]);

  const handleDelete = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    active.forEach(obj => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    if (objects.length > 0) {
      canvas.remove(objects[objects.length - 1]);
      canvas.renderAll();
    }
  }, []);

  const handleSave = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.renderAll();
    const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    onSave(dataUrl);
  }, [onSave]);

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 className="h-4 w-4" />, label: 'Selecionar' },
    { id: 'arrow', icon: <ArrowRight className="h-4 w-4" />, label: 'Seta' },
    { id: 'line', icon: <Minus className="h-4 w-4" />, label: 'Linha' },
    { id: 'rect', icon: <Square className="h-4 w-4" />, label: 'Retângulo' },
    { id: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Elipse' },
    { id: 'text', icon: <Type className="h-4 w-4" />, label: 'Texto' },
    { id: 'freehand', icon: <Pen className="h-4 w-4" />, label: 'Mão livre' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="mx-auto w-fit max-h-[95vh] overflow-auto rounded-xl border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <h3 className="text-sm font-semibold">Anotações Técnicas</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b px-3 py-1.5">
        {tools.map(t => (
          <Button
            key={t.id}
            variant={activeTool === t.id ? 'default' : 'ghost'}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setActiveTool(t.id)}
            title={t.label}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </Button>
        ))}

        <div className="mx-1 h-5 w-px bg-border" />

        {COLORS.map(c => (
          <button
            key={c}
            className={`h-5 w-5 rounded-full border-2 transition-transform ${activeColor === c ? 'scale-125 border-foreground' : 'border-transparent'}`}
            style={{ backgroundColor: c }}
            onClick={() => setActiveColor(c)}
          />
        ))}

        <div className="mx-1 h-5 w-px bg-border" />

        {activeTool === 'text' && (
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Texto..."
            className="h-7 w-32 text-xs"
          />
        )}

        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleUndo} title="Desfazer">
          <Undo className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive" onClick={handleDelete} title="Excluir selecionado">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="bg-muted/50 p-2">
        <div className="mx-auto w-fit rounded bg-white shadow">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t px-3 py-1.5">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" className="gap-1" onClick={handleSave}>
          <Save className="h-3.5 w-3.5" />
          Salvar Anotação
        </Button>
      </div>
      </div>
    </div>
  );
}