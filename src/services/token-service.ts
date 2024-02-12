import jwt from 'jsonwebtoken';
import {prismaClient} from "../prisma-client";
import { v4 as uuidv4 } from 'uuid';

class TokenService {
  private async generateTokens(userID: string) {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessToken = jwt.sign(
      {userID: userID},
      process.env.JWT_ACCESS_SECRET!,
      {expiresIn: '15m', jwtid: accessJti}
    )
    const refreshToken = jwt.sign(
      {userID: userID},
      process.env.JWT_REFRESH_SECRET!,
      {expiresIn: '30d', jwtid: refreshJti}
    )
    return {
      accessToken,
      refreshToken,
      accessJti,
      refreshJti
    }
  }

  public async addToken(userId: string) {
    try {
      await prismaClient.refreshToken.deleteMany({
        where: {
          user_id: userId,
        },
      });

      const { accessToken, refreshToken, accessJti, refreshJti } = await this.generateTokens(userId);

      await prismaClient.refreshToken.create({
        data: {
          token: refreshToken,
          user_id: userId,
          jti: refreshJti
        },
      });

      return {
        refreshToken: refreshToken,
        accessToken: accessToken,
      };
    } catch (e) {
      throw e;
    }
  }

  public async validateAccessToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET!)
    } catch (e) {
      console.log(e)
      throw e;
    }
  }

  public async validateRefreshToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    } catch (e) {
      return null;
    }
  }

  public async deleteTokenByJti(refreshJti: string) {
    try {
      prismaClient.refreshToken.deleteMany({
        where: {
          jti: refreshJti
        }
      })
    } catch (e) {
      throw e;
    }
  }

  public async findTokenByJti(refreshJti:string) {
    try {
      return await prismaClient.refreshToken.findFirst({
        where: {
          jti: refreshJti
        }
      });
    } catch (e) {
      throw e
    }
  }
}

export default new TokenService();