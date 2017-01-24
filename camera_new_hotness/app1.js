let $button, $img, $capa, $dev;

document.addEventListener('DOMContentLoaded', init, false);
function init() {

	$button = document.querySelector('#takePictureButton');
	$img = document.querySelector('#testResult');
	$capa = document.querySelector('#capaDiv');
	$dev = document.querySelector('#devDiv');

	console.log('Ok, time to test...');

	navigator.mediaDevices.getUserMedia({video: true})
	.then(gotMedia)
	.catch(error => console.error('getUserMedia() error:', error));
}

function gotMedia(mediaStream) {

	const mediaStreamTrack = mediaStream.getVideoTracks()[0];
	const imageCapture = new ImageCapture(mediaStreamTrack);

	//sniff details
	imageCapture.getPhotoCapabilities().then(res => {
		console.log(res);
		/*
		hard coded dump of capabiltiies. i know for most 
		items there are keys under them, but nothing more complex
		*/
		let s = '<h2>Capabilities</h2>';
		for(let key in res) {
			s += '<h3>'+key+'</h3>';
			if(typeof res[key] === "string") {
				s += '<p>'+res[key]+'</p>';
			} else {
				s += '<ul>';
				for(let capa in res[key]) {
					s += '<li>'+capa+'='+res[key][capa]+'</li>';
				}
				s += '</ul>';
			}
			s += '';
		}
		$capa.innerHTML = s;
	});

	//sniff devices
	navigator.mediaDevices.enumerateDevices().then((devices) => {
		console.log(devices);
		let s = '<h2>Devices</h2>';
		// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
		devices.forEach(device => {
			s += device.kind +': ' + device.label + ' id='+device.deviceId + '<br/>';
		});
		$dev.innerHTML = s;
	});

	$button.addEventListener('click', e => {
		console.log('lets take a pic');
		imageCapture.takePhoto()
		.then(res => {
			$img.src = URL.createObjectURL(res);
		});
	}, false);
}