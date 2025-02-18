import { User } from '../models/users';

class UserService {
  static getInstance() {
    return new UserService();
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return User.findOne({
      where: {
        email,
      },
    });
  }

  async getUserByIdentifier(identifier: string) {
    return User.findOne({
      where: {
        identifier,
      },
      raw: true,
    });
  }

  async getUsersByIdentifiers(identifiers: string[]) {
    return User.findAll({
      where: {
        identifier: identifiers,
      },
      raw: true,
    });
  }
}
export const userService = UserService.getInstance();
