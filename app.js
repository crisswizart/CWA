document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);
    console.log("ScrollTrigger registrado. WebGL + GSAP Listos.");

    // VARIABLES GLOBALES
    let ribbonAnimationId = null; 
    let isRibbonPaused = false;
    let flyingClone = null; 
    let lastActiveCard = null;
    let isWebGLRunning = false;
    let startWebGLFn = null;
    
    // 1. CONFIGURACIÓN INICIAL DEL PRELOAD (El WebGL inicia masivo)
    const webglParams = { scale: 15, whiteOut: 1 };
    
    gsap.set(".logo-negro", { opacity: 1 });
    gsap.set(".logo-blanco", { opacity: 0 });
    
    // Bloqueamos el scroll mientras ocurre la animación de entrada
    document.body.style.overflow = 'hidden';

    // CORRECCIÓN 1 (El Flash): Desvanecemos el HTML suavemente para darle tiempo al WebGL de cargar su propio color blanco.
    gsap.to("#intro-overlay", { 
        opacity: 0, 
        duration: 0.2, 
        ease: "power2.inOut",
        onComplete: () => gsap.set("#intro-overlay", { display: "none" }) 
    });

    // 2. ANIMACIÓN DE ENTRADA (Espera 1.5s antes de iniciar la contracción)
    const introTl = gsap.timeline({ 
        delay: 0.2, 
        defaults: { ease: "power3.inOut", duration: 2.5 },
        onComplete: () => {
            // CORRECCIÓN 2 (El Scroll): Liberamos la pantalla y HASTA ENTONCES encendemos el ScrollTrigger
            document.body.style.overflow = ''; 
            iniciarScrollAnimaciones();
        }
    });

    introTl.to(webglParams, { scale: 1, whiteOut: 0 }, 0)
           .to(".logo-negro", { opacity: 0 }, 0)
           .to(".logo-blanco", { opacity: 1 }, 0);

    // ==========================================
    // 3. PREPARAMOS TARJETAS (Ocultas abajo)
    // ==========================================
    const cards = gsap.utils.toArray('.card');
    const angles = [-1.5, 1, -2, 1.5, -1, 2];

    gsap.set(cards, {
        y: (i) => i * 30, scale: (i) => 1 - (i * 0.05),
        zIndex: (i) => cards.length - i, rotation: (i) => angles[i % angles.length] 
    });
    gsap.set(".cards-wrapper", { y: window.innerHeight * 1.5 });
    if (document.querySelector(".minimal-footer")) gsap.set(".minimal-footer", { autoAlpha: 0 });

    // ==========================================
    // 4. INICIALIZADOR DIFERIDO DEL SCROLL (Se dispara tras el preload)
    // ==========================================
    function iniciarScrollAnimaciones() {
        let mm = gsap.matchMedia();

        mm.add({
            desktop: "(min-width: 769px)", mobile: "(max-width: 768px)"
        }, (context) => {
            let { mobile } = context.conditions;

            const masterTl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#master-pin",
                    start: "top top", end: "+=5000", 
                    scrub: 1, pin: true, anticipatePin: 1,
                    onUpdate: () => {
                        if (startWebGLFn) startWebGLFn();
                    }
                }
            });

            // Ahora usamos ".to" simple porque GSAP leyó las medidas correctas
            masterTl.to(webglParams, { scale: 15, whiteOut: 1, ease: "none", duration: 1 }, 0)
                    .to("#logo-container", { top: mobile ? "60px" : "80px", width: mobile ? "60px" : "90px", ease: "power1.inOut", duration: 1 }, 0)
                    .fromTo(".logo-negro", { opacity: 0 }, { opacity: 1, duration: 1 }, 0) 
                    .fromTo(".logo-blanco", { opacity: 1 }, { opacity: 0, duration: 1 }, 0)  
                    
                    .to(".cards-wrapper", { y: 0, duration: 1, ease: "power3.out" }, 0)
                    .to(".bg-title-container", { opacity: 1, duration: 0.5, ease: "power2.inOut" }, 0);

            masterTl.to("#hero", { autoAlpha: 0, duration: 0.2 }, 1);

            cards.forEach((card, index) => {
                let startTime = 1.3 + index;
                masterTl.to(card, {
                    y: -window.innerHeight, opacity: 0, rotation: angles[index % angles.length] * 1.5,
                    duration: 1, ease: "power2.inOut"
                }, startTime);
                masterTl.to("#bg-title-track", {
                    y: `-${(index + 1) * 20}vh`, duration: 1, ease: "power2.inOut"
                }, startTime);
                masterTl.to(cards.slice(index + 1), {
                    y: "-=30", scale: "+=0.05", duration: 1, ease: "power2.inOut"
                }, startTime);
            });

            if (document.querySelector(".minimal-footer")) {
                masterTl.to(".minimal-footer", { autoAlpha: 1, duration: 1, ease: "power2.out" }, 1.3 + cards.length - 0.5);
            }
        });
    }

   // ==========================================
    // 5. BOTÓN CERRAR PROYECTO
    // ==========================================
    const closeCardBtn = document.getElementById('close-card-btn');
    closeCardBtn.addEventListener('click', closeActiveCard);

    // ==========================================
    // 6. EXPANSIÓN DE TARJETAS
    // ==========================================
    const projectModal = document.getElementById('project-modal');
    const projectContent = document.getElementById('project-content');

    document.querySelectorAll('.card a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.getAttribute('data-galeria');
            const data = basesDeDatosGalerias[cat];
            const cardImg = link.querySelector('img');
            if(!data) return; 
            
            lastActiveCard = link.closest('.card');
            let html = '';

            if(data.tipo === 'layout-a') {
                html = `
                <div class="layout-b-block">
                    <div class="layout-b-hero">
                        <img src="img/web1.jpg" />
                        <a href="https://www.puntoestadodemexico.com" target="_blank" class="center-btn">Visitar Proyecto</a>
                    </div>
                    <div class="layout-b-text-split" style="color:#e0e0e0;">
                        <div class="col-70"><p>Noticiario con integración de base de datos externa (supabase) trabajando en tiempo real (escritura y lectura)</p></div>
                        <div class="col-30"><h4>Cliente</h4><p>Memo Romero - Punto Estado De México</p></div>
                    </div>
                    <div class="layout-b-hero">
                        <img src="img/web2.jpg" />
                        <a href="https://mvertti.com.mx" target="_blank" class="center-btn">Visitar Proyecto</a>
                    </div>
                    <div class="layout-b-text-split" style="color:#e0e0e0;">
                        <div class="col-70"><p>Enfoque directo e inmersivo.</p></div>
                        <div class="col-30"><h4>Cliente</h4><p>Montserrat Vertti - MVERTTI</p></div>
                    </div>
                    <div class="layout-b-hero">
                        <img src="img/web3.jpg" />
                        <a href="https://4wardcorp.github.io/4wardcorp/" target="_blank" class="center-btn">Visitar Proyecto</a>
                    </div>
                    <div class="layout-b-text-split" style="color:#e0e0e0;">
                        <div class="col-70"><p>Enfoque directo e inmersivo.</p></div>
                        <div class="col-30"><h4>Cliente</h4><p>Estudios Creativos</p></div>
                    </div>
                </div>`;
                
            } else if(data.tipo === 'layout-b') {
                html = `
                <div class="layout-a">
                    <picture>
                        <source media="(max-width: 768px)" srcset="img/FotoCelular-Banner.jpg">
                        <img class="hero-rounded" src="${data.imgFondo}" />
                    </picture>
                    <p style="color:#e0e0e0;">Aquí va el primer párrafo. Habla sobre el cliente o el concepto inicial.</p>
                    <div class="grid-2-horizontal">
                        <picture><source media="(max-width: 768px)" srcset="img/FotoCelular-1.jpg"><img src="img/Foto2.jpg"></picture>
                        <picture><source media="(max-width: 768px)" srcset="img/FotoCelular-2.jpg"><img src="img/Foto3.jpg"></picture>
                    </div>
                    <p style="color:#e0e0e0;">Aquí explico el proceso que se ve en las fotos de arriba.</p>
                    <div class="grid-3-horizontal">
                        <picture><source media="(max-width: 768px)" srcset="img/FotoCelular-3.jpg"><img src="img/Foto1.jpg"></picture>
                        <picture><source media="(max-width: 768px)" srcset="img/FotoCelular-4.jpg"><img src="img/Foto2.jpg"></picture>
                        <picture><source media="(max-width: 768px)" srcset="img/FotoCelular-5.jpg"><img src="img/Foto4.jpg"></picture>
                    </div>
                </div>`;
            } else if(data.tipo === 'layout-c') {
                html = `
                <div class="layout-c-ribbon">
                    <div class="layout-c-bg-title">
                        <span>${data.titulo}</span>
                    </div>
                    <div id="ribbon-overlay" style="position: absolute; inset: 0; background-color: #2e3842; opacity: 0; pointer-events: none; z-index: 9000;"></div>
                    <div id="ribbon-container-layout-c"></div>
                </div>`;
            }

            projectContent.innerHTML = html;
            gsap.set(projectContent, { autoAlpha: 0 });

            closeCardBtn.classList.add('visible');

            const currentRotation = gsap.getProperty(lastActiveCard, "rotation");
            gsap.set(lastActiveCard, { rotation: 0 });
            const rect = cardImg.getBoundingClientRect();
            gsap.set(lastActiveCard, { rotation: currentRotation });

            flyingClone = document.createElement('div');
            flyingClone.style.backgroundColor = '#2e3842'; 
            flyingClone.style.position = 'fixed';
            flyingClone.style.top = rect.top + 'px';
            flyingClone.style.left = rect.left + 'px';
            flyingClone.style.width = rect.width + 'px';
            flyingClone.style.height = rect.height + 'px';
            flyingClone.style.borderRadius = '20px';
            flyingClone.style.zIndex = '9000'; 
            flyingClone.style.pointerEvents = 'none';
            flyingClone.style.overflow = 'hidden'; 
            
            let cloneImg = document.createElement('img');
            cloneImg.src = cardImg.src;
            cloneImg.style.width = '100%';
            cloneImg.style.height = '100%';
            cloneImg.style.objectFit = 'cover';
            
            flyingClone.appendChild(cloneImg);
            document.body.appendChild(flyingClone);
            
            gsap.set(flyingClone, { rotation: currentRotation, transformOrigin: "center center" });
            gsap.set(lastActiveCard, { opacity: 0 });

            projectModal.style.transition = 'none';
            projectModal.style.backgroundColor = 'transparent';
            projectModal.classList.add('active');
            gsap.set(projectModal, { opacity: 1 });
            document.body.style.overflow = 'hidden'; 

            gsap.to(flyingClone, {
                top: 0, left: 0, width: '100vw', height: '100vh', 
                borderRadius: '0px', rotation: 0, duration: 0.8, ease: "power3.inOut",
                onComplete: () => {
                    projectModal.style.backgroundColor = '#2e3842'; 
                    flyingClone.style.opacity = 0; 
                    gsap.to(projectContent, { autoAlpha: 1, duration: 0.4 });
                    
                    if(data.tipo === 'layout-c') {
                        const ribbonContainer = document.getElementById('ribbon-container-layout-c');
                        const layoutC = document.querySelector('.layout-c-ribbon');

                        const proyectosData = [
                            { imagen: "img/a1.jpg" },
                            { imagen: "img/a2.jpg" },
                            { imagen: "img/a3.jpg" },
                            { imagen: "img/a4.jpg" },
                            { imagen: "img/a5.jpg" },
                            { imagen: "img/a6.jpg" },
                            { imagen: "img/a7.jpg" },
                            { imagen: "img/a8.jpg" },
                            { imagen: "img/a9.jpg" },
                            { imagen: "img/a10.jpg" },
                            { imagen: "img/a11.jpg" },
                            { imagen: "img/a12.jpg" },
                            { imagen: "img/a13.jpg" },
                            { imagen: "img/a14.jpg" },
                            { imagen: "img/a15.jpg" },
                            { imagen: "img/a16.jpg" },
                            { imagen: "img/a17.jpg" },
                            { imagen: "img/a18.jpg" },
                            { imagen: "img/a19.jpg" },
                            { imagen: "img/a20.jpg" },
                            { imagen: "img/a21.jpg" },
                            { imagen: "img/a22.jpg" }
                        ];

                        const ribbonItems = [];
                        const isMobile = window.innerWidth <= 768;
                        const angleSpacing = isMobile ? 12 : 9; 
                        const totalCardsNeeded = Math.ceil(360 / angleSpacing); 

                        // --- SCROLL TÁCTIL (nuevo): estado del arrastre con el dedo ---
const pxToDeg = 180 / (Math.PI * (isMobile ? 2000 : 5000)); // píxeles del dedo -> grados de la cinta (1:1)
let touchActive = false;
let touchMoved = false;   // true si el dedo se arrastró (evita abrir una foto por accidente)
let touchTotal = 0;
let touchLastX = 0, touchLastY = 0, touchLastT = 0;
let touchVelocity = 0;    // inercia al soltar (grados por frame)

                        for(let i = 0; i < totalCardsNeeded; i++) {
                            let dataIndex = i % proyectosData.length; 
                            let proyecto = proyectosData[dataIndex];
                            
                            let rItem = document.createElement('div');
                            rItem.className = 'ribbon-item';
                            rItem.innerHTML = `<img src="${proyecto.imagen}" alt="Proyecto" loading="lazy" decoding="async">`;
                            ribbonContainer.appendChild(rItem);
                            
                            rItem.expanded = false; 

                            rItem.addEventListener('click', function() {
                                if (isRibbonPaused && !this.expanded) return;

                                if (touchMoved) return; // venía de arrastrar con el dedo, no es un toque

                                const imgEl = this.querySelector('img');

                                if (!this.expanded) {
                                    this.expanded = true;
                                    isRibbonPaused = true;
                                    cancelAnimationFrame(ribbonAnimationId); 

                                    this._origWidth = this.offsetWidth;
                                    this._origHeight = this.offsetHeight;
                                    this.style.zIndex = 9999;
                                    
                                    this.style.width = this._origWidth + 'px';
                                    this.style.height = this._origHeight + 'px';
                                    this.classList.add('is-expanded');

                                    gsap.to("#ribbon-overlay", { opacity: 1, duration: 0.8, ease: "power3.inOut" });

                                    const natW = imgEl.naturalWidth || window.innerWidth;
                                    const natH = imgEl.naturalHeight || window.innerHeight;
                                    const screenW = window.innerWidth;
                                    const screenH = window.innerHeight;
                                    
                                    const scaleFit = Math.min(screenW / natW, screenH / natH);
                                    const targetW = natW * scaleFit;
                                    const targetH = natH * scaleFit;

                                    gsap.to(this, {
                                        x: window.innerWidth / 2, 
                                        y: window.innerHeight / 2, 
                                        rotation: "0_short", 
                                        width: targetW, 
                                        height: targetH, 
                                        borderRadius: 0,
                                        duration: 0.8, ease: "power3.inOut"
                                    });
                                    
                                    gsap.to(imgEl, { borderRadius: 0, duration: 0.8, ease: "power3.inOut" });

                                } else {
                                    this.expanded = false;
                                    gsap.to("#ribbon-overlay", { opacity: 0, duration: 0.8, ease: "power3.inOut" });

                                    gsap.to(this, {
                                        x: this._ribbonX, 
                                        y: this._ribbonY, 
                                        rotation: this._ribbonRot + "_short", 
                                        width: this._origWidth, 
                                        height: this._origHeight, 
                                        borderRadius: 12,
                                        duration: 0.8, ease: "power3.inOut",
                                        onComplete: () => {
                                            this.style.zIndex = "";
                                            isRibbonPaused = false;
                                            this.classList.remove('is-expanded');
                                            this.style.width = ''; 
                                            this.style.height = '';
                                            renderRibbon();
                                        }
                                    });
                                    
                                    gsap.to(imgEl, { borderRadius: 12, scale: 1, duration: 0.8, ease: "power3.inOut" });
                                }
                            });

                            ribbonItems.push({ element: rItem, index: i });
                        }

                        let scrollOffset = 0;
                        let targetScroll = 0;

                        layoutC.addEventListener('wheel', (e) => {
                            if(!isRibbonPaused) targetScroll += (e.deltaY + e.deltaX) * 0.05; 
                        });

                        // --- SCROLL TÁCTIL (nuevo): arrastrar la cinta con el dedo ---
// Usa la misma variable targetScroll que la rueda del mouse: mismo suavizado, mismo giro.
layoutC.addEventListener('touchstart', (e) => {
    if (isRibbonPaused || e.touches.length !== 1) return;
    touchActive = true;
    touchMoved = false;
    touchTotal = 0;
    touchVelocity = 0;
    touchLastX = e.touches[0].clientX;
    touchLastY = e.touches[0].clientY;
    touchLastT = e.timeStamp;
}, { passive: true });

layoutC.addEventListener('touchmove', (e) => {
    if (!touchActive || isRibbonPaused || e.touches.length !== 1) return;
    if (e.cancelable) e.preventDefault(); // que el navegador no lo tome como scroll/rebote

    const t = e.touches[0];
    const dx = t.clientX - touchLastX;
    const dy = t.clientY - touchLastY;
    touchLastX = t.clientX;
    touchLastY = t.clientY;

    // Más de 8px recorridos = arrastre (no un toque)
    touchTotal += Math.abs(dx) + Math.abs(dy);
    if (touchTotal > 8) touchMoved = true;

    // Móvil: la cinta es vertical -> manda Y. Tablet/escritorio: horizontal -> manda el eje con más movimiento.
    const delta = isMobile ? dy : (Math.abs(dx) > Math.abs(dy) ? dx : dy);
    const deg = -delta * pxToDeg; // dedo arriba/izquierda = la cinta avanza (igual que la rueda hacia abajo)
    targetScroll += deg;

    // Velocidad (grados por frame) para la inercia al soltar
    const dt = Math.max(e.timeStamp - touchLastT, 1);
    touchLastT = e.timeStamp;
    const v = Math.max(-2, Math.min(2, deg / dt * 16.67));
    touchVelocity = touchVelocity * 0.6 + v * 0.4;
}, { passive: false });

const endTouch = (e) => {
    if (!touchActive) return;
    touchActive = false;
    if (e.timeStamp - touchLastT > 80) touchVelocity = 0; // se detuvo antes de soltar: sin inercia
    setTimeout(() => { touchMoved = false; }, 350);
};
layoutC.addEventListener('touchend', endTouch);
layoutC.addEventListener('touchcancel', endTouch);

                        function renderRibbon() {
                            if (isRibbonPaused) return; 

                            targetScroll += 0.03; 
                            // inercia después de soltar el dedo (se apaga sola)
if (!touchActive && Math.abs(touchVelocity) > 0.002) {
    targetScroll += touchVelocity;
    touchVelocity *= 0.95;
}
                            scrollOffset += (targetScroll - scrollOffset) * 0.08;

                            const screenW = window.innerWidth;
                            const screenH = window.innerHeight;
                            const R = isMobile ? 2000 : 5000; 

                            ribbonItems.forEach((card) => {
                                let rawAngle = (card.index * angleSpacing) - scrollOffset; 
                                let angleDeg = rawAngle % 360;
                                if (angleDeg < 0) angleDeg += 360;
                                let angleRad = angleDeg * (Math.PI / 180);
                                let x, y, rotation;

                                if (!isMobile) {
                                    const circleCx = screenW / 2;
                                    const circleCy = screenH + R - 550; 
                                    x = circleCx + R * Math.sin(angleRad);
                                    y = circleCy - R * Math.cos(angleRad);
                                    rotation = angleDeg; 
                                } else {
                                    const circleCx = (screenW / 2) - R; 
                                    const circleCy = screenH / 2; 
                                    x = circleCx + R * Math.cos(angleRad);
                                    y = circleCy + R * Math.sin(angleRad);
                                    rotation = angleDeg; 
                                }

                                card.element._ribbonX = x;
                             card.element._ribbonY = y;
                             card.element._ribbonRot = rotation;

                             const margin = isMobile ? screenW * 0.7 : 450;
                             const isVisible = (
                                 x > -margin && x < screenW + margin &&
                                 y > -margin && y < screenH + margin
                             );

                             if (!isVisible && !card.element.expanded) {
                                 if (card.element.style.visibility !== 'hidden') {
                                     card.element.style.visibility = 'hidden';
                                 }
                                 return;
                             }

                             if (card.element.style.visibility === 'hidden') {
                                 card.element.style.visibility = 'visible';
                             }

                             gsap.set(card.element, {
                                 x: x, y: y, xPercent: -50, yPercent: -50, rotation: rotation
                             });
                            });
                            ribbonAnimationId = requestAnimationFrame(renderRibbon);
                        }
                        renderRibbon();
                    }
                }
            });
            gsap.to(cloneImg, { opacity: 0, duration: 0.3, ease: "power2.out" });
        });
    });

    function closeActiveCard() {
        if (!lastActiveCard) return;

        if(ribbonAnimationId) {
            cancelAnimationFrame(ribbonAnimationId);
            ribbonAnimationId = null;
        }
        isRibbonPaused = false;

        closeCardBtn.classList.remove('visible'); 

        const cardImg = lastActiveCard.querySelector('img');
        gsap.to(projectContent, { autoAlpha: 0, duration: 0.2 });

        projectModal.style.backgroundColor = 'transparent';
        flyingClone.style.opacity = 1;
        let cloneImg = flyingClone.querySelector('img');
        
        const currentRotation = gsap.getProperty(lastActiveCard, "rotation");
        gsap.set(lastActiveCard, { rotation: 0 });
        const rect = cardImg.getBoundingClientRect();
        gsap.set(lastActiveCard, { rotation: currentRotation });

        gsap.to(flyingClone, {
            top: rect.top, left: rect.left, width: rect.width, height: rect.height,
            borderRadius: '20px', rotation: currentRotation, duration: 0.7, ease: "power3.inOut",
            onComplete: () => {
                projectModal.classList.remove('active');
                projectModal.scrollTo({ top: 0, behavior: 'instant' }); 
                projectModal.style.transition = ''; 
                projectModal.style.backgroundColor = '';

                gsap.set(lastActiveCard, { opacity: 1 });
                flyingClone.remove();
                flyingClone = null;
                document.body.style.overflow = ''; 
                projectContent.querySelectorAll('img').forEach(img => {
                    img.removeAttribute('src');
                    img.src = '';
                });
                projectContent.innerHTML = '';
                lastActiveCard = null; 
            }
        });

        gsap.to(cloneImg, { opacity: 1, duration: 0.4, delay: 0.2, ease: "power2.in" });
    }

    // ==========================================
   // 6. MOTOR WEBGL: LENTE ANAMÓRFICO INTERACTIVO
   // ==========================================
   const canvas = document.getElementById("lens-canvas");
   if(canvas) {
       const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
      
       const setCanvasSize = () => {
           canvas.width = window.innerWidth;
           canvas.height = window.innerHeight;
       };
       setCanvasSize();

       const vsSource = `
         attribute vec2 position;
         void main() { gl_Position = vec4(position, 0.0, 1.0); }
       `;
       const fsSource = document.getElementById("fragShader").textContent;

       const createShader = (type, source) => {
           const shader = gl.createShader(type);
           gl.shaderSource(shader, source);
           gl.compileShader(shader);
           return shader;
       };

       const vs = createShader(gl.VERTEX_SHADER, vsSource);
       const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
       const program = gl.createProgram();

       gl.attachShader(program, vs);
       gl.attachShader(program, fs);
       gl.linkProgram(program);
       gl.useProgram(program);

       const buffer = gl.createBuffer();
       gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

       const position = gl.getAttribLocation(program, "position");
       gl.enableVertexAttribArray(position);
       gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

       const uniforms = {
           resolution: gl.getUniformLocation(program, "iResolution"),
           time: gl.getUniformLocation(program, "iTime"),
           uScale: gl.getUniformLocation(program, "uScale"),
           uWhiteOut: gl.getUniformLocation(program, "uWhiteOut"),
           tex0: gl.getUniformLocation(program, "tex0"),
           tex1: gl.getUniformLocation(program, "tex1"),
           tex2: gl.getUniformLocation(program, "tex2"),
       };

       const setupTexture = (img, index) => {
           const texture = gl.createTexture();
           gl.activeTexture(gl.TEXTURE0 + index);
           gl.bindTexture(gl.TEXTURE_2D, texture);
           gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
           return texture;
       };

       const initTextures = () => {
           setupTexture(document.getElementById("webgl-tex0"), 0);
           setupTexture(document.getElementById("webgl-tex1"), 1);
           setupTexture(document.getElementById("webgl-tex2"), 2);
       };

       window.addEventListener('load', initTextures);

       const startTime = performance.now();
       const slides = document.querySelectorAll('.slide');
       const heroEl = document.getElementById('hero');

       function getOpacityJs(time, delay) {
           let localTime = ((time - delay) % 15.0 + 15.0) % 15.0;
           if (localTime < 2.25) return localTime / 2.25;
           if (localTime < 4.95) return 1.0;
           if (localTime < 7.20) return 1.0 - (localTime - 4.95) / 2.25;
           return 0.0;
       }

       const render = () => {
           // Si el Hero ya se ocultó al bajar a las tarjetas, detenemos el bucle WebGL (0% GPU)
           if (heroEl && heroEl.style.visibility === 'hidden') {
               isWebGLRunning = false;
               return;
           }

           const currentTime = (performance.now() - startTime) / 1000;

           if (slides.length >= 3) {
               slides[0].style.opacity = getOpacityJs(currentTime, 0.0);
               slides[1].style.opacity = getOpacityJs(currentTime, 5.0);
               slides[2].style.opacity = getOpacityJs(currentTime, 10.0);
           }

           gl.viewport(0, 0, canvas.width, canvas.height);
           gl.clearColor(0.0, 0.0, 0.0, 0.0);
           gl.clear(gl.COLOR_BUFFER_BIT);

           gl.uniform3f(uniforms.resolution, canvas.width, canvas.height, 1.0);
           gl.uniform1f(uniforms.time, currentTime);
           gl.uniform1f(uniforms.uScale, webglParams.scale);
           gl.uniform1f(uniforms.uWhiteOut, webglParams.whiteOut);

           gl.uniform1i(uniforms.tex0, 0);
           gl.uniform1i(uniforms.tex1, 1);
           gl.uniform1i(uniforms.tex2, 2);

           gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
           requestAnimationFrame(render);
       };

       startWebGLFn = () => {
           if (!isWebGLRunning && (!heroEl || heroEl.style.visibility !== 'hidden')) {
               isWebGLRunning = true;
               requestAnimationFrame(render);
           }
       };

       window.addEventListener("resize", setCanvasSize);
       startWebGLFn();
   }

});