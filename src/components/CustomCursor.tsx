import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trailingPos, setTrailingPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device is touch-primary
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Check if target is interactive
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('textarea') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer') ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'A'
        );
        setIsHovering(isInteractive);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  // Smooth lerp trailing cursor effect
  useEffect(() => {
    if (isTouchDevice) return;

    let animId: number;
    const smoothFactor = 0.22;

    const animate = () => {
      setTrailingPos((prev) => ({
        x: prev.x + (pos.x - prev.x) * smoothFactor,
        y: prev.y + (pos.y - prev.y) * smoothFactor,
      }));
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [pos, isTouchDevice]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Precision Core Audio Reticle Dot */}
      <div
        className="fixed w-2.5 h-2.5 rounded-full transition-transform duration-75 ease-out shadow-sm"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          transform: `translate(-50%, -50%) scale(${isClicking ? 0.65 : isHovering ? 1.5 : 1})`,
          backgroundColor: isHovering ? '#38bdf8' : '#818cf8',
          boxShadow: isHovering
            ? '0 0 14px #38bdf8, 0 0 28px rgba(56, 189, 248, 0.6)'
            : '0 0 10px #818cf8, 0 0 20px rgba(129, 140, 248, 0.4)',
        }}
      />

      {/* Trailing Acoustic Sonar / Frequency Ring */}
      <div
        className="fixed rounded-full transition-all duration-150 ease-out border"
        style={{
          left: `${trailingPos.x}px`,
          top: `${trailingPos.y}px`,
          width: isHovering ? '46px' : isClicking ? '26px' : '34px',
          height: isHovering ? '46px' : isClicking ? '26px' : '34px',
          transform: 'translate(-50%, -50%)',
          borderColor: isHovering ? 'rgba(56, 189, 248, 0.85)' : 'rgba(99, 102, 241, 0.45)',
          backgroundColor: isHovering ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
          boxShadow: isHovering
            ? '0 0 20px rgba(56, 189, 248, 0.3), inset 0 0 10px rgba(56, 189, 248, 0.15)'
            : 'none',
        }}
      >
        {/* Subtle crosshair tick marks when hovering interactive controls */}
        {isHovering && (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0.5 h-1.5 bg-cyan-400" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-0.5 h-1.5 bg-cyan-400" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-0.5 bg-cyan-400" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-1.5 h-0.5 bg-cyan-400" />
          </>
        )}
      </div>
    </div>
  );
};
