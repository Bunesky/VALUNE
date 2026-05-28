document.addEventListener("click", () => {

    const bgm = document.getElementById("bgm");

    if (bgm.paused) {
        bgm.volume = 0.15;
        bgm.play();
    }

}, { once: true });


// ===============================
//   VALUNE — CARD SYSTEM
// ===============================


// --- PLAYER A DECK ---
const deckA = [
    { hp: 4, maxHp: 4, image: "images/unitA_pawn2.jpg" },
    { hp: 4, maxHp: 4, image: "images/unitA_pawn1.jpg" },
    { hp: 4, maxHp: 4, image: "images/unitA_healer.jpg" },
    { hp: 5, maxHp: 5, image: "images/unitA_elite.jpg" },
    { hp: 6, maxHp: 6, image: "images/unitA_king.jpg" }
];


// --- PLAYER B DECK ---
const deckB = [
    { hp: 4, maxHp: 4, image: "images/unitB_pawn2.jpg" },
    { hp: 4, maxHp: 4, image: "images/unitB_pawn1.jpg" },
    { hp: 4, maxHp: 4, image: "images/unitB_healer.jpg" },
    { hp: 5, maxHp: 5, image: "images/unitB_elite.jpg" },
    { hp: 6, maxHp: 6, image: "images/unitB_king.jpg" }
];


// ===============================
//   TURN VARIABLES
// ===============================

let selectedA = null;
let selectedB = null;

let aGoesFirst = true;

let isResolving = false;


// ===============================
//   SOUNDS
// ===============================

const attackSound = new Audio("sounds/attack.mp3");
const healSound = new Audio("sounds/heal.mp3");
const selectSound = new Audio("sounds/select.mp3");


// ===============================
//   CREATE CARD ELEMENT
// ===============================

function createCardElement(card, player, index) {

    const cardEl = document.createElement("div");

    cardEl.className = "card";

    const img = document.createElement("img");

    img.src = card.image;
    img.className = "card-img";

    cardEl.appendChild(img);

    const hpEl = document.createElement("div");

    hpEl.className = "card-hp";
    hpEl.textContent = "HP: " + card.hp;

    cardEl.appendChild(hpEl);

    if (card.hp <= 0) {
        cardEl.classList.add("dead");
    }

    if (player === "B") {
        cardEl.style.transform = "rotate(180deg)";
    }

    enableCardAction(cardEl, player, index);

    return cardEl;
}


// ===============================
//   PLACE DECK ON BOARD
// ===============================

function placeDeck(deck, player) {

    deck.forEach((card, index) => {

        const slot = document.querySelector(
            `.card-slot[data-player="${player}"][data-index="${index}"]`
        );

        if (slot) {

            const cardEl = createCardElement(card, player, index);

            slot.appendChild(cardEl);
        }
    });
}


// ===============================
//   KING LOCK
// ===============================

function canUseKing(deck) {

    return (
        deck[0].hp <= 0 &&
        deck[1].hp <= 0 &&
        deck[2].hp <= 0 &&
        deck[3].hp <= 0
    );
}


// ===============================
//   CARD ACTIONS
// ===============================

function enableCardAction(cardEl, player, index) {

    cardEl.addEventListener("click", () => {

        if (isResolving) return;

        const deck = player === "A" ? deckA : deckB;

        const card = deck[index];

        if (card.hp <= 0) return;

        if (index === 4 && !canUseKing(deck)) return;

        if (player === "A" && selectedA === null) {

            selectedA = index;

            cardEl.classList.add("selected");

            selectSound.currentTime = 0;
            selectSound.play();

            if (selectedB !== null) {
                resolveTurn();
            }

            return;
        }

        if (player === "B" && selectedB === null) {

            selectedB = index;

            cardEl.classList.add("selected");

            selectSound.currentTime = 0;
            selectSound.play();

            if (selectedA !== null) {
                resolveTurn();
            }

            return;
        }
    });
}


// ===============================
//   RESOLVE TURN
// ===============================

function resolveTurn() {

    if (isResolving) return;

    isResolving = true;

    if (aGoesFirst) {

        performAction(selectedA, "A");

        if (deckB[selectedB].hp > 0) {
            performAction(selectedB, "B");
        }

    } else {

        performAction(selectedB, "B");

        if (deckA[selectedA].hp > 0) {
            performAction(selectedA, "A");
        }
    }

    aGoesFirst = !aGoesFirst;

    setTimeout(() => {

        updateBoard();

        selectedA = null;
        selectedB = null;

        isResolving = false;

        checkGameEnd();

    }, 350);
}


// ===============================
//   EXECUTE ACTION BY TYPE
// ===============================

function performAction(cardIndex, player) {

    const isA = player === "A";

    const enemy = isA ? deckB : deckA;
    const ally = isA ? deckA : deckB;

    switch (cardIndex) {

        case 0:
            attackTwoLowest(enemy, 1);
            break;

        case 1:
            attackLowest(enemy, 1);
            break;

        case 2:
            healLowest(ally, 2);
            break;

        case 3:
            attackLowest(enemy, 2);
            break;

        case 4:
            attackLowest(enemy, 3);
            break;
    }
}


// ===============================
//   VALID TARGETS
// ===============================

function getValidTargets(enemyDeck) {

    const alive = enemyDeck.filter(c => c.hp > 0);

    if (alive.length === 0) {
        return [];
    }

    const nonKingAlive = enemyDeck.filter(
        (card, index) => index !== 4 && card.hp > 0
    );

    if (nonKingAlive.length > 0) {
        return nonKingAlive;
    }

    return [enemyDeck[4]];
}


// ===============================
//   ATTACK LOWEST
// ===============================

function attackLowest(enemyDeck, damage) {

    const targets = getValidTargets(enemyDeck);

    if (targets.length === 0) return;

    const target = targets.reduce((min, c) =>
        c.hp < min.hp ? c : min
    );

    target.hp -= damage;

    if (target.hp < 0) {
        target.hp = 0;
    }

    attackSound.currentTime = 0;
    attackSound.play();

    animateDamage(target, enemyDeck);

    if (target.hp === 0) {
        animateDeath(target, enemyDeck);
    }
}


// ===============================
//   ATTACK TWO LOWEST
// ===============================

function attackTwoLowest(enemyDeck, damage) {

    const targets = getValidTargets(enemyDeck);

    if (targets.length === 0) return;

    const sorted = [...targets].sort((a, b) => a.hp - b.hp);

    const finalTargets = sorted.slice(
        0,
        Math.min(2, sorted.length)
    );

    attackSound.currentTime = 0;
    attackSound.play();

    finalTargets.forEach(target => {

        target.hp -= damage;

        if (target.hp < 0) {
            target.hp = 0;
        }

        animateDamage(target, enemyDeck);

        if (target.hp === 0) {
            animateDeath(target, enemyDeck);
        }
    });
}


// ===============================
//   HEAL LOWEST
// ===============================

function healLowest(allyDeck, amount) {

    const alive = allyDeck.filter(c => c.hp > 0);

    if (alive.length === 0) return;

    const target = alive.reduce((min, c) =>
        c.hp < min.hp ? c : min
    );

    target.hp += amount;

    if (target.hp > target.maxHp) {
        target.hp = target.maxHp;
    }

    healSound.currentTime = 0;
    healSound.play();

    animateHeal(target, allyDeck);
}


// ===============================
//   ANIMATIONS
// ===============================

function animateDamage(targetCard, deck) {

    const index = deck.indexOf(targetCard);

    const player = deck === deckA ? "A" : "B";

    const el = document.querySelector(
        `.card-slot[data-player="${player}"][data-index="${index}"] .card`
    );

    if (!el) return;

    // ⭐ NUEVO EFECTO ROJO (SIN TEMBLOR)
    el.style.transition = "filter 0.25s, box-shadow 0.25s";
    el.style.filter = "brightness(1.6) saturate(2) hue-rotate(-20deg)";
    el.style.boxShadow = "0 0 25px rgba(255,0,0,0.75)";

    setTimeout(() => {
        el.style.filter = "";
        el.style.boxShadow = "";
    }, 250);
}


function animateHeal(targetCard, deck) {

    const index = deck.indexOf(targetCard);

    const player = deck === deckA ? "A" : "B";

    const el = document.querySelector(
        `.card-slot[data-player="${player}"][data-index="${index}"] .card`
    );

    if (!el) return;

    el.classList.add("heal");

    setTimeout(() => {
        el.classList.remove("heal");
    }, 300);
}


function animateDeath(targetCard, deck) {

    const index = deck.indexOf(targetCard);

    const player = deck === deckA ? "A" : "B";

    const el = document.querySelector(
        `.card-slot[data-player="${player}"][data-index="${index}"] .card`
    );

    if (!el) return;

    el.classList.add("dead");
}


// ===============================
//   UPDATE BOARD
// ===============================

function updateBoard() {

    document.querySelectorAll(".card").forEach(el => el.remove());

    placeDeck(deckA, "A");
    placeDeck(deckB, "B");
}


// ===============================
//   CHECK GAME END
// ===============================

function checkGameEnd() {

    const aliveA = deckA.filter(c => c.hp > 0).length;
    const aliveB = deckB.filter(c => c.hp > 0).length;

    const endScreen = document.getElementById("end-screen");
    const endMessage = document.getElementById("end-message");

    if (aliveA === 0 && aliveB === 0) {

        endMessage.textContent = "DRAW";

        endScreen.classList.remove("hidden");

        return;
    }

    if (aliveA === 0) {

        endMessage.textContent = "PLAYER B WINS";

        endScreen.classList.remove("hidden");

        return;
    }

    if (aliveB === 0) {

        endMessage.textContent = "PLAYER A WINS";

        endScreen.classList.remove("hidden");

        return;
    }
}


// ===============================
//   RESTART BUTTON
// ===============================

document
    .getElementById("restart-button")
    .addEventListener("click", () => {

        location.reload();
    });


// ===============================
//   GAME START
// ===============================

placeDeck(deckA, "A");
placeDeck(deckB, "B");
