import {csv, json} from 'd3';

export class Model {
    constructor() {
        this._observers = [];
        this.data = [];
        this._sliderValue = 0;
        this._selectedIndex = 0;
    }

    loadData(csvFile, jsonFile) {
        return csv(csvFile, csv.csvParseRows).then((data) => {
            this.data = data;
            return this.loadGeoJson(jsonFile);
        });
    }

    loadGeoJson(filename) {
        return json(filename).then((json) => {
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

    getSingleFeature(featureI, polygonI) {
        let feature = this.json.features[featureI];
        if (feature.geometry.type === 'Polygon') {
            return feature;
        }
        return {
            geometry: {
                coordinates: feature.geometry.coordinates[polygonI],
                type: 'Polygon'
            },
            id: feature.id,
            properties: feature.properties,
            type: feature.type
        };
    }

    getCoordsByIndex(i) {
        const geometry = this.json.features[i].geometry;
        if (geometry.type === 'Polygon') {
            return geometry.coordinates;
        }
        return geometry.coordinates.map((c) => c[0]);
    }

    setSliderValue(value) {
        this._sliderValue = value;
        this.notify({trigger: 'sliderMoved', immediately: false});
    }

    setSliderValueImmediately(value) {
        this._sliderValue = value;
        this.notify({trigger: 'sliderMoved', immediately: true});
    }

    setSelected(index) {
        this._selectedIndex = index;
        this.notify({trigger: 'barSelected'});
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

    selectedDatum() {
        return Object.assign(this.currentData()[this._selectedIndex], {index: this._selectedIndex});
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

            rowDict.percents = shuffle(distribution);
        });
    }
}
