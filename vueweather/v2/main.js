const app = new Vue({
	el:'#app',
	data:{
		loading:true,
		lat:null,
		lon:null,
		location:null,
		temp:null,
		temp_low:null,
		temp_high:null,
		images:{
			"rain":[
				"clouds.jpg"
			],
			"catchall":[
				"clouds.jpg"
			]
		},
		selectedImage:null
	},
	created() {

		navigator.geolocation.getCurrentPosition(pos => {
			console.log('got coordinates', pos.coords);
			this.lat = pos.coords.latitude;
			this.lon = pos.coords.longitude;
			this.loadWeather();
		});

	},
	methods:{
		loadWeather() {

			axios.get(`https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(SELECT%20woeid%20FROM%20geo.places%20WHERE%20text%3D%22(${this.lat}%2C${this.lon})%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`)
			.then(res => {
				let weather = res.data.query.results.channel;
				console.log('response',weather);
				
				this.location = weather.location.city + ", " + weather.location.region;
				this.temp = weather.item.condition.temp;
				this.temp_low = weather.item.forecast[0].low;
				this.temp_high = weather.item.forecast[0].high;
				this.desc = weather.item.condition.text;

				//get the proper image
				this.selectedImage = this.getWeatherImage(weather);
				console.log(this.selectedImage);
				//reach out to the DOM, bad ray
				/*
				document.body.style.background = `url(${this.selectedImage})`;
				document.body.style['background-image'] = `
				linear-gradient(
					rgba(1,0,0,0.5),
					rgba(0,0,0,0.5)
				), url(${this.selectedImage});`;
				*/
				document.body.style.background = `url(${this.selectedImage})`;

				this.loading = false;
				
			})
			.catch(e => {
				console.error(e);
			});
				
		},
		getWeatherImage(d) {
			/*
			Alrighty then - so to be clear, this is VERY specific for Yahoo. Yahoo supports (https://developer.yahoo.com/weather/documentation.html)
			49 unique weather codes. We're going to use some logic to break them down into a smaller subset. So for example, fair(day) and fair(night) will just be fair. blowing snow, snow, flurries, etc will be snow. In theory, what we simplify down to could be a set list such that if
			we switch to another service, we still return the same core results. In theory.

			Note that I expect some people may not like the 'groupings' I made. Change it how you will! :)
			Some of these I just completely punted on, like smokey and dust
			*/

			let weather = '';
			let code = d.item.condition.code;
			console.log('weather code is '+code);
			
			if(code >= 0 && code <= 4) weather = 'storm';
			if(code >= 5 && code <= 12) weather = 'rain';
			if(code >= 13 && code <= 16) weather = 'snow';
			if(code === 17 || code === 18) weather = 'rain'; // hail and sleet
			//todo: 19 dust
			if(code >= 20 && code <= 22) weather = 'foggy';
			if(code >= 23 && code <= 24) weather = 'windy';
			//todo: 25 cold (seriously - cold is a condition?)
			if(code >= 26 && code <= 30) weather = 'cloudy';
			if(code >= 31 && code <= 36) weather = 'clear'; // this include 36=hot
			if(code >= 37 && code <= 39) weather = 'storm';
			if(code === 40) weather = 'rain';
			if(code >= 41 && code <= 43) weather = 'snow';
			if(code === 44) weather = 'cloudy';
			if(code === 45) weather = 'storm';
			if(code === 46) weather = 'snow';
			if(code === 47) weather = 'storm';
			console.log('weather is '+weather);
			/*
			Ok, so now the logic is this.

			If the user specified this.images[TYPE], we expect it to be an an array and we 
			select a random one.

			Otherwise, we look for this.images.catchall, also an array, and pick randomly.
			*/
			if(this.images[weather]) {
				return this.images[weather][getRandomInt(0, this.images[weather].length)];
			} else {
				return this.images['catchall'][getRandomInt(0, this.images['catchall'].length)];
			}
		}
	}

});

//Thank you, MDN
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}