/**
 * Speech-to-Text utility using Web Speech API
 */

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export class SpeechToText {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean = false;

  constructor() {
    // Check for browser support
    const SpeechRecognition = 
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    this.isSupported = !!SpeechRecognition;
    
    if (this.isSupported) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Start speech recognition
   * @param onResult - Callback for recognition results
   * @param onError - Callback for errors
   */
  start(
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in this browser');
      return;
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        onResult({ transcript: interimTranscript, isFinal: false });
      }
      
      if (finalTranscript) {
        onResult({ transcript: finalTranscript.trim(), isFinal: true });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessages: { [key: string]: string } = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please check your microphone.',
        'not-allowed': 'Microphone permission denied. Please enable microphone access.',
        'aborted': 'Speech recognition was aborted.',
        'network': 'Network error occurred.',
      };
      
      const errorMessage = 
        errorMessages[event.error] || 
        `Speech recognition error: ${event.error}`;
      
      onError?.(errorMessage);
    };

    this.recognition.onend = () => {
      // Don't auto-restart - let the user control it
    };

    try {
      this.recognition.start();
    } catch (error) {
      onError?.('Failed to start speech recognition');
    }
  }

  /**
   * Stop speech recognition
   */
  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * Abort speech recognition
   */
  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }
}

