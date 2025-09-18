# Cách cài đặt chạy project

- Clone repo về máy
- cd graphql-demo
- Tải dependency
  hello

```
npm init -y
npm install apollo-server-express express@4 graphql graphql-subscriptions graphql-ws ws @graphql-tools/schema mongoose mongodb nodemon dotenv


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
- Login: thêm session, trả về client ID, username, avatar
- addFriend: bỏ userSendID, lấy từ session
- thêm db chat, room_chat
- thêm chức năng khi đăng nhập tb cho friend