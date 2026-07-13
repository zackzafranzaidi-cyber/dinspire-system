const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Format log kustom
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const logger = createLogger({
  level: 'info',
  format: customFormat,
  defaultMeta: { service: 'dinspire-api' },
  transports: [
    // Simpan semua log ralat (error) ke fail berasingan (cth: error-2023-10-01.log)
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d' // Simpan selama 14 hari
    }),
    // Simpan semua log aktiviti ke fail combined (cth: combined-2023-10-01.log)
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d'
    })
  ]
});

// Semasa pembangunan (development), kita juga mahu melihat log di skrin Terminal
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

module.exports = logger;
