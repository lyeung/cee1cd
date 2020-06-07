const express = require('express');
const bodyParser = require('body-parser');
const Git = require('nodegit');

const app = express();
const port = process.env.PORT || 6000;

app.use(bodyParser.json());
app.post('/projects', (req, res, next) => {
	const { name, url } = req.body;
	console.log('name', name, 'url', url);
	res.status(200).send();
});

app.listen(port, () => console.log(`listening at port ${port}`));

