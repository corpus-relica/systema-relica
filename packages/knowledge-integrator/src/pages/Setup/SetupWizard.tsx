import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert,
  Fade,
  styled
} from '@mui/material';
import { 
  getSetupStatus, 
  startSetup, 
  createAdminUser, 
  getGuestToken,
  SetupStatus,
  AdminUserData 
} from '../../PortalClient';
import { 
  portalSocket, 
  addSetupProgressListener, 
  addSetupCompleteListener, 
  addSetupErrorListener 
} from '../../PortalSocket';
import ProgressStage from './ProgressStage';
import UserSetupForm from './UserSetupForm';

const WizardContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: theme.spacing(3),
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}));

const WelcomePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  marginBottom: theme.spacing(3),
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
}));

const SetupWizard: React.FC = () => {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    setupRequired: true,
    stage: 'idle',
    progress: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [guestTokenObtained, setGuestTokenObtained] = useState(false);

  // Check setup status on component mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  // Setup WebSocket listeners for real-time updates
  useEffect(() => {
    const removeProgressListener = addSetupProgressListener((data) => {
      console.log('📊 Received setup progress:', data);
      setSetupStatus(prevStatus => ({
        ...prevStatus,
        stage: data.stage as any,
        progress: data.progress,
        message: data.message,
        error: data.error
      }));
    });

    const removeCompleteListener = addSetupCompleteListener((data) => {
      console.log('🎉 Setup completed:', data);
      setSetupStatus(prevStatus => ({
        ...prevStatus,
        stage: 'setup_complete',
        progress: 100,
        message: 'Setup completed successfully!'
      }));
    });

    const removeErrorListener = addSetupErrorListener((data) => {
      console.error('⚠️ Setup error:', data);
      setError(data.message || 'An error occurred during setup');
    });

    // Subscribe to setup updates when component mounts
    portalSocket.subscribeToSetupUpdates();

    return () => {
      removeProgressListener();
      removeCompleteListener();
      removeErrorListener();
      portalSocket.unsubscribeFromSetupUpdates();
    };
  }, []);

  // Fallback polling for setup progress (backup to WebSocket)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // Only poll if WebSocket is not connected and setup is in progress
    if (!portalSocket.isConnected() &&
        setupStatus.stage !== 'idle' && 
        setupStatus.stage !== 'awaiting_user_credentials' && 
        setupStatus.stage !== 'setup_complete') {
      console.log('📡 WebSocket not connected, falling back to polling');
      intervalId = setInterval(() => {
        checkSetupStatus();
      }, 3000); // Poll every 3 seconds as fallback
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [setupStatus.stage, portalSocket.isConnected()]);

  const checkSetupStatus = async () => {
    try {
      const status = await getSetupStatus();
      setSetupStatus(status);
      setLoading(false);
      
      if (status.error) {
        setError(status.error);
      }
    } catch (err) {
      console.error('Failed to check setup status:', err);
      setError('Failed to connect to server. Please check your connection.');
      setLoading(false);
    }
  };

  const obtainGuestToken = async () => {
    if (guestTokenObtained) return;
    
    try {
      const { token } = await getGuestToken();
      localStorage.setItem('access_token', token);
      setGuestTokenObtained(true);
    } catch (err) {
      console.error('Failed to obtain guest token:', err);
      setError('Failed to obtain guest access. Please refresh and try again.');
    }
  };

  const handleStartSetup = async () => {
    setError('');
    
    try {
      await obtainGuestToken();
      
      const result = await startSetup();
      if (result.success) {
        // Status will be updated by the polling effect
        await checkSetupStatus();
      } else {
        setError(result.message || 'Failed to start setup process');
      }
    } catch (err) {
      console.error('Failed to start setup:', err);
      setError('Failed to start setup process. Please try again.');
    }
  };

  const handleCreateAdminUser = async (userData: AdminUserData) => {
    setError('');
    
    try {
      const result = await createAdminUser(userData);
      if (result.success) {
        // Setup will continue automatically, status polling will pick it up
        await checkSetupStatus();
      } else {
        setError(result.message || 'Failed to create admin user');
      }
    } catch (err) {
      console.error('Failed to create admin user:', err);
      setError('Failed to create admin user. Please try again.');
    }
  };

  const handleSetupComplete = () => {
    // Clear guest token and trigger app re-initialization
    localStorage.removeItem('access_token');
    window.location.reload();
  };

  if (loading) {
    return (
      <WizardContainer maxWidth="md">
        <WelcomePaper elevation={10}>
          <Typography variant="h4" gutterBottom>
            🔄 Loading Setup Status...
          </Typography>
        </WelcomePaper>
      </WizardContainer>
    );
  }

  // Setup complete - show success and redirect
  if (setupStatus.stage === 'setup_complete') {
    return (
      <WizardContainer maxWidth="md">
        <Fade in timeout={1000}>
          <WelcomePaper elevation={10}>
            <Typography variant="h3" gutterBottom>
              🎉 Setup Complete!
            </Typography>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
              Systema Relica has been successfully configured
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleSetupComplete}
              sx={{ 
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #388E3C 30%, #689F38 90%)',
                }
              }}
            >
              🚀 Launch Application
            </Button>
          </WelcomePaper>
        </Fade>
      </WizardContainer>
    );
  }

  // User credentials needed
  if (setupStatus.stage === 'awaiting_user_credentials') {
    return (
      <WizardContainer maxWidth="md">
        <UserSetupForm
          onSubmit={handleCreateAdminUser}
          loading={setupStatus.stage === 'creating_admin_user'}
          error={error}
        />
      </WizardContainer>
    );
  }

  // Setup in progress
  if (setupStatus.stage !== 'idle') {
    return (
      <WizardContainer maxWidth="md">
        <Paper 
          elevation={10} 
          sx={{ 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <ProgressStage setupStatus={setupStatus} />
        </Paper>
      </WizardContainer>
    );
  }

  // Initial welcome screen
  return (
    <WizardContainer maxWidth="md">
      <WelcomePaper elevation={10}>
        <Typography variant="h2" gutterBottom>
          🌟 Welcome to Systema Relica
        </Typography>
        
        <Typography variant="h5" color="textSecondary" sx={{ mb: 4 }}>
          A powerful knowledge management and semantic modeling platform
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          This setup wizard will help you configure your Systema Relica installation. 
          We'll set up your database, create your admin account, and prepare your 
          knowledge base for first use.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={handleStartSetup}
          sx={{ 
            py: 2,
            px: 4,
            fontSize: '1.2rem',
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #0097A7 90%)',
            }
          }}
        >
          🚀 Begin Setup
        </Button>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" color="textSecondary">
            Setup typically takes 2-3 minutes to complete
          </Typography>
        </Box>
      </WelcomePaper>
    </WizardContainer>
  );
};

export default SetupWizard;