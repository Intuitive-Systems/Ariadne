"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numTokens = void 0;
const tiktoken_1 = require("tiktoken");
const trace_1 = require("../trace");
async function _numTokens(text, model) {
    const enc = (0, tiktoken_1.encoding_for_model)(model);
    const encoding = enc.encode(text);
    return encoding.length;
}
exports.numTokens = (0, trace_1.traceFunction)(_numTokens);
