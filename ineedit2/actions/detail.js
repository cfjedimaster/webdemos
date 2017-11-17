const rp = require('request-promise');

function main(args) {

	return new Promise((resolve, reject) => {

		let url = `https://maps.googleapis.com/maps/api/place/details/json?key=${args.key}&placeid=${args.placeid}`;
		console.log(url);
		rp(url)
		.then(result => {
			resolve({result:JSON.parse(result).result});
		})
		.catch(e => {
			console.log('error!',e);
			reject(e);
		});

	});
}