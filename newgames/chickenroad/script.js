const GAME_MODES = {
    easy: [1.1, 1.2, 1.3, 1.5, 1.8, 2, 2.5, 3, 4, 5.5, 7.5 ],
    medium: [1.2, 1.5, 1.7, 2, 3, 4.5, 6 ],
    hard: [1.4, 2, 4, 8, ],
    hardcore: [1.6, 2.5, 5, 10 ]
};

let currentGameMode = 'easy';
let gameInProgress = false;
let gameFinished = false;

// Элементы DOM
const chicken = document.getElementById('chicken');
const getSignalBtn = document.getElementById('getSignalBtn');
const backBtn = document.getElementById('backBtn');
const modeButtons = document.querySelectorAll('.mode-btn');
const tunnel = document.querySelector('.tunnel');

// Обработчики выбора режима игры
modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (gameInProgress) return; // Не позволяем менять режим во время игры
        
        // Убираем активный класс у всех кнопок
        modeButtons.forEach(btn => btn.classList.remove('active'));
        
        // Добавляем активный класс текущей кнопке
        button.classList.add('active');
        
        // Устанавливаем новый режим
        currentGameMode = button.dataset.mode;
        
        // Очистка если игра закончена
        if (gameFinished) {
            cleanupAllGameElements();
            gameFinished = false;
        }
        
        console.log(`Режим игры изменен на: ${currentGameMode}`);
    });
});

// Обработчик кнопки Back
backBtn.addEventListener('click', () => {
    window.history.back();
});

// Обработчик кнопки получения сигнала
getSignalBtn.addEventListener('click', async () => {
    if (gameInProgress) return;
    
    gameInProgress = true;
    getSignalBtn.disabled = true;
    
    // Отключаем кнопки выбора режима во время игры
    modeButtons.forEach(btn => btn.disabled = true);
    
    try {
        // ВАЖНО: Полная очистка перед началом новой игры
        await cleanupAllGameElements();
        gameFinished = false;
        
        await playGameSequence();
    } catch (error) {
        console.error('Ошибка в игре:', error);
        await cleanupAllGameElements();
    } finally {
        gameInProgress = false;
        getSignalBtn.disabled = false;
        modeButtons.forEach(btn => btn.disabled = false);
        gameFinished = true;
    }
});

// Полная очистка всех игровых элементов
function cleanupAllGameElements() {
    return new Promise(resolve => {
        // Убираем все динамически созданные элементы
        const fireAnimations = document.querySelectorAll('.fire-animation');
        const deadChickenContainers = document.querySelectorAll('.dead-chicken-container');
        
        fireAnimations.forEach(element => element.remove());
        deadChickenContainers.forEach(element => element.remove());
        
        // Показываем живую курицу
        chicken.style.display = 'block';
        
        // Убираем все классы анимации
        chicken.classList.remove('jumping');
        
        console.log('Все игровые элементы очищены');
        resolve();
    });
}

// Основная игровая последовательность
async function playGameSequence() {
    console.log(`Запуск игры в режиме: ${currentGameMode}`);
    
    // 1. Курица прыгает
    await chickenJump();
    
    // 2. Воспроизводим анимацию огня с превращением курицы во время огня
    await playFireAnimationWithTransformation();
    
    // 3. Игра завершается - результат остается до новой игры или смены режима
    console.log('Игра завершена - результат останется до новой игры');
}

// Анимация прыжка курицы
function chickenJump() {
    return new Promise(resolve => {
        chicken.classList.add('jumping');
        
        setTimeout(() => {
            chicken.classList.remove('jumping');
            resolve();
        }, 800);
    });
}

// Воспроизведение анимации огня с превращением курицы во время огня
function playFireAnimationWithTransformation() {
    return new Promise(resolve => {
        const fireContainer = document.createElement('div');
        fireContainer.className = 'fire-animation';
        
        const fireImg = document.createElement('img');
        fireContainer.appendChild(fireImg);
        
        tunnel.appendChild(fireContainer);
        
        let currentFrame = 0;
        const totalFrames = 22; // fire_0.webp до fire_21.webp
        const transformFrame = Math.floor(totalFrames / 2); // Превращаем курицу в середине анимации огня
        
        function updateFrame() {
            fireImg.src = `fire_${currentFrame}.webp`;
            fireImg.onerror = () => {
                console.warn(`Кадр fire_${currentFrame}.webp не найден`);
                fireImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
            };
            
            // Превращаем курицу в середине анимации огня
            if (currentFrame === transformFrame) {
                transformChickenToDead();
            }
            
            currentFrame++;
            
            if (currentFrame < totalFrames) {
                setTimeout(updateFrame, 82); // ~1.8 секунды на 22 кадра
            } else {
                // Удаляем анимацию огня после завершения
                fireContainer.remove();
                resolve();
            }
        }
        
        updateFrame();
    });
}

// Превращаем курицу в мертвую во время огня
function transformChickenToDead() {
    // Скрываем живую курицу
    chicken.style.display = 'none';
    
    // Создаем контейнер для мертвой курицы
    const deadChickenContainer = document.createElement('div');
    deadChickenContainer.className = 'dead-chicken-container';
    
    const deadChickenImg = document.createElement('img');
    deadChickenImg.src = 'deadchicken.png';
    deadChickenImg.className = 'dead-chicken-img';
    deadChickenImg.alt = 'Dead Chicken';
    
    // Обработка ошибки загрузки изображения мертвой курицы
    deadChickenImg.onerror = () => {
        console.warn('deadchicken.png не найден, используем заглушку');
        deadChickenImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjIyMCIgdmlld0JveD0iMCAwIDIyMCAyMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIyMCIgaGVpZ2h0PSIyMjAiIGZpbGw9IiNmZjAwMDAiLz48dGV4dCB4PSIxMTAiIHk9IjExNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+WDwvdGV4dD48L3N2Zz4=';
    };
const multiplierHistory = {
    easy: [],
    medium: [],
    hard: [],
    hardcore: []
};

// Function to get weighted multiplier with streak protection
function getWeightedMultiplier(mode) {
    const multipliers = GAME_MODES[mode];
    const history = multiplierHistory[mode];
    
    // Base weights based on multiplier values
    // Values above 1.8x are considered LEGENDARY and get extremely low weights
    const baseWeights = multipliers.map(value => {
        if (value <= 1.3) return 100;    // Very common (1.1x - 1.3x)
        if (value <= 1.5) return 60;     // Common (1.4x - 1.5x)
        if (value <= 1.8) return 25;     // Uncommon (1.6x - 1.8x)
        if (value <= 2.0) return 8;      // Rare (1.9x - 2.0x)
        return 2;                         // LEGENDARY (2.1x and above) - super rare
    });
    
    // Adjust weights based on game mode
    let adjustedWeights = [...baseWeights];
    
    // Define high multiplier indices (anything above 1.8x is considered "high")
    // Find indices where multiplier > 1.8
    const highIndices = multipliers
        .map((value, index) => ({ value, index }))
        .filter(item => item.value > 1.8)
        .map(item => item.index);
    
    // Special handling for the third index probability (if it contains a high multiplier)
    if (multipliers.length >= 3 && multipliers[2] > 1.8) {
        const totalBaseWeight = baseWeights.reduce((a, b) => a + b, 0);
        const currentThirdWeight = baseWeights[2];
        
        // Target probabilities for third index based on game mode
        let targetProb;
        switch(mode) {
            case 'easy':
                targetProb = 0.35; // < 45% for high multipliers in easy
                break;
            case 'medium':
                targetProb = 0.50; // < 65% for high multipliers in medium
                break;
            case 'hard':
                targetProb = 0.08; // < 10% for high multipliers in hard
                break;
            case 'hardcore':
                targetProb = 0.03; // < 5% for high multipliers in hardcore
                break;
            default:
                targetProb = 0.30;
        }
        
        // Recalculate third index weight to achieve target probability
        const numerator = targetProb * (totalBaseWeight - currentThirdWeight);
        const denominator = 1 - targetProb;
        if (denominator > 0) {
            adjustedWeights[2] = Math.max(1, numerator / denominator);
        }
    }
    
    // Check last 2 multipliers in history for streak prevention
    const lastTwoMultipliers = history.slice(-2);
    const lastMultiplier = history[history.length - 1];
    
    // If last multiplier was high (>1.8x)
    if (lastMultiplier !== undefined) {
        const lastIndex = multipliers.indexOf(lastMultiplier);
        if (highIndices.includes(lastIndex)) {
            // Drastically reduce probability of all high multipliers
            adjustedWeights = adjustedWeights.map((weight, idx) => {
                if (highIndices.includes(idx)) {
                    return weight * 0.05; // Reduce by 95% after a high multiplier
                }
                return weight;
            });
            console.log(`Previous multiplier was HIGH (>1.8x), applying 95% penalty`);
        }
    }
    
    // Check if two high multipliers occurred in a row recently
    if (lastTwoMultipliers.length === 2) {
        const firstHigh = highIndices.includes(multipliers.indexOf(lastTwoMultipliers[0]));
        const secondHigh = highIndices.includes(multipliers.indexOf(lastTwoMultipliers[1]));
        
        if (firstHigh && secondHigh) {
            // If two highs in a row, make high multipliers almost impossible
            adjustedWeights = adjustedWeights.map((weight, idx) => {
                if (highIndices.includes(idx)) {
                    return weight * 0.01; // 99% reduction - practically zero chance
                }
                return weight;
            });
            console.log(`Two HIGH multipliers in a row detected, emergency 99% reduction applied`);
        }
    }
    
    // Normalize weights (ensure all are positive integers)
    adjustedWeights = adjustedWeights.map(w => Math.max(1, Math.floor(w)));
    
    // Select random multiplier based on adjusted weights
    const totalWeight = adjustedWeights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    
    for (let i = 0; i < adjustedWeights.length; i++) {
        if (random < adjustedWeights[i]) {
            selectedIndex = i;
            break;
        }
        random -= adjustedWeights[i];
    }
    
    const selectedMultiplier = multipliers[selectedIndex];
    
    // Save to history
    history.push(selectedMultiplier);
    
    // Keep only last 10 history entries
    if (history.length > 10) {
        history.shift();
    }
    
    // Debug logging
    console.log(`Mode: ${mode}, Selected multiplier: ${selectedMultiplier}x (index: ${selectedIndex})`);
    console.log(`History (last 5): ${history.slice(-5).join(' → ')}`);
    
    // Statistics for monitoring (only when enough data)
    if (history.length >= 20) {
        const highCount = history.filter(h => {
            const idx = multipliers.indexOf(h);
            return highIndices.includes(idx);
        }).length;
        const highProb = (highCount / history.length * 100).toFixed(1);
        console.log(`High multiplier stats (>1.8x): ${highCount}/${history.length} (${highProb}%)`);
        
        // Count legendary multipliers (>2.0x)
        const legendaryCount = history.filter(h => h > 2.0).length;
        if (legendaryCount > 0) {
            console.log(`🔥 LEGENDARY multiplier appeared! (${legendaryCount} times)`);
        }
    }
    
    return selectedMultiplier;
}
    // Создаем элемент множителя
    const multiplierElement = document.createElement('div');
    multiplierElement.className = 'dead-chicken-multiplier';
    
    // Получаем случайный множитель для текущего режима
    const multipliers = GAME_MODES[currentGameMode];
    const randomMultiplier = getWeightedMultiplier(currentGameMode);
    multiplierElement.textContent = `${randomMultiplier}x`;
    
    console.log(`Выпал множитель: ${randomMultiplier}x в режиме ${currentGameMode}`);
    
    deadChickenContainer.appendChild(deadChickenImg);
    deadChickenContainer.appendChild(multiplierElement);
    
    tunnel.appendChild(deadChickenContainer);
}

// Инициализация игры
console.log('Chicken Road Signal Game загружена!');
console.log(`Текущий режим: ${currentGameMode}`);
console.log('Доступные режимы:', Object.keys(GAME_MODES));

// Очистка при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    cleanupAllGameElements();
}); 