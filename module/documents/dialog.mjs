export default class OpenDialog {
    constructor(data=[], defaultOptions={}) {
        this._data = data;
        this._defaultOptions = foundry.utils.mergeObject({
            title:game.i18n.localize('RQG.DIALOG.Label'),
            classes:['rqgDialog'],
            template: "systems/runequest-glorantha/templates/dialogs/dialog-sheet.html",
            width: 600,
            height: 600,
            modal:false,
        }, defaultOptions);
    }

    set defaultOptions(object={}) {
        this._defaultOptions = foundry.utils.mergeObject(this._defaultOptions, object);
    }

    set data(data=[]) {
        this._data = data;
    }

    get data() {
        return this._data;
    }

    get defaultOptions() {
        return this._defaultOptions;
    }

    async renderDialog(buttons, renderCallback) {
        const content = await this._content();
        return foundry.applications.api.DialogV2.wait({
            window:{ title: this.defaultOptions.title }, 
            position:{ height: this.defaultOptions.height, width: this.defaultOptions.width }, 
            classes: this.defaultOptions.classes,
            modal: this.defaultOptions.modal,
            content: content,
            buttons: buttons,
            render: renderCallback || (() => {})
        });
    }

    async renderEdit(callback) {        
        return new Promise(async (resolve, reject) => {
            const buttons = [
                {
                    action:"confirm",
                    label:game.i18n.localize('RQG.DIALOG.Valider'),
                    icon:'<i class="fas fa-check"></i>',
                    callback: (event, button, dialog) => {
                        let update = {};
        
                        for(let n of this.data) {
                            const btn = $(button.form.elements[n.name]);
                            if(btn.length) {
                                if(btn.attr('type') === 'checkbox') {
                                    update[btn.data('path')] = btn.is(':checked');
                                } else {
                                    update[btn.data('path')] = btn.val();
                                }
                            }
                        }
        
                        resolve(update);
                    }
                },
                {
                action:'cancel',
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize('RQG.DIALOG.Annuler'),
                default:true,
                callback: (event, button, dialog) => {
                    resolve(false);
                }
            }];
            
            await this.renderDialog(buttons, callback);
        });   
    }

    async renderRoll(roll, callback) {
        const buttons = [
            {
                action:"confirm",
                label:game.i18n.localize('RQG.DIALOG.Roll'),
                icon:'<i class="fa-solid fa-dice-d10"></i>',
                callback: roll,
            },
            {
            action:'cancel',
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('RQG.DIALOG.Annuler'),
            default:true,
        }];
        return await this.renderDialog(buttons, callback);
    }

    async renderAsk(ask, callback) {
        return new Promise(async (resolve, reject) => {
            const buttons = [
                {
                    action:"confirm",
                    label:game.i18n.localize('RQG.DIALOG.Valider'),
                    icon:'<i class="fas fa-check"></i>',
                    callback: (event, button, dialog) => {
                        if(ask) ask(event, button, dialog);
                        resolve({ action: "confirm", dialog, button, event });
                    }
                },
                {
                    action:'cancel',
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('RQG.DIALOG.Annuler'),
                    default:true,
                    callback: (event, button, dialog) => {
                        resolve({ action: "cancel", dialog, button, event }); // On résout même si annulé (tu peux aussi faire reject si tu préfères)
                    }
            }];

            return await this.renderDialog(buttons, callback);
        })
    }

    async _content() {
        return await foundry.applications.handlebars.renderTemplate(this.defaultOptions.template, this.data);
    }
}