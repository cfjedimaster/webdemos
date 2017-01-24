let $button, $img, imageCapture;

document.addEventListener('DOMContentLoaded', init, false);
function init() {

	$button = document.querySelector('#takePictureButton');
	$img = document.querySelector('#testImage');

	navigator.mediaDevices.getUserMedia({video: true})
	.then(setup)
	.catch(error => console.error('getUserMedia() error:', error));


}

function setup(mediaStream) {
	$button.addEventListener('click', takePic);
	$img.addEventListener('load', getSwatches);

	const mediaStreamTrack = mediaStream.getVideoTracks()[0];
	imageCapture = new ImageCapture(mediaStreamTrack);

}

function takePic() {

	imageCapture.takePhoto()
	.then(res => {
		$img.src = URL.createObjectURL(res);
	});

}

function getSwatches() {
	let colorThief = new ColorThief();
	var colorArr = colorThief.getPalette($img, 5);
	console.dir(colorArr);
	for (var i = 0; i < Math.min(5, colorArr.length); i++) {
		document.querySelector('#swatch'+i).style.backgroundColor = "rgb("+colorArr[i][0]+","+colorArr[i][1]+","+colorArr[i][2]+")";		
	}
}