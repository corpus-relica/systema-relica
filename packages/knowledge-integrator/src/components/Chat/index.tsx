import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Box, Stack, TextField, Button, InputAdornment } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import { observer } from 'mobx-react';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  messages: Message[];
  onSubmit: (message: string) => void;
}

const Chat = observer(({ messages, onSubmit }: ChatProps) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll when messages change

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onSubmit(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    console.log("Key pressed:", event.key);
    if (event.key === 'Enter') {
      // Allow Ctrl+Enter for new line
      if (event.ctrlKey) {
        console.log("Ctrl+Enter pressed");
        setInputValue(inputValue + '\n');
        return;
      }
      // Prevent default Enter behavior and submit
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column' }}>
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        bgcolor: '#515151',
        p: 2,
        borderRadius: 2,
        fontSize: { xs: '0.875rem', sm: '1rem' },
        lineHeight: { xs: 1.5, sm: 1.75 }
      }}>
        <Stack spacing={2}>
          {messages.map((message, index) => (
            message.role === 'user' ? (
              <UserMessage key={index} content={message.content} />
            ) : (
              <AssistantMessage key={index} content={message.content} />
            )
          ))}
          <div ref={messagesEndRef} />
        </Stack>
      </Box>

      <Box sx={{ mt: 2, p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            placeholder="Enter your prompt"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mt: 1.5 }}>
                  <MicIcon />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiInputBase-root': {
                alignItems: 'flex-start',
                padding: 1
              }
            }}
          />
          <Button 
            variant="contained" 
            endIcon={<SendIcon />} 
            sx={{ py: 2 }}
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
          >
            Send
          </Button>
        </Stack>
      </Box>
    </Box>
  );
});

export default Chat;