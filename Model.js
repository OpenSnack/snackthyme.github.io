import {csv, json} from 'd3';

export class Model {
    constructor() {
        this._observers = [];
        this.data = [];
        this._sliderValue = 0;
    }

    loadData(csvFile, jsonFile, callback) {
        csv(csvFile, csv.csvParseRows).then((data) => {
            this.data = data;
            this.loadGeoJson(jsonFile);
            callback(this);
        });
    }

    loadGeoJson(filename) {
        json(filename).then((json) => {
            this.json = json;
            this.setRandomMapData();
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

    setRandomMapData() {
        function shuffle(array) {
            var m = array.length, t, i; // eslint-disable-line
            while (m) {
                i = Math.floor(Math.random() * m--);
                t = array[m];
                array[m] = array[i];
                array[i] = t;
            }

            return array;
        }

        let min = 0;
        let max = 0.1;

        this.data.forEach((rowDict) => {
            let total = 1;
            let distribution = Array.from(
                {length: this.json.features.length},
                () => {
                    let res = Math.min(total, Math.random() * (max - min) + min);
                    total -= res;
                    return res;
                }
            );

            rowDict._percents = shuffle(distribution);
        });

        return json;
    }
}
