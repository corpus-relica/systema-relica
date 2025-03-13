import React from 'react';
import { Paper, Box } from '@mui/material';

interface UserMessageProps {
  content: string;
}

const UserMessage = ({ content }: UserMessageProps) => {
  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        maxWidth: '80%',
        alignSelf: 'flex-end',
        borderRadius: '1rem',
        borderTopRightRadius: '0.25rem'
      }}
    >
      <Box>{content}</Box>
    </Paper>
  );
};

export default UserMessage;
