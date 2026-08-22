// ============================================================
// AssetFactory.js - Procedural 3D asset generation
// All assets are generated in code — no external files needed
// ============================================================
const AssetFactory = {

    _geometries: {},
    _materials: {},

    getGeometry(key, createFn) {
        if (!this._geometries[key]) this._geometries[key] = createFn();
        return this._geometries[key];
    },

    getMaterial(key, createFn) {
        if (!this._materials[key]) this._materials[key] = createFn();
        return this._materials[key];
    },

    createGround() {
        const size = CONFIG.WORLD.size * 2;
        const geo = new THREE.PlaneGeometry(size, size, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: CONFIG.WORLD.groundColor });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = false;
        return mesh;
    },

    createGridOverlay() {
        const size = CONFIG.WORLD.size * 2;
        const grid = new THREE.GridHelper(size, 40, 0x00f0ff, 0x1a1a3a);
        grid.material.opacity = 0.15;
        grid.material.transparent = true;
        grid.position.y = 0.01;
        return grid;
    },

    createCrate(x, z) {
        const group = new THREE.Group();
        const geo = this.getGeometry('crate', () => new THREE.BoxGeometry(1.5, 1.5, 1.5));
        const mat = this.getMaterial('crate', () => new THREE.MeshLambertMaterial({ color: 0x8B6914 }));
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.75;
        group.add(mesh);
        const edges = new THREE.EdgesGeometry(geo);
        const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 }));
        wireframe.position.y = 0.75;
        group.add(wireframe);
        group.position.set(x, 0, z);
        group.userData = { type: 'cover', radius: 1.0, height: 1.5 };
        return group;
    },

    createBarrier(x, z, rotY = 0) {
        const group = new THREE.Group();
        const geo = this.getGeometry('barrier', () => new THREE.BoxGeometry(4, 1.2, 0.4));
        const mat = this.getMaterial('barrier', () => new THREE.MeshLambertMaterial({ color: 0x555577 }));
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.6;
        group.add(mesh);
        const edges = new THREE.EdgesGeometry(geo);
        const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.3 }));
        wireframe.position.y = 0.6;
        group.add(wireframe);
        group.position.set(x, 0, z);
        group.rotation.y = rotY;
        group.userData = { type: 'cover', radius: 2.0, height: 1.2, box: true, w: 4, d: 0.4 };
        return group;
    },

    createWall(x, z, w, h = 3, rotY = 0) {
        const group = new THREE.Group();
        const geo = new THREE.BoxGeometry(w, h, 0.5);
        const mat = this.getMaterial('wall', () => new THREE.MeshLambertMaterial({ color: 0x2a2a44 }));
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = h / 2;
        group.add(mesh);
        const edges = new THREE.EdgesGeometry(geo);
        const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00a0ff, transparent: true, opacity: 0.25 }));
        wireframe.position.y = h / 2;
        group.add(wireframe);
        group.position.set(x, 0, z);
        group.rotation.y = rotY;
        group.userData = { type: 'wall', radius: w / 2, height: h, box: true, w: w, d: 0.5 };
        return group;
    },

    createPillar(x, z, color = 0x00f0ff) {
        const group = new THREE.Group();
        const geo = this.getGeometry('pillar', () => new THREE.CylinderGeometry(0.3, 0.3, 6, 8));
        const mat = new THREE.MeshLambertMaterial({ color: 0x222244 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 3;
        group.add(mesh);
        const stripGeo = new THREE.BoxGeometry(0.05, 5, 0.05);
        const stripMat = new THREE.MeshBasicMaterial({ color: color });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.set(0.31, 3, 0);
        group.add(strip);
        const strip2 = strip.clone();
        strip2.position.set(-0.31, 3, 0);
        group.add(strip2);
        group.position.set(x, 0, z);
        group.userData = { type: 'wall', radius: 0.5, height: 6 };
        return group;
    },

    createRamp(x, z, rotY = 0) {
        const group = new THREE.Group();
        const geo = new THREE.BoxGeometry(3, 0.3, 4);
        const mat = this.getMaterial('ramp', () => new THREE.MeshLambertMaterial({ color: 0x444466 }));
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -0.3;
        mesh.position.y = 0.7;
        group.add(mesh);
        group.position.set(x, 0, z);
        group.rotation.y = rotY;
        group.userData = { type: 'cover', radius: 2.0, height: 1.5 };
        return group;
    },

    createCharacterModel(colorScheme) {
        const group = new THREE.Group();
        const bodyGeo = this.getGeometry('char_body', () => new THREE.BoxGeometry(0.6, 0.8, 0.35));
        const bodyMat = this.getMaterial('char_body_' + colorScheme.primary, () => new THREE.MeshLambertMaterial({ color: colorScheme.primary }));
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.0;
        group.add(body);
        const headGeo = this.getGeometry('char_head', () => new THREE.BoxGeometry(0.28, 0.3, 0.28));
        const headMat = this.getMaterial('char_head_' + colorScheme.skin, () => new THREE.MeshLambertMaterial({ color: colorScheme.skin }));
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.55;
        group.add(head);
        const visorGeo = this.getGeometry('char_visor', () => new THREE.BoxGeometry(0.3, 0.1, 0.15));
        const visorMat = this.getMaterial('char_visor', () => new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 1.6, 0.12);
        group.add(visor);
        const armGeo = this.getGeometry('char_arm', () => new THREE.BoxGeometry(0.18, 0.6, 0.18));
        const leftArm = new THREE.Mesh(armGeo, bodyMat);
        leftArm.position.set(-0.4, 1.0, 0);
        group.add(leftArm);
        const rightArm = new THREE.Mesh(armGeo, bodyMat);
        rightArm.position.set(0.4, 1.0, 0);
        group.add(rightArm);
        const legGeo = this.getGeometry('char_leg', () => new THREE.BoxGeometry(0.22, 0.6, 0.22));
        const legMat = this.getMaterial('char_leg_' + colorScheme.secondary, () => new THREE.MeshLambertMaterial({ color: colorScheme.secondary }));
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.15, 0.3, 0);
        group.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.15, 0.3, 0);
        group.add(rightLeg);
        const gunGeo = this.getGeometry('char_gun', () => new THREE.BoxGeometry(0.1, 0.15, 0.6));
        const gunMat = this.getMaterial('char_gun', () => new THREE.MeshLambertMaterial({ color: 0x333333 }));
        const gun = new THREE.Mesh(gunGeo, gunMat);
        gun.position.set(0.35, 1.0, 0.3);
        group.add(gun);
        const lightGeo = this.getGeometry('char_light', () => new THREE.BoxGeometry(0.02, 0.5, 0.02));
        const lightMat = this.getMaterial('char_light_' + colorScheme.accent, () => new THREE.MeshBasicMaterial({ color: colorScheme.accent }));
        const accent1 = new THREE.Mesh(lightGeo, lightMat);
        accent1.position.set(-0.31, 1.0, 0);
        group.add(accent1);
        const accent2 = new THREE.Mesh(lightGeo, lightMat);
        accent2.position.set(0.31, 1.0, 0);
        group.add(accent2);
        group.userData.parts = { body, head, leftArm, rightArm, leftLeg, rightLeg, gun, accent1, accent2 };
        return group;
    },

    createEnemyModel(type) {
        const config = CONFIG.ENEMIES[type];
        const group = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(0.6 * config.scale, 0.8 * config.scale, 0.35 * config.scale);
        const bodyMat = new THREE.MeshLambertMaterial({ color: config.color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.0 * config.scale;
        group.add(body);
        const headGeo = new THREE.BoxGeometry(0.3 * config.scale, 0.3 * config.scale, 0.3 * config.scale);
        const headMat = new THREE.MeshBasicMaterial({ color: config.color });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.55 * config.scale;
        group.add(head);
        const eyeGeo = new THREE.BoxGeometry(0.08, 0.04, 0.02);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.08 * config.scale, 1.58 * config.scale, 0.16 * config.scale);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.08 * config.scale, 1.58 * config.scale, 0.16 * config.scale);
        group.add(rightEye);
        const armGeo = new THREE.BoxGeometry(0.18 * config.scale, 0.55 * config.scale, 0.18 * config.scale);
        const leftArm = new THREE.Mesh(armGeo, bodyMat);
        leftArm.position.set(-0.4 * config.scale, 1.0 * config.scale, 0);
        group.add(leftArm);
        const rightArm = new THREE.Mesh(armGeo, bodyMat);
        rightArm.position.set(0.4 * config.scale, 1.0 * config.scale, 0);
        group.add(rightArm);
        const legGeo = new THREE.BoxGeometry(0.22 * config.scale, 0.6 * config.scale, 0.22 * config.scale);
        const leftLeg = new THREE.Mesh(legGeo, bodyMat);
        leftLeg.position.set(-0.15 * config.scale, 0.3 * config.scale, 0);
        group.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeo, bodyMat);
        rightLeg.position.set(0.15 * config.scale, 0.3 * config.scale, 0);
        group.add(rightLeg);
        const wireGeo = new THREE.EdgesGeometry(bodyGeo);
        const wireMat = new THREE.LineBasicMaterial({ color: config.color, transparent: true, opacity: 0.6 });
        const wire = new THREE.LineSegments(wireGeo, wireMat);
        wire.position.y = 1.0 * config.scale;
        group.add(wire);
        group.userData.parts = { body, head, leftArm, rightArm, leftLeg, rightLeg, leftEye, rightEye, wire };
        group.userData.enemyType = type;
        return group;
    },

    createMuzzleFlash() {
        const geo = new THREE.SphereGeometry(0.15, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(1, 1, 2);
        return mesh;
    },

    createBulletTrail(start, end) {
        const dir = new THREE.Vector3().subVectors(end, start);
        const len = Math.max(0.1, dir.length());
        const geo = new THREE.CylinderGeometry(0.015, 0.015, len, 4);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(start).add(end).multiplyScalar(0.5);
        mesh.lookAt(end);
        mesh.rotateX(Math.PI / 2);
        mesh.userData = { spawnTime: performance.now() };
        return mesh;
    },

    createHitSpark(position, color = 0xff8800) {
        const group = new THREE.Group();
        const count = 5;
        for (let i = 0; i < count; i++) {
            const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
            const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });
            const spark = new THREE.Mesh(geo, mat);
            spark.position.copy(position);
            const angle = (i / count) * Math.PI * 2;
            spark.userData = {
                vx: Math.cos(angle) * 3 + (Math.random() - 0.5) * 2,
                vy: Math.random() * 3 + 1,
                vz: Math.sin(angle) * 3 + (Math.random() - 0.5) * 2,
                spawnTime: performance.now(),
            };
            group.add(spark);
        }
        group.userData = { spawnTime: performance.now(), isSpark: true };
        return group;
    },

    createExplosion(position, scale = 1) {
        const group = new THREE.Group();
        const coreGeo = new THREE.SphereGeometry(0.5 * scale, 8, 8);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 1 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.copy(position);
        group.add(core);
        const ringGeo = new THREE.RingGeometry(0.3 * scale, 0.6 * scale, 12);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(position);
        ring.rotation.x = -Math.PI / 2;
        group.add(ring);
        for (let i = 0; i < 10; i++) {
            const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
            const mat = new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff8800 : 0xff4400, transparent: true });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(position);
            const angle = (i / 10) * Math.PI * 2;
            p.userData = {
                vx: Math.cos(angle) * (4 + Math.random() * 3) * scale,
                vy: Math.random() * 4 + 2,
                vz: Math.sin(angle) * (4 + Math.random() * 3) * scale,
            };
            group.add(p);
        }
        group.userData = { spawnTime: performance.now(), isExplosion: true, core, ring };
        return group;
    },

    createHealthPickup() {
        const group = new THREE.Group();
        const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
        group.add(new THREE.Mesh(geo, mat));
        const vGeo = new THREE.BoxGeometry(0.08, 0.25, 0.42);
        const vMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        group.add(new THREE.Mesh(vGeo, vMat));
        const hGeo = new THREE.BoxGeometry(0.25, 0.08, 0.42);
        group.add(new THREE.Mesh(hGeo, vMat));
        group.userData = { type: 'health', value: 30 };
        return group;
    },

    createAmmoPickup() {
        const group = new THREE.Group();
        const geo = new THREE.BoxGeometry(0.35, 0.3, 0.35);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        group.add(new THREE.Mesh(geo, mat));
        group.userData = { type: 'ammo', value: 60 };
        return group;
    },

    dispose() {
        Object.values(this._geometries).forEach(g => g.dispose());
        Object.values(this._materials).forEach(m => m.dispose());
        this._geometries = {};
        this._materials = {};
    },
};