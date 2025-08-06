import {
    capitalizeFirstLetter,
  } from "./common.mjs";
  /**
 * Custom Handlebars for KNIGHT
 */
  export const RegisterHandlebars = function () {    
    Handlebars.registerHelper('getLocalization', function (type, value) {
        let result = '';
        switch(type) {
            case 'caracteristique':
                result = game.i18n.localize(`RQG.CARACTERISTIQUES.${capitalizeFirstLetter(value)}`);
                break;

            case 'localisation':
                result = game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(value)}`);
                break;

            case 'historique':
                result = game.i18n.localize(`RQG.HISTORIQUE.${capitalizeFirstLetter(value)}`);
                break;

            case 'competence':
                result = game.i18n.localize(`RQG.COMPETENCES.${capitalizeFirstLetter(value)}`);
                break;

            case 'wpntype':                
                result = game.i18n.localize(CONFIG.RQG.DATA.TypeWpn[value]);
                break;

            case 'cadence':                
                result = game.i18n.localize(CONFIG.RQG.DATA.CadenceWpn[value]);
                break;
            
            case 'affinite':
                result = game.i18n.localize(`RQG.RUNES.${capitalizeFirstLetter(value)}`);
                break;

            case 'sorcellerie':
                result = game.i18n.localize(`RQG.SORCELLERIE.${capitalizeFirstLetter(value)}`);
                break;

            case 'monnaie':
                result = game.i18n.localize(`RQG.INVENTAIRE.${capitalizeFirstLetter(value)}`);
                break;
        }
        return result;
    });

    Handlebars.registerHelper('getImg', function (type, value) {
        let result = "";

        switch(type) {
            case 'affinite':
                result = `systems/runequest-glorantha/assets/${value}.png`;
                break;

            case 'sorcellerie':
                result = `systems/runequest-glorantha/assets/${value}.png`;
                break;
        }
        
        return result;
    });

    Handlebars.registerHelper('isGM', function () {
        return game.user.isGM;
    });

    Handlebars.registerHelper('mod', function (object, withoutTemp=true) {
        let result = 0;
        try {
            for (const [key, value] of Object.entries(object)) {
                if(withoutTemp && key !== 'temp') result += value;
            }
        } catch (error) {
            console.error('Erreur lors du calcul du modificateur:', error);
            result = 0;
        }
        return result;
    });

    Handlebars.registerHelper('modDetails', function (object) {
        let result = '';
        try {
            for (const [key, value] of Object.entries(object)) {
                result += (result ? ' + ' : '') + value;
            }
        } catch (error) {
            console.error('Erreur lors du calcul du modificateur:', error);
            result = '';
        }
        return result;
    });
    
    Handlebars.registerHelper('formatLoc', function (min, max) {
        return `${min.toString().padStart(2, '0')} - ${max.toString().padStart(2, '0')}`;
    });
    
    Handlebars.registerHelper('orderLocalization', function (data) {
        return Object.fromEntries(
            Object.entries(data).sort(([,a],[,b]) => a.loc.min-b.loc.min)
        );
    });

    Handlebars.registerHelper('getMenu', function (type) {
        let result = [];

        switch(type) {
            case 'personnage':
                result = CONFIG.RQG.MENU.Personnage.map(item => ({ key: item, label: game.i18n.localize(`RQG.MENU.${capitalizeFirstLetter(item)}`)}));
                break;

            case 'objet':
                result = CONFIG.RQG.MENU.Objet.map(item => ({ key: item, label: game.i18n.localize(`RQG.MENU.${capitalizeFirstLetter(item)}`)}));
                break;
        }

        return result;
    });

    Handlebars.registerHelper('allCMP', function (data, ...args) {
        const options = args[args.length-1];
        const limit = options.hash.limit;
        const ask = options.hash.ask;

        const sortedKeys = Object.keys(data)
        .sort(function (a, b) {
            if (a === 'custom') return 1;
            if (b === 'custom') return -1;
            return game.i18n.localize(`RQG.COMPETENCES.${capitalizeFirstLetter(a)}`).localeCompare(game.i18n.localize(`RQG.COMPETENCES.${capitalizeFirstLetter(b)}`));
        }); // Trier les clés alphabétiquement, avec 'custom' en dernier

        let first = {};
        let second = {};

        if(limit) {
            sortedKeys.forEach((key, index) => {
                if(index <= limit) {
                    first[key] = data[key];
                    first[key].id = key;
                } else if(index > limit) {
                    second[key] = data[key];
                    second[key].id = key;
                }
            });
        } else {
            sortedKeys.forEach((key, index) => {
                first[key] = data[key];
                first[key].id = key;
            });
        }

        let result;

        if(limit) result = ask === 'first' ? first : second;
        else result = first;
        
        return result;
    });

    Handlebars.registerHelper('isCustom', function (id) {
        const CFG = CONFIG.RQG.DATA.competences;
        const value = CFG?.[id]?.repeat ?? false;

        return value;
    });

    Handlebars.registerHelper('wpnCategorie', function () {
        const wpn = CONFIG.RQG.WPN.categories;

        wpn.sort(function (a, b) {
            return game.i18n.localize(`RQG.CATEGORIES.${capitalizeFirstLetter(a)}`).localeCompare(game.i18n.localize(`RQG.CATEGORIES.${capitalizeFirstLetter(b)}`));
        });

        const list = [""].concat(wpn);

        let result = list.reduce((acc, item) => {
            acc[item] = item !== "" ? `RQG.CATEGORIES.${capitalizeFirstLetter(item)}` : "";
            return acc;
          }, {});

        return result;
    });

    Handlebars.registerHelper('wpnCmp', function (data) {
        const actor = data.document.system.actor;
        if(!actor) return {'':''}

        // Récupère les compétences d'arme standards
        const cmpWpn = Object.keys(actor.system.cmpWpn).reduce((acc, key) => {
          acc[key] = game.i18n.localize(`RQG.COMPETENCES.${capitalizeFirstLetter(key)}`);
          return acc;
        }, {});
  
        // Récupère les compétences d'arme custom
        const cmpCustomWpn = Object.values(actor.system.cmpWpnCustom).reduce((acc, itemCustom) => {
          acc[itemCustom._id] = `${game.i18n.localize(`RQG.COMPETENCES.${capitalizeFirstLetter(itemCustom._source)}`)} : ${itemCustom.label}`;
          return acc;
        }, {});

        return foundry.utils.mergeObject({'':''}, cmpWpn, cmpCustomWpn);
    });

    Handlebars.registerHelper('wpnAllonge', function (data) {
        const list = CONFIG.RQG.DATA.Allonge;
        let result = {};

        for(let a in list) {
            result[a] = `${list[a]} ${game.i18n.localize('RQG.Metres')}`
        }

        return result;
    });

    Handlebars.registerHelper('wpnType', function (data) {
        const result = CONFIG.RQG.DATA.TypeWpn;

        return result;
    });

    Handlebars.registerHelper('wpnCadence', function (data) {
        const result = CONFIG.RQG.DATA.CadenceWpn;

        return result;
    });

    Handlebars.registerHelper('getItmPath', function (data, id) {
        const index = data.items.findIndex(itm => itm._id === id);
        return `items.${index}`;
    });

    Handlebars.registerHelper('getAffiniteElementaire', function (data) {
        const list = CONFIG.RQG.RUNES.elementaire;
        const result = [];

        for(let l of list) {
            result.push({
                key:l,
                img:`systems/runequest-glorantha/assets/${l}.png`,
                label:`RQG.RUNES.${capitalizeFirstLetter(l)}`,
                value:data.systemData.runes.elementaire[l],
                path:`system.runes.elementaire.${l}`,
            });
        }

        return result;
    });

    Handlebars.registerHelper('getAffinitePouvoir', function (data) {
        const list = CONFIG.RQG.RUNES.pouvoir;
        const result = [];

        for(let l of list) {
            result.push({
                key:l,
                img:`systems/runequest-glorantha/assets/${l}.png`,
                label:`RQG.RUNES.${capitalizeFirstLetter(l)}`,
                value:data.systemData.runes.pouvoir[l],
                path:`system.runes.pouvoir.${l}`,
            });
        }

        return result;
    });

    Handlebars.registerHelper('orderAffinites', function (data) {
        return Object.fromEntries(
            Object.entries(data).sort((a, b) => game.i18n.localize(`RQG.RUNES.${capitalizeFirstLetter(a[0])}`).localeCompare(game.i18n.localize(`RQG.RUNES.${capitalizeFirstLetter(b[0])}`)))
        );
    });

    Handlebars.registerHelper('order', function (data, path) {
        return Object.fromEntries(
            Object.entries(data).sort((a, b) => game.i18n.localize(`${path}.${capitalizeFirstLetter(a[0])}`).localeCompare(game.i18n.localize(`${path}.${capitalizeFirstLetter(b[0])}`)))
        );
    });

    Handlebars.registerHelper('count', function (object, value) {
        const array = Object.entries(object).map(([key, val]) => ({ key, val }));
        const filter = array.filter(itm => itm.val === value);

        return filter.length;
    });
    
    Handlebars.registerHelper('hasValue', function (owner, value) {
        let path = value.split('.');
        let result = owner;

        for (let key of path) {
            if (result && result.hasOwnProperty(key)) {
                result = result[key];
            } else {
                result = null;
                break;
            }
        }

        return result !== null;
    });

    Handlebars.registerHelper('conditionnalEffects', function (owner, value) {
        let path = value.split('.');
        let result = owner;

        for (let key of path) {
            if (result && result.hasOwnProperty(key)) {
                result = result[key];
            } else {
                result = null;
                break;
            }
        }

        return result;
    });

    Handlebars.registerHelper('selectItems', function (items, placeholder) {
        let result = {
            '':game.i18n.localize(placeholder),
        }

        for(let i of items) {
            result[i.id] = i.name;
        }

        return result;
    });

    Handlebars.registerHelper("renderField", function (field) {
        const {
          type,
          name = "",
          value = 0,
          label = "",
          class: className = "",
          path = "",
          min = "",
          max = "",
          step = 1,
          list = {},
          selected = "",
          localize = false,
          disabled = false,
          style = '',
        } = field;
      
        const baseAttrs = `name="${name}" data-path="${path}"`;
        let html = "";
      
        switch (type) {
          case "hidden":
            html = `<input type="hidden" ${baseAttrs} value="${value ?? 0}" />`;
            break;
      
          case "label":
            html = `
              <label class="${className} ${type}" data-path="${path}" style="${style}">
                <span class="label">${label}</span>
                <span class="score">${value ?? 0}</span>
              </label>
            `;
            break;
      
          case "number":
            html = `
              <label class="${className} ${type}" data-path="${path}" style="${style}">
                <span>${label}</span>
                <input type="number" ${baseAttrs} value="${value ?? 0}" min="${min}" max="${max}" step="${step ?? 1}" ${disabled ? 'disabled' : ''} />
              </label>
            `;
            break;
      
          case "select":
            // list est un objet : { key: "translation.key" }
            const options = Object.entries(list).map(([key, i18nKey]) => {
              const isSelected = key === selected ? "selected" : "";
              const optionLabel = localize ? game.i18n.localize(i18nKey) : i18nKey;
              return `<option value="${key}" ${isSelected}>${optionLabel}</option>`;
            }).join("");
      
            html = `
              <label class="${className} ${type}" data-path="${path}" style="${style}">
                <span>${label}</span>
                <select ${baseAttrs}>${options}</select>
              </label>
            `;
            break;
      
          case "check":
            const checked = value ? "checked" : "";
            html = `
              <label class="${className} ${type}" data-path="${path}" style="${style}">
                <span>${label}</span>
                <input type="checkbox" ${baseAttrs} ${checked} />
              </label>
            `;
            break;
            
          case "line":
            html = `<hr/>`;
            break;
        }
      
        return new Handlebars.SafeString(html);
    });

    Handlebars.registerHelper("renderChatField", function (field) {
        const {
          type,
          value = '',
          label = "",
          class: className = "",
          style = '',
        } = field;
      
        let html = "";
      
        switch (type) {      
          case "label":
            html = `
                <span class="${className} ${type}" style="${style}">${label}${value}</span>
            `;
            break; 
      
          case "score":
            html = `
                <label class="${className} ${type}" style="${style}">
                    <span class="label">${label}</span>
                    <span class="score">${value ?? 0}</span>
                </label>
            `;
            break;

          case "full":
            html = `
                <span class="${className} ${type}">${value}</span>
            `;
            break;
            
          case "line":
            html = `<hr/>`;
            break;
        }
      
        return new Handlebars.SafeString(html);
    });
      
    Handlebars.registerHelper("showImgRunes", function (runes, object=false) {
        const array = [];
        let result = ``;

        if (object) {
          for (const r in runes) {
            if(runes[r]) array.push(r);
          }
        } else array.push(...runes);

        for(const r of array) {
            result += `<img src="${`systems/runequest-glorantha/assets/${r}.png`}" alt="${game.i18n.localize(`RQG.SORCELLERIE.${capitalizeFirstLetter(r)}`)}" data-tooltip="${game.i18n.localize(`RQG.SORCELLERIE.${capitalizeFirstLetter(r)}`)}" /> `;
        }
      
        return new Handlebars.SafeString(result);
    });
      
    Handlebars.registerHelper("getArmorLoc", function (armure) {
        const loc = armure.system.localisations;
        let result = [];

        for(let l in loc) {
            const data = loc[l];

            if(data !== 0) result.push(`${game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(l)}`)}  (${data})`);
        }

        console.warn(result);

        return result.join(' / ');
    });
  }