import React from 'react';
import { Paper, Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface AssistantMessageProps {
  content: string;
}

const AssistantMessage = ({ content }: AssistantMessageProps) => {
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
      <Box className="prose prose-slate">
        <ReactMarkdown>
          {content}
          </ReactMarkdown>
      </Box>
    </Paper>
  );
};

export default AssistantMessage;
