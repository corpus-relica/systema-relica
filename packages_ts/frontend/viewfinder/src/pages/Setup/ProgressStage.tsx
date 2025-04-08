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
    'not-started': 'Not Started',
    'db-check': 'Database Check',
    'user-setup': 'Admin User Setup',
    'db-seed': 'Database Seeding',
    'cache-build': 'Building Caches',
    'complete': 'Setup Complete'
  };

  // Define the order of steps for the stepper
  const steps = [
    { id: 'db-check', label: 'Database Check' },
    { id: 'user-setup', label: 'Admin User Setup' },
    { id: 'db-seed', label: 'Database Seeding' },
    { id: 'cache-build', label: 'Building Caches' },
    { id: 'complete', label: 'Complete' }
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