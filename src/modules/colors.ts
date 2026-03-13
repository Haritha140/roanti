import { appState, emitEvent, onEvent } from '../main';

// 120+ color palette
const COLOR_PALETTE: Array<{ name: string; hex: string; category: string }> = [
    // Neutrals
    { name: 'Snow White', hex: '#FFFAFA', category: 'neutrals' },
    { name: 'Ivory', hex: '#FFFFF0', category: 'neutrals' },
    { name: 'Linen', hex: '#FAF0E6', category: 'neutrals' },
    { name: 'Antique White', hex: '#FAEBD7', category: 'neutrals' },
    { name: 'Alabaster', hex: '#F2F0EB', category: 'neutrals' },
    { name: 'Swiss Coffee', hex: '#DDD5C8', category: 'neutrals' },
    { name: 'Pale Oak', hex: '#D5C8B8', category: 'neutrals' },
    { name: 'Agreeable Gray', hex: '#D0C9BD', category: 'neutrals' },
    { name: 'Revere Pewter', hex: '#C4B9A7', category: 'neutrals' },
    { name: 'Accessible Beige', hex: '#C5B9A4', category: 'neutrals' },
    { name: 'Dove Gray', hex: '#B0B0B0', category: 'neutrals' },
    { name: 'Silver Sage', hex: '#B8C4B8', category: 'neutrals' },
    { name: 'Mindful Gray', hex: '#A8A196', category: 'neutrals' },
    { name: 'Classic Gray', hex: '#CDC8C1', category: 'neutrals' },
    { name: 'Warm Gray', hex: '#B8AFA6', category: 'neutrals' },
    { name: 'Repose Gray', hex: '#C2BCB3', category: 'neutrals' },
    { name: 'Edgecomb Gray', hex: '#D4CABC', category: 'neutrals' },
    { name: 'Balboa Mist', hex: '#CFC9BD', category: 'neutrals' },
    { name: 'White Dove', hex: '#F0EDE3', category: 'neutrals' },
    { name: 'Simply White', hex: '#F6F3EC', category: 'neutrals' },

    // Luxury Tones
    { name: 'Champagne', hex: '#F7E7CE', category: 'luxury' },
    { name: 'Rose Gold', hex: '#B76E79', category: 'luxury' },
    { name: 'Midnight Blue', hex: '#191970', category: 'luxury' },
    { name: 'Burgundy', hex: '#800020', category: 'luxury' },
    { name: 'Emerald', hex: '#046A38', category: 'luxury' },
    { name: 'Sapphire', hex: '#0F52BA', category: 'luxury' },
    { name: 'Amethyst', hex: '#9966CC', category: 'luxury' },
    { name: 'Platinum', hex: '#E5E4E2', category: 'luxury' },
    { name: 'Deep Teal', hex: '#005F5F', category: 'luxury' },
    { name: 'Merlot', hex: '#73343A', category: 'luxury' },
    { name: 'Pearl', hex: '#EAE0C8', category: 'luxury' },
    { name: 'Royal Purple', hex: '#7851A9', category: 'luxury' },
    { name: 'Venetian Red', hex: '#C80815', category: 'luxury' },
    { name: 'Charcoal', hex: '#36454F', category: 'luxury' },
    { name: 'Gold Leaf', hex: '#CFB53B', category: 'luxury' },
    { name: 'Mauve Taupe', hex: '#915F6D', category: 'luxury' },
    { name: 'Antique Bronze', hex: '#665D1E', category: 'luxury' },
    { name: 'Obsidian', hex: '#3B3B3B', category: 'luxury' },
    { name: 'Velvet Plum', hex: '#6B3A5B', category: 'luxury' },
    { name: 'Opera Mauve', hex: '#B784A7', category: 'luxury' },

    // Earth Tones
    { name: 'Terracotta', hex: '#CC6B49', category: 'earth' },
    { name: 'Burnt Sienna', hex: '#E97451', category: 'earth' },
    { name: 'Saddle Brown', hex: '#8B4513', category: 'earth' },
    { name: 'Desert Sand', hex: '#EDC9AF', category: 'earth' },
    { name: 'Olive', hex: '#808000', category: 'earth' },
    { name: 'Clay', hex: '#B66A50', category: 'earth' },
    { name: 'Sandstone', hex: '#786D5F', category: 'earth' },
    { name: 'Moss Green', hex: '#8A9A5B', category: 'earth' },
    { name: 'Umber', hex: '#635147', category: 'earth' },
    { name: 'Ochre', hex: '#CC7722', category: 'earth' },
    { name: 'Sienna', hex: '#A0522D', category: 'earth' },
    { name: 'Raw Sienna', hex: '#C87533', category: 'earth' },
    { name: 'Sage', hex: '#87AE73', category: 'earth' },
    { name: 'Khaki', hex: '#C3B091', category: 'earth' },
    { name: 'Russet', hex: '#80461B', category: 'earth' },
    { name: 'Sepia', hex: '#704214', category: 'earth' },
    { name: 'Walnut', hex: '#773F1A', category: 'earth' },
    { name: 'Caramel', hex: '#FFD59A', category: 'earth' },
    { name: 'Cinnamon', hex: '#D2691E', category: 'earth' },
    { name: 'Cedar', hex: '#A0785A', category: 'earth' },

    // Pastels
    { name: 'Blush Pink', hex: '#FFB6C1', category: 'pastels' },
    { name: 'Baby Blue', hex: '#89CFF0', category: 'pastels' },
    { name: 'Mint Green', hex: '#98FF98', category: 'pastels' },
    { name: 'Lavender', hex: '#E6E6FA', category: 'pastels' },
    { name: 'Peach', hex: '#FFDAB9', category: 'pastels' },
    { name: 'Butter Yellow', hex: '#FFFACD', category: 'pastels' },
    { name: 'Lilac', hex: '#C8A2C8', category: 'pastels' },
    { name: 'Powder Blue', hex: '#B0E0E6', category: 'pastels' },
    { name: 'Coral Pink', hex: '#F88379', category: 'pastels' },
    { name: 'Soft Aqua', hex: '#B2DFDB', category: 'pastels' },
    { name: 'Rose Quartz', hex: '#F7CAC9', category: 'pastels' },
    { name: 'Serenity', hex: '#92A8D1', category: 'pastels' },
    { name: 'Pale Dogwood', hex: '#EFCDC1', category: 'pastels' },
    { name: 'Soft Sage', hex: '#C7D3BF', category: 'pastels' },
    { name: 'Misty Rose', hex: '#FFE4E1', category: 'pastels' },
    { name: 'Periwinkle', hex: '#CCCCFF', category: 'pastels' },
    { name: 'Wisteria', hex: '#C9A0DC', category: 'pastels' },
    { name: 'Light Coral', hex: '#F08080', category: 'pastels' },
    { name: 'Pale Turquoise', hex: '#AFEEEE', category: 'pastels' },
    { name: 'Thistle', hex: '#D8BFD8', category: 'pastels' },

    // Vibrant
    { name: 'Electric Blue', hex: '#0892D0', category: 'vibrant' },
    { name: 'Coral', hex: '#FF6F61', category: 'vibrant' },
    { name: 'Sunflower', hex: '#FFDA03', category: 'vibrant' },
    { name: 'Tangerine', hex: '#FF9966', category: 'vibrant' },
    { name: 'Fuchsia', hex: '#FF00FF', category: 'vibrant' },
    { name: 'Lime', hex: '#32CD32', category: 'vibrant' },
    { name: 'Turquoise', hex: '#40E0D0', category: 'vibrant' },
    { name: 'Hot Pink', hex: '#FF69B4', category: 'vibrant' },
    { name: 'Vermillion', hex: '#E34234', category: 'vibrant' },
    { name: 'Cerulean', hex: '#007BA7', category: 'vibrant' },
    { name: 'Teal', hex: '#008080', category: 'vibrant' },
    { name: 'Magenta', hex: '#FF0090', category: 'vibrant' },
    { name: 'Indigo', hex: '#4B0082', category: 'vibrant' },
    { name: 'Chartreuse', hex: '#7FFF00', category: 'vibrant' },
    { name: 'Crimson', hex: '#DC143C', category: 'vibrant' },
    { name: 'Cyan', hex: '#00FFFF', category: 'vibrant' },
    { name: 'Amber', hex: '#FFBF00', category: 'vibrant' },
    { name: 'Vermilion', hex: '#E74C3C', category: 'vibrant' },
    { name: 'Marigold', hex: '#EAA221', category: 'vibrant' },
    { name: 'Cobalt', hex: '#0047AB', category: 'vibrant' },

    // Dark Mode
    { name: 'Jet Black', hex: '#0A0A0A', category: 'dark' },
    { name: 'Onyx', hex: '#181818', category: 'dark' },
    { name: 'Dark Slate', hex: '#2F4F4F', category: 'dark' },
    { name: 'Gunmetal', hex: '#2C3539', category: 'dark' },
    { name: 'Dark Navy', hex: '#0A0E27', category: 'dark' },
    { name: 'Raven', hex: '#1C1C1C', category: 'dark' },
    { name: 'Outer Space', hex: '#414A4C', category: 'dark' },
    { name: 'Ebony', hex: '#2B2B2B', category: 'dark' },
    { name: 'Eclipse', hex: '#3C3B3D', category: 'dark' },
    { name: 'Storm Cloud', hex: '#4F666A', category: 'dark' },
    { name: 'Dark Emerald', hex: '#0A3D0A', category: 'dark' },
    { name: 'Deep Purple', hex: '#1A0A2E', category: 'dark' },
    { name: 'Dark Teal', hex: '#0A3D3D', category: 'dark' },
    { name: 'Midnight', hex: '#1E1E3F', category: 'dark' },
    { name: 'Dark Graphite', hex: '#383838', category: 'dark' },
    { name: 'Raisin Black', hex: '#242124', category: 'dark' },
    { name: 'Dark Olive', hex: '#3C341F', category: 'dark' },
    { name: 'Shadow Blue', hex: '#2A3D5C', category: 'dark' },
    { name: 'Dark Mauve', hex: '#3D2B3D', category: 'dark' },
    { name: 'Phantom', hex: '#292929', category: 'dark' },
];

// Theme presets
const THEME_PRESETS = [
    {
        name: 'Scandinavian Minimal',
        colors: { primaryWall: '#F0EDE3', accentWall: '#B8C4B8', ceiling: '#FFFFFF', furniture: '#C4A882' },
    },
    {
        name: 'Modern Luxury',
        colors: { primaryWall: '#2F4F4F', accentWall: '#CFB53B', ceiling: '#F5F5F5', furniture: '#3B3B3B' },
    },
    {
        name: 'Boho Chic',
        colors: { primaryWall: '#EDC9AF', accentWall: '#CC6B49', ceiling: '#FAF0E6', furniture: '#8B4513' },
    },
    {
        name: 'Industrial',
        colors: { primaryWall: '#B0B0B0', accentWall: '#414A4C', ceiling: '#E5E4E2', furniture: '#36454F' },
    },
    {
        name: 'Japandi',
        colors: { primaryWall: '#F0EDE3', accentWall: '#87AE73', ceiling: '#FAFAFA', furniture: '#786D5F' },
    },
];

// Design theme to color mapping
const DESIGN_THEME_COLORS: Record<string, { primaryWall: string; accentWall: string; ceiling: string; furniture: string }> = {
    'scandinavian': { primaryWall: '#F0EDE3', accentWall: '#B8C4B8', ceiling: '#FFFFFF', furniture: '#C4A882' },
    'modern-luxury': { primaryWall: '#2F4F4F', accentWall: '#CFB53B', ceiling: '#F5F5F5', furniture: '#3B3B3B' },
    'boho': { primaryWall: '#EDC9AF', accentWall: '#CC6B49', ceiling: '#FAF0E6', furniture: '#8B4513' },
    'industrial': { primaryWall: '#B0B0B0', accentWall: '#414A4C', ceiling: '#E5E4E2', furniture: '#36454F' },
    'japandi': { primaryWall: '#F0EDE3', accentWall: '#87AE73', ceiling: '#FAFAFA', furniture: '#786D5F' },
};

let selectedTarget: 'primaryWall' | 'accentWall' | 'ceiling' | 'furniture' = 'primaryWall';

export function initColors() {
    renderPresets();
    renderPalette('all');
    setupColorPickers();
    setupPaletteFilters();
    setupDesignThemes();
    highlightSelectedTarget();
}

function renderPresets() {
    const grid = document.getElementById('preset-grid')!;
    grid.innerHTML = '';

    THEME_PRESETS.forEach((preset, idx) => {
        const card = document.createElement('div');
        card.className = `preset-card${idx === 0 ? ' active' : ''}`;
        card.innerHTML = `
      <span class="preset-name">${preset.name}</span>
      <div class="preset-colors">
        <div class="preset-swatch" style="background:${preset.colors.primaryWall}" title="Primary Wall"></div>
        <div class="preset-swatch" style="background:${preset.colors.accentWall}" title="Accent Wall"></div>
        <div class="preset-swatch" style="background:${preset.colors.ceiling}" title="Ceiling"></div>
        <div class="preset-swatch" style="background:${preset.colors.furniture}" title="Furniture"></div>
      </div>
    `;
        card.addEventListener('click', () => {
            document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            applyPreset(preset);
        });
        grid.appendChild(card);
    });
}

function applyPreset(preset: typeof THEME_PRESETS[0]) {
    appState.colors = { ...preset.colors };
    updateColorUI();
    emitEvent('colorsChanged', appState.colors);
    emitEvent('regenerateDesign');
}

function setupDesignThemes() {
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            const theme = card.getAttribute('data-theme');
            if (!theme) return;

            // Update active state
            document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Update appState
            appState.designTheme = theme;

            // Apply corresponding colors
            const themeColors = DESIGN_THEME_COLORS[theme];
            if (themeColors) {
                appState.colors = { ...themeColors };
                updateColorUI();

                // Also update preset highlight
                document.querySelectorAll('.preset-card').forEach(p => p.classList.remove('active'));
            }

            emitEvent('colorsChanged', appState.colors);
            emitEvent('regenerateDesign');
        });
    });
}

function renderPalette(category: string) {
    const grid = document.getElementById('color-grid')!;
    grid.innerHTML = '';

    const filtered = category === 'all'
        ? COLOR_PALETTE
        : COLOR_PALETTE.filter(c => c.category === category);

    filtered.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = color.hex;
        swatch.setAttribute('data-name', color.name);
        swatch.title = `${color.name} (${color.hex}) → Click to apply to ${selectedTarget}`;

        swatch.addEventListener('click', () => {
            appState.colors[selectedTarget] = color.hex;
            updateColorUI();
            highlightSelectedSwatch(color.hex);
            emitEvent('colorsChanged', appState.colors);
            emitEvent('regenerateDesign');
        });
        grid.appendChild(swatch);
    });
}

function highlightSelectedSwatch(hex: string) {
    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('selected', (s as HTMLElement).style.background === hex);
    });
}

function setupColorPickers() {
    const targets: Array<{ key: 'primaryWall' | 'accentWall' | 'ceiling' | 'furniture'; pickerId: string; hexId: string; previewId: string; cardId: string }> = [
        { key: 'primaryWall', pickerId: 'primary-wall-picker', hexId: 'primary-wall-hex', previewId: 'primary-wall-preview', cardId: 'primary-wall-card' },
        { key: 'accentWall', pickerId: 'accent-wall-picker', hexId: 'accent-wall-hex', previewId: 'accent-wall-preview', cardId: 'accent-wall-card' },
        { key: 'ceiling', pickerId: 'ceiling-picker', hexId: 'ceiling-hex', previewId: 'ceiling-preview', cardId: 'ceiling-card' },
        { key: 'furniture', pickerId: 'furniture-color-picker', hexId: 'furniture-color-hex', previewId: 'furniture-color-preview', cardId: 'furniture-color-card' },
    ];

    targets.forEach(t => {
        const picker = document.getElementById(t.pickerId) as HTMLInputElement;
        const hexInput = document.getElementById(t.hexId) as HTMLInputElement;
        const card = document.getElementById(t.cardId);

        if (card) {
            card.addEventListener('click', (e) => {
                // Don't interfere with the color picker or hex input clicks
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT') return;

                selectedTarget = t.key;
                highlightSelectedTarget();
            });
        }

        if (picker) {
            picker.addEventListener('input', () => {
                appState.colors[t.key] = picker.value;
                hexInput.value = picker.value.toUpperCase();
                (document.getElementById(t.previewId) as HTMLElement).style.background = picker.value;
                emitEvent('colorsChanged', appState.colors);
                emitEvent('regenerateDesign');
            });
        }

        if (hexInput) {
            hexInput.addEventListener('change', () => {
                let val = hexInput.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    appState.colors[t.key] = val;
                    picker.value = val;
                    (document.getElementById(t.previewId) as HTMLElement).style.background = val;
                    emitEvent('colorsChanged', appState.colors);
                    emitEvent('regenerateDesign');
                }
            });
        }
    });
}

function highlightSelectedTarget() {
    document.querySelectorAll('.color-rec-card').forEach(c => c.classList.remove('selected'));
    const map: Record<string, string> = {
        primaryWall: 'primary-wall-card',
        accentWall: 'accent-wall-card',
        ceiling: 'ceiling-card',
        furniture: 'furniture-color-card',
    };
    const cardId = map[selectedTarget];
    if (cardId) {
        document.getElementById(cardId)?.classList.add('selected');
    }

    // Update palette swatch tooltips
    document.querySelectorAll('.color-swatch').forEach(s => {
        const name = s.getAttribute('data-name') || '';
        const hex = (s as HTMLElement).style.background;
        const labels: Record<string, string> = {
            primaryWall: 'Primary Wall',
            accentWall: 'Accent Wall',
            ceiling: 'Ceiling',
            furniture: 'Furniture',
        };
        s.setAttribute('title', `${name} → Apply to ${labels[selectedTarget]}`);
    });
}

function setupPaletteFilters() {
    document.querySelectorAll('.palette-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.palette-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPalette(btn.getAttribute('data-category') || 'all');
        });
    });
}

function updateColorUI() {
    const targets = [
        { key: 'primaryWall' as const, pickerId: 'primary-wall-picker', hexId: 'primary-wall-hex', previewId: 'primary-wall-preview' },
        { key: 'accentWall' as const, pickerId: 'accent-wall-picker', hexId: 'accent-wall-hex', previewId: 'accent-wall-preview' },
        { key: 'ceiling' as const, pickerId: 'ceiling-picker', hexId: 'ceiling-hex', previewId: 'ceiling-preview' },
        { key: 'furniture' as const, pickerId: 'furniture-color-picker', hexId: 'furniture-color-hex', previewId: 'furniture-color-preview' },
    ];

    targets.forEach(t => {
        const picker = document.getElementById(t.pickerId) as HTMLInputElement;
        const hexInput = document.getElementById(t.hexId) as HTMLInputElement;
        const preview = document.getElementById(t.previewId) as HTMLElement;
        if (picker) picker.value = appState.colors[t.key];
        if (hexInput) hexInput.value = appState.colors[t.key].toUpperCase();
        if (preview) preview.style.background = appState.colors[t.key];
    });
}
