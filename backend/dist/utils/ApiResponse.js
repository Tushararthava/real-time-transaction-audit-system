'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class ApiResponse {
    statusCode;
    success;
    message;
    data;
    constructor(statusCode, message, data) {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        if (data !== undefined) {
            this.data = data;
        }
    }
    static success(message, data) {
        return new ApiResponse(200, message, data);
    }
    static created(message, data) {
        return new ApiResponse(201, message, data);
    }
    static noContent(message = 'No content') {
        return new ApiResponse(204, message);
    }
}
exports.default = ApiResponse;
//# sourceMappingURL=ApiResponse.js.map