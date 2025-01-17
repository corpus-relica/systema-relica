import { SetMetadata } from '@nestjs/common';

// export const Auth = (...args: string[]) => SetMetadata('auth', args);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
