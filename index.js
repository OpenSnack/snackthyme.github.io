import * as d3 from 'd3';

import {TableView} from './views/TableView.js';
import {BarChartView} from './views/BarChartView.js';
import {MapView} from './views/MapView.js';
import {MagicView} from './views/MagicView.js';
import {Model} from './Model.js';

const container = d3.select('#magic-container');

const model = new Model();

window.magic = new MagicView(model, d3.select('#magic-container')).init();
