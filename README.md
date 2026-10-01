# Treasure Drop

One-page site for Treasure Drop, a Pokémon card vending machine company. It shows the machines, the products they stock, and how a business can request one.

## Run it

It is a static site with no build step. Serve the folder with any static server:

```bash
npx serve .
```

The 3D machine uses Three.js loaded from a CDN, so it needs an internet connection.

## Where things live

- `index.html`: the whole page. `why.html` and `request.html` only redirect to its sections.
- `assets/js/machine.js`: the 3D machines. Sizes and shelf counts are in `MACHINES` and `PRODUCTS` (preliminary estimates).
- `assets/js/catalog.js`: products, prices and unit costs. Costs are example figures.
- `assets/js/one.js`: the scroll chapters and camera moves.
- `assets/js/request.js`: the request form. Add a Web3Forms key to `WEB3FORMS_KEY` to make it send.
- `assets/img/places/`: location scenes and people (AI-generated).
- `assets/img/products/`: product photos.
