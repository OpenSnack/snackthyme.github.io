import * as d3 from 'd3';

import {View} from './View.js';

export class TableView extends View {
    constructor(model, svg) {
        super(model, svg);

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
                stop1: 'rgba(48,207,208,0.9)',
                stop2: 'rgba(48,207,208,0.9)'
            },
            {
                id: 'svg-table-content-gradient',
                stop1: 'rgba(221,241,249,1)',
                stop2: 'rgba(160,216,239,1)'
            }
        ];
    }

    enter(fromLocation, callback) {
        const dims = this.dims[this.orientation()];

        this.table = this.svg
          .append('g')
            .attr('id', 'svg-table')
            .attr('transform', 'translate(0,' + (dims.top * this.svg.height()) + ')');

        this.buildGradients();

        this.header = this.table.append('g');
        this.rows = this.table.append('g');

        this.update();
    }

    update() {
        var table = this;

        const dims = this.dims[this.orientation()];
        const numCols = this.model.data.columns.length;
        const numRows = this.model.data.length;
        const tableWidth = this.svg.width() * dims.width;
        const tableHeight = this.svg.height() * dims.height;
        const centerLeftOffset = (this.svg.width() - tableWidth) / 2;

        function drawRow(data, rowIndex, className, group) {
            var cols = group
              .selectAll('g')
              .data(data)
              .enter()
              .append('g');

            // cell box
            cols
              .append('rect')
                .classed(className, true)
                // starting X offset given that the table is in the center
                .attr('x', (d, i) => centerLeftOffset + tableWidth / numCols * i)
                // table row offset, where header is -1
                .attr('y', tableHeight / numRows * (rowIndex + 1))
                .attr('width', tableWidth / numCols)
                .attr('height', tableHeight / numRows);

            // cell content
            cols
              .append('text')
                .classed(className + '-text', true)
                // left side of cell box plus a bit
                .attr('x', (d, i) => centerLeftOffset + tableWidth / numCols * (i + 0.1))
                // vertical center of cell box
                .attr('y', tableHeight / numRows * (rowIndex + 1.5))
                .text((d) => d);

            return cols;
        }

        const header = drawRow(this.model.data.columns, -1, 'svg-table-header', this.header);
        header.selectAll('rect').attr('fill', 'url(#svg-table-header-gradient)');

        // row background
        this.rows
          .append('rect')
            .attr('x', centerLeftOffset)
            .attr('y', tableHeight / numRows)
            .attr('width', tableWidth)
            .attr('height', tableHeight - tableHeight / numRows)
            .attr('fill', 'url(#svg-table-content-gradient)');

        // rows
        this.model.data.forEach((rowDict, rowIndex) => {
            let rowData = this.model.data.columns.map((colName) => rowDict[colName]);
            drawRow(rowData, rowIndex, 'svg-table-row', this.rows.append('g'));
        });
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
