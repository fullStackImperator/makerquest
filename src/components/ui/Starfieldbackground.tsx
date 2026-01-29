'use client'

import { useState, useEffect } from 'react'

interface Star {
  x: number
  y: number
  size: 'small' | 'large'
  delay: number
}

export default function StarfieldBackground() {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    // Generate random stars
    const newStars: Star[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.5 ? 'small' : 'large',
      delay: Math.random() * 3,
    }))
    setStars(newStars)
  }, [])

  return (
    <div className="starfield-container">
      {/* Starfield Background */}
      <div className="starfield">
        {stars.map((star, i) => (
          <div
            key={i}
            className={`star ${star.size}`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Pixel decorations */}
      <div className="pixel-plus plus-1">+</div>
      <div className="pixel-plus plus-2">+</div>
      <div className="pixel-plus plus-3">+</div>
      <div className="pixel-plus plus-4">+</div>
      <div className="pixel-plus plus-5">+</div>
      <div className="pixel-plus plus-6">+</div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .starfield-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(
            180deg,
            #1a1d3a 0%,
            #2d3561 50%,
            #1a1d3a 100%
          );
          overflow: hidden;
          z-index: -1;
        }

        /* Starfield */
        .starfield {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .star {
          position: absolute;
          background: #fff;
          animation: twinkle 3s infinite ease-in-out;
        }

        .star.small {
          width: 2px;
          height: 2px;
          box-shadow: 0 0 4px #4dd9ff;
        }

        .star.large {
          width: 8px;
          height: 8px;
          clip-path: polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
          );
          background: #4dd9ff;
          box-shadow: 0 0 12px #4dd9ff;
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* Pixel Plus Decorations */
        .pixel-plus {
          position: absolute;
          font-size: 2rem;
          color: #4dd9ff;
          text-shadow: 0 0 10px #4dd9ff;
          animation: plusFloat 4s ease-in-out infinite;
          z-index: 2;
          font-family: monospace;
          font-weight: bold;
        }

        .plus-1 {
          top: 15%;
          left: 15%;
          animation-delay: 0s;
        }

        .plus-2 {
          top: 20%;
          right: 20%;
          animation-delay: 1s;
        }

        .plus-3 {
          top: 60%;
          left: 10%;
          animation-delay: 2s;
        }

        .plus-4 {
          bottom: 20%;
          right: 15%;
          animation-delay: 1.5s;
        }

        .plus-5 {
          top: 40%;
          left: 25%;
          animation-delay: 0.5s;
        }

        .plus-6 {
          bottom: 35%;
          right: 30%;
          animation-delay: 2.5s;
        }

        @keyframes plusFloat {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.5;
          }
          50% {
            transform: translate(10px, -10px) rotate(45deg);
            opacity: 1;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .pixel-plus {
            font-size: 1.5rem;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .star,
          .pixel-plus {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
