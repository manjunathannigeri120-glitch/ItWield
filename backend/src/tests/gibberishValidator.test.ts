import { describe, it, expect } from 'vitest';
import { validateTextMeaning } from '../utils/gibberishValidator';

describe('Gibberish Validator', () => {
  it('accepts legitimate company names and descriptions', () => {
    expect(validateTextMeaning('Stripe', { minChars: 2, minWords: 1, fieldName: 'Company Name' }).isValid).toBe(true);
    expect(validateTextMeaning('Linear App', { minChars: 2, minWords: 1, fieldName: 'Company Name' }).isValid).toBe(true);
    expect(validateTextMeaning('ItWield Technologies', { minChars: 2, minWords: 1, fieldName: 'Company Name' }).isValid).toBe(true);
    expect(validateTextMeaning('We provide autonomous AI sales and marketing operations for startup founders.', { minChars: 10, minWords: 3, fieldName: 'Description' }).isValid).toBe(true);
  });

  it('rejects common keyboard mashing and placeholders', () => {
    expect(validateTextMeaning('asdf', { fieldName: 'Name' }).isValid).toBe(false);
    expect(validateTextMeaning('qwertyuiop', { fieldName: 'Name' }).isValid).toBe(false);
    expect(validateTextMeaning('test', { fieldName: 'Name' }).isValid).toBe(false);
    expect(validateTextMeaning('lorem ipsum', { fieldName: 'Name' }).isValid).toBe(false);
  });

  it('rejects repeated characters and repeated syllables', () => {
    expect(validateTextMeaning('aaaaaaa', { fieldName: 'Name' }).isValid).toBe(false);
    expect(validateTextMeaning('1111111', { fieldName: 'Name' }).isValid).toBe(false);
    expect(validateTextMeaning('asdfasdfasdf', { fieldName: 'Name' }).isValid).toBe(false);
    expect(validateTextMeaning('qweqweqwe', { fieldName: 'Name' }).isValid).toBe(false);
  });

  it('rejects unpronounceable consonant clusters', () => {
    expect(validateTextMeaning('sdkjfhsdkjfh', { fieldName: 'Name' }).isValid).toBe(false);
    expect(validateTextMeaning('zxcvbnmlkjhg', { fieldName: 'Name' }).isValid).toBe(false);
  });

  it('enforces minimum words and characters', () => {
    expect(validateTextMeaning('a', { minChars: 2, fieldName: 'Name' }).isValid).toBe(false);
    expect(validateTextMeaning('Short', { minWords: 3, fieldName: 'Description' }).isValid).toBe(false);
  });
});
