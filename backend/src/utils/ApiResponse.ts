'use strict';

class ApiResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data?: any;

    constructor(statusCode: number, message: string, data?: any) {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        if (data !== undefined) {
            this.data = data;
        }
    }

    static success(message: string, data?: any) {
        return new ApiResponse(200, message, data);
    }

    static created(message: string, data?: any) {
        return new ApiResponse(201, message, data);
    }

    static noContent(message = 'No content') {
        return new ApiResponse(204, message);
    }
}

export default ApiResponse;
