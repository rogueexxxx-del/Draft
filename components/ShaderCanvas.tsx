'use client';

import { useEffect, useRef, useState } from 'react';

interface ShaderCanvasProps {
  panel?: number; // 0 = all grid, 1 = metaballs, 2 = terrain, 3 = particles, 4 = liquid, 5 = magnet, 6 = crystal
  theme?: 'light' | 'dark' | 'rust';
  opacity?: number;
}

export default function ShaderCanvas({ panel = 0, theme = 'light', opacity = 1.0 }: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl) {
      console.warn('WebGL 2 not supported in this browser.');
      return;
    }

    const vertexShaderSource = `#version 300 es
      out vec2 vUv;
      void main() {
          float x = -1.0 + float((gl_VertexID & 1) << 2);
          float y = -1.0 + float((gl_VertexID & 2) << 1);
          vUv = vec2(x, y) * 0.5 + 0.5;
          gl_Position = vec4(x, y, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision highp float;
      in vec2 vUv;
      out vec4 fragColor;
      
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform int u_panel;
      uniform vec3 u_bgColor;
      uniform vec3 u_lineColor;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      mat2 rot(float a) { float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }

      // 1. Soft Blurry Metaballs (Aura Blob Style)
      vec3 renderPanel1(vec2 uv) {
          vec2 p = uv * 2.0 - 1.0;
          float d = 0.0;
          for(float i=0.0; i<4.0; i++) {
              vec2 pos = 0.75 * vec2(sin(u_time * 0.18 + i * 1.5), cos(u_time * 0.15 + i * 0.9));
              d += 0.38 / (length(p - pos) + 0.32);
          }
          float m = clamp(d * 0.28, 0.0, 1.0);
          return mix(u_bgColor, u_lineColor, m * 0.45);
      }

      void main() {
          vec3 col = renderPanel1(vUv);
          
          if (u_panel == 0) {
              // Render clean grid overlay on top of soft blurry aura (for dashboard)
              vec2 localUV = fract(vUv * vec2(3.0, 2.0));
              vec2 border = smoothstep(0.005, 0.0, localUV) + smoothstep(0.995, 1.0, localUV);
              if(max(border.x, border.y) > 0.5) col = mix(col, u_lineColor, 0.15);
          }

          // Noise grain
          col = mix(col, vec3(hash(vUv * u_resolution + u_time)), 0.04);
          fragColor = vec4(col, 1.0);
      }
    `;

    function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const program = gl.createProgram();
    if (!program) return;

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (vs && fs) {
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
      }

      // Bind VAO to satisfy strict WebGL 2 drivers on mobile Safari/WebKit
      const vao = gl.createVertexArray();
      if (vao) {
        gl.bindVertexArray(vao);
      }

      gl.useProgram(program);

      const uRes = gl.getUniformLocation(program, "u_resolution");
      const uTime = gl.getUniformLocation(program, "u_time");
      const uPanel = gl.getUniformLocation(program, "u_panel");
      const uBgColor = gl.getUniformLocation(program, "u_bgColor");
      const uLineColor = gl.getUniformLocation(program, "u_lineColor");

      // Setup theme variables based on props
      let bgVec = [1.0, 1.0, 1.0]; // White
      let lineVec = [0.867, 0.251, 0.039]; // Rust

      if (theme === 'dark') {
        bgVec = [0.078, 0.078, 0.078]; // Ink #141414
        lineVec = [1.0, 1.0, 1.0]; // White
      } else if (theme === 'rust') {
        bgVec = [0.867, 0.251, 0.039]; // Rust #DD400A
        lineVec = [1.0, 1.0, 1.0]; // White
      }

      gl.uniform3f(uBgColor, bgVec[0], bgVec[1], bgVec[2]);
      gl.uniform3f(uLineColor, lineVec[0], lineVec[1], lineVec[2]);
      gl.uniform1i(uPanel, panel);

      function resize() {
        if (!canvas || !gl) return;
        canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
        canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      }

      window.addEventListener('resize', resize);
      resize();

      let animationFrameId: number;

      function render(t: number) {
        if (!gl || !program) return;
        if (uTime) gl.uniform1f(uTime, t * 0.001);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        animationFrameId = requestAnimationFrame(render);
      }

      animationFrameId = requestAnimationFrame(render);

      return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
        if (vao) gl.deleteVertexArray(vao);
        gl.deleteProgram(program);
      };
    }
  }, [panel, theme]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ opacity, filter: isMobile ? 'blur(8px)' : 'blur(20px)' }}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none select-none no-print scale-125 transform-gpu"
    />
  );
}
