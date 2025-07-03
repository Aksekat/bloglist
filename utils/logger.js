const info = (...params) => {
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log(...params)
  }
}

const error = (...params) => {
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV !== 'test') {
    console.error(...params)
  }
}

module.exports = { info, error }