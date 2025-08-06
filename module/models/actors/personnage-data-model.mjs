import { CaracteristiquesDataModel } from "../parts/caracteristiques-data-model.mjs";
import { cmpField } from "../parts/competences-data-model.mjs";
import { LocalisationsDataModel } from "../parts/localisations-data-model.mjs";
import { baseTotalField } from "../parts/base-data-model.mjs";
import { degatsField } from "../parts/degats-data-model.mjs";
import { RunesDataModel } from "../parts/runes-data-model.mjs";
import { valueTotalField } from "../parts/value-data-model.mjs";
import { 
    sumObject,
    limitMax,
    setBase,
    setTotal,
    calcMod,
    getEmbeddedDocument,
    capitalizeFirstLetter,
    autocalcAtkWpn,
} from "../../helpers/common.mjs";
import sendChat from '../../documents/chat.mjs';
import processRoll from '../../documents/roll.mjs';

export class PersonnageDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {EmbeddedDataField, SchemaField, StringField, NumberField, BooleanField, ObjectField, HTMLField} = foundry.data.fields;
        const cmp = new cmpField();
        const wpn = new cmpField();
        let data = {};
        let caracteristiques = {};
        let historique = {};
        let sorcellerie = {
            elementaire:{},
            pouvoir:{},
            forme:{},
            technique:{}
        };

        cmp.prepare();
        wpn.prepare('wpn');

        for(let h of CONFIG.RQG.historique) {
            historique[h] = new StringField();
        }

        historique.histoire = new HTMLField();

        for(let c of CONFIG.RQG.caracteristiques) {
            caracteristiques[c] = new EmbeddedDataField(CaracteristiquesDataModel);
        }

        for(let s in CONFIG.RQG.SORCELLERIE) {
            let sub = {};

            for(let p of CONFIG.RQG.SORCELLERIE[s]) {
                sub[p] = new BooleanField({initial:false});
            }

            sorcellerie[s] = new SchemaField(sub);
        }

        data.pv = new SchemaField(valueTotalField());
        data.deplacement = new SchemaField(baseTotalField());
        data.guerison = new SchemaField({
            base:new NumberField({initial:0}),
            mod:new ObjectField(),
            total:new StringField(),
        });
        data.historique = new SchemaField(historique);
        data.caracteristiques = new SchemaField(caracteristiques);
        data.competences = new SchemaField(cmp.getData());
        data.armes = new SchemaField(wpn.getData());
        data.localisations = new EmbeddedDataField(LocalisationsDataModel);
        data.passions = new SchemaField({
            honneur:new NumberField({initial:0})
        });
        data.combats = new SchemaField({
            bonusDmg:new SchemaField(degatsField('0')),
            combatspirituel:new SchemaField({
                rangaction:new SchemaField(baseTotalField(0)),
                description:new HTMLField(),
                degats:new SchemaField(degatsField('1D3'))
            }),
        });        
        data.rangaction = new SchemaField({
            dex:new SchemaField(baseTotalField()),
            tai:new SchemaField(baseTotalField()),
        });
        data.runes = new EmbeddedDataField(RunesDataModel);
        data.magies = new SchemaField({
            points:new SchemaField(valueTotalField()),
            spirituelles:new SchemaField({
                limitecha:new SchemaField({
                    base:new NumberField({initial:0}),
                    mod:new ObjectField({}),
                    total:new NumberField({initial:0}),
                    value:new NumberField({initial:0}),
                }),
            }),
            sorcelleries:new SchemaField({
                intlibre:new SchemaField({
                    base:new NumberField({initial:0}),
                    mod:new ObjectField({}),
                    total:new NumberField({initial:0}),
                    value:new NumberField({initial:0}),
                }),
                runes:new SchemaField({
                    elementaire:sorcellerie.elementaire,
                    pouvoir:sorcellerie.pouvoir,
                    forme:sorcellerie.forme,
                    technique:sorcellerie.technique,
                }),
            }),
        });
        data.inventaire = new SchemaField({
            argents:new SchemaField({
                roues:new NumberField({initial:0}),
                lunars:new NumberField({initial:0}),
                clacks:new NumberField({initial:0}),
                bolgs:new NumberField({initial:0}),
                biens:new NumberField({initial:0}),
            }),
            encombrement:new SchemaField({
                max: new SchemaField({
                    base:new NumberField({initial:0}),
                    mod:new ObjectField({}),
                    total:new NumberField({initial:0}),
                }),
                used: new SchemaField({
                    base:new NumberField({initial:0}),
                    mod:new ObjectField({}),
                    total:new NumberField({initial:0}),
                }),
            }),
        });
        data.proprietes = new SchemaField({
            recolte:new SchemaField({
                augurepasse:new StringField(),
                augureactuelle:new StringField(),
                raids:new StringField(),
                quete:new StringField(),
                recoltepasse:new StringField(),
            }),
            revenus:new SchemaField({
                base:new StringField({}),
                data:new HTMLField()
            }),
            proprietes:new SchemaField({
                data:new HTMLField(),
                carucates:new StringField(),
                metayers:new HTMLField()
            })
        });
        data.options = new ObjectField();

		return data;
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

    get actor() {
        return this.parent;
    }

    get items() {
        return this.actor.itemTypes;
    }

    get modPVTAI() {
        const tai = this.caracteristiques.taille.total;
        let mod = 0;

        mod += Math.floor((tai-9)/4);

        return mod;
    }

    get modPVPOU() {
        const pou = this.caracteristiques.pouvoir.total;
        let mod = 0;

        mod += Math.floor((pou-9)/4);

        if(mod < 0) mod += 1;
        else if(mod > 0) mod -= 1;

        return mod;
    }
    
    get caracteristique() {
        return {
            force: this.caracteristiques.force.total,
            constitution: this.caracteristiques.constitution.total,
            dexterite: this.caracteristiques.dexterite.total,
            intelligence: this.caracteristiques.intelligence.total,
            charisme: this.caracteristiques.charisme.total,
            taille: this.caracteristiques.taille.total,
            pouvoir: this.caracteristiques.pouvoir.total
        };
    }

    get cmpWpn() {
        // On exclut toutes les clés "custom" de chaque liste d'armes
        const filtrerCustom = obj => {
            return Object.fromEntries(
                Object.entries(obj).filter(([key, _]) => key !== "custom")
            );
        };

        return Object.assign(
            {},
            filtrerCustom(this.armes.armedistance.list),
            filtrerCustom(this.armes.armemelee.list),
            filtrerCustom(this.armes.armenaturelle.list),
            filtrerCustom(this.armes.boucliers.list)
        );
    }

    get cmpWpnCustom() {
        // On va concaténer chaque liste custom en gardant la provenance de chaque type d'arme
        const sources = [
            { list: this.armes.armedistance.list.custom.list, source: "armedistance" },
            { list: this.armes.armemelee.list.custom.list, source: "armemelee" },
            { list: this.armes.armenaturelle.list.custom.list, source: "armenaturelle" },
            { list: this.armes.boucliers.list.custom.list, source: "boucliers" }
        ];

        const list = sources.flatMap(({list, source}) => 
            list.map(item => ({...item, _source: source}))
        ).reduce((acc, item) => {
            acc[item._id] = item;
            return acc;
        }, {});
        
        return list;
    }

    get allCmpWpn() {
        return foundry.utils.mergeObject(
            this.cmpWpn,
            this.cmpWpnCustom,
        );
    }

    get wpnWear() {
        const contact = this.actor.items.filter(itm => itm.type === "armecontact" && itm.system.wear);
        const distance = this.actor.items.filter(itm => itm.type === "armedistance" && itm.system.wear);

        return {
            contact,
            distance
        };
    }

    get allRunes() {
        return Object.assign({'':{total:0}}, this.runes.elementaire, this.runes.pouvoir);
    }

    get allRA() {
        const spirituel = this.combats.combatspirituel.rangaction.total;
        const sorcellerie = this.combats.combatspirituel.rangaction.total;

        return {
            spirituel,
            sorcellerie,
        }
    }

    prepareBaseData() {}

    prepareDerivedData() {
        this.#setCaracteristiques();
        this.#encombrement();
        this.#setPV();
        this.#setPM();
        this.#setArmure();
        this.#setLocalization();
        this.#setDmg();
        this.#setDmgSpirituel();
        this.#setRA();
        this.#setGuerison();
        this.#setVitesse();
        this.#setCmp();
        this.#runes();
        this.#spirituelle();
        this.#sorcellerie();
    }

    static migrateData(source) {

        return super.migrateData(source);
    }

    #setCaracteristiques() {
        const caracteristiques = this.caracteristiques;

        for(let c in caracteristiques) {
            const data = caracteristiques[c];
            const base = data.base;
            const mod = sumObject(data.mod);

            setTotal(data, Math.max(base+mod, 0));
        }
    }

    #setPV() {
        const pv = this.pv;
        let calcBaseMainPV = this.caracteristique.constitution;
        calcBaseMainPV += this.modPVTAI;
        calcBaseMainPV += this.modPVPOU;

        setBase(pv, calcBaseMainPV);
        
        const baseMainPV = pv.base;
        const modMainPV = sumObject(pv.mod);
        setTotal(pv, Math.max(baseMainPV+modMainPV, 0));
        limitMax(pv);
    }

    #setPM() {
        const pm = this.magies.points;

        setBase(pm, this.caracteristique.pouvoir);
        const basePM = pm.base;
        const modPM = sumObject(pm.mod);
        setTotal(pm, Math.max(basePM+modPM, 0));
        limitMax(pm);
    }

    #setLocalization() {       
        const pv = this.pv;
        const localizations = this.localisations;

        let jambes = 2;
        let abdomen = 2;
        let poitrine = 3;
        let bras = 1;
        let tete = 2;
        let calc = 0;
    
        if(pv.total > 6) calc += Math.ceil((pv.total-6)/3);

        setBase(localizations.abdomen.pv, abdomen+calc);
        setBase(localizations.brasdroit.pv, bras+calc);
        setBase(localizations.brasgauche.pv, bras+calc);
        setBase(localizations.jambedroite.pv, jambes+calc);
        setBase(localizations.jambegauche.pv, jambes+calc);
        setBase(localizations.poitrine.pv, poitrine+calc);
        setBase(localizations.tete.pv, tete+calc);

        for(let l in localizations) {
            const data = localizations[l];
            const baseArmure = data.armure.base;
            const modArmure = sumObject(data.armure.mod);
            const basePV = data.pv.base;
            const modPV = sumObject(data.pv.mod);
            setTotal(data.armure, Math.max(baseArmure+modArmure, 0));
            setTotal(data.pv, Math.max(basePV+modPV, 0));
            limitMax(data.pv);
        }
    }

    #setRA() {
        const caracteristiques = this.caracteristique;
        const ratai = this.rangaction.tai;
        const radex = this.rangaction.dex;
        const totalTai = caracteristiques.taille;
        const totalDex = caracteristiques.dexterite;

        let rataiBase = 3;

        if(totalTai >= 7 && totalTai <= 14) rataiBase = 2;
        else if(totalTai >= 15 && totalTai <= 21) rataiBase = 1;
        else if(totalTai >= 22) rataiBase = 0;

        setBase(ratai, rataiBase);
        const baseRATai = ratai.base;
        const modRATai = sumObject(ratai.mod);
        setTotal(ratai, Math.max(baseRATai+modRATai, 0));

        let radexBase = 5;

        if(totalDex >= 6 && totalDex <= 8) radexBase = 4;
        else if(totalDex >= 9 && totalDex <= 12) radexBase = 3;
        else if(totalDex >= 13 && totalDex <= 15) radexBase = 2;
        else if(totalDex >= 16 && totalDex <= 18) radexBase = 1;
        else if(totalDex >= 19) radexBase = 0;

        setBase(radex, radexBase);
        const baseRADex = radex.base;
        const modRADex = sumObject(radex.mod);
        setTotal(radex, Math.max(baseRADex+modRADex, 0));

        const combatSpirituel = this.combats.combatspirituel.rangaction;
        setBase(combatSpirituel, radex.total);
        const combatSpirituelBase = combatSpirituel.base;
        const combatSpirituelMod = sumObject(combatSpirituel.mod);

        setTotal(combatSpirituel, Math.max(combatSpirituelBase+combatSpirituelMod, 0));
    }

    #setDmg() {
        const caracteristiques = this.caracteristique;
        const totalTai = caracteristiques.taille;
        const totalFor = caracteristiques.force;
        const total = totalTai+totalFor;
        const combat = this.combats;
        const dmg = combat.bonusDmg;
        let diceBonusDmg = 0;
        let diceBonusFace = 0;
        let diceBonusBonus = 0;
        let bonusDmgStr = ``;

        if (total <= 12) {
            diceBonusDmg -= 1;
        } else if (total <= 24) {
            diceBonusDmg += 0;
        } else if (total <= 40) {
            diceBonusDmg += 1;
        } else {
            diceBonusDmg += 2 + Math.floor((total - 56) / 16);
        }

        if(total < 13 || (total > 24 && total < 33)) diceBonusFace += 4;
        if(total > 40) diceBonusFace += 6;

        diceBonusDmg += sumObject(dmg.moddice);
        diceBonusFace += sumObject(dmg.modface);
        diceBonusBonus += sumObject(dmg.modbonus);

        if(diceBonusFace === 0 && diceBonusBonus === 0) bonusDmgStr = `0`;
        else if(diceBonusFace === 0 && diceBonusBonus !== 0) bonusDmgStr = diceBonusBonus;
        else bonusDmgStr = (diceBonusBonus) === 0 ? 
                `${diceBonusDmg}D${diceBonusFace}` : 
                `${diceBonusDmg}D${diceBonusFace}+${diceBonusBonus}`;

        Object.defineProperty(dmg, 'total', {
            value: bonusDmgStr,
            writable:true,
            enumerable:true,
            configurable:true
        });
    }

    #setDmgSpirituel() {
        const caracteristiques = this.caracteristique;
        const totalPou = caracteristiques.pouvoir;
        const totalCha = caracteristiques.charisme;
        const total = totalPou+totalCha;
        const combat = this.combats.combatspirituel;
        const dmg = combat.degats;
        let diceDmg = 0;
        let diceFace = 0;
        let diceBonus = 0;
        let bonusDmgStr = ``;

        if(total <= 12) diceFace += 3;
        else diceFace += 6;

        if (total <= 40) {
            diceDmg += 1;
        } else {
            diceDmg += 2 + Math.floor((total - 56) / 16);
        }

        if(total >= 25 && total <= 33) diceBonus += 1;
        else if(total >= 33) diceBonus += 3;

        if(total > 56) diceBonus += Math.floor((total - 56) / 16);

        diceDmg += sumObject(dmg.moddice);
        diceFace += sumObject(dmg.modface);
        diceBonus += sumObject(dmg.modbonus);
        
        if(diceFace === 0 && diceBonus === 0) bonusDmgStr = `0`;
        else if(diceFace === 0 && diceBonus !== 0) bonusDmgStr = diceBonus;
        else bonusDmgStr = (diceBonus) === 0 ? 
                `${diceDmg}D${diceFace}` : 
                `${diceDmg}D${diceFace}+${diceBonus}`;

        Object.defineProperty(dmg, 'total', {
            value: bonusDmgStr,
            writable:true,
            enumerable:true,
            configurable:true
        });
    }

    #setGuerison() {
        const constitution = this.caracteristique.constitution;
        const guerison = this.guerison;
        const mod = sumObject(guerison.mod);

        setBase(guerison, Math.max(Math.ceil(constitution/6), 1));

        guerison.total = game.i18n.format('RQG.GuerisonParSemaine', {value:Math.max(guerison.base+mod, 0)});
    }

    #setVitesse() {
        const encombrement = this.inventaire.encombrement;
        const malus = (encombrement.used.total-encombrement.max.total);
        const vitesse = this.deplacement;
        const base = 8;

        if(encombrement.used.total > encombrement.max.total) {
            Object.defineProperty(vitesse.mod, 'encombrement', {
                value: -malus,
                writable:true,
                enumerable:true,
                configurable:true
            });
        }

        const mod = sumObject(vitesse.mod);

        setBase(vitesse, base);
        setTotal(vitesse, base+mod);
    }

    #setCmp() {
        const encombrement = this.inventaire.encombrement;
        const malusENC = ['agilite', 'manipulation', 'discretion'];  
        const malus = (encombrement.used.total-encombrement.max.total);
        const competences = this.competences;
        const wpn = this.armes;

        for(let cmp in competences) {
            const data = competences[cmp];                      
                
            Object.defineProperty(data, 'base', {
                value: this.#calcCategorie(cmp),
                writable:true,
                enumerable:true,
                configurable:true
            });

            if(data.mod.progression < 0) {    
                Object.defineProperty(data.mod, 'progression', {
                    value: 0,
                    writable:true,
                    enumerable:true,
                    configurable:true
                });
            }

            const base = data.base;
            const mod = sumObject(data.mod);

            setTotal(data, Math.max(base+mod, 0));

            for(let subcmp in data.list) {
                const cfg = CONFIG.RQG.DATA.competences?.[subcmp] ?? {};
                const subdata = data.list[subcmp];   
                const rep = cfg?.repeat ?? false;   

                if(rep) {
                    for(let repeat of subdata.repeat) {
                        const progression = repeat?.mod?.progression ?? 0;

                        if(cfg?.byattr) {
                            Object.defineProperty(repeat, 'base', {
                                value: this.caracteristique?.[cfg?.attr] ?? 0 * cfg?.multi ?? 0,
                                writable:true,
                                enumerable:true,
                                configurable:true
                            });
                        }

                        if(progression < 0) {    
                            Object.defineProperty(repeat.mod, 'progression', {
                                value: 0,
                                writable:true,
                                enumerable:true,
                                configurable:true
                            });
                        }
                
                        if(subcmp === 'esquive') {
                            Object.defineProperty(subdata.mod, 'encombrement', {
                                value: -Math.min(encombrement.used.total, encombrement.max.total),
                                writable:true,
                                enumerable:true,
                                configurable:true
                            });
                        }

                        if(encombrement.used.total > encombrement.max.total && malusENC.includes(cmp)) {    
                            Object.defineProperty(repeat.mod, 'encombrement', {
                                value: -(malus*5),
                                writable:true,
                                enumerable:true,
                                configurable:true
                            });
                        }
            
                        const base = repeat.base;
                        const mod = sumObject(repeat.mod);
                        let total = base+mod;

                        if((base+repeat.mod.progression) > 0) total += data.total;
            
                        setTotal(repeat, Math.max(total, 0));
                    }
                } else {
                    if(cfg?.byattr) {
                        Object.defineProperty(subdata, 'base', {
                            value: this.caracteristique?.[cfg?.attr] ?? 0 * cfg?.multi ?? 0,
                            writable:true,
                            enumerable:true,
                            configurable:true
                        });
                    }

                    if(subdata.mod.progression < 0) {    
                        Object.defineProperty(subdata.mod, 'progression', {
                            value: 0,
                            writable:true,
                            enumerable:true,
                            configurable:true
                        });
                    }
                
                    if(subcmp === 'esquive') {
                        Object.defineProperty(subdata.mod, 'encombrement', {
                            value: -Math.min(encombrement.used.total, encombrement.max.total),
                            writable:true,
                            enumerable:true,
                            configurable:true
                        });
                    }

                    if(encombrement.used.total > encombrement.max.total && malusENC.includes(cmp)) {      
                        Object.defineProperty(subdata.mod, 'encombrement', {
                            value: -(malus*5),
                            writable:true,
                            enumerable:true,
                            configurable:true
                        });
                    }
        
                    const base = subdata.base;
                    const mod = sumObject(subdata.mod);
                    let total = base+mod;

                    if((base+subdata.mod.progression) > 0) total += data.total;
        
                    setTotal(subdata, Math.max(total, 0));
                }
            }
        }

        for(let cmp in wpn) {
            const data = wpn[cmp];        

            Object.defineProperty(data, 'base', {
                value: this.#calcCategorie('manipulation'),
                writable:true,
                enumerable:true,
                configurable:true
            });   

            if(data.mod.progression < 0) {    
                Object.defineProperty(data.mod, 'progression', {
                    value: 0,
                    writable:true,
                    enumerable:true,
                    configurable:true
                });
            }

            const base = data.base;
            const mod = sumObject(data.mod);

            setTotal(data, Math.max(base+mod, 0));

            for(let subcmp in data.list) {
                const cfg = CONFIG.RQG.DATA.competences?.[subcmp] ?? {};
                const subdata = data.list[subcmp];    
                const rep = cfg?.repeat ?? false

                if(subcmp === 'custom') {
                    for(let custom of subdata.list) {
                        if(custom.mod.progression < 0) {    
                            Object.defineProperty(custom.mod, 'progression', {
                                value: 0,
                                writable:true,
                                enumerable:true,
                                configurable:true
                            });
                        }  

                        if(encombrement.used.total > encombrement.max.total && malusENC.includes(cmp)) {
                            Object.defineProperty(custom.mod, 'encombrement', {
                                value: -(malus*5),
                                writable:true,
                                enumerable:true,
                                configurable:true
                            });
                        }
            
                        const base = custom.base;
                        const mod = sumObject(custom.mod);
                        let total = base+mod;

                        if((base+custom.mod.progression) > 0) total += data.total;
            
                        setTotal(custom, Math.max(total, 0));
                    }
                } else if(rep) {
                    for(let repeat of subdata.repeat) {
                        const progression = repeat?.mod?.progression ?? 0;
                        if(cfg?.byattr) {
                            Object.defineProperty(repeat, 'base', {
                                value: this.caracteristique?.[cfg?.attr] ?? 0 * cfg?.multi ?? 0,
                                writable:true,
                                enumerable:true,
                                configurable:true
                            });
                        }

                        if(progression < 0) {    
                            Object.defineProperty(repeat.mod, 'progression', {
                                value: 0,
                                writable:true,
                                enumerable:true,
                                configurable:true
                            });
                        }

                        if(encombrement.used.total > encombrement.max.total && malusENC.includes(cmp)) {
                            Object.defineProperty(repeat.mod, 'encombrement', {
                                value: -(malus*5),
                                writable:true,
                                enumerable:true,
                                configurable:true
                            });
                        }
            
                        const base = repeat.base;
                        const mod = sumObject(repeat.mod);
                        let total = base+mod;

                        if((base+repeat.mod.progression) > 0) total += data.total;
            
                        setTotal(repeat, Math.max(total, 0));
                    }
                } else {
                    const progression = subdata?.mod?.progression ?? 0

                    if(cfg?.byattr) {
                        Object.defineProperty(subdata, 'base', {
                            value: this.caracteristique?.[cfg?.attr] ?? 0 * cfg?.multi ?? 0,
                            writable:true,
                            enumerable:true,
                            configurable:true
                        });
                    }

                    if(progression < 0) {    
                        Object.defineProperty(subdata.mod, 'progression', {
                            value: 0,
                            writable:true,
                            enumerable:true,
                            configurable:true
                        });
                    }
        
                    const base = subdata.base;
                    const mod = sumObject(subdata.mod);
                    let total = base+mod;

                    if((base+subdata.mod.progression) > 0) total += data.total;
        
                    setTotal(subdata, Math.max(total, 0));
                }
            }
        }
    }

    #calcCategorie(cat) {
        const caracteristique = this.caracteristique;
        const force = caracteristique['force'];
        const taille = caracteristique['taille'];
        const dexterite = caracteristique['dexterite'];
        const pouvoir = caracteristique['pouvoir'];
        const intelligence = caracteristique['intelligence'];
        const charisme = caracteristique['charisme'];
        let result = 0;

        switch(cat) {
            case 'agilite':
                result += calcMod(pouvoir, 2)*5;
                result += calcMod(taille, 2, false)*5;
                result += calcMod(dexterite, 1)*5;
                result += calcMod(force, 2)*5;
                break;

            case 'communication':
                result += calcMod(intelligence, 2)*5;
                result += calcMod(pouvoir, 2)*5;
                result += calcMod(charisme, 1)*5;
                break;

            case 'connaissances':
                result += calcMod(intelligence, 1)*5;
                result += calcMod(pouvoir, 2)*5;
                break;

            case 'magie':
                result += calcMod(charisme, 2)*5;
                result += calcMod(pouvoir, 1)*5;
                break;

            case 'manipulation':
                result += calcMod(pouvoir, 2)*5;
                result += calcMod(intelligence, 1)*5;
                result += calcMod(dexterite, 1)*5;
                result += calcMod(force, 2)*5;
                break;

            case 'perception':
                result += calcMod(pouvoir, 1)*5;
                result += calcMod(intelligence, 2)*5;
                break;

            case 'discretion':
                result += calcMod(pouvoir, 2)*5;
                result += calcMod(taille, 1, false)*5;
                result += calcMod(dexterite, 1)*5;
                result += calcMod(intelligence, 1)*5;
                break;
        }

        return result;
    }

    #runes() {
        const elementaire = this.runes.elementaire;
        const pouvoir = this.runes.pouvoir;
        const pouvoirDouble = CONFIG.RQG.RUNES.comboPouvoir;

        for(let e in elementaire) {
            const data = elementaire[e];
            const base = data.base;
            const mod = sumObject(data.mod);
            
            setTotal(data, Math.max(base+mod, 0));
        }

        for(let p in pouvoirDouble) {
            const data1 = pouvoir[p];
            const data2 = pouvoir[pouvoirDouble[p]];
            const base1 = data1.base;  

            Object.defineProperty(data2, 'base', {
                value: 100-base1,
                writable:true,
                enumerable:true,
                configurable:true
            });
            
            setTotal(data1, Math.max(base1, 0));
            setTotal(data2, Math.max(data2.base, 0));
        }
    }

    #spirituelle() {
        const charisme = this.caracteristique.charisme;
        const data = this.magies.spirituelles.limitecha;
        let total = 0;

        setBase(data, charisme);

        const base = data.base;
        const mod = sumObject(data.mod);

        setTotal(data, Math.max(base+mod, 0));

        for(let s of this.items.magiespirituelle) {
            total += parseInt(s.system.points);
        }

        
        Object.defineProperty(data, 'value', {
            value: total,
            writable:true,
            enumerable:true,
            configurable:true
        });
    }

    #sorcellerie() {
        const intelligence = this.caracteristique.intelligence;
        const data = this.magies.sorcelleries.intlibre;

        setBase(data, intelligence);

        const base = data.base;
        const mod = sumObject(data.mod);

        setTotal(data, Math.max(base+mod, 0));

        let total = data.total;

        for(let s of this.items.sorcellerie) {
            total -= 1;
        }

        total -= this.magies.spirituelles.limitecha.value;

        Object.defineProperty(data, 'value', {
            value: total,
            writable:true,
            enumerable:true,
            configurable:true
        });
    }

    #encombrement() {
        const encombrement = this.inventaire.encombrement;
        const objets = this.actor.itemTypes.objet;
        const armesC = this.actor.itemTypes.armecontact;
        const armesD = this.actor.itemTypes.armedistance;
        const armure = this.actor.itemTypes.armure;
        const all = [].concat(objets, armesC, armesD, armure);
        const caracteristiques = this.caracteristique;
        let ENC = 0;
        let ENCINF1 = 0;
        
        all.forEach(i => {
            const data = i.system.encombrement;
            const value = parseInt(data.value);
            data.inferieura1 ? ENCINF1 += value > 0 ? Math.round((1/value) * 100) / 100 : 0 : ENC += value;
        });

        setBase(encombrement.used, Math.floor(ENC+ENCINF1));
        setTotal(encombrement.used, encombrement.used.base+sumObject(encombrement.used.mod));

        setBase(encombrement.max, Math.min(((caracteristiques.force+caracteristiques.constitution)/2), caracteristiques.force));
        setTotal(encombrement.max, encombrement.max.base+sumObject(encombrement.max.mod));
    }

    #setArmure() {
        const armures = this.items.armure.filter(itm => itm.system.wear);
        const deplacementsilencieux = [];
        let localisations = {
            jambedroite:0,
            jambegauche:0,
            abdomen:0,
            poitrine:0,
            brasdroit:0,
            brasgauche:0,
            tete:0,
        }

        for(let a of armures) {
            const loc = a.system.localisations;

            for(let l in loc) {
                localisations[l] += loc[l];
            }

            deplacementsilencieux.push(a.system.deplacementsilencieux);
        }

        for(let l in localisations) {
            setBase(this.localisations[l].armure, localisations[l]);
        }

        Object.defineProperty(this.competences.discretion.list.deplacementsilencieux.mod, 'armure', {
            value: -Math.max(deplacementsilencieux),
            writable:true,
            enumerable:true,
            configurable:true
        });
        
    }
        
    async prepareResistanceData() {
        return {
        data: [
            {
            type: 'number',
            name: 'active',
            class: 'active',
            label: game.i18n.localize('RQG.Active'),
            value: 1,
            min: 1,
            },
            {
            type: 'number',
            name: 'passive',
            class: 'passive',
            label: game.i18n.localize('RQG.Passive'),
            value: 1,
            min: 1,
            },
        ],
        width: 300,
        };
    }

    async prepareRuniqueData(target) {
        const item = getEmbeddedDocument(this.actor, target);
        const culte = item.system.culte;
        const affinites = item.system.affinites;
        const variable = item.system.variable;
        const width = 400;

        if (!culte) {
        ui.notifications.error(game.i18n.localize("RQG.NOTIFICATIONS.NotCulte"), { permanent: false });
        return { data: null };
        }

        const item2 = this.document?.items?.get(culte);
        if (!item2) {
        ui.notifications.error(game.i18n.localize("RQG.NOTIFICATIONS.NotCulte"), { permanent: false });
        return { data: null };
        }

        const depense = variable ? 1 : parseInt(item2.system.ptsrune.actuel) - parseInt(item.system.points);
        if (item2.system.ptsrune.actuel === 0 || depense < 0) {
        const key = item2.system.ptsrune.actuel === 0 ? "RQG.NOTIFICATIONS.NotPtsRune" : "RQG.NOTIFICATIONS.NotEnoughPtsRune";
        ui.notifications.error(game.i18n.localize(key), { permanent: false });
        return { data: null };
        }

        const data = [
        {
            type: 'select',
            name: 'affinite',
            class: 'affinite',
            selected: '',
            localize: false,
            label: game.i18n.localize('RQG.RUNES.Affinite'),
            list: Object.entries(affinites).filter(([_, value]) => value).reduce((acc, [key]) => {
            acc[key] = `${game.i18n.localize(`RQG.RUNES.${capitalizeFirstLetter(key)}`)} (${this.document.system.allRunes[key].total})`;
            return acc;
            }, { '': '' }),
        },
        {
            type: 'number',
            name: 'mod',
            class: 'mod',
            label: game.i18n.localize('RQG.Modificateur'),
            value: 0,
        },
        {
            type: 'hidden',
            name: 'culte',
            class: 'culte',
            value: culte,
        },
        ];

        if (variable) {
        const max = Math.min(parseInt(item2.system.ptsrune.actuel), parseInt(item.system.points));
        data.push(
            {
            type: 'number',
            name: 'cout',
            class: 'cout',
            label: game.i18n.localize('RQG.Cout'),
            value: max,
            min: 1,
            max,
            },
            {
            type: 'hidden',
            name: 'variable',
            class: 'variable',
            value: true,
            }
        );
        }

        return { data, width, item, item2 };
    }

    async prepareSpirituelleData(target) {
        const item = getEmbeddedDocument(this.actor, target);
        const variable = item.system.variable;
        const width = 400;
        const current = this.magies.points.value;
        const depense = variable ? 1 : current - parseInt(item.system.points);

        if (current === 0 || depense < 0) {
        const key = current === 0 ? "RQG.NOTIFICATIONS.NotPtsMagie" : "RQG.NOTIFICATIONS.NotEnoughPtsMagie";
        ui.notifications.error(game.i18n.localize(key), { permanent: false });
        return { data: null };
        }

        const data = [
        {
            type: 'number',
            name: 'mod',
            class: 'mod',
            label: game.i18n.localize('RQG.Modificateur'),
            value: 0,
        },
        ];

        if (variable) {
        const max = Math.min(current, parseInt(item.system.points));
        data.push(
            {
            type: 'number',
            name: 'cout',
            class: 'cout',
            label: game.i18n.localize('RQG.Cout'),
            value: max,
            min: 1,
            max,
            },
            {
            type: 'hidden',
            name: 'variable',
            class: 'variable',
            value: true,
            }
        );
        }

        return { data, width, item };
    }

    async prepareSorcellerieData(target) {
        const item = getEmbeddedDocument(this.actor, target);
        const listRunes = item.system.listRunes;
        const width = 400;
        const current = this.magies.points.value;
        const depense = current - parseInt(item.system.points);
        const calendar = game.settings.set('runequest-glorantha', "today-active");
        let calendarProcessed = {};

        if (current === 0 || depense < 0) {
        const key = current === 0 ? "RQG.NOTIFICATIONS.NotPtsMagie" : "RQG.NOTIFICATIONS.NotEnoughPtsMagie";
        ui.notifications.error(game.i18n.localize(key), { permanent: false });
        return { data: null };
        }

        const value = listRunes.includes('lune')
        ? Math.floor(Math.max(item.system.points * CONFIG.RQG.lune.pleinelune, 1))
        : item.system.points;

        if(calendar) {
        const dataCalendar = game.settings.get('runequest-glorantha', 'today');

        calendarProcessed.day = CONFIG.RQG.day[((dataCalendar.day - 1) % 7)];
        calendarProcessed.week = CONFIG.RQG.week[dataCalendar.week-1];
        calendarProcessed.season = CONFIG.RQG.season[dataCalendar.season-1];
        calendarProcessed.moon = dataCalendar.moon;
        }

        const data = [
        {
            type: 'number',
            name: 'mod',
            class: 'mod',
            label: game.i18n.localize('RQG.Modificateur'),
            value: 0,
        },
        {
            type: 'select',
            name: 'day',
            class: 'day',
            label: game.i18n.localize('RQG.SORCELLERIE.DAY.Label'),
            list: Object.fromEntries(CONFIG.RQG.day.map(v => [v, `RQG.SORCELLERIE.DAY.${capitalizeFirstLetter(v)}`])),
            selected: calendar ? calendarProcessed.day : CONFIG.RQG.day[0],
            localize: true,
        },
        {
            type: 'select',
            name: 'week',
            class: 'week',
            label: game.i18n.localize('RQG.SORCELLERIE.WEEK.Label'),
            list: Object.fromEntries(CONFIG.RQG.week.map(v => [v, `RQG.SORCELLERIE.WEEK.${capitalizeFirstLetter(v)}`])),
            selected: calendar ? calendarProcessed.week : CONFIG.RQG.week[0],
            localize: true,
        },
        {
            type: 'select',
            name: 'season',
            class: 'season',
            label: game.i18n.localize('RQG.SORCELLERIE.SEASON.Label'),
            list: Object.fromEntries(CONFIG.RQG.season.map(v => [v, `RQG.SORCELLERIE.SEASON.${capitalizeFirstLetter(v)}`])),
            selected: calendar ? calendarProcessed.season : CONFIG.RQG.season[0],
            localize: true,
        },
        {
            type: 'select',
            name: 'lieu',
            class: 'lieu',
            label: game.i18n.localize('RQG.SORCELLERIE.LIEU.Label'),
            list: {
            aucune: 'RQG.SORCELLERIE.LIEU.Aucune',
            mineure: 'RQG.SORCELLERIE.LIEU.Mineure',
            majeure: 'RQG.SORCELLERIE.LIEU.Majeure',
            superieure: 'RQG.SORCELLERIE.LIEU.Superieure',
            },
            selected: 'aucune',
            localize: true,
        },
        {
            type: 'select',
            name: 'composant',
            class: 'composant',
            label: game.i18n.localize('RQG.SORCELLERIE.COMPOSANT.Label'),
            list: {
            aucun: 'RQG.SORCELLERIE.COMPOSANT.Aucun',
            profane: 'RQG.SORCELLERIE.COMPOSANT.Profane',
            magique: 'RQG.SORCELLERIE.COMPOSANT.Magique',
            },
            selected: 'aucun',
            localize: true,
        },
        { type: 'line' },
        {
            type: 'number',
            name: 'cout',
            class: 'cout',
            disabled: true,
            label: game.i18n.localize('RQG.Cout'),
            value,
        },
        {
            type: 'number',
            name: 'modcout',
            class: 'modcout',
            label: game.i18n.localize('RQG.SORCELLERIE.ModificateurCout'),
            value: 0,
        },
        ...['force', 'portee', 'duree'].map(id => ({
            type: 'number',
            name: `intensite${id}`,
            class: `intensite${id} intensite`,
            label: game.i18n.localize(`RQG.SORCELLERIE.INTENSITE.${capitalizeFirstLetter(id)}`),
            value: 1,
            min: 1,
        }))
        ];

        if (listRunes.includes('lune')) {
        data.push({
            type: 'select',
            name: 'lune',
            class: 'lune',
            label: game.i18n.localize('RQG.SORCELLERIE.LUNE.Label'),
            list: {
            lunedescendante: 'RQG.SORCELLERIE.LUNE.Lunedescendante',
            lunemourante: 'RQG.SORCELLERIE.LUNE.Lunemourante',
            lunenoire: 'RQG.SORCELLERIE.LUNE.Lunenoire',
            lunenaissante: 'RQG.SORCELLERIE.LUNE.Lunenaissante',
            lunecroissante: 'RQG.SORCELLERIE.LUNE.Lunecroissante',
            pleinelune: 'RQG.SORCELLERIE.LUNE.Pleinelune',
            demilune: 'RQG.SORCELLERIE.LUNE.Demilune',
            },
            selected: calendar ? calendarProcessed.moon : 'pleinelune',
            localize: true,
        });
        }

        return { data, width, item, listRunes };
    }
  
    prepareContactData(type='both', target) {
        const item = getEmbeddedDocument(this.actor, target);
        const width = 400;
        const data = [];
        let height = null;

        switch(type) {
            case 'both':
                data.push(
                    {
                        type: 'select',
                        name: 'type',
                        class: 'type',
                        label: game.i18n.localize('RQG.Type'),
                        list: {
                        "attaque":"RQG.COMBAT.Attaque",
                        "parade":"RQG.COMBAT.Parade",
                        },
                        selected: 'attaque',
                        localize: true,
                    },
                    {
                        type:'number',
                        class:'mod',
                        name:'mod',
                        value:0,
                        min:0,
                        label:game.i18n.localize('RQG.Modificateur')
                    },
                    {
                        type:'text',
                        class:'moddgts',
                        name:'moddgts',
                        value:"",
                        label:game.i18n.localize('RQG.DIALOG.ModDgts')
                    },
                    {
                        type: 'check',
                        name: 'vise',
                        class: 'vise atk',
                        label: game.i18n.localize('RQG.COMBAT.Vise'),
                    },
                    {
                        type: 'select',
                        name: 'localisation',
                        class: 'localisation atk',
                        label: game.i18n.localize('RQG.LOCALIZATIONS.Singular'),
                        list: CONFIG.RQG.localisations.reduce((acc, key) => {
                            acc[key] = `RQG.LOCALIZATIONS.${capitalizeFirstLetter(key)}`;
                            return acc;
                          }, {}),
                        selected: CONFIG.RQG.localisations[0],
                        style:"display:none;",
                        localize: true,
                    },
                    {
                        type:'number',
                        class:'numparade parade',
                        name:'parade',
                        value:1,
                        min:1,
                        label:game.i18n.localize('RQG.COMBAT.ParadesTotales'),
                        style:"display:none;"
                    },
                );
                height = 250;
                break;

            case 'parade':
                const wpn = this.wpnWear.contact.reduce((acc, itm) => {
                    acc[itm.id] = itm.name;
                    return acc;
                }, {});

                data.push(
                    {
                        type: 'hidden',
                        name: 'type',
                        class: 'type',
                        value:'parade',
                    },
                    {
                        type: 'select',
                        name: 'arme',
                        class: 'arme',
                        label: game.i18n.localize('RQG.COMBAT.Arme'),
                        list: wpn,
                        selected: Object.keys(wpn)[0],
                    },
                    {
                        type:'number',
                        class:'mod',
                        name:'mod',
                        value:0,
                        min:0,
                        label:game.i18n.localize('RQG.Modificateur')
                    },
                    {
                        type:'number',
                        class:'numparade parade',
                        name:'parade',
                        value:1,
                        min:1,
                        label:game.i18n.localize('RQG.COMBAT.ParadesTotales'),
                    },
                );
                break;
        }      


        return { data, width, height, item };
    }

    prepareDistanceData(target) {
        const item = getEmbeddedDocument(this.actor, target);
        const width = 400;
        const data = [];
        let height = null;

        data.push(
            {
                type:'number',
                class:'mod',
                name:'mod',
                value:0,
                min:0,
                label:game.i18n.localize('RQG.Modificateur')
            },
            {
                type:'text',
                class:'moddgts',
                name:'moddgts',
                value:"",
                label:game.i18n.localize('RQG.DIALOG.ModDgts')
            },
            {
                type: 'check',
                name: 'vise',
                class: 'vise atk',
                label: game.i18n.localize('RQG.COMBAT.Vise'),
            },
            {
                type: 'select',
                name: 'localisation',
                class: 'localisation atk',
                label: game.i18n.localize('RQG.LOCALIZATIONS.Singular'),
                list: CONFIG.RQG.localisations.reduce((acc, key) => {
                    acc[key] = `RQG.LOCALIZATIONS.${capitalizeFirstLetter(key)}`;
                    return acc;
                  }, {}),
                selected: CONFIG.RQG.localisations[0],
                style:"display:none;",
                localize: true,
            },
        );
        height = 250;


        return { data, width, height, item };
    }

    prepareEsquiveData(target) {
        const width = 400;
        const data = [];
        let height = null;

        data.push(
            {
                type:'number',
                class:'mod',
                name:'mod',
                value:0,
                min:0,
                label:game.i18n.localize('RQG.Modificateur')
            }
        );
        height = 250;


        return { data, width, height, };
    }
    
    async handleRoll(type, button, label, item, item2, listRunes, addContent={}, addFlags=[]) {
        let tags = [];
        let score = 0;
        let modificateur = 0;
        let cout = 0;
        let variable = false;
        let buttons = {};
        let content = {};
        let flags = [];
        let localisation;
        let allRoll = [];
        let other = [];
        let flagLoc;
        const baseFlags = addFlags;
    
        switch (type) {
            case 'resistance':
                ({ score, tags } = this.#rollResistance(button));
                break;
            case 'runique':
                ({ score, modificateur, tags, buttons } = this.#rollRunique(button, item, item2));
                break;
            case 'spirituelle':
                ({ score, modificateur, tags, buttons } = this.#rollSpirituelle(button, item));
                break;
            case 'sorcellerie':
                ({ score, modificateur, tags, buttons } = this.#rollSorcellerie(button, item, listRunes));
                break;
            case 'armecontact':
            case 'parade':
                ({ score, modificateur, tags, buttons, flags } = this.#rollArmeContact(button, item));
                
                flagLoc = Array.isArray(flags) ? flags.find(f => f.key === "loc") : undefined;

                if(flagLoc && flagLoc.value) {
                    other.push(game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(flagLoc.value)}`));
                } else if(type === 'armecontact') {
                    const loc = new Roll('1D20');
                    await loc.evaluate();
        
                    allRoll.push(loc);
        
                    const strLoc = Object.entries(CONFIG.RQG.DATA.localisations)
                        .find(([_, range]) => loc.result >= range.min && loc.result <= range.max)?.[0] || null;
        
                    other.push(game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(strLoc)}`));
                    flags.push({
                        key:'loc',
                        value:strLoc,
                    });
                }
                break;
            case 'armedistance':
                ({ score, modificateur, tags, buttons, flags } = this.#rollArmeDistance(button, item));
                
                flagLoc = Array.isArray(flags) ? flags.find(f => f.key === "loc") : undefined;

                if(flagLoc && flagLoc.value) {
                    other.push(game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(flagLoc.value)}`));
                } else if(type === 'armedistance') {
                    const loc = new Roll('1D20');
                    await loc.evaluate();
        
                    allRoll.push(loc);
        
                    const strLoc = Object.entries(CONFIG.RQG.DATA.localisations)
                        .find(([_, range]) => loc.result >= range.min && loc.result <= range.max)?.[0] || null;
        
                    other.push(game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(strLoc)}`));
                    flags.push({
                        key:'loc',
                        value:strLoc,
                    });
                }
                break;
            case 'esquive':
                ({ score, modificateur, tags, buttons, flags } = this.#rollEsquive(button));
                break;
        }


        
        const roll = new processRoll({ score, modificateur });
        const send = new sendChat(this.actor);
        await roll.doRoll();
        content = {
            difficulte: {
                value: Math.min(roll.difficulte, 95),
                tooltip: roll.details,
            },
            flavor: label,
            roll: allRoll.concat(roll.roll),
            result: roll.result,
            tooltip: roll.tooltip,
            other,
            tags,
            buttons,
        };

        // Fusionner content et addContent
        content = { ...content, ...addContent };
        baseFlags.push({
            key:'content',
            value:content,
        })
        
        const msg = await send.sendRoll(content, [...baseFlags, ...flags]);

        return msg;
    }
        
    #rollResistance(button) {
        const tags = [];
        const active = Number($(button.form.elements.active).val());
        const passive = Number($(button.form.elements.passive).val());
        tags.push(
        { label: game.i18n.localize('RQG.Active'), value: active },
        { label: game.i18n.localize('RQG.Passive'), value: passive },
        );
        const score = 50 + (active * 5) - (passive * 5);
        return { score, tags };
    }
    
    #rollRunique(button, item, item2) {
        const tags = [];
        const affinite = $(button.form.elements.affinite).val();
        const culte = $(button.form.elements.culte).val();
        let cout = Number($(button.form.elements.cout).val());
        const variable = $(button.form.elements.variable).val();
    
        if (!cout) cout = Math.max(item.system.points, 1);
    
        const buttons = {
        class: 'simple',
        list: [],
        };
    
        if (culte && culte !== "0") {
        tags.push({ label: game.i18n.format(`RQG.CULTE.LabelFormat`, { culte: item2.name }) });
        buttons.list.push({
            class: 'depense',
            label: game.i18n.format('RQG.BUTTONS.DepenseRune', { pts: cout }),
            id: item2.id,
            path: 'system.ptsrune.actuel',
            value: cout,
            msg: "RQG.CHAT.DepenseRune",
            notenough: "RQG.NOTIFICATIONS.NotEnoughPtsRune",
            notpts: "RQG.NOTIFICATIONS.NotPtsRune",
        });
        }
    
        if (affinite) {
        tags.push({
            label: game.i18n.format(`RQG.RUNES.AffiniteFormat`, {
            affinite: game.i18n.localize(`RQG.RUNES.${capitalizeFirstLetter(affinite)}`)
            })
        });
        }
    
        if (variable) {
        tags.push({ label: `${game.i18n.localize(`RQG.Cout`)} : ${cout}` });
        }
    
        const score = this.allRunes[affinite].total;
        const modificateur = Number($(button.form.elements.mod).val());
        return { score, modificateur, tags, buttons };
    }
    
    #rollSpirituelle(button, item) {
        const tags = [];
        let cout = Number($(button.form.elements.cout).val());
        const variable = $(button.form.elements.variable).val();
    
        if (!cout) cout = Math.max(item.system.points, 1);
    
        const buttons = {
        class: 'simple',
        list: [{
            class: 'depense',
            label: game.i18n.format('RQG.BUTTONS.DepenseMagie', { pts: cout }),
            path: 'system.magies.points.value',
            value: cout,
            msg: "RQG.CHAT.DepenseMagie",
            notenough: "RQG.NOTIFICATIONS.NotEnoughPtsMagie",
            notpts: "RQG.NOTIFICATIONS.NotPtsMagie",
        }],
        };
    
        if (variable) {
        tags.push({ label: `${game.i18n.localize(`RQG.Cout`)} : ${cout}` });
        }
    
        const score = this.caracteristique.pouvoir * 5;
        const modificateur = Number($(button.form.elements.mod).val());
        return { score, modificateur, tags, buttons };
    }
    
    #rollSorcellerie(button, item, listRunes) {
        const tags = [];
        let score = item.system.maitrise;
        const cout = Number($(button.form.elements.cout).val());
        const modificateur = Number($(button.form.elements.modcout).val());
    
        const day = $(button.form.elements.day).val();
        const week = $(button.form.elements.week).val();
        const season = $(button.form.elements.season).val();
        const lieu = $(button.form.elements.lieu).val();
        const composant = $(button.form.elements.composant).val();
    
        const modDay = CONFIG.RQG.dayMod[day];
        const modWeek = CONFIG.RQG.weekMod[week];
        const modSeason = CONFIG.RQG.seasonMod[season];
    
        let dayMod = 0, weekMod = 0, seasonMod = 0;
    
        for (let r of listRunes) {
        const label = `${game.i18n.localize(`RQG.RUNES.${capitalizeFirstLetter(r)}`)}`;
        tags.push({ label });
    
        if (modDay.bonus === r) { score += 10; dayMod += 10; }
        else if (modDay.malus === r) { score -= 10; dayMod -= 10; }
    
        if (modWeek.bonus === r) { score += 10; weekMod += 10; }
        else if (modWeek.malus === r) { score -= 10; weekMod -= 10; }
    
        if (modSeason.bonus === r) { score += 5; seasonMod += 5; }
        else if (modSeason.malus === r) { score -= 15; seasonMod -= 15; }
        }
    
        tags.push(
        { label: `${game.i18n.localize(`RQG.SORCELLERIE.SEASON.Label`)} : ${game.i18n.localize(`RQG.SORCELLERIE.SEASON.${capitalizeFirstLetter(season)}`)}`, tooltip: seasonMod },
        { label: `${game.i18n.localize(`RQG.SORCELLERIE.WEEK.Label`)} : ${game.i18n.localize(`RQG.SORCELLERIE.WEEK.${capitalizeFirstLetter(week)}`)}`, tooltip: weekMod },
        { label: `${game.i18n.localize(`RQG.SORCELLERIE.DAY.Label`)} : ${game.i18n.localize(`RQG.SORCELLERIE.DAY.${capitalizeFirstLetter(day)}`)}`, tooltip: dayMod }
        );
    
        if (CONFIG.RQG.lieuAssociation[lieu] > 0) {
        tags.push({
            label: `${game.i18n.localize(`RQG.SORCELLERIE.LIEU.Label${capitalizeFirstLetter(lieu)}`)}`,
            tooltip: CONFIG.RQG.lieuAssociation[lieu],
        });
        score += CONFIG.RQG.lieuAssociation[lieu];
        }
    
        if (CONFIG.RQG.composants[composant] > 0) {
        tags.push({
            label: `${game.i18n.localize(`RQG.SORCELLERIE.COMPOSANT.${capitalizeFirstLetter(composant)}`)}`,
            tooltip: CONFIG.RQG.composants[composant],
        });
        score += CONFIG.RQG.composants[composant];
        }
    
        const buttons = {
        class: 'simple',
        list: [{
            class: 'depense',
            label: game.i18n.format('RQG.BUTTONS.DepenseMagie', { pts: cout }),
            path: 'system.magies.points.value',
            value: cout,
            msg: "RQG.CHAT.DepenseMagie",
            notenough: "RQG.NOTIFICATIONS.NotEnoughPtsMagie",
            notpts: "RQG.NOTIFICATIONS.NotPtsMagie",
        }],
        };
    
        return { score, modificateur, tags, buttons };
    }

    #rollArmeContact(button, item) {
        const tags = [];
        const flags = [];
        const type = $(button.form.elements.type).val();
        const mod = Number($(button.form.elements.mod).val());
        const moddgts = $(button.form.elements.moddgts).val();
        const vise = $(button.form.elements.vise).is(':checked');;
        const localisation = $(button.form.elements.localisation).val();
        let fItem = item;
        let buttons = {};
        let score = 0;
        let modificateur = 0;
        let targets;
        
        score += mod;
        
        if(modificateur) {
            tags.push({
            label: `${game.i18n.localize(`RQG.Modificateur`)} : ${mod}`,
            tooltip: `${game.i18n.localize(`RQG.Modificateur`)} : ${mod}`,
            data:{
                'name':'mod',
                'value':mod,
            },
            });
        }

        switch(type) {
            case 'attaque':
            
                tags.unshift({
                    label: `${game.i18n.localize(`RQG.COMBAT.${capitalizeFirstLetter(type)}`)}`,
                    tooltip: `${game.i18n.localize(`RQG.COMBAT.${capitalizeFirstLetter(type)}`)}`,
                });
                
                if(vise) {
                    flags.loc = localisation;
                    score = Math.ceil(autocalcAtkWpn(this.actor, item) / 2);
                } else score += autocalcAtkWpn(this.actor, item);
    
                const tgt = game.user.targets;
    
                if(moddgts) {
                    tags.push({
                    label: `${game.i18n.localize(`RQG.DIALOG.ModDgts`)} : ${moddgts}`,
                    tooltip: `${game.i18n.localize(`RQG.DIALOG.ModDgts`)} : ${moddgts}`,
                    data:{
                        'name':'moddgts',
                        'value':moddgts,
                    },
                    });
                }
            
                buttons = {
                    class: 'double',
                    list:[],
                };
    
                // Vérifie si le Set targets n'est pas vide
                if(tgt && tgt.size > 0) {
                    for (let target of tgt) {
                        const targetName = target.name || (target.actor && target.actor.name) || "";
                        // Récupérer les IDs des utilisateurs propriétaires de l'acteur de la cible
                        let ownerIds = [];
                        if (target.actor && target.actor.ownership) {
                            ownerIds = Object.entries(target.actor.ownership)
                            .filter(([userId, level]) => level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
                            .map(([userId, _]) => userId);
                        }
                        // Si aucun propriétaire trouvé, on laisse vide (ou on peut mettre null)
                        buttons.list.push({
                            class: 'parade center',
                            label: `${game.i18n.localize('RQG.COMBAT.Parade')} (${targetName})`,
                            id: ownerIds.join('/'), // On met la liste des IDs propriétaires ici
                            value:target.id,
                        });
                        buttons.list.push({
                            class: 'esquive center',
                            label: `${game.i18n.localize('RQG.COMBAT.Esquive')} (${targetName})`,
                            id: ownerIds.join('/'), // On met la liste des IDs propriétaires ici
                            value:target.id,
                        });
                        buttons.list.push({
                            class: 'dmg full',
                            label: `${game.i18n.localize('RQG.COMBAT.Degats')} (${targetName})`,
                            id: ownerIds.join('/'), // On met la liste des IDs propriétaires ici
                            value:target.id,
                        });
                    }
    
                    // On transforme le Set targets en tableau d'ids d'acteurs ciblés pour le stocker dans flags
                    targets = Array.from(tgt).map(t => t.id);
                } else {
                    buttons.list.push({
                    class: 'degats center full',
                    label: game.i18n.localize('RQG.COMBAT.Degats'),
                    });
                }
                break;

            case 'parade':
                const modParade = $(button.form.elements.parade).val();
                const wpn = this.actor.items.get($(button.form.elements.arme).val());

                if(!wpn) {
                    ui.notifications.error(game.i18n.localize("RQG.NOTIFICATIONS.NotWpn"), { permanent: false });
                    return;
                }

                fItem = wpn;
                score += autocalcAtkWpn(this.actor, wpn);
                
                tags.unshift({
                    label: wpn.name,
                    tooltip: `${game.i18n.localize(`RQG.CHAT.ArmeUsed`)}`,
                });

                if(modParade > 1) {
                    score -= ((modParade-1)*20);
                    tags.push({
                        label: `${game.i18n.localize("RQG.CHAT.NumParade")} : ${modParade}`,
                        tooltip: `${game.i18n.localize(`RQG.CHAT.ArmeUsed`)}`,
                    });
                }

                if(score < 0) score = 0;
                break;
        }

        flags.push({
            key:'data',
            value: {
                tags,
                targets,
                'itm':fItem,
                'special':type,
            },
        })

        return { score, modificateur, tags, buttons, flags };
    }

    #rollArmeDistance(button, item) {
        const tags = [];
        const flags = [];
        const type = $(button.form.elements.type).val();
        const mod = Number($(button.form.elements.mod).val());
        const moddgts = $(button.form.elements.moddgts).val();
        const vise = $(button.form.elements.vise).is(':checked');;
        const localisation = $(button.form.elements.localisation).val();
        let fItem = item;
        let buttons = {};
        let score = 0;
        let modificateur = 0;
        let targets;
        
        score += mod;
        
        if(modificateur) {
            tags.push({
            label: `${game.i18n.localize(`RQG.Modificateur`)} : ${mod}`,
            tooltip: `${game.i18n.localize(`RQG.Modificateur`)} : ${mod}`,
            data:{
                'name':'mod',
                'value':mod,
            },
            });
        }

        tags.unshift({
            label: `${game.i18n.localize(`RQG.COMBAT.Attaque`)}`,
            tooltip: `${game.i18n.localize(`RQG.COMBAT.Attaque`)}`,
        });
        
        if(vise) {
            flags.loc = localisation;
            score = Math.ceil(autocalcAtkWpn(this.actor, item) / 2);
        } else score += autocalcAtkWpn(this.actor, item);

        const tgt = game.user.targets;

        if(moddgts) {
            tags.push({
            label: `${game.i18n.localize(`RQG.DIALOG.ModDgts`)} : ${moddgts}`,
            tooltip: `${game.i18n.localize(`RQG.DIALOG.ModDgts`)} : ${moddgts}`,
            data:{
                'name':'moddgts',
                'value':moddgts,
            },
            });
        }
    
        buttons = {
            class: 'double',
            list:[],
        };

        // Vérifie si le Set targets n'est pas vide
        if(tgt && tgt.size > 0) {
            for (let target of tgt) {
                const targetName = target.name || (target.actor && target.actor.name) || "";
                // Récupérer les IDs des utilisateurs propriétaires de l'acteur de la cible
                let ownerIds = [];
                if (target.actor && target.actor.ownership) {
                    ownerIds = Object.entries(target.actor.ownership)
                    .filter(([userId, level]) => level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
                    .map(([userId, _]) => userId);
                }
                // Si aucun propriétaire trouvé, on laisse vide (ou on peut mettre null)
                buttons.list.push({
                    class: 'parade center',
                    label: `${game.i18n.localize('RQG.COMBAT.Parade')} (${targetName})`,
                    id: ownerIds.join('/'), // On met la liste des IDs propriétaires ici
                    value:target.id,
                });
                buttons.list.push({
                    class: 'esquive center',
                    label: `${game.i18n.localize('RQG.COMBAT.Esquive')} (${targetName})`,
                    id: ownerIds.join('/'), // On met la liste des IDs propriétaires ici
                    value:target.id,
                });
                buttons.list.push({
                    class: 'dmg full',
                    label: `${game.i18n.localize('RQG.COMBAT.Degats')} (${targetName})`,
                    id: ownerIds.join('/'), // On met la liste des IDs propriétaires ici
                    value:target.id,
                });
            }

            // On transforme le Set targets en tableau d'ids d'acteurs ciblés pour le stocker dans flags
            targets = Array.from(tgt).map(t => t.id);
        } else {
            buttons.list.push({
            class: 'degats center full',
            label: game.i18n.localize('RQG.COMBAT.Degats'),
            });
        }

        flags.push({
            key:'data',
            value: {
                tags,
                targets,
                'itm':fItem,
                'special':'attaque',
            },
        })

        return { score, modificateur, tags, buttons, flags };
    }

    #rollEsquive(button, item) {
        const total = this.competences.agilite.list.esquive.total;
        const mod = Number($(button.form.elements.mod).val());
        const tags = [];
        const flags = [];
        let buttons = {};
        let score = total;
        let modificateur = 0;
        let targets;
        
        score += mod;
        
        if(modificateur) {
            tags.push({
            label: `${game.i18n.localize(`RQG.Modificateur`)} : ${mod}`,
            tooltip: `${game.i18n.localize(`RQG.Modificateur`)} : ${mod}`,
            data:{
                'name':'mod',
                'value':mod,
            },
            });
        }

        tags.unshift({
            label: `${game.i18n.localize(`RQG.COMBAT.Esquive`)}`,
            tooltip: `${game.i18n.localize(`RQG.COMBAT.Esquive`)}`,
        });

        if(score < 0) score = 0;

        flags.push({
            key:'data',
            value: {
                tags,
                targets,
                'special':'esquive',
            },
        })

        return { score, modificateur, tags, buttons, flags };
    }
}