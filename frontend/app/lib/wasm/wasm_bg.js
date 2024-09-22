let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}

/**
* @param {number} x
* @param {number} y
* @returns {number}
*/
export function sum(x, y) {
    const ret = wasm.sum(x, y);
    return ret;
}

