document.addEventListener('DOMContentLoaded', init, false);
var pug, $input, $data, $result, $jsonError, $pugError;
function init() {
    pug = require('pug');
    $input = document.querySelector('#input');
    $data = document.querySelector('#data');
    $result = document.querySelector('#result');
    $jsonError = document.querySelector('#jsonError');
    $pugError = document.querySelector('#pugError');

    $input.addEventListener('input', doRender, false);
    $data.addEventListener('input', doRender, false);
    console.log('Ready');

}

function doRender() {
    var input = $input.value;
    var data = $data.value;

    $pugError.innerHTML='';

    if(!input.length) return;

    if(data.length) {
        try {
            data = JSON.parse(data);
            console.log(data);
            $jsonError.innerHTML='';
        } catch(e) {
            console.log('invalid json');
            $jsonError.innerHTML = 'Invalid JSON';
            data = {};
        }
    } else { 
        data = {};
        $jsonError.innerHTML='';
    }
    try {
        var result = pug.render(input, data);
        console.log(result);
        $result.innerHTML = result;
    } catch(e) {
        console.log('pug error');
        $pugError.innerHTML = e.message;
        console.dir(e);
    }
}