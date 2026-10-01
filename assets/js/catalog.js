// Treasure Drop — product catalog shown inside the machines and in the pricing tables.
//
// PRICING IS EXAMPLE DATA. Edit `price` (what the machine charges) and `cost`
// (what Treasure Drop pays per unit) here; margin and profit are calculated
// from them everywhere on the site.
//   msrp: true  -> price is the published US MSRP at release
//   msrp: false -> price is an example figure, confirm before launch
// Every `cost` is an example wholesale figure, not a real quote.
export const CATALOG = [
  // booster packs
  { id: 'pack-me2', type: 'pack', name: 'Phantasmal Flames Booster Pack', set: 'Mega Evolution: Phantasmal Flames', img: 'pack-me2.jpg', contents: '10 cards per pack', price: 4.49, cost: 3.1, msrp: true },
  { id: 'pack-me1', type: 'pack', name: 'Mega Evolution Booster Pack', set: 'Mega Evolution', img: 'pack-me1.jpg', contents: '10 cards per pack', price: 4.49, cost: 3.1, msrp: true },
  { id: 'pack-sv9', type: 'pack', name: 'Journey Together Booster Pack', set: 'Scarlet & Violet: Journey Together', img: 'pack-sv9.jpg', contents: '10 cards per pack', price: 4.49, cost: 3.1, msrp: true },
  { id: 'pack-sv8', type: 'pack', name: 'Surging Sparks Booster Pack', set: 'Scarlet & Violet: Surging Sparks', img: 'pack-sv8.jpg', contents: '10 cards per pack', price: 4.49, cost: 3.1, msrp: true },
  // sleeved boosters and single-pack blisters (hang-card products)
  { id: 'sleeved-sv10', type: 'sleeved', name: 'Destined Rivals Sleeved Booster', set: 'Scarlet & Violet: Destined Rivals', img: 'sleeved-sv10.jpg', contents: '1 booster pack in a retail sleeve', price: 4.99, cost: 3.45, msrp: false },
  { id: 'blister-me1', type: 'sleeved', name: 'Mega Evolution Single Pack Blister', set: 'Mega Evolution', img: 'blister-me1.jpg', contents: '1 booster pack, promo card, coin', price: 5.99, cost: 4.15, msrp: false },
  { id: 'blister-sv9', type: 'sleeved', name: 'Journey Together Single Pack Blister', set: 'Scarlet & Violet: Journey Together', img: 'blister-sv9.jpg', contents: '1 booster pack, promo card, coin', price: 5.99, cost: 4.15, msrp: false },
  // booster bundles
  { id: 'bundle-me2', type: 'bundle', name: 'Phantasmal Flames Booster Bundle', set: 'Mega Evolution: Phantasmal Flames', img: 'bundle-me2.jpg', contents: '6 booster packs', price: 26.94, cost: 19.4, msrp: true },
  { id: 'bundle-me1', type: 'bundle', name: 'Mega Evolution Booster Bundle', set: 'Mega Evolution', img: 'bundle-me1.jpg', contents: '6 booster packs', price: 26.94, cost: 19.4, msrp: true },
  { id: 'bundle-sv10', type: 'bundle', name: 'Destined Rivals Booster Bundle', set: 'Scarlet & Violet: Destined Rivals', img: 'bundle-sv10.jpg', contents: '6 booster packs', price: 26.94, cost: 19.4, msrp: true },
  // tins
  { id: 'tin-charizard-x', type: 'tin', name: 'Mega Charizard X ex Tin', set: 'Mega Evolution', img: 'tin-charizard-x.jpg', contents: '4 booster packs, foil promo card', price: 26.99, cost: 19.0, msrp: false },
  { id: 'tin-charizard-y', type: 'tin', name: 'Mega Charizard Y ex Tin', set: 'Mega Evolution', img: 'tin-charizard-y.jpg', contents: '4 booster packs, foil promo card', price: 26.99, cost: 19.0, msrp: false },
  { id: 'tin-rocket-mewtwo', type: 'tin', name: "Team Rocket's Mewtwo ex Tin", set: 'Scarlet & Violet: Destined Rivals', img: 'tin-rocket-mewtwo.jpg', contents: '5 booster packs, foil promo card', price: 29.99, cost: 21.5, msrp: false },
  // Elite Trainer Boxes
  { id: 'etb-me2', type: 'etb', name: 'Phantasmal Flames Elite Trainer Box', set: 'Mega Evolution: Phantasmal Flames', img: 'etb-me2.jpg', contents: '9 booster packs, promo card, sleeves, dice', price: 49.99, cost: 36.0, msrp: true },
  { id: 'etb-me1', type: 'etb', name: 'Mega Evolution Elite Trainer Box', set: 'Mega Evolution', img: 'etb-me1.jpg', contents: '9 booster packs, promo card, sleeves, dice', price: 49.99, cost: 36.0, msrp: true },
  { id: 'etb-sv10', type: 'etb', name: 'Destined Rivals Elite Trainer Box', set: 'Scarlet & Violet: Destined Rivals', img: 'etb-sv10.jpg', contents: '9 booster packs, promo card, sleeves, dice', price: 49.99, cost: 36.0, msrp: true },
  { id: 'etb-prismatic', type: 'etb', name: 'Prismatic Evolutions Elite Trainer Box', set: 'Scarlet & Violet: Prismatic Evolutions', img: 'etb-prismatic.jpg', contents: '9 booster packs, promo card, sleeves, dice', price: 49.99, cost: 36.0, msrp: true },
  { id: 'etb-sv9', type: 'etb', name: 'Journey Together Elite Trainer Box', set: 'Scarlet & Violet: Journey Together', img: 'etb-sv9.jpg', contents: '9 booster packs, promo card, sleeves, dice', price: 49.99, cost: 36.0, msrp: true },
  // collection boxes
  { id: 'coll-lucario', type: 'collection', name: 'Mega Lucario ex Premium Figure Collection', set: 'Mega Evolution', img: 'coll-lucario.jpg', contents: '5 booster packs, figure, foil promo cards', price: 39.99, cost: 28.5, msrp: false },
  { id: 'coll-venusaur', type: 'collection', name: 'Mega Venusaur ex Premium Collection', set: 'Mega Evolution', img: 'coll-venusaur.jpg', contents: 'Booster packs and foil promo cards', price: 49.99, cost: 36.0, msrp: false },
];

export const itemsOf = (type) => CATALOG.filter((i) => i.type === type);
export const profit = (i) => i.price - i.cost;
export const margin = (i) => Math.round(((i.price - i.cost) / i.price) * 100);
export const money = (n) => '$' + n.toFixed(2);
