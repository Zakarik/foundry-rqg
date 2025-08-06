export class CulteDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
		const {HTMLField, SchemaField, NumberField, StringField} = foundry.data.fields;

        return {
            ptsrune:new SchemaField({
                actuel:new NumberField({initial:1}),
                mod:new NumberField({initial:0}),
                max:new NumberField({initial:1}),
            }),
            rang:new StringField({initial:""}),
            sousculte:new StringField({initial:""}),
            description:new HTMLField({initial:""}),
        }
    }

    get item() {
        return this.parent;
    }

    get actor() {
        return this.item.parent;
    }

    prepareBaseData() {}
    

    prepareDerivedData() {
        if(this.actor) {
            const charisme = this.actor.system.caracteristique.charisme;

            Object.defineProperty(this.ptsrune, 'max', {
                value: this.ptsrune.mod+charisme,
                writable:true,
                enumerable:true,
                configurable:true
            });
        }
    }
}