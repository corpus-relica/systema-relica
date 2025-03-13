import React from 'react';
import { Paper, Box } from '@mui/material';

interface AssistantMessageProps {
  content: string;
}

const AssistantMessage = ({ content }: AssistantMessageProps) => {
  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        maxWidth: '80%',
        alignSelf: 'flex-start',
        borderRadius: '1rem',
        borderTopLeftRadius: '0.25rem',
        boxShadow: 1
      }}
    >
      <Box sx={{ whiteSpace: 'pre-wrap' }}>{content}</Box>
    </Paper>
  );
};

export default AssistantMessage;
