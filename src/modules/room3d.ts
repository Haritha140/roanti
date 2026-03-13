import * as THREE from 'three';
import { appState, onEvent } from '../main';

export function initRoom3D() {
    const container = document.getElementById('room3d-canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // State — camera is now INSIDE the room, using spherical look-around
    let isNight = false;
    let lookYaw = 0;     // horizontal angle (radians), 0 = looking toward back wall
    let lookPitch = 0;   // vertical angle (radians), 0 = looking level
    let cameraZoom = 75;  // FOV for zoom
    let isDragging = false;
    let lastMX = 0, lastMY = 0;
    let mode: 'rotate' | 'zoom' | 'pan' = 'rotate';
    let cameraPanX = 0;
    let cameraPanY = 0;
    const roomGroup = new THREE.Group();
    const furnitureGroup = new THREE.Group();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.85);
    directionalLight.position.set(6, 10, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;

    const warmLight = new THREE.PointLight(0xF5D49A, 0.6, 15);
    warmLight.position.set(0, 3, 0);
    const coolLight = new THREE.PointLight(0xB4D2E8, 0, 15);
    coolLight.position.set(0, 3, 0);

    // Hemisphere light for better ambient
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    scene.add(ambientLight, directionalLight, warmLight, coolLight);

    // Build room
    buildRoom();
    scene.add(roomGroup);
    scene.add(furnitureGroup);

    updateCameraPosition();

    // Events — rebuild when state changes
    onEvent('colorsChanged', () => { buildRoom(); rebuildFurniture(); });
    onEvent('furnitureChanged', () => { rebuildFurniture(); updateInfo(); });
    onEvent('budgetComplete', () => { buildRoom(); rebuildFurniture(); updateInfo(); });

    // === TOOLBAR BUTTONS ===
    const resetBtn = document.getElementById('room3d-reset');
    const dayNightBtn = document.getElementById('room3d-daynight');
    const fullscreenBtn = document.getElementById('room3d-fullscreen');
    const zoomBtn = document.getElementById('room3d-zoom');
    const rotateBtn = document.getElementById('room3d-rotate');
    const panBtn = document.getElementById('room3d-pan');

    function setActiveMode(btn: HTMLElement | null) {
        [rotateBtn, zoomBtn, panBtn].forEach(b => b?.classList.remove('active'));
        btn?.classList.add('active');
    }

    resetBtn?.addEventListener('click', () => {
        lookYaw = 0; lookPitch = 0; cameraZoom = 75; cameraPanX = 0; cameraPanY = 0;
        camera.fov = cameraZoom;
        camera.updateProjectionMatrix();
        updateCameraPosition();
    });

    dayNightBtn?.addEventListener('click', toggleNight);

    fullscreenBtn?.addEventListener('click', () => {
        if (!document.fullscreenElement) container.requestFullscreen().catch(() => { });
        else document.exitFullscreen();
    });

    // Mode buttons
    rotateBtn?.addEventListener('click', () => { mode = 'rotate'; setActiveMode(rotateBtn); });
    zoomBtn?.addEventListener('click', () => { mode = 'zoom'; setActiveMode(zoomBtn); });
    panBtn?.addEventListener('click', () => { mode = 'pan'; setActiveMode(panBtn); });
    setActiveMode(rotateBtn);

    // Mouse / Touch controls
    container.addEventListener('mousedown', (e) => { isDragging = true; lastMX = e.clientX; lastMY = e.clientY; });
    container.addEventListener('touchstart', (e) => { isDragging = true; lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('touchend', () => isDragging = false);
    container.addEventListener('mousemove', (e) => { if (isDragging) handleDrag(e.clientX, e.clientY); });
    container.addEventListener('touchmove', (e) => { if (isDragging) handleDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        // Scroll wheel = zoom (change FOV)
        cameraZoom = Math.max(30, Math.min(110, cameraZoom + e.deltaY * 0.05));
        camera.fov = cameraZoom;
        camera.updateProjectionMatrix();
    }, { passive: false });

    function handleDrag(mx: number, my: number) {
        const dx = mx - lastMX, dy = my - lastMY;
        lastMX = mx; lastMY = my;

        if (mode === 'rotate') {
            // Drag right = look right, drag left = look left
            lookYaw += dx * 0.004;
            // FIXED: Drag up = look up (pitch increases), drag down = look down (pitch decreases)
            lookPitch += dy * 0.004;
            // Clamp pitch to prevent flipping
            lookPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, lookPitch));
        } else if (mode === 'zoom') {
            cameraZoom = Math.max(30, Math.min(110, cameraZoom - dy * 0.2));
            camera.fov = cameraZoom;
            camera.updateProjectionMatrix();
        } else if (mode === 'pan') {
            cameraPanX += dx * 0.005;
            cameraPanY -= dy * 0.005;
            cameraPanX = Math.max(-1.5, Math.min(1.5, cameraPanX));
            cameraPanY = Math.max(-0.8, Math.min(0.8, cameraPanY));
        }
        updateCameraPosition();
    }

    function updateCameraPosition() {
        const dims = appState.roomDimensions;
        const L = dims.length * 0.3048;
        const W = dims.width * 0.3048;
        const H = dims.height * 0.3048;

        // Camera is positioned INSIDE the room, near the front wall center
        const camX = L / 2 + cameraPanX;
        const camY = H * 0.45 + cameraPanY;    // Eye level ~45% of room height
        const camZ = W * 0.85;                   // Near the front/open side

        camera.position.set(camX, camY, camZ);

        // Look direction from yaw/pitch (spherical coordinates)
        const lookX = camX + Math.sin(lookYaw);
        const lookY = camY - Math.sin(lookPitch);
        const lookZ = camZ - Math.cos(lookYaw);

        camera.lookAt(lookX, lookY, lookZ);
    }

    function toggleNight() {
        isNight = !isNight;
        if (dayNightBtn) dayNightBtn.textContent = isNight ? '☀️' : '🌙';
        if (isNight) {
            ambientLight.intensity = 0.12;
            directionalLight.intensity = 0.08;
            warmLight.intensity = 1.4;
            coolLight.intensity = 0;
            scene.background = new THREE.Color(0x080818);
            renderer.toneMappingExposure = 0.5;
            hemiLight.intensity = 0.05;
        } else {
            ambientLight.intensity = 0.55;
            directionalLight.intensity = 0.85;
            warmLight.intensity = appState.lighting === 'warm' ? 0.8 : 0.3;
            coolLight.intensity = appState.lighting === 'cool' ? 0.5 : 0;
            scene.background = new THREE.Color(0xf0f0f0);
            renderer.toneMappingExposure = 1.0;
            hemiLight.intensity = 0.3;
        }
    }

    function hexToThreeColor(hex: string): THREE.Color {
        return new THREE.Color(hex);
    }

    function buildRoom() {
        roomGroup.clear();
        const dims = appState.roomDimensions;
        const L = dims.length * 0.3048;
        const W = dims.width * 0.3048;
        const H = dims.height * 0.3048;

        // === FLOOR with texture-like pattern ===
        const floorGeo = new THREE.PlaneGeometry(L, W, 20, 20);
        const floorColor = hexToThreeColor(appState.colors.furniture);
        const floorMat = new THREE.MeshStandardMaterial({
            color: floorColor, roughness: 0.35, metalness: 0.05, side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(L / 2, 0, W / 2);
        floor.receiveShadow = true;
        roomGroup.add(floor);

        // Floor grid lines for realism
        const gridHelper = new THREE.GridHelper(Math.max(L, W), Math.round(Math.max(L, W) * 2), 0x333366, 0x222244);
        gridHelper.position.set(L / 2, 0.002, W / 2);
        (gridHelper.material as THREE.Material).opacity = 0.06;
        (gridHelper.material as THREE.Material).transparent = true;
        roomGroup.add(gridHelper);

        // === WALLS (all 4 for 360° view) ===
        const wallMat = new THREE.MeshStandardMaterial({
            color: hexToThreeColor(appState.colors.primaryWall), roughness: 0.8, side: THREE.DoubleSide
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: hexToThreeColor(appState.colors.accentWall), roughness: 0.7, side: THREE.DoubleSide
        });
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: hexToThreeColor(appState.colors.ceiling), roughness: 0.9, side: THREE.DoubleSide
        });

        // Back wall (z=0)
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(L, H), wallMat);
        backWall.position.set(L / 2, H / 2, 0); backWall.receiveShadow = true;
        roomGroup.add(backWall);

        // Left wall (accent, x=0)
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), accentMat);
        leftWall.position.set(0, H / 2, W / 2); leftWall.rotation.y = Math.PI / 2; leftWall.receiveShadow = true;
        roomGroup.add(leftWall);

        // Right wall (x=L)
        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
        rightWall.position.set(L, H / 2, W / 2); rightWall.rotation.y = -Math.PI / 2; rightWall.receiveShadow = true;
        roomGroup.add(rightWall);

        // Front wall (z=W) - with a large opening/door area to see out partially
        const frontWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.3, H), wallMat.clone());
        frontWallLeft.position.set(L * 0.15, H / 2, W);
        frontWallLeft.rotation.y = Math.PI;
        frontWallLeft.receiveShadow = true;
        roomGroup.add(frontWallLeft);

        const frontWallRight = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.3, H), wallMat.clone());
        frontWallRight.position.set(L * 0.85, H / 2, W);
        frontWallRight.rotation.y = Math.PI;
        frontWallRight.receiveShadow = true;
        roomGroup.add(frontWallRight);

        // Front wall top (above opening)
        const frontWallTop = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.4, H * 0.25), wallMat.clone());
        frontWallTop.position.set(L * 0.5, H * 0.875, W);
        frontWallTop.rotation.y = Math.PI;
        roomGroup.add(frontWallTop);

        // Door frame
        const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0xE8E0D0, metalness: 0.1, roughness: 0.4 });
        const doorLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, H * 0.75, 0.1), doorFrameMat);
        doorLeft.position.set(L * 0.3, H * 0.375, W - 0.02); roomGroup.add(doorLeft);
        const doorRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, H * 0.75, 0.1), doorFrameMat);
        doorRight.position.set(L * 0.7, H * 0.375, W - 0.02); roomGroup.add(doorRight);
        const doorTop = new THREE.Mesh(new THREE.BoxGeometry(L * 0.4 + 0.12, 0.06, 0.1), doorFrameMat);
        doorTop.position.set(L * 0.5, H * 0.75, W - 0.02); roomGroup.add(doorTop);

        // === CEILING ===
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(L, W), ceilingMat);
        ceiling.rotation.x = Math.PI / 2; ceiling.position.set(L / 2, H, W / 2);
        roomGroup.add(ceiling);

        // Ceiling light fixture
        const fixtureMat = new THREE.MeshStandardMaterial({ color: 0xF5F5F0, emissive: 0xFFF8E7, emissiveIntensity: 0.2, metalness: 0.4 });
        const fixtureBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), fixtureMat);
        fixtureBase.position.set(L / 2, H - 0.01, W / 2);
        roomGroup.add(fixtureBase);
        const fixtureCone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.2, 0.15, 16, 1, true),
            new THREE.MeshStandardMaterial({ color: 0xF5E6C8, side: THREE.DoubleSide, emissive: 0xF5D49A, emissiveIntensity: 0.3, transparent: true, opacity: 0.85 }));
        fixtureCone.position.set(L / 2, H - 0.1, W / 2);
        roomGroup.add(fixtureCone);

        // === WINDOW (on back wall) ===
        const winW = 1.2, winH = 1.0;
        const windowFrame = new THREE.Mesh(
            new THREE.BoxGeometry(winW + 0.1, winH + 0.1, 0.08),
            new THREE.MeshStandardMaterial({ color: 0xF5F5F0, metalness: 0.3, roughness: 0.4 })
        );
        windowFrame.position.set(L * 0.7, H * 0.55, 0.04); roomGroup.add(windowFrame);

        const windowGlass = new THREE.Mesh(
            new THREE.PlaneGeometry(winW, winH),
            new THREE.MeshStandardMaterial({
                color: isNight ? 0x1a2040 : 0x87CEEB, transparent: true, opacity: 0.4,
                metalness: 0.5, roughness: 0.1, emissive: isNight ? 0x000010 : 0x87CEEB,
                emissiveIntensity: isNight ? 0.1 : 0.08
            })
        );
        windowGlass.position.set(L * 0.7, H * 0.55, 0.05); roomGroup.add(windowGlass);

        // Window crossbars
        const barMat = new THREE.MeshStandardMaterial({ color: 0xE8E0D0 });
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(winW, 0.03, 0.03), barMat);
        hBar.position.set(L * 0.7, H * 0.55, 0.06); roomGroup.add(hBar);
        const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, winH, 0.03), barMat);
        vBar.position.set(L * 0.7, H * 0.55, 0.06); roomGroup.add(vBar);

        // === BASEBOARDS ===
        const bbMat = new THREE.MeshStandardMaterial({ color: 0xE8E8E0, roughness: 0.5 });
        const bb1 = new THREE.Mesh(new THREE.BoxGeometry(L, 0.08, 0.04), bbMat);
        bb1.position.set(L / 2, 0.04, 0.02); roomGroup.add(bb1);
        const bb2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, W), bbMat);
        bb2.position.set(0.02, 0.04, W / 2); roomGroup.add(bb2);
        const bb3 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, W), bbMat);
        bb3.position.set(L - 0.02, 0.04, W / 2); roomGroup.add(bb3);
        const bb4 = new THREE.Mesh(new THREE.BoxGeometry(L, 0.08, 0.04), bbMat);
        bb4.position.set(L / 2, 0.04, W - 0.02); roomGroup.add(bb4);

        // === CROWN MOLDING (top) ===
        const cmMat = new THREE.MeshStandardMaterial({ color: 0xF0EDE8, roughness: 0.5 });
        const cm1 = new THREE.Mesh(new THREE.BoxGeometry(L, 0.06, 0.06), cmMat);
        cm1.position.set(L / 2, H - 0.03, 0.03); roomGroup.add(cm1);
        const cm2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, W), cmMat);
        cm2.position.set(0.03, H - 0.03, W / 2); roomGroup.add(cm2);
        const cm3 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, W), cmMat);
        cm3.position.set(L - 0.03, H - 0.03, W / 2); roomGroup.add(cm3);

        // === WALL ART / PICTURE FRAME (on back wall) ===
        const frameGeo = new THREE.BoxGeometry(0.8, 0.6, 0.03);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.4 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(L * 0.3, H * 0.6, 0.025); roomGroup.add(frame);
        const artMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x6366f1, emissiveIntensity: 0.05 });
        const art = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.52), artMat);
        art.position.set(L * 0.3, H * 0.6, 0.045); roomGroup.add(art);

        // === POWER OUTLET on right wall ===
        const outletMat = new THREE.MeshStandardMaterial({ color: 0xF0F0F0 });
        const outlet = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.06), outletMat);
        outlet.position.set(L - 0.005, 0.3, W * 0.3); outlet.rotation.y = -Math.PI / 2; roomGroup.add(outlet);

        // Lighting preference
        if (appState.lighting === 'warm') { warmLight.intensity = isNight ? 1.4 : 0.8; coolLight.intensity = 0; }
        else if (appState.lighting === 'cool') { warmLight.intensity = isNight ? 0.3 : 0.1; coolLight.intensity = isNight ? 0 : 0.5; }
        else { warmLight.intensity = isNight ? 1.0 : 0.4; coolLight.intensity = isNight ? 0 : 0.2; }
        warmLight.position.set(L / 2, H - 0.3, W / 2);
        coolLight.position.set(L / 2, H - 0.3, W / 2);
    }

    function rebuildFurniture() {
        furnitureGroup.clear();
        const dims = appState.roomDimensions;
        const L = dims.length * 0.3048;
        const W = dims.width * 0.3048;
        const H = dims.height * 0.3048;

        let sofaZ = W * 0.65;
        let tableX = L * 0.5;
        let storageX = L * 0.15;
        let chairX = L * 0.35;
        let plantX = L * 0.1;

        appState.selectedFurniture.forEach(item => {
            const color = hexToThreeColor(item.color || appState.colors.furniture);
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });

            if (item.category === 'bed') {
                addBed(furnitureGroup, mat, L * 0.5, 0, W * 0.3);
            } else if (item.category === 'sofa') {
                if (item.name.includes('Recliner')) {
                    addSofa(furnitureGroup, mat, L * 0.82, 0, W * 0.6);
                } else {
                    addSofa(furnitureGroup, mat, L * 0.5, 0, sofaZ);
                    sofaZ -= 0.5;
                }
            } else if (item.category === 'chair') {
                addSimpleBox(furnitureGroup, mat, chairX, 0.22, W * 0.45 - 0.6, 0.4, 0.04, 0.4);
                chairX += 0.55;
            } else if (item.category === 'table') {
                if (item.name.includes('Coffee') || item.name.includes('Side')) {
                    addCoffeeTable(furnitureGroup, mat, tableX, 0, W * 0.5);
                    tableX += 0.3;
                } else if (item.name.includes('Dining') || item.name.includes('Island')) {
                    addDiningTable(furnitureGroup, mat, L * 0.4, 0, W * 0.45);
                } else if (item.name.includes('Desk') || item.name.includes('Executive')) {
                    addDesk(furnitureGroup, mat, L * 0.5, 0, W * 0.2);
                } else if (item.name.includes('Nightstand')) {
                    addNightstand(furnitureGroup, mat, L * 0.8, 0, W * 0.3);
                } else if (item.name.includes('Dressing')) {
                    addDesk(furnitureGroup, mat, L * 0.2, 0, W * 0.15);
                } else {
                    addCoffeeTable(furnitureGroup, mat, tableX + 1, 0, W * 0.5);
                }
            } else if (item.category === 'lighting') {
                if (item.name.includes('Arc') || item.name.includes('Floor')) {
                    addFloorLamp(furnitureGroup, L * 0.85, 0, W * 0.75);
                } else if (item.name.includes('Pendant')) {
                    addPendantLights(furnitureGroup, L * 0.5, H - 0.4, W * 0.45);
                } else {
                    addTableLamp(furnitureGroup, L * 0.82, 0.55, W * 0.3);
                }
            } else if (item.category === 'storage') {
                if (item.name.includes('TV')) {
                    addTVUnit(furnitureGroup, mat, L * 0.5, 0, 0.25);
                } else if (item.name.includes('Bookshelf') || item.name.includes('Shelf') || item.name.includes('Organizer')) {
                    addBookshelf(furnitureGroup, mat, storageX, 0, W * 0.1);
                    storageX += 0.6;
                } else if (item.name.includes('Wardrobe')) {
                    addWardrobe(furnitureGroup, mat, L * 0.1, 0, W * 0.5);
                } else if (item.name.includes('Cabinet') || item.name.includes('Filing')) {
                    addSimpleBox(furnitureGroup, mat, storageX, 0.33, W * 0.15, 0.4, 0.65, 0.5);
                    storageX += 0.6;
                } else {
                    addSimpleBox(furnitureGroup, mat, storageX, 0.33, W * 0.15, 0.4, 0.65, 0.5);
                    storageX += 0.6;
                }
            } else if (item.category === 'decor') {
                if (item.name.includes('Rug')) {
                    addRug(furnitureGroup, color, L * 0.5, 0.002, W * 0.5);
                } else if (item.name.includes('Plant')) {
                    addPlant(furnitureGroup, plantX, 0, W * 0.75);
                    plantX += 0.4;
                } else if (item.name.includes('Art')) {
                    addWallArt(furnitureGroup, color, L * 0.5);
                } else if (item.name.includes('Mirror')) {
                    addWallArt(furnitureGroup, new THREE.Color(0xd0d8e0), L * 0.25);
                }
            } else if (item.category === 'curtain') {
                addCurtains(furnitureGroup, hexToThreeColor(item.color || '#FFFAF0'), L * 0.7, H);
            }
        });
    }

    // === FURNITURE BUILDERS ===

    function addSimpleBox(group: THREE.Group, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
        mesh.position.set(x, y, z); mesh.castShadow = true;
        group.add(mesh);
    }

    function addSofa(group: THREE.Group, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 0.8), mat.clone());
        seat.position.y = 0.3; seat.castShadow = true; g.add(seat);
        const backMat = mat.clone(); backMat.color.offsetHSL(0, 0, -0.05);
        const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.1), backMat);
        back.position.set(0, 0.6, -0.35); back.castShadow = true; g.add(back);
        const armMat = mat.clone(); armMat.color.offsetHSL(0, 0, -0.08);
        [-0.95, 0.95].forEach(ax => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.8), armMat);
            arm.position.set(ax, 0.45, 0); arm.castShadow = true; g.add(arm);
        });
        const cushMat = mat.clone(); cushMat.color.offsetHSL(0, 0, 0.05);
        for (let i = -1; i <= 1; i++) {
            const c = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.65), cushMat);
            c.position.set(i * 0.65, 0.55, 0.02); c.castShadow = true; g.add(c);
        }
        g.position.set(x, y, z); group.add(g);
    }

    function addBed(group: THREE.Group, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 2.0), mat.clone());
        frame.position.y = 0.2; frame.castShadow = true; g.add(frame);
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 1.9), new THREE.MeshStandardMaterial({ color: 0xF0EDE8, roughness: 0.9 }));
        mattress.position.y = 0.44; g.add(mattress);
        const hbMat = mat.clone(); hbMat.color.offsetHSL(0, 0, -0.1);
        const hb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.08), hbMat);
        hb.position.set(0, 0.7, -0.96); g.add(hb);
        [-0.45, 0.45].forEach(px => {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.35), new THREE.MeshStandardMaterial({ color: 0xFFFAF0, roughness: 0.85 }));
            p.position.set(px, 0.59, -0.65); g.add(p);
        });
        g.position.set(x, y, z); group.add(g);
    }

    function addCoffeeTable(group: THREE.Group, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.5), mat.clone());
        top.position.y = 0.4; top.castShadow = true; g.add(top);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 });
        [[-0.4, -0.22], [0.4, -0.22], [-0.4, 0.22], [0.4, 0.22]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38), legMat);
            leg.position.set(lx, 0.19, lz); g.add(leg);
        });
        g.position.set(x, y, z); group.add(g);
    }

    function addDiningTable(group: THREE.Group, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.9), mat);
        top.position.y = 0.75; top.castShadow = true; g.add(top);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
        [[-0.65, -0.38], [0.65, -0.38], [-0.65, 0.38], [0.65, 0.38]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.73), legMat);
            leg.position.set(lx, 0.365, lz); g.add(leg);
        });
        g.position.set(x, y, z); group.add(g);
    }

    function addDesk(group: THREE.Group, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.7), mat);
        top.position.y = 0.75; top.castShadow = true; g.add(top);
        const drawerMat = mat.clone(); drawerMat.color.offsetHSL(0, 0, -0.05);
        const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.6), drawerMat);
        drawer.position.set(0.45, 0.48, 0); drawer.castShadow = true; g.add(drawer);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
        [[-0.7, -0.3], [-0.7, 0.3]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.73), legMat);
            leg.position.set(lx, 0.365, lz); g.add(leg);
        });
        g.position.set(x, y, z); group.add(g);
    }

    function addNightstand(group: THREE.Group, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.38), mat);
        body.position.y = 0.25; body.castShadow = true; g.add(body);
        const topMat = mat.clone(); topMat.color.offsetHSL(0, 0, 0.05);
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.03, 0.4), topMat);
        top.position.y = 0.515; g.add(top);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.015), new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.8 }));
        handle.position.set(0, 0.25, 0.2); g.add(handle);
        g.position.set(x, y, z); group.add(g);
    }

    function addFloorLamp(group: THREE.Group, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.03), poleMat);
        g.add(base);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6), poleMat);
        pole.position.y = 0.8; g.add(pole);
        const shadeMat = new THREE.MeshStandardMaterial({ color: 0xF5E6C8, side: THREE.DoubleSide, emissive: 0xF5D49A, emissiveIntensity: 0.2 });
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 16, 1, true), shadeMat);
        shade.position.y = 1.6; g.add(shade);
        const light = new THREE.PointLight(0xF5D49A, 0.6, 5);
        light.position.y = 1.5; g.add(light);
        g.position.set(x, y, z); group.add(g);
    }

    function addPendantLights(group: THREE.Group, x: number, y: number, z: number) {
        for (let i = -1; i <= 1; i++) {
            const g = new THREE.Group();
            const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.5), new THREE.MeshStandardMaterial({ color: 0x333333 }));
            wire.position.y = 0.25; g.add(wire);
            const globe = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0xF5E6C8, emissive: 0xF5D49A, emissiveIntensity: 0.4, transparent: true, opacity: 0.8 }));
            g.add(globe);
            const light = new THREE.PointLight(0xF5D49A, 0.4, 4);
            g.add(light);
            g.position.set(x + i * 0.5, y, z);
            group.add(g);
        }
    }

    function addTableLamp(group: THREE.Group, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.03), new THREE.MeshStandardMaterial({ color: 0xB87333, roughness: 0.4, metalness: 0.3 }));
        g.add(base);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3), new THREE.MeshStandardMaterial({ color: 0xB87333 }));
        pole.position.y = 0.15; g.add(pole);
        const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.12, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xF5E6C8, side: THREE.DoubleSide, emissive: 0xF5D49A, emissiveIntensity: 0.3 }));
        shade.position.y = 0.34; g.add(shade);
        const light = new THREE.PointLight(0xF5D49A, 0.3, 3);
        light.position.y = 0.3; g.add(light);
        g.position.set(x, y, z); group.add(g);
    }

    function addTVUnit(group: THREE.Group, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.4), mat);
        body.position.y = 0.2; body.castShadow = true; g.add(body);
        const tv = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.04), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        tv.position.set(0, 0.8, 0); tv.castShadow = true; g.add(tv);
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.65), new THREE.MeshStandardMaterial({ color: 0x1a1a4a, emissive: 0x1a1a4a, emissiveIntensity: 0.15 }));
        screen.position.set(0, 0.8, 0.025); g.add(screen);
        g.position.set(x, y, z); group.add(g);
    }

    function addBookshelf(group: THREE.Group, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number) {
        const g = new THREE.Group();
        [-0.43, 0.43].forEach(sx => {
            const side = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.8, 0.3), mat.clone());
            side.position.set(sx, 0.9, 0); side.castShadow = true; g.add(side);
        });
        for (let i = 0; i < 5; i++) {
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.02, 0.3), mat);
            shelf.position.set(0, 0.02 + i * 0.44, 0); g.add(shelf);
        }
        const bookColors = [0x6366F1, 0xE88E5A, 0x4CAF50, 0xE74C3C, 0x9966CC];
        for (let shelf = 0; shelf < 3; shelf++) {
            for (let b = 0; b < 4; b++) {
                const bh = 0.15 + Math.random() * 0.15;
                const book = new THREE.Mesh(new THREE.BoxGeometry(0.05 + Math.random() * 0.05, bh, 0.2), new THREE.MeshStandardMaterial({ color: bookColors[(shelf * 4 + b) % bookColors.length] }));
                book.position.set(-0.3 + b * 0.2, 0.04 + shelf * 0.44 + bh / 2, 0); book.castShadow = true; g.add(book);
            }
        }
        g.position.set(x, y, z); group.add(g);
    }

    function addWardrobe(group: THREE.Group, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.1, 0.6), mat);
        body.position.y = 1.05; body.castShadow = true; g.add(body);
        const divMat = mat.clone(); divMat.color.offsetHSL(0, 0, -0.05);
        const div = new THREE.Mesh(new THREE.BoxGeometry(0.02, 2.05, 0.62), divMat);
        div.position.y = 1.05; g.add(div);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.8 });
        [-0.05, 0.05].forEach(hx => {
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08), handleMat);
            handle.position.set(hx, 1.05, 0.31); handle.rotation.x = Math.PI / 2; g.add(handle);
        });
        g.position.set(x, y, z); group.add(g);
    }

    function addRug(group: THREE.Group, color: THREE.Color, x: number, y: number, z: number) {
        const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.4), new THREE.MeshStandardMaterial({ color, roughness: 0.95, side: THREE.DoubleSide }));
        rug.rotation.x = -Math.PI / 2; rug.position.set(x, y, z); rug.receiveShadow = true;
        group.add(rug);
    }

    function addPlant(group: THREE.Group, x: number, y: number, z: number) {
        const g = new THREE.Group();
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0xB87333, roughness: 0.5 }));
        pot.position.y = 0.09; pot.castShadow = true; g.add(pot);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a8c3a });
        for (let i = 0; i < 6; i++) {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), leafMat);
            leaf.position.set((Math.random() - 0.5) * 0.15, 0.25 + Math.random() * 0.2, (Math.random() - 0.5) * 0.15);
            leaf.scale.y = 0.7; leaf.castShadow = true; g.add(leaf);
        }
        g.position.set(x, y, z); group.add(g);
    }

    function addWallArt(group: THREE.Group, color: THREE.Color, x: number) {
        const H = appState.roomDimensions.height * 0.3048;
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.03), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5 }));
        frame.position.set(x, H * 0.6, 0.03); group.add(frame);
        const art = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.52), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.08 }));
        art.position.set(x, H * 0.6, 0.05); group.add(art);
    }

    function addCurtains(group: THREE.Group, color: THREE.Color, x: number, h: number) {
        const curtMat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
        const lCurt = new THREE.Mesh(new THREE.PlaneGeometry(0.35, h * 0.55), curtMat);
        lCurt.position.set(x - 0.8, h * 0.42, 0.08); group.add(lCurt);
        const rCurt = new THREE.Mesh(new THREE.PlaneGeometry(0.35, h * 0.55), curtMat);
        rCurt.position.set(x + 0.8, h * 0.42, 0.08); group.add(rCurt);
        const rodMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.7 });
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.0), rodMat);
        rod.rotation.z = Math.PI / 2; rod.position.set(x, h * 0.72, 0.08); group.add(rod);
    }

    // Initial build
    rebuildFurniture();

    // Animation
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
        if (container.clientWidth === 0 || container.clientHeight === 0) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Info display
    function updateInfo() {
        const info = document.getElementById('room3d-info');
        if (info) {
            const { length, width, height } = appState.roomDimensions;
            info.textContent = `${length}×${width}×${height}ft • ${appState.selectedFurniture.length} items • ${appState.lighting} lighting • 🖱️ Drag to look around`;
        }
    }
    updateInfo();
}
