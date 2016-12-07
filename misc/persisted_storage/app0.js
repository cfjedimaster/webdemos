/*
https://twitter.com/Paul_Kinlan/status/806620449685827584
*/

$(document).ready(function() {

	if (navigator.storage && navigator.storage.persist) {
		//First, see if we already have it
		navigator.storage.persisted().then(persistent => {
			if(persistent) {
				console.log('already granted');
				appReady();
			} else {
				console.log('not already granted, lets ask for it');
				navigator.storage.persist().then(granted => {
					if (granted) {
						console.log("persisted storage granted ftw");
					} else {
						console.log("sad face");
					}
					appReady();
				});
			}
		});

	} else {
		appReady();
	}



});

function appReady() {
	console.log('Lets do it!');
	//now just store crap
	if(!window.localStorage.getItem('count')) window.localStorage.setItem('count', 0);
	let currentCount = Number(window.localStorage.getItem('count')) + 1;
	console.log('Value is '+currentCount);
	window.localStorage.setItem('count', currentCount);

}