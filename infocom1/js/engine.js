class GameEngine {
    constructor() {
        this.outputEl = document.querySelector('#output');
        this.inputEl = document.querySelector('#command-input');

        this.parser = new Parser();

        this.state = {
            currentRoom: null,
            inventory: [],
            // Track state of items in rooms vs taken
            roomItems: {} // e.g., { "start": ["lightsaber", "cat food"] }
        };

        this.init();
    }

    async init() {
        this.printLine("Initializing Galactic Feline Adventures...");
        this.printLine("Loading game data...\n");

        // Setup input event listener
        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.inputEl.value;
                this.inputEl.value = ''; // clear input
                this.handleInput(command);
            }
        });

        // Ensure focus stays on input when clicking around
        document.addEventListener('click', () => {
            if (window.getSelection().toString() === "") {
                this.inputEl.focus();
            }
        });

        // Load starting room
        await this.moveToRoom('start');
    }

    printLine(text, className = '') {
        const p = document.createElement('div');
        if (className) p.className = className;

        // If it's just raw text with might have simple linebreaks, handle it,
        // but normally we use printHTML for markdown.
        p.innerText = text;

        this.outputEl.appendChild(p);
        this.scrollToBottom();
    }

    printHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        this.outputEl.appendChild(div);
        this.scrollToBottom();
    }

    printEcho(command) {
        this.printLine(`> ${command}`, 'command-echo');
    }

    scrollToBottom() {
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }

    async moveToRoom(roomId) {
        const roomData = await RoomLoader.loadRoom(roomId);
        if (!roomData) {
            this.printLine(`[Error] Could not load room data for '${roomId}'.`, 'error-text');
            return;
        }

        this.state.currentRoom = roomData;

        // Initialize room items in state if not seen before
        if (!this.state.roomItems[roomId]) {
            this.state.roomItems[roomId] = [...(roomData.items || [])];
        }

        this.look();
    }

    look() {
        const room = this.state.currentRoom;
        if (!room) return;

        // Print Room Title
        this.printHTML(`<h2>${room.title}</h2>`);

        // Print Room Description (Parsed Markdown)
        // 'marked' is available globally via CDN
        const htmlDescription = marked.parse(room.description);
        this.printHTML(htmlDescription);

        // List visible items
        const visibleItems = this.state.roomItems[room.id];
        if (visibleItems && visibleItems.length > 0) {
            const itemNames = visibleItems.map(item => item.name);
            this.printLine(`You see here: ${itemNames.join(', ')}.`);
        }

        // List obvious exits
        const exits = Object.keys(room.exits || {});
        if (exits.length > 0) {
            this.printLine(`Obvious exits: ${exits.join(', ')}.`);
        } else {
            this.printLine(`There are no obvious exits.`);
        }

        this.printLine(""); // extra blank space
    }

    handleInput(rawInput) {
        if (!rawInput.trim()) return;

        // Echo command
        this.printEcho(rawInput);

        const parsed = this.parser.parse(rawInput);
        if (!parsed.verb) {
            this.printLine("I beg your pardon?");
            return;
        }

        const verb = parsed.verb;
        const noun = parsed.noun;

        switch (verb) {
            case "go":
                if (!noun) {
                    this.printLine("Go where?");
                } else {
                    this.go(noun);
                }
                break;
            case "look":
                // Handles 'look' and 'look at X' (since 'at' is stripped, look at X becomes verb: look, noun: x)
                if (noun) {
                    this.lookAt(noun);
                } else {
                    this.look();
                }
                break;
            case "inventory":
                this.showInventory();
                break;
            case "take":
                if (!noun) {
                    this.printLine("Take what?");
                } else {
                    this.take(noun);
                }
                break;
            case "drop":
                if (!noun) {
                    this.printLine("Drop what?");
                } else {
                    this.drop(noun);
                }
                break;
            // Snarky responses!
            case "pet":
                if (noun.includes("cat")) {
                    this.printLine("You pet the cat. It purrs like a tiny, furry engine, completely ignoring your dire situation.");
                } else {
                    this.printLine(`You can't really pet a ${noun || 'that'}.`);
                }
                break;
            case "use":
                if (noun === "force") {
                    this.printLine("That's not how the Force works!");
                } else {
                    this.printLine("You can't use that right now. Or maybe ever. Who knows?");
                }
                break;
            default:
                this.printLine(`I don't know how to "${verb}".`);
        }
    }

    go(direction) {
        const room = this.state.currentRoom;
        if (room && room.exits && room.exits[direction]) {
            const nextRoomId = room.exits[direction];
            this.printLine(`You go ${direction}...`);
            this.printLine("");
            this.moveToRoom(nextRoomId);
        } else {
            this.printLine("You can't go that way.");
        }
    }

    lookAt(itemName) {
        // Check inventory first
        const invItem = this.state.inventory.find(item =>
            item.name.toLowerCase() === itemName ||
            (item.alias && item.alias.toLowerCase() === itemName)
        );
        if (invItem) {
            this.printLine(invItem.description || "You see nothing special about it.");
            return;
        }

        // Check room second
        const roomId = this.state.currentRoom.id;
        const roomItem = this.state.roomItems[roomId].find(item =>
            item.name.toLowerCase() === itemName ||
            (item.alias && item.alias.toLowerCase() === itemName)
        );
        if (roomItem) {
            this.printLine(roomItem.description || "You see nothing special about it.");
            return;
        }

        this.printLine(`You don't see any '${itemName}' here.`);
    }

    take(itemName) {
        const roomId = this.state.currentRoom.id;
        const itemsInRoom = this.state.roomItems[roomId];

        const itemIndex = itemsInRoom.findIndex(item =>
            item.name.toLowerCase() === itemName ||
            (item.alias && item.alias.toLowerCase() === itemName)
        );
        if (itemIndex !== -1) {
            const takenItem = itemsInRoom.splice(itemIndex, 1)[0];
            this.state.inventory.push(takenItem);
            this.printLine(`Taken.`);
        } else {
            this.printLine(`You don't see any '${itemName}' here.`);
        }
    }

    drop(itemName) {
        const itemIndex = this.state.inventory.findIndex(item =>
            item.name.toLowerCase() === itemName ||
            (item.alias && item.alias.toLowerCase() === itemName)
        );
        if (itemIndex !== -1) {
            const droppedItem = this.state.inventory.splice(itemIndex, 1)[0];
            const roomId = this.state.currentRoom.id;
            this.state.roomItems[roomId].push(droppedItem);
            this.printLine(`Dropped.`);
        } else {
            this.printLine(`You don't have a '${itemName}'.`);
        }
    }

    showInventory() {
        if (this.state.inventory.length === 0) {
            this.printLine("You are empty-handed.");
        } else {
            this.printLine("You are carrying:");
            this.state.inventory.forEach(item => {
                this.printLine(` - ${item.name}`);
            });
        }
    }
}

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
});
