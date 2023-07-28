// traceUtils.ts
import { context, trace, Span } from '@opentelemetry/api';

export function traceClassMethod(target: any, methodName: string) {
    const originalMethod = target[methodName];

    target[methodName] = function (...args: any[]) {
        const spanName = `${target.constructor.name}.${methodName}`;
        const span: Span = trace.getTracer('base-class-tracer').startSpan(spanName);
        const spanContext = trace.setSpan(context.active(), span);

        span.setAttribute('args', JSON.stringify(args)); // Include input args
        console.log(`[DEBUG] Started span: ${spanName}`); // Debugging

        try {
            // Use `context.with()` to properly attach the span
            const result = context.with(spanContext, () =>
                originalMethod.apply(this, args)
            );

            span.setAttribute('returnValue', JSON.stringify(result)); // Include return value
            span.end();
            console.log(`[DEBUG] Ended span: ${spanName}`); // Debugging

            return result;
        } catch (err: any) {
            span.setAttribute('error', err.message); // Include error message
            span.recordException(err);
            span.end();
            throw err;
        }
    };
}

export function traceFunction<T extends (...args: any) => any>(func: T): T {
    const tracedFunction = async function (...args: Parameters<T>) {
        const spanName = `${func.name}`;
        const span: Span = trace.getTracer('function-tracer').startSpan(spanName);
        const spanContext = trace.setSpan(context.active(), span);

        span.setAttribute('args', JSON.stringify(args));
        console.log(`[DEBUG] Started span: ${spanName}`);

        try {
            const result = await context.with(spanContext, async () => {
                if (func.constructor.name === 'AsyncFunction') {
                    return await (func as any).apply(this, args);
                } else {
                    return (func as any).apply(this, args);
                }
            });

            span.setAttribute('returnValue', JSON.stringify(result));
            span.end();
            console.log(`[DEBUG] Ended span: ${spanName}`);

            return result;
        } catch (err) {
            span.setAttribute('error', err.message);
            span.recordException(err);
            span.end();
            throw err;
        }
    };

    return tracedFunction as unknown as T;
}