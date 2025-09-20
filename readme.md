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
- userId cần truyền vào context trong tham số để lấy userId như phần **loginUser ở **Mutation và **loginUser ở Subscription
# Todo List

## **Trường**
- [x] userId cần truyền vào context trong tham số để lấy userId như phần **loginUser** ở Mutation và Subscription
- [x] **Login**
  - [x] thêm JWT token, trả về client ID, username, avatar
  - [x] Subscription `loginUser`: bỏ userId, lấy từ JWT token
- [x] **Logout**
  - [x] Bạn bè của người đó sẽ biết người đó logout
  - [ ] Tạo subscription lắng nghe chính userId (lấy từ token) để đợi thông tin người đăng xuất, trả về danh sách bạn bè rồi kiểm tra mình có phải bạn bè người đó không
- [x] **addFriend**
  - [x] Bỏ userSendID, lấy từ JWT token
  - [x] Subscription `friendRequested`: bỏ userAcceptId, lấy từ JWT token

---

## **Khánh**
- [x] **acceptFriend**
  - [x] Bỏ userAcceptId, lấy từ JWT token
  - [x] Khi chấp nhận thành công tạo phòng chat cho 2 người (theo model trong `chat.model.js`)
  - [x] Subscription `friendAccepted`: bỏ userSendId
- [x] Thêm DB `chat`, `room_chat`
- [x] Thêm chức năng khi đăng nhập thì thông báo cho bạn bè
---
- [ ] **Chat**
  - [ ] Chức năng chat


