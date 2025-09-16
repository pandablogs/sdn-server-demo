const jwt = require('jsonwebtoken');

export const verifyToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer token"

    if (!token) {
        return res.status(401).json({ msg: "Access denied. No token provided." });
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "yourSecretKey");
        req.user = decoded; // attach decoded user info to request
        next();
    } catch (err) {
        return res.status(403).json({ msg: "Invalid or expired token" });
    }
};
