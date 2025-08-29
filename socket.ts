import { Server } from "http";
import moment from "moment";
import db from "./src/models/Middleware/Mongodb";
import utility from "./src/services/utility";
import Auth from "./src/models/Middleware/authentication";
const socketIo = require("socket.io");

export default function initSocket(httpServer: Server) {
    const io = socketIo(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    const userSocketMap = new Map(); // Stores userId -> socketId

    io.on("connection", (socket: any) => {
        console.log("User connected:", socket.id);

        socket.on("register", async (userId: string, tenant: string) => {
            if (userId) {
                userSocketMap.set(userId, socket.id);
                console.log(`User registered: ${userId}`);

                // Send current unread count
                // const unreadCount = await getUnreadCount(userId, tenant);
                // socket.emit("update_unread_count", unreadCount);

                // Emit active users
                io.emit("activeUsers", Array.from(userSocketMap.keys()));
            }
        });
        socket.on('send_message', async ({ senderId, receiverId, message, tenant }: { senderId: string, receiverId: string, message: string, tenant: string }) => {
            const req = { headers: { tenant } };
            await Auth.callBackTenantConnection(req);
            const UserChats = db.TenantDB(tenant).UserChats;

            // Save the message to the database with isRead set to false
            const user_message = new UserChats({
                senderId,
                receiverId,
                message,
                isRead: false,
                messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                msgTime: moment().format("hh:mm"),
                createdAt: new Date().toISOString(),
            });
            await user_message.save();

            // Emit message to the receiver
            const receiverSocketId = userSocketMap.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_message", {
                    message,
                    senderId,
                    receiverId,
                });
            }
            // Broadcast to all other connected users to refresh the user list
            socket.broadcast.emit('update_user_list');
        });

        socket.on("read_messages", async ({ userId, senderId, tenant }: { userId: string, senderId: string, tenant: string }) => {
            const req = { headers: { tenant } };
            await Auth.callBackTenantConnection(req);
            const UserChats = db.TenantDB(tenant).UserChats;

            // Mark all messages as read
            await UserChats.updateMany({ receiverId: userId, senderId, isRead: false }, { $set: { isRead: true } });

            // Emit updated unread counts
            const unreadCountUser = await getUnreadCount(userId, tenant);
            const unreadCountSender = await getUnreadCount(senderId, tenant);
            io.to(userSocketMap.get(userId)).emit("update_unread_count", unreadCountUser);
            io.to(userSocketMap.get(senderId)).emit("update_unread_count", unreadCountSender);
            // Broadcast to all other connected users to refresh the user list
            socket.broadcast.emit('update_user_list');
        });

        socket.on("get_unread_count", async ({ userId, tenant }: { userId: string, tenant: string }) => {
            const unreadCount = await getUnreadCount(userId, tenant);
            socket.emit("update_unread_count", unreadCount);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            userSocketMap.forEach((value, key) => {
                if (value === socket.id) {
                    userSocketMap.delete(key);
                }
            });
            io.emit("activeUsers", Array.from(userSocketMap.keys()));
        });
    });

    const getUnreadCount: any = async (userId: any, tenant: any) => {
        const req = { headers: { tenant } };
        await Auth.callBackTenantConnection(req);
        const UserChats = db.TenantDB(tenant).UserChats;
        return await UserChats.countDocuments({ receiverId: userId, isRead: false });
    };
}
