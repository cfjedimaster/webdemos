((global) => {

	console.log('running slow');
	setTimeout(() => {
		global.slow = {
			name:'something slow'
		};
	}, 2000);

})(window);

