'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * CursorSpotlightCanvas
 * 
 * Tracks mouse movement to render:
 * 1. A radial violet glow following the cursor
 * 2. Ambient floating stardust particles
 * 3. Diagonal meteor light streaks at ~215 degrees
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export function SpotlightCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -500, y: -500 });
  const particlesRef = useRef<Particle[]>([]);
  const meteorsRef = useRef<Meteor[]>([]);
  const animRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  const STAR_COLORS = [
    'oklch(0.62 0.22 295)',
    'oklch(0.72 0.17 155)',
    'oklch(0.85 0.01 280)',
    'oklch(0.75 0.14 210)',
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to viewport
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);

    // Spawn initial particles
    const spawnParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.6 - 0.2,
      r: Math.random() * 1.5 + 0.5,
      alpha: 0,
      life: 0,
      maxLife: Math.random() * 400 + 200,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    });

    const spawnMeteor = (): Meteor => {
      const angle = 215 * (Math.PI / 180);
      const speed = Math.random() * 4 + 3;
      return {
        x: Math.random() * canvas.width * 1.5 - canvas.width * 0.25,
        y: Math.random() * canvas.height * 0.5 - canvas.height * 0.25,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 120 + 60,
        alpha: 0,
        life: 0,
        maxLife: Math.random() * 120 + 80,
      };
    };

    // Initialize particle pool
    for (let i = 0; i < 80; i++) {
      const p = spawnParticle();
      p.life = Math.random() * p.maxLife; // stagger start
      particlesRef.current.push(p);
    }

    let frameCount = 0;

    const draw = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // 1. Draw cursor spotlight glow
      if (mx > -400) {
        const grd = ctx.createRadialGradient(mx, my, 0, mx, my, 200);
        grd.addColorStop(0, 'oklch(0.62 0.22 295 / 0.07)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd as unknown as string;
        ctx.beginPath();
        ctx.arc(mx, my, 200, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Update and draw stardust particles
      particlesRef.current.forEach((p, idx) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        if (progress < 0.1) {
          p.alpha = progress * 10;
        } else if (progress > 0.85) {
          p.alpha = (1 - progress) * (1 / 0.15);
        } else {
          p.alpha = 1;
        }

        if (p.life >= p.maxLife || p.y < -10) {
          particlesRef.current[idx] = { ...spawnParticle(), life: 0, alpha: 0 };
          return;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha * 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = '#A855F7'; // electric violet
        ctx.fill();
        ctx.restore();
      });

      // 3. Spawn meteors periodically
      if (frameCount % 240 === 0 && meteorsRef.current.length < 5) {
        meteorsRef.current.push(spawnMeteor());
      }

      // 4. Update and draw meteors
      meteorsRef.current = meteorsRef.current.filter((m) => {
        m.life++;
        m.x += m.vx;
        m.y += m.vy;

        const progress = m.life / m.maxLife;
        if (progress < 0.15) {
          m.alpha = progress / 0.15;
        } else if (progress > 0.7) {
          m.alpha = (1 - progress) / 0.3;
        } else {
          m.alpha = 1;
        }

        if (m.life >= m.maxLife) return false;

        // Compute tail
        const angle = 215 * (Math.PI / 180);
        const tailX = m.x - Math.cos(angle) * m.length;
        const tailY = m.y - Math.sin(angle) * m.length;

        const grd = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grd.addColorStop(0, `rgba(168, 85, 247, 0)`);
        grd.addColorStop(0.4, `rgba(168, 85, 247, ${m.alpha * 0.4})`);
        grd.addColorStop(1, `rgba(255, 255, 255, ${m.alpha * 0.7})`);

        ctx.save();
        ctx.globalAlpha = m.alpha * 0.6;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grd as unknown as string;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        return true;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      id="spotlight-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
