import React from 'react';
import { motion } from 'framer-motion';

/**
 * BeyManager X - Dynamic SVG Radar Chart
 * Visualizes 5 attributes in a pentagon shape
 */
export default function StatRadar({ stats, color = '#3B82F6' }) {
  // Map stats to fixed order: Attack, Defense, Stamina, Burst, Mobility
  const values = [
    stats.attack || 0,
    stats.defense || 0,
    stats.stamina || 0,
    stats.burst || 0,
    stats.mobility || 0
  ];

  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;

  const labels = ['ATT', 'DEF', 'STA', 'BUR', 'MOB'];

  const getPoint = (val, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const r = (val / 100) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  };

  const points = values.map((v, i) => getPoint(v, i)).join(' ');

  const getLabelPoint = (i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const r = radius + 25; // Offset labels outside the grid
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  return (
    <div className="relative w-[240px] h-[240px] flex items-center justify-center">
      <svg width={240} height={240} style={{ overflow: 'visible' }} viewBox="-20 -20 240 240">
        {/* Pentagonal Grids */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((step) => {
          const gridPoints = Array.from({ length: 5 }, (_, i) => getPoint(step * 100, i)).join(' ');
          return (
            <polygon 
              key={step}
              points={gridPoints} 
              fill="none" 
              stroke="white" 
              strokeWidth="0.5" 
              strokeOpacity="0.1" 
            />
          );
        })}

        {/* Axis Lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const p = getPoint(100, i);
          const lab = getLabelPoint(i);
          return (
            <React.Fragment key={i}>
              <line 
                x1={center} y1={center} 
                x2={p.split(',')[0]} y2={p.split(',')[1]} 
                stroke="white" 
                strokeWidth="0.5" 
                strokeOpacity="0.1" 
              />
              <text
                x={lab.x}
                y={lab.y}
                fill="white"
                fillOpacity="0.4"
                fontSize="10"
                fontWeight="900"
                textAnchor="middle"
                alignmentBaseline="middle"
                className="font-black uppercase tracking-tighter"
              >
                {labels[i]}
              </text>
            </React.Fragment>
          );
        })}

        {/* Data Polygon */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          points={points}
          fill={color}
          fillOpacity="0.3"
          stroke={color}
          strokeWidth="2"
          className="drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]"
        />

        {/* Data Points */}
        {values.map((v, i) => {
          const [x, y] = getPoint(v, i).split(',');
          return (
            <motion.circle 
              key={i}
              cx={x} cy={y} r="3" 
              fill={color} 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 * i }}
            />
          );
        })}
      </svg>
      
      {/* Labels would ideally be positioned manually around the SVG */}
    </div>
  );
}
