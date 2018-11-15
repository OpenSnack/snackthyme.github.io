import * as d3 from 'd3';

import {View} from './View.js';

export class ScrollIndicator extends View {
    constructor(model, container, parent, points) {
        super(model, container, parent);

        this.points = points;
    }

    init(callback) {
        this.buildDefs();
        this.buildRects();
    }

    update(params) {
        function setY(d) {
            return typeof d.point === 'function' ? d.point() : d.point;
        }

        this.container.style('height', this.parent.bodyHeight());
        this.container
          .select('#svg-scroll-line-cutoff')
            .attr('y', setY(this.pointRects.data().slice(-1)[0]));

        const pattern = this.container.select('#svg-scroll-line-pattern');
        const patternRect = pattern.select('rect');
        const patternRectHeight = Math.round(patternRect.node().getBBox().width * 2);

        pattern.attr('height', patternRectHeight * 1.5);
        patternRect.attr('height', patternRectHeight);

        this.pointRects
            .attr('x', 0)
            .attr('y', setY);

        this.pointMasks
            .attr('x', 0)
            .attr('y', setY);
    }

    setHeight() {}

    buildDefs() {
        const defs = this.container
          .append('defs');

        defs
          .append('pattern')
            .attr('id', 'svg-scroll-line-pattern')
            .attr('width', '100%')
            .attr('height', '1%')
            .attr('patternUnits', 'userSpaceOnUse')
          .append('rect')
            .attr('id', 'svg-scroll-line-dotted')
            .attr('x', '33%')
            .attr('y', 0)
            .attr('width', '33%')
            .attr('height', 10);

        const mask = defs
          .append('mask')
            .attr('id', 'svg-scroll-point-mask')
            .attr('maskContentUnits', 'userSpaceOnUse');

        mask.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'white');

        mask.append('rect')
            .attr('id', 'svg-scroll-line-cutoff')
            .attr('x', 0)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'black');

        this.pointMasks = defs
          .select('mask')
          .selectAll('rect.svg-scroll-point-mask-rect')
          .data(this.points)
          .enter()
          .append('rect')
            .classed('svg-scroll-point-mask-rect', true)
            .classed('point-major', (d) => d.major);
    }

    buildRects() {
        this.pointRects = this.container
          .selectAll('rect.svg-scroll-point')
          .data(this.points)
          .enter()
          .append('rect')
            .classed('svg-scroll-point', true)
            .classed('point-major', (d) => d.major);

        this.line = this.container
          .append('rect')
            .classed('svg-scroll-line', true)
            .attr('x', '33%')
            .attr('y', 0)
            .attr('width', '33%')
            .attr('height', '100%')
            .attr('fill', 'url(#svg-scroll-line-pattern)')
            .attr('mask', 'url(#svg-scroll-point-mask)');
    }
}
