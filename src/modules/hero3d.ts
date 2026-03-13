import * as THREE from 'three';

export function initHero3D() {
    const container = document.getElementById('hero-3d-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x6366f1, 1.5, 15);
    pointLight.position.set(0, 3, 0);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x8b5cf6, 0.8, 10);
    pointLight2.position.set(-3, 2, -2);
    scene.add(pointLight2);

    // Room group
    const roomGroup = new THREE.Group();

    // Floor
    const floorGeo = new THREE.PlaneGeometry(6, 5);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0xc4a882,
        roughness: 0.4,
        metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Back wall
    const wallGeo = new THREE.PlaneGeometry(6, 3.5);
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0xe8dcd0,
        roughness: 0.8,
        metalness: 0,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 1.75, -2.5);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 3.5),
        new THREE.MeshStandardMaterial({ color: 0xddd0c4, roughness: 0.8 })
    );
    leftWall.position.set(-3, 1.75, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // Sofa
    const sofaGroup = new THREE.Group();

    // Sofa base
    const sofaBaseGeo = new THREE.BoxGeometry(2.4, 0.5, 0.9);
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x4a6741, roughness: 0.7 });
    const sofaBase = new THREE.Mesh(sofaBaseGeo, sofaMat);
    sofaBase.position.y = 0.35;
    sofaBase.castShadow = true;
    sofaGroup.add(sofaBase);

    // Sofa backrest
    const backrestGeo = new THREE.BoxGeometry(2.4, 0.5, 0.15);
    const backrest = new THREE.Mesh(backrestGeo, sofaMat);
    backrest.position.set(0, 0.7, -0.38);
    backrest.castShadow = true;
    sofaGroup.add(backrest);

    // Sofa cushions
    for (let i = -1; i <= 1; i++) {
        const cushionGeo = new THREE.BoxGeometry(0.7, 0.15, 0.7);
        const cushionMat = new THREE.MeshStandardMaterial({ color: 0x5a7a51, roughness: 0.9 });
        const cushion = new THREE.Mesh(cushionGeo, cushionMat);
        cushion.position.set(i * 0.8, 0.67, 0);
        cushion.castShadow = true;
        sofaGroup.add(cushion);
    }

    // Armrests
    [-1.1, 1.1].forEach(x => {
        const armGeo = new THREE.BoxGeometry(0.2, 0.35, 0.9);
        const arm = new THREE.Mesh(armGeo, sofaMat);
        arm.position.set(x, 0.52, 0);
        arm.castShadow = true;
        sofaGroup.add(arm);
    });

    sofaGroup.position.set(0, 0, -1.5);
    roomGroup.add(sofaGroup);

    // Coffee table
    const tableGroup = new THREE.Group();
    const tableTopGeo = new THREE.BoxGeometry(1.2, 0.06, 0.6);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.3, metalness: 0.1 });
    const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
    tableTop.position.y = 0.4;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    // Table legs
    [[-0.5, -0.24], [0.5, -0.24], [-0.5, 0.24], [0.5, 0.24]].forEach(([x, z]) => {
        const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.4);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5 });
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(x, 0.2, z);
        leg.castShadow = true;
        tableGroup.add(leg);
    });

    tableGroup.position.set(0, 0, 0);
    roomGroup.add(tableGroup);

    // Lamp
    const lampGroup = new THREE.Group();
    const lampBaseGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.05);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const lampBase = new THREE.Mesh(lampBaseGeo, lampMat);
    lampGroup.add(lampBase);

    const lampPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5);
    const lampPole = new THREE.Mesh(lampPoleGeo, lampMat);
    lampPole.position.y = 0.75;
    lampGroup.add(lampPole);

    const lampShadeGeo = new THREE.ConeGeometry(0.25, 0.3, 16, 1, true);
    const lampShadeMat = new THREE.MeshStandardMaterial({
        color: 0xf5e6c8,
        side: THREE.DoubleSide,
        emissive: 0xf5d49a,
        emissiveIntensity: 0.3,
    });
    const lampShade = new THREE.Mesh(lampShadeGeo, lampShadeMat);
    lampShade.position.y = 1.5;
    lampGroup.add(lampShade);

    const lampLight = new THREE.PointLight(0xf5d49a, 0.8, 5);
    lampLight.position.y = 1.4;
    lampGroup.add(lampLight);

    lampGroup.position.set(2.2, 0, -1.5);
    roomGroup.add(lampGroup);

    // Rug
    const rugGeo = new THREE.PlaneGeometry(2, 1.5);
    const rugMat = new THREE.MeshStandardMaterial({
        color: 0xd4a574,
        roughness: 0.95,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.005;
    rug.receiveShadow = true;
    roomGroup.add(rug);

    // Wall art (frame)
    const frameGeo = new THREE.BoxGeometry(1.2, 0.8, 0.05);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 2.2, -2.47);
    roomGroup.add(frame);

    const artGeo = new THREE.PlaneGeometry(1.05, 0.65);
    const artMat = new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        emissive: 0x6366f1,
        emissiveIntensity: 0.1,
    });
    const art = new THREE.Mesh(artGeo, artMat);
    art.position.set(0, 2.2, -2.44);
    roomGroup.add(art);

    // Plant
    const potGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.2, 8);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.6 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(-2.3, 0.1, -1.8);
    roomGroup.add(pot);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a8c3a });
    for (let i = 0; i < 5; i++) {
        const leafGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(
            -2.3 + (Math.random() - 0.5) * 0.2,
            0.35 + Math.random() * 0.2,
            -1.8 + (Math.random() - 0.5) * 0.2
        );
        leaf.scale.y = 0.7;
        roomGroup.add(leaf);
    }

    // Add shelves on left wall
    for (let i = 0; i < 2; i++) {
        const shelfGeo = new THREE.BoxGeometry(0.04, 0.8, 0.2);
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x6b5b3a });
        const shelf = new THREE.Mesh(shelfGeo, shelfMat);
        shelf.position.set(-2.97, 1.5 + i * 0.6, -1);
        shelf.castShadow = true;
        roomGroup.add(shelf);
    }

    roomGroup.position.y = -0.5;
    scene.add(roomGroup);

    camera.position.set(3.5, 3, 4);
    camera.lookAt(0, 0.5, -0.5);

    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.005;

        roomGroup.rotation.y = Math.sin(time) * 0.15;
        pointLight.intensity = 1.2 + Math.sin(time * 2) * 0.3;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
