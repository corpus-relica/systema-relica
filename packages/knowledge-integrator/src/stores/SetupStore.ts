import { makeAutoObservable, runInAction } from "mobx";

// Simple reactive store that just reflects backend state
class SetupStore {
  // Backend-driven state
  setupRequired = true;
  stage = '';
  progress = 0;
  message = '';
  error = '';
  
  // UI state
  isChecking = true;
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  // Update from backend status
  updateFromBackend(data: {
    setupRequired?: boolean;
    stage?: string;
    progress?: number;
    message?: string;
    error?: string;
  }) {
    runInAction(() => {
      if (data.setupRequired !== undefined) this.setupRequired = data.setupRequired;
      if (data.stage !== undefined) this.stage = data.stage;
      if (data.progress !== undefined) this.progress = data.progress;
      if (data.message !== undefined) this.message = data.message;
      if (data.error !== undefined) this.error = data.error;
    });
  }

  setChecking(checking: boolean) {
    this.isChecking = checking;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  clearError() {
    this.error = '';
  }

  // Simple computed values based on backend stage
  get isComplete() {
    return this.stage === 'setup_complete' || !this.setupRequired;
  }

  get needsUserInput() {
    return this.stage === 'awaiting_user_credentials';
  }

  get isInProgress() {
    return this.stage && this.stage !== 'idle' && this.stage !== 'setup_complete' && this.stage !== 'awaiting_user_credentials';
  }
}

export default SetupStore;