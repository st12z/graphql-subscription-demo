// utils/withSubscriptionLimit.js
const subscriptionCount = new Map();
const MAX_SUBSCRIPTIONS = 2;

export function withSubscriptionLimit(subscribeFn) {
  return async (parent, args, context, info) => {
    const userId = context.userId;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Đếm số lượng kết nối hiện tại của user
    const currentCount = subscriptionCount.get(userId) || 0;

    if (currentCount >= MAX_SUBSCRIPTIONS) {
      throw new Error(`User ${userId} đã vượt quá số lượng kết nối cho phép (${MAX_SUBSCRIPTIONS})`);
    }

    // Tăng số lượng khi subscribe
    subscriptionCount.set(userId, currentCount + 1);

    const asyncIterator = await subscribeFn(parent, args, context, info);

    // Khi client hủy kết nối → giảm số lượng
    const origReturn = asyncIterator.return?.bind(asyncIterator);
    asyncIterator.return = () => {
      subscriptionCount.set(userId, (subscriptionCount.get(userId) || 1) - 1);
      return origReturn ? origReturn() : Promise.resolve({ value: undefined, done: true });
    };

    return asyncIterator;
  };
}
