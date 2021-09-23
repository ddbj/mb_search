const express = require('express')
const app = express()
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({});
const path = require('path');
const port = process.env.PORT || 5000
const index = process.env.INDEX || '/mb-project3,mb-file3/*'
const es = process.env.ES || 'http://localhost:9200/'

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

app.post(index, (req, res) => {
  proxy.web(req, res, {
    target: es,
    secure: false
  });
})
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../react_app/build/index.html'));
})

app.listen(port, () => {
  console.log(`listening on *:${port}`);
})
