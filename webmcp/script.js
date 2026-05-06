document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded");
    registerTools();
});

async function registerTools() {
    if (!('modelContext' in navigator)) return;
    console.log('modelContext exists');

    const listCategories = {
        name: "listCategories",
        description: "List categories available for blog posts",
        inputSchema: {
            type: "object",
            properties: {},
        },
        execute: () => {
            console.log('mcp tool running');
            return ['ai', 'javascript', 'apis', 'web standards', 'cats'];
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
    };

    const controller = new AbortController();
    navigator.modelContext.registerTool(listCategories, { signal: controller.signal });
    console.log('mcp tool registered');

}