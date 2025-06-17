import { Controller, Get, Post, Body } from '@nestjs/common';
import { SetupService } from './setup.service';

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
}

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  getStatus() {
    return {
      success: true,
      data: this.setupService.getSetupState(),
    };
  }

  @Post('start')
  startSetup() {
    this.setupService.startSetup();
    return {
      success: true,
      data: {
        message: 'Setup process started',
        ...this.setupService.getSetupState(),
      },
    };
  }

  @Post('create-user')
  createUser(@Body() createUserDto: CreateUserDto) {
    const { username, email, password } = createUserDto;

    // Basic validation
    if (!username || !email || !password) {
      return {
        success: false,
        error: {
          code: 'validation-error',
          type: 'input-validation',
          message: 'Username, email, and password are required',
        },
      };
    }

    // if (password !== confirmPassword) {
    //   return {
    //     success: false,
    //     error: {
    //       code: 'validation-error',
    //       type: 'input-validation',
    //       message: 'Passwords do not match',
    //     },
    //   };
    // }

    this.setupService.submitCredentials(username, email, password);

    return {
      success: true,
      data: {
        message: 'User creation initiated',
        ...this.setupService.getSetupState(),
      },
    };
  }

  @Post('debug/reset-system')
  async resetSystem() {
    console.log('🚨 DEBUG: System reset requested');
    
    try {
      const result = await this.setupService.resetSystem();
      
      return {
        success: result.success,
        message: result.message,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('DEBUG: System reset failed:', error);
      return {
        success: false,
        message: `System reset failed: ${error.message}`,
        errors: [error.message],
        timestamp: new Date().toISOString(),
      };
    }
  }
}
