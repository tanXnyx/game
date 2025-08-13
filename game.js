// --- SPRITE URLs (LOCAL PATHS AS .PNG) ---
const povSightingURL = 'assets/sighting.png';
const povChaseMirrorURL = 'assets/chase_mirror.png';
const povDrivingURL = 'assets/driving.png';
const povBarrackURL = 'assets/view_barrack.png';
const povPostOfficeURL = 'assets/view_post_office.png';
const povCarHidingURL = 'assets/hiding_handprint.png';

// --- ENDING SPRITE URLs (AS .PNG) ---
const endingCrashURL = 'assets/ending_crash.png';
const endingMadnessURL = 'assets/ending_madness.png';
const endingCapturedURL = 'assets/ending_captured.png';
const endingSurvivorURL = 'assets/ending_survivor.png';
const endingTrueURL = 'assets/ending_true.png';


// --- GAME STATE VARIABLES ---
let sanity = 100;
let fuel = 80;
let carCondition = 100;
let gameTime = 137; // 2:17 AM
let inventory = {};
let gameActive = true;
let gameInterval;

// --- HTML ELEMENT REFERENCES ---
const statusBar = document.getElementById('status-bar');
const spriteDisplay = document.getElementById('sprite-display');
const storyText = document.getElementById('story-text');
const choicesDiv = document.getElementById('choices');

// --- HELPER FUNCTIONS ---
function updateStatus() {
    const hours = Math.floor(gameTime / 60);
    const minutes = gameTime % 60;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} AM`;
    statusBar.textContent = `TIME: ${formattedTime} | SANITY: ${sanity}% | FUEL: ${fuel}% | CAR: ${carCondition}%`;
}

function updateStory(text) {
    storyText.innerHTML = text;
}

function showSprite(url, isGlitch = false) {
    spriteDisplay.style.backgroundImage = `url('${url}')`;
    spriteDisplay.classList.toggle('glitch', isGlitch);
}

function clearChoices() {
    choicesDiv.innerHTML = '';
}

function addChoice(text, action, disabled = false) {
    const button = document.createElement('button');
    button.classList.add('choice-btn');
    button.textContent = text;
    button.disabled = disabled;
    if(disabled) {
        button.style.cursor = 'not-allowed';
        button.style.opacity = 0.5;
    }
    button.onclick = () => {
        if (gameActive && !disabled) {
            action();
        }
    };
    choicesDiv.appendChild(button);
}

function updateStats(sanityChange = 0, fuelChange = 0, carChange = 0) {
    if (!gameActive) return true; 

    sanity = Math.max(0, sanity - sanityChange);
    fuel = Math.max(0, fuel - fuelChange);
    carCondition = Math.max(0, carCondition - carChange);
    
    updateStatus();

    if (sanity <= 0) {
        endGame("sanity");
        return true; 
    }
    if (carCondition <= 0) {
        endGame("crash");
        return true; 
    }
    if (fuel <= 0 && carCondition > 10) {
        carCondition = 10;
        updateStory("The car sputters and dies. You're out of fuel, stranded in the dark.");
        setTimeout(onFootPath, 3000);
        return true; 
    }
    return false; 
}


function tick() {
    if (!gameActive) {
        clearInterval(gameInterval);
        return;
    }
    gameTime++;
    updateStatus();
    if (gameTime >= 284) {
        endGame("survived");
    }
}

// --- GAME SCENES ---

function startGame() {
    showSprite(povSightingURL);
    updateStory("You see a woman standing in the road ahead. She seems... familiar. What do you do?");
    updateStatus();

    clearChoices();
    addChoice("Speed past her.", drivePastPath);
    addChoice("Stop the car.", stopCarPath);
}

function drivePastPath() {
    showSprite(povDrivingURL);
    updateStory("You floor it, speeding past the spot where she stood. A glance in the rearview mirror reveals a terrifying sight...");
    if (updateStats(10, 5, 0)) return;
    clearChoices();
    setTimeout(() => {
        if (!gameActive) return;
        showSprite(povChaseMirrorURL, true);
        updateStory("She's right behind you! The car feels colder. A soft <i>*TAP... TAP...*</i> starts on the roof.");
        setTimeout(chaseSequence, 4000);
    }, 3000);
}

function stopCarPath() {
    showSprite(povSightingURL);
    updateStory(`You stop. She approaches and whispers a name that sounds like an echo... "Rohan..." Then, the engine dies. You're stranded.`);
    carCondition = 10;
    if (updateStats(10, 0, 0)) return;
    clearChoices();
    setTimeout(onFootPath, 4000);
}

function chaseSequence() {
    if (!gameActive) return;
    showSprite(povChaseMirrorURL, true);
    updateStory("She's keeping pace, her horrifying face reflected in your mirror! The whispers are clawing at your mind.");
    if (updateStats(10, 5, 0)) return;

    clearChoices();
    addChoice("Swerve to shake her!", () => {
        updateStory("You yank the wheel! The car screeches, but she's still there.");
        if (updateStats(5, 2, 20)) return;
        setTimeout(chaseSequence, 3000);
    });
    addChoice("Focus and drive faster!", () => {
        updateStory("You stare at the road, but her image is burned into your mind. The psychological toll is immense.");
        if (updateStats(15, 2, 0)) return;
        setTimeout(chaseSequence, 3000);
    });
}

// THIS FUNCTION IS NOW MODIFIED WITH THE NEW RISK SYSTEM
function onFootPath() {
    if (!gameActive) return;
    showSprite(povDrivingURL); 
    
    if (inventory.hasClue && !inventory.hasLocket) {
        updateStory("You remember her name... Anjali. You know you need to find her locket. Where could it be?");
    } else {
        updateStory("You're on your own. The night is alive with sounds. What's your next move?");
    }
    
    if (updateStats(5)) return;
    
    clearChoices();
    addChoice("Search abandoned barrack", () => showScene(povBarrackURL, "You approach the dark, imposing barrack...", searchBarrack), inventory.hasLocket);
    
    // THIS IS THE NEW "HIDE IN CAR" LOGIC
    addChoice("Hide in the car", () => {
        updateStory("You lock the doors, holding your breath and listening to the suffocating silence...");
        clearChoices(); // Clear choices to build suspense

        setTimeout(() => {
            // High risk for hiding! 50% chance of being captured.
            if (Math.random() < 0.50) {
                endGame("captured");
            } else {
                // If you survive the gamble, the handprint appears.
                showSprite(povCarHidingURL);
                updateStory("You exhale, thinking you're safe... but then a handprint appears on the glass. You are not alone in here.");
                if (updateStats(20)) return;
                
                // Add a button to continue after the scare
                addChoice("I have to get out.", onFootPath);
            }
        }, 3000); // 3-second suspenseful delay
    });

    addChoice("Search old post office", () => showScene(povPostOfficeURL, "You stand before the vine-covered, decaying post office...", searchPostOffice), inventory.hasClue);
}

function showScene(url, text, nextAction) {
    showSprite(url);
    updateStory(text);
    clearChoices();

    // 25% chance of being caught when exploring
    if (Math.random() < 0.25) {
        setTimeout(() => endGame("captured"), 2000);
    } else {
        setTimeout(nextAction, 3000);
    }
}

function searchBarrack() {
    updateStory("Inside, you find a working spark plug and a tarnished locket! It feels warm to the touch, familiar... A cold gust of wind slams the door shut.");
    inventory.hasSparkPlug = true;
    inventory.hasLocket = true;
    if (updateStats(15)) return;
    clearChoices();
    addChoice("Return to the car", backToCar);
}

function searchPostOffice() {
    clearChoices();
    updateStory("You push open the door to the decaying post office. The air is thick with the smell of wet paper and regret.");

    setTimeout(() => {
        if (!gameActive) return;
        updateStory("Under a pile of rotten mailbags, you find a small, water-damaged leather satchel. You open it...");
        if (updateStats(5)) return;
    }, 3000);

    setTimeout(() => {
        if (!gameActive) return;
        updateStory("Inside is a yellowed newspaper clipping. The text is faded: <i>'JHARIA CHRONICLE - July 19th, 1985. A tragic hit-and-run... claimed the life of Anjali Sharma, 22. A newlywed, she was reportedly on her way to meet her husband, army officer Rohan Sharma... A treasured locket was lost at the scene...'</i>");
        if (updateStats(10)) return;
    }, 7000);

    setTimeout(() => {
        if (!gameActive) return;
        updateStory("Deeper in the satchel, there's a faded photograph. A smiling young woman in a white saree... next to a man in uniform. You... he looks so familiar... You turn it over. In neat cursive, it reads: <br><i>'My Anjali. My love, my life. Your Rohan.'</i><br> The name hits you like a physical blow. Your name.");
        showSprite(povDrivingURL, true);
        if (updateStats(20)) return;
    }, 14000);
    
    setTimeout(() => {
        if (!gameActive) return;
        updateStory("You unfold one last brittle, water-stained letter. It's her handwriting. <i>'My dearest Rohan, The storm is terrible tonight, but nothing will keep me from meeting you. I'm wearing the locket you gave me, so it feels like you're already here...'</i> Her words trail off, stained into oblivion. You remember everything.");
        inventory.hasClue = true;
        showSprite(povDrivingURL, false);
        clearChoices();
        addChoice("I have to find her locket.", backToCar);
    }, 21000);
}

function backToCar() {
    showSprite(povDrivingURL);

    if (inventory.hasClue && !inventory.hasLocket) {
        updateStory("You remember her... Anjali. But the memory of the locket is hazy. The newspaper said it was lost. You must find it.");
    } else {
        updateStory("You make it back to the car. Your goal is clear now.");
    }

    clearChoices();
    
    if (inventory.hasSparkPlug && carCondition < 30) {
        addChoice("Fix the car. For her.", tryFixCar);
    } else {
        addChoice("I need to search the area.", onFootPath);
    }
}

function tryFixCar() {
    updateStory("With steady hands, you replace the spark plug. The engine turns over! It's time to end this loop.");
    carCondition = 30;
    updateStats();
    clearChoices();

    if (inventory.hasLocket && inventory.hasClue) {
        addChoice("Drive to where you first saw her", () => endGame("true_ending"));
    } else {
         addChoice("Drive!", () => chaseSequence());
    }
}

// --- ENDINGS ---
function endGame(reason) {
    if (!gameActive) return; 
    gameActive = false;
    clearInterval(gameInterval);
    clearChoices();
    let endText = "";
    
    switch (reason) {
        case "sanity":
            showSprite(endingMadnessURL, true);
            endText = "You forget her again, lost to the darkness. The loop continues. ENDING: THE MADNESS";
            break;
        case "crash":
            showSprite(endingCrashURL); 
            endText = "You crash at the same spot, again. The loop resets. ENDING: THE CRASH";
            break;
        case "survived":
            showSprite(endingSurvivorURL); 
            endText = "You drive away, leaving her behind forever. You survived, but at what cost? ENDING: THE SURVIVOR";
            break;
        case "true_ending":
            showSprite(endingTrueURL);
            endText = `You call her name, "Anjali!" and hold up the locket. Her form softens. "You remembered," she whispers. The world fades to a peaceful white.`;
            break;
        case "captured":
            showSprite(endingCapturedURL, true); 
            endText = "Her face is the last thing you see. ENDING: THE CAPTURED";
            break;
    }
    updateStory(endText);

    const playAgainButton = document.createElement('button');
    playAgainButton.classList.add('choice-btn');
    playAgainButton.textContent = "Play Again";
    playAgainButton.onclick = () => location.reload(); 
    choicesDiv.appendChild(playAgainButton);
}

// --- START THE GAME ---
window.onload = () => {
    gameInterval = setInterval(tick, 3000);
    startGame();
};