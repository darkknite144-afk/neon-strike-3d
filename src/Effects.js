// ============================================================
// Effects.js - Visual effects manager (muzzle flash, trails, sparks, explosions)
// ============================================================
class EffectsManager {

    constructor(scene) {
        this.scene = scene;
        this.active = [];
    }

    spawnMuzzleFlash(position) {
        const flash = AssetFactory.createMuzzleFlash();
        flash.position.copy(position);
        this.scene.add(flash);
        this.active.push({ mesh: flash, spawnTime: performance.now(), duration: CONFIG.EFFECTS.muzzleFlashDuration * 1000, type: 'flash' });
    }

    spawnBulletTrail(start, end, color = 0x00f0ff) {
        const trail = AssetFactory.createBulletTrail(start, end);
        this.scene.add(trail);
        this.active.push({ mesh: trail, spawnTime: performance.now(), duration: CONFIG.EFFECTS.bulletTrailDuration * 1000, type: 'trail' });
    }

    spawnHitSpark(position, color = 0xff8800) {
        const spark = AssetFactory.createHitSpark(position, color);
        this.scene.add(spark);
        this.active.push({ mesh: spark, spawnTime: performance.now(), duration: CONFIG.EFFECTS.hitSparkDuration * 1000, type: 'spark' });
    }

    spawnExplosion(position, scale = 1) {
        const expl = AssetFactory.createExplosion(position, scale);
        this.scene.add(expl);
        this.active.push({ mesh: expl, spawnTime: performance.now(), duration: CONFIG.EFFECTS.explosionDuration * 1000, type: 'explosion', scale: scale });
    }

    update(dt) {
        const now = performance.now();
        for (let i = this.active.length - 1; i >= 0; i--) {
            const e = this.active[i];
            const age = now - e.spawnTime;
            const progress = age / e.duration;

            if (progress >= 1) {
                this._dispose(e.mesh);
                this.scene.remove(e.mesh);
                this.active.splice(i, 1);
                continue;
            }

            if (e.type === 'flash') {
                e.mesh.material.opacity = 0.9 * (1 - progress);
                e.mesh.scale.setScalar(1 + progress * 0.5);
            } else if (e.type === 'trail') {
                e.mesh.material.opacity = 0.6 * (1 - progress);
            } else if (e.type === 'spark') {
                e.mesh.children.forEach(spark => {
                    spark.position.x += spark.userData.vx * dt;
                    spark.position.y += spark.userData.vy * dt;
                    spark.position.z += spark.userData.vz * dt;
                    spark.userData.vy -= 10 * dt;
                    spark.material.opacity = 1 - progress;
                    spark.material.transparent = true;
                });
            } else if (e.type === 'explosion') {
                const ud = e.mesh.userData;
                if (ud.core) {
                    ud.core.scale.setScalar(1 + progress * 3);
                    ud.core.material.opacity = 1 - progress;
                }
                if (ud.ring) {
                    ud.ring.scale.setScalar(1 + progress * 5);
                    ud.ring.material.opacity = 0.8 * (1 - progress);
                }
                e.mesh.children.forEach(p => {
                    if (p.userData.vx !== undefined) {
                        p.position.x += p.userData.vx * dt;
                        p.position.y += p.userData.vy * dt;
                        p.position.z += p.userData.vz * dt;
                        p.userData.vy -= 15 * dt;
                        p.material.opacity = 1 - progress;
                        p.material.transparent = true;
                    }
                });
            }
        }
    }

    _dispose(mesh) {
        mesh.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
        });
    }

    clear() {
        for (const e of this.active) {
            this._dispose(e.mesh);
            this.scene.remove(e.mesh);
        }
        this.active = [];
    }

    getActiveCount() { return this.active.length; }
}