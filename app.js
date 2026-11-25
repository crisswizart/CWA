document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // VARIABLES GLOBALES
    let ribbonAnimationId = null; 
    let isRibbonPaused = false;
    let flyingClone = null; 
    let lastActiveCard = null;
    let isWebGLRunning = false;
    let startWebGLFn = null;
    let isCardOpen = false;
    let activeCollapseRibbonFn = null;

    // CONTROL DEL GESTO "ATRÁS" EN ANDROID / NAVEGADOR
    window.addEventListener('popstate', (e) => {
        const level = e.state ? e.state.modalLevel : null;

        if (level === 'card' && activeCollapseRibbonFn) {
            activeCollapseRibbonFn();
            return;
        }

        if (!level && isCardOpen) {
            closeActiveCard(true);
        }
    });
    
    // 1. CONFIGURACIÓN INICIAL DEL PRELOAD (El WebGL inicia masivo)
    const webglParams = { scale: 15, whiteOut: 1 };
    
    gsap.set(".logo-negro", { opacity: 1 });
    gsap.set(".logo-blanco", { opacity: 0 });
    
    document.body.style.overflow = 'hidden';

    gsap.to("#intro-overlay", { 
        opacity: 0, 
        duration: 0.2, 
        ease: "power2.inOut",
        onComplete: () => gsap.set("#intro-overlay", { display: "none" }) 
    });

    // 2. ANIMACIÓN DE ENTRADA
    const introTl = gsap.timeline({ 
        delay: 0.2, 
        defaults: { ease: "power3.inOut", duration: 2.5 },
        onComplete: () => {
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
    closeCardBtn.addEventListener('click', () => closeActiveCard(false));

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
                        <img src="img/web2.webp" />
                        <a href="https://mvertti.com.mx" target="_blank" class="center-btn">Visitar Proyecto</a>
                    </div>
                    <div class="layout-b-text-split" style="color:#e0e0e0;">
                        <div class="col-70"><p>Enfoque directo e inmersivo.</p></div>
                        <div class="col-30"><h4>Cliente</h4><p>Montserrat Vertti - MVERTTI</p></div>
                    </div>
                    <div class="layout-b-hero">
                        <img src="img/web1.webp" />
                        <a href="https://www.puntoestadodemexico.com" target="_blank" class="center-btn">Visitar Proyecto</a>
                    </div>
                    <div class="layout-b-text-split" style="color:#e0e0e0;">
                        <div class="col-70"><p>Noticiario con integración de base de datos externa (supabase) trabajando en tiempo real (escritura y lectura)</p></div>
                        <div class="col-30"><h4>Cliente</h4><p>Guillermo Romero - Punto Estado De México</p></div>
                    </div>
                    <div class="layout-b-hero">
                        <img src="img/web3.webp" />
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
                    <div class="layout-a-img-box hero-box">
            <picture>
                <source media="(max-width: 768px)" srcset="img/d1.webp">
                <img class="hero-rounded" src="img/d1.webp" />
            </picture>
            <div class="img-overlay-text">Miztica Mezcal</div>
        </div>

        <h2 class="layout-a-title">BRANDING</h2>
        <p>Desarrollo marcas sólidas y coherentes, cuidando cada detalle desde la creación del logotipo hasta su aplicación en entornos reales. Estudio proporciones, márgenes y conceptos para crear una identidad visual funcional, legible y memorable.</p>

        <div class="grid-2-horizontal">
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/d2.webp"><img src="img/d2.webp"></picture>
                <div class="img-overlay-text">Construcción de logotipo basada en retícula y análisis de formas</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/d3.webp"><img src="img/d3.webp"></picture>
                <div class="img-overlay-text">Selección de paleta cromática enfocada al objetivo y giro de la marca</div>
            </div>
        </div>

        <p>Aquí explico el proceso que se ve en las fotos de arriba.</p>

        <div class="grid-3-horizontal">
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/d4.webp"><img src="img/d4.webp""></picture>
                <div class="img-overlay-text">Pruebas de color y logotipo en simulaciones reales</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/d5.webp"><img src="img/d5.webp""></picture>
                <div class="img-overlay-text">Escalabilidad para diversos formatos y plataformas</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/d6.webp"><img src="img/d6.webp""></picture>
                <div class="img-overlay-text">Tipografía optimizada para comunicación efectiva y coherencia visual</div>
            </div>
        </div>  

         <h2 class="layout-a-title">IMAGEN PERSONAL</h2>
        <p>Ayudo a emprendedores y profesionales a proyectar una imagen coherente, cuidada y que comunique confianza desde el primer contacto. Aquí, una muestra de tarjetas diseñadas para una fotógrafa, pensadas para abrir nuevas oportunidades y reforzar su presencia profesional.</p>


        <div class="layout-a-img-box hero-box">
            <picture>
                <source media="(max-width: 768px)" srcset="img/d7.webp">
                <img class="hero-rounded" src="img/d7.webp" />
            </picture>
            <div class="img-overlay-text">Fotógrafa Miroslava Tellez</div>
        </div>

        <div class="grid-2-horizontal">
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/d8.webp"><img src="img/d8.webp"></picture>
                <div class="img-overlay-text">El objetivo fue transmitir profesionalismo y creatividad en una sola pieza. La parte frontal simula el lente de una cámara, reforzando el giro visual de la marca personal</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/d9.webp"><img src="img/d9.webp"></picture>
                <div class="img-overlay-text">Mientras que la parte trasera optimiza el contacto inmediato con un código QR y tipografía legible</div>
            </div>
        </div>

        <h2 class="layout-a-title">REDISEÑO DE MARCA</h2>
        <p>Cuando una marca necesita evolucionar, el rediseño debe ser estratégico. Reinterpreto identidades manteniendo su esencia, pero dándoles frescura, actualidad y mayor conexión con su público.</p>


        <div class="layout-a-img-box hero-box">
            <picture>
                <source media="(max-width: 768px)" srcset="img/d10.webp">
                <img class="hero-rounded" src="img/d10.webp" />
            </picture>
            <div class="img-overlay-text">Real State Plus</div>
        </div>

        <div class="grid-2-horizontal">
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/d11.webp"><img src="img/d11.webp"></picture>
                <div class="img-overlay-text">• Diagnóstico y análisis de la marca existente, rediseño del logotipo y elementos clave</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/d12.webp"><img src="img/d12.webp"></picture>
                <div class="img-overlay-text">• Creación de nuevos materiales corporativos y comerciales, alineación visual con la visión renovada del proyecto</div>
            </div>
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
                    <p class="ribbon-hint">Desliza hacia los lados o haz scroll para mover la rueda</p>
                </div>`;
            } else if(data.tipo === 'layout-d') {
                html = `
                <div class="layout-a">
                    <div class="layout-a-img-box hero-box">
            <picture>
                <source media="(max-width: 768px)" srcset="img/c1.webp">
                <img class="hero-rounded" src="img/c1.webp" />
            </picture>
            <div class="img-overlay-text">Miztica Mezcal</div>
        </div>

        <h2 class="layout-a-title">Cristopher Escalante</h2>
        <p>Mi nombre es Cristopher. Con más de siete años de trayectoria en diseño gráfico, diseño web y postproducción digital, me dedico a construir identidades visuales, interfaces a medida y piezas de arte conceptual.

Me muevo entre dos vertientes que se retroalimentan: el diseño estructurado —donde el branding y la arquitectura web buscan claridad, rendimiento e impacto— y la exploración artística radical. Esta última cobra forma en mi proyecto de anamorfosis, una línea de investigación visual enfocada en la distorsión perspectiva, el surrealismo y la manipulación fotográfica de alta complejidad.

Creo en la precisión técnica y en la intención detrás de cada píxel. Ya sea al estructurar un sitio web desde cero o al intervenir una imagen, mi objetivo es crear experiencias memorables que conecten desde lo visual y lo sensorial.</p>

        <div class="grid-2-horizontal">
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c2.webp"><img src="img/c2.webp"></picture>
                <div class="img-overlay-text">Construcción de logotipo basada en retícula y análisis de formas</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c3.webp"><img src="img/c3.webp"></picture>
                <div class="img-overlay-text">Selección de paleta cromática enfocada al objetivo y giro de la marca</div>
            </div>
        </div>

        <h2 class="layout-a-title">Programas que uso</h2>

        <div class="grid-3-horizontal">
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c4.webp"><img src="img/c4.webp""></picture>
                <div class="img-overlay-text">Photoshop</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c5.webp"><img src="img/c5.webp""></picture>
                <div class="img-overlay-text">Illustrator</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c6.webp"><img src="img/c6.webp""></picture>
                <div class="img-overlay-text">Ligthroom</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c7.webp"><img src="img/c7.webp""></picture>
                <div class="img-overlay-text">DXO</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c8.webp"><img src="img/c8.webp""></picture>
                <div class="img-overlay-text">Affinity</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c9.webp"><img src="img/c9.webp""></picture>
                <div class="img-overlay-text">Davinci Resolve</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c10.webp"><img src="img/c10.webp""></picture>
                <div class="img-overlay-text">Visual Studio Code</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c11.webp"><img src="img/c11.webp""></picture>
                <div class="img-overlay-text">Figma</div>
            </div>
            <div class="layout-a-img-box">
                <picture><source media="(max-width: 768px)" srcset="img/c12.webp"><img src="img/c12.webp""></picture>
                <div class="img-overlay-text">Blender</div>
            </div>
        </div>  
                </div>`;
            }

            projectContent.innerHTML = html;
            gsap.set(projectContent, { autoAlpha: 0 });

            closeCardBtn.classList.add('visible');
            isCardOpen = true;
            history.pushState({ modalLevel: 'card' }, '');

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
                        const imagenesLista = data.imagenes || [];
                        const curvaInvertida = Boolean(data.curvaInvertida);
                        initCurvedRibbon(imagenesLista, curvaInvertida);
                    }
                }
            });
            gsap.to(cloneImg, { opacity: 0, duration: 0.3, ease: "power2.out" });
        });
    });

    // ==========================================
    // MOTOR DE CINTA CURVA (SOPORTA CURVA NORMAL E INVERTIDA)
    // ==========================================
    function initCurvedRibbon(imagenesLista, curvaInvertida) {
        if (!imagenesLista.length) return;

        const ribbonContainer = document.getElementById('ribbon-container-layout-c');
        const layoutC = document.querySelector('.layout-c-ribbon');
        if (!ribbonContainer || !layoutC) return;

        const ribbonItems = [];
        const isMobile = window.innerWidth <= 768;
        const angleSpacing = isMobile ? 12 : 9; 
        const totalCardsNeeded = Math.ceil(360 / angleSpacing); 

        let expandedItem = null;

        // Estado táctil para mover la cinta
        const pxToDeg = 180 / (Math.PI * (isMobile ? 2000 : 5000));
        let touchActive = false;
        let touchMoved = false;
        let touchTotal = 0;
        let touchLastX = 0, touchLastY = 0, touchLastT = 0;
        let touchVelocity = 0;

        // Estado táctil para cerrar imagen ampliada deslizando arriba/abajo en móvil
        let isDismissDragging = false;
        let dismissStartY = 0;
        let dismissDeltaY = 0;

        function collapseRibbonItem(item, fromPopstate = false) {
            if (!item || !item.expanded || item.isCollapsing) return;
            item.isCollapsing = true;
            activeCollapseRibbonFn = null;

            if (!fromPopstate && history.state && history.state.modalLevel === 'ribbon-item') {
                history.back();
            }

            const imgEl = item.querySelector('img');

            gsap.to("#ribbon-overlay", { opacity: 0, duration: 0.75, ease: "power3.inOut" });

            gsap.to(item, {
                x: item._ribbonX,
                y: item._ribbonY,
                scale: 1,
                rotation: item._ribbonRot + "_short",
                width: item._origWidth,
                height: item._origHeight,
                borderRadius: 12,
                duration: 0.75,
                ease: "power3.inOut",
                onComplete: () => {
                    item.style.zIndex = "";
                    item.expanded = false;
                    item.isCollapsing = false;
                    expandedItem = null;
                    isRibbonPaused = false;
                    item.classList.remove('is-expanded');
                    item.style.width = '';
                    item.style.height = '';
                    gsap.set(item, { clearProps: "scale" });
                    renderRibbon();
                }
            });

            gsap.to(imgEl, { borderRadius: 12, scale: 1, duration: 0.75, ease: "power3.inOut" });
        }

        for(let i = 0; i < totalCardsNeeded; i++) {
            const imgSrc = imagenesLista[i % imagenesLista.length];
            
            let rItem = document.createElement('div');
            rItem.className = 'ribbon-item';
            rItem.innerHTML = `<img src="${imgSrc}" alt="Proyecto" loading="lazy" decoding="async">`;
            ribbonContainer.appendChild(rItem);
            
            rItem.expanded = false;
            rItem.isCollapsing = false;

            rItem.addEventListener('click', function() {
                if (isRibbonPaused && !this.expanded) return;
                if (touchMoved) return;

                const imgEl = this.querySelector('img');

                if (!this.expanded) {
                    this.expanded = true;
                    expandedItem = this;
                    activeCollapseRibbonFn = () => collapseRibbonItem(this, true);
                    history.pushState({ modalLevel: 'ribbon-item' }, '');
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

                } else if (window.innerWidth > 768) {
                    collapseRibbonItem(this, false);
                }
            });

            ribbonItems.push({ element: rItem, index: i });
        }

        let scrollOffset = 0;
        let targetScroll = 0;

        layoutC.addEventListener('wheel', (e) => {
            if (e.cancelable) e.preventDefault();
            if (!isRibbonPaused) {
                targetScroll += (e.deltaY + e.deltaX) * 0.05;
            }
        }, { passive: false });

        layoutC.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;

            if (expandedItem && window.innerWidth <= 768) {
                isDismissDragging = true;
                dismissStartY = e.touches[0].clientY;
                dismissDeltaY = 0;
                return;
            }

            if (isRibbonPaused) return;
            touchActive = true;
            touchMoved = false;
            touchTotal = 0;
            touchVelocity = 0;
            touchLastX = e.touches[0].clientX;
            touchLastY = e.touches[0].clientY;
            touchLastT = e.timeStamp;
        }, { passive: true });

        layoutC.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;

            if (isDismissDragging && expandedItem) {
                if (e.cancelable) e.preventDefault();
                dismissDeltaY = e.touches[0].clientY - dismissStartY;

                if (Math.abs(dismissDeltaY) > 6) {
                    gsap.killTweensOf(expandedItem, "y,scale");
                    const dragScale = Math.max(0.86, 1 - Math.abs(dismissDeltaY) / 1400);
                    const overlayOpacity = Math.max(0.25, 1 - Math.abs(dismissDeltaY) / 450);

                    gsap.set(expandedItem, {
                        y: (window.innerHeight / 2) + dismissDeltaY,
                        scale: dragScale
                    });
                    gsap.set("#ribbon-overlay", { opacity: overlayOpacity });
                }
                return;
            }

            if (!touchActive || isRibbonPaused) return;
            if (e.cancelable) e.preventDefault();

            const t = e.touches[0];
            const dx = t.clientX - touchLastX;
            const dy = t.clientY - touchLastY;
            touchLastX = t.clientX;
            touchLastY = t.clientY;

            touchTotal += Math.abs(dx) + Math.abs(dy);
            if (touchTotal > 8) touchMoved = true;

            const delta = isMobile ? dy : (Math.abs(dx) > Math.abs(dy) ? dx : dy);
            const deg = -delta * pxToDeg;
            targetScroll += deg;

            const dt = Math.max(e.timeStamp - touchLastT, 1);
            touchLastT = e.timeStamp;
            const v = Math.max(-2, Math.min(2, deg / dt * 16.67));
            touchVelocity = touchVelocity * 0.6 + v * 0.4;
        }, { passive: false });

        const endTouch = (e) => {
            if (isDismissDragging) {
                isDismissDragging = false;
                if (expandedItem) {
                    if (Math.abs(dismissDeltaY) > 70) {
                        collapseRibbonItem(expandedItem, false);
                    } else {
                        gsap.to(expandedItem, {
                            y: window.innerHeight / 2,
                            scale: 1,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                        gsap.to("#ribbon-overlay", { opacity: 1, duration: 0.3 });
                    }
                }
                dismissDeltaY = 0;
                return;
            }

            if (!touchActive) return;
            touchActive = false;
            if (e.timeStamp - touchLastT > 80) touchVelocity = 0;
            setTimeout(() => { touchMoved = false; }, 350);
        };
        layoutC.addEventListener('touchend', endTouch);
        layoutC.addEventListener('touchcancel', endTouch);

        function renderRibbon() {
            if (isRibbonPaused) return; 

            targetScroll += 0.03; 
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
                    if (!curvaInvertida) {
                        // Tarjeta 1: Arco en la parte baja (curva hacia abajo)
                        const circleCy = screenH + R - 550; 
                        x = circleCx + R * Math.sin(angleRad);
                        y = circleCy - R * Math.cos(angleRad);
                        rotation = angleDeg; 
                    } else {
                        // Tarjeta 2: Arco en la parte alta (curva hacia arriba)
                        const circleCy = -R + 550;
                        x = circleCx + R * Math.sin(angleRad);
                        y = circleCy + R * Math.cos(angleRad);
                        rotation = -angleDeg;
                    }
                } else {
                    const circleCy = screenH / 2; 
                    if (!curvaInvertida) {
                        // Tarjeta 1 móvil: Centro a la izquierda
                        const circleCx = (screenW / 2) - R; 
                        x = circleCx + R * Math.cos(angleRad);
                        y = circleCy + R * Math.sin(angleRad);
                        rotation = angleDeg; 
                    } else {
                        // Tarjeta 2 móvil: Centro a la derecha (curva opuesta)
                        const circleCx = (screenW / 2) + R; 
                        x = circleCx - R * Math.cos(angleRad);
                        y = circleCy + R * Math.sin(angleRad);
                        rotation = -angleDeg; 
                    }
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

    function closeActiveCard(fromPopstate = false) {
        if (!lastActiveCard || !flyingClone) return;

        isCardOpen = false;
        activeCollapseRibbonFn = null;

        if (!fromPopstate && history.state) {
            if (history.state.modalLevel === 'ribbon-item') {
                history.go(-2);
            } else if (history.state.modalLevel === 'card') {
                history.back();
            }
        }

        if(ribbonAnimationId) {
            cancelAnimationFrame(ribbonAnimationId);
            ribbonAnimationId = null;
        }
        isRibbonPaused = false;

        closeCardBtn.classList.remove('visible'); 

        const cardImg = lastActiveCard.querySelector('img');
        let cloneImg = flyingClone.querySelector('img');
        gsap.killTweensOf([flyingClone, cloneImg]);
        gsap.to(projectContent, { autoAlpha: 0, duration: 0.2 });

        projectModal.style.backgroundColor = 'transparent';
        flyingClone.style.opacity = 1;
        
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
    // 7. MOTOR WEBGL: LENTE ANAMÓRFICO INTERACTIVO
    // ==========================================
    const canvas = document.getElementById("lens-canvas");
    if(canvas) {
        const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
      
        let lastCanvasWidth = 0;
        const setCanvasSize = () => {
            const w = canvas.clientWidth || window.innerWidth;
            const h = canvas.clientHeight || window.innerHeight;
            if (lastCanvasWidth === w && Math.abs(canvas.height - h) < 180) return;
            lastCanvasWidth = w;
            canvas.width = w;
            canvas.height = h;
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