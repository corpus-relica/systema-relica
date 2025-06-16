import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Typography,
  Alert,
  CircularProgress,
  styled
} from '@mui/material';
import { SetupStatus } from '../../PortalClient';

const StyledStepper = styled(Stepper)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StageBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
}));

interface ProgressStageProps {
  setupStatus: SetupStatus;
}

const STAGE_LABELS = {
  idle: '🌟 Ready to Begin',
  checking_db: '🔍 Database Connection',
  awaiting_user_credentials: '👤 User Credentials',
  creating_admin_user: '🛠️ Creating Admin User',
  seeding_db: '🌱 Seeding Database',
  building_caches: '⚡ Building Caches',
  setup_complete: '✅ Setup Complete'
};

const STAGES = Object.keys(STAGE_LABELS) as Array<keyof typeof STAGE_LABELS>;

const ProgressStage: React.FC<ProgressStageProps> = ({ setupStatus }) => {
  const { stage, progress, message, error } = setupStatus;
  const currentStepIndex = STAGES.indexOf(stage);

  return (
    <StageBox>
      <Typography variant="h5" gutterBottom>
        🏗️ System Setup Progress
      </Typography>
      
      <StyledStepper activeStep={currentStepIndex} alternativeLabel>
        {STAGES.map((stageKey) => (
          <Step key={stageKey}>
            <StepLabel>{STAGE_LABELS[stageKey]}</StepLabel>
          </Step>
        ))}
      </StyledStepper>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {STAGE_LABELS[stage]}
        </Typography>
        
        {stage !== 'idle' && stage !== 'setup_complete' && (
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

      {message && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message}
        </Typography>
      )}

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