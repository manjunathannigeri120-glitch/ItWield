import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Landing } from './src/pages/Landing';
import React from 'react';

// Mock matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

test('Start for free button navigates', () => {
  render(<BrowserRouter><Landing /></BrowserRouter>);
  const button = screen.getByText('Start for free');
  console.log('Button found:', button.outerHTML);
  fireEvent.click(button);
});
