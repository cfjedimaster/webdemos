/*
Simple Node script to read in a few JSON files (soon to be text too) 
and output a JSON output that can be saved into a file.
*/
const fs = require('fs');

//let rooms = fs.readFileSync('./rooms.json', 'UTF-8');
let aliases = fs.readFileSync('./aliases.json', 'UTF-8');
let commands = fs.readFileSync('./commands.json', 'UTF-8');

let data = {};
//data.rooms = JSON.parse(rooms);
data.aliases = JSON.parse(aliases);
data.commands = JSON.parse(commands);
data.rooms = {};

/*
now parse everything in rooms
*/
let rooms = fs.readdirSync('./rooms');
let descRe = /<description>([\s\S]+)<\/description>/m;
let exitRe = /<exits>([\s\S]+)<\/exits>/m;

rooms.forEach(room => {
	let r = {};
	let roomContent = fs.readFileSync('./rooms/'+room,'UTF-8');
	let desc = roomContent.match(descRe);
	r.description = desc[1].trim();

	let exitStr = (roomContent.match(exitRe))[1].trim();
	let exitArr = exitStr.split(/\r\n/);

	r.exits = [];
	exitArr.forEach(e => {
		let [dir,loc] = e.split('|');
		r.exits.push({"dir":dir, "room":loc});
	});

	let name = room.split('.')[0];
	data.rooms[name] = r;
});

console.log(JSON.stringify(data));