/* In-App Vietnamese Telex Engine for VKU Student Survey
   Ensures 100% reliable Vietnamese typing across Android WebView, PC Emulators, and iOS
*/

(function() {
  const VOWELS_TABLE = {
    'a': ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
    'ă': ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'],
    'â': ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
    'e': ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
    'ê': ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
    'i': ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
    'o': ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
    'ô': ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
    'ơ': ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
    'u': ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
    'ư': ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
    'y': ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ']
  };

  const CHAR_TO_BASE_AND_TONE = {};
  for (const [base, variants] of Object.entries(VOWELS_TABLE)) {
    variants.forEach((ch, toneIdx) => {
      CHAR_TO_BASE_AND_TONE[ch] = { base, tone: toneIdx, isUpper: false };
      CHAR_TO_BASE_AND_TONE[ch.toUpperCase()] = { base, tone: toneIdx, isUpper: true };
    });
  }
  CHAR_TO_BASE_AND_TONE['đ'] = { base: 'đ', tone: 0, isUpper: false };
  CHAR_TO_BASE_AND_TONE['Đ'] = { base: 'đ', tone: 0, isUpper: true };

  const TONE_KEYS = {
    's': 1, // Sắc
    'f': 2, // Huyền
    'r': 3, // Hỏi
    'x': 4, // Ngã
    'j': 5  // Nặng
  };

  const TELEX_TRIGGER_KEYS = new Set(['s', 'f', 'r', 'x', 'j', 'w', 'a', 'e', 'o', 'd']);

  function getCharInfo(c) {
    if (!c) return null;
    if (CHAR_TO_BASE_AND_TONE[c]) return CHAR_TO_BASE_AND_TONE[c];
    const lower = c.toLowerCase();
    if (CHAR_TO_BASE_AND_TONE[lower]) {
      return { ...CHAR_TO_BASE_AND_TONE[lower], isUpper: c !== lower };
    }
    return null;
  }

  function findTargetVowelIndex(word) {
    const vowelIndices = [];
    for (let i = 0; i < word.length; i++) {
      const info = getCharInfo(word[i]);
      if (info && info.base !== 'đ') {
        vowelIndices.push(i);
      }
    }

    if (vowelIndices.length === 0) return -1;
    if (vowelIndices.length === 1) return vowelIndices[0];

    const firstVowel = vowelIndices[0];
    const lastVowel = vowelIndices[vowelIndices.length - 1];
    const hasConsonantAfter = lastVowel < word.length - 1;

    // Check 'qu' / 'gi'
    if (word.toLowerCase().startsWith('qu') && vowelIndices[0] === 1 && vowelIndices.length > 1) {
      vowelIndices.shift();
      if (vowelIndices.length === 1) return vowelIndices[0];
    }
    if (word.toLowerCase().startsWith('gi') && vowelIndices[0] === 1 && vowelIndices.length > 1) {
      vowelIndices.shift();
      if (vowelIndices.length === 1) return vowelIndices[0];
    }

    const vowelsStr = vowelIndices.map(idx => getCharInfo(word[idx]).base).join('');
    if (vowelsStr === 'uy') {
      return vowelIndices[1]; // Thủy
    }
    if (vowelsStr === 'ươ' || vowelsStr === 'uơ') {
      return vowelIndices[1]; // Đường
    }

    for (const idx of vowelIndices) {
      const b = getCharInfo(word[idx]).base;
      if (['ê', 'ơ', 'ư', 'â', 'ô', 'ă'].includes(b)) {
        return idx;
      }
    }

    if (hasConsonantAfter) {
      if (vowelIndices.length >= 2) {
        return vowelIndices[1];
      }
      return vowelIndices[0];
    }

    if (vowelsStr === 'oa' || vowelsStr === 'oe') {
      return vowelIndices[1]; // hòa, hòe
    }
    if (vowelsStr === 'ai' || vowelsStr === 'ay' || vowelsStr === 'ao' || vowelsStr === 'au') {
      return vowelIndices[0]; // hải, hãy, háo, hấu
    }
    if (vowelsStr === 'eo' || vowelsStr === 'eu' || vowelsStr === 'ia' || vowelsStr === 'ie' || vowelsStr === 'oi' || vowelsStr === 'ui') {
      return vowelIndices[0];
    }

    return vowelIndices[0];
  }

  function processTelexWord(rawWord) {
    let result = '';

    for (let k = 0; k < rawWord.length; k++) {
      const char = rawWord[k];
      const lower = char.toLowerCase();
      const isUpper = char !== lower && char.toUpperCase() === char;

      // 'd' + 'd' -> 'đ'
      if (lower === 'd' && result.length > 0 && result[result.length - 1].toLowerCase() === 'd') {
        const prevUpper = result[result.length - 1] === result[result.length - 1].toUpperCase();
        result = result.slice(0, -1) + (prevUpper ? 'Đ' : 'đ');
        continue;
      }

      // 'a' + 'a' -> 'â'
      if (lower === 'a' && result.toLowerCase().endsWith('a')) {
        const lastIdx = result.length - 1;
        const lastChar = result[lastIdx];
        const info = getCharInfo(lastChar);
        if (info && info.base === 'a') {
          const replacement = VOWELS_TABLE['â'][info.tone];
          result = result.slice(0, -1) + (lastChar === lastChar.toUpperCase() ? replacement.toUpperCase() : replacement);
          continue;
        }
      }
      // 'e' + 'e' -> 'ê'
      if (lower === 'e' && result.toLowerCase().endsWith('e')) {
        const lastIdx = result.length - 1;
        const lastChar = result[lastIdx];
        const info = getCharInfo(lastChar);
        if (info && info.base === 'e') {
          const replacement = VOWELS_TABLE['ê'][info.tone];
          result = result.slice(0, -1) + (lastChar === lastChar.toUpperCase() ? replacement.toUpperCase() : replacement);
          continue;
        }
      }
      // 'o' + 'o' -> 'ô'
      if (lower === 'o' && result.toLowerCase().endsWith('o')) {
        const lastIdx = result.length - 1;
        const lastChar = result[lastIdx];
        const info = getCharInfo(lastChar);
        if (info && info.base === 'o') {
          const replacement = VOWELS_TABLE['ô'][info.tone];
          result = result.slice(0, -1) + (lastChar === lastChar.toUpperCase() ? replacement.toUpperCase() : replacement);
          continue;
        }
      }

      // 'w' key
      if (lower === 'w') {
        // Check 'uo' + 'w' -> 'ươ'
        if (result.length >= 2) {
          const end2 = result.slice(-2).toLowerCase();
          if (end2 === 'uo' || end2 === 'uơ' || end2 === 'ưo') {
            const uChar = result[result.length - 2];
            const oChar = result[result.length - 1];
            const oInfo = getCharInfo(oChar);
            const newU = VOWELS_TABLE['ư'][0];
            const newO = VOWELS_TABLE['ơ'][oInfo ? oInfo.tone : 0];
            result = result.slice(0, -2) + 
              (uChar === uChar.toUpperCase() ? newU.toUpperCase() : newU) + 
              (oChar === oChar.toUpperCase() ? newO.toUpperCase() : newO);
            continue;
          }
        }

        // 'w' modifies 'a' -> 'ă', 'o' -> 'ơ', 'u' -> 'ư'
        let modified = false;
        for (let i = result.length - 1; i >= 0; i--) {
          const info = getCharInfo(result[i]);
          if (info) {
            let newBase = null;
            if (info.base === 'a') newBase = 'ă';
            else if (info.base === 'o') newBase = 'ơ';
            else if (info.base === 'u') newBase = 'ư';

            if (newBase) {
              const repl = VOWELS_TABLE[newBase][info.tone];
              result = result.slice(0, i) + (result[i] === result[i].toUpperCase() ? repl.toUpperCase() : repl) + result.slice(i + 1);
              modified = true;
              break;
            }
          }
        }
        if (modified) continue;
        result += isUpper ? 'Ư' : 'ư';
        continue;
      }

      // Check tone keys: s, f, r, x, j
      if (TONE_KEYS[lower]) {
        const tone = TONE_KEYS[lower];
        const targetVowelIdx = findTargetVowelIndex(result);
        if (targetVowelIdx !== -1) {
          const targetChar = result[targetVowelIdx];
          const info = getCharInfo(targetChar);
          if (info) {
            const newTone = (info.tone === tone) ? 0 : tone;
            const repl = VOWELS_TABLE[info.base][newTone];
            result = result.slice(0, targetVowelIdx) + (targetChar === targetChar.toUpperCase() ? repl.toUpperCase() : repl) + result.slice(targetVowelIdx + 1);
            continue;
          }
        }
      }

      result += char;
    }

    return result;
  }

  // Storage key for Telex preference
  const STORAGE_KEY_TELEX = 'vku_telex_active';
  let isTelexActive = localStorage.getItem(STORAGE_KEY_TELEX) !== 'false'; // Default TRUE

  function attachTelex(input) {
    if (!input || input._telexAttached) return;
    input._telexAttached = true;

    input.addEventListener('input', (e) => {
      if (!isTelexActive) return;

      const val = input.value;
      const cursorPos = input.selectionEnd || val.length;
      if (cursorPos === 0) return;

      const lastChar = val[cursorPos - 1];
      if (!lastChar || !TELEX_TRIGGER_KEYS.has(lastChar.toLowerCase())) {
        return;
      }

      const textBefore = val.slice(0, cursorPos);
      const textAfter = val.slice(cursorPos);

      // Match the active word before cursor
      const match = textBefore.match(/([a-zA-ZáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ]+)$/);
      if (!match) return;

      const rawWord = match[1];
      const convertedWord = processTelexWord(rawWord);

      if (convertedWord !== rawWord) {
        const newTextBefore = textBefore.slice(0, textBefore.length - rawWord.length) + convertedWord;
        input.value = newTextBefore + textAfter;
        const newCursorPos = newTextBefore.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  }

  function initTelex() {
    const inputs = document.querySelectorAll('input[type="text"], textarea');
    inputs.forEach(attachTelex);

    // Setup toggle button if element exists
    const telexBtn = document.getElementById('btnToggleTelex');
    if (telexBtn) {
      function updateButton() {
        if (isTelexActive) {
          telexBtn.textContent = '🇻🇳 Telex: BẬT';
          telexBtn.classList.add('active');
        } else {
          telexBtn.textContent = '🌐 Telex: TẮT';
          telexBtn.classList.remove('active');
        }
      }
      updateButton();

      telexBtn.addEventListener('click', () => {
        isTelexActive = !isTelexActive;
        localStorage.setItem(STORAGE_KEY_TELEX, isTelexActive ? 'true' : 'false');
        updateButton();
      });
    }
  }

  window.VKUTelex = {
    processWord: processTelexWord,
    init: initTelex,
    attach: attachTelex,
    isActive: () => isTelexActive,
    setActive: (val) => {
      isTelexActive = !!val;
      localStorage.setItem(STORAGE_KEY_TELEX, isTelexActive ? 'true' : 'false');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTelex);
  } else {
    initTelex();
  }
})();
