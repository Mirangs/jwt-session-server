const uuid = require('uuid')
const bcrypt = require('bcrypt')
const UserModel = require('../models/user')
const emailService = require('../services/email')
const tokenService = require('../services/token')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')

class UserService {
  async registration(email, password) {
    const existUser = await UserModel.findOne({ email }, { _id: true })
    if (existUser) {
      throw ApiError.BadRequest(`User with email ${email} already exists`)
    }

    const activationLink = uuid.v4()
    const hashedPassword = await bcrypt.hash(password, 3)
    const user = new UserModel({
      email,
      password: hashedPassword,
      activationLink,
    })
    const [success, error] = await emailService.sendActivationMail(
      user.email,
      `${process.env.API_URL}/api/activate/${activationLink}`
    )
    if (error || !success) {
      throw new Error('Cannot send activation mail')
    }

    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    await user.save()

    return {
      ...tokens,
      user: userDto,
    }
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({
      activationLink,
      isActivated: false,
    })
    if (!user) {
      throw ApiError.BadRequest('Incorrect activation link')
    }

    user.isActivated = true
    await user.save()
  }

  async login(email, password) {
    const user = await UserModel.findOne({ email, isActivated: true })
    if (!user) {
      throw ApiError.BadRequest(`User with email ${email} not found`)
    }

    const isPasswordMatches = await bcrypt.compare(password, user.password)
    if (!isPasswordMatches) {
      throw ApiError.BadRequest('Password is incorrect')
    }

    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id, tokens.refreshToken)

    return {
      ...tokens,
      user: userDto,
    }
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken)
    return token
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError()
    }

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)
    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError()
    }

    const user = await UserModel.findById(userData.id)
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id, tokens.refreshToken)

    return {
      ...tokens,
      user: userDto,
    }
  }

  async getAllUsers() {
    const users = await UserModel.find()
    return users
  }
}

module.exports = new UserService()
