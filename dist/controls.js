// Extracted modal and control JS from dist/index.html
// Modal functionality
const modeModal = document.getElementById('mode-modal');
const difficultyModal = document.getElementById('difficulty-modal');
const openModeModalBtn = document.getElementById('open-mode-modal');
const openDifficultyModalBtn = document.getElementById('open-difficulty-modal');
const closeBtns = document.getElementsByClassName('close');

if (openModeModalBtn) {
    openModeModalBtn.addEventListener('click', () => {
        if (modeModal) modeModal.style.display = 'block';
    });
}

if (openDifficultyModalBtn) {
    openDifficultyModalBtn.addEventListener('click', () => {
        if (difficultyModal) difficultyModal.style.display = 'block';
    });
}

for (let btn of closeBtns) {
    btn.addEventListener('click', () => {
        if (modeModal) modeModal.style.display = 'none';
        if (difficultyModal) difficultyModal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (event.target == modeModal) {
        modeModal.style.display = 'none';
    }
    if (event.target == difficultyModal) {
        difficultyModal.style.display = 'none';
    }
});
