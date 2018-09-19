import * as d3 from 'd3';

import {MultiChartView} from './MultiChartView';
import {TableView} from './TableView';
import {BarChartView} from './BarChartView';
import {MapView} from './MapView';

export class MagicView {
    constructor(model, container) {
        this.model = model;
        this.container = container;
        this.svg = this.container
          .append('svg')
            .attr('id', 'magic-svg');
        this.caption = this.container.select('#caption');

        this._svgSizeMult = 5;
        const mult = this._svgSizeMult;

        this.svg.width = function() {
            return this.node().clientWidth;
        };

        this.svg.totalHeight = function() {
            return this.node().clientHeight;
        };

        this.svg.screenHeight = function() {
            return this.node().clientHeight / mult;
        };

        this.tableView = new TableView(model, this.svg, this);
        this.barChartView = new BarChartView(model, this.svg, this);
        this.mapView = new MapView(model, this.svg, this);
        this.multiChartView = new MultiChartView(model, this.svg, this);

        this.views = [
            this.tableView,
            this.barChartView,
            this.mapView,
            this.multiChartView
        ];

        this.model.setNumViews(this.views.length);
        this._currentView = 0;
    }

    init() {
        this.model.addObserver(this);
        this.svg.attr('height', window.innerHeight * this._svgSizeMult + 'px');
        this.views.forEach((view) => {view.init();});

        window.addEventListener('resize', this.refreshView.bind(this));
        window.addEventListener('scroll', this.refreshView.bind(this));
        return this;
    }

    refreshView() {
        this.svg.attr('height', window.innerHeight * this._svgSizeMult + 'px');
        this.views[this._currentView].update(window.scrollY);
    }
}
