import { 
  confirmationDialog,
  capitalizeFirstLetter,
} from '../helpers/common.mjs';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class RQGCalendar extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
      tag: "form",
      classes:['rqgcalendar'],
      form: {
        handler: RQGCalendar.handler,
        submitOnChange: true,
        closeOnSubmit: false
      },
      position:{
        left:100,
      },
      window:{
        title:'RQG.MENU.Calendrier',
        icon:"fa-solid fa-calendar-days"
      },      
      actions: {
        next: RQGCalendar._next,
        previous: RQGCalendar._previous,
        day: RQGCalendar._day,
      }
    }

    static PARTS = {
        calendar: {
          template: "systems/runequest-glorantha/templates/calendar/calendar.html"
        },
        moon: {
          template: "systems/runequest-glorantha/templates/calendar/moon.html"
        }
    }

    /** @override */
    _configureRenderOptions(options) {
      // This fills in `options.parts` with an array of ALL part keys by default
      // So we need to call `super` first
      super._configureRenderOptions(options);
      // Completely overriding the parts
      options.parts = ['calendar', 'moon']
      // Don't show the other tabs if only limited view
      //if (this.document.limited) return;
      // Keep in mind that the order of `parts` *does* matter
      // So you may need to use array manipulation
      /*switch (this.document.type) {
        case 'typeA':
          options.parts.push('foo')
          break;
        case 'typeB':
          options.parts.push('bar')
          break;
      }*/
    }

    /**
     * Prepare context that is specific to only a single rendered part.
     *
     * It is recommended to augment or mutate the shared context so that downstream methods like _onRender have
     * visibility into the data that was used for rendering. It is acceptable to return a different context object
     * rather than mutating the shared context at the expense of this transparency.
     *
     * @param {string} partId                         The part being rendered
     * @param {ApplicationRenderContext} context      Shared context provided by _prepareContext
     * @returns {Promise<ApplicationRenderContext>}   Context data for a specific part
     * @protected
     */
    async _preparePartContext(partId, context) {
      context.partId = `${this.id}-${partId}`;
      const selected = game.settings.get('runequest-glorantha', 'today');

      switch(partId) {
        case 'calendar':
          const { day: days, week: weeks, season: seasonsList } = CONFIG.RQG;
          const sacre = [...days, ...days];

          function makeItem(type, name, idx, getIconFn) {
            return {
              title: `RQG.SORCELLERIE.${type.toUpperCase()}.${name === 'sacre' ? `${capitalizeFirstLetter(name)}` : `${capitalizeFirstLetter(name)}Complet`}`,
              icon: name === 'sacre' ? '' : `systems/runequest-glorantha/assets/${getIconFn(name)}.png`,
              index: idx + 1
            };
          }
            
          const seasons = seasonsList.map((seasonName, sIdx) => {
            // Création de l’objet season
            const seasonItem = makeItem('season', seasonName, sIdx, this._getCalendarImg);

            seasonItem.next = seasonsList?.[sIdx+1] ? 
              `RQG.SORCELLERIE.SEASON.${capitalizeFirstLetter(seasonsList[sIdx+1])}Complet` : 
              `RQG.SORCELLERIE.SEASON.${capitalizeFirstLetter(seasonsList[0])}Complet`;

            seasonItem.previous = seasonsList?.[sIdx-1] ? 
              `RQG.SORCELLERIE.SEASON.${capitalizeFirstLetter(seasonsList[sIdx-1])}Complet` : 
              `RQG.SORCELLERIE.SEASON.${capitalizeFirstLetter(seasonsList[4])}Complet`;
          
            // Ajout des semaines
            if(seasonName === 'sacre') {
              seasonItem.weeks = [{
                index:1,
                days:sacre.map((dayName, dIdx) => {
                  const dayItem = makeItem('day', dayName, dIdx, this._getCalendarImg);
                  
                  // On active selected si les 3 correspondent
                  if (
                    (sIdx + 1) === selected.season &&
                    1 === selected.week   &&
                    (dIdx + 1) === selected.day
                  ) {
                    seasonItem.selected = true;
                    dayItem.selected = true;
                  }
            
                  return dayItem;
                }),
              }];
            } else {
              seasonItem.weeks = weeks.map((weekName, wIdx) => {
                const weekItem = makeItem('week', weekName, wIdx, this._getCalendarImg);
            
                // Ajout des jours avec flag selected
                weekItem.days = days.map((dayName, dIdx) => {
                  const dayItem = makeItem('day', dayName, dIdx, this._getCalendarImg);
                  
                  // On active selected si les 3 correspondent
                  if (
                    (sIdx + 1) === selected.season &&
                    (wIdx + 1) === selected.week   &&
                    (dIdx + 1) === selected.day
                  ) {
                    seasonItem.selected = true;
                    weekItem.selected = true;
                    dayItem.selected = true;
                  }
            
                  return dayItem;
                });
  
                weekItem.next = weeks?.[wIdx+1] ? 
                `RQG.SORCELLERIE.WEEK.${capitalizeFirstLetter(weeks[wIdx+1])}Complet` : 
                `RQG.SORCELLERIE.WEEK.${capitalizeFirstLetter(weeks[0])}Complet`;
  
                weekItem.previous = weeks?.[wIdx-1] ? 
                `RQG.SORCELLERIE.WEEK.${capitalizeFirstLetter(weeks[wIdx-1])}Complet` : 
                `RQG.SORCELLERIE.WEEK.${capitalizeFirstLetter(weeks[7])}Complet`;
            
                return weekItem;
              });
            }
          
            return seasonItem;
          });
          
          // On assigne proprement
          context.data = { seasons };
        
          break;

        case 'moon':
          // On assigne proprement
          context.data = { 
            moon:`RQG.SORCELLERIE.LUNE.${capitalizeFirstLetter(selected.moon)}`,
          };
          break;
      }

      return context;
    }

    /**
     * Process form submission for the sheet
     * @this {MyApplication}                      The handler is called with the application as its bound scope
     * @param {SubmitEvent} event                   The originating form submission event
     * @param {HTMLFormElement} form                The form element that was submitted
     * @param {FormDataExtended} formData           Processed data for the submitted form
     * @returns {Promise<void>}
     */
    static async handler(event, form, formData) {
        // Do things with the returned FormData
    }

    _getCalendarImg(name) {
      let result = '';

      switch(name) {
        case 'gel':
          result = 'tenebres';
          break;

        case 'argile':
          result = 'terre';
          break;

        case 'vent':
        case 'tempete':
          result = 'air';
          break;

        case 'mer':
          result = 'eau';
          break;

        default:
          result = name;
          break;
      }

      return result;
    }

    static async _next(event, target) {
      if(game.settings.get("runequest-glorantha", "today-confirm")) {
        if(!await confirmationDialog('date')) return;
      }
      const type = target.dataset.type;
      const seasons = CONFIG.RQG.season;
      const weeks = CONFIG.RQG.week;
      const nameDays = CONFIG.RQG.day;
      const moon = CONFIG.RQG.moonEq;
      const settings = game.settings.get('runequest-glorantha', 'today');
      let today = settings;
      let dayNormalized;

      switch(type) {
        case 'season':
          if(today.season === seasons.length) {
            today.season = 1;
            today.week = 1;
            today.day = 1;
          } else {
            today.season += 1;
            today.week = 1;
            today.day = 1;
          }
          break;

        case 'week':
          if(today.week === weeks.length) {

            if(today.season === seasons.length) today.season = 1;
            else today.season += 1;

            today.week = 1;
            today.day = 1;
          } else {
            today.week += 1;
            today.day = 1;
          }
          break;
      }

      dayNormalized = ((today.day - 1) % 7) + 1;
      const nomJour = nameDays[dayNormalized - 1];
      today.moon = moon[nomJour];

      game.settings.set('runequest-glorantha', 'today', today);
      await this.render(true);
    }

    static async _previous(event, target) {
      if(game.settings.get("runequest-glorantha", "today-confirm")) {
        if(!await confirmationDialog('date')) return;
      }
      const type = target.dataset.type;
      const seasons = CONFIG.RQG.season;
      const weeks = CONFIG.RQG.week;
      const days = CONFIG.RQG.day;
      const moon = CONFIG.RQG.moonEq;
      const settings = game.settings.get('runequest-glorantha', 'today');
      let today = settings;
      let dayNormalized;

      switch(type) {
        case 'season':
          if(today.season === 1) {
            today.season = seasons.length;
            today.week = 1;
            today.day = days.length*2;
          } else {
            today.season -= 1;
            today.week = weeks.length;
            today.day = days.length;
          }
          break;

        case 'week':
          if(today.week === 1) {

            if(today.season === 1) today.season = seasons.length;
            else today.season -= 1;

            today.week = today.season === seasons.length ? 1 : weeks.length;
            today.day = today.season === seasons.length ? days.length*2 : days.length;
          } else {
            today.week -= 1;
            today.day = days.length;
          }
          break;
      }

      dayNormalized = ((today.day - 1) % 7) + 1;
      const nomJour = days[dayNormalized - 1];
      today.moon = moon[nomJour];

      game.settings.set('runequest-glorantha', 'today', today);
      await this.render(true);
    }

    static async _day(event, target) {
      if(game.settings.get("runequest-glorantha", "today-confirm")) {
        if(!await confirmationDialog('date')) return;
      }
      const nameDays = CONFIG.RQG.day;
      const moon = CONFIG.RQG.moonEq;
      let day = parseInt(target.dataset.day);
      // Ramène day dans l'intervalle [1, 7]
      let dayNormalized = ((day - 1) % 7) + 1;
    
      const settings = game.settings.get('runequest-glorantha', 'today');
      let today = settings;
    
      today.day = day;
      // exemple d'utilisation du bon index dans le tableau :
      const nomJour = nameDays[dayNormalized - 1];
      today.moon = moon[nomJour];
    
      // (suite de ton code) à compléter selon le reste de ta logique
      game.settings.set('runequest-glorantha', 'today', today);
      await this.render(true);
    }

    async close(options={}) {
      const std = super.close(options);

      game.settings.set('runequest-glorantha', 'calendar', false);
      //ui.controls.controls.rqg.tools.calendar.active = false;
      //ui.controls.render(true);
      
      return std;
    };
}