import toggler from '../../helpers/toggler.js';
import { 
  confirmationDialog,
} from '../../helpers/common.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api,
{ ItemSheetV2 } = foundry.applications.sheets,
{ TextEditor } = foundry.applications.ux

/**
 * @extends {ItemSheet}
 */
export class RQItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
    },
    classes:["rqg", "item", "sheet", "rqgitem"],
    position: {
      width: 850,
      height: 380,
    },
    dragDrop: [{dragSelector: ".draggable", dropSelector: null}],
    actions:{
      onEditImg:this._onEditImage,
      onSwitch:this._onSwitch,
      onCreateEffects:this._onCreateEffects,
      onEditEffects:this._onEditEffects,
      onDeleteEffects:this._onDeleteEffects,
    },
    window:{
      resizable:true,
    }
  }

  static PARTS = {
    menu: { template: "templates/generic/tab-navigation.hbs" },
    img: { template: "systems/runequest-glorantha/templates/items/img.html" },
    imgsort: { template: "systems/runequest-glorantha/templates/items/img-sort.html" },
    imgsorcellerie: { template: "systems/runequest-glorantha/templates/items/img-sorcellerie.html" },
    encombrement: { template: "systems/runequest-glorantha/templates/items/encombrement.html" },
    affinites: { template: "systems/runequest-glorantha/templates/items/affinites.html" },
    sorcellerie: { template: "systems/runequest-glorantha/templates/items/sorcellerie.html" },
    arme: { template: "systems/runequest-glorantha/templates/items/arme.html" },
    passion: { template: "systems/runequest-glorantha/templates/items/passion.html" },
    culte: { template: "systems/runequest-glorantha/templates/items/culte.html" },
    armure: { template: "systems/runequest-glorantha/templates/items/armure.html" },
    richesses: { template: "systems/runequest-glorantha/templates/items/richesses.html" },
    menu: { template: 'templates/generic/tab-navigation.hbs' },
    description: { template: "systems/runequest-glorantha/templates/items/description.html" },
    parametres: { template: "systems/runequest-glorantha/templates/items/parametres.html" },
  }

  get type() {
    return this.document.type;
  }

  get withTab() {
    return ['armecontact', 'armedistance', 'armure'].includes(this.type);
  }

  get isWear() {
    return this.document.system.wear;
  }

  /** @inheritDoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    const sorts = ['magierunique', 'sorcellerie'];
    const objets = ['objet'];
    const armes = ['armecontact', 'armedistance', 'armure'];
    const type = options.document.type;

    if(sorts.includes(type)) options.classes.push('rqgsort');
    else if(objets.includes(type)) options.classes.push('rqgobjet');
    else if(armes.includes(type)) options.classes.push('rqgarme');

    return options;
  }
  
  /* -------------------------------------------- */

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    const parametres = ['objet', 'armedistance', 'armecontact', 'armure'];
    const encombrement = ['objet'];
    
    options.parts = [];

    switch(this.document.type) {
      case 'passion':
      case 'culte':
        options.parts.push(this.type);
        break;

      case 'magierunique':
        options.parts.push(`imgsort`, 'affinites');
        break;
        
      case 'sorcellerie':
        options.parts.push(`imgsorcellerie`, 'sorcellerie');
        break;

      case 'magiespirituelle':
        options.parts.push(`imgsort`);
        break;

      case 'armedistance':
      case 'armecontact':
        options.parts.push(`img`, 'richesses', 'arme', 'menu');
        
        if(options.position) options.position.height = 560;
        break;      
        
      case 'objet':
        options.parts.push(`img`, 'richesses');
        
        if(options.position) options.position.height = 500;
        break;

      case 'armure':
        options.parts.push(`img`, 'richesses', 'armure', 'menu');
        
        if(options.position) options.position.height = 560;
        break;

      default:
        options.parts.push('img');
        break;
    }

    options.parts.push('description');
    if(encombrement.includes(this.document.type)) options.parts.push('encombrement');
    if(parametres.includes(this.document.type)) options.parts.push('parametres');
  }

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    if(this.withTab) context.tabs = this._getTabs(options.parts);

    context.systemData = context.document.system;    

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    context.enriched = {};
    switch (partId) {
      case 'description':
        if(this.withTab) context.tab = context.tabs[partId];
        context.enriched.description = await TextEditor.implementation.enrichHTML(context.systemData.description, {
          // Whether to show secret blocks in the finished html
          secrets: context.document.isOwner,
          // Data to fill in for inline rolls
          rollData: context.document.getRollData(),
          // Relative UUID resolution
          relativeTo: context.document,
        });
        break;
      
      case 'parametres':
        if(this.withTab) context.tab = context.tabs[partId];
        break;
    }
    return context;
  }

  /**
   * Generates the data for the generic tab navigation template
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = 'primary';
    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'description';
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
        case 'description':
          tab.id = 'description';
          tab.label += 'Description';
          break;
          
        case 'parametres':
          tab.id = 'parametres';
          tab.label += 'Effets';
          break;

        default:
          return tabs;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onRender(context, options) {
    const html = $(this.element);
    toggler.init(this.id, html, this.item);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;
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

  static async _onSwitch(event, target) {
    const value = target.dataset.value === 'true';
    const path = target.dataset.path;
    
    if(path) await this.item.update({[path]: !value});
  }

  static async _onCreateEffects(event, target) {    
    const equipe = ['armecontact', 'armedistance', 'armure'];
    const active = [];
    let disabled = true;

    if(this.type === 'objet') {
      if(this.document.system.parametres.equipable) equipe.push('objet');
      if(this.document.system.parametres.utilisable) active.push('objet');
    }

    if(equipe.includes(this.type) && this.isWear) disabled = false;

    this.item.createEmbeddedDocuments('ActiveEffect', [
      {
        name: this.item.name,
        img: 'icons/svg/aura.svg',
        source: this.item.uuid,
        system:{
          equipe:equipe.includes(this.type),
          active:active.includes(this.type),
        },
        disabled,
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
}