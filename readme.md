# Cách cài đặt chạy project

- Clone repo về máy
- cd graphql-demo
- Tải dependency

```
npm init -y
npm install apollo-server-express express@4 graphql graphql-subscriptions graphql-ws ws express-jwt token @graphql-tools/schema mongoose mongodb nodemon dotenv


```

- Tao account mongodb: (https://cloud.mongodb.com/) và get connect string connect database on mongodb cloud then copy link to .env
- Tao file .env: MONGO_URI=mongodb+srv://db_user:db_password@cluster0.nm5xt.mongodb.net/database_name
- Start :

```
npm start
```

- Test:
  - Chọn root -> mutation -> createModel -> Lấy các field -> mutation run
    - ![alt text](image.png)
  - Subsription listening realtime:
    - ![alt text](image-1.png)
- Login: 
  - thêm jwt token, trả về client ID, username, avatar
  - subscription loginUser: bỏ userId lấy từ jwt token
- Logout:
  - bạn bè của người đó sẽ biết người đó logout->tạo subscription lắng nghe chính userId của mình để đợi người đăng xuất trả về danh sách bạn bè rồi kiểm tra mình có phải bạn bè người đó không 
- addFriend: 
  - bỏ userSendID, lấy từ jwt token 
  - subscription: friendRequested cũng phải bỏ userAcceptId lấy từ jwt token
- acceptFriend:
  - bỏ userAcceptId, lấy từ jwt token
  - subscription: friendAccepted cũng phải bỏ userSendId
- thêm db chat, room_chat
- thêm chức năng khi đăng nhập tb cho friend
