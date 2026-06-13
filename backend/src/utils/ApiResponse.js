export class ApiResponse {
  static success(res, data, message = "Success", statusCode = 200, meta = null) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static created(res, data, message = "Created") {
    return this.success(res, data, message, 201);
  }
}
