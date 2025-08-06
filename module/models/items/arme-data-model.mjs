import BaseItemDataModel from '../base-item-data-model.mjs';
import { 
    capitalizeFirstLetter,
} from "../../helpers/common.mjs";

export class ArmeDataModel extends BaseItemDataModel {
    static defineSchema() {
		const {HTMLField, StringField, NumberField, SchemaField, BooleanField} = foundry.data.fields;
        const schema = super.defineSchema();

        schema.matiere = new StringField({initial:""});
        schema.wear = new BooleanField({initial:false});
        schema.categorie = new StringField({initial:""});
        schema.competence = new SchemaField({
            id:new StringField({initial:""}),
            half:new BooleanField({initial:false}),
        });
        schema.allonge = new SchemaField({
            value:new StringField({initial:"0"}),
            categorie:new StringField({initial:"0"}),
        });
        schema.ra = new SchemaField({
            value:new NumberField({initial:0}),
            parround:new BooleanField({initial:false}),
            cadence:new StringField({initial:""}),
        });
        schema.prerequis = new SchemaField({
            force:new NumberField({initial:0}),
            dexterite:new NumberField({initial:0}),
        });
        schema.degats = new StringField({initial:""});
        schema.type = new StringField({initial:""});
        schema.durabilite = new SchemaField({
            value:new NumberField({initial:0}),
            max:new NumberField({initial:0}),
        });
        schema.encombrement = new SchemaField({
            value:new NumberField({initial:0}),
            inferieura1:new BooleanField({initial:false}),
        });
        schema.portee = new StringField({initial:""});
        schema.projectile = new BooleanField({initial:false});

        return schema;
    }

    get item() {
        return this.parent;
    }

    get actor() {
        return this.item.parent;
    }

    get fullRA() {
        let ra = this.ra.value;

        if(this.parent.type === 'armecontact') ra += this.actor.system.rangaction.dex.total + this.actor.system.rangaction.tai.total;
        else if (this.parent.type === 'armedistance') ra += this.actor.system.rangaction.dex.total;

        return ra;
    }

    get cmpName() {
        const actor = this.actor;
        const cmp = this.competence;
        let result = '';

        if(actor) {
            const allCMP = actor.system.allCmpWpn;

            if(allCMP?.[cmp?.id]) result = allCMP[cmp.id]?.label ? allCMP[cmp.id]?.label : game.i18n.localize(`RQG.COMPETENCES.${capitalizeFirstLetter(cmp.id)}`);
        }

        return result;
    }

    prepareBaseData() {        
        if(this.parent.type === 'armecontact') {
            const ra = 0;
            const allonge = parseInt(this.allonge.categorie);
            
            Object.defineProperty(this.ra, 'value', {
                value: Math.max(ra+allonge, 1),
                writable:true,
                enumerable:true,
                configurable:true
            });
        }
    }

    prepareDerivedData() {}
}