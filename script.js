// Game board setup
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

// Game elements
const images = {
    wall: new Image(),
    blueGhost: new Image(),
    orangeGhost: new Image(),
    pinkGhost: new Image(),
    redGhost: new Image(),
    pacmanUp: new Image(),
    pacmanDown: new Image(),
    pacmanLeft: new Image(),
    pacmanRight: new Image()
};

// Game state
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X       X    X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O       bpo       O",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X  X     P     X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R'];
let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;
let gameStarted = false;
let difficulty = "medium";
let playerName = "Player";
let ghostSpeed = tileSize / 4;
let gameInterval;
let levelTimeLimit = 120;
let timeLeft = levelTimeLimit;
let timerInterval;
let gameWon = false;

// DOM elements
const dom = {
    startScreen: document.getElementById("start-screen"),
    howToPlayScreen: document.getElementById("how-to-play"),
    difficultyScreen: document.getElementById("difficulty-screen"),
    nameScreen: document.getElementById("name-screen"),
    winScreen: document.getElementById("win-screen"),
    highScoresTable: document.getElementById("high-scores"),
    playerNameInput: document.getElementById("player-name"),
    gameOverlay: document.getElementById("game-overlay"),
    scoreDisplay: document.getElementById("score-display"),
    livesDisplay: document.getElementById("lives-display"),
    levelDisplay: document.getElementById("level-display"),
    timerDisplay: document.getElementById("timer-display"),
    playerDisplay: document.getElementById("player-display"),
    difficultyDisplay: document.getElementById("difficulty-display"),
    winMessage: document.getElementById("win-message"),
    winTitle: document.getElementById("win-title"),
    scoresBody: document.getElementById("scores-body")
};

// Mobile controls
const mobileControls = {
    up: document.getElementById("up-btn"),
    down: document.getElementById("down-btn"),
    left: document.getElementById("left-btn"),
    right: document.getElementById("right-btn")
};

// Initialize game
window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Set up event listeners
    setupEventListeners();
    
    // Load images
    loadImages();
    
    // Check if mobile device
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        document.getElementById("mobile-controls").style.display = "flex";
    }
};

function setupEventListeners() {
    document.getElementById("start-btn").addEventListener("click", showDifficultyScreen);
    document.getElementById("how-to-play-btn").addEventListener("click", showHowToPlay);
    document.getElementById("high-scores-btn").addEventListener("click", showHighScores);
    document.getElementById("back-btn").addEventListener("click", showStartScreen);
    document.getElementById("difficulty-back-btn").addEventListener("click", showStartScreen);
    document.getElementById("name-back-btn").addEventListener("click", showDifficultyScreen);
    document.getElementById("start-game-btn").addEventListener("click", startGame);
    document.getElementById("play-again-btn").addEventListener("click", restartGame);
    document.getElementById("main-menu-btn").addEventListener("click", returnToMainMenu);
    document.getElementById("close-scores-btn").addEventListener("click", closeHighScores);
    
    // Mobile controls
    mobileControls.up.addEventListener("touchstart", () => movePacman({code: "ArrowUp"}), {passive: false});
    mobileControls.down.addEventListener("touchstart", () => movePacman({code: "ArrowDown"}), {passive: false});
    mobileControls.left.addEventListener("touchstart", () => movePacman({code: "ArrowLeft"}), {passive: false});
    mobileControls.right.addEventListener("touchstart", () => movePacman({code: "ArrowRight"}), {passive: false});
    
    // Keyboard controls
    document.addEventListener("keyup", movePacman);

    // Difficulty buttons
    document.querySelectorAll(".difficulty-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            difficulty = this.dataset.difficulty;
            showNameScreen();
        });
    });
}

function loadImages() {
    images.wall.src = "wall.png";
    images.blueGhost.src = "blueGhost.png";
    images.orangeGhost.src = "orangeGhost.png";
    images.pinkGhost.src = "pinkGhost.png";
    images.redGhost.src = "redGhost.png";
    images.pacmanUp.src = "pacmanUp.png";
    images.pacmanDown.src = "pacmanDown.png";
    images.pacmanLeft.src = "pacmanLeft.png";
    images.pacmanRight.src = "pacmanRight.png";
}

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const tileMapChar = tileMap[r][c];
            const x = c * tileSize;
            const y = r * tileSize;

            switch(tileMapChar) {
                case 'X':
                    walls.add(new Block(images.wall, x, y, tileSize, tileSize));
                    break;
                case 'b':
                    ghosts.add(new Block(images.blueGhost, x, y, tileSize, tileSize));
                    break;
                case 'o':
                    ghosts.add(new Block(images.orangeGhost, x, y, tileSize, tileSize));
                    break;
                case 'p':
                    ghosts.add(new Block(images.pinkGhost, x, y, tileSize, tileSize));
                    break;
                case 'r':
                    ghosts.add(new Block(images.redGhost, x, y, tileSize, tileSize));
                    break;
                case 'P':
                    pacman = new Block(images.pacmanRight, x, y, tileSize, tileSize);
                    break;
                case ' ':
                    foods.add(new Block(null, x + 14, y + 14, 4, 4));
                    break;
            }
        }
    }
}

function update() {
    if (gameOver) return;
    
    move();
    draw();
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Draw walls
    walls.forEach(wall => context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height));

    // Draw food
    context.fillStyle = "white";
    foods.forEach(food => context.fillRect(food.x, food.y, food.width, food.height));

    // Draw ghosts
    ghosts.forEach(ghost => context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height));

    // Draw pacman
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);

    // Update displays
    dom.scoreDisplay.textContent = `SCORE: ${score}`;
    dom.livesDisplay.textContent = `LIVES: ${lives}`;
    dom.levelDisplay.textContent = `LEVEL: ${level}`;
    dom.timerDisplay.textContent = `TIME: ${timeLeft}`;
    dom.playerDisplay.textContent = playerName;
    dom.difficultyDisplay.textContent = difficulty.toUpperCase();
}

function move() {
    // Move pacman
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    // Wall collision for pacman
    if ([...walls].some(wall => collision(pacman, wall))) {
        pacman.x -= pacman.velocityX;
        pacman.y -= pacman.velocityY;
    }

    // Wrap around tunnel
    if (pacman.x + pacman.width < 0) {
        pacman.x = boardWidth;
    } else if (pacman.x > boardWidth) {
        pacman.x = -pacman.width;
    }

    // Ghost movement and collision
    ghosts.forEach(ghost => {
        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;

        // Wall collision for ghost
        if ([...walls].some(wall => collision(ghost, wall)) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
            ghost.x -= ghost.velocityX;
            ghost.y -= ghost.velocityY;
            ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
        }

        // Ghost-pacman collision
        if (collision(ghost, pacman)) {
            lives--;
            if (lives <= 0) {
                gameOver = true;
                endGame(false);
                return;
            }
            resetPositions();
        }
    });

    // Food collection
    foods.forEach(food => {
        if (collision(pacman, food)) {
            foods.delete(food);
            score += 10;
        }
    });

    // Level completion
    if (foods.size === 0) {
        levelComplete();
    }
}

function movePacman(e) {
    if (gameOver || !gameStarted) return;

    switch(e.code) {
        case "ArrowUp":
        case "KeyW":
            pacman.updateDirection('U');
            pacman.image = images.pacmanUp;
            break;
        case "ArrowDown":
        case "KeyS":
            pacman.updateDirection('D');
            pacman.image = images.pacmanDown;
            break;
        case "ArrowLeft":
        case "KeyA":
            pacman.updateDirection('L');
            pacman.image = images.pacmanLeft;
            break;
        case "ArrowRight":
        case "KeyD":
            pacman.updateDirection('R');
            pacman.image = images.pacmanRight;
            break;
    }
}

function collision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    ghosts.forEach(ghost => {
        ghost.reset();
        ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
    });
}

function levelComplete() {
    level++;
    timeLeft = levelTimeLimit;
    clearInterval(timerInterval);
    startTimer();
    
    // Increase difficulty
    ghostSpeed = Math.min(ghostSpeed + 1, tileSize / 2);
    
    loadMap();
    resetPositions();

    // Check for win condition (after level 3 for example)
    if (level > 3) {
        gameWon = true;
        endGame(true);
    }
}

function startGame() {
    playerName = dom.playerNameInput.value.trim() || "Player";
    dom.gameOverlay.style.display = "none";
    gameStarted = true;
    gameOver = false;
    gameWon = false;
    score = 0;
    lives = 3;
    level = 1;
    
    // Set difficulty
    switch(difficulty) {
        case "easy":
            ghostSpeed = tileSize / 5;
            levelTimeLimit = 150;
            break;
        case "medium":
            ghostSpeed = tileSize / 4;
            levelTimeLimit = 120;
            break;
        case "hard":
            ghostSpeed = tileSize / 3;
            levelTimeLimit = 90;
            break;
    }
    timeLeft = levelTimeLimit;
    
    loadMap();
    resetPositions();
    
    // Start game loop
    clearInterval(gameInterval);
    gameInterval = setInterval(update, 1000/20); // 20 FPS
    
    // Start timer
    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        dom.timerDisplay.textContent = `TIME: ${timeLeft}`;
        if (timeLeft <= 0) {
            lives--;
            if (lives <= 0) {
                endGame(false);
            } else {
                resetPositions();
                timeLeft = levelTimeLimit;
            }
        }
    }, 1000);
}

function endGame(won) {
    gameOver = true;
    gameStarted = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    
    if (won) {
        dom.winTitle.textContent = "CONGRATULATIONS!";
        dom.winMessage.textContent = `You completed all levels! Final Score: ${score}`;
    } else {
        dom.winTitle.textContent = "GAME OVER";
        dom.winMessage.textContent = `Final Score: ${score}`;
    }
    
    dom.winScreen.style.display = "block";
    dom.gameOverlay.style.display = "flex";
    
    saveHighScore();
}

function restartGame() {
    dom.winScreen.style.display = "none";
    startGame();
}

function returnToMainMenu() {
    dom.winScreen.style.display = "none";
    showStartScreen();
}

function saveHighScore() {
    let scores = JSON.parse(localStorage.getItem("pacmanHighScores")) || [];
    scores.push({
        name: playerName,
        score: score,
        difficulty: difficulty,
        date: new Date().toLocaleDateString()
    });
    
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10);
    localStorage.setItem("pacmanHighScores", JSON.stringify(scores));
}

function showHighScores() {
    const scores = JSON.parse(localStorage.getItem("pacmanHighScores")) || [];
    dom.scoresBody.innerHTML = "";
    
    scores.forEach((score, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.name}</td>
            <td>${score.score}</td>
            <td>${score.difficulty.toUpperCase()}</td>
            <td>${score.date}</td>
        `;
        dom.scoresBody.appendChild(row);
    });
    
    dom.highScoresTable.style.display = "block";
    dom.gameOverlay.style.display = "flex";
}

function closeHighScores() {
    dom.highScoresTable.style.display = "none";
    dom.gameOverlay.style.display = gameStarted ? "none" : "flex";
}

function showStartScreen() {
    dom.startScreen.style.display = "block";
    dom.howToPlayScreen.style.display = "none";
    dom.difficultyScreen.style.display = "none";
    dom.nameScreen.style.display = "none";
    dom.winScreen.style.display = "none";
}

function showHowToPlay() {
    dom.startScreen.style.display = "none";
    dom.howToPlayScreen.style.display = "block";
}

function showDifficultyScreen() {
    dom.startScreen.style.display = "none";
    dom.difficultyScreen.style.display = "block";
}

function showNameScreen() {
    dom.difficultyScreen.style.display = "none";
    dom.nameScreen.style.display = "block";
}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.startX = x;
        this.startY = y;
        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateDirection(direction) {
        this.direction = direction;
        this.updateVelocity();
    }

    updateVelocity() {
        switch(this.direction) {
            case 'U':
                this.velocityX = 0;
                this.velocityY = -ghostSpeed;
                break;
            case 'D':
                this.velocityX = 0;
                this.velocityY = ghostSpeed;
                break;
            case 'L':
                this.velocityX = -ghostSpeed;
                this.velocityY = 0;
                break;
            case 'R':
                this.velocityX = ghostSpeed;
                this.velocityY = 0;
                break;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
    }
}
