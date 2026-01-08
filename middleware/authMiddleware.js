const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
  try {
    // Log the incoming request headers for debugging
    console.log("📥 Request Headers:", req.headers);

    // Extract token from Authorization header
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      console.log("❌ No Authorization header provided");
      return res
        .status(401)
        .json({ error: "No token provided, access denied" });
    }

    // Ensure token follows "Bearer " format
    if (!authHeader.startsWith("Bearer ")) {
      console.log("❌ Authorization header does not start with 'Bearer '");
      return res
        .status(401)
        .json({ error: "Invalid token format, access denied" });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.log("❌ Token is empty after removing 'Bearer ' prefix");
      return res
        .status(401)
        .json({ error: "No token provided, access denied" });
    }

    console.log("🔑 Token:", token);

    // Verify token with JWT_SECRET
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    );
    console.log("🟢 Decoded Token:", decoded);

    // Check for id in decoded token
    if (!decoded.id) {
      console.log("❌ Decoded token is missing 'id' field");
      return res.status(401).json({ error: "Invalid token, missing admin ID" });
    }

    // Check for admin role
    if (decoded.role !== "admin") {
      console.log("❌ User does not have admin role:", decoded.role);
      return res
        .status(403)
        .json({ error: "Access denied, admin role required" });
    }

    // Attach admin details to request
    req.admin = { id: decoded.id, role: decoded.role };
    console.log("✅ req.admin set:", req.admin);

    next();
  } catch (error) {
    console.error("❌ Error in authMiddleware:", error.message);
    res
      .status(401)
      .json({ error: "Invalid or expired token", details: error.message });
  }
};
