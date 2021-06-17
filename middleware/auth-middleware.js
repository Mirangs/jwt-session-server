const ApiError = require('../exceptions/api-error')
const tokenService = require('../services/token')

module.exports = function (req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization
    if (!authorizationHeader) {
      return next(ApiError.UnauthorizedError())
    }

    const [_, accessToken] = authorizationHeader.split(' ')
    if (!accessToken) {
      return next(ApiError.UnauthorizedError())
    }

    const userData = tokenService.validateAccessToken(accessToken)
    if (!userData) {
      return next(ApiError.UnauthorizedError())
    }

    req.user = userData
    next()
  } catch (e) {
    next(ApiError.UnauthorizedError())
  }
}
