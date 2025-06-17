export const mockUsersService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  clearAllUsers: jest.fn(),
  count: jest.fn(),
};

export const setupUsersServiceMockDefaults = () => {
  mockUsersService.create.mockResolvedValue({
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
    is_admin: true,
    created_at: new Date(),
    updated_at: new Date(),
  });
  
  mockUsersService.clearAllUsers.mockResolvedValue(undefined);
  mockUsersService.count.mockResolvedValue(0);
  mockUsersService.findByEmail.mockResolvedValue(null);
  mockUsersService.findOne.mockResolvedValue(null);
  mockUsersService.findById.mockResolvedValue(null);
};