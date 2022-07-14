
let $status, $searchForm, $searchButton, $twitterAccount, $results;

const endpoint = 'https://eo73fogw8n2gknw.m.pipedream.net';

document.addEventListener('DOMContentLoaded', init, false);

function init() {
	$status = document.querySelector('#statusArea');
	$searchForm = document.querySelector('#searchForm');
	$searchButton = document.querySelector('#searchButton');
	$twitterAccount = document.querySelector('#twitterAccount');
	$results = document.querySelector('#results');

	$searchButton.addEventListener('click', search);
	$searchForm.style.display = '';

}

async function search() {
	let account = $twitterAccount.value.trim();
	if(!account) return;
	if(account.indexOf('@') === 0) account = account.replace('@','');
	$results.style.display = 'none';
	$status.innerText = `Finding images for the account, ${account}.`;
	let resp = await fetch(endpoint + `?account=${encodeURIComponent(account)}`);
	let data = await resp.json();

	if(data.length > 0) {
		let html = '';

		data.forEach(i => {
			html += `
	<div><a href="${i}" class="lightbox" data-group="twitterImageResults"><img src="${i}"></a></div>
			`;
		});
	} else html = '<div>Sorry, but no results were found. Twitter Search API results are date limited.</div>';

	$status.style.display = 'none';
	$results.innerHTML = html;
	$results.style.display = '';
	const prvs = new Parvus();

}