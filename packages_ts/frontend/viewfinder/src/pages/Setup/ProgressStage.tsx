import React from 'react';
import { Box, Typography, LinearProgress, Stepper, Step, StepLabel, Alert } from '@mui/material';
import { SetupState } from '../../io/PrismClient';

interface ProgressStageProps {
  currentStage: SetupState['stage'];
  progress: number;
  status: string;
  error: string | null;
}

/**
 * Component to display the current progress of the setup process
 * Shows a stepper with the current stage and a progress bar
 */
const ProgressStage: React.FC<ProgressStageProps> = ({ 
  currentStage, 
  progress, 
  status,
  error 
}) => {
  // Map stages to user-friendly labels
  const stageLabels = {
    'idle': 'Not Started',
    'checking_db': 'Database Check',
    'awaiting_user_credentials': 'Admin User Setup',
    'creating_admin_user': 'Creating Admin User',
    'seeding_db': 'Database Seeding',
    'building_caches': 'Building Caches',
    'setup_complete': 'Setup Complete'
  };

  // Define the order of steps for the stepper
  const steps = [
    { id: 'idle', label: 'Start' },
    { id: 'checking_db', label: 'Database Check' },
    { id: 'awaiting_user_credentials', label: 'Admin User Setup' },
    { id: 'creating_admin_user', label: 'Creating Admin User' },
    { id: 'seeding_db', label: 'Database Seeding' },
    { id: 'building_caches', label: 'Building Caches' },
    { id: 'setup_complete', label: 'Complete' }
  ];

  // Find current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStage);
  const activeStep = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      {/* Stepper to show the stage progression */}
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step) => (
          <Step key={step.id}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Progress and status display */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Current Stage: {stageLabels[currentStage] || 'Unknown'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 10, borderRadius: 1 }}
        />
        
        <Typography variant="body1" sx={{ mt: 2 }}>
          {status}
        </Typography>
        
        {/* Display error if present */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default ProgressStage;
