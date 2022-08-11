
document.addEventListener('DOMContentLoaded', init, false);
let qrScanner, videoElem, resultElem, addElem, tableElem, downloadElem;
let contactsDb;
let contact, contactOrig;

function init() {
	console.log('init');
	videoElem = document.querySelector('#cam');
	resultElem = document.querySelector('#resultData');
  addElem = document.querySelector('#saveContact');
  tableElem = document.querySelector('#contactsTable tbody');
  downloadElem = document.querySelector('#downloadContacts');

	qrScanner = new QrScanner(
		videoElem,
		scanResult,
		{ returnDetailedScanResult: true },
	);

	let scanBtn = document.querySelector('#scanQR');
	scanBtn.addEventListener('click', startScan, false);

  contactsDb = new Dexie('contactsDb');
  contactsDb.version(1).stores({contacts:'++id,contact.fullname'})

  addElem.addEventListener('click', saveContact);
  downloadElem.addEventListener('click', downloadContacts);

  renderContacts();
	console.log('finit');
}

function startScan() {
	console.log('scan start');
  contact = null;
  addElem.setAttribute('disabled','disabled');
	qrScanner.start();
}

function scanResult(r) {
	console.log(r.data);
	qrScanner.stop();
	contact = parseVCard(r.data);
  contactOrig = r.data;
	resultElem.innerText = contact.name;
  addElem.removeAttribute('disabled');
  console.log(contact);
}

async function saveContact() {
  console.log('saveContact');
  await contactsDb.contacts.put({ contact, originalContact:contactOrig, created:new Date() });
  resultElem.innerText = '';
  addElem.setAttribute('disabled','disabled');
  renderContacts();
  console.log('done');
}

function parseVCard(str) {
  let result = {};
  
  let fieldMap = {
  	'N':'name',
    'FN':'fullname',
    'EMAIL':'email',
    'TITLE':'title',
    'ORG':'org',
    'EMAIL':'email',
    'ADR':'address',
    'TEL':'telephone',
    'VERSION':'version'
  }

  str = str.trim();
  str.split(/[\r\n]/).forEach(l => {
	console.log('l================',l);
    let [ key, value ] = l.split(':');
    if(key === 'BEGIN' || key === 'END') return;
    console.log(key, '===', value);

    // Ok, so unless key has ; in it, we're simple
    if(key.indexOf(';') === -1) {
    	result[fieldMap[key]] = value.trim(); 
    } else {
      // So in theory, it will ALWAYS be type=
      let [newKey, newType] = key.split(';');
      // and type can be TYPE=(nothing), so let's just keep it simple
      newType = newType.replace('TYPE=','');
      /*
	  so type should always be blank or a value, but I've seen FAX,FAX which isn't valid, 
      so I'm going to split and [0]
      */
      if(newType.length) {
        newType = newType.split(',')[0].toLowerCase();
      }
      result[fieldMap[newKey]] = {
        type:newType,
        value:value
      }
      console.log('newKey', newKey);
      console.log('newType', newType);
    }
  });
  
  return result;
}

async function renderContacts() {
  let contacts = await contactsDb.contacts.toArray();
  let html = '';
  contacts.forEach(c => {
    html += `
    <tr>
      <td>${c.contact.fullname ?? c.contact.name}</td>
      <td>${dtFormat(c.created)}</td>
    </tr>`;
  });
  tableElem.innerHTML = html;
}

function dtFormat(d) { 
	const english = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: 'numeric', year: 'numeric', month: 'numeric', day: 'numeric' });
  return english.format(d);
}

async function downloadContacts() {
  console.log('do the download');
  let zip = new JSZip();
  let contacts = await contactsDb.contacts.toArray();
  contacts.forEach(c => {
    let file = c.id + '.vcf';
    zip.file(file, c.originalContact);
  });

  zip.generateAsync({ type: 'blob' }).then(function (content) {
    saveAs(content, 'contacts.zip');
  });

}