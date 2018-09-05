import * as d3 from 'd3';

import {View} from './View.js';

export class TableView extends View {
    constructor(model, svg) {
        super(model, svg);

        this.dims = {
            landscape: {
                width: 0.5,
                height: 0.8,
                top: 0.5
            },
            portrait: {
                width: 0.9,
                height: 0.8,
                top: 0.5
            }
        };
    }

    enter(fromLocation, callback) {
        const dims = this.dims[this.orientation()];

        this.table = this.svg
          .append('g')
            .attr('id', 'svg-table')
            .attr('transform', 'translate(0,' + (dims.top * this.svg.attr('height')) + ')');

        this.header = this.table.append('g');
        this.rows = this.table.append('g');

        this.update();
    }

    update() {
        var table = this;

        const dims = this.dims[this.orientation()];
        const numCols = this.model.data.columns.length;
        const numRows = this.model.data.length;
        const tableWidth = this.svg.attr('width') * dims.width;
        const tableHeight = this.svg.attr('height') * dims.height;
        const centerLeftOffset = (this.svg.attr('width') - tableWidth) / 2;

        function drawRow(data, className, group, isHeader) {
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
                .attr('y', 0)
                .attr('width', tableWidth / numCols)
                .attr('height', tableHeight / numRows);

            // cell content
            cols
              .append('text')
                .classed(className + '-text', true)
                // left side of cell box plus a bit
                .attr('x', (d, i) => centerLeftOffset + tableWidth / numCols * (i + 0.1))
                // vertical center of cell box
                .attr('y', tableHeight / numRows / 2)
                .text((d) => d);
        }

        const header = drawRow(this.model.data.columns, 'svg-table-header', this.header, true);

    }
}
