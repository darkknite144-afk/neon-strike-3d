// ============================================================
// WeaponSystem.js - Player weapon logic
// ============================================================
class WeaponSystem {

    constructor(game) {
        this.game = game;
        this.currentWeapon = 'rifle';
        this.ammo = {};
        this.reserveAmmo = {};
        this.lastFireTime = 0;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.recoilOffset = 0;

        for (const key in CONFIG.WEAPONS) {
            const w = CONFIG.WEAPONS[key];
            this.ammo[key] = w.magSize;
            this.reserveAmmo[key] = w.magSize * 4;
        }
    }

    setWeapon(weaponKey) {
        if (CONFIG.WEAPONS[weaponKey]) {
            this.currentWeapon = weaponKey;
            this.isReloading = false;
            this.reloadTimer = 0;
        }
    }

    getWeaponConfig() { return CONFIG.WEAPONS[this.currentWeapon]; }

    canFire() {
        const w = this.getWeaponConfig();
        const now = performance.now() / 1000;
        if (this.isReloading) return false;
        if (this.ammo[this.currentWeapon] <= 0) { this.startReload(); return false; }
        if (now - this.lastFireTime < w.fireRate) return false;
        return true;
    }

    fire(origin, direction) {
        const w = this.getWeaponConfig();
        if (!this.canFire()) return false;

        this.lastFireTime = performance.now() / 1000;
        this.ammo[this.currentWeapon]--;

        if (this.currentWeapon === 'shotgun') {
            for (let i = 0; i < w.pellets; i++) {
                const dir = direction.clone();
                dir.x += (Math.random() - 0.5) * w.spread;
                dir.y += (Math.random() - 0.5) * w.spread;
                dir.z += (Math.random() - 0.5) * w.spread;
                dir.normalize();
                this._fireBullet(origin, dir, w.damage, w.range);
            }
        } else {
            const dir = direction.clone();
            dir.x += (Math.random() - 0.5) * w.spread;
            dir.y += (Math.random() - 0.5) * w.spread;
            dir.z += (Math.random() - 0.5) * w.spread;
            dir.normalize();
            this._fireBullet(origin, dir, w.damage, w.range);
        }

        this.recoilOffset = w.recoil;
        this.game.effects.spawnMuzzleFlash(origin.clone().add(direction.clone().multiplyScalar(0.5)));

        if (this.ammo[this.currentWeapon] <= 0) this.startReload();
        return true;
    }

    _fireBullet(origin, direction, damage, range) {
        const endPos = origin.clone().add(direction.clone().multiplyScalar(range));

        const hit = this.game.enemyManager.checkHits(origin, direction, range);
        if (hit.enemy) {
            this.game.enemyManager.damageEnemy(hit.enemy, damage, hit.point);
            this.game.effects.spawnHitSpark(hit.point, 0xff8800);
            this.game.showHitMarker();
            endPos.copy(hit.point);
        }

        const wallHit = this.game.arena.checkWallHits(origin, direction, range);
        if (wallHit && wallHit.distance < (hit.enemy ? hit.distance : range)) {
            endPos.copy(wallHit.point);
            this.game.effects.spawnHitSpark(wallHit.point, 0xaaaaaa);
        }

        this.game.effects.spawnBulletTrail(origin, endPos, 0x00f0ff);
    }

    startReload() {
        const w = this.getWeaponConfig();
        if (this.isReloading) return;
        if (this.ammo[this.currentWeapon] >= w.magSize) return;
        if (this.reserveAmmo[this.currentWeapon] <= 0) return;
        this.isReloading = true;
        this.reloadTimer = w.reloadTime;
    }

    update(dt) {
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                const w = this.getWeaponConfig();
                const needed = w.magSize - this.ammo[this.currentWeapon];
                const taken = Math.min(needed, this.reserveAmmo[this.currentWeapon]);
                this.ammo[this.currentWeapon] += taken;
                this.reserveAmmo[this.currentWeapon] -= taken;
                this.isReloading = false;
            }
        }
        this.recoilOffset *= Math.max(0, 1 - dt * 8);
    }

    getAmmo() { return this.ammo[this.currentWeapon]; }
    getReserveAmmo() { return this.reserveAmmo[this.currentWeapon]; }
    getMagSize() { return this.getWeaponConfig().magSize; }
    isReload() { return this.isReloading; }
    getReloadProgress() {
        const w = this.getWeaponConfig();
        return this.isReloading ? 1 - (this.reloadTimer / w.reloadTime) : 1;
    }

    addAmmo(amount) {
        for (const key in this.reserveAmmo) {
            this.reserveAmmo[key] += Math.floor(amount / 4);
        }
    }
}