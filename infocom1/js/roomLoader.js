class RoomLoader {
    /**
     * Fetches a markdown file and parses its frontmatter and content.
     * @param {string} roomId 
     * @returns {Promise<{id: string, title: string, description: string, exits: Object, items: Array}>}
     */
    static async loadRoom(roomId) {
        try {
            const response = await fetch(`rooms/${roomId}.md`);
            if (!response.ok) {
                throw new Error(`Room ${roomId} not found.`);
            }

            const fileContent = await response.text();

            // Simple split for YAML frontmatter
            // Looking for --- at the start and the next ---
            const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

            let frontmatter = {};
            let markdownContent = fileContent;

            if (match) {
                const yamlString = match[1];
                markdownContent = match[2].trim();

                try {
                    // jsyaml comes from the CDN script
                    frontmatter = jsyaml.load(yamlString) || {};
                } catch (e) {
                    console.error("Error parsing YAML frontmatter for room:", roomId, e);
                }
            } else {
                console.warn(`No frontmatter found for room: ${roomId}`);
            }

            return {
                id: roomId,
                title: frontmatter.title || "Unknown Location",
                exits: frontmatter.exits || {},
                // Items should now be an array of objects: {name: "item", description: "desc"}
                items: frontmatter.items || [],
                description: markdownContent
            };

        } catch (error) {
            console.error("Failed to load room:", error);
            // Return a fallback room description
            return null;
        }
    }
}
