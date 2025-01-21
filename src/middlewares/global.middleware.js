import { ApiError } from "../utils/apiError.js"; // Import custom error class

// Global error handler middleware
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      success: err.success,
      errors: err.errors,
      data: err.data,
      stack: err.stack,
    });
  }

  // For generic errors
  return res.status(500).json({
    message: "Internal Server Error",
    success: false,
  });
});
