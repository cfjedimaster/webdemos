let $button, $img, imageCapture, mediaStreamTrack, $video;

document.addEventListener('DOMContentLoaded', init, false);
function init() {

	$button = document.querySelector('#startVideoButton');
	$img = document.querySelector('#testImage');
	$video = document.querySelector('#testVideo');

	navigator.mediaDevices.getUserMedia({video: true})
	.then(setup)
	.catch(error => console.error('getUserMedia() error:', error));


}

function setup(mediaStream) {
	$video.srcObject = mediaStream;
	$img.addEventListener('load', getSwatches);

	mediaStreamTrack = mediaStream.getVideoTracks()[0];
	imageCapture = new ImageCapture(mediaStreamTrack);

	setInterval(getFrame,300);
}

function getFrame() {

		console.log('running interval');

		imageCapture.grabFrame()
		.then(blob => {
			//console.log('im in the got frame part');
			let $canvas = document.createElement('canvas');
			$canvas.width = blob.width;
			$canvas.height = blob.height;
			$canvas.getContext('2d').drawImage(blob, 0,0, blob.width, blob.height);
			
			$img.src = $canvas.toDataURL('image/png');
		});

}

function getSwatches() {
	let colorThief = new ColorThief();
	var colorArr = colorThief.getPalette($img, 5);
	for (var i = 0; i < Math.min(5, colorArr.length); i++) {
		document.querySelector('#swatch'+i).style.backgroundColor = "rgb("+colorArr[i][0]+","+colorArr[i][1]+","+colorArr[i][2]+")";		
	}
}