// Übersicht aller Module
import notenwerte from './m1-notenwerte.js';
import rhythmus from './m2-rhythmus.js';
import vorzeichen from './m3-vorzeichen.js';
import tonleitern from './m4-tonleitern.js';
import intervalle from './m5-intervalle.js';
import akkorde from './m6-akkorde.js';

export const MODULES = [notenwerte, rhythmus, vorzeichen, tonleitern, intervalle, akkorde];

export const byId = (id) => MODULES.find((m) => m.id === id);
