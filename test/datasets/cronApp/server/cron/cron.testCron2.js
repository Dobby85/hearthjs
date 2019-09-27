const hearthjs = require('../../../../../lib/index')
const fs = require('fs')
const path = require('path')

hearthjs.cron.add('testCron2', '* * * * * *', () => {
  fs.writeFile(path.join(__dirname, 'cron2'), 'Test cron 2', (err) => {
    if (err) {
      console.log(err)
    }
  })
})

hearthjs.cron.start('testCron2')
