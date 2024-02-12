import {ApiError} from "../exceptions/api-error";
import tokenService from "../services/token-service";

export async function authMiddleware(req:any, res, next) {
  try {
    const accessToken = req.headers.authorization;
    if(!accessToken) {
      return next(ApiError.UnauthorizedError())
    }

    const accessTokenWithoutBearer = accessToken.split(' ')[1];

    if(!accessTokenWithoutBearer) {
      return next(ApiError.UnauthorizedError())
    }

    const token =  await tokenService.validateAccessToken(accessTokenWithoutBearer);
    if(!token) {
      return next(ApiError.UnauthorizedError())
    }

    req.headers.authorization = token
    next()
  } catch (e) {
    return  next(ApiError.UnauthorizedError())
  }
}
