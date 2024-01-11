const cron = require('node-cron');
const pool = require('./database');

module.exports.initialize = () => {
  // runs every
  // minute 0
  // hour *
  // month-day *
  // month *
  // week-day *
  cron.schedule('0 * * * *', async () => {
    const connection = await pool.getConnection();
    try {
      await connection.execute('DELETE FROM sessions WHERE expiry_time <= NOW()');
      console.log('cleaned up sessions')
    } catch (error) {
      console.error(error)
    } finally {
      connection.release();
    }
  })
}