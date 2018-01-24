const app = new Vue({
	el:'#app',
	data() {
		return {
			imageSrc:null,
			swatches:[]
		}
	},
	mounted() {
		if("serviceWorker" in navigator) {
			navigator.serviceWorker.register('./serviceworker.js')
			.then((registration) => {
				console.log('Service Worker installed!');
			}).catch((err) => {
				console.error('Service Worker failed', err);
			});
		}
	},
	methods:{
		gotPic(event) {
			this.imageSrc = URL.createObjectURL(event.target.files[0]);
		},
		getSwatches() {
	
			let colorThief = new ColorThief();
			let colorArr = colorThief.getPalette(this.$refs.theImage,5);
			//reset
			this.swatches = [];	
			colorArr.forEach(c => {
				let style = {
					backgroundColor:"rgb(" + c[0] + "," + c[1] + "," + c[2] +")"
				}
				this.swatches.push({style});			
			});
		}
	}
});