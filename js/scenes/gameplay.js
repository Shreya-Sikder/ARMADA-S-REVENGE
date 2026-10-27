// ============================================================
//  Gameplay Scene — Multi-room floor 4 with enemies + doors
// ============================================================

// ===== IMAGES =====
const roomImage = new Image();
roomImage.src = 'assets/floor4_room1.png';
let roomImageLoaded = false;
roomImage.onload  = () => { roomImageLoaded = true; };
roomImage.onerror = () => {};

const hallwayImage = new Image();
hallwayImage.src = 'assets/floor4_hallway.png';
let hallwayImageLoaded = false;
hallwayImage.onload = () => { hallwayImageLoaded = true; };
hallwayImage.onerror = () => {};

const a02Image = new Image();
a02Image.src = 'assets/floor4_a02.png';
let a02ImageLoaded = false;
a02Image.onload = () => { a02ImageLoaded = true; };
a02Image.onerror = () => {};

const lobbyImage = new Image();
lobbyImage.src = 'assets/floor4_lobby.png';
let lobbyImageLoaded = false;
lobbyImage.onload = () => { lobbyImageLoaded = true; };
lobbyImage.onerror = () => {};

const kitchenImage = new Image();
kitchenImage.src = 'assets/floor4_kitchen.png';
let kitchenImageLoaded = false;
kitchenImage.onload = () => { kitchenImageLoaded = true; };
kitchenImage.onerror = () => {};

const cellImages = {};
const cellImageLoaded = {};
const CELL_FILES = {
    cell1:   'floor3_prisonCell1.png',
    cell2:   'floor3_prisonCell2.png',
    cell3:   'floor3_prisonCell3.png',
    torture: 'floor3_torture.png'
};
for (const name of Object.keys(CELL_FILES)) {
    const img = new Image();
    cellImageLoaded[name] = false;
    img.onload = () => { cellImageLoaded[name] = true; };
    img.onerror = () => {};
    img.src = 'assets/' + CELL_FILES[name];
    cellImages[name] = img;
}

const diningImage = new Image();
diningImage.src = 'assets/floor3_dinning.png';
let diningImageLoaded = false;
diningImage.onload = () => { diningImageLoaded = true; };
diningImage.onerror = () => {};

const gamesImage = new Image();
gamesImage.src = 'assets/floor3_indoor.png';
let gamesImageLoaded = false;
gamesImage.onload = () => { gamesImageLoaded = true; };
gamesImage.onerror = () => {};

const roofImage = new Image();
roofImage.src = 'assets/roof.png';
let roofImageLoaded = false;
roofImage.onload = () => { roofImageLoaded = true; };
roofImage.onerror = () => {};

const loungeImage = new Image();
loungeImage.src = 'assets/floor4_lounge.png';
let loungeImageLoaded = false;
loungeImage.onload = () => { loungeImageLoaded = true; };
loungeImage.onerror = () => {};

const drawerClosedImage = new Image();
drawerClosedImage.src = 'assets/drawer_closed.png';
let drawerClosedLoaded = false;
drawerClosedImage.onload  = () => { drawerClosedLoaded = true; };
drawerClosedImage.onerror = () => {};

const drawerOpenImage = new Image();
drawerOpenImage.src = 'assets/drawer_open.png';
let drawerOpenLoaded = false;
drawerOpenImage.onload  = () => { drawerOpenLoaded = true; };
drawerOpenImage.onerror = () => {};

// ===== ARMADA SPRITES =====
// Each pose is its own PNG (~600x600). We draw them scaled to a fixed box so
// the slight per-file size differences don't make him jitter.
function loadArmadaSprite(name) {
    const img = new Image();
    img.loadedFlag = false;
    img.onload = () => { img.loadedFlag = true; };
    img.onerror = () => {};
    img.src = 'assets/' + name + '.png';   // set src LAST so onload always fires
    // in case it was cached and loaded synchronously before onload attached
    if (img.complete && img.naturalWidth > 0) img.loadedFlag = true;
    return img;
}
const armadaSprites = {
    idle:        loadArmadaSprite('armada_idle'),
    walk:        [
        loadArmadaSprite('armada_walking1'),
        loadArmadaSprite('armada_walking2'),
        loadArmadaSprite('armada_walking3'),
        loadArmadaSprite('armada_walking4')
    ],
    swing1:      loadArmadaSprite('armada_swing1'),
    swing2:      loadArmadaSprite('armada_swing2'),
    smash:       loadArmadaSprite('armada_smash'),
    neutralized: loadArmadaSprite('armada_neutralized')
};

const shivImage = new Image();
shivImage.src = 'assets/shiv.png';
let shivImageLoaded = false;
shivImage.onload = () => { shivImageLoaded = true; };
shivImage.onerror = () => {};

// ===== LOOT =====
const LOOT_TABLE = [
    { id: 'shard',    name: 'GLASS SHARD', weight: 25 },
    { id: 'cloth',    name: 'CLOTH STRIP', weight: 25 },
    { id: 'alcohol',  name: 'ALCOHOL',     weight: 20 },
    { id: 'bandages', name: 'BANDAGES',    weight: 15 },
    { id: 'scissors', name: 'SCISSORS',    weight: 8  },
    { id: 'medicine', name: 'MEDICINE',    weight: 7  }
];

const AMMO_ENTRY = { id: 'ammo', name: 'ROUNDS', weight: 14 };

function rollLoot(includeAmmo) {
    const table = includeAmmo ? LOOT_TABLE.concat([AMMO_ENTRY]) : LOOT_TABLE;
    const totalWeight = table.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const item of table) {
        roll -= item.weight;
        if (roll <= 0) return item;
    }
    return table[0];
}

// ============================================================
//  TESTING ONLY — set to false before you hand this in.
//  Every locked door opens from the start, so you don't have to
//  replay the whole game after each reload.
// ============================================================
const DEBUG_UNLOCK_ALL = false;

const WEAPON_STATS = {
    shiv:     { range: 205, damage: 1, durabilityMax: 20, speed: 400,  isThrown: true },
    scissors: { range: 250, damage: 1, durabilityMax: 15, speed: 500,  isThrown: true },
    // The guard's sidearm. Durability is rounds — it never breaks, it runs dry.
    pistol:   { range: 780, damage: 2, durabilityMax: 7,  speed: 1000, isThrown: false,
                isGun: true, cooldown: 0.34 },
    // Taken off the cold man. Fires a spread, and cold is what Raymond can't take.
    // In the other locker in the lounge. One shell ends anything it hits, and
    // sends it off its feet.
    shotgun:  { range: 330, damage: 99, durabilityMax: 6, speed: 760, isThrown: false,
                isGun: true, cooldown: 0.9, isSpread: true, isShotgun: true },
    // Taken off the cold man. No magazine — it recharges. One shot shatters
    // whatever it touches, and then you wait eight seconds.
    freezegun:{ range: 430, damage: 99, durabilityMax: 999, speed: 560, isThrown: false,
                isGun: true, cooldown: 8.0, isSpread: true, isFreezeGun: true },
    // Found in a cell. Tap for one, hold for a three-round burst.
    burst:    { range: 760, damage: 2, durabilityMax: 12, speed: 1000, isThrown: false,
                isGun: true, cooldown: 0.26, canBurst: true }
};

// ===== GAMEPLAY SCENE =====
const gameplayScene = {
    // Current room: 'room1' or 'hallway'
    currentRoom: 'room1',

    // ===== ROOM 1 =====
    room1: {
        image: roomImage,
        floorBounds: { x: 80, y: 130, w: 820, h: 425 },
        baseWalls: [
            { x: 0,   y: 0,   w: 960, h: 130 },
            { x: 0,   y: 555, w: 960, h: 45  },
            { x: 0,   y: 0,   w: 80,  h: 600 },
            { x: 900, y: 0,   w: 60,  h: 600 }
        ],
        doorToHallway: { x: 460, y: 130, w: 60, h: 20 }
    },

    // ===== HALLWAY =====
    hallway: {
        image: hallwayImage,
        floorBounds: { x: 45, y: 340, w: 870, h: 225 },
        baseWalls: [
            { x: 0,   y: 0,   w: 960, h: 340 },   // top wall (at the tiled-floor line)
            { x: 0,   y: 565, w: 960, h: 35  },   // bottom edge
            { x: 0,   y: 0,   w: 40,  h: 600 },   // left edge (thin)
            { x: 920, y: 0,   w: 40,  h: 600 }    // right edge (thin)
        ],
        doorA01: { x: 210, y: 280, w: 60, h: 60 },   // left door — back to Room 1
        doorA02: { x: 690, y: 280, w: 60, h: 60 }    // right door — locked
    },

    // ===== A-02 ROOM (behind the locked door) =====
    // Collision is placed ONLY on the furniture pieces, not the whole top wall,
    // so the floor stays open. The outer boundary keeps the player in the room.
    a02: {
        image: a02Image,
        floorBounds: { x: 40, y: 175, w: 880, h: 460 },
        baseWalls: [
            // ----- outer room boundary (thin walls at the very edges) -----
            { x: 0,    y: 0,   w: 430, h: 175 },   // top wall LEFT of door
            { x: 530,  y: 0,   w: 430, h: 175 },   // top wall RIGHT of door
            { x: 0,    y: 630, w: 960, h: 30  },   // bottom edge
            { x: 0,    y: 0,   w: 40,  h: 660 },   // left edge
            { x: 920,  y: 0,   w: 40,  h: 660 },   // right edge

            // ----- furniture collision boxes -----
            { x: 120,  y: 210, w: 150, h: 120 },   // bed (top-left)
            { x: 330,  y: 190, w: 120, h: 90  },   // dresser (top-center-left)
            { x: 720,  y: 195, w: 110, h: 90  },   // wheelchair (center-right)
            { x: 840,  y: 200, w: 80,  h: 95  },   // nightstand (right of wheelchair)
            { x: 40,   y: 350, w: 90,  h: 90  },   // left nightstand
            { x: 100,  y: 440, w: 260, h: 110 },   // operating table (bottom-left)
            { x: 780,  y: 300, w: 140, h: 80  },   // sink counter (right)
            { x: 800,  y: 470, w: 120, h: 130 }    // cabinet + stool (bottom-right)
        ],
        topDoor: { x: 440, y: 60, w: 70, h: 90 }   // exit door (in the top wall gap)
    },

    // ===== LOBBY (Greenvale Asylum reception) — right of the hallway =====
    // Furniture/bodies frame the play area; simple collision + a desk box.
    lobby: {
        image: lobbyImage,
        floorBounds: { x: 55, y: 175, w: 850, h: 480 },
        baseWalls: [
            // thin outer boundary walls, with a GAP in the top wall for each door
            { x: 0,   y: 0,   w: 220, h: 175 },   // top wall: left of A-01
            { x: 320, y: 0,   w: 360, h: 175 },   // top wall: between A-01 and A-02
            { x: 780, y: 0,   w: 180, h: 175 },   // top wall: right of A-02
            { x: 0,   y: 640, w: 960, h: 20  },   // bottom edge
            { x: 0,   y: 0,   w: 55,  h: 660 },   // left edge
            { x: 905, y: 0,   w: 55,  h: 660 },   // right edge
            // reception desk — solid block (center, just under the sign)
            { x: 410, y: 180, w: 150, h: 55 }
        ],
        // exit back to the hallway = the left edge gap
        leftExitZone: { x: 40, y: 380, w: 40, h: 140 },
        // the stairwell down to floor 3 = the matching door in the right wall
        rightExitZone: { x: 880, y: 375, w: 40, h: 150 },
        // top doors (in the wall gaps). A-01 → kitchen; A-02 → locked for now.
        doorA01: { x: 250, y: 90, w: 70, h: 85 },
        doorA02: { x: 700, y: 90, w: 70, h: 85 },
        // Lockers along the LEFT side wall (placeholder). Only ONE hides the doctor.
        lockers: [
            { x: 68, y: 210, w: 44, h: 60, hasDoctor: false },
            { x: 68, y: 285, w: 44, h: 60, hasDoctor: true  },  // doctor's locker (shines)
            { x: 68, y: 360, w: 44, h: 60, hasDoctor: false }
        ]
    },

    // ===== KITCHEN (through the lobby's A-01 door) =====
    // Collision is on individual furniture pieces (not a big top band) so the
    // floor between and below them stays walkable.
    kitchen: {
        image: kitchenImage,
        floorBounds: { x: 60, y: 175, w: 840, h: 415 },
        baseWalls: [
            // thin outer boundary — top wall is a thin strip with a door gap
            { x: 0,   y: 0,   w: 430, h: 175 },   // top wall left of the door
            { x: 530, y: 0,   w: 430, h: 175 },   // top wall right of the door
            { x: 0,   y: 590, w: 960, h: 70  },   // bottom edge
            // (no left/right edge walls — floorBounds keeps the player in,
            //  so the corners stay open and walkable)
            // ----- furniture collision boxes -----
            { x: 250, y: 185, w: 180, h: 80 },    // sink / basin counter (top-left) — stops at the doorway
            { x: 715, y: 185, w: 175, h: 95 },    // stove / range (top-right)
            { x: 360, y: 400, w: 300, h: 85 }     // center prep table (with cleaver)
        ],
        topDoor: { x: 440, y: 60, w: 70, h: 90 }   // "KITCHEN" door (locked for now)
    },

    // ===== DOCTOR'S LOUNGE (through the kitchen's top door, needs Adler's key) =====
    lounge: {
        image: loungeImage,
        floorBounds: { x: 75, y: 160, w: 810, h: 400 },
        baseWalls: [
            // thin top wall with a gap for the door — no side walls, the
            // floorBounds keeps the player in and the corners stay open
            { x: 0,   y: 0,   w: 420, h: 160 },
            { x: 540, y: 0,   w: 420, h: 160 },
            { x: 0,   y: 560, w: 960, h: 60  },
            // the three hospital beds
            { x: 220, y: 235, w: 90, h: 175 },
            { x: 435, y: 235, w: 90, h: 175 },
            { x: 650, y: 235, w: 90, h: 175 }
        ],
        topDoor: { x: 445, y: 60, w: 70, h: 95 },
        // two lockers flanking the door; one holds the confidential file
        lockers: [
            { x: 300, y: 70, w: 44, h: 80, hasFile: false },
            { x: 620, y: 70, w: 44, h: 80, hasFile: true }
        ]
    },

    // ===== THE ROOF (through A-02's top door, needs the guard's key) =====
    // Collision is a plain box for now — tune against the art with H.
    roof: {
        image: roofImage,
        // The tiled area between the parapets. The door is at the TOP, in the
        // stair house.
        floorBounds: { x: 150, y: 150, w: 720, h: 375 },
        baseWalls: [
            // ---- the stair house, split around its door ----
            { x: 300, y: 0,   w: 137, h: 193 },   // left of the door
            { x: 519, y: 0,   w: 106, h: 193 },   // right of the door
            // ---- the two stair housings in the near corners ----
            { x: 0,   y: 320, w: 175, h: 280 },
            { x: 790, y: 320, w: 170, h: 280 },
            // ---- things standing on the roof ----
            { x: 106, y: 108, w: 60,  h: 85 },    // metal cabinet, far left
            { x: 250, y: 135, w: 56,  h: 47 },    // crate leaning on the wall
            { x: 684, y: 108, w: 163, h: 94 },    // the two air-conditioning units
            { x: 606, y: 149, w: 41,  h: 47 },    // barrel
            { x: 628, y: 196, w: 28,  h: 24 },    // small crate beside it
            { x: 306, y: 296, w: 50,  h: 56 },    // low vent block, left of centre
            { x: 562, y: 281, w: 113, h: 88 },    // the big curved duct
            { x: 681, y: 278, w: 69,  h: 85 },    // vent housings beside the duct
            { x: 375, y: 398, w: 44,  h: 71 },    // chimney stack
            { x: 541, y: 422, w: 96,  h: 76 }     // the near air-conditioning unit
        ],
        topDoor: { x: 437, y: 95, w: 82, h: 98 }
    },

    // ===== FLOOR 3: THE CELLS =====
    // Three prison cells and, behind the last door, the torture room.
    // Collision is a plain box for each until the art is in — fit with H.
    cell1: {
        image: cellImages.cell1,
        floorBounds: { x: 135, y: 195, w: 740, h: 250 },
        baseWalls: [
            { x: 0,   y: 0,   w: 960, h: 195 },   // back wall
            { x: 0,   y: 445, w: 960, h: 155 },   // the barred front
            { x: 0,   y: 0,   w: 135, h: 600 },
            { x: 875, y: 0,   w: 85,  h: 600 },
            // ---- what's in here ----
            { x: 135, y: 195, w: 135, h: 195 },   // bunk
            { x: 275, y: 195, w: 70,  h: 45  },   // nightstand
            { x: 284, y: 334, w: 57,  h: 53  },   // stool
            { x: 603, y: 195, w: 78,  h: 70  },   // toilet
            { x: 719, y: 195, w: 62,  h: 18  },   // sink
            { x: 806, y: 243, w: 38,  h: 44  },   // bucket
            { x: 800, y: 331, w: 59,  h: 106 }    // locker
        ]
    },
    cell2: {
        image: cellImages.cell2,
        floorBounds: { x: 135, y: 195, w: 740, h: 250 },
        baseWalls: [
            { x: 0,   y: 0,   w: 960, h: 195 },   // back wall
            { x: 0,   y: 445, w: 960, h: 155 },   // the barred front
            { x: 0,   y: 0,   w: 135, h: 600 },
            { x: 875, y: 0,   w: 85,  h: 600 },
            // ---- what's in here ----
            { x: 135, y: 195, w: 130, h: 190 },   // bunk
            { x: 135, y: 375, w: 40,  h: 70  },   // nightstand, tucked in the near corner
            { x: 284, y: 334, w: 54,  h: 64  },   // stool
            { x: 603, y: 195, w: 78,  h: 70  },   // toilet
            { x: 719, y: 195, w: 62,  h: 18  },   // sink
            { x: 806, y: 246, w: 41,  h: 41  },   // bucket
            { x: 803, y: 331, w: 63,  h: 106 }    // cabinet
        ]
    },
    cell3: {
        image: cellImages.cell3,
        floorBounds: { x: 135, y: 195, w: 740, h: 250 },
        baseWalls: [
            { x: 0,   y: 0,   w: 960, h: 195 },   // back wall
            { x: 0,   y: 445, w: 960, h: 155 },   // the barred front
            { x: 0,   y: 0,   w: 135, h: 600 },
            { x: 875, y: 0,   w: 85,  h: 600 },
            // ---- what's in here ----
            { x: 135, y: 195, w: 130, h: 192 },   // bunk
            { x: 275, y: 195, w: 72,  h: 44  },   // nightstand
            { x: 284, y: 334, w: 57,  h: 56  },   // stool
            { x: 600, y: 195, w: 78,  h: 70  },   // toilet
            { x: 719, y: 195, w: 62,  h: 18  },   // sink
            { x: 806, y: 243, w: 38,  h: 44  },   // bucket
            { x: 803, y: 331, w: 53,  h: 106 }    // cabinet
        ]
    },
    torture: {
        image: cellImages.torture,
        floorBounds: { x: 150, y: 200, w: 660, h: 245 },
        baseWalls: [
            { x: 0,   y: 0,   w: 960, h: 200 },   // back wall
            { x: 0,   y: 445, w: 960, h: 155 },   // the front
            { x: 0,   y: 0,   w: 150, h: 600 },
            { x: 810, y: 0,   w: 150, h: 600 },
            // the table in the middle of the room
            { x: 400, y: 285, w: 165, h: 85 }
        ]
    },

    // ===== FLOOR 3: DINING HALL (through the floor 3 lobby's A-01) =====
    dining: {
        image: diningImage,
        floorBounds: { x: 110, y: 212, w: 750, h: 350 },
        baseWalls: [
            { x: 0,   y: 0,   w: 660, h: 190 },   // back wall, left of the double doors
            { x: 755, y: 0,   w: 205, h: 190 },   // back wall, right of them
            { x: 0,   y: 562, w: 960, h: 40  },
            { x: 0,   y: 0,   w: 110, h: 600 },
            { x: 860, y: 0,   w: 100, h: 600 },
            // the serving counter runs along the back
            { x: 247, y: 150, w: 322, h: 40 },
            // Six tables. The boxes are a slab at each table's base rather than
            // the whole footprint, so you can walk the aisles and pass behind them.
            { x: 200, y: 272, w: 150, h: 62 },
            { x: 450, y: 270, w: 144, h: 62 },
            { x: 668, y: 268, w: 145, h: 62 },
            { x: 156, y: 436, w: 150, h: 62 },
            { x: 406, y: 436, w: 144, h: 62 },
            { x: 650, y: 433, w: 150, h: 62 }
        ],
        // the double doors back to the lobby
        topDoor: { x: 666, y: 95, w: 84, h: 95 }
    },

    // ===== FLOOR 3: INDOOR GAMES (through the floor 3 lobby's A-02) =====
    games: {
        image: gamesImage,
        floorBounds: { x: 110, y: 212, w: 750, h: 333 },
        baseWalls: [
            { x: 0,   y: 0,   w: 960, h: 190 },   // back wall — the door here is scenery
            { x: 0,   y: 545, w: 420, h: 55  },   // front wall, left of the way out
            { x: 500, y: 545, w: 460, h: 55  },   // front wall, right of it
            { x: 0,   y: 0,   w: 110, h: 600 },
            { x: 860, y: 0,   w: 100, h: 600 },
            { x: 431, y: 190, w: 91,  h: 18 },    // coffee table
            { x: 178, y: 217, w: 209, h: 99 },    // pool table
            { x: 559, y: 220, w: 219, h: 85 },    // ping pong table
            { x: 144, y: 396, w: 112, h: 73 },    // card table
            { x: 437, y: 398, w: 88,  h: 65 },    // chess table
            { x: 662, y: 369, w: 169, h: 94 }     // air hockey
        ]
    },

    walls: [],
    door: null,

    player: {
        x: 480, y: 380, w: 28, h: 38,
        speed: 140, facing: 'down',
        frozen: { active: false, progress: 0, timer: 0 },
        hp: 3, maxHp: 3, iframes: 0, stunTimer: 0,
        // dash
        dashTimer: 0,        // counts down while dashing
        dashCooldown: 0,     // small buffer so one press can't burn two dashes
        dashDX: 0, dashDY: 0,
        dashTrail: [],       // afterimages drawn behind the dash
        // stamina: one full bar = 2 dashes, refills over ~4s
        stamina: 100, maxStamina: 100,
        staminaRegenDelay: 0
    },

    equippedWeapon: null,
    weaponDurability: {},
    attackCooldown: 0,
    hitEffects: [],
    projectiles: [],
    bloodStains: [],
    bloodPools: [],
    gibs: [],
    drawers: [],
    items: [],
    inventory: [],
    hasKey: false,
    keySpawned: false,
    letterDropped: false,
    hasLetter: false,
    letterOpen: false,           // is the full-screen letter view showing?
    letterPromptTime: 0,         // countdown for "Press E to read" notice

    // ===== DOCTOR / JORDAN SEQUENCE (lobby) =====
    doctorTriggered: false,      // has the doctor come out of the locker?
    doctorPromptTarget: null,    // the shining locker when player is near it
    jordanAppeared: false,       // has Jordan spawned?
    jordanBannerTime: 0,         // "JORDAN" name banner countdown
    // Dialogue box (line-by-line typewriter)
    dialogue: {
        active: false,
        lines: [
            "Thank god — a living one. Quiet! Keep your voice down.",
            "His name is Jordan. He was a patient here, before whatever they did to him in the labs downstairs.",
            "When he charges — and he will — don't fight it. Use the walls. Let him break himself against them.",
            "I'll help however I can. Don't let him corner you. Now get ready... he's heard us."
        ],
        line: 0,
        charIndex: 0,
        charTimer: 0,
        speaker: "DOCTOR"
    },

    dummy: {
        x: 700, y: 350, w: 40, h: 60,
        hp: 5, maxHp: 5, hitFlash: 0, respawnTimer: 0
    },

    // ===== ARMADA =====
    armada: {
        active: false,
        state: 'idle',
        stateTimer: 0,
        x: 0, y: 0,
        w: 50, h: 68,
        speed: 60,
        facing: 'down',
        hitsTaken: 0,
        hitFlash: 0,
        damageTouchCooldown: 0,
        knockbackX: 0, knockbackY: 0,
        hasHadFirstFight: false,
        entryX: 130,
        entryY: 280,
        wallCracks: [],
        dustParticles: [],
        // sprite animation
        walkFrame: 0,          // which walk frame (0-3)
        walkTimer: 0,          // timer for cycling walk frames
        attackAnimTimer: 0,    // plays the swing→smash sequence on contact
        attackHasHit: false,   // has this swing already dealt its damage?
        moving: false,         // is he moving this frame? (walk vs idle)
        spriteSize: 150,       // on-screen draw size of the sprite box
        // remember his state when Sadid leaves the room
        savedX: 0, savedY: 0, savedState: 'idle',
        room: 'room1'          // the room he's physically in
    },

    // ===== JORDAN (mini-boss, lobby) =====
    jordan: {
        active: false,          // is the fight running?
        x: 480, y: 260,
        w: 52, h: 78,
        facing: 'down',
        // state machine: 'idle' | 'windup' | 'charging' | 'stunned' | 'recover'
        state: 'idle',
        stateTimer: 0,
        speed: 340,             // charge speed (fast, but dodgeable)
        chargeDX: 0, chargeDY: 0,   // locked charge direction
        hitFlash: 0,
        screenShakeOnHit: 0,
        // tuning
        windupTime: 0.8,        // telegraph before a charge
        stunTime: 3.0,          // how long he's stunned after hitting a wall
        recoverTime: 1.0,       // pause between stun ending and next windup
        touchCooldown: 0,       // so a charge only hurts once
        hasHitWall: false,
        throwsLeft: 0,          // weapons remaining in the current volley
        throwTimer: 0,          // countdown between throws in a volley
        // ----- health: 3 big bars, 3 hits each (9 total) -----
        maxBars: 3,
        barsLeft: 3,            // full bars remaining
        hitsInBar: 0,           // hits landed on the bar currently being broken
        hitsPerBar: 3,
        barBreakFlash: 0,       // flashes when a whole bar is broken
        defeated: false,
        // ----- punish for spamming throws while he's up -----
        wastedThrows: 0,        // dodged throws since the last successful stun
        punishTimer: 0,         // counts down while the counter-attack plays
        punishStage: ''         // 'throwback' then 'closing'
    },

    // ===== ARMADA'S PURSUIT =====
    // After the first fight he stops living in Room 1 and hunts you. Linger in
    // a room for 45 seconds and he comes through the door you used.
    pursuit: {
        enabled: false,
        timer: 45,
        warned: false,
        lastRoom: '',
        entryX: 480, entryY: 400
    },

    // ===== ENEMIES =====
    enemies: [],
    enemiesSpawned: false,   // spawn enemies once when first entering hallway
    a02EnemiesSpawned: false,
    a02Cleared: false,       // both knife-throwers dead
    // The guard's perk: hold the attack button to throw three blades at once
    attackHoldTime: 0,
    volleyFired: false,
    volleyChargeTime: 0.5,
    burstLeft: 0, burstTimer: 0,
    freezeFlash: 0,
    frostMotes: [],
    gunKeyHold: 0, gunKeySwapped: false,
    weaponCooldowns: {},        // each weapon cools down on its own clock
    lastGun: 'pistol',          // which pistol the 3 key goes back to
    volleyCost: 50,          // half a stamina bar, same as a dash
    // The guard who was hiding behind A-02's door. His quest:
    //   ''         not met yet
    //   'offered'  he's out, blue marker, waiting to talk
    //   'active'   you've agreed to kill the thing in the ward
    //   'complete' it's dead and you have its letter (next pass)
    //   'joined'   he's travelling with you (later pass)
    guard: { present: false, x: 610, y: 330, walking: false, targetX: 610, targetY: 330 },
    guardQuest: '',
    // The thing in the wall — the guard's quest target, in Room 1.
    // One predictable move: a telegraphed charge. Only hurt while stunned.
    anomaly: {
        active: false,
        x: 130, y: 280, w: 30, h: 34,
        state: 'hidden',        // hidden | emerging | idle | windup | charging | stunned | recover | dead
        stateTimer: 0,
        hp: 3, maxHp: 3,
        speed: 300,
        chargeDX: 0, chargeDY: 0,
        hitFlash: 0,
        touchCooldown: 0,
        windupTime: 1.0,        // longer than Jordan's — this one is meant to be readable
        stunTime: 3.5
    },
    anomalyDead: false,         // killed
    anomalyLetterDropped: false,
    hasAnomalyLetter: false,
    hasRoofKey: false,          // the guard's master key, given when he joins
    roofWaveCleared: false,     // all three waves are done
    roofWave: 0,                // which wave is running (1, 2, 3)
    // Raymond — the man who comes up after the waves, holding Shreya.
    // You cannot beat him. Losing to him is the story.
    raymond: {
        active: false, x: 478, y: 230, w: 34, h: 54,
        state: 'idle', stateTimer: 0,
        hitFlash: 0, staggered: 0,
        shotsLeft: 0, shotTimer: 0,
        dominance: 15,          // he circles you for this long before touching you
        tauntsLeft: 0,
        mode: 'roof',           // 'roof' = the fight you lose, 'rematch' = the real one
        hp: 100, frozen: 0,     // percent, and how long he stays iced
        dashFrom: null, trail: []
    },
    shreya: { present: false, x: 620, y: 220, freed: false },
    raymondScene: { active: false, step: 0, timer: 0, done: false },
    cutsceneLine: '', cutsceneLineTime: 0,
    lightning: [],
    sparks: [],
    guardDead: false,
    hasPistol: false,
    pistolReserve: 0,           // spare rounds in your pockets
    reloadTimer: 0,
    hasKeycard2: false,
    hasF3Key: false,            // opens floor 3's A-02
    f3KeySpawned: false,
    f3HallwayCleared: false,
    f3A02Cleared: false,
    diningWave: 0,              // the ambush in the dining hall
    diningGap: 0,
    f3Hallway2Cleared: false,
    // the tall cabinet in each cell — worth opening
    cellCabinets: {
        cell1:   { x: 800, y: 331, w: 59, h: 106, looted: false },
        cell2:   { x: 803, y: 331, w: 63, h: 106, looted: false },
        cell3:   { x: 803, y: 331, w: 53, h: 106, looted: false },
        torture: { x: 803, y: 331, w: 60, h: 106, looted: false }
    },
    cabinetPromptTarget: null,
    cellsSeen: { cell1: false, cell2: false, cell3: false, torture: false },
    diningCleared: false,
    hasF2Keycard: false,        // found in there — opens the way down to floor 2
    hasShreyaId: false,         // her card, on the table in the torture room
    // What happens the moment you read her card
    shreyaFled: false,          // she is out of your party and behind the door
    tortureLocked: false,       // and the door is shut with you on the wrong side
    tortureCleared: false,
    shreyaConfronted: false,
    // The man with the freeze gun, in the dining hall
    frostStage: '',             // '' | 'clearing' | 'boss' | 'done'
    frostDefeated: false,
    hasFreezeGun: false,
    hasShotgun: false,
    raymondDefeated: false,
    godMode: false,             // DEBUG: P toggles it
    playTime: 0,                // seconds of actual play, for the completion time
    // Raymond's last minute, and what comes through the door after it
    endScene: { active: false, step: 0, timer: 0, done: false },
    thrown: null,               // someone mid-flight across the room
    raymondJoined: false,       // he fights beside you for the last one
    // The last fight: Armada, in the lobby, with Raymond waiting for an opening
    armadaFinal: {
        active: false, hits: 0, cycle: 0, state: '', timer: 0,
        frozen: 0, flash: 0
    },
    HITS_TO_NEUTRALISE: 15,
    finale: { active: false, step: 0, timer: 0, done: false },
    hasExitKey: false,
    // What happened to everyone, told a line at a time on black
    epilogue: { active: false, line: 0, timer: 0, finished: false },
    EPILOGUE_LINES: [
        'You go out through the front door at four in the morning.',
        'Shreya walks ahead of you. She does not run, and she does not look back at the building.',
        'She gives her name to the first officer she sees, and then she gives them everything else.',
        'By sunrise there are twelve vehicles in the courtyard and nobody is allowed back inside.',
        'They find the labs on the second floor. They find the people who were still in them.',
        'The doctor never practises medicine again. He testifies for nine days instead.',
        'Greenvale Asylum is closed within the month. The programme has no name in any of the paperwork.',
        'You write the story. Nobody believes the parts of it that are true.'
    ],
    frost: {
        active: false, x: 480, y: 280, w: 34, h: 48,
        hp: 12, maxHp: 12, state: 'idle', stateTimer: 1.2,
        hitFlash: 0, shotsLeft: 0, shotTimer: 0
    },
    crawlerSpawned: false,      // the thing in cell 3
    crawlerDead: false,
    f2KeycardDropped: false,
    gamesNoteRead: false,
    roofWaveGap: 0,             // breath between waves
    roofWaveBanner: '', roofWaveBannerTime: 0,
    guardShots: [],             // the guard's pistol fire (noise and aggro, no damage)
    guardShotTimer: 0,
    anomalyLetterX: 480, anomalyLetterY: 350,
    anomalyBannerTime: 0,
    roomDrawers: {},         // drawers per room, so opened ones stay opened
    shyEnemiesSpawned: false,
    enemyProjectiles: [],    // knives thrown by ranged enemies

    // ===== SCRIPTED MESSAGE =====
    scriptedMessage: {
        active: false,
        text: "He's a tough son of a bitch. He can't be killed. I need to make a run for it.",
        charIndex: 0, charTimer: 0, holdTimer: 0
    },

    // ===== THE CONVICT'S LETTER (tragic confession) =====
    letterLines: [
        "To my little Nika,",
        "",
        "They gave me paper today. I don't know who to write to.",
        "Everyone I had is gone, and it was me who took them.",
        "",
        "I told myself it was the debt. The men at the door. I told your",
        "mother if she just gave me the money, everything would be fine.",
        "She said no. She was right to say no. I had already lost",
        "everything — I just hadn't lost her yet. So I took that too.",
        "",
        "And then I turned around, and you were standing in the doorway.",
        "You saw. You were seven years old and you saw what your father was.",
        "",
        "I don't remember deciding to do it. I remember your shoes.",
        "The little buckles. I still hear them on the floor at night.",
        "",
        "The doctors here say I scream in my sleep. Good. Let me scream.",
        "Let this place keep me. I don't want to be forgiven. I only want",
        "to hear your shoes one more time, running away from me, still alive.",
        "",
        "                                    — your father,",
        "                              whose sorry means nothing"
    ],

    // ===== HALLWAY MESSAGES =====
    hallwayNotice: '',
    hallwayNoticeTime: 0,

    pickupPromptItem: null,
    drawerPromptTarget: null,
    doorPromptTarget: null,      // which door am I near
    pickupNotice: '', pickupNoticeTime: 0,
    deathStainNotice: '', deathStainNoticeTime: 0,

    // ===== FLASHLIGHT (for the dark kitchen) =====
    hasFlashlight: false,    // handed over by the doctor after Jordan falls
    flashlightOn: false,     // toggled with F
    flashlightAngle: -Math.PI / 2,   // smoothed beam direction (starts pointing up)

    // ===== AFTER JORDAN =====
    hasKitchenKey: false,       // the doctor's key to the kitchen
    postJordanStage: '',        // '' | 'approaching' | 'talked'
    postJordanTimer: 0,
    doctorX: 0, doctorY: 0,     // where the doctor is standing (he walks over)
    doctorWalking: false,
    sideQuestActive: false,     // marker shows over the doctor
    keyOffered: false,          // he's holding the key out, waiting for E
    hasLoungeKey: false,        // taken from the colleague's body in the kitchen
    colleagueFound: false,      // have we discovered the body yet?
    colleagueBody: null,        // {x, y} once the kitchen is entered
    hasFile: false,             // the confidential file from the lounge locker
    fileGiven: false,           // handed to the doctor — ends his quest
    // Who you've recruited, and which one is travelling with you right now.
    // Only one follows at a time — swap them in the inventory's Companions tab.
    companionsRecruited: { doctor: false, guard: false, shreya: false },
    // Where each recruited companion is standing
    followers: {
        doctor: { x: 0, y: 0, room: '', healTimer: 8, healFlash: 0 },
        guard:  { x: 0, y: 0, room: '', healTimer: 8, healFlash: 0 },
        shreya: { x: 0, y: 0, room: '', tazeTimer: 15, tazeFlash: 0 }
    },
    // The companion who's currently following you (position, perk timers)
    companion: {
        active: false,
        x: 0, y: 0,
        room: '',
        healTimer: 8,           // one full bar every 8 seconds while you're hurt
        healFlash: 0
    },
    // Armada's ambush in the lounge, once the file is taken
    ambush: {
        stage: '',          // '' | 'silence' | 'arrived' | 'hunting'
        timer: 0,
        doorX: 480, doorY: 150
    },
    loungeLockerTarget: null,   // locker the player is standing at
    sideQuestNotice: '', sideQuestNoticeTime: 0,
    jackpotFlash: 0, damageFlash: 0, healFlash: 0,

    isDead: false, deathFade: 0, deathTime: 0,

    firstShivCrafted: false,
    armadaIncoming: false,
    armadaIncomingTime: 0,
    armadaWarningFlash: 0,

    screenShake: 0,

    debugMode: false,
    time: 0,
    showExitMessage: false,
    exitMessageTime: 0,

    _returningFromInventory: false,
    _preserveInventoryOnRestart: false,

    // ===== ROOM DATA HELPER =====
    getRoomData() {
        if (this.currentRoom === 'room1') return this.room1;
        if (this.currentRoom === 'hallway') return this.hallway;
        if (this.currentRoom === 'a02') return this.a02;
        if (this.currentRoom === 'kitchen') return this.kitchen;
        if (this.currentRoom === 'lounge') return this.lounge;
        if (this.currentRoom === 'roof') return this.roof;
        if (this.currentRoom === 'f3hallway') return this.f3hallway;
        if (this.currentRoom === 'f3a02') return this.f3a02;
        if (this.currentRoom === 'f3lobby') return this.f3lobby;
        if (this.currentRoom === 'f3hallway2') return this.f3hallway2;
        if (this.currentRoom === 'cell1') return this.cell1;
        if (this.currentRoom === 'cell2') return this.cell2;
        if (this.currentRoom === 'cell3') return this.cell3;
        if (this.currentRoom === 'torture') return this.torture;
        if (this.currentRoom === 'dining') return this.dining;
        if (this.currentRoom === 'games') return this.games;
        return this.lobby;
    },

    onEnter() {
        this.time = 0;

        if (this._returningFromInventory) {
            this._returningFromInventory = false;
            if (this.armadaIncoming && this.armadaIncomingTime > 3.5) {
                this.armadaWarningFlash = 1.0;
            }
            this.autoEquipWeapon();
            if (this.firstShivCrafted && !this.armada.active && this.currentRoom === 'room1') {
                this.spawnArmada();
            }
            this.attackHoldTime = 0;
            this.volleyFired = true;   // wait for a fresh press
            this.autosave();
            return;
        }

        // Full reset
        const respawning = !!this._preserveInventoryOnRestart;
        this.currentRoom = 'room1';
        this.player.x = 480; this.player.y = 380;
        this.player.facing = 'down';
        this.player.hp = this.player.maxHp;
        this.player.iframes = 0;

        if (!this._preserveInventoryOnRestart) {
            this.inventory = [];
            this.weaponDurability = {};
            this.firstShivCrafted = false;
            this.armadaIncoming = false;
            this.armadaIncomingTime = 0;
            this.armada.hasHadFirstFight = false;
            this.hasKey = false;
            this.enemiesSpawned = false;
            this.a02Cleared = false;
            this.roomDrawers = {};
            this.guard = { present: false, x: 610, y: 330, walking: false, targetX: 610, targetY: 330 };
            this.guardQuest = '';
            this.anomalyDead = false;
            this.anomalyLetterDropped = false;
            this.hasAnomalyLetter = false;
            this.hasRoofKey = false;
            this.roofWaveCleared = false;
            this.roofWave = 0;
            this.roofWaveGap = 0;
            this.raymond.active = false;
            this.raymond.state = 'idle';
            this.shreya = { present: false, x: 620, y: 220, freed: false };
            this.raymondScene = { active: false, step: 0, timer: 0, done: false };
            this.lightning = [];
            this.guardDead = false;
            this.hasPistol = false;
            this.pistolReserve = 0;
            this.hasKeycard2 = false;
            this.hasF3Key = false;
            this.f3KeySpawned = false;
            this.f3HallwayCleared = false;
            this.f3A02Cleared = false;
            this.diningWave = 0;
            this.diningCleared = false;
            this.f3Hallway2Cleared = false;
            this.cellsSeen = { cell1: false, cell2: false, cell3: false, torture: false };
            for (const k of Object.keys(this.cellCabinets)) this.cellCabinets[k].looted = false;
            this.hasF2Keycard = false;
            this.hasShreyaId = false;
            this.shreyaFled = false;
            this.tortureLocked = false;
            this.tortureCleared = false;
            this.shreyaConfronted = false;
            this.frostStage = '';
            this.frostDefeated = false;
            this.hasFreezeGun = false;
            this.hasShotgun = false;
            this.raymondDefeated = false;
            this.endScene = { active: false, step: 0, timer: 0, done: false };
            this.thrown = null;
            this.raymondJoined = false;
            this.armadaFinal = { active: false, hits: 0, cycle: 0, state: '', timer: 0,
                                 frozen: 0, flash: 0 };
            this.finale = { active: false, step: 0, timer: 0, done: false };
            this.hasExitKey = false;
            this.epilogue = { active: false, line: 0, timer: 0, finished: false };
            this.playTime = 0;
            this.frost.active = false;
            this.player.frozen = { active: false, progress: 0, timer: 0 };
            this.crawlerSpawned = false;
            this.crawlerDead = false;
            this.player.poison = 0;
            this.f2KeycardDropped = false;
            this.gamesNoteRead = false;
            this.guardShots = [];
            this.anomaly.active = false;
            this.anomaly.state = 'hidden';
            this.keySpawned = false;
            this.a02EnemiesSpawned = false;
            this.letterDropped = false;
            this.hasLetter = false;
            this.doctorTriggered = false;
            this.jordanAppeared = false;
            // story progression — only wiped on a genuinely fresh run, never
            // on respawn, or dying would take your keys away
            this.hasKitchenKey = false;
            this.hasFlashlight = false;
            this.sideQuestActive = false;
            this.keyOffered = false;
            this.hasLoungeKey = false;
            this.colleagueFound = false;
            this.colleagueBody = null;
            this.shyEnemiesSpawned = false;
            this.shyEnemiesSaved = null;
            this.hasFile = false;
            this.fileGiven = false;
            this.followers = {
                doctor: { x: 0, y: 0, room: '', healTimer: 8, healFlash: 0 },
                guard:  { x: 0, y: 0, room: '', healTimer: 8, healFlash: 0 },
                shreya: { x: 0, y: 0, room: '', tazeTimer: 15, tazeFlash: 0 }
            };
            this.companionsRecruited = { doctor: false, guard: false, shreya: false };
            this.ambush = { stage: '', timer: 0, doorX: 480, doorY: 150 };
            for (const lk of this.lounge.lockers) lk.opened = false;
        }
        this.loungeLockerTarget = null;
        this._preserveInventoryOnRestart = false;
        this.letterOpen = false;
        this.letterPromptTime = 0;
        this.dialogue.active = false;
        this.dialogue.line = 0;
        this.dialogue.charIndex = 0;
        this.jordanBannerTime = 0;
        this.jordan.active = false;
        this.jordan.barsLeft = this.jordan.maxBars;
        this.jordan.hitsInBar = 0;
        this.jordan.defeated = false;
        this.jordan.barBreakFlash = 0;
        this.jordan.wastedThrows = 0;
        this.jordan.punishStage = '';
        this.jordan.punishTimer = 0;
        this.player.stunTimer = 0;
        this.player.dashTimer = 0;
        this.player.dashCooldown = 0;
        this.player.dashTrail = [];
        this.player.stamina = this.player.maxStamina;
        this.player.staminaRegenDelay = 0;
        this.postJordanStage = '';
        this.doctorWalking = false;
        this.sideQuestNoticeTime = 0;
        this.goreFinale = null;
        this.ambush = { stage: '', timer: 0, doorX: 480, doorY: 150 };
        this.flashlightOn = false;
        this.jordan.state = 'idle';

        this.equippedWeapon = null;
        this.attackCooldown = 0;
        this.hitEffects = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.items = [];
        this.enemies = [];
        this.pickupPromptItem = null;
        this.drawerPromptTarget = null;
        this.doorPromptTarget = null;
        this.pickupNotice = ''; this.pickupNoticeTime = 0;
        this.hallwayNotice = ''; this.hallwayNoticeTime = 0;
        this.jackpotFlash = 0;
        this.damageFlash = 0; this.healFlash = 0;
        this.armadaWarningFlash = 0;
        this.isDead = false; this.deathFade = 0; this.deathTime = 0;
        this.showExitMessage = false; this.exitMessageTime = 0;
        this.screenShake = 0;

        this.dummy.hp = 0;            // the training dummy is gone
        this.dummy.hitFlash = 0;
        this.dummy.respawnTimer = 999;

        if (respawning && this.pursuit.enabled) {
            // He's still out there hunting. You wake up with a head start —
            // he's nowhere near, and the clock starts again from Room 1.
            this.armada.room = 'away';
            this.armada.state = 'stalking';
            this.armada.stateTimer = 0;
            this.armada.hitsTaken = 0;
            this.armada.hitFlash = 0;
            this.armada.attackAnimTimer = 0;
            this.armada.damageTouchCooldown = 0;
            this.armada.knockbackX = 0;
            this.armada.knockbackY = 0;
            this.pursuit.lastRoom = '';
            this.pursuit.warned = false;
        } else {
            this.armada.active = false;
            this.armada.room = 'room1';
            this.armada.state = 'idle';
            this.armada.stateTimer = 0;
            this.armada.hitsTaken = 0;
            this.armada.hitFlash = 0;
            this.armada.damageTouchCooldown = 0;
            this.armada.knockbackX = 0;
            this.armada.knockbackY = 0;
            this.armada.wallCracks = [];
            this.armada.dustParticles = [];
            this.armada.savedState = 'idle';
            if (!respawning) {
                this.pursuit = { enabled: false, timer: 45, warned: false,
                                 lastRoom: '', entryX: 480, entryY: 400 };
            }
        }

        this.scriptedMessage.active = false;
        this.scriptedMessage.charIndex = 0;
        this.scriptedMessage.charTimer = 0;
        this.scriptedMessage.holdTimer = 0;

        // Room 1's drawers are rolled once and then remembered — dying or
        // walking back in no longer refills them
        if (!this.roomDrawers.room1) {
            this.spawnDrawers();
            this.roomDrawers.room1 = this.drawers;
        } else {
            this.drawers = this.roomDrawers.room1;
        }
        // Floor 3 reuses floor 4's hallway, A-02 and lobby — same building
        if (!this.f3hallway) {
            this.f3hallway = Object.assign({}, this.hallway);
            this.f3a02     = Object.assign({}, this.a02);
            this.f3lobby   = Object.assign({}, this.lobby);
            this.f3hallway2 = Object.assign({}, this.hallway);
        }

        this.rebuildWalls();
        this.autoEquipWeapon();

        // Starting fresh from the menu: if this slot has a saved game, resume it
        if (!respawning) this.loadFromActiveSlot();
        else this.setupAnomaly();   // respawning in Room 1

        if (this.debugUnlockAll) this.unlockEverything();
    },

    onExit() {
        this._returningFromInventory = true;
    },

    // ===== SAVING =====
    // Progress is written into the active slot through saves.js. A slot with a
    // saved state is resumed; a slot without one (a new game) starts fresh.

    getSaveState() {
        const j = this.jordan;
        let shy = null;
        if (this.currentRoom === 'kitchen') shy = this.enemies.filter(e => e.shy);
        else if (this.shyEnemiesSaved) shy = this.shyEnemiesSaved;

        return {
            v: 1,
            room: this.currentRoom,
            px: Math.round(this.player.x),
            py: Math.round(this.player.y),
            hp: this.player.hp,
            maxStamina: this.player.maxStamina,
            inventory: this.inventory.map(i => ({ id: i.id, name: i.name, qty: i.qty })),
            weaponDurability: Object.assign({}, this.weaponDurability),
            equippedWeapon: this.equippedWeapon,
            flags: {
                firstShivCrafted: !!this.firstShivCrafted,
                hasHadFirstFight: !!this.armada.hasHadFirstFight,
                pursuitEnabled: !!this.pursuit.enabled,
                hasKey: !!this.hasKey,
                keySpawned: !!this.keySpawned,
                a02Cleared: !!this.a02Cleared,
                letterDropped: !!this.letterDropped,
                hasLetter: !!this.hasLetter,
                doctorTriggered: !!this.doctorTriggered,
                jordanAppeared: !!this.jordanAppeared,
                jordanDefeated: !!j.defeated,
                postJordanStage: this.postJordanStage || '',
                keyOffered: !!this.keyOffered,
                hasKitchenKey: !!this.hasKitchenKey,
                hasFlashlight: !!this.hasFlashlight,
                sideQuestActive: !!this.sideQuestActive,
                hasLoungeKey: !!this.hasLoungeKey,
                colleagueFound: !!this.colleagueFound,
                hasFile: !!this.hasFile,
                fileGiven: !!this.fileGiven,
                shyEnemiesSpawned: !!this.shyEnemiesSpawned,
                ambushStage: this.ambush.stage || '',
                guardQuest: this.guardQuest || '',
                anomalyDead: !!this.anomalyDead,
                anomalyLetterDropped: !!this.anomalyLetterDropped,
                hasAnomalyLetter: !!this.hasAnomalyLetter,
                hasRoofKey: !!this.hasRoofKey,
                roofWaveCleared: !!this.roofWaveCleared,
                roofWave: this.roofWave || 0,
                hasF3Key: !!this.hasF3Key,
                f3KeySpawned: !!this.f3KeySpawned,
                f3HallwayCleared: !!this.f3HallwayCleared,
                f3A02Cleared: !!this.f3A02Cleared,
                f3Hallway2Cleared: !!this.f3Hallway2Cleared,
                cellsSeen: Object.assign({}, this.cellsSeen),
                cabinetsLooted: Object.keys(this.cellCabinets)
                    .filter(k => this.cellCabinets[k].looted),
                pistolReserve2: this.pistolReserve || 0,
                diningCleared: !!this.diningCleared,
                f2KeycardDropped: !!this.f2KeycardDropped,
                hasF2Keycard: !!this.hasF2Keycard,
                hasShreyaId: !!this.hasShreyaId,
                shreyaFled: !!this.shreyaFled,
                tortureLocked: !!this.tortureLocked,
                tortureCleared: !!this.tortureCleared,
                shreyaConfronted: !!this.shreyaConfronted,
                frostDefeated: !!this.frostDefeated,
                raymondDefeated: !!this.raymondDefeated,
                endSceneDone: !!this.endScene.done,
                raymondJoined: !!this.raymondJoined,
                finaleDone: !!this.finale.done,
                armadaCycle: this.armadaFinal.cycle || 0,
                hasExitKey: !!this.hasExitKey,
                hasFreezeGun: !!this.hasFreezeGun,
                hasShotgun: !!this.hasShotgun,
                playTime: this.playTime || 0,
                crawlerSpawned: !!this.crawlerSpawned,
                crawlerDead: !!this.crawlerDead,
                gamesNoteRead: !!this.gamesNoteRead,
                raymondDone: !!this.raymondScene.done,
                guardDead: !!this.guardDead,
                hasPistol: !!this.hasPistol,
                pistolReserve: this.pistolReserve || 0,
                hasKeycard2: !!this.hasKeycard2,
                shreyaFreed: !!this.shreya.freed
            },
            anomalyLetterX: this.anomalyLetterX, anomalyLetterY: this.anomalyLetterY,
            companionsRecruited: Object.assign({}, this.companionsRecruited),

            doctorX: this.doctorX, doctorY: this.doctorY,
            jordanX: Math.round(j.x), jordanY: Math.round(j.y),
            colleagueBody: this.colleagueBody,
            shy: shy ? shy.map(e => ({
                x: Math.round(e.x), y: Math.round(e.y),
                hp: e.hp, dead: !!e.dead, raged: !!e.raged
            })) : null,
            drawers: this.roomDrawers.room1
                ? this.roomDrawers.room1.map(d => ({ state: d.state, loot: d.loot, isJackpot: d.isJackpot }))
                : null,
            loungeLockers: this.lounge.lockers.map(l => !!l.opened)
        };
    },

    applySaveState(st) {
        if (!st || st.v !== 1) return;
        this._loadingSave = true;
        const f = st.flags || {};

        // ---- what you're carrying ----
        this.inventory = (st.inventory || []).map(i => ({ id: i.id, name: i.name, qty: i.qty }));
        this.weaponDurability = Object.assign({}, st.weaponDurability || {});
        this.equippedWeapon = st.equippedWeapon || null;
        if (typeof st.hp === 'number') {
            this.player.hp = Math.max(0.5, Math.min(this.player.maxHp, st.hp));
        }
        if (typeof st.maxStamina === 'number') {
            this.player.maxStamina = st.maxStamina;
            this.player.stamina = st.maxStamina;
        }

        // ---- the story so far ----
        this.firstShivCrafted = !!f.firstShivCrafted;
        this.armada.hasHadFirstFight = !!f.hasHadFirstFight;
        this.hasKey = !!f.hasKey;
        this.keySpawned = !!f.keySpawned;
        this.a02Cleared = !!f.a02Cleared;
        this.letterDropped = !!f.letterDropped;
        this.hasLetter = !!f.hasLetter;
        this.doctorTriggered = !!f.doctorTriggered;
        this.jordanAppeared = !!f.jordanAppeared;
        this.postJordanStage = f.postJordanStage || '';
        this.keyOffered = !!f.keyOffered;
        this.hasKitchenKey = !!f.hasKitchenKey;
        this.hasFlashlight = !!f.hasFlashlight;
        this.sideQuestActive = !!f.sideQuestActive;
        this.hasLoungeKey = !!f.hasLoungeKey;
        this.colleagueFound = !!f.colleagueFound;
        this.hasFile = !!f.hasFile;
        this.fileGiven = !!f.fileGiven;
        this.shyEnemiesSpawned = !!f.shyEnemiesSpawned;
        this.guardQuest = f.guardQuest || '';
        this.anomalyDead = !!f.anomalyDead;
        this.anomalyLetterDropped = !!f.anomalyLetterDropped;
        this.hasAnomalyLetter = !!f.hasAnomalyLetter;
        this.hasRoofKey = !!f.hasRoofKey;
        this.roofWaveCleared = !!f.roofWaveCleared;
        this.roofWave = f.roofWave || 0;
        this.hasF3Key = !!f.hasF3Key;
        this.f3KeySpawned = !!f.f3KeySpawned;
        this.f3HallwayCleared = !!f.f3HallwayCleared;
        this.f3A02Cleared = !!f.f3A02Cleared;
        this.f3Hallway2Cleared = !!f.f3Hallway2Cleared;
        this.cellsSeen = Object.assign({ cell1: false, cell2: false, cell3: false, torture: false },
                                       st.cellsSeen || {});
        for (const k of Object.keys(this.cellCabinets)) this.cellCabinets[k].looted = false;
        for (const k of (f.cabinetsLooted || [])) {
            if (this.cellCabinets[k]) this.cellCabinets[k].looted = true;
        }
        this.diningCleared = !!f.diningCleared;
        this.f2KeycardDropped = !!f.f2KeycardDropped;
        this.hasF2Keycard = !!f.hasF2Keycard;
        this.hasShreyaId = !!f.hasShreyaId;
        this.shreyaFled = !!f.shreyaFled;
        this.tortureLocked = !!f.tortureLocked;
        this.tortureCleared = !!f.tortureCleared;
        this.shreyaConfronted = !!f.shreyaConfronted;
        this.frostDefeated = !!f.frostDefeated;
        this.raymondDefeated = !!f.raymondDefeated;
        this.endScene = { active: false, step: 0, timer: 0, done: !!f.endSceneDone };
        this.thrown = null;
        this.raymondJoined = !!f.raymondJoined;
        this.finale = { active: false, step: 0, timer: 0, done: !!f.finaleDone };
        this.armadaFinal = { active: false, hits: 0, cycle: f.armadaCycle || 0,
                             state: '', timer: 0, frozen: 0, flash: 0 };
        this.hasExitKey = !!f.hasExitKey;
        this.raymond.mode = 'roof';
        this.raymond.frozen = 0;
        this.hasFreezeGun = !!f.hasFreezeGun;
        this.hasShotgun = !!f.hasShotgun;
        this.playTime = f.playTime || 0;
        this.frost.active = false;
        this.frostStage = this.frostDefeated ? 'done' : '';
        this.player.frozen = { active: false, progress: 0, timer: 0 };
        if (this.shreyaFled && !this.shreyaConfronted) this.companionsRecruited.shreya = false;
        if (this.shreyaConfronted) this.companionsRecruited.shreya = true;
        this.crawlerSpawned = !!f.crawlerSpawned;
        this.crawlerDead = !!f.crawlerDead;
        this.player.poison = 0;
        this.gamesNoteRead = !!f.gamesNoteRead;
        this.guardDead = !!f.guardDead;
        this.hasPistol = !!f.hasPistol;
        this.pistolReserve = f.pistolReserve || 0;
        this.reloadTimer = 0;
        this.hasKeycard2 = !!f.hasKeycard2;
        this.raymondScene = { active: false, step: 0, timer: 0, done: !!f.raymondDone };
        this.shreya = { present: !!f.raymondDone, x: 620, y: 220, freed: !!f.shreyaFreed };
        this.raymond.active = false;
        if (this.guardDead) this.companionsRecruited.guard = false;
        if (this.guardQuest === 'joined') this.hasRoofKey = true;   // he gave it when he joined
        if (typeof st.anomalyLetterX === 'number') {
            this.anomalyLetterX = st.anomalyLetterX;
            this.anomalyLetterY = st.anomalyLetterY;
        }
        // holding its letter means that step is done, even in an older save
        if (this.hasAnomalyLetter && this.guardQuest === 'active') this.guardQuest = 'complete';
        // A-02 cleared means the guard is out — standing at his spot, not
        // mid-walk. This also covers saves made before he existed.
        if (this.a02Cleared) {
            this.guard = { present: true, x: 610, y: 330, walking: false, targetX: 610, targetY: 330 };
            if (!this.guardQuest) this.guardQuest = 'offered';
        }
        if (typeof st.doctorX === 'number') {
            this.doctorX = st.doctorX;
            this.doctorY = st.doctorY;
        }
        this.colleagueBody = st.colleagueBody || null;
        this.shyEnemiesSaved = st.shy
            ? st.shy.map(d => Object.assign(this.makeShyEnemy(d.x, d.y), {
                  hp: d.hp, dead: d.dead, raged: d.raged, deathAnim: d.dead ? 5 : 0
              }))
            : null;
        if (st.loungeLockers) {
            st.loungeLockers.forEach((o, i) => {
                if (this.lounge.lockers[i]) this.lounge.lockers[i].opened = o;
            });
        }
        if (st.drawers && this.roomDrawers.room1) {
            st.drawers.forEach((d, i) => {
                const dr = this.roomDrawers.room1[i];
                if (!dr) return;
                dr.state = d.state;
                dr.loot = d.loot;
                dr.isJackpot = d.isJackpot;
            });
        }

        // ---- repair anything that was saved halfway through a scene ----
        // the doctor's first conversation was cut off before Jordan appeared
        if (this.doctorTriggered && !this.jordanAppeared) this.doctorTriggered = false;
        // he'd finished speaking but hadn't held the key out yet
        if (this.postJordanStage === 'talked' && !this.keyOffered && !this.hasKitchenKey) {
            this.keyOffered = true;
        }
        // you took the key but his conversation never finished
        if (this.hasKitchenKey && !this.fileGiven && !this.sideQuestActive) {
            this.sideQuestActive = true;
        }
        const hunting = !!f.pursuitEnabled || this.armada.hasHadFirstFight;

        // ---- rebuild the room you were in ----
        const room = st.room || 'room1';
        const enter = {
            room1:   () => this.switchToRoom1(),
            hallway: () => this.switchToHallway(),
            a02:     () => this.switchToA02(),
            lobby:   () => this.switchToLobby(),
            kitchen: () => this.switchToKitchen(),
            lounge:  () => this.switchToLounge(),
            roof:      () => this.switchToRoof(),
            f3hallway: () => this.switchToF3Hallway(false),
            f3a02:     () => this.switchToF3A02(),
            f3lobby:    () => this.switchToF3Lobby(),
            f3hallway2: () => this.switchToF3Hallway2(true),
            cell1:      () => this.switchToCell('cell1'),
            cell2:      () => this.switchToCell('cell2'),
            cell3:      () => this.switchToCell('cell3'),
            torture:    () => this.switchToCell('torture'),
            dining:    () => this.switchToDining(),
            games:     () => this.switchToGames()
        }[room] || (() => this.switchToRoom1());
        enter();

        // the switch put you at the room's entrance — that's the door Armada
        // will use if he comes for you
        this.pursuit.lastRoom = this.currentRoom;
        this.pursuit.entryX = this.player.x;
        this.pursuit.entryY = this.player.y;
        this.pursuit.timer = 45;
        this.pursuit.warned = false;

        // now stand where you actually were
        if (typeof st.px === 'number') {
            this.player.x = st.px;
            this.player.y = st.py;
        }

        // ---- Armada: loading gives you a head start ----
        const a = this.armada;
        if (hunting) {
            this.pursuit.enabled = true;
            a.active = true;
            a.room = 'away';
            a.state = 'stalking';
            a.stateTimer = 0;
            a.hitsTaken = 0;
            a.attackAnimTimer = 0;
            a.damageTouchCooldown = 0;
            a.knockbackX = 0;
            a.knockbackY = 0;
        } else if (this.firstShivCrafted && this.currentRoom === 'room1') {
            // his first break-in hadn't finished — it plays again
            this.spawnArmada();
        }

        // ---- Jordan ----
        const j = this.jordan;
        if (this.jordanAppeared) {
            j.active = true;
            j.punishStage = '';
            j.wastedThrows = 0;
            j.hitFlash = 0;
            j.barBreakFlash = 0;
            j.touchCooldown = 0;
            j.throwsLeft = 0;
            if (f.jordanDefeated) {
                j.defeated = true;
                j.state = 'dead';
                j.barsLeft = 0;
                j.hitsInBar = 0;
                if (typeof st.jordanX === 'number') { j.x = st.jordanX; j.y = st.jordanY; }
            } else {
                // a fight in progress restarts from full health
                j.defeated = false;
                j.state = 'idle';
                j.stateTimer = 2.0;
                j.barsLeft = j.maxBars;
                j.hitsInBar = 0;
                j.x = 480;
                j.y = 240;
            }
        }
        if (this.postJordanStage === 'approaching') this.postJordanTimer = 0.5;

        // ---- your companions ----
        this.companionsRecruited = Object.assign({ doctor: false, guard: false, shreya: false },
                                                 st.companionsRecruited || {});
        if (f.raymondDone) this.companionsRecruited.shreya = true;
        if (this.guardQuest === 'joined') this.companionsRecruited.guard = true;
        if (this.fileGiven) {
            this.companionsRecruited.doctor = true;   // older saves: the file means he joined
            this.sideQuestActive = false;
        }
        for (const id of ['doctor', 'guard', 'shreya']) {
            if (this.companionsRecruited[id]) this.placeCompanion(id);
        }

        // ---- the lounge ambush ----
        if (this.hasFile) {
            if (this.currentRoom === 'lounge' && f.ambushStage !== 'done') {
                this.ambush = { stage: 'silence', timer: 3.0,
                                doorX: this.pursuit.entryX, doorY: this.pursuit.entryY };
            } else {
                this.ambush = { stage: 'done', timer: 0, doorX: 480, doorY: 150 };
            }
        } else {
            this.ambush = { stage: '', timer: 0, doorX: 480, doorY: 150 };
        }

        this.autoEquipWeapon();
        this.hallwayNotice = 'GAME LOADED.';
        this.hallwayNoticeTime = 1.5;
        this._loadingSave = false;
    },

    // Write progress into the active slot. Safe to call often.
    autosave() {
        if (typeof saveCurrentGame !== 'function') return;
        if (typeof activeSaveSlot === 'undefined' || activeSaveSlot === -1) return;
        if (this.isDead || this._loadingSave) return;
        try {
            saveCurrentGame({ state: this.getSaveState(), floor: 4 });
        } catch (e) {
            console.warn('Autosave failed:', e);
        }
    },

    // Called when entering from the menu. Resume the slot's game if it has one.
    loadFromActiveSlot() {
        if (typeof getSave !== 'function') return;
        if (typeof activeSaveSlot === 'undefined' || activeSaveSlot === -1) return;
        const save = getSave(activeSaveSlot);
        if (save && save.state) {
            this.applySaveState(save.state);
        } else {
            // a brand new game — write a first save so Load can find it
            this.autosave();
        }
    },

    // ===== ROOM SWITCHING =====
    switchToHallway() {
        // (Armada stays in whichever room he's in — no save/restore needed)

        this.currentRoom = 'hallway';
        // Player enters from the bottom center of hallway
        this.player.x = 480;
        this.player.y = 500;
        this.player.facing = 'up';

        // Clear projectiles + drawers etc for hallway
        this.projectiles = [];
        this.drawers = [];   // no drawers in hallway
        this.items = [];     // floor items don't follow between rooms
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.dummy.hp = 0;   // no dummy in hallway
        this.dummy.respawnTimer = 999;

        this.rebuildWalls();

        this.setupHallwayEnemies();
        this.addSwarm('hallway');

        this.hallwayNotice = 'THE HALLWAY. ENEMIES DETECTED.';
        this.hallwayNoticeTime = 1.8;
    },

    switchToRoom1() {
        this.currentRoom = 'room1';
        // Player arrives at the top of Room 1 (near the door)
        this.player.x = 490;
        this.player.y = 170;
        this.player.facing = 'down';

        this.projectiles = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];

        // (if Armada is in Room 1, he's still exactly where you left him)

        // Room 1's floor is its own — other rooms' items and enemies stay behind
        this.items = [];
        this.enemies = [];

        // Room 1's drawers — same ones as before, opened ones stay opened
        if (!this.roomDrawers.room1) {
            this.spawnDrawers();
            this.roomDrawers.room1 = this.drawers;
        } else {
            this.drawers = this.roomDrawers.room1;
        }

        this.dummy.hp = 0;            // the training dummy is gone
        this.dummy.respawnTimer = 999;

        this.rebuildWalls();
        this.hallwayNotice = 'BACK IN THE WARD.';
        this.hallwayNoticeTime = 1.2;
        this.setupAnomaly();
        this.addSwarm('room1');
    },

    // Enter the A-02 room (from the hallway, after unlocking with the key)
    switchToA02() {
        this.currentRoom = 'a02';
        // Enter from the bottom-center of the room
        this.player.x = 480;
        this.player.y = 600;
        this.player.facing = 'up';

        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];       // furniture added later
        this.items = [];         // floor items don't follow between rooms
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;

        this.setupA02Enemies();

        this.rebuildWalls();
        this.hallwayNotice = 'ROOM A-02. "NO ESCAPE."';
        this.hallwayNoticeTime = 1.8;
    },

    // Go back from A-02 room to the hallway
    switchA02ToHallway() {
        this.currentRoom = 'hallway';
        // Arrive next to the A-02 door in the hallway
        this.player.x = 720;
        this.player.y = 340;
        this.player.facing = 'down';

        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];
        this.items = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;

        this.setupHallwayEnemies();
        this.addSwarm('hallway');

        this.rebuildWalls();
        this.hallwayNotice = 'BACK IN THE HALLWAY.';
        this.hallwayNoticeTime = 1.2;
    },

    // Enter the LOBBY from the hallway (walk off the hallway's right edge)
    switchToLobby() {
        this.currentRoom = 'lobby';
        // Enter from the LEFT side of the lobby
        this.player.x = 90;
        this.player.y = 450;
        this.player.facing = 'right';

        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];
        this.items = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.enemies = [];
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;

        this.rebuildWalls();
        this.hallwayNotice = 'GREENVALE ASYLUM — RECEPTION.';
        this.hallwayNoticeTime = 1.8;
        this.addSwarm('lobby');
    },

    // Go back from the lobby to the hallway
    switchLobbyToHallway() {
        this.currentRoom = 'hallway';
        // Arrive at the far-right of the hallway
        this.player.x = 850;
        this.player.y = 430;
        this.player.facing = 'left';

        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];
        this.items = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.setupHallwayEnemies();
        this.addSwarm('hallway');
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;

        this.rebuildWalls();
        this.hallwayNotice = 'BACK IN THE HALLWAY.';
        this.hallwayNoticeTime = 1.2;
    },

    // Enter the KITCHEN from the lobby (through the A-01 door)
    switchToKitchen() {
        this.currentRoom = 'kitchen';
        // Enter from the bottom-center of the kitchen
        this.player.x = 480;
        this.player.y = 560;
        this.player.facing = 'up';

        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];
        this.items = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.enemies = [];
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;

        this.rebuildWalls();
        this.hallwayNotice = 'THE KITCHEN.';
        this.hallwayNoticeTime = 1.5;

        // Adler's body — tucked in the far corner past the stove, so you have
        // to sweep the torch around to find him
        if (!this.colleagueBody) {
            this.colleagueBody = { x: 830, y: 500 };
        }

        // the things living in the dark — spawn once, then persist across visits
        if (!this.shyEnemiesSpawned) {
            this.spawnShyEnemies();
            this.shyEnemiesSpawned = true;
        } else if (this.shyEnemiesSaved) {
            this.enemies = this.shyEnemiesSaved;
        }
        this.addSwarm('kitchen');
    },

    // Enter the DOCTOR'S LOUNGE (through the kitchen's top door, needs Adler's key)
    switchToLounge() {
        this.currentRoom = 'lounge';
        this.player.x = 480;
        this.player.y = 520;
        this.player.facing = 'up';

        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];
        this.items = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.enemies = [];
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;

        this.rebuildWalls();
        this.hallwayNotice = "DOCTOR'S LOUNGE.";
        this.hallwayNoticeTime = 1.5;
        this.addSwarm('lounge');
    },

    // Back down to the kitchen
    // Back out of the lounge into the lobby, under the A-02 door
    switchLoungeToLobby() {
        const fleeing = this.armada.active && this.armada.room === 'lounge';

        this.currentRoom = 'lobby';
        const d = this.lobby.doorA02;
        this.player.x = d.x + d.w / 2;
        this.player.y = 230;
        this.player.facing = 'down';

        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];
        this.items = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.enemies = [];
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;

        this.rebuildWalls();
        // he stays in the lounge — but he'll come after you
        this.hallwayNotice = fleeing ? 'YOU GOT OUT. HE WILL FOLLOW.' : 'BACK IN THE LOBBY.';
        this.hallwayNoticeTime = fleeing ? 3.0 : 2.0;
    },

    // ===== SHY ENEMIES (dark kitchen) =====
    // They hide and flee. Hurt one and it turns on you, fast and furious.
    spawnShyEnemies() {
        this.enemies = [
            this.makeShyEnemy(200, 330),
            this.makeShyEnemy(700, 350),
            this.makeShyEnemy(480, 540)
        ];
    },

    makeShyEnemy(x, y) {
        return {
            x: x, y: y,
            w: 26, h: 30,
            hp: 3, maxHp: 3,
            speed: 70,            // creeping while calm
            ragedSpeed: 165,      // sprinting once provoked
            facing: 'down',
            dead: false,
            deathAnim: 0,
            hitFlash: 0,
            shy: true,
            raged: false,         // has it been hit?
            fleeTimer: 0,         // how long it keeps running after being spotted
            skitterTimer: 0,      // small idle wandering
            wanderDX: 0, wanderDY: 0,
            attackCooldown: 0,
            distracted: 0
        };
    },

    updateShyEnemies(dt) {
        // any room — only the shy ones are handled here

        for (const e of this.enemies) {
            if (!e.shy) continue;
            if (e.hitFlash > 0) e.hitFlash -= dt;
            if (e.attackCooldown > 0) e.attackCooldown -= dt;
            if (e.dead) { e.deathAnim += dt; continue; }
            if (e.stunTimer > 0) { e.stunTimer -= dt; continue; }   // shocked

            const tgt = e.raged ? this.aggroTarget(e) : { x: this.player.x, y: this.player.y };
            const dx = tgt.x - e.x;
            const dy = tgt.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = dx / dist, ny = dy / dist;

            if (e.raged) {
                // hunts you down and hits hard
                this.moveEnemy(e, nx * e.ragedSpeed * dt, ny * e.ragedSpeed * dt);
                if (dist < 26 && e.attackCooldown <= 0 && this.player.iframes <= 0) {
                    this.damagePlayer(0.25);   // shy thing — a quarter bar
                    e.attackCooldown = 1.0;
                    this.screenShake = 0.3;
                }
            } else {
                // Calm: keeps its distance. The torch beam scares it off harder.
                const lit = this.flashlightOn && this.isPlayerLookingAt(e.x, e.y);
                const scareRange = lit ? 260 : 150;

                if (dist < scareRange) {
                    e.fleeTimer = 0.8;
                }

                if (e.fleeTimer > 0) {
                    e.fleeTimer -= dt;
                    // run directly away
                    this.moveEnemy(e, -nx * e.speed * 1.6 * dt, -ny * e.speed * 1.6 * dt);
                } else {
                    // idle skittering so it never sits perfectly still
                    e.skitterTimer -= dt;
                    if (e.skitterTimer <= 0) {
                        e.skitterTimer = 0.8 + Math.random() * 1.2;
                        const a = Math.random() * Math.PI * 2;
                        e.wanderDX = Math.cos(a);
                        e.wanderDY = Math.sin(a);
                    }
                    this.moveEnemy(e, e.wanderDX * e.speed * 0.35 * dt,
                                      e.wanderDY * e.speed * 0.35 * dt);
                }
            }

            if (Math.abs(nx) > Math.abs(ny)) e.facing = nx > 0 ? 'right' : 'left';
            else e.facing = ny > 0 ? 'down' : 'up';

            // keep them on the open floor, out of the furniture
            const fb = this.getRoomData().floorBounds;
            if (e.x < fb.x + 20) e.x = fb.x + 20;
            if (e.x > fb.x + fb.w - 20) e.x = fb.x + fb.w - 20;
            if (e.y < fb.y + 20) e.y = fb.y + 20;
            if (e.y > fb.y + fb.h - 20) e.y = fb.y + fb.h - 20;
        }
    },

    // Is (x, y) roughly inside the flashlight cone?
    isPlayerLookingAt(x, y) {
        const dx = x - this.player.x, dy = y - this.player.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 300) return false;
        let diff = Math.atan2(dy, dx) - this.flashlightAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return Math.abs(diff) < Math.PI / 6;
    },

    // Go back from the kitchen to the lobby (arrive at the A-01 door)
    switchKitchenToLobby() {
        // remember the things in the dark — including which ones you angered
        this.shyEnemiesSaved = this.enemies.filter(e => e.shy);
        this.currentRoom = 'lobby';
        this.player.x = 285;   // just below the lobby's A-01 door
        this.player.y = 230;
        this.player.facing = 'down';

        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];
        this.items = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.enemies = [];
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;

        this.rebuildWalls();
        this.hallwayNotice = 'BACK IN THE LOBBY.';
        this.hallwayNoticeTime = 1.2;
    },

    // The hallway fight is over only once the key has dropped. Until then,
    // coming back means the chargers are back too — otherwise running past
    // them into the lobby left the key impossible to get.
    setupHallwayEnemies() {
        this.enemiesSpawned = true;
        if (!this.keySpawned) {
            this.spawnHallwayEnemies();
            return;
        }
        this.enemies = [];
        if (!this.hasKey) {
            // it dropped and you left it behind — it's still lying there
            this.items.push({
                id: 'key', name: 'KEY', x: 480, y: 450,
                pickupRadius: 40, pickedUp: false,
                spawnTime: this.time, isRecovered: true
            });
        }
    },

    // Same rule for A-02, plus the letter stays where it fell until you take it.
    setupA02Enemies() {
        this.a02EnemiesSpawned = true;
        if (!this.a02Cleared) this.spawnA02Enemies();
        else this.enemies = [];
        if (this.letterDropped && !this.hasLetter) {
            this.items.push({
                id: 'letter', name: 'LETTER', x: 480, y: 420,
                pickupRadius: 40, pickedUp: false,
                spawnTime: this.time, isRecovered: true
            });
        }
    },

    // ===== SPAWN ENEMIES =====
    // NOTE: size matches Sadid's hitbox (w: 28, h: 38) per user request
    spawnHallwayEnemies() {
        this.enemies = [
            {
                x: 200, y: 400,
                w: 28, h: 38,
                speed: 70,
                hp: 3, maxHp: 3,
                hitFlash: 0,
                damageTouchCooldown: 0,
                facing: 'right',
                dead: false,
                deathAnim: 0,
                distracted: 0
            },
            {
                x: 720, y: 400,
                w: 28, h: 38,
                speed: 70,
                hp: 3, maxHp: 3,
                hitFlash: 0,
                damageTouchCooldown: 0,
                facing: 'left',
                dead: false,
                deathAnim: 0,
                distracted: 0
            }
        ];
    },

    updateEnemies(dt) {
        // any room — the kind filter below decides what this touches

        let allDead = true;

        for (const e of this.enemies) {
            // plain melee only — the other kinds have their own updates, and on
            // the roof they all share one enemy list
            if (e.shy || e.ranged || e.kind === 'anomaly' || e.kind === 'crawler') continue;
            if (e.hitFlash > 0) e.hitFlash -= dt;
            if (e.damageTouchCooldown > 0) e.damageTouchCooldown -= dt;

            if (e.dead) {
                e.deathAnim += dt;
                continue;
            }
            if (e.stunTimer > 0) { e.stunTimer -= dt; continue; }   // shocked

            allDead = false;

            // Charge toward Sadid
            const tgt = this.aggroTarget(e);
            const dx = tgt.x - e.x;
            const dy = tgt.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                const nx = dx / dist;
                const ny = dy / dist;
                this.moveEnemy(e, nx * e.speed * dt, ny * e.speed * dt);
                if (Math.abs(nx) > Math.abs(ny)) e.facing = nx > 0 ? 'right' : 'left';
                else e.facing = ny > 0 ? 'down' : 'up';
            }

            // Contact damage
            if (e.damageTouchCooldown <= 0) {
                if (this.player.x + this.player.w / 2 > e.x - e.w / 2 &&
                    this.player.x - this.player.w / 2 < e.x + e.w / 2 &&
                    this.player.y + this.player.h / 2 > e.y - e.h / 2 &&
                    this.player.y - this.player.h / 2 < e.y + e.h / 2) {
                    this.damagePlayer(0.25);   // charger — a quarter bar
                    e.damageTouchCooldown = 1.5;
                }
            }
        }

        // floor 3's hallway drops its own key
        if (this.currentRoom === 'f3hallway2' && allDead && this.enemies.length > 0 &&
            !this.f3Hallway2Cleared) {
            this.f3Hallway2Cleared = true;
            this.autosave();
        }
        if (this.currentRoom === 'f3hallway' && allDead && this.enemies.length > 0 &&
            !this.f3KeySpawned) {
            this.f3KeySpawned = true;
            this.f3HallwayCleared = true;
            this.items.push({
                id: 'f3key', name: 'KEY', x: 480, y: 450,
                pickupRadius: 40, pickedUp: false, spawnTime: this.time
            });
            this.hallwayNotice = 'A KEY DROPPED FROM THE BODIES.';
            this.hallwayNoticeTime = 2.1;
            this.autosave();
        }

        // Floor 4's corridor used to drop the key to A-02. The doctor carries it
        // now and hands it over when he joins, which reads better — so this never
        // fires. Left in place because older saves may still have the key on the
        // floor, and the pickup for it still has to work.
        if (false && this.currentRoom === 'hallway' &&
            allDead && this.enemies.length > 0 && !this.hasKey && !this.keySpawned) {
            const centerX = (this.enemies[0].x + this.enemies[1].x) / 2;
            const centerY = (this.enemies[0].y + this.enemies[1].y) / 2;
            this.items.push({
                id: 'key',
                name: 'KEY',
                x: centerX, y: centerY,
                pickupRadius: 40,
                pickedUp: false,
                spawnTime: this.time,
                isRecovered: true
            });
            this.keySpawned = true;
            this.autosave();
            this.hallwayNotice = 'A KEY DROPPED FROM THE BODIES.';
            this.hallwayNoticeTime = 2.1;
        }
    },

    // ===== A-02 RANGED ENEMIES (knife throwers) =====
    // 2 HP, faster than hallway enemies, keep their distance and throw knives.
    spawnA02Enemies() {
        this.enemies = [
            {
                x: 320, y: 340,
                w: 28, h: 38,
                speed: 95,
                hp: 2, maxHp: 2,
                hitFlash: 0,
                damageTouchCooldown: 0,
                facing: 'down',
                dead: false,
                deathAnim: 0,
                distracted: 0,
                ranged: true,
                throwCooldown: 1.5 + Math.random(),
                preferredDist: 240
            },
            {
                x: 640, y: 340,
                w: 28, h: 38,
                speed: 95,
                hp: 2, maxHp: 2,
                hitFlash: 0,
                damageTouchCooldown: 0,
                facing: 'down',
                dead: false,
                deathAnim: 0,
                distracted: 0,
                ranged: true,
                throwCooldown: 2.0 + Math.random(),
                preferredDist: 240
            }
        ];
    },

    updateA02Enemies(dt) {
        // any room — only the throwers are handled here

        for (const e of this.enemies) {
            if (!e.ranged) continue;   // the knife-throwers, and nothing else
            if (e.hitFlash > 0) e.hitFlash -= dt;
            if (e.dead) { e.deathAnim += dt; continue; }
            if (e.stunTimer > 0) { e.stunTimer -= dt; continue; }   // shocked

            const tgt = this.aggroTarget(e);
            const dx = tgt.x - e.x;
            const dy = tgt.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = dx / dist;
            const ny = dy / dist;

            // Kiting movement: approach if too far, back away if too close
            if (dist > e.preferredDist + 30) {
                this.moveEnemy(e, nx * e.speed * dt, ny * e.speed * dt);
            } else if (dist < e.preferredDist - 30) {
                this.moveEnemy(e, -nx * e.speed * dt, -ny * e.speed * dt);
            }
            // Keep enemies inside the OPEN floor area (tighter than floorBounds,
            // so they don't walk into furniture or past the visible edges)
            // A-02's open floor. On the roof, use that room's bounds instead.
            let minX = 240, maxX = 720, minY = 300, maxY = 560;
            if (this.currentRoom !== 'a02') {
                const fb = this.getRoomData().floorBounds;
                minX = fb.x + 20; maxX = fb.x + fb.w - 20;
                minY = fb.y + 20; maxY = fb.y + fb.h - 20;
            }
            if (e.x < minX) e.x = minX;
            if (e.x > maxX) e.x = maxX;
            if (e.y < minY) e.y = minY;
            if (e.y > maxY) e.y = maxY;

            if (Math.abs(nx) > Math.abs(ny)) e.facing = nx > 0 ? 'right' : 'left';
            else e.facing = ny > 0 ? 'down' : 'up';

            // Throw a knife on cooldown
            e.throwCooldown -= dt;
            if (e.throwCooldown <= 0) {
                e.throwCooldown = 2.0 + Math.random() * 1.0;
                const angle = Math.atan2(dy, dx);
                this.enemyProjectiles.push({
                    x: e.x, y: e.y,
                    angle: angle,
                    speed: 260,
                    rotation: angle,
                    life: 3.0
                });
            }
        }

        // both throwers dead — A-02 is cleared for good
        if (this.currentRoom === 'f3a02' && !this.f3A02Cleared &&
            this.enemies.length > 0 && this.enemies.every(e => e.dead)) {
            this.f3A02Cleared = true;
            this.autosave();
        }
        if (this.currentRoom === 'a02' &&
            !this.a02Cleared && this.enemies.length > 0 && this.enemies.every(e => e.dead)) {
            this.a02Cleared = true;
            this.guardArrives();
            this.autosave();
        }
    },

    updateEnemyProjectiles(dt) {
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const p = this.enemyProjectiles[i];
            p.x += Math.cos(p.angle) * p.speed * dt;
            p.y += Math.sin(p.angle) * p.speed * dt;
            p.rotation += 14 * dt;
            p.life -= dt;

            // Hit the player?
            if (this.player.iframes <= 0 &&
                p.x > this.player.x - this.player.w / 2 &&
                p.x < this.player.x + this.player.w / 2 &&
                p.y > this.player.y - this.player.h / 2 &&
                p.y < this.player.y + this.player.h / 2) {
                if (p.isFreeze) {
                    this.damagePlayer(0.5);
                    this.freezePlayer();
                } else if (p.isVenom) {
                    this.damagePlayer(0.5);
                    this.poisonPlayer();
                } else if (p.fromRaymond) {
                    this.raymondHurtsPlayer(0.5);
                } else if (!p.isPunish) {
                    this.damagePlayer(0.25);  // thrown knife — a quarter bar
                }
                // (the punish throwback does no damage itself — being stunned
                //  and then hit is the real cost, handled in updateJordanPunish)
                this.enemyProjectiles.splice(i, 1);   // knife disappears on hit
                continue;
            }

            // Hit a wall/furniture? disappear
            let hitWall = false;
            for (const w of this.walls) {
                if (p.x > w.x && p.x < w.x + w.w && p.y > w.y && p.y < w.y + w.h) {
                    hitWall = true; break;
                }
            }
            if (hitWall || p.life <= 0) {
                this.enemyProjectiles.splice(i, 1);   // knife disappears
            }
        }
    },

    // ===== ARMADA =====
    spawnArmada() {
        const a = this.armada;
        a.active = true;
        a.room = 'room1';
        a.state = 'breaking';
        a.stateTimer = 0;
        a.x = a.entryX;
        a.y = a.entryY;
        a.hitsTaken = 0;
        a.hitFlash = 0;
        a.wallCracks = [];
        a.dustParticles = [];
        this.screenShake = 0.3;
    },

    updateArmada(dt) {
        const a = this.armada;
        if (!a.active) return;
        if (this.currentRoom !== a.room) return;   // he only acts in the room he's in

        // In the last fight he only acts between the clashes — once Raymond is
        // talking at the end of it, he just stands there.
        const af = this.armadaFinal;
        if (this.finale.active) return;
        if (af.active && af.state !== 'fighting') return;
        if (af.active && af.frozen > 0) return;

        a.stateTimer += dt;
        if (a.hitFlash > 0) a.hitFlash -= dt;
        if (a.damageTouchCooldown > 0) a.damageTouchCooldown -= dt;
        if (a.attackAnimTimer > 0) a.attackAnimTimer -= dt;
        this.updateArmadaSmashHit();   // lands the hit on the smash frame
        a.moving = false;   // set true by moveArmadaTowardPlayer when he walks

        if (a.knockbackX !== 0 || a.knockbackY !== 0) {
            a.x += a.knockbackX * dt;
            a.y += a.knockbackY * dt;
            a.knockbackX *= 0.85;
            a.knockbackY *= 0.85;
            if (Math.abs(a.knockbackX) < 5) a.knockbackX = 0;
            if (Math.abs(a.knockbackY) < 5) a.knockbackY = 0;
        }

        switch (a.state) {
            case 'breaking':
                if (a.stateTimer < 1.5 && Math.random() < 0.3) {
                    a.wallCracks.push({
                        x: 80 + Math.random() * 10,
                        y: 200 + Math.random() * 150,
                        len: 15 + Math.random() * 25,
                        angle: Math.random() * Math.PI * 2
                    });
                }
                if (a.stateTimer > 1.5) {
                    a.state = 'entering';
                    a.stateTimer = 0;
                    this.screenShake = 0.8;
                    for (let i = 0; i < 20; i++) {
                        a.dustParticles.push({
                            x: a.entryX, y: a.entryY,
                            vx: (Math.random() - 0.3) * 200,
                            vy: (Math.random() - 0.5) * 200,
                            life: 1.0, size: 3 + Math.random() * 5
                        });
                    }
                }
                break;
            case 'entering':
                if (a.stateTimer > 1.2) { a.state = 'chasing'; a.stateTimer = 0; }
                break;
            case 'chasing':
                this.moveArmadaTowardPlayer(dt);
                this.checkArmadaTouchDamage();
                if (a.hitsTaken >= 4) {
                    a.state = 'scripted_down';
                    a.stateTimer = 0;
                    a.hitsTaken = 0;
                    a.hasHadFirstFight = true;
                    this.screenShake = 0.5;
                    this.scriptedMessage.active = true;
                    this.scriptedMessage.charIndex = 0;
                    this.scriptedMessage.charTimer = 0;
                    this.scriptedMessage.holdTimer = 0;
                }
                break;
            case 'scripted_down':
                this.updateScriptedMessage(dt);
                if (!this.scriptedMessage.active) { a.state = 'rising'; a.stateTimer = 0; }
                break;
            case 'rising':
                if (a.stateTimer > 1.5) {
                    a.state = 'stalking'; a.stateTimer = 0;
                    this.screenShake = 0.4;
                    this.pursuit.enabled = true;   // from here on he hunts you room to room
                }
                break;
            case 'arriving':
                // stands in the doorway he followed you through, then comes
                if (a.stateTimer > 1.4) { a.state = 'stalking'; a.stateTimer = 0; }
                break;
            case 'stalking':
                this.moveArmadaTowardPlayer(dt);
                this.checkArmadaTouchDamage();
                if (a.hitsTaken >= 15) {
                    a.state = 'stunned'; a.stateTimer = 0; a.hitsTaken = 0;
                    this.screenShake = 0.3;
                }
                break;
            case 'stunned':
                if (a.stateTimer > 5.0) { a.state = 'stalking'; a.stateTimer = 0; }
                break;
        }

        if (a.state === 'stalking' || a.state === 'chasing' || a.state === 'arriving') {
            const fb = this.getRoomData().floorBounds;
            if (a.x < fb.x) a.x = fb.x;
            if (a.x + a.w > fb.x + fb.w) a.x = fb.x + fb.w - a.w;
            if (a.y < fb.y) a.y = fb.y;
            if (a.y + a.h > fb.y + fb.h) a.y = fb.y + fb.h - a.h;
        }

        for (let i = a.dustParticles.length - 1; i >= 0; i--) {
            const d = a.dustParticles[i];
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.vy += 100 * dt;
            d.life -= dt;
            if (d.life <= 0) a.dustParticles.splice(i, 1);
        }
    },

    // Linger in a room too long and he comes for you through the door you used.
    updateArmadaPursuit(dt) {
        const pu = this.pursuit;
        const a = this.armada;

        // entering a room: remember the door, restart the clock
        if (pu.lastRoom !== this.currentRoom) {
            pu.lastRoom = this.currentRoom;
            pu.entryX = this.player.x;
            pu.entryY = this.player.y;
            pu.timer = 45;
            pu.warned = false;
            this.autosave();   // every doorway is a checkpoint
        }

        // He does not interrupt the two fights that matter.
        const bossBusy =
            (this.currentRoom === 'dining'  && this.frost.active) ||
            (this.currentRoom === 'games' && this.raymond.active &&
             this.raymond.mode === 'rematch') ||
            (this.endScene && this.endScene.active) ||
            (this.armadaFinal && this.armadaFinal.active) ||
            (this.finale && this.finale.active);
        if (bossBusy) { pu.timer = 45; pu.warned = false; return; }

        if (!pu.enabled || !a.active) return;
        if (this.currentRoom === 'roof') {   // he doesn't follow you onto the roof
            pu.timer = 45;
            pu.warned = false;
            return;
        }

        // he's already in here with you
        if (a.room === this.currentRoom) {
            pu.timer = 45;
            pu.warned = false;
            return;
        }

        pu.timer -= dt;

        // a warning, so the arrival is fair
        if (!pu.warned && pu.timer <= 8) {
            pu.warned = true;
            this.hallwayNotice = 'HEAVY FOOTSTEPS...';
            this.hallwayNoticeTime = 2.1;
            this.screenShake = Math.max(this.screenShake, 0.15);
        }

        if (pu.timer <= 0) {
            this.armadaArrives(pu.entryX, pu.entryY, 'HE FOLLOWED YOU.');
            pu.timer = 45;
            pu.warned = false;
        }
    },

    // Put Armada in the current room, standing at (x, y).
    armadaArrives(x, y, notice) {
        const a = this.armada;
        a.active = true;
        a.room = this.currentRoom;
        a.x = x - a.w / 2;
        a.y = y - a.h / 2;
        a.state = 'arriving';
        a.stateTimer = 0;
        a.hitsTaken = 0;
        a.attackAnimTimer = 0;
        a.attackHasHit = false;
        a.damageTouchCooldown = 1.5;   // no hit the instant he appears
        a.knockbackX = 0;
        a.knockbackY = 0;
        a.moving = false;
        this.screenShake = 0.6;
        if (notice) {
            this.hallwayNotice = notice;
            this.hallwayNoticeTime = 1.8;
        }
    },

    moveArmadaTowardPlayer(dt) {
        const a = this.armada;
        const dx = this.player.x - a.x;
        const dy = this.player.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5) { a.moving = false; return; }
        const nx = dx / dist;
        const ny = dy / dist;
        a.x += nx * a.speed * dt;
        a.y += ny * a.speed * dt;
        if (Math.abs(nx) > Math.abs(ny)) a.facing = nx > 0 ? 'right' : 'left';
        else a.facing = ny > 0 ? 'down' : 'up';

        // walk animation
        a.moving = true;
        a.walkTimer += dt;
        if (a.walkTimer > 0.15) {       // frame every 0.15s
            a.walkTimer = 0;
            a.walkFrame = (a.walkFrame + 1) % 4;
        }
    },

    checkArmadaTouchDamage() {
        const a = this.armada;
        if (a.damageTouchCooldown > 0) return;
        if (a.attackAnimTimer > 0) return;   // already mid-swing
        const p = this.player;
        if (p.x + p.w / 2 > a.x && p.x - p.w / 2 < a.x + a.w &&
            p.y + p.h / 2 > a.y && p.y - p.h / 2 < a.y + a.h) {
            // Begin the hammer swing. Damage is dealt later, when the SMASH
            // frame lands (see the smash check in updateArmada).
            a.attackAnimTimer = 0.6;
            a.attackHasHit = false;      // damage not applied yet this swing
            a.damageTouchCooldown = 2.0; // don't start another swing immediately
        }
    },

    // Called each frame while Armada is mid-swing: deals the hit exactly when
    // the hammer SMASH frame is showing (timer has counted down to ~0.2).
    updateArmadaSmashHit() {
        const a = this.armada;
        if (a.attackAnimTimer <= 0 || a.attackHasHit) return;
        if (a.attackAnimTimer <= 0.2) {
            // smash frame is now showing — land the hit if the player is still
            // in range (so stepping away in time avoids the hammer)
            const p = this.player;
            const inRange = (p.x + p.w / 2 > a.x - 10 && p.x - p.w / 2 < a.x + a.w + 10 &&
                             p.y + p.h / 2 > a.y - 10 && p.y - p.h / 2 < a.y + a.h + 10);
            if (inRange) {
                this.damagePlayer(1);
                this.screenShake = 0.4;
            }
            a.attackHasHit = true;   // only hit once per swing
        }
    },

    updateScriptedMessage(dt) {
        const m = this.scriptedMessage;
        if (m.charIndex < m.text.length) {
            m.charTimer += dt;
            if (m.charTimer > 0.04) { m.charTimer = 0; m.charIndex++; }
        } else {
            m.holdTimer += dt;
            if (m.holdTimer > 3.5) m.active = false;
        }
    },

    // ===== COMBAT / PROJECTILES =====
    autoEquipWeapon() {
        // Only pick a weapon if the current one is gone/invalid. This preserves
        // the player's manual scroll choice instead of always forcing the shiv.
        const owned = this.getOwnedWeapons();
        const stillValid = this.equippedWeapon && owned.includes(this.equippedWeapon);
        if (stillValid) {
            // make sure durability record exists
            if (this.weaponDurability[this.equippedWeapon] === undefined) {
                this.weaponDurability[this.equippedWeapon] = WEAPON_STATS[this.equippedWeapon].durabilityMax;
            }
            return;
        }
        // Otherwise default to the first owned weapon (shiv preferred)
        if (owned.length > 0) {
            const pick = owned.includes('shiv') ? 'shiv' : owned[0];
            this.equippedWeapon = pick;
            if (this.weaponDurability[pick] === undefined) {
                this.weaponDurability[pick] = WEAPON_STATS[pick].durabilityMax;
            }
        } else {
            this.equippedWeapon = null;
        }
    },

    // Which throwable weapons does the player currently own?
    getOwnedWeapons() {
        const order = ['shiv', 'scissors', 'pistol', 'burst', 'shotgun', 'freezegun'];
        // (cooldowns are restored below, once the new weapon is known)
        return order.filter(id => this.inventory.find(i => i.id === id));
    },

    // Scroll wheel cycles through owned weapons only.
    debugUnlockAll: DEBUG_UNLOCK_ALL,

    // TESTING ONLY. Opens every locked door in the building.
    unlockEverything() {
        this.hasKey = true;           // hallway A-02
        this.hasKitchenKey = true;    // lobby A-01
        this.hasLoungeKey = true;     // lobby A-02
        this.hasFlashlight = true;    // or the kitchen is unusable
        this.hasRoofKey = true;       // A-02's top door
        this.hasKeycard2 = true;      // stairwell down to floor 3
        this.hasF3Key = true;         // the bolted door in the cell block
        this.hasF2Keycard = true;     // stairwell down to floor 2
    },

    // mm:ss for the completion time
    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const t = Math.floor(sec % 60);
        return m + ':' + (t < 10 ? '0' : '') + t;
    },

    ownsWeapon(id) {
        return this.getOwnedWeapons().includes(id);
    },

    // Put a specific weapon in your hand, if you have it.
    selectWeapon(id) {
        if (!this.ownsWeapon(id)) {
            const names = { scissors: 'SCISSORS', shiv: 'SHIV', pistol: 'PISTOL',
                            burst: 'SEMI-AUTO', freezegun: 'FREEZE GUN', shotgun: 'SHOTGUN' };
            this.pickupNotice = "NO " + (names[id] || id.toUpperCase());
            this.pickupNoticeTime = 1.2;
            return false;
        }
        if (this.equippedWeapon === id) return true;
        // park the old weapon's remaining cooldown and pick up the new one's,
        // or the freeze gun's eight seconds would freeze every weapon you own
        if (this.equippedWeapon) this.weaponCooldowns[this.equippedWeapon] = this.attackCooldown;
        this.attackCooldown = this.weaponCooldowns[id] || 0;
        this.equippedWeapon = id;
        if (id === 'pistol' || id === 'burst' || id === 'freezegun') this.lastGun = id;
        this.attackHoldTime = 0;
        this.volleyFired = true;    // don't charge from the press that swapped
        this.burstLeft = 0;
        this.reloadTimer = 0;
        return true;
    },

    // Holding 3 switches between the guard's pistol and the semi-auto.
    swapGun() {
        // every gun you are carrying, in order
        const guns = ['pistol', 'burst'].filter(id => this.ownsWeapon(id));
        if (guns.length === 0) return;
        if (guns.length === 1) { this.selectWeapon(guns[0]); return; }
        const at = guns.indexOf(this.equippedWeapon);
        const next = guns[(at + 1) % guns.length];
        this.selectWeapon(next);
        const names = { pistol: 'PISTOL', burst: 'SEMI-AUTO' };
        this.pickupNotice = names[next];
        this.pickupNoticeTime = 1.2;
    },

    cycleWeapon(dir) {
        if (this.equippedWeapon) this.weaponCooldowns[this.equippedWeapon] = this.attackCooldown;
        const owned = this.getOwnedWeapons();
        if (owned.length === 0) { this.equippedWeapon = null; return; }
        if (owned.length === 1) {
            this.equippedWeapon = owned[0];
            this.attackCooldown = this.weaponCooldowns[owned[0]] || 0;
            return;
        }
        let idx = owned.indexOf(this.equippedWeapon);
        if (idx === -1) idx = 0;
        idx = (idx + dir + owned.length) % owned.length;
        this.equippedWeapon = owned[idx];
        this.attackCooldown = this.weaponCooldowns[this.equippedWeapon] || 0;
        if (this.weaponDurability[this.equippedWeapon] === undefined) {
            this.weaponDurability[this.equippedWeapon] = WEAPON_STATS[this.equippedWeapon].durabilityMax;
        }
        // brief on-screen confirmation
        this.pickupNotice = `EQUIPPED: ${this.equippedWeapon.toUpperCase()}`;
        this.pickupNoticeTime = 1.2;
    },

    // Tap to throw one blade. With the guard along, holding throws three.
    updateAttackInput(dt) {
        if (this.player.frozen && this.player.frozen.active) return;
        // the charge tricks are for blades; guns just fire
        const gun = WEAPON_STATS[this.equippedWeapon];
        if (gun && gun.isGun) {
            if (gun.canBurst) {
                // tap for one, hold for three
                if (mouse.down) {
                    this.attackHoldTime += dt;
                    if (!this.volleyFired && this.attackHoldTime >= 0.28) {
                        this.startBurst();
                        this.volleyFired = true;
                    }
                } else {
                    if (this.attackHoldTime > 0 && !this.volleyFired) this.performAttack();
                    this.attackHoldTime = 0;
                    this.volleyFired = false;
                }
            } else {
                if (mouse.clicked) this.performAttack();
                this.attackHoldTime = 0;
                this.volleyFired = false;
            }
            return;
        }

        if (!this.companionsRecruited.guard && !this.companionsRecruited.shreya) {
            if (mouse.clicked) this.performAttack();
            this.attackHoldTime = 0;
            this.volleyFired = false;
            return;
        }



        if (mouse.down) {
            this.attackHoldTime += dt;
            if (!this.volleyFired && this.attackHoldTime >= this.volleyChargeTime) {
                // Shreya's charge replaces the guard's volley — and he isn't
                // around to offer it by the time she joins
                if (this.companionsRecruited.shreya) this.throwElectricShiv();
                else this.throwVolley();
                this.volleyFired = true;
            }
        } else {
            // released early — a single blade
            if (this.attackHoldTime > 0 && !this.volleyFired) this.performAttack();
            this.attackHoldTime = 0;
            this.volleyFired = false;
        }
    },

    // Sparks shed by a charged blade as it flies
    // The cold coming off a freeze pellet
    updateFrostMotes(dt) {
        if (this.freezeFlash > 0) this.freezeFlash -= dt;
        for (const p of this.projectiles) {
            if (!p.isFreezeShot) continue;
            for (let k = 0; k < 2; k++) {
                this.frostMotes.push({
                    x: p.x + (Math.random() - 0.5) * 14,
                    y: p.y + (Math.random() - 0.5) * 14,
                    vx: (Math.random() - 0.5) * 26,
                    vy: (Math.random() - 0.5) * 26 - 8,
                    life: 0.5, size: 2 + Math.random() * 3
                });
            }
        }
        for (let i = this.frostMotes.length - 1; i >= 0; i--) {
            const m = this.frostMotes[i];
            m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt;
            if (m.life <= 0) this.frostMotes.splice(i, 1);
        }
    },

    drawFrostMotes(ctx) {
        for (const m of this.frostMotes) {
            const a = Math.max(0, m.life / 0.5) * 0.7;
            ctx.fillStyle = `rgba(200, 238, 255, ${a})`;
            ctx.fillRect(m.x - m.size / 2, m.y - m.size / 2, m.size, m.size);
        }
        if (this.freezeFlash > 0) {
            ctx.fillStyle = `rgba(180, 230, 255, ${this.freezeFlash * 0.5})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    },

    // A shell does not wound anything. It picks it up and puts it somewhere else.
    blastEnemy(e, angle) {
        if (!e || e.dead) return;
        const sp = 1150 + Math.random() * 420;   // they go a long way
        this.killEnemy(e);
        e.launch = {
            vx: Math.cos(angle) * sp,
            vy: Math.sin(angle) * sp,
            t: 0, dur: 0.85
        };
        this.screenShake = Math.max(this.screenShake, 0.7);
        this.spawnBloodBurst(e.x, e.y, 26);
        this.hitEffects.push({
            x: e.x, y: e.y - 40, text: 'OFF HIS FEET', life: 1.1, color: '#ffcc44'
        });
    },

    // Bodies still travelling after a shell
    updateLaunched(dt) {
        for (const e of this.enemies) {
            if (!e.launch) continue;
            const L = e.launch;
            L.t += dt;
            const k = Math.min(1, L.t / L.dur);
            const drag = 1 - k;
            e.x += L.vx * drag * dt;
            e.y += L.vy * drag * dt;
            // a blood trail the whole way
            if (Math.random() < 0.6) {
                this.addBloodStain(e.x + (Math.random() - 0.5) * 16,
                                   e.y + 10 + (Math.random() - 0.5) * 10, true);
            }
            const fb = this.getRoomData().floorBounds;
            if (e.x < fb.x + 14 || e.x > fb.x + fb.w - 14 ||
                e.y < fb.y + 14 || e.y > fb.y + fb.h - 14 || k >= 1) {
                e.x = Math.max(fb.x + 14, Math.min(fb.x + fb.w - 14, e.x));
                e.y = Math.max(fb.y + 14, Math.min(fb.y + fb.h - 14, e.y));
                e.launch = null;
                this.screenShake = Math.max(this.screenShake, 0.45);
                this.spawnBloodBurst(e.x, e.y, 16);
                this.addBloodPool(e.x, e.y + 10, true);
            }
        }
    },

    // Anything a freeze pellet touches goes solid and then comes apart.
    shatterEnemy(e) {
        if (!e || e.dead) return;
        e.hp = 0;
        this.screenShake = Math.max(this.screenShake, 0.6);
        for (let k = 0; k < 22; k++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 40 + Math.random() * 90;
            this.frostMotes.push({
                x: e.x, y: e.y,
                vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
                life: 0.7, size: 2 + Math.random() * 4
            });
        }
        this.hitEffects.push({
            x: e.x, y: e.y - 40, text: 'SHATTERED', life: 1.2, color: '#bfeaff'
        });
        this.killEnemy(e);
    },

    updateSparks(dt) {
        for (const p of this.projectiles) {
            if (!p.electric) continue;
            this.sparks.push({
                x: p.x + (Math.random() - 0.5) * 10,
                y: p.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 60,
                life: 0.3
            });
        }
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const sp = this.sparks[i];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.life -= dt;
            if (sp.life <= 0) this.sparks.splice(i, 1);
        }
    },

    drawSparks(ctx) {
        for (const sp of this.sparks) {
            const a = Math.max(0, sp.life / 0.3);
            ctx.fillStyle = `rgba(180, 230, 255, ${a})`;
            ctx.fillRect(sp.x - 1, sp.y - 1, 3, 3);
        }
    },

    // Shreya charges the blade. One throw, and whatever it hits seizes up —
    // but it takes your whole stamina bar.
    throwElectricShiv() {
        if (!this.equippedWeapon || this.player.stunTimer > 0) return;

        if (this.player.stamina < this.player.maxStamina - 1) {
            this.performAttack();
            this.pickupNotice = 'NOT ENOUGH STAMINA TO CHARGE THE BLADE';
            this.pickupNoticeTime = 1.2;
            return;
        }

        const before = this.projectiles.length;
        this.attackCooldown = 0;
        this.performAttack();
        if (this.projectiles.length === before) return;

        this.projectiles[this.projectiles.length - 1].electric = true;
        this.player.stamina = 0;
        this.player.staminaRegenDelay = 0.8;
        this.hitEffects.push({
            x: this.player.x, y: this.player.y - 44,
            text: 'CHARGED', life: 0.9, color: '#9fd8ff'
        });
    },

    // Three rounds, one after another
    startBurst() {
        if (this.burstLeft > 0) return;
        if ((this.weaponDurability.burst || 0) <= 0) {
            this.pickupNotice = this.pistolReserve > 0
                ? 'CLICK. EMPTY — PRESS R TO RELOAD' : 'CLICK. EMPTY.';
            this.pickupNoticeTime = 1.2;
            return;
        }
        this.burstLeft = 3;
        this.burstTimer = 0;
    },

    updateBurst(dt) {
        if (this.burstLeft <= 0) return;
        this.burstTimer -= dt;
        if (this.burstTimer > 0) return;
        if (this.equippedWeapon !== 'burst' || (this.weaponDurability.burst || 0) <= 0) {
            this.burstLeft = 0;
            return;
        }
        this.attackCooldown = 0;
        this.performAttack((Math.random() - 0.5) * 0.06);   // a little spread
        this.burstLeft -= 1;
        this.burstTimer = 0.09;
    },

    throwVolley() {
        if (!this.equippedWeapon || this.player.stunTimer > 0) return;

        if (this.player.stamina < this.volleyCost) {
            this.performAttack();   // not enough left — just the one
            this.pickupNotice = 'NOT ENOUGH STAMINA FOR A VOLLEY';
            this.pickupNoticeTime = 1.2;
            return;
        }

        let thrown = 0;
        for (const off of [-0.22, 0, 0.22]) {
            this.attackCooldown = 0;
            const before = this.projectiles.length;
            this.performAttack(off);
            if (this.projectiles.length > before) thrown++;
            else break;   // out of blades
        }
        if (thrown === 0) return;

        this.player.stamina -= this.volleyCost;
        this.player.staminaRegenDelay = 0.6;
        this.hitEffects.push({
            x: this.player.x, y: this.player.y - 44,
            text: 'VOLLEY', life: 0.9, color: '#88bbff'
        });
    },

    performAttack(angleOffset) {
        if (!this.equippedWeapon || this.attackCooldown > 0) return;
        if (this.player.stunTimer > 0) return;   // can't throw while stunned
        const weapon = WEAPON_STATS[this.equippedWeapon];
        if (!weapon) return;
        if (weapon.isGun && this.reloadTimer > 0) return;
        if (weapon.isGun && (this.weaponDurability[this.equippedWeapon] || 0) <= 0) {
            this.attackCooldown = 0.35;
            this.pickupNotice = this.pistolReserve > 0
                ? 'CLICK. EMPTY — PRESS R TO RELOAD'
                : 'CLICK. EMPTY.';
            this.pickupNoticeTime = 1.2;
            return;
        }
        const dx = mouse.x - this.player.x;
        const dy = mouse.y - this.player.y;
        const angle = Math.atan2(dy, dx) + (angleOffset || 0);
        this.projectiles.push({
            weaponId: this.equippedWeapon,
            x: this.player.x, y: this.player.y,
            startX: this.player.x, startY: this.player.y,
            angle: angle, speed: weapon.speed,
            damage: weapon.damage, maxRange: weapon.range,
            rotation: angle,
            isBullet: !!weapon.isGun,
            isFreezeShot: !!weapon.isFreezeGun,
            isShotgunShot: !!weapon.isShotgun,
            hit: false, gone: false
        });
        if (weapon.isFreezeGun) {
            this.screenShake = Math.max(this.screenShake, 1.1);   // it kicks hard
            this.freezeFlash = 0.25;
        }
        if (weapon.isShotgun) {
            this.screenShake = Math.max(this.screenShake, 0.75);
            this.raymond.shellThisShot = false;   // one shell counts once on him
            this.raymond.shellWasHead = false;
        }
        if (weapon.isSpread) {
            // two more pellets either side of the one just fired
            const shot = this.projectiles[this.projectiles.length - 1];
            if (shot) {
                for (const off of [-0.17, 0.17]) {
                    const a = shot.angle + off;
                    this.projectiles.push(Object.assign({}, shot, {
                        angle: a, rotation: a,
                        x: shot.startX, y: shot.startY
                    }));
                }
            }
        }
        if (weapon.isGun) {
            this.screenShake = Math.max(this.screenShake, 0.16);
            this.muzzleFlash = { x: this.player.x, y: this.player.y, angle: angle, life: 0.08 };
        }
        this.attackCooldown = weapon.cooldown || 0.5;
        // A blade leaves your hand for good; the pistol spends a round.
        this.consumeWeaponDurability(this.equippedWeapon);
    },

    startReload() {
        const id = this.equippedWeapon;
        const w = WEAPON_STATS[id];
        if (!w || !w.isGun || this.reloadTimer > 0) return;
        if (this.player.stunTimer > 0) return;
        const max = w.durabilityMax;
        if ((this.weaponDurability[id] || 0) >= max) {
            this.pickupNotice = 'ALREADY FULL';
            this.pickupNoticeTime = 1.2;
            return;
        }
        if (this.pistolReserve <= 0) {
            this.pickupNotice = 'NO SPARE ROUNDS';
            this.pickupNoticeTime = 1.2;
            return;
        }
        this.reloadTimer = 1.4;
    },

    finishReload() {
        const id = this.equippedWeapon;
        const w = WEAPON_STATS[id];
        if (!w || !w.isGun) return;
        const max = w.durabilityMax;
        const inGun = this.weaponDurability[id] || 0;
        const moved = Math.min(max - inGun, this.pistolReserve);
        this.weaponDurability[id] = inGun + moved;
        this.pistolReserve -= moved;
        this.pickupNotice = `RELOADED  (${this.weaponDurability[id]} / ${max})`;
        this.pickupNoticeTime = 1.2;
    },

    consumeWeaponDurability(weaponId) {
        this.weaponDurability[weaponId] -= 1;
        // the freeze gun has no magazine at all
        if (weaponId === 'freezegun') { this.weaponDurability.freezegun = 999; return; }
        // A gun runs out of rounds but stays in your hands
        if (WEAPON_STATS[weaponId] && WEAPON_STATS[weaponId].isGun) {
            if (this.weaponDurability[weaponId] <= 0) {
                this.weaponDurability[weaponId] = 0;
                this.pickupNotice = 'OUT OF ROUNDS';
                this.pickupNoticeTime = 1.2;
            }
            return;
        }
        if (this.weaponDurability[weaponId] <= 0) {
            const invItem = this.inventory.find(i => i.id === weaponId);
            if (invItem) {
                invItem.qty -= 1;
                if (invItem.qty <= 0) {
                    const idx = this.inventory.indexOf(invItem);
                    this.inventory.splice(idx, 1);
                }
            }
            delete this.weaponDurability[weaponId];
            this.pickupNotice = `YOUR ${weaponId.toUpperCase()} BROKE!`;
            this.pickupNoticeTime = 1.8;
            this.autoEquipWeapon();
        }
    },

    updateProjectiles(dt) {
        const a = this.armada;
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            p.x += Math.cos(p.angle) * p.speed * dt;
            p.y += Math.sin(p.angle) * p.speed * dt;
            p.rotation += 15 * dt;

            const dxTravel = p.x - p.startX;
            const dyTravel = p.y - p.startY;
            const traveled = Math.sqrt(dxTravel * dxTravel + dyTravel * dyTravel);
            // Missed / reached max range → gone for good (no floor pickup)
            if (traveled >= p.maxRange) { this.projectiles.splice(i, 1); continue; }

            // Enemy hits
            let hitEnemy = false;
            for (const e of this.enemies) {
                if (e.dead) continue;
                if (p.x > e.x - e.w / 2 && p.x < e.x + e.w / 2 &&
                    p.y > e.y - e.h / 2 && p.y < e.y + e.h / 2) {
                    // a shell takes them off their feet
                    if (p.isShotgunShot) {
                        this.blastEnemy(e, p.angle);
                        hitEnemy = true;
                        break;
                    }

                    // a freeze pellet ends it outright
                    if (p.isFreezeShot) {
                        this.shatterEnemy(e);
                        hitEnemy = true;
                        break;
                    }

                    // a charged blade seizes anything it touches
                    if (p.electric) {
                        this.shockEnemy(e, p.damage + 1, 2.5);
                        // arcs jumping off the impact
                        for (let k = 0; k < 4; k++) {
                            const ang = Math.random() * Math.PI * 2;
                            const reach = 26 + Math.random() * 26;
                            this.lightning.push({
                                x1: e.x, y1: e.y - 6,
                                x2: e.x + Math.cos(ang) * reach,
                                y2: e.y + Math.sin(ang) * reach,
                                life: 0.45
                            });
                        }
                        this.screenShake = Math.max(this.screenShake, 0.2);
                        this.hitEffects.push({
                            x: e.x, y: e.y - 44, text: 'SHOCKED', life: 1.0, color: '#9fd8ff'
                        });
                        hitEnemy = true;
                        break;
                    }

                    // an anomaly only takes damage while it's stunned on a wall
                    if (e.kind === 'anomaly' && e.state !== 'stunned') {
                        this.hitEffects.push({
                            x: e.x, y: e.y - 30,
                            text: 'STUN IT FIRST', life: 0.9, color: '#999999'
                        });
                        hitEnemy = true;
                        break;
                    }
                    const hpBefore = e.hp;
                    e.hp -= p.damage;

                    // the thing in cell 3 comes apart rather than dying
                    if (e.kind === 'crawler' && e.phase === 'whole' && e.hp <= 0) {
                        this.splitCrawler(e);
                        hitEnemy = true;
                        break;
                    }

                    // a shy one turns the instant you hurt it
                    if (e.shy && !e.raged) {
                        e.raged = true;
                        e.fleeTimer = 0;
                        this.hitEffects.push({
                            x: e.x, y: e.y - 44,
                            text: 'IT SCREAMS', life: 1.6, color: '#ff5555'
                        });
                        this.screenShake = 0.35;
                    }
                    e.hitFlash = 0.35;
                    this.addBloodStain(e.x, e.y + e.h / 2);
                    this.hitEffects.push({ x: e.x, y: e.y - 30, text: `-1`, life: 1.0 });

                    // At/under 50% HP for the first time → drop a limb + blood pool
                    const half = e.maxHp / 2;
                    if (!e.maimed && e.hp > 0 && e.hp <= half && hpBefore > half) {
                        this.maimEnemy(e);
                    }

                    if (e.hp <= 0) this.killEnemy(e);
                    this.projectiles.splice(i, 1);
                    hitEnemy = true;
                    break;
                }
            }
            if (hitEnemy) continue;

            // Armada hit
            if (a.active && this.currentRoom === a.room &&
                (a.state === 'chasing' || a.state === 'stalking') &&
                p.x > a.x && p.x < a.x + a.w &&
                p.y > a.y && p.y < a.y + a.h) {
                a.hitsTaken += 1;
                a.hitFlash = 0.35;
                a.knockbackX = Math.cos(p.angle) * 200;
                a.knockbackY = Math.sin(p.angle) * 200;
                this.addBloodStain(a.x + a.w / 2, a.y + a.h - 6);
                this.hitEffects.push({
                    x: a.x + a.w / 2, y: a.y,
                    text: `-1  (${a.hitsTaken})`, life: 1.0
                });
                this.projectiles.splice(i, 1);
                continue;
            }

            // Jordan hit (lobby boss) — only vulnerable while STUNNED
            const j = this.jordan;
            if (j.active && !j.defeated && this.currentRoom === 'lobby' &&
                p.x > j.x && p.x < j.x + j.w &&
                p.y > j.y && p.y < j.y + j.h) {
                if (j.state === 'stunned') {
                    this.damageJordan(p.angle);
                } else {
                    // He dodges it while he's on his feet. Spam this and he
                    // punishes you.
                    j.wastedThrows += 1;
                    this.hitEffects.push({
                        x: j.x + j.w / 2, y: j.y - 10,
                        text: `DODGED (${j.wastedThrows}/5)`, life: 0.9, color: '#999999'
                    });
                    if (j.wastedThrows >= 5 && !j.punishStage) {
                        this.startJordanPunish();
                    }
                }
                this.projectiles.splice(i, 1);
                continue;
            }

            // Armada, in the last fight
            const af = this.armadaFinal;
            if (af.active && af.state === 'fighting') {
                const a = this.armada;
                if (p.x > a.x - 22 && p.x < a.x + 22 &&
                    p.y > a.y - 32 && p.y < a.y + 32) {
                    this.hitArmadaFinal(p.weaponId, !!p.isFreezeShot);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // the man with the freeze gun
            const fr = this.frost;
            if (fr.active && this.currentRoom === 'dining' &&
                p.x > fr.x - fr.w / 2 && p.x < fr.x + fr.w / 2 &&
                p.y > fr.y - fr.h / 2 && p.y < fr.y + fr.h / 2) {
                this.hitFrost(p.damage);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Raymond — nothing you throw makes any difference
            const ry = this.raymond;
            const ryRoom = ry.mode === 'rematch' ? 'games' : 'roof';
            if (ry.active && this.currentRoom === ryRoom &&
                p.x > ry.x - ry.w / 2 && p.x < ry.x + ry.w / 2 &&
                p.y > ry.y - ry.h / 2 && p.y < ry.y + ry.h / 2) {
                if (this.endScene.active) {
                    this.projectiles.splice(i, 1);
                    continue;
                }
                if (ry.mode === 'rematch') {
                    if (p.isFreezeShot) {
                        // one blast is three pellets — only the first one counts,
                        // the rest just keep him iced
                        if (ry.frozen > 0) ry.frozen = 5.0;
                        else this.freezeRaymond();
                    } else if (ry.frozen > 0) {
                        // the top of him is his head
                        const headTop = ry.y - ry.h / 2;
                        const isHead = p.y < headTop + ry.h * 0.3;
                        let dmg = 5;
                        let label = null;
                        if (p.isShotgunShot) {
                            // One shell counts once. The pellets spread, so the
                            // first to land may be a body hit while another is a
                            // head hit — the shot is scored on its best pellet.
                            const body = 15;                      // three times a blade
                            const headD = Math.round(body * 1.75 * 100) / 100;
                            if (!ry.shellThisShot) {
                                ry.shellThisShot = true;
                                ry.shellWasHead = isHead;
                                this.hurtRaymond(isHead ? headD : body,
                                                 isHead ? 'POINT BLANK — HEAD' : 'POINT BLANK');
                            } else if (isHead && !ry.shellWasHead) {
                                ry.shellWasHead = true;
                                this.hurtRaymond(headD - body, 'HEAD');
                            }
                            this.projectiles.splice(i, 1);
                            continue;
                        }
                        if (isHead) {
                            dmg = Math.round(dmg * 1.75 * 100) / 100;
                            label = 'HEADSHOT';
                        }
                        this.hurtRaymond(dmg, label);
                    } else {
                        ry.hitFlash = 0.2;
                        this.hitEffects.push({
                            x: ry.x, y: ry.y - 40,
                            text: 'IT GOES STRAIGHT THROUGH HIM', life: 1.0, color: '#999999'
                        });
                    }
                } else {
                    ry.hitFlash = 0.2;
                    this.hitEffects.push({
                        x: ry.x, y: ry.y - 40,
                        text: 'HE DOESN\'T EVEN SLOW DOWN', life: 1.0, color: '#999999'
                    });
                }
                this.projectiles.splice(i, 1);
                continue;
            }

            // The anomaly (Room 1, guard's quest)
            if (this.hitAnomaly(p.x, p.y)) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Dummy (only in room1)
            if (this.currentRoom === 'room1' && this.dummy.hp > 0 &&
                p.x > this.dummy.x && p.x < this.dummy.x + this.dummy.w &&
                p.y > this.dummy.y && p.y < this.dummy.y + this.dummy.h) {
                this.hitDummy(p.damage);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Wall hit → gone
            for (const w of this.walls) {
                if (p.x > w.x && p.x < w.x + w.w && p.y > w.y && p.y < w.y + w.h) {
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }
    },

    // Add a permanent blood stain on the floor at (x, y)
    addBloodStain(x, y, big = false) {
        this.bloodStains.push({
            x: x, y: y,
            r: big ? (16 + Math.random() * 8) : (8 + Math.random() * 6),
            // a few random droplets around the main splat
            drops: Array.from({ length: big ? 6 : 3 }, () => ({
                dx: (Math.random() - 0.5) * (big ? 40 : 24),
                dy: (Math.random() - 0.5) * (big ? 40 : 24),
                r: 2 + Math.random() * 3
            }))
        });
        // Cap total stains so memory doesn't grow forever
        if (this.bloodStains.length > 500) this.bloodStains.shift();
    },

    // A spreading pool of blood on the floor (grows to full size over ~1s)
    addBloodPool(x, y, big = false) {
        this.bloodPools.push({
            x: x, y: y,
            r: 0,                                  // current radius (animates up)
            maxR: big ? (30 + Math.random() * 10) : (20 + Math.random() * 8)
        });
        if (this.bloodPools.length > 120) this.bloodPools.shift();
    },

    // A burst of blood droplets that fly out and land on the floor (staying).
    spawnBloodBurst(x, y, count = 10) {
        for (let n = 0; n < count; n++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 45;
            this.bloodStains.push({
                x: x + Math.cos(ang) * dist,
                y: y + Math.sin(ang) * dist * 0.7,
                r: 2 + Math.random() * 4,
                drops: []
            });
        }
        if (this.bloodStains.length > 500) {
            this.bloodStains.splice(0, this.bloodStains.length - 500);
        }
    },

    // Drop a specific severed limb type on the floor, near (x, y).
    dropGib(type, x, y) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 18 + Math.random() * 34;
        this.gibs.push({
            type: type,
            x: x + Math.cos(ang) * dist,
            y: y + Math.sin(ang) * dist * 0.4,
            rot: Math.random() * Math.PI * 2
        });
        if (this.gibs.length > 60) this.gibs.shift();
        // Every limb drop sprays blood that stays on the floor
        this.spawnBloodBurst(x, y, 12);
    },

    // Enemy hits 50% HP: rip off a random limb (arm or leg) and pool blood.
    maimEnemy(e) {
        e.maimed = true;
        e.missingLimb = Math.random() < 0.5 ? 'arm' : 'leg';
        this.addBloodPool(e.x, e.y + e.h / 2 - 4, false);
        this.dropGib(e.missingLimb, e.x, e.y + e.h / 2);
    },

    // Enemy dies: pop off a random limb (head, arm, or leg) with a blood burst.
    gibOnDeath(e) {
        const choices = ['head', 'arm', 'leg'];
        // Avoid dropping the same limb that was already torn off at 50%
        const pool = choices.filter(c => c !== e.missingLimb);
        const type = pool[Math.floor(Math.random() * pool.length)];
        if (type === 'head') e.headless = true;
        this.dropGib(type, e.x, e.y + e.h / 2);
    },

    // Everything that happens when an enemy dies. Shared by the shiv and the
    // debug key, so drops (the hallway key, the A-02 letter) always fire.
    killEnemy(e) {
        if (e.dead) return;
        if (e.kind === 'crawler') {
            if (e.phase === 'whole') { this.splitCrawler(e); return; }
            this.crawlerDead = true;
        }
        e.hp = 0;
        e.dead = true;
        e.deathAnim = 0;
        this.addBloodStain(e.x, e.y + e.h / 2, true);
        this.addBloodPool(e.x, e.y + e.h / 2 - 4, true);  // death pool
        this.spawnBloodBurst(e.x, e.y, 16);               // big gush
        this.gibOnDeath(e);                               // pop a limb off
        this.hitEffects.push({
            x: e.x, y: e.y - 40,
            text: 'KILLED', life: 1.5, color: '#ffcc44'
        });
        this.dropEnemyLoot(e);
        this.onEnemyKilled(e);
    },

    // Bodies are worth searching. Uses the same loot table as the drawers, so
    // there's one economy rather than two.
    dropEnemyLoot(e) {
        // the things from the wall were carrying more than the patients were
        const chance = e.kind === 'anomaly' ? 0.85 : 0.5;
        if (Math.random() > chance) return;

        // once you're carrying the pistol, bodies sometimes have rounds
        if ((this.hasPistol || this.hasShotgun) && Math.random() < 0.25) {
            const fbA = this.getRoomData().floorBounds;
            this.items.push({
                id: 'ammo', name: 'ROUNDS',
                x: Math.max(fbA.x + 20, Math.min(fbA.x + fbA.w - 20, e.x + 12)),
                y: Math.max(fbA.y + 20, Math.min(fbA.y + fbA.h - 20, e.y + 16)),
                pickupRadius: 40, pickedUp: false,
                spawnTime: this.time, isRecovered: true
            });
        }

        const drops = (e.kind === 'anomaly' && Math.random() < 0.4) ? 2 : 1;
        const fb = this.getRoomData().floorBounds;
        for (let n = 0; n < drops; n++) {
            const roll = rollLoot();
            const x = Math.max(fb.x + 20, Math.min(fb.x + fb.w - 20,
                        e.x + (Math.random() - 0.5) * 34));
            const y = Math.max(fb.y + 20, Math.min(fb.y + fb.h - 20,
                        e.y + 14 + (Math.random() - 0.5) * 24));
            this.items.push({
                id: roll.id, name: roll.name,
                x: x, y: y,
                pickupRadius: 40, pickedUp: false,
                spawnTime: this.time, isRecovered: true
            });
        }
    },

    // Hook called when any enemy dies. In A-02, the first kill drops the letter.
    onEnemyKilled(e) {
        if (this.currentRoom === 'a02' && !this.letterDropped && !this.hasLetter) {
            this.letterDropped = true;
            this.items.push({
                id: 'letter',
                name: 'LETTER',
                x: e.x, y: e.y + e.h / 2,
                pickupRadius: 40,
                pickedUp: false,
                spawnTime: this.time,
                isRecovered: true
            });
        }
    },

    // ===== DOCTOR / JORDAN SEQUENCE =====
    triggerDoctor() {
        this.doctorTriggered = true;
        this.doctorPromptTarget = null;
        this.dialogue.active = true;
        this.dialogue.line = 0;
        this.dialogue.charIndex = 0;
        this.dialogue.charTimer = 0;
    },

    updateDialogue(dt) {
        const d = this.dialogue;
        const fullLine = d.lines[d.line];
        if (d.charIndex < fullLine.length) {
            // typing out current line
            d.charTimer += dt;
            if (d.charTimer > 0.02) {
                d.charTimer = 0;
                d.charIndex++;
            }
            // click/key skips to end of line
            if (keysPressed['e'] || keysPressed[' '] || mouse.clicked) {
                d.charIndex = fullLine.length;
            }
        } else {
            // line fully shown → advance on click/key
            if (keysPressed['e'] || keysPressed[' '] || mouse.clicked) {
                if (d.line < d.lines.length - 1) {
                    d.line++;
                    d.charIndex = 0;
                    d.charTimer = 0;
                } else {
                    // dialogue finished → run whatever it was set up to trigger
                    d.active = false;
                    const finish = d.onFinish || 'spawnJordan';
                    d.onFinish = null;
                    if (finish === 'postJordanRewards') this.givePostJordanRewards();
                    else if (finish === 'startLoungeQuest') this.startLoungeQuest();
                    else if (finish === 'startCompanion') this.startCompanion();
                    else if (finish === 'startGuardQuest') this.startGuardQuest();
                    else if (finish === 'joinGuard') this.joinGuard();
                    else if (finish === 'spawnJordan') this.spawnJordan();
                    this.autosave();
                }
            }
        }
    },

    spawnJordan() {
        this.jordanAppeared = true;
        this.jordanBannerTime = 3.0;   // show the "JORDAN" banner for 3s
        this.screenShake = 0.6;
        // Activate the boss. He starts idle; the fight begins after the banner.
        const j = this.jordan;
        j.active = true;
        j.x = 480; j.y = 240;
        j.state = 'idle';
        j.stateTimer = 3.0;   // wait out the banner before first charge
        j.hitFlash = 0;
        j.touchCooldown = 0;
        j.hasHitWall = false;
    },

    // ===== JORDAN BOSS AI (Part 1: charge → lure → wall-slam → stun) =====
    updateJordan(dt) {
        const j = this.jordan;
        if (!j.active || this.currentRoom !== 'lobby') return;
        if (j.hitFlash > 0) j.hitFlash -= dt;
        if (j.touchCooldown > 0) j.touchCooldown -= dt;
        if (j.barBreakFlash > 0) j.barBreakFlash -= dt;
        if (j.defeated) return;   // he's down; no more attacking

        // The counter-attack takes over completely while it plays
        if (j.punishStage) {
            this.updateJordanPunish(dt);
            return;
        }

        const p = this.player;
        j.stateTimer -= dt;

        if (j.state === 'idle') {
            // brief pause, then RANDOMLY pick the next move: charge or throw
            if (j.stateTimer <= 0) {
                if (Math.random() < 0.5) {
                    j.state = 'windup';
                    j.stateTimer = j.windupTime;
                } else {
                    // ranged volley: throw 1–5 weapons
                    j.state = 'throwing';
                    j.throwsLeft = 1 + Math.floor(Math.random() * 5);   // 1..5
                    j.throwTimer = 0.35;   // small delay before first throw
                }
            }
        } else if (j.state === 'throwing') {
            // face the player
            const dx = p.x - (j.x + j.w / 2);
            const dy = p.y - (j.y + j.h / 2);
            j.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left')
                                                   : (dy > 0 ? 'down' : 'up');
            j.throwTimer -= dt;
            if (j.throwTimer <= 0) {
                // hurl one weapon toward the player's current position
                const ang = Math.atan2(dy, dx);
                this.enemyProjectiles.push({
                    x: j.x + j.w / 2, y: j.y + j.h / 2,
                    angle: ang,
                    speed: 300,
                    rotation: ang,
                    life: 3.0,
                    fromJordan: true
                });
                j.throwsLeft -= 1;
                j.throwTimer = 0.45;   // gap between throws in the volley
                if (j.throwsLeft <= 0) {
                    j.state = 'recover';
                    j.stateTimer = j.recoverTime;
                }
            }
        } else if (j.state === 'windup') {
            // face the player and lock onto their position at the end of windup
            const dx = p.x - (j.x + j.w / 2);
            const dy = p.y - (j.y + j.h / 2);
            j.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left')
                                                   : (dy > 0 ? 'down' : 'up');
            if (j.stateTimer <= 0) {
                // lock charge direction toward the player's current position
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                j.chargeDX = dx / len;
                j.chargeDY = dy / len;
                j.state = 'charging';
                j.stateTimer = 2.0;        // max charge duration (safety)
                j.hasHitWall = false;
            }
        } else if (j.state === 'charging') {
            const nx = j.x + j.chargeDX * j.speed * dt;
            const ny = j.y + j.chargeDY * j.speed * dt;

            // Check wall collision at the new position (his body box)
            if (this.jordanHitsWall(nx, ny)) {
                // SLAM — he stuns himself on the wall
                j.state = 'stunned';
                j.stateTimer = j.stunTime;
                j.hasHitWall = true;
                j.wastedThrows = 0;   // good play clears the punish counter
                this.screenShake = 0.5;
                this.spawnBloodBurst(j.x + j.w / 2, j.y + j.h / 2, 6);  // a little impact
            } else {
                j.x = nx; j.y = ny;
                // Did he run into the player? (failed dodge)
                if (j.touchCooldown <= 0 && this.jordanTouchesPlayer()) {
                    this.damagePlayer(1);         // full bar
                    j.touchCooldown = 1.5;
                    this.screenShake = 0.4;
                }
            }
            // safety: if charge runs too long without hitting anything, recover
            if (j.stateTimer <= 0) {
                j.state = 'recover';
                j.stateTimer = j.recoverTime;
            }
        } else if (j.state === 'stunned') {
            // Vulnerable window. If it runs out before the bar is broken, the
            // damage chipped off it is lost — you have to land all 3 in one stun.
            if (j.stateTimer <= 0) {
                if (j.hitsInBar > 0) {
                    j.hitsInBar = 0;
                    this.hitEffects.push({
                        x: j.x + j.w / 2, y: j.y - 34,
                        text: 'HE RECOVERS', life: 1.4, color: '#88aaff'
                    });
                }
                j.state = 'recover';
                j.stateTimer = j.recoverTime;
            }
        } else if (j.state === 'recover') {
            if (j.stateTimer <= 0) {
                j.state = 'idle';
                j.stateTimer = 0.4 + Math.random() * 0.4;
            }
        }

        // Keep Jordan within the room bounds (so he can't leave the arena)
        const fb = this.lobby.floorBounds;
        if (j.x < fb.x) j.x = fb.x;
        if (j.x + j.w > fb.x + fb.w) j.x = fb.x + fb.w - j.w;
        if (j.y < 175) j.y = 175;
        if (j.y + j.h > fb.y + fb.h) j.y = fb.y + fb.h - j.h;
    },

    // Does Jordan's body box collide with a wall at position (nx, ny)?
    jordanHitsWall(nx, ny) {
        const j = this.jordan;
        // shrink the test box a little so he gets close before slamming
        const box = { x: nx + 6, y: ny + 6, w: j.w - 12, h: j.h - 12 };
        for (const w of this.walls) {
            if (box.x < w.x + w.w && box.x + box.w > w.x &&
                box.y < w.y + w.h && box.y + box.h > w.y) {
                return true;
            }
        }
        // also count the very edges of the arena as walls
        const fb = this.lobby.floorBounds;
        if (nx < fb.x || nx + j.w > fb.x + fb.w || ny < 175 || ny + j.h > fb.y + fb.h) {
            return true;
        }
        return false;
    },

    // Does Jordan overlap the player?
    jordanTouchesPlayer() {
        const j = this.jordan;
        const p = this.player;
        return (p.x + p.w / 2 > j.x && p.x - p.w / 2 < j.x + j.w &&
                p.y + p.h / 2 > j.y && p.y - p.h / 2 < j.y + j.h);
    },

    // Land a hit on a stunned Jordan. Three hits break one bar; three bars kills him.
    damageJordan(angle) {
        const j = this.jordan;
        if (j.defeated) return;

        j.hitFlash = 0.35;
        j.hitsInBar += 1;
        this.screenShake = 0.25;

        // blood on the floor under him
        this.addBloodStain(j.x + j.w / 2, j.y + j.h - 6);
        this.spawnBloodBurst(j.x + j.w / 2, j.y + j.h / 2, 8);

        this.hitEffects.push({
            x: j.x + j.w / 2, y: j.y - 10,
            text: `-1  (${j.hitsInBar}/${j.hitsPerBar})`, life: 1.0
        });

        if (j.hitsInBar >= j.hitsPerBar) {
            // a whole bar breaks
            j.hitsInBar = 0;
            j.barsLeft -= 1;
            j.barBreakFlash = 1.0;
            this.screenShake = 0.6;
            this.addBloodPool(j.x + j.w / 2, j.y + j.h - 4, true);
            this.spawnBloodBurst(j.x + j.w / 2, j.y + j.h / 2, 20);

            if (j.barsLeft <= 0) {
                j.barsLeft = 0;
                this.defeatJordan();
            } else {
                this.hitEffects.push({
                    x: j.x + j.w / 2, y: j.y - 34,
                    text: 'BAR BROKEN', life: 1.6, color: '#ffcc44'
                });
                // breaking a bar snaps him out of the stun
                j.state = 'recover';
                j.stateTimer = j.recoverTime;
            }
        }
    },

    // Too many wasted throws — Jordan catches one and hurls it back.
    startJordanPunish() {
        const j = this.jordan;
        j.wastedThrows = 0;
        j.punishStage = 'throwback';
        j.punishTimer = 0.45;        // travel time before it connects
        // cancel whatever he was doing
        j.state = 'idle';
        j.stateTimer = 2.5;
        j.throwsLeft = 0;

        // the returned weapon, flying at the player
        const ang = Math.atan2(this.player.y - (j.y + j.h / 2),
                               this.player.x - (j.x + j.w / 2));
        this.enemyProjectiles.push({
            x: j.x + j.w / 2, y: j.y + j.h / 2,
            angle: ang, speed: 420, rotation: ang, life: 1.2,
            fromJordan: true, isPunish: true
        });

        this.hitEffects.push({
            x: j.x + j.w / 2, y: j.y - 34,
            text: 'HE THROWS IT BACK', life: 1.6, color: '#ff6666'
        });
    },

    // Runs the punish: the throwback lands and stuns you, then he closes in
    // and takes a bar of health.
    updateJordanPunish(dt) {
        const j = this.jordan;
        if (!j.punishStage) return;

        j.punishTimer -= dt;

        if (j.punishStage === 'throwback' && j.punishTimer <= 0) {
            // the returned weapon connects — you're stunned, not damaged yet
            this.player.stunTimer = 1.5;
            this.screenShake = 0.5;
            this.hitEffects.push({
                x: this.player.x, y: this.player.y - 40,
                text: 'STUNNED', life: 1.5, color: '#ffee66'
            });
            j.punishStage = 'closing';
            j.punishTimer = 1.1;     // he reaches you just before the stun ends
        } else if (j.punishStage === 'closing') {
            // stalk toward the helpless player
            const dx = this.player.x - (j.x + j.w / 2);
            const dy = this.player.y - (j.y + j.h / 2);
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            j.x += (dx / d) * 260 * dt;
            j.y += (dy / d) * 260 * dt;

            if (j.punishTimer <= 0) {
                this.damagePlayer(1);        // full bar
                this.screenShake = 0.7;
                this.spawnBloodBurst(this.player.x, this.player.y, 10);
                j.punishStage = '';
                j.state = 'recover';
                j.stateTimer = j.recoverTime;
            }
        }
    },

    // After Jordan falls the doctor crosses the lobby to explain what he was.
    updatePostJordan(dt) {
        if (this.currentRoom !== 'lobby') return;

        if (this.postJordanStage === 'approaching') {
            this.postJordanTimer -= dt;
            if (this.postJordanTimer > 0) return;

            // walk toward the player, stopping just short
            this.doctorWalking = true;
            const dx = this.player.x - this.doctorX;
            const dy = this.player.y - this.doctorY;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            if (d > 70) {
                this.doctorX += (dx / d) * 90 * dt;
                this.doctorY += (dy / d) * 90 * dt;
            } else {
                // close enough — he speaks
                this.doctorWalking = false;
                this.postJordanStage = 'talked';
                this.dialogue.active = true;
                this.dialogue.speaker = 'DOCTOR';
                this.dialogue.lines = [
                    "You killed it. God help you, you actually killed it.",
                    "That was Jordan. Before the labs, he was a patient here — scared, quiet, harmless. Then they took him downstairs.",
                    "They called it treatment. It wasn't. They were building something, and he was the material.",
                    "Take this. The kitchen key — and a torch. You'll need it down there, the power's been dead for months.",
                    "And when you can... come find me. There's something in the doctors' lounge you need to see."
                ];
                this.dialogue.line = 0;
                this.dialogue.charIndex = 0;
                this.dialogue.charTimer = 0;
                this.dialogue.onFinish = 'postJordanRewards';
            }
        }
    },

    // After his speech he holds the key out — you have to take it.
    givePostJordanRewards() {
        this.keyOffered = true;
    },

    // Press E while he's offering to actually take the key and torch.
    tryTakeKitchenKey() {
        if (!this.keyOffered || this.hasKitchenKey) return false;
        if (this.currentRoom !== 'lobby') return false;
        const dx = this.player.x - this.doctorX;
        const dy = this.player.y - this.doctorY;
        if (Math.sqrt(dx * dx + dy * dy) > 60) return false;

        this.hasKitchenKey = true;
        this.hasFlashlight = true;
        this.keyOffered = false;
        this.pickupNotice = 'RECEIVED: KITCHEN KEY & FLASHLIGHT';
        this.pickupNoticeTime = 2.1;

        // he immediately explains what he actually wants from you
        this.dialogue.active = true;
        this.dialogue.speaker = 'DOCTOR';
        this.dialogue.lines = [
            "There's a file in the doctors' lounge. Confidential. Everything they did down there is in it.",
            "I can't get to it — the lounge is locked and I don't carry that key.",
            "But Adler does. My colleague. I sent him to the kitchen for supplies hours ago.",
            "He hasn't come back. The lights are out in there and he hasn't come back.",
            "Find him. Get the lounge key off him — and please, if he's still breathing, bring him out."
        ];
        this.dialogue.line = 0;
        this.dialogue.charIndex = 0;
        this.dialogue.charTimer = 0;
        this.dialogue.onFinish = 'startLoungeQuest';
        return true;
    },

    // The lounge quest is live — mark him and point the player at the kitchen.
    startLoungeQuest() {
        this.sideQuestActive = true;
        this.hallwayNotice = 'FIND ADLER IN THE KITCHEN.';
        this.hallwayNoticeTime = 2.4;
    },

    // Jordan dies. (The room-wide gore finale gets expanded later.)
    defeatJordan() {
        const j = this.jordan;
        j.defeated = true;
        j.state = 'dead';
        j.stateTimer = 0;
        this.enemyProjectiles = [];   // his knives in flight vanish with him

        // Kick off the finale. It plays out in waves over the next ~2 seconds
        // rather than dumping everything at once (see updateGoreFinale).
        this.goreFinale = {
            active: true,
            timer: 0,
            wave: 0,
            originX: j.x + j.w / 2,
            originY: j.y + j.h / 2,
            flash: 1.0
        };

        this.screenShake = 1.2;

        // the first rupture, right where he stands
        for (let n = 0; n < 8; n++) {
            this.addBloodPool(
                j.x + j.w / 2 + (Math.random() - 0.5) * 100,
                j.y + j.h - 4 + (Math.random() - 0.5) * 60,
                true
            );
        }
        this.spawnBloodBurst(j.x + j.w / 2, j.y + j.h / 2, 60);

        // he comes apart — limbs thrown clear of the body
        const parts = ['head', 'arm', 'arm', 'leg', 'leg'];
        for (const type of parts) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 160;
            this.gibs.push({
                type: type,
                x: j.x + j.w / 2 + Math.cos(ang) * dist,
                y: j.y + j.h / 2 + Math.sin(ang) * dist * 0.55,
                rot: Math.random() * Math.PI * 2
            });
        }

        this.hitEffects.push({
            x: j.x + j.w / 2, y: j.y - 40,
            text: 'JORDAN FALLS', life: 3.0, color: '#ffcc44'
        });

        // the doctor comes out to explain what Jordan was — held back until
        // the room has finished painting itself red
        this.postJordanStage = 'approaching';
        this.postJordanTimer = 4.0;
        const lk = this.lobby.lockers.find(l => l.hasDoctor);
        if (lk) {
            this.doctorX = lk.x + lk.w / 2;
            this.doctorY = lk.y + lk.h + 10;
        }
        this.autosave();
    },

    // The finale: blood spreads outward from the body in waves until the
    // whole lobby floor is covered.
    updateGoreFinale(dt) {
        const gf = this.goreFinale;
        if (!gf || !gf.active) return;

        gf.timer += dt;
        if (gf.flash > 0) gf.flash -= dt * 1.6;

        const fb = this.lobby.floorBounds;
        const waveEvery = 0.22;

        while (gf.wave < 9 && gf.timer > gf.wave * waveEvery) {
            gf.wave += 1;
            const w = gf.wave;

            // each wave reaches further out from the body
            const radius = 70 + w * 75;

            // splatter ring
            for (let n = 0; n < 14; n++) {
                const ang = Math.random() * Math.PI * 2;
                const d = radius * (0.65 + Math.random() * 0.5);
                const x = gf.originX + Math.cos(ang) * d;
                const y = gf.originY + Math.sin(ang) * d * 0.6;
                if (x < fb.x || x > fb.x + fb.w || y < fb.y || y > fb.y + fb.h) continue;
                this.spawnBloodBurst(x, y, 5);
            }

            // pools, thinning out as the wave travels
            const pools = Math.max(1, 5 - Math.floor(w / 2));
            for (let n = 0; n < pools; n++) {
                const ang = Math.random() * Math.PI * 2;
                const d = radius * (0.5 + Math.random() * 0.6);
                const x = gf.originX + Math.cos(ang) * d;
                const y = gf.originY + Math.sin(ang) * d * 0.6;
                if (x < fb.x || x > fb.x + fb.w || y < fb.y || y > fb.y + fb.h) continue;
                this.addBloodPool(x, y, Math.random() < 0.6);
            }

            // occasional chunk flung across the room
            if (w % 3 === 0) {
                const ang = Math.random() * Math.PI * 2;
                const d = radius * 0.8;
                const x = gf.originX + Math.cos(ang) * d;
                const y = gf.originY + Math.sin(ang) * d * 0.6;
                if (x > fb.x && x < fb.x + fb.w && y > fb.y && y < fb.y + fb.h) {
                    this.gibs.push({
                        type: ['arm', 'leg'][Math.floor(Math.random() * 2)],
                        x: x, y: y,
                        rot: Math.random() * Math.PI * 2
                    });
                }
            }

            this.screenShake = Math.max(this.screenShake, 0.5 - w * 0.04);
        }

        // final pass — a thin spray over the whole floor so nothing is clean
        if (gf.wave >= 9 && !gf.finished) {
            gf.finished = true;
            for (let n = 0; n < 60; n++) {
                const x = fb.x + Math.random() * fb.w;
                const y = fb.y + Math.random() * fb.h;
                this.bloodStains.push({
                    x: x, y: y,
                    r: 2 + Math.random() * 5,
                    drops: []
                });
            }
        }

        if (gf.timer > 2.6) gf.active = false;
    },

    hitDummy(damage) {
        this.dummy.hp -= damage;
        this.dummy.hitFlash = 0.4;
        this.hitEffects.push({
            x: this.dummy.x + this.dummy.w / 2,
            y: this.dummy.y, text: `-${damage}`, life: 1.0
        });
        if (this.dummy.hp <= 0) {
            this.dummy.hp = 0;
            this.dummy.respawnTimer = 3.0;
            this.hitEffects.push({
                x: this.dummy.x + this.dummy.w / 2,
                y: this.dummy.y - 20,
                text: 'DEFEATED', life: 1.5, color: '#ffcc44'
            });
        }
    },

    // ===== PLAYER =====
    damagePlayer(amount) {
        if (this.godMode) return;
        if (this.player.iframes > 0 || this.isDead) return;
        this.player.hp -= amount;
        this.player.iframes = 1.0;
        this.damageFlash = 0.6;
        if (this.player.hp <= 0) { this.player.hp = 0; this.triggerDeath(); }
    },

    healPlayer(amount) {
        this.player.poison = 0;   // bandages and medicine treat it too
        if (this.isDead) return;
        const before = this.player.hp;
        this.player.hp = Math.min(this.player.hp + amount, this.player.maxHp);
        if (this.player.hp > before) this.healFlash = 0.4;
    },

    triggerDeath() {
        this.isDead = true; this.deathFade = 0; this.deathTime = 0;
        this.deathWords = '';           // last-words the player types
        this.deathWordsSent = false;
        // Remember where the player died; the death event is sent AFTER they
        // type their last words on the death screen (see update()).
        this._deathRoom = this.currentRoom;
        this._deathX = Math.round(this.player.x);
        this._deathY = Math.round(this.player.y);
    },

    restartFromDeath() {
        // Progression survives death — keys, the torch, quest state. Only your
        // carried gear is gone, because it's lying where you fell.
        this._preserveInventoryOnRestart = true;
        this.onEnter();

        this.inventory = [];
        this.weaponDurability = {};
        this.equippedWeapon = null;

        if (this._droppedOnDeath) {
            this.pickupNotice = 'YOU DROPPED EVERYTHING WHERE YOU FELL';
            this.pickupNoticeTime = 2.4;
            this._droppedOnDeath = false;
        }
        this.autosave();
    },

    // The server granted us a pile — add its contents to the inventory.
    receiveLoot(loot) {
        let count = 0;
        for (const item of loot) {
            const existing = this.inventory.find(i => i.id === item.id);
            if (existing) existing.qty += (item.qty || 1);
            else this.inventory.push({ id: item.id, name: item.name, qty: item.qty || 1 });
            count += (item.qty || 1);
            if (WEAPON_STATS[item.id] && this.weaponDurability[item.id] === undefined) {
                this.weaponDurability[item.id] = WEAPON_STATS[item.id].durabilityMax;
            }
        }
        this.autoEquipWeapon();
        this.pickupNotice = 'RECOVERED ' + count + ' ITEM' + (count === 1 ? '' : 'S');
        this.pickupNoticeTime = 1.8;
    },

    // Standing on a dropped pile and pressing E asks the server for it.
    tryClaimLoot() {
        if (typeof netChat === 'undefined' || !netChat.lootInRoom) return false;
        const piles = netChat.lootInRoom(this.currentRoom);
        for (const pile of piles) {
            if (Math.hypot(this.player.x - pile.x, this.player.y - pile.y) < 45) {
                if (netChat.requestClaim(pile.id)) {
                    this.pickupNotice = 'REACHING FOR IT...';
                    this.pickupNoticeTime = 1.2;
                }
                return true;
            }
        }
        return false;
    },

    // ===== DRAWERS (Room 1 only) =====
    // Guarantees at least 1 shard + 1 cloth across all 3 drawers combined,
    // so the player can always craft a shiv even with unlucky rolls.
    spawnDrawers(customPositions) {
        if (!customPositions && this.currentRoom !== 'room1') return;
        const dW = 65; const dH = 110;
        const positions = customPositions || [
            { x: 180, y: 35 }, { x: 340, y: 35 }, { x: 780, y: 35 }
        ];

        // Roll loot for all 3 drawers first
        const allDrawerLoot = [];
        for (let i = 0; i < positions.length; i++) {
            let loot = [];
            const isJackpot = Math.random() < 0.10;
            let numItems;
            if (isJackpot) numItems = 4 + Math.floor(Math.random() * 2);
            else numItems = 2 + Math.floor(Math.random() * 2);
            for (let n = 0; n < numItems; n++) {
                const roll = rollLoot(this.hasPistol || this.hasShotgun);
                loot.push({ id: roll.id, name: roll.name, isJackpot });
            }
            allDrawerLoot.push({ loot, isJackpot });
        }

        // Room 1 only: guarantee the makings of a first shiv. Other rooms take
        // their chances, and may have fewer than two drawers anyway.
        if (!customPositions && allDrawerLoot.length >= 2) {
            const allItems = allDrawerLoot.flatMap(d => d.loot.map(i => i.id));
            if (!allItems.includes('shard')) {
                allDrawerLoot[0].loot.push({ id: 'shard', name: 'GLASS SHARD', isJackpot: allDrawerLoot[0].isJackpot });
            }
            if (!allItems.includes('cloth')) {
                allDrawerLoot[1].loot.push({ id: 'cloth', name: 'CLOTH STRIP', isJackpot: allDrawerLoot[1].isJackpot });
            }
        }

        this.drawers = positions.map((pos, i) => {
            return {
                x: pos.x, y: pos.y, w: dW, h: dH,
                state: 'closed',
                loot: allDrawerLoot[i].loot,
                isJackpot: allDrawerLoot[i].isJackpot,
                interactionRadius: 55
            };
        });
    },

    rebuildWalls() {
        const rd = this.getRoomData();
        this.walls = [...rd.baseWalls];
        for (const d of this.drawers) {
            this.walls.push({
                x: d.x + 5, y: d.y + d.h - 25,
                w: d.w - 10, h: 25
            });
        }
    },

    // While the chat box has the keyboard, the game must not read it — or
    // typing a message walks you into walls and swaps your weapon.
    chatHasKeyboard() {
        return typeof netChat !== 'undefined' && netChat &&
               typeof netChat.isTyping === 'function' && netChat.isTyping();
    },

    // ===== UPDATE =====
    update(dt) {
        this.time += dt;
        if (!this.isDead && !this.finale.done) this.playTime += dt;

        // The death screen collects letters the same way, so it must keep them.
        const typingLastWords = this.isDead && !this.deathWordsSent;
        if (this.chatHasKeyboard() && !typingLastWords) {
            // swallow everything the game would otherwise act on this frame
            for (const k of Object.keys(keysPressed)) delete keysPressed[k];
            for (const k of Object.keys(keys)) delete keys[k];
            mouse.clicked = false;
        }

        if (this.isDead) {
            this.deathTime += dt;
            this.deathFade = Math.min(1, this.deathFade + dt * 0.6);

            // Phase 1: let the player type their last words, then press Enter to
            // send them (broadcasts the death with the message to everyone).
            if (!this.deathWordsSent) {
                if (keysPressed['enter']) {
                    // everything you were carrying falls where you died
                    const dropped = this.inventory.map(i => ({
                        id: i.id, name: i.name, qty: i.qty
                    }));
                    if (typeof netChat !== 'undefined' && netChat.sendDeath) {
                        netChat.sendDeath(this._deathRoom, this._deathX, this._deathY,
                                          this.deathWords, dropped);
                    }
                    this._droppedOnDeath = dropped.length > 0;
                    this.deathWordsSent = true;
                    return;
                }
                if (keysPressed['backspace']) {
                    this.deathWords = this.deathWords.slice(0, -1);
                }
                for (const k in keysPressed) {
                    if (k === 'backspace' || k === 'enter' || k === 'shift' ||
                        k === 'control' || k === 'alt' || k === 'capslock' ||
                        k === 'tab' || k === 'escape') continue;
                    if (k.length === 1 && this.deathWords.length < 60) {
                        this.deathWords += k;
                    }
                }
                return;
            }

            // Phase 2: after words are sent, press Enter/Space to respawn.
            if (this.deathTime > 1.0 && (keysPressed['enter'] || keysPressed[' '])) {
                this.restartFromDeath();
            }
            return;
        }

        if (this.screenShake > 0) this.screenShake -= dt;

        // Doctor dialogue is open → freeze game; click/E/Space advances lines.
        if (this.dialogue.active) {
            this.updateDialogue(dt);
            return;
        }

        // If the letter is open, freeze the game; E or ESC closes it.
        if (this.letterOpen) {
            if (keysPressed['e'] || keysPressed['escape'] || mouse.clicked) {
                this.letterOpen = false;
            }
            return;
        }

        // "Press E to read" is showing → E opens the full letter
        if (this.letterPromptTime > 0) {
            this.letterPromptTime -= dt;
            if (keysPressed['e']) {
                this.letterOpen = true;
                this.letterPromptTime = 0;
                return;
            }
        }
        // Rereading the letter is the LAST thing E does — it used to run before
        // everything else, so holding the letter meant E could never talk to
        // anyone, open a locker or search a body. See the E chain below.

        if (!this.scriptedMessage.active) {
            if (keysPressed['escape'] || keysPressed['i']) {
                changeScene(inventoryScene);
                return;
            }
        }

        // 1 scissors, 2 shiv, 3 guns — hold 3 to change which gun
        if (keysPressed['1']) this.selectWeapon('scissors');
        if (keysPressed['2']) this.selectWeapon('shiv');
        if (keysPressed['4']) this.selectWeapon('freezegun');
        if (keysPressed['5']) this.selectWeapon('shotgun');
        if (keysPressed['3']) {
            this.gunKeyHold = 0;
            this.gunKeySwapped = false;
            const guns = ['pistol', 'burst'].filter(id => this.ownsWeapon(id));
            const last = (this.lastGun !== 'freezegun' && this.ownsWeapon(this.lastGun))
                ? this.lastGun : null;
            this.selectWeapon(last || guns[0] || 'freezegun');
        }
        if (keys['3']) {
            this.gunKeyHold += dt;
            if (!this.gunKeySwapped && this.gunKeyHold > 0.4) {
                this.gunKeySwapped = true;
                this.swapGun();
            }
        } else {
            this.gunKeyHold = 0;
            this.gunKeySwapped = false;
        }

        // DEBUG: U unlocks every door that isn't open yet
        if (keysPressed['u']) {
            this.unlockEverything();
            this.debugUnlockAll = true;   // and keep them open through a respawn
            this.pickupNotice = 'DEBUG: ALL DOORS UNLOCKED';
            this.pickupNoticeTime = 1.5;
        }

        // DEBUG: P makes you untouchable
        if (keysPressed['p']) {
            this.godMode = !this.godMode;
            this.pickupNotice = this.godMode ? 'DEBUG: INVINCIBLE' : 'DEBUG: MORTAL AGAIN';
            this.pickupNoticeTime = 2.0;
            if (this.godMode) {
                this.player.poison = 0;
                if (this.player.frozen) this.player.frozen.active = false;
            }
        }

        if (keysPressed['h']) this.debugMode = !this.debugMode;

        // R reloads the pistol from your spare rounds
        if (keysPressed['r']) this.startReload();
        if (this.reloadTimer > 0) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) this.finishReload();
        }

        // DEBUG: press J to instantly kill every enemy in this room. Armada is
        // never touched — he isn't in the enemy list, and he can't be killed.
        if (keysPressed['j']) {
            let killed = 0;
            for (const e of this.enemies) {
                if (!e.dead) { this.killEnemy(e); killed++; }
            }

            // in Room 1, J also kills the anomaly
            const an = this.anomaly;
            if (this.currentRoom === 'room1' && an.active &&
                an.state !== 'dead' && an.state !== 'hidden') {
                this.killAnomaly();
                killed++;
            }

            // in the lobby, J also finishes Jordan (skipping the intro if needed)
            // the man with the freeze gun
            if (this.frost && this.frost.active) {
                this.killFrost();
                killed++;
            }

            if (this.currentRoom === 'lobby') {
                if (!this.jordanAppeared) {
                    this.doctorTriggered = true;
                    this.spawnJordan();
                }
                if (!this.jordan.defeated) {
                    this.jordan.barsLeft = 0;
                    this.jordan.hitsInBar = 0;
                    this.defeatJordan();
                    killed++;
                }
            }

            this.pickupNotice = killed > 0
                ? 'DEBUG: KILLED ' + killed + (killed === 1 ? ' ENEMY' : ' ENEMIES')
                : 'DEBUG: NOTHING TO KILL';
            this.pickupNoticeTime = 1.2;
        }

        // F toggles the flashlight (only useful in dark rooms)
        if (keysPressed['f'] && this.hasFlashlight) {
            this.flashlightOn = !this.flashlightOn;
            this.pickupNotice = this.flashlightOn ? 'FLASHLIGHT ON' : 'FLASHLIGHT OFF';
            this.pickupNoticeTime = 1.2;
        }

        // Beam points toward the mouse, easing so it swings rather than snaps
        if (this.flashlightOn) {
            const target = Math.atan2(mouse.y - this.player.y, mouse.x - this.player.x);
            let diff = target - this.flashlightAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.flashlightAngle += diff * Math.min(1, dt * 12);
        }
        if (keysPressed['k']) this.damagePlayer(1);
        if (keysPressed['l']) this.healPlayer(1);
        // DEBUG: press G to grant scissors (for testing weapon switching — remove later)
        if (keysPressed['g']) {
            const existing = this.inventory.find(i => i.id === 'scissors');
            if (existing) existing.qty += 1;
            else this.inventory.push({ id: 'scissors', name: 'SCISSORS', qty: 1 });
            if (this.weaponDurability.scissors === undefined) {
                this.weaponDurability.scissors = WEAPON_STATS.scissors.durabilityMax;
            }
            this.pickupNotice = 'DEBUG: SCISSORS ADDED';
            this.pickupNoticeTime = 1.2;
        }

        if (!this.scriptedMessage.active) this.updateAttackInput(dt);

        // Scroll wheel switches weapons (only among owned weapons)
        if (mouse.scroll !== 0 && !this.scriptedMessage.active) {
            this.cycleWeapon(mouse.scroll > 0 ? 1 : -1);
        }

        this.updateProjectiles(dt);
        this.updateArmadaPursuit(dt);
        this.updateArmada(dt);
        this.updateLoungeAmbush(dt);
        this.updateCompanion(dt);
        this.updateGuard(dt);
        this.updateAnomaly(dt);
        this.updateAnomalyEnemies(dt);
        this.updateCrawlers(dt);
        this.updatePoison(dt);
        for (const e of this.enemies) {
            if (e.distracted > 0) e.distracted -= dt;
            if (!e.dead) this.unstickEnemy(e);
        }
        if (this.muzzleFlash && this.muzzleFlash.life > 0) this.muzzleFlash.life -= dt;
        this.updateSparks(dt);
        this.updateFrostMotes(dt);
        this.updateLaunched(dt);
        this.updateFrost(dt);
        this.updateEndScene(dt);
        this.updateRaymondFollowing(dt);
        this.updateArmadaFinal(dt);
        this.updateFighters(dt);
        this.updateFinale(dt);
        this.updateEpilogue(dt);
        if (this.whiteFlash > 0) this.whiteFlash -= dt * 1.4;
        this.updateFrozen(dt);
        this.updateBurst(dt);
        this.updateGuardSupport(dt);
        this.updateRoofWaves(dt);
        this.updateDiningAmbush(dt);
        this.updateTortureLockdown(dt);
        this.updateRaymond(dt);
        this.updateRaymondScene(dt);
        // he comes up once the roof has gone quiet
        if (this.currentRoom === 'roof' && this.roofWaveCleared &&
            !this.raymond.active && !this.raymondScene.done && this.roofWaveGap > 0) {
            this.roofWaveGap -= dt;
            if (this.roofWaveGap <= 0) this.spawnRaymond();
        }
        this.updateEnemies(dt);
        this.updateA02Enemies(dt);
        this.updateShyEnemies(dt);
        this.updateEnemyProjectiles(dt);
        this.updateJordan(dt);
        this.updatePostJordan(dt);
        this.updateGoreFinale(dt);

        if (this.player.iframes > 0) this.player.iframes -= dt;
        if (this.damageFlash > 0) this.damageFlash -= dt;
        if (this.healFlash > 0)   this.healFlash -= dt;
        if (this.armadaWarningFlash > 0) this.armadaWarningFlash -= dt;
        if (this.armadaIncomingTime > 0) this.armadaIncomingTime -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        // the ones in your bag cool down as well
        for (const id in this.weaponCooldowns) {
            if (id === this.equippedWeapon) continue;
            if (this.weaponCooldowns[id] > 0) this.weaponCooldowns[id] -= dt;
        }
        if (this.dummy.hitFlash > 0) this.dummy.hitFlash -= dt;
        if (this.hallwayNoticeTime > 0) this.hallwayNoticeTime -= dt;
        if (this.sideQuestNoticeTime > 0) this.sideQuestNoticeTime -= dt;
        if (false) {   // the training dummy no longer respawns
            this.dummy.respawnTimer -= dt;
            if (this.dummy.respawnTimer <= 0) this.dummy.hp = this.dummy.maxHp;
        }

        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            this.hitEffects[i].y -= 30 * dt;
            this.hitEffects[i].life -= dt;
            if (this.hitEffects[i].life <= 0) this.hitEffects.splice(i, 1);
        }

        // Grow blood pools toward their max size
        for (const pool of this.bloodPools) {
            if (pool.r < pool.maxR) {
                pool.r += (pool.maxR - pool.r) * 3 * dt + 4 * dt;
                if (pool.r > pool.maxR) pool.r = pool.maxR;
            }
        }

        // Movement (frozen while stunned by Jordan's counter-attack)
        if (this.player.stunTimer > 0) this.player.stunTimer -= dt;
        const stunned = (this.player.stunTimer > 0) || (this.player.frozen && this.player.frozen.active);

        // ----- dash (SHIFT), costs stamina -----
        const pl = this.player;
        const DASH_COST = 50;          // 2 dashes empties a full bar
        if (pl.dashCooldown > 0) pl.dashCooldown -= dt;
        if (pl.dashTimer > 0) {
            pl.dashTimer -= dt;
            // fading afterimages
            pl.dashTrail.push({ x: pl.x, y: pl.y, life: 0.28, facing: pl.facing });
        }
        for (let i = pl.dashTrail.length - 1; i >= 0; i--) {
            pl.dashTrail[i].life -= dt;
            if (pl.dashTrail[i].life <= 0) pl.dashTrail.splice(i, 1);
        }
        // stamina regen — pauses briefly after a dash, then refills over ~4s
        if (pl.staminaRegenDelay > 0) {
            pl.staminaRegenDelay -= dt;
        } else if (pl.stamina < pl.maxStamina) {
            pl.stamina = Math.min(pl.maxStamina, pl.stamina + (pl.maxStamina / 4) * dt);
        }

        let dx = 0, dy = 0;
        if (!stunned) {
            if (keys['w'] || keys['arrowup'])    dy -= 1;
            if (keys['s'] || keys['arrowdown'])  dy += 1;
            if (keys['a'] || keys['arrowleft'])  dx -= 1;
            if (keys['d'] || keys['arrowright']) dx += 1;
        }

        // start a dash
        if (keysPressed['shift'] && !stunned && pl.dashCooldown <= 0 &&
            pl.dashTimer <= 0 && pl.stamina >= DASH_COST) {
            let ddx = dx, ddy = dy;
            if (ddx === 0 && ddy === 0) {
                // standing still — dash toward the cursor
                const a = Math.atan2(mouse.y - pl.y, mouse.x - pl.x);
                ddx = Math.cos(a); ddy = Math.sin(a);
            } else {
                const len = Math.sqrt(ddx * ddx + ddy * ddy);
                ddx /= len; ddy /= len;
            }
            pl.dashDX = ddx; pl.dashDY = ddy;
            pl.dashTimer = 0.25;
            pl.dashCooldown = 0.3;                     // just stops double-firing
            pl.stamina -= DASH_COST;
            pl.staminaRegenDelay = 0.6;                // brief pause before refill
            pl.iframes = Math.max(pl.iframes, 0.22);   // brief invulnerability
            pl.dashTrail = [];
        }
        if (dx !== 0 && dy !== 0) {
            const inv = 1 / Math.sqrt(2);
            dx *= inv; dy *= inv;
        }
        if (dx > 0) this.player.facing = 'right';
        else if (dx < 0) this.player.facing = 'left';
        else if (dy > 0) this.player.facing = 'down';
        else if (dy < 0) this.player.facing = 'up';

        // While dashing, movement is locked to the dash direction and speed
        let moveX, moveY;
        if (pl.dashTimer > 0) {
            const dashSpeed = 600;
            moveX = pl.dashDX * dashSpeed * dt;
            moveY = pl.dashDY * dashSpeed * dt;
        } else {
            moveX = dx * this.player.speed * dt;
            moveY = dy * this.player.speed * dt;
        }
        if (moveX !== 0) {
            const newX = this.player.x + moveX;
            if (!this.collidesAt(newX, this.player.y)) this.player.x = newX;
        }
        if (moveY !== 0) {
            const newY = this.player.y + moveY;
            if (!this.collidesAt(this.player.x, newY)) this.player.y = newY;
        }

        const fb = this.getRoomData().floorBounds;
        const halfW = this.player.w / 2;
        const halfH = this.player.h / 2;

        // Some rooms have a doorway gap in the top wall: when horizontally inside
        // the gap, the player may walk up to the door (higher than the floor top).
        let inDoorGap = false;
        let gapTopY = fb.y;   // how high they can walk in the gap
        if (this.currentRoom === 'a02' && this.player.x > 445 && this.player.x < 515) {
            inDoorGap = true; gapTopY = 155;
        } else if (this.currentRoom === 'kitchen' && this.player.x > 445 && this.player.x < 515) {
            inDoorGap = true; gapTopY = 155;
        } else if (this.currentRoom === 'lounge' && this.player.x > 450 && this.player.x < 510) {
            inDoorGap = true; gapTopY = 150;
        } else if (this.currentRoom === 'lobby' &&
                   ((this.player.x > 225 && this.player.x < 315) ||   // A-01 gap
                    (this.player.x > 685 && this.player.x < 775))) {  // A-02 gap
            inDoorGap = true; gapTopY = 165;
        }

        if (this.player.x - halfW < fb.x) this.player.x = fb.x + halfW;
        if (this.player.x + halfW > fb.x + fb.w) this.player.x = fb.x + fb.w - halfW;

        if (inDoorGap) {
            if (this.player.y < gapTopY) this.player.y = gapTopY;
        } else {
            if (this.player.y - halfH < fb.y) this.player.y = fb.y + halfH;
        }
        if (this.player.y + halfH > fb.y + fb.h) this.player.y = fb.y + fb.h - halfH;

        // Interaction targets
        this.drawerPromptTarget = null;
        this.cabinetPromptTarget = null;
        this.pickupPromptItem = null;
        this.doorPromptTarget = null;
        this.doctorPromptTarget = null;
        let closestDist = Infinity;
        let closestType = null;
        let closestTarget = null;

        // Drawers, in whichever room has them
        for (const d of this.drawers) {
            if (d.state !== 'closed') continue;
            const dx2 = (d.x + d.w / 2) - this.player.x;
            const dy2 = (d.y + d.h) - this.player.y;
            const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (dist < d.interactionRadius && dist < closestDist) {
                closestDist = dist; closestType = 'drawer'; closestTarget = d;
            }
        }

        if (this.currentRoom === 'room1') {
            // Room 1 door to hallway
            const rd = this.room1;
            const dxD = this.player.x - (rd.doorToHallway.x + rd.doorToHallway.w / 2);
            const dyD = this.player.y - (rd.doorToHallway.y + rd.doorToHallway.h / 2);
            const distDoor = Math.sqrt(dxD * dxD + dyD * dyD);
            if (distDoor < 60 && distDoor < closestDist) {
                closestDist = distDoor;
                closestType = 'door';
                closestTarget = { doorId: 'toHallway' };
            }
        } else if (this.currentRoom === 'hallway') {
            // Hallway doors
            const rd = this.hallway;
            const centerA01x = rd.doorA01.x + rd.doorA01.w / 2;
            const centerA01y = rd.doorA01.y + rd.doorA01.h / 2;
            const dxA1 = this.player.x - centerA01x;
            const dyA1 = this.player.y - centerA01y;
            const distA1 = Math.sqrt(dxA1 * dxA1 + dyA1 * dyA1);
            if (distA1 < 70) {
                closestDist = distA1;
                closestType = 'door';
                closestTarget = { doorId: 'A01' };
            }

            const centerA02x = rd.doorA02.x + rd.doorA02.w / 2;
            const centerA02y = rd.doorA02.y + rd.doorA02.h / 2;
            const dxA2 = this.player.x - centerA02x;
            const dyA2 = this.player.y - centerA02y;
            const distA2 = Math.sqrt(dxA2 * dxA2 + dyA2 * dyA2);
            if (distA2 < 70 && distA2 < closestDist) {
                closestDist = distA2;
                closestType = 'door';
                closestTarget = { doorId: 'A02' };
            }

            // Far-right edge of the hallway → go to the LOBBY
            if (this.player.x > 850) {
                const distR = 900 - this.player.x;
                if (distR < closestDist) {
                    closestDist = distR;
                    closestType = 'door';
                    closestTarget = { doorId: 'toLobby' };
                }
            }
        } else if (this.currentRoom === 'a02') {
            // A-02 room: top door (locked) + a "back to hallway" zone at the bottom
            const rd = this.a02;
            const centerTopX = rd.topDoor.x + rd.topDoor.w / 2;
            const centerTopY = rd.topDoor.y + rd.topDoor.h / 2;
            const dxT = this.player.x - centerTopX;
            const dyT = this.player.y - centerTopY;
            const distT = Math.sqrt(dxT * dxT + dyT * dyT);
            if (distT < 95) {
                closestDist = distT;
                closestType = 'door';
                closestTarget = { doorId: 'a02top' };
            }

            // Bottom-center zone = go back to hallway
            const backX = 480, backY = 615;
            const dxB = this.player.x - backX;
            const dyB = this.player.y - backY;
            const distB = Math.sqrt(dxB * dxB + dyB * dyB);
            if (distB < 55 && distB < closestDist) {
                closestDist = distB;
                closestType = 'door';
                closestTarget = { doorId: 'a02back' };
            }
        } else if (this.currentRoom === 'lobby') {
            // Left edge → back to the hallway
            if (this.player.x < 110) {
                const distL = this.player.x - 60;
                if (distL < closestDist) {
                    closestDist = distL;
                    closestType = 'door';
                    closestTarget = { doorId: 'lobbyback' };
                }
            }
            // the stairwell door in the right wall
            const rz = this.lobby.rightExitZone;
            if (this.player.x > rz.x - 30 &&
                this.player.y > rz.y - 45 && this.player.y < rz.y + rz.h + 45) {
                closestDist = 0;
                closestType = 'door';
                closestTarget = { doorId: 'lobbyToF3' };
            }
            // A-01 door (top-left) → the kitchen
            const rd = this.lobby;
            const a01cx = rd.doorA01.x + rd.doorA01.w / 2;
            const dxK = this.player.x - a01cx;
            const dyK = this.player.y - (rd.doorA01.y + rd.doorA01.h);
            const distK = Math.sqrt(dxK * dxK + dyK * dyK);
            if (distK < 75 && distK < closestDist) {
                closestDist = distK;
                closestType = 'door';
                closestTarget = { doorId: 'lobbyToKitchen' };
            }
            // A-02 door (top-right) → locked placeholder
            const a02cx = rd.doorA02.x + rd.doorA02.w / 2;
            const dxL = this.player.x - a02cx;
            const dyL = this.player.y - (rd.doorA02.y + rd.doorA02.h);
            const distLk = Math.sqrt(dxL * dxL + dyL * dyL);
            if (distLk < 75 && distLk < closestDist) {
                closestDist = distLk;
                closestType = 'door';
                closestTarget = { doorId: 'lobbyToLounge' };
            }
            // Doctor's locker (the shining one) — press E to trigger the reveal
            this.doctorPromptTarget = null;
            if (!this.doctorTriggered) {
                for (const lk of this.lobby.lockers) {
                    if (!lk.hasDoctor) continue;
                    const cx = lk.x + lk.w / 2;
                    const cy = lk.y + lk.h;
                    const d = Math.sqrt((this.player.x - cx) ** 2 + (this.player.y - cy) ** 2);
                    if (d < 55) this.doctorPromptTarget = lk;
                }
            }
        } else if (this.currentRoom === 'f3hallway' || this.currentRoom === 'f3hallway2') {
            const second = this.currentRoom === 'f3hallway2';
            const a01 = this.hallway.doorA01, a02 = this.hallway.doorA02;
            const d1 = Math.hypot(this.player.x - (a01.x + a01.w / 2),
                                  this.player.y - (a01.y + a01.h + 20));
            if (d1 < 80) { closestDist = d1; closestType = 'door';
                           closestTarget = { doorId: second ? 'toCell3' : 'toCell1' }; }
            const d2 = Math.hypot(this.player.x - (a02.x + a02.w / 2),
                                  this.player.y - (a02.y + a02.h + 20));
            if (d2 < 80 && d2 < closestDist) { closestDist = d2; closestType = 'door';
                                               closestTarget = { doorId: second ? 'toTorture' : 'toCell2' }; }
            // the ends of the corridor
            if (this.player.x < 75) {
                closestDist = 0; closestType = 'door';
                closestTarget = { doorId: second ? 'hall2ToHall1' : 'f3ToF4' };
            } else if (this.player.x > 885) {
                closestDist = 0; closestType = 'door';
                closestTarget = { doorId: second ? 'f3ToLobby' : 'hall1ToHall2' };
            }
        } else if (this.currentRoom === 'cell1' || this.currentRoom === 'cell2' ||
                   this.currentRoom === 'cell3' || this.currentRoom === 'torture') {
            const fb = this.getRoomData().floorBounds;
            const dB = Math.hypot(this.player.x - 480, this.player.y - (fb.y + fb.h - 6));
            if (dB < 75) { closestDist = dB; closestType = 'door';
                           closestTarget = { doorId: 'cellBack' }; }
            const cab = this.cellCabinets[this.currentRoom];
            if (cab && !cab.looted) {
                const dC = Math.hypot(this.player.x - (cab.x + cab.w / 2),
                                      this.player.y - (cab.y + cab.h + 12));
                if (dC < 62) { this.cabinetPromptTarget = cab; }
            }
        } else if (this.currentRoom === 'f3a02') {
            const dB = Math.hypot(this.player.x - 480, this.player.y - 575);
            if (dB < 70) { closestDist = dB; closestType = 'door';
                           closestTarget = { doorId: 'f3A02Back' }; }
        } else if (this.currentRoom === 'f3lobby') {
            const lz = this.lobby.leftExitZone;
            if (this.player.x < lz.x + lz.w + 20 &&
                this.player.y > lz.y - 60 && this.player.y < lz.y + lz.h + 60) {
                closestDist = 0; closestType = 'door';
                closestTarget = { doorId: 'f3LobbyToHallway' };
            }
            const rz3 = this.lobby.rightExitZone;
            if (this.player.x > rz3.x - 30 &&
                this.player.y > rz3.y - 45 && this.player.y < rz3.y + rz3.h + 45) {
                closestDist = 0; closestType = 'door';
                closestTarget = { doorId: 'f3ToF2' };
            }
            const a01 = this.lobby.doorA01, a02 = this.lobby.doorA02;
            const d1 = Math.hypot(this.player.x - (a01.x + a01.w / 2),
                                  this.player.y - (a01.y + a01.h + 20));
            if (d1 < 95 && d1 < closestDist) { closestDist = d1; closestType = 'door';
                                               closestTarget = { doorId: 'f3ToDining' }; }
            const d2 = Math.hypot(this.player.x - (a02.x + a02.w / 2),
                                  this.player.y - (a02.y + a02.h + 20));
            if (d2 < 95 && d2 < closestDist) { closestDist = d2; closestType = 'door';
                                               closestTarget = { doorId: 'f3ToGames' }; }
        } else if (this.currentRoom === 'dining') {
            const d = this.dining.topDoor;
            const dD = Math.hypot(this.player.x - (d.x + d.w / 2),
                                  this.player.y - (d.y + d.h + 20));
            if (dD < 80) { closestDist = dD; closestType = 'door';
                           closestTarget = { doorId: 'diningBack' }; }
        } else if (this.currentRoom === 'games') {
            const dG = Math.hypot(this.player.x - 460, this.player.y - 545);
            if (dG < 75) { closestDist = dG; closestType = 'door';
                           closestTarget = { doorId: 'gamesBack' }; }
        } else if (this.currentRoom === 'roof') {
            const d = this.roof.topDoor;
            const dR = Math.hypot(this.player.x - (d.x + d.w / 2),
                                  this.player.y - (d.y + d.h + 20));
            if (dR < 70) {
                closestDist = dR;
                closestType = 'door';
                closestTarget = { doorId: 'roofBack' };
            }
        } else if (this.currentRoom === 'lounge') {
            // bottom-center → back down to the kitchen
            const backX = 480, backY = 545;
            const dB = Math.hypot(this.player.x - backX, this.player.y - backY);
            if (dB < 60) {
                closestDist = dB;
                closestType = 'door';
                closestTarget = { doorId: 'loungeBack' };
            }
            // lockers
            this.loungeLockerTarget = null;
            for (const lk of this.lounge.lockers) {
                const cx = lk.x + lk.w / 2;
                const cy = lk.y + lk.h;
                if (Math.hypot(this.player.x - cx, this.player.y - cy) < 55) {
                    this.loungeLockerTarget = lk;
                }
            }
        } else if (this.currentRoom === 'kitchen') {
            // Top "KITCHEN" door (locked placeholder)
            const rd = this.kitchen;
            const tcx = rd.topDoor.x + rd.topDoor.w / 2;
            const tcy = rd.topDoor.y + rd.topDoor.h / 2;
            const dxT = this.player.x - tcx;
            const dyT = this.player.y - tcy;
            if (Math.sqrt(dxT * dxT + dyT * dyT) < 95) {
                closestDist = Math.sqrt(dxT * dxT + dyT * dyT);
                closestType = 'door';
                closestTarget = { doorId: 'kitchenTop' };
            }
            // Bottom-center → back to the lobby
            const backX = 480, backY = 575;
            const dxB = this.player.x - backX;
            const dyB = this.player.y - backY;
            const distB = Math.sqrt(dxB * dxB + dyB * dyB);
            if (distB < 60 && distB < closestDist) {
                closestDist = distB;
                closestType = 'door';
                closestTarget = { doorId: 'kitchenBack' };
            }
        }

        for (const item of this.items) {
            if (item.pickedUp) continue;
            const idx = item.x - this.player.x;
            const idy = item.y - this.player.y;
            const dist = Math.sqrt(idx * idx + idy * idy);
            if (dist < item.pickupRadius && dist < closestDist) {
                closestDist = dist; closestType = 'item'; closestTarget = item;
            }
        }

        if (closestType === 'drawer') this.drawerPromptTarget = closestTarget;
        else if (closestType === 'item') this.pickupPromptItem = closestTarget;
        else if (closestType === 'door') this.doorPromptTarget = closestTarget;

        if (keysPressed['e']) {
            if (this.doctorPromptTarget) this.triggerDoctor();
            else if (this.tryTakeKitchenKey()) { /* took the key */ }
            else if (this.tryOpenLoungeLocker()) { /* opened a locker */ }
            else if (this.trySearchColleague()) { /* searched the body */ }
            else if (this.trySideQuestTalk()) { /* talking beats the nearby door */ }
            else if (this.tryTalkGuard()) { /* the guard */ }
            else if (this.trySearchCabinet()) { /* the cell cabinet */ }
            else if (this.tryConfrontShreya()) { /* she is waiting outside */ }
            else if (this.drawerPromptTarget) this.openDrawer(this.drawerPromptTarget);
            else if (this.pickupPromptItem) this.pickUpItem(this.pickupPromptItem);
            else if (this.doorPromptTarget) this.tryDoor(this.doorPromptTarget);
            else if (this.tryClaimLoot()) { /* asked the server */ }
            else if (this.tryReadDeathStain()) { /* someone else's last words */ }
            else if (this.hasLetter) this.letterOpen = true;   // nothing else to do: reread it
        }

        // fade out a shown death message
        if (this.deathStainNoticeTime > 0) this.deathStainNoticeTime -= dt;

        if (this.pickupNoticeTime > 0) this.pickupNoticeTime -= dt;
        if (this.jackpotFlash > 0) this.jackpotFlash -= dt;
        if (this.jordanBannerTime > 0) this.jordanBannerTime -= dt;
    },

    // Searching Adler's body for the lounge key.
    trySearchColleague() {
        if (this.currentRoom !== 'kitchen' || !this.colleagueBody) return false;
        if (this.hasLoungeKey) return false;
        const dx = this.player.x - this.colleagueBody.x;
        const dy = this.player.y - this.colleagueBody.y;
        if (Math.sqrt(dx * dx + dy * dy) > 55) return false;

        this.hasLoungeKey = true;
        this.colleagueFound = true;
        this.pickupNotice = 'RECEIVED: DOCTORS\' LOUNGE KEY';
        this.pickupNoticeTime = 2.1;
        this.sideQuestNotice = "Adler is dead. His lounge key was still in his coat — the lounge is A-02, in the lobby.";
        this.sideQuestNoticeTime = 3.0;
        this.autosave();
        return true;
    },

    // Opening a lounge locker. One of them has the file.
    // Up onto the roof, through A-02's top door
    switchToRoof() {
        this.currentRoom = 'roof';
        this.player.x = 478;
        this.player.y = 215;
        this.player.facing = 'down';

        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];
        this.items = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.enemies = [];
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;

        this.rebuildWalls();
        this.setupRoofWave();
    },

    // Three waves. You come back to the start of whichever one you left.
    setupRoofWave() {
        this.guardShots = [];
        this.roofWaveGap = 0;
        if (this.roofWaveCleared) {
            this.enemies = [];
            this.roofWave = 3;
            this.hallwayNotice = 'THE ROOF.';
            this.hallwayNoticeTime = 1.5;
            return;
        }
        this.startRoofWave(this.roofWave > 0 ? this.roofWave : 1);
    },

    startRoofWave(n) {
        this.roofWave = n;
        if (n === 1) {
            // one of each thing from the asylum
            this.enemies = [
                {   x: 250, y: 255, w: 28, h: 38, speed: 95,
                    hp: 2, maxHp: 2, hitFlash: 0, damageTouchCooldown: 0,
                    facing: 'down', dead: false, deathAnim: 0, distracted: 0,
                    ranged: true, throwCooldown: 2.0 + Math.random(), preferredDist: 240 },
                {   x: 760, y: 250, w: 28, h: 38, speed: 70,
                    hp: 3, maxHp: 3, hitFlash: 0, damageTouchCooldown: 0,
                    facing: 'left', dead: false, deathAnim: 0, distracted: 0 },
                this.makeShyEnemy(470, 430)
            ];
            this.roofWaveBanner = 'WAVE 1';
        } else if (n === 2) {
            // three of them, straight at you
            this.enemies = [
                {   x: 220, y: 230, w: 28, h: 38, speed: 78,
                    hp: 3, maxHp: 3, hitFlash: 0, damageTouchCooldown: 0,
                    facing: 'right', dead: false, deathAnim: 0, distracted: 0 },
                {   x: 480, y: 480, w: 28, h: 38, speed: 78,
                    hp: 3, maxHp: 3, hitFlash: 0, damageTouchCooldown: 0,
                    facing: 'up', dead: false, deathAnim: 0, distracted: 0 },
                {   x: 790, y: 240, w: 28, h: 38, speed: 78,
                    hp: 3, maxHp: 3, hitFlash: 0, damageTouchCooldown: 0,
                    facing: 'left', dead: false, deathAnim: 0, distracted: 0 }
            ];
            this.roofWaveBanner = 'WAVE 2';
        } else {
            // two of the things that came out of the wall
            this.enemies = [
                this.makeAnomalyEnemy(250, 260),
                this.makeAnomalyEnemy(760, 430)
            ];
            this.roofWaveBanner = 'WAVE 3';
        }
        this.roofWaveBannerTime = 2.6;
        this.screenShake = Math.max(this.screenShake, 0.35);
        this.hallwayNotice = n === 1
            ? 'THE ROOF. THEY ARE NOT ALONE UP HERE.'
            : '';
        this.hallwayNoticeTime = n === 1 ? 3.5 : 0;
    },

    updateRoofWaves(dt) {
        if (this.roofWaveBannerTime > 0) this.roofWaveBannerTime -= dt;
        if (this.currentRoom !== 'roof' || this.roofWaveCleared) return;

        if (this.roofWaveGap > 0) {
            this.roofWaveGap -= dt;
            if (this.roofWaveGap <= 0) this.startRoofWave(this.roofWave + 1);
            return;
        }

        if (this.enemies.length === 0 || !this.enemies.every(e => e.dead)) return;

        if (this.roofWave < 3) {
            this.roofWaveGap = 2.5;   // a breath before the next lot
            this.hallwayNotice = 'MORE OF THEM ARE COMING UP.';
            this.hallwayNoticeTime = 1.4;
        } else {
            this.roofWaveCleared = true;
            this.hallwayNotice = 'IT GOES QUIET. SOMETHING IS COMING UP BEHIND THEM.';
            this.hallwayNoticeTime = 2.7;
            this.screenShake = 0.5;
            this.autosave();
            this.roofWaveGap = 3.0;   // reused as the beat before Raymond
        }
    },

    drawRoofWaveBanner(ctx) {
        if (this.roofWaveBannerTime <= 0 || this.currentRoom !== 'roof') return;
        const a = Math.min(1, this.roofWaveBannerTime, (2.6 - this.roofWaveBannerTime) * 3);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.55 * a})`;
        ctx.fillRect(0, 96, canvas.width, 48);
        ctx.fillStyle = `rgba(210, 40, 40, ${a})`;
        ctx.font = 'bold 24px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.fillText(this.roofWaveBanner, canvas.width / 2, 128);
        ctx.textAlign = 'left';
    },

    // The guard fires to pull things off you. The shots do no damage — they
    // just make whatever he hits come after him instead.
    updateGuardSupport(dt) {
        for (let i = this.guardShots.length - 1; i >= 0; i--) {
            const sh = this.guardShots[i];
            sh.life -= dt;
            if (sh.life <= 0) this.guardShots.splice(i, 1);
        }

        if (!this.companionsRecruited.guard || this.isDead) return;
        const f = this.followers.guard;
        if (f.room !== this.currentRoom) return;

        if (this.guardShotTimer > 0) { this.guardShotTimer -= dt; return; }

        // pick something that's currently after the player
        const targets = this.enemies.filter(e => !e.dead &&
            (!e.shy || e.raged) && e.distracted <= 0);
        if (targets.length === 0) return;

        const e = targets[Math.floor(Math.random() * targets.length)];
        e.distracted = 4.0;
        this.guardShotTimer = 2.2;
        this.guardShots.push({
            x1: f.x, y1: f.y - 2, x2: e.x, y2: e.y, life: 0.12
        });
        this.hitEffects.push({
            x: e.x, y: e.y - 44, text: 'DRAWN OFF', life: 0.9, color: '#88bbff'
        });
    },

    // Where an enemy is heading — the guard if he's just shot at it, else you.
    aggroTarget(e) {
        if (e.distracted > 0 && this.companionsRecruited.guard) {
            const f = this.followers.guard;
            if (f.room === this.currentRoom) return { x: f.x, y: f.y };
        }
        return { x: this.player.x, y: this.player.y };
    },

    drawGuardShots(ctx) {
        for (const sh of this.guardShots) {
            const a = Math.max(0, sh.life / 0.12);
            ctx.strokeStyle = `rgba(255, 230, 160, ${a})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sh.x1, sh.y1);
            ctx.lineTo(sh.x2, sh.y2);
            ctx.stroke();
            ctx.fillStyle = `rgba(255, 220, 120, ${a})`;
            ctx.beginPath();
            ctx.arc(sh.x1, sh.y1, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // Back down into A-02
    switchRoofToA02() {
        this.currentRoom = 'a02';
        const d = this.a02.topDoor;
        this.player.x = d.x + d.w / 2;
        this.player.y = d.y + d.h + 40;
        this.player.facing = 'down';

        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];
        this.items = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;

        this.setupA02Enemies();
        this.addSwarm('a02');
        this.rebuildWalls();
        this.hallwayNotice = 'BACK INSIDE.';
        this.hallwayNoticeTime = 1.2;
    },

    // ===== THE ANOMALY (Room 1, the guard's quest) =====

    // Called on entering Room 1. Spawns the fight if the quest is on, and puts
    // the letter back on the floor if you left it there.
    setupAnomaly() {
        const an = this.anomaly;
        if (this.currentRoom !== 'room1') return;

        if (this.anomalyDead) {
            an.active = true;
            an.state = 'dead';
            if (this.anomalyLetterDropped && !this.hasAnomalyLetter &&
                !this.items.some(i => i.id === 'anomalyLetter')) {
                this.items.push({
                    id: 'anomalyLetter', name: 'LETTER',
                    x: this.anomalyLetterX, y: this.anomalyLetterY,
                    pickupRadius: 40, pickedUp: false,
                    spawnTime: this.time, isRecovered: true
                });
            }
            return;
        }

        if (this.guardQuest !== 'active') {
            an.active = false;
            an.state = 'hidden';
            return;
        }

        // the fight starts fresh each time you come in
        const a = this.armada;
        an.active = true;
        an.state = 'emerging';
        an.stateTimer = 1.6;
        an.hp = an.maxHp;
        an.x = a.entryX - an.w / 2;
        an.y = a.entryY - an.h / 2;
        an.hitFlash = 0;
        an.touchCooldown = 0;
        this.anomalyBannerTime = 3.0;
        this.screenShake = Math.max(this.screenShake, 0.4);
    },

    anomalyHitsWall(nx, ny) {
        const an = this.anomaly;
        const box = { x: nx + 4, y: ny + 4, w: an.w - 8, h: an.h - 8 };
        for (const w of this.walls) {
            if (box.x < w.x + w.w && box.x + box.w > w.x &&
                box.y < w.y + w.h && box.y + box.h > w.y) return true;
        }
        const fb = this.room1.floorBounds;
        return nx < fb.x || nx + an.w > fb.x + fb.w || ny < fb.y || ny + an.h > fb.y + fb.h;
    },

    updateAnomaly(dt) {
        const an = this.anomaly;
        if (!an.active || this.currentRoom !== 'room1') return;
        if (an.hitFlash > 0) an.hitFlash -= dt;
        if (this.anomalyBannerTime > 0) this.anomalyBannerTime -= dt;
        if (an.state === 'dead' || an.state === 'hidden') return;
        if (an.touchCooldown > 0) an.touchCooldown -= dt;

        const p = this.player;
        an.stateTimer -= dt;

        if (an.state === 'emerging') {
            // crawling out of the hole
            if (an.stateTimer <= 0) { an.state = 'idle'; an.stateTimer = 0.8; }
            return;
        }

        if (an.state === 'idle') {
            if (an.stateTimer <= 0) { an.state = 'windup'; an.stateTimer = an.windupTime; }
            return;
        }

        if (an.state === 'windup') {
            // lock onto where you are when the wind-up ends
            if (an.stateTimer <= 0) {
                const dx = p.x - (an.x + an.w / 2);
                const dy = p.y - (an.y + an.h / 2);
                const len = Math.hypot(dx, dy) || 1;
                an.chargeDX = dx / len;
                an.chargeDY = dy / len;
                an.state = 'charging';
                // long enough to cross the whole room — it always ends on a wall
                an.stateTimer = 4.0;
            }
            return;
        }

        if (an.state === 'charging') {
            const nx = an.x + an.chargeDX * an.speed * dt;
            const ny = an.y + an.chargeDY * an.speed * dt;
            if (this.anomalyHitsWall(nx, ny)) {
                an.state = 'stunned';
                an.stateTimer = an.stunTime;
                this.screenShake = Math.max(this.screenShake, 0.4);
                this.spawnBloodBurst(an.x + an.w / 2, an.y + an.h / 2, 5);
                return;
            }
            an.x = nx;
            an.y = ny;
            // caught in the charge
            if (an.touchCooldown <= 0 &&
                p.x + p.w / 2 > an.x && p.x - p.w / 2 < an.x + an.w &&
                p.y + p.h / 2 > an.y && p.y - p.h / 2 < an.y + an.h) {
                this.damagePlayer(1);
                an.touchCooldown = 1.2;
                this.screenShake = Math.max(this.screenShake, 0.35);
            }
            if (an.stateTimer <= 0) { an.state = 'recover'; an.stateTimer = 0.8; }
            return;
        }

        if (an.state === 'stunned') {
            if (an.stateTimer <= 0) { an.state = 'recover'; an.stateTimer = 0.8; }
            return;
        }

        if (an.state === 'recover') {
            if (an.stateTimer <= 0) { an.state = 'idle'; an.stateTimer = 0.6; }
        }
    },

    // A shiv landing on the anomaly. Returns true if it absorbed the shot.
    hitAnomaly(px, py) {
        const an = this.anomaly;
        if (!an.active || this.currentRoom !== 'room1') return false;
        if (an.state === 'dead' || an.state === 'hidden' || an.state === 'emerging') return false;
        if (px < an.x || px > an.x + an.w || py < an.y || py > an.y + an.h) return false;

        if (an.state !== 'stunned') {
            this.hitEffects.push({
                x: an.x + an.w / 2, y: an.y - 12,
                text: 'STUN IT FIRST', life: 0.9, color: '#999999'
            });
            return true;
        }

        an.hp -= 1;
        an.hitFlash = 0.35;
        this.addBloodStain(an.x + an.w / 2, an.y + an.h - 4);
        this.spawnBloodBurst(an.x + an.w / 2, an.y + an.h / 2, 6);
        this.hitEffects.push({
            x: an.x + an.w / 2, y: an.y - 12,
            text: `-1  (${an.maxHp - an.hp}/${an.maxHp})`, life: 1.0
        });
        if (an.hp <= 0) this.killAnomaly();
        return true;
    },

    killAnomaly() {
        const an = this.anomaly;
        if (this.anomalyDead) return;
        an.hp = 0;
        an.state = 'dead';
        this.anomalyDead = true;

        const cx = an.x + an.w / 2, cy = an.y + an.h / 2;
        this.addBloodPool(cx, an.y + an.h - 4, true);
        this.addBloodPool(cx + 20, an.y + an.h, false);
        this.spawnBloodBurst(cx, cy, 28);
        for (const type of ['arm', 'leg', 'head']) {
            const ang = Math.random() * Math.PI * 2;
            const d = 30 + Math.random() * 60;
            this.gibs.push({ type, x: cx + Math.cos(ang) * d, y: cy + Math.sin(ang) * d * 0.55,
                             rot: Math.random() * Math.PI * 2 });
        }
        this.screenShake = Math.max(this.screenShake, 0.7);
        this.hitEffects.push({ x: cx, y: an.y - 30, text: 'IT STOPS MOVING', life: 2.4, color: '#ffcc44' });

        // it was carrying something
        const fb = this.room1.floorBounds;
        this.anomalyLetterX = Math.max(fb.x + 20, Math.min(fb.x + fb.w - 20, cx));
        this.anomalyLetterY = Math.max(fb.y + 20, Math.min(fb.y + fb.h - 20, an.y + an.h + 10));
        this.anomalyLetterDropped = true;
        this.items.push({
            id: 'anomalyLetter', name: 'LETTER',
            x: this.anomalyLetterX, y: this.anomalyLetterY,
            pickupRadius: 40, pickedUp: false,
            spawnTime: this.time, isRecovered: true
        });
        this.autosave();
    },

    drawAnomaly(ctx) {
        const an = this.anomaly;
        if (!an.active || this.currentRoom !== 'room1' || an.state === 'hidden') return;
        const cx = an.x + an.w / 2;
        const cy = an.y + an.h / 2;

        if (an.state === 'dead') {
            ctx.fillStyle = '#2a1820';
            ctx.fillRect(cx - 16, cy + 4, 32, 10);
            ctx.fillStyle = '#1a0e14';
            ctx.fillRect(cx - 20, cy + 8, 8, 3);
            ctx.fillRect(cx + 12, cy + 6, 9, 3);
            return;
        }

        // crawling out of the wall — it rises into view
        let rise = 1;
        if (an.state === 'emerging') rise = Math.max(0.15, 1 - an.stateTimer / 1.6);

        // wind-up telegraph: a ring and an arrow toward you
        if (an.state === 'windup') {
            const t = 1 - an.stateTimer / an.windupTime;
            ctx.strokeStyle = `rgba(255, 50, 50, ${0.35 + t * 0.55})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, 26 + Math.sin(this.time * 18) * 3, 0, Math.PI * 2);
            ctx.stroke();
            const ang = Math.atan2(this.player.y - cy, this.player.x - cx);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(ang);
            ctx.fillStyle = `rgba(255, 60, 60, ${0.4 + t * 0.5})`;
            ctx.fillRect(28, -3, 26 + t * 18, 6);
            ctx.beginPath();
            ctx.moveTo(58 + t * 18, -9);
            ctx.lineTo(70 + t * 18, 0);
            ctx.lineTo(58 + t * 18, 9);
            ctx.fill();
            ctx.restore();
        }

        const wob = an.state === 'stunned' ? Math.sin(this.time * 22) * 3 : 0;
        ctx.save();
        ctx.translate(cx + wob, cy);
        ctx.globalAlpha = rise;

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 17, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        const flash = an.hitFlash > 0;
        const body = flash ? '#ffcccc' : (an.state === 'windup' ? '#5a1c26' : '#3a2530');
        const limb = flash ? '#ffdddd' : '#2a1a22';

        // too-long limbs, bent like a spider's
        ctx.fillStyle = limb;
        ctx.fillRect(-19, -2, 7, 4);  ctx.fillRect(-21, 1, 3, 13);
        ctx.fillRect(12, -2, 7, 4);   ctx.fillRect(18, 1, 3, 13);
        ctx.fillRect(-15, 8, 5, 3);   ctx.fillRect(-16, 10, 3, 8);
        ctx.fillRect(10, 8, 5, 3);    ctx.fillRect(13, 10, 3, 8);

        // hunched body with a ridge of spine
        ctx.fillStyle = body;
        ctx.fillRect(-11, -7, 22, 17);
        ctx.fillStyle = flash ? '#fff0f0' : '#4d3240';
        for (let k = 0; k < 4; k++) ctx.fillRect(-2, -6 + k * 4, 4, 2);

        // head hung forward
        ctx.fillStyle = body;
        ctx.fillRect(-7, -15, 14, 10);

        // eyes — cold white, burning red when it's about to charge
        if (an.state === 'stunned') {
            ctx.fillStyle = '#dddddd';
            ctx.fillRect(-5, -12, 1, 1); ctx.fillRect(-4, -11, 1, 1); ctx.fillRect(-5, -10, 1, 1);
            ctx.fillRect(-3, -12, 1, 1); ctx.fillRect(-3, -10, 1, 1);
            ctx.fillRect(3, -12, 1, 1);  ctx.fillRect(4, -11, 1, 1);  ctx.fillRect(3, -10, 1, 1);
            ctx.fillRect(5, -12, 1, 1);  ctx.fillRect(5, -10, 1, 1);
        } else {
            ctx.fillStyle = an.state === 'windup' || an.state === 'charging'
                ? `rgba(255, 60, 40, ${0.8 + Math.sin(this.time * 16) * 0.2})`
                : 'rgba(230, 235, 245, 0.9)';
            ctx.fillRect(-5, -12, 3, 3);
            ctx.fillRect(2, -12, 3, 3);
        }
        ctx.restore();
        ctx.globalAlpha = 1;

        if (an.state === 'stunned') {
            ctx.fillStyle = '#ffee66';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('STUNNED', cx, an.y - 20);
        }

        // three health pips
        if (an.state !== 'emerging') {
            for (let k = 0; k < an.maxHp; k++) {
                const px = cx - 14 + k * 11;
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(px - 1, an.y - 11, 9, 6);
                ctx.fillStyle = k < an.hp ? '#c62828' : '#2a1010';
                ctx.fillRect(px, an.y - 10, 7, 4);
            }
        }
        ctx.textAlign = 'left';
    },

    // Its name, the first moment it appears
    drawAnomalyBanner(ctx) {
        if (this.anomalyBannerTime <= 0 || this.currentRoom !== 'room1') return;
        const a = Math.min(1, this.anomalyBannerTime, (3.0 - this.anomalyBannerTime) * 3);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * a})`;
        ctx.fillRect(0, 90, canvas.width, 56);
        ctx.fillStyle = `rgba(200, 30, 30, ${a})`;
        ctx.font = 'bold 26px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.fillText('THE THING IN THE WALL', canvas.width / 2, 126);
        ctx.textAlign = 'left';
    },

    drawRaymond(ctx) {
        const r = this.raymond;
        // once he is with you he is drawn wherever you are
        const walking = this.raymondJoined && !this.finale.done;
        const arena = r.mode === 'rematch' ? 'games' : 'roof';
        if (!walking && (!r.active || this.currentRoom !== arena)) return;

        // afterimages from the dash
        for (const t of r.trail) {
            const a = Math.max(0, t.life / 0.35) * 0.35;
            ctx.fillStyle = `rgba(150, 140, 190, ${a})`;
            ctx.fillRect(t.x - r.w / 2, t.y - r.h / 2, r.w, r.h);
        }

        const x = r.x, y = r.y;
        const wob = r.staggered > 0 ? Math.sin(this.time * 24) * 2 : 0;
        ctx.save();
        ctx.translate(x + wob, y);

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(0, r.h / 2, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        const flash = r.hitFlash > 0;
        if (r.frozen > 0) {
            ctx.fillStyle = 'rgba(150, 220, 255, 0.35)';
            ctx.fillRect(-r.w / 2 - 6, -r.h / 2 - 8, r.w + 12, r.h + 16);
            ctx.strokeStyle = 'rgba(220, 245, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.strokeRect(-r.w / 2 - 6, -r.h / 2 - 8, r.w + 12, r.h + 16);
        }
        // tall, lean, long coat
        ctx.fillStyle = flash ? '#ffdddd' : '#23202c';
        ctx.fillRect(-13, -14, 26, 40);
        ctx.fillStyle = flash ? '#ffcccc' : '#2e2a3a';
        ctx.fillRect(-13, -14, 26, 8);
        ctx.fillStyle = '#16141c';
        ctx.fillRect(-2, -14, 3, 40);
        // legs
        ctx.fillStyle = '#1a1820';
        ctx.fillRect(-9, 24, 8, 16);
        ctx.fillRect(1, 24, 8, 16);
        // arms — sword right, pistol left
        ctx.fillStyle = flash ? '#ffcccc' : '#26222f';
        ctx.fillRect(-18, -12, 5, 22);
        ctx.fillRect(13, -12, 5, 22);
        // the sword
        ctx.fillStyle = '#c9ccd6';
        ctx.fillRect(18, -6, 3, 34);
        ctx.fillStyle = '#7d8290';
        ctx.fillRect(17, 8, 5, 3);
        // the pistol
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(-24, 2, 8, 5);
        // head
        ctx.fillStyle = flash ? '#ffdede' : '#b8926e';
        ctx.fillRect(-8, -27, 16, 14);
        ctx.fillStyle = '#14121a';
        ctx.fillRect(-8, -27, 16, 5);
        // eyes
        ctx.fillStyle = r.staggered > 0 ? '#888888'
            : `rgba(220, 60, 60, ${0.75 + Math.sin(this.time * 6) * 0.25})`;
        ctx.fillRect(-5, -21, 3, 3);
        ctx.fillRect(2, -21, 3, 3);
        ctx.restore();
    },

    drawShreya(ctx) {
        const sh = this.shreya;
        if (!sh.present || this.currentRoom !== 'roof') return;
        this.drawShreyaBody(ctx, sh.x, sh.y, sh.freed);
    },

    drawShreyaBody(ctx, x, y, freed) {

        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(x - 9, y + 26, 18, 4);
        // hospital gown
        ctx.fillStyle = '#c8ccd2';
        ctx.fillRect(x - 9, y - 6, 18, 28);
        ctx.fillStyle = '#aeb4bc';
        ctx.fillRect(x - 9, y + 12, 18, 3);
        // legs
        ctx.fillStyle = '#9a8f88';
        ctx.fillRect(x - 6, y + 22, 5, 8);
        ctx.fillRect(x + 1, y + 22, 5, 8);
        // arms — held together in front while she's a hostage
        ctx.fillStyle = '#c0c5cb';
        if (freed) {
            ctx.fillRect(x - 15, y - 8, 5, 16);
            ctx.fillRect(x + 10, y - 8, 5, 16);
        } else {
            ctx.fillRect(x - 11, y + 2, 22, 5);
        }
        // head and long hair
        ctx.fillStyle = '#c69a76';
        ctx.fillRect(x - 6, y - 19, 12, 13);
        ctx.fillStyle = '#2b1d16';
        ctx.fillRect(x - 8, y - 22, 16, 8);
        ctx.fillRect(x - 9, y - 16, 4, 14);
        ctx.fillRect(x + 5, y - 16, 4, 14);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x - 3, y - 13, 2, 2);
        ctx.fillRect(x + 2, y - 13, 2, 2);

        if (freed) {
            const pulse = 0.4 + Math.sin(this.time * 14) * 0.35;
            ctx.fillStyle = `rgba(150, 210, 255, ${pulse})`;
            ctx.fillRect(x - 16, y - 9, 4, 4);
            ctx.fillRect(x + 12, y - 9, 4, 4);
        }
    },

    drawLightning(ctx) {
        for (const b of this.lightning) {
            const a = Math.max(0, b.life / 0.9);
            ctx.strokeStyle = `rgba(190, 230, 255, ${a})`;
            ctx.lineWidth = 2 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(b.x1, b.y1);
            const segs = 7;
            for (let k = 1; k <= segs; k++) {
                const t = k / segs;
                const jx = (Math.random() - 0.5) * 26 * (1 - Math.abs(t - 0.5) * 2);
                const jy = (Math.random() - 0.5) * 26 * (1 - Math.abs(t - 0.5) * 2);
                ctx.lineTo(b.x1 + (b.x2 - b.x1) * t + jx, b.y1 + (b.y2 - b.y1) * t + jy);
            }
            ctx.stroke();
        }
    },

    // What's left of the guard
    drawGuardBodyOnRoof(ctx) {
        if (!this.guardDead || !this.guardBody || this.currentRoom !== 'roof') return;
        const b = this.guardBody;
        ctx.save();
        ctx.translate(b.x, b.y + 10);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#2a3552';
        ctx.fillRect(-11, -6, 22, 26);
        ctx.fillStyle = '#8a1010';
        ctx.fillRect(-11, -8, 22, 5);     // the neck
        ctx.fillStyle = '#1c2230';
        ctx.fillRect(-8, 20, 7, 12);
        ctx.fillRect(1, 20, 7, 12);
        ctx.fillStyle = '#26304a';
        ctx.fillRect(-16, -4, 5, 16);
        ctx.fillRect(11, -4, 5, 16);
        ctx.restore();
    },

    drawRaymondBanner(ctx) {
        if (!this.raymondBannerTime || this.raymondBannerTime <= 0) return;
        if (this.currentRoom !== 'roof') return;
        const a = Math.min(1, this.raymondBannerTime, (3.2 - this.raymondBannerTime) * 3);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.62 * a})`;
        ctx.fillRect(0, 88, canvas.width, 60);
        ctx.fillStyle = `rgba(190, 30, 30, ${a})`;
        ctx.font = 'bold 30px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.fillText('RAYMOND', canvas.width / 2, 126);
        ctx.textAlign = 'left';
    },

    drawCutsceneLine(ctx) {
        if (this.cutsceneLineTime <= 0 || !this.cutsceneLine) return;
        const a = Math.min(1, this.cutsceneLineTime);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * a})`;
        ctx.fillRect(0, canvas.height - 92, canvas.width, 50);
        ctx.fillStyle = `rgba(232, 226, 214, ${a})`;
        ctx.font = 'italic 17px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.fillText(this.cutsceneLine, canvas.width / 2, canvas.height - 61);
        ctx.textAlign = 'left';
    },

    // A shock: damage, plus it seizes up for a moment. An anomaly's seizure is
    // the same window you get by luring it into a wall, so it can be hurt then.
    shockEnemy(e, damage, stunFor) {
        if (!e || e.dead) return;
        if (e.kind === 'anomaly') {
            e.state = 'stunned';
            e.stateTimer = Math.max(e.stateTimer, stunFor);
        } else {
            e.stunTimer = Math.max(e.stunTimer || 0, stunFor);
        }
        if (e.shy && !e.raged) e.raged = true;
        e.hitFlash = 0.35;
        if (damage > 0 && e.kind !== 'anomaly') {
            e.hp -= damage;
            this.spawnBloodBurst(e.x, e.y, 5);
            if (e.hp <= 0) this.killEnemy(e);
        }
        this.lightning.push({
            x1: e.x - 16, y1: e.y - 22, x2: e.x + 16, y2: e.y + 18, life: 0.4
        });
    },

    // Would these drawers leave every part of the room reachable?
    drawersKeepRoomOpen(spots, dW, dH) {
        const fb = this.getRoomData().floorBounds;
        const walls = this.getRoomData().baseWalls.concat(
            spots.map(p => ({ x: p.x + 5, y: p.y + dH - 25, w: dW - 10, h: 25 })));
        const S = 12;
        const cols = Math.ceil(fb.w / S), rows = Math.ceil(fb.h / S);
        const free = (c, r) => {
            const x = fb.x + c * S + S / 2, y = fb.y + r * S + S / 2;
            const b = { x: x - 14, y: y + 9, w: 28, h: 10 };
            return !walls.some(w => b.x < w.x + w.w && b.x + b.w > w.x &&
                                    b.y < w.y + w.h && b.y + b.h > w.y);
        };
        const open = [], seen = [];
        let total = 0;
        for (let r = 0; r < rows; r++) {
            open.push([]); seen.push([]);
            for (let c = 0; c < cols; c++) {
                const f = free(c, r);
                open[r].push(f); seen[r].push(false);
                if (f) total++;
            }
        }
        if (total === 0) return false;
        // start from the middle of the room
        let sr = Math.floor(rows / 2), sc = Math.floor(cols / 2);
        outer:
        for (let d = 0; d < Math.max(rows, cols); d++) {
            for (let r = Math.max(0, sr - d); r <= Math.min(rows - 1, sr + d); r++) {
                for (let c = Math.max(0, sc - d); c <= Math.min(cols - 1, sc + d); c++) {
                    if (open[r][c]) { sr = r; sc = c; break outer; }
                }
            }
        }
        const stack = [[sr, sc]];
        seen[sr][sc] = true;
        let reach = 0;
        while (stack.length) {
            const [r, c] = stack.pop();
            reach++;
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                if (!open[nr][nc] || seen[nr][nc]) continue;
                seen[nr][nc] = true;
                stack.push([nr, nc]);
            }
        }
        return reach / total >= 0.985;
    },

    // Drawers are placed by looking for space rather than by hand: a spot
    // must be clear of furniture AND have room to stand in front of it.
    setupRoomDrawers(room, count) {
        if (this.roomDrawers[room]) {
            this.drawers = this.roomDrawers[room];
            this.rebuildWalls();
            return;
        }
        const want = count || 3;
        const fb = this.getRoomData().floorBounds;
        const dW = 65, dH = 110;
        const hits = (b) => this.walls.some(w =>
            b.x < w.x + w.w && b.x + b.w > w.x && b.y < w.y + w.h && b.y + b.h > w.y);

        // Only the room's own walls count as something to stand against —
        // furniture doesn't, or drawers end up wedged into aisles.
        const structural = this.walls.filter(w =>
            w.x <= fb.x || w.y <= fb.y ||
            w.x + w.w >= fb.x + fb.w || w.y + w.h >= fb.y + fb.h);
        const againstWall = (b) => structural.some(w =>
            b.x < w.x + w.w && b.x + b.w > w.x && b.y < w.y + w.h && b.y + b.h > w.y);

        // Lockers and doorways aren't walls, but a drawer on top of one would
        // steal its [E] prompt. Keep clear of them.
        const keepClear = [];
        const pad = (r, m) => ({ x: r.x - m, y: r.y - m, w: r.w + m * 2, h: r.h + m * 2 });
        if (this.currentRoom === 'lobby' || this.currentRoom === 'f3lobby') {
            for (const lk of this.lobby.lockers) keepClear.push(pad(lk, 50));
            keepClear.push(pad(this.lobby.doorA01, 55), pad(this.lobby.doorA02, 55));
            keepClear.push(pad(this.lobby.leftExitZone, 45), pad(this.lobby.rightExitZone, 45));
        }
        if (this.currentRoom === 'lounge') {
            for (const lk of this.lounge.lockers) keepClear.push(pad(lk, 70));
        }
        if (this.currentRoom === 'hallway' || this.currentRoom === 'f3hallway') {
            keepClear.push(pad(this.hallway.doorA01, 70), pad(this.hallway.doorA02, 70));
        }
        if (this.currentRoom === 'kitchen') keepClear.push(pad(this.kitchen.topDoor, 70));
        if (this.currentRoom === 'dining') keepClear.push(pad(this.dining.topDoor, 70));
        if (this.currentRoom === 'a02' || this.currentRoom === 'f3a02') {
            keepClear.push(pad(this.a02.topDoor, 70));
        }
        const blocked = (b) => keepClear.some(r =>
            b.x < r.x + r.w && b.x + b.w > r.x && b.y < r.y + r.h && b.y + b.h > r.y);

        const spots = [];
        for (let y = fb.y + 4; y <= fb.y + fb.h - dH - 45 && spots.length < want; y += 22) {
            for (let x = fb.x + 12; x <= fb.x + fb.w - dW - 12 && spots.length < want; x += 22) {
                // the drawer's own footprint
                if (hits({ x: x + 5, y: y + dH - 25, w: dW - 10, h: 25 })) continue;
                if (blocked({ x: x, y: y, w: dW, h: dH })) continue;
                // it has to back onto something — a drawer standing in the
                // middle of a room blocks aisles and lines of fire
                const against =
                    againstWall({ x: x + 8,  y: y - 16, w: dW - 16, h: 16 }) ||
                    againstWall({ x: x - 16, y: y + 20, w: 16, h: dH - 45 }) ||
                    againstWall({ x: x + dW, y: y + 20, w: 16, h: dH - 45 });
                if (!against) continue;
                // and somewhere to stand while you open it
                const fx = x + dW / 2, fy = y + dH + 20;
                if (fx < fb.x + 16 || fx > fb.x + fb.w - 16 ||
                    fy < fb.y + 16 || fy > fb.y + fb.h - 16) continue;
                if (hits({ x: fx - 16, y: fy - 12, w: 32, h: 24 })) continue;
                // keep them apart
                if (spots.some(p => Math.hypot(p.x - x, p.y - y) < 150)) continue;
                spots.push({ x, y });
            }
        }
        // Accept them one at a time, keeping only those that don't seal off
        // part of the room.
        const accepted = [];
        for (const p of spots) {
            if (this.drawersKeepRoomOpen(accepted.concat([p]), dW, dH)) accepted.push(p);
        }
        if (accepted.length === 0) return;
        this.spawnDrawers(accepted);
        this.roomDrawers[room] = this.drawers;
        this.rebuildWalls();   // they're solid, so the walls need them
    },

    // The second corridor, and the cells off both of them
    switchToF3Hallway2(fromLeft) {
        this.currentRoom = 'f3hallway2';
        this.player.x = fromLeft ? 80 : 880;
        this.player.y = 450;
        this.player.facing = fromLeft ? 'right' : 'left';
        this.clearRoomState();
        if (!this.f3Hallway2Cleared) this.spawnHallwayEnemies();
        this.rebuildWalls();
        this.hallwayNotice = 'THE CELL BLOCK.';
        this.hallwayNoticeTime = 1.5;
    },

    switchToCell(which) {
        this.currentRoom = which;
        const fb = this.getRoomData().floorBounds;
        this.player.x = 480;
        this.player.y = fb.y + fb.h - 30;
        this.player.facing = 'up';
        this.clearRoomState();
        this.rebuildWalls();
        this.cellsSeen[which] = true;
        this.hallwayNotice = which === 'torture' ? 'THIS ONE IS NOT A CELL.' : 'A CELL.';
        this.hallwayNoticeTime = 1.7;
        // these set their own notices, so they run last
        if (which === 'torture') this.setupTortureRoom();
        if (which === 'cell3') this.setupCell3Encounter();
    },

    // Back out into whichever corridor that cell belongs to
    switchCellToHallway(which) {
        const first = (which === 'cell1' || which === 'cell2');
        const door = (which === 'cell1' || which === 'cell3')
            ? this.hallway.doorA01 : this.hallway.doorA02;
        if (first) this.switchToF3Hallway(false);
        else this.switchToF3Hallway2(true);
        this.player.x = door.x + door.w / 2;
        this.player.y = door.y + door.h + 40;
        this.player.facing = 'down';
    },

    // She reads your face, goes for the door, and shuts it behind her.
    shreyaRunsForIt() {
        this.shreyaFled = true;
        this.tortureLocked = true;
        this.tortureCleared = false;
        this.companionsRecruited.shreya = false;   // her perks go with her
        this.followers.shreya.room = '';
        this.screenShake = 0.8;

        // one wave, and it is everything this floor has
        const fb = this.getRoomData().floorBounds;
        const kinds = ['charger', 'thrower', 'shy'];
        const spots = [];
        this.enemies = [];
        for (let i = 0; i < 7; i++) {
            let placed = null;
            for (let tries = 0; tries < 40 && !placed; tries++) {
                const x = fb.x + 40 + Math.random() * (fb.w - 80);
                const y = fb.y + 40 + Math.random() * (fb.h - 80);
                if (Math.hypot(x - this.player.x, y - this.player.y) < 120) continue;
                if (spots.some(p => Math.hypot(p.x - x, p.y - y) < 60)) continue;
                const kind = kinds[Math.floor(Math.random() * kinds.length)];
                const e = kind === 'charger' ? this.makeSwarmCharger(x, y)
                        : kind === 'thrower' ? this.makeSwarmThrower(x, y)
                        : this.makeShyEnemy(x, y);
                if (this.enemyBlocked(e, e.x, e.y)) continue;
                if (e.shy) e.raged = true;       // no hiding today
                placed = e;
                spots.push({ x: x, y: y });
            }
            if (placed) this.enemies.push(placed);
        }

        this.hallwayNotice = 'THE DOOR SLAMS. SHE IS ON THE OTHER SIDE OF IT.';
        this.hallwayNoticeTime = 3.6;
    },

    updateTortureLockdown(dt) {
        if (!this.tortureLocked || this.currentRoom !== 'torture') return;
        if (this.enemies.length === 0 || !this.enemies.every(e => e.dead)) return;
        this.tortureLocked = false;
        this.tortureCleared = true;
        this.hallwayNotice = 'THE BOLT GIVES. SHE IS STILL OUT THERE.';
        this.hallwayNoticeTime = 3.6;
        this.autosave();
    },

    // She is waiting in the corridor, and she does not run again.
    tryConfrontShreya() {
        if (!this.shreyaFled || this.shreyaConfronted) return false;
        if (this.currentRoom !== 'f3hallway2') return false;
        if (Math.hypot(this.player.x - this.shreyaSpot.x,
                       this.player.y - this.shreyaSpot.y) > 60) return false;

        this.shreyaConfronted = true;
        this.dialogue.active = true;
        this.dialogue.speaker = 'SHREYA';
        this.dialogue.lines = [
            "Put it down. You've had that card in your hand for ten minutes and you still haven't worked it out.",
            "I didn't find this place. I built it. Every consent form in those drawers has my signature on it.",
            "Raymond was the first one that held. Everything before him came apart the way that thing in cell three did.",
            "Armada was never hunting you. He was following me. I let him think the corridor was the way out.",
            "And you — you carried my card through four floors and called it a rescue.",
            "You want to put him down? Cold. Heat does nothing, current only annoys him — cold.",
            "There's a man in the dining hall with a gun that does exactly that. Take it off him.",
            "Go down if you want. Floor two is where the ones that worked are kept."
        ];
        this.dialogue.line = 0;
        this.dialogue.charIndex = 0;
        this.dialogue.charTimer = 0;

        // She has nothing left to hide, and the way out is through the same men.
        this.companionsRecruited.shreya = true;
        this.followers.shreya.tazeTimer = 15;
        this.placeCompanion('shreya', this.shreyaSpot.x, this.shreyaSpot.y);
        this.sideQuestNotice = 'She falls in behind you. Neither of you says anything about it.';
        this.sideQuestNoticeTime = 4.2;

        this.autosave();
        return true;
    },

    shreyaSpot: { x: 480, y: 470 },

    // What's lying on the table in the middle of the torture room.
    setupTortureRoom() {
        if (this.hasShreyaId || this.items.some(i => i.id === 'shreyaId')) return;
        this.items.push({
            id: 'shreyaId', name: 'ID CARD',
            x: 482, y: 392,          // on the near edge of the table
            pickupRadius: 42, pickedUp: false, spawnTime: this.time
        });
    },

    // The cabinets in the cells. The one in cell 3 has a gun in it.
    trySearchCabinet() {
        const cab = this.cabinetPromptTarget;
        if (!cab || cab.looted) return false;
        cab.looted = true;

        if (this.currentRoom === 'cell3') {
            this.inventory.push({ id: 'burst', name: 'SEMI-AUTO', qty: 1 });
            this.weaponDurability.burst = WEAPON_STATS.burst.durabilityMax;
            this.autoEquipWeapon();
            this.pickupNotice = 'FOUND: SEMI-AUTO PISTOL';
            this.pickupNoticeTime = 2.4;
            this.sideQuestNotice = 'A guard hid it in here. Hold the trigger and it fires three.';
            this.sideQuestNoticeTime = 3.6;
            this.autosave();
            return true;
        }

        // the rest hold whatever was left behind
        const n = 1 + Math.floor(Math.random() * 2);
        const got = [];
        for (let i = 0; i < n; i++) {
            const roll = rollLoot(this.hasPistol || this.hasShotgun);
            const existing = this.inventory.find(it => it.id === roll.id);
            if (existing) existing.qty += 1;
            else this.inventory.push({ id: roll.id, name: roll.name, qty: 1 });
            if (roll.id === 'ammo') this.pistolReserve += 7;
            got.push(roll.name);
        }
        this.autoEquipWeapon();
        this.pickupNotice = 'FOUND: ' + got.join(', ');
        this.pickupNoticeTime = 1.8;
        this.autosave();
        return true;
    },

    // ===== FLOOR 3: THE DINING HALL =====
    // Long sight lines down the tables, and nowhere to stand. Two waves.
    setupDiningAmbush() {
        if (this.diningCleared) {
            this.enemies = [];
            if (this.f2KeycardDropped && !this.hasF2Keycard) {
                this.items.push({
                    id: 'f2keycard', name: 'KEYCARD', x: 480, y: 380,
                    pickupRadius: 40, pickedUp: false,
                    spawnTime: this.time, isRecovered: true
                });
            }
            return;
        }
        this.startDiningWave(1);
    },

    startDiningWave(n) {
        this.diningWave = n;
        if (n === 1) {
            this.enemies = [
                this.makeSwarmCharger(200, 330),
                this.makeSwarmCharger(760, 330),
                this.makeSwarmCharger(480, 500),
                this.makeSwarmThrower(300, 250)
            ];
            this.hallwayNotice = 'THE DOORS BANG SHUT BEHIND YOU.';
            this.hallwayNoticeTime = 1.9;
        } else {
            this.enemies = [
                this.makeSwarmThrower(200, 260),
                this.makeSwarmThrower(780, 260),
                this.makeAnomalyEnemy(480, 300)
            ];
            this.hallwayNotice = 'SOMETHING COMES THROUGH THE SERVERY.';
            this.hallwayNoticeTime = 1.8;
        }
        this.roofWaveBanner = 'DINING HALL — WAVE ' + n;
        this.roofWaveBannerTime = 2.4;
        this.screenShake = Math.max(this.screenShake, 0.35);
    },

    updateDiningAmbush(dt) {
        if (this.currentRoom !== 'dining' || this.diningCleared) return;
        if (this.diningGap > 0) {
            this.diningGap -= dt;
            if (this.diningGap <= 0) this.startDiningWave(2);
            return;
        }
        if (this.enemies.length === 0 || !this.enemies.every(e => e.dead)) return;

        if (this.diningWave < 2) {
            this.diningGap = 2.5;
            this.hallwayNotice = 'IT IS NOT OVER.';
            this.hallwayNoticeTime = 1.3;
        } else {
            this.diningCleared = true;
            this.f2KeycardDropped = true;
            this.items.push({
                id: 'f2keycard', name: 'KEYCARD', x: 480, y: 380,
                pickupRadius: 40, pickedUp: false, spawnTime: this.time
            });
            this.hallwayNotice = 'A CARD, ON A CHAIN ROUND ITS NECK.';
            this.hallwayNoticeTime = 2.4;
            this.autosave();
        }
    },

    // ===== RAYMOND, THE SECOND TIME =====
    // Now you have the one thing he cannot take.
    spawnRaymondRematch() {
        const r = this.raymond;
        r.active = true;
        r.mode = 'rematch';
        r.x = 480; r.y = 300;
        r.hp = 100;
        r.frozen = 0;
        r.state = 'arriving';
        r.stateTimer = 2.0;
        r.dominance = 0;        // no games this time
        r.tauntsLeft = 0;
        r.hitFlash = 0; r.staggered = 0; r.trail = [];
        this.raymondBannerTime = 3.0;
        this.screenShake = 0.8;
        this.hallwayNotice = 'HE CAME BACK UP FOR YOU.';
        this.hallwayNoticeTime = 3.0;
    },

    // A freeze pellet: it holds him, and it hurts.
    freezeRaymond() {
        const r = this.raymond;
        r.frozen = 5.0;
        r.hitFlash = 0.3;
        this.hurtRaymond(5, 'FROZEN');
        this.screenShake = Math.max(this.screenShake, 0.5);
        for (let k = 0; k < 18; k++) {
            const ang = Math.random() * Math.PI * 2;
            this.frostMotes.push({
                x: r.x, y: r.y,
                vx: Math.cos(ang) * (30 + Math.random() * 60),
                vy: Math.sin(ang) * (30 + Math.random() * 60),
                life: 0.6, size: 2 + Math.random() * 3
            });
        }
    },

    hurtRaymond(percent, label) {
        const r = this.raymond;
        if (!r.active || r.mode !== 'rematch') return;
        r.hp = Math.max(0, r.hp - percent);
        r.hitFlash = 0.2;
        this.spawnBloodBurst(r.x, r.y, 6);
        this.hitEffects.push({
            x: r.x, y: r.y - 46,
            text: label || ('-' + percent + '%'),
            life: 0.9, color: label ? '#9fe8ff' : '#ffcc44'
        });
        if (r.hp <= 0) this.killRaymond();
    },

    killRaymond() {
        const r = this.raymond;
        // He does not just fall over. He has something to say first.
        if (r.mode === 'rematch' && !this.endScene.done) {
            this.startEndScene();
            return;
        }
        r.active = false;
        this.raymondDefeated = true;
        this.screenShake = 1.2;
        this.spawnBloodBurst(r.x, r.y, 40);
        this.addBloodPool(r.x, r.y + 14, true);
        for (let k = 0; k < 30; k++) {
            const ang = Math.random() * Math.PI * 2;
            this.frostMotes.push({
                x: r.x, y: r.y,
                vx: Math.cos(ang) * (50 + Math.random() * 110),
                vy: Math.sin(ang) * (50 + Math.random() * 110),
                life: 0.9, size: 2 + Math.random() * 5
            });
        }
        this.hallwayNotice = 'HE GOES DOWN. HE DOES NOT GET UP.';
        this.hallwayNoticeTime = 4.2;
        this.sideQuestNotice = 'Whatever she made him into, it could not take the cold.';
        this.sideQuestNoticeTime = 4.2;
        this.autosave();
    },

    drawRaymondHealthBar(ctx) {
        const r = this.raymond;
        if (!r.active || r.mode !== 'rematch') return;
        if (this.endScene.active) return;
        const w = canvas.width - 180, x = 90, y = 56;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(x - 3, y - 3, w + 6, 20);
        ctx.fillStyle = r.frozen > 0 ? '#9fe8ff' : '#a01818';
        ctx.fillRect(x, y, w * (r.hp / 100), 14);
        ctx.strokeStyle = 'rgba(220,210,200,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 3, y - 3, w + 6, 20);
        ctx.fillStyle = '#e8e2d6';
        ctx.font = 'bold 12px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.fillText('RAYMOND', canvas.width / 2, y - 8);
        ctx.textAlign = 'left';
        if (r.frozen > 0) {
            ctx.fillStyle = '#bfeaff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FROZEN  ' + r.frozen.toFixed(1) + 's', canvas.width / 2, y + 28);
            ctx.textAlign = 'left';
        }
    },

    // ===== THE END =====
    // He goes down on one knee and tells you what she did to Armada. Then
    // Armada comes through the door for her, and goes through him to get there.
    startEndScene() {
        const r = this.raymond;
        r.hp = 0;
        r.frozen = 0;
        r.state = 'kneeling';
        this.endScene = { active: true, step: 0, timer: 0, done: false };
        this.thrown = null;
        this.enemyProjectiles = [];
        this.screenShake = 0.9;
        this.hallwayNotice = '';
        this.hallwayNoticeTime = 0;
    },

    // Raymond leaving the ground and arriving somewhere else
    throwRaymond(tx, ty, time) {
        const r = this.raymond;
        this.thrown = {
            x0: r.x, y0: r.y, x1: tx, y1: ty,
            t: 0, dur: time || 0.45
        };
        this.screenShake = 1.0;
    },

    updateThrown(dt) {
        const th = this.thrown;
        if (!th) return;
        const r = this.raymond;
        th.t += dt;
        const k = Math.min(1, th.t / th.dur);
        r.x = th.x0 + (th.x1 - th.x0) * k;
        r.y = th.y0 + (th.y1 - th.y0) * k - Math.sin(k * Math.PI) * 46;   // an arc
        if (k >= 1) {
            this.thrown = null;
            this.screenShake = Math.max(this.screenShake, 0.8);
            this.spawnBloodBurst(r.x, r.y, 18);
            this.addBloodStain(r.x, r.y + 10, true);
            this.addBloodPool(r.x, r.y + 12, true);
        }
    },

    updateEndScene(dt) {
        const sc = this.endScene;
        if (!sc.active) return;
        const r = this.raymond;
        const a = this.armada;

        this.player.stunTimer = 0.3;        // you only watch this
        this.player.iframes = Math.max(this.player.iframes, 0.5);
        if (this.player.poison) this.player.poison = 0;
        this.updateThrown(dt);
        sc.timer -= dt;
        if (sc.timer > 0) return;
        sc.step += 1;

        switch (sc.step) {
            case 1:
                this.sceneLine("He goes down on one knee and does not get up.", 2.6);
                sc.timer = 2.4;
                break;
            case 2:
                this.sceneLine("RAYMOND: \"You think he's the monster in this building.\"", 3.2);
                sc.timer = 3.0;
                break;
            case 3:
                this.sceneLine("RAYMOND: \"He was the first one they brought in. Before any of it had a name.\"", 3.6);
                sc.timer = 3.4;
                break;
            case 4:
                this.sceneLine("RAYMOND: \"A soldier. Two tours. He came here for the nightmares.\"", 3.4);
                sc.timer = 3.2;
                break;
            case 5:
                this.sceneLine("RAYMOND: \"She took him apart. When he would not die, she wrote it up as a success.\"", 4.0);
                sc.timer = 3.8;
                break;
            case 6:
                this.sceneLine("RAYMOND: \"He was never hunting you. He has been looking for her this whole time.\"", 4.0);
                sc.timer = 3.8;
                break;
            case 7:
                this.sceneLine("RAYMOND: \"...and he is very close now.\"", 2.6);
                sc.timer = 2.4;
                break;
            case 8:
                r.state = 'standing';
                this.sceneLine("RAYMOND: \"She is downstairs. He will go through this whole building to reach her.\"", 3.8);
                sc.timer = 3.6;
                break;
            case 9:
                this.sceneLine("RAYMOND: \"You cannot stop him on your own. I have tried.\"", 3.2);
                sc.timer = 3.0;
                break;
            case 10:
                this.sceneLine("He gets up. He does not pick his sword back up.", 3.0);
                sc.timer = 2.8;
                break;
            case 11:
                this.raymondJoined = true;
                r.active = false;
                this.raymondDefeated = true;
                this.sceneLine("RAYMOND: \"Take me to him. I will know when the moment comes.\"", 3.6);
                sc.timer = 3.4;
                break;
            default:
                sc.active = false;
                sc.done = true;
                this.player.stunTimer = 0;
                this.hallwayNotice = 'RAYMOND IS WITH YOU.';
                this.hallwayNoticeTime = 3.0;
                this.sideQuestNotice = 'He walks a few steps behind. He will not fight until you have put Armada down.';
                this.sideQuestNoticeTime = 4.8;
                this.autosave();
                break;
        }
    },

    // ===== HOW IT ENDS =====
    startFinale() {
        this.finale = { active: true, step: 0, timer: 0, done: false };
        this.screenShake = 0.8;
    },

    updateFinale(dt) {
        const fn = this.finale;
        if (!fn.active) return;
        const a = this.armada;
        const r = this.raymond;

        this.player.stunTimer = 0.3;
        this.player.iframes = Math.max(this.player.iframes, 0.5);
        this.updateFighters(dt);
        fn.timer -= dt;
        if (fn.timer > 0) return;
        fn.step += 1;

        switch (fn.step) {
            case 1:
                this.sceneLine("Neither of them is getting up quickly this time.", 2.8);
                fn.timer = 2.6;
                break;
            case 2:
                this.sceneLine("RAYMOND: \"He will not stop. Not for you, not for me, not for her.\"", 3.6);
                fn.timer = 3.4;
                break;
            case 3:
                this.sceneLine("He takes something off his belt and holds the lever down.", 3.2);
                fn.timer = 3.0;
                break;
            case 4:
                this.sceneLine("RAYMOND: \"Get back.\"", 2.4);
                fn.timer = 2.2;
                break;
            case 5: {
                // he plants it on Armada and throws himself clear
                r.x = a.x - 40; r.y = a.y;
                this.screenShake = 1.0;
                const fbx = this.getRoomData().floorBounds;
                this.throwFighter(r, Math.max(fbx.x + 50, a.x - 240), a.y + 100, 0.45);
                this.sceneLine("He forces it under the straps on Armada's chest, and throws himself backwards.", 3.0);
                fn.timer = 2.4;
                break;
            }
            case 6: {
                // the blast
                this.screenShake = 2.0;
                this.whiteFlash = 0.6;
                const cx = a.x, cy = a.y;
                for (let k = 0; k < 60; k++) {
                    const ang = Math.random() * Math.PI * 2;
                    const sp = 60 + Math.random() * 220;
                    this.frostMotes.push({
                        x: cx, y: cy,
                        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
                        life: 0.8, size: 2 + Math.random() * 4
                    });
                }
                this.spawnBloodBurst(cx, cy, 60);
                this.floodRoomWithBlood(cx, cy);
                a.active = false; a.room = 'away';
                this.armadaFinal.active = false;   // Raymond lives through it
                this.sceneLine("", 0.1);
                fn.timer = 2.4;
                break;
            }
            case 7:
                this.sceneLine("There is not enough of Armada left to carry out.", 3.2);
                fn.timer = 3.0;
                break;
            case 8:
                this.hasExitKey = true;
                this.inventory.push({ id: 'exitkey', name: 'FRONT DOOR KEY', qty: 1 });
                this.pickupNotice = 'PICKED UP: FRONT DOOR KEY';
                this.pickupNoticeTime = 3.0;
                this.sideQuestNotice = 'It was on a chain round Armada\'s neck. He had been carrying the way out the whole time.';
                this.sideQuestNoticeTime = 5.4;
                fn.timer = 4.0;
                break;
            case 9:
                this.sceneLine("Raymond is a long time getting up. Then he gets up.", 3.0);
                fn.timer = 2.8;
                break;
            case 10:
                this.sceneLine("Nothing else moves in the lobby.", 2.4);
                fn.timer = 2.2;
                break;
            default:
                fn.active = false;
                fn.done = true;
                this.player.stunTimer = 0;
                if (typeof netChat !== 'undefined' && netChat && netChat.sendFinish) {
                    netChat.sendFinish(this.playTime);
                }
                this.epilogue = { active: true, line: 0, timer: 0, finished: false };
                this.autosave();
                break;
        }
    },

    // There is not much left of either of them, and none of it stays in one place.
    floodRoomWithBlood(cx, cy) {
        const fb = this.getRoomData().floorBounds;
        // pools spreading out from where they were standing
        this.addBloodPool(cx, cy, true);
        for (let k = 0; k < 14; k++) {
            const ang = Math.random() * Math.PI * 2;
            const r = 30 + Math.random() * 190;
            this.addBloodPool(
                Math.max(fb.x + 16, Math.min(fb.x + fb.w - 16, cx + Math.cos(ang) * r)),
                Math.max(fb.y + 16, Math.min(fb.y + fb.h - 16, cy + Math.sin(ang) * r)),
                true);
        }
        // Spray outward from the blast...
        for (let k = 0; k < 110; k++) {
            const ang = Math.random() * Math.PI * 2;
            const r = Math.pow(Math.random(), 0.55) * Math.max(fb.w, fb.h) * 0.6;
            const x = cx + Math.cos(ang) * r;
            const y = cy + Math.sin(ang) * r;
            if (x < fb.x || x > fb.x + fb.w || y < fb.y || y > fb.y + fb.h) continue;
            this.addBloodStain(x, y, true);
        }
        // ...and over the rest of the room, so no corner is left clean
        for (let k = 0; k < 200; k++) {
            this.addBloodStain(
                fb.x + 10 + Math.random() * (fb.w - 20),
                fb.y + 10 + Math.random() * (fb.h - 20),
                true);
        }
        // pieces of both of them
        for (let k = 0; k < 14; k++) {
            const ang = Math.random() * Math.PI * 2;
            const r = 40 + Math.random() * 200;
            this.gibs.push({
                type: k % 3 === 0 ? 'head' : (k % 3 === 1 ? 'leg' : 'chunk'),
                x: Math.max(fb.x + 20, Math.min(fb.x + fb.w - 20, cx + Math.cos(ang) * r)),
                y: Math.max(fb.y + 20, Math.min(fb.y + fb.h - 20, cy + Math.sin(ang) * r)),
                rot: Math.random() * 6
            });
        }
    },

    updateEpilogue(dt) {
        const ep = this.epilogue;
        if (!ep.active) return;
        this.player.stunTimer = 0.3;

        if (!ep.finished) {
            ep.timer += dt;
            // each line holds for a moment, then the next one replaces it
            if (ep.timer > 4.6) {
                ep.timer = 0;
                ep.line += 1;
                if (ep.line >= this.EPILOGUE_LINES.length) {
                    ep.line = this.EPILOGUE_LINES.length;
                    ep.finished = true;
                }
            }
            // a tap skips to the next line
            if (keysPressed['enter'] || keysPressed[' '] || mouse.clicked) {
                ep.timer = 0;
                ep.line += 1;
                if (ep.line >= this.EPILOGUE_LINES.length) {
                    ep.line = this.EPILOGUE_LINES.length;
                    ep.finished = true;
                }
            }
            return;
        }

        // the last screen: enter goes back to the menu
        ep.timer += dt;
        if (ep.timer > 0.8 && keysPressed['enter']) {
            ep.active = false;
            if (typeof changeScene === 'function' && typeof menuScene !== 'undefined') {
                changeScene(menuScene);
            }
        }
    },

    drawEpilogue(ctx) {
        const ep = this.epilogue;
        if (!ep.active) return;
        const W = canvas.width, H = canvas.height;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';

        if (!ep.finished) {
            const text = this.EPILOGUE_LINES[ep.line] || '';
            // fade in, hold, fade out
            let a = 1;
            if (ep.timer < 0.9) a = ep.timer / 0.9;
            else if (ep.timer > 3.9) a = Math.max(0, 1 - (ep.timer - 3.9) / 0.7);

            ctx.fillStyle = `rgba(226, 220, 208, ${a})`;
            ctx.font = '19px "Times New Roman"';
            this.wrapCentred(ctx, text, W / 2, H / 2, W - 260, 30);

            ctx.fillStyle = 'rgba(90, 85, 78, 0.6)';
            ctx.font = '11px monospace';
            ctx.fillText('press enter', W / 2, H - 40);
            ctx.textAlign = 'left';
            return;
        }

        // the last screen
        ctx.fillStyle = '#e8e2d6';
        ctx.font = 'bold 30px "Times New Roman"';
        ctx.fillText('THANK YOU FOR PLAYING', W / 2, H / 2 - 50);

        ctx.font = 'italic 16px "Times New Roman"';
        ctx.fillStyle = '#8a857c';
        ctx.fillText("ARMADA'S REVENGE", W / 2, H / 2 - 16);

        ctx.font = 'bold 17px monospace';
        ctx.fillStyle = '#ffcc44';
        ctx.fillText('COMPLETION TIME   ' + this.formatTime(this.playTime), W / 2, H / 2 + 36);

        this.drawLeaderboard(ctx);

        const blink = 0.55 + Math.sin(this.time * 3) * 0.45;
        ctx.fillStyle = `rgba(200, 194, 182, ${blink})`;
        ctx.font = '13px monospace';
        ctx.fillText('PRESS ENTER TO RETURN TO THE MENU', W / 2, H - 46);
        ctx.textAlign = 'left';
    },

    // Centre a line, wrapping it if it is too wide
    wrapCentred(ctx, text, cx, cy, maxW, lineH) {
        const words = String(text).split(' ');
        const lines = [];
        let line = '';
        for (const w of words) {
            const test = line ? line + ' ' + w : w;
            if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
            else line = test;
        }
        if (line) lines.push(line);
        const top = cy - ((lines.length - 1) * lineH) / 2;
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], cx, top + i * lineH);
    },

    drawFinaleCard(ctx) {
        if (!this.finale.done) return;
        if (this.epilogue.active) return;   // the epilogue has the screen now
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e8e2d6';
        ctx.font = 'bold 36px "Times New Roman"';
        ctx.fillText('YOU GET OUT', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = 'italic 17px "Times New Roman"';
        ctx.fillStyle = '#9a948a';
        ctx.fillText('Greenvale Asylum — four floors, and everyone in them.',
                     canvas.width / 2, canvas.height / 2 - 6);
        ctx.font = 'bold 15px monospace';
        ctx.fillStyle = '#ffcc44';
        ctx.fillText('COMPLETION TIME   ' + this.formatTime(this.playTime),
                     canvas.width / 2, canvas.height / 2 + 44);
        this.drawLeaderboard(ctx);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#6a655e';
        ctx.fillText('ARMADA\'S REVENGE', canvas.width / 2, canvas.height / 2 + 232);
        ctx.textAlign = 'left';
    },

    // Everyone's best runs, fastest at the top.
    drawLeaderboard(ctx) {
        const nc = (typeof netChat !== 'undefined') ? netChat : null;
        const rows = (nc && nc.leaderboard) ? nc.leaderboard.slice(0, 5) : [];
        const top = canvas.height / 2 + 78;

        ctx.textAlign = 'center';
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#9a948a';
        ctx.fillText('FASTEST ESCAPES', canvas.width / 2, top);

        if (rows.length === 0) {
            ctx.font = '12px monospace';
            ctx.fillStyle = '#5a554e';
            ctx.fillText(nc && nc.connected ? 'no times recorded yet'
                                            : 'offline — times are not shared',
                         canvas.width / 2, top + 26);
            if (nc && nc.myBest > 0) {
                ctx.fillStyle = '#9a948a';
                ctx.fillText('your best   ' + nc.formatTime(nc.myBest),
                             canvas.width / 2, top + 48);
            }
            ctx.textAlign = 'left';
            return;
        }

        const mine = nc ? nc.myName : '';
        ctx.font = '13px monospace';
        for (let i = 0; i < rows.length; i++) {
            const y = top + 24 + i * 20;
            const you = rows[i].name === mine;
            ctx.fillStyle = you ? '#ffcc44' : '#9a948a';
            ctx.textAlign = 'right';
            ctx.fillText((i + 1) + '.', canvas.width / 2 - 110, y);
            ctx.textAlign = 'left';
            ctx.fillText(rows[i].name.substring(0, 16), canvas.width / 2 - 96, y);
            ctx.textAlign = 'right';
            ctx.fillText(nc.formatTime(rows[i].time), canvas.width / 2 + 120, y);
        }
        ctx.textAlign = 'center';
    },

    drawWhiteFlash(ctx) {
        if (!this.whiteFlash || this.whiteFlash <= 0) return;
        ctx.fillStyle = `rgba(255, 255, 245, ${Math.min(1, this.whiteFlash)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },

    drawArmadaFinalHud(ctx) {
        const af = this.armadaFinal;
        if (this.armadaBannerTime > 0) {
            const t = Math.min(1, this.armadaBannerTime);
            ctx.fillStyle = `rgba(0,0,0,${0.6 * t})`;
            ctx.fillRect(0, 88, canvas.width, 56);
            ctx.fillStyle = `rgba(190, 30, 30, ${t})`;
            ctx.font = 'bold 28px "Times New Roman"';
            ctx.textAlign = 'center';
            ctx.fillText('ARMADA', canvas.width / 2, 124);
            ctx.textAlign = 'left';
        }
        if (!af.active) return;
        const w = canvas.width - 180, x = 90, y = 56;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(x - 3, y - 3, w + 6, 20);
        ctx.fillStyle = af.frozen > 0 ? '#9fe8ff' : '#a01818';
        ctx.fillRect(x, y, w * Math.min(1, af.hits / this.HITS_TO_NEUTRALISE), 14);
        ctx.strokeStyle = 'rgba(220,210,200,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 3, y - 3, w + 6, 20);
        ctx.fillStyle = '#e8e2d6';
        ctx.font = 'bold 12px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.fillText('ARMADA   —   ROUND ' + Math.min(3, af.cycle + 1) + ' OF 3',
                     canvas.width / 2, y - 8);
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#9a948a';
        ctx.fillText(af.state === 'fighting'
            ? (this.HITS_TO_NEUTRALISE - af.hits) + ' MORE'
            : 'HE IS DOWN', canvas.width / 2, y + 28);
        ctx.textAlign = 'left';
    },

    // ===== THE LAST FIGHT =====
    // Armada can finally be put down — but only for a moment at a time, and
    // only Raymond can do anything with that moment.
    startArmadaFinal() {
        const af = this.armadaFinal;
        af.active = true;
        af.hits = 0;
        af.state = 'fighting';
        af.timer = 0;
        af.frozen = 0;
        const a = this.armada;
        a.active = true;
        a.room = this.currentRoom;
        a.x = 480; a.y = 220;
        a.state = 'stalking';
        this.raymond.x = 200; this.raymond.y = 470;
        this.pursuit.enabled = false;        // no clock — he is right here
        this.screenShake = 0.9;
        this.armadaBannerTime = 3.2;
        this.hallwayNotice = 'HE IS NOT LOOKING FOR YOU. YOU ARE IN THE WAY.';
        this.hallwayNoticeTime = 3.6;
    },

    // What each weapon is worth against him
    armadaHitValue(weaponId) {
        if (weaponId === 'pistol' || weaponId === 'burst') return 2;
        if (weaponId === 'shotgun') return 3;
        if (weaponId === 'freezegun') return 0;      // it holds him, nothing more
        return 1;                                     // blades
    },

    hitArmadaFinal(weaponId, isFreeze) {
        const af = this.armadaFinal;
        if (!af.active || af.state !== 'fighting') return;

        if (isFreeze) {
            af.frozen = 4.0;
            af.flash = 0.3;
            this.hitEffects.push({
                x: this.armada.x, y: this.armada.y - 54,
                text: 'HELD', life: 1.0, color: '#9fe8ff'
            });
            return;
        }

        af.hits += this.armadaHitValue(weaponId);
        af.flash = 0.2;
        this.spawnBloodBurst(this.armada.x, this.armada.y, 5);
        if (af.hits >= this.HITS_TO_NEUTRALISE) this.neutraliseArmada();
    },

    neutraliseArmada() {
        const af = this.armadaFinal;
        af.state = 'down';
        af.timer = 1.2;
        af.hits = 0;
        af.frozen = 0;
        this.screenShake = 1.0;
        this.spawnBloodBurst(this.armada.x, this.armada.y, 26);
        this.hallwayNotice = 'HE GOES DOWN ON ONE KNEE.';
        this.hallwayNoticeTime = 2.4;
        this.dropArmadaLoot();
    },

    // He drops enough for you to do it again
    dropArmadaLoot() {
        const fb = this.getRoomData().floorBounds;
        const a = this.armada;
        const drops = [
            { id: 'ammo', name: 'ROUNDS' }, { id: 'ammo', name: 'ROUNDS' },
            { id: 'ammo', name: 'ROUNDS' }, { id: 'ammo', name: 'ROUNDS' },
            { id: 'shard', name: 'GLASS SHARD' }, { id: 'cloth', name: 'CLOTH STRIP' },
            { id: 'bandages', name: 'BANDAGES' }, { id: 'medicine', name: 'MEDICINE' }
        ];
        for (let k = 0; k < drops.length; k++) {
            const ang = (k / drops.length) * Math.PI * 2;
            const r = 50 + Math.random() * 40;
            this.items.push({
                id: drops[k].id, name: drops[k].name,
                x: Math.max(fb.x + 20, Math.min(fb.x + fb.w - 20, a.x + Math.cos(ang) * r)),
                y: Math.max(fb.y + 20, Math.min(fb.y + fb.h - 20, a.y + Math.sin(ang) * r)),
                pickupRadius: 40, pickedUp: false, spawnTime: this.time, isRecovered: true
            });
        }
        this.pickupNotice = 'HE DROPS WHAT HE WAS CARRYING';
        this.pickupNoticeTime = 2.4;
    },

    updateArmadaFinal(dt) {
        const af = this.armadaFinal;
        if (this.armadaBannerTime > 0) this.armadaBannerTime -= dt;
        if (!af.active) return;
        if (af.flash > 0) af.flash -= dt;
        const a = this.armada;
        const r = this.raymond;

        if (af.frozen > 0 && af.state === 'fighting') {
            af.frozen -= dt;
            return;                       // held: he does nothing
        }

        af.timer -= dt;
        if (af.state === 'fighting') return;   // his normal AI runs elsewhere

        if (af.state === 'down' && af.timer <= 0) {
            // Raymond takes his moment
            af.state = 'clash';
            af.timer = 0.7;
            r.x = a.x - 90; r.y = a.y;
            this.screenShake = 1.2;
            this.hitEffects.push({
                x: a.x, y: a.y - 60, text: 'RAYMOND', life: 1.2, color: '#ffcc44'
            });
            return;
        }

        if (af.state === 'clash' && af.timer <= 0) {
            // they hit each other and both come off worse
            af.cycle += 1;
            this.screenShake = 1.4;
            this.spawnBloodBurst((a.x + r.x) / 2, (a.y + r.y) / 2, 30);
            const fb = this.getRoomData().floorBounds;
            this.throwFighter(a, Math.max(fb.x + 40, a.x - 240), a.y - 60, 0.45);
            this.throwFighter(r, Math.min(fb.x + fb.w - 40, r.x + 200), r.y + 50, 0.45);
            if (af.cycle >= 3) {
                af.state = 'finale';
                af.timer = 1.6;
            } else {
                af.state = 'recovering';
                af.timer = 2.2;
                this.hallwayNotice = 'THEY BOTH GET BACK UP.';
                this.hallwayNoticeTime = 2.4;
            }
            return;
        }

        if (af.state === 'recovering' && af.timer <= 0) {
            af.state = 'fighting';
            af.hits = 0;
            this.hallwayNotice = 'AGAIN.';
            this.hallwayNoticeTime = 1.8;
            return;
        }

        if (af.state === 'finale' && af.timer <= 0) {
            af.state = 'done';
            this.startFinale();
        }
    },

    // Someone leaving their feet in a straight line
    throwFighter(who, tx, ty, time) {
        who._fly = { x0: who.x, y0: who.y, x1: tx, y1: ty, t: 0, dur: time || 0.45 };
    },

    updateFighters(dt) {
        for (const who of [this.armada, this.raymond]) {
            if (!who || !who._fly) continue;
            const F = who._fly;
            F.t += dt;
            const k = Math.min(1, F.t / F.dur);
            who.x = F.x0 + (F.x1 - F.x0) * k;
            who.y = F.y0 + (F.y1 - F.y0) * k - Math.sin(k * Math.PI) * 40;
            if (k >= 1) {
                who._fly = null;
                this.screenShake = Math.max(this.screenShake, 0.7);
                this.spawnBloodBurst(who.x, who.y, 12);
                this.addBloodStain(who.x, who.y + 10, true);
            }
        }
    },

    // ===== THE MAN WITH THE FREEZE GUN =====
    // Once Shreya has talked, the dining hall has one more thing in it.
    setupFrostEncounter() {
        if (this.frostDefeated || !this.shreyaConfronted) return false;
        this.frostStage = 'clearing';
        this.frost.active = false;
        const fb = this.getRoomData().floorBounds;
        this.enemies = [];
        for (let i = 0; i < 4; i++) {
            for (let tries = 0; tries < 40; tries++) {
                const x = fb.x + 50 + Math.random() * (fb.w - 100);
                const y = fb.y + 50 + Math.random() * (fb.h - 100);
                if (Math.hypot(x - this.player.x, y - this.player.y) < 150) continue;
                const e = Math.random() < 0.5 ? this.makeSwarmCharger(x, y)
                                              : this.makeSwarmThrower(x, y);
                if (this.enemyBlocked(e, e.x, e.y)) continue;
                this.enemies.push(e);
                break;
            }
        }
        this.hallwayNotice = 'SOMEONE IS ALREADY IN HERE.';
        this.hallwayNoticeTime = 2.4;
        return true;
    },

    spawnFrost() {
        const f = this.frost;
        f.active = true;
        // find him clear floor — the middle of the room is a table
        f.x = 480; f.y = 380;
        if (this.enemyBlocked(f, f.x, f.y)) {
            const fb = this.getRoomData().floorBounds;
            outer:
            for (let y = fb.y + 30; y < fb.y + fb.h - 30; y += 12) {
                for (let x = fb.x + 40; x < fb.x + fb.w - 40; x += 12) {
                    if (!this.enemyBlocked(f, x, y)) { f.x = x; f.y = y; break outer; }
                }
            }
        }
        f.hp = f.maxHp;
        f.state = 'arriving';
        f.stateTimer = 1.8;
        f.hitFlash = 0;
        this.frostStage = 'boss';
        this.frostBannerTime = 3.0;
        this.screenShake = 0.7;
        this.hallwayNotice = 'HE COMES THROUGH THE SERVERY. THE AIR GOES COLD.';
        this.hallwayNoticeTime = 3.0;
    },

    updateFrost(dt) {
        const f = this.frost;
        if (this.frostBannerTime > 0) this.frostBannerTime -= dt;

        // the enemies first, then him
        if (this.frostStage === 'clearing' && this.currentRoom === 'dining') {
            if (this.enemies.length > 0 && this.enemies.every(e => e.dead)) this.spawnFrost();
        }
        if (!f.active || this.currentRoom !== 'dining') return;
        if (f.hitFlash > 0) f.hitFlash -= dt;

        const p = this.player;
        f.stateTimer -= dt;

        if (f.state === 'arriving') {
            if (f.stateTimer <= 0) { f.state = 'idle'; f.stateTimer = 1.0; }
            return;
        }

        const dx = p.x - f.x, dy = p.y - f.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (f.state === 'idle') {
            // He holds his range, but circles while he does it — standing still
            // makes him look broken.
            const want = 260;
            const gap = dist - want;
            const push = Math.max(-1, Math.min(1, gap / 90));   // ease near his range
            const ux = dx / dist, uy = dy / dist;
            if (f.strafe === undefined || f.strafeTimer === undefined) {
                f.strafe = Math.random() < 0.5 ? 1 : -1;
                f.strafeTimer = 1.5;
            }
            f.strafeTimer -= dt;
            if (f.strafeTimer <= 0) { f.strafe *= -1; f.strafeTimer = 1.4 + Math.random(); }
            const mx = (ux * push * 70 + -uy * f.strafe * 58) * dt;
            const my = (uy * push * 70 +  ux * f.strafe * 58) * dt;
            this.moveFrost(mx, my);
            if (f.stateTimer <= 0) { f.state = 'aiming'; f.stateTimer = 0.7; }
            return;
        }

        if (f.state === 'aiming') {
            if (f.stateTimer <= 0) {
                f.state = 'blast';
                f.stateTimer = 0;
                // a shotgun spread of five
                const base = Math.atan2(p.y - f.y, p.x - f.x);
                for (let k = -2; k <= 2; k++) {
                    this.enemyProjectiles.push({
                        x: f.x, y: f.y, angle: base + k * 0.13, speed: 430,
                        rotation: base + k * 0.13, life: 1.4, isFreeze: true
                    });
                }
                this.screenShake = Math.max(this.screenShake, 0.3);
            }
            return;
        }

        if (f.state === 'blast') {
            f.state = 'idle';
            f.stateTimer = 1.6 + Math.random() * 0.8;
        }
    },

    moveFrost(mx, my) {
        const f = this.frost;
        const fb = this.getRoomData().floorBounds;
        const nx = Math.max(fb.x + 24, Math.min(fb.x + fb.w - 24, f.x + mx));
        const ny = Math.max(fb.y + 24, Math.min(fb.y + fb.h - 24, f.y + my));
        let moved = false;
        if (!this.enemyBlocked(f, nx, f.y)) { f.x = nx; moved = true; }
        if (!this.enemyBlocked(f, f.x, ny)) { f.y = ny; moved = true; }
        // wedged against furniture — slide along it instead of standing still
        if (!moved) {
            for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const tx = f.x + sx * 3, ty = f.y + sy * 3;
                if (!this.enemyBlocked(f, tx, ty)) { f.x = tx; f.y = ty; break; }
            }
        }
    },

    hitFrost(damage) {
        const f = this.frost;
        if (!f.active) return false;
        f.hp -= damage;
        f.hitFlash = 0.2;
        this.spawnBloodBurst(f.x, f.y, 6);
        if (f.hp <= 0) this.killFrost();
        return true;
    },

    killFrost() {
        const f = this.frost;
        f.active = false;
        this.frostDefeated = true;
        this.frostStage = 'done';
        this.screenShake = 0.9;
        this.spawnBloodBurst(f.x, f.y, 26);
        this.addBloodPool(f.x, f.y + 12, true);
        this.items.push({
            id: 'freezegun', name: 'FREEZE GUN',
            x: f.x, y: f.y + 16,
            pickupRadius: 44, pickedUp: false, spawnTime: this.time
        });
        this.hallwayNotice = 'HE DROPS IT. THE BARREL IS STILL FROSTED OVER.';
        this.hallwayNoticeTime = 3.6;
        this.autosave();
    },

    // ===== BEING FROZEN =====
    freezePlayer() {
        if (this.godMode) return;
        const fz = this.player.frozen;
        if (fz.active) return;
        fz.active = true;
        fz.progress = 0;
        fz.timer = 0;
        this.screenShake = 0.4;
        this.hitEffects.push({
            x: this.player.x, y: this.player.y - 46,
            text: 'FROZEN', life: 1.4, color: '#9fe8ff'
        });
    },

    updateFrozen(dt) {
        const fz = this.player.frozen;
        if (!fz.active) return;
        fz.timer += dt;

        // mash any direction to break out
        if (keysPressed['w'] || keysPressed['a'] || keysPressed['s'] || keysPressed['d'] ||
            keysPressed['arrowup'] || keysPressed['arrowleft'] ||
            keysPressed['arrowdown'] || keysPressed['arrowright']) {
            fz.progress += 1;
            this.hitEffects.push({
                x: this.player.x + (Math.random() - 0.5) * 30,
                y: this.player.y - 20, text: '*', life: 0.3, color: '#cdefff'
            });
        }
        // it creeps back if you stop
        fz.progress = Math.max(0, fz.progress - dt * 1.5);

        if (fz.progress >= 10 || fz.timer > 6) {
            fz.active = false;
            this.player.iframes = Math.max(this.player.iframes, 0.6);
            this.hitEffects.push({
                x: this.player.x, y: this.player.y - 46,
                text: 'FREE', life: 1.0, color: '#cdefff'
            });
        }
    },

    drawFrozenOverlay(ctx) {
        const fz = this.player.frozen;
        if (!fz.active) return;
        const p = this.player;

        // ice around the player
        ctx.fillStyle = 'rgba(150, 220, 255, 0.35)';
        ctx.fillRect(p.x - p.w / 2 - 6, p.y - p.h / 2 - 6, p.w + 12, p.h + 12);
        ctx.strokeStyle = 'rgba(220, 245, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - p.w / 2 - 6, p.y - p.h / 2 - 6, p.w + 12, p.h + 12);

        // a cold wash over the screen
        ctx.fillStyle = 'rgba(120, 190, 240, 0.16)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // the struggle bar
        const bw = 200, bx = canvas.width / 2 - bw / 2, by = canvas.height - 130;
        ctx.fillStyle = 'rgba(10, 20, 30, 0.85)';
        ctx.fillRect(bx - 3, by - 3, bw + 6, 20);
        ctx.fillStyle = '#9fe8ff';
        ctx.fillRect(bx, by, bw * Math.min(1, fz.progress / 10), 14);
        ctx.fillStyle = '#eaf8ff';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MASH W A S D', canvas.width / 2, by - 10);
        ctx.textAlign = 'left';
    },

    drawFrost(ctx) {
        const f = this.frost;
        if (!f.active || this.currentRoom !== 'dining') return;
        const flash = f.hitFlash > 0;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(f.x, f.y + f.h / 2, 17, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // heavy coat, rimed white
        ctx.fillStyle = flash ? '#ffdddd' : '#2b3a44';
        ctx.fillRect(f.x - 15, f.y - 14, 30, 36);
        ctx.fillStyle = flash ? '#ffcccc' : '#43606e';
        ctx.fillRect(f.x - 15, f.y - 14, 30, 7);
        ctx.fillStyle = '#1c2830';
        ctx.fillRect(f.x - 10, f.y + 22, 9, 16);
        ctx.fillRect(f.x + 2, f.y + 22, 9, 16);
        // the gun, held across
        ctx.fillStyle = '#5a6a74';
        ctx.fillRect(f.x + 6, f.y - 6, 26, 6);
        ctx.fillStyle = '#9fe8ff';
        ctx.fillRect(f.x + 30, f.y - 6, 5, 6);
        // head and goggles
        ctx.fillStyle = flash ? '#ffdede' : '#b8926e';
        ctx.fillRect(f.x - 9, f.y - 26, 18, 13);
        ctx.fillStyle = '#9fe8ff';
        ctx.fillRect(f.x - 8, f.y - 22, 16, 4);

        // the cold coming off him while he lines up
        if (f.state === 'aiming') {
            const a = 0.3 + Math.sin(this.time * 18) * 0.2;
            ctx.fillStyle = `rgba(160, 230, 255, ${a})`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, 30, 0, Math.PI * 2);
            ctx.fill();
        }

        // health
        const bw = 70;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(f.x - bw / 2 - 1, f.y - 44, bw + 2, 7);
        ctx.fillStyle = '#9fe8ff';
        ctx.fillRect(f.x - bw / 2, f.y - 43, bw * Math.max(0, f.hp / f.maxHp), 5);
    },

    drawFrostBanner(ctx) {
        if (!this.frostBannerTime || this.frostBannerTime <= 0) return;
        const a = Math.min(1, this.frostBannerTime, (3.0 - this.frostBannerTime) * 3);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * a})`;
        ctx.fillRect(0, 88, canvas.width, 56);
        ctx.fillStyle = `rgba(159, 232, 255, ${a})`;
        ctx.font = 'bold 27px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.fillText('THE COLD MAN', canvas.width / 2, 124);
        ctx.textAlign = 'left';
    },

    // ===== FLOOR 3: THE GAMES ROOM =====
    // The one quiet room on this floor. Supplies, and something to read.
    setupGamesRoom() {
        if (!this.gamesNoteRead && !this.items.some(i => i.id === 'gamesNote')) {
            this.items.push({
                id: 'gamesNote', name: 'NOTE', x: 480, y: 250,
                pickupRadius: 40, pickedUp: false, spawnTime: this.time
            });
        }
    },

    // ===== FLOOR 4 AFTER RAYMOND =====
    // He leaves the building stirred up. Every floor 4 room is occupied from
    // then on, and it refills each time you walk back in.
    floor4Swarming() {
        return !!this.raymondScene.done;
    },

    makeSwarmCharger(x, y) {
        return {
            x: x, y: y, w: 28, h: 38, speed: 74,
            hp: 3, maxHp: 3, hitFlash: 0, damageTouchCooldown: 0,
            facing: 'down', dead: false, deathAnim: 0, distracted: 0
        };
    },

    makeSwarmThrower(x, y) {
        return {
            x: x, y: y, w: 28, h: 38, speed: 95,
            hp: 2, maxHp: 2, hitFlash: 0, damageTouchCooldown: 0,
            facing: 'down', dead: false, deathAnim: 0, distracted: 0,
            ranged: true, throwCooldown: 1.6 + Math.random(), preferredDist: 240
        };
    },

    // Called on entering a floor 4 room. Adds to whatever is already there.
    addSwarm(room) {
        if (!this.floor4Swarming()) return;
        const fb = this.getRoomData().floorBounds;
        const spot = () => ({
            x: fb.x + 60 + Math.random() * (fb.w - 120),
            y: fb.y + 60 + Math.random() * (fb.h - 120)
        });
        // keep them off the player's back as they walk in
        const clearOf = (p) => Math.hypot(p.x - this.player.x, p.y - this.player.y) > 190;

        const plan = {
            room1:   { charger: 2, thrower: 1, shy: 0 },
            hallway: { charger: 2, thrower: 1, shy: 0 },
            a02:     { charger: 1, thrower: 2, shy: 0 },
            lobby:   { charger: 3, thrower: 1, shy: 0 },
            kitchen: { charger: 1, thrower: 0, shy: 2 },
            lounge:  { charger: 2, thrower: 1, shy: 0 }
        }[room];
        if (!plan) return;

        const place = (make) => {
            for (let tries = 0; tries < 30; tries++) {
                const p = spot();
                if (!clearOf(p)) continue;
                const e = make(p.x, p.y);
                if (this.enemyBlocked(e, e.x, e.y)) continue;
                this.enemies.push(e);
                return;
            }
        };
        for (let i = 0; i < plan.charger; i++) place((x, y) => this.makeSwarmCharger(x, y));
        for (let i = 0; i < plan.thrower; i++) place((x, y) => this.makeSwarmThrower(x, y));
        for (let i = 0; i < plan.shy; i++) place((x, y) => this.makeShyEnemy(x, y));

        if (this.enemies.length > 0) {
            this.hallwayNotice = 'THEY ARE EVERYWHERE NOW.';
            this.hallwayNoticeTime = 1.8;
            this.screenShake = Math.max(this.screenShake, 0.3);
        }
    },

    // ===== FLOOR 3 =====

    clearRoomState() {
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.drawers = [];
        this.items = [];
        this.bloodStains = [];
        this.bloodPools = [];
        this.gibs = [];
        this.enemies = [];
        this.dummy.hp = 0;
        this.dummy.respawnTimer = 999;
    },

    // Down the stairs at the back of the floor 4 lobby
    switchToF3Hallway(fromAbove) {
        this.currentRoom = 'f3hallway';
        // the stairs are at the near end of the corridor now — the doors are cells
        this.player.x = fromAbove ? 90 : 880;
        this.player.y = 450;
        this.player.facing = fromAbove ? 'right' : 'left';
        this.clearRoomState();
        this.setupF3Hallway();
        this.rebuildWalls();
        this.hallwayNotice = fromAbove ? 'FLOOR 3.' : 'FLOOR 3 — HALLWAY.';
        this.hallwayNoticeTime = 1.5;
    },

    // Floor 3's chargers, and the key they drop for A-02
    setupF3Hallway() {
        if (!this.f3HallwayCleared) {
            this.spawnHallwayEnemies();
            return;
        }
        this.enemies = [];
        if (this.f3KeySpawned && !this.hasF3Key) {
            this.items.push({
                id: 'f3key', name: 'KEY', x: 480, y: 450,
                pickupRadius: 40, pickedUp: false,
                spawnTime: this.time, isRecovered: true
            });
        }
    },

    switchToF3A02() {
        this.currentRoom = 'f3a02';
        this.player.x = 480;
        this.player.y = 560;
        this.player.facing = 'up';
        this.clearRoomState();
        if (!this.f3A02Cleared) this.spawnA02Enemies();
        this.rebuildWalls();
        this.hallwayNotice = 'FLOOR 3 — A-02.';
        this.hallwayNoticeTime = 1.5;
    },

    switchToF3Lobby() {
        this.currentRoom = 'f3lobby';
        this.player.x = 90;
        this.player.y = 450;
        this.player.facing = 'right';
        this.clearRoomState();
        this.rebuildWalls();
        this.hallwayNotice = 'FLOOR 3 — LOBBY.';
        this.hallwayNoticeTime = 1.5;
        this.placeRaymondBehind();
        if (this.raymondJoined && !this.finale.done && !this.armadaFinal.active) {
            this.startArmadaFinal();
        }
    },

    switchToDining() {
        this.currentRoom = 'dining';
        const d = this.dining.topDoor;
        this.player.x = d.x + d.w / 2;
        this.player.y = d.y + d.h + 28;
        this.player.facing = 'down';
        this.clearRoomState();
        this.rebuildWalls();
        this.hallwayNotice = 'THE DINING HALL.';
        this.hallwayNoticeTime = 1.5;
        this.diningGap = 0;
        if (this.shreyaConfronted && !this.frostDefeated) this.setupFrostEncounter();
        else this.setupDiningAmbush();
    },

    // Raymond walks with you once he has joined, but he is not a companion —
    // he keeps his distance and does nothing until Armada is on one knee.
    placeRaymondBehind() {
        if (!this.raymondJoined || this.finale.done) return;
        const r = this.raymond;
        r.x = this.player.x - 60;
        r.y = this.player.y + 40;
    },

    // He keeps a few steps back, wherever you go, until the last fight starts.
    updateRaymondFollowing(dt) {
        if (!this.raymondJoined || this.finale.done) return;
        if (this.armadaFinal.active || this.finale.active) return;
        const r = this.raymond;
        const tx = this.player.x - 62, ty = this.player.y + 42;
        const dx = tx - r.x, dy = ty - r.y;
        const d = Math.hypot(dx, dy);
        if (d > 300) { r.x = tx; r.y = ty; return; }   // caught in a doorway
        if (d > 26) {
            const sp = Math.min(170, 60 + d * 1.6) * dt;
            r.x += (dx / d) * sp;
            r.y += (dy / d) * sp;
        }
    },

    switchToGames() {
        this.currentRoom = 'games';
        this.player.x = 460;
        this.player.y = 505;
        this.player.facing = 'up';
        this.clearRoomState();
        this.rebuildWalls();
        this.hallwayNotice = 'THE GAMES ROOM.';
        this.hallwayNoticeTime = 1.5;
        this.placeRaymondBehind();
        if (this.hasFreezeGun && !this.raymondDefeated && !this.raymond.active) {
            this.spawnRaymondRematch();
        }
        this.setupGamesRoom();
    },

    // Back up to floor 4, arriving at the stairs
    switchToF4Lobby() {
        this.currentRoom = 'lobby';
        this.player.x = 870;
        this.player.y = 450;
        this.player.facing = 'left';
        this.clearRoomState();
        this.rebuildWalls();
        this.hallwayNotice = 'BACK ON FLOOR 4.';
        this.hallwayNoticeTime = 1.5;
    },

    // ===== RAYMOND =====

    spawnRaymond() {
        const r = this.raymond;
        r.active = true;
        r.x = 478; r.y = 205;
        r.state = 'arriving';
        r.stateTimer = 2.4;
        r.hitFlash = 0; r.staggered = 0; r.trail = [];
        r.dominance = 15;
        r.tauntsLeft = 3;
        this.shreya.present = true;
        this.shreya.x = 545; this.shreya.y = 205;
        this.raymondBannerTime = 3.2;
        this.screenShake = 0.7;
    },

    // He closes the distance instantly — the same dash you have, without a limit.
    raymondDashTo(tx, ty) {
        const r = this.raymond;
        r.trail = [];
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
            r.trail.push({
                x: r.x + (tx - r.x) * (i / steps),
                y: r.y + (ty - r.y) * (i / steps),
                life: 0.35
            });
        }
        r.x = tx; r.y = ty;
        this.screenShake = Math.max(this.screenShake, 0.25);
    },

    // Damage from Raymond never kills you — it takes you to your last bar and
    // the scene takes over from there.
    raymondHurtsPlayer(amount) {
        if (this.godMode) return;
        const p = this.player;
        if (p.iframes > 0 || this.raymondScene.active) return;
        // the roof fight is scripted and never kills you; the rematch is not
        if (this.raymond.mode === 'rematch') {
            this.damagePlayer(amount);
            return;
        }
        p.hp = Math.max(1, p.hp - amount);
        p.iframes = 0.9;
        this.screenShake = Math.max(this.screenShake, 0.4);
        this.spawnBloodBurst(p.x, p.y, 8);
        if (p.hp <= 1) this.startRaymondScene();
    },

    updateRaymond(dt) {
        const r = this.raymond;
        for (let i = r.trail.length - 1; i >= 0; i--) {
            r.trail[i].life -= dt;
            if (r.trail[i].life <= 0) r.trail.splice(i, 1);
        }
        if (this.raymondBannerTime > 0) this.raymondBannerTime -= dt;
        const arena = r.mode === 'rematch' ? 'games' : 'roof';
        if (!r.active || this.currentRoom !== arena) return;
        if (r.hitFlash > 0) r.hitFlash -= dt;

        if (this.endScene.active) return;   // the ending drives him now

        // iced: he does nothing at all
        if (r.frozen > 0) {
            r.frozen -= dt;
            if (r.frozen <= 0) {
                r.frozen = 0;
                this.hitEffects.push({
                    x: r.x, y: r.y - 46, text: 'HE BREAKS OUT', life: 1.0, color: '#9fe8ff'
                });
            }
            return;
        }
        if (r.staggered > 0) r.staggered -= dt;
        if (this.raymondScene.active) return;   // the scene drives him instead

        const p = this.player;
        r.stateTimer -= dt;

        if (r.state === 'arriving') {
            if (r.stateTimer <= 0) { r.state = 'idle'; r.stateTimer = 0.8; }
            return;
        }

        const dist = Math.hypot(p.x - r.x, p.y - r.y);

        // ---- the first fifteen seconds: he doesn't touch you ----
        if (r.dominance > 0) {
            const before = r.dominance;
            r.dominance -= dt;
            if (before > 11 && r.dominance <= 11 && r.tauntsLeft === 3) {
                r.tauntsLeft = 2;
                this.sceneLine("He isn't attacking.", 3.0);
            } else if (before > 6 && r.dominance <= 6 && r.tauntsLeft === 2) {
                r.tauntsLeft = 1;
                this.sceneLine("He's showing you that he doesn't have to.", 3.2);
            } else if (r.dominance <= 0 && r.tauntsLeft === 1) {
                r.tauntsLeft = 0;
                this.sceneLine("Then he stops playing.", 2.6);
                this.screenShake = 0.6;
            }

            if (r.state === 'idle' && r.stateTimer <= 0) {
                r.state = 'circle';
                r.stateTimer = 0.25;
            } else if (r.state === 'circle' && r.stateTimer <= 0) {
                // appears somewhere else around you, close enough to feel it
                const ang = Math.random() * Math.PI * 2;
                const reach = 64 + Math.random() * 46;
                this.raymondDashTo(p.x + Math.cos(ang) * reach, p.y + Math.sin(ang) * reach);
                r.state = 'idle';
                r.stateTimer = 0.55 + Math.random() * 0.5;
            }
            return;
        }

        if (r.state === 'circle') { r.state = 'idle'; r.stateTimer = 0.3; return; }

        if (r.state === 'idle') {
            if (r.stateTimer > 0) return;
            // Close in, he uses the sword — but he breaks off often enough that
            // the fight doesn't settle into one move.
            if (dist < 120) {
                if (Math.random() < 0.35) { r.state = 'backoff'; r.stateTimer = 0.3; }
                else { r.state = 'sword'; r.stateTimer = 0.5; }
            } else if (Math.random() < 0.45) {
                r.state = 'blink'; r.stateTimer = 0.35;
            } else {
                r.state = 'gun'; r.stateTimer = 0.4; r.shotsLeft = 3; r.shotTimer = 0;
            }
            return;
        }

        if (r.state === 'backoff') {
            if (r.stateTimer <= 0) {
                // steps back across the roof, then opens up with the pistol
                const fb = this.roof.floorBounds;
                const ang = Math.random() * Math.PI * 2;
                const reach = 230 + Math.random() * 80;
                const tx = Math.max(fb.x + 30, Math.min(fb.x + fb.w - 30, p.x + Math.cos(ang) * reach));
                const ty = Math.max(fb.y + 30, Math.min(fb.y + fb.h - 30, p.y + Math.sin(ang) * reach));
                this.raymondDashTo(tx, ty);
                r.state = 'gun';
                r.stateTimer = 0.45;
                r.shotsLeft = 3;
                r.shotTimer = 0;
            }
            return;
        }

        if (r.state === 'blink') {
            if (r.stateTimer <= 0) {
                const ang = Math.random() * Math.PI * 2;
                this.raymondDashTo(p.x + Math.cos(ang) * 70, p.y + Math.sin(ang) * 70);
                r.state = 'sword';
                r.stateTimer = 0.45;
            }
            return;
        }

        if (r.state === 'sword') {
            if (r.stateTimer <= 0) {
                if (Math.hypot(p.x - r.x, p.y - r.y) < 95) this.raymondHurtsPlayer(1);
                r.state = 'idle';
                r.stateTimer = 0.9 + Math.random() * 0.6;
            }
            return;
        }

        if (r.state === 'gun') {
            r.shotTimer -= dt;
            if (r.stateTimer <= 0 && r.shotsLeft > 0 && r.shotTimer <= 0) {
                const ang = Math.atan2(p.y - r.y, p.x - r.x);
                this.enemyProjectiles.push({
                    x: r.x, y: r.y, angle: ang, speed: 520, rotation: ang,
                    life: 2.0, fromRaymond: true
                });
                r.shotsLeft -= 1;
                r.shotTimer = 0.28;
                if (r.shotsLeft <= 0) { r.state = 'idle'; r.stateTimer = 1.1; }
            }
        }
    },

    // ===== THE SCRIPTED DEFEAT =====

    startRaymondScene() {
        if (this.raymondScene.active || this.raymondScene.done) return;
        this.raymondScene = { active: true, step: 0, timer: 0, done: false };
        this.enemyProjectiles = [];
        this.projectiles = [];
        this.screenShake = 0.8;
    },

    sceneLine(text, time) {
        this.cutsceneLine = text;
        this.cutsceneLineTime = time || 3.0;
    },

    updateRaymondScene(dt) {
        const sc = this.raymondScene;
        if (this.cutsceneLineTime <= 0) this.cutsceneLine = '';
        if (this.cutsceneLineTime > 0) this.cutsceneLineTime -= dt;
        for (let i = this.lightning.length - 1; i >= 0; i--) {
            this.lightning[i].life -= dt;
            if (this.lightning[i].life <= 0) this.lightning.splice(i, 1);
        }
        if (!sc.active) return;

        // you're on the floor for all of this
        this.player.stunTimer = 0.3;
        sc.timer -= dt;
        if (sc.timer > 0) return;

        const r = this.raymond;
        const g = this.followers.guard;
        sc.step += 1;

        switch (sc.step) {
            case 1:
                this.sceneLine("Your legs go. The blade drops out of your hand.", 3.0);
                this.raymondDashTo(this.player.x + 70, this.player.y - 30);
                sc.timer = 2.6;
                break;
            case 2:
                this.sceneLine("GUARD: \"HEY. OVER HERE.\"", 2.2);
                g.room = 'roof';
                g.x = this.player.x - 120;
                g.y = this.player.y + 10;
                sc.timer = 2.0;
                break;
            case 3:
                // the shot lands
                this.guardShots.push({ x1: g.x, y1: g.y - 2, x2: r.x, y2: r.y, life: 0.25 });
                r.hitFlash = 0.6;
                r.staggered = 1.6;
                this.spawnBloodBurst(r.x, r.y, 14);
                this.addBloodStain(r.x, r.y + 20, true);
                this.screenShake = 0.6;
                this.sceneLine("The shot goes through him. He actually staggers.", 2.4);
                sc.timer = 2.2;
                break;
            case 4:
                this.raymondDashTo(g.x + 46, g.y - 10);
                this.sceneLine("Then he is simply standing next to the guard.", 1.8);
                sc.timer = 1.6;
                break;
            case 5: {
                // the sword
                this.guardDead = true;
                this.companionsRecruited.guard = false;
                this.screenShake = 1.0;
                const gx = g.x, gy = g.y;
                this.addBloodPool(gx, gy + 16, true);
                this.addBloodPool(gx + 24, gy + 22, true);
                this.spawnBloodBurst(gx, gy, 40);
                this.gibs.push({ type: 'head', x: gx - 70, y: gy + 26, rot: 1.2 });
                for (let k = 0; k < 8; k++) {
                    this.addBloodStain(gx - k * 9, gy + 18 + (Math.random() - 0.5) * 12, true);
                }
                this.guardBody = { x: gx, y: gy };
                this.sceneLine("", 0.1);
                sc.timer = 2.0;
                break;
            }
            case 6:
                this.sceneLine("GUARD: \"...take it. Pistol. Card gets you down to the third floor.\"", 4.0);
                this.hasPistol = true;
                this.hasKeycard2 = true;
                this.inventory.push({ id: 'pistol', name: 'PISTOL', qty: 1 });
                this.weaponDurability.pistol = WEAPON_STATS.pistol.durabilityMax;
                this.pistolReserve = 7;
                this.inventory.push({ id: 'keycard2', name: 'KEYCARD', qty: 1 });
                this.pickupNotice = 'RECEIVED: PISTOL & FLOOR 3 KEYCARD';
                this.pickupNoticeTime = 2.4;
                sc.timer = 4.0;
                break;
            case 7: {
                // Shreya
                this.shreya.freed = true;
                for (let k = 0; k < 3; k++) {
                    this.lightning.push({
                        x1: this.shreya.x, y1: this.shreya.y - 10,
                        x2: r.x, y2: r.y, life: 0.9, seed: Math.random() * 100
                    });
                }
                r.hitFlash = 0.9;
                r.staggered = 2.5;
                this.screenShake = 1.0;
                this.sceneLine("Shreya's hands come up and the air cracks white.", 3.0);
                sc.timer = 2.8;
                break;
            }
            case 8:
                this.raymondDashTo(478, 190);
                this.sceneLine("RAYMOND: \"...that's new.\"", 2.4);
                sc.timer = 2.2;
                break;
            case 9:
                r.active = false;
                this.sceneLine("He is gone before anyone can move.", 3.0);
                this.screenShake = 0.5;
                sc.timer = 2.6;
                break;
            default:
                sc.active = false;
                sc.done = true;
                this.player.stunTimer = 0;
                this.player.hp = Math.max(1, this.player.hp);
                // she isn't staying up here on her own
                this.companionsRecruited.shreya = true;
                this.shreya.present = false;      // she's a follower now
                this.followers.shreya.tazeTimer = 15;
                this.placeCompanion('shreya', this.shreya.x, this.shreya.y);
                this.hallwayNotice = 'HE IS GONE. THE GUARD IS NOT. SHREYA COMES WITH YOU.';
                this.hallwayNoticeTime = 3.0;
                this.autosave();
                break;
        }
    },

    drawCrawler(ctx, e) {
        const px = Math.round(e.x), py = Math.round(e.y);
        const split = e.phase === 'split';
        const flash = e.hitFlash > 0;

        if (e.dead) {
            ctx.fillStyle = 'rgba(40, 60, 30, 0.55)';
            ctx.beginPath();
            ctx.ellipse(px, py + 6, 26, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4d5c3f';
            ctx.fillRect(px - 16, py - 4, 32, 12);
            return;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(px, py + e.h / 2 - 2, split ? 18 : 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        const skin = flash ? '#eaffea' : (split ? '#6d7a58' : '#7d8a66');
        const dark = flash ? '#cfe6cf' : '#55603f';

        if (!split) {
            // legs
            ctx.fillStyle = dark;
            ctx.fillRect(px - 12, py + 8, 9, 16);
            ctx.fillRect(px + 3, py + 8, 9, 16);
        } else {
            // dragging what's left of itself
            ctx.fillStyle = dark;
            ctx.fillRect(px - 20, py + 6, 40, 7);
            ctx.fillStyle = '#7a1f1f';
            ctx.fillRect(px - 16, py + 4, 32, 5);   // the open waist
        }

        // swollen torso
        ctx.fillStyle = skin;
        ctx.fillRect(px - 16, py - 14, 32, split ? 20 : 24);
        ctx.fillStyle = dark;
        for (let k = 0; k < 3; k++) ctx.fillRect(px - 13, py - 10 + k * 6, 26, 2);

        // arms hauling it forward
        ctx.fillStyle = skin;
        ctx.fillRect(px - 24, py - 10, 8, split ? 20 : 16);
        ctx.fillRect(px + 16, py - 10, 8, split ? 20 : 16);

        // head
        ctx.fillStyle = skin;
        ctx.fillRect(px - 9, py - 27, 18, 14);
        ctx.fillStyle = '#2a1a1a';
        ctx.fillRect(px - 6, py - 17, 12, 4);       // the mouth
        ctx.fillStyle = flash ? '#ffffff'
            : `rgba(180, 255, 150, ${0.7 + Math.sin(this.time * 7) * 0.3})`;
        ctx.fillRect(px - 6, py - 23, 4, 3);
        ctx.fillRect(px + 2, py - 23, 4, 3);

        // health pips
        for (let k = 0; k < e.maxHp; k++) {
            const bx = px - (e.maxHp * 5) + k * 10;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(bx - 1, py - 38, 9, 6);
            ctx.fillStyle = k < e.hp ? '#8fbf5f' : '#2a331f';
            ctx.fillRect(bx, py - 37, 7, 4);
        }
    },

    // ===== THE THING IN CELL 3 =====
    // Bigger than the rest. Kill it and it comes apart at the waist — and the
    // top half keeps coming, spitting.
    makeCrawler(x, y) {
        return {
            x: x, y: y, w: 38, h: 48,
            hp: 5, maxHp: 5,
            speed: 44,              // heavy and slow — you can back away from it
            kind: 'crawler', phase: 'whole',
            hitFlash: 0, damageTouchCooldown: 0,
            spitCooldown: 2.2,
            facing: 'down', dead: false, deathAnim: 0, distracted: 0, stunTimer: 0
        };
    },

    setupCell3Encounter() {
        if (this.crawlerDead || this.crawlerSpawned) return;
        this.crawlerSpawned = true;
        this.enemies = [this.makeCrawler(500, 300)];   // clear of the furniture
        this.screenShake = 0.5;
        // she notices before you do
        this.sideQuestNotice = this.companionsRecruited.shreya
            ? 'SHREYA: "There\'s no body in this one."'
            : 'Every other cell had a body in it. This one does not.';
        this.sideQuestNoticeTime = 3.0;
        this.hallwayNotice = 'SOMETHING IS STILL IN HERE.';
        this.hallwayNoticeTime = 1.8;
    },

    updateCrawlers(dt) {
        for (const e of this.enemies) {
            if (e.kind !== 'crawler') continue;
            if (e.hitFlash > 0) e.hitFlash -= dt;
            if (e.damageTouchCooldown > 0) e.damageTouchCooldown -= dt;
            if (e.dead) { e.deathAnim += dt; continue; }
            if (e.stunTimer > 0) { e.stunTimer -= dt; continue; }

            const tgt = this.aggroTarget(e);
            const dx = tgt.x - e.x, dy = tgt.y - e.y;
            const dist = Math.hypot(dx, dy) || 1;
            this.moveEnemy(e, (dx / dist) * e.speed * dt, (dy / dist) * e.speed * dt);
            e.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left')
                                                   : (dy > 0 ? 'down' : 'up');

            if (e.phase === 'whole') {
                // it just walks into you
                const p = this.player;
                if (e.damageTouchCooldown <= 0 &&
                    p.x + p.w / 2 > e.x - e.w / 2 && p.x - p.w / 2 < e.x + e.w / 2 &&
                    p.y + p.h / 2 > e.y - e.h / 2 && p.y - p.h / 2 < e.y + e.h / 2) {
                    this.damagePlayer(1);
                    e.damageTouchCooldown = 1.4;
                }
            } else {
                // dragging itself along, spitting
                e.spitCooldown -= dt;
                if (e.spitCooldown <= 0 && dist < 420) {
                    e.spitCooldown = 2.6 + Math.random();
                    const ang = Math.atan2(dy, dx);
                    this.enemyProjectiles.push({
                        x: e.x, y: e.y - 6, angle: ang, speed: 230,
                        rotation: ang, life: 2.4, isVenom: true
                    });
                }
            }
        }
    },

    // Cutting it in half doesn't stop it
    splitCrawler(e) {
        e.phase = 'split';
        e.hp = 3;
        e.maxHp = 3;
        e.w = 34; e.h = 30;
        e.speed = 26;           // dragging itself — slower still
        e.spitCooldown = 1.0;
        this.addBloodPool(e.x, e.y + 14, true);
        this.spawnBloodBurst(e.x, e.y, 26);
        this.gibs.push({ type: 'leg', x: e.x - 26, y: e.y + 22, rot: Math.random() * 6 });
        this.gibs.push({ type: 'leg', x: e.x + 24, y: e.y + 18, rot: Math.random() * 6 });
        this.screenShake = Math.max(this.screenShake, 0.6);
        this.hitEffects.push({
            x: e.x, y: e.y - 46, text: 'IT IS STILL MOVING', life: 2.2, color: '#9fdd88'
        });
    },

    // Venom sits in you until someone treats it
    poisonPlayer() {
        if (this.godMode) return;
        if (this.player.poison > 0) return;
        this.player.poison = 1;
        this.player.poisonTick = 3.0;
        this.hitEffects.push({
            x: this.player.x, y: this.player.y - 44,
            text: 'POISONED', life: 1.8, color: '#9fdd88'
        });
    },

    updatePoison(dt) {
        if (!this.player.poison || this.isDead) return;
        this.player.poisonTick -= dt;
        if (this.player.poisonTick > 0) return;
        this.player.poisonTick = 3.0;
        this.player.hp = Math.max(0.5, this.player.hp - 0.5);
        this.spawnBloodBurst(this.player.x, this.player.y, 3);
        this.hitEffects.push({
            x: this.player.x, y: this.player.y - 36, text: '-½', life: 0.9, color: '#9fdd88'
        });
    },

    // ===== ANOMALIES AS ORDINARY ENEMIES (the roof waves) =====
    // Same fight as the one in Room 1: a telegraphed charge, stunned on a wall,
    // three hits while it's down. Room 1's keeps its own scripted version.
    makeAnomalyEnemy(x, y) {
        return {
            x: x, y: y, w: 30, h: 34,
            hp: 3, maxHp: 3,
            kind: 'anomaly',
            state: 'idle', stateTimer: 0.8 + Math.random() * 0.6,
            speed: 300, chargeDX: 0, chargeDY: 0,
            windupTime: 1.0, stunTime: 3.5,
            hitFlash: 0, touchCooldown: 0,
            dead: false, deathAnim: 0, distracted: 0
        };
    },

    updateAnomalyEnemies(dt) {
        for (const e of this.enemies) {
            if (e.kind !== 'anomaly') continue;
            if (e.hitFlash > 0) e.hitFlash -= dt;
            if (e.touchCooldown > 0) e.touchCooldown -= dt;
            if (e.dead) { e.deathAnim += dt; continue; }

            e.stateTimer -= dt;

            if (e.state === 'idle') {
                if (e.stateTimer <= 0) { e.state = 'windup'; e.stateTimer = e.windupTime; }
            } else if (e.state === 'windup') {
                if (e.stateTimer <= 0) {
                    const tgt = this.aggroTarget(e);
                    const dx = tgt.x - e.x, dy = tgt.y - e.y;
                    const len = Math.hypot(dx, dy) || 1;
                    e.chargeDX = dx / len;
                    e.chargeDY = dy / len;
                    e.state = 'charging';
                    e.stateTimer = 4.0;   // long enough to always end on a wall
                }
            } else if (e.state === 'charging') {
                const nx = e.x + e.chargeDX * e.speed * dt;
                const ny = e.y + e.chargeDY * e.speed * dt;
                const fb = this.getRoomData().floorBounds;
                const offFloor = nx < fb.x + 10 || nx > fb.x + fb.w - 10 ||
                                 ny < fb.y + 10 || ny > fb.y + fb.h - 10;
                if (offFloor || this.enemyBlocked(e, nx, ny)) {
                    e.state = 'stunned';
                    e.stateTimer = e.stunTime;
                    this.screenShake = Math.max(this.screenShake, 0.3);
                    this.spawnBloodBurst(e.x, e.y, 4);
                } else {
                    e.x = nx; e.y = ny;
                    const p = this.player;
                    if (e.touchCooldown <= 0 &&
                        p.x + p.w / 2 > e.x - e.w / 2 && p.x - p.w / 2 < e.x + e.w / 2 &&
                        p.y + p.h / 2 > e.y - e.h / 2 && p.y - p.h / 2 < e.y + e.h / 2) {
                        this.damagePlayer(1);
                        e.touchCooldown = 1.2;
                    }
                    if (e.stateTimer <= 0) { e.state = 'recover'; e.stateTimer = 0.8; }
                }
            } else if (e.state === 'stunned' || e.state === 'recover') {
                if (e.stateTimer <= 0) {
                    e.state = e.state === 'stunned' ? 'recover' : 'idle';
                    e.stateTimer = e.state === 'recover' ? 0.8 : 0.6;
                }
            }
        }
    },

    drawAnomalyEnemy(ctx, e) {
        const saveAn = this.anomaly;
        // reuse the Room 1 drawing by pointing it at this one for a moment
        this.anomaly = {
            active: true, x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h,
            state: e.dead ? 'dead' : e.state, stateTimer: e.stateTimer,
            hp: e.hp, maxHp: e.maxHp, hitFlash: e.hitFlash, windupTime: e.windupTime
        };
        const saveRoom = this.currentRoom;
        this.currentRoom = 'room1';
        this.drawAnomaly(ctx);
        this.currentRoom = saveRoom;
        this.anomaly = saveAn;
    },

    // ===== THE GUARD (A-02) =====
    // Hiding behind A-02's locked door until the knife-throwers are dead.
    guardArrives() {
        if (this.guard.present) return;
        const door = this.a02.topDoor;
        this.guard.present = true;
        this.guard.x = door.x + door.w / 2;
        this.guard.y = door.y + door.h + 30;
        this.guard.walking = true;
        this.guardQuest = 'offered';
        this.hallwayNotice = 'THE DOOR OPENS. SOMEONE WAS HIDING IN THERE.';
        this.hallwayNoticeTime = 2.1;
    },

    updateGuard(dt) {
        const g = this.guard;
        if (!g.present || !g.walking || this.currentRoom !== 'a02') return;
        const dx = g.targetX - g.x;
        const dy = g.targetY - g.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 3) {
            g.x = g.targetX;
            g.y = g.targetY;
            g.walking = false;
            return;
        }
        g.x += (dx / d) * 80 * dt;
        g.y += (dy / d) * 80 * dt;
    },

    tryTalkGuard() {
        const g = this.guard;
        if (!g.present || g.walking || this.currentRoom !== 'a02') return false;
        if (this.guardQuest === 'joined') return false;
        if (Math.hypot(this.player.x - g.x, this.player.y - g.y) > 45) return false;

        if (this.guardQuest === 'offered') {
            this.dialogue.active = true;
            this.dialogue.speaker = 'GUARD';
            this.dialogue.lines = [
                "Don't— don't throw that. I'm not one of them.",
                "I was a guard here. Two days behind that door, listening to those things hunt for me.",
                "Something's loose in the ward. Room one — where the big one tore through the wall.",
                "Smaller than him. Fast. It came crawling out of that hole the night he got free.",
                "Put it down and I'm with you. Nobody in this building throws a blade better than me."
            ];
            this.dialogue.line = 0;
            this.dialogue.charIndex = 0;
            this.dialogue.charTimer = 0;
            this.dialogue.onFinish = 'startGuardQuest';
            return true;
        }

        if (this.guardQuest === 'active') {
            this.sideQuestNotice = "GUARD: \"Room one. The hole in the wall. It's still in there.\"";
            this.sideQuestNoticeTime = 2.4;
            return true;
        }

        if (this.guardQuest === 'complete') {
            this.pickupNotice = 'GAVE THE LETTER TO THE GUARD';
            this.pickupNoticeTime = 1.8;
            this.dialogue.active = true;
            this.dialogue.speaker = 'GUARD';
            this.dialogue.lines = [
                "Let me see it. That's... that's my handwriting.",
                "To Marcus. My shift partner. I pushed this under his door the night they took him downstairs.",
                "I told him to hold on. I told him I'd get him out before morning.",
                "That thing in the ward was wearing his boots. That was Marcus.",
                "...Give me a blade. I'm not leaving one more person in this building.",
                "And take this. Master key — roof door, top of this room. I kept mine when they collected everyone else's.",
                "One more thing, and it's why I'm still standing here.",
                "There's a woman up on that roof. Shreya. They pulled her out of the west ward and kept her apart from everyone else.",
                "She's been up there since Tuesday and she's still breathing, which means somebody wants her that way.",
                "Whatever's keeping her alive is up there with her. So we go up together — you, me, and the doctor."
            ];
            this.dialogue.line = 0;
            this.dialogue.charIndex = 0;
            this.dialogue.charTimer = 0;
            this.dialogue.onFinish = 'joinGuard';
            return true;
        }

        return false;
    },

    // He joins you after the letter. His perk comes with him.
    joinGuard() {
        this.guardQuest = 'joined';
        this.hasRoofKey = true;
        this.companionsRecruited.guard = true;
        this.placeCompanion('guard', this.guard.x, this.guard.y);
        this.hallwayNotice = 'THE GUARD JOINS YOU.';
        this.hallwayNoticeTime = 2.4;
    },

    startGuardQuest() {
        this.guardQuest = 'active';
        this.hallwayNotice = 'KILL THE THING IN THE WARD.';
        this.hallwayNoticeTime = 2.4;
    },

    drawGuard(ctx) {
        const g = this.guard;
        if (!g.present || this.currentRoom !== 'a02') return;
        if (this.guardQuest === 'joined') return;   // he's with you — drawn elsewhere
        this.drawGuardBody(ctx, g.x, g.y);

        // blue marker: a new quest, or one ready to hand in
        const markerUp = !g.walking &&
            (this.guardQuest === 'offered' || this.guardQuest === 'complete');
        if (markerUp) {
            const bob = Math.sin(this.time * 3) * 4;
            const my = g.y - 42 + bob;
            ctx.fillStyle = '#4aa3ff';
            ctx.fillRect(g.x - 3, my - 16, 6, 12);
            ctx.fillRect(g.x - 3, my - 1, 6, 5);
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(g.x - 3, my - 16, 6, 12);
            ctx.strokeRect(g.x - 3, my - 1, 6, 5);
        }

        if (!g.walking && Math.hypot(this.player.x - g.x, this.player.y - g.y) <= 45 &&
            this.guardQuest !== 'joined') {
            ctx.fillStyle = 'rgba(200, 225, 255, 0.95)';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.guardQuest === 'complete' ? '[E] give the letter' : '[E] talk',
                         g.x, g.y - 54);
            ctx.textAlign = 'left';
        }
    },

    // The guard — navy uniform, peaked cap, baton on the belt
    drawGuardBody(ctx, px, py) {
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(px - 11, py + 30, 22, 4);
        // legs
        ctx.fillStyle = '#1c2230';
        ctx.fillRect(px - 8, py + 16, 7, 14);
        ctx.fillRect(px + 1, py + 16, 7, 14);
        // boots
        ctx.fillStyle = '#0e0e10';
        ctx.fillRect(px - 9, py + 27, 8, 4);
        ctx.fillRect(px + 1, py + 27, 8, 4);
        // uniform
        ctx.fillStyle = '#2a3552';
        ctx.fillRect(px - 11, py - 6, 22, 24);
        ctx.fillStyle = '#1f2840';
        ctx.fillRect(px - 1, py - 6, 2, 24);        // button line
        // belt and baton
        ctx.fillStyle = '#121212';
        ctx.fillRect(px - 11, py + 10, 22, 3);
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(px + 9, py + 8, 3, 13);
        // badge
        ctx.fillStyle = '#c9a646';
        ctx.fillRect(px - 7, py - 2, 3, 3);
        // arms
        ctx.fillStyle = '#26304a';
        ctx.fillRect(px - 14, py - 4, 4, 16);
        ctx.fillRect(px + 10, py - 4, 4, 16);
        // head
        ctx.fillStyle = '#b07e56';
        ctx.fillRect(px - 6, py - 18, 12, 12);
        // peaked cap
        ctx.fillStyle = '#1a2238';
        ctx.fillRect(px - 7, py - 21, 14, 5);
        ctx.fillStyle = '#0e1322';
        ctx.fillRect(px - 8, py - 17, 16, 2);       // brim
        ctx.fillStyle = '#c9a646';
        ctx.fillRect(px - 1, py - 20, 2, 2);        // cap badge
        // eyes
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(px - 3, py - 12, 2, 2);
        ctx.fillRect(px + 2, py - 12, 2, 2);
    },

    // ===== COMPANION (the doctor) =====
    startCompanion() {
        this.companionsRecruited.doctor = true;
        // a new recruit comes with you straight away
        this.placeCompanion('doctor', this.doctorX, this.doctorY);
        this.hallwayNotice = 'THE DOCTOR JOINS YOU.';
        this.hallwayNoticeTime = 2.4;

        // He has been carrying the key to A-02 the whole time.
        if (!this.hasKey) {
            this.hasKey = true;
            this.pickupNotice = 'RECEIVED: KEY (A-02)';
            this.pickupNoticeTime = 2.4;
            this.sideQuestNotice =
                'DOCTOR: "A-02 off the corridor. I have had the key since they put me in that locker."';
            this.sideQuestNoticeTime = 4.8;
        }
        this.autosave();
    },

    // Enemies slide along walls and furniture instead of walking through them.
    // If they'd be stuck on both axes they move anyway, so nothing can ever be
    // pinned in a corner and stall a fight.
    enemyBlocked(e, x, y) {
        const box = { x: x - e.w / 2 + 4, y: y + e.h / 2 - 12, w: e.w - 8, h: 12 };
        for (const w of this.walls) {
            if (box.x < w.x + w.w && box.x + box.w > w.x &&
                box.y < w.y + w.h && box.y + box.h > w.y) return true;
        }
        return false;
    },

    // Clamping to the room's bounds can drop an enemy inside a solid object —
    // the roof's corners are stair housings. Ease them back onto open floor.
    unstickEnemy(e) {
        if (!this.enemyBlocked(e, e.x, e.y)) return;
        const fb = this.getRoomData().floorBounds;
        const dx = (fb.x + fb.w / 2) - e.x;
        const dy = (fb.y + fb.h / 2) - e.y;
        const d = Math.hypot(dx, dy) || 1;
        for (let i = 0; i < 40; i++) {
            e.x += (dx / d) * 6;
            e.y += (dy / d) * 6;
            if (!this.enemyBlocked(e, e.x, e.y)) return;
        }
    },

    moveEnemy(e, mx, my) {
        const freeX = !this.enemyBlocked(e, e.x + mx, e.y);
        const freeY = !this.enemyBlocked(e, e.x, e.y + my);
        if (freeX) e.x += mx;
        if (freeY) e.y += my;

        if (freeX || freeY) {
            e.stuckTime = 0;
            return;
        }
        // Boxed in on both sides. Hold position for a moment, and only push
        // through if it lasts — so nothing can be pinned and stall a fight.
        e.stuckTime = (e.stuckTime || 0) + 0.016;
        if (e.stuckTime > 0.8) {
            e.x += mx;
            e.y += my;
        }
    },

    // Everyone you've recruited walks with you. They take up station just
    // behind you, one on each side.
    companionOffsets: {
        doctor: { x: -34, y: 20 },
        guard:  { x: 34, y: 20 },
        shreya: { x: 0, y: 36 }
    },

    // Put a companion beside you. Called when someone joins, and on loading.
    placeCompanion(id, x, y) {
        if (!this.companionsRecruited[id]) return false;
        const f = this.followers[id];
        const off = this.companionOffsets[id];
        f.room = this.currentRoom;
        if (typeof x === 'number') {
            f.x = x;
            f.y = y;
        } else {
            f.x = this.player.x + off.x;
            f.y = this.player.y + off.y;
        }
        f.healTimer = 8;
        f.healFlash = 0;
        this.autosave();
        return true;
    },

    // Is a companion's footprint overlapping a wall or piece of furniture?
    companionBlocked(x, y) {
        const box = { x: x - 9, y: y + 12, w: 18, h: 16 };
        for (const w of this.walls) {
            if (box.x < w.x + w.w && box.x + box.w > w.x &&
                box.y < w.y + w.h && box.y + box.h > w.y) return true;
        }
        return false;
    },

    updateCompanion(dt) {
        for (const id of ['doctor', 'guard', 'shreya']) {
            if (!this.companionsRecruited[id]) continue;
            this.updateOneCompanion(id, dt);
        }
    },

    updateOneCompanion(id, dt) {
        const f = this.followers[id];
        const off = this.companionOffsets[id];
        if (f.healFlash > 0) f.healFlash -= dt;

        // you changed rooms — they come through the door right behind you
        if (f.room !== this.currentRoom) {
            f.room = this.currentRoom;
            f.x = this.player.x + off.x;
            f.y = this.player.y + off.y;
        }

        // each keeps to their own side, just behind you
        const tx = this.player.x + off.x;
        const ty = this.player.y + off.y;
        const dx = tx - f.x;
        const dy = ty - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist > 260) {
            // left too far behind or stuck on furniture — catch up
            f.x = tx - (dx / dist) * 20;
            f.y = ty - (dy / dist) * 20;
        } else if (dist > 24) {
            const speed = dist > 140 ? 165 : 120;
            const mx = (dx / dist) * speed * dt;
            const my = (dy / dist) * speed * dt;
            // slide along obstacles instead of passing through them
            if (!this.companionBlocked(f.x + mx, f.y)) f.x += mx;
            if (!this.companionBlocked(f.x, f.y + my)) f.y += my;
        }

        const fb = this.getRoomData().floorBounds;
        if (f.x < fb.x + 10) f.x = fb.x + 10;
        if (f.x > fb.x + fb.w - 10) f.x = fb.x + fb.w - 10;
        if (f.y < fb.y) f.y = fb.y;
        if (f.y > fb.y + fb.h - 30) f.y = fb.y + fb.h - 30;

        if (this.isDead) return;

        // Shreya's perk — she tases something every 15 seconds
        if (id === 'shreya') {
            if (f.tazeFlash > 0) f.tazeFlash -= dt;
            f.tazeTimer -= dt;
            if (f.tazeTimer <= 0) {
                const targets = this.enemies.filter(e => !e.dead && (!e.shy || e.raged));
                if (targets.length > 0) {
                    const e = targets[Math.floor(Math.random() * targets.length)];
                    f.tazeTimer = 15;
                    f.tazeFlash = 0.6;
                    this.lightning.push({ x1: f.x, y1: f.y - 8, x2: e.x, y2: e.y, life: 0.5 });
                    this.shockEnemy(e, 1, 2.5);
                    this.hitEffects.push({
                        x: e.x, y: e.y - 44, text: 'TASED', life: 0.9, color: '#9fd8ff'
                    });
                } else {
                    f.tazeTimer = 1.5;   // nothing to shoot at — check again shortly
                }
            }
        }

        // the doctor's perk — one full bar every 8 seconds while you're hurt
        if (id === 'doctor') {
            if (this.player.hp < this.player.maxHp) {
                f.healTimer -= dt;
                if (f.healTimer <= 0) {
                    f.healTimer = 8;
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
                    if (this.player.poison) {
                        this.player.poison = 0;
                        this.hitEffects.push({
                            x: this.player.x, y: this.player.y - 56,
                            text: 'VENOM TREATED', life: 1.8, color: '#66dd88'
                        });
                    }
                    f.healFlash = 0.8;
                    this.hitEffects.push({
                        x: this.player.x, y: this.player.y - 40,
                        text: '+1', life: 1.2, color: '#66dd88'
                    });
                }
            } else if (this.player.poison) {
                // full health but still poisoned — he treats that instead
                f.healTimer -= dt;
                if (f.healTimer <= 0) {
                    f.healTimer = 8;
                    this.player.poison = 0;
                    f.healFlash = 0.8;
                    this.hitEffects.push({
                        x: this.player.x, y: this.player.y - 56,
                        text: 'VENOM TREATED', life: 1.8, color: '#66dd88'
                    });
                }
            } else {
                f.healTimer = 8;   // topped up — the clock waits for the next hit
            }
        }
    },

    drawCompanion(ctx) {
        for (const id of ['doctor', 'guard', 'shreya']) {
            if (!this.companionsRecruited[id]) continue;
            const f = this.followers[id];
            if (f.room !== this.currentRoom) continue;

            // green wash when the doctor has just healed you
            if (id === 'doctor' && f.healFlash > 0) {
                const a = Math.min(1, f.healFlash);
                const g = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, 40);
                g.addColorStop(0, `rgba(110, 230, 140, ${0.45 * a})`);
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(f.x - 40, f.y - 40, 80, 80);
            }

            if (id === 'guard') this.drawGuardBody(ctx, f.x, f.y);
            else if (id === 'shreya') this.drawShreyaBody(ctx, f.x, f.y, true);
            else this.drawDoctorBody(ctx, f.x, f.y);

            // her taser charging back up
            if (id === 'shreya') {
                if (f.tazeFlash > 0) {
                    const a = Math.min(1, f.tazeFlash);
                    ctx.fillStyle = `rgba(150, 210, 255, ${0.5 * a})`;
                    ctx.fillRect(f.x - 22, f.y - 26, 44, 48);
                }
                const frac = 1 - Math.max(0, f.tazeTimer) / 15;
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(f.x, f.y - 30, 7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = '#9fd8ff';
                ctx.beginPath();
                ctx.arc(f.x, f.y - 30, 7, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
                ctx.stroke();
            }

            // the doctor's heal timer
            if (id === 'doctor' && this.player.hp < this.player.maxHp) {
                const frac = 1 - Math.max(0, f.healTimer) / 8;
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(f.x, f.y - 30, 7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = '#66dd88';
                ctx.beginPath();
                ctx.arc(f.x, f.y - 30, 7, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
                ctx.stroke();
            }
        }
    },

    // Taking the file is the trigger. A few seconds of nothing, then he's
    // standing in the doorway you came through.
    startLoungeAmbush() {
        if (this.ambush.stage) return;
        this.ambush.stage = 'silence';
        this.ambush.timer = 3.0;
        // the way you came in is the only way out — that's where he appears
        this.ambush.doorX = this.pursuit.entryX;
        this.ambush.doorY = this.pursuit.entryY;
    },

    updateLoungeAmbush(dt) {
        const amb = this.ambush;
        if (amb.stage !== 'silence' || this.currentRoom !== 'lounge') return;

        // a few seconds of nothing after you take the file...
        amb.timer -= dt;
        if (amb.timer <= 0) {
            // ...then he's in the doorway you came through. From here his
            // normal AI takes over, same as anywhere else in the building.
            amb.stage = 'done';
            this.pursuit.enabled = true;
            this.armadaArrives(amb.doorX, amb.doorY, 'HE FOUND YOU.');
        }
    },

    // Taking the file is the trigger for the ambush.
    tryOpenLoungeLocker() {
        const lk = this.loungeLockerTarget;
        if (!lk || this.currentRoom !== 'lounge') return false;
        if (lk.opened) {
            return false;   // already been through this one
        }
        lk.opened = true;
        if (lk.hasFile && !this.hasFile) {
            this.hasFile = true;
            this.pickupNotice = 'RECEIVED: CONFIDENTIAL FILE';
            this.pickupNoticeTime = 2.1;
            this.sideQuestNotice = "Subject J — restraint tolerance, pain response, duration. Page after page of it.";
            this.sideQuestNoticeTime = 3.6;
            this.startLoungeAmbush();
            this.autosave();
        } else if (!this.hasShotgun) {
            this.hasShotgun = true;
            this.inventory.push({ id: 'shotgun', name: 'SHOTGUN', qty: 1 });
            this.weaponDurability.shotgun = WEAPON_STATS.shotgun.durabilityMax;
            this.pistolReserve += 6;
            this.selectWeapon('shotgun');
            this.pickupNotice = 'FOUND: SHOTGUN';
            this.pickupNoticeTime = 2.4;
            this.sideQuestNotice = 'Someone kept it in here loaded. They never got to it.';
            this.sideQuestNoticeTime = 4.2;
            this.autosave();
        } else {
            this.pickupNotice = 'EMPTY.';
            this.pickupNoticeTime = 1.2;
        }
        return true;
    },

    // Talking to the doctor once his quest marker is up.
    trySideQuestTalk() {
        if (!this.sideQuestActive || this.currentRoom !== 'lobby') return false;
        // tight radius — he often stands near the kitchen door, and that door
        // must stay usable when you're not right on top of him
        const dx = this.player.x - this.doctorX;
        const dy = this.player.y - this.doctorY;
        if (Math.sqrt(dx * dx + dy * dy) > 45) return false;

        // bringing him the file ends the quest — he comes with you after this
        if (this.hasFile && !this.fileGiven) {
            this.fileGiven = true;
            this.sideQuestActive = false;
            this.pickupNotice = 'GAVE THE CONFIDENTIAL FILE';
            this.pickupNoticeTime = 1.8;

            this.dialogue.active = true;
            this.dialogue.speaker = 'DOCTOR';
            this.dialogue.lines = [
                "You got it. God... let me see.",
                "Subject J. Pain thresholds, restraint durations. They wrote down every time he screamed.",
                "This is enough to bury every one of them. If we get out of here, the world reads this.",
                "I'm not hiding in a locker again. I'm coming with you.",
                "Stay close. I can't fight — but I can keep you standing."
            ];
            this.dialogue.line = 0;
            this.dialogue.charIndex = 0;
            this.dialogue.charTimer = 0;
            this.dialogue.onFinish = 'startCompanion';
            return true;
        }

        if (this.hasLoungeKey) {
            this.sideQuestNotice = "DOCTOR: \"Adler... God. The lounge is through A-02, across the lobby. Get that file.\"";
        } else {
            this.sideQuestNotice = "DOCTOR: \"Adler's still in the kitchen. Take the torch — the power's dead in there.\"";
        }
        this.sideQuestNoticeTime = 3.0;
        return true;
    },

    // If the player is standing on another survivor's death spot, show their words.
    tryReadDeathStain() {
        if (typeof netChat === 'undefined' || !netChat.deathsInRoom) return false;
        const deaths = netChat.deathsInRoom(this.currentRoom);
        for (const d of deaths) {
            if (Math.abs(this.player.x - d.x) < 40 && Math.abs(this.player.y - d.y) < 40) {
                const words = d.msg && d.msg.trim().length > 0 ? d.msg : '(no last words)';
                this.deathStainNotice = `${d.name}: "${words}"`;
                this.deathStainNoticeTime = 5.0;
                return true;
            }
        }
        return false;
    },

    // ===== DOOR ACTIONS =====
    tryDoor(door) {
        if (door.doorId === 'toHallway') {
            this.switchToHallway();
        } else if (door.doorId === 'A01') {
            this.switchToRoom1();
        } else if (door.doorId === 'A02') {
            if (this.hasKey) {
                this.switchToA02();   // enter the A-02 room
            } else {
                this.hallwayNotice = 'A-02 IS LOCKED. YOU NEED A KEY.';
                this.hallwayNoticeTime = 1.5;
            }
        } else if (door.doorId === 'a02back') {
            this.switchA02ToHallway();
        } else if (door.doorId === 'a02top') {
            if (this.hasRoofKey) {
                this.switchToRoof();
            } else {
                this.hallwayNotice = "LOCKED. IT LEADS UP.";
                this.hallwayNoticeTime = 1.5;
            }
        } else if (door.doorId === 'roofBack') {
            this.switchRoofToA02();
        } else if (door.doorId === 'toLobby') {
            this.switchToLobby();
        } else if (door.doorId === 'lobbyback') {
            this.switchLobbyToHallway();
        } else if (door.doorId === 'lobbyToKitchen') {
            if (this.hasKitchenKey) {
                this.switchToKitchen();
            } else {
                this.hallwayNotice = 'THE KITCHEN IS LOCKED.';
                this.hallwayNoticeTime = 1.5;
            }
        } else if (door.doorId === 'lobbyToLounge') {
            if (this.hasLoungeKey) {
                this.switchToLounge();
            } else {
                this.hallwayNotice = "A-02 IS LOCKED. ADLER HAD THE KEY.";
                this.hallwayNoticeTime = 1.5;
            }
        } else if (door.doorId === 'kitchenBack') {
            this.switchKitchenToLobby();
        } else if (door.doorId === 'kitchenTop') {
            this.hallwayNotice = "LOCKED.";
            this.hallwayNoticeTime = 1.2;
        } else if (door.doorId === 'lobbyToF3') {
            if (this.hasKeycard2) {
                this.switchToF3Hallway(true);
            } else {
                this.hallwayNotice = 'STAIRWELL TO FLOOR 3 — LOCKED. NEEDS A CARD.';
                this.hallwayNoticeTime = 1.7;
            }
        } else if (door.doorId === 'f3ToF4') {
            this.switchToF4Lobby();
        } else if (door.doorId === 'toCell1') {
            this.switchToCell('cell1');
        } else if (door.doorId === 'toCell2') {
            this.switchToCell('cell2');
        } else if (door.doorId === 'toCell3') {
            this.switchToCell('cell3');
        } else if (door.doorId === 'toTorture') {
            if (this.hasF3Key) {
                this.switchToCell('torture');
            } else {
                this.hallwayNotice = 'THIS ONE IS BOLTED. YOU NEED A KEY.';
                this.hallwayNoticeTime = 1.7;
            }
        } else if (door.doorId === 'cellBack') {
            if (this.currentRoom === 'torture' && this.tortureLocked) {
                this.hallwayNotice = 'IT WILL NOT OPEN. NOT UNTIL THIS IS FINISHED.';
                this.hallwayNoticeTime = 2.4;
            } else {
                this.switchCellToHallway(this.currentRoom);
            }
        } else if (door.doorId === 'hall1ToHall2') {
            this.switchToF3Hallway2(true);
        } else if (door.doorId === 'hall2ToHall1') {
            this.switchToF3Hallway(false);
            this.player.x = 880;
            this.player.y = 450;
            this.player.facing = 'left';
        } else if (door.doorId === 'f3ToA02') {
            if (this.hasF3Key) {
                this.switchToF3A02();
            } else {
                this.hallwayNotice = 'A-02 IS LOCKED. YOU NEED A KEY.';
                this.hallwayNoticeTime = 1.5;
            }
        } else if (door.doorId === 'f3A02Back') {
            this.switchToF3Hallway(false);
        } else if (door.doorId === 'f3ToLobby') {
            this.switchToF3Lobby();
        } else if (door.doorId === 'f3LobbyToHallway') {
            this.switchToF3Hallway(false);
        } else if (door.doorId === 'f3ToF2') {
            if (!this.hasF2Keycard) {
                this.hallwayNotice = 'STAIRWELL TO FLOOR 2 — LOCKED. NEEDS A CARD.';
                this.hallwayNoticeTime = 1.7;
            } else {
                this.hallwayNotice = 'THE CARD READS. SOMETHING HEAVY IS HOLDING IT SHUT FROM BELOW.';
                this.hallwayNoticeTime = 2.7;
            }
        } else if (door.doorId === 'f3ToDining') {
            this.switchToDining();
        } else if (door.doorId === 'f3ToGames') {
            this.switchToGames();
        } else if (door.doorId === 'diningBack' || door.doorId === 'gamesBack') {
            this.switchToF3Lobby();
        } else if (door.doorId === 'loungeBack') {
            this.switchLoungeToLobby();
        }
    },

    openDrawer(drawer) {
        drawer.state = 'open';
        const spawnBaseX = drawer.x + drawer.w / 2;
        const spawnBaseY = drawer.y + drawer.h + 25;
        drawer.loot.forEach((lootItem, idx) => {
            const cols = Math.min(drawer.loot.length, 3);
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const offsetX = (col - (cols - 1) / 2) * 30;
            const offsetY = row * 25;
            this.items.push({
                id: lootItem.id, name: lootItem.name,
                x: spawnBaseX + offsetX, y: spawnBaseY + offsetY,
                pickupRadius: 35, pickedUp: false,
                spawnTime: this.time + idx * 0.08
            });
        });
        if (drawer.isJackpot) {
            this.pickupNotice = `⚡ JACKPOT! ${drawer.loot.length} ITEMS FOUND ⚡`;
            this.pickupNoticeTime = 1.8;
            this.jackpotFlash = 0.6;
        } else {
            this.pickupNotice = `DRAWER OPENED — ${drawer.loot.length} ITEMS`;
            this.pickupNoticeTime = 1.2;
        }
        drawer.state = 'looted';
        this.autosave();
    },

    pickUpItem(item) {
        item.pickedUp = true;
        if (item.id === 'key') {
            this.hasKey = true;
            this.pickupNotice = 'PICKED UP: KEY';
            this.pickupNoticeTime = 1.5;
        } else if (item.id === 'letter') {
            this.hasLetter = true;
            this.letterPromptTime = 3.0;   // "Press E to read the letter" for 3s
        } else if (item.id === 'ammo') {
            this.pistolReserve += 7;
            this.pickupNotice = `+7 ROUNDS  (${this.pistolReserve} SPARE)`;
            this.pickupNoticeTime = 1.2;
        } else if (item.id === 'freezegun') {
            this.hasFreezeGun = true;
            this.inventory.push({ id: 'freezegun', name: 'FREEZE GUN', qty: 1 });
            this.weaponDurability.freezegun = WEAPON_STATS.freezegun.durabilityMax;
            this.selectWeapon('freezegun');
            this.pickupNotice = 'PICKED UP: FREEZE GUN';
            this.pickupNoticeTime = 2.4;
            this.sideQuestNotice = 'Ten charges. She said cold is the only thing he cannot take.';
            this.sideQuestNoticeTime = 4.2;
        } else if (item.id === 'shreyaId') {
            this.hasShreyaId = true;
            this.inventory.push({ id: 'shreyaId', name: 'ID CARD', qty: 1 });
            this.pickupNotice = 'PICKED UP: AN ID CARD';
            this.pickupNoticeTime = 1.8;
            if (this.companionsRecruited.shreya) this.shreyaRunsForIt();
            this.sideQuestNotice = 'GREENVALE ASYLUM — RESEARCH DIRECTOR. The photograph is hers.';
            this.sideQuestNoticeTime = 4.2;
            this.autosave();
        } else if (item.id === 'f2keycard') {
            this.hasF2Keycard = true;
            this.inventory.push({ id: 'f2keycard', name: 'KEYCARD', qty: 1 });
            this.pickupNotice = 'PICKED UP: KEYCARD (FLOOR 2)';
            this.pickupNoticeTime = 1.8;
            this.sideQuestNotice = 'The card is warm. It was wearing it.';
            this.sideQuestNoticeTime = 2.7;
        } else if (item.id === 'gamesNote') {
            this.gamesNoteRead = true;
            this.pickupNotice = 'PICKED UP: A NOTE';
            this.pickupNoticeTime = 1.5;
            this.sideQuestNotice = '"They moved him down to 2. Whatever he is now, he is not restrained." — unsigned';
            this.sideQuestNoticeTime = 4.2;
        } else if (item.id === 'f3key') {
            this.hasF3Key = true;
            this.pickupNotice = 'PICKED UP: KEY (THE BOLTED DOOR)';
            this.pickupNoticeTime = 1.5;
        } else if (item.id === 'anomalyLetter') {
            this.hasAnomalyLetter = true;
            if (this.guardQuest === 'active') this.guardQuest = 'complete';
            this.pickupNotice = 'PICKED UP: A BLOODSTAINED LETTER';
            this.pickupNoticeTime = 1.8;
            this.sideQuestNotice = "It's soaked through, but the name on it is still clear. It's for the guard.";
            this.sideQuestNoticeTime = 3.0;
        } else {
            const existing = this.inventory.find(i => i.id === item.id);
            if (existing) existing.qty += 1;
            else this.inventory.push({ id: item.id, name: item.name, qty: 1 });
            this.pickupNotice = `PICKED UP: ${item.name}`;
            this.pickupNoticeTime = 1.2;
        }
        this.pickupPromptItem = null;
        this.autoEquipWeapon();
        this.autosave();
    },

    collidesAt(cx, cy) {
        const halfW = this.player.w / 2;
        const left = cx - halfW; const right = cx + halfW;
        const top = cy + this.player.h / 2 - 10;
        const bottom = cy + this.player.h / 2;
        for (const w of this.walls) {
            if (right > w.x && left < w.x + w.w &&
                bottom > w.y && top < w.y + w.h) return true;
        }
        return false;
    },

    // ===== DRAW =====
    draw(ctx) {
        const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 20 : 0;
        const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 20 : 0;
        ctx.save();
        ctx.translate(shakeX, shakeY);

        ctx.fillStyle = '#000';
        ctx.fillRect(-30, -30, canvas.width + 60, canvas.height + 60);

        // Draw room image
        const rd = this.getRoomData();
        let roomLoaded;
        if (this.currentRoom === 'room1') roomLoaded = roomImageLoaded;
        else if (this.currentRoom === 'hallway') roomLoaded = hallwayImageLoaded;
        else if (this.currentRoom === 'a02') roomLoaded = a02ImageLoaded;
        else if (this.currentRoom === 'kitchen') roomLoaded = kitchenImageLoaded;
        else if (this.currentRoom === 'lounge') roomLoaded = loungeImageLoaded;
        else if (this.currentRoom === 'roof') roomLoaded = roofImageLoaded;
        else if (this.currentRoom === 'dining') roomLoaded = diningImageLoaded;
        else if (this.currentRoom === 'games') roomLoaded = gamesImageLoaded;
        else if (this.currentRoom === 'f3hallway' || this.currentRoom === 'f3a02' ||
                 this.currentRoom === 'f3lobby' || this.currentRoom === 'f3hallway2') roomLoaded = true;
        else if (cellImageLoaded[this.currentRoom] !== undefined)
            roomLoaded = cellImageLoaded[this.currentRoom];
        else roomLoaded = lobbyImageLoaded;
        if (roomLoaded) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(rd.image, 0, 0, canvas.width, canvas.height);
        }

        // drawers, in whichever room has them
        for (const d of this.drawers) this.drawDrawer(ctx, d);

        // Lobby lockers (the doctor's one shines)
        if (this.currentRoom === 'lobby') this.drawLockers(ctx);

        // Blood stains, pools, and severed limbs on the floor (under entities)
        this.drawBloodStains(ctx);
        this.drawNetworkDeaths(ctx);
        this.drawBloodPools(ctx);
        this.drawGibs(ctx);

        for (const item of this.items) {
            if (item.pickedUp) continue;
            this.drawItem(ctx, item);
        }

        if (this.currentRoom === 'room1' && this.dummy.hp > 0) this.drawDummy(ctx);

        // Armada is drawn wherever he physically is
        if (this.currentRoom === 'room1') this.drawWallCracks(ctx);
        this.drawAnomaly(ctx);
        if (this.armada.active && this.currentRoom === this.armada.room) this.drawArmada(ctx);
        if (this.currentRoom === 'room1') this.drawDust(ctx);

        // Doctor + Jordan (lobby)
        if (this.currentRoom === 'lobby') {
            this.drawDoctor(ctx);
            this.drawJordan(ctx);
        }

        // Enemies (hallway + A-02)
        for (const e of this.enemies) {
            if (e.shy) this.drawShyEnemy(ctx, e);
            else if (e.kind === 'anomaly') this.drawAnomalyEnemy(ctx, e);
            else if (e.kind === 'crawler') this.drawCrawler(ctx, e);
            else this.drawEnemy(ctx, e);
        }

        // Enemy knives (A-02)
        this.drawEnemyProjectiles(ctx);

        this.drawColleagueBody(ctx);
        this.drawLoungeLockers(ctx);
        this.drawLootPiles(ctx);
        this.drawGuard(ctx);
        this.drawCompanion(ctx);
        this.drawGuardShots(ctx);
        this.drawLightning(ctx);
        this.drawGuardBodyOnRoof(ctx);
        this.drawFrost(ctx);
        this.drawShreya(ctx);
        if (this.shreyaFled && !this.shreyaConfronted && this.currentRoom === 'f3hallway2' &&
            !this.companionsRecruited.shreya) {
            this.drawShreyaBody(ctx, this.shreyaSpot.x, this.shreyaSpot.y, true);
        }
        this.drawRaymond(ctx);
        this.drawVolleyCharge(ctx);
        this.drawDashTrail(ctx);
        this.drawPlayer(ctx);
        this.drawTargetLine(ctx);
        this.drawSparks(ctx);
        this.drawFrostMotes(ctx);
        this.drawVenom(ctx);
        this.drawProjectiles(ctx);
        this.drawMuzzleFlash(ctx);

        for (const fx of this.hitEffects) {
            ctx.fillStyle = fx.color || '#ffdddd';
            ctx.globalAlpha = Math.min(1, fx.life);
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(fx.text, fx.x, fx.y);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'left';
        }

        if (this.godMode) {
            ctx.fillStyle = 'rgba(80, 200, 120, 0.9)';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('INVINCIBLE', canvas.width - 12, 36);
            ctx.textAlign = 'left';
        }

        if (this.debugMode) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.85)';
            ctx.fillStyle = 'rgba(255, 0, 0, 0.18)';
            ctx.lineWidth = 1;
            for (const w of this.walls) {
                ctx.fillRect(w.x, w.y, w.w, w.h);
                ctx.strokeRect(w.x, w.y, w.w, w.h);
            }
        }

        if (!this.debugMode) {
            if (this.isDarkRoom()) {
                this.drawDarkness(ctx);
            } else {
                const vig = ctx.createRadialGradient(
                    this.player.x, this.player.y, 220,
                    this.player.x, this.player.y, 520
                );
                vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
                vig.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
                ctx.fillStyle = vig;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        if (this.jackpotFlash > 0) {
            ctx.fillStyle = `rgba(255, 30, 30, ${this.jackpotFlash * 0.4})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (this.damageFlash > 0) {
            ctx.fillStyle = `rgba(180, 0, 0, ${this.damageFlash * 0.55})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (this.healFlash > 0) {
            ctx.fillStyle = `rgba(50, 180, 50, ${this.healFlash * 0.35})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (this.armadaWarningFlash > 0) {
            ctx.fillStyle = `rgba(120, 0, 0, ${this.armadaWarningFlash * 0.7})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.restore();

        // UI
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, 28);
        ctx.fillStyle = '#888';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(this.companionsRecruited.guard || this.companionsRecruited.shreya
            ? 'WASD · SHIFT dash · 1-5 weapon (hold 3 swaps guns) · R reload · E interact · I inv · L-Click attack (hold = special)'
            : 'WASD · SHIFT dash · 1-5 weapon (hold 3 swaps guns) · R reload · E interact · I inv · L-Click attack', 12, 19);
        ctx.textAlign = 'right';
        let roomLabel;
        if (this.currentRoom === 'room1') roomLabel = 'FLOOR 4 — ASYLUM WARD';
        else if (this.currentRoom === 'hallway') roomLabel = 'FLOOR 4 — HALLWAY';
        else if (this.currentRoom === 'a02') roomLabel = 'FLOOR 4 — ROOM A-02';
        else if (this.currentRoom === 'kitchen') roomLabel = 'FLOOR 4 — KITCHEN';
        else if (this.currentRoom === 'lounge') roomLabel = "DOCTOR'S LOUNGE";
        else if (this.currentRoom === 'roof') roomLabel = 'THE ROOF';
        else if (this.currentRoom === 'f3hallway') roomLabel = 'FLOOR 3 — HALLWAY';
        else if (this.currentRoom === 'f3a02') roomLabel = 'FLOOR 3 — A-02';
        else if (this.currentRoom === 'f3lobby') roomLabel = 'FLOOR 3 — LOBBY';
        else if (this.currentRoom === 'dining') roomLabel = 'DINING HALL';
        else if (this.currentRoom === 'games') roomLabel = 'GAMES ROOM';
        else if (this.currentRoom === 'f3hallway2') roomLabel = 'FLOOR 3 — CELL BLOCK';
        else if (this.currentRoom === 'cell1') roomLabel = 'CELL 1';
        else if (this.currentRoom === 'cell2') roomLabel = 'CELL 2';
        else if (this.currentRoom === 'cell3') roomLabel = 'CELL 3';
        else if (this.currentRoom === 'torture') roomLabel = 'THE OTHER ROOM';
        else roomLabel = 'FLOOR 4 — LOBBY';
        ctx.fillText(this.debugMode ? 'DEBUG' : roomLabel, canvas.width - 12, 19);
        ctx.textAlign = 'left';

        this.drawHealthBar(ctx);
        this.drawStaminaBar(ctx);
        this.drawWeaponHUD(ctx);
        this.drawArmadaHitCounter(ctx);
        this.drawKeyIndicator(ctx);
        this.drawGoreFinaleFlash(ctx);
        this.drawAnomalyBanner(ctx);
        this.drawRoofWaveBanner(ctx);
        this.drawRaymondBanner(ctx);
        this.drawFrostBanner(ctx);
        this.drawRaymondHealthBar(ctx);
        this.drawArmadaFinalHud(ctx);
        this.drawWhiteFlash(ctx);
        this.drawFinaleCard(ctx);
        this.drawEpilogue(ctx);
        this.drawCutsceneLine(ctx);
        this.drawJordanHealthBar(ctx);
        this.drawPlayerStun(ctx);
        this.drawFrozenOverlay(ctx);
        this.drawPoison(ctx);

        if (this.shreyaFled && !this.shreyaConfronted && this.currentRoom === 'f3hallway2' &&
            !this.companionsRecruited.shreya &&
            Math.hypot(this.player.x - this.shreyaSpot.x,
                       this.player.y - this.shreyaSpot.y) < 60) {
            this.drawInteractPrompt(ctx, this.shreyaSpot.x, this.shreyaSpot.y - 44, '[E] SHREYA');
        }

        if (this.cabinetPromptTarget) {
            const c = this.cabinetPromptTarget;
            this.drawInteractPrompt(ctx, c.x + c.w / 2, c.y + c.h + 30, '[E] SEARCH THE CABINET');
        }

        if (this.doctorPromptTarget) {
            const lk = this.doctorPromptTarget;
            this.drawInteractPrompt(ctx, lk.x + lk.w / 2, lk.y + lk.h + 24, '[E] OPEN LOCKER');
        } else if (this.drawerPromptTarget) {
            this.drawInteractPrompt(ctx, this.drawerPromptTarget.x + this.drawerPromptTarget.w / 2,
                                         this.drawerPromptTarget.y + this.drawerPromptTarget.h + 20,
                                         '[E] OPEN DRAWER');
        } else if (this.pickupPromptItem) {
            this.drawInteractPrompt(ctx, this.pickupPromptItem.x,
                                         this.pickupPromptItem.y - 40,
                                         `[E] PICK UP ${this.pickupPromptItem.name}`);
        } else if (this.doorPromptTarget) {
            let label = '[E] OPEN DOOR';
            let px, py;
            if (this.doorPromptTarget.doorId === 'toHallway') {
                const d = this.room1.doorToHallway;
                px = d.x + d.w / 2; py = d.y + d.h + 20;
                label = '[E] GO TO HALLWAY';
            } else if (this.doorPromptTarget.doorId === 'A01') {
                const d = this.hallway.doorA01;
                px = d.x + d.w / 2; py = d.y + d.h + 20;
                label = '[E] BACK TO WARD (A-01)';
            } else if (this.doorPromptTarget.doorId === 'A02') {
                const d = this.hallway.doorA02;
                px = d.x + d.w / 2; py = d.y + d.h + 20;
                label = this.hasKey ? '[E] UNLOCK A-02' : '[E] A-02 (LOCKED)';
            } else if (this.doorPromptTarget.doorId === 'a02top') {
                const d = this.a02.topDoor;
                px = d.x + d.w / 2; py = d.y + d.h + 20;
                label = this.hasRoofKey ? '[E] THE ROOF' : '[E] ROOF (LOCKED)';
            } else if (this.doorPromptTarget.doorId === 'roofBack') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] BACK INSIDE';
            } else if (this.doorPromptTarget.doorId === 'a02back') {
                px = 480; py = 595;
                label = '[E] BACK TO HALLWAY';
            } else if (this.doorPromptTarget.doorId === 'toLobby') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] ENTER LOBBY';
            } else if (this.doorPromptTarget.doorId === 'lobbyback') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] BACK TO HALLWAY';
            } else if (this.doorPromptTarget.doorId === 'lobbyToKitchen') {
                px = this.player.x; py = this.player.y - 40;
                label = this.hasKitchenKey ? '[E] ENTER KITCHEN' : '[E] KITCHEN (LOCKED)';
            } else if (this.doorPromptTarget.doorId === 'lobbyToLounge') {
                px = this.player.x; py = this.player.y - 40;
                label = this.hasLoungeKey ? "[E] DOCTOR'S LOUNGE" : '[E] A-02 (LOCKED)';
            } else if (this.doorPromptTarget.doorId === 'kitchenBack') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] BACK TO LOBBY';
            } else if (this.doorPromptTarget.doorId === 'kitchenTop') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] DOOR (LOCKED)';
            } else if (this.doorPromptTarget.doorId === 'lobbyToF3') {
                px = this.player.x; py = this.player.y - 40;
                label = this.hasKeycard2 ? '[E] DOWN TO FLOOR 3' : '[E] STAIRWELL (LOCKED)';
            } else if (this.doorPromptTarget.doorId === 'f3ToF4') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] UP TO FLOOR 4';
            } else if (this.doorPromptTarget.doorId === 'toCell1' ||
                       this.doorPromptTarget.doorId === 'toCell2' ||
                       this.doorPromptTarget.doorId === 'toCell3') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] OPEN THE CELL';
            } else if (this.doorPromptTarget.doorId === 'toTorture') {
                px = this.player.x; py = this.player.y - 40;
                label = this.hasF3Key ? '[E] OPEN IT' : '[E] BOLTED (NEEDS A KEY)';
            } else if (this.doorPromptTarget.doorId === 'cellBack') {
                px = this.player.x; py = this.player.y - 40;
                label = (this.currentRoom === 'torture' && this.tortureLocked)
                    ? '[E] THE DOOR IS HELD' : '[E] BACK TO THE CORRIDOR';
            } else if (this.doorPromptTarget.doorId === 'hall1ToHall2' ||
                       this.doorPromptTarget.doorId === 'hall2ToHall1') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] ALONG THE CORRIDOR';
            } else if (this.doorPromptTarget.doorId === 'f3ToA02') {
                px = this.player.x; py = this.player.y - 40;
                label = this.hasF3Key ? '[E] ENTER A-02' : '[E] A-02 (LOCKED)';
            } else if (this.doorPromptTarget.doorId === 'f3ToF2') {
                px = this.player.x; py = this.player.y - 40;
                label = this.hasF2Keycard ? '[E] DOWN TO FLOOR 2' : '[E] STAIRWELL (LOCKED)';
            } else if (this.doorPromptTarget.doorId === 'f3ToDining') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] DINING HALL';
            } else if (this.doorPromptTarget.doorId === 'f3ToGames') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] GAMES ROOM';
            } else if (this.doorPromptTarget.doorId === 'f3ToLobby' ||
                       this.doorPromptTarget.doorId === 'f3LobbyToHallway' ||
                       this.doorPromptTarget.doorId === 'f3A02Back' ||
                       this.doorPromptTarget.doorId === 'diningBack' ||
                       this.doorPromptTarget.doorId === 'gamesBack') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] BACK';
            } else if (this.doorPromptTarget.doorId === 'loungeBack') {
                px = this.player.x; py = this.player.y - 40;
                label = '[E] BACK TO LOBBY';
            }
            this.drawInteractPrompt(ctx, px, py, label);
        }

        if (this.pickupNoticeTime > 0 && this.pickupNotice) {
            const alpha = Math.min(1, this.pickupNoticeTime / 1);
            const isJackpot = this.pickupNotice.includes('JACKPOT');
            const noticeW = isJackpot ? 400 : 320;
            const noticeH = isJackpot ? 46 : 38;
            const nx = canvas.width / 2 - noticeW / 2;
            ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * alpha})`;
            ctx.fillRect(nx, 38, noticeW, noticeH);
            ctx.strokeStyle = isJackpot ? `rgba(255, 200, 40, ${alpha})` : `rgba(170, 0, 0, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(nx, 38, noticeW, noticeH);
            ctx.fillStyle = isJackpot ? `rgba(255, 220, 100, ${alpha})` : `rgba(255, 100, 100, ${alpha})`;
            ctx.font = isJackpot ? 'bold 18px monospace' : 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.pickupNotice, canvas.width / 2, 38 + noticeH / 2);
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
        }

        // Another survivor's last words (from a network death stain)
        if (this.deathStainNoticeTime > 0) {
            const alpha = Math.min(1, this.deathStainNoticeTime / 1);
            const noticeW = 560;
            const noticeH = 46;
            const nx = canvas.width / 2 - noticeW / 2;
            const ny = canvas.height - 150;
            ctx.fillStyle = `rgba(10, 0, 0, ${0.9 * alpha})`;
            ctx.fillRect(nx, ny, noticeW, noticeH);
            ctx.strokeStyle = `rgba(150, 30, 30, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(nx, ny, noticeW, noticeH);
            ctx.fillStyle = `rgba(220, 200, 190, ${alpha})`;
            ctx.font = 'italic 16px "Times New Roman"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.deathStainNotice, canvas.width / 2, ny + noticeH / 2);
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
        }

        // Doctor's side-quest line
        if (this.sideQuestNoticeTime > 0 && this.sideQuestNotice) {
            const alpha = Math.min(1, this.sideQuestNoticeTime / 1);
            const noticeW = 620, noticeH = 44;
            const nx = canvas.width / 2 - noticeW / 2;
            const ny = canvas.height - 150;
            ctx.fillStyle = `rgba(6, 8, 14, ${0.9 * alpha})`;
            ctx.fillRect(nx, ny, noticeW, noticeH);
            ctx.strokeStyle = `rgba(200, 170, 70, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(nx, ny, noticeW, noticeH);
            ctx.fillStyle = `rgba(235, 225, 195, ${alpha})`;
            ctx.font = 'italic 15px "Times New Roman"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.sideQuestNotice, canvas.width / 2, ny + noticeH / 2);
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
        }

        if (this.hallwayNoticeTime > 0 && this.hallwayNotice) {
            const alpha = Math.min(1, this.hallwayNoticeTime / 1);
            const noticeW = 520;
            const noticeH = 40;
            const nx = canvas.width / 2 - noticeW / 2;
            const ny = 90;
            ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * alpha})`;
            ctx.fillRect(nx, ny, noticeW, noticeH);
            ctx.strokeStyle = `rgba(220, 100, 100, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(nx, ny, noticeW, noticeH);
            ctx.fillStyle = `rgba(255, 200, 200, ${alpha})`;
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.hallwayNotice, canvas.width / 2, ny + noticeH / 2);
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
        }

        if (this.armadaIncomingTime > 0) {
            const alpha = Math.min(1, this.armadaIncomingTime / 2);
            const pulse = 0.7 + Math.sin(this.time * 8) * 0.3;
            const bannerW = 520; const bannerH = 60;
            const bx = canvas.width / 2 - bannerW / 2;
            const by = 200;
            ctx.fillStyle = `rgba(20, 0, 0, ${0.9 * alpha})`;
            ctx.fillRect(bx, by, bannerW, bannerH);
            ctx.strokeStyle = `rgba(220, 20, 20, ${alpha * pulse})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, bannerW, bannerH);
            ctx.fillStyle = `rgba(255, 60, 60, ${alpha * pulse})`;
            ctx.font = 'bold 20px "Times New Roman"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SOMETHING IS COMING FOR YOU...', canvas.width / 2, by + bannerH / 2);
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
        }

        if (this.scriptedMessage.active) this.drawScriptedMessage(ctx);

        // "Press E to read the letter" notice (3 seconds after pickup)
        if (this.letterPromptTime > 0 && !this.letterOpen) {
            const alpha = Math.min(1, this.letterPromptTime / 1);
            const w = 340, h = 44;
            const nx = canvas.width / 2 - w / 2;
            const ny = canvas.height - 120;
            ctx.fillStyle = `rgba(0,0,0,${0.85 * alpha})`;
            ctx.fillRect(nx, ny, w, h);
            ctx.strokeStyle = `rgba(230, 210, 150, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(nx, ny, w, h);
            const pulse = 0.6 + Math.sin(this.time * 6) * 0.4;
            ctx.fillStyle = `rgba(240, 225, 170, ${alpha * pulse})`;
            ctx.font = 'bold 15px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Press  E  to read the letter', canvas.width / 2, ny + h / 2);
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
        }

        // Full-screen letter view
        if (this.letterOpen) this.drawLetter(ctx);

        // Doctor dialogue box (bottom of screen, typewriter)
        if (this.dialogue.active) this.drawDialogue(ctx);

        // "JORDAN" name banner when he appears
        if (this.jordanBannerTime > 0 && this.currentRoom === 'lobby') this.drawJordanBanner(ctx);

        if (this.isDead) this.drawDeathScreen(ctx);
    },

    drawKeyIndicator(ctx) {
        if (!this.hasKey) return;
        const boxX = canvas.width - 220;
        const boxY = 40;
        ctx.fillStyle = 'rgba(60, 40, 5, 0.9)';
        ctx.fillRect(boxX, boxY, 80, 40);
        ctx.strokeStyle = '#ffcc44';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, 80, 40);
        ctx.fillStyle = '#ffcc44';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('KEY', boxX + 10, boxY + 15);
        // draw a small key icon
        const kx = boxX + 45; const ky = boxY + 25;
        ctx.fillStyle = '#ffcc44';
        ctx.fillRect(kx, ky - 3, 20, 4);
        ctx.beginPath();
        ctx.arc(kx, ky - 1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a5210';
        ctx.beginPath();
        ctx.arc(kx, ky - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffcc44';
        ctx.fillRect(kx + 15, ky + 1, 3, 3);
        ctx.fillRect(kx + 18, ky + 1, 2, 5);
    },

    // ===== ENEMY DRAW =====
    drawEnemy(ctx, e) {
        if (e.dead) {
            // Slumped body
            const alpha = Math.max(0, 1 - e.deathAnim * 0.5);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(e.x, e.y + e.h / 2);
            ctx.rotate(Math.PI / 2);
            ctx.translate(-e.x, -(e.y + e.h / 2));
            this.drawEnemyBody(ctx, e, true);
            ctx.restore();
            return;
        }
        this.drawEnemyBody(ctx, e, false);
    },

    drawEnemyBody(ctx, e, dead) {
        const px = Math.round(e.x); const py = Math.round(e.y);
        const flash = e.hitFlash > 0;

        // Scale drawing 2x to match Sadid's chunky pixel-art size
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(2, 2);
        ctx.translate(-px, -py);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(px - 12, py + 20, 24, 4);

        if (e.headless) {
            // Head torn off — bloody neck stump only
            ctx.fillStyle = flash ? '#ffaaaa' : '#8a0000';
            ctx.fillRect(px - 4, py - 8, 8, 5);
            ctx.fillStyle = 'rgba(140, 0, 0, 0.8)';
            ctx.fillRect(px - 3, py - 7, 6, 2);
        } else {
            // Head — dirty hair, hunched
            ctx.fillStyle = flash ? '#ffcccc' : '#2a2018';
            ctx.fillRect(px - 8, py - 20, 16, 12);
            // Face
            ctx.fillStyle = flash ? '#ffaaaa' : '#7a5a44';
            ctx.fillRect(px - 6, py - 12, 12, 6);
            // Yellow glowing eyes
            if (!dead) {
                const pulse = 0.5 + Math.sin(this.time * 5) * 0.5;
                ctx.fillStyle = `rgba(255, 220, 50, ${0.7 + pulse * 0.3})`;
                ctx.fillRect(px - 4, py - 10, 2, 2);
                ctx.fillRect(px + 2, py - 10, 2, 2);
            }
        }
        // Neck
        ctx.fillStyle = flash ? '#ffaaaa' : '#5a4030';
        ctx.fillRect(px - 3, py - 6, 6, 3);
        // Dirty white shirt
        ctx.fillStyle = flash ? '#ffdddd' : '#a89878';
        ctx.fillRect(px - 10, py - 3, 20, 18);
        ctx.fillStyle = flash ? '#ffccdd' : '#8a7860';
        ctx.fillRect(px - 10, py + 8, 20, 3);
        // Blood stains
        ctx.fillStyle = 'rgba(120, 0, 0, 0.6)';
        ctx.fillRect(px - 4, py + 2, 4, 3);
        ctx.fillRect(px + 3, py - 1, 3, 4);
        // Arms — if an arm was torn off, draw only one arm + a bloody stump
        ctx.fillStyle = flash ? '#ffaaaa' : '#5a4030';
        if (e.missingLimb === 'arm') {
            ctx.fillRect(px - 12, py - 2, 4, 12);   // left arm remains
            // bloody stump where the right arm was
            ctx.fillStyle = flash ? '#ffaaaa' : '#8a0000';
            ctx.fillRect(px + 8, py - 2, 4, 4);
        } else {
            ctx.fillRect(px - 12, py - 2, 4, 12);
            ctx.fillRect(px + 8, py - 2, 4, 12);
        }
        // Legs — if a leg was torn off, draw only one leg + a bloody stump
        ctx.fillStyle = flash ? '#ffbbbb' : '#3a2818';
        if (e.missingLimb === 'leg') {
            ctx.fillRect(px - 8, py + 15, 6, 8);    // left leg remains
            ctx.fillStyle = flash ? '#ffbbbb' : '#8a0000';
            ctx.fillRect(px + 2, py + 15, 6, 4);    // bloody stump
        } else {
            ctx.fillRect(px - 8, py + 15, 6, 8);
            ctx.fillRect(px + 2, py + 15, 6, 8);
        }

        ctx.restore();

        // HP bar (drawn at normal scale so it stays readable)
        if (!dead) {
            const barW = 30;
            const barY = py - 34;
            ctx.fillStyle = '#1a0808';
            ctx.fillRect(px - barW / 2, barY, barW, 4);
            ctx.fillStyle = '#aa2020';
            ctx.fillRect(px - barW / 2, barY, barW * (e.hp / e.maxHp), 4);
        }
    },

    // ===== ARMADA DRAWING =====
    // Lobby lockers — the doctor's locker shines until triggered
    drawLockers(ctx) {
        for (const lk of this.lobby.lockers) {
            // locker body
            ctx.fillStyle = '#3a4048';
            ctx.fillRect(lk.x, lk.y, lk.w, lk.h);
            ctx.fillStyle = '#2a3038';
            ctx.fillRect(lk.x + 2, lk.y + 2, lk.w - 4, lk.h - 4);
            // vents
            ctx.fillStyle = '#1a1f24';
            for (let vy = 0; vy < 3; vy++) {
                ctx.fillRect(lk.x + 8, lk.y + 8 + vy * 6, lk.w - 16, 2);
            }
            // handle
            ctx.fillStyle = '#6a7078';
            ctx.fillRect(lk.x + lk.w - 8, lk.y + lk.h / 2 - 4, 3, 10);
            // shine on the doctor's locker (before it's opened)
            if (lk.hasDoctor && !this.doctorTriggered) {
                const pulse = 0.5 + Math.sin(this.time * 4) * 0.5;
                ctx.strokeStyle = `rgba(255, 240, 160, ${0.4 + pulse * 0.5})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(lk.x - 2, lk.y - 2, lk.w + 4, lk.h + 4);
                // soft glow
                const glow = ctx.createRadialGradient(
                    lk.x + lk.w / 2, lk.y + lk.h / 2, 5,
                    lk.x + lk.w / 2, lk.y + lk.h / 2, 45
                );
                glow.addColorStop(0, `rgba(255, 240, 160, ${0.15 + pulse * 0.1})`);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = glow;
                ctx.fillRect(lk.x - 30, lk.y - 30, lk.w + 60, lk.h + 60);
            }
        }
    },

    // The doctor, standing by his locker after being revealed
    // The doctor's figure — used by both the lobby scene and the companion
    drawDoctorBody(ctx, px, py) {
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(px - 10, py + 30, 20, 4);
        // legs
        ctx.fillStyle = '#3a3a44';
        ctx.fillRect(px - 7, py + 16, 6, 14);
        ctx.fillRect(px + 1, py + 16, 6, 14);
        // white coat body
        ctx.fillStyle = '#d8d8d0';
        ctx.fillRect(px - 10, py - 6, 20, 24);
        ctx.fillStyle = '#c0c0b8';
        ctx.fillRect(px - 1, py - 6, 2, 24);   // coat seam
        // stethoscope hint
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(px - 5, py - 4, 3, 8);
        ctx.fillRect(px + 2, py - 4, 3, 8);
        // arms
        ctx.fillStyle = '#c8c8c0';
        ctx.fillRect(px - 13, py - 4, 4, 16);
        ctx.fillRect(px + 9, py - 4, 4, 16);
        // head
        ctx.fillStyle = '#c99a6a';
        ctx.fillRect(px - 6, py - 18, 12, 12);
        // hair
        ctx.fillStyle = '#2a201a';
        ctx.fillRect(px - 6, py - 18, 12, 4);
        // small worried eyes
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(px - 3, py - 12, 2, 2);
        ctx.fillRect(px + 2, py - 12, 2, 2);
    },

    drawDoctor(ctx) {
        if (!this.doctorTriggered) return;
        if (this.companionsRecruited.doctor) return;   // recruited — he's in your party now
        // normally he stands by his locker; after Jordan falls he walks over
        let px, py;
        if (this.postJordanStage) {
            px = this.doctorX;
            py = this.doctorY;
        } else {
            const lk = this.lobby.lockers.find(l => l.hasDoctor);
            if (!lk) return;
            px = lk.x + lk.w / 2;
            py = lk.y + lk.h + 10;
        }
        this.drawDoctorBody(ctx, px, py);

        // He's holding the key out — take it with E
        if (this.keyOffered) {
            const bob = Math.sin(this.time * 4) * 3;
            const ky = py - 40 + bob;
            // a small glowing key floating above him
            ctx.fillStyle = '#ffcc44';
            ctx.fillRect(px - 8, ky, 12, 4);
            ctx.beginPath();
            ctx.arc(px - 10, ky + 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#8a5210';
            ctx.beginPath();
            ctx.arc(px - 10, ky + 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc44';
            ctx.fillRect(px + 2, ky + 4, 3, 4);

            const ddx = this.player.x - px, ddy = this.player.y - py;
            if (Math.sqrt(ddx * ddx + ddy * ddy) <= 60) {
                ctx.fillStyle = 'rgba(255, 235, 170, 0.95)';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('[E] take the kitchen key', px, py - 54);
                ctx.textAlign = 'left';
            }
        }

        // side quest marker — bobbing exclamation mark. Side quests are blue;
        // main-story prompts (like the key) stay yellow.
        if (this.sideQuestActive) {
            const bob = Math.sin(this.time * 3) * 4;
            const my = py - 40 + bob;
            ctx.fillStyle = '#4aa3ff';
            ctx.fillRect(px - 3, my - 16, 6, 12);      // stem
            ctx.fillRect(px - 3, my - 1, 6, 5);        // dot
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px - 3, my - 16, 6, 12);
            ctx.strokeRect(px - 3, my - 1, 6, 5);

            // prompt when you're close
            const ddx = this.player.x - px, ddy = this.player.y - py;
            const near = Math.sqrt(ddx * ddx + ddy * ddy) <= 45;
            if (near) {
                ctx.fillStyle = 'rgba(240, 225, 170, 0.95)';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText((this.hasFile && !this.fileGiven) ? '[E] give the file' : '[E] talk', px, py - 52);
                ctx.textAlign = 'left';
            }
        }
    },

    // Jordan (mini-boss) placeholder — big menacing figure, distinct from Armada
    drawJordan(ctx) {
        if (!this.jordanAppeared) return;
        const j = this.jordan;
        const px = j.x + j.w / 2;
        const py = j.y;

        // Defeated — draw him collapsed in the blood instead of standing
        if (j.defeated) {
            ctx.save();
            ctx.translate(px, py + j.h);
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = '#4a1414';
            ctx.fillRect(-26, -20, 52, 70);
            ctx.fillStyle = '#3a1010';
            ctx.fillRect(-26, 10, 52, 6);
            ctx.fillStyle = '#5a3830';
            ctx.fillRect(-12, -40, 24, 22);   // head
            ctx.fillStyle = '#2a1010';
            ctx.fillRect(-32, -18, 12, 26);   // arms sprawled
            ctx.fillRect(20, -18, 12, 26);
            ctx.restore();
            return;
        }

        // State-based tint
        let bodyColor = '#5a1818';
        let windupGlow = false;
        let stunned = false;
        let throwing = false;
        if (j.state === 'windup') {
            // flash red brighter and brighter as the charge approaches
            const f = 1 - (j.stateTimer / j.windupTime);   // 0→1
            const pulse = Math.sin(this.time * 30) > 0 ? 1 : 0.6;
            bodyColor = f > 0.5 && pulse > 0.8 ? '#c83030' : '#8a2424';
            windupGlow = true;
        } else if (j.state === 'charging') {
            bodyColor = '#a02828';
        } else if (j.state === 'stunned') {
            bodyColor = '#4a3030';
            stunned = true;
        } else if (j.state === 'throwing') {
            bodyColor = '#6a2020';
            throwing = true;
        }
        if (j.hitFlash > 0) bodyColor = '#ffaaaa';

        // windup telegraph glow ring on the floor
        if (windupGlow) {
            const f = 1 - (j.stateTimer / j.windupTime);
            ctx.strokeStyle = `rgba(255, 40, 40, ${0.3 + f * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(px, py + j.h, 40 + f * 10, 16, 0, 0, Math.PI * 2);
            ctx.stroke();
            // direction arrow toward the player
            const dx = this.player.x - px;
            const dy = this.player.y - py;
            const a = Math.atan2(dy, dx);
            ctx.strokeStyle = `rgba(255, 80, 80, ${0.4 + f * 0.5})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(px, py + j.h / 2);
            ctx.lineTo(px + Math.cos(a) * 60, py + j.h / 2 + Math.sin(a) * 60);
            ctx.stroke();
        }

        // wobble if stunned
        let wob = 0;
        if (stunned) wob = Math.sin(this.time * 12) * 3;

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(px - 24, py + j.h - 2, 48, 8);
        // body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(px - 26 + wob, py, 52, 78);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(px - 26 + wob, py + 40, 52, 6);   // belt line
        // shoulders
        ctx.fillStyle = bodyColor;
        ctx.fillRect(px - 32 + wob, py + 2, 12, 26);
        ctx.fillRect(px + 20 + wob, py + 2, 12, 26);
        // fists
        ctx.fillStyle = '#3a2020';
        ctx.fillRect(px - 34 + wob, py + 26, 14, 14);
        ctx.fillRect(px + 20 + wob, py + 26, 14, 14);
        // head
        ctx.fillStyle = j.hitFlash > 0 ? '#ffcccc' : '#6a4038';
        ctx.fillRect(px - 12 + wob, py - 20, 24, 22);
        // eyes — stars if stunned, angry red otherwise
        if (stunned) {
            ctx.fillStyle = '#ffdd44';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('x x', px + wob, py - 9);
            ctx.textAlign = 'left';
        } else {
            const ep = 0.6 + Math.sin(this.time * 8) * 0.4;
            ctx.fillStyle = `rgba(255, 40, 40, ${ep})`;
            ctx.fillRect(px - 8 + wob, py - 12, 5, 4);
            ctx.fillRect(px + 3 + wob, py - 12, 5, 4);
        }
        // legs
        ctx.fillStyle = '#3a1414';
        ctx.fillRect(px - 18 + wob, py + 78, 14, 6);
        ctx.fillRect(px + 4 + wob, py + 78, 14, 6);

        // "STUNNED!" tag
        if (stunned) {
            ctx.fillStyle = '#ffee66';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('STUNNED', px, py - 30);
            ctx.textAlign = 'left';
        }

        // throwing tell — a raised arm cocked back
        if (throwing) {
            ctx.fillStyle = '#3a2020';
            ctx.fillRect(px + 22, py - 14, 16, 8);   // raised arm
            ctx.fillStyle = '#cfd6da';
            ctx.fillRect(px + 34, py - 16, 10, 4);   // weapon in hand
        }
    },

    drawArmada(ctx) {
        const a = this.armada;
        if (!a.active) return;

        const cx = a.x + a.w / 2;        // center x of his hitbox
        const feetY = a.y + a.h;          // bottom of his hitbox (his feet)

        // shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.ellipse(cx, feetY - 2, a.w * 0.7, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // ----- choose the sprite for the current state -----
        let sprite = armadaSprites.idle;
        const isDown = (a.state === 'scripted_down' || a.state === 'stunned');

        if (isDown) {
            sprite = armadaSprites.neutralized;
        } else if (a.state === 'breaking') {
            // smashing through the wall
            sprite = armadaSprites.smash;
        } else if (a.attackAnimTimer > 0) {
            // hammer attack: swing1 → swing2 → smash across the timer
            const t = a.attackAnimTimer;   // counts down from 0.6
            if (t > 0.4) sprite = armadaSprites.swing1;
            else if (t > 0.2) sprite = armadaSprites.swing2;
            else sprite = armadaSprites.smash;
        } else if (a.moving) {
            sprite = armadaSprites.walk[a.walkFrame];
        } else {
            sprite = armadaSprites.idle;
        }

        // draw box: scale the sprite to a fixed size, anchored at his feet
        const size = a.spriteSize;
        const drawX = cx - size / 2;
        const drawY = feetY - size + 10;   // +10 so feet sit near the hitbox bottom

        ctx.save();

        // hit flash: draw brighter/red-tinted when recently hit
        if (a.hitFlash > 0) {
            ctx.globalAlpha = 1;
        }

        // face left/right by flipping horizontally (art faces RIGHT by default,
        // so we flip it when he moves left)
        const faceLeft = (a.facing === 'left');
        if (faceLeft) {
            ctx.translate(cx, 0);
            ctx.scale(-1, 1);
            ctx.translate(-cx, 0);
        }

        const spriteReady = sprite && (sprite.loadedFlag || (sprite.complete && sprite.naturalWidth > 0));
        if (spriteReady) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprite, drawX, drawY, size, size);
            // red hit flash overlay
            if (a.hitFlash > 0) {
                ctx.globalAlpha = Math.min(0.6, a.hitFlash * 1.5);
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = '#ff3030';
                ctx.fillRect(drawX, drawY, size, size);
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
            }
        } else {
            // fallback box if sprite hasn't loaded yet
            ctx.fillStyle = a.hitFlash > 0 ? '#ffaaaa' : '#5a3a20';
            ctx.fillRect(cx - a.w / 2, a.y, a.w, a.h);
        }

        ctx.restore();
    },

    drawWallCracks(ctx) {
        const a = this.armada;
        if (a.state !== 'breaking' && a.wallCracks.length === 0) return;
        ctx.strokeStyle = 'rgba(20, 15, 10, 0.9)';
        ctx.lineWidth = 2;
        for (const c of a.wallCracks) {
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(c.x + Math.cos(c.angle) * c.len, c.y + Math.sin(c.angle) * c.len);
            ctx.stroke();
        }
        if (a.state === 'breaking') {
            const pulse = 0.5 + Math.sin(this.time * 20) * 0.5;
            ctx.fillStyle = `rgba(180, 0, 0, ${pulse * 0.15})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    },

    drawDust(ctx) {
        const a = this.armada;
        for (const d of a.dustParticles) {
            ctx.fillStyle = `rgba(180, 160, 140, ${d.life})`;
            ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
        }
    },

    drawArmadaHitCounter(ctx) {
        const a = this.armada;
        if (!a.active || this.currentRoom !== 'room1') return;
        if (a.state !== 'chasing' && a.state !== 'stalking') return;
        const needed = a.state === 'chasing' ? 4 : 15;
        const boxX = canvas.width / 2 - 100;
        const boxY = 90;
        ctx.fillStyle = 'rgba(20, 10, 10, 0.85)';
        ctx.fillRect(boxX, boxY, 200, 22);
        ctx.strokeStyle = '#aa0000';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, 200, 22);
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`ARMADA — ${a.hitsTaken} / ${needed} hits`, boxX + 100, boxY + 15);
        ctx.textAlign = 'left';
    },

    drawScriptedMessage(ctx) {
        const m = this.scriptedMessage;
        const visibleText = m.text.substring(0, m.charIndex);
        const boxW = 700; const boxH = 110;
        const bx = canvas.width / 2 - boxW / 2;
        const by = canvas.height - boxH - 40;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeStyle = '#aa2020';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, boxW, boxH);
        ctx.fillStyle = '#dd8888';
        ctx.font = 'italic 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SADID', bx + 20, by + 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px "Times New Roman"';
        const words = visibleText.split(' ');
        let line = '';
        let yPos = by + 50;
        for (const w of words) {
            const test = line + w + ' ';
            if (ctx.measureText(test).width > boxW - 40) {
                ctx.fillText(line, bx + 20, yPos);
                line = w + ' ';
                yPos += 24;
            } else {
                line = test;
            }
        }
        ctx.fillText(line, bx + 20, yPos);
        if (m.charIndex < m.text.length && Math.sin(this.time * 8) > 0) {
            const cursorX = bx + 20 + ctx.measureText(line).width;
            ctx.fillRect(cursorX, yPos - 14, 2, 16);
        }
    },

    // Doctor dialogue box (bottom, typewriter, line-by-line)
    drawDialogue(ctx) {
        const d = this.dialogue;
        const boxW = 720, boxH = 130;
        const bx = canvas.width / 2 - boxW / 2;
        const by = canvas.height - boxH - 24;
        ctx.fillStyle = 'rgba(8, 8, 12, 0.92)';
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeStyle = '#8a8a70';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, boxW, boxH);
        // speaker name tab
        ctx.fillStyle = '#d8d8c0';
        ctx.fillRect(bx, by - 26, 130, 26);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.speaker, bx + 12, by - 13);
        // the line, typed out so far (word-wrapped)
        const shown = d.lines[d.line].substring(0, d.charIndex);
        ctx.fillStyle = '#e8e8e0';
        ctx.font = '17px "Times New Roman"';
        ctx.textBaseline = 'top';
        this.wrapText(ctx, shown, bx + 20, by + 22, boxW - 40, 24);
        // advance hint once the line is fully shown
        if (d.charIndex >= d.lines[d.line].length) {
            const pulse = 0.5 + Math.sin(this.time * 5) * 0.5;
            ctx.fillStyle = `rgba(230, 230, 190, ${pulse})`;
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'right';
            const last = d.line >= d.lines.length - 1;
            ctx.fillText(last ? 'CLICK to continue' : 'CLICK for next',
                bx + boxW - 16, by + boxH - 20);
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    },

    // simple word-wrap helper for the dialogue box
    wrapText(ctx, text, x, y, maxW, lineH) {
        const words = text.split(' ');
        let line = '';
        let yy = y;
        for (const w of words) {
            const test = line + w + ' ';
            if (ctx.measureText(test).width > maxW && line !== '') {
                ctx.fillText(line, x, yy);
                line = w + ' ';
                yy += lineH;
            } else {
                line = test;
            }
        }
        ctx.fillText(line, x, yy);
    },

    // "JORDAN" name banner sting when he appears
    drawJordanBanner(ctx) {
        const t = this.jordanBannerTime;
        const alpha = Math.min(1, t < 0.5 ? t * 2 : (t > 2.5 ? (3 - t) * 2 : 1));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);
        ctx.fillStyle = '#8a0000';
        ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 3);
        ctx.fillRect(0, canvas.height / 2 + 47, canvas.width, 3);
        ctx.fillStyle = '#e8e8e8';
        ctx.font = 'bold 46px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('JORDAN', canvas.width / 2, canvas.height / 2 - 8);
        ctx.fillStyle = '#a83232';
        ctx.font = 'italic 16px "Times New Roman"';
        ctx.fillText('the thing they made downstairs', canvas.width / 2, canvas.height / 2 + 24);
        ctx.restore();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    },

    // Full-screen aged-paper letter view
    drawLetter(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Paper sheet
        const pw = 640, ph = 500;
        const px = canvas.width / 2 - pw / 2;
        const py = canvas.height / 2 - ph / 2;

        // paper base (aged cream)
        ctx.fillStyle = '#e7dfc7';
        ctx.fillRect(px, py, pw, ph);
        // subtle darker edges (aging/stains)
        ctx.fillStyle = 'rgba(120, 100, 60, 0.18)';
        ctx.fillRect(px, py, pw, 14);
        ctx.fillRect(px, py + ph - 14, pw, 14);
        ctx.fillRect(px, py, 14, ph);
        ctx.fillRect(px + pw - 14, py, 14, ph);
        // a couple of faint blood smears in the corners
        ctx.fillStyle = 'rgba(120, 0, 0, 0.14)';
        ctx.beginPath(); ctx.arc(px + 40, py + 40, 30, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + pw - 60, py + ph - 50, 40, 0, Math.PI * 2); ctx.fill();
        // border
        ctx.strokeStyle = '#8a7a50';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);

        // Text
        ctx.fillStyle = '#2a2118';
        ctx.font = '16px "Times New Roman"';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        let ty = py + 46;
        for (const line of this.letterLines) {
            ctx.fillText(line, px + 40, ty);
            ty += 20;
        }

        // Close hint
        const pulse = 0.6 + Math.sin(this.time * 4) * 0.4;
        ctx.fillStyle = `rgba(230, 220, 190, ${pulse})`;
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press  E  or  ESC  to close', canvas.width / 2, py + ph + 26);
        ctx.textAlign = 'left';
    },

    drawTargetLine(ctx) {
        if (!mouse.rightDown || !this.equippedWeapon) return;
        const weapon = WEAPON_STATS[this.equippedWeapon];
        const dx = mouse.x - this.player.x;
        const dy = mouse.y - this.player.y;
        const angle = Math.atan2(dy, dx);
        const endX = this.player.x + Math.cos(angle) * weapon.range;
        const endY = this.player.y + Math.sin(angle) * weapon.range;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(this.player.x, this.player.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255, 220, 220, 0.7)';
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();
    },

    // The guard's sidearm — side-on, slide and grip
    drawPistol(ctx, px, py) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(px - 9, py + 7, 19, 3);
        // slide
        ctx.fillStyle = '#4a4e55';
        ctx.fillRect(px - 10, py - 4, 20, 6);
        ctx.fillStyle = '#6a6f78';
        ctx.fillRect(px - 10, py - 4, 20, 2);
        // barrel opening
        ctx.fillStyle = '#17191c';
        ctx.fillRect(px + 8, py - 3, 3, 4);
        // frame and trigger guard
        ctx.fillStyle = '#3c4046';
        ctx.fillRect(px - 4, py + 2, 10, 3);
        ctx.strokeStyle = '#3c4046';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + 1, py + 6, 4, Math.PI, Math.PI * 2, true);
        ctx.stroke();
        // grip
        ctx.fillStyle = '#5a4433';
        ctx.fillRect(px - 8, py + 2, 6, 10);
        ctx.fillStyle = '#46352a';
        ctx.fillRect(px - 8, py + 5, 6, 1);
        ctx.fillRect(px - 8, py + 8, 6, 1);
    },

    // A handful of loose rounds
    drawAmmo(ctx, px, py) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(px - 9, py + 7, 18, 3);
        for (let i = 0; i < 3; i++) {
            const x = px - 8 + i * 6;
            const y = py - 2 + (i === 1 ? -2 : 0);
            ctx.fillStyle = '#b98b3a';      // case
            ctx.fillRect(x, y, 4, 9);
            ctx.fillStyle = '#d8ab53';
            ctx.fillRect(x, y, 1, 9);
            ctx.fillStyle = '#8c6b6b';      // the bullet itself
            ctx.fillRect(x, y - 3, 4, 3);
            ctx.fillStyle = '#7a5c26';      // rim
            ctx.fillRect(x, y + 8, 4, 2);
        }
    },

    // The keycard off the guard's belt
    drawKeycard(ctx, px, py) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(px - 9, py + 8, 19, 3);
        ctx.fillStyle = '#d8d3c4';
        ctx.fillRect(px - 9, py - 6, 18, 13);
        ctx.fillStyle = '#7a1f1f';          // the stripe
        ctx.fillRect(px - 9, py - 6, 18, 3);
        ctx.fillStyle = '#2f3b4a';          // chip
        ctx.fillRect(px - 6, py - 1, 6, 5);
        ctx.fillStyle = '#9a958a';          // printed lines
        ctx.fillRect(px + 2, py - 1, 6, 1);
        ctx.fillRect(px + 2, py + 2, 6, 1);
        ctx.strokeStyle = '#a8a294';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - 9, py - 6, 18, 13);
    },

    drawVenom(ctx) {
        for (const p of this.enemyProjectiles) {
            if (!p.isVenom) continue;
            const pulse = 0.65 + Math.sin(this.time * 18) * 0.35;
            ctx.fillStyle = `rgba(150, 220, 110, ${0.35 * pulse})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#9fdd6a';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#d8ffb0';
            ctx.fillRect(p.x - 2, p.y - 2, 3, 3);
        }
    },

    // A green wash while the venom is in you
    drawPoison(ctx) {
        if (!this.player.poison) return;
        const pulse = 0.5 + Math.sin(this.time * 3) * 0.5;
        const g = ctx.createRadialGradient(
            this.player.x, this.player.y, 130,
            this.player.x, this.player.y, 520);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(60, 130, 40, ${0.3 + pulse * 0.15})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = `rgba(160, 230, 120, ${0.6 + pulse * 0.4})`;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('POISONED', canvas.width / 2, 44);
        ctx.textAlign = 'left';
    },

    drawMuzzleFlash(ctx) {
        const m = this.muzzleFlash;
        if (!m || m.life <= 0) return;
        const a = m.life / 0.08;
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.angle);
        ctx.fillStyle = `rgba(255, 233, 160, ${a})`;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(28, -7);
        ctx.lineTo(34, 0);
        ctx.lineTo(28, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    drawProjectiles(ctx) {
        for (const p of this.projectiles) {
            const size = 40;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            if (p.electric) {
                const pulse = 0.6 + Math.sin(this.time * 30) * 0.4;

                // a big soft halo, so it reads instantly as charged
                const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
                halo.addColorStop(0, `rgba(190, 240, 255, ${0.55 * pulse})`);
                halo.addColorStop(0.45, `rgba(90, 180, 255, ${0.30 * pulse})`);
                halo.addColorStop(1, 'rgba(60, 140, 255, 0)');
                ctx.fillStyle = halo;
                ctx.fillRect(-34, -34, 68, 68);

                // white-hot core
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-13, -3, 26, 6);
                ctx.fillStyle = '#bfe9ff';
                ctx.fillRect(-15, -5, 30, 2);
                ctx.fillRect(-15, 3, 30, 2);
                ctx.fillStyle = '#5a4433';
                ctx.fillRect(-17, -4, 6, 8);

                // long arcs whipping off both ends
                for (let k = 0; k < 5; k++) {
                    ctx.strokeStyle = k % 2
                        ? `rgba(255, 255, 255, ${0.7 + pulse * 0.3})`
                        : `rgba(150, 220, 255, ${0.6 + pulse * 0.4})`;
                    ctx.lineWidth = k % 2 ? 1 : 2;
                    ctx.beginPath();
                    let ax = -18 + Math.random() * 6;
                    let ay = (Math.random() - 0.5) * 8;
                    ctx.moveTo(ax, ay);
                    for (let seg = 0; seg < 5; seg++) {
                        ax += 8 + Math.random() * 4;
                        ay = (Math.random() - 0.5) * 24;
                        ctx.lineTo(ax, ay);
                    }
                    ctx.stroke();
                }
                ctx.restore();
                continue;
            }
            if (p.isFreezeShot) {
                const pulse = 0.6 + Math.sin(this.time * 22) * 0.4;
                // the aura
                const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, 20);
                halo.addColorStop(0, `rgba(190, 240, 255, ${0.5 * pulse})`);
                halo.addColorStop(0.5, `rgba(110, 200, 255, ${0.28 * pulse})`);
                halo.addColorStop(1, 'rgba(80, 170, 255, 0)');
                ctx.fillStyle = halo;
                ctx.fillRect(-20, -20, 40, 40);
                // a shard of ice
                ctx.fillStyle = '#eafaff';
                ctx.beginPath();
                ctx.moveTo(7, 0); ctx.lineTo(-4, -4);
                ctx.lineTo(-7, 0); ctx.lineTo(-4, 4);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#9fe8ff';
                ctx.fillRect(-6, -1, 10, 2);
                ctx.restore();
                continue;
            }
            if (p.isBullet) {
                // a small amber spark, not a thrown blade
                const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
                glow.addColorStop(0, 'rgba(255, 190, 90, 0.55)');
                glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
                ctx.fillStyle = glow;
                ctx.fillRect(-7, -7, 14, 14);

                // a short tail that fades out behind it
                const tail = ctx.createLinearGradient(-9, 0, 2, 0);
                tail.addColorStop(0, 'rgba(255, 130, 30, 0)');
                tail.addColorStop(1, 'rgba(255, 196, 96, 0.8)');
                ctx.fillStyle = tail;
                ctx.fillRect(-9, -1, 11, 2);

                // the round itself
                ctx.fillStyle = '#ffb347';
                ctx.fillRect(-1, -1.5, 4, 3);
                ctx.fillStyle = '#fff1cf';
                ctx.fillRect(0, -1, 2, 2);
                ctx.restore();
                continue;
            }
            if (p.weaponId === 'shiv' && shivImageLoaded) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(shivImage, -size / 2, -size / 6, size, size / 3);
            } else {
                ctx.strokeStyle = '#e0eaf0';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-15, 0);
                ctx.lineTo(15, 0);
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(15, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    },

    // Draw permanent blood stains on the floor
    // Which rooms are pitch black and need the flashlight?
    isDarkRoom() {
        return this.currentRoom === 'kitchen';
    },

    // Fills the screen with black, then cuts a cone-shaped hole where the
    // flashlight is pointing. With the light off, the room stays fully dark.
    drawDarkness(ctx) {
        const w = canvas.width, h = canvas.height;

        // The mask is built on its own canvas so cutting the cone out doesn't
        // erase the game art underneath.
        if (!this._darkCanvas) {
            this._darkCanvas = document.createElement('canvas');
            this._darkCanvas.width = w;
            this._darkCanvas.height = h;
        }
        const dctx = this._darkCanvas.getContext('2d');
        dctx.clearRect(0, 0, w, h);

        // solid black over everything
        dctx.fillStyle = 'rgba(0, 0, 0, 0.97)';
        dctx.fillRect(0, 0, w, h);

        if (this.flashlightOn && this.hasFlashlight) {
            const px = this.player.x, py = this.player.y;
            const angle = this.flashlightAngle;
            const range = 300;               // how far the beam reaches
            const spread = Math.PI / 7;      // half-angle of the cone

            dctx.globalCompositeOperation = 'destination-out';

            // the cone itself, fading out toward the end of its reach
            const beam = dctx.createRadialGradient(px, py, 10, px, py, range);
            beam.addColorStop(0,    'rgba(0,0,0,1)');
            beam.addColorStop(0.55, 'rgba(0,0,0,0.92)');
            beam.addColorStop(1,    'rgba(0,0,0,0)');
            dctx.fillStyle = beam;
            dctx.beginPath();
            dctx.moveTo(px, py);
            dctx.arc(px, py, range, angle - spread, angle + spread);
            dctx.closePath();
            dctx.fill();

            // a small pool of spill light right around the player's feet
            const spill = dctx.createRadialGradient(px, py, 4, px, py, 46);
            spill.addColorStop(0, 'rgba(0,0,0,0.85)');
            spill.addColorStop(1, 'rgba(0,0,0,0)');
            dctx.fillStyle = spill;
            dctx.beginPath();
            dctx.arc(px, py, 46, 0, Math.PI * 2);
            dctx.fill();

            dctx.globalCompositeOperation = 'source-over';
        }

        ctx.drawImage(this._darkCanvas, 0, 0);

        // warm tint over the lit cone so it reads as a torch beam
        if (this.flashlightOn && this.hasFlashlight) {
            const px = this.player.x, py = this.player.y;
            const angle = this.flashlightAngle;
            const range = 300;
            const spread = Math.PI / 7;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const warm = ctx.createRadialGradient(px, py, 10, px, py, range);
            warm.addColorStop(0,   'rgba(255, 240, 190, 0.16)');
            warm.addColorStop(0.6, 'rgba(255, 230, 170, 0.06)');
            warm.addColorStop(1,   'rgba(255, 220, 150, 0)');
            ctx.fillStyle = warm;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.arc(px, py, range, angle - spread, angle + spread);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    },

    // Adler — the doctor's colleague, dead in the kitchen
    // Shy enemy placeholder — pale, hunched, eyes catching the torchlight
    drawShyEnemy(ctx, e) {
        const px = Math.round(e.x);
        const py = Math.round(e.y);
        const flash = e.hitFlash > 0;

        if (e.dead) {
            ctx.fillStyle = 'rgba(50, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.ellipse(px, py + 8, 24, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#7a6a60';
            ctx.fillRect(px - 14, py - 2, 28, 12);
            return;
        }

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(px, py + e.h / 2, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // hunched, crawling body — flushed red when enraged
        const skin = flash ? '#ffcccc' : (e.raged ? '#9c5a52' : '#8a8078');
        ctx.fillStyle = skin;
        ctx.fillRect(px - 11, py - 8, 22, 18);        // torso, low to the ground
        ctx.fillStyle = e.raged ? '#7a3c36' : '#6e655e';
        ctx.fillRect(px - 11, py + 4, 22, 5);          // shadowed underside

        // long limbs splayed out
        ctx.fillStyle = skin;
        ctx.fillRect(px - 17, py - 6, 6, 14);
        ctx.fillRect(px + 11, py - 6, 6, 14);
        ctx.fillRect(px - 9, py + 9, 5, 8);
        ctx.fillRect(px + 4, py + 9, 5, 8);

        // head, hung low
        ctx.fillStyle = skin;
        ctx.fillRect(px - 7, py - 17, 14, 11);

        // eyes — wide and reflective, brighter when it's angry
        const glow = e.raged
            ? `rgba(255, 60, 40, ${0.75 + Math.sin(this.time * 12) * 0.25})`
            : `rgba(230, 235, 200, ${0.6 + Math.sin(this.time * 3) * 0.2})`;
        ctx.fillStyle = glow;
        ctx.fillRect(px - 5, py - 13, 3, 3);
        ctx.fillRect(px + 2, py - 13, 3, 3);

        // ribs showing through
        if (!e.raged) {
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.fillRect(px - 9, py - 4, 18, 1);
            ctx.fillRect(px - 9, py - 1, 18, 1);
        }
    },

    // The two lockers in the doctors' lounge
    drawLoungeLockers(ctx) {
        if (this.currentRoom !== 'lounge') return;
        for (const lk of this.lounge.lockers) {
            // body
            ctx.fillStyle = '#4a5560';
            ctx.fillRect(lk.x, lk.y, lk.w, lk.h);
            ctx.fillStyle = lk.opened ? '#14181c' : '#3a444e';
            ctx.fillRect(lk.x + 3, lk.y + 3, lk.w - 6, lk.h - 6);
            if (!lk.opened) {
                // vents
                ctx.fillStyle = '#232a31';
                for (let v = 0; v < 4; v++) {
                    ctx.fillRect(lk.x + 10, lk.y + 10 + v * 7, lk.w - 20, 2);
                }
                // handle
                ctx.fillStyle = '#8a959e';
                ctx.fillRect(lk.x + lk.w - 9, lk.y + lk.h / 2 - 5, 3, 12);
            } else {
                // open, with the door swung aside
                ctx.fillStyle = '#4a5560';
                ctx.fillRect(lk.x - 10, lk.y + 4, 8, lk.h - 8);
            }

            // prompt
            if (this.loungeLockerTarget === lk && !lk.opened) {
                this.drawInteractPrompt(ctx, lk.x + lk.w / 2, lk.y + lk.h + 22, '[E] OPEN LOCKER');
            }
        }
    },

    // Gear dropped by players who died here
    drawLootPiles(ctx) {
        if (typeof netChat === 'undefined' || !netChat.lootInRoom) return;
        const piles = netChat.lootInRoom(this.currentRoom);
        for (const pile of piles) {
            const pulse = 0.5 + Math.sin(this.time * 3) * 0.5;

            // glow so it reads as lootable
            const glow = ctx.createRadialGradient(pile.x, pile.y, 3, pile.x, pile.y, 34);
            glow.addColorStop(0, `rgba(255, 220, 130, ${0.22 + pulse * 0.16})`);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(pile.x - 34, pile.y - 34, 68, 68);

            // a small heap of gear
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.beginPath();
            ctx.ellipse(pile.x, pile.y + 7, 16, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#6a5a44';
            ctx.fillRect(pile.x - 12, pile.y - 4, 24, 10);
            ctx.fillStyle = '#8a7a58';
            ctx.fillRect(pile.x - 12, pile.y - 4, 24, 3);
            ctx.fillStyle = '#cfd6da';
            ctx.fillRect(pile.x - 8, pile.y - 9, 14, 3);
            ctx.fillRect(pile.x + 1, pile.y - 12, 3, 8);

            // owner's name
            ctx.fillStyle = `rgba(230, 210, 160, ${0.55 + pulse * 0.3})`;
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(pile.owner + "'s gear", pile.x, pile.y - 22);

            if (Math.hypot(this.player.x - pile.x, this.player.y - pile.y) < 45) {
                ctx.fillStyle = `rgba(255, 235, 170, ${0.7 + pulse * 0.3})`;
                ctx.font = 'bold 12px monospace';
                ctx.fillText('[E] take', pile.x, pile.y - 36);
            }
            ctx.textAlign = 'left';
        }
    },

    drawColleagueBody(ctx) {
        if (this.currentRoom !== 'kitchen' || !this.colleagueBody) return;
        const b = this.colleagueBody;

        // pooled blood under him
        ctx.fillStyle = 'rgba(60, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + 6, 40, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.PI / 2);   // lying down
        // white coat, filthy
        ctx.fillStyle = '#bdbdb4';
        ctx.fillRect(-10, -6, 20, 26);
        ctx.fillStyle = '#8a1010';
        ctx.fillRect(-10, 2, 20, 6);      // wound across the chest
        // legs
        ctx.fillStyle = '#33333c';
        ctx.fillRect(-7, 20, 6, 14);
        ctx.fillRect(1, 20, 6, 14);
        // arms flung out
        ctx.fillStyle = '#b0b0a8';
        ctx.fillRect(-15, -4, 5, 16);
        ctx.fillRect(10, -4, 5, 16);
        // head
        ctx.fillStyle = '#b98a5e';
        ctx.fillRect(-6, -18, 12, 12);
        ctx.fillStyle = '#2a201a';
        ctx.fillRect(-6, -18, 12, 4);
        ctx.restore();

        // prompt when you're close enough (and the torch is on, so you can see him)
        if (!this.hasLoungeKey) {
            const dx = this.player.x - b.x, dy = this.player.y - b.y;
            if (Math.sqrt(dx * dx + dy * dy) < 55) {
                const pulse = 0.6 + Math.sin(this.time * 5) * 0.4;
                ctx.fillStyle = `rgba(255, 230, 170, ${pulse})`;
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('[E] search the body', b.x, b.y - 34);
                ctx.textAlign = 'left';
            }
        }
    },

    drawBloodStains(ctx) {
        for (const s of this.bloodStains) {
            ctx.fillStyle = 'rgba(90, 0, 0, 0.55)';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(120, 10, 10, 0.5)';
            for (const d of s.drops) {
                ctx.beginPath();
                ctx.arc(s.x + d.dx, s.y + d.dy, d.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    // Draw OTHER players' death spots (from the network) in this room.
    // A darker, distinct pool so you can tell it's another survivor's grave.
    drawNetworkDeaths(ctx) {
        if (typeof netChat === 'undefined' || !netChat.deathsInRoom) return;
        const deaths = netChat.deathsInRoom(this.currentRoom);
        for (const d of deaths) {
            // large dark pool
            ctx.fillStyle = 'rgba(40, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, 28, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(80, 5, 5, 0.6)';
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, 16, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            // a few scattered droplets
            ctx.fillStyle = 'rgba(70, 0, 0, 0.5)';
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2;
                const rr = 22 + (i % 2) * 8;
                ctx.beginPath();
                ctx.arc(d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr * 0.7, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            // faint marker so the player knows it's readable (press E)
            const near = Math.abs(this.player.x - d.x) < 40 && Math.abs(this.player.y - d.y) < 40;
            if (near) {
                ctx.fillStyle = 'rgba(230, 220, 180, 0.9)';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('[E] read', d.x, d.y - 24);
                ctx.textAlign = 'left';
            }
        }
    },

    // Draw spreading blood pools
    drawBloodPools(ctx) {
        for (const pool of this.bloodPools) {
            // dark outer pool
            ctx.fillStyle = 'rgba(70, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.ellipse(pool.x, pool.y, pool.r, pool.r * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            // slightly brighter inner
            ctx.fillStyle = 'rgba(110, 5, 5, 0.6)';
            ctx.beginPath();
            ctx.ellipse(pool.x, pool.y, pool.r * 0.6, pool.r * 0.36, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // Draw severed limbs lying on the floor
    drawGibs(ctx) {
        for (const g of this.gibs) {
            ctx.save();
            ctx.translate(g.x, g.y);
            ctx.rotate(g.rot);
            // small blood smear under the limb
            ctx.fillStyle = 'rgba(90, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.ellipse(0, 3, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            if (g.type === 'arm') {
                // forearm chunk (skin) with a bloody stump
                ctx.fillStyle = '#6a4028';
                ctx.fillRect(-10, -3, 18, 6);
                ctx.fillStyle = '#7a5038';
                ctx.fillRect(-10, -3, 18, 2);
                ctx.fillStyle = '#8a0000';   // bloody stump end
                ctx.fillRect(8, -3, 3, 6);
                // little hand
                ctx.fillStyle = '#6a4028';
                ctx.fillRect(-13, -3, 4, 6);
            } else if (g.type === 'leg') {
                // lower leg chunk
                ctx.fillStyle = '#5a3a28';
                ctx.fillRect(-12, -4, 20, 8);
                ctx.fillStyle = '#6a4838';
                ctx.fillRect(-12, -4, 20, 2);
                ctx.fillStyle = '#8a0000';   // bloody stump end
                ctx.fillRect(8, -4, 3, 8);
                // foot
                ctx.fillStyle = '#3a2818';
                ctx.fillRect(-16, 0, 6, 4);
            } else {
                // severed head — dirty hair on top, face, bloody neck stump
                ctx.fillStyle = '#2a2018';
                ctx.fillRect(-7, -7, 14, 8);       // hair/skull
                ctx.fillStyle = '#7a5a44';
                ctx.fillRect(-6, 0, 12, 6);        // face
                ctx.fillStyle = '#3a2018';
                ctx.fillRect(-4, 2, 2, 2);         // eye
                ctx.fillRect(2, 2, 2, 2);          // eye
                ctx.fillStyle = '#8a0000';
                ctx.fillRect(-4, 6, 8, 3);         // bloody neck stump
            }
            ctx.restore();
        }
    },

    // Draw knives thrown by ranged enemies
    drawEnemyProjectiles(ctx) {
        for (const p of this.enemyProjectiles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            // simple dark blade
            ctx.strokeStyle = '#cfd6da';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(12, 0);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(12, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            // small dark handle
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(-12, -2, 5, 4);
            ctx.restore();
        }
    },

    drawWeaponHUD(ctx) {
        if (!this.equippedWeapon) {
            ctx.fillStyle = '#666';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('NO WEAPON', canvas.width - 20, 55);
            ctx.textAlign = 'left';
            return;
        }
        const weapon = WEAPON_STATS[this.equippedWeapon];
        const dur = this.weaponDurability[this.equippedWeapon] || 0;
        const boxX = canvas.width - 130;
        const boxY = 40;
        ctx.fillStyle = 'rgba(20, 10, 10, 0.85)';
        ctx.fillRect(boxX, boxY, 110, 40);
        ctx.strokeStyle = '#5a1010';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, 110, 40);
        ctx.fillStyle = '#ffcc44';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(this.equippedWeapon.toUpperCase(), boxX + 10, boxY + 15);
        const durFrac = dur / weapon.durabilityMax;
        ctx.fillStyle = '#2a0808';
        ctx.fillRect(boxX + 10, boxY + 22, 90, 8);
        ctx.fillStyle = durFrac > 0.5 ? '#66aa44' : (durFrac > 0.25 ? '#dd8822' : '#aa2020');
        ctx.fillRect(boxX + 10, boxY + 22, 90 * durFrac, 8);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        if (weapon.isFreezeGun) {
            // it recharges instead of reloading
            const cd = WEAPON_STATS.freezegun.cooldown;
            const left = Math.max(0, this.attackCooldown);
            if (left > 0) {
                ctx.fillStyle = 'rgba(10,20,30,0.9)';
                ctx.fillRect(boxX + 10, boxY + 22, 90, 8);
                ctx.fillStyle = '#9fe8ff';
                ctx.fillRect(boxX + 10, boxY + 22, 90 * (1 - left / cd), 8);
                ctx.fillStyle = '#9fe8ff';
                ctx.fillText('CHARGING  ' + left.toFixed(1) + 's', boxX + 10, boxY + 38);
            } else {
                ctx.fillStyle = '#bfeaff';
                ctx.fillText('READY', boxX + 10, boxY + 38);
            }
        } else if (weapon.isGun) {
            ctx.fillText(`${dur} / ${weapon.durabilityMax}   +${this.pistolReserve}`,
                         boxX + 10, boxY + 38);
            if (this.reloadTimer > 0) {
                const f = 1 - this.reloadTimer / 1.4;
                ctx.fillStyle = 'rgba(10,6,6,0.9)';
                ctx.fillRect(boxX + 10, boxY + 22, 90, 8);
                ctx.fillStyle = '#ffcc44';
                ctx.fillRect(boxX + 10, boxY + 22, 90 * f, 8);
                ctx.fillStyle = '#ffcc44';
                ctx.fillText('RELOADING', boxX + 10, boxY + 38);
            } else if (dur === 0 && this.pistolReserve > 0) {
                ctx.fillStyle = '#dd8822';
                ctx.fillText('R TO RELOAD', boxX + 10, boxY + 38);
            }
        } else {
            ctx.fillText(`${dur} / ${weapon.durabilityMax}`, boxX + 10, boxY + 38);
        }
    },

    drawDummy(ctx) {
        const d = this.dummy;
        const flash = d.hitFlash > 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(d.x, d.y + d.h + 2, d.w, 4);
        ctx.fillStyle = flash ? '#ffaaaa' : '#5a4a3a';
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = flash ? '#fff' : '#aa2020';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(d.x + 8, d.y + 12);
        ctx.lineTo(d.x + d.w - 8, d.y + d.h - 12);
        ctx.moveTo(d.x + d.w - 8, d.y + 12);
        ctx.lineTo(d.x + 8, d.y + d.h - 12);
        ctx.stroke();
        const barW = d.w;
        const barY = d.y - 10;
        ctx.fillStyle = '#1a0808';
        ctx.fillRect(d.x, barY, barW, 5);
        ctx.fillStyle = '#aa2020';
        ctx.fillRect(d.x, barY, barW * (d.hp / d.maxHp), 5);
        ctx.fillStyle = '#888';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TEST DUMMY', d.x + d.w / 2, d.y - 14);
        ctx.textAlign = 'left';
    },

    // Jordan's boss health bar — three big segments across the bottom
    // Red wash over the screen as Jordan comes apart
    drawGoreFinaleFlash(ctx) {
        const gf = this.goreFinale;
        if (!gf || gf.flash <= 0) return;
        const a = Math.max(0, Math.min(1, gf.flash));
        const g = ctx.createRadialGradient(
            gf.originX, gf.originY, 60,
            gf.originX, gf.originY, 620
        );
        g.addColorStop(0, `rgba(190, 20, 20, ${0.45 * a})`);
        g.addColorStop(1, `rgba(90, 0, 0, ${0.7 * a})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },

    drawJordanHealthBar(ctx) {
        const j = this.jordan;
        if (!j.active || this.currentRoom !== 'lobby') return;
        if (j.defeated && j.barBreakFlash <= -2) return;   // fade out after death

        const barW = 560;
        const barH = 20;
        const bx = canvas.width / 2 - barW / 2;
        const by = canvas.height - 52;
        const gap = 6;
        const segW = (barW - gap * (j.maxBars - 1)) / j.maxBars;

        // name
        ctx.fillStyle = '#d8d8d0';
        ctx.font = 'bold 15px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('JORDAN', canvas.width / 2, by - 8);

        for (let i = 0; i < j.maxBars; i++) {
            const sx = bx + i * (segW + gap);

            // empty socket
            ctx.fillStyle = 'rgba(12, 6, 6, 0.9)';
            ctx.fillRect(sx, by, segW, barH);
            ctx.strokeStyle = 'rgba(90, 70, 50, 0.9)';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, by, segW, barH);

            // how full is this segment? bars break right to left
            const barIndexFromRight = j.maxBars - 1 - i;
            let fill = 0;
            if (barIndexFromRight < j.barsLeft - 1) {
                fill = 1;                                     // untouched
            } else if (barIndexFromRight === j.barsLeft - 1) {
                fill = 1 - (j.hitsInBar / j.hitsPerBar);      // currently draining
            }

            if (fill > 0) {
                const grad = ctx.createLinearGradient(sx, by, sx, by + barH);
                grad.addColorStop(0, '#c62828');
                grad.addColorStop(0.5, '#8e1616');
                grad.addColorStop(1, '#4a0808');
                ctx.fillStyle = grad;
                ctx.fillRect(sx + 2, by + 2, (segW - 4) * fill, barH - 4);
                // highlight
                ctx.fillStyle = 'rgba(255, 110, 110, 0.5)';
                ctx.fillRect(sx + 2, by + 2, (segW - 4) * fill, 2);
            }
        }

        // white flash when a bar breaks
        if (j.barBreakFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${j.barBreakFlash * 0.35})`;
            ctx.fillRect(bx, by, barW, barH);
        }

        // wasted-throw warning so the punish doesn't feel unfair
        if (j.wastedThrows > 0 && !j.defeated) {
            const danger = j.wastedThrows / 5;
            ctx.fillStyle = `rgba(${180 + danger * 75}, ${120 - danger * 90}, 60, 0.9)`;
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`WASTED THROWS  ${j.wastedThrows} / 5`, canvas.width / 2, by + barH + 18);
        }

        ctx.textAlign = 'left';
    },

    // Red edges + label while Jordan's counter-attack has you pinned
    drawPlayerStun(ctx) {
        if (this.player.stunTimer <= 0 || this.raymondScene.active) return;
        const a = Math.min(1, this.player.stunTimer);
        const g = ctx.createRadialGradient(
            this.player.x, this.player.y, 120,
            this.player.x, this.player.y, 520
        );
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(120, 0, 0, ${0.55 * a})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const pulse = 0.6 + Math.sin(this.time * 14) * 0.4;
        ctx.fillStyle = `rgba(255, 230, 100, ${a * pulse})`;
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STUNNED', canvas.width / 2, canvas.height / 2 - 90);
        ctx.textAlign = 'left';
    },

    // Stamina bar — sits under the health bar, drains on dash
    drawStaminaBar(ctx) {
        const pl = this.player;
        const startX = 20;
        const segW = 42, gap = 4;
        const fullW = pl.maxHp * (segW + gap) - gap;   // match health bar width
        const y = 40 + 18 + 8;                          // just below the HP row
        const h = 8;

        ctx.fillStyle = '#07121a';
        ctx.fillRect(startX, y, fullW, h);
        ctx.strokeStyle = '#16303d';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, y, fullW, h);

        const frac = Math.max(0, pl.stamina / pl.maxStamina);
        if (frac > 0) {
            const grad = ctx.createLinearGradient(startX, y, startX, y + h);
            // dims while it's too low to dash
            const low = pl.stamina < 50;
            grad.addColorStop(0, low ? '#3a6a80' : '#5fd8f0');
            grad.addColorStop(1, low ? '#1d3e4d' : '#1f7f99');
            ctx.fillStyle = grad;
            ctx.fillRect(startX + 1, y + 1, (fullW - 2) * frac, h - 2);
        }

        // divider showing where one dash's worth sits
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(startX + fullW / 2, y, 1, h);

        ctx.fillStyle = '#5a7a88';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('STAMINA', startX, y - 2);
    },

    drawHealthBar(ctx) {
        const startX = 20;
        const startY = 40;
        const segW = 42;
        const segH = 18;
        const gap = 4;
        ctx.fillStyle = '#888';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('HP', startX, startY - 6);
        for (let i = 0; i < this.player.maxHp; i++) {
            const bx = startX + i * (segW + gap);
            const by = startY;
            ctx.fillStyle = '#1a0808';
            ctx.fillRect(bx, by, segW, segH);
            ctx.strokeStyle = '#3a1010';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, segW, segH);

            // How full is THIS segment? (supports fractional HP, e.g. 2.5)
            const fill = Math.max(0, Math.min(1, this.player.hp - i));
            if (fill > 0) {
                const innerW = (segW - 4) * fill;   // partial width for half bars
                const grad = ctx.createLinearGradient(bx, by, bx, by + segH);
                grad.addColorStop(0, '#dd2222');
                grad.addColorStop(0.5, '#aa0000');
                grad.addColorStop(1, '#660000');
                ctx.fillStyle = grad;
                ctx.fillRect(bx + 2, by + 2, innerW, segH - 4);
                ctx.fillStyle = 'rgba(255, 80, 80, 0.6)';
                ctx.fillRect(bx + 2, by + 2, innerW, 2);
            }

            // Iframe flash outline on the last partially-filled bar
            if (this.player.iframes > 0 && fill > 0) {
                const flashI = Math.sin(this.time * 20) > 0;
                if (flashI) {
                    ctx.strokeStyle = '#ffee88';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(bx, by, segW, segH);
                }
            }
        }
        ctx.fillStyle = '#aaa';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        // Show fractional HP cleanly (2.5 not 2.5000001)
        const hpText = Number.isInteger(this.player.hp) ? this.player.hp : this.player.hp.toFixed(1);
        ctx.fillText(`${hpText} / ${this.player.maxHp}`,
            startX + this.player.maxHp * (segW + gap) + 4, startY + 14);
    },

    drawDeathScreen(ctx) {
        ctx.fillStyle = `rgba(80, 0, 0, ${this.deathFade * 0.85})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `rgba(0, 0, 0, ${this.deathFade * 0.4})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (this.deathFade < 0.5) return;
        const alpha = Math.min(1, (this.deathFade - 0.5) * 2);
        ctx.textAlign = 'center';
        ctx.font = 'bold 84px "Times New Roman"';
        ctx.fillStyle = `rgba(50, 0, 0, ${alpha})`;
        ctx.fillText('YOU DIED', canvas.width / 2 + 3, canvas.height / 2 + 3);
        ctx.fillStyle = `rgba(120, 0, 0, ${alpha})`;
        ctx.fillText('YOU DIED', canvas.width / 2 + 2, canvas.height / 2 + 2);
        ctx.fillStyle = `rgba(200, 20, 20, ${alpha})`;
        ctx.fillText('YOU DIED', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = `rgba(120, 0, 0, ${alpha})`;
        for (let i = 0; i < 5; i++) {
            const dripX = canvas.width / 2 - 100 + i * 50 + (Math.sin(this.time * 2 + i) * 3);
            const dripLen = 8 + (i % 3) * 6;
            ctx.fillRect(dripX, canvas.height / 2 + 10, 3, dripLen);
        }

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        if (!this.deathWordsSent) {
            // Phase 1: type last words
            ctx.fillStyle = `rgba(200, 180, 180, ${alpha})`;
            ctx.font = '16px monospace';
            ctx.fillText('Leave your last words for those who follow...', cx, cy + 80);

            // input box
            const boxW = 460, boxH = 40;
            const boxX = cx - boxW / 2;
            const boxY = cy + 100;
            ctx.fillStyle = `rgba(0,0,0,${alpha * 0.6})`;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = `rgba(160, 40, 40, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.fillStyle = `rgba(230, 220, 210, ${alpha})`;
            ctx.font = '18px monospace';
            ctx.textAlign = 'left';
            const words = this.deathWords;
            ctx.fillText(words, boxX + 12, boxY + boxH / 2 + 6);
            // cursor
            if (Math.sin(this.time * 6) > 0) {
                const tw = ctx.measureText(words).width;
                ctx.fillRect(boxX + 12 + tw + 2, boxY + 10, 2, boxH - 20);
            }
            ctx.textAlign = 'center';

            ctx.fillStyle = `rgba(180, 140, 140, ${alpha})`;
            ctx.font = '13px monospace';
            ctx.fillText('Press ENTER to carve them (or leave blank)', cx, boxY + boxH + 24);
        } else {
            // Phase 2: restart prompt
            const pulse = 0.6 + Math.sin(this.time * 4) * 0.3;
            ctx.fillStyle = `rgba(255, 100, 100, ${alpha * pulse})`;
            ctx.font = 'bold 18px monospace';
            ctx.fillText('Press ENTER or SPACE to try again', cx, cy + 100);
        }
        ctx.textAlign = 'left';
    },

    drawDrawer(ctx, drawer) {
        const img = drawer.state === 'closed' ? drawerClosedImage : drawerOpenImage;
        const loaded = drawer.state === 'closed' ? drawerClosedLoaded : drawerOpenLoaded;
        if (loaded) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, drawer.x, drawer.y, drawer.w, drawer.h);
        } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(drawer.x, drawer.y, drawer.w, drawer.h);
            ctx.strokeStyle = '#666';
            ctx.strokeRect(drawer.x, drawer.y, drawer.w, drawer.h);
        }
        if (drawer.state === 'closed' && this.drawerPromptTarget === drawer) {
            const pulse = 0.5 + Math.sin(this.time * 5) * 0.5;
            ctx.strokeStyle = `rgba(255, 220, 100, ${0.4 + pulse * 0.4})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(drawer.x - 2, drawer.y - 2, drawer.w + 4, drawer.h + 4);
        }
    },

    drawInteractPrompt(ctx, px, py, text) {
        ctx.font = 'bold 13px monospace';
        const textW = ctx.measureText(text).width;
        const bgW = textW + 20;
        const bgH = 24;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.fillRect(px - bgW / 2, py - bgH / 2, bgW, bgH);
        ctx.strokeStyle = '#aa0000';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - bgW / 2, py - bgH / 2, bgW, bgH);
        const pulse = 0.7 + Math.sin(this.time * 6) * 0.3;
        ctx.fillStyle = `rgba(255, 80, 80, ${pulse})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, px, py);
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
    },

    drawItem(ctx, item) {
        const px = Math.round(item.x);
        const py = Math.round(item.y);
        let popScale = 1;
        if (item.spawnTime !== undefined) {
            const age = this.time - item.spawnTime;
            if (age < 0) return;
            if (age < 0.5) {
                popScale = 0.3 + age * 1.4;
                if (popScale > 1) popScale = 1;
            }
        }
        const pulse = 0.5 + Math.sin(this.time * 3 + px) * 0.5;
        const glowR = 25 + pulse * 5;
        const glowGrad = ctx.createRadialGradient(px, py, 2, px, py, glowR);
        glowGrad.addColorStop(0, `rgba(255, 240, 180, ${0.18 + pulse * 0.1})`);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(px - glowR, py - glowR, glowR * 2, glowR * 2);
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(popScale, popScale);
        ctx.translate(-px, -py);
        if (item.id === 'shard')       this.drawShard(ctx, px, py);
        else if (item.id === 'cloth')  this.drawCloth(ctx, px, py);
        else if (item.id === 'scissors') this.drawScissors(ctx, px, py);
        else if (item.id === 'medicine') this.drawMedicine(ctx, px, py);
        else if (item.id === 'bandages') this.drawBandages(ctx, px, py);
        else if (item.id === 'alcohol') this.drawAlcohol(ctx, px, py);
        else if (item.id === 'shiv') this.drawShivOnFloor(ctx, px, py);
        else if (item.id === 'key' || item.id === 'f3key') this.drawKeyOnFloor(ctx, px, py);
        else if (item.id === 'pistol') this.drawPistol(ctx, px, py);
        else if (item.id === 'ammo') this.drawAmmo(ctx, px, py);
        else if (item.id === 'keycard2' || item.id === 'f2keycard' ||
                 item.id === 'shreyaId') this.drawKeycard(ctx, px, py);
        else if (item.id === 'gamesNote') this.drawLetterOnFloor(ctx, px, py);
        else if (item.id === 'letter' || item.id === 'anomalyLetter') this.drawLetterOnFloor(ctx, px, py);
        else this.drawUnknown(ctx, px, py);
        ctx.restore();
    },

    drawKeyOnFloor(ctx, px, py) {
        const pulse = 0.6 + Math.sin(this.time * 4) * 0.4;
        ctx.fillStyle = `rgba(255, 204, 68, ${pulse})`;
        ctx.fillRect(px - 10, py - 2, 20, 4);
        ctx.beginPath();
        ctx.arc(px - 10, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a5210';
        ctx.beginPath();
        ctx.arc(px - 10, py, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 204, 68, ${pulse})`;
        ctx.fillRect(px + 6, py + 2, 3, 4);
        ctx.fillRect(px + 10, py + 2, 3, 6);
    },

    drawLetterOnFloor(ctx, px, py) {
        const pulse = 0.5 + Math.sin(this.time * 3) * 0.5;
        // soft glow so the player notices it
        const glow = ctx.createRadialGradient(px, py, 2, px, py, 22);
        glow.addColorStop(0, `rgba(240, 230, 200, ${0.25 + pulse * 0.15})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(px - 22, py - 22, 44, 44);
        // folded paper
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(px - 9, py + 7, 20, 3);   // shadow
        ctx.fillStyle = '#e8e2cf';
        ctx.fillRect(px - 9, py - 8, 18, 16);
        ctx.fillStyle = '#d6cfb4';
        ctx.fillRect(px - 9, py - 1, 18, 1);   // fold line
        ctx.fillStyle = '#c8bfa0';
        ctx.fillRect(px - 9, py - 8, 18, 1);
        // faint "ink" lines
        ctx.fillStyle = 'rgba(60,50,40,0.5)';
        ctx.fillRect(px - 6, py - 5, 12, 1);
        ctx.fillRect(px - 6, py - 3, 9, 1);
        ctx.fillRect(px - 6, py + 2, 12, 1);
        ctx.fillRect(px - 6, py + 4, 7, 1);
    },

    drawShivOnFloor(ctx, px, py) {
        if (shivImageLoaded) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(shivImage, px - 20, py - 6, 40, 12);
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(px - 8, py + 7, 18, 3);
            ctx.fillStyle = '#e0eaf0';
            ctx.fillRect(px - 3, py - 8, 4, 10);
            ctx.fillStyle = '#c8c0a8';
            ctx.fillRect(px - 5, py + 2, 8, 6);
        }
    },

    drawShard(ctx, px, py) { ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px-8,py+7,18,3);ctx.fillStyle='#e0eaf0';ctx.fillRect(px-6,py-4,4,12);ctx.fillRect(px-4,py-6,4,14);ctx.fillRect(px-2,py-8,4,16);ctx.fillRect(px+2,py-4,4,12);ctx.fillRect(px+4,py-2,3,8);ctx.fillStyle='#9eb0c0';ctx.fillRect(px-1,py-6,2,12);ctx.fillRect(px+3,py-1,2,6);ctx.fillRect(px-5,py-1,2,6);ctx.fillStyle='#ffffff';ctx.fillRect(px-2,py-6,1,4);ctx.fillRect(px+3,py-1,1,3); },
    drawCloth(ctx, px, py) { ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px-9,py+7,20,3);ctx.fillStyle='#c8c0a8';ctx.fillRect(px-8,py-5,17,12);ctx.fillStyle='#d4ccb5';ctx.fillRect(px-7,py-4,15,10);ctx.fillStyle='#e8e0c8';ctx.fillRect(px-6,py-3,13,3);ctx.fillStyle='#9a9078';ctx.fillRect(px-6,py+1,12,1);ctx.fillStyle='rgba(80,30,10,0.5)';ctx.fillRect(px+3,py-1,3,3); },
    drawScissors(ctx, px, py) { ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px-8,py+7,18,3);ctx.fillStyle='#c8ccd0';ctx.fillRect(px-6,py-8,3,10);ctx.fillRect(px+3,py-8,3,10);ctx.fillStyle='#e0e4e8';ctx.fillRect(px-6,py-8,1,10);ctx.fillRect(px+3,py-8,1,10);ctx.fillStyle='#666';ctx.fillRect(px-2,py+1,4,4);ctx.fillStyle='#333';ctx.fillRect(px-1,py+2,2,2);ctx.fillStyle='#2a2a2a';ctx.fillRect(px-8,py+3,6,5);ctx.fillRect(px+2,py+3,6,5);ctx.fillStyle='#4a4a4a';ctx.fillRect(px-8,py+3,6,1);ctx.fillRect(px+2,py+3,6,1); },
    drawMedicine(ctx, px, py) { ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px-7,py+7,16,3);ctx.fillStyle='#4a2818';ctx.fillRect(px-6,py-4,12,12);ctx.fillStyle='#6a3a24';ctx.fillRect(px-5,py-3,10,10);ctx.fillStyle='#8a5238';ctx.fillRect(px-5,py-3,2,10);ctx.fillStyle='#3a2818';ctx.fillRect(px-3,py-8,6,4);ctx.fillStyle='#dddddd';ctx.fillRect(px-4,py-10,8,3);ctx.fillStyle='#f0f0e0';ctx.fillRect(px-4,py-1,8,5);ctx.fillStyle='#cc0000';ctx.fillRect(px-1,py,2,3);ctx.fillRect(px-2,py+1,4,1); },
    drawBandages(ctx, px, py) { ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px-7,py+7,16,3);ctx.fillStyle='#e8e0c8';ctx.fillRect(px-7,py-5,14,12);ctx.fillStyle='#f4ecd4';ctx.fillRect(px-6,py-4,12,3);ctx.fillStyle='#c8bea0';ctx.fillRect(px-7,py-2,14,1);ctx.fillRect(px-7,py+1,14,1);ctx.fillRect(px-7,py+4,14,1);ctx.fillStyle='#a89878';ctx.fillRect(px-7,py+6,14,1);ctx.fillStyle='rgba(150,0,0,0.6)';ctx.fillRect(px+2,py-2,3,3); },
    drawAlcohol(ctx, px, py) { ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px-6,py+7,14,3);ctx.fillStyle='#8ea0a8';ctx.fillRect(px-5,py-4,10,12);ctx.fillStyle='#c8d8de';ctx.fillRect(px-4,py-3,8,10);ctx.fillStyle='#e0eef0';ctx.fillRect(px-4,py-3,2,10);ctx.fillStyle='#a8b8be';ctx.fillRect(px+2,py-3,2,10);ctx.fillStyle='#6e8088';ctx.fillRect(px-3,py-8,6,4);ctx.fillStyle='#8ea0a8';ctx.fillRect(px-2,py-8,4,4);ctx.fillStyle='#888';ctx.fillRect(px-3,py-11,6,3);ctx.fillStyle='#bbb';ctx.fillRect(px-3,py-11,6,1);ctx.fillStyle='#f0f0e0';ctx.fillRect(px-3,py+1,6,4);ctx.fillStyle='#5a4028';ctx.fillRect(px-2,py+2,4,1);ctx.fillStyle='#ffffff';ctx.fillRect(px-3,py-2,1,3); },
    drawUnknown(ctx, px, py) { ctx.fillStyle='#ff00ff'; ctx.fillRect(px-6,py-6,12,12); },

    // A ring that fills while you hold the attack button for a volley
    drawVolleyCharge(ctx) {
        if (!this.companionsRecruited.guard && !this.companionsRecruited.shreya) return;
        if (this.volleyFired || this.attackHoldTime <= 0.05) return;
        const frac = Math.min(1, this.attackHoldTime / this.volleyChargeTime);
        const p = this.player;
        const charged = this.companionsRecruited.shreya;
        const enough = charged
            ? this.player.stamina >= this.player.maxStamina - 1
            : this.player.stamina >= this.volleyCost;

        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 34, 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = enough ? '#88bbff' : '#aa6666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 34, 12, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();

        if (frac >= 1) {
            ctx.fillStyle = enough ? '#88bbff' : '#aa6666';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(enough ? (charged ? 'CHARGED' : 'VOLLEY') : 'NO STAMINA', p.x, p.y - 52);
            ctx.textAlign = 'left';
        }
    },

    // Fading afterimages left behind by a dash
    drawDashTrail(ctx) {
        const pl = this.player;
        if (!pl.dashTrail || pl.dashTrail.length === 0) return;
        for (const t of pl.dashTrail) {
            const a = Math.max(0, t.life / 0.28) * 0.4;
            ctx.fillStyle = `rgba(140, 170, 220, ${a})`;
            ctx.fillRect(t.x - pl.w / 2, t.y - pl.h / 2, pl.w, pl.h);
        }
    },

    drawPlayer(ctx) {
        const p = this.player;
        const px = Math.round(p.x); const py = Math.round(p.y);
        const SCALE = 2; const px2 = (n) => n * SCALE;
        const iframeFlash = (p.iframes > 0) && (Math.sin(this.time * 30) > 0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(px - px2(8), py + px2(8), px2(16), px2(3));
        const OUTLINE = '#000000';
        const HAIR_DARK = iframeFlash ? '#ff5555' : '#0a0805';
        const HAIR = iframeFlash ? '#ff8888' : '#1a1410';
        const SKIN = iframeFlash ? '#ff9988' : '#5a4030';
        const SKIN_DARK = iframeFlash ? '#dd5555' : '#3a2a20';
        const SKIN_LIGHT = iframeFlash ? '#ffccbb' : '#7a5a44';
        const GLASSES = '#000000';
        const GLASSES_LENS = '#1a1a2a';
        const SHIRT_COLLAR = iframeFlash ? '#ffcccc' : '#dcdcdc';
        const JACKET = iframeFlash ? '#ff6666' : '#2c2f44';
        const JACKET_DARK = iframeFlash ? '#dd4444' : '#1c1e2c';
        const JACKET_LIGHT = iframeFlash ? '#ff8888' : '#3a3e58';
        const BELT = iframeFlash ? '#aa3333' : '#1a1108';
        const PANTS = iframeFlash ? '#dd5555' : '#2a2418';
        const PANTS_DARK = iframeFlash ? '#aa3333' : '#1a1408';
        const SHOES = iframeFlash ? '#883333' : '#0a0805';
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - px2(6), py - px2(18), px2(12), px2(11));
        if (p.facing === 'down') {
            ctx.fillStyle = HAIR_DARK; ctx.fillRect(px - px2(5), py - px2(18), px2(10), px2(5));
            ctx.fillStyle = HAIR; ctx.fillRect(px - px2(4), py - px2(17), px2(8), px2(2));
            ctx.fillStyle = SKIN; ctx.fillRect(px - px2(5), py - px2(13), px2(10), px2(6));
            ctx.fillStyle = SKIN_LIGHT; ctx.fillRect(px - px2(4), py - px2(13), px2(8), px2(1));
            ctx.fillStyle = GLASSES; ctx.fillRect(px - px2(4), py - px2(11), px2(4), px2(2)); ctx.fillRect(px, py - px2(11), px2(4), px2(2));
            ctx.fillStyle = GLASSES_LENS; ctx.fillRect(px - px2(3), py - px2(10), px2(2), px2(1)); ctx.fillRect(px + px2(1), py - px2(10), px2(2), px2(1));
            ctx.fillStyle = OUTLINE; ctx.fillRect(px - px2(1), py - px2(8), px2(2), px2(1));
        } else if (p.facing === 'up') {
            ctx.fillStyle = HAIR_DARK; ctx.fillRect(px - px2(5), py - px2(18), px2(10), px2(10));
            ctx.fillStyle = HAIR; ctx.fillRect(px - px2(4), py - px2(17), px2(8), px2(2));
        } else if (p.facing === 'left') {
            ctx.fillStyle = HAIR_DARK; ctx.fillRect(px - px2(5), py - px2(18), px2(10), px2(5));
            ctx.fillStyle = HAIR; ctx.fillRect(px - px2(4), py - px2(17), px2(8), px2(2)); ctx.fillRect(px - px2(5), py - px2(13), px2(2), px2(3));
            ctx.fillStyle = SKIN; ctx.fillRect(px - px2(3), py - px2(13), px2(8), px2(6));
            ctx.fillStyle = GLASSES; ctx.fillRect(px - px2(2), py - px2(11), px2(4), px2(2));
        } else {
            ctx.fillStyle = HAIR_DARK; ctx.fillRect(px - px2(5), py - px2(18), px2(10), px2(5));
            ctx.fillStyle = HAIR; ctx.fillRect(px - px2(4), py - px2(17), px2(8), px2(2)); ctx.fillRect(px + px2(3), py - px2(13), px2(2), px2(3));
            ctx.fillStyle = SKIN; ctx.fillRect(px - px2(5), py - px2(13), px2(8), px2(6));
            ctx.fillStyle = GLASSES; ctx.fillRect(px - px2(2), py - px2(11), px2(4), px2(2));
        }
        ctx.fillStyle = OUTLINE; ctx.fillRect(px - px2(3), py - px2(7), px2(6), px2(2));
        ctx.fillStyle = SKIN_DARK; ctx.fillRect(px - px2(2), py - px2(7), px2(4), px2(1));
        ctx.fillStyle = SHIRT_COLLAR; ctx.fillRect(px - px2(3), py - px2(6), px2(2), px2(1)); ctx.fillRect(px + px2(1), py - px2(6), px2(2), px2(1));
        ctx.fillStyle = OUTLINE; ctx.fillRect(px - px2(8), py - px2(5), px2(16), px2(11));
        ctx.fillStyle = JACKET; ctx.fillRect(px - px2(7), py - px2(5), px2(14), px2(11));
        ctx.fillStyle = JACKET_LIGHT; ctx.fillRect(px - px2(7), py - px2(5), px2(3), px2(2)); ctx.fillRect(px + px2(4), py - px2(5), px2(3), px2(2));
        ctx.fillStyle = JACKET_DARK; ctx.fillRect(px - px2(1), py - px2(5), px2(2), px2(11));
        ctx.fillStyle = OUTLINE; ctx.fillRect(px - px2(8), py + px2(6), px2(16), px2(2));
        ctx.fillStyle = BELT; ctx.fillRect(px - px2(7), py + px2(6), px2(14), px2(1));
        ctx.fillStyle = OUTLINE; ctx.fillRect(px - px2(7), py + px2(8), px2(14), px2(8));
        ctx.fillStyle = PANTS; ctx.fillRect(px - px2(6), py + px2(8), px2(12), px2(7));
        ctx.fillStyle = PANTS_DARK; ctx.fillRect(px - 1, py + px2(8), 2, px2(7));
        ctx.fillStyle = OUTLINE; ctx.fillRect(px - px2(7), py + px2(15), px2(6), px2(3)); ctx.fillRect(px + px2(1), py + px2(15), px2(6), px2(3));
        ctx.fillStyle = SHOES; ctx.fillRect(px - px2(6), py + px2(15), px2(5), px2(2)); ctx.fillRect(px + px2(2), py + px2(15), px2(5), px2(2));
    }
};