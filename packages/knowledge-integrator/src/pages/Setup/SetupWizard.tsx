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
  AdminUserData 
} from '../../PortalClient';
import { portalSocket, SetupStatus, SetupStatusBroadcastEvent } from '../../PortalSocket';
import { PrismEvents } from '@relica/websocket-contracts';
import { SETUP_STATES } from '@relica/constants';
import { withRetry, SetupError } from '../../utils/ErrorHandler';
import ProgressStage from './ProgressStage';
import UserSetupForm from './UserSetupForm';
import DebugPanel from '../../components/DebugPanel';

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

interface SetupWizardProps {
  onSetupComplete?: () => Promise<void>;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete }) => {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    setupRequired: true,
    state: { id: SETUP_STATES.IDLE, full_path: [SETUP_STATES.IDLE] },
    progress: 0,
    status: 'Initializing...'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [guestTokenObtained, setGuestTokenObtained] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check setup status on component mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  // Setup simple Socket.IO listener for status updates
  useEffect(() => {
    const handleSetupStatusUpdate = (broadcastEvent: SetupStatusBroadcastEvent) => {
      console.log('📊 Received setup status update:', broadcastEvent);
      
      // Transform canonical format to frontend format
      const canonicalStatus = broadcastEvent;
      // const frontendStatus: SetupStatus = {
      //   setupRequired: canonicalStatus.status !== 'setup_complete',
      //   state: {
      //     id: canonicalStatus.status,
      //     substate: canonicalStatus.stage,
      //     full_path: canonicalStatus.stage
      //       ? [canonicalStatus.status, canonicalStatus.stage]
      //       : [canonicalStatus.status]
      //   },
      //   progress: canonicalStatus.progress,
      //   status: canonicalStatus.message,
      //   error: canonicalStatus.error,
      // };

      setSetupStatus(canonicalStatus);
      
      // React to error state
      if (canonicalStatus.error) {
        setError(canonicalStatus.error);
      } else if (error) {
        setError(''); // Clear previous errors
      }
    };

    // Listen for canonical setup status updates
    portalSocket.on(PrismEvents.SETUP_STATUS_UPDATE, handleSetupStatusUpdate);

    return () => {
      portalSocket.off(PrismEvents.SETUP_STATUS_UPDATE, handleSetupStatusUpdate);
    };
  }, [error]);

  // Fallback polling for setup progress (backup to WebSocket)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // Only poll if WebSocket is not connected and setup is in progress
    console.log('🔧 Setup status updated:', setupStatus);
    if (!portalSocket.isConnected() &&
        setupStatus.status !== SETUP_STATES.IDLE &&
        setupStatus.status !== SETUP_STATES.AWAITING_USER_CREDENTIALS &&
        setupStatus.status !== SETUP_STATES.SETUP_COMPLETE) {
      console.log('📡 WebSocket not connected, falling back to polling');
      intervalId = setInterval(() => {
        checkSetupStatus(false); // Don't show errors during polling
      }, 5000); // Poll every 5 seconds as fallback (less aggressive)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [setupStatus.stage, portalSocket.isConnected()]);

  const checkSetupStatus = async (showErrors = true) => {
    try {
      const result = await withRetry(() => getSetupStatus(), {
        maxRetries: 3,
        baseDelay: 1000
      });
      
      setSetupStatus(result.status);
      setLoading(false);
      setRetryCount(0); // Reset retry count on success
      
      if (result.error) {
        setError(result.error);
      } else if (error) {
        setError(''); // Clear any previous errors
      }
    } catch (err) {
      console.error('Failed to check setup status:', err);
      setRetryCount(prev => prev + 1);
      
      if (showErrors) {
        const setupError = err instanceof SetupError ? err : SetupError.fromError(err);
        setError(`Connection failed: ${setupError.message}${setupError.retryable ? ' (retrying...)' : ''}`);
      }
      
      setLoading(false);
    }
  };

  const obtainGuestToken = async () => {
    if (guestTokenObtained) return;
    
    try {
      const { token } = await withRetry(() => getGuestToken(), {
        maxRetries: 2,
        baseDelay: 1000
      });
      
      localStorage.setItem('access_token', token);
      setGuestTokenObtained(true);
    } catch (err) {
      console.error('Failed to obtain guest token:', err);
      const setupError = err instanceof SetupError ? err : SetupError.fromError(err);
      setError(`Authentication failed: ${setupError.message}. Please refresh and try again.`);
    }
  };

  const handleStartSetup = async () => {
    setError('');
    
    try {
      await obtainGuestToken();
      
      const result = await withRetry(() => startSetup(), {
        maxRetries: 2,
        baseDelay: 2000
      });
      
      if (result.success) {
        // Status will be updated by the WebSocket or polling
        await checkSetupStatus(false); // Don't show errors immediately
      } else {
        setError(result.message || 'Setup initiation failed');
      }
    } catch (err) {
      console.error('Failed to start setup:', err);
      const setupError = err instanceof SetupError ? err : SetupError.fromError(err);
      setError(`Setup failed to start: ${setupError.message}`);
    }
  };

  const handleCreateAdminUser = async (userData: AdminUserData) => {
    setError('');
    
    try {
      const result = await withRetry(() => createAdminUser(userData), {
        maxRetries: 2,
        baseDelay: 2000,
        retryCondition: (error) => {
          // Don't retry on validation errors (4xx except timeout/rate limit)
          const status = error.response?.status;
          if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
          return true;
        }
      });
      
      if (result.success) {
        // Setup will continue automatically
        await checkSetupStatus(false);
      } else {
        setError(result.message || 'Failed to create admin user');
      }
    } catch (err) {
      console.error('Failed to create admin user:', err);
      const setupError = err instanceof SetupError ? err : SetupError.fromError(err);
      setError(`User creation failed: ${setupError.message}`);
    }
  };

  const handleSetupComplete = async () => {
    if (onSetupComplete) {
      try {
        await onSetupComplete();
      } catch (error) {
        console.error("Setup completion callback failed:", error);
        // Fallback to page reload if callback fails
        localStorage.removeItem('access_token');
        window.location.reload();
      }
    } else {
      // Fallback behavior if no callback provided
      localStorage.removeItem('access_token');
      window.location.reload();
    }
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
  if (setupStatus.status === SETUP_STATES.SETUP_COMPLETE) {
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
  if (setupStatus.status === SETUP_STATES.AWAITING_USER_CREDENTIALS) {
    return (
      <WizardContainer maxWidth="md">
        <UserSetupForm
          onSubmit={handleCreateAdminUser}
          loading={setupStatus.status === SETUP_STATES.CREATING_ADMIN_USER}
          error={error}
        />
      </WizardContainer>
    );
  }

  // Setup in progress
  console.log('🔧 User credentials form rendered');
  console.log('🔧 Current setup state:', setupStatus, SETUP_STATES.IDLE);
  if (setupStatus.status !== SETUP_STATES.IDLE) {
    return (
      <WizardContainer maxWidth="md">
        <Paper 
          elevation={10} 
          sx={{ 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <ProgressStage 
            stage={setupStatus.status}
            progress={setupStatus.progress}
            status={setupStatus.message}
            error={setupStatus.error}
          />
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
          <Alert 
            severity="error" 
            sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}
            action={
              retryCount > 0 && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setError('');
                    setRetryCount(0);
                    checkSetupStatus();
                  }}
                >
                  🔄 Retry
                </Button>
              )
            }
          >
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
      
      {/* Debug panel for setup wizard */}
      {import.meta.env.DEV && <DebugPanel />}
    </WizardContainer>
  );
};

export default SetupWizard;
