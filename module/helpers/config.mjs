export const RQG = {};

RQG.TOOLS = {
  'times':{
      active:false,
      button: true,
      toggle: false,
      visible: true,
      icon: "fa-solid fa-r",
      name:'times',
      title: "",
      onChange:(event, active) => {},
  }
};

RQG.SETTINGS = {};

RQG.MENU = {};
RQG.MENU.Personnage = ['historique', 'competences', 'passions', 'combat', 'affinitesruniques', 'cultes', 'magiesspirituelles', 'sorcellerie', 'inventaire', 'proprietes'];
RQG.MENU.Objet = ['description', "parametres"];

RQG.caracteristiques = ['force', 'constitution', 'taille', 'dexterite', 'intelligence', 'pouvoir', 'charisme'];

RQG.historique = ['ne', 'age', 'genre', 'niveaudevie', 'occupation', 'reputation', 'rançon', 'tribu', 'origine', 'clan'];

RQG.COMPETENCES = {};
RQG.COMPETENCES.agilite = ['canotage', 'conduite', 'escalade', 'esquive', 'monte', 'nage', 'saut'];
RQG.COMPETENCES.communication = ['art', 'baratin', 'chant', 'charme', 'comedie', 'danse', 'deguisement', 'eloquence', 'intimidation', 'intrigue', 'langue', 'languenatale', 'marchandage'];
RQG.COMPETENCES.connaissances = ['agriculture', 'alchimie', 'bataille', 'bureaucratie', 'connaissanceanimaux', 'connaissancecieux', 'connaissancemineraux', 'connaissanceplantes', 'connaissanceainees', 'connaissanceculte', 'connaissanceregionnatale', 'connaissanceregion', 'coutumeslocales', 'coutumes', 'elevage', 'evaluation', 'intendance', 'jeu', 'lectureecriture', 'mortpaisible', 'navigation', 'premierssoins', 'recherchebibliotheque', 'traitementmaladies', 'traitementpoison', 'survie'];
RQG.COMPETENCES.magie = ['appretercorps', 'comprehensiontroupeaux', 'combatspirituel', 'connaissanceesprits', 'dansespirituelle', 'detectionassassin', 'detectionchaos', 'meditation', 'veneration', 'voyagespirituel'];
RQG.COMPETENCES.manipulation = ['artisanat', 'dissimulation', 'escamotage', 'invention', 'musique'];
RQG.COMPETENCES.perception = ['empathieespece', 'empathie', 'ecoute', 'observation', 'recherche', 'pistage'];
RQG.COMPETENCES.discretion = ['camouflage', 'deplacementsilencieux'];

RQG.ARMES = {};
RQG.ARMES.armemelee = ['dague', 'epeecourte', 'epeelarge', 'hache1main', 'hache2mains', 'kopis', 'lance1main', 'lance2mains', 'masse1main', 'rapiere', 'sarisse'];
RQG.ARMES.armedistance = ['arccomposite', 'arccourt', 'daguelancer', 'fronde', 'daguelancer', 'hachelancer', 'javelot', 'perchelasso'];
RQG.ARMES.boucliers = ['petitbouclier', 'boucliermoyen', 'grandbouclier'];
RQG.ARMES.armenaturelle = ['couppied', 'couppoing', 'saisie'];

RQG.WPN = {};
RQG.WPN.categories = [
  'hache1main', 'hache2mains', 
  'dague', 'epee1main', 'epee2mains', 
  'couppoing', 'saisie', 'couppied', 
  'marteau1main', 'marteau2mains', 'masse1main', 'masse2mains', 'batonlong',
  'lance1main', 'lance2mains',
  'lasso',
  'arc', 'arbalete',
  'atlatl', 'javelot',
  'hachelancer', 'daguelancer', 'pierre',
  'fronde', 'frondemanche'
]

RQG.localisations = ['jambegauche', 'jambedroite', 'abdomen', 'poitrine', 'brasgauche', 'brasdroit', 'tete'];

RQG.RUNES = {};
RQG.RUNES.elementaire = ['feu', 'air', 'lune', 'tenebres', 'terre', 'eau'];
RQG.RUNES.pouvoir = ['homme', 'fertilite', 'mort', 'harmonie', 'desordre', 'verite', 'illusion', 'stase', 'mouvement', 'bete'];
RQG.RUNES.comboPouvoir = {'homme':'bete', 'fertilite':'mort', 'harmonie':'desordre', 'verite':'illusion', 'stase':'mouvement'};

RQG.SORCELLERIE = {};
RQG.SORCELLERIE.technique = ['commander', 'combiner', 'dissiper', 'separer', 'invoquer', 'drainer'];
RQG.SORCELLERIE.elementaire = ['tenebres', 'eau', 'terre', 'feuciel', 'air', 'lune'];
RQG.SORCELLERIE.pouvoir = ['mouvement', 'stase', 'harmonie', 'desordre', 'verite', 'illusion', 'fertilite', 'mort'];
RQG.SORCELLERIE.forme = ['esprit', 'plante', 'bete', 'homme', 'chaos'];
RQG.day = ['gel', 'eau', 'argile', 'vent', 'feu', 'sauvage', 'dieu'];
RQG.dayMod = {
  'gel':{
    bonus:'tenebres',
    malus:'terre',
  }, 
  'eau':{
    bonus:'eau',
    malus:'feu',
  }, 
  'argile':{
    bonus:'terre',
    malus:'air',
  }, 
  'vent':{
    bonus:'air',
    malus:'eau',
  }, 
  'feu':{
    bonus:'feu',
    malus:'tenebres',
  }, 
  'sauvage':{
    bonus:'',
    malus:'',
  }, 
  'dieu':{
    bonus:'',
    malus:'',
  },
};
RQG.week = ['desordre', 'harmonie', 'mort', 'fertilite', 'stase', 'mouvement', 'illusion', 'verite'];
RQG.weekMod = {
  'desordre':{
    bonus:'desordre',
    malus:'harmonie',
  }, 
  'harmonie':{
    bonus:'harmonie',
    malus:'desordre',
  }, 
  'mort':{
    bonus:'mort',
    malus:'fertilite',
  }, 
  'fertilite':{
    bonus:'fertilite',
    malus:'mort',
  }, 
  'stase':{
    bonus:'stase',
    malus:'mouvement',
  }, 
  'mouvement':{
    bonus:'mouvement',
    malus:'stase',
  }, 
  'illusion':{
    bonus:'illusion',
    malus:'verite',
  }, 
  'verite':{
    bonus:'verite',
    malus:'illusion',
  }
};
RQG.season = ['mer', 'feu', 'terre', 'tenebres', 'tempete', 'sacre'];
RQG.seasonMod = {
  'mer':{
    bonus:'eau',
    malus:'feu',
  }, 
  'feu':{
    bonus:'feu',
    malus:'tenebres',
  }, 
  'terre':{
    bonus:'terre',
    malus:'air',
  }, 
  'tenebres':{
    bonus:'tenebres',
    malus:'terre',
  }, 
  'tempete':{
    bonus:'air',
    malus:'eau',
  }, 
};
RQG.lieuAssociation = {
  aucune:0,
  mineure:10,
  majeure:20,
  superieure:30,
};
RQG.moon = ['lunedescendante', 'lunemourante', 'lunenoire', 'lunenaissante', 'lunecroissante', 'pleinelune', 'demilune']
RQG.moonEq = {
  gel:'lunedescendante', 
  eau:'lunemourante', 
  argile:'lunenoire', 
  vent:'lunenaissante', 
  feu:'lunecroissante', 
  sauvage:'pleinelune', 
  dieu:'demilune'
};

RQG.composants = {
  aucun:0,
  profane:10,
  magique:20,
};

RQG.lune = {
  pleinelune:0.5,
  demilune:1,
  lunedescendante:1,
  lunenaissante:1,
  lunecroissante:1.5,
  lunemourante:2,
  lunenoire:2
};

RQG.DATA = {};
RQG.DATA.competences = {
    canotage: { 
      base: 5, 
    },
    conduite: { 
      base: 5, 
    },
    escalade: { 
      base: 40, 
    },
    esquive: { 
      base: 0,
      byattr:true,
      attr:'dexterite',
      multi:2
    },
    nage: { 
      base: 15, 
    },
    saut: { 
      base: 0, 
      byattr:true,
      attr:'dexterite',
      multi:3
    },
    art: { 
      base: 5, 
    },
    baratin: { 
      base: 5, 
    },
    chant: { 
      base: 10, 
    },
    charme: { 
      base: 15, 
    },
    comedie: { 
      base: 5, 
    },
    danse: { 
      base: 10, 
    },
    deguisement: { 
      base: 5, 
    },
    eloquence: { 
      base: 10, 
    },
    intimidation: { 
      base: 15, 
    },
    intrigue: { 
      base: 5, 
    },
    marchandage: { 
      base: 5, 
    },
    appretercorps: { 
      base: 10, 
    },
    comprehensiontroupeaux: { 
      base: 0, 
    },
    combatespirituel: { 
      base: 20, 
    },
    connaissanceesprits: { 
      base: 0, 
    },
    dansespirituelle: { 
      base: 0, 
    },
    detectionassassin: { 
      base: 0, 
    },
    detectionchaos: { 
      base: 0, 
    },
    meditation: { 
      base: 0, 
    },
    voyagespirituel: { 
      base: 10, 
    },
    empathieespece: { 
      base: 20, 
    },
    ecoute: { 
      base: 25, 
    },
    observation: { 
      base: 25, 
    },
    recherche: { 
      base: 25, 
    },
    pistage: { 
      base: 5, 
    },
    agriculture: { 
      base: 10, 
    },
    alchimie: { 
      base: 0, 
    },
    bataille: { 
      base: 10, 
    },
    bureaucratie: { 
      base: 0, 
    },
    connaissanceanimaux: { 
      base: 5, 
    },
    connaissancecieux: { 
      base: 5, 
    },
    connaissancemineraux: { 
      base: 5, 
    },
    connaissanceplantes: { 
      base: 5, 
    },
    connaissanceainees: { 
      base: 5, 
    },
    connaissanceregionnatale: { 
      base: 30, 
    },
    coutumeslocales: { 
      base: 25, 
    },
    elevage: { 
      base: 5, 
    },
    evaluation: { 
      base: 10, 
    },
    intendance: { 
      base: 10, 
    },
    jeu: { 
      base: 15, 
    },
    mortpaisible: { 
      base: 10, 
    },
    navigation: { 
      base: 0, 
    },
    premierssoins: { 
      base: 10, 
    },
    rechercheenbibliotheque: { 
      base: 0, 
    },
    traitementdesmaladies: { 
      base: 5, 
    },
    traitementdupoison: { 
      base: 5, 
    },
    survie: { 
      base: 15, 
    },
    dissimulation: { 
      base: 5, 
    },
    escamotage: { 
      base: 5, 
    },
    invention: { 
      base: 5, 
    },
    camouflage: { 
      base: 10, 
    },
    deplacementsilencieux: { 
      base: 10, 
    },
    dague: { 
      base: 15, 
    },
    epeecourte: { 
      base: 10, 
    },
    epeelarge: { 
      base: 10, 
    },
    hache1main: { 
      base: 10, 
    },
    hache2mains: { 
      base: 5, 
    },
    kopis: { 
      base: 10, 
    },
    lance1main: { 
      base: 5, 
    },
    lance2mains: { 
      base: 15, 
    },
    masse1main: { 
      base: 15, 
    },
    rapiere: { 
      base: 10, 
    },
    sarisse: { 
      base: 15, 
    },
    arccomposite: { 
      base: 5, 
    },
    arccourt: { 
      base: 5, 
    },
    daguelancer: { 
      base: 5, 
    },
    fronde: { 
      base: 5, 
    },
    hachelancer: { 
      base: 10, 
    },
    javelot: { 
      base: 10, 
    },
    perchelasso: { 
      base: 5, 
    },
    petitbouclier: { 
      base: 15, 
    },
    boucliermoyen: { 
      base: 15, 
    },
    grandbouclier: { 
      base: 15, 
    },
    couppied: { 
      base: 15, 
    },
    couppoing: { 
      base: 25, 
    },
    saisie: { 
      base: 25, 
    },
    langue: { 
      base: 0, 
      repeat:true
    },
    monte: { 
      base: 0,
      repeat:true
    },
    languenatale: { 
      base: 50, 
      repeat:true
    },
    connaissanceculte: { 
      base: 5, 
      repeat:true
    },
    connaissanceregion: { 
      base: 0, 
      repeat:true
    },
    coutumes: { 
      base: 0, 
      repeat:true
    },
    lectureecriture: { 
      base: 0, 
      repeat:true
    },
    veneration: { 
      base: 5, 
      repeat:true
    },
    artisanat: { 
      base: 10, 
      repeat:true
    },
    musique: { 
      base: 5, 
      repeat:true
    },
    empathie: { 
      base: 0, 
      repeat:true
    }
};

RQG.DATA.Allonge = {
  0:"2+",
  1:"1,5 - 1,9",
  2:"1,0 - 1,4",
  3:"0,5 - 0,9",
  4:"0 - 0,4",
};

RQG.DATA.TypeWpn = {
  "ec":"RQG.COMBAT.Ecrasement-short",
  "te":"RQG.COMBAT.Taille-short",
  "cc":"RQG.COMBAT.CC-short",
  "e":"RQG.COMBAT.Empalement-short",
  "l":"RQG.COMBAT.Laceration-short",
}

RQG.DATA.CadenceWpn = {
  "1rm":"RQG.COMBAT.CADENCE.1rm",
  "prm":"RQG.COMBAT.CADENCE.prm",
  "12r":"RQG.COMBAT.CADENCE.12r",
  "13r":"RQG.COMBAT.CADENCE.13r",
  "15r":"RQG.COMBAT.CADENCE.15r",
}

RQG.DATA.localisations = {
    jambedroite:{
        min:1,
        max:4
    },
    jambegauche:{
        min:5,
        max:8
    },
    abdomen:{
        min:9,
        max:11
    },
    poitrine:{
        min:12,
        max:12
    },
    brasdroit:{
        min:13,
        max:15
    },
    brasgauche:{
        min:16,
        max:18
    },
    tete:{
        min:19,
        max:20
    },
}

RQG.DATA.Effects = ['system.pv.mod.effet'];
RQG.DATA.EffectsLoc = {
  'system.pv.mod.effet':'RQG.EFFECTS.ModPV'
};

RQG.INITIATIVE = {};
RQG.INITIATIVE.Type = {
  'arme':'RQG.COMBAT.Arme',
  'spirituel':'TYPES.Item.magiespirituelle',
  'sorcellerie':'TYPES.Item.sorcellerie',
  'runique':'TYPES.Item.magierunique',
}