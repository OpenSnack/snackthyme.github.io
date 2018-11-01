import * as d3 from 'd3';

import {TableView} from './TableView';
import {BarChartView} from './BarChartView';
import {MapView} from './MapView';
import {SliderView} from './SliderView';
import {TooltipView} from './TooltipView';

export class MagicView {
    constructor(model, container) {
        this.model = model;
        this.container = container;
        this.caption = this.container.select('#caption');

        this._svgSizeMult = 5;
        const mult = this._svgSizeMult;

        const tableSVG = this.viewify(this.container.append('svg').attr('id', 'magic-svg-1'));
        this.tableView = new TableView(model, tableSVG, this);

        const barChartSVG = this.viewify(this.container.append('svg').attr('id', 'magic-svg-2'));
        this.barChartView = new BarChartView(model, barChartSVG, this, {'maskID': this.tableView.textMaskID});

        const mapSVG = this.viewify(this.container.append('svg').attr('id', 'magic-svg-3'));
        this.mapView = new MapView(model, mapSVG, this);

        const sliderDiv = this.viewify(this.container.append('div').attr('id', 'slider'));
        this.sliderView = new SliderView(model, sliderDiv, this);

        const tooltipDiv = this.viewify(this.container.append('div').attr('id', 'tooltip'));
        this.tooltipView = new TooltipView(model, tooltipDiv, this).tag('tooltip');

        this.views = [
            this.tableView,
            this.barChartView,
            this.mapView,
            this.sliderView,
            this.tooltipView
        ];
    }

    init() {
        this.model.addObserver(this);
        this.container.style('height', document.body.clientHeight * this._svgSizeMult + 'px');
        this.views.forEach((view) => {
            view.setHeight(document.body.clientHeight);
            view.init();
        });

        this.views.forEach((view) => {view.ready();});

        window.addEventListener('resize', () => this.update({trigger: 'resize'}));
        window.addEventListener('scroll', () => this.update({trigger: 'scroll'}));
        return this;
    }

    update(params) {
        this.views.forEach((view) => {
            view.setHeight(document.body.clientHeight);
            if (!params.matches || view.matches(params.matches)) {
                view.update(params);
            }
        });
    }

    viewify(selection) {
        // adds some extras to a D3 SVG selection
        selection.width = function() {
            return this.node().clientWidth;
        };

        selection.height = function() {
            return this.node().clientHeight;
        };

        selection.viewportTop = function() {
            return this.node().getBoundingClientRect().top;
        };

        selection.top = function() {
            return window.scrollY + this.node().getBoundingClientRect().top;
        };

        return selection;
    }
}
