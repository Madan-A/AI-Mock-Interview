"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

export default function LandingBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log("Particles loaded", container);
  };

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 2,
          },
          repulse: {
            distance: 150,
            duration: 0.4,
          },
          attract: {
            distance: 200,
            duration: 0.4,
            speed: 1,
          },
        },
      },
      particles: {
        color: {
          value: ["#dddfff", "#cac5fe", "#a78bfa", "#8b5cf6"],
        },
        links: {
          color: "#cac5fe",
          distance: 120,
          enable: true,
          opacity: 0.4,
          width: 1.5,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: true,
          speed: 1.5,
          straight: false,
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200,
          },
        },
        number: {
          density: {
            enable: true,
          },
          value: 100,
        },
        opacity: {
          value: { min: 0.3, max: 0.8 },
          animation: {
            enable: true,
            speed: 0.5,
            sync: false,
          },
        },
        shape: {
          type: ["circle", "triangle"],
        },
        size: {
          value: { min: 1, max: 4 },
          animation: {
            enable: true,
            speed: 2,
            sync: false,
          },
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (!init) {
    return (
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0a0a15] via-[#1a1a2e] to-[#16213e]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(221,223,255,0.1),transparent_50%)]"></div>
      </div>
    );
  }

  return (
    <>
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a15] via-[#1a1a2e] to-[#16213e]"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-r from-[#cac5fe]/30 to-transparent rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 -right-1/4 w-[700px] h-[700px] bg-gradient-to-l from-[#a78bfa]/30 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-1/4 left-1/3 w-[600px] h-[600px] bg-gradient-to-t from-[#8b5cf6]/30 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(221,223,255,0.15),transparent_60%)]"></div>
        
        {/* Particles */}
        <Particles
          id="landing-particles"
          particlesLoaded={particlesLoaded}
          options={options}
          className="absolute inset-0"
        />
      </div>
    </>
  );
}

