require('dotenv').config()

export const config = {
  dirs: {
    appsHome: process.env.APPS_HOME_PATH,
    userDir: process.env.USER_DIRS_PATH,
    gitHome: process.env.GIT_HOME_PATH,
  },
  git: {
    remotePrefix: process.env.GIT_REMOTE_PREFIX,
  },
  mongo: {
    mongoUrl: process.env.MONGO_URL,
    passwordLength: parseInt(process.env.MONGO_PASSWORD_LENGTH || '8'),
  },
  system: {
    ports: {
      min:  parseInt(process.env.PORT_MIN || '20000'),
      max:  parseInt(process.env.PORT_MAX || '30000'),
    }
  }
}