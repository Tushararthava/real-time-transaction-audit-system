declare class ApiResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data?: any;
    constructor(statusCode: number, message: string, data?: any);
    static success(message: string, data?: any): ApiResponse;
    static created(message: string, data?: any): ApiResponse;
    static noContent(message?: string): ApiResponse;
}
export default ApiResponse;
//# sourceMappingURL=ApiResponse.d.ts.map