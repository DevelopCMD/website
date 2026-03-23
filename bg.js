const MIN_DELAY = 0.45;  // minimum seconds between spawns
const MAX_DELAY = 1.35;  // maximum seconds between spawns
const TRAVEL_TIME = 6;   // seconds for square to move from bottom -> top
const MAX_SQUARES = 100; // prevent overload

const container = document.createElement("div");
Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "-1",
    background: "#005AF4",
    overflow: "hidden"
});
document.body.appendChild(container);

const images = ["img/bg/s1.png", "img/bg/s2.png"];
const squares = [];
let isVisible = true;

document.addEventListener("visibilitychange", () => {
    isVisible = !document.hidden;
});

// create square function
function createSquare() {
    if (squares.length >= MAX_SQUARES) return;

    const square = document.createElement("img");
    square.src = images[Math.floor(Math.random() * images.length)];

    const size = Math.random() * 80 + 40;
    Object.assign(square.style, {
        position: "absolute",
        width: size + "px",
        height: size + "px",
        opacity: Math.random() * 0.3 + 0.2
    });

    const maxX = window.innerWidth - size;
    const x = Math.random() * maxX;
    const startY = window.innerHeight + size;

    square.style.left = x + "px";
    square.style.top = startY + "px";

    container.appendChild(square);

    squares.push({
        el: square,
        y: startY,
        speed: (window.innerHeight + size * 2) / TRAVEL_TIME
    });
}

// animation loop
let lastTime = performance.now();
function animate(now) {
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    for (let i = squares.length - 1; i >= 0; i--) {
        const s = squares[i];
        s.y -= s.speed * delta;
        s.el.style.top = s.y + "px";

        if (s.y < -150) {
            s.el.remove();
            squares.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

function spawnLoop() {
    if (isVisible) createSquare();
    const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
    setTimeout(spawnLoop, delay * 1000);
}
spawnLoop();