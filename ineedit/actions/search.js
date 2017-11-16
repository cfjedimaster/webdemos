const rp = require('request-promise');

function main(args) {

	return new Promise((resolve, reject) => {

		let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${args.key}&location=${args.lat},${args.lng}&radius=${args.radius}&type=${args.type}`;
		rp(url)
		.then(result => {
			resolve({result:JSON.parse(result).results});
		})
		.catch(e => {
			console.log('error!',e);
			reject(e);
		});

	});
}