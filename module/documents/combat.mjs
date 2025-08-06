import OpenDialog from './dialog.mjs';
import sendChat from './chat.mjs';

export class RQGCombatant extends Combatant {
  async _getInitiativeFormula() {
    const actor = this.actor;
    const width = 600;
    const height = 380;
    const title = game.i18n.localize('RQG.Initiative');
    const itemTypes = actor.itemTypes;
    const wpn = [].concat(...itemTypes.armecontact, itemTypes.armedistance);
    const spirituel = itemTypes.magiespirituelle;
    const sorcellerie = itemTypes.sorcellerie;
    const runique = itemTypes.magierunique;
    const data = [];
    const allWpn = {
      '':'',
    };
    const allSpirituel = {
      '':'',
    };
    const allSorcellerie = {
      '':'',
    };
    const allRunique = {
      '':'',
    };

    for(let w of wpn) {
      if(w.system.wear) allWpn[w.id] = w.name;
    }

    for(let s of spirituel) {
      allSpirituel[s.id] = s.name;
    }

    for(let s of sorcellerie) {
      allSorcellerie[s.id] = s.name;
    }

    for(let s of runique) {
      allRunique[s.id] = s.name;
    }

    data.push({
      type:'select',
      label:game.i18n.localize('RQG.Type'),
      list:CONFIG.RQG.INITIATIVE.Type,
      selected:'arme',
      name:"type",
      localize:true,
      class:'type',
    },
    {
      type:'select',
      label:game.i18n.localize('RQG.COMBAT.Armes'),
      list:allWpn,
      selected:'',
      name:"wpn",
      class:'wpn',
    },
    {
      type:'select',
      label:game.i18n.localize('RQG.COMBAT.Sorts'),
      list:allSpirituel,
      selected:'',
      name:"sortspirituel",
      class:'sorts spirituel',
      style:"display:none;"
    },
    {
      type:'select',
      label:game.i18n.localize('RQG.COMBAT.Sorts'),
      list:allSorcellerie,
      selected:'',
      name:"sortssorcellerie",
      class:'sorts sorcellerie',
      style:"display:none;"
    },
    {
      type:'select',
      label:game.i18n.localize('RQG.COMBAT.Sorts'),
      list:allRunique,
      selected:'',
      name:"sortrunique",
      class:'sorts runique',
      style:"display:none;"
    },
    {
      type:'number',
      class:'mod',
      name:'modificateur',
      value:0,
      label:game.i18n.localize('RQG.Modificateur')
    },
    {
      type:'number',
      class:'ptsmagie magie',
      name:'ptsmagie',
      value:0,
      min:0,
      label:game.i18n.localize('RQG.DIALOG.DepenseMagie'),
      style:"display:none;"
    },
    {
      type:'number',
      class:'ptsmagiesupp spirituel',
      name:'ptsmagiesupp',
      value:0,
      min:0,
      max:actor.system.magies.points.value,
      label:game.i18n.localize('RQG.DIALOG.DepenseMagieSupp'),
      style:"display:none;"
    },
    {
      type:'number',
      class:'renforcement runique',
      name:'renforcement',
      value:0,
      min:0,
      max:actor.system.magies.points.value,
      label:game.i18n.localize('RQG.DIALOG.Renforcement'),
      style:"display:none;"
    },
    {
      type:'number',
      class:'intensite sorcellerie',
      name:'intensite',
      value:0,
      min:0,
      label:game.i18n.localize('RQG.DIALOG.Intensite'),
      style:"display:none;"
    },
    {
      type:'number',
      class:'deplacement',
      name:'deplacement',
      value:0,
      min:0,
      step:3,
      label:game.i18n.localize('RQG.DIALOG.Deplacement')
    },
    {
      type:'check',
      class:'vise wpn',
      name:'vise',
      label:game.i18n.localize('RQG.COMBAT.Vise')
    },
    {
      type:'check',
      class:'pret',
      name:'pret',
      label:game.i18n.localize('RQG.DIALOG.Pret')
    },
    {
      type:'check',
      class:'preparer',
      name:'preparer',
      label:game.i18n.localize('RQG.DIALOG.Preparer')
    },
    {
      type:'check',
      class:'surpris3',
      name:'surpris3',
      label:game.i18n.localize('RQG.DIALOG.Surpris3')
    },
    {
      type:'check',
      class:'surpris4',
      name:'surpris4',
      label:game.i18n.localize('RQG.DIALOG.Surpris4')
    });
    
    const dialog = await new OpenDialog(data, {
      title,
      classes: ['rqgDialog', 'rqgDialogAsk'],
      width,
      height,
      modal: true,
    });

    let init = 0;
    let use = {};
    
    await dialog.renderAsk(
      (event, button, dialog) => {
        const type = $(button.form.elements.type).val();
        const arme = $(button.form.elements.wpn).val();
        const vise = $(button.form.elements.vise).is(":checked");;
        const pret = $(button.form.elements.pret).is(":checked");;
        const preparer = $(button.form.elements.preparer).is(":checked");;
        const magie = $(button.form.elements.ptsmagie).val();
        const magieSupp = $(button.form.elements.ptsmagiesupp).val();
        const intensite = $(button.form.elements.intensite).val();
        const deplacement = $(button.form.elements.deplacement).val();
        const surpris3 = $(button.form.elements.surpris3).is(":checked");;
        const surpris4 = $(button.form.elements.surpris4).is(":checked");;
        const mspirituel = $(button.form.elements.sortspirituel).val();
        const msorcellerie = $(button.form.elements.sortssorcellerie).val();
        const mrunique = $(button.form.elements.sortrunique).val();
        const renforcement = $(button.form.elements.renforcement).val();
        const modificateur = $(button.form.elements.modificateur).val();
        let choice;

        switch(type) {
          case 'arme':
            choice = actor.items.get(arme);
          
            if(choice) {
              init = choice.system.fullRA;
              use.name = choice.name;
              use.id = choice.id;
              use.ra = choice.system.fullRA;
            }
            break;
            
          case 'spirituel':    
            choice = actor.items.get(mspirituel);

            init = parseInt(actor.system.allRA.spirituel);
            init += parseInt(magieSupp);

            if(choice) {
              if(choice.system.variable) {
                init += Math.max((parseInt(magie) - 1), 0);
                use.magie = parseInt(magie);
              }
              else {
                init += Math.max(parseInt(choice.system.points) - 1, 0);
                use.magie = parseInt(choice.system.points);
              }

              use.name = choice.name;
              use.id = choice.id;
            }

            use.ra = actor.system.allRA.spirituel;
            use.rasupp = parseInt(magieSupp);
            break;
            
          case 'sorcellerie':    
            choice = actor.items.get(msorcellerie);
            init = parseInt(actor.system.allRA.sorcellerie);
            init += parseInt(intensite)*2;

            if(choice) {
              init += Math.max(parseInt(choice.system.points) - 1, 0);

              use.name = choice.name;
              use.id = choice.id;
              use.magie = parseInt(choice.system.points);
            }

            use.ra = actor.system.allRA.sorcellerie;
            use.intensite = parseInt(intensite);
            break;

          case 'runique':
            choice = actor.items.get(mrunique);
            init = 1;

            if(choice) {
              init += Math.max(parseInt(choice.system.points) - 1, 0);

              use.name = choice.name;
              use.id = choice.id;
              use.magie = parseInt(choice.system.points);
            }

            init += parseInt(renforcement);
            use.ra = 1;
            use.renforcement = renforcement;
            break;
        }

        init += Math.floor(parseInt(deplacement)/3);
        init += parseInt(modificateur);

        use.deplacement = parseInt(deplacement);
        use.mod = parseInt(modificateur);
        use.surpris3 = surpris3;
        use.surpris4 = surpris4;
        use.pret = pret;
        use.preparer = preparer;

        if(surpris3) init += 3;
        if(surpris4) init += 1;
        if(pret) init += 0;
        if(preparer) init += 5;

        if(type === 'arme' && vise) init = 12;
      },
      (event, dialog) => {
        const html = $(dialog.element);

        html.find('label.type select').change(async ev => {
          const tgt = $(ev.currentTarget);
          const value = tgt.val();

          switch(value) {
            case 'arme':
              html.find('label.wpn').show();
              html.find('label.spirituel').hide();
              html.find('label.sorcellerie').hide();
              html.find('label.runique').hide();
              html.find('label.magie').hide();
              break;

            case 'spirituel':
              html.find('label.wpn').hide();
              html.find('label.spirituel').show();
              html.find('label.sorcellerie').hide();
              html.find('label.runique').hide();
              //html.find('label.magie').show();
              break;
              
            case 'sorcellerie':
              html.find('label.wpn').hide();
              html.find('label.spirituel').hide();
              html.find('label.runique').hide();
              html.find('label.sorcellerie').show();
              //html.find('label.magie').show();
              break;

            case 'runique':
              html.find('label.wpn').hide();
              html.find('label.spirituel').hide();
              html.find('label.sorcellerie').hide();
              html.find('label.runique').show();
              //html.find('label.magie').show();
              break;
          }
        });

        html.find('label.sorts.spirituel select').change(async ev => {
          const tgt = $(ev.currentTarget);
          const value = tgt.val();
          const itm = spirituel.find(itm => itm.id === value);

          if(itm) {
            if(itm.system.variable) {
              html.find('label.ptsmagie.magie').show();
              html.find('label.ptsmagie.magie input').val(itm.system.points);
            } else html.find('label.ptsmagie.magie').hide();
          } else html.find('label.ptsmagie.magie').hide();
        });

        html.find('label.ptsmagie.magie input').change(async ev => {
          const id = html.find('label.sorts.spirituel select').val();
          const itm = spirituel.find(itm => itm.id === id);
          const tgt = $(ev.currentTarget);
          const value = tgt.val();

          if(value > itm.system.points) tgt.val(itm.system.points);
        });
      },
    );

    if(init > 12) init = 12;
    

    if(!foundry.utils.isEmpty(use)) {
      const send = new sendChat(actor);
      const toSend = {
        content:[],
      };

      toSend.id = use.id;
      toSend.class = 'double';

      toSend.content.push({
        type:'full',
        class:'title',
        value:use.name,
      });

      if(use.ra) {
        toSend.content.push({
          type:'label',
          label:`${game.i18n.localize('RQG.COMBAT.Rangaction')} : `,
          value:use.ra,
        });
      }

      if(use.mod) {
        toSend.content.push({
          type:'label',
          label:`${game.i18n.localize('RQG.Modificateur')} : `,
          value:use.mod,
        });
      }

      if(use.deplacement) {
        toSend.content.push({
          type:'label',
          label:`${game.i18n.localize('RQG.DIALOG.Deplacement')} : `,
          value:use.deplacement,
        });
      }

      if(use.surpris3) {
        toSend.content.push({
          type:'full',
          class:'line',
          value:game.i18n.localize('RQG.DIALOG.Surpris3'),
        });
      }

      if(use.surpris4) {
        toSend.content.push({
          type:'full',
          class:'line',
          value:game.i18n.localize('RQG.DIALOG.Surpris4'),
        });
      }

      if(use.pret) {
        toSend.content.push({
          type:'full',
          class:'line',
          value:game.i18n.localize('RQG.DIALOG.Pret'),
        });
      }

      if(use.preparer) {
        toSend.content.push({
          type:'full',
          class:'line',
          value:game.i18n.localize('RQG.CHAT.Prepare'),
        });
      }

      if(use.magie) {
        toSend.content.push({
          type:'label',
          label:`${game.i18n.localize('RQG.PM.Short')} : `,
          value:use.magie,
        });
      }

      if(use.rasupp) {
        toSend.content.push({
          type:'label',
          label:`${game.i18n.localize('RQG.PM.SuppShort')} : `,
          value:use.rasupp,
        });
      }

      if(use.intensite) {
        toSend.content.push({
          type:'label',
          label:`${game.i18n.localize('RQG.DIALOG.Intensite')} : `,
          value:use.intensite,
        });
      }

      if(use.renforcement) {
        toSend.content.push({
          type:'label',
          label:`${game.i18n.localize('RQG.DIALOG.Renforcement')} : `,
          value:use.renforcement,
        });
      }

      await send.sendData(toSend)
    }

    return String(init);
  }

  async getInitiativeRoll(formula) {
    formula = formula || await this._getInitiativeFormula();
    const rollData = this.actor?.getRollData() || {};
    return foundry.dice.Roll.create(formula, rollData);
  }
}

export class RQGCombat extends Combat {
  async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {

    // Structure input data
    ids = typeof ids === "string" ? [ids] : ids;
    const chatRollMode = game.settings.get("core", "rollMode");

    // Iterate over Combatants, performing an initiative roll for each
    const updates = [];
    const messages = [];
    for ( const [i, id] of ids.entries() ) {

      // Get Combatant data (non-strictly)
      const combatant = this.combatants.get(id);
      if ( !combatant?.isOwner ) continue;

      // Produce an initiative roll for the Combatant
      const roll = await combatant.getInitiativeRoll();
      await roll.evaluate();
      updates.push({_id: id, initiative: roll.total});

      // If the combatant is hidden, use a private roll unless an alternative rollMode was explicitly requested
      const rollMode = "rollMode" in messageOptions ? messageOptions.rollMode
        : (combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode);

      // Construct chat message data
      const messageData = foundry.utils.mergeObject({
        speaker: foundry.documents.ChatMessage.implementation.getSpeaker({
          actor: combatant.actor,
          token: combatant.token,
          alias: combatant.name
        }),
        flavor: game.i18n.format("COMBAT.RollsInitiative", {name: foundry.utils.escapeHTML(combatant.name)}),
        flags: {"core.initiativeRoll": true}
      }, messageOptions);
      const chatData = await roll.toMessage(messageData, {rollMode, create: false});

      // Play 1 sound for the whole rolled set
      if ( i > 0 ) chatData.sound = null;
      messages.push(chatData);
    }
    if ( !updates.length ) return this;

    // Update combatants and combat turn
    const updateOptions = { turnEvents: false };
    if ( !updateTurn ) updateOptions.combatTurn = this.turn;
    await this.updateEmbeddedDocuments("Combatant", updates, updateOptions);

    // Create multiple chat messages
    await foundry.documents.ChatMessage.implementation.create(messages);
    return this;
  }

  _sortCombatants(a, b) {
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -Infinity;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -Infinity;
    return (ia - ib) || (a.id < b.id ? 1 : -1);
  }
}