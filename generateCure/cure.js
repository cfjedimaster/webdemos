// source: https://en.wikipedia.org/wiki/Category:The_Cure_songs

let input = `10:15 Saturday Night
The 13th
Accuracy
Alt.end
Another Day
Boys Don't Cry
Carnage Visors
Catch
The Caterpillar
Charlotte Sometimes
Close to Me
Cut Here
The Drowning Man
The End of the World
Faith
Fascination Street
The Figurehead
The Final Sound
Fire in Cairo
A Forest
Forever
Freakshow
Friday I'm in Love
Gone!
Grinding Halt
High
Homesick
Hot Hot Hot!!!
I'm a Cult Hero
In Between Days
It's Not You
Jumping Someone Else's Train
Just Like Heaven
Killing an Arab
Kyoto Song
Let's Go to Bed
A Letter to Elise
The Love Cats
Lovesong
Lullaby
Maybe Someday
Meathook
Mint Car
Never Enough
Object
One Hundred Years
The Only One
Other Voices
Out of This World
The Perfect Boy
Pictures of You
Pornography
Prayers for Rain
Primary
Purple Haze
A Reflection
The Hanging Garden
Sleep When I'm Dead
So What
Strange Attraction
Subway Song
Taking Off
Three
Three Imaginary Boys
The Walk
Why Can't I Be You?
Wrong Number`;

input = input.split('\n');

var generator = titlegen.create();
generator.feed(input);

const app = new Vue({
	el:'#app',
	data() {
		return {
			title:""
		}
	},
	created() {
		this.newTitle();
	},
	methods: {
		newTitle() {
			console.log('generating cureness');
			this.title = generator.next();
		}
	}
});

/*
var generator = titlegen.create();


input = input.split('\n');
generator.feed(input);
 
console.log(generator.next()); 
*/