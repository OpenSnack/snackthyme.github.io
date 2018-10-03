import * as d3 from 'd3';

import {MagicView} from './views/MagicView.js';
import {Model} from './Model.js';

const container = d3.select('#magic-container');

const model = new Model();
model.loadData('data.csv', 'states.geojson', () => {
    window.magic = new MagicView(model, d3.select('#magic-container')).init();
});
window.d3 = d3;
