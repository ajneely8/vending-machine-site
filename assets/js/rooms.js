// Treasure Drop — placement mockups for the "Your Space. Our Machine." viewer.
// Each location is a photoreal backdrop (assets/img/places/<id>.jpg) with the live
// 3D machine and cut-out people composited in front of it. The backdrops and the
// people are AI-generated: no real stores, no real customers.
import * as THREE from 'three';
import { cutout } from './machine.js';

export const ROOMS = [
  { id: 'mall', name: 'Shopping malls', machine: 'xl', light: 'daylight', people: ['adult', 'kid'], note: 'Concourses and corridors, where shoppers already slow down.' },
  { id: 'arcade', name: 'Arcades', machine: 'standard', light: 'arcade', people: ['kid'], note: 'Sits naturally in a row of cabinets and prize machines.' },
  { id: 'theater', name: 'Movie theaters', machine: 'xl', light: 'showroom', people: ['adult', 'kid'], note: 'Lobby placement gives guests something to do before the show.' },
  { id: 'fec', name: 'Family entertainment centers', machine: 'xl', light: 'showroom', people: ['adult', 'kid'], note: 'A natural stop between attractions for kids and parents.' },
  { id: 'gamestore', name: 'Game stores', machine: 'standard', light: 'showroom', people: ['adult'], note: 'Extends your card selection without tying up counter staff.' },
  { id: 'cardshop', name: 'Card shops', machine: 'compact', light: 'daylight', people: ['adult'], note: 'Sealed product on demand, right next to your singles case.' },
  { id: 'barbershop', name: 'Barbershops', machine: 'compact', light: 'daylight', people: ['kid'], note: 'Something for the kids, and the collectors, in the waiting chairs.' },
  { id: 'restaurant', name: 'Restaurants', machine: 'compact', light: 'showroom', people: ['adult', 'kid'], note: 'Near the entrance or host stand, where families wait for a table.' },
  { id: 'retail', name: 'Retail stores', machine: 'standard', light: 'daylight', people: ['adult'], note: 'Front-of-store placement near the registers or the exit.' },
  { id: 'sports', name: 'Sports facilities', machine: 'standard', light: 'daylight', people: ['kid'], note: 'Lobby and concession areas, for the stretch between games.' },
  { id: 'indoor', name: 'Indoor entertainment venues', machine: 'xl', light: 'arcade', people: ['adult', 'kid'], note: 'Bowling, trampoline parks, skating rinks. Anywhere groups gather.' },
  { id: 'waiting', name: 'High-traffic waiting areas', machine: 'compact', light: 'daylight', people: ['adult'], note: 'Turns idle minutes into a reason to walk over and look.' },
];

export const placeImage = (room) => `assets/img/places/${room.id}.jpg`;

const PEOPLE = { adult: { src: 'assets/img/places/person-adult.png', height: 1.8 }, kid: { src: 'assets/img/places/person-kid.png', height: 1.4 } };
// people are unlit photo cut-outs, so tint them to sit in each scene's light
const TINT = { daylight: 0xffffff, showroom: 0xd6d2cc, arcade: 0x8d82b8 };

let peopleReady;
export function loadPeople() {
  return peopleReady || (peopleReady = Promise.all(Object.entries(PEOPLE).map(([key, p]) => new Promise((res) => {
    const im = new Image();
    im.onload = () => {
      const art = cutout(im, 1024);
      p.map = new THREE.CanvasTexture(art);
      p.map.colorSpace = THREE.SRGBColorSpace; p.map.anisotropy = 4;
      p.aspect = art.width / art.height;
      res();
    };
    im.onerror = res;
    im.src = p.src;
  }))));
}

let shadowMap;
function shadow(w, d, x, z, opacity) {
  if (!shadowMap) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(0.55, 'rgba(0,0,0,.55)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    shadowMap = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.004, z);
  return m;
}

// dims = the machine's { W, D }; the machine stands at the origin facing +z
export function buildRoom(room, dims) {
  const g = new THREE.Group(), dark = room.light === 'arcade' ? 0.75 : 0.5;
  g.add(shadow(dims.W * 1.7, dims.D * 2.0, 0, 0.08, dark));
  room.people.forEach((key, i) => {
    const p = PEOPLE[key];
    if (!p.map) return;
    const w = p.height * p.aspect;
    // adult stands beside the machine; a kid stands a step closer to the glass
    const x = dims.W / 2 + (key === 'kid' ? (room.people.length > 1 ? 0.28 : 0.42) : room.people.length > 1 ? 0.95 : 0.6);
    const z = dims.D / 2 + (key === 'kid' ? 0.55 : 0.2) + i * 0.01;
    const body = new THREE.Mesh(new THREE.PlaneGeometry(w, p.height), new THREE.MeshBasicMaterial({ map: p.map, alphaTest: 0.5, color: TINT[room.light] }));
    body.position.set(x, p.height / 2, z);
    g.add(body, shadow(w * 1.1, 0.5, x, z, dark * 0.9));
  });
  return g;
}

export function disposeRoom(g) {
  g.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
}
