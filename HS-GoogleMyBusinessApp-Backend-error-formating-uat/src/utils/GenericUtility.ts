/**
 * Generic Utility Functions
 */

/**
 * Decode a base-64 string into string
 *
 * Uses Buffer to emulate the exact functionality of the browser’s atob.
 *
 * @param {string} str
 */
export function atob(str: string): string {
    return Buffer.from(str, 'base64').toString('binary');
}

/**
 * Encode a string in base-64
 *
 * A port of the browser’s btoa function.
 * Uses Buffer to emulate the exact functionality of the browser’s btoa
 * (except that it supports some unicode that the browser may not).
 *
 * @param {string} str
 */
export function btoa(str: string|Buffer): string {
    let buffer;

    if (str instanceof Buffer) {
        buffer = str;
    } else {
        buffer = Buffer.from(str.toString(), 'binary');
    }

    return buffer.toString('base64');
}
