import React, { useEffect, useRef } from 'react';

export const DynamicAudioBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Audio frequency nodes (spectral particles)
    const particleCount = Math.min(48, Math.floor(width / 30));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      baseAlpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.6 ? '#6366f1' : Math.random() > 0.3 ? '#38bdf8' : '#a855f7',
    }));

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing wave harmonics at the top and center
      const waves = [
        { freq: 0.002, speed: 0.8, amp: 50, yOffset: height * 0.22, color: 'rgba(99, 102, 241, 0.06)' },
        { freq: 0.003, speed: -0.6, amp: 70, yOffset: height * 0.28, color: 'rgba(56, 189, 248, 0.05)' },
        { freq: 0.0018, speed: 0.5, amp: 85, yOffset: height * 0.75, color: 'rgba(168, 85, 247, 0.05)' },
        { freq: 0.0025, speed: -0.4, amp: 60, yOffset: height * 0.82, color: 'rgba(99, 102, 241, 0.04)' },
      ];

      waves.forEach((w) => {
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, w.yOffset);

        for (let x = 0; x <= width; x += 15) {
          const y =
            w.yOffset +
            Math.sin(x * w.freq + time * w.speed) * w.amp +
            Math.sin(x * w.freq * 2.2 + time * 1.2) * (w.amp * 0.35);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = w.color;
        ctx.fill();
      });

      // 2. Draw harmonic constellation lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0) p1.x = width;
        if (p1.x > width) p1.x = 0;
        if (p1.y < 0) p1.y = height;
        if (p1.y > height) p1.y = 0;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p1.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Dynamic Canvas Ambient Waves */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />

      {/* Radiant Glowing Gradient Orbs */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[140px] animate-pulse" />
      <div className="absolute top-1/4 -right-40 w-[650px] h-[650px] bg-cyan-500/12 rounded-full blur-[160px]" />
      <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-purple-600/12 rounded-full blur-[150px]" />

      {/* High-Tech Spectral Acoustic Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #6366f1 1px, transparent 1px),
            linear-gradient(to bottom, #6366f1 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Vignette edge mask */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/40 to-slate-950/90" />
    </div>
  );
};
