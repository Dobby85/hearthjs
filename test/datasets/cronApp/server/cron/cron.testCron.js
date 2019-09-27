const hearthjs = require('../../../../../lib/index')
const fs = require('fs')
const path = require('path')

hearthjs.cron.add('testCron', '* * * * * *', () => {
  fs.writeFile(path.join(__dirname, 'cron1'), 'Test cron', (err) => {
    if (err) {
      console.log(err)
    }
  })
}, { start: true })
