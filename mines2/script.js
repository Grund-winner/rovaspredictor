document.addEventListener('DOMContentLoaded', function () {
  const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

  const translations = {
    trapsLabel: { 
      en: "NUMBER OF TRAPS:", 
      ru: "КОЛ-ВО ЛОВУШЕК:", 
      fr: "NOMBRE DE PIÈGES:", 
      hi: "जालों की संख्या:" 
    },
    signalButton: { 
      en: "GET SIGNAL", 
      ru: "ПОЛУЧИТЬ СИГНАЛ", 
      fr: "OBTENIR LE SIGNAL", 
      hi: "सिग्नल प्राप्त करें" 
    },
    backAlt: { 
      en: "Back", 
      ru: "Назад", 
      fr: "Retour", 
      hi: "वापस" 
    },
    orientationMessage: { 
      en: "Please rotate your device to portrait mode", 
      ru: "Пожалуйста, поверните устройство в портретный режим", 
      fr: "Veuillez tourner votre appareil en mode portrait", 
      hi: "कृपया अपने डिवाइस को पोर्ट्रेट मोड में घुमाएं" 
    },
    play: {
      en: "Play",
      ru: "Играть",
      fr: "Jouer",
      hi: "खेलें"
    },
    traps: {
      en: "Traps",
      ru: "Ловушки",
      fr: "Pièges",
      hi: "जाल"
    }
  };

  // === Apply Translations ===
  const label = document.querySelector('[data-i18n="traps"]');
  const playBtn = document.querySelector('[data-i18n="play"]');
  const backBtn = document.querySelector('[data-i18n="back"]');

  if (label) label.textContent = translations.traps[selectedLanguage];
  if (playBtn) playBtn.textContent = translations.play[selectedLanguage];
  if (backBtn) backBtn.textContent = translations.backAlt[selectedLanguage];

  // === Language Switch Buttons ===
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      localStorage.setItem('selectedLanguage', lang);
      location.reload(); // reload to apply new translations
    });
  });

  // === MAIN GAME SCRIPT BELOW ===
  const cellsBoard = document.querySelector('.cells-board');
  if (!cellsBoard) {
    console.error('Element .cells-board not found.');
    return;
  }

  const trapsOptions = [1, 3, 5, 7];
  const trapsToCellsOpenMapping = {
    1: 16,
    3: 6,
    5: 5,
    7: 4
  };

  let currentPresetIndex = 0;
  let currentMode = 'nesk';
  let isFirstPlay = true;

  const trapsAmountElement = document.getElementById('trapsAmount');
  const prevPresetBtn = document.getElementById('prev_preset_btn');
  const nextPresetBtn = document.getElementById('next_preset_btn');
  const modeButton = document.getElementById('modeButton');
  const playButton = document.getElementById('playButton');

  function updateTrapsAmount() {
    if (trapsAmountElement)
      trapsAmountElement.textContent = trapsOptions[currentPresetIndex];
  }

  updateTrapsAmount();

  if (prevPresetBtn) {
    prevPresetBtn.addEventListener('click', () => {
      if (currentPresetIndex > 0) {
        currentPresetIndex--;
        updateTrapsAmount();
      }
    });
  }

  if (nextPresetBtn) {
    nextPresetBtn.addEventListener('click', () => {
      if (currentPresetIndex < trapsOptions.length - 1) {
        currentPresetIndex++;
        updateTrapsAmount();
      }
    });
  }

  if (modeButton) {
    modeButton.addEventListener('click', () => {
      currentMode = currentMode === 'nesk' ? 'all' : 'nesk';
      modeButton.textContent = currentMode === 'nesk' ? 'Switch to All' : 'Switch to Multiple';
    });
  }

  function attachCellClickListeners() {
    const cells = document.querySelectorAll('.cells-board .cell');
    cells.forEach(cell => {
      cell.addEventListener('click', () => {
        cell.style.transform = 'scale(0.7)';
        setTimeout(() => {
          cell.style.transform = 'scale(1)';
        }, 200);
      });
    });
  }

  function getRandomUniqueIndices(count, max) {
    const indices = new Set();
    while (indices.size < count) {
      indices.add(Math.floor(Math.random() * max));
    }
    return Array.from(indices);
  }

  async function revealCells(indices) {
    const cells = document.querySelectorAll('.cells-board .cell');
    for (let i = 0; i < indices.length; i++) {
      const cell = cells[indices[i]];
      cell.classList.add('cell-fade-out');
      await new Promise(res => setTimeout(res, 300));
      cell.innerHTML = '';

      try {
        const response = await fetch('img/stars.svg');
        const svgText = await response.text();
        const container = document.createElement('div');
        container.style.cssText = `
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        `;
        container.innerHTML = svgText;
        cell.appendChild(container);
        const svgElement = container.querySelector('svg');
        if (svgElement) {
          svgElement.style.cssText = `
            width: 56px;
            height: 56px;
            opacity: 0;
            transform: scale(0);
            transition: opacity 0.3s, transform 0.3s;
          `;
          requestAnimationFrame(() => {
            svgElement.style.opacity = '1';
            svgElement.style.transform = 'scale(1)';
          });
        }
      } catch {
        const img = document.createElement('img');
        img.src = 'img/stars.svg';
        img.style.cssText = `
          width: 56px;
          height: 56px;
          opacity: 0;
          transform: scale(0);
          transition: opacity 0.3s, transform 0.3s;
        `;
        cell.appendChild(img);
        requestAnimationFrame(() => {
          img.style.opacity = '1';
          img.style.transform = 'scale(1)';
        });
      }

      cell.classList.remove('cell-fade-out');
      await new Promise(res => setTimeout(res, 500));
    }
  }

  function generateCells() {
    const cellImages = [
      'output_svgs/image_5450.svg',
      'output_svgs/image_11641.svg',
      'output_svgs/image_18337.svg',
      'output_svgs/image_24493.svg',
      'output_svgs/image_31201.svg',
      'output_svgs/image_37357.svg',
      'output_svgs/image_44065.svg',
      'output_svgs/image_50221.svg',
      'output_svgs/image_56929.svg',
      'output_svgs/image_63085.svg',
      'output_svgs/image_69793.svg',
      'output_svgs/image_75949.svg',
      'output_svgs/image_82645.svg',
      'output_svgs/image_89353.svg',
      'output_svgs/image_95509.svg',
      'output_svgs/image_102217.svg',
      'output_svgs/image_108373.svg',
      'output_svgs/image_115081.svg',
      'output_svgs/image_121237.svg',
      'output_svgs/image_127381.svg',
      'output_svgs/image_134077.svg',
      'output_svgs/image_140221.svg',
      'output_svgs/image_146917.svg',
      'output_svgs/image_153061.svg',
      'output_svgs/image_159757.svg'
    ];

    cellsBoard.innerHTML = '';
    cellImages.forEach(imageSrc => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.innerHTML = `<img width="56" height="56" src="${imageSrc}">`;
      cellsBoard.appendChild(cell);
    });

    attachCellClickListeners();
  }

  function resetBoard() {
    cellsBoard.innerHTML = '';
    generateCells();
    isFirstPlay = true;
    playButton.disabled = false;
  }

  if (playButton) {
    playButton.addEventListener('click', async function () {
      playButton.disabled = true;

      if (!isFirstPlay) {
        resetBoard();
      }

      const cells = document.querySelectorAll('.cells-board .cell');
      const totalCells = cells.length;
      const trapsAmount = parseInt(trapsAmountElement.textContent);
      const openCount = trapsToCellsOpenMapping[trapsAmount] || 5;

      const indices = getRandomUniqueIndices(openCount, totalCells);
      await revealCells(indices);

      playButton.disabled = false;
      isFirstPlay = false;
    });
  }

  generateCells();
});
