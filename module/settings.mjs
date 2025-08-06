
export const RegisterSettings = function () {
    game.settings.register("runequest-glorantha", "calendar", {        
        name: "",
        hint: "",
        scope: "client",
        config: false,
        default: true,
        type: Boolean,
        onChange: async active => {
            if(active) {
              const calendar = new game.rqg.applications.RQGCalendar;
              await calendar.render(true);
            } else {
              const calendarInstance = [...foundry.applications.instances.values()]
                .find(app => app instanceof game.rqg.applications.RQGCalendar);

              await calendarInstance.close(true);

              ui.controls.controls.rqg.tools.calendar.active = false;

              ui.controls.render(true);
            }
        }
    });

    game.settings.register("runequest-glorantha", "today", {        
        name: "",
        hint: "",
        scope: "world",
        config: false,
        default: {
            day:1,
            week:1,
            season:1,
            moon:'lunedescendante',
        },
        onChange: async value => {
            const calendarInstance = [...foundry.applications.instances.values()]
              .find(app => app instanceof game.rqg.applications.RQGCalendar);

            if(calendarInstance) await calendarInstance.render(true);
        },
    });

    game.settings.register("runequest-glorantha", "today-active", {     
        name: "RQG.SETTINGS.TodayActive",
        hint: "RQG.SETTINGS.TodayActiveHint",
        scope: "world",
        type:new foundry.data.fields.BooleanField({initial: true}),
        config: true,
        requiresReload: true
    });   

    CONFIG.RQG.SETTINGS.TodayActive = game.settings.get("runequest-glorantha", "today-active");

    game.settings.register("runequest-glorantha", "today-confirm", {     
        name: "RQG.SETTINGS.TodayConfirm",
        hint: "RQG.SETTINGS.TodayConfirmHint",
        scope: "world",
        type:new foundry.data.fields.BooleanField({initial: true}),
        config: game.settings.get("runequest-glorantha", "today-active"),
    });   

    if(CONFIG.RQG.SETTINGS.TodayActive) {
        CONFIG.RQG.TOOLS['calendar'] = {
            active:game.settings.get('runequest-glorantha', 'calendar'),
            button: false,
            toggle: true,
            visible: true,
            icon: "fa-solid fa-calendar-days",
            name: 'calendar',
            title: "RQG.MENU.Calendrier",
            onChange:(event, active) => {
                game.settings.set('runequest-glorantha', 'calendar', active);
            },
        }
    }
}