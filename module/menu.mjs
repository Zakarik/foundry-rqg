function initializeSystemControl(controls) {
	/** @type SceneControlTool[] */
  controls.rqg = {
        name: "rqg",
        layer: 'rqg',
        title: "RQG.Runequest", // À internationaliser si besoin
        icon: "fa-solid fa-r",
        activeTool:'times',
        onChange: (event, active) => {
        },
        onToolChange:(event, active) => {
            //controls.rqg.tools.calendar.active = false;
        },
        tools: CONFIG.RQG.TOOLS,
    };
}

// Register the hook into Foundry
let initialized;
class SystemControlsLayer extends foundry.canvas.layers.InteractionLayer {}
export const menuRQG = Object.freeze({
	init() {
		if (!initialized) {
			initialized = true;
			CONFIG.Canvas.layers.rqg = {
                layerClass: SystemControlsLayer,
                group: 'interface',
			};

			Hooks.on('getSceneControlButtons', initializeSystemControl);
		}
	},
});