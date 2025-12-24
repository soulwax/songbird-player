// File: src/components/FlowFieldBackground.tsx

"use client";

import { useEffect, useRef } from "react";
import { FlowFieldRenderer } from "./visualizers/FlowFieldRenderer";

interface FlowFieldBackgroundProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  onRendererReady?: (renderer: FlowFieldRenderer | null) => void;
}

export function FlowFieldBackground({
  audioElement,
  isPlaying,
  onRendererReady,
}: FlowFieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FlowFieldRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioElement) return;

    // Prevent duplicate source node creation for the same audio element
    // This is critical because createMediaElementSource can only be called once per element
    if (connectedAudioElementRef.current === audioElement) {
      return;
    }

    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    // Clean up previous connection if switching audio elements
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
    }

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;

    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceNodeRef.current = source;
    connectedAudioElementRef.current = audioElement;

    return () => {
      // Don't disconnect or reset refs on cleanup in Strict Mode
      // This prevents attempting to reconnect the same audio element
      // The cleanup will happen when the component unmounts or audio element changes
    };
  }, [audioElement]);

  // Initialize renderer and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      // Use display size - renderer handles quality scaling internally
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (rendererRef.current) {
        rendererRef.current.resize(window.innerWidth, window.innerHeight);
      } else {
        rendererRef.current = new FlowFieldRenderer(canvas);
      }
      onRendererReady?.(rendererRef.current);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      onRendererReady?.(null);
      rendererRef.current = null;
    };
  }, [onRendererReady]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !analyserRef.current || !rendererRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const analyser = analyserRef.current;
    const renderer = rendererRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      renderer.render(dataArray, dataArray.length);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Resume audio context if suspended
    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume();
    }

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        opacity: 0.6,
        filter: "blur(8px) contrast(1.4) saturate(1.6)",
        mixBlendMode: "screen",
      }}
    />
  );
}
