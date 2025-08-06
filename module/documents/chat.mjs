export default class sendChat {
    constructor(actor) {
        this._actor = actor;
    }

    static TEXT_TEMPLATE = 'systems/runequest-glorantha/templates/chat/text.html';
    static DATA_TEMPLATE = 'systems/runequest-glorantha/templates/chat/data.html';
    static ROLL_TEMPLATE = 'systems/runequest-glorantha/templates/chat/roll.html';

    _actor = null;

    get actor() {
        return this._actor;
    }

    set actor(actor) {
        this._actor = actor;
    }

    async sendTxt(data) {
        return await this._sendChat('text', data);
    }

    async sendRoll(data, flags=[]) {
        return await this._sendChat('roll', data, flags);
    }

    async sendData(data, flags=[]) {
        return await this._sendChat('data', data, flags);
    }

    async _sendChat(type, data, flags=[]) {      
        const chatRollMode = game.settings.get("core", "rollMode");
        let activeSnd = true;
        let overrideSnd = CONFIG.sounds.dice;

        switch(type) {
            case 'text':
                overrideSnd = CONFIG.sounds.notification; 
                break;
        }
        
        let chatData = {
            user:game.user.id,
            speaker:{ 
                actor: this?.actor?.token ? null : this.actor,
                alias: this?.actor?.name,
                scene: this?.actor?.token?.parent ?? null,
                token: this?.actor?.token ?? null,
            },
            content:await this._addContent(type, data),
            sound: this._setSound(activeSnd, overrideSnd),
            rollMode:chatRollMode,
            flags:{
                'runequest-glorantha':{
                    type,
                }
            }
        };
        
        for(let f of flags) {
            chatData.flags['runequest-glorantha'][f.key] = f.value;
        }

        ChatMessage.applyRollMode(chatData, chatRollMode);
        

        if(type === 'roll') chatData.rolls = data.roll;
        const msg = await ChatMessage.create(chatData);

        return msg;
    }

    _addSpeaker() {
        let result = null;

        if(this.actor) {
            result = {
                actor: this.actor?.id ?? null,
                token: this.actor?.token ?? null,
                alias: this.actor?.name ?? null,
                scene: this.actor?.token?.parent?.id ?? null
            };
        }

        return result;
    }

    async _addContent(type, data) {
        let content = null;
        let tooltip = null;

        switch(type) {
            case 'text':
                content = await foundry.applications.handlebars.renderTemplate(sendChat.TEXT_TEMPLATE, data);
                break;

            case 'data':
                content = await foundry.applications.handlebars.renderTemplate(sendChat.DATA_TEMPLATE, data);
                break;
        
            case 'roll':
                tooltip = data.tooltip;

                content = await foundry.applications.handlebars.renderTemplate(sendChat.ROLL_TEMPLATE, foundry.utils.mergeObject(
                    data, {
                        tooltip,
                        total:data.roll.total,
                    }
                ));
                break;
        }

        return content;
    }

    _setSound(active=true, override=null) {
        let result = null;

        if(active) {
            if(override) result = override;
            else result = CONFIG.sounds.dice;
        }

        return result;
    }
}