const nodemailer = require('nodemailer')
require('dotenv').config()

class EmailService {
  constructor() {
    const options = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    }
    this.transporter = nodemailer.createTransport(options)
  }

  async sendActivationMail(to, link) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: `Account activation on ${process.env.API_URL}`,
        html: `
          <div>
            <h1>Click link to activate your account</h1>
            <a href="${link}">${link}</a>
          </div>
        `,
      })
      return [true, null]
    } catch (e) {
      console.error(e)
      return [false, e]
    }
  }
}

module.exports = new EmailService()
