const express = require('express')
const app = express()
const port = process.env.PORT || 3000
app.use(require('cors')())
app.get('/', function (req, res) {
  console.log(JSON.stringify({route: '/health'}))
  res.send('Hello World!')
})
app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`)
  console.log(JSON.stringify(['stack-monitor', "debug:", {port} ]));
})

setTimeout(() => { // Simulate a health check failed
  process.exit(1)
}, 5000);