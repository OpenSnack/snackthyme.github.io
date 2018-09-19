import * as d3 from 'd3';

import {View} from './View.js';

export class TableView extends View {
    constructor(model, svg, parent) {
        super(model, svg, parent);

        this.dims = {
            landscape: {
                width: 0.5,
                height: 0.7,
                top: 0.5
            },
            portrait: {
                width: 0.9,
                height: 0.7,
                top: 0.5
            }
        };

        // can't ever decide how many gradients I want so this is staying for now
        this.gradients = [
            {
                id: 'svg-table-header-gradient',
                stop1: 'rgb(245, 113, 67)',
                stop2: 'rgb(245, 113, 67)'
            },
            {
                id: 'svg-table-content-gradient',
                stop1: 'rgba(255,255,255,0.2)',
                stop2: 'rgba(255,255,255,0.2)'
            }
        ];

        this._captionParams = {
            text: 'Data looks lame at first glance.',
            coords: {
                width: 0.7,
                top: 0.25,
                left: 0.15
            }
        };
    }

    init(callback) {
        const dims = this.dims[this.orientation()];

        this.table = this.svg
          .append('g')
            .attr('id', 'svg-table');

        this.caption = this.parent.container
          .append('span')
            .classed('caption', true);

        this.buildGradients();

        this.header = this.table.append('g');
        this.rows = this.table.append('g');
        // content background
        this.rows
              .append('rect')
                .classed('svg-table-content-background', true);
        // content rows
        this.model.data.forEach((rowDict) => {
            this.rows.append('g')
                .classed('row-group', true);
        });

        this.update();
    }

    update(scrollY) {
        if (!scrollY) {scrollY = 0;}
        var tableView = this;

        let capOpacity = this.captionOpacity(scrollY);
        this.setCaption(Object.assign({}, this._captionParams, {opacity: capOpacity}));

        const dims = this.dims[this.orientation()];
        this.table.attr('transform', 'translate(0,' + (dims.top * this.svg.screenHeight()) + ')');

        const numCols = this.model.data.columns.length;
        const numRows = this.model.data.length;
        const tableWidth = this.svg.width() * dims.width;
        const tableHeight = this.svg.screenHeight() * dims.height;
        const centerLeftOffset = (this.svg.width() - tableWidth) / 2;

        function drawRow(data, rowIndex, className, group) {
            const entering = group
              .selectAll('g')
              .data(data)
              .enter()
              .append('g')
              .classed('cell-group', true);

            // cell box
            entering
              .append('rect')
                .classed(className, true);

            // cell content
            entering
              .append('text')
                .classed(className + '-text', true);

            group
              .selectAll(`.${className}`)
                // starting X offset given that the table is in the center
                .attr('x', (d, i) => centerLeftOffset + tableWidth / numCols * i)
                // table row offset, where header is -1
                .attr('y', tableHeight / numRows * (rowIndex + 1))
                .attr('width', tableWidth / numCols)
                .attr('height', tableHeight / numRows);

            group
              .selectAll(`.${className}-text`)
                // left side of cell box plus a bit
                .attr('x', (d, i) => centerLeftOffset + tableWidth / numCols * (i + 0.1))
                // vertical center of cell box
                .attr('y', tableHeight / numRows * (rowIndex + 1.5))
                .text((d) => d);

            return group.selectAll('.cell-group');
        }

        const header = drawRow(this.model.data.columns, -1, 'svg-table-header', this.header);
        header.selectAll('rect').attr('fill', 'url(#svg-table-header-gradient)');

        // move content background into place
        this.rows
          .select('.svg-table-content-background')
            .attr('x', centerLeftOffset)
            .attr('y', tableHeight / numRows)
            .attr('width', tableWidth)
            .attr('height', tableHeight)
            .attr('fill', 'url(#svg-table-content-gradient)');

        // draw rows
        this.rows.selectAll('g.row-group').each(function(d, i) {
            let rowDict = tableView.model.data[i];
            let rowData = tableView.model.data.columns.map((colName) => rowDict[colName]);
            drawRow(rowData, i, 'svg-table-row', d3.select(this));
        });
    }

    captionOpacity(scrollY) {
        let zeroPoint = this._captionParams.coords.top * this.svg.screenHeight();
        let scrollDiff = zeroPoint - scrollY;
        if (scrollDiff < 0) return 0;

        return scrollDiff / zeroPoint;
    }

    buildGradients() {
        const defs = this.table.append('defs');

        this.gradients.forEach((spec) => {
            const gradient = defs
              .append('linearGradient')
                .attr('id', spec.id)
                .attr('x1', '0%')
                .attr('x2', '0%')
                .attr('y1', '0%')
                .attr('y2', '100%');
            gradient
              .append('stop')
                .attr('offset', '0%')
                .attr('stop-color', spec.stop1);
            gradient
              .append('stop')
                .attr('offset', '100%')
                .attr('stop-color', spec.stop2);
        });
    }
}
