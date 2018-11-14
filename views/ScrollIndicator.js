import * as d3 from 'd3';

import {View} from './View.js';

export class ScrollIndicator extends View {
    constructor(model, container, parent, points) {
        super(model, container, parent);

        this.points = points;
    }

    init(callback) {
        this.buildRects();
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

        this.pointMasks
            .attr('x', 0)
            .attr('y', (d) => typeof d.point === 'function' ? d.point() : d.point);
    }

    buildRects() {
        const defs = this.container
          .append('defs');

        this.pointRects = this.container
          .selectAll('rect.svg-scroll-point')
          .data(this.points)
          .enter()
          .append('rect')
            .classed('svg-scroll-point', true)
            .classed('point-major', (d) => d.major);

        defs
          .append('pattern')
            .attr('id', 'svg-scroll-line-pattern')
            .attr('width', '5')
            .attr('height', '15')
            .attr('patternUnits', 'userSpaceOnUse')
          .append('rect')
            .attr('id', 'svg-scroll-line-dotted')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 5)
            .attr('height', 10);

        defs
          .append('mask')
            .attr('id', 'svg-scroll-point-mask')
            .attr('maskContentUnits', 'userSpaceOnUse')
          .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'white');

        this.pointMasks = defs
          .select('mask')
          .selectAll('rect.svg-scroll-point-mask-rect')
          .data(this.points)
          .enter()
          .append('rect')
            .classed('svg-scroll-point-mask-rect', true)
            .classed('point-major', (d) => d.major);

        this.line = this.container
          .append('rect')
            .classed('svg-scroll-line', true)
            .attr('x', '40%')
            .attr('y', 0)
            .attr('width', '20%')
            .attr('height', '100%')
            .attr('fill', 'url(#svg-scroll-line-pattern)')
            .attr('mask', 'url(#svg-scroll-point-mask)');
        }
}
