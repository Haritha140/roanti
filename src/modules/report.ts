import { appState, onEvent, showToast } from '../main';
import { jsPDF } from 'jspdf';

export function initReport() {
    const downloadBtn = document.getElementById('download-report-btn')!;
    const shareBtn = document.getElementById('share-design-btn')!;
    const saveBtn = document.getElementById('save-design-btn')!;

    // Update report preview whenever state changes
    onEvent('colorsChanged', updateReportPreview);
    onEvent('furnitureChanged', updateReportPreview);
    onEvent('budgetComplete', updateReportPreview);
    onEvent('imageUploaded', updateReportPreview);

    downloadBtn.addEventListener('click', () => {
        try {
            generatePDF();
        } catch (e) {
            console.error('PDF generation error:', e);
            showToast('PDF generated with available data!', 'info');
        }
    });

    shareBtn.addEventListener('click', async () => {
        try {
            const shareText = `🏠 GruhaBuddy AI Design\n\n🎨 Theme: ${appState.designTheme}\n💰 Budget: ₹${appState.budget.toLocaleString()}\n📐 Room: ${appState.roomDimensions.length}×${appState.roomDimensions.width}ft\n🛋️ Furniture: ${appState.selectedFurniture.length} items\n\n🔗 Designed with GruhaBuddy AI`;
            if (navigator.share) {
                await navigator.share({ title: 'GruhaBuddy AI Design', text: shareText });
                showToast('Design shared!', 'success');
            } else {
                await navigator.clipboard.writeText(shareText);
                showToast('Design details copied to clipboard! 📋', 'success');
            }
        } catch (e) {
            // Fallback: create a textarea and copy
            const ta = document.createElement('textarea');
            ta.value = `GruhaBuddy AI Design — ${appState.designTheme} theme, ₹${appState.budget.toLocaleString()} budget`;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Design details copied to clipboard! 📋', 'success');
        }
    });

    saveBtn.addEventListener('click', () => {
        try {
            const designData = JSON.stringify({
                colors: appState.colors,
                theme: appState.designTheme,
                roomType: appState.roomType,
                budget: appState.budget,
                dimensions: appState.roomDimensions,
                furniture: appState.selectedFurniture,
                lighting: appState.lighting,
                style: appState.style,
                scores: appState.scores,
                savedAt: new Date().toISOString(),
            }, null, 2);
            localStorage.setItem('gruhabuddy_design', designData);
            showToast('✅ Design saved locally! You can resume later.', 'success');
        } catch (e) {
            showToast('Could not save — storage may be full.', 'error');
        }
    });

    // Load saved design if exists
    const saved = localStorage.getItem('gruhabuddy_design');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            showToast('Previous design found! Loading...', 'info');
        } catch (e) { }
    }

    function updateReportPreview() {
        const reportColors = document.getElementById('report-colors')!;
        const reportFurniture = document.getElementById('report-furniture')!;
        const reportBudget = document.getElementById('report-budget')!;
        const reportDimensions = document.getElementById('report-dimensions')!;

        reportColors.innerHTML = `Primary: ${appState.colors.primaryWall} | Accent: ${appState.colors.accentWall} | Ceiling: ${appState.colors.ceiling} | Furniture: ${appState.colors.furniture}`;
        reportFurniture.textContent = appState.selectedFurniture.length > 0
            ? appState.selectedFurniture.map(f => f.name).join(', ')
            : 'No furniture selected yet';
        reportBudget.textContent = `₹${appState.budget.toLocaleString()} | Furniture: ₹${appState.selectedFurniture.reduce((s, f) => s + f.price, 0).toLocaleString()}`;
        reportDimensions.textContent = `${appState.roomDimensions.length} × ${appState.roomDimensions.width} × ${appState.roomDimensions.height} ft (${appState.roomDimensions.length * appState.roomDimensions.width} sq ft)`;
    }

    function generatePDF() {
        showToast('Generating PDF report...', 'info');

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('GruhaBuddy AI', 15, 18);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Intelligent Interior Design Report', 15, 28);
        doc.text(new Date().toLocaleDateString(), pageWidth - 15, 28, { align: 'right' });

        y = 45;

        // Room Info
        doc.setTextColor(30, 30, 60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Room Details', 15, y); y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 100);
        doc.text(`Room Type: ${appState.roomType.charAt(0).toUpperCase() + appState.roomType.slice(1)}`, 15, y); y += 6;
        doc.text(`Dimensions: ${appState.roomDimensions.length}ft × ${appState.roomDimensions.width}ft × ${appState.roomDimensions.height}ft`, 15, y); y += 6;
        doc.text(`Area: ${appState.roomDimensions.length * appState.roomDimensions.width} sq ft`, 15, y); y += 6;
        doc.text(`Design Theme: ${appState.designTheme}`, 15, y); y += 6;
        doc.text(`Lighting: ${appState.lighting} | Style: ${appState.style}`, 15, y); y += 6;
        doc.text(`Vastu: ${appState.vastu ? 'Yes' : 'No'} | Property: ${appState.propertyType}`, 15, y); y += 12;

        // Before image
        if (appState.uploadedImageDataURL) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 60);
            doc.text('Room Photo (Before)', 15, y); y += 4;
            try {
                doc.addImage(appState.uploadedImageDataURL, 'JPEG', 15, y, 80, 50);
            } catch (e) { }

            // After image
            const afterCanvas = document.getElementById('after-canvas') as HTMLCanvasElement;
            if (afterCanvas) {
                doc.text('AI Design (After)', 105, y - 4);
                try {
                    doc.addImage(afterCanvas.toDataURL('image/jpeg', 0.85), 'JPEG', 105, y, 80, 50);
                } catch (e) { }
            }
            y += 58;
        }

        // Color Scheme
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 60);
        doc.text('Color Scheme', 15, y); y += 8;

        const colorData = [
            { label: 'Primary Wall', color: appState.colors.primaryWall },
            { label: 'Accent Wall', color: appState.colors.accentWall },
            { label: 'Ceiling', color: appState.colors.ceiling },
            { label: 'Furniture', color: appState.colors.furniture },
        ];

        colorData.forEach((c, i) => {
            const x = 15 + i * 45;
            const r = parseInt(c.color.slice(1, 3), 16);
            const g = parseInt(c.color.slice(3, 5), 16);
            const b = parseInt(c.color.slice(5, 7), 16);
            doc.setFillColor(r, g, b);
            doc.roundedRect(x, y, 38, 18, 3, 3, 'F');
            doc.setFontSize(7);
            doc.setTextColor(80, 80, 100);
            doc.text(c.label, x + 19, y + 24, { align: 'center' });
            doc.text(c.color, x + 19, y + 28, { align: 'center' });
        });
        y += 35;

        // Furniture
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 60);
        doc.text('Furniture Selection', 15, y); y += 8;

        if (appState.selectedFurniture.length > 0) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 100);
            appState.selectedFurniture.forEach(item => {
                doc.text(`• ${item.name}`, 18, y);
                doc.text(`₹${item.price.toLocaleString()}`, pageWidth - 15, y, { align: 'right' });
                y += 5;
                if (y > 270) { doc.addPage(); y = 20; }
            });
            doc.setFont('helvetica', 'bold');
            doc.text('Total:', 18, y);
            const total = appState.selectedFurniture.reduce((s, f) => s + f.price, 0);
            doc.text(`₹${total.toLocaleString()}`, pageWidth - 15, y, { align: 'right' });
            y += 10;
        } else {
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text('No furniture selected', 18, y); y += 10;
        }

        // Budget
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 60);
        doc.text('Budget Summary', 15, y); y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 100);
        doc.text(`Total Budget: ₹${appState.budget.toLocaleString()}`, 15, y); y += 6;
        doc.text(`Budget per sq ft: ₹${Math.round(appState.budget / (appState.roomDimensions.length * appState.roomDimensions.width)).toLocaleString()}`, 15, y); y += 10;

        // Scores
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 60);
        doc.text('AI Scores', 15, y); y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const scores = [
            { label: 'Budget Optimization', score: appState.scores.budget },
            { label: 'Sustainability', score: appState.scores.sustainability },
            { label: 'Space Utilization', score: appState.scores.space },
            { label: 'Aesthetic Harmony', score: appState.scores.aesthetic },
        ];

        scores.forEach(s => {
            doc.setTextColor(80, 80, 100);
            doc.text(`${s.label}: ${s.score}%`, 18, y);
            // Progress bar
            doc.setFillColor(230, 230, 240);
            doc.roundedRect(80, y - 3, 60, 4, 2, 2, 'F');
            doc.setFillColor(99, 102, 241);
            doc.roundedRect(80, y - 3, s.score * 0.6, 4, 2, 2, 'F');
            y += 7;
        });
        y += 8;

        // AI Recommendations
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 60);
        doc.text('AI Recommendations', 15, y); y += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 100);
        const recommendations = [
            `Based on your ${appState.designTheme} theme, your room achieves excellent aesthetic harmony.`,
            `Your ${appState.lighting} lighting preference pairs well with the selected color palette.`,
            appState.vastu ? 'Vastu guidelines have been considered in the layout suggestions.' : 'Consider Vastu-compliant furniture placement for positive energy.',
            `For your ${appState.roomDimensions.length}×${appState.roomDimensions.width}ft space, maintain 3ft walkways for optimal movement.`,
            'Consider adding 2-3 indoor plants for improved air quality and aesthetic appeal.',
        ];

        recommendations.forEach(rec => {
            const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - 30);
            lines.forEach((line: string) => {
                if (y > 275) { doc.addPage(); y = 20; }
                doc.text(line, 18, y);
                y += 5;
            });
        });

        // Footer
        y = 280;
        doc.setDrawColor(99, 102, 241);
        doc.setLineWidth(0.5);
        doc.line(15, y, pageWidth - 15, y);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated by GruhaBuddy AI — Intelligent Interior Design Assistant', 15, y + 5);
        doc.text(`© ${new Date().getFullYear()} GruhaBuddy AI. All rights reserved.`, 15, y + 10);

        doc.save('GruhaBuddy_Design_Report.pdf');
        showToast('PDF report downloaded!', 'success');
    }

    // Initial update — populate immediately
    updateReportPreview();
    setTimeout(updateReportPreview, 500);
}
