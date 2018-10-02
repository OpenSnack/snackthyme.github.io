import {csv} from 'd3';

export class Model {
    constructor() {
        this._observers = [];
        this.data = [];
        this._sliderValue = 0;
    }

    load(filename, callback) {
        csv(filename, csv.csvParseRows).then((data) => {
            this.data = data;
            callback(this);
        });
    }

    addObserver(view) {
        this._observers.push(view);
    }

    notify(params) {
        this._observers.forEach((obs) => {obs.update(params || {});});
    }

    setSliderValue(value) {
        this._sliderValue = value;
        this.notify({trigger: 'sliderMoved', immediately: false});
    }

    setSliderValueImmediately(value) {
        this._sliderValue = value;
        this.notify({trigger: 'sliderMoved', immediately: true});
    }

    currentData() {
        return this.data.map((rowDict) => {
            let rating = this.currentRating(rowDict);
            return Object.assign(rowDict, {currentRating: rating});
        });
    }

    currentRating(d) {
        let rating = Number(d.Rating);
        let ratio = Number(d.Ratio);
        return rating + this._sliderValue * rating * ratio;
    }
}
