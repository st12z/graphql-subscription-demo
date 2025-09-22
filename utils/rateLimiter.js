import LRU from "lru-cache";

// mỗi user tối đa 5 connect trong 1 phút
const connectionAttempts = new LRU({ max: 1000, ttl: 60 * 1000 });

export function checkThrottle(userId) {
    const attempts = connectionAttempts.get(userId) || 0;
    if (attempts >= 5) {
        throw new Error("Too many subscription attempts, slow down!");
    }
    connectionAttempts.set(userId, attempts + 1);
}
