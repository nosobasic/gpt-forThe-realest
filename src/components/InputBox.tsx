import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { SpeechToText } from '../utils/speechToText';
import type { Attachment } from '../utils/api';

interface InputBoxProps {
  onSendMessage: (message: string, attachments?: Attachment[]) => void;
  isLoading: boolean;
}

/**
 * InputBox Component
 * Handles user input, file attachments, speech-to-text, and message sending
 */
export default function InputBox({ onSendMessage, isLoading }: InputBoxProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<SpeechToText | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseInputRef = useRef<string>('');

  useEffect(() => {
    // Initialize speech recognition
    const speechRecognition = new SpeechToText();
    speechRecognitionRef.current = speechRecognition;
    setSpeechSupported(speechRecognition.isAvailable());
  }, []);

  // Extract file processing into a reusable function
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      // Only allow image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const base64Data = dataUrl.split(',')[1];
          
          const attachment: Attachment = {
            type: 'image',
            data: base64Data,
            mimeType: file.type,
            name: file.name,
          };
          
          setAttachments((prev) => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if ((trimmedInput || attachments.length > 0) && !isLoading) {
      onSendMessage(trimmedInput, attachments.length > 0 ? attachments : undefined);
      setInput('');
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Enter to submit, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmedInput = input.trim();
      if ((trimmedInput || attachments.length > 0) && !isLoading) {
        onSendMessage(trimmedInput, attachments.length > 0 ? attachments : undefined);
        setInput('');
        setAttachments([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    if (!speechRecognitionRef.current || !speechSupported) return;

    if (isRecording) {
      speechRecognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Store current input as base for this recording session
      baseInputRef.current = input;
      setIsRecording(true);
      speechRecognitionRef.current.start(
        (result) => {
          if (result.isFinal) {
            // Add final transcript to the base input
            setInput(baseInputRef.current + (baseInputRef.current ? ' ' : '') + result.transcript);
            setIsRecording(false);
            speechRecognitionRef.current?.stop();
          } else {
            // Show interim results in real-time (base + interim transcript)
            setInput(baseInputRef.current + (baseInputRef.current ? ' ' : '') + result.transcript);
          }
        },
        (error) => {
          console.error('Speech recognition error:', error);
          setIsRecording(false);
          alert(error);
        }
      );
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <div 
      className={`input-box-container ${isDragOver ? 'drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {attachments.length > 0 && (
        <div className="attachments-preview">
          {attachments.map((attachment, index) => (
            <div key={index} className="attachment-item">
              {attachment.type === 'image' && (
                <img 
                  src={`data:${attachment.mimeType};base64,${attachment.data}`}
                  alt={attachment.name || 'Attachment'}
                  className="attachment-preview-image"
                />
              )}
              <button
                type="button"
                className="attachment-remove"
                onClick={() => removeAttachment(index)}
                aria-label="Remove attachment"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="input-form">
        <button
          type="button"
          className="attach-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          aria-label="Attach file"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="file-input-hidden"
          aria-label="Select file"
        />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isLoading ? 'Waiting for response...' : 'Type your message...'}
          disabled={isLoading}
          rows={1}
          className="message-input"
        />
        {speechSupported && (
          <button
            type="button"
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={isLoading}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            🎤
          </button>
        )}
        <button 
          type="submit" 
          disabled={(!input.trim() && attachments.length === 0) || isLoading}
          className="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
}

