import * as d3 from 'd3';

import {View} from './View.js';

export class ScrollIndicator extends View {
    constructor(model, container, parent, points) {
        super(model, container, parent);

        this.points = points;

        // because Firefox doesn't adhere to SVG2
        this.mediaRules = {
            landscape: [
                {
                    minWidth: 2561,
                    containerWidth: 30,
                    rectSize: 22,
                    strokeWidth: 8,
                    maskSize: 30
                },
                {
                    minWidth: 0,
                    containerWidth: 20,
                    rectSize: 14,
                    strokeWidth: 6,
                    maskSize: 20
                }
            ],
            portrait: [
                {
                    minWidth: 1025,
                    containerWidth: 30,
                    rectSize: 22,
                    strokeWidth: 8,
                    maskSize: 30
                },
                {
                    minWidth: 0,
                    containerWidth: 20,
                    rectSize: 14,
                    strokeWidth: 6,
                    maskSize: 20
                }
            ]
        };
    }

    init(callback) {
        Object.keys(this.mediaRules).forEach((ori) => {
            this.mediaRules[ori].sort((a, b) => b.minWidth - a.minWidth);
        });

        this.buildDefs();
        this.buildRects();
    }

    update(params) {
        this.pointRects.sort((a, b) => this.pointY(a) - this.pointY(b));
        const activeIndex = this.activeIndex();

        this.container.style('height', this.parent.bodyHeight());
        this.container
          .select('#svg-scroll-line-cutoff')
            .attr('y', this.pointY(this.pointRects.data().slice(-1)[0]));

        const pattern = this.container.select('#svg-scroll-line-pattern');
        const patternRect = pattern.select('rect');
        const patternRectHeight = this.container.node().getBoundingClientRect().width;

        pattern.attr('height', patternRectHeight);
        patternRect.attr('height', patternRectHeight * 2 / 3);

        // add 3 for difference between mask and rect with stroke
        this.pointRects
            .attr('x', 3)
            .attr('y', (d) => this.pointY(d) + 3)
            .style('fill', (d, i) => i === activeIndex ? null : 'rgba(255, 255, 255, 0)');

        this.pointMasks
            .attr('x', 0)
            .attr('y', this.pointY);

        this.setSizes();
    }

    setHeight() {}

    setSizes() {
        const rules = this.mediaRules[this.orientation()].find((r) => {
            return document.body.clientWidth >= r.minWidth;
        });

        this.container.style('width', `${rules.containerWidth}px`);

        this.container
          .selectAll('.svg-scroll-point')
            .attr('width', rules.rectSize)
            .attr('height', rules.rectSize)
            .style('stroke-width', `${rules.strokeWidth}px`);

        this.container
          .select('#svg-scroll-point-mask')
          .selectAll('.svg-scroll-point-mask-rect')
            .attr('width', rules.maskSize)
            .attr('height', rules.maskSize);
    }

    pointY(d) {
        return typeof d.displayPoint === 'function' ? d.displayPoint() : d.displayPoint;
    }

    pointOn(d) {
        return typeof d.onPoint === 'function' ? d.onPoint() : d.onPoint;
    }

    activeIndex() {
        const points = this.pointRects;
        let subtr = points.data().length - 1;
        let i = points.data().slice().reverse().findIndex((y) => window.scrollY >= this.pointOn(y));
        if (i === -1) {return 0;}
        return subtr - i;
    }

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
            .attr('height', '99999px')
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
