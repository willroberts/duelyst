"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Color_1 = require("./Color");
class Grid {
    constructor(rows, cols, initialValue = Color_1.Color.Black) {
        this.isExtended = false;
        this.rows = rows;
        this.cols = cols;
        this.initialValue = initialValue;
        this.grid = [];
    }
    clone() {
        const copygrid = new Grid(this.rows, this.cols, this.initialValue);
        for (const inner of this.grid) {
            const rowarray = new Array();
            for (const color of inner) {
                rowarray.push(new Color_1.Color(color.r, color.g, color.b));
            }
            copygrid.grid.push(rowarray);
        }
        return copygrid;
    }
    setPosition(r, c, value) {
        if (r === undefined || this.rows <= r || r < 0) {
            throw Error("Index out of range [row]");
        }
        if (c === undefined || this.cols <= c || c < 0) {
            throw Error("Index out of range [col]");
        }
        if (this.grid[r] === undefined) {
            this.grid[r] = [];
        }
        this.grid[r][c] = value;
    }
    setRow(r, value) {
        if (r === undefined || this.rows <= r || r < 0) {
            throw Error("Index out of range [row] " + this.rows + " - " + r);
        }
        if (this.grid[r] === undefined) {
            this.grid[r] = [];
        }
        for (let c = 0; c < this.cols; c++) {
            this.grid[r][c] = value;
        }
    }
    setCol(c, value) {
        if (c === undefined || this.cols <= c || c < 0) {
            throw Error("Index out of range [col]");
        }
        for (let r = 0; r < this.rows; r++) {
            if (this.grid[r] === undefined) {
                this.grid[r] = [];
            }
            this.grid[r][c] = value;
        }
    }
    set(value) {
        for (let r = 0; r < this.rows; r++) {
            if (this.grid[r] === undefined) {
                this.grid[r] = [];
            }
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = value;
            }
        }
    }
    getPosition(r, c) {
        if (this.grid[r] !== undefined && this.grid[r][c] !== undefined) {
            return this.grid[r][c];
        }
        return null;
    }
    toJSON() {
        if (!this.isExtended) {
            this.isExtended = true;
            for (let r = 0; r < this.rows; r++) {
                if (this.grid[r] === undefined) {
                    this.grid[r] = [];
                }
                for (let c = 0; c < this.cols; c++) {
                    if (this.grid[r][c] === undefined) {
                        this.grid[r][c] = this.initialValue;
                    }
                }
            }
        }
        return this.grid;
    }
}
exports.default = Grid;
//# sourceMappingURL=Grid.js.map