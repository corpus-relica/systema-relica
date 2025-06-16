import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Alert,
  CircularProgress,
  styled
} from '@mui/material';
import { SETUP_STATES } from '@relica/constants';

const StageBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
}));

interface ProgressStageProps {
  stage: string;
  progress: number;
  status?: string;  // Human-readable status message from backend
  error?: string;
}

const ProgressStage: React.FC<ProgressStageProps> = ({ stage, progress, status, error }) => {
  return (
    <StageBox>
      <Typography variant="h5" gutterBottom>
        🏗️ System Setup Progress
      </Typography>

      <Box sx={{ mb: 2 }}>
        {/* Display backend-provided status or fallback to stage */}
        <Typography variant="h6" gutterBottom>
          {status || stage || 'Processing...'}
        </Typography>
        
        {/* Show spinner for any active stage except idle and complete */}
        {stage && stage !== SETUP_STATES.IDLE && stage !== SETUP_STATES.SETUP_COMPLETE && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2">Processing...</Typography>
          </Box>
        )}
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 4, mb: 2 }}
        />
        
        <Typography variant="body2" color="textSecondary">
          {progress}% Complete
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Error:</strong> {error}
          </Typography>
        </Alert>
      )}
    </StageBox>
  );
};

export default ProgressStage;