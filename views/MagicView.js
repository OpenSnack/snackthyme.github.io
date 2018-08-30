import * as d3 from 'd3';
import {MultiChartView} from './MultiChartView';
import {TableView} from './TableView';
import {BarChartView} from './BarChartView';
import {MapView} from './MapView';

export class MagicView {
    constructor(model, container) {
        this.model = model;
        this.container = container;
        const svg = this.container
                        .append('svg')
                          .attr('id', 'magic-svg');
        this.viewOrder = [
            {view: new TableView(model, svg), scrollDown: null, scrollUp: this.barChartToTable},
            {view: new BarChartView(model, svg), scrollDown: this.tableToBarChart, scrollUp: this.mapToBarChart},
            {view: new MapView(model, svg), scrollDown: this.barChartToMap, scrollUp: this.multiChartToMap},
            {view: new MultiChartView(model, svg), scrollDown: this.mapToMultiChart, scrollUp: null}
        ];
        this.model.setNumViews(this.viewOrder.length);
        this._currentView = 0;
    }

    init() {
        this.model.addObserver(this);
        this.initTable();
        return this;
    }

    update(params) {
        // scroll in the next requested view according to the model
        const newIndex = his.model.viewIndex;
        if (newIndex > this._currentView) {
            this.viewOrder[newIndex]['scrollDown']();
        } else if (newIndex < this._currentView) {
            this.viewOrder[newIndex]['scrollUp']();
        }
    }

    initTable() {

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
