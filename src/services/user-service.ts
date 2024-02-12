import bcrypt from 'bcrypt';
import {IAuthUser} from "../models/IAuthUser";
import {prismaClient} from "../prisma-client";
import {ApiError} from "../exceptions/api-error";
import TokenService from "./token-service";
import tokenService from "./token-service";
import {UserDto} from "../dtos/user-dto";

class UserService {
  public async registration(user: IAuthUser): Promise<any> {
    try {
      if (!!await this.isUserExist(user.email)) {
        throw ApiError.BadRequest(`A user with the same email: ${user.email} already exists!`)
      }

      const hashPassword = await bcrypt.hash(user.password, 10);

      const userDB = await prismaClient.user.create({
        data: {
          email: user.email,
          username: user.username,
          hash_password: hashPassword,
        }
      })

      return await TokenService.addToken(userDB.id);
    } catch (e) {
      throw e;
    }
  }

  public async login(user: IAuthUser) {
    try {
      const userDB = await this.isUserExist(user.email);

      if(!userDB) {
        throw ApiError.BadRequest('User not found!')
      }

      const passwordMatch = await bcrypt.compare(user.password, userDB.hash_password);

      if (!passwordMatch) {
        throw ApiError.BadRequest('Incorrect password!');
      }
      return await TokenService.addToken(userDB.id);
    } catch (e) {
      throw e;
    }
  }

  public async refresh(refreshToken:string) {
    try {
      if(!refreshToken) {
        throw ApiError.UnauthorizedError();
      }
      const decodedRefreshToken = await tokenService.validateRefreshToken(refreshToken);

      if(!decodedRefreshToken) {
        throw ApiError.UnauthorizedError()
      }

      if(typeof decodedRefreshToken === 'object') {
        const refreshJti = decodedRefreshToken.jti;
        if(!refreshJti) {
          throw ApiError.UnauthorizedError()
        }

        const refreshTokenFromDB = refreshJti && await tokenService.findTokenByJti(refreshJti);
        if(!refreshTokenFromDB || refreshTokenFromDB.user_id !== decodedRefreshToken.userID) {
          throw ApiError.UnauthorizedError()
        }

        const user = await this.findUserById(decodedRefreshToken.userID);

        if(!user) {
          throw ApiError.UnauthorizedError()
        }

        return await TokenService.addToken(user.id)
      }
    } catch (e) {
      throw e
    }
  }

  public async logout(refreshToken: string) {
    try {
      const decodedRefreshToken = await tokenService.validateRefreshToken(refreshToken);

      if(!decodedRefreshToken) {
        throw ApiError.BadRequest('bad request')
      }

      if(typeof decodedRefreshToken === 'object') {
        const refreshJti = decodedRefreshToken?.jti;

        if(!refreshJti)  {
          throw ApiError.BadRequest('bad request')
        }

        const refreshTokenFromDB = refreshJti && await tokenService.findTokenByJti(refreshJti);

        if(!refreshTokenFromDB) {
          throw ApiError.BadRequest('bad request')
        }

        if(decodedRefreshToken.userID !== refreshTokenFromDB.user_id) {
          throw ApiError.BadRequest('bad request')
        }

        await tokenService.deleteTokenByJti(refreshJti)
      }
    } catch (e) {
      throw e;
    }
  }

  private async findUserById(userID: string) {
    try {
      const userDB = prismaClient.user.findFirst({
        where: {
          id: userID
        }
      });

      return userDB;
    } catch (e) {
      throw e
    }
  }

  private async isUserExist(email: string): Promise<any> {
    const user = await prismaClient.user.findFirst({
      where: {
        email,
      }
    })

    return user
  }

  public async getUser(refreshToken: string) {
    try {
      if(!refreshToken) {
        ApiError.BadRequest('bad request')
      }
      const decodedRefreshToken = await tokenService.validateRefreshToken(refreshToken);
      if(!decodedRefreshToken) {
        throw ApiError.UnauthorizedError()
      }

      if(typeof decodedRefreshToken === 'object') {
        const userId = decodedRefreshToken.userID;
        if(!userId) {
          throw ApiError.BadRequest('bad request')
        }

        const user = await this.findUserById(userId);
        if(!user) {
          throw ApiError.UnauthorizedError()
        }

        return new UserDto(user)
       }
    } catch (e) {
      throw e
    }
  }
}

export default new UserService();