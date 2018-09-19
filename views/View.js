export class View {
    constructor(model, svg, container) {
        this.model = model;
        this.svg = svg;
        this.container = container;
    }

    init(callback) {

    }

    update(scrollY) {
        // do something with model data and put results into svg
    }

    orientation() {
        return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
    }

    setCaption(params) {
        this.caption
            .style('width', params.coords.width * window.innerWidth + 'px')
            .style('top', params.coords.top * window.innerHeight + 'px')
            .style('left', params.coords.left * window.innerWidth + 'px')
            .style('opacity', typeof params.opacity !== 'undefined' ? params.opacity : 1)
            .text(params.text);
    }
}
