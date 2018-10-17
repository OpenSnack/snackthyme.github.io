import * as d3 from 'd3';

export function scrollMatchingTween(transition, destFunction) {
    // A D V A N C E D  T A C T I C S
    // This tween checks the scroll position on each time tick to ensure that the selection ends
    // up in the right place regardless of where we started from or where we scrolled to.
    transition.attrTween('transform', () => {
        let source = Number(transition.selection().attr('transform').split(',')[1].slice(1, -1));

        return (t) => {
            let dest = destFunction();
            let inter = d3.interpolate(source, dest);
            return `translate(-1, ${inter(t)})`;
        };
    });
};
