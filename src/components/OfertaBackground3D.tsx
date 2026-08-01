import { useEffect, useRef } from "react";

/**
 * Fundo decorativo 3D (Three.js) para a rota /oferta.
 *
 * Decisões de projeto:
 * - `three` é carregado via import dinâmico dentro do efeito, logo não entra
 *   no bundle inicial nem afeta outras rotas.
 * - Puramente decorativo: `aria-hidden`, `pointer-events: none`, z-index baixo.
 * - Respeita `prefers-reduced-motion`: nesse caso nada é renderizado.
 * - Pausa o loop quando a aba fica oculta (`visibilitychange`).
 * - Faz dispose completo de geometria/material/renderer no unmount.
 */
export function OfertaBackground3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Acessibilidade/performance: usuário pediu menos movimento -> não renderiza.
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      try {
        const THREE = await import("three");
        if (disposed || !containerRef.current) return;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        camera.position.z = 14;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
        });
        renderer.setClearColor(0x000000, 0);
        // Limita o DPR: mobile-first, evita custo desnecessário em telas retina.
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(width, height, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        container.appendChild(renderer.domElement);

        // ~44 partículas: suficiente para a sensação de "poeira de luz",
        // barato o bastante para celulares modestos.
        const COUNT = 44;
        const positions = new Float32Array(COUNT * 3);
        const drift = new Float32Array(COUNT * 3);

        for (let i = 0; i < COUNT; i++) {
          positions[i * 3 + 0] = (Math.random() - 0.5) * 26;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
          // Deriva bem lenta, predominantemente vertical.
          drift[i * 3 + 0] = (Math.random() - 0.5) * 0.012;
          drift[i * 3 + 1] = 0.006 + Math.random() * 0.012;
          drift[i * 3 + 2] = (Math.random() - 0.5) * 0.006;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        // Shader próprio: PointsMaterial desenharia quadrados duros.
        // Aqui o alpha cai radialmente a partir do centro do ponto,
        // resultando em orbes difusos tipo "poeira de luz".
        const material = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: {
            uColor: { value: new THREE.Color("hsl(38, 55%, 42%)") },
            uOpacity: { value: 0.28 },
            uSize: { value: 90 * Math.min(window.devicePixelRatio || 1, 1.5) },
          },
          vertexShader: `
            uniform float uSize;
            void main() {
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = uSize / -mv.z;
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              float a = smoothstep(0.5, 0.0, d);
              gl_FragColor = vec4(uColor, a * a * uOpacity);
            }
          `,
        });



        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const posAttr = geometry.getAttribute("position") as InstanceType<
          typeof THREE.BufferAttribute
        >;

        let raf = 0;
        let running = true;

        const tick = () => {
          raf = requestAnimationFrame(tick);
          const arr = posAttr.array as Float32Array;
          for (let i = 0; i < COUNT; i++) {
            arr[i * 3 + 0] += drift[i * 3 + 0]!;
            arr[i * 3 + 1] += drift[i * 3 + 1]!;
            arr[i * 3 + 2] += drift[i * 3 + 2]!;
            // Reciclagem quando sai do topo do frustum visível.
            if (arr[i * 3 + 1]! > 9) {
              arr[i * 3 + 1] = -9;
              arr[i * 3 + 0] = (Math.random() - 0.5) * 26;
            }
          }
          posAttr.needsUpdate = true;
          renderer.render(scene, camera);
        };

        const start = () => {
          if (running) return;
          running = true;
          raf = requestAnimationFrame(tick);
        };
        const stop = () => {
          running = false;
          cancelAnimationFrame(raf);
        };

        const onVisibility = () => {
          if (document.hidden) stop();
          else start();
        };

        const onResize = () => {
          const w = container.clientWidth || window.innerWidth;
          const h = container.clientHeight || window.innerHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        };

        window.addEventListener("resize", onResize);
        document.addEventListener("visibilitychange", onVisibility);
        raf = requestAnimationFrame(tick);

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("resize", onResize);
          document.removeEventListener("visibilitychange", onVisibility);
          scene.remove(points);
          geometry.dispose();
          material.dispose();
          spriteTexture.dispose();

          renderer.dispose();
          renderer.forceContextLoss?.();
          if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        };
      } catch {
        // Falha ao carregar/inicializar WebGL: a página segue normal sem o efeito.
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-90"
    />
  );
}
