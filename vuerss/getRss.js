'use strict';

const Parser = require('rss-parser');
const parser = new Parser();

module.exports = function(context, cb) {
	let url = '';
	if(context.body && context.body.url) url = context.body.url;
	if(context.query && context.query.url) url = context.query.url;
	if(url === '') cb(new Error('URL parameter not passed.'));
	console.log('gonna parse '+url);
	
 	parser.parseURL(url)
	.then(feed => {
		console.log(feed);
		cb(null, {feed:feed});
	})
	.catch(e => {
		cb(e);
	});
	
}


