import React from 'react';

interface OrbProps {
  size: number;
  top: string;
  left: string;
  color1: string;
  color2: string;
  animClass: string;
  opacity?: number;
  blur?: number;
}

const Orb: React.FC<OrbProps> = ({
  size,
  top,
  left,
  color1,
  color2,
  animClass,
  opacity = 0.35,
  blur = 60,
}) => (
  <div
    aria-hidden="true"
    className={animClass}
    style={{
      position: 'absolute',
      top,
      left,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 40% 40%, ${color1}, ${color2})`,
      opacity,
      filter: `blur(${blur}px)`,
      pointerEvents: 'none',
      willChange: 'transform',
    }}
  />
);

/**
 * ParticleBackground
 * Glowing orb melayang di background menggunakan CSS animasi murni.
 * Tidak ada library eksternal — zero overhead.
 */
const ParticleBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Orb 1 — Teal besar kiri atas */}
      <Orb
        size={480}
        top="-120px"
        left="-100px"
        color1="rgba(3, 63, 63, 0.8)"
        color2="rgba(3, 63, 63, 0.1)"
        animClass="animate-orb1"
        opacity={0.28}
        blur={80}
      />

      {/* Orb 2 — Orange kanan bawah */}
      <Orb
        size={420}
        top="55%"
        left="65%"
        color1="rgba(205, 91, 25, 0.9)"
        color2="rgba(205, 91, 25, 0.05)"
        animClass="animate-orb2"
        opacity={0.22}
        blur={90}
      />

      {/* Orb 3 — Gold aksen tengah */}
      <Orb
        size={260}
        top="30%"
        left="40%"
        color1="rgba(242, 208, 134, 0.95)"
        color2="rgba(242, 208, 134, 0.05)"
        animClass="animate-orb3"
        opacity={0.18}
        blur={60}
      />

      {/* Orb 4 — Teal kecil kanan atas */}
      <Orb
        size={180}
        top="5%"
        left="78%"
        color1="rgba(79, 121, 121, 0.8)"
        color2="rgba(79, 121, 121, 0.1)"
        animClass="animate-orb1"
        opacity={0.25}
        blur={45}
      />

      {/* Orb 5 — Orange kecil kiri bawah */}
      <Orb
        size={150}
        top="75%"
        left="8%"
        color1="rgba(205, 91, 25, 0.7)"
        color2="rgba(242, 208, 134, 0.2)"
        animClass="animate-orb2"
        opacity={0.2}
        blur={40}
      />
    </div>
  );
};

export default ParticleBackground;
