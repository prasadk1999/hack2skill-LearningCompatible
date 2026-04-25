import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock crypto.randomUUID
beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-1234'
    }
  });
  
  // Mock scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('App Component', () => {
  it('renders the welcome screen by default', () => {
    render(<App />);
    expect(screen.getByText('Ready to learn something new?')).toBeInTheDocument();
    expect(screen.getByText('Gemini AI')).toBeInTheDocument();
  });

  it('allows user to type in the input field', () => {
    render(<App />);
    const input = screen.getByPlaceholderText('Ask me anything you want to learn...');
    
    fireEvent.change(input, { target: { value: 'What is Python?' } });
    expect(input.value).toBe('What is Python?');
  });

  it('disables send button when input is empty', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /send message/i });
    expect(button).toBeDisabled();
  });
});
