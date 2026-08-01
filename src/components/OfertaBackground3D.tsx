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

        // ~44 orbes: suficiente para a sensação de "poeira de luz",
        // barato o bastante para celulares modestos.
        const COUNT = 44;

        // Um plano compartilhado com alpha radial no fragment shader.
        // (Points/PointsMaterial renderiza quadrados duros em vários drivers.)
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: {
            uColor: { value: new THREE.Color("hsl(38, 55%, 42%)") },
            uOpacity: { value: 0.26 },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying vec2 vUv;
            void main() {
              float d = length(vUv - vec2(0.5));
              float a = smoothstep(0.5, 0.0, d);
              gl_FragColor = vec4(uColor, a * a * uOpacity);
            }
          `,
        });

        const orbs: Array<{
          mesh: InstanceType<typeof THREE.Mesh>;
          dx: number;
          dy: number;
        }> = [];

        for (let i = 0; i < COUNT; i++) {
          const mesh = new THREE.Mesh(geometry, material);
          const s = 0.8 + Math.random() * 2.2;
          mesh.scale.set(s, s, 1);
          mesh.position.set(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 6,
          );
          scene.add(mesh);
          orbs.push({
            mesh,
            // Deriva bem lenta, predominantemente vertical.
            dx: (Math.random() - 0.5) * 0.008,
            dy: 0.004 + Math.random() * 0.008,
          });
        }

        let raf = 0;
        let running = true;

        const tick = () => {
          raf = requestAnimationFrame(tick);
          for (const o of orbs) {
            o.mesh.position.x += o.dx;
            o.mesh.position.y += o.dy;
            // Reciclagem quando sai do topo da área visível.
            if (o.mesh.position.y > 11) {
              o.mesh.position.y = -11;
              o.mesh.position.x = (Math.random() - 0.5) * 30;
            }
          }
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
