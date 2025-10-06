import mongoose from "mongoose";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

async function deleteUsers() {
  try {
    // 1. Kết nối tới MongoDB thủ công (script riêng)
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Đã kết nối tới MongoDB từ script");

    // 2. Xóa tất cả user có username bắt đầu bằng "user_"
    const result = await User.deleteMany({ username: /^user_/ });
    console.log(`🗑️ Đã xóa ${result.deletedCount} users`);

  } catch (error) {
    console.error("❌ Lỗi khi xóa users:", error);
  } finally {
    // 3. Đóng kết nối sau khi xóa xong
    await mongoose.connection.close();
    console.log("🔌 Đã đóng kết nối MongoDB");
  }
}

deleteUsers();
