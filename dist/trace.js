"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceFunction = exports.traceClassMethod = void 0;
// traceUtils.ts
const api_1 = require("@opentelemetry/api");
function traceClassMethod(target, methodName) {
    const originalMethod = target[methodName];
    target[methodName] = function (...args) {
        const spanName = `${target.constructor.name}.${methodName}`;
        const span = api_1.trace.getTracer('base-class-tracer').startSpan(spanName);
        const spanContext = api_1.trace.setSpan(api_1.context.active(), span);
        span.setAttribute('args', JSON.stringify(args)); // Include input args
        console.log(`[DEBUG] Started span: ${spanName}`); // Debugging
        try {
            // Use `context.with()` to properly attach the span
            const result = api_1.context.with(spanContext, () => originalMethod.apply(this, args));
            span.setAttribute('returnValue', JSON.stringify(result)); // Include return value
            span.end();
            console.log(`[DEBUG] Ended span: ${spanName}`); // Debugging
            return result;
        }
        catch (err) {
            span.setAttribute('error', err.message); // Include error message
            span.recordException(err);
            span.end();
            throw err;
        }
    };
}
exports.traceClassMethod = traceClassMethod;
function traceFunction(func) {
    const tracedFunction = async function (...args) {
        const spanName = `${func.name}`;
        const span = api_1.trace.getTracer('function-tracer').startSpan(spanName);
        const spanContext = api_1.trace.setSpan(api_1.context.active(), span);
        span.setAttribute('args', JSON.stringify(args));
        console.log(`[DEBUG] Started span: ${spanName}`);
        try {
            const result = await api_1.context.with(spanContext, async () => {
                if (func.constructor.name === 'AsyncFunction') {
                    return await func.apply(this, args);
                }
                else {
                    return func.apply(this, args);
                }
            });
            span.setAttribute('returnValue', JSON.stringify(result));
            span.end();
            console.log(`[DEBUG] Ended span: ${spanName}`);
            return result;
        }
        catch (err) {
            span.setAttribute('error', err.message);
            span.recordException(err);
            span.end();
            throw err;
        }
    };
    return tracedFunction;
}
exports.traceFunction = traceFunction;
