// ============================================================
//  Main — Game loop and scene manager
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentScene = null;
let lastTime = performance.now();

function changeScene(newScene) {
    if (currentScene && currentScene.onExit) currentScene.onExit();
    currentScene = newScene;
    if (currentScene && currentScene.onEnter) currentScene.onEnter();
}

function gameLoop(now) {
    let dt = (now - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = now;

    // Chat handles its own input first (Ctrl+T to open, typing, etc.)
    if (typeof netChat !== 'undefined') {
        netChat.handleInput();
        // While the player is typing in chat, hide keys from the game so
        // movement/actions don't fire. We blank the pressed/held keys the
        // scene would read this frame.
        if (netChat.isTyping()) {
            for (const k in keys) keys[k] = false;
            for (const k in keysPressed) delete keysPressed[k];
        }
    }

    if (currentScene) {
        if (currentScene.update) currentScene.update(dt);
        if (currentScene.draw) currentScene.draw(ctx);
    }

    // Chat draws on top of the current scene
    if (typeof netChat !== 'undefined') {
        netChat.draw(ctx);
    }

    // Global brightness overlay
    if (typeof displaySettings !== 'undefined' && displaySettings.brightness !== 1.0) {
        if (displaySettings.brightness < 1.0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${1 - displaySettings.brightness})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = `rgba(255, 255, 220, ${(displaySettings.brightness - 1) * 0.3})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    clearFrameInputs();
    requestAnimationFrame(gameLoop);
}

// Wait until all scripts are loaded before starting
window.addEventListener('load', () => {
    if (typeof applyResolution === 'function') applyResolution();

    // If the player already set a name (saved in the browser), skip straight
    // to the menu. Otherwise show the one-time name entry screen first.
    let savedName = null;
    try { savedName = localStorage.getItem('playerName'); } catch (e) {}

    if (savedName && savedName.trim().length > 0) {
        if (typeof netChat !== 'undefined') netChat.myName = savedName;
        changeScene(menuScene);
    } else if (typeof nameEntryScene !== 'undefined') {
        changeScene(nameEntryScene);
    } else {
        changeScene(menuScene);
    }

    requestAnimationFrame(gameLoop);
});