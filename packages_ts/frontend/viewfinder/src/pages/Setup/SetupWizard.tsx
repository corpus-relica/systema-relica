import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { prismApi, SetupState } from '../../io/PrismClient';
import UserSetupForm from './UserSetupForm';
import ProgressStage from './ProgressStage';

/**
 * SetupWizard component that handles the initial system setup process
 * Displays different screens based on the current setup stage from Prism
 */
const SetupWizard: React.FC = () => {
  const [setupState, setSetupState] = useState<SetupState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Function to fetch the current setup state from Prism
  const fetchSetupState = async () => {
    try {
      setLoading(true);
      const state = await prismApi.getSetupStatus();
      setSetupState(state);
      
      // If setup is complete, reload the app to show the login screen
      if (state.stage === 'complete') {
        window.location.href = '/'; // Force full page reload to restart the app
      }
    } catch (err) {
      console.error('Error fetching setup state:', err);
      setError('Failed to connect to setup service. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Start setup process if not already started
  const startSetup = async () => {
    try {
      setLoading(true);
      await prismApi.startSetup();
      await fetchSetupState();
    } catch (err) {
      console.error('Error starting setup:', err);
      setError('Failed to start setup process. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Process the current stage (except user-setup which requires input)
  const processCurrentStage = async () => {
    try {
      setLoading(true);
      const response = await prismApi.processStage();
      setSetupState(response.state);
      
      // If setup is complete after processing, reload the app
      if (response.state.stage === 'complete') {
        window.location.href = '/'; // Force full page reload to restart the app
      }
    } catch (err: any) {
      console.error('Error processing stage:', err);
      
      // Special handling for user-setup stage which requires user input
      if (err.response?.status === 400 && err.response?.data?.requiresUserInput) {
        // This is expected for user-setup stage, just update the UI
        await fetchSetupState();
      } else {
        setError(`Failed to process setup stage: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load - fetch setup state
  useEffect(() => {
    fetchSetupState();
  }, []);

  // When setup state changes to a new stage, automatically process non-user stages
  useEffect(() => {
    if (setupState && setupState.stage !== 'user-setup' && setupState.stage !== 'complete' && setupState.stage !== 'not-started') {
      processCurrentStage();
    }
  }, [setupState?.stage]);

  // If setup hasn't started yet, start it
  useEffect(() => {
    if (setupState?.stage === 'not-started') {
      startSetup();
    }
  }, [setupState]);

  // Render loading state
  if (loading && !setupState) {
    return (
      <Container maxWidth="sm" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh' 
      }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Checking system status...
        </Typography>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh' 
      }}>
        <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
          {error}
        </Alert>
        <Typography variant="body1">
          Please refresh the page to try again.
        </Typography>
      </Container>
    );
  }

  // Render the appropriate stage component based on setupState
  return (
    <Container maxWidth="md" sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      py: 4
    }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          System Setup
        </Typography>
        
        {setupState && (
          <>
            <ProgressStage 
              currentStage={setupState.stage} 
              progress={setupState.progress} 
              status={setupState.status}
              error={setupState.error}
            />
            
            {/* User setup form - only shown during user-setup stage */}
            {setupState.stage === 'user-setup' && (
              <UserSetupForm 
                onSuccess={fetchSetupState}
                onError={(msg) => setError(msg)}
              />
            )}
            
            {/* Loading indicator for processing stages */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default SetupWizard;