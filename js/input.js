// ============================================================
//  Input — keyboard and mouse tracking
// ============================================================

const keys = {};          // held keys (WASD movement)
const keysPressed = {};   // keys pressed THIS frame (single-press actions)

const mouse = {
    x: 0,
    y: 0,
    clicked: false,       // LEFT mouse just clicked THIS frame
    down: false,          // LEFT mouse held
    rightClicked: false,  // RIGHT mouse just clicked THIS frame
    rightDown: false,     // RIGHT mouse held (for aim line)
    scroll: 0             // scroll THIS frame: -1 = up, +1 = down, 0 = none
};

// ----- Keyboard -----
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    // T opens the in-game chat (only when chat isn't already capturing input)
    if (key === 't' && !window.netChatTyping) {
        window.netChatOpenRequest = true;
        // don't register 't' as a game key this frame
        return;
    }

    if (!keys[key]) {
        keysPressed[key] = true;
    }
    keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
});

// ----- Mouse -----
window.addEventListener('mousemove', (e) => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});

window.addEventListener('mousedown', (e) => {
    if (e.button === 0) {                // LEFT mouse
        if (!mouse.down) mouse.clicked = true;
        mouse.down = true;
    } else if (e.button === 2) {         // RIGHT mouse
        if (!mouse.rightDown) mouse.rightClicked = true;
        mouse.rightDown = true;
    }
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    else if (e.button === 2) mouse.rightDown = false;
});

// ----- Scroll wheel (weapon switching) -----
window.addEventListener('wheel', (e) => {
    // deltaY > 0 = scrolled down, < 0 = scrolled up
    if (e.deltaY > 0) mouse.scroll = 1;
    else if (e.deltaY < 0) mouse.scroll = -1;
}, { passive: true });

// Prevent the browser right-click menu from popping up over the game
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Called by main.js after each frame — resets per-frame flags
function clearFrameInputs() {
    for (const k in keysPressed) delete keysPressed[k];
    mouse.clicked = false;
    mouse.rightClicked = false;
    mouse.scroll = 0;
}