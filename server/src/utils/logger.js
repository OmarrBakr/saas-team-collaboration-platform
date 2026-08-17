const serializeError = (error) => ({
  name: error?.name,
  message: error?.message,
  stack: error?.stack,
  code: error?.code,
});

const write = (level, event, fields = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  };

  process.stderr.write(`${JSON.stringify(entry)}\n`);
};

module.exports = {
  debug: (event, fields) => write('debug', event, fields),
  info: (event, fields) => write('info', event, fields),
  warn: (event, fields) => write('warn', event, fields),
  error: (event, fields) => write('error', event, fields),
  serializeError,
};
