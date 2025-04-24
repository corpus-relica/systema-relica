import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { portalClient, SetupState } from '../../io/PortalClient';
import UserSetupForm from './UserSetupForm';
import ProgressStage from './ProgressStage';

import { closeWebSocket, portalWs } from "../../socket.js";

/**
 * SetupWizard component that handles the initial system setup process
 * Displays different screens based on the current setup stage from Prism
 */
const SetupWizard: React.FC = (props) => {
  const {initialState} = props;
  const [setupState, setSetupState] = useState<SetupState | null>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const setLoadingAccordingToState = useCallback((state: SetupState) => {
    switch(state.state.id ) {
      case 'idle':
      case 'awaiting_user_credentials':
      case 'setup_complete':
        setLoading(false);
      break;
      default:
        setLoading(true);
      break;
    }
  }, [setLoading])

  const onPrismSetupUpdate = (event: CustomEvent) => {
    const state = event.payload;
    setLoadingAccordingToState(state);
    setSetupState(state)
  }

  useEffect(() => {

    setLoadingAccordingToState(setupState);

    portalWs.on("portal:prismSetupUpdate", onPrismSetupUpdate);

    return () => {
      portalWs.off("portal:prismSetupUpdate", onPrismSetupUpdate);
    };

  }, []);


  // Start setup process if not already started
  // const startSetup = async () => {
  //   try {
  //     setLoading(true);
  //   } catch (err) {
  //     console.error('Error starting setup:', err);
  //     setError('Failed to start setup process. Please try again later.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };


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

  const onInitializeSetup = async () => {
    console.log("Initialize setup");
    portalClient.startSetup();
  }

  const onFinalizeSetup = async () => {
    try {
      // setLoading(true);
      // await portalClient.finalizeSetup();
      // navigate('/login'); // Redirect to the main application
      closeWebSocket();
      window.location.href = '/';
    } catch (err) {
      console.error('Error finalizing setup:', err);
      setError('Failed to finalize setup. Please try again later.');
    } finally {
      setLoading(false);
    }
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
        
        {setupState && setupState.state.id !== 'idle' && (
          <>
            <ProgressStage
              currentStage={setupState.state.id}
              progress={setupState.progress} 
              status={setupState.status}
              error={setupState.error}
            />
            
            {/* User setup form - only shown during user-setup stage */}
            {setupState.state.id === 'awaiting_user_credentials' && (
              <UserSetupForm 
                onSuccess={()=>{console.log("success")}}
                onError={(msg) => setError(msg)}
              />
            )}
            
            {/* Loading indicator for processing stages */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            )}


            {setupState.state.id === 'setup_complete' && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" align="center">
                  Setup Complete! You can now access the system.
                </Typography>
                {/* Button to navigate to the main application */}
                <Button variant="contained" color="primary" onClick={onFinalizeSetup}>
                  Finalize Setup
                </Button>
              </Box>
            )}
          </>
        )}

            {setupState.state.id === 'idle' && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" align="center">
                  Setup not started. Click the button below to begin.
                </Typography>
                {/* Button to navigate to the main application */}
                <Button variant="contained" color="primary" onClick={onInitializeSetup}>
                  Initialize Setup
                </Button>
              </Box>
            )}
      </Paper>
    </Container>
  );
};

export default SetupWizard;
