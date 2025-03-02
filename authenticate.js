import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
    const token = req.cookies.access_token;
    // console.log(token);
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        // const decoded = jwt.verify(token, SECRET_KEY);
        req.token = token; // Contains username, loginTime, and role
        next();
    } catch (error) {
        // return res.status(403).json({ message: "Invalid token" });
        console.log(error);
    }
};

export default authenticate;