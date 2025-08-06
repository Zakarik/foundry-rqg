import toggler from '../../helpers/toggler.js';
import { 
  confirmationDialog,
  autocalcAtkWpn,
  capitalizeFirstLetter,
  getEmbeddedDocument,
  getArrayDocument,
  toggleEffects,
  commonHTML,
  calcSorcellerie,
} from '../../helpers/common.mjs';
import OpenDialog from '../../documents/dialog.mjs';
import sendChat from '../../documents/chat.mjs';
import processRoll from '../../documents/roll.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api,
      { ActorSheetV2 } = foundry.applications.sheets,
      { TextEditor } = foundry.applications.ux
      
/**
 * @extends {ActorSheetV2}
 */
export class PersonnageSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
    },
    classes:["personnage", "sheet", "actor"],
    position: {
      width: 1050,
      height: 600,
    },
    dragDrop: [
      {dragSelector: ".draggable", dropSelector: null},
    ],
    actions:{
      onEditImg:this._onEditImage,
      onCreateItm:this._onCreateItm,
      onEditItm:this._onEditItm,
      onDeleteItm:this._onDeleteItm,
      onAddArray:this._onAddArray,
      onDeleteArray:this._onDeleteArray,
      editDialog:this._editDialog,
      onIncrease:this._onIncrease,
      onDecrease:this._onDecrease,
      onSelect:this._onSelect,
      onUnselect:this._onUnselect,
      onCreateEffects:this._onCreateEffects,
      onEditEffects:this._onEditEffects,
      onDeleteEffects:this._onDeleteEffects,
      onSwitchEffects:this._onSwitchEffects,
      onWear:this._onWear,
      onUse:this._onUse,
      onRoll:this._onRoll,
      onRollSpecial:this._onRollSpecial,
      onUnlocked:this._onUnlocked,
    },
    window:{
      resizable:true,
    }
  }
  static PARTS = {
    header: { template: "systems/runequest-glorantha/templates/actors/header.html" },
    menu: { template: "templates/generic/tab-navigation.hbs" },
    historique: { template: "systems/runequest-glorantha/templates/actors/historique.html" },
    competences: { template: "systems/runequest-glorantha/templates/actors/competence.html" },
    passions: { template: "systems/runequest-glorantha/templates/actors/passion.html" },
    combat: { template: "systems/runequest-glorantha/templates/actors/combat.html" },
    affinitesruniques: { template: "systems/runequest-glorantha/templates/actors/affinitesruniques.html" },
    cultes: { template: "systems/runequest-glorantha/templates/actors/cultes.html" },
    magiesspirituelles: { template: "systems/runequest-glorantha/templates/actors/spirituelle.html" },
    sorcellerie: { template: "systems/runequest-glorantha/templates/actors/sorcellerie.html" },
    inventaire: { template: "systems/runequest-glorantha/templates/actors/inventaire.html" },
    effets: { template: "systems/runequest-glorantha/templates/actors/effects.html" },
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._getTabs(options.parts);
    context.actor = {};
    await this._prepareCharacterItems(context);

    context.systemData = context.document.system;    

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'historique':
        context.tab = context.tabs[partId];
        context.tab.histoire = await TextEditor.implementation.enrichHTML(context.systemData.historique.histoire, {
          // Whether to show secret blocks in the finished html
          secrets: context.document.isOwner,
          // Data to fill in for inline rolls
          rollData: context.document.getRollData(),
          // Relative UUID resolution
          relativeTo: context.document,
        });
        break;
      case 'combat':
        context.tab = context.tabs[partId];
        context.tab.spirituelle = await TextEditor.implementation.enrichHTML(context.systemData.combats.combatspirituel.description, {
          // Whether to show secret blocks in the finished html
          secrets: context.document.isOwner,
          // Data to fill in for inline rolls
          rollData: context.document.getRollData(),
          // Relative UUID resolution
          relativeTo: context.document,
        });
        break;
      default:
        context.tab = context.tabs[partId];
        break;
    }
    return context;
  }

  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = 'primary';
    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'historique';
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: '',
        group: tabGroup,
        // Matches tab property to
        id: '',
        // FontAwesome Icon, if you so choose
        icon: 'fa-solid fa-check',
        // Run through localization
        label: 'RQG.MENU.',
      };
      switch (partId) {
        case 'header':
        case 'menu':
          return tabs;

        default:
          tab.id = partId;
          tab.label += capitalizeFirstLetter(partId);
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onRender(context, options) {    
    super._onRender(context, options);

    const html = $(this.element);

    toggler.init(this.id, html, this.actor);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    commonHTML(html);

    html.find('.select').change(async ev => {
      const tgt = $(ev.currentTarget);
      const path = tgt.data('path');
      const value = tgt.val();
      const item = getEmbeddedDocument(this.document, ev.currentTarget);

      await item.update({[path]:value})
    });
  }

  /* -------------------------------------------- */
  async _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;
    const langues = [];
    const passions = [];
    const cultes = [];
    const magierunique = [];
    const magiespirituelle = [];
    const sorcellerie = [];
    const objets = [];
    const effects = [];
    const uneffects = [];
    const armure = [];
    const armureeqp = [];
    const wpneqp = {
      melee:[],
      distance:[],
    }
    const wpn = {
      melee:[],
      distance:[],
    }
    
    for(let e of this.document.effects) {
      if(!e.disabled) effects.push(e);
      if(e.disabled) uneffects.push(e);
    }

    for (let i of sheetData.document.items) {
      const type = i.type;
      const data = i.system;

      switch(type) {
        case 'langue':
          i.enriched = await TextEditor.enrichHTML(data.description);

          langues.push(i);
          break;
        
        case 'passion':
          i.enriched = await TextEditor.enrichHTML(data.description);

          passions.push(i);
          break;

        case 'armecontact':
          i.enriched = await TextEditor.enrichHTML(data.description);
          i.ra = i.system.ra.value + sheetData.document.system.rangaction.dex.total + sheetData.document.system.rangaction.tai.total;
          i.attaque = autocalcAtkWpn(sheetData.document, i);

          wpn.melee.push(i);

          if(i.system.wear) wpneqp.melee.push(i);
          break;

        case 'armedistance':
          i.enriched = await TextEditor.enrichHTML(data.description);
          i.ra = i.system.ra.value + sheetData.document.system.rangaction.dex.total;
          i.attaque = autocalcAtkWpn(sheetData.document, i);

          wpn.distance.push(i);

          if(i.system.wear) wpneqp.distance.push(i);
          break;

        case 'armure':
          i.enriched = await TextEditor.enrichHTML(data.description);

          armure.push(i);

          if(i.system.wear) armureeqp.push(i);
          break;

        case 'culte':
          i.enriched = await TextEditor.enrichHTML(data.description);
          cultes.push(i);
          break;

        case 'magierunique':
          i.enriched = await TextEditor.enrichHTML(data.description);
          magierunique.push(i);
          break;

        case 'magiespirituelle':
          i.enriched = await TextEditor.enrichHTML(data.description);
          magiespirituelle.push(i);
          break;

        case 'sorcellerie':
          i.enriched = await TextEditor.enrichHTML(data.description);
          sorcellerie.push(i);
          break;

        case 'objet':
          i.enriched = await TextEditor.enrichHTML(data.description);
          objets.push(i);
          break;
      }

      for(let e of i.effects) {
        if(e.transfer && !e.disabled) effects.push(e);
        if(e.transfer && e.disabled) uneffects.push(e);
      }
    }

    // Tri des armes de mêlée : d'abord par wear (équipé d'abord), puis par sort
    wpn.melee.sort((a, b) => {
      // 1. Équipé d'abord
      if (a.system.wear && !b.system.wear) return -1;
      if (!a.system.wear && b.system.wear) return 1;
      // 2. Puis par "sort"
      if (a.sort !== undefined && b.sort !== undefined) {
        return a.sort - b.sort;
      }
      if (a.sort !== undefined) return -1;
      if (b.sort !== undefined) return 1;
      // 3. Sinon, égalité
      return 0;
    });

    // Tri des armes à distance : d'abord par wear (équipé d'abord), puis par sort
    wpn.distance.sort((a, b) => {
      // 1. Équipé d'abord
      if (a.system.wear && !b.system.wear) return -1;
      if (!a.system.wear && b.system.wear) return 1;
      // 2. Puis par "sort"
      if (a.sort !== undefined && b.sort !== undefined) {
        return a.sort - b.sort;
      }
      if (a.sort !== undefined) return -1;
      if (b.sort !== undefined) return 1;
      // 3. Sinon, égalité
      return 0;
    });
    
    armure.sort((a, b) => {
      // 1. Équipé d'abord
      if (a.system.wear && !b.system.wear) return -1;
      if (!a.system.wear && b.system.wear) return 1;
      // 2. Puis par "sort"
      if (a.sort !== undefined && b.sort !== undefined) {
        return a.sort - b.sort;
      }
      if (a.sort !== undefined) return -1;
      if (b.sort !== undefined) return 1;
      // 3. Sinon, égalité
      return 0;
    });

    objets.sort((a, b) => {
      // 1. On met d'abord les objets équipables
      if (a.system.parametres.equipable && !b.system.parametres.equipable) return -1;
      if (!a.system.parametres.equipable && b.system.parametres.equipable) return 1;

      // 2. Ensuite, on met les objets utilisables
      if (a.system.parametres.utilisable && !b.system.parametres.utilisable) return -1;
      if (!a.system.parametres.utilisable && b.system.parametres.utilisable) return 1;

      // 3. Ensuite, on trie par wear (équipé d'abord)
      if (a.system.wear && !b.system.wear) return -1;
      if (!a.system.wear && b.system.wear) return 1;

      // 4. Ensuite, on trie par "sort" dans chaque groupe (équipé ou non)
      if (a.sort !== undefined && b.sort !== undefined) {
        return a.sort - b.sort;
      }
      if (a.sort !== undefined) return -1;
      if (b.sort !== undefined) return 1;

      // 5. Sinon, égalité
      return 0;
    });

    actorData.langues = langues;
    actorData.passions = passions;
    actorData.wpn = wpn;
    actorData.wpneqp = wpneqp;
    actorData.cultes = cultes;
    actorData.magierunique = magierunique;
    actorData.magiespirituelle = magiespirituelle;
    actorData.sorcellerie = sorcellerie;
    actorData.armure = armure;
    actorData.armureeqp = armureeqp;
    actorData.objets = objets;
    actorData.effects = effects;
    actorData.uneffects = uneffects;
  }

  _onDragStart(event) {
    const li = event.currentTarget;

    if ( event.target.classList.contains("content-link") ) return;

    // Create drag data
    const dragData = {
      actorId: this.actor.id,
      sceneId: this.actor.isToken ? canvas.scene?.id : null,
      tokenId: this.actor.isToken ? this.actor.token.id : null,
      itemId:$(li)?.data("itemid") || 0
    };

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }
  
  static async _onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } =
      this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
      {};
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }

  static async _onCreateItm(event, target) {
    // Retrieve the configured document class for Item or ActiveEffect
    const docCls = getDocumentClass(target.dataset.documentClass);
    // Prepare the document creation data by initializing it a default name.
    const docData = {
      name: docCls.defaultName({
        // defaultName handles an undefined type gracefully
        type: target.dataset.type,
        parent: this.actor,
      }),
    };
    // Loop through the dataset and add it to our docData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (['action', 'documentClass'].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(docData, dataKey, value);
    }

    // Finally, create the embedded document!
    await docCls.create(docData, { parent: this.actor });
  }

  static async _onEditItm(event, target) {
    const item = getEmbeddedDocument(this.document, target);

    item.sheet.render(true);
  }

  static async _onDeleteItm(event, target) {
    if(!await confirmationDialog('delete')) return;
    const item = getEmbeddedDocument(this.document, target);

    await item.delete();
  }

  static async _onAddArray(event, target) {
    const data = target.dataset;
    const itm = getArrayDocument(this.actor, target);
    let toAdd = {
      _id:foundry.utils.randomID(),
      label:"",
      base:0,
      mod:{
          mod:0,
          temp:0,
          progression:0,
      },
      total:0,
      unlocked:false,
    };

    if(data.type === 'armes') toAdd.condition = false;

    itm.array.push(toAdd);

    this.actor.update({[itm.path]:itm.array});
  }

  static async _onDeleteArray(event, target) {
    if(!await confirmationDialog('delete')) return;
    const data = target.dataset;
    const itm = getArrayDocument(this.actor, target);
    const index = data.index;
    itm.array.splice(index, 1);
    this.actor.update({[itm.path]:itm.array});
  }

  static async _editDialog(event, target) {     
    const tgt = target.dataset;
    const type = tgt.type;
    const actor = this.actor;
    const data = [];
    const classes = ['rqgDialog']
    let width = 600;
    let height = 400;
    let title = '';
    switch(type) {
      case 'pouvoir':
      case 'elementaire':
        const list = CONFIG.RQG.RUNES[tgt.type];
    
        for(let l of list) {
          data.push({
            type:'number',
            name:l,
            class:l,
            label:`${game.i18n.localize(`RQG.RUNES.${capitalizeFirstLetter(l)}`)} (${game.i18n.localize('RQG.Base')})`,
            min:0,
            value:actor.system.runes[tgt.type][l].base,
            path:`system.runes.${tgt.type}.${l}.base`
          });
        }

        classes.push(tgt.type)
        height = tgt.type === 'elementaire' ? 200 : 400;
        title = game.i18n.localize(`RQG.RUNES.Affinite${capitalizeFirstLetter(tgt.type)}`);
        break;

      case 'richesse':
        const inventaire = actor.system.inventaire.argents;
  
        for(let i in inventaire) {      
          data.push({
            type:'number',
            name:i,
            class:i,
            label:`${game.i18n.localize(`RQG.INVENTAIRE.${capitalizeFirstLetter(i)}`)} :`,
            min:0,
            value:inventaire[i],
            path:`system.inventaire.argents.${i}`
          })
        }

        width = 260;
        height = 260;
        title = game.i18n.localize('RQG.INVENTAIRE.Richesses'),      
        classes.push('richesse');  
        break;
    }

    const result = await new OpenDialog(data, {
      title,      
      classes,
      height,
      width,
      modal:true,
    }).renderEdit((event, dialog) => {
      if(type === 'pouvoir') {
        const html = $(dialog.element);
        const pouvoirDouble = CONFIG.RQG.RUNES.comboPouvoir;

        for(let p in pouvoirDouble) {
          const d = pouvoirDouble[p];

          html.find(`label.${p} input`).change(ev => {
            const tgt = $(ev.currentTarget);
            
            if(tgt.val() > 100) tgt.val(100);
            else if(tgt.val() < 0) tgt.val(0);
            else $(html.find(`label.${d} input`)).val(100-tgt.val());
          });

          html.find(`label.${d} input`).change(ev => {
            const tgt = $(ev.currentTarget);

            if(tgt.val() > 100) tgt.val(100);
            else if(tgt.val() < 0) tgt.val(0);
            else $(html.find(`label.${p} input`)).val(100-tgt.val());
          });
        }
      }
    });

    if(result) actor.update(result);
  }

  static async _onIncrease(event, target) {      
    const tgt = target.dataset;
    const value = parseInt(tgt.value);
    const max = parseInt(tgt.max);
    const type = tgt.type;
    const item = tgt.itemId;
    const actor = this.actor;
    let update = {};

    if(value < max) {
      const itm = actor.items.get(item);

      switch(type) {
        case 'culte':
          update[`system.ptsrune.actuel`] = value+1;
          break;
      }

      if(!foundry.utils.isEmpty(update)) itm.update(update);
    }
  }

  static async _onDecrease(event, target) {      
    const tgt = target.dataset;
    const value = parseInt(tgt.value);
    const item = tgt.itemId;
    const type = tgt.type;
    const actor = this.actor;
    let update = {};

    if(value !== 0) {
      const itm = actor.items.get(item);

      switch(type) {
        case 'culte':
          update[`system.ptsrune.actuel`] = value-1;
          break;
      }

      if(!foundry.utils.isEmpty(update)) itm.update(update);
    }
  }

  static async _onSelect(event, target) {    
    const tgt = target.dataset;
    const path = tgt.path;
    let update = {};

    update[path] = true;

    if(!foundry.utils.isEmpty(update)) this.actor.update(update);
  }

  static async _onUnselect(event, target) {      
    const tgt = target.dataset;
    const path = tgt.path;
    let update = {};

    update[path] = false;

    if(!foundry.utils.isEmpty(update)) this.actor.update(update);
  }

  static async _onCreateEffects(event, target) {    
    const type = target.dataset.type;

    this.actor.createEmbeddedDocuments('ActiveEffect', [
      {
        name: game.i18n.localize('RQG.EFFECTS.Label'),
        img: 'icons/svg/aura.svg',
        source: this.actor.uuid,
        disabled: type === 'inactif',
      },
    ]);
  }

  static async _onEditEffects(event, target) {
    const id = target.dataset.itemId;
    const effect = await foundry.utils.fromUuid(id);

    effect.sheet.render(true);
  }

  static async _onDeleteEffects(event, target) {
    const id = target.dataset.itemId;
    if(!await confirmationDialog('delete')) return;
    const effect = await foundry.utils.fromUuid(id);

    effect.delete();
  }

  static async _onSwitchEffects(event, target) {
    const id = target.dataset.uuid;
    const effect = await foundry.utils.fromUuid(id);

    effect.update({['disabled']:!effect.disabled});
  }

  static async _onWear(event, target) {
    const txt = target.dataset.txt;
    const item = getEmbeddedDocument(this.document, target);
    const wear = item.system.wear;

    item.update({['system.wear']:!wear});

    switch(item.type) {
      case 'objet':
      case 'armecontact':
      case 'armedistance':
      case 'armure':
        const effects = item.effects.filter(itm => itm.system.equipe);

        toggleEffects(item, effects, wear);
        break;
    }

    if(txt) {
      const send = new sendChat(this.document);

      await send.sendTxt({
        txt:game.i18n.format(txt, {itm:item.name}),
      })
    }
  }

  static async _onUse(event, target) {
    const txt = target.dataset.txt;
    const item = getEmbeddedDocument(this.document, target);    
    const effects = item.effects.filter(itm => itm.system.active);

    if(txt) {
      const send = new sendChat(this.document);

      await send.sendTxt({
        txt:game.i18n.format(txt, {itm:item.name}),
      })
    }

    toggleEffects(item, effects, false);
  }

  static async _onRoll(event, target) {
    const label = target.dataset.label;
    const type = target.dataset.type;
    const value = target.dataset.value;
    const data = [];

    data.push({
      type:'label',
      label:`${game.i18n.localize('RQG.Score')}`,
      value:value,
    });

    switch(type) {
      case 'caracteristique':
        data.push({
          type:'number',
          name:'multi',
          class:'multi',
          label:`${game.i18n.localize('RQG.Multiplicateur')}`,
          value:5,
          step:'0.5',
          min:0.5
        })
        break;
    }
    
    data.push({
      type:'number',
      name:'mod',
      class:'mod',
      label:`${game.i18n.localize('RQG.Modificateur')}`,
      value:0,
    });

    const dialog = await new OpenDialog(data, {
      title:label,
      classes:['rqgDialog', 'rqgDialogRoll'],
      width:350,
      height:null,
      modal:true,
    });

    dialog.renderRoll(async (event, button, dialog) => {
      const tags = [];
      let modificateur = $(button.form.elements.mod).val();
      let finalValue = value;

      switch(type) {
        case 'caracteristique':
          let multi = $(button.form.elements.multi).val();

          finalValue *= multi;

          tags.push({label:game.i18n.localize('RQG.Multiplicateur'), value:multi});
          break;
      }

      const roll = new processRoll({
        score:finalValue,
        modificateur,
      });

      const send = new sendChat(this.document);
      await roll.doRoll();

      if(modificateur > 0) tags.push({label:game.i18n.localize('RQG.Modificateur'), value:modificateur});

      await send.sendRoll({
        difficulte:{
          value:Math.min(roll.difficulte, 95),
          tooltip:roll.details,
        },
        flavor:label,
        roll:roll.roll,
        result:roll.result,
        tooltip:roll.tooltip,
        tags
      });
    }, (event, dialog) => {
      const html = $(dialog.element);

      switch(type) {
        case 'caracteristique':
          const initInput = html.find(`label.multi input`);
          const initSpan = $(initInput).siblings('span');
          const initValue = $(initInput).val();
          let initDiff;

          switch(initValue) 
          {
            case '5':
              initDiff = 'Simple';
              break;

            case '4':
              initDiff = 'Facile';
              break;

            case '3':
              initDiff = 'Moderee';
              break;

            case '2':
              initDiff = 'Difficile';
              break;

            case '1':
              initDiff = 'Tresdifficile';
              break;

            case '0.5':
              initDiff = 'Presqueimpossible';
              break;

            default:
              initDiff = 'Personnalise';
              break;
          }

          const initDifficulty = `<b class='difficulty' style='margin-left:2px;'>(${game.i18n.localize(`RQG.DIFFICULTE.${initDiff}`)})</b>`;
            
          initSpan.find('b.difficulty').remove();
          initSpan.append(initDifficulty);

          html.find(`label.multi input`).change(ev => {
            const tgt = $(ev.currentTarget);
            const value = tgt.val();
            let diff;

            switch(value) {
              case '5':
                diff = 'Simple';
                break;

              case '4':
                diff = 'Facile';
                break;

              case '3':
                diff = 'Moderee';
                break;

              case '2':
                diff = 'Difficile';
                break;

              case '1':
                diff = 'Tresdifficile';
                break;

              case '0.5':
                diff = 'Presqueimpossible';
                break;

              default:
                diff = 'Personnalise';
                break;
            }

            const difficulty = `<b class='difficulty' style='margin-left:2px;'>(${game.i18n.localize(`RQG.DIFFICULTE.${diff}`)})</b>`;
            const span = tgt.siblings('span');
            
            span.find('b.difficulty').remove();
            span.append(difficulty);
          });
          break;
      }
    });
  }

  static async _onUnlocked(event, target) {
    const data = target.dataset;
    const index = data.index;
    const itm = getArrayDocument(this.actor, target);
    itm.array[index].unlocked = !itm.array[index].unlocked
    this.actor.update({[`${itm.path}`]:itm.array});
  }

  static async _onRollSpecial(event, target) {
    const type = target.dataset.type;
    const label = target.dataset.label;

    const { data, width, height, item, listRunes = [], item2 } = await this._prepareFormData(type, target);
    if (!data) return;

    const dialog = await new OpenDialog(data, {
      title: label,
      classes: ['rqgDialog', 'rqgDialogRoll'],
      width,
      height,
      modal: true,
    });

    dialog.renderRoll(
      (event, button, dialog) => this.document.system.handleRoll(type, button, label, item, item2, listRunes),
      (event, dialog) => {
        if (type === 'sorcellerie') this._initSorceryListeners(event, item, listRunes);
        if (type === 'armecontact') this._initArmeContactListeners(event, item, listRunes);
        if (type === 'armedistance') this._initArmeDistanceListeners(event, item, listRunes);
      }
    );
  }

  async _prepareFormData(type, target) {
    switch(type) {
      case 'resistance': return this.document.system.prepareResistanceData();
      case 'runique': return await this.document.system.prepareRuniqueData(target);
      case 'spirituelle': return await this.document.system.prepareSpirituelleData(target);
      case 'sorcellerie': return await this.document.system.prepareSorcellerieData(target);
      case 'armecontact': return await this.document.system.prepareContactData('both', target);
      case 'armedistance': return await this.document.system.prepareDistanceData(target);
      default: return { data: null };
    }
  }

  _initSorceryListeners(event, item, listRunes) {
    const html = $(event.target.element);
  
    html.find('.intensite input').change(async ev => {
      const tgt = $(ev.currentTarget);
      const parents = tgt.parents('label');
      const intensites = parents.siblings('.intensite');
      const lune = parents.siblings('.lune');
      const mod = parents.siblings('.modcout');
      let total = (parseInt(tgt.val(), 10) || 0);
  
      intensites.each((_, el) => {
        total += parseInt($(el).find('input').val(), 10) || 0;
      });
  
      total -= 3;
  
      if (total > this.document.system.magies.sorcelleries.intlibre.value) {
        ui.notifications.error(game.i18n.localize("RQG.NOTIFICATIONS.NotEnoughIntLibre"), { permanent: false });
        tgt.val(tgt.val() - 1);
      }
  
      let sum = calcSorcellerie(this.document, item, { mod: total });
      if (listRunes.includes('lune')) sum *= CONFIG.RQG.lune[$(lune).find('select').val()];
      sum += parseInt($(mod).find('input').val(), 10) || 0;
  
      html.find('label.cout input').val(Math.floor(Math.max(sum, 1)));
    });
  
    html.find('.modcout input').change(async ev => {
      const tgt = $(ev.currentTarget);
      const parents = tgt.parents('label');
      const intensites = parents.siblings('.intensite');
      const lune = parents.siblings('.lune');
      let total = 0;
  
      intensites.each((_, el) => {
        total += parseInt($(el).find('input').val(), 10) || 0;
      });
  
      total -= 3;
  
      let sum = calcSorcellerie(this.document, item, { mod: total });
      if (listRunes.includes('lune')) sum *= CONFIG.RQG.lune[$(lune).find('select').val()];
      sum += parseInt(tgt.val(), 10) || 0;
  
      html.find('label.cout input').val(Math.floor(Math.max(sum, 1)));
    });
  
    html.find('.lune select').change(async ev => {
      const tgt = $(ev.currentTarget);
      const parents = tgt.parents('label');
      const intensites = parents.siblings('.intensite');
      const mod = parents.siblings('.modcout');
      let total = 0;
  
      intensites.each((_, el) => {
        total += parseInt($(el).find('input').val(), 10) || 0;
      });
  
      total -= 3;
  
      let sum = calcSorcellerie(this.document, item, { mod: total });
      if (listRunes.includes('lune')) sum *= CONFIG.RQG.lune[tgt.val()];
      sum += parseInt($(mod).find('input').val(), 10) || 0;
  
      html.find('label.cout input').val(Math.floor(Math.max(sum, 1)));
    });
  }

  _initArmeContactListeners(event, item, listRunes) {
    const html = $(event.target.element);
  
    html.find('.type select').change(async ev => {
      const tgt = $(ev.currentTarget);
      const value = tgt.val();

      switch(value) {
        case 'attaque':  
          html.find('label.parade').hide();
          html.find('label.atk').show();
        break;
        case 'parade':  
          html.find('label.parade').show();
          html.find('label.atk').hide();
        break;
      }
    });
                                            
    html.find('.vise input').change(async ev => {
      const tgt = $(ev.currentTarget);
      const isChecked = tgt.is(':checked');

      if(isChecked) html.find('.localisation').show();
      else html.find('.localisation').hide();
    });
  }

  _initArmeDistanceListeners(event, item, listRunes) {
    const html = $(event.target.element);
                                            
    html.find('.vise input').change(async ev => {
      const tgt = $(ev.currentTarget);
      const isChecked = tgt.is(':checked');

      if(isChecked) html.find('.localisation').show();
      else html.find('.localisation').hide();
    });
  }

  /**
   * Handle a dropped Item on the Actor Sheet.
   * @param {DragEvent} event     The initiating drop event
   * @param {Item} item           The dropped Item document
   * @returns {Promise<Item|null|undefined>} A Promise resolving to the dropped Item (if sorting), a newly created Item,
   *                                         or a nullish value in case of failure or no action being taken
   * @protected
   */
  async _onDropItem(event, item) {
    if((item.type === 'armecontact' || item.type === 'armedistance') && this.actor.uuid !== item.parent?.uuid) {
      const title = `${item.name} : ${game.i18n.localize(`RQG.CompetenceUsed`)}`;
      const width = 400;
      const height = null;
      const data = [];
      const classes = ['rqgDialog']
      let selected = "";

      // Récupère les compétences d'arme standards
      const cmpWpn = Object.keys(this.actor.system.cmpWpn).reduce((acc, key) => {
        acc[key] = game.i18n.localize(`RQG.COMPETENCES.${capitalizeFirstLetter(key)}`);
        return acc;
      }, {});

      // Récupère les compétences d'arme custom
      const cmpCustomWpn = Object.values(this.actor.system.cmpWpnCustom).reduce((acc, itemCustom) => {
        acc[itemCustom._id] = `${game.i18n.localize(`RQG.COMPETENCES.${capitalizeFirstLetter(itemCustom._source)}`)} : ${itemCustom.label}`;
        return acc;
      }, {});

      // Détermine la compétence sélectionnée par défaut
      // On cherche d'abord dans les compétences standards
      const itemNameKey = Object.entries(cmpWpn).find(([key, value]) => value === item.name);
      if(itemNameKey) {
        selected = itemNameKey[0];
      } else {
        // Puis dans les compétences custom
        // cmpCustomWpn est un objet { _id: "label" }, donc on cherche la clé dont la valeur correspond à item.name
        const customKey = Object.entries(cmpCustomWpn).find(([key, value]) => value.endsWith(`: ${item.name}`) || value === item.name);
        if(customKey) selected = customKey[0];
      }

      data.push({
        type:'select',
        name:'cmp',
        class:'cmp',
        label:`${game.i18n.localize(`RQG.COMPETENCES.Used`)}`,
        list:foundry.utils.mergeObject({'':''},cmpWpn, cmpCustomWpn),
        selected:selected,
        localize:false,
        path:'system.competence.id',
      }, {
        type:'check',
        name:'half',
        class:'half',
        label:`${game.i18n.localize(`RQG.COMPETENCES.Half`)}`,
        path:'system.competence.half',
      });
      
      const result = await new OpenDialog(data, {
        title,      
        classes,
        height,
        width,
        modal:true,
      }).renderEdit((event, dialog) => {});

      await item.update(result);
    }

    return super._onDropItem(event, item);
  }

  /**
   * An event that occurs when a drag workflow begins for a draggable item on the sheet.
   * @param {DragEvent} event       The initiating drag start event
   * @returns {Promise<void>}
   * @protected
   */
  async _onDragStart(event) {
    super._onDragStart(event);
  }
  
  /**
   * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings.
   * @param {DragEvent} event     The initiating drop event
   * @param {Item} item           The dropped Item document
   * @returns {Promise<Item[]>|void}
   * @protected
   */
  _onSortItem(event, item) {
    super._onSortItem(event, item);
  }
}