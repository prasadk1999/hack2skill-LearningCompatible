import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock mermaid so it doesn't crash jsdom during tests
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>Mocked Diagram</svg>' })
  }
}));
