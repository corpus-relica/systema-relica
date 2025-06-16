import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  styled
} from '@mui/material';
import { resetSystemState } from '../PortalClient';

const DebugPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  top: 20,
  right: 20,
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 0, 0, 0.1)',
  border: '2px solid red',
  zIndex: 9999,
}));

const DebugPanel: React.FC = () => {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<string>('');

  const handleResetSystem = async () => {
    setIsResetting(true);
    setResetResult('');
    
    try {
      // Clear frontend state first
      localStorage.clear();
      sessionStorage.clear();
      
      // Call backend reset
      const result = await resetSystemState();
      
      if (result.success) {
        setResetResult('✅ System reset successful! Reloading page...');
        
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setResetResult(`❌ Reset failed: ${result.message}`);
      }
    } catch (error) {
      setResetResult(`❌ Reset failed: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuickReset = () => {
    // Just clear frontend state and reload (for frontend-only testing)
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <DebugPaper elevation={10}>
        <Typography variant="h6" color="error" gutterBottom>
          🐛 DEBUG PANEL
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            onClick={handleQuickReset}
          >
            🔄 Quick Reset (Frontend Only)
          </Button>
          
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => setIsResetDialogOpen(true)}
          >
            💣 Full System Reset
          </Button>
        </Box>
        
        {resetResult && (
          <Alert 
            severity={resetResult.includes('✅') ? 'success' : 'error'} 
            sx={{ mt: 1, fontSize: '0.8rem' }}
          >
            {resetResult}
          </Alert>
        )}
      </DebugPaper>

      <Dialog
        open={isResetDialogOpen}
        onClose={() => !isResetting && setIsResetDialogOpen(false)}
      >
        <DialogTitle>🚨 Full System Reset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will completely reset the entire system:
            <br />
            • Clear Neo4j database
            <br />
            • Clear PostgreSQL database  
            <br />
            • Clear Redis cache
            <br />
            • Reset all setup state
            <br />
            • Clear frontend storage
            <br />
            <br />
            <strong>This action cannot be undone!</strong>
          </DialogContentText>
          
          {isResetting && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">Resetting system...</Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setIsResetDialogOpen(false)}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleResetSystem}
            color="error"
            variant="contained"
            disabled={isResetting}
          >
            💣 RESET EVERYTHING
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DebugPanel;