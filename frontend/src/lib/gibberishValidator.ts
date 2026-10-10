export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates whether text input contains authentic, meaningful language
 * and blocks keyboard mash, repeated characters, and dummy placeholders.
 */
export function validateTextMeaning(
  text: string,
  options: {
    minChars?: number;
    minWords?: number;
    fieldName?: string;
  } = {}
): ValidationResult {
  const { minChars = 2, minWords = 1, fieldName = 'Field' } = options;

  if (!text || typeof text !== 'string') {
    return { isValid: false, reason: `${fieldName} is required.` };
  }

  const trimmed = text.trim();
  if (trimmed.length < minChars) {
    return {
      isValid: false,
      reason: `${fieldName} must be at least ${minChars} character${minChars > 1 ? 's' : ''}.`
    };
  }

  const lower = trimmed.toLowerCase();

  // 1. Common placeholder tokens
  const forbiddenPlaceholders = [
    'asdf', 'asdfgh', 'asdfghjk', 'qwerty', 'qwertyuiop', 'zxcvbnm',
    'test', 'testing', 'test123', 'lorem ipsum', 'foo', 'bar', 'foobar',
    'n/a', 'na', 'none', 'null', 'undefined', 'nothing', 'blank',
    'xxx', 'xxxx', 'aaa', 'aaaa', '123', '1234', '12345', '123456',
    'abc', 'abcd', 'abcdef'
  ];
  if (forbiddenPlaceholders.includes(lower)) {
    return {
      isValid: false,
      reason: `${fieldName} cannot be placeholder or test text.`
    };
  }

  // 2. Excessive repeated characters (e.g., "aaaaaaa", "1111111")
  if (/(.)\1{3,}/i.test(trimmed)) {
    return {
      isValid: false,
      reason: `${fieldName} contains excessive repeated characters.`
    };
  }

  // 3. Repeated syllables / keystroke patterns (e.g. "asdfasdfasdf", "qweqweqwe")
  if (/^(.{2,5})\1{2,}$/i.test(trimmed.replace(/\s+/g, ''))) {
    return {
      isValid: false,
      reason: `${fieldName} appears to be repeated keystroke mash.`
    };
  }

  // 4. Word count
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < minWords) {
    return {
      isValid: false,
      reason: `${fieldName} must contain at least ${minWords} word${minWords > 1 ? 's' : ''}.`
    };
  }

  // 5. Check individual words for unpronounceable consonant clusters or low vowel ratio
  for (const word of words) {
    const lettersOnly = word.replace(/[^a-zA-Z]/g, '');

    if (lettersOnly.length >= 6) {
      const vowels = lettersOnly.match(/[aeiouy]/gi);
      const vowelCount = vowels ? vowels.length : 0;
      const vowelRatio = vowelCount / lettersOnly.length;

      if (vowelRatio < 0.15) {
        return {
          isValid: false,
          reason: `"${word}" does not appear to be a real word (lacks vowels).`
        };
      }
      if (vowelRatio > 0.85 && lettersOnly.length >= 6) {
        return {
          isValid: false,
          reason: `"${word}" contains an unnatural sequence of vowels.`
        };
      }
    }

    const keyboardMashPatterns = [
      /qwer/i, /asdf/i, /zxcv/i, /hjkl/i, /uiop/i, /bnm/i
    ];
    for (const pat of keyboardMashPatterns) {
      if (pat.test(lettersOnly) && lettersOnly.length < 10) {
        return {
          isValid: false,
          reason: `${fieldName} contains keyboard-mash patterns.`
        };
      }
    }
  }

  return { isValid: true };
}
