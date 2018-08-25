import * as d3 from 'd3';

import {TableView} from './views/TableView.js';
import {BarChartView} from './views/BarChartView.js';
import {MapView} from './views/MapView.js';
import {MagicView} from './views/MagicView.js';
import {Model} from './Model.js';

const container = d3.select('#magic-container');

const model = new Model();

new MagicView(
    model,
    [
        new TableView(model, container.append('svg').attr('id', 'table-svg')),
        new BarChartView(model, container.append('svg').attr('id', 'bar-chart-svg')),
        new MapView(model, container.append('svg').attr('id', 'map-svg'))
    ],
    d3.select('#magic-container')
).init();
