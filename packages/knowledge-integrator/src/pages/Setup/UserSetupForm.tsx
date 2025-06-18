import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  styled
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AdminUserData } from '../../PortalClient';

const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 500,
  margin: '0 auto',
  textAlign: 'center',
}));

interface UserSetupFormProps {
  onSubmit: (userData: AdminUserData) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const UserSetupForm: React.FC<UserSetupFormProps> = ({ onSubmit, loading = false, error }) => {
  const [formData, setFormData] = useState<AdminUserData>({
    username: '',
    password: '',
    email: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<AdminUserData & { confirmPassword: string }>>({});

  const validateForm = (): boolean => {
    const errors: Partial<AdminUserData & { confirmPassword: string }> = {};

    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 4) {
      errors.username = 'Username must be at least 4 characters';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof AdminUserData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <FormPaper elevation={3}>
      <Typography variant="h4" gutterBottom>
        👤 Create Admin User
      </Typography>
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Create your administrator account to get started with Systema Relica
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Username"
          variant="outlined"
          value={formData.username}
          onChange={handleInputChange('username')}
          error={!!formErrors.username}
          helperText={formErrors.username || 'Choose a username (minimum 4 characters)'}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Email (Optional)"
          variant="outlined"
          type="email"
          value={formData.email || ''}
          onChange={handleInputChange('email')}
          error={!!formErrors.email}
          helperText={formErrors.email || 'Email address for account recovery'}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Password"
          variant="outlined"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleInputChange('password')}
          error={!!formErrors.password}
          helperText={formErrors.password || 'Choose a secure password (minimum 8 characters)'}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Confirm Password"
          variant="outlined"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (formErrors.confirmPassword) {
              setFormErrors(prev => ({
                ...prev,
                confirmPassword: undefined
              }));
            }
          }}
          error={!!formErrors.confirmPassword}
          helperText={formErrors.confirmPassword || 'Confirm your password'}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ 
            py: 1.5,
            fontSize: '1.1rem',
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #0097A7 90%)',
            }
          }}
        >
          {loading ? '🔄 Creating Account...' : '🚀 Create Admin Account'}
        </Button>
      </Box>
    </FormPaper>
  );
};

export default UserSetupForm;