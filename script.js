import {
    parseGIF,
    decompressFrames
} from "https://esm.sh/gifuct-js@2.1.2";

// ========================================
// 🏪 STORE ELEMENTS
// ========================================

const storeButton =
    document.getElementById("storeButton");

const storeOverlay =
    document.getElementById("storeOverlay");

const closeStore =
    document.getElementById("closeStore");

// ========================================
// ELEMENTS
// ========================================

const canvas =
    document.getElementById("luffyCanvas");

const ctx =
    canvas.getContext("2d");

const noseGif =
    document.getElementById("noseGif");


// Meat elements

const meatButton =
    document.getElementById("meatButton");

const meat =
    document.getElementById("meat");

const meatLustGif =
    document.getElementById("meatLustGif");

const meatDropGif =
    document.getElementById("meatDropGif");

const eatingGif =
    document.getElementById("eatingGif");


// ========================================
// LUFFY STATE
// ========================================

let renderedFrames = [];
let idleFrames = [];

let playing = false;
let nosePlaying = false;
let meatActive = false;
let meatDragging = false;

let idlePlaying = false;
let idleRunId = 0;

let meatPointerId = null;


// ========================================
// LOAD + COMPOSITE ANY GIF
// ========================================

async function loadGifFrames(path) {

    const response =
        await fetch(path);

    if (!response.ok) {
        throw new Error(
            "Could not load " + path
        );
    }

    const buffer =
        await response.arrayBuffer();

    const gif =
        parseGIF(buffer);

    const gifFrames =
        decompressFrames(gif, true);

    const width =
        gif.lsd.width;

    const height =
        gif.lsd.height;


    const tempCanvas =
        document.createElement("canvas");

    tempCanvas.width =
        width;

    tempCanvas.height =
        height;


    const tempCtx =
        tempCanvas.getContext("2d");


    const completeFrames = [];


    for (const frame of gifFrames) {

        let previousFrame = null;


        // Save previous canvas for disposal type 3
        if (
            frame.disposalType === 3
        ) {

            previousFrame =
                tempCtx.getImageData(
                    0,
                    0,
                    width,
                    height
                );

        }


        // Create patch canvas

        const patchCanvas =
            document.createElement("canvas");

        patchCanvas.width =
            frame.dims.width;

        patchCanvas.height =
            frame.dims.height;


        const patchCtx =
            patchCanvas.getContext("2d");


        const imageData =
            new ImageData(
                frame.patch,
                frame.dims.width,
                frame.dims.height
            );


        patchCtx.putImageData(
            imageData,
            0,
            0
        );


        // Draw GIF patch

        tempCtx.drawImage(
            patchCanvas,
            frame.dims.left,
            frame.dims.top
        );


        // Save COMPLETE frame

        completeFrames.push({

            image:
                tempCtx.getImageData(
                    0,
                    0,
                    width,
                    height
                ),

            delay:
                frame.delay || 100

        });


        // GIF disposal

        if (
            frame.disposalType === 2
        ) {

            tempCtx.clearRect(

                frame.dims.left,
                frame.dims.top,

                frame.dims.width,
                frame.dims.height

            );

        }

        else if (
            frame.disposalType === 3 &&
            previousFrame
        ) {

            tempCtx.putImageData(
                previousFrame,
                0,
                0
            );

        }

    }


    return {

        frames:
            completeFrames,

        width:
            width,

        height:
            height

    };
}


// ========================================
// LOAD LUFFY
// ========================================

async function loadLuffy() {
    try {

        const idleData =
            await loadGifFrames(
                "assets/luffy-idle.gif"
            );

        idleFrames = idleData.frames;

        canvas.width = idleData.width;
        canvas.height = idleData.height;


        const slapData =
            await loadGifFrames(
                "assets/luffy-slap.gif"
            );

        renderedFrames =
            slapData.frames;


        console.log(
            "Idle frames:",
            idleFrames.length
        );

        console.log(
            "Slap frames:",
            renderedFrames.length
        );


        playIdle();
        scheduleNosePick();

    } catch (error) {

        console.error(
            "Luffy loading error:",
            error
        );

    }
}


// ========================================
// DRAW SLAP FRAME
// ========================================

function drawFrame(index) {

    if (
        !renderedFrames[index]
    ) {
        return;
    }


    ctx.putImageData(
        renderedFrames[index].image,
        0,
        0
    );

}


// ========================================
// 💬 SPEECH BUBBLE & MOOD
// ========================================

const luffySpeech =
    document.getElementById("luffySpeech");

let speechTimer = null;


function showStatus(message, duration = 1800) {

    clearTimeout(speechTimer);

    luffySpeech.textContent = message;

    luffySpeech.classList.add("show");

    speechTimer = setTimeout(() => {

        luffySpeech.classList.remove("show");

    }, duration);
}

const luffyMood =
    document.getElementById("luffyMood");


function setMood(mood) {
    if (luffyMood) {
        luffyMood.textContent =
            "❤️ Mood: " + mood;
    }
}


// ========================================
// 💤 IDLE ANIMATION
// ========================================

async function playIdle() {

    if (
        idlePlaying ||
        idleFrames.length === 0
    ) {
        return;
    }


    idlePlaying = true;

    const runId =
        ++idleRunId;


    while (
        runId === idleRunId
    ) {

        // Wait while another animation is using Luffy
        if (
            playing ||
            nosePlaying ||
            meatActive
        ) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        50
                    )
            );

            continue;
        }


        // Play every idle frame

        for (
            let i = 0;
            i < idleFrames.length;
            i++
        ) {

            if (
                runId !== idleRunId ||
                playing ||
                nosePlaying ||
                meatActive
            ) {

                break;

            }


            ctx.putImageData(
                idleFrames[i].image,
                0,
                0
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        idleFrames[i].delay
                    )
            );

        }

    }


    idlePlaying = false;

}


// ========================================
// 👃 AUTOMATIC NOSE PICKING
// ========================================

function scheduleNosePick() {
    const delay =
        Math.floor(
            Math.random() * 6000
        ) + 4000;


    setTimeout(
        startNosePick,
        delay
    );

}


function startNosePick() {
    setMood("BUSY");
    showStatus("👃 Hmm...");

    if (
        playing ||
        nosePlaying ||
        meatActive
    ) {

        scheduleNosePick();

        return;

    }


    nosePlaying = true;


    // Stop idle

    idleRunId++;


    // Hide normal Luffy

    canvas.style.visibility =
        "hidden";


    // Show nose GIF

    noseGif.style.visibility =
        "visible";


    setTimeout(
        () => {

            noseGif.style.visibility =
                "hidden";


            canvas.style.visibility =
                "visible";


            nosePlaying = false;


            // Resume idle

            playIdle();


            // Schedule next nose pick

            scheduleNosePick();

        },
        2500
    );

}


/* ========================================
   👋 PAT / 💢 SLAP INTERACTION
======================================== */

let slapRunId = 0;
let lastTapTime = 0;

const SLAP_COMBO_TIME = 650;


/*
 * Play a pat.
 *
 * Your luffy-pat.gif can be added later.
 * Until then, we use the first few frames
 * of the current animation as a temporary
 * placeholder.
 */
async function playPat() {

    const runId = ++slapRunId;

    playing = true;
    idleRunId++;

    showStatus("👋 Hey!");
    setMood("HAPPY");

    const patEnd = Math.min(
        2,
        renderedFrames.length - 1
    );

    for (let i = 0; i <= patEnd; i++) {

        // A newer tap started another animation
        if (runId !== slapRunId) {
            return;
        }

        ctx.putImageData(
            renderedFrames[i].image,
            0,
            0
        );

        await new Promise(resolve =>
            setTimeout(
                resolve,
                renderedFrames[i].delay
            )
        );
    }

    if (runId !== slapRunId) {
        return;
    }

    playing = false;
    playIdle();
}


/* ========================================
   💢 TAP TO SLAP — RESTART ON EVERY TAP
======================================== */


async function playSlap() {
    const runId = ++slapRunId;

    playing = true;
    idleRunId++;

    showStatus("💢 HEY!!");

    // Start directly at the impact
    const startFrame = 6;

    const slapTimings = [
        85,  // frame 6 - impact
        85,  // frame 7 - impact
        75,  // frame 8
        75,  // frame 9
        85,  // frame 10
        100  // frame 11 - finish
    ];

    for (
        let i = startFrame;
        i < renderedFrames.length;
        i++
    ) {
        if (runId !== slapRunId) {
            return;
        }

        ctx.putImageData(
            renderedFrames[i].image,
            0,
            0
        );

        await new Promise(resolve =>
            setTimeout(
                resolve,
                slapTimings[i - startFrame]
            )
        );
    }

    if (runId !== slapRunId) {
        return;
    }

    playing = false;
    playIdle();
}

/* ========================================
   👋 TAP INTERACTION
======================================== */

canvas.addEventListener("pointerdown", (event) => {
    if (nosePlaying || meatActive) return;

    event.preventDefault();

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    if (timeSinceLastTap <= SLAP_COMBO_TIME) {
        playSlap();
    } else {
        playPat();
    }

    lastTapTime = now;
});


// ========================================
// 🍖 MEAT BUTTON
// ========================================

meatButton.addEventListener(
    "click",
    () => {
        setMood("HUNGRY");

        if (
            playing ||
            nosePlaying ||
            meatActive
        ) {
            return;
        }

        // No meat left
        if (meatInventory <= 0) {

            alert(
                "You're out of meat! 🍖\nBuy more from the Store."
            );

            return;
        }

        meatActive = true;

        // Stop idle
        idleRunId++;

        // Hide Luffy
        canvas.style.visibility =
            "hidden";

        // Show hungry animation
        meatLustGif.style.visibility =
            "visible";

        // Button position
        const buttonRect =
            meatButton.getBoundingClientRect();

        // Spawn meat
        meat.style.left =
            (
                buttonRect.left +
                buttonRect.width / 2 -
                30
            ) + "px";

        meat.style.top =
            (
                buttonRect.top -
                70
            ) + "px";

        meat.style.display =
            "flex";

    }
);


// ========================================
// 🍖 START DRAG
// ========================================

meat.addEventListener(
    "pointerdown",
    event => {

        if (
            !meatActive
        ) {
            return;
        }


        meatDragging = true;

        meatPointerId =
            event.pointerId;


        meat.classList.add(
            "dragging"
        );


        meat.setPointerCapture(
            event.pointerId
        );


        moveMeat(event);

    }
);


// ========================================
// 🍖 DRAGGING
// ========================================

meat.addEventListener(
    "pointermove",
    event => {

        if (
            !meatDragging ||
            event.pointerId !== meatPointerId
        ) {

            return;

        }


        moveMeat(event);

    }
);


// ========================================
// MOVE MEAT
// ========================================

function moveMeat(event) {

    meat.style.left =
        (
            event.clientX - 30
        ) + "px";


    meat.style.top =
        (
            event.clientY - 30
        ) + "px";

}


// ========================================
// 🍖 RELEASE MEAT
// ========================================

meat.addEventListener(
    "pointerup",
    event => {

        if (
            !meatDragging ||
            event.pointerId !== meatPointerId
        ) {

            return;

        }


        meatDragging = false;


        meat.classList.remove(
            "dragging"
        );


        if (
            isMeatOverLuffy()
        ) {

            feedLuffy();
            setMood("SATISFIED");

        }

        else {

            dropMeat();

        }

    }
);


// ========================================
// CHECK MEAT → LUFFY
// ========================================

function isMeatOverLuffy() {

    const meatRect =
        meat.getBoundingClientRect();


    const luffyRect =
        canvas.getBoundingClientRect();


    return (

        meatRect.left <
        luffyRect.right &&

        meatRect.right >
        luffyRect.left &&

        meatRect.top <
        luffyRect.bottom &&

        meatRect.bottom >
        luffyRect.top

    );

}


// ========================================
// 😋 SUCCESSFUL FEED
// ========================================

function feedLuffy() {

    showStatus("😋 MEAT!!");

    // Successfully fed → consume 1 meat
    meatInventory--;

    updateMeatInventory();

    meatActive = true;

    // Remove meat
    meat.style.display =
        "none";

    meat.style.pointerEvents =
        "none";


    // Hide hungry animation

    meatLustGif.style.visibility =
        "hidden";


    // Restart eating GIF

    restartGif(
        eatingGif
    );


    eatingGif.style.visibility =
        "visible";


    setTimeout(
        () => {

            eatingGif.style.visibility =
                "hidden";


            canvas.style.visibility =
                "visible";


            meatActive = false;


            meat.style.pointerEvents =
                "auto";


            // Resume idle

            playIdle();

        },
        2000
    );

}


// ========================================
// 😬 MISSED DROP
// ========================================

function dropMeat() {

    meatDragging = false;

    meatActive = true;


    meat.classList.remove(
        "dragging"
    );


    meat.style.pointerEvents =
        "none";


    // Hide hungry animation

    meatLustGif.style.visibility =
        "hidden";


    // Play drop reaction

    restartGif(
        meatDropGif
    );


    meatDropGif.style.visibility =
        "visible";


    // Start falling

    const currentTop =
        parseFloat(
            meat.style.top
        ) || 0;


    meat.style.transition =
        "top 700ms cubic-bezier(.2,.7,.4,1)";


    meat.style.top =
        (
            currentTop + 450
        ) + "px";


    setTimeout(
        () => {

            meat.style.display =
                "none";


            meat.style.pointerEvents =
                "auto";


            meat.style.transition =
                "";


            // Hide drop reaction

            meatDropGif.style.visibility =
                "hidden";


            // Show Luffy

            canvas.style.visibility =
                "visible";


            meatActive = false;


            // Resume idle

            playIdle();

        },
        720
    );

}


// ========================================
// 🔄 RESTART GIF
// ========================================

function restartGif(gif) {

    const originalSrc =
        gif.src;


    gif.src =
        "";


    requestAnimationFrame(
        () => {

            gif.src =
                originalSrc;

        }
    );

}


// ========================================
// INITIAL STATE
// ========================================

noseGif.style.visibility =
    "hidden";

meatLustGif.style.visibility =
    "hidden";

meatDropGif.style.visibility =
    "hidden";

eatingGif.style.visibility =
    "hidden";

meat.style.display =
    "none";


// ========================================
// 🏪 STORE
// ========================================

storeButton.addEventListener(
    "click",
    () => {

        storeOverlay.style.display =
            "flex";

    }
);


closeStore.addEventListener(
    "click",
    () => {

        storeOverlay.style.display =
            "none";

    }
);


// Close when clicking outside panel

storeOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target === storeOverlay
        ) {

            storeOverlay.style.display =
                "none";

        }

    }
);


/* =========================
   MONEY SYSTEM
========================= */

let money = Number(localStorage.getItem("luffyMoney"));

if (isNaN(money)) {
    money = 100;
    localStorage.setItem("luffyMoney", money);
}

const moneyAmount =
    document.getElementById("moneyAmount");


function updateMoneyDisplay() {
    moneyAmount.textContent = money;
}


function addMoney(amount) {

    money += amount;

    localStorage.setItem("luffyMoney", money);

    updateMoneyDisplay();
}


function spendMoney(amount) {

    if (money < amount) {
        return false;
    }

    money -= amount;

    localStorage.setItem("luffyMoney", money);

    updateMoneyDisplay();

    return true;
}


updateMoneyDisplay();


/* =========================
   DAILY SYSTEM
========================= */

const dailyButton =
    document.getElementById("dailyButton");

const dailyOverlay =
    document.getElementById("dailyOverlay");

const closeDaily =
    document.getElementById("closeDaily");

const claimDaily =
    document.getElementById("claimDaily");


const DAILY_REWARD = 50;

const DAY_LENGTH = 24 * 60 * 60 * 1000;


function canClaimDaily() {

    const lastClaim =
        Number(localStorage.getItem("lastDailyClaim"));

    if (!lastClaim) {
        return true;
    }

    return Date.now() - lastClaim >= DAY_LENGTH;
}


function updateDailyButton() {

    if (canClaimDaily()) {

        dailyButton.textContent =
            "🎁 DAILY — READY!";

        claimDaily.disabled = false;

    } else {

        dailyButton.textContent =
            "🎁 DAILY — CLAIMED";

        claimDaily.disabled = true;
    }
}


dailyButton.addEventListener("click", () => {

    dailyOverlay.style.display = "flex";

    updateDailyButton();
});


closeDaily.addEventListener("click", () => {

    dailyOverlay.style.display = "none";
});


dailyOverlay.addEventListener("click", event => {

    if (event.target === dailyOverlay) {
        dailyOverlay.style.display = "none";
    }

});


claimDaily.addEventListener("click", () => {

    if (!canClaimDaily()) {
        return;
    }

    addMoney(DAILY_REWARD);

    localStorage.setItem(
        "lastDailyClaim",
        Date.now()
    );

    claimDaily.textContent = "CLAIMED! ✓";

    claimDaily.disabled = true;

    dailyButton.textContent =
        "🎁 DAILY — CLAIMED";

});


updateDailyButton();


/* =========================
   🍖 MEAT INVENTORY
========================= */

let meatInventory =
    Number(localStorage.getItem("luffyMeat"));

if (isNaN(meatInventory)) {
    meatInventory = 0;
}

const meatAmount =
    document.getElementById("meatAmount");


function updateMeatInventory() {

    localStorage.setItem(
        "luffyMeat",
        meatInventory
    );

    meatAmount.textContent =
        meatInventory;
}


updateMeatInventory();


// ========================================
// 🏪 BUY MEAT
// ========================================

const buyMeat =
    document.getElementById("buyMeat");

buyMeat.addEventListener(
    "click",
    () => {

        if (!spendMoney(25)) {

            alert("Not enough Berries! 💰");

            return;
        }

        meatInventory += 5;

        updateMeatInventory();

        buyMeat.textContent =
            "BOUGHT ✓";

        setTimeout(() => {

            buyMeat.textContent =
                "BUY";

        }, 1000);

    }
);


// ========================================
// 🚀 START WEBSITE
// ========================================

loadLuffy();

/* ========================================
   🌙 SETTINGS MENU
======================================== */

const settingsButton =
    document.getElementById("settingsButton");

const settingsOverlay =
    document.getElementById("settingsOverlay");

const closeSettings =
    document.getElementById("closeSettings");


function openSettings() {
    settingsOverlay.classList.add("show");
    settingsButton.classList.add("hidden");
}


function closeSettingsMenu() {
    settingsOverlay.classList.remove("show");
    settingsButton.classList.remove("hidden");
}


/* Open settings */

settingsButton.addEventListener("click", (event) => {
    event.stopPropagation();

    openSettings();
});


/* Close with X */

closeSettings.addEventListener("click", () => {
    closeSettingsMenu();
});


/* Click outside the drawer */

settingsOverlay.addEventListener("click", (event) => {

    if (event.target === settingsOverlay) {
        closeSettingsMenu();
    }

});


/* ========================================
   SETTINGS OPTIONS
======================================== */

document
    .getElementById("settingsHome")
    .addEventListener("click", () => {

        closeSettingsMenu();

    });


document.getElementById("settingsHelp").addEventListener("click", () => {
    window.location.href = "help.html";
});


document.getElementById("settingsHowTo").addEventListener("click", () => {
    window.location.href = "how-to-use.html";
});


document.getElementById("settingsDiscord").addEventListener("click", () => {
    window.location.href = "support.html";
});