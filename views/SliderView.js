import * as d3 from 'd3';
import * as noUiSlider from 'nouislider';

import {View} from './View.js';

export class SliderView extends View {
    constructor(model, container, parent, params) {
        super(model, container, parent);

        this.dims = {
            landscape: {
                width: 0.5,
                scrollTop: 0.6,
                top: 0.8
            },
            portrait: {
                width: 0.9,
                scrollTop: 0.6,
                top: 0.8
            }
        };

        this.thresholds = [
            {name: 'off', calcFunction: null},
            {
                name: 'focused',
                calcFunction: () => document.body.clientHeight * (this.dims[this.orientation()].scrollTop - 0.15)
            },
            {
                name: 'done',
                calcFunction: () => document.body.clientHeight * params.offPoint
            }
        ];

        this._labelParams = {
            text: 'Motivation ➤',
            coords: {
                width: null,
                top: () => this.dims[this.orientation()].top,
                left: () => 0.5 + this.dims[this.orientation()].width / 8
            },
        };

        this.minimum = -100;
        this.maximum = 100;
        this.sliderMult = 0.01;
        this._state = 'off';
    }

    setHeight() {
        return false;
    }

    init(callback) {
        this.slider = noUiSlider.create(this.container.node(), {
            start: [0],
            connect: [true, false],
            range: {
                min: this.minimum,
                max: this.maximum
            },
            pips: {
                mode: 'steps',
                stepped: true,
                density: 4
            }
        });

        this.label = this.parent.container
          .append('span')
            .classed('label', true);

        this.update({});
    }

    ready() {
        this.slider.on('update', () => {
            this.model.setSliderValue(this.slider.get() * this.sliderMult);
        });

        this.slider.on('end', () => {
            this.model.sliderEnded();
        });
    }

    update(params) {
        const {trigger} = params;
        const changed = this.updateState(window.scrollY); // do things that need to know the state AFTER this
        const dims = this.dims[this.orientation()];

        let labelOpacity = this._state === 'focused' ? 0.8 : 0;
        let labelTransition = changed && Object.values(changed).includes('focused');
        let immediate = changed && changed.to === 'done';
        this.setCaption(
            Object.assign(
                {}, this._labelParams,
                {
                    opacity: labelOpacity,
                    transition: labelTransition,
                    immediate: immediate
                }
            ),
            this.label
        );

        const sliderWidth = document.body.clientWidth * dims.width;
        const sliderTop = document.body.clientHeight * dims.top;
        const centerLeftOffset = (document.body.clientWidth - sliderWidth) / 2;

        this.container
            .style('left', centerLeftOffset)
            .style('top', sliderTop)
            .style('width', sliderWidth);

        d3.select(this.slider.target)
          .select('.noUi-connect')
            .style('background-image', this.getConnectGradient());

        if (changed) {
            this.container
                .attr('disabled', this._state !== 'focused' ? true : null)
                .transition()
                .duration(500)
                .style('opacity', this._state !== 'focused' ? 0 : 1);
        }
    }

    getConnectGradient() {
        let sliderValue = this.slider.get();
        let inter = d3.interpolateRgb('rgba(255, 255, 255, 0.6)', 'rgba(134, 0, 216, 0.6)');
        let interPurple = inter((this.slider.get() - this.minimum) / (this.maximum - this.minimum));

        return `linear-gradient(to right, rgba(255, 255, 255, 0.6), ${interPurple})`;
    }
}
