// TTL Async Iterator
export function ttlAsyncIterator(pubsub, event, ttlMs = 1 * 60 * 1000) {
    const iterator = pubsub.asyncIterableIterator(event);

    const timeout = setTimeout(() => {
        if (iterator.return) {
            iterator.return();
            console.log(` TTL expired: unsubscribed from ${event}`);
        }
    }, ttlMs);

    const originalReturn = iterator.return?.bind(iterator);
    iterator.return = () => {
        clearTimeout(timeout);
        return originalReturn
            ? originalReturn()
            : Promise.resolve({ value: undefined, done: true });
    };

    return iterator;
}
