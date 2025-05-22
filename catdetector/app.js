const IMG_FUNC = 'http://localhost:40001/';
//const IMG_FUNC = 'https://catdetector.raymondcamden.workers.dev';

// Resize logic: https://imagekit.io/blog/how-to-resize-image-in-javascript/
const MAX_WIDTH = 400;
const MAX_HEIGHT = 400;

document.addEventListener('alpine:init', () => {
  Alpine.data('catDetector', () => ({
	imageSrc:null,
	working:false,
	status:'',
    async init() {
		console.log('init');
    },
	async gotPic(e) {

		let file = e.target.files[0];
		if(!file) return;
		
		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = async e => {
			let img = document.createElement('img');
			img.onload = async e => {
				let width = img.width;
				let height = img.height;

				if(width > height) {
					if(width > MAX_WIDTH) {
						height = height * (MAX_WIDTH / width);
						width = MAX_WIDTH;
					}
				} else {
					if (height > MAX_HEIGHT) {
						width = width * (MAX_HEIGHT / height);
						height = MAX_HEIGHT;
					}
				}

				let canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				let ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, width, height);

				this.imageSrc = canvas.toDataURL(file.type);

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
				this.working = false;
				this.status = result.text;

			};
			img.src = e.target.result;

		}

	}
  }))
});

