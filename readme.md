# Cách cài đặt chạy project
- Clone repo về máy
- cd graphql-demo
- Tải dependency
```
npm init -y
npm install apollo-server-express express@4 graphql graphql-subscriptions graphql-ws ws @graphql-tools/schema

```
- Start : 
```
npm start
```
- Test:
  -   Chọn root -> mutation -> createModel -> Lấy các field -> mutation run
      -   ![alt text](image.png)
  -   Subsription listening realtime: 
      -   ![alt text](image-1.png)