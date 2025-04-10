import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { portalClient } from '../../io/PortalClient';

interface UserSetupFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

/**
 * Form for setting up the initial admin user during the setup process
 */
const UserSetupForm: React.FC<UserSetupFormProps> = ({ onSuccess, onError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Client-side validation
  const validateForm = (): boolean => {
    if (username.trim().length < 4) {
      setValidationError('Username must be at least 4 characters');
      return false;
    }
    
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create the admin user via Portal client
      const response = await portalClient.createAdminUser(username, password, confirmPassword);
      
      if (response.success) {
        onSuccess();
      } else {
        setValidationError(response.message || 'Failed to create admin user');
      }
    } catch (err: any) {
      console.error('Error creating admin user:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setValidationError(errorMessage);
      onError(`Failed to create admin user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Create Admin User
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Please create an administrator account to continue the setup process.
        This account will have full access to the system.
      </Typography>
      
      {validationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationError}
        </Alert>
      )}
      
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        margin="normal"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoFocus
        disabled={loading}
        inputProps={{ minLength: 4 }}
      />
      
      <TextField
        label="Password"
        type="password"
        variant="outlined"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
        inputProps={{ minLength: 8 }}
      />
      
      <TextField
        label="Confirm Password"
        type="password"
        variant="outlined"
        fullWidth
        margin="normal"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={loading}
        error={confirmPassword !== '' && password !== confirmPassword}
        helperText={confirmPassword !== '' && password !== confirmPassword ? 'Passwords do not match' : ''}
      />
      
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        sx={{ mt: 2 }}
        disabled={loading}
      >
        {loading ? 'Creating User...' : 'Create Admin User'}
      </Button>
    </Box>
  );
};

export default UserSetupForm;