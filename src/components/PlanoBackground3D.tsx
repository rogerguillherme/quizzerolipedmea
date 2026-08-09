import { useEffect, useRef } from "react";

/**
 * Fundo decorativo 3D da rota /plano.
 *
 * Duas formas orgânicas grandes, lentas, de baixa opacidade (0.30 e 0.20),
 * deslocadas por ruído simplex no vertex shader, com gradiente navy → dourado.
 * A câmera acompanha o scroll de leve e reage ao mouse com amortecimento.
 *
 * - `three` entra por import dinâmico: não pesa no bundle das outras rotas.
 * - Decorativo: aria-hidden, pointer-events none, fixed atrás do conteúdo.
 * - Mobile: menos subdivisão, pixel ratio menor, antialias desligado.
 * - `prefers-reduced-motion`: praticamente estático (sem animação de ruído).
 */
export function PlanoBackground3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    void (async () => {
      try {
        const THREE = await import("three");
        if (disposed || !containerRef.current) return;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
        camera.position.set(0, 0, 26);

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: !isMobile,
          powerPreference: "low-power",
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5));
        renderer.setSize(width, height, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        container.appendChild(renderer.domElement);

        // --- Shaders: ruído simplex 3D no vértice, gradiente navy → dourado ---
        const vertexShader = /* glsl */ `
          uniform float uTime;
          uniform float uAmp;
          varying float vMix;

          vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
          vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
          vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
          vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

          float snoise(vec3 v){
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
                       i.z + vec4(0.0, i1.z, i2.z, 1.0))
                     + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                     + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ * ns.x + ns.yyyy;
            vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0) * 2.0 + 1.0;
            vec4 s1 = floor(b1) * 2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
          }

          varying vec3 vNormal;
          varying vec3 vView;

          void main() {
            float n = snoise(normal * 0.9 + vec3(uTime * 0.06));
            vec3 displaced = position + normal * n * uAmp;
            vMix = clamp(0.5 + n * 0.5, 0.0, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `;

        // Aditivo: a forma SOMA luz na página. Por isso há realce especular
        // e fresnel puxando para o dourado claro — sem isso o volume some.
        const fragmentShader = /* glsl */ `
          uniform vec3 uNavy;
          uniform vec3 uGold;
          uniform vec3 uGlow;
          uniform float uOpacity;
          uniform float uFade;
          varying float vMix;
          varying vec3 vNormal;
          varying vec3 vView;

          void main() {
            vec3 n = normalize(vNormal);
            vec3 color = mix(uNavy, uGold, smoothstep(0.15, 0.9, vMix));

            float spec = pow(max(dot(n, normalize(vec3(-0.45, 0.75, 0.55))), 0.0), 9.0);
            color += uGlow * spec * 0.9;

            float fresnel = pow(1.0 - max(dot(n, normalize(vView)), 0.0), 2.2);
            color = mix(color, uGlow, fresnel * 0.35);

            gl_FragColor = vec4(color, uOpacity * uFade);
          }
        `;

        const detalhe = isMobile ? 12 : 28;

        function criarForma(raio: number, opacidade: number, amp: number) {
          const geometry = new THREE.SphereGeometry(raio, detalhe * 2, detalhe);
          const material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
              uTime: { value: 0 },
              uAmp: { value: amp },
              uOpacity: { value: opacidade },
              uFade: { value: 0 },
              uNavy: { value: new THREE.Color("#1B4470") },
              uGold: { value: new THREE.Color("#E0A544") },
              uGlow: { value: new THREE.Color("#FFE9B8") },
            },
            vertexShader,
            fragmentShader,
          });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          return { mesh, geometry, material };
        }

        const formaA = criarForma(9.5, isMobile ? 0.07 : 0.10, 1.7);
        formaA.mesh.position.set(-7, 3, 0);
        const formaB = criarForma(7.5, isMobile ? 0.05 : 0.07, 1.3);
        formaB.mesh.position.set(8, -5, -6);

        // --- Interação: scroll suave + mouse amortecido ---
        let scrollAlvo = 0;
        let scrollAtual = 0;
        let mouseX = 0;
        let mouseY = 0;
        let mouseAlvoX = 0;
        let mouseAlvoY = 0;

        const onScroll = () => {
          scrollAlvo = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
        };
        const onMouse = (e: MouseEvent) => {
          mouseAlvoX = (e.clientX / window.innerWidth - 0.5) * 2;
          mouseAlvoY = (e.clientY / window.innerHeight - 0.5) * 2;
        };

        const inicio = performance.now();
        let raf = 0;
        let running = true;

        const tick = () => {
          raf = requestAnimationFrame(tick);
          const t = (performance.now() - inicio) / 1000;

          // Fade-in de 1,4s ao carregar.
          const fade = Math.min(1, t / 1.4);
          formaA.material.uniforms.uFade.value = fade;
          formaB.material.uniforms.uFade.value = fade;

          if (!reduceMotion) {
            formaA.material.uniforms.uTime.value = t;
            formaB.material.uniforms.uTime.value = t * 0.7;
            formaA.mesh.rotation.y = t * 0.03;
            formaB.mesh.rotation.y = -t * 0.02;

            scrollAtual += (scrollAlvo - scrollAtual) * 0.045;
            mouseX += (mouseAlvoX - mouseX) * 0.03;
            mouseY += (mouseAlvoY - mouseY) * 0.03;

            camera.position.x = mouseX * 1.6;
            camera.position.y = -scrollAtual * 8 - mouseY * 1.2;
            camera.lookAt(0, -scrollAtual * 6, 0);
          }

          renderer.render(scene, camera);
        };

        const stop = () => {
          running = false;
          cancelAnimationFrame(raf);
        };
        const start = () => {
          if (running) return;
          running = true;
          raf = requestAnimationFrame(tick);
        };
        const onVisibility = () => (document.hidden ? stop() : start());

        const onResize = () => {
          const w = container.clientWidth || window.innerWidth;
          const h = container.clientHeight || window.innerHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        if (!isMobile) window.addEventListener("mousemove", onMouse, { passive: true });
        window.addEventListener("resize", onResize);
        document.addEventListener("visibilitychange", onVisibility);
        raf = requestAnimationFrame(tick);

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("mousemove", onMouse);
          window.removeEventListener("resize", onResize);
          document.removeEventListener("visibilitychange", onVisibility);
          for (const f of [formaA, formaB]) {
            scene.remove(f.mesh);
            f.geometry.dispose();
            f.material.dispose();
          }
          renderer.dispose();
          renderer.forceContextLoss?.();
          renderer.domElement.parentNode?.removeChild(renderer.domElement);
        };
      } catch {
        // Sem WebGL: a página segue normalmente, só sem o fundo.
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />;
}
