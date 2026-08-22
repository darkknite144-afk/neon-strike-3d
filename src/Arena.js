// ============================================================
// Arena.js - Game arena/map with cover, walls, and boundaries
// ============================================================
class Arena {

    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.pickups = [];
        this.mesh = null;
    }

    build() {
        const ground = AssetFactory.createGround();
        this.scene.add(ground);
        const grid = AssetFactory.createGridOverlay();
        this.scene.add(grid);

        const s = CONFIG.WORLD.size;
        const wallH = 4;
        this._addWall(0, -s, s * 2, wallH, 0);
        this._addWall(0, s, s * 2, wallH, 0);
        this._addWall(s, 0, s * 2, wallH, Math.PI / 2);
        this._addWall(-s, 0, s * 2, wallH, Math.PI / 2);

        const corners = [[s-2, s-2], [s-2, -s+2], [-s+2, s-2], [-s+2, -s+2]];
        for (const [x, z] of corners) {
            this.scene.add(AssetFactory.createPillar(x, z, 0x00f0ff));
        }

        this._addCover(0, 0, 'barrier', 0);
        this._addCover(3, 0, 'barrier', Math.PI / 2);
        this._addCover(-3, 0, 'barrier', Math.PI / 2);
        this._addCover(0, 3, 'barrier', 0);
        this._addCover(0, -3, 'barrier', 0);

        const cratePositions = [
            [10, 10], [-10, 10], [10, -10], [-10, -10],
            [15, 0], [-15, 0], [0, 15], [0, -15],
            [7, -12], [-7, 12], [12, 7], [-12, -7],
            [20, 5], [-20, -5], [5, 20], [-5, -20],
        ];
        for (const [x, z] of cratePositions) this._addCover(x, z, 'crate');

        const barrierPositions = [
            [8, 0, 0], [-8, 0, 0], [0, 8, Math.PI/2], [0, -8, Math.PI/2],
            [14, 14, Math.PI/4], [-14, -14, -Math.PI/4],
            [14, -14, -Math.PI/4], [-14, 14, Math.PI/4],
            [6, 18, 0], [-6, -18, 0], [18, 6, Math.PI/2], [-18, -6, Math.PI/2],
            [22, 0, 0], [-22, 0, 0],
        ];
        for (const [x, z, rot] of barrierPositions) this._addCover(x, z, 'barrier', rot);

        this._addCover(5, 5, 'ramp', -Math.PI/4);
        this._addCover(-5, -5, 'ramp', Math.PI*3/4);
        this._addCover(5, -5, 'ramp', Math.PI/4);
        this._addCover(-5, 5, 'ramp', -Math.PI*3/4);

        this._addCover(18, 12, 'crate');
        this._addCover(18, 13, 'crate');
        this._addCover(13, 18, 'crate');
        this._addCover(-18, -12, 'crate');
        this._addCover(-13, -18, 'crate');
    }

    _addWall(x, z, w, h, rotY) {
        const wall = AssetFactory.createWall(x, z, w, h, rotY);
        this.scene.add(wall);
        this.colliders.push({ position: new THREE.Vector3(x, 0, z), radius: w / 2, box: true, w: w, d: 0.5, height: h });
    }

    _addCover(x, z, type, rotY = 0) {
        let mesh, collider;
        if (type === 'crate') {
            mesh = AssetFactory.createCrate(x, z);
            collider = { position: new THREE.Vector3(x, 0, z), radius: 1.0, box: true, w: 1.5, d: 1.5, height: 1.5 };
        } else if (type === 'barrier') {
            mesh = AssetFactory.createBarrier(x, z, rotY);
            collider = { position: new THREE.Vector3(x, 0, z), radius: 2.0, box: true, w: 4, d: 0.4, height: 1.2, rotY: rotY };
        } else if (type === 'ramp') {
            mesh = AssetFactory.createRamp(x, z, rotY);
            collider = { position: new THREE.Vector3(x, 0, z), radius: 2.0, box: true, w: 3, d: 4, height: 1.5, rotY: rotY };
        }
        if (mesh) { this.scene.add(mesh); if (collider) this.colliders.push(collider); }
    }

    resolveCollision(pos, radius) {
        const adjusted = pos.clone();
        for (const c of this.colliders) {
            const dx = adjusted.x - c.position.x;
            const dz = adjusted.z - c.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = c.radius + radius;
            if (dist < minDist && dist > 0.001) {
                adjusted.x = c.position.x + (dx / dist) * minDist;
                adjusted.z = c.position.z + (dz / dist) * minDist;
            }
        }
        const limit = CONFIG.WORLD.size - 2;
        adjusted.x = Math.max(-limit, Math.min(limit, adjusted.x));
        adjusted.z = Math.max(-limit, Math.min(limit, adjusted.z));
        return adjusted;
    }

    checkWallHits(origin, direction, range) {
        let closest = range;
        let hitPoint = null;
        for (const c of this.colliders) {
            if (c.height < 0.5) continue;
            const center = c.position;
            const halfW = (c.w || c.radius) / 2 + 0.1;
            const halfD = (c.d || c.radius) / 2 + 0.1;
            const tx1 = (center.x - halfW - origin.x) / direction.x;
            const tx2 = (center.x + halfW - origin.x) / direction.x;
            const tz1 = (center.z - halfD - origin.z) / direction.z;
            const tz2 = (center.z + halfD - origin.z) / direction.z;
            const tmin = Math.max(Math.min(tx1, tx2), Math.min(tz1, tz2));
            const tmax = Math.min(Math.max(tx1, tx2), Math.max(tz1, tz2));
            if (tmax >= 0 && tmin <= tmax && tmin >= 0 && tmin < closest) {
                closest = tmin;
                hitPoint = origin.clone().add(direction.clone().multiplyScalar(tmin));
            }
        }
        if (hitPoint) return { point: hitPoint, distance: closest };
        return null;
    }

    spawnPickup(position, type) {
        let mesh;
        if (type === 'health') mesh = AssetFactory.createHealthPickup();
        else mesh = AssetFactory.createAmmoPickup();
        mesh.position.copy(position);
        mesh.position.y = 0.8;
        mesh.userData.spawnTime = performance.now();
        mesh.userData.type = type;
        this.scene.add(mesh);
        this.pickups.push(mesh);
    }

    updatePickups(dt, playerPos) {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            p.rotation.y += dt * 2;
            p.position.y = 0.8 + Math.sin(performance.now() * 0.003) * 0.15;
            if (p.position.distanceTo(playerPos) < 1.5) {
                const type = p.userData.type;
                this.scene.remove(p);
                this.pickups.splice(i, 1);
                return type;
            }
        }
        return null;
    }

    clearPickups() {
        for (const p of this.pickups) this.scene.remove(p);
        this.pickups = [];
    }
}