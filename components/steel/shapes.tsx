"use client";

/**
 * Hình mô phỏng tiết diện thép cơ bản (Section 10).
 * Vẽ bằng SVG thuần, có dimension line + nhãn (H, B, tw, tf...).
 * Không phải bản vẽ kỹ thuật chính xác tuyệt đối — chỉ mang tính minh họa để
 * người dùng phân biệt nhanh hình dạng các loại thép.
 */

const stroke = "currentColor";

function DimLabel({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <text x={x} y={y} fontSize="11" fill={stroke} textAnchor="middle" fontFamily="monospace">
      {children}
    </text>
  );
}

export function HBeamShape() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
      <g fill="none" stroke={stroke} strokeWidth="3">
        <path d="M50 30 H150 M50 30 V45 M150 30 V45 M85 45 H115 V155 H85 Z M50 155 H150 M50 155 V170 M150 155 V170" />
      </g>
      <DimLabel x={100} y={20}>B (Width)</DimLabel>
      <DimLabel x={170} y={95}>H (Height)</DimLabel>
      <DimLabel x={100} y={100}>tw</DimLabel>
      <DimLabel x={40} y={40}>tf</DimLabel>
    </svg>
  );
}

export function IBeamShape() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
      <g fill="none" stroke={stroke} strokeWidth="3">
        <path d="M60 30 H140 M60 30 V42 M140 30 V42 M92 42 H108 V158 H92 Z M60 158 H140 M60 158 V170 M140 158 V170" />
      </g>
      <DimLabel x={100} y={20}>B</DimLabel>
      <DimLabel x={155} y={100}>H</DimLabel>
    </svg>
  );
}

export function AngleShape() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
      <g fill="none" stroke={stroke} strokeWidth="3">
        <path d="M50 40 V160 H170 V145 H65 V40 Z" />
      </g>
      <DimLabel x={100} y={175}>B</DimLabel>
      <DimLabel x={35} y={100}>H</DimLabel>
    </svg>
  );
}

export function ChannelShape() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
      <g fill="none" stroke={stroke} strokeWidth="3">
        <path d="M140 35 H60 V165 H140 M140 35 V50 M60 35 M140 165 V150" />
        <path d="M60 35 H70 V165 H60" />
      </g>
      <DimLabel x={100} y={20}>B</DimLabel>
      <DimLabel x={45} y={100}>H</DimLabel>
    </svg>
  );
}

export function FlatBarShape() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
      <rect x="40" y="80" width="120" height="40" fill="none" stroke={stroke} strokeWidth="3" />
      <DimLabel x={100} y={70}>Width</DimLabel>
      <DimLabel x={175} y={105}>t</DimLabel>
    </svg>
  );
}

export function RoundBarShape() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
      <circle cx="100" cy="100" r="55" fill="none" stroke={stroke} strokeWidth="3" />
      <line x1="45" y1="100" x2="155" y2="100" stroke={stroke} strokeWidth="1" strokeDasharray="4 3" />
      <DimLabel x={100} y={95}>⌀ D</DimLabel>
    </svg>
  );
}

export function SquareBarShape() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
      <rect x="55" y="55" width="90" height="90" fill="none" stroke={stroke} strokeWidth="3" />
      <DimLabel x={100} y={45}>A</DimLabel>
    </svg>
  );
}

export function PlateShape() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
      <g fill="none" stroke={stroke} strokeWidth="3">
        <rect x="35" y="60" width="130" height="80" />
        <path d="M35 140 L20 155 M165 140 L180 155 M20 155 H180" strokeDasharray="3 3" strokeWidth="1.5" />
      </g>
      <DimLabel x={100} y={50}>Width</DimLabel>
      <DimLabel x={100} y={170}>Length</DimLabel>
    </svg>
  );
}

export function RoundPipeShape() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
      <circle cx="100" cy="100" r="55" fill="none" stroke={stroke} strokeWidth="3" />
      <circle cx="100" cy="100" r="42" fill="none" stroke={stroke} strokeWidth="2" />
      <DimLabel x={100} y={95}>OD</DimLabel>
      <DimLabel x={100} y={112}>ID</DimLabel>
    </svg>
  );
}

export function HollowSectionShape() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
      <rect x="45" y="45" width="110" height="110" fill="none" stroke={stroke} strokeWidth="3" />
      <rect x="60" y="60" width="80" height="80" fill="none" stroke={stroke} strokeWidth="2" />
      <DimLabel x={100} y={38}>B</DimLabel>
      <DimLabel x={30} y={100}>H</DimLabel>
    </svg>
  );
}

const shapeRegistry: Record<string, React.ComponentType> = {
  "H-Beam": HBeamShape,
  "I-Beam": IBeamShape,
  "Angle": AngleShape,
  "Channel": ChannelShape,
  "Flat Bar": FlatBarShape,
  "Round Bar": RoundBarShape,
  "Square Bar": SquareBarShape,
  "Plate": PlateShape,
  "Round Pipe": RoundPipeShape,
  "Rectangular Tube": HollowSectionShape,
  "Hollow Section": HollowSectionShape,
};

export function SteelShapeIllustration({ shape }: { shape: string }) {
  const Component = shapeRegistry[shape] ?? PlateShape;
  return (
    <div className="aspect-square w-full bg-muted rounded-lg p-4">
      <Component />
    </div>
  );
}

export const SHAPE_OPTIONS = Object.keys(shapeRegistry);
