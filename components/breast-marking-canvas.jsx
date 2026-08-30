"use client"

import React, { useRef, useImperativeHandle, useState, forwardRef, useEffect } from "react";

function IconMove(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 2l3 3h-2v4h4V7l3 3-3 3v-2h-4v4h2l-3 3-3-3h2v-4H7v2l-3-3 3-3v2h4V5H9l3-3z"
      />
    </svg>
  );
}

function IconResizeUp(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M11 3h2v8h8v2h-8v8h-2v-8H3v-2h8V3z" />
    </svg>
  );
}

function IconResizeDown(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M3 11h18v2H3v-2z" />
    </svg>
  );
}

function IconRotateLeft(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M7.1 7.1L4 4v7h7L7.9 7.9A7 7 0 1 1 5 12H3a9 9 0 1 0 4.1-7.6z"
      />
    </svg>
  );
}

function IconRotateRight(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M16.9 7.1A9 9 0 1 0 21 12h-2a7 7 0 1 1-2.9-5.9L13 11h7V4l-3.1 3.1z"
      />
    </svg>
  );
}

const BreastMarkingCanvas = forwardRef(function BreastMarkingCanvas(props, ref) {
  const { side = 'both' } = props; // 'both' | 'left' | 'right'
  const canvasRef = useRef(null);
  const [items, setItems] = useState([]);
  const [activeTool, setActiveTool] = useState('nevo');
  const [selectedId, setSelectedId] = useState(null);
  const dragRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getDataUrl: () => {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL('image/jpeg', 0.95) : null;
    },
    clear: () => {
      setItems([]);
      setSelectedId(null);
      redraw();
    }
  }));

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function getCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    return ctx;
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,w,h);

    // draw breasts schematic depending on `side`
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    const r = Math.min(w, h) * 0.28;
    if (side === 'both') {
      drawBreast(ctx, w * 0.25, h * 0.5, r);
      drawBreast(ctx, w * 0.75, h * 0.5, r);
    } else if (side === 'left') {
      drawBreast(ctx, w * 0.5, h * 0.45, r);
    } else if (side === 'right') {
      drawBreast(ctx, w * 0.5, h * 0.45, r);
    }

    items.forEach((it) => {
      drawItem(ctx, it);
    });
  }

  function drawItem(ctx, it) {
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    ctx.lineWidth = 2;

    const scale = typeof it.scale === 'number' ? it.scale : 1;
    const rotation = typeof it.rotation === 'number' ? it.rotation : 0;

    ctx.translate(it.x, it.y);
    ctx.scale(scale, scale);
    ctx.rotate(rotation);

    if (it.type === 'nevo') {
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (it.type === 'mastectomia') {
      const s = 18;
      ctx.beginPath();
      ctx.moveTo(-s, -s);
      ctx.lineTo(s, s);
      ctx.moveTo(s, -s);
      ctx.lineTo(-s, s);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (it.type === 'nodulo_esq' || it.type === 'nodulo_dir') {
      const len = 54;
      const half = len / 2;
      const baseAngle = it.type === 'nodulo_esq' ? -0.35 : 0.35;
      const angle = baseAngle;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const px = -dy;
      const py = dx;

      const x1 = -dx * half;
      const y1 = -dy * half;
      const x2 = dx * half;
      const y2 = dy * half;

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const stitches = 5;
      const stitchSize = 8;
      for (let i = 0; i < stitches; i++) {
        const t = (i + 1) / (stitches + 1);
        const sx = x1 + (x2 - x1) * t;
        const sy = y1 + (y2 - y1) * t;

        ctx.beginPath();
        ctx.moveTo(sx - px * (stitchSize / 2), sy - py * (stitchSize / 2));
        ctx.lineTo(sx + px * (stitchSize / 2), sy + py * (stitchSize / 2));
        ctx.stroke();
        const vx = dx;
        const vy = dy;
        ctx.beginPath();
        ctx.moveTo(sx - (vx + px) * (stitchSize / 3), sy - (vy + py) * (stitchSize / 3));
        ctx.lineTo(sx + (vx + px) * (stitchSize / 3), sy + (vy + py) * (stitchSize / 3));
        ctx.stroke();
      }

      ctx.restore();
      return;
    }

    if (it.type === 'protese') {
      const r = 8;
      const stem = 22;
      const base = 18;
      ctx.beginPath();
      ctx.arc(0, -stem, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -stem + r);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-base / 2, 0);
      ctx.lineTo(base / 2, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.restore();
  }

  function getCanvasPointFromEvent(e) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function hitTestItem(it, x, y) {
    const scale = typeof it.scale === 'number' ? it.scale : 1;
    if (it.type === 'nevo') {
      const dx = x - it.x;
      const dy = y - it.y;
      return Math.sqrt(dx * dx + dy * dy) <= 10 * scale;
    }
    if (it.type === 'mastectomia') {
      return Math.abs(x - it.x) <= 22 * scale && Math.abs(y - it.y) <= 22 * scale;
    }
    if (it.type === 'nodulo_esq' || it.type === 'nodulo_dir') {
      return Math.abs(x - it.x) <= 34 * scale && Math.abs(y - it.y) <= 22 * scale;
    }
    if (it.type === 'protese') {
      return Math.abs(x - it.x) <= 22 * scale && Math.abs(y - it.y) <= 40 * scale;
    }
    return false;
  }

  function placeItem(x, y, type) {
    const id = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    setItems((prev) => [
      ...prev,
      {
        id,
        type,
        x,
        y,
        scale: 1,
        rotation: 0,
      }
    ]);
    setSelectedId(id);
  }

  function bumpSelectedScale(delta) {
    if (!selectedId) return;
    setItems((prev) => prev.map((it) => {
      if (it.id !== selectedId) return it;
      const current = typeof it.scale === 'number' ? it.scale : 1;
      const next = Math.min(3, Math.max(0.4, current + delta));
      return { ...it, scale: next };
    }));
  }

  function rotateSelected(deltaRadians) {
    if (!selectedId) return;
    setItems((prev) => prev.map((it) => {
      if (it.id !== selectedId) return it;
      const current = typeof it.rotation === 'number' ? it.rotation : 0;
      return { ...it, rotation: current + deltaRadians };
    }));
  }

  function drawBreast(ctx, cx, cy, r) {
    ctx.save();
    // breast outline
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.arc(cx, cy, r, Math.PI * 0.1, Math.PI * 0.9, false);
    ctx.lineTo(cx + r * Math.cos(Math.PI * 0.9), cy + r * Math.sin(Math.PI * 0.9));
    ctx.stroke();

    // nipple: small black dot with a slightly larger ring around
    const outerR = r * 0.14;
    const innerR = r * 0.08;
    const nx = cx;
    const ny = cy - r * 0.1; // nipple center
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.arc(nx, ny, outerR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.arc(nx, ny, innerR, 0, Math.PI * 2);
    ctx.fill();

    // draw clock numbers around the nipple (1..12) with outline for visibility
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(14, Math.floor(r * 0.12));
    ctx.font = `bold ${fontSize}px sans-serif`;
    const numbersRadius = r * 0.9; // place numbers closer to the breast contour
    for (let i = 1; i <= 12; i++) {
      const angle = -Math.PI / 2 + (i * (2 * Math.PI / 12));
      const tx = nx + Math.cos(angle) * numbersRadius;
      const ty = ny + Math.sin(angle) * numbersRadius;
      // outline for contrast
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.strokeText(String(i), tx, ty);
      ctx.fillStyle = '#000';
      ctx.fillText(String(i), tx, ty);
    }
    ctx.restore();
  }

  function handlePointerDown(e) {
    const pt = getCanvasPointFromEvent(e);
    if (!pt) return;

    let selectedIndex = -1;
    for (let i = items.length - 1; i >= 0; i--) {
      if (hitTestItem(items[i], pt.x, pt.y)) {
        selectedIndex = i;
        break;
      }
    }

    if (selectedIndex !== -1) {
      const selected = items[selectedIndex];
      setSelectedId(selected.id);
      dragRef.current = {
        id: selected.id,
        offsetX: pt.x - selected.x,
        offsetY: pt.y - selected.y,
      };

      setItems((prev) => {
        const idx = prev.findIndex((it) => it.id === selected.id);
        if (idx === -1) return prev;
        const copy = prev.slice();
        const [it] = copy.splice(idx, 1);
        copy.push(it);
        return copy;
      });

      try {
        canvasRef.current?.setPointerCapture?.(e.pointerId);
      } catch {}
      return;
    }

    if (activeTool === 'mover') return;

    placeItem(pt.x, pt.y, activeTool);
  }

  function handlePointerMove(e) {
    const drag = dragRef.current;
    if (!drag) return;
    const pt = getCanvasPointFromEvent(e);
    if (!pt) return;
    setItems((prev) => prev.map((it) => {
      if (it.id !== drag.id) return it;
      return {
        ...it,
        x: pt.x - drag.offsetX,
        y: pt.y - drag.offsetY,
      };
    }));
  }

  function handlePointerUp(e) {
    if (!dragRef.current) return;
    dragRef.current = null;
    try {
      canvasRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {}
  }

  function handleClear() {
    setItems([]);
    setSelectedId(null);
  }

  function handleUndo() {
    setItems((prev) => prev.slice(0, -1));
    setSelectedId(null);
  }

  return (
    <div className="mt-8">
      <div className="border border-border p-3 bg-white rounded-md">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => setActiveTool('nodulo_esq')}
            className={`px-3 py-2 rounded border ${activeTool === 'nodulo_esq' ? 'bg-gray-200' : 'bg-white'}`}
            title="Retirada de Nódulo (inclinação para a esquerda)"
          >
            Retirada de Nódulo (/)
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('nodulo_dir')}
            className={`px-3 py-2 rounded border ${activeTool === 'nodulo_dir' ? 'bg-gray-200' : 'bg-white'}`}
            title="Retirada de Nódulo (inclinação para a direita)"
          >
            Retirada de Nódulo (\)
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('protese')}
            className={`px-3 py-2 rounded border ${activeTool === 'protese' ? 'bg-gray-200' : 'bg-white'}`}
            title="Mamoplastia / Prótese"
          >
            Prótese
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('nevo')}
            className={`px-3 py-2 rounded border ${activeTool === 'nevo' ? 'bg-gray-200' : 'bg-white'}`}
            title="Nevo / Sinal"
          >
            Nevo
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('mastectomia')}
            className={`px-3 py-2 rounded border ${activeTool === 'mastectomia' ? 'bg-gray-200' : 'bg-white'}`}
            title="Mastectomia"
          >
            Mastectomia
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-auto cursor-crosshair"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3 justify-between">
          <div className="flex gap-2">
            <button type="button" onClick={handleUndo} className="px-3 py-2 bg-gray-200 rounded">Desfazer</button>
            <button type="button" onClick={handleClear} className="px-3 py-2 bg-red-500 text-white rounded">Limpar</button>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => setActiveTool('mover')}
              className={`px-3 py-2 rounded border flex items-center gap-2 ${activeTool === 'mover' ? 'bg-gray-200' : 'bg-white'}`}
              title="Mover/arrastar peças já colocadas"
            >
              <IconMove className="w-4 h-4" />
              Mover
            </button>

            <button
              type="button"
              onClick={() => bumpSelectedScale(0.15)}
              disabled={!selectedId}
              className={`px-3 py-2 rounded border flex items-center gap-2 ${selectedId ? 'bg-white' : 'bg-gray-100 opacity-60 cursor-not-allowed'}`}
              title="Ampliar a peça selecionada"
            >
              <IconResizeUp className="w-4 h-4" />
              Ampliar
            </button>

            <button
              type="button"
              onClick={() => bumpSelectedScale(-0.15)}
              disabled={!selectedId}
              className={`px-3 py-2 rounded border flex items-center gap-2 ${selectedId ? 'bg-white' : 'bg-gray-100 opacity-60 cursor-not-allowed'}`}
              title="Diminuir a peça selecionada"
            >
              <IconResizeDown className="w-4 h-4" />
              Diminuir
            </button>

            <button
              type="button"
              onClick={() => rotateSelected(-Math.PI / 12)}
              disabled={!selectedId}
              className={`px-3 py-2 rounded border flex items-center gap-2 ${selectedId ? 'bg-white' : 'bg-gray-100 opacity-60 cursor-not-allowed'}`}
              title="Girar peça selecionada para a esquerda"
            >
              <IconRotateLeft className="w-4 h-4" />
              Girar ↺
            </button>

            <button
              type="button"
              onClick={() => rotateSelected(Math.PI / 12)}
              disabled={!selectedId}
              className={`px-3 py-2 rounded border flex items-center gap-2 ${selectedId ? 'bg-white' : 'bg-gray-100 opacity-60 cursor-not-allowed'}`}
              title="Girar peça selecionada para a direita"
            >
              <IconRotateRight className="w-4 h-4" />
              Girar ↻
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BreastMarkingCanvas;
