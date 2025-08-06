
import { 
    capitalizeFirstLetter,
    getValue,
  } from './helpers/common.mjs';
  import sendChat from './documents/chat.mjs';
  import OpenDialog from './documents/dialog.mjs';
  import processRoll from './documents/roll.mjs';

export default class HooksRQG {
    static async init() {
        Hooks.on("renderChatMessageHTML", async (message, html, messageData) => {
            const data = message.getFlag('runequest-glorantha', 'data');
            const user = game.user;
            const query = $(html);
            let actor;

            handleTooltipToggle(query);

            if(!user.isGM && !message?.speakerActor?.isOwner) query.find('a.depense').remove();

            query.find('a.depense').click(async ev => {
                const speaker = message.speaker;
                actor = getActiveActor(speaker);

                if (!actor) return ui.notifications.error(game.i18n.localize("RQG.NOTIFICATIONS.NotActor"), { permanent: false });

                await handleDepenseClick(ev, message, actor);
            });

            if(data) {
                const type = data.special;

                switch(type) {
                    case 'attaque':
                        handleAttack(query, data, user, message);
                        break;
                    case 'parade':
                        handleParade(query, user, message);
                        break;
                    case 'esquive':
                        handleEsquive(query, user, message);
                        break;
                    case 'dmg':   
                        handleDmg(query, user, message);                
                        break;
                    case 'doDmgToTarget':   
                        handleDmgToTarget(query, user, message);
                        break;
                }
            }
        });

        Hooks.on("renderSceneControls", async (control, html, data, details) => {
            const tgt = $(html);
            const btn = tgt.find('menu[data-application-part="tools"] button[data-tool="times"]');

            if(btn) btn.parents('li').hide();
        });
    }
}

/**
 * Récupère l'acteur actif à partir de l'objet `speaker`.
 * Un 'speaker' représente une entité qui émet des messages (comme un joueur ou un PNJ).
 *
 * @param {Object} speaker - L'objet qui représente celui qui parle.
 * @returns {Actor|null} - Retourne l'acteur correspondant ou null si aucun acteur n'est trouvé.
 */
function getActiveActor(speaker) {
    if(!speaker) return null;

    // Vérifie si l'objet 'speaker' a une propriété 'actor' qui existe.
    // Si c'est le cas, on récupère cet acteur directement de la collection des acteurs du jeu.
    if (speaker.actor) return game.actors.get(speaker.actor);

    // Si 'speaker' n'a pas d'actor, vérifie s'il a une propriété 'token' et une propriété 'scene'.
    if (speaker.token && speaker.scene) {
        // Récupère la scène à partir de l'ID de la scène associé au speaker.
        const scene = game.scenes.get(speaker.scene);
        
        // Utilise l'ID du token associé au 'speaker' pour obtenir le token dans la scène.
        // Le '?.' (opérateur de chaînage optionnel) permet d'éviter une erreur si le token n'existe pas,
        // et retourne null à la place.
        return scene.tokens.get(speaker.token)?.actor;
    }

    // Si aucun acteur n'a été trouvé, retourne null.
    return null;
}

/**
 * Gère le basculement de l'affichage des tooltips dans l'interface utilisateur.
 * Lorsqu'un utilisateur clique sur un label total, cela affiche ou masque la section du tooltip associée.
 *
 * @param {jQuery} query - L'objet jQuery qui représente la section de la page où l'on souhaite activer le basculement des tooltips.
 */
function handleTooltipToggle(query) {
    // Sélectionne tous les labels avec la classe 'total' à l'intérieur des divs de classe 'rqgRoll'
    query.find('div.rqgRoll label.total').click(ev => {
        // Récupère l'élément sur lequel l'utilisateur a cliqué
        const tgt = $(ev.currentTarget);
        
        // Trouve la section du tooltip associée, qui est un élément sibling (frère) de l'élément cliqué
        // Basculer (afficher ou masquer) cette section avec un effet de glissement
        tgt.siblings('section.rqg-tooltip').slideToggle();
    });
}

/**
 * Gère les clics sur les éléments liés aux dépenses dans l'interface utilisateur.
 * Lorsqu'un utilisateur clique sur un élément, cela met à jour la valeur de dépense d'un actif
 * et envoie un message de chat en fonction du résultat.
 *
 * @param {Event} ev - L'événement du clic qui déclenche la fonction.
 * @param {Object} message - Le message à envoyer dans le chat après le traitement.
 * @param {Actor} actor - L'acteur dont les items sont modifiés.
 */
async function handleDepenseClick(ev, message, actor) {
    // Récupère l'élément cible sur lequel l'utilisateur a cliqué.
    const tgt = ev.currentTarget;

    // Destructuration des données de l'élément cible provenant de ses attributs 'data-*'.
    const { id, path, value, msg, notenough, not } = tgt.dataset;

    // Récupérer l'item à partir de l'identifiant ou utiliser l'acteur lui-même.
    const item = id ? actor.items.get(id) : actor;

    // Vérifie si l'item a été trouvé.
    if (!item) {
        // Si l'item n'est pas trouvé, affiche un message d'erreur.
        ui.notifications.error(game.i18n.localize("RQG.NOTIFICATIONS.NotFindItem"), { permanent: false });
        return; // Sortie anticipée de la fonction.
    }

    // Récupérer la valeur actuelle de la dépense en utilisant le chemin fourni.
    let currentValue = parseInt(getValue(item, path));
    // Calcule la nouvelle valeur de la dépense après soustraction de la dépense spécifiée.
    let depense = currentValue - parseInt(value);    
    const send = new sendChat(actor);

    // Vérifie si la valeur actuelle est nulle.
    if (currentValue === 0) {
        // Envoie un message de chat si la valeur actuelle est zéro.
               
        await send.sendTxt({
            txt:game.i18n.localize(not),
        });
        return; // Sortie anticipée de la fonction.
    }

    // Vérifie si la nouvelle dépense est inférieure à zéro.
    if (depense < 0) {
        // Envoie un message de chat indiquant qu'il n'y a pas assez de ressources.
        await send.sendTxt({
            txt:game.i18n.localize(notenough),
        });
        return; // Sortie anticipée de la fonction.
    }

    // Met à jour l'item avec la nouvelle dépense calculée.
    await item.update({ [path]: depense });
    // Envoie un message de chat pour confirmer la dépense.
    await send.sendTxt({
        txt:game.i18n.format(msg, { pts: value }),
    });
}

/**
 * Gère les interactions lors d'une attaque, notamment les parades et esquives.
 * La fonction ajuste l'affichage des options disponibles pour les utilisateurs selon leur rôle (GM ou joueur).
 *
 * @param {jQuery} query - L'objet jQuery représentant la section de l'interface utilisateur pour gérer les attaques.
 * @param {Object} data - Les données de l'attaque, y compris les cibles.
 * @param {Object} user - L'utilisateur (joueur ou GM) interagissant avec l'interface.
 * @param {Object} message - Le message à afficher ou à utiliser lors de la préparation d'une parade.
 */
function handleAttack(query, data, user, message) {
    const actor = getActiveActor(message.speaker);
    // Récupère les cibles de l'attaque à partir des données fournies.
    const targets = data.targets;
    const content = message.getFlag('runequest-glorantha', 'content');
    const resultAtk = content.result.class;

    if(resultAtk === 'epicfail' && isOwner(actor)) {
        query.find('div.rqgRoll').append(
            $('<div>', { class: 'simple', style:'margin-top:5px;' }).append(
                $('<a>', { class: 'epicfail center' }) // Crée le lien pour faire le jet d'échec critique.
                   .text(game.i18n.localize('RQG.CHAT.RollEchecCritiqueAtk')), // Texte localisé pour le bouton.
            )
        );

        query.find(`a.epicfail`).click(async ev => {
            const AtkEpicFailResult = await rollEpicFail(actor, message);
        });
    }

    // Vérifie s'il y a des cibles définies.
    if (targets) {
        // Si l'utilisateur n'est pas le Game Master (GM).
        if (!user.isGM) {
            // Gérer l'affichage des parades et esquives.
            // Recherche tous les liens représentant des parades ou esquives.
            query.find(`a.parade, a.esquive`).each((_, el) => {
                // Récupère l'ID depuis les données de l'élément et le divise en segments.
                const id = $(el).data('id').split('/');
                // Vérifie si l'ID n'inclut pas l'utilisateur actuel et n'est pas le 'default'.
                if (!id.includes(user.id) && !id.includes('default')) {
                    // Si la condition est vraie, supprime l'élément de la vue.
                    $(el).remove();
                }
            });

            query.find(`a.dmg`).each((_, el) => {
                // Vérifie si l'ID n'inclut pas l'utilisateur actuel et n'est pas le 'default'.
                if (!isOwner(actor)) {
                    // Si la condition est vraie, supprime l'élément de la vue.
                    $(el).remove();
                }
            });
        }

        // Ajoute un gestionnaire d'événements pour les clics sur les parades.
        query.find(`a.parade`).click(async ev => {
            // Récupère l'élément sur lequel l'utilisateur a cliqué.
            const tgt = ev.currentTarget;
            // Récupère l'identifiant du token à partir des données de l'élément.
            const tokenId = tgt.dataset.value;
            // Récupère le token correspondant à l'identifiant.
            const token = canvas.tokens.get(tokenId);

            // Vérifie si le token est valide et s'il a un acteur associé.
            if (!token || !token?.actor) return;

            // Prépare le dialogue de parade pour l'acteur du token.
            await prepareParadeDialog(token.actor, message);
        });

        // Ajoute un gestionnaire d'événements pour les clics sur les esquives.
        query.find(`a.esquive`).click(async ev => {
            // Récupère l'élément sur lequel l'utilisateur a cliqué.
            const tgt = ev.currentTarget;
            // Récupère l'identifiant du token à partir des données de l'élément.
            const tokenId = tgt.dataset.value;
            // Récupère le token correspondant à l'identifiant.
            const token = canvas.tokens.get(tokenId);

            // Vérifie si le token est valide et s'il a un acteur associé.
            if (!token || !token?.actor) return;

            // Prépare le dialogue de esquive pour l'acteur du token.
            await prepareEsquiveDialog(token.actor, message);
        });

        // Ajoute un gestionnaire d'événements pour les clics sur les dégâts.
        query.find(`a.dmg`).click(async ev => {
            // Récupère l'élément sur lequel l'utilisateur a cliqué.
            const tgt = ev.currentTarget;
            // Récupère l'identifiant du token à partir des données de l'élément.
            const tokenId = tgt.dataset.value;
            // Récupère le token correspondant à l'identifiant.
            const token = canvas.tokens.get(tokenId);
            const data = message.getFlag('runequest-glorantha', 'data');
            const itm = data.itm;
            const rollData = [];
            const atkData = foundry.utils.mergeObject(
                data,
                {
                    content:message.getFlag('runequest-glorantha', 'content'),
                    user:message.speaker,
                    loc:message.getFlag('runequest-glorantha', 'loc')
                }
            );
            const defData = {
                user:{
                    scene:canvas.scene.id,
                    token:tokenId,
                }
            };

            rollData.push({
                key:'data',
                value: {
                    'special':'dmg',
                }
            }, {
                key:'atk',
                value:atkData,
            }, {
                key:'def',
                value:defData,
            },
        );

            const rollDmg = await prepareDmgRoll(actor, itm, game.i18n.localize(`RQG.COMBAT.DegatsAtk`), rollData);
        });
    }
}

/**
 * Prépare et affiche un dialogue pour gérer les parades d'un acteur dans le système de jeu.
 * Ce dialogue permet à l'utilisateur de lancer un jet de parade et de gérer les résultats.
 *
 * @param {Actor} actor - L'acteur pour lequel le dialogue de parade est préparé.
 * @param {Object} message - Le message d'attaque contenant des informations contextuelles.
 */
async function prepareParadeDialog(actor, message) {
    // Prépare les données de contact liées à la parade en utilisant la méthode de l'acteur.
    const { data, width, item, listRunes = [], item2 } = await actor.system.prepareContactData('parade', null);
    
    // Récupère le label localisé pour l'action de parade.
    const label = game.i18n.localize("RQG.COMBAT.Parade");

    // Crée un nouveau dialogue avec les données préparées.
    const dialog = await new OpenDialog(data, {
        title: label, // Définit le titre du dialogue.
        classes: ['rqgDialog', 'rqgDialogRoll'], // Attribue des classes CSS pour le style.
        width, // Définit la largeur du dialogue.
        height: null, // Hauteur du dialogue (null pour obtenir la hauteur par défaut).
        modal: true, // Définit le dialogue comme modal pour bloquer l'interaction avec le reste de l'interface.
    });

    // Définit ce qui se passe lors du lancement d'un jet de dé à l'intérieur du dialogue.
    dialog.renderRoll(
        async (event, button, dialog) => {
            // Gère le traitement du jet de parade lorsque l'utilisateur interagit avec le bouton du dialogue.
            const roll = await actor.system.handleRoll('parade', button, label, item, item2, listRunes, {}, [
                {
                    key: 'atk', // Définir une clé pour les données d'attaque.
                    value: foundry.utils.mergeObject(
                        message.getFlag('runequest-glorantha', 'data'), // Récupérer des données de l'attaque.
                        {
                            content: message.getFlag('runequest-glorantha', 'content'), // Récupérer le contenu du message.
                            loc: message.getFlag('runequest-glorantha', 'loc'), // Localisation du message.
                            user: message.speaker, // Informations sur l'utilisateur émetteur du message.
                        }
                    ),
                },
            ]);
            
            const content = roll.getFlag('runequest-glorantha', 'content');
            const resultDef = content?.result?.class ?? 'none';

            if(resultDef === 'epicfail') {
                const draw = await rollEpicFail(actor, message, true);

                roll.setFlag('runequest-glorantha', 'epicfail', draw.roll.total);
            }
        },
        (event, dialog) => { /* Callback si nécessaire */ }
    );
}

/**
 * Prépare et affiche un dialogue pour gérer les parades d'un acteur dans le système de jeu.
 * Ce dialogue permet à l'utilisateur de lancer un jet de parade et de gérer les résultats.
 *
 * @param {Actor} actor - L'acteur pour lequel le dialogue de parade est préparé.
 * @param {Object} message - Le message d'attaque contenant des informations contextuelles.
 */
async function prepareEsquiveDialog(actor, message) {    
    // Prépare les données de contact liées à la parade en utilisant la méthode de l'acteur.
    const { data, width, } = await actor.system.prepareEsquiveData('parade', null);
    // Récupère le label localisé pour l'action de parade.
    const label = game.i18n.localize("RQG.COMBAT.Esquive");

    // Crée un nouveau dialogue avec les données préparées.
    const dialog = await new OpenDialog(data, {
        title: label, // Définit le titre du dialogue.
        classes: ['rqgDialog', 'rqgDialogRoll'], // Attribue des classes CSS pour le style.
        width, // Définit la largeur du dialogue.
        height: null, // Hauteur du dialogue (null pour obtenir la hauteur par défaut).
        modal: true, // Définit le dialogue comme modal pour bloquer l'interaction avec le reste de l'interface.
    });

    // Définit ce qui se passe lors du lancement d'un jet de dé à l'intérieur du dialogue.
    dialog.renderRoll(
        async (event, button, dialog) => {
            // Gère le traitement du jet de parade lorsque l'utilisateur interagit avec le bouton du dialogue.
            const roll = await actor.system.handleRoll('esquive', button, label, null, null, null, {}, [
                {
                    key: 'atk', // Définir une clé pour les données d'attaque.
                    value: foundry.utils.mergeObject(
                        message.getFlag('runequest-glorantha', 'data'), // Récupérer des données de l'attaque.
                        {
                            content: message.getFlag('runequest-glorantha', 'content'), // Récupérer le contenu du message.
                            loc: message.getFlag('runequest-glorantha', 'loc'), // Localisation du message.
                            user: message.speaker, // Informations sur l'utilisateur émetteur du message.
                        }
                    ),
                },
            ]);
            
            const content = roll.getFlag('runequest-glorantha', 'content');
            const resultDef = content?.result?.class ?? 'none';

            if(resultDef === 'epicfail') {
                const draw = await rollEpicFail(actor, message, true);

                roll.setFlag('runequest-glorantha', 'epicfail', draw.roll.total);
            }
        },
        (event, dialog) => { /* Callback si nécessaire */ }
    );
}

/**
 * Gère les interactions de parade pour un utilisateur lors d'une attaque,
 * en permettant au joueur de lancer un jet de dégâts si les conditions sont remplies.
 *
 * @param {jQuery} query - L'objet jQuery représentant la section de l'interface utilisateur où les options s'affichent.
 * @param {Object} user - L'utilisateur (joueur ou GM) qui déclenche la fonction.
 * @param {Object} message - Le message de l'attaque contenants des informations nécessaires.
 */
function handleParade(query, user, message) {
    const actor = getActiveActor(message.speaker);
    // Récupère le segment d'attaque (atk) à partir des drapeaux du message.
    const atk = message.getFlag('runequest-glorantha', 'atk');
    const def = foundry.utils.mergeObject(
        message.getFlag('runequest-glorantha', 'data'),
        {
        content:message.getFlag('runequest-glorantha', 'content'),
        user:message.speaker,
    });
    const resultAtk = atk?.content?.result?.class ?? 'none';
    const resultDef = def?.content?.result?.class ?? 'none';

    handleBtnDmg(atk, def, query, message);

    if(resultDef === 'epicfail' && resultAtk === 'epicfail' && isOwner(actor)) {
        query.find('div.rqgRoll').append(
            $('<div>', { class: 'simple', style:'margin-top:5px;' }).append(
                $('<a>', { class: 'epicfail center' }) // Crée le lien pour faire le jet d'échec critique.
                   .text(game.i18n.localize('RQG.CHAT.RollEchecCritiqueDef')), // Texte localisé pour le bouton.
            )
        );

        query.find(`a.epicfail`).click(async ev => {
            const DefEpicFailResult = await rollEpicFail(actor, message);
        });
    }
}

/**
 * Gère les interactions de parade pour un utilisateur lors d'une attaque,
 * en permettant au joueur de lancer un jet de dégâts si les conditions sont remplies.
 *
 * @param {jQuery} query - L'objet jQuery représentant la section de l'interface utilisateur où les options s'affichent.
 * @param {Object} user - L'utilisateur (joueur ou GM) qui déclenche la fonction.
 * @param {Object} message - Le message de l'attaque contenants des informations nécessaires.
 */
function handleEsquive(query, user, message) {
    const actor = getActiveActor(message.speaker);
    // Récupère le segment d'attaque (atk) à partir des drapeaux du message.
    const atk = message.getFlag('runequest-glorantha', 'atk');
    const def = foundry.utils.mergeObject(
        message.getFlag('runequest-glorantha', 'data'),
        {
        content:message.getFlag('runequest-glorantha', 'content'),
        user:message.speaker,
    });
    const resultAtk = atk?.content?.result?.class ?? 'none';
    const resultDef = def?.content?.result?.class ?? 'none';

    handleBtnDmg(atk, def, query, message);

    if(resultDef === 'epicfail' && resultAtk === 'epicfail' && isOwner(actor)) {
        query.find('div.rqgRoll').append(
            $('<div>', { class: 'simple', style:'margin-top:5px;' }).append(
                $('<a>', { class: 'epicfail center' }) // Crée le lien pour faire le jet d'échec critique.
                   .text(game.i18n.localize('RQG.CHAT.RollEchecCritiqueDef')), // Texte localisé pour le bouton.
            )
        );

        query.find(`a.epicfail`).click(async ev => {
            const DefEpicFailResult = await rollEpicFail(actor, message);
        });
    }
}


/**
 * Prépare et exécute un jet de dégâts pour un acteur lors d'une attaque.
 * Envoie ensuite le résultat du jet au chat du jeu.
 *
 * @param {Actor} actor - L'acteur qui inflige les dégâts.
 * @param {Object} atk - L'objet d'attaque contenant les informations pertinentes pour le jet de dégâts.
 * @param {Object} message - Le message d'attaque contenant des données contextuelles et des drapeaux.
 */
async function prepareDmgRoll(actor, itm, flavor, addFlags, dmgSpeciaux=null, maximize=false) {
    const tags = [];
    let dmg = itm.system.degats;
    
    if(itm.type === 'armecontact') dmg = `${dmg} + ${actor.system.combats.bonusDmg.total}`;
    if(dmgSpeciaux) {
        dmg += ` + ${dmgSpeciaux.bonus}`;
        tags.push({ 
            label: `${game.i18n.localize('RQG.DIALOG.DegatsSpeciaux')} : ${game.i18n.localize(`RQG.COMBAT.${capitalizeFirstLetter(dmgSpeciaux.type)}`)}`
        })
    }

    // Crée une nouvelle instance de processRoll pour gérer le jet de dégâts.
    const roll = new processRoll();
    
    // Exécute le jet de dégâts en utilisant le système de dégâts de l'élément d'attaque.
    await roll.doDmg(dmg, maximize);
    
    // Crée une nouvelle instance pour l'envoi de messages au chat.
    const send = new sendChat(actor);

    // Prépare le contenu du message à envoyer au chat.
    let content = {
        flavor, // Récupère le texte localisé pour les dégâts.
        tags,
        roll: roll.roll, // Le résultat du jet.
        result: {
            txt: roll.result, // Total des dégâts.
            class: 'center', // Classe CSS pour le style du texte.
        },
        tooltip: roll.tooltip, // Info-bulle pour le jet.
    };

    // Envoie le message contenant le jet et les données associées au chat.
    const msg = await send.sendRoll(content, [
        {
            key: 'dmg',
            value: roll.total, // Total des dégâts pour le message.
        }
    ].concat(addFlags));
}

/**
 * Gère les interactions pour appliquer des dégâts à un acteur lors d'une attaque.
 * Cette fonction vérifie les droits de l'utilisateur et permet d'appliquer les dégâts via l'interface.
 *
 * @param {jQuery} query - L'objet jQuery représentant la section de l'interface utilisateur où les options s'affichent.
 * @param {Object} user - L'utilisateur (joueur ou GM) qui déclenche l'action.
 * @param {Object} message - Le message d'attaque contenant des données pertinentes pour les dégâts.
 */
function handleDmg(query, user, message) {
    // Récupère le segment d'attaque (atk) à partir des drapeaux du message.
    const atk = message.getFlag('runequest-glorantha', 'atk');
    // Récupère le segment de défense (def) à partir des drapeaux du message.
    const def = message.getFlag('runequest-glorantha', 'def');
    // Récupère le segment de dégâts (def) à partir des drapeaux du message.
    const dmg = message.getFlag('runequest-glorantha', 'dmg');
    // Récupère le segment de data à partir des drapeaux du message.
    const data = message.getFlag('runequest-glorantha', 'data');
    const esquive = def.special === 'esquive' ? true : false;

    query.find('div.rqgRoll').append(
        $('<div>', { class: 'simple' }).append(
            $('<a>', { class: 'applyresult center' }) // Crée le lien pour appliquer les dégâts.
               .text(game.i18n.localize('RQG.CHAT.CalculateResult')), // Texte localisé pour le bouton.
        )
    );
    
    // Attache un gestionnaire d'événements au clic sur le bouton d'application du calcul.
    query.find('div.rqgRoll a.applyresult').click(async ev => {
        if(esquive) handleAtkEsquiveResult(atk, def, dmg, data, message);
        else handleAtkParadeResult(atk, def, dmg, data, message);
    });
}

function handleBtnDmg(atk, def, query, message) {
    const epicfail = message.getFlag('runequest-glorantha', 'epicfail');
    const data = message.getFlag('runequest-glorantha', 'data');
    const special = data?.special ?? '';
    const esquive = special === 'esquive' ? true : false;

    // Récupère l'acteur correspondant à l'utilisateur de l'attaque.
    const atkActor = getActiveActor(atk.user);
    // Récupère l'acteur correspondant à l'utilisateur au défenseur.
    const defActor = getActiveActor(def.user);

    // Récupère les résultats d'attaque et de défense pour déterminer l'issue du combat.
    const resultAtk = atk ? atk.content.result.class : "";
    const resultDef = def ? def.content.result.class : "";
    const atkItm = atk ? atk.itm : null; // L'objet de l'attaquant.
    const defItm = def ? def.itm : null; // L'objet du défenseur.
    const dataRoll = [];
    let dgtsSpeciaux = isDgtsSpeciaux(resultAtk, resultDef, esquive);
    let maximizeDmg = isDgtsMaximize(resultAtk, resultDef, epicfail, esquive);
    const showDgtsAtk = isDgtsAtk(resultAtk, resultDef);
    const showDgtsDef = isDgtsDef(resultAtk, resultDef);
    let showEpicFail = false;

    switch(epicfail) {
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 92:
        case 93:
        case 94:
        case 95:
        case 96:
        case 97:
        case 98:
            showEpicFail = true;
            break;
    }

    // Si l'arme de l'attaquant doit jeter les dégâts.
    if((showDgtsAtk && isOwner(atkActor)) || (showEpicFail && isOwner(atkActor))) {
        // Ajoute une option à l'interface pour appliquer les dégâts.
        query.find('div.rqgRoll').append(
            $('<div>', { class: 'simple' }).append(
                $('<a>', { class: 'dmgrollatk center' }) // Crée le lien pour appliquer les dégâts.
                   .text(game.i18n.localize('RQG.CHAT.RollDegatsAtk')), // Texte localisé pour le bouton, <br/> devient retour à la ligne.
            )
        );


        // Attache un gestionnaire d'événements au clic sur le bouton d'application des dégâts.
        query.find('div.rqgRoll a.dmgrollatk').click(async ev => {       
            dataRoll.push({
                key:'data',
                value: {
                    'special':'dmg',
                    'noCalc':showDgtsDef ? true : false,
                }
            },{
                key:'atk',
                value:atk,
            },{
                key:'def',
                value:def
            });

            if(showEpicFail) {
                dataRoll.push({
                    key:'epicfail',
                    value:epicfail,
                });
            }

            if(dgtsSpeciaux) {
                const dmgSpeciaux = await handleDmgSpeciaux(atkActor, atkItm, maximizeDmg);
                
                dataRoll.push({
                    key:'dmgspeciaux',
                    value:dmgSpeciaux
                })

                await prepareDmgRoll(atkActor, atkItm, game.i18n.localize(`RQG.COMBAT.DegatsAtk`), dataRoll, dmgSpeciaux, maximizeDmg);
            } else {
                await prepareDmgRoll(atkActor, atkItm, game.i18n.localize(`RQG.COMBAT.DegatsAtk`), dataRoll, null, maximizeDmg);
            }
        });
    }

    // Si l'arme du défenseur doit jeter les dégâts.
    if(showDgtsDef  && isOwner(defActor) && !esquive) {
        // Ajoute une option à l'interface pour appliquer les dégâts.
        query.find('div.rqgRoll').append(
            $('<div>', { class: 'simple' }).append(
                $('<a>', { class: 'rqgRolldef center' }) // Crée le lien pour appliquer les dégâts.
                   .text(game.i18n.localize(`RQG.CHAT.RollDegatsDef`)), // Texte localisé pour le bouton.
            )
        );

        // Attache un gestionnaire d'événements au clic sur le bouton d'application des dégâts.
        query.find('div.rqgRoll a.rqgRolldef').click(async ev => {            

            dataRoll.push({
                key:'data',
                value: {
                    'special':'dmg',
                }
            },{
                key:'atk',
                value:atk,
            },{
                key:'def',
                value:def
            });

            if(dgtsSpeciaux) {
                const dmgSpeciaux = await handleDmgSpeciaux(defActor, defItm);

                dataRoll.push({
                    key:'dmgspeciaux',
                    value:dmgSpeciaux
                })

                await prepareDmgRoll(defActor, defItm, game.i18n.localize('RQG.COMBAT.DegatsDef'), dataRoll, dmgSpeciaux, maximizeDmg)
            } else {
                await prepareDmgRoll(defActor, defItm, game.i18n.localize('RQG.COMBAT.DegatsDef'), dataRoll, null, maximizeDmg)
            }
        });
    }
}

async function handleAtkParadeResult(atk=null, def=null, dmg=null, data, message) {    
    const epicfail = message.getFlag('runequest-glorantha', 'epicfail');
    // Récupère l'acteur correspondant à l'utilisateur de l'attaque.
    const atkActor = getActiveActor(atk.user);
    // Récupère l'acteur correspondant à l'utilisateur au défenseur.
    const defActor = def ? getActiveActor(def.user) : null;
    // Récupère les dégâts
    let dmgValue = dmg ? parseInt(dmg) : 0;
    const noCalc = data?.noCalc ?? false;

    // Récupère les résultats d'attaque et de défense pour déterminer l'issue du combat.
    let resultAtk = atk ? atk.content.result.class : "";
    const resultDef = def ? def?.content?.result?.class ?? null : "";
    const atkItm = atk ? atk.itm : null; // L'objet de l'attaquant.
    const defItm = def ? def.itm : null; // L'objet du défenseur.

    const dialogDefData = [];

    // Récupère la durabilité de l'objet et les points de vie de l'acteur.
    let dur;
    let actorDmg;
    let itmDmg;
    let durDmg = 0;
    let trueDmg = 0;
    let loc;
    let pv;
    let pvLoc;
    let armure;
    let ignoreArmure = false;

    let actorMsg;
    let atkUpdate = {};
    let defUpdate = {};
    let atkItmUpdate = {};
    let defItmUpdate = {};
    let strChat = "";

    if(epicfail >= 96 && epicfail <= 98) resultAtk = 'critique';

    if(
        // LE DEFENSEUR PREND LES DÉGATS
        ((resultAtk === 'success' || resultAtk === 'special' || resultAtk === 'critique') && (resultDef === 'fail' || resultDef === 'epicfail')) ||
        (resultAtk === 'fail' && resultDef === 'epicfail') ||
        (resultAtk && !resultDef) ||
        (resultAtk === 'epicfail' && resultDef === 'epicfail' && (epicfail >= 87 && epicfail <= 98))
    ) {
        pv = defActor ? parseInt(defActor.system.pv.value) : 0;
        loc = atk ? atk.loc : 'Indefini';
        pvLoc = atk && def ? defActor.system.localisations[loc].pv.value : 0;
        trueDmg = dmgValue;

        if(resultAtk === 'critique') ignoreArmure = true;

        dialogDefData.push(
            {
                type: 'label',
                name: 'baseDmg',
                class: 'baseDmg',
                label: game.i18n.localize('RQG.DIALOG.DgtsInfliges'),
                value:trueDmg,
            },
            {
                type: 'select',
                name: 'loc',
                class: 'loc',
                label: game.i18n.localize('RQG.DIALOG.LocalisationDmg'),
                list: CONFIG.RQG.localisations.reduce((acc, key) => {
                    acc[key] = `RQG.LOCALIZATIONS.${capitalizeFirstLetter(key)}`;
                    return acc;
                }, {}),
                selected: loc,
                localize: true,
            },
            {
                type: 'number',
                name: 'damage',
                class: 'damage',
                label: game.i18n.localize('RQG.DIALOG.ModDgts'),
                value:0,
        });
        
        actorMsg = defActor;
        // Prépare le message à envoyer au chat.
        strChat = "DmgSimple";
    } else if(
        // LE DEFENSEUR SUBIT DES DÉGATS SUR LA DURABILITE (1 seul point)
        (resultAtk === 'critique' && resultDef === 'critique') ||
        (resultAtk === 'critique' && resultDef === 'special') ||
        (resultAtk === 'success' && resultDef === 'success') ||
        (resultAtk === 'special' && resultDef === 'special') ||
        (resultAtk === 'fail' && resultDef === 'success')
    ) {
        dur = defItm ? parseInt(defItm.system.durabilite.value) : 0;
        pv = defActor ? parseInt(defActor.system.pv.value) : 0;
        loc = 'brasdroit';
        pvLoc = atk && def ? defActor.system.localisations[loc].pv.value : 0;

        if(resultAtk === 'critique' && resultDef === 'special') ignoreArmure = true;
        
        // Vérifie si les dégâts dépassent la durabilité de l'objet.
        if(dmgValue > dur && (atkItm.type === 'armedistance' && atkItm.system?.projectile)) {
            actorDmg = defActor;
            itmDmg = defItm;
            durDmg = 1;
            trueDmg = (dmgValue - dur);

            defItmUpdate['system.durabilite.value'] = Math.max(dur - durDmg, 0); // Diminue la durabilité.

            dialogDefData.push(
                {
                    type: 'label',
                    name: 'baseDmg',
                    class: 'baseDmg',
                    label: game.i18n.localize('RQG.DIALOG.DgtsInfliges'),
                    value:trueDmg,
                },
                {
                    type: 'select',
                    name: 'loc',
                    class: 'loc',
                    label: game.i18n.localize('RQG.DIALOG.LocalisationDmg'),
                    list: CONFIG.RQG.localisations.reduce((acc, key) => {
                        acc[key] = `RQG.LOCALIZATIONS.${capitalizeFirstLetter(key)}`;
                        return acc;
                    }, {}),
                    selected: loc,
                    localize: true,
                },
                {
                    type: 'number',
                    name: 'damage',
                    class: 'damage',
                    label: game.i18n.localize('RQG.DIALOG.ModDgts'),
                    value:0,
                });

            actorMsg = defActor;
            // Prépare un message pour informer que la durabilité a été diminuée et les dégâts appliqués.
            strChat = 'DmgOverDurabilite';
        } else {
            actorMsg = defActor;
            strChat = 'DmgUnderDurabilite';
        }
    } else if(
        // LE DEFENSEUR SUBIT DES DÉGATS SUR LA DURABILITE, QUEL QUE SOIT LE RÉSULTAT (multiple)
        (resultAtk === 'critique' && resultDef === 'success')
    ) {
        if((atkItm.type === 'armedistance' && atkItm.system?.projectile)) {
            strChat = 'DmgUnderDurabilite';
            actorMsg = defActor;
        } else {
            dur = defItm ? parseInt(defItm.system.durabilite.value) : 0;
            pv = defActor ? parseInt(defActor.system.pv.value) : 0;
            loc = 'brasdroit';
            pvLoc = atk && def ? defActor.system.localisations[loc].pv.value : 0;
    
            actorDmg = defActor;
            itmDmg = defItm;
            durDmg = dmgValue;
            trueDmg = (dmgValue - dur);
    
            defItmUpdate['system.durabilite.value'] = Math.max(dur - durDmg, 0); // Diminue la durabilité.
    
            dialogDefData.push(
                {
                    type: 'label',
                    name: 'baseDmg',
                    class: 'baseDmg',
                    label: game.i18n.localize('RQG.DIALOG.DgtsInfliges'),
                    value:trueDmg,
                },
                {
                    type: 'select',
                    name: 'loc',
                    class: 'loc',
                    label: game.i18n.localize('RQG.DIALOG.LocalisationDmg'),
                    list: CONFIG.RQG.localisations.reduce((acc, key) => {
                        acc[key] = `RQG.LOCALIZATIONS.${capitalizeFirstLetter(key)}`;
                        return acc;
                    }, {}),
                    selected: loc,
                    localize: true,
                },
                {
                    type: 'number',
                    name: 'damage',
                    class: 'damage',
                    label: game.i18n.localize('RQG.DIALOG.ModDgts'),
                    value:0,
                });
    
            actorMsg = defActor;
            // Prépare un message pour informer que la durabilité a été diminuée et les dégâts appliqués.
            strChat = 'DmgOverDurabilite';
        }
    } else if(
        // LE DEFENSEUR FAIT UNE CONTRE-ATTAQUE || LA DURABILITE EST DIMINUEE DE 1 (si supérieur à durabilité)
        (resultAtk === 'success' && resultDef === 'special') ||
        (resultAtk === 'special' && resultDef === 'critique') ||
        ((resultAtk === 'fail' || resultAtk === 'epicfail') && resultDef === 'success')
    ) {
        dur = atkItm ? parseInt(atkItm.system.durabilite.value) : 0;

        // Vérifie si les dégâts dépassent la durabilité de l'objet.
        if(dmgValue > dur) {
            actorDmg = atkActor;
            itmDmg = atkItm;
            durDmg = 1;
            atkItmUpdate['system.durabilite.value'] = Math.max(dur - durDmg, 0); // Diminue la durabilité.

            actorMsg = atkActor;
            strChat = "CounterOverDurabilite";
        } else {
            actorDmg = atkActor;
            itmDmg = atkItm;
            strChat = "CounterUnderDurabilite";
        }
    } else if(
        // LE DEFENSEUR FAIT UNE CONTRE-ATTAQUE || LA DURABILITE DIMINUE SELON DMG (supérieur à durabilité)
        (resultAtk === 'success' && resultDef === 'critique') ||
        ((resultAtk === 'fail' || resultAtk === 'epicfail') && resultDef === 'special')
    ) {
        dur = atkItm ? parseInt(atkItm.system.durabilite.value) : 0;

        // Vérifie si les dégâts dépassent la durabilité de l'objet.
        if(dmgValue > dur) {
            actorDmg = atkActor;
            itmDmg = atkItm;
            durDmg = (dur - dmgValue);
            atkItmUpdate['system.durabilite.value'] = Math.max(dur - durDmg, 0); // Diminue la durabilité.

            actorMsg = atkActor;
            strChat = "CounterOverDurabilite";
        } else {
            actorDmg = atkActor;
            itmDmg = atkItm;
            strChat = "CounterUnderDurabilite";
        }
    } else if(
        // LE DEFENSEUR FAIT UNE CONTRE-ATTAQUE || LA DURABILITE DIMINUE SELON DMG (quoi qu'il arrive)
        ((resultAtk === 'fail' || resultAtk === 'epicfail') && resultDef === 'critique')
    ) {
        dur = atkItm ? parseInt(atkItm.system.durabilite.value) : 0;

        actorDmg = atkActor;
        itmDmg = atkItm;
        durDmg = dmgValue;
        atkItmUpdate['system.durabilite.value'] = Math.max(dur - durDmg, 0); // Diminue la durabilité.

        actorMsg = atkActor;
        strChat = "CounterOverDurabilite";
    }

    if(!noCalc) {
        if(dialogDefData.length > 0) {
            // Récupère le label localisé pour l'action de parade.
            const label = game.i18n.localize("RQG.DIALOG.LocalisationDmg");
        
            // Crée un nouveau dialogue avec les données préparées.
            const dialog = await new OpenDialog(dialogDefData, {
                title: label, // Définit le titre du dialogue.
                classes: ['rqgDialog', 'rqgDialogAsk'], // Attribue des classes CSS pour le style.
                width:400, // Définit la largeur du dialogue.
                height: null, // Hauteur du dialogue (null pour obtenir la hauteur par défaut).
                modal: true, // Définit le dialogue comme modal pour bloquer l'interaction avec le reste de l'interface.
            });
        
            // Définit ce qui se passe lors du lancement d'un jet de dé à l'intérieur du dialogue.
            const askDialog = await dialog.renderAsk(
                async (event, button, dialog) => {                
                    const askLoc = $(button.form.elements.loc).val();           
                    const pvAskLoc = defActor.system.localisations[askLoc].pv.value;
                    const askDmg = $(button.form.elements.damage).val();
                    armure = defActor.system.localisations[askLoc].armure.total;

                    trueDmg += parseInt(askDmg);
                    dmgValue += parseInt(askDmg);
    
                    if(!ignoreArmure) trueDmg -= armure;
    
                    switch(strChat) {
                        case 'DmgSimple':
                            defUpdate[`system.localisations.${askLoc}.pv.value`] = Math.max(pvAskLoc - trueDmg, 0);
                            break;
    
                        case 'DmgDurabilite':
                            defUpdate[`system.localisations.${askLoc}.pv.value`] = Math.max(pvAskLoc - trueDmg, 0);
                            break;
                    }
    
                    // Met à jour les points de vie en tenant compte de la durabilité.
                    defUpdate[`system.pv.value`] = Math.max(pv - trueDmg, 0);
    
                    loc = askLoc;
                },
                (event, dialog) => { /* Callback si nécessaire */ }
            );
    
            if(askDialog.action === 'cancel') return;
        }
    
        // Envoie le message au chat si une chaîne a été préparée.
        if (strChat) {
            switch(strChat) {
                case 'DmgSimple':
                    strChat = `${game.i18n.format('RQG.CHAT.Dmg', {
                        dmg: dmgValue,
                    })}`;                
                    strChat += `<br/>`;
                    if(!ignoreArmure) strChat += `${game.i18n.format('RQG.CHAT.DmgArm', {
                        dmg: armure,
                    })}`;
                    strChat += `<br/>`;
                    strChat += `${game.i18n.format('RQG.CHAT.DmgLoc', {
                        loc: game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(loc)}`),
                        act: Math.max(pvLoc - trueDmg, 0),
                    })}`;
                    strChat += `<br/>`;
                    strChat += `${game.i18n.format('RQG.CHAT.DmgRest', {
                        act: Math.max(pv - trueDmg, 0),
                    })}`;
                    break;
                    
                case 'DmgOverDurabilite':
                    strChat = `${game.i18n.format('RQG.CHAT.Dmg', {
                        dmg: dmgValue,
                    })}`;                
                    strChat += `<br/>`;
                    strChat += `${game.i18n.format('RQG.CHAT.DmgWithDurDmg', {
                        dmg: dmgValue, 
                        trueDmg: trueDmg, 
                    })}`;
                    strChat += `<br/>`;
                    strChat += `${game.i18n.format('RQG.CHAT.DmgDur', {
                        actor:actorDmg.name,
                        itm:itmDmg.name,
                        dur: durDmg, 
                        act: Math.max(dur - durDmg, 0),
                    })}`;                
                    strChat += `<br/>`;
                    if(!ignoreArmure) strChat += `${game.i18n.format('RQG.CHAT.DmgArm', {
                        dmg: armure,
                    })}`;
                    strChat += `<br/>`;
                    strChat += `${game.i18n.format('RQG.CHAT.DmgLoc', {
                        loc: game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(loc)}`),
                        act: Math.max(pvLoc - trueDmg, 0),
                    })}`;                
                    strChat += `<br/>`;
                    strChat += `${game.i18n.format('RQG.CHAT.DmgRest', {
                        act: Math.max(pv - trueDmg, 0),
                    })}`;
                    break;
    
                case 'DmgUnderDurabilite':
                    strChat = `${game.i18n.localize("RQG.CHAT.DmgNot")}`;
                    break;
    
                case 'CounterOverDurabilite':
                    strChat = `${game.i18n.format('RQG.CHAT.DmgDur', {
                        actor:actorDmg.name,
                        itm:itmDmg.name,
                        dur: durDmg, 
                        act: Math.max(dur - durDmg, 0),
                    })}`;
                    break;
    
                case 'CounterUnderDurabilite':
                    strChat = `${game.i18n.format('RQG.CHAT.DmgDurNot', {
                        actor:actorDmg.name,
                        itm:itmDmg.name,
                    })}`;
                    break;
            }
    
            const sndChat = new sendChat(actorMsg);
            sndChat.sendTxt({ txt: strChat, class: 'left' }); // Envoie le message avec l'alignement à gauche.
        }    
    
        if(!foundry.utils.isEmpty(atkUpdate)) atkActor.update(atkUpdate);
        if(!foundry.utils.isEmpty(defUpdate)) defActor.update(defUpdate);
        if(!foundry.utils.isEmpty(atkItmUpdate)) atkActor.items.get(atkItm._id).update(atkItmUpdate);
        if(!foundry.utils.isEmpty(defItmUpdate)) defActor.items.get(defItm._id).update(defItmUpdate);
    }
}

async function handleAtkEsquiveResult(atk=null, def=null, dmg=null, data, message) {    
    const epicfail = message.getFlag('runequest-glorantha', 'epicfail');
    // Récupère l'acteur correspondant à l'utilisateur de l'attaque.
    const atkActor = getActiveActor(atk.user);
    // Récupère l'acteur correspondant à l'utilisateur au défenseur.
    const defActor = def ? getActiveActor(def.user) : null;
    // Récupère les dégâts
    let dmgValue = dmg ? parseInt(dmg) : 0;
    const noCalc = data?.noCalc ?? false;

    // Récupère les résultats d'attaque et de défense pour déterminer l'issue du combat.
    let resultAtk = atk ? atk.content.result.class : "";
    const resultDef = def ? def?.content?.result?.class ?? null : "";
    const atkItm = atk ? atk.itm : null; // L'objet de l'attaquant.
    const defItm = def ? def.itm : null; // L'objet du défenseur.

    const dialogDefData = [];

    // Récupère la durabilité de l'objet et les points de vie de l'acteur.
    let dur;
    let actorDmg;
    let itmDmg;
    let durDmg = 0;
    let trueDmg = 0;
    let loc;
    let pv;
    let pvLoc;
    let armure;
    let ignoreArmure = false;

    let actorMsg;
    let atkUpdate = {};
    let defUpdate = {};
    let atkItmUpdate = {};
    let defItmUpdate = {};
    let strChat = "";

    if(epicfail >= 96 && epicfail <= 98) resultAtk = 'critique';

    if(
        // LE DEFENSEUR PREND LES DÉGATS
        ((resultAtk === 'success' || resultAtk === 'special' || resultAtk === 'critique') && (resultDef === 'fail' || resultDef === 'epicfail')) ||
        (resultAtk === 'fail' && resultDef === 'epicfail') ||
        (resultAtk === 'special' && resultDef === 'success') ||
        (resultAtk === 'critique' && (resultDef === 'success' || resultDef === 'special')) ||
        (resultAtk === 'fail' && resultDef === 'epicfail') ||
        (resultAtk && !resultDef) ||
        (resultAtk === 'epicfail' && resultDef === 'epicfail' && (epicfail >= 87 && epicfail <= 98))
    ) {
        pv = defActor ? parseInt(defActor.system.pv.value) : 0;
        loc = atk ? atk.loc : 'Indefini';
        pvLoc = atk && def ? defActor.system.localisations[loc].pv.value : 0;
        trueDmg = dmgValue;

        if(resultAtk === 'critique' && (resultDef === 'success' || resultDef === 'fail' || resultDef === 'epicfail')) ignoreArmure = true;

        dialogDefData.push(
            {
                type: 'label',
                name: 'baseDmg',
                class: 'baseDmg',
                label: game.i18n.localize('RQG.DIALOG.DgtsInfliges'),
                value:trueDmg,
            },
            {
                type: 'select',
                name: 'loc',
                class: 'loc',
                label: game.i18n.localize('RQG.DIALOG.LocalisationDmg'),
                list: CONFIG.RQG.localisations.reduce((acc, key) => {
                    acc[key] = `RQG.LOCALIZATIONS.${capitalizeFirstLetter(key)}`;
                    return acc;
                }, {}),
                selected: loc,
                localize: true,
            },
            {
                type: 'number',
                name: 'damage',
                class: 'damage',
                label: game.i18n.localize('RQG.DIALOG.ModDgts'),
                value:0,
        });
        
        actorMsg = defActor;
        // Prépare le message à envoyer au chat.
        strChat = "DmgSimple";
    }

    if(!noCalc) {
        if(dialogDefData.length > 0) {
            // Récupère le label localisé pour l'action de parade.
            const label = game.i18n.localize("RQG.DIALOG.LocalisationDmg");
        
            // Crée un nouveau dialogue avec les données préparées.
            const dialog = await new OpenDialog(dialogDefData, {
                title: label, // Définit le titre du dialogue.
                classes: ['rqgDialog', 'rqgDialogAsk'], // Attribue des classes CSS pour le style.
                width:400, // Définit la largeur du dialogue.
                height: null, // Hauteur du dialogue (null pour obtenir la hauteur par défaut).
                modal: true, // Définit le dialogue comme modal pour bloquer l'interaction avec le reste de l'interface.
            });
        
            // Définit ce qui se passe lors du lancement d'un jet de dé à l'intérieur du dialogue.
            const askDialog = await dialog.renderAsk(
                async (event, button, dialog) => {                
                    const askLoc = $(button.form.elements.loc).val();           
                    const pvAskLoc = defActor.system.localisations[askLoc].pv.value;
                    const askDmg = $(button.form.elements.damage).val();
                    armure = defActor.system.localisations[askLoc].armure.total;

                    trueDmg += parseInt(askDmg);
                    dmgValue += parseInt(askDmg);
    
                    if(!ignoreArmure) trueDmg -= armure;
    
                    switch(strChat) {
                        case 'DmgSimple':
                            defUpdate[`system.localisations.${askLoc}.pv.value`] = Math.max(pvAskLoc - trueDmg, 0);
                            break;
    
                        case 'DmgDurabilite':
                            defUpdate[`system.localisations.${askLoc}.pv.value`] = Math.max(pvAskLoc - trueDmg, 0);
                            break;
                    }
    
                    // Met à jour les points de vie en tenant compte de la durabilité.
                    defUpdate[`system.pv.value`] = Math.max(pv - trueDmg, 0);
    
                    loc = askLoc;
                },
                (event, dialog) => { /* Callback si nécessaire */ }
            );
    
            if(askDialog.action === 'cancel') return;
        }
    
        // Envoie le message au chat si une chaîne a été préparée.
        if (strChat) {
            switch(strChat) {
                case 'DmgSimple':
                    strChat = `${game.i18n.format('RQG.CHAT.Dmg', {
                        dmg: dmgValue,
                    })}`;                
                    strChat += `<br/>`;
                    if(!ignoreArmure) strChat += `${game.i18n.format('RQG.CHAT.DmgArm', {
                        dmg: armure,
                    })}`;
                    strChat += `<br/>`;
                    strChat += `${game.i18n.format('RQG.CHAT.DmgLoc', {
                        loc: game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(loc)}`),
                        act: Math.max(pvLoc - trueDmg, 0),
                    })}`;
                    strChat += `<br/>`;
                    strChat += `${game.i18n.format('RQG.CHAT.DmgRest', {
                        act: Math.max(pv - trueDmg, 0),
                    })}`;
                    break;
            }
    
            const sndChat = new sendChat(actorMsg);
            sndChat.sendTxt({ txt: strChat, class: 'left' }); // Envoie le message avec l'alignement à gauche.
        }    
    
        if(!foundry.utils.isEmpty(atkUpdate)) atkActor.update(atkUpdate);
        if(!foundry.utils.isEmpty(defUpdate)) defActor.update(defUpdate);
        if(!foundry.utils.isEmpty(atkItmUpdate)) atkActor.items.get(atkItm._id).update(atkItmUpdate);
        if(!foundry.utils.isEmpty(defItmUpdate)) defActor.items.get(defItm._id).update(defItmUpdate);
    }
}

async function handleDmgSpeciaux(actor, itm) {
    return new Promise(async (resolve, reject) => {
        // Récupère le label localisé pour l'action de parade.
        const label = game.i18n.localize("RQG.DIALOG.DegatsSpeciaux");
        const data = [];
        let dmgDefaut = '';
        let result = {
            type:'',
            bonus:0,
        }
    
        switch(itm.system.type) {
            case 'ec':
            case 'cc':
                dmgDefaut = 'ecrasement';
                break;
    
            case 'te':
            case 'e':
                dmgDefaut = 'empalement';
                break;
    
            case 'l':
                dmgDefaut = 'laceration';
                break;
        }
    
        data.push(
            {
                type: 'select',
                name: 'dmg',
                class: 'dmg',
                label: game.i18n.localize('RQG.DIALOG.TypeDegatsSpeciaux'),
                list:{
                    "ecrasement":"RQG.COMBAT.Ecrasement",
                    "empalement":"RQG.COMBAT.Empalement",
                    "laceration":"RQG.COMBAT.Laceration",
                },
                selected: dmgDefaut,
                localize: true,
        });
    
        // Crée un nouveau dialogue avec les données préparées.
        const dialog = await new OpenDialog(data, {
            title: label, // Définit le titre du dialogue.
            classes: ['rqgDialog', 'rqgDialogAsk'], // Attribue des classes CSS pour le style.
            width:400, // Définit la largeur du dialogue.
            height: null, // Hauteur du dialogue (null pour obtenir la hauteur par défaut).
            modal: true, // Définit le dialogue comme modal pour bloquer l'interaction avec le reste de l'interface.
        });
    
        // Définit ce qui se passe lors du lancement d'un jet de dé à l'intérieur du dialogue.
        await dialog.renderAsk(
            async (event, button, dialog) => {                
                const askDmg = $(button.form.elements.dmg).val();
    
                result.type = askDmg;

                switch(askDmg) {
                    case 'ecrasement':      
                        const bonusDmg = actor.system.combats.bonusDmg.total;     
    
                        result.bonus = itm.system.degats;
    
                        if(bonusDmg !== "0") {                    
                            // Crée une nouvelle instance de processRoll pour gérer le jet de dégâts.
                            const roll = new processRoll();
                            
                            // Exécute le jet de dégâts en utilisant le système de dégâts de l'élément d'attaque.
                            await roll.doDmg(bonusDmg, true);
    
                            result.bonus += ` + ${roll.total}`;

                            resolve(result);
                        }
                        break;
                    case 'empalement':
                    case 'laceration':
                        result.bonus = itm.system.degats;

                        resolve(result);
                        break;
                }
            },
            (event, dialog) => { /* Callback si nécessaire */ }
        );
    })
}

function isOwner(actor) {
    // Récupère l'ID de l'utilisateur.
    const user = game.user;
    const userId = user.id;
    let result = false;

    // Vérifie si l'utilisateur est le GM ou s'il a la propriété de l'acteur.
    if(!actor && user.isGM) result = true;
    else if(actor) {
        if(
            user.isGM ||
            actor.ownership?.[userId] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER ||
            actor.ownership?.["default"] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        ) result = true;
    }

    return result;
}

function isDgtsAtk(resultAtk, resultDef) {
    let result = false;

    if(
        (resultAtk === 'success' && (resultDef === 'success' || resultDef === 'fail' || resultDef === 'epicfail')) ||
        (resultAtk === 'special' && (resultDef === 'fail' || resultDef === 'epicfail' || resultDef === 'success' || resultDef === 'special')) ||
        (resultAtk === 'fail' && resultDef === 'epicfail') ||
        (resultAtk === 'critique')
    ) result = true;

    return result;
}

function isDgtsDef(resultAtk, resultDef) {
    let result = false;

    if(
        (resultAtk === 'success' && (resultDef === 'critique' || resultDef === 'special')) ||
        (resultAtk === 'special' && resultDef === 'critique') ||
        (resultAtk === 'fail' && (resultDef === 'success' || resultDef === 'special' || resultDef === 'critique')) ||
        (resultAtk === 'epicfail' && (resultDef === 'success' || resultDef === 'special' || resultDef === 'critique'))
    ) result = true;

    return result;
}

function isDgtsMaximize(resultAtk, resultDef, epicfail=0, esquive=false) {
    let result = false;

    if(esquive && (
        (resultAtk === 'critique' && (resultDef === 'fail' || resultDef === 'epicfail'))
    )) result = true;
    else if(
        (resultAtk === 'critique' && (resultDef === 'special' || resultDef === 'success' || resultDef === 'fail' || resultDef === 'epicfail'))
    ) result = true;
    else if(epicfail >= 93 && epicfail <= 95) result = true;

    return result;
}

function isDgtsSpeciaux(resultAtk, resultDef, esquive=false) {
    let result = false;

    if(esquive && 
        ((resultAtk === 'critique' && (resultDef === 'special' || resultDef === 'success' || resultDef === 'fail' || resultDef === 'epicfail')) ||
        (resultAtk === 'special' && (resultDef === 'success' || resultDef === 'fail' || resultDef === 'epicfail')))
    ) result = true;
    else if(
        (resultAtk === 'special' && (resultDef === 'fail' || resultDef === 'epicfail' || resultDef === 'success')) ||
        (resultAtk === 'success' && resultDef === 'critique') ||
        (resultAtk === 'critique' && (resultDef === 'special' || resultDef === 'success' || resultDef === 'fail' || resultDef === 'epicfail')) ||
        (resultAtk === 'fail' && (resultDef === 'special' || resultDef === 'critique')) ||
        (resultAtk === 'epicfail' && (resultDef === 'special' || resultDef === 'critique'))
    ) result = true;

    return result;
}

async function rollEpicFail(actor, message, parade=false) {
    return new Promise(async (resolve, reject) => {
        const table = game.tables.find(key => 'Compendium.runequest-glorantha.tables.RollTable.6h7T3QRO1dwr9o5t');
        const content = message.getFlag('runequest-glorantha', 'content');
        const data = message.getFlag('runequest-glorantha', 'data');
        const loc = message.getFlag('runequest-glorantha', 'loc');
        const roll = await table.draw();
        const total = roll.roll.total;
        const rollData = [];
        let rollDmg;
        let atkData;

        if(!parade) {
            switch(total) {
                case 87:
                case 88:
                case 89:
                case 93:
                case 94:
                case 95:
                    atkData = foundry.utils.mergeObject(
                        data,
                        {
                            content:content,
                            user:message.speaker,
                            loc:loc
                        }
                    )
                    
                    rollData.push({
                        key:'data',
                        value: {
                            'special':'doDmgToTarget',
                        }
                    }, {
                        key:'atk',
                        value:atkData,
                    });
                    
                    rollDmg = await prepareDmgRoll(actor, data.itm, game.i18n.localize(`RQG.COMBAT.DegatsAtk`), rollData);
                    break;
                
                case 90:
                case 91:
                case 96:
                case 97:
                    atkData = foundry.utils.mergeObject(
                        data,
                        {
                            content:content,
                            user:message.speaker,
                            loc:loc
                        }
                    )
                    
                    rollData.push({
                        key:'data',
                        value: {
                            'special':'doDmgToTarget',
                        }
                    }, {
                        key:'atk',
                        value:atkData,
                    });
                    
                    rollDmg = await prepareDmgRoll(actor, data.itm, game.i18n.localize(`RQG.COMBAT.DegatsAtk`), rollData, null, true);
                    break;
    
                case 92:
                case 98:
                    atkData = foundry.utils.mergeObject(
                        data,
                        {
                            content:content,
                            user:message.speaker,
                            loc:loc,
                            noArmor:true,
                        }
                    )
                    
                    rollData.push({
                        key:'data',
                        value: {
                            'special':'doDmgToTarget'
                        }
                    }, {
                        key:'atk',
                        value:atkData,
                    });                
                    const dmgSpeciaux = await handleDmgSpeciaux(actor, atkData.itm);
                    
                    rollDmg = await prepareDmgRoll(actor, data.itm, game.i18n.localize(`RQG.COMBAT.DegatsAtk`), rollData, dmgSpeciaux, true);
                    break;
            }
        }
    
        resolve(roll);
    })
}

function handleDmgToTarget(query, user, message) {    
    const dmg = message.getFlag('runequest-glorantha', 'dmg');
    const atk = message.getFlag('runequest-glorantha', 'atk');
    const data = message.getFlag('runequest-glorantha', 'data');
    const actor = getActiveActor(atk.user);
    const phase = data?.phase ?? 'chooseTgt';

    query.find('div.rqgRoll').append(
        $('<div>', { class: 'simple', style:'margin-top:5px;' }).append(
            $('<a>', { class: 'calculateEpicFail center' }) // Crée le lien pour faire le jet d'échec critique.
               .text(game.i18n.localize('RQG.BUTTONS.SelectTargets')), // Texte localisé pour le bouton.
        )
    );

    if(phase === 'applyToTarget') {        
        if(!user.isGM) {
            query.find(`a.calculateEpicFail`).each((_, el) => {
                // Récupère l'ID depuis les données de l'élément et le divise en segments.
                const id = $(el).data('id').split('/');
                // Vérifie si l'ID n'inclut pas l'utilisateur actuel et n'est pas le 'default'.
                if (!id.includes(user.id) && !id.includes('default')) {
                    // Si la condition est vraie, supprime l'élément de la vue.
                    $(el).remove();
                }
            });
        }
    }
    
    // Attache un gestionnaire d'événements au clic sur le bouton d'application des dégâts.
    query.find('a.calculateEpicFail').click(async ev => {
        switch(phase) {
            case 'chooseTgt':
                await handleDmgToTarget_ChooseTarget(dmg, atk, actor, user);
                break;
            
            case 'applyToTarget':
                await handleDmgToTarget_ApplyToTarget(dmg, atk, ev, message);
                break;
        }
    });
}

async function handleDmgToTarget_ChooseTarget(dmg, atk, actor, user) {
    const dialogData = [];
    
    dialogData.push(
        {
            type: 'label',
            name: 'baseDmg',
            class: 'baseDmg',
            label: game.i18n.localize('RQG.DIALOG.DgtsInfliges'),
            value:dmg,
        },
        {
            type: 'select',
            name: 'loc',
            class: 'loc',
            label: game.i18n.localize('RQG.DIALOG.LocalisationDmg'),
            list: CONFIG.RQG.localisations.reduce((acc, key) => {
                acc[key] = `RQG.LOCALIZATIONS.${capitalizeFirstLetter(key)}`;
                return acc;
            }, {}),
            selected: 'brasdroit',
            localize: true,
        },
        {
            type: 'number',
            name: 'damage',
            class: 'damage',
            label: game.i18n.localize('RQG.DIALOG.ModDgts'),
            value:0,
    });
    // Récupère le label localisé pour l'action de parade.
    const label = game.i18n.localize("RQG.DIALOG.LocalisationDmg");

    // Crée un nouveau dialogue avec les données préparées.
    const dialog = await new OpenDialog(dialogData, {
        title: label, // Définit le titre du dialogue.
        classes: ['rqgDialog', 'rqgDialogAsk'], // Attribue des classes CSS pour le style.
        width:400, // Définit la largeur du dialogue.
        height: null, // Hauteur du dialogue (null pour obtenir la hauteur par défaut).
        modal: true, // Définit le dialogue comme modal pour bloquer l'interaction avec le reste de l'interface.
    });

    // Définit ce qui se passe lors du lancement d'un jet de dé à l'intérieur du dialogue.
    const askDialog = await dialog.renderAsk(
        async (event, button, dialog) => {                
            const tags = [];
            const tgt = game.user.targets;
            const askLoc = $(button.form.elements.loc).val();
            const askMod = $(button.form.elements.damage).val();
            let content = {
                content:[{
                    type:'score',
                    class:'dgts',
                    label:game.i18n.localize('RQG.COMBAT.Degats'),
                    value:dmg + parseInt(askMod),
                },{
                    type:'full',
                    class:'localisation borderTop result',
                    value:game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(askLoc)}`),
                }],
                buttons:{
                    list:[],
                }
            };
        
            if(askMod) {
                tags.push({
                    label: `${game.i18n.localize(`RQG.ModificateurDgts`)} : ${askMod}`,
                    tooltip: `${game.i18n.localize(`RQG.ModificateurDgts`)} : ${askMod}`,
                    data:{
                        'name':'modDgts',
                        'value':askMod,
                    },
                });
            }
            
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

                    content.buttons.list.push({
                        class: 'calculateEpicFail',
                        label: `${game.i18n.localize('RQG.BUTTONS.ApplyDmg')} (${targetName})`,
                        id: ownerIds.join('/'), // On met la liste des IDs propriétaires ici
                        value:target.id,
                    });
                }
            }

            // Crée une nouvelle instance pour l'envoi de messages au chat.
            const send = new sendChat(actor);

            // Envoie le message contenant le jet et les données associées au chat.
            const msg = await send.sendData(content, [
                {
                    key:'content',
                    value:content,
                },
                {
                    key:'atk',
                    value:atk,
                },
                {
                    key: 'dmg',
                    value: dmg + parseInt(askMod), // Total des dégâts pour le message.
                },
                {
                    key:'data',
                    value:{
                        'special':'doDmgToTarget',
                        'loc':askLoc,
                        'phase':'applyToTarget'
                    }
                },
                {
                    key:'user',
                    value:user,

                }
            ]);
        },
        (event, dialog) => { /* Callback si nécessaire */ }
    );
}

async function handleDmgToTarget_ApplyToTarget(dmg, atk, msg, message) {
    const data = message.getFlag('runequest-glorantha', 'data');
    const tgt = msg.currentTarget;
    const { value, id } = tgt.dataset;
    const token = canvas.tokens.get(value);
    const loc = data.loc;
    const actor = token.actor;           
    const pvLoc = actor.system.localisations[loc].pv.value;
    const noArmor = atk?.noArmor ?? false;
    const armure = noArmor ? 0 : actor.system.localisations[loc].armure.total;
    const pv = parseInt(actor.system.pv.value);
    let trueDmg = dmg;
    let update = {};
    let strChat = "";

    
    strChat = `${game.i18n.format('RQG.CHAT.Dmg', {
        dmg: trueDmg,
    })}`;                
    strChat += `<br/>`;
    strChat += `${game.i18n.format('RQG.CHAT.DmgArm', {
        dmg: armure,
    })}`;
    strChat += `<br/>`;
    strChat += `${game.i18n.format('RQG.CHAT.DmgLoc', {
        loc: game.i18n.localize(`RQG.LOCALIZATIONS.${capitalizeFirstLetter(loc)}`),
        act: Math.max(pvLoc - trueDmg, 0),
    })}`;
    strChat += `<br/>`;
    strChat += `${game.i18n.format('RQG.CHAT.DmgRest', {
        act: Math.max(pv - trueDmg, 0),
    })}`;

    trueDmg -= armure;

    update[`system.localisations.${loc}.pv.value`] = Math.max(pvLoc - trueDmg, 0);
    update[`system.pv.value`] = Math.max(pv - trueDmg, 0);

    actor.update(update);

    const sndChat = new sendChat(actor);
    sndChat.sendTxt({ txt: strChat, class: 'left' });
}

