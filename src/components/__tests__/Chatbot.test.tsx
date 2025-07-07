import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chatbot from '../Chatbot';
import { geminiService } from '@/services/geminiService';

// Mock the geminiService
jest.mock('@/services/geminiService', () => ({
  geminiService: {
    sendChatMessageStream: jest.fn(),
  },
}));

// Mock the constants
jest.mock('@/constants', () => ({
  ChatIcon: ({ className }: { className: string }) => <div data-testid="chat-icon" className={className} />,
  CloseIcon: ({ className }: { className: string }) => <div data-testid="close-icon" className={className} />,
  PaperAirplaneIcon: ({ className }: { className: string }) => <div data-testid="paper-airplane-icon" className={className} />,
}));

const mockGeminiService = geminiService as jest.Mocked<typeof geminiService>;

describe('Chatbot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders chatbot toggle button with proper accessibility attributes', () => {
    render(<Chatbot />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle chatbot/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle Chatbot');
  });

  it('opens chatbot when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<Chatbot />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle chatbot/i });
    await user.click(toggleButton);
    
    // Should show close icon when open
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    
    // Should show input field
    const input = screen.getByRole('textbox', { name: /message/i });
    expect(input).toBeInTheDocument();
  });

  it('displays welcome message when chatbot is opened for the first time', async () => {
    const user = userEvent.setup();
    render(<Chatbot />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle chatbot/i });
    await user.click(toggleButton);
    
    expect(screen.getByText(/hello! i'm visionbot/i)).toBeInTheDocument();
  });

  it('sends message when form is submitted', async () => {
    const user = userEvent.setup();
    const mockStream = (async function* () {
      yield 'Hello! How can I help you?';
    })();
    
    mockGeminiService.sendChatMessageStream.mockResolvedValue(mockStream);
    
    render(<Chatbot />);
    
    // Open chatbot
    const toggleButton = screen.getByRole('button', { name: /toggle chatbot/i });
    await user.click(toggleButton);
    
    // Type and send message
    const input = screen.getByRole('textbox', { name: /message/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    await user.type(input, 'Hello');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(mockGeminiService.sendChatMessageStream).toHaveBeenCalledWith(
        'Hello',
        expect.any(Array),
        expect.any(AbortSignal)
      );
    });
  });

  it('handles keyboard navigation properly', async () => {
    const user = userEvent.setup();
    render(<Chatbot />);
    
    // Open chatbot
    const toggleButton = screen.getByRole('button', { name: /toggle chatbot/i });
    await user.click(toggleButton);
    
    const input = screen.getByRole('textbox', { name: /message/i });
    
    // Focus should be on input after opening
    expect(input).toHaveFocus();
    
    // Should be able to type with keyboard
    await user.type(input, 'Test message');
    expect(input).toHaveValue('Test message');
  });

  it('handles errors gracefully', async () => {
    const user = userEvent.setup();
    mockGeminiService.sendChatMessageStream.mockRejectedValue(new Error('API Error'));
    
    render(<Chatbot />);
    
    // Open chatbot
    const toggleButton = screen.getByRole('button', { name: /toggle chatbot/i });
    await user.click(toggleButton);
    
    // Send message
    const input = screen.getByRole('textbox', { name: /message/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    await user.type(input, 'Hello');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/sorry, i encountered an error/i)).toBeInTheDocument();
    });
  });

  it('maintains chat history in session storage', async () => {
    const user = userEvent.setup();
    const mockStream = (async function* () {
      yield 'Response from AI';
    })();
    
    mockGeminiService.sendChatMessageStream.mockResolvedValue(mockStream);
    
    render(<Chatbot />);
    
    // Open chatbot and send message
    const toggleButton = screen.getByRole('button', { name: /toggle chatbot/i });
    await user.click(toggleButton);
    
    const input = screen.getByRole('textbox', { name: /message/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalled();
    });
  });

  it('has proper ARIA labels and roles', async () => {
    const user = userEvent.setup();
    render(<Chatbot />);
    
    // Open chatbot
    const toggleButton = screen.getByRole('button', { name: /toggle chatbot/i });
    await user.click(toggleButton);
    
    // Check for proper ARIA attributes
    const input = screen.getByRole('textbox', { name: /message/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    expect(input).toHaveAttribute('aria-label', 'Message');
    expect(sendButton).toHaveAttribute('aria-label', 'Send message');
  });
}); 