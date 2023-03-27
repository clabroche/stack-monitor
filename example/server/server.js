const express = require('express')
const app = express()
const port = process.env.PORT || 3000
app.use(require('cors')())
app.get('/', function (req, res) {
  res.send('Hello World!')
})
app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`)
  console.log(JSON.stringify(['stack-monitor', "debug:", {port} ]));
})
