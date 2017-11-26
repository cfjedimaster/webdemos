const rp = require('request-promise');

function main(args) {

	return new Promise((resolve, reject) => {

		let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${args.key}&location=${args.lat},${args.lng}&radius=${args.radius}&type=${args.type}`;
		rp(url)
		.then(result => {
			result = JSON.parse(result);
			if(result.error_message) {
				reject({"error":result.error_message});
			} else {
				resolve({result:result.results});
			}
		})
		.catch(e => {
			console.log('error!',e);
			reject(e);
		});

	});
}