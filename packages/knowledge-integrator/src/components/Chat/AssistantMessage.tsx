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
        p: 3, // Reduced padding
        bgcolor: 'background.paper',
        maxWidth: '90%',
        alignSelf: 'flex-start',
        borderRadius: '0.75rem', // Slightly smaller radius
        borderTopLeftRadius: '0.05rem',
        boxShadow: 1, // Lighter shadow
        fontFamily: '"IBM Plex Sans", sans-serif',
        fontSize: { xs: '0.8125rem', sm: '0.8125rem', md: '0.8125rem', lg: '0.8125rem' }, // Smaller font
        lineHeight: { xs: 1, sm: 1, md: 1, lg: 1 } // Tighter line height
      }}
    >
      <Box 
        sx={{
          '& p': { 
            fontSize: '0.875rem', 
            marginBottom: 1.5,
            lineHeight: 1.6
          },
          '& h1, & h2, & h3, & h4': { 
            color: '#90cdf4',
            marginTop: 2,
            marginBottom: 1
          },
          '& h1': { fontSize: '1.25rem' },
          '& h2': { fontSize: '1.125rem' },
          '& h3': { fontSize: '1rem' },
          '& h4': { fontSize: '0.875rem' },
          '& ul, & ol': { 
            fontSize: '0.875rem',
            paddingLeft: 3,
            marginBottom: 1.5
          },
          '& li': { 
            marginBottom: 0.5,
            lineHeight: 1.5
          },
          '& code': {
            backgroundColor: '#1f2937',
            color: '#93c5fd',
            padding: '0.125rem 0.25rem',
            borderRadius: '0.25rem',
            fontSize: '0.8125rem',
            fontFamily: 'monospace'
          },
          '& pre': {
            backgroundColor: '#1f2937',
            color: '#e5e7eb',
            padding: 2,
            borderRadius: '0.5rem',
            overflow: 'auto',
            fontSize: '0.8125rem',
            marginBottom: 1.5,
            '& code': {
              backgroundColor: 'transparent',
              padding: 0,
              color: 'inherit'
            }
          },
          '& blockquote': {
            borderLeft: '2px solid #93c5fd',
            paddingLeft: 2,
            fontStyle: 'italic',
            color: '#d1d5db',
            marginBottom: 1.5
          },
          '& table': {
            fontSize: '0.875rem',
            borderCollapse: 'collapse',
            width: '100%',
            marginBottom: 1.5,
            '& th': {
              backgroundColor: '#1f2937',
              textAlign: 'left',
              padding: 1,
              borderBottom: '1px solid #4b5563'
            },
            '& td': {
              padding: 1,
              borderBottom: '1px solid #4b5563'
            }
          },
          '& hr': {
            marginTop: 3,
            marginBottom: 3,
            borderColor: '#4b5563'
          }
        }}
      >
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </Box>
    </Paper>
  );
};

export default AssistantMessage;