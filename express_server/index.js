const express = require('express')
const app = express()
const path = require('path');
const port = process.env.PORT || 5000

const allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, HEAD, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, access_token, X-Requested-With, Origin, Accept');

if('OPTIONS' === req.method){
		res.sendStatus(200);
	} else {
		next();
	}
}

app.use(allowCrossDomain)
app.use(express.static(path.join(__dirname, '../react_app/build')));

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../react_app/build/index.html'));
})

app.listen(port, () => {
  console.log(`listening on *:${port}`);
})
