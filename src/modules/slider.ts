import { appState, onEvent, showToast } from '../main';

export function initSlider() {
    const placeholder = document.getElementById('slider-placeholder') as HTMLElement;
    const slider = document.getElementById('comparison-slider') as HTMLElement;
    const beforeImg = document.getElementById('before-image') as HTMLImageElement;
    const afterCanvas = document.getElementById('after-canvas') as HTMLCanvasElement;
    const handle = document.getElementById('comparison-handle') as HTMLElement;
    const afterDiv = document.getElementById('comparison-after') as HTMLElement;
    const generateBtn = document.getElementById('generate-design-btn') as HTMLButtonElement;
    const processingEl = document.getElementById('ai-processing') as HTMLElement;
    const processingSteps = document.getElementById('processing-steps') as HTMLElement;
    let isGenerating = false;

    generateBtn?.addEventListener('click', generateDesign);
    onEvent('regenerateDesign', () => {
        if (slider.style.display === 'block' && appState.uploadedImage && !isGenerating) {
            applyAITransformation();
        }
    });

    async function generateDesign() {
        if (!appState.uploadedImage) {
            showToast('Please upload a room image first (Step 1)', 'error');
            return;
        }
        if (isGenerating) return;
        isGenerating = true;
        processingEl.style.display = 'block';
        placeholder.style.display = 'none';
        const steps = [
            '🔍 Analyzing room geometry...', '🧱 Detecting surfaces via ML...',
            '🎨 Computing color palette...', '🛋️ Placing furniture...',
            '💡 Rendering lighting ({lighting})...', '✨ Applying {theme} style...',
            '📐 Optimizing {length}×{width}ft layout...', '🏠 Finalizing redesign...',
        ].map(s => s.replace('{lighting}', appState.lighting).replace('{theme}', appState.designTheme)
            .replace('{length}', String(appState.roomDimensions.length)).replace('{width}', String(appState.roomDimensions.width)));
        let stepIdx = 0;
        processingSteps.innerHTML = '';
        const stepInterval = setInterval(() => {
            if (stepIdx < steps.length) {
                const div = document.createElement('div');
                div.className = 'processing-step visible';
                div.textContent = steps[stepIdx]; processingSteps.appendChild(div); stepIdx++;
            }
        }, 450);
        await new Promise<void>(resolve => {
            setTimeout(() => {
                clearInterval(stepInterval); processingEl.style.display = 'none';
                applyAITransformation(); placeholder.style.display = 'none';
                slider.style.display = 'block'; initDragSlider();
                showToast('AI design generated successfully!', 'success');
                isGenerating = false; resolve();
            }, 4000);
        });
    }

    function applyAITransformation() {
        if (!appState.uploadedImage) return;
        beforeImg.src = appState.uploadedImageDataURL!;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            afterCanvas.width = img.width;
            afterCanvas.height = img.height;
            renderDesignVisualization(afterCanvas, img);
        };
        img.src = appState.uploadedImageDataURL!;
    }

    function renderDesignVisualization(canvas: HTMLCanvasElement, img: HTMLImageElement) {
        const ctx = canvas.getContext('2d')!;
        const w = canvas.width, h = canvas.height;

        // Draw original as base
        ctx.drawImage(img, 0, 0, w, h);

        // Strong color transformation on surfaces
        recolorSurfaces(ctx, w, h);

        // Draw a complete room visualization overlay
        drawRoomOverlay(ctx, w, h);

        // Draw furniture
        drawAllFurniture(ctx, w, h);

        // Draw curtains if selected
        drawCurtains(ctx, w, h);

        // Post-processing
        applyLighting(ctx, w, h);
        applyVignette(ctx, w, h);
        addAIBadge(ctx, w, h);
    }

    function recolorSurfaces(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;
        const wc = hexRgb(appState.colors.primaryWall);
        const ac = hexRgb(appState.colors.accentWall);
        const cc = hexRgb(appState.colors.ceiling);
        const fc = hexRgb(appState.colors.furniture);

        // Build luminance map
        const lum = new Float32Array(w * h);
        for (let i = 0; i < w * h; i++) {
            lum[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
        }

        // Edge detection
        const edges = new Float32Array(w * h);
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const i = y * w + x;
                const gx = Math.abs(lum[i + 1] - lum[i - 1]);
                const gy = Math.abs(lum[i + w] - lum[i - w]);
                edges[i] = Math.sqrt(gx * gx + gy * gy);
            }
        }

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const pi = y * w + x;
                const edge = edges[pi];
                const yr = y / h, xr = x / w;
                const sat = (() => {
                    const mx = Math.max(d[i], d[i + 1], d[i + 2]);
                    const mn = Math.min(d[i], d[i + 1], d[i + 2]);
                    return mx === 0 ? 0 : (mx - mn) / mx;
                })();

                if (edge > 22) continue;

                let tR = 0, tG = 0, tB = 0, blend = 0;

                // Ceiling
                if (yr < 0.2 && lum[pi] > 90 && sat < 0.35) {
                    blend = 0.7 * (1 - yr / 0.2) * Math.max(0, 1 - edge / 20);
                    tR = cc.r; tG = cc.g; tB = cc.b;
                }
                // Accent wall (left side)
                else if (xr < 0.35 && yr > 0.08 && yr < 0.7 && sat < 0.4 && edge < 14) {
                    const f = Math.min(xr / 0.12, 1) * (1 - Math.max(0, (xr - 0.25) / 0.1));
                    blend = 0.72 * f * Math.max(0, 1 - edge / 14);
                    tR = ac.r; tG = ac.g; tB = ac.b;
                }
                // Primary wall
                else if (yr > 0.08 && yr < 0.7 && lum[pi] > 55 && sat < 0.35 && edge < 12) {
                    blend = (lum[pi] > 130 ? 0.68 : 0.45) * Math.max(0, 1 - edge / 12);
                    tR = wc.r; tG = wc.g; tB = wc.b;
                }
                // Floor
                else if (yr > 0.68 && lum[pi] > 40 && lum[pi] < 220 && edge < 14) {
                    blend = 0.35 * Math.min(1, (yr - 0.68) / 0.12) * Math.max(0, 1 - edge / 14);
                    tR = fc.r; tG = fc.g; tB = fc.b;
                }

                if (blend > 0) {
                    d[i] = lerp(d[i], tR, blend);
                    d[i + 1] = lerp(d[i + 1], tG, blend);
                    d[i + 2] = lerp(d[i + 2], tB, blend);
                }

                // Lighting tone
                if (appState.lighting === 'warm') {
                    d[i] = clamp(d[i] + 8); d[i + 1] = clamp(d[i + 1] + 4); d[i + 2] = clamp(d[i + 2] - 5);
                } else if (appState.lighting === 'cool') {
                    d[i] = clamp(d[i] - 4); d[i + 1] = clamp(d[i + 1] + 3); d[i + 2] = clamp(d[i + 2] + 10);
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function drawRoomOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
        ctx.save();
        // Wall accent strip / wainscoting line
        ctx.strokeStyle = darken(appState.colors.primaryWall, 15);
        ctx.lineWidth = 2; ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.moveTo(0, h * 0.45); ctx.lineTo(w, h * 0.45); ctx.stroke();

        // Crown molding line
        ctx.strokeStyle = lighten(appState.colors.ceiling, 15);
        ctx.lineWidth = 3; ctx.globalAlpha = 0.25;
        ctx.beginPath(); ctx.moveTo(0, h * 0.08); ctx.lineTo(w, h * 0.08); ctx.stroke();

        // Baseboard
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = lighten(appState.colors.primaryWall, 20);
        ctx.fillRect(0, h * 0.67, w, h * 0.015);

        // Window light rays
        ctx.globalAlpha = 0.06;
        ctx.globalCompositeOperation = 'screen';
        const rayGrad = ctx.createLinearGradient(w * 0.65, 0, w * 0.4, h * 0.7);
        rayGrad.addColorStop(0, 'rgba(255,255,200,1)');
        rayGrad.addColorStop(1, 'rgba(255,255,200,0)');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(w * 0.6, h * 0.05); ctx.lineTo(w * 0.85, h * 0.05);
        ctx.lineTo(w * 0.7, h * 0.7); ctx.lineTo(w * 0.3, h * 0.7);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    function drawAllFurniture(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const furn = appState.selectedFurniture;
        if (!furn.length) return;
        ctx.save();
        const baseY = h * 0.64;
        let xOff = w * 0.1;

        furn.forEach(item => {
            const col = item.color || appState.colors.furniture;
            ctx.globalAlpha = 0.82;

            if (item.category === 'sofa') {
                drawSofa(ctx, xOff, baseY, w * 0.32, h * 0.1, col);
                xOff += w * 0.36;
            } else if (item.category === 'bed') {
                drawBed(ctx, w * 0.28, baseY + h * 0.02, w * 0.44, h * 0.14, col);
            } else if (item.category === 'table') {
                drawTable(ctx, xOff, baseY + h * 0.04, w * 0.15, h * 0.08, col);
                xOff += w * 0.18;
            } else if (item.category === 'lighting') {
                drawLamp(ctx, xOff, baseY, h, col);
                xOff += w * 0.07;
            } else if (item.category === 'storage') {
                drawCabinet(ctx, xOff, baseY - h * 0.1, w * 0.12, h * 0.2, col);
                xOff += w * 0.14;
            } else if (item.category === 'decor') {
                if (item.id?.includes('rug')) drawRug(ctx, w * 0.5, baseY + h * 0.11, w * 0.48, h * 0.1, col);
                else if (item.id?.includes('plant')) { drawPlant(ctx, xOff, baseY, h); xOff += w * 0.06; }
            }
        });
        ctx.restore();
    }

    function drawSofa(ctx: CanvasRenderingContext2D, x: number, y: number, sw: number, sh: number, col: string) {
        // Shadow
        ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(x + sw / 2, y + sh + 6, sw * 0.5, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.globalAlpha = 0.82;
        // Back
        const bgr = ctx.createLinearGradient(x, y - sh * 0.5, x, y);
        bgr.addColorStop(0, darken(col, 25)); bgr.addColorStop(1, darken(col, 12));
        ctx.fillStyle = bgr;
        ctx.beginPath(); ctx.roundRect(x - 2, y - sh * 0.52, sw + 4, sh * 0.3, 5); ctx.fill();
        // Arms
        ctx.fillStyle = darken(col, 20);
        ctx.beginPath(); ctx.roundRect(x - 14, y - sh * 0.35, 16, sh * 1.35, [6, 0, 0, 6]); ctx.fill();
        ctx.beginPath(); ctx.roundRect(x + sw - 2, y - sh * 0.35, 16, sh * 1.35, [0, 6, 6, 0]); ctx.fill();
        // Seat
        const sg = ctx.createLinearGradient(x, y, x, y + sh);
        sg.addColorStop(0, lighten(col, 5)); sg.addColorStop(1, col);
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.roundRect(x, y, sw, sh, 5); ctx.fill();
        // Cushions
        const cw = (sw - 14) / 3;
        for (let i = 0; i < 3; i++) {
            const cg = ctx.createLinearGradient(0, y + 3, 0, y + sh - 5);
            cg.addColorStop(0, lighten(col, 16)); cg.addColorStop(1, lighten(col, 6));
            ctx.fillStyle = cg;
            ctx.beginPath(); ctx.roundRect(x + 4 + i * (cw + 3), y + 4, cw, sh - 9, 4); ctx.fill();
        }
        // Throw pillows
        ctx.fillStyle = lighten(col, 30);
        ctx.beginPath(); ctx.roundRect(x + 8, y - sh * 0.25, sw * 0.14, sh * 0.45, 4); ctx.fill();
        ctx.fillStyle = darken(col, 5);
        ctx.beginPath(); ctx.roundRect(x + sw - sw * 0.14 - 8, y - sh * 0.25, sw * 0.14, sh * 0.45, 4); ctx.fill();
    }

    function drawBed(ctx: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, col: string) {
        ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(x + bw / 2, y + bh + 8, bw * 0.45, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.globalAlpha = 0.82;
        // Frame
        ctx.fillStyle = darken(col, 8);
        ctx.beginPath(); ctx.roundRect(x - 3, y - 3, bw + 6, bh + 6, 4); ctx.fill();
        // Mattress
        const mg = ctx.createLinearGradient(x, y, x, y + bh);
        mg.addColorStop(0, lighten(col, 15)); mg.addColorStop(1, col);
        ctx.fillStyle = mg; ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 3); ctx.fill();
        // Headboard
        const hg = ctx.createLinearGradient(x, y - bh * 0.55, x, y);
        hg.addColorStop(0, darken(col, 32)); hg.addColorStop(1, darken(col, 18));
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.moveTo(x - 2, y); ctx.lineTo(x - 2, y - bh * 0.45);
        ctx.quadraticCurveTo(x + bw / 2, y - bh * 0.6, x + bw + 2, y - bh * 0.45);
        ctx.lineTo(x + bw + 2, y); ctx.fill();
        // Pillows
        const pw = bw * 0.26, ph = bh * 0.3;
        ctx.fillStyle = '#F5F0E8';
        ctx.beginPath(); ctx.roundRect(x + 12, y + 5, pw, ph, 6); ctx.fill();
        ctx.beginPath(); ctx.roundRect(x + bw - pw - 12, y + 5, pw, ph, 6); ctx.fill();
        // Blanket fold
        const blg = ctx.createLinearGradient(x, y + bh * 0.45, x, y + bh * 0.75);
        blg.addColorStop(0, lighten(col, 22)); blg.addColorStop(1, lighten(col, 12));
        ctx.fillStyle = blg;
        ctx.beginPath(); ctx.roundRect(x + 5, y + bh * 0.45, bw - 10, bh * 0.28, 2); ctx.fill();
    }

    function drawTable(ctx: CanvasRenderingContext2D, x: number, y: number, tw: number, th: number, col: string) {
        ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(x + tw / 2, y + th, tw * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.globalAlpha = 0.82;
        const tg = ctx.createLinearGradient(x, y, x + tw, y);
        tg.addColorStop(0, col); tg.addColorStop(0.5, lighten(col, 10)); tg.addColorStop(1, col);
        ctx.fillStyle = tg;
        ctx.beginPath(); ctx.roundRect(x, y, tw, th * 0.18, 3); ctx.fill();
        ctx.fillStyle = darken(col, 40);
        ctx.fillRect(x + 6, y + th * 0.18, 3, th * 0.82);
        ctx.fillRect(x + tw - 9, y + th * 0.18, 3, th * 0.82);
    }

    function drawLamp(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number, _col: string) {
        ctx.fillStyle = '#444'; ctx.fillRect(x + 12, baseY - h * 0.16, 3, h * 0.21);
        const sg = ctx.createLinearGradient(x, 0, x + 30, 0);
        sg.addColorStop(0, '#F0D8B0'); sg.addColorStop(0.5, '#FFF3D8'); sg.addColorStop(1, '#F0D8B0');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.moveTo(x, baseY - h * 0.155); ctx.lineTo(x + 28, baseY - h * 0.155);
        ctx.lineTo(x + 22, baseY - h * 0.21); ctx.lineTo(x + 6, baseY - h * 0.21); ctx.fill();
        // Glow
        ctx.save();
        const gl = ctx.createRadialGradient(x + 14, baseY - h * 0.13, 0, x + 14, baseY - h * 0.13, h * 0.13);
        gl.addColorStop(0, 'rgba(255,210,130,0.3)'); gl.addColorStop(1, 'rgba(255,210,130,0)');
        ctx.fillStyle = gl;
        ctx.beginPath(); ctx.arc(x + 14, baseY - h * 0.13, h * 0.13, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawCabinet(ctx: CanvasRenderingContext2D, x: number, y: number, sw: number, sh: number, col: string) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.roundRect(x, y, sw, sh, 4); ctx.fill();
        ctx.strokeStyle = darken(col, 16); ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const dy = y + 3 + i * (sh / 3);
            ctx.strokeRect(x + 3, dy, sw - 6, sh / 3 - 4);
            ctx.fillStyle = '#B8860B'; ctx.beginPath(); ctx.arc(x + sw / 2, dy + (sh / 3 - 4) / 2, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = col;
        }
    }

    function drawRug(ctx: CanvasRenderingContext2D, cx: number, cy: number, rw: number, rh: number, col: string) {
        ctx.save(); ctx.globalAlpha = 0.4;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(cx, cy, rw / 2, rh / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = darken(col, 25); ctx.lineWidth = 1.5; ctx.globalAlpha = 0.25;
        ctx.beginPath(); ctx.ellipse(cx, cy, rw * 0.35, rh * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }

    function drawPlant(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number) {
        ctx.fillStyle = '#8B4513';
        ctx.beginPath(); ctx.roundRect(x, baseY + h * 0.01, 18, 14, 3); ctx.fill();
        ['#2E8B57', '#3CB371', '#228B22', '#32CD32', '#1B5E20', '#2E7D32'].forEach((g, i) => {
            ctx.fillStyle = g; ctx.globalAlpha = 0.75;
            ctx.beginPath();
            ctx.ellipse(x + 9 + Math.cos(i * 1.1) * 9, baseY - 4 + Math.sin(i * 0.85) * 7, 8, 6, i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 0.82;
    }

    function drawCurtains(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const ci = appState.selectedFurniture.find(f => f.category === 'curtain');
        if (!ci) return;
        const col = ci.color || '#FFFAF0';
        ctx.save(); ctx.globalAlpha = 0.5;
        const wx = w * 0.7, wy = h * 0.08, ww = w * 0.25, wh = h * 0.4;
        // Left
        const lg = ctx.createLinearGradient(wx - 35, wy, wx - 15, wy + wh);
        lg.addColorStop(0, lighten(col, 10)); lg.addColorStop(0.5, col); lg.addColorStop(1, darken(col, 12));
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(wx - 15, wy);
        for (let i = 0; i <= 10; i++) { const t = i / 10; ctx.lineTo(wx - 15 - 20 * Math.sin(t * Math.PI * 0.5), wy + (wh + 18) * t); }
        ctx.lineTo(wx - 35, wy); ctx.fill();
        // Right
        const rg = ctx.createLinearGradient(wx + ww + 15, wy, wx + ww + 35, wy + wh);
        rg.addColorStop(0, lighten(col, 10)); rg.addColorStop(0.5, col); rg.addColorStop(1, darken(col, 12));
        ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(wx + ww + 15, wy);
        for (let i = 0; i <= 10; i++) { const t = i / 10; ctx.lineTo(wx + ww + 15 + 20 * Math.sin(t * Math.PI * 0.5), wy + (wh + 18) * t); }
        ctx.lineTo(wx + ww + 35, wy); ctx.fill();
        // Rod
        ctx.globalAlpha = 0.7; ctx.fillStyle = '#C8960B';
        ctx.beginPath(); ctx.roundRect(wx - 40, wy - 4, ww + 80, 5, 2); ctx.fill();
        ctx.beginPath(); ctx.arc(wx - 40, wy - 1.5, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(wx + ww + 40, wy - 1.5, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function applyLighting(ctx: CanvasRenderingContext2D, w: number, h: number) {
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        if (appState.lighting === 'warm') {
            const g = ctx.createRadialGradient(w * 0.72, h * 0.12, 0, w * 0.72, h * 0.12, h * 0.55);
            g.addColorStop(0, 'rgba(255,200,100,0.18)'); g.addColorStop(1, 'rgba(255,200,100,0)');
            ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        } else if (appState.lighting === 'cool') {
            const g = ctx.createRadialGradient(w * 0.5, h * 0.08, 0, w * 0.5, h * 0.08, h * 0.6);
            g.addColorStop(0, 'rgba(150,200,255,0.14)'); g.addColorStop(1, 'rgba(150,200,255,0)');
            ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();

        // Style overlay
        ctx.save();
        const th = appState.designTheme;
        if (th === 'modern-luxury') { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(40,20,60,0.12)'; ctx.fillRect(0, 0, w, h); }
        else if (th === 'industrial') { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(200,195,185,0.1)'; ctx.fillRect(0, 0, w, h); }
        else if (th === 'boho') { ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = 'rgba(200,150,100,0.08)'; ctx.fillRect(0, 0, w, h); }
        ctx.restore();

        // Contrast boost
        if (appState.style === 'modern' || appState.style === 'contemporary') {
            const id = ctx.getImageData(0, 0, w, h); const dd = id.data;
            for (let i = 0; i < dd.length; i += 4) {
                dd[i] = clamp(((dd[i] - 128) * 1.08) + 128);
                dd[i + 1] = clamp(((dd[i + 1] - 128) * 1.08) + 128);
                dd[i + 2] = clamp(((dd[i + 2] - 128) * 1.08) + 128);
            }
            ctx.putImageData(id, 0, 0);
        }
    }

    function applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(0,0,0,0.04)'); g.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }

    function addAIBadge(ctx: CanvasRenderingContext2D, w: number, _h: number) {
        ctx.save(); ctx.globalAlpha = 0.85;
        const bw = 175, bh = 30, bx = w - bw - 14, by = 14;
        const bg = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
        bg.addColorStop(0, 'rgba(99,102,241,0.9)'); bg.addColorStop(1, 'rgba(139,92,246,0.9)');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 15); ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✨ AI Enhanced by GruhaBuddy', bx + bw / 2, by + bh / 2);
        ctx.restore();
    }

    function initDragSlider() {
        let isDragging = false;
        const onMove = (clientX: number) => {
            const rect = slider.getBoundingClientRect();
            let pct = ((clientX - rect.left) / rect.width) * 100;
            pct = Math.max(2, Math.min(98, pct));
            afterDiv.style.clipPath = `inset(0 0 0 ${pct}%)`;
            handle.style.left = `${pct}%`;
        };
        handle.addEventListener('mousedown', () => isDragging = true);
        handle.addEventListener('touchstart', () => isDragging = true);
        window.addEventListener('mouseup', () => isDragging = false);
        window.addEventListener('touchend', () => isDragging = false);
        window.addEventListener('mousemove', e => { if (isDragging) onMove(e.clientX); });
        window.addEventListener('touchmove', e => { if (isDragging) onMove(e.touches[0].clientX); });
        slider.addEventListener('click', e => onMove(e.clientX));
    }

    // Helpers
    function hexRgb(hex: string) {
        return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
    }
    function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
    function clamp(v: number) { return Math.max(0, Math.min(255, Math.round(v))); }
    function lighten(hex: string, n: number) {
        if (hex.startsWith('rgb')) return hex;
        const c = hexRgb(hex);
        return `rgb(${Math.min(255, c.r + n)},${Math.min(255, c.g + n)},${Math.min(255, c.b + n)})`;
    }
    function darken(hex: string, n: number) {
        if (hex.startsWith('rgb')) return hex;
        const c = hexRgb(hex);
        return `rgb(${Math.max(0, c.r - n)},${Math.max(0, c.g - n)},${Math.max(0, c.b - n)})`;
    }
}
