import { ANVILS, COMBAT, EPOCHS, SALE_PRICES, WORKSHOP_PRICES } from './balance.mjs';
export { ANVILS, EPOCHS } from './balance.mjs';
export const SLOTS = ['weapon', 'helmet', 'shoulders', 'chest', 'gloves', 'legs', 'cape', 'boots', 'belt', 'necklace', 'ring1', 'ring2'];
export const WEAPONS = {
  club: { name:'Hunter Club', range:0, multiplier:1, quality:0, epoch:1 },
  spear: { name:'Bone Spear', range:0, multiplier:1, quality:1, epoch:1 },
  slingshot: { sprite:true, name:'Hunter Slingshot', range:.40, multiplier:.8, quality:0, epoch:1 },
  'short-bow': { sprite:true, name:'Short Bow', range:.46, multiplier:.8, quality:0, epoch:2 },
  gladius: { sprite:true, name:'Gladius', range:0, multiplier:1, quality:2, epoch:2 },
  'bronze-axe': { sprite:true, name:'Bronze Axe', range:0, multiplier:1, quality:0, epoch:2 },
  'battle-spear': { sprite:true, name:'Battle Spear', range:0, multiplier:1, quality:1, epoch:2 },
  'knight-sword': { sprite:true, name:'Knight Sword', range:0, multiplier:1, quality:0, epoch:3, attack:'combo' },
  'falchion': { sprite:true, name:'Falchion', range:0, multiplier:1, quality:0, epoch:3, attack:'combo' },
  'bearded-axe': { sprite:true, name:'Bearded Axe', range:0, multiplier:1, quality:0, epoch:3, attack:'swing' },
  'double-axe': { sprite:true, name:'Double Axe', range:0, multiplier:1, quality:0, epoch:3, attack:'swing' },
  'long-spear': { sprite:true, name:'Long Spear', range:0, multiplier:1, quality:0, epoch:3, attack:'thrust' },
  'halberd': { sprite:true, name:'Halberd', range:0, multiplier:1, quality:0, epoch:3, attack:'swing' },
  'spiked-mace': { sprite:true, name:'Spiked Mace', range:0, multiplier:1, quality:0, epoch:3, attack:'swing' },
  'war-hammer': { sprite:true, name:'War Hammer', range:0, multiplier:1, quality:0, epoch:3, attack:'swing' },
  'longbow': { sprite:true, name:'Longbow', range:.46, multiplier:.8, quality:0, epoch:3, attack:'shoot' },
  'crossbow': { sprite:true, name:'Crossbow', range:.46, multiplier:.8, quality:0, epoch:3, attack:'shoot' },
  'jaw-club': { sprite:true, name:'Jawbone Crusher', range:0, multiplier:1, quality:0, epoch:1, attack:'swing' },
  'obsidian-pick': { sprite:true, name:'Obsidian Pick', range:0, multiplier:1, quality:0, epoch:1, attack:'swing' },
  'blowpipe': { sprite:true, name:'Feather Blowpipe', range:.40, multiplier:.8, quality:0, epoch:1, attack:'shoot' },
  'khopesh': { sprite:true, name:'Sun Khopesh', range:0, multiplier:1, quality:0, epoch:2, attack:'swing' },
  'trident': { sprite:true, name:'Tide Trident', range:0, multiplier:1, quality:0, epoch:2, attack:'thrust' },
  'chakram': { sprite:true, name:'Sun Chakram', range:.46, multiplier:.8, quality:0, epoch:2, attack:'shoot' },
  'chain-flail': { sprite:true, name:'Iron Flail', range:0, multiplier:1, quality:0, epoch:3, attack:'swing' },
  'warden-key': { sprite:true, name:'Warden Key', range:0, multiplier:1, quality:0, epoch:3, attack:'swing' },
  'crystal-staff': { sprite:true, name:'Frost Crystal Staff', range:.46, multiplier:.8, quality:0, epoch:3, attack:'shoot' },
  'officer-sabre': { sprite:true, name:'Officer Sabre', range:0, multiplier:1, quality:0, epoch:4, attack:'combo', atlas:'musketeer', thrustTurn:55 },
  'boarding-axe': { sprite:true, name:'Boarding Axe', range:0, multiplier:1, quality:0, epoch:4, attack:'swing', atlas:'musketeer' },
  'powder-maul': { sprite:true, name:'Powder Maul', range:0, multiplier:1, quality:0, epoch:4, attack:'swing', atlas:'musketeer' },
  'banner-pike': { sprite:true, name:'Banner Pike', range:0, multiplier:1, quality:0, epoch:4, attack:'thrust', atlas:'musketeer', thrustTurn:55 },
  'flintlock-pistol': { sprite:true, name:'Flintlock Pistol', range:.46, multiplier:.8, quality:0, epoch:4, attack:'shoot', atlas:'musketeer', pose:'crossbow' },
  'blunderbuss': { sprite:true, name:'Brass Blunderbuss', range:.46, multiplier:.8, quality:0, epoch:4, attack:'shoot', atlas:'musketeer', pose:'crossbow' },
  'deck-cannon': { sprite:true, name:'Handheld Deck Cannon', range:.46, multiplier:.8, quality:0, epoch:4, attack:'shoot', atlas:'musketeer', pose:'crossbow' },
  'trench-knife': { sprite:true, name:'Trench Knife', range:0, multiplier:1, quality:0, epoch:5, attack:'combo', atlas:'field-scout', thrustTurn:55 },
  'breach-hammer': { sprite:true, name:'Breach Hammer', range:0, multiplier:1, quality:0, epoch:5, attack:'swing', atlas:'field-scout' },
  'rescue-axe': { sprite:true, name:'Rescue Axe', range:0, multiplier:1, quality:0, epoch:5, attack:'swing', atlas:'field-scout' },
  'shock-baton': { sprite:true, name:'Shock Baton', range:0, multiplier:1, quality:0, epoch:5, attack:'swing', atlas:'field-scout' },
  'assault-rifle': { sprite:true, name:'Field Rifle', range:.46, multiplier:.8, quality:0, epoch:5, attack:'shoot', atlas:'field-scout', pose:'crossbow' },
  'rotary-gun': { sprite:true, name:'Rotary Gun', range:.46, multiplier:.8, quality:0, epoch:5, attack:'shoot', atlas:'field-scout', pose:'crossbow' },
  'plasma-sabre': { sprite:true, name:'Plasma Sabre', range:0, multiplier:1, quality:0, epoch:6, attack:'combo', atlas:'neon-runner', thrustTurn:55 },
  'magnet-hammer': { sprite:true, name:'Magnet Hammer', range:0, multiplier:1, quality:0, epoch:6, attack:'swing', atlas:'neon-runner' },
  'mono-scythe': { sprite:true, name:'Monoblade Scythe', range:0, multiplier:1, quality:0, epoch:6, attack:'swing', atlas:'neon-runner' },
  'jet-lance': { sprite:true, name:'Jet Lance', range:0, multiplier:1, quality:0, epoch:6, attack:'thrust', atlas:'neon-runner', thrustTurn:55 },
  'pulse-carbine': { sprite:true, name:'Pulse Carbine', range:.46, multiplier:.8, quality:0, epoch:6, attack:'shoot', atlas:'neon-runner', pose:'crossbow' },
  'arc-caster': { sprite:true, name:'Arc Caster', range:.46, multiplier:.8, quality:0, epoch:6, attack:'shoot', atlas:'neon-runner', pose:'crossbow' },
  'meteor-mace': { sprite:true, name:'Meteor Mace', range:0, multiplier:1, quality:0, epoch:7, attack:'swing', atlas:'lunar-scout' },
  'orbit-cleaver': { sprite:true, name:'Orbit Cleaver', range:0, multiplier:1, quality:0, epoch:7, attack:'swing', atlas:'lunar-scout' },
  'gravity-anchor': { sprite:true, name:'Gravity Anchor', range:0, multiplier:1, quality:0, epoch:7, attack:'swing', atlas:'lunar-scout' },
  'xeno-spear': { sprite:true, name:'Xeno Spear', range:0, multiplier:1, quality:0, epoch:7, attack:'thrust', atlas:'lunar-scout', thrustTurn:55 },
  'comet-launcher': { sprite:true, name:'Comet Launcher', range:.46, multiplier:.8, quality:0, epoch:7, attack:'shoot', atlas:'lunar-scout', pose:'crossbow' },
  'void-beamer': { sprite:true, name:'Void Beamer', range:.46, multiplier:.8, quality:0, epoch:7, attack:'shoot', atlas:'lunar-scout', pose:'crossbow' },
  'rift-sickle': { sprite:true, name:'Rift Sickle', range:0, multiplier:1, quality:0, epoch:8, attack:'swing', atlas:'rift-nomad' },
  'prism-axe': { sprite:true, name:'Prism Axe', range:0, multiplier:1, quality:0, epoch:8, attack:'swing', atlas:'rift-nomad' },
  'paradox-hammer': { sprite:true, name:'Paradox Hammer', range:0, multiplier:1, quality:0, epoch:8, attack:'swing', atlas:'rift-nomad' },
  'folded-spear': { sprite:true, name:'Folded Spear', range:0, multiplier:1, quality:0, epoch:8, attack:'thrust', atlas:'rift-nomad', thrustTurn:55 },
  'portal-focus': { sprite:true, name:'Portal Focus', range:.46, multiplier:.8, quality:0, epoch:8, attack:'shoot', atlas:'rift-nomad', pose:'bow' },
  'kaleidoscope-emitter': { sprite:true, name:'Kaleidoscope Emitter', range:.46, multiplier:.8, quality:0, epoch:8, attack:'shoot', atlas:'rift-nomad', pose:'crossbow' },
  'reaper-scythe': { sprite:true, name:'Reaper Scythe', range:0, multiplier:1, quality:0, epoch:9, attack:'swing', atlas:'ash-reaper' },
  'ram-crusher': { sprite:true, name:'Ram Crusher', range:0, multiplier:1, quality:0, epoch:9, attack:'swing', atlas:'ash-reaper' },
  'obsidian-greatblade': { sprite:true, name:'Obsidian Greatblade', range:0, multiplier:1, quality:0, epoch:9, attack:'swing', atlas:'ash-reaper' },
  'infernal-fork': { sprite:true, name:'Infernal Fork', range:0, multiplier:1, quality:0, epoch:9, attack:'thrust', atlas:'ash-reaper', thrustTurn:55 },
  'bone-ballista': { sprite:true, name:'Bone Ballista', range:.46, multiplier:.8, quality:0, epoch:9, attack:'shoot', atlas:'ash-reaper', pose:'crossbow' },
  'cinder-cannon': { sprite:true, name:'Cinder Cannon', range:.46, multiplier:.8, quality:0, epoch:9, attack:'shoot', atlas:'ash-reaper', pose:'crossbow' },
  'dawn-rapier': { sprite:true, name:'Dawn Rapier', range:0, multiplier:1, quality:0, epoch:10, attack:'combo', atlas:'dawn-herald', thrustTurn:55 },
  'seraph-glaive': { sprite:true, name:'Seraph Glaive', range:0, multiplier:1, quality:0, epoch:10, attack:'swing', atlas:'dawn-herald' },
  'sun-maul': { sprite:true, name:'Sun Maul', range:0, multiplier:1, quality:0, epoch:10, attack:'swing', atlas:'dawn-herald' },
  'oath-bell': { sprite:true, name:'Oath Bell', range:0, multiplier:1, quality:0, epoch:10, attack:'swing', atlas:'dawn-herald' },
  'halo-bow': { sprite:true, name:'Halo Bow', range:.46, multiplier:.8, quality:0, epoch:10, attack:'shoot', atlas:'dawn-herald', pose:'bow' },
  'judgment-trumpet': { sprite:true, name:'Judgment Trumpet', range:.46, multiplier:.8, quality:0, epoch:10, attack:'shoot', atlas:'dawn-herald', pose:'crossbow' },
  'tusk-hook': {"sprite":true,"name":"Tusk Hook","range":0,"multiplier":1,"quality":0,"epoch":1,"attack":"swing","atlas":"bone-warrior"},
  'antler-fork': {"sprite":true,"name":"Antler Fork","range":0,"multiplier":1,"quality":0,"epoch":1,"attack":"thrust","atlas":"bone-warrior","thrustTurn":55},
  'shell-mallet': {"sprite":true,"name":"Shell Mallet","range":0,"multiplier":1,"quality":0,"epoch":1,"attack":"swing","atlas":"bone-warrior"},
  'thorn-root': {"sprite":true,"name":"Thornroot Cudgel","range":0,"multiplier":1,"quality":0,"epoch":1,"attack":"swing","atlas":"bone-warrior"},
  'obsidian-sawblade': {"sprite":true,"name":"Obsidian Sawblade","range":0,"multiplier":1,"quality":0,"epoch":2,"attack":"swing","atlas":"bronze-warrior"},
  'crocodile-cleaver': {"sprite":true,"name":"Crocodile Cleaver","range":0,"multiplier":1,"quality":0,"epoch":2,"attack":"swing","atlas":"bronze-warrior"},
  'war-oar': {"sprite":true,"name":"War Oar","range":0,"multiplier":1,"quality":0,"epoch":2,"attack":"swing","atlas":"bronze-warrior"},
  'sun-disk-mace': {"sprite":true,"name":"Sun Disk Mace","range":0,"multiplier":1,"quality":0,"epoch":2,"attack":"swing","atlas":"bronze-warrior"},
  'scorpion-pincer': {"sprite":true,"name":"Scorpion Pincer","range":0,"multiplier":1,"quality":0,"epoch":2,"attack":"combo","atlas":"bronze-warrior","thrustTurn":55},
  'lotus-staff': {"sprite":true,"name":"Lotus Staff","range":0.46,"multiplier":0.8,"quality":0,"epoch":2,"attack":"shoot","atlas":"bronze-warrior","pose":"bow"},
  'sawfish-sabre': {"sprite":true,"name":"Sawfish Sabre","range":0,"multiplier":1,"quality":0,"epoch":4,"attack":"swing","atlas":"musketeer"},
  'capstan-crusher': {"sprite":true,"name":"Capstan Crusher","range":0,"multiplier":1,"quality":0,"epoch":4,"attack":"swing","atlas":"musketeer"},
  'whaling-hook': {"sprite":true,"name":"Whaling Hook","range":0,"multiplier":1,"quality":0,"epoch":4,"attack":"swing","atlas":"musketeer"},
  'sail-shears': {"sprite":true,"name":"Sail Shears","range":0,"multiplier":1,"quality":0,"epoch":4,"attack":"combo","atlas":"musketeer","thrustTurn":55},
  'bottle-breaker': {"sprite":true,"name":"Bottle Breaker","range":0,"multiplier":1,"quality":0,"epoch":4,"attack":"swing","atlas":"musketeer"},
  'boarding-gunblade': {"sprite":true,"name":"Boarding Gunblade","range":0,"multiplier":1,"quality":0,"epoch":4,"attack":"combo","atlas":"musketeer","thrustTurn":55},
  'chain-cleaver': {"sprite":true,"name":"Chain Cleaver","range":0,"multiplier":1,"quality":0,"epoch":5,"attack":"swing","atlas":"field-scout"},
  'rail-breaker': {"sprite":true,"name":"Rail Breaker","range":0,"multiplier":1,"quality":0,"epoch":5,"attack":"swing","atlas":"field-scout"},
  'piston-lance': {"sprite":true,"name":"Piston Lance","range":0,"multiplier":1,"quality":0,"epoch":5,"attack":"thrust","atlas":"field-scout","thrustTurn":55},
  'pressure-ram': {"sprite":true,"name":"Pressure Ram","range":0,"multiplier":1,"quality":0,"epoch":5,"attack":"swing","atlas":"field-scout"},
  'hydraulic-jaws': {"sprite":true,"name":"Hydraulic Jaws","range":0,"multiplier":1,"quality":0,"epoch":5,"attack":"swing","atlas":"field-scout"},
  'ram-knuckles': {"sprite":true,"name":"Ram Knuckles","range":0,"multiplier":1,"quality":0,"epoch":5,"attack":"swing","atlas":"field-scout"},
  'drum-shotgun': {"sprite":true,"name":"Drum Shotgun","range":0.46,"multiplier":0.8,"quality":0,"epoch":5,"attack":"shoot","atlas":"field-scout","pose":"crossbow"},
  'ring-cutter': {"sprite":true,"name":"Ring Cutter","range":0,"multiplier":1,"quality":0,"epoch":6,"attack":"swing","atlas":"neon-runner"},
  'ion-fork': {"sprite":true,"name":"Ion Fork","range":0,"multiplier":1,"quality":0,"epoch":6,"attack":"thrust","atlas":"neon-runner","thrustTurn":55},
  'hinge-blade': {"sprite":true,"name":"Hinge Blade","range":0,"multiplier":1,"quality":0,"epoch":6,"attack":"combo","atlas":"neon-runner","thrustTurn":55},
  'clamp-maul': {"sprite":true,"name":"Clamp Maul","range":0,"multiplier":1,"quality":0,"epoch":6,"attack":"swing","atlas":"neon-runner"},
  'capacitor-lance': {"sprite":true,"name":"Capacitor Lance","range":0,"multiplier":1,"quality":0,"epoch":6,"attack":"thrust","atlas":"neon-runner","thrustTurn":55},
  'rotor-glaive': {"sprite":true,"name":"Rotor Glaive","range":0,"multiplier":1,"quality":0,"epoch":6,"attack":"swing","atlas":"neon-runner"},
  'cassette-launcher': {"sprite":true,"name":"Cassette Launcher","range":0.46,"multiplier":0.8,"quality":0,"epoch":6,"attack":"shoot","atlas":"neon-runner","pose":"crossbow"},
  'crater-pick': {"sprite":true,"name":"Crater Pick","range":0,"multiplier":1,"quality":0,"epoch":7,"attack":"swing","atlas":"lunar-scout"},
  'airlock-cleaver': {"sprite":true,"name":"Airlock Cleaver","range":0,"multiplier":1,"quality":0,"epoch":7,"attack":"swing","atlas":"lunar-scout"},
  'orbital-claw': {"sprite":true,"name":"Orbital Claw","range":0,"multiplier":1,"quality":0,"epoch":7,"attack":"swing","atlas":"lunar-scout"},
  'gravity-dumbbell': {"sprite":true,"name":"Gravity Dumbbell","range":0,"multiplier":1,"quality":0,"epoch":7,"attack":"swing","atlas":"lunar-scout"},
  'thruster-maul': {"sprite":true,"name":"Thruster Maul","range":0,"multiplier":1,"quality":0,"epoch":7,"attack":"swing","atlas":"lunar-scout"},
  'solar-sail-blade': {"sprite":true,"name":"Solar Sail Blade","range":0,"multiplier":1,"quality":0,"epoch":7,"attack":"swing","atlas":"lunar-scout"},
  'eclipse-launcher': {"sprite":true,"name":"Eclipse Launcher","range":0.46,"multiplier":0.8,"quality":0,"epoch":7,"attack":"shoot","atlas":"lunar-scout","pose":"crossbow"},
  'mobius-blade': {"sprite":true,"name":"Mobius Blade","range":0,"multiplier":1,"quality":0,"epoch":8,"attack":"swing","atlas":"rift-nomad"},
  'staircase-cleaver': {"sprite":true,"name":"Staircase Cleaver","range":0,"multiplier":1,"quality":0,"epoch":8,"attack":"swing","atlas":"rift-nomad"},
  'inside-out-mace': {"sprite":true,"name":"Inside-Out Mace","range":0,"multiplier":1,"quality":0,"epoch":8,"attack":"swing","atlas":"rift-nomad"},
  'hourglass-lance': {"sprite":true,"name":"Hourglass Lance","range":0,"multiplier":1,"quality":0,"epoch":8,"attack":"thrust","atlas":"rift-nomad","thrustTurn":55},
  'echo-fork': {"sprite":true,"name":"Echo Fork","range":0,"multiplier":1,"quality":0,"epoch":8,"attack":"swing","atlas":"rift-nomad"},
  'folded-door': {"sprite":true,"name":"Folded Door","range":0,"multiplier":1,"quality":0,"epoch":8,"attack":"swing","atlas":"rift-nomad"},
  'inversion-caster': {"sprite":true,"name":"Inversion Caster","range":0.46,"multiplier":0.8,"quality":0,"epoch":8,"attack":"shoot","atlas":"rift-nomad","pose":"crossbow"},
  'rib-cleaver': {"sprite":true,"name":"Rib Cleaver","range":0,"multiplier":1,"quality":0,"epoch":9,"attack":"swing","atlas":"ash-reaper"},
  'furnace-poker': {"sprite":true,"name":"Furnace Poker","range":0,"multiplier":1,"quality":0,"epoch":9,"attack":"swing","atlas":"ash-reaper"},
  'coffin-maul': {"sprite":true,"name":"Coffin Maul","range":0,"multiplier":1,"quality":0,"epoch":9,"attack":"swing","atlas":"ash-reaper"},
  'grave-spade': {"sprite":true,"name":"Grave Spade","range":0,"multiplier":1,"quality":0,"epoch":9,"attack":"thrust","atlas":"ash-reaper","thrustTurn":55},
  'shackle-hook': {"sprite":true,"name":"Shackle Hook","range":0,"multiplier":1,"quality":0,"epoch":9,"attack":"swing","atlas":"ash-reaper"},
  'brimstone-censer': {"sprite":true,"name":"Brimstone Censer","range":0,"multiplier":1,"quality":0,"epoch":9,"attack":"swing","atlas":"ash-reaper"},
  'jaw-scatterer': {"sprite":true,"name":"Jaw Scatterer","range":0.46,"multiplier":0.8,"quality":0,"epoch":9,"attack":"shoot","atlas":"ash-reaper","pose":"crossbow"},
  'wing-fan': {"sprite":true,"name":"Wing Fan","range":0,"multiplier":1,"quality":0,"epoch":10,"attack":"swing","atlas":"dawn-herald"},
  'crescent-crook': {"sprite":true,"name":"Crescent Crook","range":0,"multiplier":1,"quality":0,"epoch":10,"attack":"swing","atlas":"dawn-herald"},
  'balance-maul': {"sprite":true,"name":"Balance Maul","range":0,"multiplier":1,"quality":0,"epoch":10,"attack":"swing","atlas":"dawn-herald"},
  'cloud-cleaver': {"sprite":true,"name":"Cloud Cleaver","range":0,"multiplier":1,"quality":0,"epoch":10,"attack":"swing","atlas":"dawn-herald"},
  'crown-breaker': {"sprite":true,"name":"Crown Breaker","range":0,"multiplier":1,"quality":0,"epoch":10,"attack":"swing","atlas":"dawn-herald"},
  'oath-tablet': {"sprite":true,"name":"Oath Tablet","range":0,"multiplier":1,"quality":0,"epoch":10,"attack":"swing","atlas":"dawn-herald"},
  'choir-organ': {"sprite":true,"name":"Choir Organ","range":0.46,"multiplier":0.8,"quality":0,"epoch":10,"attack":"shoot","atlas":"dawn-herald","pose":"crossbow"},
  'flint-axe': {"sprite":true,"name":"Flint Axe","range":0,"multiplier":1,"quality":0,"epoch":1,"attack":"swing","atlas":"bone-warrior"},
  'bone-cudgel': {"sprite":true,"name":"Bone Cudgel","range":0,"multiplier":1,"quality":0,"epoch":1,"attack":"swing","atlas":"bone-warrior"},
  'hide-sling': {"sprite":true,"name":"Hide Sling","range":0.4,"multiplier":0.8,"quality":0,"epoch":1,"attack":"shoot","atlas":"bone-warrior","pose":"bow"},
};
export const ARMOR_SETS = [["hunter-hides","bone-warrior"],["bronze-warrior","temple-guard","legionary"],["iron-knight","forest-ranger","royal-guard"],["musketeer","corsair","grenadier"],["field-scout","commando","heavy-trooper"],["neon-runner","exo-trooper","reactor-guard"],["lunar-scout","void-corsair","xeno-warden"],["rift-nomad","prism-keeper","paradox-knight"],["ash-reaper","ember-brute","obsidian-tyrant"],["dawn-herald","storm-seraph","sun-sovereign"]];
// Only epochs with completed equipment participate in prototype forging.
export const AVAILABLE_EPOCHS=ARMOR_SETS.flatMap((sets,i)=>sets.length&&Object.values(WEAPONS).some(w=>w.epoch===i+1)?[i+1]:[]);
export const FORGE_CHANCES=ANVILS.map(row=>{const total=row.chances.reduce((sum,value,i)=>sum+(AVAILABLE_EPOCHS.includes(i+1)?value:0),0);return row.chances.map((value,i)=>!AVAILABLE_EPOCHS.includes(i+1)?0:total?value/total*100:i+1===AVAILABLE_EPOCHS.at(-1)?100:0);});
export const DAMAGE_SLOTS = ['weapon', 'gloves', 'necklace', 'ring1', 'ring2', 'ring'];
export const LABELS = { weapon: 'Weapon', helmet: 'Helmet', chest: 'Chestplate', legs: 'Leg armor', gloves: 'Gloves', cape: 'Cape', shoulders: 'Shoulders', boots: 'Boots', belt: 'Belt', necklace: 'Necklace', ring1: 'Ring 1', ring2: 'Ring 2' };
export const SAVE_KEY = 'forest-forge-prototype-v1';
export const MAX_LEVEL = 200;
export const LEVELS_PER_BIOME = 20;
export const BIOMES = [
  {
    "id": "whispering-woods",
    "name": "Whispering Woods",
    "ground": "#72c851",
    "road": "#e6be7c",
    "shade": "#4ea346",
    "detail": "#42ac50",
    "edge": "#d3aa68",
    "light": "#efd198",
    "shot": "#dbe3df",
    "terrain": "grass",
    "names": {
      "warrior": "Goblin Warrior",
      "archer": "Goblin Archer",
      "healer": "Goblin Shaman",
      "commander": "Goblin Chieftain",
      "boss": "Goblin King"
    }
  },
  {
    "id": "spore-marsh",
    "name": "Spore Marsh",
    "ground": "#58a59a",
    "road": "#b9aa80",
    "shade": "#306d78",
    "detail": "#347d87",
    "edge": "#879c81",
    "light": "#d4c49a",
    "shot": "#e3aeff",
    "terrain": "water",
    "names": {
      "warrior": "Cap Bruiser",
      "archer": "Reedspitter",
      "healer": "Spore Oracle",
      "commander": "Oldcap Warden",
      "boss": "Mire Monarch"
    }
  },
  {
    "id": "bone-canyon",
    "name": "Bone Canyon",
    "ground": "#d78b5d",
    "road": "#f0c790",
    "shade": "#a75747",
    "detail": "#b76a4c",
    "edge": "#cf9867",
    "light": "#f9dda7",
    "shot": "#f9edc8",
    "terrain": "sand",
    "names": {
      "warrior": "Jaw Scavenger",
      "archer": "Bone Skitter",
      "healer": "Carrion Shaman",
      "commander": "Pack Ravager",
      "boss": "Ribmaw"
    }
  },
  {
    "id": "frozen-kingdom",
    "name": "Frozen Kingdom",
    "ground": "#91cad8",
    "road": "#dae9ee",
    "shade": "#598cb7",
    "detail": "#6eb0c9",
    "edge": "#a2c9d8",
    "light": "#f5fbff",
    "shot": "#a8f0ff",
    "terrain": "snow",
    "names": {
      "warrior": "Ice Sentinel",
      "archer": "Frost Hare",
      "healer": "Snow Oracle",
      "commander": "Glacier Captain",
      "boss": "Rime Regent"
    }
  },
  {
    "id": "sunset-city",
    "name": "Sunset City",
    "ground": "#ba827e",
    "road": "#e9b997",
    "shade": "#735b81",
    "detail": "#a06c70",
    "edge": "#c88d77",
    "light": "#f7d1a6",
    "shot": "#ffe7a8",
    "terrain": "paving",
    "names": {
      "warrior": "Fox Duelist",
      "archer": "Crow Musketeer",
      "healer": "Plague Apothecary",
      "commander": "Street Marshal",
      "boss": "Clockwork Magistrate"
    }
  },
  {
    "id": "living-foundry",
    "name": "Living Foundry",
    "ground": "#667b75",
    "road": "#a4afa1",
    "shade": "#354e50",
    "detail": "#465e5a",
    "edge": "#798d86",
    "light": "#c5d1b8",
    "shot": "#c9fa59",
    "terrain": "metal",
    "names": {
      "warrior": "Clamp Enforcer",
      "archer": "Reactor Mite",
      "healer": "Repair Drone",
      "commander": "Iron Foreman",
      "boss": "Furnace Heart"
    }
  },
  {
    "id": "alien-garden",
    "name": "Alien Moon Garden",
    "ground": "#79c5b5",
    "road": "#d0add0",
    "shade": "#487e98",
    "detail": "#50a794",
    "edge": "#a584ba",
    "light": "#e3cce6",
    "shot": "#ed98cc",
    "terrain": "alien",
    "names": {
      "warrior": "Snapleaf",
      "archer": "Seed Cannon Beetle",
      "healer": "Orchid Seer",
      "commander": "Thorn Matriarch",
      "boss": "Moonbloom Devourer"
    }
  },
  {
    "id": "time-rift",
    "name": "Time Rift",
    "ground": "#9c91c4",
    "road": "#d1cbea",
    "shade": "#65588f",
    "detail": "#8072b4",
    "edge": "#afa3d1",
    "light": "#efebff",
    "shot": "#85f4eb",
    "terrain": "rift",
    "names": {
      "warrior": "Rift Knight",
      "archer": "Prism Strider",
      "healer": "Hollow Timekeeper",
      "commander": "Fracture Warden",
      "boss": "Broken Colossus"
    }
  },
  {
    "id": "ashen-underworld",
    "name": "Ashen Underworld",
    "ground": "#705b64",
    "road": "#b08b7d",
    "shade": "#433f50",
    "detail": "#514754",
    "edge": "#856762",
    "light": "#cda491",
    "shot": "#ff9c4f",
    "terrain": "ash",
    "names": {
      "warrior": "Obsidian Imp",
      "archer": "Coal Toad",
      "healer": "Ash Witch",
      "commander": "Horned Overseer",
      "boss": "Cinder Maw"
    }
  },
  {
    "id": "sky-archipelago",
    "name": "Sky Archipelago",
    "ground": "#b5dbea",
    "road": "#f2e6c8",
    "shade": "#7caac9",
    "detail": "#91c5df",
    "edge": "#d4c5a3",
    "light": "#fff8df",
    "shot": "#ffdd72",
    "terrain": "sky",
    "names": {
      "warrior": "Marble Griffin",
      "archer": "Cloud Harpy",
      "healer": "Bell Acolyte",
      "commander": "Suncrest Sentinel",
      "boss": "Eclipse Archon"
    }
  }
];
export const HERO_ATTACK_INTERVAL = 2;
export const APPROACH_SPEED = .36 / 1.4;
export const IDLE_REWARD_INTERVAL = 60000;
export const IDLE_REWARD_CAP = 240;
const NAMES = {
  shoulders: ['Hunter Fur Shoulders', 'Bone Warrior Shoulders', 'Forest Guardian Pauldrons'],
  boots: ['Hunter Leather Boots', 'Bone Warrior Boots', 'Forest Guardian Boots'],
  belt: ['Hunter Belt', 'Bone Warrior Belt', 'Forest Guardian Belt'],
  necklace: ['Hunter Necklace', 'Bone Warrior Necklace', 'Forest Guardian Necklace'],
  ring: ['Hunter Ring', 'Bone Warrior Ring', 'Forest Guardian Ring'],
  gloves: ['Hunter Leather Gloves', 'Bone Warrior Gloves', 'Forest Guardian Gauntlets'],
  cape: ['Hunter Hide Cape', 'Bone Warrior Cape', 'Forest Guardian Cape'],
  legs: ['Hunter Hide Leggings', 'Bone Warrior Leggings', 'Guardian Greaves'],
  weapon: ['Hunter Club', 'Bone Spear', 'Forest Guardian Sword'],
  helmet: ['Hunter Fur Hood', 'Bone Warrior Skull Helm', 'Forest Guardian Helmet'],
  chest: ['Hunter Leather Vest', 'Bone Warrior Rib Armor', 'Forest Guardian Armor'],
};
// Ten fixed waves per row: tutorial, then local levels 1–5, 6–10, 11–15, 16–20.
// W warrior, A archer, H healer, B boss. The last row builds to seven enemies.
export const WAVES = [
  ['W','W','W','W','A','W','W','A','W','B'],
  ['WW','WA','WW','WA','WWW','WW','WWA','WAA','WWW','WWBAH'],
  ['WWW','WWA','WWH','WAA','WWAH','WWA','WWWA','WWWH','WWAA','WWBAH'],
  ['WWWA','WWAA','WWAH','WWWH','WWWAH','WWAA','WWWWA','WWWAA','WWWAH','WWBAH'],
  ['WWWWA','WWWAA','WWWAH','WWAAH','WWWWAH','WWWAA','WWWAAH','WWWWAA','WWWWAAH','WWBAH'],
];
const KINDS = { W: 'warrior', A: 'archer', H: 'healer', B: 'boss' };
export const AFFIXES = [
  { id:'damage', name:'Damage', min:3, max:10, step:1 },
  { id:'health', name:'Health', min:3, max:10, step:1 },
  { id:'speed', name:'Attack speed', min:1, max:5, step:1 },
  { id:'crit', name:'Critical chance', min:1, max:3, step:1 },
  { id:'critDamage', name:'Critical damage', min:5, max:15, step:1 },
  { id:'lifesteal', name:'Lifesteal', min:1, max:3, step:1 },
  { id:'block', name:'Block chance', min:1, max:3, step:1 },
  { id:'regen', name:'Health regen', min:.1, max:.5, step:.1 },
  { id:'double', name:'Double strike', min:1, max:5, step:1 },
];
export const REFORGE_PRICES = [0,400,800,1600,3125,6250,12500,25000,50000,100000];
export function rollAffix(rng = Math.random) {
  const a = AFFIXES[Math.min(AFFIXES.length-1, Math.floor(rng()*AFFIXES.length))];
  const steps = Math.round((a.max-a.min)/a.step);
  return { type:a.id, value:Number((a.min + Math.min(steps,Math.floor(rng()*(steps+1)))*a.step).toFixed(1)) };
}
export function affixBonuses(s) {
  const bonuses = Object.fromEntries(AFFIXES.map(a => [a.id,0]));
  for (const item of Object.values(s.equipment)) if (item?.affix) bonuses[item.affix.type] += item.affix.value;
  return bonuses;
}
export function attackInterval(s) { return HERO_ATTACK_INTERVAL / (1 + affixBonuses(s).speed / 100); }
export function reforgeCost(item) {
  const base = REFORGE_PRICES[(item?.epoch ?? 1)-1] || 0;
  return Math.ceil(base * (10 + Math.min(10,item?.reforges || 0)) / 10);
}
export function reforge(s, slot, rng = Math.random) {
  const item = s.equipment[slot], cost = reforgeCost(item);
  if (!item || !cost || s.coins < cost) return false;
  if (item.reforgeOffer && s.reforgeStop?.includes(item.reforgeOffer.type)) return false;
  item.reforgeOffer = rollAffix(rng); item.reforges = Math.min(10,(item.reforges || 0)+1); s.coins -= cost;
  return true;
}
export function resolveReforge(s, slot, replace) {
  const item = s.equipment[slot];
  if (!item?.reforgeOffer) return false;
  const fraction = s.hp / stats(s).hp;
  if (replace) item.affix = item.reforgeOffer;
  delete item.reforgeOffer;
  s.hp = fraction * stats(s).hp;
  return true;
}

export const ALCHEMY_RARITIES = [
 {name:'Common',color:'#a8b7b1',cost:50,xp:1},
 {name:'Uncommon',color:'#43df70',cost:150,xp:3},
 {name:'Rare',color:'#46cef0',cost:500,xp:10},
 {name:'Epic',color:'#b679fa',cost:1500,xp:30},
 {name:'Legendary',color:'#ffcd45',cost:5000,xp:100},
];
export const POTIONS = [
 {id:'damage',name:'Might',label:'Damage',base:[5,8,12,18,25],combat:true},
 {id:'health',name:'Vitality',label:'Max HP',base:[10,15,20,30,50],combat:true},
 {id:'ore',name:'Prospector',label:'Ore production',base:[10,20,30,40,50]},
 {id:'coins',name:'Fortune',label:'Passive coins',base:[15,25,40,60,75]},
 {id:'hammers',name:'Industry',label:'Passive hammers',base:[10,15,25,35,50]},
];
export function alchemySkill(s) {
 let level=1,xp=s.alchemy?.xp||0;
 while(level<100 && xp>=10+5*(level-1)){xp-=10+5*(level-1);level++;}
 return {level,xp,needed:level===100?0:10+5*(level-1)};
}
export function potionEffect(s,type,rarity) {
 const potion=POTIONS.find(p=>p.id===type);if(!potion||!Number.isInteger(rarity)||rarity<0||rarity>4)return null;
 const t=(alchemySkill(s).level-1)/99;
 return {value:Math.round(potion.base[rarity]*(1+t)*100)/100,seconds:Math.round((potion.combat?600:1800)*(1+5*t))};
}
export function reagentChances(highest,boss=false) {
 const b=Math.max(0,Math.min(9,Math.floor((highest-1)/20))),m=boss?5:1;
 return [4,1+.15*b,.2+.05*b,.02+.01*b,.002+.001*b].map(p=>p*m/500);
}
export function rollReagent(highest,boss=false,rng=Math.random) {
 let roll=rng();const chances=reagentChances(highest,boss);
 // Rarest first keeps the rare outcomes at the low end of the roll.
 for(let i=4;i>=0;i--){if(roll<chances[i])return i;roll-=chances[i];}return -1;
}
export function brewPotion(s,type,rarity) {
 const a=s.alchemy,r=ALCHEMY_RARITIES[rarity],p=POTIONS.findIndex(p=>p.id===type);
 if(!a||!r||p<0||a.reagents[rarity]<1||s.coins<r.cost)return false;
 a.reagents[rarity]--;s.coins-=r.cost;a.potions[p*5+rarity]++;a.xp=Math.min(25245,a.xp+r.xp);return true;
}
export function drinkPotion(s,type,rarity,now=Date.now()) {
 const a=s.alchemy,p=POTIONS.findIndex(p=>p.id===type),effect=potionEffect(s,type,rarity);
 if(!a||p<0||!effect||a.potions[p*5+rarity]<1||s.dungeons?.run)return false;
 const active=a.active[type];if(active&&(POTIONS[p].combat?active.remaining>0:active.endsAt>now))return false;
 if(!POTIONS[p].combat){settleIdle(s,now);settleMine(s,now);if(active)(a.previous??={})[type]={...active};}
 const fraction=s.hp/stats(s).hp;
 a.potions[p*5+rarity]--;a.active[type]={rarity,value:effect.value,...(POTIONS[p].combat?{remaining:effect.seconds}:{startsAt:now,endsAt:now+effect.seconds*1000})};
 s.hp=fraction*stats(s).hp;return true;
}
function passivePotionBonus(s,type,from,to) {
 if(to<=from)return 0;
 return [s.alchemy?.previous?.[type],s.alchemy?.active[type]].reduce((sum,b)=>sum+(b?b.value/100*Math.max(0,Math.min(to,b.endsAt)-Math.max(from,b.startsAt))/(to-from):0),0);
}
export function idleReagents(s,now=Date.now()) {
 const a=s.alchemy;if(!a)return [0,0,0,0,0];
 const added=idleRewards(s,now)-(s.idleStore?.minutes||0),loot=[...a.pending];
 for(let n=1;n<=added;n++)if((a.idleMinutes+n)%5===0){
  let hash=(a.seed^Math.floor((a.idleMinutes+n)/5))>>>0;hash=Math.imul(hash^(hash>>>16),0x45d9f3b);hash=Math.imul(hash^(hash>>>16),0x45d9f3b);hash=(hash^(hash>>>16))>>>0;
  const r=rollReagent(s.highest,true,()=>hash/4294967296);if(r>=0)loot[r]++;
 }return loot;
}

export function stats(s) {
  const total = { hp: 20, damage: 2 };
  for (const slot of SLOTS) total[DAMAGE_SLOTS.includes(slot) ? 'damage' : 'hp'] += Math.round((s.equipment[slot]?.value ?? 0) * (1 + (s.workshop?.slots?.[slot] || 0) / 100));
  const bonuses = affixBonuses(s);
  total.hp = Math.round(total.hp * (1 + bonuses.health / 100));
  total.damage = Math.round(total.damage * (1 + bonuses.damage / 100));
  if(s.mount?.owned && s.mount.equipped){total.hp=Math.round(total.hp*1.2);total.damage=Math.round(total.damage*1.2);}
  for(const [type,key] of [['damage','damage'],['health','hp']]){const b=s.alchemy?.active[type];if(b?.remaining>0)total[key]=Math.round(total[key]*(1+b.value/100));}
  return total;
}
export function heroPower(s) {
  const hero = stats(s), bonuses = affixBonuses(s);
  // Critical damage contributes only when equipment grants critical chance.
  const critical = 1 + Math.min(50, bonuses.crit) / 100 * (.5 + bonuses.critDamage / 100);
  const attack = hero.damage * (1 + bonuses.speed / 100) * (1 + .75 * bonuses.double / 100) * critical;
  // Fixed ten-second recovery window; independent of the current enemy and missing HP.
  const recovery = hero.hp * 10 * bonuses.regen / 100 + attack * 5 * bonuses.lifesteal / 100;
  const defense = (hero.hp + recovery) / 10 * (1 + bonuses.block / 100);
  return Math.round(attack + defense);
}
export function enemyFor(level, kind = 'warrior') {
  const row = COMBAT[level - 1];
  const biome = BIOMES[Math.floor((level - 1) / LEVELS_PER_BIOME)];
  return { kind, boss: kind === 'boss',
    name: biome.names[kind === 'boss' && level % LEVELS_PER_BIOME ? 'commander' : kind],
    maxHp: row[kind + '_hp'], damage: kind === 'healer' ? 0 : row[kind + '_damage'],
    healing: row.healing_per_tick, reward: kind === 'boss' ? row.boss_coins : Math.floor(row.monster_coins / 2) };
}
export const COMPANIONS = [
  {id:'archer',name:'Archer',role:'Ranged damage',description:'Fights from behind the hero'},
  {id:'druid',name:'Druid',role:'Regeneration',description:'+2 HP every 2 sec'},
  {id:'turtle',name:'Turtle',role:'Defender',description:'Protects the hero until its shell breaks'},
];
export const DRUID_LEVELS = Array.from({length:100},(_,i)=>({
  healing:i===0?2:Math.round(5*1.24**(i-1)),
  upgradeCost:i===99?0:Math.ceil(1000*1.22**i/10)*10
}));
export const ARCHER_LEVELS = DRUID_LEVELS.map((level,i)=>({
  damage:i===0?3:Math.round(7*1.24**(i-1)),upgradeCost:level.upgradeCost
}));
export const TURTLE_LEVELS = DRUID_LEVELS.map((level,i)=>({
  hp:i===0?30:Math.round(50*1.24**(i-1)),upgradeCost:level.upgradeCost
}));
export function upgradeTurtle(s) {
  const cost=TURTLE_LEVELS[s.turtleLevel-1]?.upgradeCost;
  if(!s.hiredCompanions.includes('turtle')||!cost||s.coins<cost)return false;
  s.coins-=cost;s.turtleLevel++;
  if(s.companion?.kind==='turtle')s.companion.maxHp=TURTLE_LEVELS[s.turtleLevel-1].hp;
  return true;
}
export function upgradeArcher(s) {
  const cost=ARCHER_LEVELS[s.archerLevel-1]?.upgradeCost;
  if(!s.hiredCompanions.includes('archer')||!cost||s.coins<cost)return false;
  s.coins-=cost;s.archerLevel++;return true;
}
export function upgradeDruid(s) {
  const cost=DRUID_LEVELS[s.druidLevel-1]?.upgradeCost;
  if(!s.hiredCompanions.includes('druid')||!cost||s.coins<cost)return false;
  s.coins-=cost;s.druidLevel++;return true;
}
export function hireCompanion(s,id) {
  if(!COMPANIONS.some(c=>c.id===id)||s.hiredCompanions.includes(id))return false;
  const cost=500;
  if(s.coins<cost)return false;
  s.coins-=cost;s.hiredCompanions.push(id);
  s.selectedCompanion=id;
  s.companion={kind:id,x:s.heroX-.13,clock:0,actionAge:1,moving:true,shot:null,
    ...(id==='turtle'?{hp:TURTLE_LEVELS[s.turtleLevel-1].hp,maxHp:TURTLE_LEVELS[s.turtleLevel-1].hp}:{})};
  return true;
}
export function selectCompanion(s,id) {
  if(!s.hiredCompanions.includes(id))return false;
  s.selectedCompanion=id;return true;
}
function prepareEncounter(s) {
  if(s.selectedCompanion && s.selectedCompanion!==s.companion?.kind){
    s.companion={kind:s.selectedCompanion,x:s.heroX-.13,clock:0,actionAge:1,moving:true,shot:null,
      ...(s.selectedCompanion==='turtle'?{hp:TURTLE_LEVELS[s.turtleLevel-1].hp,maxHp:TURTLE_LEVELS[s.turtleLevel-1].hp}:{})};
  }
  let x = s.heroX + .91;
  const local = (s.level - 1) % LEVELS_PER_BIOME;
  const row = s.level === 1 ? 0 : 1 + Math.floor(local / 5);
  // Only rotate the opening/middle trios; the final three waves keep their build-up.
  const column = s.level === 1 || s.encounter >= 6 ? s.encounter :
    Math.floor(s.encounter / 3) * 3 + (s.encounter + local + Math.floor((s.level - 1) / LEVELS_PER_BIOME)) % 3;
  const formation = WAVES[row][column];
  const kinds = [...formation].map(k => KINDS[k]);
  kinds.sort((a,b) => ['warrior','boss','archer','healer'].indexOf(a) - ['warrior','boss','archer','healer'].indexOf(b));
  s.enemies = kinds.map((kind, id) => {
    const e = enemyFor(s.level, kind);
    const member = { ...e, id, hp: e.maxHp, x, clock: 0, healClock: 0, engaged: false, moving: true, actionAge: 1, deadTime: 0 };
    x += kind === 'boss' || kinds[id + 1] === 'boss' ? .19 : .11;
    return member;
  });
  if (s.companion) Object.assign(s.companion, {x:s.companion.kind==='turtle'&&s.phase!=='dead'?s.companion.x:s.heroX-.13,clock:0,actionAge:1,moving:true,shot:null});
  if(s.companion?.kind==='turtle')s.companion.hp=s.companion.maxHp;
  s.targetId = null; s.heroClock = 0; s.heroActionAge = 1; s.doubleStrikeDelay = 0;
  s.phase = 'walk'; s.phaseTime = 0;
}
export const DUNGEONS = [
  {id:'treasury',name:'Sunken Treasury',boss:'Gulp the Hoarder',resource:'Coins',color:'#d8ac4e',ground:'#334c3f',road:'#bbaa76',mechanic:'Coin shield',description:'Raises a coin shield every 12 seconds. Damage is reduced while it shines.'},
  {id:'forge',name:'Cursed Forge',boss:'Furnace Fist',resource:'Hammers',color:'#eb9358',ground:'#463d4c',road:'#9c7968',mechanic:'Charged smash',description:'Stops to charge a heavy strike. The turtle can intercept it.'},
  {id:'mine',name:'Crystal Depths',boss:'Shardclaw',resource:'Ore',color:'#67d2d3',ground:'#354655',road:'#8794a0',mechanic:'Growing fury',description:'Grows stronger every 20 seconds. Bring enough damage to finish the fight.'},
];
export function dungeonDay(s,now=Date.now()) {
  const day=Math.floor(now/86400000);
  // Never roll the allowance backwards if the device clock moves back.
  if(day>s.dungeons.day){s.dungeons.day=day;s.dungeons.wins=[0,0,0];}
  return s.dungeons.wins;
}
export function dungeonBoss(id,floor) {
  const entry=DUNGEONS.find(d=>d.id===id);
  if(!entry||!Number.isInteger(floor)||floor<1||floor>200)return null;
  const power=floor<=10?[.8,2.1,4.5,9,18,32,55,85,135,220][floor-1]:220*1e8**((floor-10)/190);
  const damage=floor<=10?[3,4,6,8,12,18,26,36,50,62][floor-1]:Math.round(.28*power);
  return {kind:'boss',boss:true,name:entry.boss,maxHp:Math.round(120*power),damage,healing:0,reward:0};
}
export function dungeonRewards(s,id,floor) {
  const index=DUNGEONS.findIndex(d=>d.id===id);
  if(index<0||!dungeonBoss(id,floor))return null;
  const coins=index===0?COMBAT[floor-1].boss_coins*6:0;
  const hammers=index===1?(6+2*COMBAT[floor-1].batch_size)*3:0;
  const mine=mineLevel(s.mine.level),total=index===2?Math.max(1,Math.round(mine.rate*(8+floor*.2)))*3:0;
  const ore=Array(Math.max(s.mine.ore.length,mine.newest+1)).fill(0),top=mine.newest;
  if(top===0)ore[0]=total;
  else {ore[top]=Math.ceil(total*.6);ore[top-1]=total-ore[top];}
  return {coins,hammers,ore};
}
export function enterDungeon(s,id,floor,now=Date.now()) {
  const index=DUNGEONS.findIndex(d=>d.id===id),boss=dungeonBoss(id,floor);
  if(s.highest<2||s.dungeons.run||!boss||floor>s.dungeons.cleared[index]+1||dungeonDay(s,now)[index]>=2)return false;
  const kind=s.selectedCompanion;
  const battle={alchemy:s.alchemy,equipment:structuredClone(s.equipment),workshop:structuredClone(s.workshop),mount:{...s.mount},
    level:s.level,highest:s.highest,encounter:9,completed:false,phase:'walk',phaseTime:0,heroX:.24,heroClock:0,heroActionAge:1,heroAttackCount:0,doubleStrikeDelay:0,targetId:null,
    archerLevel:s.archerLevel,druidLevel:s.druidLevel,turtleLevel:s.turtleLevel,companion:kind?{kind,x:.11,clock:0,actionAge:1,healAge:1,moving:true,shot:null,...(kind==='turtle'?{hp:TURTLE_LEVELS[s.turtleLevel-1].hp,maxHp:TURTLE_LEVELS[s.turtleLevel-1].hp}:{})}:null,
    forging:0,autoForge:false,battleStats:{maxHit:0,maxCrit:0},
    enemies:[{...boss,baseDamage:boss.damage,id:0,hp:boss.maxHp,x:1.02,clock:0,healClock:0,actionAge:1,deadTime:0,engaged:false,moving:true}],dungeonBattle:{id,floor,time:0}};
  battle.hp=stats(battle).hp;
  s.dungeons.last=null;s.dungeons.run={id,floor,rewards:dungeonRewards(s,id,floor),battle};
  return true;
}
export function leaveDungeon(s) {
  if(!s.dungeons.run)return false;
  s.dungeons.last={outcome:'left',id:s.dungeons.run.id,floor:s.dungeons.run.floor};s.dungeons.run=null;return true;
}
export function sweepDungeon(s,id,now=Date.now(),rng=Math.random) {
  const index=DUNGEONS.findIndex(d=>d.id===id),floor=s.dungeons.cleared[index];
  if(s.highest<2||s.dungeons.run||!dungeonBoss(id,floor)||dungeonDay(s,now)[index]>=2)return false;
  const rewards=dungeonRewards(s,id,floor);
  s.coins+=rewards.coins;s.hammers+=rewards.hammers;
  rewards.ore.forEach((n,i)=>{s.mine.ore[i]=(s.mine.ore[i]||0)+n;s.mine.pending[i]??=0;});
  s.dungeons.wins[index]++;
  const reagent=rollReagent(s.highest,true,rng);if(reagent>=0&&s.alchemy)s.alchemy.reagents[reagent]++;
  s.dungeons.last={outcome:'won',id,floor,rewards};return true;
}
export function claimMount(s) {
  if(s.dungeons.run||s.mount.owned||!s.dungeons.cleared.every(n=>n>=10))return false;
  const fraction=s.hp/stats(s).hp;
  s.mount={owned:true,equipped:true};s.hp=fraction*stats(s).hp;return true;
}
export function toggleMount(s) {
  if(!s.mount.owned||s.dungeons.run)return false;
  const fraction=s.hp/stats(s).hp;s.mount.equipped=!s.mount.equipped;s.hp=fraction*stats(s).hp;return true;
}

export function freshGame(now = Date.now()) {
  const s = { version: 3, affixVersion: 1, hiredCompanions:[], selectedCompanion:null, companion:null, coins: 0, runes: 0, level: 1, highest: 1, encounter: 0, hp: 20, heroX: .24, heroAttackCount: 0,
    equipment: Object.fromEntries(SLOTS.map(slot => [slot, null])), pending: null, results: [], forgingItems: [], forging: 0, hammers: 15,
    workshop: {slots:Object.fromEntries(SLOTS.map(slot=>[slot,0])),coins:0,hammers:0,storage:0}, idleStore:{minutes:0,coins:0,hammers:0}, archerLevel: 1, druidLevel: 1, turtleLevel: 1, autoForge: false, autoForgeCoins: 0, autoSellEpochs: [], autoWeaponFilter: 'any', reforgeStop: [], forgingAuto: false, selectedBatch: 1, anvilLevel: 1, upgradeEndsAt: 0, idleSince: now,
    mastery: EPOCHS.map(() => ({ level: 1, xp: 0 })), lastEpoch: 1, kills: 0, deaths: 0, battleStats: {bosses:0,maxHit:0,maxCrit:0,coins:0,hammers:0,runes:0}, completed: false };
  s.alchemy={xp:0,reagents:[0,0,0,0,0],potions:Array(25).fill(0),active:{},previous:{},pending:[0,0,0,0,0],idleMinutes:0,seed:Math.abs(Math.floor(now))%2147483647,oreRemainder:0};
  s.mine = {version:2,stratum:null,level:1,ore:[0,0,0],pending:[0,0,0],bufferMinutes:0,remainder:0,lastAt:now,upgradeEndsAt:0};
  s.dungeons={day:Math.floor(now/86400000),wins:[0,0,0],cleared:[0,0,0],run:null,last:null};s.mount={owned:false,equipped:false};
  prepareEncounter(s); return s;
}
export const MINE_RESOURCES = [
  ['stone','Stone',2],['coal','Coal',3],['copper','Copper ore',5],['iron','Iron ore',8],
  ['silver','Silver ore',12],['gold','Gold ore',18],['amber','Amber',26],['amethyst','Amethyst',36],
  ['emerald','Emerald',48],['ruby','Ruby',65],['sapphire','Sapphire',85],['diamond','Diamond',110],
  ['obsidian','Obsidian',140],['mithril','Mithril',150],['adamantite','Adamantite',160],
  ['moonstone','Moonstone',170],['void-crystal','Void crystal',180],['earth-heart','Earth heart',190],
  ['sun-crystal','Sun crystal',200],['star-ore','Star ore',210],
].map(([id,name,price])=>({id,name,price}));
export function mineResource(index) {
  return MINE_RESOURCES[index] || {id:'crystal',name:`Deep ore ${index+1}`,price:210+10*(index-19)};
}
export function mineLevel(level) {
  const newest=level===1?0:Math.max(1,Math.floor((level-1)/5)+1), chances=Array(newest+1).fill(0), rate=(level+9)/10;
  if(!newest) chances[0]=100;
  else if(level<=5){chances[1]=[0,5,15,30,50][level-1];chances[0]=100-chances[1];}
  else {
    chances[newest]=[1,15,30,45,60][(level-1)%5];
    const weights=[70,22,8].slice(0,Math.min(3,newest)), total=weights.reduce((a,b)=>a+b,0);
    weights.forEach((w,i)=>chances[newest-1-i]=(100-chances[newest])*w/total);
  }
  const target=level<=10?[5,20,45,90,180,240,300,360,480,540][level-1]:Math.round((12+36*Math.min(19,level-11)/19)*60);
  const cost=chances.map(p=>p>=20?Math.max(1,Math.round(target*rate*p/100)):0);
  const mostCommon=chances.indexOf(Math.max(...chances));
  chances[mostCommon]-=.02;chances.push(.01,.01);
  return {newest,chances,rate,cost,minutes:Math.max(1,Math.min(240,Math.round(target*.15)))};
}
// null follows the deepest stratum; older strata retain their mastered distribution.
export function mineProduction(m, level=m.level) {
  const current=mineLevel(level),stratum=m.stratum;
  if(stratum==null)return current;
  if(stratum===0)return {...current,newest:0,chances:[100]};
  const mastered=mineLevel(Math.min(level,5*stratum));
  return {...mastered,rate:current.rate};
}
export function selectMineStratum(s,index,now=Date.now()) {
  if(index!==null&&(!Number.isInteger(index)||index<0||index>mineLevel(s.mine.level).newest))return false;
  settleMine(s,now);s.mine.stratum=index;return true;
}
export const MINE_INTERVAL = 60000, MINE_CAP = 240;
export function settleMine(s, now = Date.now(), rng = Math.random) {
  const m=s.mine, elapsed=Math.max(0,Math.floor((now-m.lastAt)/MINE_INTERVAL));
  const count=Math.min(MINE_CAP-m.bufferMinutes,elapsed);
  let produced=0;
  m.remainder ??= 0;
  for(let n=1;n<=count;n++){
    const at=m.lastAt+n*MINE_INTERVAL;
    if(m.upgradeEndsAt && at>=m.upgradeEndsAt){m.level++;m.upgradeEndsAt=0;}
    const {chances,rate}=mineProduction(m);
    while(m.ore.length<chances.length){m.ore.push(0);m.pending.push(0);}
    const boost=s.alchemy?(s.alchemy.oreRemainder||0)+Math.round(rate*10)*passivePotionBonus(s,'ore',at-MINE_INTERVAL,at):0;
    const extraTenths=Math.floor(boost+1e-9);if(s.alchemy)s.alchemy.oreRemainder=Math.max(0,boost-extraTenths);
    const tenths=m.remainder+Math.round(rate*10)+extraTenths,whole=Math.floor(tenths/10);
    m.remainder=tenths%10;
    for(let hit=0;hit<whole;hit++){
      let roll=rng()*100,index=0;
      while(index<chances.length-1 && roll>=chances[index])roll-=chances[index++];
      m.pending[index]++;produced++;
      if(s.dungeons){
        const bonus=(s.dungeons.oreRemainder||0)+Math.floor(s.dungeons.cleared[2]/5);
        const extra=Math.floor(bonus/100);
        s.dungeons.oreRemainder=bonus%100;m.pending[index]+=extra;produced+=extra;
      }
    }
  }
  m.bufferMinutes+=count;
  if(m.bufferMinutes===MINE_CAP)m.lastAt=Math.max(m.lastAt,now);
  else m.lastAt+=count*MINE_INTERVAL;
  if(m.upgradeEndsAt && now>=m.upgradeEndsAt){m.level++;m.upgradeEndsAt=0;}
  while(m.ore.length<mineLevel(m.level).chances.length){m.ore.push(0);m.pending.push(0);}
  return produced;
}
export function collectMine(s, now = Date.now()) {
  settleMine(s,now);
  const loot=[...s.mine.pending];
  loot.forEach((n,i)=>s.mine.ore[i]+=n);s.mine.pending=loot.map(()=>0);s.mine.bufferMinutes=0;
  return loot;
}
export function upgradeMine(s, now = Date.now()) {
  settleMine(s,now);
  const m=s.mine,next=mineLevel(m.level);
  if(m.upgradeEndsAt || next.cost.some((n,i)=>(m.ore[i]||0)<n))return false;
  next.cost.forEach((n,i)=>m.ore[i]-=n);m.upgradeEndsAt=now+next.minutes*60000;
  return true;
}
export function sellOre(s,index,amount) {
  if(!Number.isInteger(index)||index<0||index>=s.mine.ore.length||!Number.isSafeInteger(amount)||amount<1||s.mine.ore[index]<amount)return false;
  s.mine.ore[index]-=amount;s.coins+=amount*mineResource(index).price;return true;
}
// A saved timestamp keeps the same four-hour buffer online and offline.
export function idleCapacity(s) { return 240+30*(s.workshop?.storage||0); }
export function idleRates(s) {
  const n=s.workshop?.coins||0;
  return {coins:n<=40?1+n*.1:n<=70?5+(n-40)*.5:n<=100?20+n-70:50+(n-100)*2,
    hammers:1+(s.workshop?.hammers||0)*.05};
}
export function idleRewards(s, now = Date.now()) {
  return Math.min(idleCapacity(s),(s.idleStore?.minutes||0)+Math.floor(Math.max(0,now-s.idleSince)/60000));
}
export function idleLoot(s,now=Date.now()) {
  const bank=s.idleStore||{minutes:0,coins:0,hammers:0},minutes=idleRewards(s,now),added=minutes-bank.minutes,rates=idleRates(s);
  const from=s.idleSince,to=from+added*60000;
  return {minutes,coins:Math.floor((bank.coins+added*Math.round(rates.coins*20)*(1+passivePotionBonus(s,'coins',from,to)))/20),
    hammers:Math.floor((bank.hammers+added*Math.round(rates.hammers*20)*(1+passivePotionBonus(s,'hammers',from,to)))/20)};
}
function settleIdle(s,now) {
  const bank=s.idleStore??={minutes:0,coins:0,hammers:0},minutes=idleRewards(s,now),added=minutes-bank.minutes,rates=idleRates(s);
  const from=s.idleSince,to=from+added*60000;
  if(s.alchemy){s.alchemy.pending=idleReagents(s,now);s.alchemy.idleMinutes+=added;}
  bank.coins+=added*Math.round(rates.coins*20)*(1+passivePotionBonus(s,'coins',from,to));
  bank.hammers+=added*Math.round(rates.hammers*20)*(1+passivePotionBonus(s,'hammers',from,to));bank.minutes=minutes;
  s.idleSince=minutes===idleCapacity(s)?now:s.idleSince+added*60000;
}
export function collectIdleRewards(s, now = Date.now()) {
  const amount=idleRewards(s,now);if(!amount)return 0;
  settleIdle(s,now);const bank=s.idleStore;
  s.coins+=Math.floor(bank.coins/20);s.hammers+=Math.floor(bank.hammers/20);
  if(s.alchemy){s.alchemy.pending.forEach((n,i)=>s.alchemy.reagents[i]+=n);s.alchemy.pending=[0,0,0,0,0];}
  bank.coins%=20;bank.hammers%=20;bank.minutes=0;return amount;
}
export function workshopPrice(s,key) {
  const slot=SLOTS.includes(key),level=slot?s.workshop.slots[key]:s.workshop[key];
  return WORKSHOP_PRICES[slot?'slot':key]?.[level]??null;
}
export function upgradeWorkshop(s,key,now=Date.now()) {
  const price=workshopPrice(s,key);if(price==null)return false;
  if(key==='storage'){if(s.coins<price)return false;}
  else if((s.mine.ore[price[0]]||0)<price[1])return false;
  // Settle earned rewards at the old rate and capacity before purchasing.
  settleIdle(s,now);
  const fraction=s.hp/stats(s).hp;
  if(key==='storage')s.coins-=price;else s.mine.ore[price[0]]-=price[1];
  if(SLOTS.includes(key))s.workshop.slots[key]++;else s.workshop[key]++;
  s.hp=fraction*stats(s).hp;return true;
}
// One hammer per item. A partial batch spends only the remaining hammers.
export function batchSize(s) { return COMBAT[s.highest - 1].batch_size; }
export const BATCH_OPTIONS = [{ size:1, level:1 }, ...COMBAT.flatMap((row,i) => !i || row.batch_size !== COMBAT[i-1].batch_size ? [{ size:row.batch_size, level:i+1 }] : [])];
export function forgeCost(s) { return Math.min(s.hammers, s.selectedBatch ?? 1, batchSize(s)); }
export function forge(s, rng = Math.random) {
  if (s.forging > 0 || s.hammers < 1) return false;
  s.forgingAuto = s.autoForge;
  const count = forgeCost(s), bases = { weapon:2, gloves:2, necklace:1, ring:1, helmet:5, chest:15, shoulders:5, legs:5, cape:5, boots:3, belt:3 };
  for (let i = 0; i < count; i++) {
    const bucket = SLOTS[Math.min(11, Math.floor(rng() * 12))];
    const slot = bucket.startsWith('ring') ? 'ring' : bucket;
    let roll = rng() * 100, epochIndex = 0;
    const chances = FORGE_CHANCES[s.anvilLevel - 1];
    while (epochIndex < 9 && roll >= chances[epochIndex]) roll -= chances[epochIndex++];
    const mastery = s.mastery[epochIndex];
    const itemLevel = 1 + Math.min(mastery.level - 1, Math.floor(rng() * mastery.level));
    // Equipment art belongs to its own epoch; weapon types never carry over.
    const appearance = rng(), pool = Object.keys(WEAPONS).filter(id=>WEAPONS[id].epoch===epochIndex+1);
    const weaponId=slot==='weapon'?pool[Math.min(pool.length-1,Math.floor(appearance*pool.length))]:undefined;
    const quality = weaponId ? WEAPONS[weaponId].quality : Math.min((ARMOR_SETS[epochIndex]?.length??1)-1, Math.floor(appearance * (ARMOR_SETS[epochIndex]?.length??1)));
    s.forgingItems.push({ slot, ...(weaponId?{weaponId}:{}), name: weaponId?WEAPONS[weaponId].name:epochIndex===0?NAMES[slot][quality]:`${epochIndex===1?['Bronze Warrior','Temple Guard','Legionary'][quality]:epochIndex===2?['Iron Knight','Forest Ranger','Royal Guard'][quality]:epochIndex===3?['Musketeer','Corsair','Grenadier'][quality]:epochIndex===4?['Field Scout','Commando','Heavy Trooper'][quality]:epochIndex===5?['Neon Runner','Exo Trooper','Reactor Guard'][quality]:epochIndex===6?["Lunar Scout","Void Corsair","Xeno Warden"][quality]:epochIndex===7?["Rift Nomad","Prism Keeper","Paradox Knight"][quality]:epochIndex===8?["Ash Reaper","Ember Brute","Obsidian Tyrant"][quality]:epochIndex===9?["Dawn Herald","Storm Seraph","Sun Sovereign"][quality]:EPOCHS[epochIndex]} ${LABELS[slot]||'Ring'}`, quality, epoch: epochIndex + 1, itemLevel,
      sale: SALE_PRICES[epochIndex], value: Math.max(1, Math.round(Math.round(bases[slot] * 10 ** epochIndex * (1 + .05 * (itemLevel - 1))) * (WEAPONS[weaponId]?.multiplier??1))) });
    s.lastEpoch = epochIndex + 1;
    if (mastery.level < 100 && ++mastery.xp >= mastery.level + 4) { mastery.xp = 0; mastery.level++; }
  }
  s.hammers -= count; s.forging = 1.5;
  if (!s.hammers) s.autoForge = false;
  return true;
}
// The selected ready item stays separate so ongoing batches cannot change a comparison.
export function browseResults(s, direction = 1) {
  if (!s.pending || !s.results.length) return false;
  if (direction > 0) { s.results.push(s.pending); s.pending = s.results.shift(); }
  else { s.results.unshift(s.pending); s.pending = s.results.pop(); }
  return true;
}
export function equip(s, targetSlot = s.pending?.slot, transferAffix = false) {
  if (!s.pending) return false;
  if (s.pending.slot === 'ring' ? !['ring1','ring2'].includes(targetSlot) : targetSlot !== s.pending.slot) return false;
  const source = s.equipment[targetSlot], cost = (s.pending.epoch ?? 1) * 10;
  if (transferAffix && (!source?.affix || (s.pending.epoch ?? 1) < 2 || !Number.isSafeInteger(s.runes) || s.runes < cost)) return false;
  const fraction = s.hp / stats(s).hp;
  const next = { ...s.pending, slot: targetSlot };
  if (transferAffix) { next.affix = { ...source.affix }; delete next.reforgeOffer; s.runes -= cost; }
  s.equipment[targetSlot] = next;
  s.pending = s.results.shift() ?? null;
  s.hp = fraction * stats(s).hp; return true;
}
export function sell(s) {
  if (!s.pending) return false;
  s.coins += s.pending.sale; s.pending = s.results.shift() ?? null; return true;
}
export function equipStronger(s, preview = false) {
  const equipment = { ...s.equipment }, chosen = {};
  const items = [s.pending, ...s.results].filter(Boolean);
  for (const item of items) {
    const slot = item.slot === 'ring'
      ? (equipment.ring1?.value ?? 0) <= (equipment.ring2?.value ?? 0) ? 'ring1' : 'ring2'
      : item.slot;
    if (item.value > (equipment[slot]?.value ?? 0) && (!equipment[slot]?.affix || item.affix?.type === equipment[slot].affix.type && item.affix.value >= equipment[slot].affix.value)) {
      equipment[slot] = { ...item, slot }; chosen[slot] = item;
    }
  }
  const selected = new Set(Object.values(chosen));
  if (!preview && selected.size) {
    const fraction = s.hp / stats(s).hp;
    s.equipment = equipment;
    const remaining = items.filter(item => !selected.has(item));
    s.pending = remaining.shift() ?? null; s.results = remaining;
    s.hp = fraction * stats(s).hp;
  }
  return selected.size;
}
// Only ready items are considered. Preview uses the same comparison as the sale.
export function sellWeaker(s, preview = false, selection = null) {
  let count = 0, coins = 0;
  const remaining = [];
  for (const item of [s.pending, ...s.results]) {
    if (!item) continue;
    const equipped = item.slot === 'ring'
      ? s.equipment.ring1 && s.equipment.ring2 && { value: Math.min(s.equipment.ring1.value, s.equipment.ring2.value) }
      : s.equipment[item.slot];
    const affixWeaker = !item.affix || (item.slot === 'ring' ? ['ring1','ring2'] : [item.slot]).every(slot => s.equipment[slot]?.affix?.type === item.affix.type && s.equipment[slot].affix.value >= item.affix.value);
    if ((!selection || selection.has(item)) && equipped && item.value <= equipped.value && affixWeaker) { count++; coins += item.sale; }
    else if (!preview) remaining.push(item);
  }
  if (!preview && count) {
    s.coins += coins;
    s.pending = remaining.shift() ?? null;
    s.results = remaining;
  }
  return { count, coins };
}
export function finishUpgrade(s, now = Date.now()) {
  if (!s.upgradeEndsAt || now < s.upgradeEndsAt) return false;
  s.anvilLevel++; s.upgradeEndsAt = 0; return true;
}
export function upgradeAnvil(s, now = Date.now()) {
  finishUpgrade(s, now);
  const next = ANVILS[s.anvilLevel];
  if (!next || s.upgradeEndsAt || s.coins < next.coins) return false;
  s.coins -= next.coins; s.upgradeEndsAt = now + next.minutes * 60000; return true;
}
export function anvilSkipCost(s, now = Date.now()) {
  const next = ANVILS[s.anvilLevel], remaining = s.upgradeEndsAt - now;
  return !next || remaining <= 0 ? 0 : Math.ceil(next.coins * 5 * Math.min(1, remaining / (next.minutes * 60000)));
}
export function skipAnvilUpgrade(s, now = Date.now()) {
  if (finishUpgrade(s, now)) return true;
  const cost = anvilSkipCost(s, now);
  if (!cost || s.coins < cost) return false;
  s.coins -= cost;
  return finishUpgrade(s, s.upgradeEndsAt);
}
export function step(s, dt, rng = Math.random, now = Date.now()) {
  if(s.dungeons?.run){
    const run=s.dungeons.run,b=run.battle,index=DUNGEONS.findIndex(d=>d.id===run.id);
    const rootHpFraction=s.hp/stats(s).hp;
    b.alchemy=s.alchemy;
    const events=step(b,Math.min(dt,Math.max(0,90-b.dungeonBattle.time)),rng,now);
    s.hp=rootHpFraction*stats(s).hp;
    const won=b.phase==='victory',lost=b.phase==='dead',timeout=b.dungeonBattle.time>=90-1e-8;
    if(won||lost||timeout){
      const allowed=dungeonDay(s,now)[index]<2;
      if(won&&allowed){
        s.coins+=run.rewards.coins;s.hammers+=run.rewards.hammers;
        run.rewards.ore.forEach((n,i)=>{s.mine.ore[i]=(s.mine.ore[i]||0)+n;s.mine.pending[i]??=0;});
        s.dungeons.wins[index]++;s.dungeons.cleared[index]=Math.max(s.dungeons.cleared[index],run.floor);
      }
      const reagent=won&&allowed?rollReagent(s.highest,true,rng):-1;if(reagent>=0&&s.alchemy)s.alchemy.reagents[reagent]++;
      s.dungeons.last={outcome:won&&allowed?'won':lost?'lost':'timeout',id:run.id,floor:run.floor,...(won&&allowed?{rewards:run.rewards}:{})};
      s.dungeons.run=null;
      return [...(reagent>=0?[{type:'reagent',rarity:reagent,targetId:0}]:[]),{type:'dungeonEnd',...(won?{battle:b}:{})}];
    }
    return events;
  }
  const events = [];
  if(s.dungeonBattle){
    const d=s.dungeonBattle,e=s.enemies[0];
    d.time+=dt;
    const rank=Math.floor((d.floor-1)/50),period=12-rank,duty=3+rank*.25,chargePeriod=10-rank*.5;
    e.shield=d.id==='treasury' && d.time%period>=period-duty;
    const charging=d.id==='forge' && d.time%chargePeriod>=chargePeriod-2;
    if(e.charging&&!charging){e.smash=true;e.clock=1.1;}
    e.charging=charging;
    e.strength=d.id==='mine'?1+Math.floor(d.time/(20-rank*2))*.25:e.smash?2.6+rank*.2:1;
    e.damage=e.baseDamage*e.strength;
  }
  if (!s.dungeonBattle && finishUpgrade(s, now)) events.push({ type: 'anvilUpgraded' });
  if (s.forging > 0) {
    s.forging = Math.max(0, s.forging - dt);
    if (!s.forging) {
      const count = s.forgingItems.length, item = s.forgingItems.at(-1);
      let soldCount = 0, soldCoins = 0;
      for (const forged of s.forgingItems) {
        if (s.forgingAuto && (s.autoSellEpochs.includes(forged.epoch) || forged.slot==='weapon' && WEAPONS[forged.weaponId] && (s.autoWeaponFilter==='melee' && WEAPONS[forged.weaponId].range>0 || s.autoWeaponFilter==='ranged' && !WEAPONS[forged.weaponId].range))) { soldCount++; soldCoins += forged.sale; }
        else s.results.push(forged);
      }
      s.autoForgeCoins += soldCoins;
      s.coins += soldCoins; s.forgingItems = []; s.forgingAuto = false;
      if (!s.pending) s.pending = s.results.shift() ?? null;
      events.push({ type: 'forged', count, item, soldCount, soldCoins });
    }
  }
  if (s.autoForge && !s.forging) {
    if (forge(s, rng)) events.push({ type: 'forgeStarted' });
    else s.autoForge = false;
  }
  s.heroActionAge = Math.min(1, s.heroActionAge + dt);
  if (s.companion) s.companion.actionAge = Math.min(1,s.companion.actionAge+dt);
  for (const e of s.enemies) { e.actionAge = Math.min(1, e.actionAge + dt); e.deadTime = Math.max(0, e.deadTime - dt); }
  if (s.completed) return events;
  if(s.alchemy && !['dead','victory','complete'].includes(s.phase)){
    const fraction=s.hp/stats(s).hp;let expired=false;
    for(const type of ['damage','health']){const b=s.alchemy.active[type];if(b?.remaining>0){b.remaining=Math.max(0,b.remaining-dt);if(!b.remaining)expired=true;}}
    if(expired){s.hp=fraction*stats(s).hp;events.push({type:'potionExpired'});}
  }
  const bonuses = affixBonuses(s), hero = stats(s), interval = HERO_ATTACK_INTERVAL / (1 + bonuses.speed/100);
  if (s.hp > 0 && s.phase !== 'dead') s.hp = Math.min(hero.hp, s.hp + hero.hp * bonuses.regen / 100 * dt);
  if(s.companion?.kind==='druid') {
    const c=s.companion;
    c.healAge=Math.min(1,(c.healAge ?? 1)+dt);
    if(s.hp<=0 || s.phase==='dead')c.regenClock=0;
    else {
      c.regenClock=(c.regenClock||0)+dt;
      while(c.regenClock>=2-1e-9){
        c.regenClock=Math.max(0,c.regenClock-2);
        const value=Math.min(DRUID_LEVELS[s.druidLevel-1].healing,hero.hp-s.hp);
        s.hp+=value;
        if(value>0){c.healAge=0;c.actionAge=0;events.push({type:'heroRegen',value});}
      }
    }
  }

  if (s.phase === 'dead' || s.phase === 'victory') {
    s.doubleStrikeDelay = 0;
    if(s.companion){s.companion.shot=null;s.companion.moving=s.phase==='victory';if(s.companion.moving)s.companion.x+=APPROACH_SPEED/2*dt;}
    if (s.phase === 'victory') s.heroX += APPROACH_SPEED / 2 * dt;
    else for (const e of s.enemies) if (e.hp > 0) { e.x -= APPROACH_SPEED / 2 * dt; e.moving = true; e.engaged = false; }
    s.phaseTime -= dt;
    if (s.phaseTime > 0) return events;
    if (s.phase === 'dead') {
      s.level = Math.max(1, s.level - 1); s.encounter = 0; s.hp = stats(s).hp; events.push({ type: 'restart' });
    } else if (s.encounter < 9) s.encounter++;
    else if (s.level < MAX_LEVEL) {
      s.level++; s.highest = Math.max(s.highest, s.level); s.encounter = 0; s.hp = stats(s).hp;
      events.push({ type: 'level', level: s.level });
    } else {
      s.completed = true; s.phase = 'complete'; events.push({ type: 'complete' }); return events;
    }
    prepareEncounter(s); return events;
  }
  const living = s.enemies.filter(e => e.hp > 0).sort((a,b) => a.x - b.x);
  const target = living[0], reach = WEAPONS[s.equipment.weapon?.weaponId]?.range || (target.boss ? .165 : .115);
  const oldPhase = s.phase;
  if (target.x - s.heroX > reach + .0001) {
    s.heroX += Math.min(APPROACH_SPEED / 2 * dt, target.x - s.heroX - reach);
  }
  const tank=s.companion?.kind==='turtle' && s.companion.hp>0?s.companion:null;
  if(tank){
    const destination=Math.min(s.heroX+.26,target.x-.07),delta=destination-tank.x;
    tank.moving=Math.abs(delta)>.002;
    if(tank.moving)tank.x+=Math.sign(delta)*Math.min(Math.abs(delta),APPROACH_SPEED*1.1*dt);
  }
  const frontX=tank && tank.x>s.heroX?tank.x:s.heroX;
  const melee = living.filter(e => e.kind === 'warrior' || e.boss);
  const archers = living.filter(e => e.kind === 'archer');
  for (const e of living) {
    const index = melee.indexOf(e);
    const distance = index >= 0 ? (e.boss ? .165 : .115) + (index < 3 ? index * .035 : .18 + (index - 3) * .11)
      : e.kind === 'archer' ? .46 + archers.indexOf(e) * .10 : .65;
    e.moving = e.x - frontX > distance + .0001;
    if (e.moving) e.x -= Math.min(APPROACH_SPEED / 2 * dt, e.x - frontX - distance);
    const ready = !e.moving && index < 3;
    if (ready && !e.engaged) e.clock = e.kind === 'archer' ? .70 : e.boss ? .58 : .68;
    if (!ready) e.clock = 0;
    e.engaged = ready;
  }
  const inReach = target.x - s.heroX <= reach + .0001;
  s.phase = inReach ? 'fight' : 'walk';
  if (inReach && (s.targetId !== target.id || oldPhase !== 'fight')) {
    s.heroClock = interval * .375; s.doubleStrikeDelay = 0;
    if (target.boss) events.push({ type: 'boss' });
  }
  s.targetId = target.id;
  if (inReach) {
    s.heroClock += dt;
    const extra = s.doubleStrikeDelay > 0 && s.doubleStrikeDelay <= dt;
    s.doubleStrikeDelay = Math.max(0,(s.doubleStrikeDelay || 0)-dt);
    if (s.heroClock >= interval || extra) {
      if (!extra) s.heroClock -= interval;
      s.heroActionAge = 0; s.heroAttackCount++;
      const critical = rng() < Math.min(50,bonuses.crit)/100;
      const damage = Math.max(1,Math.round(hero.damage * (critical ? 1.5 + bonuses.critDamage/100 : 1)*(target.shield?.35:1)));
      s.battleStats.maxHit=Math.max(s.battleStats.maxHit,damage);
      if(critical)s.battleStats.maxCrit=Math.max(s.battleStats.maxCrit,damage);
      const dealt = Math.min(target.hp,damage);
      target.hp = Math.max(0, target.hp - damage);
      s.hp = Math.min(hero.hp,s.hp + dealt * bonuses.lifesteal/100);
      events.push({ type: 'heroHit', value: damage, targetId: target.id, critical, extra });
      if (!extra && target.hp > 0 && bonuses.double > 0 && rng() < bonuses.double/100) s.doubleStrikeDelay = interval * .16;
    }
  } else { s.heroClock = 0; s.doubleStrikeDelay = 0; }

  if(s.companion?.kind==='druid') {
    const c=s.companion, delta=s.heroX-.13-c.x;
    c.moving=Math.abs(delta)>.002;
    if(c.moving)c.x+=Math.sign(delta)*Math.min(Math.abs(delta),APPROACH_SPEED*.65*dt);
  }

  if(s.companion?.kind==='archer') {
    const c=s.companion, destination=s.heroX-.13, delta=destination-c.x;
    c.moving=Math.abs(delta)>.002;
    if(c.moving)c.x+=Math.sign(delta)*Math.min(Math.abs(delta),APPROACH_SPEED*.65*dt);
    if(c.shot){
      c.shot.remaining-=dt;
      if(c.shot.remaining<=0){
        if(target.hp>0 && target.id===c.shot.targetId){
          const damage=Math.max(1,Math.round(ARCHER_LEVELS[s.archerLevel-1].damage*(target.shield?.35:1)));
          target.hp=Math.max(0,target.hp-damage);
          events.push({type:'companionHit',value:damage,targetId:target.id});
        }
        c.shot=null;
      }
    }
    c.clock=Math.min(1,c.clock+dt);
    if(target.hp>0 && !c.moving && target.x-c.x<=.65){
      if(c.clock>=1){
        c.clock-=1;c.actionAge=0;
        c.shot={targetId:target.id,remaining:.18,fromX:c.x,toX:target.x};
      }
    }
  }
  if (!target.hp) {
    if(s.dungeonBattle){s.phase='victory';s.phaseTime=.8;return events;}
    target.deadTime = .6; target.engaged = false; target.moving = false;
    const coinReward=Math.round(target.reward*(1+Math.floor((s.dungeons?.cleared[0]||0)/5)*.01));
    s.kills++; s.coins += coinReward;
    const loot = COMBAT[s.level - 1];
    const hammers = target.boss
      ? (loot.hammer_min + Math.min(loot.hammer_max - loot.hammer_min, Math.floor(rng() * (loot.hammer_max - loot.hammer_min + 1)))) * 5
      : rng() < loot.hammer_drop_chance+Math.floor((s.dungeons?.cleared[1]||0)/5)*.0025 ? 1 : 0;
    const runes = rng() < .001 ? 1 : 0;
    s.hammers += hammers; s.runes += runes;
    const reagent=rollReagent(s.level,target.boss,rng);
    if(reagent>=0&&s.alchemy){s.alchemy.reagents[reagent]++;events.push({type:'reagent',rarity:reagent,targetId:target.id});}
    if(target.boss)s.battleStats.bosses++;
    s.battleStats.coins+=coinReward;s.battleStats.hammers+=hammers;s.battleStats.runes+=runes;
    events.push({ type: 'kill', value: coinReward, hammers, runes, targetId: target.id });
    if (s.enemies.every(e => e.hp === 0)) {
      s.phase = 'victory'; s.phaseTime = .8; return events;
    }
  }

  for (const e of living) {
    if (!e.hp || !e.engaged) continue;
    if (e.kind === 'healer') {
      e.healClock += dt;
      if (e.healClock >= 1.5) {
        e.healClock -= 1.5;
        const patient = s.enemies.filter(a => a.id !== e.id && a.hp > 0 && a.hp < a.maxHp)
          .sort((a,b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (patient) {
          const value = Math.min(e.healing, patient.maxHp - patient.hp);
          patient.hp += value; e.actionAge = 0;
          events.push({ type: 'heal', value, targetId: patient.id, sourceId: e.id });
        }
      }
      continue;
    }
    if(e.charging)continue;
    const previous = e.clock; e.clock += dt;
    if (e.kind === 'archer' && previous < .95 && e.clock >= .95) {
      e.actionAge = 0; events.push({ type: 'enemyShot', sourceId: e.id });
    }
    if (e.clock >= 1.1) {
      e.clock -= 1.1;
      e.smash=false;
      if (e.kind !== 'archer') e.actionAge = 0;
      if(tank && tank.hp>0 && tank.x>s.heroX && tank.x<e.x){
        const damage=e.damage*.5;
        tank.hp=Math.max(0,tank.hp-damage);tank.actionAge=0;
        events.push({type:'tankHit',value:damage,sourceId:e.id});
        if(!tank.hp){tank.moving=false;events.push({type:'tankDown'});}
        continue;
      }
      const blocked = bonuses.block > 0 && rng() < bonuses.block/100;
      s.hp = Math.max(0, s.hp - (blocked ? 0 : e.damage));
      events.push({ type: 'enemyHit', value: blocked ? 0 : e.damage, blocked, sourceId: e.id, ranged: e.kind === 'archer' });
      if (!s.hp) {
        if(s.companion){s.companion.regenClock=0;}
        if(s.dungeonBattle){s.phase='dead';s.phaseTime=1.8;return events;}
        s.deaths++; s.phase = 'dead'; s.phaseTime = 1.8;
        events.push({ type: 'death' }); return events;
      }
    }
  }
  return events;
}
export function replay(s) {
  if (!s.completed) return false;
  s.completed = false; s.level = 1; s.encounter = 0; s.hp = stats(s).hp;
  prepareEncounter(s); return true;
}
export function restore(serialized, now = Date.now()) {
  try {
    const s = JSON.parse(serialized);
    const nonnegative = n => Number.isFinite(n) && n >= 0;
    const affix = a => a && AFFIXES.some(d => d.id === a.type && Number.isFinite(a.value) && a.value >= d.min && a.value <= d.max && Math.abs((a.value-d.min)/d.step-Math.round((a.value-d.min)/d.step)) < 1e-8);
    const item = i => i && (SLOTS.includes(i.slot) || i.slot === 'ring') && typeof i.name === 'string' && Number.isFinite(i.value) && i.value > 0 && nonnegative(i.sale) && [0,1,2].includes(i.quality)
      && (i.affix == null || i.epoch >= 2 && affix(i.affix)) && (i.reforgeOffer == null || i.epoch >= 2 && affix(i.reforgeOffer))
      && (i.reforges == null || Number.isInteger(i.reforges) && i.reforges >= 0 && i.reforges <= 10);
    if (!s || ![1,2,3].includes(s.version) || !nonnegative(s.coins) || !Number.isInteger(s.level) || s.level < 1 || s.level > MAX_LEVEL ||
      !Number.isInteger(s.highest) || s.highest < s.level || s.highest > MAX_LEVEL || !nonnegative(s.hp) ||
      !s.equipment || !SLOTS.every(k => s.equipment[k] == null || item(s.equipment?.[k]) && s.equipment[k].slot === k) || (s.pending !== null && !item(s.pending)) ||
      !['forging','kills','deaths'].every(k => nonnegative(s[k])) || (s.forging > 0 && s.version < 3 && !s.pending) || typeof s.completed !== 'boolean') return freshGame(now);
    const bounded=(value,max)=>Number.isInteger(value)?Math.max(0,Math.min(max,value)):0;
    const d=s.dungeons;
    const triplet=a=>Array.isArray(a)&&a.length===3&&a.every(n=>Number.isInteger(n)&&n>=0);
    s.dungeons=d&&triplet(d.cleared)&&d.cleared.every(n=>n<=200)&&triplet(d.wins)&&d.wins.every(n=>n<=2)&&Number.isSafeInteger(d.day)&&d.day>=0?d:{day:Math.floor(now/86400000),wins:[0,0,0],cleared:[0,0,0],run:null,last:null};
    if(s.dungeons.run){s.dungeons.last={outcome:'interrupted',id:s.dungeons.run.id,floor:s.dungeons.run.floor};s.dungeons.run=null;}
    if(s.dungeons.last&&!dungeonBoss(s.dungeons.last.id,s.dungeons.last.floor))s.dungeons.last=null;
    if(s.dungeons.oreRemainder!==undefined)s.dungeons.oreRemainder=bounded(s.dungeons.oreRemainder,99);
    const owned=s.mount?.owned===true&&s.dungeons.cleared.every(n=>n>=10);
    s.mount={owned,equipped:owned&&s.mount.equipped===true};
    dungeonDay(s,now);
    const a=s.alchemy||{},counts=(v,n)=>Array.from({length:n},(_,i)=>bounded(v?.[i],1e9));
    s.alchemy={xp:bounded(a.xp,25245),reagents:counts(a.reagents,5),potions:counts(a.potions,25),pending:counts(a.pending,5),idleMinutes:bounded(a.idleMinutes,1e12),seed:bounded(a.seed??Math.floor(s.idleSince||1),2147483647),oreRemainder:nonnegative(a.oreRemainder)&&a.oreRemainder<1?a.oreRemainder:0,active:{},previous:{}};
    for(const p of POTIONS){const b=a.active?.[p.id];if(b&&Number.isInteger(b.rarity)&&b.rarity>=0&&b.rarity<5&&nonnegative(b.value)&&b.value<=Math.max(...p.base)*2&&(p.combat?nonnegative(b.remaining)&&b.remaining<=3600:nonnegative(b.startsAt)&&nonnegative(b.endsAt)&&b.endsAt>=b.startsAt&&b.endsAt-b.startsAt<=10800000))s.alchemy.active[p.id]={...b};}
    for(const p of POTIONS.filter(p=>!p.combat)){const b=a.previous?.[p.id];if(b&&nonnegative(b.value)&&b.value<=Math.max(...p.base)*2&&nonnegative(b.startsAt)&&nonnegative(b.endsAt)&&b.endsAt>=b.startsAt&&b.endsAt-b.startsAt<=10800000)s.alchemy.previous[p.id]={...b};}
    const workshop=s.workshop||{};
    s.workshop={slots:Object.fromEntries(SLOTS.map(slot=>[slot,bounded(workshop.slots?.[slot],100)])),coins:bounded(workshop.coins,125),hammers:bounded(workshop.hammers,80),storage:bounded(workshop.storage,16)};
    const bank=s.idleStore;
    s.idleStore=bank&&Number.isInteger(bank.minutes)&&bank.minutes>=0&&bank.minutes<=idleCapacity(s)&&['coins','hammers'].every(k=>Number.isFinite(bank[k])&&bank[k]>=0&&bank[k]<=idleCapacity(s)*5000+19)?bank:{minutes:0,coins:0,hammers:0};
    s.turtleLevel=Number.isInteger(s.turtleLevel)?Math.max(1,Math.min(100,s.turtleLevel)):1;
    s.archerLevel=Number.isInteger(s.archerLevel)?Math.max(1,Math.min(100,s.archerLevel)):1;
    s.druidLevel=Number.isInteger(s.druidLevel)?Math.max(1,Math.min(100,s.druidLevel)):1;
    s.autoForgeCoins=Number.isSafeInteger(s.autoForgeCoins)&&s.autoForgeCoins>=0?s.autoForgeCoins:0;
    s.battleStats=Object.fromEntries(['bosses','maxHit','maxCrit','coins','hammers','runes'].map(k=>[k,Number.isSafeInteger(s.battleStats?.[k])&&s.battleStats[k]>=0?s.battleStats[k]:0]));
    s.hiredCompanions=Array.isArray(s.hiredCompanions)?[...new Set(s.hiredCompanions.filter(id=>COMPANIONS.some(c=>c.id===id)))]:[];
    s.selectedCompanion=s.hiredCompanions.includes(s.selectedCompanion)?s.selectedCompanion:null;
    if(s.companion){
      const c=s.companion;
      if(c.kind==='druid'){delete c.regenRemaining;c.regenClock=Number.isFinite(c.regenClock)&&c.regenClock>=0?c.regenClock%2:0;}
      const valid=s.hiredCompanions.includes(c.kind)&&['x','clock','actionAge'].every(k=>nonnegative(c[k]))&&
        (c.kind!=='turtle'||nonnegative(c.hp)&&c.hp<=TURTLE_LEVELS[s.turtleLevel-1].hp&&c.maxHp===TURTLE_LEVELS[s.turtleLevel-1].hp)&&
        (c.kind!=='druid'||nonnegative(c.regenClock)&&c.regenClock<2);
      if(!valid)s.companion=null;
      else if(c.shot && (!Number.isInteger(c.shot.targetId)||!['remaining','fromX','toX'].every(k=>nonnegative(c.shot[k]))||c.shot.remaining>.18))c.shot=null;
    }
    const legacy = s.version < 3;
    if (legacy) {
      Object.assign(s, { hammers:0, autoForge:false, anvilLevel:1, upgradeEndsAt:0,
        mastery:EPOCHS.map(() => ({level:1,xp:0})), lastEpoch:1, results:[], forgingItems:[] });
    } else if (!Number.isInteger(s.hammers) || s.hammers < 0 || typeof s.autoForge !== 'boolean' ||
      !Number.isInteger(s.anvilLevel) || s.anvilLevel < 1 || s.anvilLevel > 80 || !nonnegative(s.upgradeEndsAt) ||
      (s.upgradeEndsAt && s.anvilLevel === 80) || !Number.isInteger(s.lastEpoch) || s.lastEpoch < 1 || s.lastEpoch > 10 ||
      !Array.isArray(s.mastery) || s.mastery.length !== 10 || !s.mastery.every(m => Number.isInteger(m.level) && m.level >= 1 && m.level <= 100 && Number.isInteger(m.xp) && m.xp >= 0 && m.xp < m.level + 4 && (m.level < 100 || m.xp === 0)) ||
      !Array.isArray(s.results) || !s.results.every(item) || !Array.isArray(s.forgingItems) || !s.forgingItems.every(item) ||
      (s.forging > 0) !== (s.forgingItems.length > 0)) return freshGame(now);
    // Preserve old saves; levels beyond the compressed table have reached the new maximum.
    if (s.anvilLevel >= ANVILS.length) { s.anvilLevel = ANVILS.length; s.upgradeEndsAt = 0; }
    for (const slot of SLOTS) s.equipment[slot] ??= null;
    // One-time reset for the switch from automatic affixes to paid enchanting.
    if(s.affixVersion!==1){
      const hpFraction=s.hp/stats(s).hp;
      for(const i of [...Object.values(s.equipment),s.pending,...s.results,...s.forgingItems]){
        if(!i)continue;
        delete i.affix;delete i.reforgeOffer;delete i.reforges;
      }
      s.hp=hpFraction*stats(s).hp;s.affixVersion=1;
    }

    if (s.pending && ['ring1','ring2'].includes(s.pending.slot)) s.pending.slot = 'ring';
    // Names are display text; old saves keep their item stats but use English labels.
    for (const i of [...Object.values(s.equipment).filter(Boolean), ...(s.pending ? [s.pending] : []), ...s.results, ...s.forgingItems]) { i.value=Math.max(1,Math.round(i.value));
      if(i.slot==='weapon'&&i.epoch===2&&WEAPONS[i.weaponId]?.epoch!==2){i.weaponId=WEAPONS[i.weaponId]?.range?'short-bow':i.quality===1?'battle-spear':i.quality===2?'gladius':'bronze-axe';i.quality=WEAPONS[i.weaponId].quality;}
      i.name = (i.slot==='weapon'&&WEAPONS[i.weaponId]?.name)||((i.epoch??1)===1?NAMES[['ring1','ring2'].includes(i.slot)?'ring':i.slot][i.quality]:`${i.epoch===2?['Bronze Warrior','Temple Guard','Legionary'][i.quality]:i.epoch===3?['Iron Knight','Forest Ranger','Royal Guard'][i.quality]:i.epoch===4?['Musketeer','Corsair','Grenadier'][i.quality]:i.epoch===5?['Field Scout','Commando','Heavy Trooper'][i.quality]:i.epoch===6?['Neon Runner','Exo Trooper','Reactor Guard'][i.quality]:i.epoch===7?["Lunar Scout","Void Corsair","Xeno Warden"][i.quality]:i.epoch===8?["Rift Nomad","Prism Keeper","Paradox Knight"][i.quality]:i.epoch===9?["Ash Reaper","Ember Brute","Obsidian Tyrant"][i.quality]:i.epoch===10?["Dawn Herald","Storm Seraph","Sun Sovereign"][i.quality]:EPOCHS[i.epoch-1]} ${LABELS[i.slot]||'Ring'}`); }
    if (s.version === 1) {
      if (!Number.isInteger(s.encounter) || s.encounter < 0 || s.encounter > 3) return freshGame(now);
      const fraction = Math.min(1, s.hp / (100 + (s.equipment.helmet?.value ?? 0) + (s.equipment.chest?.value ?? 0)));
      s.version = 2; s.heroX = .24; s.encounter = Math.min(9, s.encounter * 3);
      s.hp = fraction * stats(s).hp;
      delete s.enemyHp; delete s.enemyClock;
      prepareEncounter(s);
      if (s.completed) { s.encounter = 9; prepareEncounter(s); s.phase = 'complete'; }
      else if (!s.hp) { s.phase = 'dead'; s.phaseTime = 1.8; }
    }
    if (legacy) {
      s.version = 3;
      if (s.forging > 0) { s.forgingItems = [s.pending]; s.pending = null; }
      if (s.completed && s.level < MAX_LEVEL) { s.completed = false; s.phase = "victory"; s.phaseTime = .8; }
    }
    if (!Number.isSafeInteger(s.runes) || s.runes < 0) s.runes = 0;
    if (!nonnegative(s.idleSince)) s.idleSince = now;
    if (!s.mine || s.mine.version!==2 || !Number.isSafeInteger(s.mine.level) || s.mine.level<1 ||
      !['ore','pending'].every(key=>Array.isArray(s.mine[key]) && s.mine[key].length>0 && s.mine[key].length<=mineLevel(s.mine.level).chances.length && s.mine[key].every(n=>Number.isSafeInteger(n)&&n>=0)) ||
      !Number.isInteger(s.mine.bufferMinutes) || s.mine.bufferMinutes<0 || s.mine.bufferMinutes>MINE_CAP ||
      !nonnegative(s.mine.lastAt) || !nonnegative(s.mine.upgradeEndsAt))
      s.mine={version:2,stratum:null,level:1,ore:[0,0,0],pending:[0,0,0],bufferMinutes:0,remainder:0,lastAt:now,upgradeEndsAt:0};
    if(!Number.isInteger(s.mine.remainder)||s.mine.remainder<0||s.mine.remainder>9)s.mine.remainder=0;
    if(!Number.isInteger(s.mine.stratum)||s.mine.stratum<0||s.mine.stratum>mineLevel(s.mine.level).newest)s.mine.stratum=null;
    while(s.mine.ore.length<mineLevel(s.mine.level).chances.length)s.mine.ore.push(0);
    while(s.mine.pending.length<s.mine.ore.length)s.mine.pending.push(0);
    s.autoWeaponFilter=['any','melee','ranged'].includes(s.autoWeaponFilter)?s.autoWeaponFilter:'any';
    s.autoSellEpochs = Array.isArray(s.autoSellEpochs) ? s.autoSellEpochs.filter(epoch => Number.isInteger(epoch) && epoch >= 1 && epoch <= EPOCHS.length) : [];
    s.reforgeStop = Array.isArray(s.reforgeStop) ? [...new Set(s.reforgeStop.filter(id=>AFFIXES.some(a=>a.id===id)))] : [];
    s.forgingAuto = s.forging > 0 && s.forgingAuto === true;
    s.selectedBatch = BATCH_OPTIONS.some(option => option.size === s.selectedBatch && option.level <= s.highest) ? s.selectedBatch : 1;
    s.heroAttackCount = Number.isSafeInteger(s.heroAttackCount) && s.heroAttackCount >= 0 ? s.heroAttackCount : 0;
    s.doubleStrikeDelay = nonnegative(s.doubleStrikeDelay) ? s.doubleStrikeDelay : 0;
    finishUpgrade(s, now);
    if (!Number.isInteger(s.encounter) || s.encounter < 0 || s.encounter > 9 || s.hp > stats(s).hp ||
      !['walk','fight','dead','victory','complete'].includes(s.phase) || !['heroX','heroClock','heroActionAge'].every(k => nonnegative(s[k])) ||
      !Number.isFinite(s.phaseTime) || (s.completed !== (s.phase === 'complete')) || (s.completed && (s.level !== MAX_LEVEL || s.encounter !== 9))) return freshGame(now);
    if (!Array.isArray(s.enemies) || !s.enemies.length || s.enemies.length > 7 ||
      s.enemies.filter(e=>e.kind==='boss').length !== (s.encounter===9?1:0) ||
      s.enemies.filter(e=>e.kind==='warrior').length > 4 || s.enemies.filter(e=>e.kind==='archer').length > 2 || s.enemies.filter(e=>e.kind==='healer').length > 1 ||
      s.enemies.some(e=>!Object.values(KINDS).includes(e.kind)) ||
      !s.enemies.every((e,i) => e.id === i && ['hp','x','clock','healClock','actionAge','deadTime'].every(k => nonnegative(e[k])) && e.hp <= enemyFor(s.level,e.kind).maxHp)) return freshGame(now);
    for (const e of s.enemies) Object.assign(e, enemyFor(s.level, e.kind), {hp:Math.ceil(e.hp)});
    if ((s.phase === 'walk' || s.phase === 'fight') && !s.enemies.some(e => e.hp > 0)) return freshGame(now);
    const local = (s.level - 1) % LEVELS_PER_BIOME;
    const row = s.level === 1 ? 0 : 1 + Math.floor(local / 5);
    const column = s.level === 1 || s.encounter >= 6 ? s.encounter :
      Math.floor(s.encounter / 3) * 3 + (s.encounter + local + Math.floor((s.level - 1) / LEVELS_PER_BIOME)) % 3;
    if (['walk','fight'].includes(s.phase) && s.enemies.map(e=>e.kind).join(',') !== [...WAVES[row][column]].map(k=>KINDS[k]).join(',')) prepareEncounter(s);
    return s;
  } catch { return freshGame(now); }
}
