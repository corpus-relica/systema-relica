import React from 'react';
import { Paper, Box } from '@mui/material';

interface AssistantMessageProps {
  content: string;
}

const AssistantMessage = ({ content }: AssistantMessageProps) => {
  // Escape double quotes and handle other special characters
  const escapedContent = content
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        maxWidth: '90%',
        alignSelf: 'flex-start',
        borderRadius: '1rem',
        borderTopLeftRadius: '0.05rem',
        boxShadow: 1,
        fontSize: { xs: '0.875rem', sm: '0.875rem', md: '0.875rem', lg: '0.875rem' },
        lineHeight: { xs: 1.5, sm: 1.55, md: 1.55, lg: 1.55 }
      }}
    >
      <Box sx={{ whiteSpace: 'pre-wrap' }}>{JSON.parse(`"${escapedContent}"`)}</Box>
    </Paper>
  );
};

export default AssistantMessage;
