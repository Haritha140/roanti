import { appState, onEvent, showToast, emitEvent } from '../main';

export function initBudget() {
    let currentStep = 1;
    const totalSteps = 3;

    const wizard = document.getElementById('budget-wizard')!;
    const prevBtn = document.getElementById('wizard-prev') as HTMLButtonElement;
    const nextBtn = document.getElementById('wizard-next') as HTMLButtonElement;
    const budgetInput = document.getElementById('budget-amount') as HTMLInputElement;
    const budgetSlider = document.getElementById('budget-slider') as HTMLInputElement;
    const lengthInput = document.getElementById('room-length') as HTMLInputElement;
    const widthInput = document.getElementById('room-width') as HTMLInputElement;
    const heightInput = document.getElementById('room-height') as HTMLInputElement;
    const areaDisplay = document.getElementById('room-area')!;
    const volumeDisplay = document.getElementById('room-volume')!;
    const results = document.getElementById('budget-results')!;

    // Budget input sync
    budgetInput.addEventListener('input', () => {
        const val = parseInt(budgetInput.value) || 50000;
        appState.budget = val;
        budgetSlider.value = String(val);
    });

    budgetSlider.addEventListener('input', () => {
        const val = parseInt(budgetSlider.value);
        appState.budget = val;
        budgetInput.value = String(val);
    });

    // Dimension inputs
    [lengthInput, widthInput, heightInput].forEach(input => {
        input.addEventListener('input', () => {
            appState.roomDimensions.length = parseInt(lengthInput.value) || 15;
            appState.roomDimensions.width = parseInt(widthInput.value) || 12;
            appState.roomDimensions.height = parseInt(heightInput.value) || 10;
            const area = appState.roomDimensions.length * appState.roomDimensions.width;
            const volume = area * appState.roomDimensions.height;
            areaDisplay.textContent = String(area);
            volumeDisplay.textContent = String(volume);
        });
    });

    // Preference buttons
    document.querySelectorAll('.pref-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pref = btn.getAttribute('data-pref')!;
            const val = btn.getAttribute('data-val')!;

            btn.parentElement!.querySelectorAll('.pref-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            switch (pref) {
                case 'lighting': appState.lighting = val; break;
                case 'style': appState.style = val; break;
                case 'vastu': appState.vastu = val === 'yes'; break;
                case 'property': appState.propertyType = val; break;
            }
        });
    });

    // Wizard navigation
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizard();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            updateWizard();
        } else {
            // Generate results
            generateBudgetResults();
        }
    });

    function updateWizard() {
        document.querySelectorAll('.wizard-step').forEach((step, idx) => {
            step.classList.toggle('active', idx === currentStep - 1);
        });

        document.querySelectorAll('.wizard-dot').forEach((dot, idx) => {
            dot.classList.toggle('active', idx < currentStep);
        });

        prevBtn.style.display = currentStep === 1 ? 'none' : '';
        nextBtn.textContent = currentStep === totalSteps ? '✨ Generate Design' : 'Next →';
    }

    function generateBudgetResults() {
        results.style.display = 'block';
        showToast('AI analyzing your preferences...', 'info');

        // Calculate scores dynamically based on inputs
        const area = appState.roomDimensions.length * appState.roomDimensions.width;
        const budgetPerSqFt = appState.budget / area;
        const furnitureCost = appState.selectedFurniture.reduce((s, f) => s + f.price, 0);
        const remainingBudget = appState.budget - furnitureCost;

        // Budget optimization score
        const budgetScore = Math.max(40, Math.min(98,
            remainingBudget > 0
                ? Math.round(70 + (remainingBudget / appState.budget) * 28)
                : Math.round(40 + (appState.budget / (furnitureCost || 1)) * 30)
        ));

        // Sustainability score
        const sustainScore = Math.max(50, Math.min(96,
            Math.round(75 + (appState.style === 'minimalist' ? 15 : appState.style === 'modern' ? 10 : 5)
                + (appState.lighting === 'cool' ? 3 : -2))
        ));

        // Space utilization
        const spaceScore = Math.max(45, Math.min(95,
            Math.round(55 + Math.min(30, area / 10) + (appState.selectedFurniture.length > 0
                ? Math.max(0, 10 - appState.selectedFurniture.length * 2) : 0))
        ));

        // Aesthetic harmony
        const aestheticScore = Math.max(60, Math.min(99,
            Math.round(80 + (appState.designTheme === 'scandinavian' ? 10 : 5)
                + (appState.selectedFurniture.length > 2 ? 5 : 0))
        ));

        appState.scores = {
            budget: budgetScore,
            sustainability: sustainScore,
            space: spaceScore,
            aesthetic: aestheticScore,
        };

        // Animate scores
        setTimeout(() => animateScores(), 300);

        // Generate breakdown
        generateBreakdown(furnitureCost);

        // Draw chart
        setTimeout(() => drawBudgetChart(furnitureCost), 500);

        // Scroll to results
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });

        emitEvent('budgetComplete');
        emitEvent('regenerateDesign');
    }

    function animateScores() {
        const scoreData = [
            { id: 'score-budget', score: appState.scores.budget },
            { id: 'score-sustain', score: appState.scores.sustainability },
            { id: 'score-space', score: appState.scores.space },
            { id: 'score-aesthetic', score: appState.scores.aesthetic },
        ];

        // Add SVG gradient if not exists
        if (!document.getElementById('scoreGradientDef')) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '0');
            svg.setAttribute('height', '0');
            svg.id = 'scoreGradientDef';
            svg.innerHTML = `
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366f1"/>
            <stop offset="50%" style="stop-color:#8b5cf6"/>
            <stop offset="100%" style="stop-color:#a855f7"/>
          </linearGradient>
        </defs>
      `;
            document.body.appendChild(svg);
        }

        scoreData.forEach(({ id, score }) => {
            const ring = document.getElementById(id);
            if (!ring) return;
            const circle = ring.querySelector('.score-fill') as SVGCircleElement;
            const valueEl = ring.querySelector('.score-value') as HTMLElement;

            if (circle) {
                const circumference = 2 * Math.PI * 54; // r=54
                const offset = circumference - (score / 100) * circumference;
                circle.style.strokeDasharray = String(circumference);
                circle.style.strokeDashoffset = String(circumference);

                setTimeout(() => {
                    circle.style.strokeDashoffset = String(offset);
                }, 100);
            }

            if (valueEl) {
                let current = 0;
                const interval = setInterval(() => {
                    current += 2;
                    if (current >= score) {
                        current = score;
                        clearInterval(interval);
                    }
                    valueEl.textContent = String(current);
                }, 20);
            }
        });
    }

    function generateBreakdown(furnitureCost: number) {
        const container = document.getElementById('breakdown-items')!;
        const totalEl = document.getElementById('breakdown-total-amount')!;

        const area = appState.roomDimensions.length * appState.roomDimensions.width;
        const paintCost = Math.round(area * 45 * 2.5); // ₹45/sqft, walls ~2.5x floor area
        const lightingCost = Math.round(appState.budget * 0.08);
        const decorCost = Math.round(appState.budget * 0.06);
        const labourCost = Math.round(area * 120);
        const miscCost = Math.round(appState.budget * 0.05);

        const items = [
            { icon: '🎨', label: 'Paint & Finishing', cost: paintCost },
            { icon: '🛋️', label: 'Furniture', cost: furnitureCost || Math.round(appState.budget * 0.35) },
            { icon: '💡', label: 'Lighting', cost: lightingCost },
            { icon: '🖼️', label: 'Decor & Accessories', cost: decorCost },
            { icon: '👷', label: 'Labour', cost: labourCost },
            { icon: '📦', label: 'Miscellaneous', cost: miscCost },
        ];

        const totalCost = items.reduce((s, i) => s + i.cost, 0);

        container.innerHTML = items.map(item => {
            const percent = Math.round((item.cost / totalCost) * 100);
            return `
        <div class="breakdown-item">
          <div style="flex:1;">
            <div class="breakdown-item-label">
              <span>${item.icon}</span>
              <span>${item.label}</span>
            </div>
            <div class="breakdown-item-bar" style="width:${percent}%;"></div>
          </div>
          <span style="font-weight:600;white-space:nowrap;">₹${item.cost.toLocaleString()}</span>
        </div>
      `;
        }).join('');

        totalEl.textContent = `₹${totalCost.toLocaleString()}`;
    }

    function drawBudgetChart(furnitureCost: number) {
        const canvas = document.getElementById('budget-chart') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        const area = appState.roomDimensions.length * appState.roomDimensions.width;
        const paintPct = 20;
        const furnPct = furnitureCost > 0 ? 35 : 35;
        const lightPct = 12;
        const decorPct = 10;
        const labourPct = 15;
        const miscPct = 8;

        const segments = [
            { pct: paintPct, color: '#6366f1', label: 'Paint' },
            { pct: furnPct, color: '#8b5cf6', label: 'Furniture' },
            { pct: lightPct, color: '#a855f7', label: 'Lighting' },
            { pct: decorPct, color: '#ec4899', label: 'Decor' },
            { pct: labourPct, color: '#f59e0b', label: 'Labour' },
            { pct: miscPct, color: '#10b981', label: 'Misc' },
        ];

        const cx = 150, cy = 130, r = 80;
        let startAngle = -Math.PI / 2;

        ctx.clearRect(0, 0, 300, 300);

        segments.forEach((seg, i) => {
            const sliceAngle = (seg.pct / 100) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = seg.color;
            ctx.fill();

            // Label
            const midAngle = startAngle + sliceAngle / 2;
            const labelR = r + 20;
            const lx = cx + Math.cos(midAngle) * labelR;
            const ly = cy + Math.sin(midAngle) * labelR;
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#a8b4e0';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${seg.label} ${seg.pct}%`, lx, ly);

            startAngle += sliceAngle;
        });

        // Inner circle (donut)
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0a0e27';
        ctx.fill();

        // Center text
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f0f2ff';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Budget', cx, cy - 5);
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`₹${(appState.budget / 100000).toFixed(1)}L`, cx, cy + 12);
    }

    onEvent('budgetChanged', () => {
        const furnitureCost = appState.selectedFurniture.reduce((s, f) => s + f.price, 0);
        if (results.style.display !== 'none') {
            generateBreakdown(furnitureCost);
            drawBudgetChart(furnitureCost);
        }
    });
}
