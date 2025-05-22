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
      {/* Enhanced markdown styling with a compact, technical appearance */}
      <Box className="
        prose prose-invert max-w-none

        /* font size */
        prose-p:text-sm
        prose-ul:text-sm
        prose-ol:text-sm
        prose-li:text-sm
        prose-headings:text-sm
        
        /* Compact spacing */
        prose-p:my-2
        prose-ul:my-2
        prose-ol:my-2
        prose-li:my-1
        prose-headings:mt-3
        prose-headings:mb-2
        
        /* horizontal rule */
        prose-hr:my-6
        
        /* Technical appearance */
        prose-code:font-mono
        prose-pre:font-mono
        
        /* Code blocks */
        prose-pre:bg-gray-800
        prose-pre:text-gray-100
        prose-pre:p-2
        prose-pre:rounded-md
        prose-pre:text-sm
        
        /* Inline code */
        prose-code:text-blue-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
        
        /* Headings */
        prose-h1:text-blue-300 prose-h2:text-blue-300 prose-h3:text-blue-300 prose-h4:text-blue-300
        prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm
        
        /* Lists */
        prose-ul:pl-4 prose-ol:pl-4
        
        /* Tables */
        prose-table:text-sm prose-table:border-collapse prose-table:w-full
        prose-th:bg-gray-800 prose-th:text-left prose-th:p-1 prose-th:border prose-th:border-gray-700
        prose-td:border prose-td:border-gray-700 prose-td:p-1
        
        /* Blockquotes */
        prose-blockquote:border-l-2 prose-blockquote:border-blue-300 prose-blockquote:pl-2
        prose-blockquote:italic prose-blockquote:text-gray-300 prose-blockquote:my-2

        /* Line height */
        prose-p:leading-normal
        prose-ul:leading-tight
        prose-ol:leading-tight
        prose-li:leading-tight
        prose-headings:leading-normal
      ">
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </Box>
    </Paper>
  );
};

export default AssistantMessage;
