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

        this.svg.width = function() {
            return this.node().clientWidth;
        };

        this.svg.height = function() {
            return this.node().clientHeight;
        };

        this.tableView = new TableView(model, this.svg);
        this.barChartView = new BarChartView(model, this.svg);
        this.mapView = new MapView(model, this.svg);
        this.multiChartView = new MultiChartView(model, this.svg);

        this.viewOrder = [
            {view: this.tableView, scrollDown: null, scrollUp: this.barChartToTable},
            {view: this.barChartView, scrollDown: this.tableToBarChart, scrollUp: this.mapToBarChart},
            {view: this.mapView, scrollDown: this.barChartToMap, scrollUp: this.multiChartToMap},
            {view: this.multiChartView, scrollDown: this.mapToMultiChart, scrollUp: null}
        ];

        this.captions = [
            {text: 'Data looks lame at first glance.', coords: {width: 0.7, top: 0.25, left: 0.15}},
            {},
            {},
            {}
        ];

        this.model.setNumViews(this.viewOrder.length);
        this._currentView = 0;
    }

    init() {
        this.model.addObserver(this);
        this.tableView.enter('top');
        this.setCaption();

        window.addEventListener('resize', this.refreshView.bind(this));
        return this;
    }

    refreshView() {
        this.setCaption();
        this.viewOrder[this._currentView].view.update();
    }

    update(params) {
        // scroll in the next requested view according to the model
        const newIndex = this.model.viewIndex;
        if (newIndex > this._currentView) {
            this.viewOrder[newIndex]['scrollDown']();
        } else if (newIndex < this._currentView) {
            this.viewOrder[newIndex]['scrollUp']();
        }
    }

    setCaption() {
        const params = this.captions[this._currentView];
        this.caption
            .style('width', params.coords.width * window.innerWidth + 'px')
            .style('top', params.coords.top * window.innerHeight + 'px')
            .style('left', params.coords.left * window.innerWidth + 'px')
            .text(params.text);
    }

    tableToBarChart() {

    }

    barChartToTable() {

    }

    barChartToMap() {

    }

    mapToBarChart() {

    }

    mapToMultiChart() {

    }

    multiChartToMap() {

    }
}
