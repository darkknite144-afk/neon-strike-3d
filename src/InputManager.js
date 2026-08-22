// ============================================================
// InputManager.js - Touch + keyboard/mouse input handling
// Handles: left joystick (movement), right drag (camera look),
//          action buttons (fire, reload, jump, skill, aim)
// ============================================================
const InputManager = {

    // State
    move: { x: 0, y: 0 },           // joystick vector (-1..1)
    look: { deltaX: 0, deltaY: 0 },  // camera delta this frame
    fire: false,
    firePressed: false,   // edge-triggered
    reloadPressed: false,
    jumpPressed: false,
    skillPressed: false,
    aim: false,
    pausePressed: false,

    // Internal
    _joystickActive: false,
    _joystickId: null,
    _joystickStart: { x: 0, y: 0 },
    _joystickBase: null,
    _joystickKnob: null,
    _lookActive: false,
    _lookId: null,
    _lookLast: { x: 0, y: 0 },
    _fireBtn: null,
    _fireHeld: false,
    _keys: {},

    init() {
        this._joystickZone = document.getElementById('joystickZone');
        this._joystickBase = document.getElementById('joystickBase');
        this._joystickKnob = document.getElementById('joystickKnob');
        this._fireBtn = document.getElementById('fireBtn');
        this._reloadBtn = document.getElementById('reloadBtn');
        this._jumpBtn = document.getElementById('jumpBtn');
        this._skillBtn = document.getElementById('skillBtn');
        this._aimBtn = document.getElementById('aimBtn');
        this._lookZone = document.getElementById('lookZone');

        if (CONFIG.isTouch) {
            this._setupTouch();
        }
        this._setupKeyboard();

        // Pause button
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.addEventListener('click', () => { this.pausePressed = true; });
    },

    _setupTouch() {
        // ---- Left joystick ----
        this._joystickZone.addEventListener('touchstart', (e) => {
            if (this._joystickActive) return;
            const touch = e.changedTouches[0];
            this._joystickActive = true;
            this._joystickId = touch.identifier;
            this._joystickStart = { x: touch.clientX, y: touch.clientY };
            this._joystickBase.style.display = 'block';
            this._joystickKnob.style.display = 'block';
            this._joystickBase.style.left = (touch.clientX - 55) + 'px';
            this._joystickBase.style.top = (touch.clientY - 55) + 'px';
            this._joystickKnob.style.left = (touch.clientX - 25) + 'px';
            this._joystickKnob.style.top = (touch.clientY - 25) + 'px';
            e.preventDefault();
        }, { passive: false });

        this._joystickZone.addEventListener('touchmove', (e) => {
            if (!this._joystickActive) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this._joystickId) {
                    let dx = touch.clientX - this._joystickStart.x;
                    let dy = touch.clientY - this._joystickStart.y;
                    const maxDist = 55;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > maxDist) {
                        dx = (dx / dist) * maxDist;
                        dy = (dy / dist) * maxDist;
                    }
                    this._joystickKnob.style.left = (this._joystickStart.x + dx - 25) + 'px';
                    this._joystickKnob.style.top = (this._joystickStart.y + dy - 25) + 'px';
                    this.move.x = dx / maxDist;
                    this.move.y = -dy / maxDist; // invert Y
                    break;
                }
            }
            e.preventDefault();
        }, { passive: false });

        const joyEnd = (e) => {
            if (!this._joystickActive) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this._joystickId) {
                    this._joystickActive = false;
                    this._joystickId = null;
                    this.move = { x: 0, y: 0 };
                    this._joystickBase.style.display = 'none';
                    this._joystickKnob.style.display = 'none';
                    break;
                }
            }
        };
        this._joystickZone.addEventListener('touchend', joyEnd);
        this._joystickZone.addEventListener('touchcancel', joyEnd);

        // ---- Right look zone (camera) ----
        this._lookZone.addEventListener('touchstart', (e) => {
            if (this._lookActive) return;
            const touch = e.changedTouches[0];
            this._lookActive = true;
            this._lookId = touch.identifier;
            this._lookLast = { x: touch.clientX, y: touch.clientY };
            e.preventDefault();
        }, { passive: false });

        this._lookZone.addEventListener('touchmove', (e) => {
            if (!this._lookActive) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this._lookId) {
                    this.look.deltaX += (touch.clientX - this._lookLast.x);
                    this.look.deltaY += (touch.clientY - this._lookLast.y);
                    this._lookLast = { x: touch.clientX, y: touch.clientY };
                    break;
                }
            }
            e.preventDefault();
        }, { passive: false });

        const lookEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this._lookId) {
                    this._lookActive = false;
                    this._lookId = null;
                    break;
                }
            }
        };
        this._lookZone.addEventListener('touchend', lookEnd);
        this._lookZone.addEventListener('touchcancel', lookEnd);

        // ---- Action buttons ----
        const setupBtn = (el, onDown, onUp) => {
            el.addEventListener('touchstart', (e) => { onDown(); e.preventDefault(); }, { passive: false });
            el.addEventListener('touchend', (e) => { onUp(); e.preventDefault(); }, { passive: false });
            el.addEventListener('touchcancel', (e) => { onUp(); e.preventDefault(); }, { passive: false });
        };

        setupBtn(this._fireBtn,
            () => { this.fire = true; this.firePressed = true; this._fireHeld = true; this._fireBtn.classList.add('firing'); },
            () => { this.fire = false; this._fireHeld = false; this._fireBtn.classList.remove('firing'); }
        );
        setupBtn(this._reloadBtn, () => { this.reloadPressed = true; }, () => {});
        setupBtn(this._jumpBtn, () => { this.jumpPressed = true; }, () => {});
        setupBtn(this._skillBtn, () => { this.skillPressed = true; }, () => {});
        setupBtn(this._aimBtn,
            () => { this.aim = !this.aim; },
            () => {}
        );
    },

    _setupKeyboard() {
        // Keyboard for desktop testing
        window.addEventListener('keydown', (e) => {
            this._keys[e.code] = true;
            if (e.code === 'Space') this.jumpPressed = true;
            if (e.code === 'KeyR') this.reloadPressed = true;
            if (e.code === 'KeyQ' || e.code === 'KeyE') this.skillPressed = true;
            if (e.code === 'Escape') this.pausePressed = true;
            if (e.code === 'Tab') e.preventDefault();
        });
        window.addEventListener('keyup', (e) => { this._keys[e.code] = false; });

        // Mouse for desktop
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { this.fire = true; this.firePressed = true; } });
        canvas.addEventListener('mouseup', (e) => { if (e.button === 0) this.fire = false; });
        canvas.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === canvas || this._keys['PointerLock']) {
                this.look.deltaX += e.movementX;
                this.look.deltaY += e.movementY;
            }
        });
        canvas.addEventListener('click', () => {
            if (!CONFIG.isTouch && document.pointerLockElement !== canvas) {
                canvas.requestPointerLock();
            }
        });
    },

    // Called at end of each frame to reset edge-triggered inputs
    lateUpdate() {
        this.firePressed = false;
        this.reloadPressed = false;
        this.jumpPressed = false;
        this.skillPressed = false;
        this.pausePressed = false;
        this.look.deltaX = 0;
        this.look.deltaY = 0;
    },

    // Read keyboard movement for desktop
    getKeyboardMove() {
        let x = 0, y = 0;
        if (this._keys['KeyW'] || this._keys['ArrowUp']) y += 1;
        if (this._keys['KeyS'] || this._keys['ArrowDown']) y -= 1;
        if (this._keys['KeyA'] || this._keys['ArrowLeft']) x -= 1;
        if (this._keys['KeyD'] || this._keys['ArrowRight']) x += 1;
        if (x !== 0 || y !== 0) {
            const len = Math.sqrt(x * x + y * y);
            return { x: x / len, y: y / len };
        }
        return null;
    },

    isKeyDown(code) { return !!this._keys[code]; },
};