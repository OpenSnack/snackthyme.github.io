import {csv, json} from 'd3';

export class Model {
    constructor() {
        this._observers = [];
        this.data = [];
        this._sliderValue = 0;
        this._selectedIndex = 0;
        this._hovering = null;
        this._maxGrowth = 0;
        this._months = 6;
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
            this.setRandomTimeData();
            this._setMaxGrowth();
        });
    }

    addObserver(view) {
        this._observers.push(view);
    }

    notify(params) {
        this._observers.forEach((obs) => {
            obs.update(params || {});
        });
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

    getFeatureIndexById(id) {
        return this.json.features.findIndex((f) => f.id === id);
    }

    setSliderValue(value) {
        this._sliderValue = value;
        this.notify({trigger: 'sliderMoved', immediately: false});
    }

    setSliderValueImmediately(value) {
        this._sliderValue = value;
        this.notify({trigger: 'sliderMoved', immediately: true});
    }

    sliderEnded() {
        this._setMaxGrowth();
    }

    setSelected(index) {
        this._selectedIndex = index;
        this._setMaxGrowth();
        this.notify({trigger: 'barSelected'});
    }

    setHover(i, origin, wasTouch) {
        this._hovering = this._setTooltipData(i);
        this._origin = origin;
        const trigger = wasTouch ? 'tooltipTouch' : 'tooltipHover';
        this.notify({matches: 'tooltip', trigger: trigger});
    }

    moveHover(origin, wasTouch) {
        const trigger = wasTouch ? 'tooltipMoveTouch' : 'tooltipMoveHover';
        this._origin = origin;
        this.notify({matches: 'tooltip', trigger: trigger});
    }

    endHover() {
        this.notify({matches: 'tooltip', trigger: 'tooltipEnd'});
    }

    _setMaxGrowth() {
        const data = this.currentData()[this._selectedIndex];
        const growths = data.percents.map((percent) => {
            return Math.round((data.currentRating - Number(data.Rating)) * percent);
        });
        this._maxGrowth = Math.max(...growths);
        if (this._maxGrowth <= 0) {
            this._maxGrowth = Math.min(...growths);
        }
    }

    _setTooltipData(i) {
        const feature = this.json.features[i];
        const data = this.currentData()[this._selectedIndex];
        return Object.assign({}, feature, data, {percent: data.percents[i], index: i});
    }

    currentTooltipData() {
        return this._hovering;
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

    maxGrowth() {
        return this._maxGrowth;
    }

    tooltipOrigin() {
        return this._origin;
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

    setRandomTimeData() {
        this.data.forEach((rowDict) => {
            rowDict.timePoints = Array.from(
                {length: this.json.features.length},
                () => [0, ...Array.from(
                    {length: this._months - 1},
                    Math.random
                ).sort(), 1]
            );
        });
    }
}
