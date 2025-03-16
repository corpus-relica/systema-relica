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
        maxWidth: '90%',
        alignSelf: 'flex-end',
        borderRadius: '1rem',
        borderTopRightRadius: '0.05rem',
        fontSize: { xs: '0.875rem', sm: '0.875rem', md: '0.875rem', lg: '0.875rem' },
        lineHeight: { xs: 1.5, sm: 1.55, md: 1.55, lg: 1.55 }
      }}
    >
      <Box>{content}</Box>
    </Paper>
  );
};

export default UserMessage;
