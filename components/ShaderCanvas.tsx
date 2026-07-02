'use client';

import { useEffect, useRef } from 'react';

interface ShaderCanvasProps {
  panel?: number; // 0 = all grid, 1 = metaballs, 2 = terrain, 3 = particles, 4 = liquid, 5 = magnet, 6 = crystal
  theme?: 'light' | 'dark' | 'rust';
  opacity?: number;
}

export default function ShaderCanvas({ panel = 0, theme = 'light', opacity = 1.0 }: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

      // 1. Metaballs
      vec3 renderPanel1(vec2 uv) {
          vec2 p = uv * 2.0 - 1.0;
          float d = 0.0;
          for(float i=0.0; i<5.0; i++) {
              vec2 pos = 0.5 * vec2(sin(u_time*0.7+i*1.2), cos(u_time*0.5+i*0.8));
              d += 0.08 / length(p - pos);
          }
          float m = smoothstep(0.48, 0.5, d);
          return mix(u_bgColor, u_lineColor, m * 0.45);
      }

      // 2. Fractal Terrain
      float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
                     mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for(int i=0; i<5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
          return v;
      }
      vec3 renderPanel2(vec2 uv) {
          vec2 p = uv * 10.0 + u_time * 0.2;
          float h = fbm(p);
          float grid = abs(fract(h * 10.0) - 0.5) / fwidth(h * 10.0);
          return mix(u_bgColor, u_lineColor, (1.0 - smoothstep(0.0, 1.0, grid)) * 0.35);
      }

      // 3. Particle Flow
      vec3 renderPanel3(vec2 uv) {
          vec2 p = uv * 6.0;
          vec3 col = u_bgColor;
          for(float i=0.0; i<15.0; i++) {
              float t = u_time * 0.5 + i * 0.5;
              vec2 pos = vec2(fract(i * 0.23) * 6.0, mod(t, 6.0));
              pos.x += sin(pos.y + u_time) * 0.5;
              float d = length(p - pos);
              col = mix(col, u_lineColor, smoothstep(0.08, 0.07, d) * 0.4);
          }
          return col;
      }

      // 4. Liquid Simulation (Refraction/Waves)
      vec3 renderPanel4(vec2 uv) {
          vec2 p = uv * 10.0;
          float d = sin(p.x * 0.5 + u_time) + sin(p.y * 0.5 + u_time * 0.8);
          vec2 dist = vec2(sin(d + u_time), cos(d + u_time)) * 0.1;
          float lines = sin((uv.x + dist.x) * 40.0) * sin((uv.y + dist.y) * 40.0);
          return mix(u_bgColor, u_lineColor, smoothstep(0.1, 0.0, abs(lines)) * 0.35);
      }

      // 5. Magnetic Field Lines
      vec3 renderPanel5(vec2 uv) {
          vec2 p = uv * 2.0 - 1.0;
          vec2 m1 = vec2(sin(u_time), cos(u_time)) * 0.5;
          vec2 m2 = -m1;
          vec2 v1 = p - m1; vec2 v2 = p - m2;
          float field = length(v1)/dot(v1,v1) - length(v2)/dot(v2,v2);
          float grid = abs(fract(field * 5.0) - 0.5) / fwidth(field * 5.0);
          return mix(u_bgColor, u_lineColor, (1.0 - smoothstep(0.0, 1.2, grid)) * 0.35);
      }

      // 6. Crystal Growth
      vec3 renderPanel6(vec2 uv) {
          vec2 p = (uv - 0.5) * 2.0;
          float a = atan(p.y, p.x);
          float r = length(p);
          float shape = abs(sin(a * 3.0 + u_time * 0.2)) * 0.5 + 0.2;
          float crystal = smoothstep(shape, shape - 0.02, r);
          float facets = abs(fract(r * 15.0 - u_time) - 0.5) / fwidth(r * 15.0);
          vec3 col = mix(u_bgColor, u_lineColor, crystal * 0.15);
          col = mix(col, u_lineColor, (1.0 - smoothstep(0.0, 1.0, facets)) * crystal * 0.35);
          return col;
      }

      void main() {
          vec3 col;
          
          if (u_panel == 0) {
              vec2 grid = floor(vUv * vec2(3.0, 2.0));
              vec2 localUV = fract(vUv * vec2(3.0, 2.0));
              
              int index = int(grid.x + grid.y * 3.0);
              if(index == 0) col = renderPanel1(localUV);
              else if(index == 1) col = renderPanel2(localUV);
              else if(index == 2) col = renderPanel3(localUV);
              else if(index == 3) col = renderPanel4(localUV);
              else if(index == 4) col = renderPanel5(localUV);
              else col = renderPanel6(localUV);

              // Grid borders
              vec2 border = smoothstep(0.005, 0.0, localUV) + smoothstep(0.995, 1.0, localUV);
              if(max(border.x, border.y) > 0.5) col = u_lineColor * 0.5; // clear grid lines
          } else {
              if(u_panel == 1) col = renderPanel1(vUv);
              else if(u_panel == 2) col = renderPanel2(vUv);
              else if(u_panel == 3) col = renderPanel3(vUv);
              else if(u_panel == 4) col = renderPanel4(vUv);
              else if(u_panel == 5) col = renderPanel5(vUv);
              else col = renderPanel6(vUv);
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
        lineVec = [0.5, 0.12, 0.0]; // Darker monotone rust instead of white
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
        gl.deleteProgram(program);
      };
    }
  }, [panel, theme]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ opacity, filter: 'blur(60px)' }}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none select-none no-print scale-125 transform-gpu"
    />
  );
}
