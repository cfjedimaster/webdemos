//const IMG_FUNC = 'http://localhost:8787/';
const IMG_FUNC = 'https://catdetector.raymondcamden.workers.dev';

document.addEventListener('alpine:init', () => {
  Alpine.data('catDetector', () => ({
	imageSrc:null,
	working:false,
	status:'',
    async init() {
		console.log('init');
    },
	async gotPic(e) {
		/*
		this.imageSrc = URL.createObjectURL(e.target.files[0]);
		*/
		let file = e.target.files[0];
		if(!file) return;
		
		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = async e => {
			this.imageSrc = e.target.result;
			this.working = true;
			this.status = '<i>Sending image data to Google Gemini...</i>';

			let body = {
				imgdata:this.imageSrc
			}

			let resp = await fetch(IMG_FUNC, {
				method:'POST', 
				body: JSON.stringify(body)
			});

			let result = await resp.json();
			console.log(result);
			this.working = false;
			this.status = result.text;

		}

	}
  }))
});