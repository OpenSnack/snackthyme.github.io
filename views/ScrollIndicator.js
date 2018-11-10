import * as d3 from 'd3';

import {View} from './View.js';

export class ScrollIndicator extends View {
    constructor(model, container, parent, points) {
        super(model, container, parent);

        this.points = points;
    }

    init(callback) {
        this.line = this.container
          .append('line')
            .classed('svg-scroll-line', true)
            .attr('x1', '50%')
            .attr('x2', '50%')
            .attr('y1', 0)
            .attr('y2', '100%');

        this.pointRects = this.container
          .selectAll('rect.svg-scroll-point')
          .data(this.points)
          .enter()
          .append('rect')
            .classed('svg-scroll-point', true)
            .classed('point-major', (d) => d.major);
    }

    update(params) {
        this.container.style('height', this.parent.bodyHeight());
        this.line
            .attr('x', 5)
            .attr('y', 0)
            .attr('width', 5);

        this.pointRects
            .attr('x', 0)
            .attr('y', (d) => typeof d.point === 'function' ? d.point() : d.point);
    }
}
