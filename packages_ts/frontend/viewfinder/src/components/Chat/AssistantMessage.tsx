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
        boxShadow: 2,
        fontSize: { xs: '0.875rem', sm: '0.875rem', md: '0.875rem', lg: '0.875rem' },
        lineHeight: { xs: 1.5, sm: 1.55, md: 1.55, lg: 1.55 }
      }}
    >
      {/* prose-invert for dark mode, max-w-none to override prose's max-width */}
      <Box className="prose prose-invert max-w-none prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-code:text-blue-300 prose-code:bg-gray-800 prose-code:before:content-[''] prose-code:after:content-['']">
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </Box>
    </Paper>
  );
};

export default AssistantMessage;
