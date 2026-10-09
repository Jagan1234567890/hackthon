'use client';

import React, { useEffect, useRef } from 'react';

export const SpotlightCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

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

    // Mouse coordinates with smooth lerp
    let mouseX = width / 2;
    let mouseY = height / 3;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Stardust particles
    const particleCount = Math.min(45, Math.floor(width / 35));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    // Diagonal meteors (215 degrees angle)
    const meteorAngle = (215 * Math.PI) / 180;
    const meteorSpeed = 3.5;
    const dx = Math.cos(meteorAngle) * meteorSpeed;
    const dy = Math.sin(meteorAngle) * meteorSpeed;

    interface Meteor {
      x: number;
      y: number;
      len: number;
      alpha: number;
      life: number;
      maxLife: number;
    }

    let meteors: Meteor[] = [];

    const spawnMeteor = () => {
      if (Math.random() < 0.02 && meteors.length < 3) {
        meteors.push({
          x: Math.random() * width + 200,
          y: Math.random() * (height * 0.4),
          len: Math.random() * 80 + 40,
          alpha: 0.6,
          life: 0,
          maxLife: Math.random() * 60 + 40,
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Lerp mouse
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // Cursor spotlight radial violet glow
      const spotlight = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 500);
      spotlight.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
      spotlight.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
      spotlight.addColorStop(1, 'transparent');
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, width, height);

      // Render Stardust particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(200, 180, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render meteors
      spawnMeteor();
      meteors = meteors.filter((m) => {
        m.x += dx;
        m.y += dy;
        m.life++;

        const currentAlpha = m.alpha * (1 - m.life / m.maxLife);
        if (currentAlpha <= 0) return false;

        const tailX = m.x - Math.cos(meteorAngle) * m.len;
        const tailY = m.y - Math.sin(meteorAngle) * m.len;

        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(168, 85, 247, ${currentAlpha})`);
        grad.addColorStop(1, 'transparent');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        return m.life < m.maxLife;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full hidden md:block"
      style={{ willChange: 'transform' }}
    />
  );
};
